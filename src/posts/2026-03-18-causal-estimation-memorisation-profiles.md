---
title: "Causal Estimation of Memorisation Profiles"
date: 2026-03-18
summary: "Pietro Lesci et al. (Cambridge, ETH Zürich)의 ACL 2024 Long Paper. 계량경제학의 이중차분법(Difference-in-Differences)을 활용하여 LLM의 메모리제이션을 인과적으로 추정하는 새로운 방법을 제안한다. Pythia 모델 수트(70M~12B)에서 메모리제이션 프로파일을 분석한 결과, (i) 큰 모델일수록 메모리제이션이 강하고 지속적이며, (ii) 데이터 순서와 학습률에 의해 결정되고, (iii) 모델 크기 간 안정적인 추세를 보여 작은 모델에서 큰 모델의 메모리제이션을 예측할 수 있음을 발견하였다."
tags: [LLM, Memorisation, Causal Inference, Difference-in-Differences, Pythia, Privacy, Copyright, ACL 2024, Research Notes]
category: 연구노트
language: ko
---

# Causal Estimation of Memorisation Profiles

**논문:** Pietro Lesci, Clara Meister, Thomas Hofmann, Andreas Vlachos, Tiago Pimentel

**소속:** University of Cambridge, ETH Zürich

**학회:** ACL 2024 (Long Paper)

**키워드:** Counterfactual Memorisation, Difference-in-Differences, Memorisation Profile, Pythia, Causal Inference

