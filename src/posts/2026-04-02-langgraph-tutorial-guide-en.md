---
title: "LangGraph Tutorial Guide: Building Stateful AI Agents with Graphs"
date: 2026-04-02
summary: "A step-by-step tutorial covering LangGraph's core concepts (StateGraph, Node, Edge) through building a practical Agent with code examples."
tags: [LangGraph, LangChain, AI Agent, StateGraph, Python, Tutorial]
category: AI/개발
language: en
---

## What is LangGraph?

LangGraph is a **low-level orchestration framework** and runtime built by the LangChain team for constructing long-running, stateful agents and workflows. Used in production by companies like Klarna, Uber, and J.P. Morgan, it gives developers direct control without abstracting away prompts or architecture.

The core philosophy of LangGraph is **modeling agent workflows as graphs**. You decompose complex AI systems into discrete steps (nodes), connect them through shared state, and control flow with transition rules (edges).

### 5 Key Benefits of LangGraph

1. **Durable Execution**: Agents persist through failures and resume from checkpoints
2. **Human-in-the-Loop**: Inspect and modify state at any workflow stage
3. **Memory Management**: Both short-term working memory and long-term cross-session persistence
4. **Observability**: Integration with LangSmith for tracing, visualization, and debugging
5. **Production Deployment**: Infrastructure designed for stateful, long-running workflows

---

## Installation

```bash
pip install -U langgraph
# or
uv add langgraph
```

---

## Core Concepts: State, Node, Edge

A LangGraph graph is built from three fundamental components.

### 1. State

State is a **shared data structure** representing the current snapshot of your application. It serves as the input/output schema for all nodes and edges.

```python
from typing_extensions import TypedDict, Annotated
from langchain.messages import AnyMessage
import operator

class MessagesState(TypedDict):
    messages: Annotated[list[AnyMessage], operator.add]
    llm_calls: int
```

The `Annotated[list[AnyMessage], operator.add]` syntax specifies a **reducer**. By default, state updates overwrite previous values, but the `operator.add` reducer **appends** new messages to the list instead.

A key design principle for state is to **store raw data, not formatted text**. Prompt formatting should happen inside nodes. This allows different nodes to format identical data differently and makes debugging easier.

#### Three Ways to Define State

| Method | Characteristics | Example |
|--------|----------------|---------|
| **TypedDict** | Most basic approach | `class State(TypedDict): ...` |
| **Dataclass** | Can provide default values | `@dataclass class State: ...` |
| **Pydantic BaseModel** | Recursive validation (lower performance) | `class State(BaseModel): ...` |

#### MessagesState Convenience Class

Most LLM interfaces work with message lists. LangGraph provides a built-in `MessagesState` with the `add_messages` reducer:

```python
from langgraph.graph.message import add_messages

class GraphState(TypedDict):
    messages: Annotated[list[AnyMessage], add_messages]
```

The `add_messages` reducer not only appends messages but also updates existing messages by ID.

### 2. Node

Nodes are **Python functions** that perform the actual work. They receive the current state and return an updated state.

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

Nodes can accept three arguments:

1. **state** (required): Current graph state
2. **config** (optional): RunnableConfig with thread_id, tracing info
3. **runtime** (optional): Runtime object for accessing context and store

#### Four Types of Nodes

| Type | Role | Example |
|------|------|---------|
| **LLM steps** | Understanding, analysis, generation, reasoning | Text classification, response generation |
| **Data steps** | External information retrieval | DB queries, API calls |
| **Action steps** | External operations | Sending emails, creating tickets |
| **User input steps** | Human intervention | Approval requests, information confirmation |

#### Special Nodes

- **START**: Entry point for user input
- **END**: Workflow completion point

```python
from langgraph.graph import START, END

graph.add_edge(START, "node_a")
graph.add_edge("node_a", END)
```

### 3. Edge

Edges are transition rules that determine which node executes next.

#### Normal Edge

```python
graph.add_edge("node_a", "node_b")  # Fixed transition: node_a → node_b
```

#### Conditional Edge

Dynamically determines the next node based on state:

```python
from typing import Literal
from langgraph.graph import END

def should_continue(state: MessagesState) -> Literal["tool_node", END]:
    last_message = state["messages"][-1]
    return "tool_node" if last_message.tool_calls else END

graph.add_conditional_edges("llm_call", should_continue, ["tool_node", END])
```

#### Dynamic Routing with Send

Return `Send` objects from conditional edges to dynamically create parallel node executions:

```python
from langgraph.types import Send

def continue_to_jokes(state: OverallState):
    return [Send("generate_joke", {"subject": s})
            for s in state['subjects']]

graph.add_conditional_edges("node_a", continue_to_jokes)
```

---

## Hands-On Tutorial: Building a Calculator Agent

Let's build a Calculator Agent step by step using the core concepts.

### Step 1: Define Tools and Model

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

The `@tool` decorator converts functions into LangChain tools, and `bind_tools()` binds them to the model.

### Step 2: Define State

```python
from typing_extensions import TypedDict, Annotated
from langchain.messages import AnyMessage
import operator

class MessagesState(TypedDict):
    messages: Annotated[list[AnyMessage], operator.add]
    llm_calls: int
```

