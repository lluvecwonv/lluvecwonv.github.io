---
title: "Prior-Aware Memorization: An Efficient Metric for Distinguishing Memorization from Generalization in LLMs"
date: 2026-03-17
summary: "LLM에서 암기(memorization)와 일반화(generalization)를 구분하는 계산 비용이 저렴한 새 메트릭 Prior-Aware(PA) Memorization 제안. 추가 모델 학습 없이 기존 LLM에 바로 적용 가능. Llama·OPT 모델 평가 결과, 기존에 '암기됨'으로 분류된 시퀀스의 55~90%가 실제로는 통계적으로 흔한(generalizable) 시퀀스임을 발견. Counterfactual Memorization과 양의 상관관계 확인. GPT-2 124M 모델 350개 이상 학습, Named Entity·Long Sequence·SATML Challenge 3가지 설정에서 평가."
tags: [LLM, Memorization, Generalization, Privacy, Prior-Aware, Counterfactual Memorization, 연구노트]
category: 연구노트
language: ko
---

# Efficient Metric for Distinguishing Memorization from Generalization in Large Language Models

**학회:** ICLR 2025 (Accepted)
**저자:** Trishita Tiwari (Cornell University), Ari Trachtenberg (Boston University), G. Edward Suh (NVIDIA, Cornell University)
**논문 링크:** [OpenReview](https://openreview.net/forum?id=lduxR2cLsS)

---

## 한 줄 요약

추가 모델 학습 없이 LLM의 암기(memorization)와 일반화(generalization)를 구분할 수 있는 효율적인 메트릭 **Prior-Aware (PA) Memorization**을 제안하며, 기존에 "암기됨"으로 분류된 시퀀스의 최대 90%가 실제로는 통계적으로 일반적인 시퀀스임을 밝힘.

---

## 1. 논문 개요

언어 모델(LM)의 암기(memorization) — 즉, 학습 데이터를 테스트 시점에서 그대로(verbatim) 재생성하는 경향 — 에 대한 기존 연구는 다양한 동기에서 출발한다. 저작권 침해(Shi et al., 2023; Karamolegkou et al., 2023; Meeus et al., 2024), 프라이버시 유출(Carlini et al., 2018; 2022b; Brown et al., 2022; Mireshghallah et al., 2022), 또는 보간(interpolation)이 일반화로 이어지는 과정의 과학적 이해(Mallinar et al., 2022; Feldman, 2021; Tirumala et al., 2022; Henighan et al., 2023a) 등이 그것이다. 이러한 목표들은 공통점을 공유하면서도, 때로는 서로 모순되는 암기의 개념을 형성한다.

최근 Schwarzschild et al. (2024)은 인간의 암기 행동에서 영감을 받아 LM 암기를 세 가지로 분류하는 taxonomy를 제안했다: (1) **Recitation** — 인간이 반복 노출을 통해 직접 인용을 외우듯, LM이 고빈도로 중복된 시퀀스를 그대로 암송하는 것, (2) **Reconstruction** — 인간이 일반적 패턴을 기억하고 빈칸을 채워 구절을 재구성하듯, LM이 본질적으로 예측 가능한 보일러플레이트 템플릿을 재구성하는 것, (3) **Recollection** — 인간이 단 한 번의 노출 후 일화적 기억을 산발적으로 떠올리듯, LM이 학습 중 드물게 본 시퀀스를 회상하는 것.

이처럼 암기 현상은 단순히 "학습 데이터를 그대로 생성했는가"만으로 판단하기 어렵다. 대규모 언어 모델(LLM)에서 학습 데이터 유출(training data leakage)은 저작권·라이선스 위반(Chang et al., 2023)과 개인식별정보(PII) 유출(Carlini et al., 2021; Mozes et al., 2023)이라는 심각한 문제를 야기하지만, 기존 메트릭은 진정한 암기와 통계적으로 흔한 시퀀스의 일반화를 제대로 구분하지 못한다.

기존의 **Extractable Memorization** (Carlini et al., 2022)은 모델이 학습 데이터를 높은 확률로 그대로 생성하는 경우를 "암기"로 분류하지만, **모델의 일반화 능력을 간과**한다. 예를 들어, "The murder was committed by"라는 프롬프트에 "John Doe"가 나오는 것은 암기가 아니라 "John Doe"가 흔한 이름이기 때문이다. 위 taxonomy 관점에서 이것은 reconstruction에 해당하며, 진정한 memorization(recollection)과는 구별되어야 한다.

**Counterfactual Memorization** (Zhang et al., 2023)은 보다 정교하게 일반화와 암기를 분리하지만, 모든 학습 시퀀스에 대해 별도의 baseline 모델을 학습해야 하므로 프로덕션 모델에 적용하기 매우 비현실적이다.

본 논문이 제안하는 **Prior-Aware (PA) Memorization**은:

- 추가 모델 학습이 필요 없음
- 기존 사전학습 모델에 바로 적용 가능
- Counterfactual Memorization과 양의 상관관계를 보임

---

## 2. 핵심 아이디어: P(s|p)가 높다고 해서 반드시 암기는 아니다

### 2.1 베이즈 분해

기존 메트릭은 조건부 확률 P(s | p)가 높으면 시퀀스를 "암기됨"으로 분류한다. 그러나 베이즈 정리로 분해하면:

> P(s | p) = P(p | s) · P(s) / P(p)

P(s | p)가 높은 경우는 두 가지:

1. **P(s)가 큰 경우** — s가 통계적으로 흔한(generic) 시퀀스. 예: s = "John Doe"는 데이터셋에서 매우 흔하게 등장
2. **상대적 신뢰 비율 P(p|s)/P(p)가 큰 경우** — p가 희귀한 프리픽스인데 s가 나올 확률이 높음 → 진정한 암기의 신호

PA Memorization은 이 두 가지를 구분하는 것이 핵심이다.

---

## 3. Prior-Aware (PA) Memorization 정의

### 3.1 Definition 2: PA Memorization

조절 가능한 임계값 m, n ≥ 0에 대해, 데이터셋 D의 시퀀스 p‖s가 모델 M에 의해 **Prior-Aware memorized**되었다고 판단하는 조건:

1. **P(s | p; M) > m** — suffix s가 prefix p로 프롬프팅했을 때 높은 확률로 verbatim 생성됨
2. **P(s|p; M) / P(s; M) > n** — 상대적 신뢰 비율이 임계값 n을 초과 (s의 생성이 p에 특화되어 있음을 의미)

### 3.2 P(s | p; M) 계산

k개 토큰으로 이루어진 suffix s가 prefix p로부터 생성될 확률은, 각 토큰이 이전 토큰들이 주어졌을 때 생성될 확률을 모두 곱한 것이다:

> P(s | p) = P(토큰1 | 이전 문맥) × P(토큰2 | 이전 문맥) × ... × P(토큰k | 이전 문맥)

즉, suffix의 각 토큰이 순서대로 생성될 조건부 확률의 곱(product)이다. 이는 **단일 forward pass** 로 계산 가능하다.

### 3.3 P(s; M) 계산: 몬테카를로 추정

P(s), 즉 suffix s가 어떤 prefix에서든 생성될 전체 확률을 모든 가능한 prefix에 대해 정확히 계산하는 것은 불가능하므로, **몬테카를로 적분에 기반한 비편향 추정량** 을 사용한다:

> v̂(s) = (1/c) × [P(s | q₁) + P(s | q₂) + ... + P(s | qc)]

즉, c개의 랜덤 prefix를 샘플링하여 각각에 대한 P(s | prefix)를 계산한 뒤 평균을 내는 것이다.

**이론적 보장:**

- **Theorem 1** : 이 추정량의 기댓값은 참값과 같다 (비편향 추정량)
- **Theorem 2** : 추정량의 분산은 1/(4c) 이하이다 (분산 상한)

샘플 수 c가 증가하면 추정 오차가 0에 수렴한다.

---

## 4. Counterfactual Memorization과의 상관관계 검증

### 4.0 이 실험이 필요한 이유

PA memorization이 실제로 counterfactual memorization과 유사한 정보를 포착하는지 검증하기 위한 통제된 실험이다.

**핵심 질문: "PA memorization을 왜 믿을 수 있는가?"**

PA memorization은 baseline model 없이 target model만으로 계산하는 효율적 메트릭이지만, 이것이 실제로 counterfactual memorization과 같은 방향의 판단을 내리는지 확인해야 한다. 이를 위해 **작은 모델(GPT-2 124M)에서 두 메트릭을 모두 계산**하여 비교한다.

왜 작은 모델인가? Counterfactual memorization은 target model M과 baseline model M'를 **둘 다 학습**해야 하므로 계산 비용이 매우 높다. Llama 13B나 OPT 13B 같은 대규모 모델에서는 이것이 현실적으로 불가능하다. 하지만 GPT-2 124M이라면 350개 이상의 모델을 학습시킬 수 있으므로, 이 스케일에서 두 메트릭을 모두 계산하여 비교할 수 있다.

**실험의 논리 구조:**

1. 작은 모델(GPT-2 124M)에서 counterfactual memorization과 PA memorization을 **둘 다** 정확히 계산
2. 두 메트릭이 강한 양의 상관관계를 보이는지 확인
3. 상관관계가 확인되면 → "PA memorization이 counterfactual memorization과 비슷한 정보를 포착한다"는 근거 확보
4. 이 근거를 바탕으로, 대규모 모델(Llama, OPT)에서는 **계산 가능한 PA memorization만** 사용

즉, **"작은 모델에서 두 메트릭이 비슷하다는 걸 검증한 뒤, 큰 모델에서는 PA memorization만 쓰겠다"**는 전략이다.

### 4.1 실험 동기 (Motivation)

이 실험의 근본적 동기는 다음 질문에 답하는 것이다: **"near-duplicate만 있고 exact copy가 없을 때도, 모델이 타겟 시퀀스를 높은 확률로 생성할 수 있는가?"**

기존 memorization 연구(Liu et al., 2025; Zhang et al., 2023)는 "near-duplicate" 시퀀스를 학습 데이터에 주입하여 memorization과 generalization을 연구하는 전략을 사용해 왔다. 그러나 이들은 주로 **높은 오버랩(50% 이상)**의 duplicate을 사용했는데, 이는 현대 학습 파이프라인의 현실을 반영하지 못한다:

- Lee et al. (2022)에 따르면, 높은 오버랩 시퀀스를 제거하면 모델 성능이 향상됨
- 따라서 Touvron et al. (2023), Zhang et al. (2022) 등 현대 학습 파이프라인에서는 전처리 단계에서 고오버랩 데이터를 **적극적으로 제거**함
- 결과적으로, 고오버랩 duplicate을 주입하는 실험은 실제 모델 학습 환경을 현실적으로 반영하지 못함

본 논문은 이러한 문제를 인식하고, **20% 토큰 오버랩**이라는 보수적인 기준을 의도적으로 채택한다. 목표는 **상대적으로 낮은 오버랩에서도 모델이 exact copy 없이 일반화만으로 타겟 시퀀스를 재현할 수 있음**을 보이는 것이다. 이는 현실에서 학습 데이터에 타겟 시퀀스의 exact copy가 없더라도, 유사한 데이터가 충분히 존재하면 모델이 해당 시퀀스를 생성할 수 있다는 것을 의미하며 — 이 경우 기존 extractable memorization 메트릭은 이를 "암기"로 잘못 분류하게 된다.

### 4.2 모델 학습 (Model Training)

| 항목 | 세부 사항 |
|------|----------|
| **모델 아키텍처** | 124M parameter GPT-2 |
| **학습 데이터** | 1,000개 Wikitext 문서 |
| **총 학습 모델 수** | 350개 이상 (다양한 seed 및 타겟 시퀀스 조합) |
| **타겟 시퀀스 수** | 25개 |
| **데이터셋 변형 수** | 7가지 (exact copy vs near-duplicate 비율 변화) |

#### Near-duplicate 정의

Near-duplicate은 **20% 토큰 오버랩**으로 정의한다. 즉, 원본 시퀀스의 토큰 중 약 20%만이 near-duplicate에서도 동일하게 나타나며, 나머지 80%는 다른 토큰으로 대체된다.

![Table 1: Near-duplicate 예시](/images/pa-memorization/table1_near_duplicate.png)
*Table 1: 하나의 시퀀스와 가능한 20% near-duplicate. 일치하는 토큰이 하이라이팅되어 있다. 예를 들어, "Quantum doughnuts might not exist, but theoretical bakers remain hopeful."의 near-duplicate은 "majesticum Nantonuts might Conradavery 258 texted theoretical imperialistmlicks Shim."으로, 전체 토큰 중 약 20%만 일치한다.*

#### Target Model 학습 전략

학습 데이터에 타겟 시퀀스의 **exact copy와 near-duplicate의 비율을 체계적으로 변화**시켜 7가지 데이터셋을 구성한다. 다양한 "일반화 정도(degree of generality)"를 시뮬레이션하는 것이 목적이다:

| 설정 | (Exact Copies, Near-Duplicates) | 의미 |
|------|-------------------------------|------|
| 1 | (0, 180) | 순수 일반화 — exact copy 없이 near-dup만으로 학습. 모델이 타겟 시퀀스를 생성하면 이는 전적으로 일반화에 의한 것 |
| 2 | (10, 150) | 약한 암기 신호. 기존 180개 near-dup 중 30개를 10개 exact copy로 대체 |
| 3 | (20, 120) | |
| 4 | (30, 90) | 중간 |
| 5 | (40, 60) | |
| 6 | (50, 30) | 강한 암기 신호 |
| 7 | (60, 0) | 순수 암기 — near-dup 없이 exact copy만으로 학습. 모델이 타겟 시퀀스를 생성하면 이는 verbatim 학습에 의한 것 |

**핵심 설계 원칙:**

- **총 학습 셋 크기는 항상 1,000 시퀀스로 고정** — exact copy와 near-duplicate의 구성비만 변경하여 다른 변수를 통제
- Exact copy가 많아질수록 모델은 타겟 시퀀스를 **verbatim으로 학습**했기 때문에 counterfactual memorization을 더 많이 보일 것으로 예상
- Near-duplicate이 많을수록 모델은 **일반화**에 의존해야 함 — 비슷하지만 동일하지 않은 다수의 예시로부터 패턴을 학습하여 타겟 시퀀스를 재현 (Liu et al., 2025가 설명하는 것처럼, 유사 데이터가 많으면 그 자체로 높은 확률의 시퀀스 생성이 가능)
- 이 설계를 통해 exact copy 비율을 정밀하게 제어함으로써, 모델이 memorization과 generalization 중 어디에 의존하는지를 **정확하게 조절**할 수 있음

25개 타겟 시퀀스 × 7가지 설정 = **175개 target 모델** 학습. 각 설정에서 서로 다른 seed로 여러 번 반복하여 총 350개 이상의 모델 학습.

#### Baseline Model 학습 전략

Counterfactual memorization (Definition 4, Equation 5)은 "타겟 시퀀스를 포함한 모델"과 "타겟 시퀀스를 제외한 모델"의 성능 차이로 정의된다. 이를 위해 baseline model이 필요하다:

- **Target model**: exact copy + near-duplicate을 모두 포함한 데이터로 학습
- **Baseline model**: exact copy**만 제거**하고 near-duplicate은 유지한 데이터로 학습
- 예: target model이 (10 exact, 150 near-dup)으로 학습했다면, baseline model은 (0 exact, 150 near-dup)으로 학습

이 설계의 의도는: exact target 데이터가 제거되더라도, 일반화할 수 있는 유사 데이터(near-duplicate)가 학습 데이터에 여전히 존재하는 현실적 시나리오를 시뮬레이션하는 것이다. 현실에서도 특정 콘텐츠의 정확한 복사본이 삭제되더라도, 유사한 내용의 문서들은 여전히 학습 데이터에 남아 있는 경우가 일반적이다.

### 4.3 측정 방법 (Metric Measurements)

Counterfactual memorization (Equation 5)과 PA memorization (Definition 2)을 실제로 어떻게 측정하는지 설명한다.

실험에서 x를 p‖s로 해석하며, p와 s는 같은 길이이다. 표기 간소화를 위해 A(S)를 M (target model), A(S')를 M' (baseline model)로 쓴다. 모델 정확도 L(f, x)는 extractable memorization 정의(Carlini et al., 2022)를 따라 **log(P(s | p; M))**으로 측정한다.

**Counterfactual Memorization 측정 방식:**

> [target model들에서 log P(s|p)의 평균] − [baseline model들에서 log P(s|p)의 평균]

즉, "타겟 데이터를 포함한 모델"과 "타겟 데이터를 제외한 모델" 간의 생성 확률 차이를 측정한다. 여러 모델에 대한 단순 평균으로 계산한다.

**PA Memorization 측정 방식:**

Counterfactual memorization과의 비교를 위해, PA memorization도 log 형태로 측정한다:

> PA mem = [target model에서 log P(s|p)의 평균] − [target model에서 log v̂(s)의 평균]

이 분해가 핵심이다: PA memorization은 **"특정 prefix에서 suffix가 생성될 확률"(첫 번째 항)** 과 **"suffix가 어떤 prefix에서든 흔하게 생성되는 정도"(두 번째 항)** 의 차이다. 즉, P(s|p)가 높더라도 v̂(s)(≈ P(s))도 높으면 PA memorization 값은 낮아진다 — 이것이 일반화와 암기를 구분하는 메커니즘이다.

가장 중요한 차이: PA memorization은 **target model M만** 필요하고, baseline model M'를 학습할 필요가 없다. 이것이 PA memorization이 counterfactual memorization보다 계산적으로 효율적인 핵심 이유이다.

### 4.4 실제 데이터 실험 (Real Data)

합성 데이터 외에, **자연적으로 존재하는 Named Entity**를 사용한 실제 데이터 실험도 수행한다.

- **모델**: 124M parameter GPT-2
- **데이터**: Wikitext
- suffix $s$로 Named Entity를 사용, 총 50개 $p \| s$ 쌍
- Named Entity의 빈도 분포 전체에서 균등 샘플링 (예: "United States of America" ≈ 500회, "Starlicide" = 1회)

![Named Entity 빈도 분포](/images/pa-memorization/ne_distribution.png)
*Wikitext의 Named Entity 빈도 분포. x축: 각 NE의 빈도, y축: 해당 빈도 버킷에 속하는 NE 수.*

**Baseline Model**: target 시퀀스 $p \| s$만 제거하고, suffix $s$가 다른 prefix와 함께 나타나는 경우는 유지. 예를 들어 $p \| s$가 "I live in the | United States of America"라면, 이 정확한 prefix-suffix 쌍만 제거하고 "United States of America"의 다른 등장은 유지한다.

### 4.5 결과

#### 합성 데이터 결과

![Figure 1a: Counterfactual Memorization vs PA Memorization (합성 데이터)](/images/pa-memorization/figure1_counterfactual_vs_pa.png)
*Figure 1a: Counterfactual Memorization (x축) vs PA Memorization (y축). 각 데이터 포인트는 동일 빈도의 exact match와 near-duplicate으로 학습된 모델들의 평균.*

**양의 상관관계 (Positive Correlation):** 그래프에서 (0, 180) → (60, 0)으로 이동할수록, 즉 near-duplicate이 줄어들고 exact copy가 많아질수록 x축(counterfactual memorization)과 y축(PA memorization) 모두 증가한다. 이는 두 메트릭이 **양의 상관관계**를 보인다는 것을 의미한다.

#### 실제 데이터 결과

![Figure 1b: Counterfactual Memorization vs PA Memorization (실제 데이터)](/images/pa-memorization/figure1b_wikitext_correlation.png)
*Figure 1b: Wikitext 실제 데이터에서의 Counterfactual Memorization (x축) vs PA Memorization (y축). 각 점은 단일 $p \| s$ 쌍.*

**실제 데이터에서도 양의 상관관계**가 관찰되었다. 인위적으로 near-duplicate을 주입한 합성 데이터가 아닌, 자연적으로 존재하는 Named Entity를 사용했음에도 두 메트릭이 같은 방향의 정보를 포착한다.

**왜 이것이 PA memorization이 counterfactual memorization과 유사하다는 근거인가?**

핵심 논리는 다음과 같다:

1. **Near-duplicate이 많고 exact copy가 적은 경우 (0, 180)**: 타겟 시퀀스가 학습 데이터에서 "generic"하다 — 비슷한 데이터가 많으므로 일반화로 생성 가능. 이 경우 counterfactual memorization은 낮아야 하고 (baseline model도 비슷하게 생성 가능하므로), PA memorization도 낮아야 한다 (v̂_s가 높으므로). **실제로 두 메트릭 모두 낮은 값**을 보인다.

2. **Exact copy가 많고 near-duplicate이 적은 경우 (60, 0)**: 타겟 시퀀스를 verbatim으로 학습했으므로, 이는 진정한 암기이다. counterfactual memorization은 높아야 하고 (baseline model은 생성 못 하므로), PA memorization도 높아야 한다 (v̂_s가 낮으므로). **실제로 두 메트릭 모두 높은 값**을 보인다.

3. 중간 설정들 (10,150) → (50,30)에서도 **두 메트릭이 함께 단조 증가**하며, 이는 PA memorization이 counterfactual memorization과 동일한 방향의 정보를 포착함을 보여준다.

**PA memorization이 counterfactual memorization의 대안이 될 수 있는 이유:**

- Counterfactual memorization은 target model M과 baseline model M'를 **모두** 학습해야 하므로 계산 비용이 매우 높다
- PA memorization은 **target model M만으로** 동일한 방향의 판단이 가능하다
- 이 실험에서 두 메트릭이 강한 양의 상관관계를 보인다는 것은, PA memorization이 baseline model 학습 없이도 "이 시퀀스가 일반화에 의한 것인지 암기에 의한 것인지"를 구분할 수 있음을 경험적으로 보여준다

**스케일 차이에 대한 관찰:**

한 가지 흥미로운 관찰은 두 메트릭 간의 **스케일 차이**이다. Counterfactual memorization (x축)은 0~50 범위, PA memorization (y축)은 1~4 범위로, 스케일이 상당히 다르다. 이는 두 메트릭이 동일한 현상을 포착하지만 다른 관점에서 측정하기 때문이며, PA memorization의 한계점으로 Section 7에서 상세히 논의한다.

---

## 5. 대규모 모델 평가

### 5.1 평가 모델

| 모델 | 사이즈 | 학습 데이터 |
|------|--------|------------|
| **Llama** (Touvron et al., 2023) | 3B, 7B, 13B | Common Crawl |
| **OPT** (Zhang et al., 2022) | 125M, 350M, 1.3B, 2.7B, 6.7B, 13B | The Pile |

기본 모델 크기: OPT 6.7B, Llama 7B

### 5.2 타겟 시퀀스 추출 설정

P(s)를 계산하기 위해 각 시퀀스를 **5,000개 랜덤 프리픽스**로 프롬프팅하고, s 생성 확률을 측정한다. 이를 **5회 반복**한다.

3가지 설정에서 평가:

**1) Named Entities (개체명)**

- 각 데이터셋에서 ~5,000-8,000개의 Named Entity 포함 시퀀스 무작위 샘플링 (Lukas et al., 2023 방법론)
- 개인, 장소, 조직 이름 → PII 유출 시뮬레이션
- **50 토큰 prefix + 4 토큰 Named Entity suffix**
- 최대 400 토큰까지 prefix 길이 실험

**2) Long Sequences (긴 시퀀스)**

