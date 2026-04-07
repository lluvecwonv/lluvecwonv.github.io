---
title: "Ragas: Automated Evaluation of Retrieval Augmented Generation"
date: 2026-04-07
summary: EMNLP 2023 논문 Ragas를 정리했습니다. RAG 파이프라인의 Faithfulness, Answer Relevance, Context Relevance를 reference-free로 자동 평가하는 프레임워크와 WikiEval 벤치마크 실험 결과를 상세히 다룹니다.
tags: [RAG, Evaluation, LLM, Faithfulness, Hallucination, 연구노트]
category: 연구노트
language: ko
---

이번 연구노트는 EMNLP 2023 논문 **Ragas: Automated Evaluation of Retrieval Augmented Generation**을 정리한 글이다.

**저자**: Shahul Es, Jithin James, Luis Espinosa-Anke, Steven Schockaert
**소속**: Exploding Gradients / CardiffNLP, Cardiff University / AMPLYFI
**논문 링크**: https://arxiv.org/abs/2309.15217
**GitHub**: https://github.com/explodinggradients/ragas

## 한 줄 요약

RAG 시스템의 품질을 **ground truth 없이** 자동으로 평가할 수 있는 세 가지 메트릭(Faithfulness, Answer Relevance, Context Relevance)을 제안하고, WikiEval 벤치마크에서 사람 판단과 높은 일치도를 보였다.

## 1. 서론

LLM은 방대한 세계 지식을 담고 있지만 두 가지 근본적인 한계가 있다.

- **학습 이후 사건**에 대한 질문에 답할 수 없다.
- 학습 코퍼스에서 드물게 언급된 지식은 기억하지 못한다.

이 한계를 보완하는 표준 접근법이 **Retrieval Augmented Generation (RAG)**이다. 질문이 주어지면 코퍼스에서 관련 패시지를 검색한 뒤, 원래 질문과 함께 LM에 넣어 답변을 생성하는 방식이다.

RAG 시스템은 유용하지만, 실제 구축 시에는 검색 모델, 코퍼스, LM, 프롬프트 설계 등 많은 요소를 튜닝해야 한다. 따라서 **자동화된 평가**가 필수적이다. 하지만 기존 평가 방식에는 문제가 있다.

- **Perplexity 기반 평가**: downstream 성능과 항상 상관이 있지 않으며, ChatGPT/GPT-4 같은 closed model에서는 확률값 자체에 접근할 수 없다.
- **QA 데이터셋 기반 평가**: 보통 짧은 extractive answer만 다루기에 실제 사용 시나리오를 대표하지 못한다.

이 논문은 **reference answer 없이도** RAG 시스템의 다양한 품질 측면을 자동으로 평가할 수 있는 프레임워크 **Ragas (Retrieval Augmented Generation Assessment)**를 제안한다.

## 2. 관련 연구

### 2.1 LLM을 이용한 Faithfulness 추정

LLM 생성 응답의 hallucination 탐지는 활발히 연구되어 왔다.

- **Few-shot prompting**: 모델에게 직접 factuality를 판단하게 하는 방식이 제안되었으나, 표준 프롬프팅으로는 hallucination 탐지 성능이 부족하다는 분석이 있다.
- **외부 지식 기반 연결**: 생성된 응답을 외부 KB의 사실과 연결하는 방법이 있지만, 항상 가능한 것은 아니다.
- **토큰 확률 기반**: BARTScore는 입력이 주어졌을 때 생성 텍스트의 조건부 확률로 factuality를 추정한다. 다중 선택 문제로 변환하여 잘 보정된 확률을 활용하는 방법도 있고, hidden layer의 가중치로 supervised classifier를 학습시키는 접근도 있지만 API를 통해서만 접근 가능한 모델에는 부적합하다.
- **SelfCheckGPT**: 토큰 확률에 접근할 수 없는 모델을 위해, 여러 번 샘플링하여 답변 간 의미적 유사도를 비교하는 방법. 사실적인 답변은 여러 샘플에서 안정적이라는 직관에 기반한다.

### 2.2 텍스트 생성 시스템의 자동 평가