**코드:** [github.com/pietrolesci/memorisation-profiles](https://github.com/pietrolesci/memorisation-profiles)

## 한 줄 요약

계량경제학의 이중차분법(DiD)을 활용하여 LLM의 메모리제이션을 효율적이고 편향 없이(unbiased) 추정하는 방법을 제안하고, Pythia 모델 수트에서 메모리제이션의 시간적 프로파일을 분석한다.

---

## 1. 서론 (Introduction)

대규모 언어 모델(LM)은 대규모 데이터셋에서 단일 패스(single pass)로 사전학습되며 (Raffel et al., 2020; Gao et al., 2020; Penedo et al., 2023), 학습 데이터의 크기를 고려하면 개별 인스턴스가 최종 모델에 미치는 영향은 미미할 것으로 예상된다. 그러나 LLM은 학습 데이터의 전체 시퀀스를 그대로 재현(verbatim reproduce)할 수 있으며 (Carlini et al., 2021), 이는 모델이 개별 학습 인스턴스에 대한 정확한 지식을 저장, 즉 **메모리제이션(memorise)** 할 수 있음을 시사한다.

대규모 LM에서 메모리제이션을 측정하는 것은 NLP 실무자에게 매우 중요하다:

- **저작권 및 데이터 보호** (Hu et al., 2022; Vyas et al., 2023; Lee et al., 2023)
- **모델의 사실 정보 인코딩 방식** 이해 (Cao et al., 2022; Tirumala et al., 2022)
- **학습 역학(training dynamics)** 이해 (Arpit et al., 2017; Chang and Bergen, 2024)

기존 연구에서 채택한 **메모리제이션**의 인과적 정의: 학습 중 인스턴스를 관찰하는 것이 그 인스턴스를 올바르게 예측하는 모델 능력에 미치는 **인과적 효과(causal effect)** (Feldman, 2020). 이 정의를 정량화하려면 **반사실(counterfactual)** — 모델이 해당 인스턴스를 보지 않았다면 어땠을지 — 을 알아야 한다.

### 기존 방법의 한계

1. **다중 학습 방법** (Feldman and Zhang, 2020; Zheng and Jiang, 2022): 모델을 여러 번 학습시켜 반사실을 추정 → **특정 모델 인스턴스가 아닌 아키텍처 수준의 메모리제이션**을 측정
2. **반사실 무시 방법** (Carlini et al., 2021): 반사실의 값을 무시할 수 있다고 가정 → **강한 가정**에 의존

### 본 논문의 기여

1. **반사실적 메모리제이션(counterfactual memorisation)** 을 두 잠재적 결과의 차이로 형식화하여, 기존 정의들을 통합하는 프레임워크 제공
2. 계량경제학의 **이중차분법(Difference-in-Differences, DiD)** 설계에 기반한 새로운 추정 방법 제안 — 관찰 데이터만으로, 학습 전반에 걸쳐 소수의 인스턴스 성능(log-likelihood)만 관찰하면 됨
3. Pythia 모델 수트에서 **메모리제이션 프로파일** (학습 과정에서의 메모리제이션 추이)을 분석

---

## 2. 배경 (Background)

### 2.1 언어 모델링 (Language Modelling)

언어 모델 p_θ(x)는 파라미터 θ ∈ R^d를 가지며, 알파벳 V의 모든 유한 시퀀스 x ∈ V*에 대한 확률 분포를 정의한다.

데이터셋 D = {x_n}을 i.i.d.로 샘플링하고, 순열 함수 σ로 셔플한 후, 배치 크기 B로 T ≤ ⌊N/B⌋개의 배치 B_t로 분할한다. 각 반복에서 배치 B_t를 사용하여 모델 파라미터를 업데이트한다:

**θ_t = θ_{t-1} − η ∇_θ L(θ_{t-1}, B_t)**

여기서 η는 학습률이다. 이 절차는 학습 데이터에 대한 **단일 패스(single pass)** 로 구성되며, 최근 LM의 표준이다 (Touvron et al., 2023; Jiang et al., 2023; Dey et al., 2023).

**핵심 용어:**

- **Checkpoint step** c ∈ {0, 1, ..., T}: 모델 체크포인트 θ_c를 나타내는 인덱스
- **Treatment step** g ∈ {1, ..., T} ∪ {∞}: 배치가 학습에 사용되는 타임스텝 (계량경제학 용어 차용). g = ∞는 학습에 사용되지 않는 validation set

### 2.2 인과 분석 (Causal Analysis)

인과 추정은 세 단계로 구성된다:

1. **인과 추정량(causal estimand)** 정의 — 추정하려는 목표 양
2. **통계적 추정량(statistical estimand)** 도출 — 관찰 가능한 데이터로 인과 추정량을 재작성 (identification)
3. **추정기(estimator)** 정의 — 통계적 추정량을 근사하는 통계적 절차

메모리제이션을 인과 추정량으로 형식화하기 위해 **Rubin (1974, 2005)의 잠재적 결과(potential outcomes) 프레임워크**를 사용한다.

---

## 3. 반사실적 메모리제이션 (Counterfactual Memorisation)

### 핵심 질문

인스턴스 x에 대해, 타임스텝 g에서 학습하지 않았다면 체크포인트 c에서 x에 대한 모델 성능이 어떻게 달랐을까?

### 주요 정의

**Treatment assignment variable** G(x): 인스턴스 x가 학습되는 스텝 g를 나타낸다.

**Outcome variable** Y_c(x) := γ(θ_c, x): 체크포인트 c에서 인스턴스 x에 대한 성능 (기본적으로 sequence-level log-likelihood 사용).

> **정의 1 (Potential outcome):** 인스턴스 x의 체크포인트 c, treatment assignment g에서의 잠재적 결과를 Y_c(x; g)로 표기하며, 이는 G(x)가 g였을 때 결과가 취했을 값이다.

> **정의 2 (Counterfactual memorisation):** 인스턴스 x의 메모리제이션은 관찰된 타임스텝 G(x)=g에서 학습하는 것이 체크포인트 c에서 같은 인스턴스의 성능에 미치는 인과적 효과이다:

**τ_{x,c} = Y_c(x; g) − Y_c(x; ∞)**

여기서 첫 번째 항은 x를 학습했을 때의 성능(관찰 가능), 두 번째 항은 학습하지 않았을 때의 성능(**반사실, 관찰 불가**)이다.

> **정의 3 (Expected counterfactual memorisation):** 타임스텝 g에서 학습에 사용된 인스턴스들의 체크포인트 c에서의 **평균 인과적 효과**:

**τ_{g,c} = E_x [Y_c(x; g) − Y_c(x; ∞) | G(x) = g]**

이 τ_{g,c}들이 모여 **메모리제이션 프로파일(memorisation profile)** 을 형성하며, 각 행은 **메모리제이션 경로(memorisation path)** 이다.

### 메모리제이션의 유형

- **Instantaneous memorisation:** c = g일 때 (학습 직후)
- **Persistent memorisation:** c > g일 때 (학습 후 지속)
- **Residual memorisation:** c = T일 때 (학습 종료 시점)

---

## 4. 메모리제이션 추정 (Estimating Memorisation)

### 4.1 Difference Estimator

가장 단순한 접근: held-out validation set의 관찰된 결과만 필요하지만, **강한 식별 가정(identification assumption)** 에 의존한다.

> **가정 1 (I.I.D. Dataset Sampling):** 인스턴스 x는 p(x)를 따라 독립 동일 분포이며, treatment group g에 무작위 배정된다.

**Difference estimator:**

**τ̂_{g,c}^{diff} = Ȳ_c(g) − Ȳ_c(∞)**

여기서 Ȳ_c(g)는 배치 B_g 인스턴스들의 평균 성능, Ȳ_c(∞)는 validation 인스턴스들의 평균 성능이다. 가정 1 하에서 τ_{g,c}의 **비편향 추정기(unbiased estimator)** 이다.

**한계:** 학습 데이터와 validation 데이터의 분포가 일치하지 않을 수 있으며 (예: NLP에서 학습 데이터는 중복 제거하지만 validation에는 적용하지 않는 경우), 분산이 클 수 있다.

### 4.2 Difference-in-Differences (DiD) Estimator

DiD의 직관: **시간 차원을 활용**하여 식별을 돕는다. Treated(학습된) 인스턴스와 untreated(미학습) 인스턴스의 시간에 따른 결과 **변화의 차이**를 통해 인과 추정량을 식별한다.

추가로 필요한 가정:

> **가정 2 (Parallel Trends):** 학습이 없을 때, 체크포인트 간 모델 성능의 기대 변화는 treatment 여부와 무관하게 동일하다.

> **가정 3 (No Anticipation):** 학습은 발생 전에는 효과가 없다. 즉, c < g인 모든 경우에 대해 Y_c(x; g)의 기대값 = Y_c(x; ∞)의 기대값.

**DiD estimator:**

**τ̂_{g,c}^{did} = (Ȳ_c(g) − Ȳ_{g-1}(g)) − (Ȳ_c(∞) − Ȳ_{g-1}(∞))**

- 첫 번째 괄호: treated 인스턴스의 시간에 따른 성능 변화 (diff in trained)
- 두 번째 괄호: untreated 인스턴스의 시간에 따른 성능 변화 (diff in untrained)

**DiD의 장점:**

- 가정 2 (Parallel Trends)는 가정 1 (I.I.D.)보다 **엄격하게 약하다**: i.i.d.이면 당연히 parallel trends가 성립하지만, 역은 성립하지 않음
- 학습 데이터와 validation 데이터의 분포가 정확히 일치하지 않아도 됨 (challenge set이나 deduplicated data 사용 가능)
- ρ > 0.5이면 (학습 전후 성능 간 상관) **분산이 Difference estimator보다 낮다**

---

## 5. 기존 메모리제이션 개념과의 관계 (Prior Notions of Memorisation)

본 논문의 프레임워크로 기존 세 가지 메모리제이션 개념을 통합적으로 분석한다:

### 5.1 Architectural Counterfactual Memorisation

Feldman (2020), Feldman and Zhang (2020) 등의 접근. x를 포함/비포함한 여러 모델을 학습시켜 비교. **학습 변수 ψ** (데이터 순열, 초기 파라미터 등)에 대해 marginalize하므로 **특정 모델 인스턴스가 아닌 아키텍처 수준의 메모리제이션**을 측정한다.

**단점:** 체크포인트나 treatment step의 효과를 분석할 수 없고, 계산 비용이 높다.

### 5.2 Influence Functions

Koh and Liang (2017)의 접근. 재학습 없이 x를 제거했을 때 파라미터 변화를 근사. 그러나 (i) 손실 함수의 strict convexity, (ii) Hessian의 positive-definiteness, (iii) 모델 수렴 가정이 필요하며, 이는 LLM에서 **일반적으로 충족되지 않아** 강한 편향을 초래할 수 있다 (Basu et al., 2020; Bae et al., 2022).

### 5.3 Extractable Memorisation

Carlini et al. (2023)의 (k,ℓ)-extractability. prefix k 토큰으로 나머지 ℓ 토큰을 정확히 예측하면 extractable. **반사실 Y_c(x; ∞) = 0을 암묵적으로 가정** — 긴 복잡한 문자열에는 합리적이지만 짧거나 단순한 시퀀스에서는 메모리제이션을 과대추정할 수 있다.

---

## 6. 실험 설정 (Experiments)

### Pythia 모델 수트

| 항목 | 세부 사항 |
|------|----------|
| **모델** | Pythia 수트 (Biderman et al., 2023b): 70M, 160M, 410M, 1.4B, 6.9B, 12B |
| **학습 데이터** | The Pile (deduplicated 버전, 207B tokens) |
| **시퀀스 길이** | 2,049 tokens (BPE 토큰화 + 패킹) |
| **학습 스케줄** | cosine learning rate with warm-up |
| **배치 크기** | 1,024 시퀀스 |
| **총 최적화 스텝** | 143k (1.5 에폭) |
| **분석 범위** | 1st epoch (step 1k~95k), 96개 체크포인트 |
| **하드웨어** | NVIDIA A100 80GB PCIe, 32 CPUs, 32GB RAM |

### Panel 구성

- **학습 인스턴스:** 각 macro-batch에서 10개 배치를 랜덤 선택, 각 배치에서 10개 인스턴스 샘플링 → 14.3k 학습 인스턴스
- **Validation 인스턴스:** Pile validation set에서 2k 인스턴스 샘플링
- **전체 패널:** 16.3k 인스턴스 × 96 타임스텝
- **성능 지표:** sequence-level log-likelihood: γ(θ, x) = log p_θ(x)
- **통계적 추론:** Callaway and Sant'Anna (2021)의 Simple Multiplier Bootstrap으로 동시 신뢰구간 계산

---

## 7. 결과 (Results)

### 7.1 Instantaneous Memorisation (순간적 메모리제이션)

![Figure 3: Instantaneous memorisation (τ_{g,c} for g = c). 통계적으로 유의미한 추정치만 표시.](/images/papers/memorisation-profiles/fig3-instantaneous-memorisation.png)

- **Treatment step의 영향:** 학습 초기에 처리된 인스턴스일수록 순간적 메모리제이션이 강하다.
- **학습률과의 상관:** cosine learning rate 스케줄과 상관관계 — warm-up 이후 (약 1.5k 스텝) 메모리제이션이 강해지고, 학습률이 낮아지면 약해진다.
- **모델 크기 효과:** 모델 크기가 커질수록 순간적 메모리제이션이 증가한다.

### 7.2 Persistent Memorisation (지속적 메모리제이션)

![Figure 4: 평균 persistent memorisation — treatment 이후 타임스텝별 τ_{g,c} 평균 (c − g). 통계적으로 유의미한 추정치만 표시.](/images/papers/memorisation-profiles/fig4-persistent-memorisation.png)

- **모델 크기 효과:** 작은 모델(70M)은 persistent memorisation이 거의 없지만, 큰 모델일수록 지속적이다.
- **시간적 패턴:** persistent memorisation은 약 **25k 타임스텝 이후 plateau**에 도달한다.
- **데이터 순서에 대한 시사점:** 메모리제이션을 원치 않는 인스턴스는 가능한 한 **초기 배치에 배치**하여 잊어버리도록 유도할 수 있다.

### 7.3 Residual Memorisation (잔여 메모리제이션)

![Figure 5: Residual memorisation (τ_{g,c} for c = T = 95k). 색상 강도가 통계적 유의미성을 나타냄.](/images/papers/memorisation-profiles/fig5-residual-memorisation.png)

- **Recency effect:** 마지막 macro-batch가 가장 강하게 메모리제이션됨
- **학습률에 의한 설명:** 학습률이 높을 때 → 높은 instantaneous, 낮은 residual (이전 정보를 "덮어씀"). 학습률이 낮을 때 → 낮은 instantaneous, 높은 residual (이전 정보가 덜 "잊혀짐")
- 많은 macro-batch의 residual memorisation이 1st epoch 종료 시점에서 **통계적으로 유의미하지 않음** → 많은 인스턴스가 잊혀진다

### 7.4 모델 크기 간 예측 가능성 (Memorisation Across Scales)

![Figure 6: 서로 다른 모델의 메모리제이션 프로파일 간 Pearson 상관계수.](/images/papers/memorisation-profiles/fig6-pearson-correlation.png)

| 모델 | 70M | 160M | 410M | 1.4B | 6.9B | 12B |
|------|-----|------|------|------|------|-----|
| **70M** | 1.0 | 0.71 | 0.22 | 0.25 | 0.22 | 0.24 |
| **160M** | | 1.0 | 0.63 | 0.63 | 0.57 | 0.53 |
| **410M** | | | 1.0 | 0.93 | 0.88 | 0.8 |
| **1.4B** | | | | 1.0 | 0.93 | 0.88 |
| **6.9B** | | | | | 1.0 | 0.94 |
| **12B** | | | | | | 1.0 |

**핵심 발견:** 큰 모델(예: 12B)의 메모리제이션은 작은 모델(예: 410M)에서 예측 가능하다 (상관 0.8). 단, 70M과 160M은 training instability (Godey et al., 2024) 때문에 예측력이 떨어진다.

---

## 8. 메모리제이션 프로파일 전체 시각화

![Figure 2: 모든 Pythia 크기의 메모리제이션 프로파일 (τ_{g,c}). 통계적으로 유의미한 항목만 표시. 대각선 = instantaneous, 오프대각선 = persistent, 마지막 열 = residual.](/images/papers/memorisation-profiles/fig2-memorisation-profiles-all.png)

---

## 9. 한계 (Limitations)

- **모델 범위:** Pythia 수트(영어, 단일 아키텍처)에 한정. 다른 아키텍처, 학습 절차, 자연어에 대한 일반화 검증 필요.
- **계산 비용:** 대규모 사전학습 LM에서도 추론 모드로 성능을 추출하는 것이 여전히 비용이 크다.
- **서브샘플링:** 패널 데이터 구성 시 인스턴스를 서브샘플링하므로 추정기의 분산이 증가할 수 있다.

---

## 10. 결론 (Conclusions)

본 연구는 계량경제학의 이중차분법(DiD)에 기반한 편향 없고 효율적인 메모리제이션 추정기를 제안하고, Pythia 모델 수트에서 메모리제이션 프로파일을 분석하여 다음을 발견하였다:

1. **메모리제이션은 큰 모델에서 더 강하고 지속적이다**
2. **데이터 순서와 학습률이 메모리제이션을 결정한다** — 학습률이 높은 시점에서 처리된 인스턴스가 더 강한 순간적 메모리제이션을 보이지만, 잔여 메모리제이션은 나중에 처리된 인스턴스에서 더 크다
3. **메모리제이션 프로파일은 모델 크기 간 안정적이다** — 작은 모델에서 큰 모델의 메모리제이션을 예측할 수 있다

이러한 발견은 프라이버시, 저작권, AI 안전성 관점에서 LLM의 메모리제이션을 이해하고 관리하는 데 중요한 시사점을 제공한다.