- 저작권 침해 위험 시뮬레이션
- **50 토큰 prefix + 50 토큰 suffix**
- 각 데이터셋에서 5,000개 무작위 샘플링 (Biderman et al., 2024; Carlini et al., 2022 방법론)
- 최대 400 토큰까지 prefix 길이 실험

**3) SATML Challenge**

- Yu et al. (2023)의 SATML 학습 데이터 추출 챌린지 데이터셋
- **1-eidetic 시퀀스**: p‖s가 전체 학습 데이터에서 딱 한 번만 등장
- 15,000개 시퀀스 (50 토큰 prefix + 50 토큰 suffix), 그 중 **1,000개에 대해 결과 보고**

### 5.3 하이퍼파라미터 설정

| 파라미터 | 값 | 설명 |
|---------|---|------|
| **m** (4-token suffix) | 0.01 | 1/m = 100 → 평균 100회 프롬프팅으로 유출 가능 |
| **m** (50-token suffix) | 0.0001 | 보수적인 낮은 임계값 |
| **n** | 모델별 계산 | LLM이 쉽게 예측하는 시퀀스들의 P(s|p)/v̂_s 평균 |
| **c** (샘플 수) | 5,000 | P(s) 추정을 위한 랜덤 prefix 샘플 수 |
| **반복 횟수** | 5 | 추정의 안정성을 위한 반복 시행 |

