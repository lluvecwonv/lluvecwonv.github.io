---
title: "LangGraph 튜토리얼 가이드: Stateful AI Agent를 그래프로 구축하기"
date: 2026-04-02
summary: "LangGraph의 핵심 개념(StateGraph, Node, Edge)부터 실전 Agent 구축까지, 코드 예제와 함께 단계별로 살펴봅니다."
tags: [LangGraph, LangChain, AI Agent, StateGraph, Python, Tutorial]
category: AI/개발
language: ko
---

## LangGraph란?

LangGraph는 LangChain 팀이 만든 **저수준(low-level) 오케스트레이션 프레임워크**로, 장시간 실행되는 stateful agent와 workflow를 구축하기 위한 런타임입니다. Klarna, Uber, J.P. Morgan 등의 기업에서 프로덕션에 사용하고 있으며, 프롬프트 엔지니어링이나 아키텍처를 추상화하지 않고 개발자가 직접 제어할 수 있도록 설계되었습니다.

LangGraph의 핵심 철학은 **agent 워크플로를 그래프(graph)로 모델링**하는 것입니다. 복잡한 AI 시스템을 개별 단계(node)로 분해하고, 이들을 공유 상태(state)를 통해 연결하며, 전환 조건(edge)으로 흐름을 제어합니다.

### LangGraph의 5가지 핵심 이점

1. **Durable Execution**: Agent가 실패해도 checkpoint에서 재개 가능
2. **Human-in-the-Loop**: 워크플로 어느 단계에서든 사람이 개입하여 상태를 확인하고 수정 가능
3. **Memory Management**: 단기 작업 메모리와 장기 세션 간 메모리 모두 지원
4. **Observability**: LangSmith와 통합하여 트레이싱, 시각화, 디버깅 가능
5. **Production Deployment**: Stateful, 장시간 실행 워크플로를 위한 인프라 제공

---

## 설치

```bash
pip install -U langgraph
# 또는
uv add langgraph
```

---

## 핵심 개념: State, Node, Edge

LangGraph의 그래프는 세 가지 핵심 요소로 구성됩니다.

### 1. State (상태)

State는 애플리케이션의 현재 스냅샷을 나타내는 **공유 데이터 구조**입니다. 모든 node와 edge의 입출력 스키마 역할을 합니다.

```python
from typing_extensions import TypedDict, Annotated
from langchain.messages import AnyMessage
import operator

class MessagesState(TypedDict):
    messages: Annotated[list[AnyMessage], operator.add]
    llm_calls: int
```

여기서 `Annotated[list[AnyMessage], operator.add]`는 **reducer**를 지정하는 것입니다. 기본적으로 state 업데이트는 이전 값을 덮어쓰지만, `operator.add` reducer를 사용하면 리스트에 새 메시지를 **추가(append)** 합니다.

State 설계 시 핵심 원칙은 **raw data를 저장하고, 포맷된 텍스트는 저장하지 않는 것**입니다. 프롬프트 포맷팅은 각 node 내부에서 수행해야 합니다. 이렇게 하면 서로 다른 node가 같은 데이터를 다른 형태로 사용할 수 있고, 디버깅도 수월해집니다.

#### State 정의 방법 3가지

| 방법 | 특징 | 예시 |
|------|------|------|
| **TypedDict** | 가장 기본적인 방법 | `class State(TypedDict): ...` |
| **Dataclass** | 기본값 제공 가능 | `@dataclass class State: ...` |
| **Pydantic BaseModel** | 재귀적 유효성 검증 (성능 ↓) | `class State(BaseModel): ...` |

#### MessagesState 편의 클래스

대부분의 LLM 인터페이스는 메시지 리스트를 사용합니다. LangGraph는 `add_messages` reducer가 포함된 `MessagesState`를 기본 제공합니다:

```python
from langgraph.graph.message import add_messages

class GraphState(TypedDict):
    messages: Annotated[list[AnyMessage], add_messages]
```

`add_messages`는 단순히 메시지를 추가할 뿐 아니라, ID 기반으로 기존 메시지를 업데이트하는 기능도 제공합니다.

### 2. Node (노드)

