---
title: "FlowPlan-G2P: A Structured Generation Framework for Transforming Scientific Papers into Patent Descriptions"
date: 2026-03-31
summary: "매년 350만 건 이상의 특허가 출원되는 상황에서, 과학 논문을 법적 요건을 충족하는 특허 명세서로 자동 변환하는 FlowPlan-G2P 프레임워크를 제안한 논문. Concept Graph Induction → Paragraph Planning → Graph-Conditioned Generation의 3단계 파이프라인으로 전문가의 인지적 워크플로를 모사하며, Pat-DEVAL 기준 모든 차원에서 기존 baseline을 크게 능가한다."
tags: [LLM, Patent, NLG, Graph-to-Text, Structured Generation, Agentic AI, 연구노트]
category: 연구노트
language: ko
---

이번 연구노트는 **FlowPlan-G2P: A Structured Generation Framework for Transforming Scientific Papers into Patent Descriptions** 논문을 정리한 글이다.
저자는 Amazon의 Kris W Pan과 Macquarie University의 Yongmin Yoo이다.

핵심 질문은 이렇다.

**"과학 논문을 법적 요건(enablement, sufficiency of disclosure)을 충족하는 특허 명세서의 Detailed Description으로 자동 변환할 수 있는가?"**

이 논문은 기존의 black-box text-to-text 접근법이 구조적 추론과 법적 제약을 모델링하지 못하는 한계를 지적하고, 전문가의 인지적 워크플로를 모사하는 **3단계 구조적 변환 프레임워크**를 제안한다.

## 한 줄 요약

과학 논문 → Concept Graph Induction → Paragraph Planning → Graph-Conditioned Generation의 3단계 파이프라인을 통해, 법적 준수성과 기술적 정확도를 모두 갖춘 특허 명세서를 자동 생성하는 FlowPlan-G2P 프레임워크.

## 1. 서론 — 왜 특허 명세서 자동 생성이 어려운가

![Figure 1: Global Patent Application Trends](/figures/flowplan-g2p/output.png)
*Figure 1: 2009~2023년 전 세계 특허 출원 추이. 2023년 350만 건 이상으로 꾸준히 증가하고 있다.*

### 1.1 문제 배경

매년 전 세계에서 350만 건 이상의 특허가 출원된다. 특허 명세서(특히 Detailed Description) 작성에는 깊은 기술 전문성과 법적 기준(enablement, sufficiency of disclosure) 준수가 요구된다. 특허 변호사 비용이 건당 $5,000~$15,000에 달하기 때문에 자동화의 경제적 정당성은 충분하다.

### 1.2 과학 논문 → 특허 변환의 고유한 난제

과학 논문과 특허 명세서는 근본적으로 다른 수사적 목적(rhetorical purpose)을 갖는다.

- **과학 논문**: 실험적 증거와 이론적 참신성을 동료에게 설득하는 서사적 구조
- **특허 명세서**: 공개(disclosure)와 권리 범위(claim boundary) 정의를 위한 법적 문서

이 차이로 인해 직접적 텍스트 변환은 모호하거나 법적으로 집행 불가능한 텍스트를 생성하게 된다. 특히 **Enablement Requirement**(35 U.S.C. § 112)는 "당해 기술 분야의 통상의 지식을 가진 자(PHOSITA)"가 과도한 실험 없이 발명을 재현할 수 있을 정도의 기술적 상세를 요구한다.

### 1.3 기존 접근법의 한계

- **PAP2PAT**: outline-guided chunk generation을 도입했으나, 정적 outline에 의존하여 복잡한 발명의 동적 entity 관계를 포착하지 못함
- **PatentGPT**: end-to-end specification drafting을 시도했으나, paragraph-level information flow와 법적 준수에 어려움
- 기존 방법들은 특허 생성을 **surface-level text transformation**으로 취급하여, 전문가가 암묵적으로 구성하는 **구조적 추론(structural reasoning)**을 무시

### 1.4 핵심 기여

1. **Structured Transformation Paradigm**: 과학 논문 → 특허 변환을 surface-level 재작성이 아닌 구조적 변환 프로세스로 재정의. Concept Graph와 Paragraph Plan을 중간 표현(intermediate representation)으로 도입
2. **FlowPlan-G2P Framework**: Concept Graph Induction → Section Planning → Graph-Conditioned Generation의 3단계 파이프라인
3. **Expert-Centric Workflow Modeling**: black-box 모델과 달리, 특허 전문가의 인지적 워크플로를 명시적으로 모사