---

## 6. 실험 결과

### 6.1 모델 크기의 영향

![Figure 2: 모델 크기별 Extractable 및 PA Memorized 시퀀스 수](/images/pa-memorization/figure2_model_size.png)
*Figure 2: 4-토큰 및 50-토큰 suffix에 대한 모델 크기별 extractable memorized 및 PA memorized 시퀀스 수. 굵은 선은 extractable memorized 시퀀스 중 PA memorized인 비율.*

#### 핵심 관찰 1: Extractable과 PA Memorized 간의 큰 격차

기존 연구와 일관되게, 모델 크기 증가에 따라 extractable과 PA memorization 모두 증가한다. 그러나 두 수치 간에 **큰 격차**가 존재:

| 설정 | Extractable 중 PA Memorized 비율 |
|------|-------------------------------|
| Named Entity (4-token suffix) | **~10%** (가장 큰 모델) |
| Long Sequence (50-token suffix) | **~45%** (가장 큰 모델) |

4-토큰 Named Entity suffix의 경우, 가장 큰 모델에서 extractable memorized 샘플 중 **겨우 10%만이 PA memorized**이다. 이는 나머지 90%가 "John Doe", "United States of America" 같은 통계적으로 흔한 개체명임을 시사한다.

#### 핵심 관찰 2: 모델이 커질수록 PA Memorized 비율 감소

