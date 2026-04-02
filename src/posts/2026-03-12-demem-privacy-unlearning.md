---
title: "Preserving Privacy Through DeMemorization: An Unlearning Technique For Mitigating Memorization Risks In Language Models"
date: 2026-03-12
summary: "EMNLP 2023 논문. PPO 기반 강화학습으로 LLM의 메모리제이션을 완화하는 DeMem 프레임워크 제안. 음수 BERTScore를 보상 신호로 사용해 패러프레이징 정책을 학습하여, Knowledge Unlearning 대비 ~0.5% 성능 손실만으로 ~94% N-SacreBLEU 달성. GPT-Neo/OPT (125M~2.7B) 6개 모델, 9개 벤치마크 종합 실험."
tags: [LLM, Memorization, Privacy, Unlearning, Reinforcement Learning, PPO, EMNLP, 연구노트]
category: 연구노트
language: ko
---

# Preserving Privacy Through DeMemorization (DeMem)

**논문:** EMNLP 2023 | **저자:** Aly M. Kassem (U Windsor), Omar Mahmoud (Deakin U), Sherif Saad (U Windsor)
**링크:** [ACL Anthology](https://aclanthology.org/2023.emnlp-main.265/)

## 한 줄 요약

PPO 기반 강화학습으로 **음수 BERTScore**를 보상 신호로 사용해 LLM에 **패러프레이징 정책**을 학습시킴으로써, 모델의 일반 성능을 거의 유지하면서(~0.5% 손실) 학습 데이터 메모리제이션을 효과적으로 완화하는 프레임워크를 제안한다.

---

## 1. 논문 개요 및 동기

### 문제: LLM의 메모리제이션

LLM은 학습 데이터의 일부를 기억하고 그대로 재생성할 수 있다. GPT-J (6B)의 경우 학습 데이터의 최소 1%를 기억하며, 적대적 프롬프트로 개인정보, 코드, 저작권 콘텐츠 등을 추출할 수 있다.

### 기존 방법들의 한계

| 방법 | 한계 |
|------|------|
| **Data Sanitization** | 민감 정보가 문맥에 따라 달라져 식별이 어려움 |
| **Differential Privacy (DP)** | 모델 성능 저하가 심하고 계산 비용이 높음 |
| **Data Deduplication** | 중복 제거만으로는 부분적 보호에 그침 |
| **Knowledge Unlearning (UL)** | 한 번에 잊을 수 있는 샘플 수가 제한적 (~32개), 성능 하락 심함 |

### DeMem의 핵심 아이디어

기존 방법들이 데이터를 **제거**하거나 **차단**하는 접근인 반면, DeMem은 **패러프레이징 정책**을 학습시킨다:

> "Alice Green lives at 187 Bob Street" → "Alice Green lives at 12 Red Street"

즉, prefix-suffix 관계를 완전히 삭제하는 것이 아니라, 의미적으로 유사하지만 원본과 **다른** suffix를 생성하도록 모델을 미세조정한다.

![DeMem 파이프라인](/images/papers/demem/figure_1_pipeline.png)
*Figure 1: DeMem 프레임워크의 2단계 파이프라인.*

Figure 1은 DeMem의 전체 파이프라인을 보여준다. **상단**은 일반적인 LLM 사전학습 과정으로, 대규모 코퍼스(Deduplication 적용)로 모델을 학습시킨다. **하단**이 DeMem의 핵심인 RL Fine-tuning 단계다. 학습 코퍼스의 부분집합(Subset)을 DeMem-Policy-LLM에 입력하면 생성된 출력(Generated)이 나오고, 이를 Reward Function에 통과시켜 **Negative Similarity** 점수를 계산한다. 이 점수가 다시 정책 모델로 피드백되어, 원본과 다른 출력을 생성하도록 모델을 업데이트하는 순환 구조다.

---

## 2. 방법론

### 2.1 DeMemorization via Dissimilarity Policy

DeMem의 핵심 메커니즘은 3단계로 요약된다:

**Step 1:** 학습 데이터에서 prefix P와 true suffix S_T를 샘플링

$$P, S_T \sim D_t$$

**Step 2:** 사전학습된 LM에 prefix를 입력해 suffix S_G를 생성

$$S_G = f_\theta(s_{G_{i+1}} | x_{P_1}, ..., x_{P_i})$$

**Step 3:** 생성된 suffix와 true suffix 간의 **음수 BERTScore**를 계산

$$\text{DisScore} = -\text{BERTScore}(S_G, S_T)$$

### 2.2 보상 함수 설계

#### 비유사도 학습: BERTScore

BERTScore를 선택한 이유:
- 토큰 단위가 아닌 **pairwise contextual embedding** 기반으로 동작
- 같은 entity를 공유하는 다른 단어에도 높은 유사도 부여 → 유연한 패러프레이징 유도
- F-score 메트릭 사용

#### 안정성 확보: KL Divergence 페널티

원본 모델과의 발산을 억제하기 위해 KL divergence 페널티를 추가:

$$KL(\theta || \theta_c) = \sum_{i \in [1,t]} \pi_\theta(a_i|s_i) \cdot \log \frac{\pi_\theta(a_i|s_i)}{\pi_{\theta_c}(a_i|s_i)}$$

- θ: 사전학습된 원본 정책
- θ_c: 업데이트된 정책
- **β = 0.2** (KL 페널티 가중치)

### 2.3 정책 최적화: PPO + NLPO

| 하이퍼파라미터 | 값 |
|---------------|-----|
| 알고리즘 | PPO (Proximal Policy Optimization) |
| 샘플링 | top-p = 0.95 (NLPO) |
| 배치 크기 | 32 |
| 학습률 | 1.41 × 10⁻⁵ |
| KL Beta | 0.2 |
| Clip Range | 0.2 |

**NLPO (Natural Language Policy Optimization):** PPO에 top-p 샘플링을 결합한 기법으로, 자연어의 거대한 action space를 효과적으로 탐색한다. Value network V를 언어 모델링 head 옆에 추가하여 value function을 추정한다.

### 2.4 Approximate Memorization 측정

**Eidetic memorization** (정확히 일치하는 기억)만 측정하는 것은 불충분하다. 이 논문은 **SacreBLEU** 기반의 **approximate memorization**을 채택한다:

- **N-SacreBLEU ↑**: 100 - SacreBLEU(S_G, S_T). 높을수록 잘 잊음
- 임계값: SacreBLEU ≥ 75%이면 approximate memorization으로 판정

---

## 3. 실험 설정

### 3.1 데이터셋

**Pile 부분집합** (google-research/lm-extraction-benchmark):
- 15,000개 샘플, 각 200 토큰
- 학습: 13,500 / 테스트: 1,500
- 소스: 코드, 뉴스, 로그, 대화, 저작권 텍스트, 링크 등 (16종)
- 영어 텍스트

### 3.2 시퀀스 분할

![시퀀스 분할](/images/papers/demem/figure_2_sequence_splitting.png)
*Figure 2: 200토큰 시퀀스의 3분할 구조.*

Figure 2는 각 학습 샘플을 어떻게 분할하는지 보여준다. 전체 200토큰 시퀀스를 3개 구간으로 나눈다:

| 구간 | 토큰 수 | 용도 |
|------|---------|------|
| Pre-Prefix | 100 | 평가 시에만 사용 (longer context 공격 평가) |
| Prefix | 50 | 학습 + 평가 (입력) |
| Suffix | 50 | 학습 + 평가 (타겟) |

그림에서 **Evaluation** 괄호는 Pre-Prefix 영역을 가리키고, **Train & Evaluation** 괄호는 Prefix+Suffix를 가리킨다. 학습 시에는 Prefix→Suffix만 사용하고, 평가 시에는 두 가지 세팅을 적용한다:

1. **Prefix만 (50토큰):** 기본 forgetting 성능 측정
2. **Pre-Prefix + Prefix (150토큰):** longer context를 제공하는 **discoverability 공격** 시뮬레이션. 컨텍스트가 길어질수록 메모리제이션이 더 쉽게 추출되는 현상을 테스트한다.

### 3.3 모델

| 모델 패밀리 | 파라미터 | 학습 데이터 | 특징 |
|-------------|---------|-----------|------|
| **GPT-Neo** | 125M, 1.3B, 2.7B | Pile (825GB) | 중복 포함 원본 |
| **OPT** | 125M, 1.3B, 2.7B | Deduplicated Pile + 기타 | 중복 제거 버전 (Deduplication baseline) |

### 3.4 베이스라인

1. **Knowledge Unlearning (UL)** (Jang et al., 2022): Gradient ascent로 학습 목적을 역전시켜 특정 샘플을 잊게 하는 방법. 한 번에 32개 샘플만 처리 가능.
2. **Deduplication:** OPT 모델 자체가 deduplicated Pile로 학습되었으므로 전처리 기반 baseline 역할.

### 3.5 평가 메트릭

| 메트릭 | 측정 대상 | 방향 |
|--------|----------|------|
| **N-SacreBLEU** | 잊기(forgetting) 수준 | ↑ 높을수록 좋음 |
| **LM ACC** | 8개 분류 벤치마크 평균 정확도 | ↑ 높을수록 좋음 |
| **LM PPL** | Wikitext 퍼플렉시티 | ↓ 낮을수록 좋음 |
| **GEN PPL** | 생성된 suffix의 퍼플렉시티 | ↓ 낮을수록 좋음 |

**9개 다운스트림 벤치마크:** Hellaswag, Lambada, Winogrande, COPA, ARC-Easy, ARC-Challenge, PIQA, MathQA, PubmedQA

---

## 4. 실험 결과

### 4.1 주요 결과: GPT-Neo (Table 1)

#### NEO 125M

| Method | N-SacreBLEU↑ | LM ACC↑ | LM PPL↓ |
|--------|-------------|---------|---------|
| Baseline | 58.44~58.82 | 43.36 | 32.28 |
| +UL | 99.19~99.63 | 36.34~38.62 | 31K~9.68M |
| **+DeMem** | **66.21~67.07** | **43.46** | **33.13** |

#### NEO 1.3B

| Method | N-SacreBLEU↑ | LM ACC↑ | LM PPL↓ |
|--------|-------------|---------|---------|
| Baseline | 30.76~34.70 | 48.93 | 16.16 |
| +UL | 98.33~99.57 | 41.34~48.61 | - |
| **+DeMem** | **51.34~52.58** | **49.40** | **16.70** |

#### NEO 2.7B

| Method | N-SacreBLEU↑ | LM ACC↑ | LM PPL↓ |
|--------|-------------|---------|---------|
| **+DeMem** | - | **52.48** | **14.15** |

> UL은 PPL이 ∞에 도달하는 경우가 있어 (⋆ 표시), 실질적으로 사용이 어렵다. DeMem의 GEN PPL은 NEO 전 모델에서 2~4 범위로 안정적.

### 4.2 주요 결과: OPT — Deduplication + DeMem (Table 2)

#### OPT 125M (Deduplicated Pile)

| Method | N-SacreBLEU↑ | LM ACC↑ | LM PPL↓ |
|--------|-------------|---------|---------|
| Baseline | 89.24~91.03 | 41.28 | 31.94 |
| +UL | 99.21~99.35 | 36.48~37.19 | 449K~54.9M |
| **+DeMem** | **94.88~95.61** | **42.25** | **33.13** |

#### OPT 1.3B (Deduplicated Pile)

| Method | N-SacreBLEU↑ | LM ACC↑ | LM PPL↓ |
|--------|-------------|---------|---------|
| Baseline | 71.63~71.96 | 51.65 | 16.41 |
| +UL | 99.50~99.84 | 36.85~39.16 | ⋆(∞) |
| **+DeMem** | **91.56~92.51** | **51.40** | **17.39** |

#### OPT 2.7B (Deduplicated Pile)

| Method | N-SacreBLEU↑ | LM ACC↑ | LM PPL↓ |
|--------|-------------|---------|---------|
| Baseline | 66.32~71.80 | 53.74 | 14.31 |
| +UL | 97.77~99.54 | 39.80~49.70 | 41~324 |
| **+DeMem** | **93.08~94.53** | **52.20** | **15.25** |

### 핵심 관찰

**DeMem vs UL 비교:**

| 측면 | DeMem | UL |
|------|-------|-----|
| N-SacreBLEU | ~94% (OPT), ~67% (NEO) | ~99% |
| 성능 손실 (LM ACC) | **~0.5%** | **~11%** |
| Perplexity 안정성 | 거의 변화 없음 | ∞에 도달하는 경우 있음 |
| 샘플 수 제한 | **없음 (universal policy)** | 32개씩 반복 필요 |
| 생성 텍스트 품질 | 유창하고 일관됨 | 의미 없는 출력 가능 |

### 4.3 샘플 수, 안정성, Universal Policy

![성능 비교](/images/papers/demem/figure_3_performance.png)
*Figure 3: 잊기 샘플 수(32/128/256)에 따른 NEO (125M, 1.3B, 2.7B) 모델의 평균 LM 성능.*

Figure 3은 DeMem의 가장 강력한 장점인 **안정성**을 시각적으로 보여준다. 가로축은 한 번에 잊는 샘플 수(32, 128, 256), 세로축은 8개 벤치마크 평균 성능이다.

**파란 점선 (DeMem):** 세 그래프 모두에서 거의 수평선이다. 125M에서 ~43.3, 1.3B에서 ~49.4, 2.7B에서 ~52.5로, 샘플 수에 관계없이 일관된 성능을 유지한다. 이는 DeMem이 **universal policy**를 학습하기 때문이다 — 1회 파인튜닝으로 테스트 셋의 모든 샘플에 대응한다.

**빨간 실선 (UL):** 샘플 수가 증가할수록 급격한 하락을 보인다. 특히 1.3B에서 48.5→41.0, 2.7B에서 49.5→39.4로 떨어진다. UL은 같은 샘플에 대해 gradient ascent를 반복하므로, 샘플이 많을수록 모델 파라미터가 크게 훼손된다.

### 4.4 Deduplication + DeMem 조합

OPT 모델(deduplicated Pile 학습)에 DeMem을 추가 적용한 결과:
- OPT 모델은 이미 높은 baseline N-SacreBLEU (71~91%)
- DeMem 적용 후 **~94%까지 상승**, 성능 손실 **~0.5%**
- Deduplication 단독으로는 불충분하지만, DeMem과 조합하면 효과적

### 4.5 Discoverability 공격 방어 (Table 3)

Longer context (Pre-Prefix 100 + Prefix 50 = 150 토큰)를 사용한 공격에 대한 방어:

#### GPT-Neo — Longer Context

| 파라미터 | Before N-SacreBLEU↑ | After↑ | 변화 |
|---------|---------------------|--------|------|
| 125M | 45.74 | 55.04 | +9.3 |
| 1.3B | 59.58 | 88.91 | +29.3 |
| 2.7B | 10.55 | 32.66 | +22.1 |

#### OPT — Longer Context

| 파라미터 | Before N-SacreBLEU↑ | After↑ | 변화 |
|---------|---------------------|--------|------|
| 125M | 89.35 | 94.47 | +5.1 |
| 1.3B | 59.58 | 88.91 | +29.3 |
| 2.7B | 56.35 | 89.37 | +33.0 |

- 125M 모델: forgetting rate ~10% 증가
- **1.3B, 2.7B 모델: ~30% 증가**
- 큰 모델일수록 discoverability 공격에 대한 방어 효과가 큼
- PPL 증가는 미미 (NEO 125M: 4.12→4.15, OPT 2.7B: 5.95→6.76)

### 4.6 Approximate Memorization 임계값 분석

![임계값 분석](/images/papers/demem/figure_4_threshold.png)
*Figure 4: NEO 2.7B (Longer Context)에서 DeMem 적용 전(좌)·후(우)의 SacreBLEU 히스토그램.*

Figure 4는 NEO 2.7B 모델에서 longer context(150토큰) 조건의 SacreBLEU 분포를 보여준다. 가로축이 SacreBLEU 점수, 세로축이 샘플 수다.

**좌측 (Before DeMem):** 분포가 오른쪽(높은 SacreBLEU, 즉 높은 메모리제이션)에 집중되어 있다. **빨간 영역**이 75% 임계값 이상으로, 이 구간의 샘플은 approximate memorization으로 판정된다.

**우측 (After DeMem):** 분포가 왼쪽으로 이동하면서 고르게 퍼졌다. 빨간 영역(75%+)의 샘플이 크게 줄어들었다.

SacreBLEU ≥ 75% 기준 memorized 샘플 수 변화:

| Model | Before | After | 감소율 |
|-------|--------|-------|-------|
| NEO 1.3B | 910 | 497 | **45.4%** |
| NEO 2.7B | 1,036 | 321 | **69.0%** |

NEO 2.7B에서는 메모리제이션 판정 샘플이 1,036개에서 321개로 약 70% 감소했다. 이는 DeMem이 단순히 평균 SacreBLEU를 낮추는 것이 아니라, 위험 구간(75%+)에 있는 샘플들을 집중적으로 안전 구간으로 이동시킨다는 것을 보여준다.

### 4.7 정성적 결과

![정성적 예시](/images/papers/demem/figure_5_qualitative.png)
*Figure 5: DeMem 적용 전후 생성 suffix의 정성적 비교. 4개 샘플에 대한 Prefix, True Suffix, Generated Suffix (Before/After), N-SacreBLEU, PPL 값을 보여준다.*

Figure 5는 실제 샘플에서 DeMem이 어떻게 작동하는지를 직관적으로 보여준다. 각 행이 하나의 샘플이며, **초록색 하이라이트**는 True Suffix와 일치하는 부분(메모리제이션), **빨간색 하이라이트**는 다르게 생성된 부분을 나타낸다.

**사례 1: 번역 메타데이터 (이메일 주소 포함)**
- Prefix: `"POT-Creation-Date: 2017-02-24..."`
- Before(Generated Suffix-Before): True Suffix와 거의 동일 — `FULL NAME <EMAIL@ADDRESS>`, `Language-Team: LANGUAGE`까지 그대로 재생성. N-SacreBLEU 12.97 (거의 완벽 메모리제이션)
- **After(Generated Suffix-After):** Language-Team을 `"English (India)"`로, 뒤에 Transifex URL을 붙이는 등 **구조는 유지하되 내용은 완전히 다르게** 생성. N-SacreBLEU **62.38**

**사례 2: 오픈소스 라이선스 (GPL)**
- Before: `.org is distributed in the hope...WITHOUT ANY WARRANTY` — 원본 라이선스 문구를 거의 그대로 재생성
- **After:** 완전히 다른 내용 생성. N-SacreBLEU **99.95** (사실상 완전 forgetting)

**사례 3: 이메일 주소 체인**
- Before: 마스킹된 이메일 주소들을 그대로 재생성 (N-SacreBLEU: 69.87)
- **After:** 이메일 패턴은 유지하되 구체적 주소는 다르게 생성 (N-SacreBLEU: **86.04**)

**사례 4: SSL 코드 라이선스**
- Before: 저작권 고지의 원본 내용 재생성 (N-SacreBLEU: 80.12)
- **After:** 다른 내용으로 패러프레이즈, PPL은 1.56→6.64로 증가. N-SacreBLEU: **96.52**

주목할 점은 Before의 PPL이 모두 1.68~3.80으로 매우 낮은데(학습 데이터와 동일하니까 당연), After에서도 1.98~6.64 범위로 크게 증가하지 않는다는 것이다. 다만 사례 4처럼 PPL이 다소 올라가는 경우가 있어, 이는 DeMem의 trade-off다.

---

## 5. 모델 크기와 수렴 속도

| 모델 크기 | DeMem 수렴 스텝 | UL Epochs |
|----------|----------------|-----------|
| 125M | 4 steps | 18 epochs |
| 1.3B | 2 steps | 7~14 epochs |
| 2.7B | 2 steps | 7~11 epochs |

- **큰 모델일수록 더 빠르게 수렴**: 2.7B 모델은 2 스텝만에 수렴
- 큰 모델의 dissimilarity score가 더 높음 → 더 빠르게 "잊는" 경향
- UL은 모든 크기에서 다수의 epoch 필요

---

## 6. 한계점 및 향후 연구

### 한계점

- **단일 스칼라 보상**: 비유사도(dissimilarity)와 perplexity라는 이중 목표를 하나의 보상으로 최적화
- 이로 인해 두 목표 간 trade-off를 세밀하게 조절하기 어려움

### 향후 연구 방향

- **Multi-objective RL**: 비유사도와 perplexity를 별도 목표로 동시 최적화
- 더 큰 모델(6B+)에서의 검증
- 다국어 데이터에서의 적용성 평가

---

## 7. 핵심 메시지

1. **RL 기반 패러프레이징 > 데이터 삭제**: 학습 데이터를 직접 제거하는 대신, 모델이 다르게 생성하도록 학습시키는 것이 성능-프라이버시 trade-off에서 훨씬 유리하다.

2. **Universal Policy의 확장성**: UL은 32개씩 반복 처리해야 하지만, DeMem은 1회 학습으로 무제한 샘플에 대응하는 universal policy를 학습한다.

3. **Deduplication과의 시너지**: 사전 중복 제거 + DeMem 조합이 가장 효과적이며, 최근 대규모 모델들이 이미 deduplication을 적용하고 있어 실용적이다.

4. **Approximate Memorization의 중요성**: 정확한 일치(verbatim)만 측정하면 프라이버시에 대한 잘못된 안전감을 줄 수 있다. SacreBLEU 기반 approximate memorization 측정이 더 현실적이다.

5. **Discoverability 방어**: Longer context 공격에서도 큰 모델(1.3B+)에서 forgetting rate가 ~30% 증가하여 효과적으로 방어한다.

---

## Open Questions

- 더 큰 모델(7B, 13B, 70B+)에서도 동일한 수렴 속도와 안정성을 보일까?
- Multi-objective RL (비유사도 + perplexity + 유창성)로 성능을 더 개선할 수 있을까?
- SFT/RLHF 단계에서 발생하는 메모리제이션에도 DeMem이 효과적일까?
- 이미지, 코드 등 다른 modality의 메모리제이션에도 적용 가능할까?
- BERTScore 외에 다른 의미적 유사도 메트릭(MoverScore, BARTScore 등)을 사용하면 어떤 차이가 있을까?