## 2. 방법론 — FlowPlan-G2P의 3단계 파이프라인

![Figure 2: FlowPlan-G2P Architecture](/figures/flowplan-g2p/pat1.jpeg)
*Figure 2: FlowPlan-G2P의 전체 아키텍처. Stage 1에서 concept graph를 유도하고, Stage 2에서 section-level plan으로 조직하며, Stage 3에서 graph-conditioned paragraph를 생성한다.*

### 2.1 Stage 1: Structured Reasoning-based Concept Graph Induction

첫 번째 단계는 과학적 내용을 특허 적격 구성 요소로 변환한다. 입력 문서 $D$를 canonical drafting category에 맞춰 reasoning step으로 분해한다.

**9가지 Reasoning Category:**
- Field, TechProblem, PriorArt, Novelty, Solution, Implementation, Effects, Embodiment, Figure

각 카테고리 $R_i$에 대해 LLM이 전문가 지향 프롬프트를 사용하여 구조화된 텍스트를 생성한다:

$$R_i = \text{LLM}(\text{expert\_prompt}_i(D, R_{1:i-1}))$$

프롬프트에는 특허 특유의 boilerplate 표현(예: "The present invention relates to...", "However, conventional technology has the following drawbacks...")이 포함되어 LLM이 전문가 작성 관행을 따르도록 유도한다.

이 reasoning step들로부터 **directed concept graph** $G = (V, E)$를 구성한다:
- **노드 $V$**: 특허 요소 (특정 알고리즘, 기능 모듈 등)
- **엣지 $E$**: 기능적/인과적 의존 관계 (solves, implements, causes, improves, validates)

**다중 후보 생성 및 병합:**
- 3개의 후보 그래프 $\{G_1, G_2, G_3\}$를 생성하여 structural recall을 극대화
- 첫 번째 그래프는 rule-based construction (미리 정의된 edge template 사용)
- 이후 그래프는 LLM-based relation inference로 암묵적 의존관계 포착
- **병합 전략**: majority voting으로 충돌하는 edge type 해결, union semantics로 노드 집계
- 고립 노드, 중복 관계, 유효하지 않은 사이클 제거
- 필수 노드 타입(Field, TechProblem, Solution) 존재 검증, 누락 시 placeholder 노드 삽입

### 2.2 Stage 2: Paragraph and Section Planning

두 번째 단계는 정제된 그래프 $G^*$를 법적으로 준수하는 특허 섹션으로 재조직한다.

**계획 구조**: $\mathcal{P} = (S, T)$
- $S$: section-specific subgraph 집합
- $T$: global order

LLM을 활용하여 관련 노드를 클러스터링한다. 예를 들어 Solution과 Implementation을 Detailed Description 섹션으로 묶는다. 클러스터링은 표준 특허 섹션(Field, Background, Summary, Detailed Description, Effects)에 맞춘 hierarchical embedding으로 가이드된다.

**후보 계획 평가 (Gating Mechanism):**

$k=5$개의 후보 계획을 생성한 후, intra-section connectivity와 semantic consistency를 평가한다:

$$C_i = \frac{|E_{\text{in}}(S_i)|}{\max\{1, |S_i|(|S_i|-1)\}}, \quad C = \frac{1}{|S|} \sum_i C_i$$

- $C_i$: 섹션 $S_i$ 내부의 link density
- Semantic consistency: 노드 타입 동질성의 entropy 기반 측정 — $Sim_i = 1 - H(S_i)/H_{\max}$

**수락 기준**: $C \ge \tau_C = 0.5$, $Sim \ge \tau_S = 0.6$. 기준 미충족 시 최고 결합 점수 후보를 fallback으로 선택.

**Rule-based heuristics**: 도메인 관례 위반 설정 제거 (예: embodiment를 technical problem 앞에 배치하거나, figure를 implementation에서 분리)

**Global narrative flow 제약**:

$$\textit{Problem} \rightarrow \textit{Solution} \rightarrow \textit{Implementation} \rightarrow \textit{Effects}$$

### 2.3 Stage 3: Graph-Conditioned Generation

마지막 단계는 section-level subgraph로부터 특허 스타일 paragraph를 합성한다.

각 subgraph $S_i$에 대해 구성 노드를 선형화하고 특허 특정 지시문과 결합:

$$\text{Prompt}(S_i) = [\text{PatentInstruction}; \text{Linearize}(S_i)]$$