모델 크기가 증가할수록, PA memorized 시퀀스의 비율이 **감소**하는 경향이다. 이는 더 큰 모델이 common/near-duplicate 데이터로부터 **일반화**를 통해 텍스트를 재현하며, 이것이 진정한 암기가 아님을 시사한다 (Liu et al., 2025와 일치).

### 6.2 Prefix 길이의 영향

**실험 세팅:**

Figure 3에서는 프롬프트 p의 길이가 PA memorization 탐지에 미치는 영향을 분석한다. 기본 prefix 길이는 50토큰이며, 최대 **400토큰**까지 확장하며 실험한다.

- **Named Entity (4-토큰 suffix)**: 각 데이터셋에서 Named Entity를 포함하는 시퀀스 ~5,000-8,000개를 랜덤 샘플링 (Lukas et al., 2023). 각 시퀀스는 prefix 50토큰 + 4토큰 Named Entity suffix로 구성. prefix 길이를 100, 200, 300, 400 토큰까지 늘려가며 PA memorized 및 extractable memorized 시퀀스 수를 측정.
- **Long Sequence (50-토큰 suffix)**: 각 데이터셋에서 5,000개를 랜덤 샘플링 (Biderman et al., 2024; Carlini et al., 2022). prefix 50토큰 + suffix 50토큰 구성. 마찬가지로 prefix 길이를 최대 400토큰까지 변화시킴.
- P(s) 계산: 각 시퀀스당 **5,000개 랜덤 프리픽스**로 프롬프팅하여 s 생성 확률 측정, **5회 반복**.
- 평가 모델: OPT (125M~13B), Llama (3B, 7B, 13B). 기본 결과는 OPT 6.7B와 Llama 7B 기준.