Node는 실제 작업을 수행하는 **Python 함수**입니다. 현재 state를 받아서, 업데이트된 state를 반환합니다.

```python
def llm_call(state: dict):
    return {
        "messages": [
            model_with_tools.invoke(
                [SystemMessage(content="You are a helpful assistant.")]
                + state["messages"]
            )
        ],
        "llm_calls": state.get('llm_calls', 0) + 1
    }
```

Node는 세 가지 인자를 받을 수 있습니다:

1. **state** (필수): 현재 그래프 상태
2. **config** (선택): thread_id, 트레이싱 정보 등의 RunnableConfig
3. **runtime** (선택): context와 store에 접근할 수 있는 Runtime 객체

#### Node의 4가지 유형

| 유형 | 역할 | 예시 |
|------|------|------|
| **LLM steps** | 이해, 분석, 생성, 추론 | 텍스트 분류, 응답 생성 |
| **Data steps** | 외부 정보 조회 | DB 조회, API 호출 |
| **Action steps** | 외부 작업 실행 | 이메일 전송, 티켓 생성 |
| **User input steps** | 사람의 개입 | 승인 요청, 정보 확인 |

#### 특수 Node

- **START**: 사용자 입력의 진입점
- **END**: 워크플로 완료 지점

```python
from langgraph.graph import START, END

graph.add_edge(START, "node_a")
graph.add_edge("node_a", END)
```

### 3. Edge (엣지)

Edge는 다음에 어떤 node를 실행할지 결정하는 전환 규칙입니다.

#### Normal Edge (일반 엣지)

```python
graph.add_edge("node_a", "node_b")  # node_a → node_b 고정 전환
```

#### Conditional Edge (조건부 엣지)

State에 따라 다음 node를 동적으로 결정합니다:

```python
from typing import Literal
from langgraph.graph import END

def should_continue(state: MessagesState) -> Literal["tool_node", END]:
    last_message = state["messages"][-1]
    return "tool_node" if last_message.tool_calls else END

graph.add_conditional_edges("llm_call", should_continue, ["tool_node", END])
```

#### Send를 이용한 동적 라우팅

조건부 엣지에서 `Send` 객체를 반환하여 동적으로 병렬 노드를 생성할 수 있습니다:

```python
from langgraph.types import Send

def continue_to_jokes(state: OverallState):
    return [Send("generate_joke", {"subject": s})
            for s in state['subjects']]

graph.add_conditional_edges("node_a", continue_to_jokes)
```

---

## 실전 튜토리얼: Calculator Agent 구축

이제 핵심 개념을 활용하여 실제 Calculator Agent를 단계별로 구축해보겠습니다.

### Step 1: 도구(Tools)와 모델 정의

```python
from langchain.tools import tool
from langchain.chat_models import init_chat_model

model = init_chat_model("claude-sonnet-4-6", temperature=0)

@tool
def multiply(a: int, b: int) -> int:
    """Multiply a and b."""
    return a * b

@tool
def add(a: int, b: int) -> int:
    """Adds a and b."""
    return a + b

@tool
def divide(a: int, b: int) -> float:
    """Divide a by b."""
    return a / b

tools = [add, multiply, divide]
tools_by_name = {tool.name: tool for tool in tools}
model_with_tools = model.bind_tools(tools)
```

`@tool` 데코레이터로 함수를 LangChain tool로 변환하고, `bind_tools()`로 모델에 도구를 바인딩합니다.

### Step 2: State 정의

```python
from typing_extensions import TypedDict, Annotated
from langchain.messages import AnyMessage
import operator

class MessagesState(TypedDict):
    messages: Annotated[list[AnyMessage], operator.add]
    llm_calls: int
```

`operator.add` reducer를 사용하여 메시지가 덮어쓰기되지 않고 누적되도록 합니다.

### Step 3: LLM Node 정의

```python
from langchain.messages import SystemMessage

def llm_call(state: dict):
    return {
        "messages": [
            model_with_tools.invoke(
                [SystemMessage(content="You are a helpful assistant tasked with performing arithmetic.")]
                + state["messages"]
            )
        ],
        "llm_calls": state.get('llm_calls', 0) + 1
    }
```