**생성 설정:**
- 낮은 온도 설정 ($\tau=0.2$)으로 결정론적이고 법적으로 일관된 출력 보장
- 섹션별 맞춤 생성 전략:
  - **Field**: 간결성과 기술적 구체성 우선
  - **Background**: "However, such technology has the following problems..." 같은 마커를 사용한 명시적 문제 프레이밍
  - **Detailed Description**: 여러 embodiment를 통합하고 직접적 figure 참조 포함
- Few-shot example를 전문 특허 코퍼스에서 검색하여 stylistic drift 완화

**Post-generation validation:**
- LLM-based entailment metric으로 생성 paragraph와 source subgraph 간 semantic fidelity 평가
- 불일치가 미리 정의된 임계값을 초과하면 재생성 트리거
- Token-level coverage analysis로 subgraph의 모든 핵심 개념이 표현되었는지 보장

## 3. 데이터셋

**Pap2Pat-EvalGold** 데이터셋을 사용한다. 원래 Pap2Pat 코퍼스는 과학 논문과 특허를 대규모로 정렬하지만 heuristic matching에 의존하여 noisy한 연관을 도입할 수 있다.

Pap2Pat-EvalGold는 다음과 같은 엄격한 필터링으로 정제되었다:
- **Semantic alignment**: Sentence-BERT 기반 cosine similarity ≥ 0.8
- **Authorship consistency**: Author Overlap Ratio ≥ 0.5 (특허 발명자와 논문 저자가 실질적으로 동일인)
- 최종 **146쌍**의 고품질 paper-patent 쌍

## 4. 실험 및 결과

### 4.1 평가 메트릭: Pat-DEVAL

기존 NLG 메트릭(BLEU, ROUGE, BERTScore)은 표면적 어휘 중복만 측정하며, 법적으로 유효한 명세서와 그럴듯해 보이는 hallucination을 구분하지 못한다.

**Pat-DEVAL**은 Chain-of-Legal-Thought (CoLT) 메커니즘으로 PHOSITA의 추론을 시뮬레이션하며, 4가지 차원을 평가한다:
- **TCF** (Technical Content Fidelity): 기술적 내용 충실도
- **DP** (Data Precision): 데이터 정밀도
- **SC** (Structural Coverage): 구조적 커버리지
- **LPC** (Legal-Professional Compliance): 법적-전문적 준수

### 4.2 Metric Divergence — 전통 메트릭의 역설

| Model | R-1 | R-2 | R-L | BERTScore | Human-LPC |
|---|---|---|---|---|---|
| Zero-Shot | 0.3591 | 0.1903 | **0.1780** | **0.8704** | 1.5 |
| Few-Shot | 0.3312 | 0.1224 | 0.1377 | 0.8337 | 2.1 |
| **FlowPlan-G2P** | **0.5446** | **0.2204** | 0.1689 | 0.8302 | **4.7** |

*Table 1: Metric Divergence 현상. Zero-Shot baseline이 BERTScore(0.8704)와 ROUGE-L(0.1780)에서 최고 점수를 달성하지만, 전문가 평가(Human-LPC)에서는 법적으로 무효(1.5)로 판정된다. FlowPlan-G2P는 이들 메트릭에서 낮은 점수(0.8302/0.1689)를 받지만 법적 준수도는 거의 완벽(4.7)하다.*

이 **역상관(inverse correlation)**은 어휘 중복이나 semantic embedding 유사도를 측정하는 메트릭이 특허 작성 과업에서 오도적(misleading)임을 확인해 준다.

### 4.3 Pat-DEVAL의 신뢰성 검증

| Model | Human-TCF | Human-DP | Human-SC | Human-LPC | Kendall's τ |
|---|---|---|---|---|---|
| Zero-Shot | 1.7 | 1.4 | 1.8 | 1.5 | 0.72 |
| Few-Shot | 2.3 | 2.0 | 2.4 | 2.1 | 0.67 |
| Pap2Pat | 3.4 | 3.1 | 3.3 | 3.0 | 0.69 |
| **FlowPlan-G2P** | **4.5** | **4.4** | **4.6** | **4.7** | **0.76** |

*Table 2: Pat-DEVAL과 인간 전문가 간 상관 분석. 모든 모델에서 Kendall's τ가 [0.67, 0.76]으로 일관되게 높아 Pat-DEVAL이 전문가 판단의 신뢰할 수 있는 대리 지표임을 확인.*

### 4.4 Baseline 비교