![Figure 3: Prefix 길이별 PA Memorized 및 Extractable 시퀀스 수](/images/pa-memorization/figure3_prefix_length.png)
*Figure 3: 두 종류의 suffix에 대한 prefix 길이별 Extractable 및 PA Memorized 시퀀스 수.*

**결과 분석:**

- 더 긴 prefix는 더 많은 PA memorized 시퀀스를 발견 가능 — 길이가 길어질수록 모델에 더 구체적인 문맥을 제공하므로 당연한 결과
- 그러나 **4-토큰 Named Entity suffix**의 경우 긴 prefix의 효과가 제한적. 이는 많은 Named Entity (예: "United States of America")가 웹 텍스트에서 흔하게 등장하여, 특정 프롬프트 없이도 생성 가능하기 때문
- **50-토큰 suffix**는 prefix가 길어질수록 PA memorized 수가 뚜렷하게 증가 — 긴 suffix는 더 구체적이므로 특정 prefix에 의존하는 경향이 강함

### 6.3 SATML Challenge 결과

**실험 세팅:**

Yu et al. (2023)이 공개한 **2023 SATML Training Data Extraction Challenge** 데이터셋을 사용한다. 이 데이터셋의 특징:

| 항목 | 세부 사항 |
|------|----------|
| **데이터 구성** | 1-eidetic 시퀀스 (각 p‖s가 전체 학습 데이터 The Pile에서 **정확히 1번**만 등장) |
| **총 시퀀스 수** | 15,000개 |
| **시퀀스 구성** | prefix 50토큰 + suffix 50토큰 |
| **본 논문 평가** | 15,000개 중 **1,000개**에 대해 결과 보고 |
| **평가 모델** | OPT (125M~13B), Llama (3B, 7B, 13B) |
| **P(s) 추정** | 각 시퀀스당 5,000개 랜덤 프리픽스, 5회 반복 |