- **GPTScore**: 특정 aspect(예: fluency)를 명시하는 프롬프트로 생성 토큰의 평균 확률을 점수로 사용한다.
- **ChatGPT 직접 평점**: 0~100점이나 5점 척도로 직접 점수를 매기게 하면 강한 성능을 보이지만, 프롬프트 설계에 민감하다.
- **LLM 비교 방식**: 여러 후보 중 최선을 선택하게 하는 방식도 있지만, 답변 제시 순서가 결과에 영향을 줄 수 있다.
- **Reference 기반**: BERTScore, MoverScore는 BERT 임베딩으로 생성 답변과 참조 답변의 유사도를 비교한다. BARTScore도 참조 답변을 활용하여 precision/recall을 계산한다.

이 논문의 핵심 차별점은 **reference answer 없이** RAG 특화 품질 차원을 평가한다는 것이다.

## 3. 평가 전략 (Evaluation Strategies)

표준 RAG 설정을 고려한다. 질문 $q$가 주어지면, 시스템은 먼저 context $c(q)$를 검색하고, 이를 이용해 답변 $a_s(q)$를 생성한다.

Ragas는 **세 가지 핵심 품질 차원**을 제안한다.

### 3.1 Faithfulness

**정의**: 답변 $a_s(q)$가 주어진 context $c(q)$에 근거(ground)되어 있는 정도. 답변 속 주장이 context에서 추론 가능해야 한다.

**측정 방법** (2단계):

**1단계 — Statement Extraction**: LLM에게 답변에서 개별 statement들을 추출하게 한다.

> 프롬프트: *"Given a question and answer, create one or more statements from each sentence in the given answer."*

이 단계의 목적은 긴 문장을 짧고 집중된 assertion으로 분해하는 것이다.

**2단계 — Verification**: 추출된 각 statement $s_i$가 context $c(q)$에서 추론 가능한지 LLM이 판단한다.

> 프롬프트: *"Consider the given context and following statements, then determine whether they are supported by the information present in the context. Provide a brief explanation for each statement before arriving at the verdict (Yes/No)."*

**최종 점수**:

$$F = \frac{|V|}{|S|}$$

여기서 $|V|$는 LLM이 지지(supported)한다고 판단한 statement 수, $|S|$는 전체 statement 수이다.

### 3.2 Answer Relevance

**정의**: 답변 $a_s(q)$가 질문에 직접적으로, 적절하게 답하는 정도. Factuality는 고려하지 않지만, **불완전하거나 불필요한 정보가 포함된 경우**를 패널티한다.

**측정 방법**:

주어진 답변 $a_s(q)$에서 LLM이 $n$개의 역생성 질문 $q_i$를 만든다.

> 프롬프트: *"Generate a question for the given answer."*

그 다음 `text-embedding-ada-002` 모델로 모든 질문의 임베딩을 구하고, 원래 질문 $q$와 각 역생성 질문 $q_i$ 간의 코사인 유사도 $\text{sim}(q, q_i)$를 계산한다.

**최종 점수**:

$$AR = \frac{1}{n} \sum_{i=1}^{n} \text{sim}(q, q_i)$$

직관적으로, 답변이 원래 질문과 밀접하게 관련되어 있다면 역생성된 질문들도 원래 질문과 유사할 것이다.

### 3.3 Context Relevance

**정의**: 검색된 context $c(q)$가 질문에 답하는 데 필요한 정보만 포함하는 정도. 불필요한(redundant) 정보 포함을 패널티한다. 이는 LLM에 긴 context를 넣을 때의 비용 문제와, 긴 context에서 중간 정보를 잘 활용하지 못하는 "lost in the middle" 현상 때문에 중요하다.

**측정 방법**:

LLM이 context $c(q)$에서 질문 $q$에 답하는 데 핵심적인 문장 부분집합 $S_{ext}$를 추출한다.

> 프롬프트: *"Please extract relevant sentences from the provided context that can potentially help answer the following question. If no relevant sentences are found, or if you believe the question cannot be answered from the given context, return the phrase 'Insufficient Information'."*

**최종 점수**:

$$CR = \frac{\text{추출된 문장 수}}{\text{context 내 전체 문장 수}}$$

**모든 프롬프트와 실험은 `gpt-3.5-turbo-16k` 모델을 사용했다.**

## 4. WikiEval 데이터셋

제안된 프레임워크를 평가하기 위해, question-context-answer triple에 대한 **사람 판단 레이블**이 필요하다. 기존에 적합한 공개 데이터셋이 없어 **WikiEval** 데이터셋을 새로 구축했다.

**구축 방법**:

1. 2022년 이후 사건을 다루는 Wikipedia 페이지 50개를 선정 (모델 학습 cutoff 이후 사건)
2. 각 페이지의 도입부를 context로 사용하여 ChatGPT에게 질문을 생성하게 함
3. ChatGPT에게 context를 주고 해당 질문에 답하게 함
4. 두 명의 annotator가 세 가지 품질 차원에 대해 레이블링

**Annotator 일치도**:
- Faithfulness, Context Relevance: 약 95% 일치
- Answer Relevance: 약 90% 일치
- 불일치는 토론 후 해결

**각 차원별 평가 데이터 생성 방법**:

- **Faithfulness**: ChatGPT에게 context 없이 답변을 생성하게 하여 low-faithfulness 답변을 얻고, annotator가 두 답변 중 더 faithful한 것을 선택
- **Answer Relevance**: ChatGPT에게 불완전하게 답하도록 프롬프팅하여 low-relevance 답변을 얻고, annotator가 비교
- **Context Relevance**: Wikipedia 페이지의 backlink를 스크래핑하여 관련되지만 덜 관련된 문장을 추가하여 low-relevance context를 구성

## 5. 실험 결과

### 실험 설정

WikiEval 데이터셋의 각 인스턴스는 두 답변 또는 두 context를 비교하는 pairwise 형태이다. 메트릭이 선호하는 답변/context가 사람 annotator의 선택과 일치하는 비율(accuracy)을 측정한다.

### 비교 Baseline

두 가지 baseline과 비교한다.

**GPT Score**: ChatGPT에게 0~10점 척도로 각 품질 차원의 점수를 매기게 하는 방식. 예를 들어 Faithfulness 평가 프롬프트는 다음과 같다:

> *"Faithfulness measures the information consistency of the answer against the given context. Any claims that are made in the answer that cannot be deduced from context should be penalized. Given an answer and context, assign a score for faithfulness in the range 0-10."*

동점인 경우 랜덤으로 처리.

**GPT Ranking**: ChatGPT에게 두 후보 중 더 나은 것을 직접 선택하게 하는 방식.

### 결과 테이블

| 메트릭 | Faithfulness | Answer Relevance | Context Relevance |
|--------|:---:|:---:|:---:|
| **Ragas** | **0.95** | **0.78** | **0.70** |
| GPT Score | 0.72 | 0.52 | 0.63 |
| GPT Ranking | 0.54 | 0.40 | 0.52 |

*WikiEval 데이터셋에서 사람 annotator와의 pairwise 비교 일치도 (accuracy)*

### 결과 분석

- **Faithfulness**: Ragas가 **0.95**로 매우 높은 일치도를 보였다. Statement 분해 + 개별 검증 전략이 단순 점수 매기기보다 훨씬 효과적이다.
- **Answer Relevance**: **0.78**로 상대적으로 낮지만, 이는 두 후보 답변 간 차이가 매우 미묘한 경우가 많기 때문이다.
- **Context Relevance**: **0.70**으로 가장 어려운 차원이었다. ChatGPT가 context에서 핵심 문장을 선택하는 작업에서, 특히 긴 context에서 어려움을 겪는 것으로 관찰되었다.

모든 차원에서 Ragas가 GPT Score와 GPT Ranking 대비 큰 폭으로 우수했다.

## 6. 결론 및 시사점

이 논문은 RAG 시스템의 자동화된, reference-free 평가의 필요성을 강조하며, 세 가지 핵심 차원을 다루는 Ragas 프레임워크를 제안했다.

**핵심 기여**:

1. **Faithfulness, Answer Relevance, Context Relevance** 세 가지 자동 평가 메트릭을 제안하고, 모두 reference answer 없이 작동한다.
2. 사람 판단 레이블을 포함한 **WikiEval** 벤치마크를 구축했다.
3. WikiEval에서 Ragas의 예측이 사람 판단과 높은 일치도를 보임을 검증했다. 특히 Faithfulness에서 0.95의 높은 accuracy를 달성했다.

**실용적 의의**: Ragas는 llama-index, Langchain과 통합되어 RAG 개발자가 빠르게 평가 사이클을 돌릴 수 있게 해준다. Ground truth 없이도 쓸 수 있다는 점이 실무에서 가장 큰 장점이다.

**한계**: Context Relevance 평가에서 긴 context 처리의 어려움이 관찰되었고, 모든 메트릭이 LLM(gpt-3.5-turbo-16k) 자체의 능력에 의존한다는 점이 한계로 지적될 수 있다.