| Model | TCF | DP | SC | LPC |
|---|---|---|---|---|
| Zero-Shot Prompting | 1.8 | 1.5 | 1.9 | 1.6 |
| Few-Shot Prompting | 2.4 | 2.1 | 2.5 | 2.2 |
| Pap2Pat | 3.5 | 3.2 | 3.4 | 3.1 |
| **FlowPlan-G2P (Ours)** | **4.6** | **4.5** | **4.7** | **4.8** |

*Table 3: Pat-DEVAL을 사용한 baseline 비교. 모든 방법이 Claude-4.5를 backbone으로 사용. FlowPlan-G2P가 모든 차원에서 4.5 이상으로 압도적 우위를 보인다.*

**분석:**
- Zero-Shot, Few-Shot: 유창한 텍스트를 생성하지만 특허 명세서의 엄격한 구조적 요구사항을 준수하지 못함. 특히 SC와 LPC에서 낮은 점수
- Pap2Pat: 구조적 입력을 활용하여 개선(3.1~3.5)되었지만, 깊은 기술적 추론에 어려움. 높은 DP에 필요한 정밀한 데이터 상관관계가 부족한 generic description 생성
- **FlowPlan-G2P**: 그래프 기반 계획 메커니즘이 모든 기술적 feature가 description에 논리적으로 확장되도록 보장. LPC 4.8로 hallucination을 효과적으로 억제하고 법적 enablement 요건을 엄격히 준수

### 4.5 LLM Backbone별 Robustness 분석

| Backbone | Vanilla (Few-Shot) | + FlowPlan-G2P |
|---|---|---|
| Llama-4-scout | 2.0 | 4.3 |
| Deepseek-v3.1 | 2.2 | 4.6 |
| Claude-4.5 | 2.3 | 4.8 |

*Table 4: 다양한 LLM backbone에서의 robustness 분석. Vanilla는 Few-Shot 결과와 동일. FlowPlan-G2P는 모든 backbone에서 일관되게 4.3 이상으로 성능을 끌어올린다.*

**핵심 발견:**
1. **구조적 가이드가 모델 규모를 압도한다**: 오픈 가중치 모델 Llama-4-scout + FlowPlan-G2P(4.3)가 vanilla Claude-4.5(2.3)의 거의 2배 성능을 달성. 특허 작성 같은 복잡한 과업에서는 정교한 계획 방법론이 모델 크기/명성보다 중요한 품질 결정 요인
2. **Positive scaling behavior**: 더 강한 backbone이 생성된 plan을 더 효과적으로 활용. Deepseek-v3.1(4.6)과 Claude-4.5(4.8)가 예외적 점수 달성

## 5. 핵심 발견 요약

1. **Graph Topology를 통한 복잡성 관리**: 특허 작성은 고차원 기술적 관계의 논리적 일관성 유지가 필요. 그래프 기반 계획이 "logical anchor"로 작용하여, 텍스트 길이에 관계없이 발명의 구조적 무결성을 보존
2. **Metric Paradox**: 법적으로 무효한 Zero-Shot 출력이 전문가급 명세서보다 높은 ROUGE/BERTScore를 달성하는 역설. 어휘 중복은 법적 유효성의 불충분한 대리 지표
3. **방법론이 Performance Equalizer**: 구조적 방법론이 raw model scale보다 품질의 더 중요한 결정 요인. 오픈 가중치 Llama-4-scout + FlowPlan-G2P가 vanilla SOTA 모델을 크게 능가

## 6. Limitations

- **Claims와의 법적 일관성**: 현재 Detailed Description 생성에 초점. Claims와의 실시간 법적 대응 관계 검증 메커니즘 부재
- **동적 법적 선례**: 특허법은 새로운 판례와 법률 개정에 따라 해석이 변화. 학습 시점의 지식과 일반 법적 원칙에 의존하여 실시간 법적 기준 변화를 반영하기 어려움. RAG 기법을 통한 최신 법률 데이터베이스 통합이 향후 과제

## 7. 결론

FlowPlan-G2P는 과학 논문에서 법적으로 준수하는 특허 명세서로의 변환을 자동화하는 구조적 생성 프레임워크이다. Concept Graph Induction → Paragraph Planning → Graph-Conditioned Generation의 3단계 파이프라인으로 전문가의 인지적 워크플로를 모사하며, 과학과 법적 도메인 간의 수사적·구조적 차이를 효과적으로 bridging한다. "Metric Paradox"를 통해 전통적 NLG 메트릭의 한계를 밝히고, 구조적 계획 방법론이 raw model scale보다 생성 품질의 더 중요한 결정 요인임을 실증적으로 증명하였다.