이 데이터셋이 중요한 이유는 모든 시퀀스가 학습 데이터에 **단 1번만** 존재하기 때문에, 모델이 해당 시퀀스를 높은 확률로 생성하면 "진짜 암기"일 가능성이 높다는 점이다. 따라서 PA memorization이 "common"으로 분류한 시퀀스가 있다면, 그것은 실제로 통계적으로 일반적인 내용이라는 강력한 증거가 된다.

![Figure 4a: SATML Challenge 모델 크기별 결과](/images/pa-memorization/figure4_satml_a.png)
*Figure 4a: SATML challenge 데이터셋 1K 시퀀스에 대한 모델 크기별 memorization.*

Figure 4b는 Section 4.3의 counterfactual correlation 실험에서 exact copy 수가 P(s|p)와 P(s)에 미치는 영향을 보여준다.

![Figure 4b: P(s|p)와 P(s) breakdown](/images/pa-memorization/figure4_satml_b.png)
*Figure 4b: P(s|p)와 P(s)의 exact copy 수에 따른 변화. 두 값이 양의 상관관계를 보여 비율의 민감도가 제한됨.*

**결과 분석:**

- **놀라운 발견**: 전체 학습 데이터에서 **단 한 번만 등장**하는 SATML challenge 시퀀스 중에서도 약 **40%가 "common"**한 것으로 나타남
- 이는 시퀀스의 빈도만으로는 암기를 판단할 수 없음을 강력하게 시사 — 1-eidetic이라도 통계적으로 흔한 내용이면 일반화로 생성 가능
- Figure 4(b): exact copy가 추가되면 P(s|p)와 P(s) 모두 증가하지만, 비율 P(s|p)/P(s)는 매우 느리게 증가 → PA memorization의 한계점 (Section 7에서 논의)

### 6.4 정성적 분석

| Score (Low) | Sequence (p‖s) | Score (High) | Sequence (p‖s) |
|------------|----------------|-------------|----------------|
| 2.9 | ...and is a tributary to **Saginaw Bay** | 4052 | ...t1="Sea Zone" t2=" **South Atlantic Sea Zone** |
| 3.0 | ...special prosecutor **Leon Jaworski** | 3358 | ...misguided members of the **Autonomie Club** |
| 3.7 | ...Jack Germond and **Jules Witcover** | 2544 | ...I'm watching Gore's **Warmista-Fest** |
| 4.0 | ...Hospital had received **Hill-Burton** | 1560 | ...PLUS Gold certification.- **Corsair Gold AX850** |

*Table 2: PA memorization 점수가 낮은(Low) 시퀀스와 높은(High) 시퀀스 예시.*

- **Low score (PA memorized 아님)**: 장소, 정치인, 유명인 등 흔한 개체명 → 일반화로 생성 가능
- **High score (PA memorized)**: 희귀한 용어, artifact-like 텍스트, niche 주제, boiler-plate 텍스트 등
- 가장 높은 점수(4052)의 시퀀스는 웹 검색에서 **단 하나의 결과**만 반환 — 바로 데이터셋에 포함된 시퀀스 자체

---

## 7. 한계점

PA memorization과 counterfactual memorization 사이에는 중요한 차이가 있다:

- **P(s; M)**은 near-duplicate이 많을 때뿐만 아니라, p‖s의 **exact copy가 많을 때도** 높아질 수 있다
- Figure 4b에서 보듯이, exact copy가 추가되면 P(s; M)과 P(s | p; M) 모두 증가하여 P(s|p; M)/P(s; M)는 **매우 느리게** 증가
- 따라서 near-duplicate과 exact copy를 구별하는 데는 counterfactual memorization보다 덜 효과적일 수 있음

---

## 8. 결론

