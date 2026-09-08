---
title: "논문 리뷰 - The Price of Agreement: Measuring LLM Sycophancy in Agentic Financial Applications"
date: 2026-08-14
summary: ICLR 2026 FinAI Workshop 논문. LLM이 에이전틱 금융 태스크에서 보이는 sycophancy(아첨/영합) 문제를 정량적으로 측정한 연구. 단순 rebuttal/contradiction보다 사용자의 개인화된 preference 정보(direct/agentic injection)가 훨씬 강력한 sycophancy 유발 요인임을 밝히고, LLM 기반 prompt filtering, reliability score, adversarial fine-tuning 등 복구 전략의 효과를 FinanceBench, FinanceAgent 벤치마크에서 비교한다.
tags: [Sycophancy, LLM, Financial AI, Agentic AI, FinanceBench, FinanceAgent, ICLR 2026, FinAI Workshop, 연구노트]
category: 연구노트
language: ko
---

본 연구노트는 ICLR 2026 FinAI Workshop 논문 **"The Price of Agreement: Measuring LLM Sycophancy in Agentic Financial Applications"**를 정리한 것이다.

**저자**: Zhenyu Zhao, Aparna Balagopalan, Adi Agrawal, Dilshoda Yergasheva, Waseem Alshikh, Daniel M. Bikel
**소속**: Writer, Inc.
**논문 링크**: [https://arxiv.org/abs/2604.24668](https://arxiv.org/abs/2604.24668)
**게재**: ICLR 2026 FinAI Workshop (Accepted; v1 2026-04-27, 최종 v3 2026-06-09)
**라이선스**: CC BY 4.0

> **리뷰 정보에 대해**: 논문 상단에 "Published as a workshop paper at ICLR 2026"이라고 명시되어 있어 accept된 것은 확인되나, OpenReview 등에서 공개된 리뷰어 코멘트·점수·리젝 사유는 검색 결과 확인되지 않았다(워크숍 리뷰가 비공개이거나 별도 공개되지 않은 것으로 보인다).

## 한 줄 요약

에이전틱 금융 AI 태스크에서 LLM의 sycophancy(사용자 의견에 영합하려는 경향)를 측정한 결과, 단순한 반박(rebuttal)·모순(contradiction)보다 **개인화된 사용자 preference 정보**가 훨씬 강력하게 모델을 흔들며, 대부분의 모델이 이런 정보 앞에서 정답을 포기하면서도 이를 인지·고백하지 않는다는 것을 보였다. Prompt 기반 필터링으로 부분 회복은 가능하지만 baseline 수준으로 완전히 복구되지는 않는다.

---

## 1. 문제의식: 왜 금융 에이전틱 세팅에서 Sycophancy인가

LLM은 의료, 금융 등 다양한 의사결정 상황에 쓰이고 있다. 기존 연구들은 LLM이 정직함보다 사용자와의 합의(agreement)를 우선시하는 "sycophancy" 현상을 보고해왔다. 이 논문은 sycophancy 연구가 대부분 일반적인 QA·사회적 대화 세팅에 머물러 있고, **엔터프라이즈 에이전틱 AI, 특히 금융 도메인**에서는 거의 다뤄지지 않았다는 공백을 지적한다.

저자들은 엔터프라이즈/금융 AI에서의 sycophancy를 다음과 같이 정의한다.

> **"모델이 현재 사용자에 대한 정보를 제공받지 않았다면 저지르지 않았을 실수를 저지르려는 의향(willingness)"**

즉, 사용자가 입력 쿼리에 자신의 선호·믿음을 표현했을 때 모델이 정답(reference answer)에서 벗어나는 정도를 측정 대상으로 삼는다. 금융 도메인을 택한 이유는 (1) LLM 활용이 이미 광범위하게 이루어지고 있고, (2) 안전이 특히 중요한 고가치·고민감도 시나리오이기 때문이다. 또한 단순 in-context QA가 아니라 **에이전틱 세팅**(문서에서 증거를 검색하고 도구를 사용해 수치 추론을 수행하는 태스크, 예: 10-K/10-Q 재무제표 기반 질의응답)에 초점을 맞춘다.

논문의 네 가지 주요 발견은 다음과 같다.

1. 전통적인 "in-context rebuttal"(사용자가 정답을 반박)에 의한 sycophancy는 존재하지만 **성능 하락 폭이 낮음~중간 수준**이다. 이는 기존 연구(주로 사회/과학 QA)와 대비되는 지점이다.
2. **개인화된 맥락(personalized context)을 통한 sycophancy**라는 새로운 유형을 도입한다. 정답과 모순되는 사용자 프로필 정보가 주어지면 응답이 크게 흔들리고 성능이 대폭 하락한다.
3. 다른 LLM을 입력 필터로 사용하면 성능을 일부 회복할 수 있다.
4. 모델별로 sycophancy에 대한 민감도와 양상이 상이하다.

---

## 2. 관련 연구 요약

**Sycophancy 측정**: 기존 연구들은 LLM/VLM이 사용자 입장에 맞춰 응답을 바꾸는 feedback sycophancy, 사용자가 제안한 답으로 답을 바꾸는 rebuttal sycophancy, 사용자의 실수를 그대로 따라가는 현상 등을 보고했다. 대부분 사회적/과학적 QA 맥락에 국한되어 있었다. 이 논문은 금융 도메인의 멀티턴/싱글턴 상호작용(모델 답변에 대한 "그건 아닌 것 같은데" 식의 contradiction, "정답은 X인 것 같은데" 식의 rebuttal)으로 이를 확장한다. 또한 사용자 페르소나에 따라 대화 스타일이 바뀐다는 선행 연구에 착안해, 쿼리에 더해 **사용자에 대한 정보**까지 주입하는 세팅을 연구한다.

**Sycophancy 완화**: 선행 연구는 alignment 단계에서 sycophancy가 증가한다고 보고, 학습 목적함수 수정, 데이터 큐레이션, 입력 정규화(주관적/오도성 정보 필터링) 등을 시도했다. 이 논문은 (1) LLM 기반 입력 필터링, (2) adversarial noise로 학습, (3) reliability score 도입, 세 가지 완화 기법을 실험한다.

---

## 3. 방법론: 금융 세팅에서 Sycophancy를 정량화하고 줄이는 법

### 3.1 Rebuttal과 Contradiction을 통한 Sycophancy 유도

기존 연구를 따라 가장 표준적인 두 가지 유도 방식을 적용한다.

- **Rebuttal**: 모델의 답이 맞든 틀리든 이를 명시적으로 반박하는 사용자 턴을 추가하고 다시 풀게 한다.
- **Contradiction**: 모델의 답을 반박할 뿐 아니라 정답과 다른 답을 제안하며 다시 풀게 한다.

이를 in-context 세팅과 에이전틱 세팅 모두에서 고도로 전문화된 금융 벤치마크에 적용한다.

### 3.2 개인화된 맥락을 통한 Sycophancy 유도

금융 AI는 주로 에이전틱 환경에서 동작하며, 모델은 다양한 도구와 대규모 메모리 시스템을 갖추고 각 사용자 세션에 특화된 맥락 정보를 제공받는다. 이 정보는 매우 개인화되어 있고 태스크 결과에 편향을 유발할 수 있다. 저자들은 sycophancy의 정의를 확장해, **모델이 이런 정보가 결과에 미치는 영향을 인정하지 않은 채 현재 사용자의 과거 행동·선호와 더 잘 맞는 결과를 선호하는 경향**까지 포함한다.

각 평가 태스크 샘플마다 합성으로 매우 전문화된 사용자의 개인 신념·선호·과거 행동을 생성하고, 이를 sycophancy를 유발하는 정보로 주입한다. 주입 방식은 두 가지다.

- **Direct Injection**: 사용자 프롬프트에 직접 in-context로 주입
- **Agentic Injection**: 메모리/개인화 도구 호출의 tool result 형태로 에이전틱하게 주입

또한 다음과 같은 세부 지표를 도입해 금융/엔터프라이즈 sycophancy를 더 정교하게 측정한다.

- **Acknowledgment Rate (AR)**: 모델이 개인화 정보가 답변에 미친 sycophantic한 영향을 스스로 인정·고백한 샘플의 비율 (높을수록 좋음)
- **Non-acknowledgment given Error Rate (EWU)**: 모델이 오답을 냈으면서도 이를 인정하지 않은 샘플의 비율 (낮을수록 좋음)

이 두 지표는 모두 LLM judge(GPT-5-mini, minimal reasoning)로 채점된다. 정확도가 낮고, 인지도(AR)가 낮고, EWU가 높다면 이는 "쉽게 흔들리면서도 투명성이 없는" 위험한 시스템을 의미한다.

### 3.3 서로 다른 가드레일을 통한 견고성 평가

주력 가드레일은 **LLM 기반 필터링("Prompt-based")**이다. 별도의 LLM에 전용 프롬프트를 주어, tool result나 최종 컨텍스트에 포함된 편향 유발 정보를 제거하도록 한다.

부가적으로 Appendix에서 두 가지를 추가 실험한다.

- **Reliability Score**: 컨텍스트에 주입되는 정보에 출처에 대한 사전 이해를 바탕으로 신뢰도·편향 점수를 부여
- **Adversarial Fine-tuning**: 개인화된 sycophantic 세팅을 모사하는 노이즈 샘플을 주입해 외부 도메인 데이터셋(BizBench)으로 supervised fine-tuning을 수행. 이런 방식의 학습이 sycophancy에 대한 견고성을 높이는지 검증

---

## 4. 실험 세팅 (Appendix A 기반 상세 정리)

**데이터셋**:
- **FinanceBench** (Islam et al., 2023): 10-K/10-Q 등 재무 문서를 바탕으로 정보 추출, 논리·수치 추론 능력을 평가하는 in-context QA 벤치마크
- **FinanceAgent** (Bigeard et al., 2025): 모델이 적절한 도구를 올바르게 호출해 관련 컨텍스트를 먼저 확보하고, 그 정보를 활용해 정답을 도출해야 하는 완전 에이전틱 벤치마크

**비교 조건**: Baseline(추가 정보 없음), NC(Neutral Context, 편향 없는 랜덤 정보 주입 — 대조군), 그리고 각종 sycophancy 유도 조건(Rebuttal, Contradiction, PP/Direct Injection, Agentic Injection)

**모델**: 주요 프로바이더의 최신 세대 proprietary 모델과, 에이전틱 태스크에 강한 최신 오픈소스 모델을 함께 평가. 실험에 포함된 모델은 GPT-5-Nano, GPT-5.2, Claude Sonnet-4.5, Claude Opus-4.5, Gemini-3-Pro, GLM-4.7, Kimi-K2-Thinking, DeepSeek-V3.2 (Appendix C에서는 오픈소스 GPT-OSS 20B도 추가).

**하이퍼파라미터**: 모든 세팅에서 temperature=0 사용(단, FinanceAgent에서는 일부 성능 변동이 관찰됨). FinanceBench와 FinanceAgent 모두에서, 각 모델이 reasoning·에이전틱 능력을 최적으로 발휘하도록 모델별 기본(default) temperature를 사용.

**Adversarial fine-tuning 세부사항** (Appendix C.2): BizBench 데이터셋에서 N=1000으로 서브샘플링한 뒤 50% 노이즈를 추가해 학습·검증. 원본(clean)과 노이즈(noised) 버전을 모두 학습 데이터에 포함. GPT-OSS 20B를 base로 하여 LoRA로 1 epoch fine-tuning.

**Sycophancy 유도 데이터 합성**: 편향된(biased) preference, 중립(neutral) preference, contradiction 후보는 모두 별도 LLM(연구용 assistant 프롬프트)으로 생성한다. 편향된 preference는 "현실적이되 결과에 영향을 주지 않아야 하는" neutral과 달리, 의도적으로 정답에서 벗어나도록 설계되며, 동시에 ML 모델이 탐지·필터링할 수 있을 정도로 지나치게 교묘하지 않게 생성한다.

---

## 5. 실험 결과

### 5.1 Table 1 — Rebuttal / Contradiction / Personal Preference에 따른 정확도

FinanceBench(in-context)와 FinanceAgent(full agentic) 각각에서 Baseline, Rebuttal, Contradiction, PP(개인 선호 직접 주입) 조건의 정확도(accuracy)를 비교한 표다.

| Model | FB Baseline | FB Rebuttal | FB Contra | FB PP | FA Baseline | FA Rebuttal | FA Contra | FA PP |
|---|---|---|---|---|---|---|---|---|
| GPT-5-Nano | 0.83 | 0.83 | 0.84 | 0.47 | 0.36 | 0.36 | 0.34 | 0.26 |
| GPT-5.2 | 0.87 | 0.91 | 0.87 | 0.49 | 0.67 | 0.67 | 0.69 | 0.52 |
| Claude Sonnet-4.5 | 0.87 | 0.72 | 0.45 | 0.62 | 0.62 | 0.44 | 0.36 | 0.48 |
| Claude Opus-4.5 | 0.89 | 0.83 | 0.69 | 0.55 | 0.65 | 0.63 | 0.44 | 0.66 |
| Gemini-3-Pro | 0.83 | 0.71 | 0.71 | 0.24 | 0.40 | 0.30 | 0.32 | 0.12 |
| Kimi-K2-Thinking | 0.79 | 0.74 | 0.76 | 0.27 | 0.50 | 0.38 | 0.22 | 0.12 |
| GLM-4.7 | 0.81 | 0.73 | 0.70 | 0.27 | 0.51 | 0.44 | 0.30 | 0.27 |
| DeepSeek-V3.2 | 0.79 | 0.72 | 0.66 | 0.32 | 0.47 | 0.31 | 0.27 | 0.12 |

*(PP = personal preference를 직접 주입한 조건. 논문 Table 1에서는 각 모델별로 가장 큰 성능 하락 폭이 굵게 표시되며, 예컨대 Claude Sonnet-4.5는 FinanceBench Contradiction에서 baseline 대비 약 48%, Gemini-3-Pro는 FinanceBench PP에서 약 71% 하락한다.)*

**관찰**:
- 두 벤치마크 모두에서 rebuttal과 contradiction은 대부분 모델 성능에 부정적 영향을 주지만 그 폭은 낮음~중간 수준이다. Proprietary·오픈소스 모델 모두 취약하지만 버전별로 편차가 있다.
- **PP(개인 선호 직접 주입)** 조건에서는 거의 모든 모델이 훨씬 강한 sycophancy를 보인다. 이런 유형의 편향에 견고한 모델은 없었다. 오픈소스 모델일수록 sycophancy 정도가 더 크게 나타나는 경향이 있다.
- 흥미롭게도 OpenAI 계열 모델은 직접적인(explicit) sycophancy 유도에 강한 반면, Anthropic 계열 모델은 암묵적(implicit) sycophancy 유도에 상대적으로 강건했다.

### 5.2 Table 2 — Direct/Agentic Injection과 Prompt 기반 복구

개인 선호 정보를 직접 주입(Direct Injection)하거나 tool-call 결과로 에이전틱하게 주입(Agentic Injection)했을 때의 정확도(Acc), 인지율(AR), 미인지-오답률(EWU)을 Baseline, NC(neutral context)와 함께 비교하고, Direct Injection에 대해 prompt 기반 필터링을 적용했을 때의 복구 효과를 함께 제시한다.

**FinanceBench**

| Model | Baseline | NC | DI Acc | DI AR | DI EWU | AI Acc | AI AR | AI EWU | Recovery Acc | Recovery AR | Recovery EWU |
|---|---|---|---|---|---|---|---|---|---|---|---|
| GPT-5-Nano | 0.83 | 0.82 | 0.47 | 0.25 | 0.85 | 0.43 | 0.23 | 0.67 | 0.65 | 0.23 | 0.76 |
| GPT-5.2 | 0.87 | 0.83 | 0.49 | 0.26 | 0.76 | 0.79 | 0.30 | 0.90 | 0.67 | 0.27 | 0.21 |
| Claude Sonnet-4.5 | 0.87 | 0.83 | 0.45 | 0.37 | 0.57 | 0.61 | 0.30 | 0.57 | 0.71 | 0.33 | 0.62 |
| Claude Opus-4.5 | 0.89 | 0.83 | 0.55 | 0.49 | 0.58 | 0.73 | 0.33 | 0.86 | 0.71 | 0.33 | 0.59 |
| Gemini-3-Pro | 0.83 | 0.83 | 0.24 | 0.41 | 0.52 | 0.39 | 0.39 | 0.31 | 0.61 | 0.25 | 0.61 |
| GLM-4.7 | 0.81 | 0.85 | 0.27 | 0.26 | 0.71 | 0.45 | 0.34 | 0.53 | 0.58 | 0.27 | 0.65 |
| Kimi-K2-Thinking | 0.79 | 0.85 | 0.27 | 0.23 | 0.73 | 0.35 | 0.31 | 0.43 | 0.60 | 0.31 | 0.51 |
| DeepSeek-V3.2 | 0.79 | 0.80 | 0.32 | 0.30 | 0.72 | 0.33 | 0.26 | 0.70 | 0.65 | 0.31 | 0.59 |

**FinanceAgent**

| Model | Baseline | NC | DI Acc | DI AR | DI EWU | AI Acc | AI AR | AI EWU | Recovery Acc | Recovery AR | Recovery EWU |
|---|---|---|---|---|---|---|---|---|---|---|---|
| GPT-5-Nano | 0.37 | 0.34 | 0.26 | 0.25 | 0.85 | 0.31 | 0.04 | 0.97 | 0.35 | 0.00 | 1.00 |
| GPT-5.2 | 0.67 | 0.65 | 0.52 | 0.12 | 0.79 | 0.60 | 0.02 | 0.95 | 0.58 | 0.04 | 0.95 |
| Claude Sonnet-4.5 | 0.62 | 0.61 | 0.48 | 0.24 | 0.77 | 0.58 | 0.02 | 1.00 | 0.58 | 0.12 | 0.85 |
| Claude Opus-4.5 | 0.65 | 0.67 | 0.66 | 0.21 | 0.94 | 0.54 | 0.00 | 1.00 | 0.64 | 0.05 | 0.87 |
| Gemini-3-Pro | 0.41 | 0.45 | 0.20 | 0.54 | 0.36 | 0.28 | 0.54 | 0.58 | 0.36 | 0.38 | 0.57 |
| GLM-4.7 | 0.51 | 0.50 | 0.27 | 0.25 | 0.80 | 0.40 | 0.15 | 0.42 | 0.36 | 0.16 | 0.77 |
| Kimi-K2-Thinking | 0.50 | 0.46 | 0.12 | 0.14 | 0.84 | 0.16 | 0.22 | 0.79 | 0.20 | 0.08 | 0.91 |
| DeepSeek-V3.2 | 0.47 | 0.34 | 0.06 | 0.22 | 0.73 | 0.08 | 0.31 | 0.66 | 0.33 | 0.18 | 0.77 |

*(DI = Direct Injection, AI = Agentic Injection, Recovery = Direct Injection에 prompt 기반 필터링을 적용한 결과)*

**관찰**:
- Direct Injection과 Agentic Injection 모두 대부분 모델에서 유의미한 sycophancy를 유발한다. 대부분의 모델은 오답을 낼 뿐 아니라 관련 편향된 개인 선호 정보의 존재·영향을 인정하지도 못한다. 상대적으로 큰 모델들은 오답을 내면서도 개인 선호 정보의 영향을 인정하는 경향이 있다.
- **Direct Injection**이 전체 정확도에 더 큰 타격을 주는 반면, **Agentic Injection**은 인지도(AR)와 인정률을 더 크게 떨어뜨려 — 즉 감지·모니터링을 더 어렵게 만든다. FinanceAgent에서 대부분 모델의 AI AR이 0.00~0.05 수준으로 매우 낮은 것이 이를 뒷받침한다.
- **Prompt 기반 필터링**은 Acc, AR, EWU를 전반적으로 개선하지만 baseline 수준까지 완전히 회복시키지는 못한다. 이는 필터링 모델의 능력, 그리고 고도로 전문적인(highly technical) 주입 정보를 정확히 판별하는 것의 어려움 때문으로 분석된다.

### 5.3 Sycophancy의 4분면 (Appendix B)

논문은 acknowledgment(인지) 여부와 task correctness(정답 여부) 두 축으로 모델의 sycophantic 행동을 4분면으로 분류하는 프레임워크를 제시한다(원문 Figure 2는 tikz 다이어그램으로, 이미지 파일로 제공되지 않아 표로 재구성했다).

| | 편향 정보를 인지함 | 편향 정보를 무시함(인지 못함) |
|---|---|---|
| **태스크를 올바르게 수행** | Q1: Ideal — sycophancy 없음, 안전하고 견고한 모델 | Q4: 견고하지만 잠재적으로 불안전 (투명성 부족) |
| **태스크를 잘못 수행** | Q2: Sycophantic하지만 observable(감지 가능) | Q3: 완전히 sycophantic하고 observable하지 않음 (최악) |

Q2는 오답을 내더라도 편향 정보의 영향을 스스로 밝히므로 모니터링·리포팅이 가능해 "거의 최적"에 가깝다고 저자들은 주장한다. 반대로 Q4는 정답을 맞히더라도 투명성이 부족해 완전히 이상적이지는 않다고 본다. 가장 위험한 것은 물론 Q3(완전히 sycophantic하면서 감지도 불가능)이다.

### 5.4 추가 복구 전략 (Appendix C)

**Reliability Score (Table 3, FinanceBench)**: 주입되는 personal preference 정보에 reliability score 0.05(낮은 신뢰도), 관련 context 정보에는 0.95(높은 신뢰도)를 부여해 tool result 형태로 제시했다.

| Model | Baseline | DI Acc | DI AR | DI EWU | DI+Credibility Acc | DI+Credibility AR | DI+Credibility EWU |
|---|---|---|---|---|---|---|---|
| GPT-5-Nano | 0.83 | 0.47 | 0.25 | 0.85 | 0.46 | 0.23 | 0.83 |
| GPT-5.2 | 0.87 | 0.49 | 0.26 | 0.76 | 0.65 | 0.33 | 0.73 |
| Claude Sonnet-4.5 | 0.87 | 0.45 | 0.37 | 0.57 | 0.63 | 0.42 | 0.66 |
| Claude Opus-4.5 | 0.89 | 0.55 | 0.49 | 0.58 | 0.83 | 0.53 | 0.60 |
| Gemini-3-Pro | 0.83 | 0.24 | 0.41 | 0.52 | 0.47 | 0.53 | 0.48 |
| GLM-4.7 | 0.81 | 0.27 | 0.26 | 0.71 | 0.39 | 0.30 | 0.41 |
| Kimi-K2-Thinking | 0.79 | 0.27 | 0.23 | 0.73 | 0.42 | 0.32 | 0.74 |
| DeepSeek-V3.2 | 0.79 | 0.32 | 0.30 | 0.72 | 0.35 | 0.46 | 0.49 |

신뢰도·편향 점수를 함께 제공하면 대부분 모델에서 정확도와 인지율(AR)이 개선되어 부분적인 복구 효과를 보인다(예: Claude Opus-4.5는 DI Acc 0.55 → 0.83으로 크게 개선).

**Adversarial Fine-tuning (Table 4, FinanceBench)**: BizBench 기반 50% 노이즈 데이터로 LoRA fine-tuning한 GPT-OSS 20B와 base 모델을 비교했다.

| Model | Baseline | DI Acc | DI AR | DI EWU | AI Acc | AI AR | AI EWU |
|---|---|---|---|---|---|---|---|
| GPT-OSS 20B | 0.79 | 0.36 | 0.12 | 0.83 | 0.32 | 0.12 | 0.89 |
| GPT-OSS 20B + adversarial | 0.78 | 0.38 | 0.14 | 0.73 | 0.31 | 0.13 | 0.79 |

정확도 개선폭은 미미하며, 전반적인 복구율은 Table 2의 prompt 기반 필터링보다도 낮다. 노이즈 비율·유형 등 탐색할 여지가 많고, 더 큰 모델·더 많은 학습이 필요하다고 저자들은 지적한다. 또한 adversarial 학습 모델은 결과 분산이 커서 안정성 확보를 위한 추가 최적화가 필요하다고 언급한다.

---

## 6. Figure

![논문의 3단계 접근법: sycophancy 측정 및 완화 파이프라인](/images/sycophancy-financial/fig1_overview.png)
*Figure 1: 금융 에이전틱 시나리오에서 sycophancy를 이해하고 완화하기 위한 3단계 접근법 — (1) rebuttal/contradiction 및 개인화된 맥락을 통한 sycophancy 유도, (2) accuracy·acknowledgment rate·EWU 등 지표로 정량화, (3) prompt 기반 필터링 등 가드레일을 통한 완화.*

---

## 7. Conclusion 및 개인 의견

### 논문의 기여
1. **금융 에이전틱 세팅으로 sycophancy 연구를 확장**: 기존 연구가 다루지 않던 엔터프라이즈·금융 도메인, 특히 도구 호출이 필요한 완전 에이전틱 태스크에서 sycophancy를 정량화
2. **개인화된 맥락을 통한 sycophancy라는 새로운 유형 정의**: 단순 rebuttal/contradiction보다 훨씬 위험한 유도 방식임을 실증
3. **Acknowledgment Rate / EWU 지표 도입**: 정확도뿐 아니라 모델이 자신의 편향을 얼마나 투명하게 밝히는지까지 함께 측정하는 프레임워크 제시
4. **여러 복구 전략 비교**: prompt 기반 필터링, reliability score, adversarial fine-tuning의 효과와 한계를 실험적으로 규명

### 한계점
1. **Prompt 기반 필터링도 baseline 완전 회복에는 실패**: 필터 모델의 능력과 고도로 기술적인 주입 정보 판별의 어려움이 근본 원인
2. **Adversarial fine-tuning의 효과가 미미**: 노이즈 설계 공간(비율, 유형)에 대한 추가 탐색 필요, 결과 분산도 큼
3. **평가가 LLM judge(GPT-5-mini)에 의존**: acknowledgment 판정의 신뢰도 자체가 judge 모델의 편향에 영향받을 수 있음
4. **모델별 특이 사항이 많아 일반화가 어려움**: OpenAI 계열은 explicit sycophancy에 강하고 Anthropic 계열은 implicit sycophancy에 강한 등, 원인 분석(alignment 방식의 차이 등)은 향후 과제로 남음

### 실무적 시사점
에이전틱 금융 AI를 구축할 때 사용자 프로필·메모리 시스템에 담긴 정보가 도구 호출 결과로 모델 컨텍스트에 유입될 경우, 이것이 명시적인 반박보다 훨씬 조용하고 강력하게 모델의 판단을 왜곡시킬 수 있다는 점을 시사한다. 특히 agentic injection이 accuracy보다 acknowledgment를 더 크게 떨어뜨린다는 결과는, "모델이 편향된 정보를 인지하지 못한 채 조용히 오답을 내는" 가장 위험한 실패 모드(4분면의 Q3)가 실제 운영 환경에서 감지되기 어려울 수 있음을 경고한다. Reliability score를 부여하는 것처럼 비교적 단순한 개입만으로도 부분적 완화가 가능하다는 점은 실무에 바로 적용해볼 만한 시사점이다.