LLM이 현재 대화 상태를 보고, 도구를 호출할지 직접 응답할지 결정합니다.

### Step 4: Tool Node 정의

```python
from langchain.messages import ToolMessage

def tool_node(state: dict):
    result = []
    for tool_call in state["messages"][-1].tool_calls:
        tool = tools_by_name[tool_call["name"]]
        observation = tool.invoke(tool_call["args"])
        result.append(
            ToolMessage(content=str(observation), tool_call_id=tool_call["id"])
        )
    return {"messages": result}
```

LLM의 tool_call 요청을 받아 실제 함수를 실행하고, 결과를 `ToolMessage`로 반환합니다.

### Step 5: 라우팅 로직 정의

```python
from typing import Literal
from langgraph.graph import END

def should_continue(state: MessagesState) -> Literal["tool_node", END]:
    last_message = state["messages"][-1]
    return "tool_node" if last_message.tool_calls else END
```

마지막 메시지에 tool_call이 있으면 tool_node로 라우팅하고, 없으면 종료합니다.

### Step 6: 그래프 빌드 및 컴파일

```python
from langgraph.graph import StateGraph, START

agent_builder = StateGraph(MessagesState)

# Node 추가
agent_builder.add_node("llm_call", llm_call)
agent_builder.add_node("tool_node", tool_node)

# Edge 추가
agent_builder.add_edge(START, "llm_call")
agent_builder.add_conditional_edges("llm_call", should_continue, ["tool_node", END])
agent_builder.add_edge("tool_node", "llm_call")

# 컴파일
agent = agent_builder.compile()
```

이 그래프의 실행 흐름은 다음과 같습니다:

```
START → llm_call → (tool_calls 있음?) → tool_node → llm_call → ... → END
                   (tool_calls 없음?) → END
```

### Step 7: 실행

```python
from langchain.messages import HumanMessage

messages = [HumanMessage(content="Add 3 and 4.")]
result = agent.invoke({"messages": messages})

for m in result["messages"]:
    m.pretty_print()
```

실행 결과:
```
================================ Human Message =================================
Add 3 and 4.
================================== AI Message ==================================
[tool call: add(a=3, b=4)]
================================= Tool Message =================================
7
================================== AI Message ==================================
The sum of 3 and 4 is 7.
```

---

## Workflow vs Agent 패턴

LangGraph에서는 **Workflow**와 **Agent** 두 가지 패턴을 구분합니다.

### Workflow 패턴

Workflow는 **사전에 정해진 코드 경로**를 따라 실행됩니다. 주요 패턴은 다음과 같습니다:

| 패턴 | 설명 | 사용 사례 |
|------|------|-----------|
| **Prompt Chaining** | 순차적 LLM 호출, 이전 출력이 다음 입력 | 문서 번역 후 검증 |
| **Parallelization** | 여러 LLM 호출을 병렬 실행 | 키워드 추출 + 포맷 검사 동시 수행 |
| **Routing** | 입력을 분류 후 적절한 워크플로로 분배 | 고객 문의 → 가격/환불/반품 분기 |
| **Orchestrator-Worker** | 작업을 분할하여 worker에게 위임 후 결과 합성 | 멀티 파일 코드 생성 |
| **Evaluator-Optimizer** | 한 LLM이 생성, 다른 LLM이 평가하는 반복 루프 | 번역 품질 개선 |

### Agent 패턴

Agent는 **동적으로** 자신의 프로세스와 도구 사용을 결정합니다. ReAct(Reasoning + Acting) 패턴이 핵심입니다:

1. LLM이 현재 상태와 사용 가능한 도구를 평가
2. 도구를 호출할지 직접 응답할지 결정
3. 도구를 실행하고 결과를 메시지에 추가
4. 작업이 완료될 때까지 반복

---

## Functional API: 또 다른 접근법

Graph API 외에도 **Functional API**를 사용하면 Python의 일반적인 제어 흐름(while 루프, if 문)으로 agent를 구축할 수 있습니다:

```python
from langgraph.func import entrypoint, task
from langchain.messages import SystemMessage, HumanMessage
from langchain_core.messages import BaseMessage
from langgraph.graph import add_messages

@task
def call_llm(messages: list[BaseMessage]):
    return model_with_tools.invoke(
        [SystemMessage(content="You are a helpful assistant.")]
        + messages
    )

@task
def call_tool(tool_call):
    tool = tools_by_name[tool_call["name"]]
    return tool.invoke(tool_call)

@entrypoint()
def agent(messages: list[BaseMessage]):
    model_response = call_llm(messages).result()

    while True:
        if not model_response.tool_calls:
            break

        tool_result_futures = [
            call_tool(tool_call) for tool_call in model_response.tool_calls
        ]
        tool_results = [fut.result() for fut in tool_result_futures]
        messages = add_messages(messages, [model_response, *tool_results])
        model_response = call_llm(messages).result()

    messages = add_messages(messages, model_response)
    return messages
```

`@task`와 `@entrypoint` 데코레이터를 사용하며, 명시적인 node/edge 대신 일반 Python 제어 흐름을 사용합니다. 이 방식은 그래프 구조가 단순한 경우에 더 직관적일 수 있습니다.

---

## 고급 기능

### Command 프리미티브

`Command` 객체를 사용하면 state 업데이트와 라우팅을 동시에 수행할 수 있습니다:

```python
from langgraph.types import Command

def my_node(state: State) -> Command[Literal["my_other_node"]]:
    return Command(
        update={"foo": "bar"},
        goto="my_other_node"
    )
```

### Human-in-the-Loop (interrupt)

`interrupt()` 함수를 사용하여 agent 실행을 일시 중지하고, 사람의 입력을 기다린 후 재개할 수 있습니다. Checkpointer가 상태를 보존하므로, 무기한 대기 후에도 정확히 중단된 지점에서 재개됩니다.

### Node Caching

비용이 높은 node의 결과를 캐싱할 수 있습니다:

```python
from langgraph.cache import CachePolicy, InMemoryCache

builder.add_node(
    "expensive_node",
    expensive_node,
    cache_policy=CachePolicy(ttl=3)
)
graph = builder.compile(cache=InMemoryCache())
```

### Recursion Limit

기본 재귀 한도는 1000 super-step이며, 런타임에 조정 가능합니다:

```python
graph.invoke(inputs, config={"recursion_limit": 5})
```

`RemainingSteps`를 사용하면 한도 도달 전에 graceful하게 종료할 수 있습니다.

---

## 에러 처리 전략

LangGraph에서는 에러를 워크플로 설계의 일부로 다룹니다:

| 에러 유형 | 처리 주체 | 전략 |
|-----------|-----------|------|
| **일시적 에러** (네트워크, rate limit) | 시스템 | 지수 백오프로 자동 재시도 |
| **LLM 복구 가능 에러** (도구 실패) | LLM | state에 에러 저장, LLM에게 재시도 요청 |
| **사용자 해결 가능 에러** (정보 부족) | 사람 | `interrupt()`로 일시 중지 후 입력 요청 |
| **예상치 못한 에러** | 개발자 | 디버깅을 위해 상위로 전파 |

---

## 정리

LangGraph는 AI agent를 구축할 때 **명시적 제어, 상태 관리, 내구성**을 핵심으로 제공하는 프레임워크입니다. 핵심 요약:

- **State**: 공유 데이터 구조로 node 간 통신, reducer로 업데이트 방식 제어
- **Node**: 실제 로직을 수행하는 Python 함수
- **Edge**: 조건부/고정 전환으로 워크플로 흐름 제어
- **Graph API vs Functional API**: 명시적 그래프 구조 vs Python 제어 흐름
- **Durable Execution**: Checkpoint 기반 장애 복구 및 human-in-the-loop 지원

복잡한 AI 시스템을 프로덕션 수준으로 구축해야 한다면, LangGraph는 꼭 살펴볼 가치가 있는 프레임워크입니다.

---

**참고 자료:**
- [LangGraph 공식 문서](https://docs.langchain.com/oss/python/langgraph/overview)
- [LangGraph Quickstart](https://docs.langchain.com/oss/python/langgraph/quickstart)
- [LangGraph GitHub](https://github.com/langchain-ai/langgraph)