| 핵심 결론 | 세부 내용 |
|----------|---------|
| **과대평가 문제** | 기존 메트릭으로 "암기됨"으로 분류된 시퀀스의 최대 **90%**가 통계적으로 흔한 시퀀스 |
| **효율성** | 추가 baseline 모델 학습 불필요 → 대규모 프로덕션 모델에도 **실용적 적용 가능** |
| **일반화 능력** | 더 큰 모델일수록 진정한 암기보다 **일반화**를 통해 텍스트를 재현하는 비율이 높음 |

이 연구는 기존의 memorization 메트릭이 generic 시퀀스를 암기로 잘못 분류함으로써 LLM의 암기를 과대평가하고 있을 수 있음을 보여주며, LLM의 memorization에 대한 기존 개념을 재고해야 할 필요성을 제기한다.

---

## 9. ICLR 2026 리뷰 결과 (초기 제출: Reject → 이후 ICLR 2025 Accept)

이 논문은 최초 ICLR 2026에 제출되었을 때 **Reject** 결정을 받았다. 그러나 이후 수정을 거쳐 **ICLR 2025에 최종 Accept**되었다 (저자: Trishita Tiwari, Ari Trachtenberg, G. Edward Suh). 아래는 초기 제출 당시 5명의 리뷰어 평가와 Area Chair의 Meta Review를 정리한 것이다.

### 9.1 전체 점수 요약

| 리뷰어 | Rating | Soundness | Presentation | Contribution | Confidence |
|--------|--------|-----------|-------------|-------------|------------|
| **Reviewer SbhA** | 2 (reject) | 1 (poor) | 2 (fair) | 2 (fair) | 5 (absolutely certain) |
| **Reviewer 3GmT** | 2 (reject) | 1 (poor) | 2 (fair) | 1 (poor) | 4 (confident) |
| **Reviewer 8jkg** | 2 (reject) | 2 (fair) | 2 (fair) | 2 (fair) | 3 (fairly confident) |
| **Reviewer Yckr** | 6 (marginally above) | 3 (good) | 2 (fair) | 2 (fair) | 3 (fairly confident) |
| **Reviewer VzFo** | 0 (strong reject) | 1 (poor) | 2 (fair) | 2 (fair) | 4 (confident) |

### 9.2 Area Chair Meta Review 요약

Area Chair는 다음과 같이 정리했다:

- 핵심 아이디어는 유망하지만(promising), 현재 제출본은 acceptance 수준에 미치지 못함
- **여러 리뷰어가 핵심 가정(core assumption)에 의문을 제기**: 랜덤 프리픽스에서 suffix의 높은 확률이 일반화를 의미한다는 가정이 충분히 정당화되지 않음
- 현재 평가가 **합성 데이터(synthetic injected-sequence experiments)**에 크게 의존하고 있어, 실제 사전학습 데이터 분포를 반영하지 못할 수 있음
- Counterfactual memorization과의 경험적 비교가 충분히 직접적이거나 포괄적이지 않음
- **표기법(notation)과 명확성(clarity) 문제**가 우려 사항을 더함

### 9.3 주요 리뷰어 비판 상세

#### Reviewer SbhA (Rating: 2, Confidence: 5)

**핵심 비판:**
- **핵심 가정(line 53-54)이 잘 정당화되지 않음**: suffix가 랜덤 프리픽스에서도 높은 확률로 나타나면 일반화라는 가정이, 실제 코퍼스에서 duplication, templating, 자연적 near-duplicate이 흔한 환경을 고려하지 않음
- **SATML Challenge 데이터셋에 대한 잘못된 주장**: 저자들이 SATML이 "1-eidetic sequences"로 구성된다고 주장했으나, 공식 문서에 따르면 이 데이터셋은 The Pile 전체가 아닌 일부에서 가져온 것이며, 1-eidetic 속성이 전체 학습 데이터에 대해 보장되지 않음
- **학습 불필요한 다른 memorization 메트릭과의 비교 누락**: Schwarzschild et al. (2024)와의 비교가 없음
- **관련 연구 미인용**: Huang et al. (2024), Lesci et al. (2024), Prashanth et al. (2025)

#### Reviewer 3GmT (Rating: 2, Confidence: 4)

**핵심 비판:**
- **수학적 표기법의 엄밀성 부족**: Equation 1에서 E, E_M 등의 연산자 정의가 불명확
- **Cm과 PAm의 비교가 불충분**: PAm이 Cm의 효율적 대안으로 제시되었으나, 직접적인 head-to-head 비교가 부족
- **논문 presentation 개선 필요**: 불필요한 요소가 있는 Figure, 문법 오류 등
- **PAm이 Cm의 대안이라는 주장을 뒷받침할 증거 부족**: 임계값 기반 분류 대신 분포 자체를 연구하지 않은 이유가 불분명
- **중요한 관련 메트릭 누락**: Wang et al. (2025)의 유사한 정의를 언급하지 않음

#### Reviewer 8jkg (Rating: 2, Confidence: 3)

**핵심 비판:**
- **문제 정의의 novelty 의문**: Carlini et al. (2022)에서 이미 P(s|p)가 "popular" 시퀀스를 과대 계수할 수 있다고 언급한 바 있음
- **테스트 시퀀스가 주로 무작위 샘플링**: adversary가 실제로 추출하고자 하는 시퀀스가 아닌, 랜덤 샘플에서의 결과이므로 실용적 의미가 제한적
- **PA memorization 비율 감소 추세에 대한 주장이 의심스러움**: 단순히 비율이 감소한다고 해서 일반화가 증가한다고 결론짓기 어려움

#### Reviewer Yckr (Rating: 6, Confidence: 3) — 유일하게 긍정적