Using the `operator.add` reducer ensures messages accumulate rather than being overwritten.

### Step 3: Define the LLM Node

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

The LLM examines the current conversation state and decides whether to invoke tools or respond directly.

### Step 4: Define the Tool Node

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

This node receives the LLM's tool_call requests, executes the actual functions, and returns results as `ToolMessage`.

### Step 5: Define Routing Logic

```python
from typing import Literal
from langgraph.graph import END

def should_continue(state: MessagesState) -> Literal["tool_node", END]:
    last_message = state["messages"][-1]
    return "tool_node" if last_message.tool_calls else END
```

If the last message contains tool_calls, route to tool_node; otherwise, terminate.

### Step 6: Build and Compile the Graph

```python
from langgraph.graph import StateGraph, START

agent_builder = StateGraph(MessagesState)

# Add nodes
agent_builder.add_node("llm_call", llm_call)
agent_builder.add_node("tool_node", tool_node)

# Add edges
agent_builder.add_edge(START, "llm_call")
agent_builder.add_conditional_edges("llm_call", should_continue, ["tool_node", END])
agent_builder.add_edge("tool_node", "llm_call")

# Compile
agent = agent_builder.compile()
```

The execution flow of this graph:

```
START → llm_call → (has tool_calls?) → tool_node → llm_call → ... → END
                   (no tool_calls?)  → END
```

### Step 7: Execute

```python
from langchain.messages import HumanMessage

messages = [HumanMessage(content="Add 3 and 4.")]
result = agent.invoke({"messages": messages})

for m in result["messages"]:
    m.pretty_print()
```

Output:
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

## Workflow vs Agent Patterns

LangGraph distinguishes between **Workflows** and **Agents**.

### Workflow Patterns

Workflows follow **predetermined code paths**. Key patterns include:

| Pattern | Description | Use Case |
|---------|-------------|----------|
| **Prompt Chaining** | Sequential LLM calls, previous output feeds next input | Document translation then verification |
| **Parallelization** | Multiple LLM calls execute simultaneously | Keyword extraction + format checking |
| **Routing** | Classify input then route to appropriate workflow | Customer inquiries → pricing/refunds/returns |
| **Orchestrator-Worker** | Split tasks, delegate to workers, synthesize results | Multi-file code generation |
| **Evaluator-Optimizer** | One LLM generates, another evaluates in a loop | Translation quality improvement |

### Agent Pattern

Agents **dynamically** decide their own processes and tool usage. The ReAct (Reasoning + Acting) pattern is central:

1. LLM evaluates current state and available tools
2. Decides whether to invoke tools or respond directly
3. Executes tools and appends results to messages
4. Repeats until task completion

---

## Functional API: An Alternative Approach

Beyond the Graph API, the **Functional API** lets you build agents using standard Python control flow (while loops, if statements):

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

Using `@task` and `@entrypoint` decorators, this approach replaces explicit nodes/edges with standard Python control flow. It can be more intuitive when the graph structure is simple.

---

## Advanced Features

### Command Primitive

`Command` objects combine state updates with control flow:

```python
from langgraph.types import Command

def my_node(state: State) -> Command[Literal["my_other_node"]]:
    return Command(
        update={"foo": "bar"},
        goto="my_other_node"
    )
```

### Human-in-the-Loop (interrupt)

The `interrupt()` function pauses agent execution to wait for human input, then resumes. The checkpointer preserves state, so the agent can wait indefinitely and resume exactly where it stopped.

### Node Caching

Cache expensive node results:

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

The default recursion limit is 1000 super-steps, configurable at runtime:

```python
graph.invoke(inputs, config={"recursion_limit": 5})
```

Use `RemainingSteps` to gracefully terminate before hitting the limit.

---

## Error Handling Strategy

LangGraph treats errors as part of workflow design:

| Error Type | Handler | Strategy |
|------------|---------|----------|
| **Transient** (network, rate limits) | System | Automatic retry with exponential backoff |
| **LLM-recoverable** (tool failures) | LLM | Store error in state, let LLM retry |
| **User-fixable** (missing info) | Human | Pause with `interrupt()` for input |
| **Unexpected** | Developer | Bubble up for debugging |

---

## Summary

LangGraph is a framework that prioritizes **explicit control, state management, and durability** when building AI agents. Key takeaways:

- **State**: Shared data structure for inter-node communication, with reducers controlling update behavior
- **Node**: Python functions performing the actual logic
- **Edge**: Conditional/fixed transitions controlling workflow flow
- **Graph API vs Functional API**: Explicit graph structure vs Python control flow
- **Durable Execution**: Checkpoint-based failure recovery and human-in-the-loop support

If you need to build complex AI systems at production level, LangGraph is a framework well worth exploring.

---

**References:**
- [LangGraph Official Docs](https://docs.langchain.com/oss/python/langgraph/overview)
- [LangGraph Quickstart](https://docs.langchain.com/oss/python/langgraph/quickstart)
- [LangGraph GitHub](https://github.com/langchain-ai/langgraph)