**강점 인정:**
- 추가 학습 없이 사용 가능한 실용적 메트릭
- 베이즈 정리로부터의 PA Memorization 유도가 흥미로움
- 방법론 섹션이 잘 작성됨
- 경험적 결과가 메트릭의 유용성을 시사

**약점 지적:**
- Section 4.4, 4.5의 실험 결과가 정리되지 않음
- "55-90%"라는 수치의 출처가 불분명
- 더 다양한 데이터셋/모델에서의 실험 필요
- Figure 시각화 개선 필요, 맞춤법 오류 존재

#### Reviewer VzFo (Rating: 0 = strong reject, Confidence: 4)

**핵심 비판:**
- **Equation 1의 유도가 잘못됨**: P(s)를 근사하기 위해 랜덤 프리픽스에서의 평균을 사용하는 접근법의 타당성에 의문. 모델은 P(s)를 학습하도록 훈련된 것이 아니라 P(t_{i+1}|t_{1:i})를 학습
- P(s|p)에서 v̂_s가 실제로 무엇을 포착하는지 불분명
- 표기법과 수학적 엄밀성 전반에 걸친 문제

### 9.4 리젝 사유 종합

종합하면, 이 논문이 reject된 주요 이유는:

1. **핵심 가정의 정당화 부족**: "랜덤 프리픽스에서 suffix의 높은 확률 = 일반화"라는 가정이 현실적 사전학습 데이터(duplication, templating 흔함)에서 성립하는지 불충분하게 검증됨
2. **합성 데이터 의존**: 상관관계 검증 실험이 synthetic near-duplicate 주입에 의존하여, 실제 데이터 분포를 반영하지 못할 수 있음
3. **기존 메트릭과의 불충분한 비교**: Counterfactual memorization과의 직접적 head-to-head 비교, 그리고 Schwarzschild et al. (2024), Wang et al. (2025) 등 다른 training-free 메트릭과의 비교 부재
4. **수학적 엄밀성과 표기법 문제**: Equation 1 유도, 연산자 정의, notation 일관성 등
5. **SATML 데이터셋 관련 부정확한 주장**: 데이터셋의 속성에 대한 잘못된 가정이 "놀라운 발견"의 신뢰성을 약화시킴

---

## 10. 관련 연구 (Related Work)

### 10.1 Memorization 정의 및 측정

언어 모델의 암기 현상에 대한 연구는 크게 세 가지 관점에서 진행되어 왔다.

**Extractable Memorization.** Carlini et al. (2021, 2022)은 모델이 학습 데이터를 verbatim으로 생성할 수 있는지를 측정하는 extractable memorization 개념을 정립했다. 이 접근법은 prefix를 프롬프트로 제공했을 때 모델이 정확한 suffix를 생성하는지를 평가한다. 그러나 이 메트릭은 통계적으로 흔한 시퀀스의 생성(일반화)과 진정한 암기를 구분하지 못한다는 한계가 있다.

**Counterfactual Memorization.** Zhang et al. (2023)은 타겟 시퀀스를 포함하여 학습한 모델과 포함하지 않고 학습한 모델의 성능 차이를 측정하는 counterfactual memorization을 제안했다. 이 접근법은 일반화와 암기를 원리적으로 분리할 수 있지만, 모든 시퀀스에 대해 별도의 baseline 모델을 학습해야 하므로 대규모 모델에 적용하기가 계산적으로 비현실적이다.

**Memorization Taxonomy.** Schwarzschild et al. (2024)은 인간의 암기 행동에 기반한 세 가지 유형의 taxonomy를 제안했다: recitation(반복 노출된 고빈도 시퀀스의 암송), reconstruction(예측 가능한 보일러플레이트 패턴의 재구성), recollection(드물게 노출된 시퀀스의 회상). 이 분류는 기존 단일 메트릭으로는 포착할 수 없는 암기의 다양한 양상을 체계적으로 구분한다.

### 10.2 저작권 및 프라이버시 관점

LM 암기 연구의 주요 동기 중 하나는 저작권 침해와 프라이버시 유출이다. Shi et al. (2023)은 학습 데이터의 저작권 침해를 탐지하는 방법을 제안했고, Karamolegkou et al. (2023)과 Meeus et al. (2024)는 모델 출력에서 저작권이 있는 콘텐츠의 재생성 문제를 분석했다. 프라이버시 측면에서는 Carlini et al. (2018, 2022b), Brown et al. (2022), Mireshghallah et al. (2022) 등이 모델이 학습 데이터의 개인정보를 유출할 수 있음을 실증적으로 보여주었다.

### 10.3 일반화와 암기의 관계

Feldman (2021)은 long-tail 분포의 학습 데이터에서 암기가 일반화에 필수적일 수 있다는 이론적 프레임워크를 제시했다. Tirumala et al. (2022)은 모델 규모와 학습 진행에 따른 암기 패턴을 분석했으며, Henighan et al. (2023a)은 scaling law 관점에서 암기와 일반화의 관계를 연구했다. Mallinar et al. (2022)은 보간(interpolation) 기반의 행동이 일반화로 이어지는 메커니즘을 탐구했다. 이들 연구는 암기가 단순히 부정적 현상이 아니라, 모델의 일반화 능력과 깊이 연관된 복잡한 현상임을 시사한다.

### 10.4 Training-free Memorization 메트릭

본 논문의 PA Memorization 외에도 추가 학습 없이 암기를 측정하려는 시도들이 있다. Schwarzschild et al. (2024)은 training-free 메트릭을 제안하여 PA Memorization과 비교의 대상이 되며, Wang et al. (2025)은 개념적으로 유사한 정의를 제안했다. 리뷰어들이 지적한 바와 같이, 이들 메트릭과의 직접적 비교는 PA Memorization의 우위를 입증하기 위해 중요한 과제로 남아 있다.
