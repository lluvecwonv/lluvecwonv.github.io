---
title: Does Learning Require Memorization? A Short Tale about a Long Tail 논문 정리
date: 2026-03-29
summary: STOC 2020 논문. 자연 데이터의 long-tailed 분포에서 memorization이 최적 일반화를 위해 필수적임을 이론적으로 증명한 연구. Memorization 없이는 희귀 subpopulation에서의 성능 손실이 불가피하며, differential privacy와 model compression의 정확도 하락도 이 관점에서 설명한다.
tags: [LLM, Memorization, Long-tail, Generalization, Differential Privacy, STOC, 연구노트]
category: 연구노트
language: ko
---

이번 연구노트는 STOC 2020 논문 **Does Learning Require Memorization? A Short Tale about a Long Tail**을 정리한 글이다.
저자는 Google Research (Brain Team, 현재 Apple)의 Vitaly Feldman이다.

핵심 질문은 이렇다.

**"학습 알고리즘이 outlier나 noisy label까지 memorize하는 것은 과적합의 부산물인가, 아니면 최적 일반화를 위해 필수적인가?"**

이 논문은 자연 데이터의 **long-tailed** 분포 특성상, memorization이 최적에 가까운 일반화 오류를 달성하기 위해 **필수적**임을 이론적으로 증명한다. 특히 outlier와 noisy label의 memorization까지도 필요하다는 점이 핵심이다.

논문 링크: https://arxiv.org/abs/2003.05753

## 한 줄 요약

자연 데이터의 subpopulation 빈도가 **long-tailed 분포**를 따를 때, 학습 알고리즘이 singleton 예제(한 번만 등장하는 예제)의 label을 memorize하지 않으면 일반화 오류가 최적보다 **체계적으로 높아진다** — 이 trade-off를 τ₁이라는 양으로 정량화했다.

![Figure 1: Long tail of class frequencies](/images/papers/learning-memorization/fig1-long-tail.jpg)
*Figure 1: 클래스 빈도와 클래스 내 subpopulation 빈도의 long tail. SUN object detection benchmark에서 관찰된 분포. [Zhu et al., 2014]에서 인용.*

## 1. 서론 — 왜 Memorization이 필요한가

### 1.1 현대 ML의 딜레마

딥러닝 모델은 **과잉 매개변수화(overparameterized)**되어 있어 학습 데이터를 쉽게 "과적합"할 수 있다. 고전적 이론은 **정규화(regularization)**를 통해 모델 복잡도와 경험적 오류 사이의 균형을 맞추어 과적합을 방지한다고 설명한다. 잘못 라벨링된 데이터나 outlier를 fitting하면 모델 복잡도가 증가하므로, 이론적으로 이를 피하는 것이 바람직하다.

그러나 현실은 다르다. 딥러닝 알고리즘은 학습 데이터에 95-100% 정확도를 달성하면서도 테스트 데이터에서는 50-80% 정도의 정확도를 보인다. 이러한 (거의) 완벽한 fitting은 대규모 데이터셋에 불가피하게 존재하는 잘못 라벨링된 데이터와 outlier의 memorization을 필요로 한다. 더 나아가, 동일한 학습 알고리즘이 **완전히 랜덤한 라벨**에 대해서도 ImageNet에서 90% 이상의 학습 정확도를 달성한다는 것이 알려져 있다 [Zhang et al., 2017]. 즉, 이러한 알고리즘들은 잘못 라벨링된 예제와 outlier의 memorization을 방지할 만큼 강한 정규화를 사용하고 있지 않다.

이 논문은 이 현상에 대한 **첫 번째 개념적 설명과 이론적 모델**을 제공한다.

### 1.2 핵심 직관: Long Tail과 Subpopulation

핵심 설명은 다음과 같다: 정확한 모델 학습의 주된 장애물은 label의 noise가 아니라, **희귀하고 비전형적인 인스턴스에 대해 정확히 예측하기 위한 데이터 부족**이다. 이러한 인스턴스를 실무에서는 데이터 분포의 "long tail"이라고 부른다.

이를 형식화하기 위해, 각 클래스의 데이터 분포를 **서로 다른 subpopulation의 mixture**로 모델링한다. 예를 들어, 새 이미지는 다양한 종, 다양한 각도, 다양한 조건(클로즈업, 나뭇잎 사이, 하늘 위)에서 촬영된 것을 포함한다. 자연스럽게 이 subpopulation들은 서로 다른 빈도를 가지며, 그 빈도 분포가 **long-tailed**하다는 것이 핵심 관찰이다.

**핵심 논증 흐름:**

1. n개 샘플로 구성된 데이터셋에는, 단 한 번만 등장한 subpopulation이 존재한다 (**singleton**)
2. singleton 예제의 label을 정확히 예측하려면 그 label을 **memorize**해야 한다
3. 데이터셋만 보고는 singleton이 "비전형적(atypical)" subpopulation에서 왔는지 "outlier" subpopulation에서 왔는지 구분할 수 없다
4. 따라서 "비전형적" subpopulation을 놓치는 위험을 피하려면 "outlier" singleton의 label도 memorize해야 한다
5. long-tailed 분포에서는 빈도 1/n 부근의 subpopulation의 총 가중치가 상당하므로, 이들을 무시하면 일반화 오류가 크게 증가한다

### 1.3 Noisy Label에 대한 설명

Long tail 효과는 잘못 라벨링된 예제의 memorization이 필요한 이유도 설명한다. Singleton 예제의 경우 데이터셋의 나머지로부터 정확한 label을 추론할 수 없으므로, 관찰된 label이 가장 가능성이 높은 한 해당 label을 memorize해야 한다. 반면, 많은 예제가 있는 subpopulation에서의 잘못 라벨링된 예제는 다른 label로부터 올바른 label을 추론할 수 있으므로 memorization이 불필요하다 (오히려 해로울 수 있다).

## 2. 이론적 모델

### 2.1 Problem Setup

도메인 X는 구조가 없는 이산 집합으로 |X| = N, |Y| = m이다.

**빈도 생성 과정:** 각 점 x ∈ X에 대해 prior π = (π₁, ..., π_N)에서 독립적으로 빈도 p_x를 샘플링하고, 합이 1이 되도록 정규화한다. 이 과정으로 생성된 개별 빈도의 실제 주변 분포를 π̄ᴺ이라 한다.

**학습 목표:** 메타 분포에 대한 기대 일반화 오류를 최소화:

```
ε̄(π, F, A) := E_{D~D, f~F} [ E_{S~(D,f)^n, h~A(S)} [ Pr_{x~D}[h(x) ≠ f(x)] ] ]
```

### 2.2 핵심 정리 (Theorem 1: The Cost of Not Fitting)

**Definition (errn):** 데이터셋 S에서 정확히 ℓ번 등장하는 점들 중 알고리즘이 맞추지 못한 점의 수를 errn_S(A, ℓ)로 정의한다.

**Theorem 1 (Main Bound):** 모든 학습 알고리즘 A와 모든 데이터셋 Z에 대해:

```
ε̄(π, F, A | Z) ≥ opt(π, F | Z) + Σ_{ℓ∈[n]} τ_ℓ · errn_Z(A, ℓ)
```

여기서 핵심 양은:

```
τ_ℓ = E_{α~π̄ᴺ}[α^(ℓ+1) · (1-α)^(n-ℓ)] / E_{α~π̄ᴺ}[α^ℓ · (1-α)^(n-ℓ)]
```

이 정리의 의미: **알고리즘이 학습 데이터를 fit하지 않을 때마다, 그 suboptimality가 τ_ℓ에 비례하여 증가한다.** 특히 τ₁은 singleton 예제를 fit하지 않을 때의 비용이다.

### 2.3 수치 예시

**Zipf 분포** (i번째 빈번한 항목의 빈도가 1/i에 비례) 하에서 N = 50,000, n = 50,000일 때:

| 항목 | 값 |
|------|-----|
| fit하지 않은 예제당 기대 손실 | ≈ 0.47/n |
| 최악 경우 손실 (최소 빈도 요소) | ≈ 0.09/n |
| singleton 예제의 기대 비율 | ≈ 17% |
| 모든 singleton을 fit하지 않을 때의 suboptimality | ≈ 7% |
| 10개 균형 클래스의 최적 top-1 오류 | ≈ 15% |

즉, singleton을 무시하면 최적 오류(15%)에 7%가 추가되어 22%가 된다 — 거의 절반에 가까운 상대적 성능 하락이다.

### 2.4 Label Noise 확장 (Theorem 2)

노이즈가 있는 환경에서는, 관찰된 label이 올바른 label일 사후 확률이 다른 label보다 높다면(confidence margin κ), singleton 예제의 label을 memorize하는 것이 최적이다:

```
ε̄(π, F, A) ≥ opt(π, F) + τ₁ · E[Σ_{singleton i} conf(S,i,F) · Pr[h(x_i) ≠ y_i]]
```

대부분의 ML 벤치마크에서 노이즈율이 낮고 주로 비전형적 예제만 잘못 라벨링되므로, 학습 알고리즘은 label을 적극적으로 memorize하도록 조정되어 있다.

### 2.5 From Tails to Bounds

τ₁의 크기는 빈도 prior에서 1/n 부근의 가중치에 의해 결정된다:

```
τ₁ ≥ (1/5n) · weight(π̄ᴺ, [1/3n, 2/n])
```

**long-tailed 분포일 때:** τ₁ = Ω(1/n)이고 weight(π̄ᴺ, [0, 1/n]) = Ω(1)이므로, singleton을 대부분 fit하지 않는 알고리즘은 Ω(1) 만큼 suboptimal하다.

**long tail이 없을 때 (Lemma 3):** 1/n 부근에 빈도가 없으면 τ₁ ≤ 2θ로 매우 작아지므로, singleton을 fit하지 않아도 큰 손실이 없다.

## 3. 일반 Mixture 모델로의 확장

### 3.1 Subpopulation Coupling

실제 ML 문제는 고차원 연속 분포이므로, 개별 점의 확률은 지수적으로 작다. 이를 다루기 위해 **mixture 모델**로 확장한다.

데이터 분포를 M₁, ..., M_N개의 고정된 분포의 mixture로 모델링하되, mixture 계수 (α₁, ..., α_N)가 prior π에서 생성된다.

핵심 가정은 **Λ-subpopulation-coupling**: 데이터셋의 한 점에 대한 알고리즘의 예측이 동일 subpopulation의 다른 점에 대한 예측과 상관되어야 한다.

```
TV(Dist_{h~A(S)}[h(x)], Dist_{x'~M_x, h~A(S)}[h(x')]) ≤ 1 - λ_ℓ
```

**Theorem 3 (Mixture Model Extension):** Λ-subpopulation-coupled 알고리즘에 대해:

```
ε̄(π, F, A) ≥ opt(π, F) + E[Σ_ℓ λ_ℓ · τ_ℓ · errn_S(A, ℓ)]
```

### 3.2 Coupling이 성립하는 경우

**Local algorithms (k-NN 등):** Subpopulation이 충분히 클러스터링되어 있으면, 한 예제를 포함하는 것이 같은 subpopulation 전체의 예측에 영향을 미친다.

**Linear classifiers:** 고차원 (d ≫ n) 환경에서, 서로 다른 subpopulation의 점들이 충분히 비상관(uncorrelated)이면 subpopulation coupling이 성립한다. 구체적으로, (τ, τ²/(8√n))-independent인 데이터셋에서 margin을 근사적으로 최대화하는 선형 분류기는 λ₁ ≥ 1 - δ의 coupling을 달성한다 (Theorem 4).

## 4. Memorization, Privacy, Stability

앞서 memorization을 비형식적으로 논의했다면, 이 섹션에서는 label memorization의 형식적 정의를 제시하고, 학습 데이터를 fitting하는 것이 label에 대한 (통계적 또는 계산적) 불확실성이 충분할 때 label memorization을 필요로 한다는 것을 보인다. 이를 통해 알고리즘의 memorization 능력 제한이 (long-tailed 분포에서의) 정확도 손실로 이어짐을 보이며, differential privacy조차도 memorization을 잘 할 수 없게 만든다는 것을 증명한다.

### 4.1 Label Memorization 정의 (Definition 4.1)

알고리즘 A가 label을 memorize하는 정도를, 라벨링된 예제 (x, y)가 모델의 x에 대한 예측에 **얼마나 영향을 미치는지**로 측정한다:

```
mem(A, S, i) := Pr_{h~A(S)}[h(x_i) = y_i] - Pr_{h~A(S\i)}[h(x_i) = y_i]
```

여기서 S\i는 S에서 (x_i, y_i)를 제거한 데이터셋이다. 이 값은 label이 y인 indicator의 분포 간 total variation distance로 측정된다. 엄밀히 말하면 memorization 값은 음수가 될 수 있지만 (이 경우 TV distance의 부정), 대부분의 실용적 알고리즘에서는 비음수일 것으로 기대한다.

이 정의는 leave-one-out stability와 밀접하게 연관된다. LOO stability는 기대 memorization의 상한을 제공한다:

```
(1/n) · E_{S~P^n}[Σ_{i∈[n]} mem(A, S, i)] ≤ LOOstab(P, A)
```

**Lemma 4.2 (Memorization과 Generalization Gap의 관계):** 모든 분포 P와 학습 알고리즘 A에 대해:

```
(1/n) · E_{S~P^n}[Σ_{i∈[n]} mem(A, S, i)] = E_{S~P^n}[err_S(A, S)] - E_{S'~P^{n-1}}[err_P(A, S')]
```

여기서 err_S(A, S)는 A의 S에 대한 기대 경험적 오류이다. 우변의 E[err_P(A, S')]는 기대 일반화 오류와 거의 같으므로 (차이 < 1/n), **큰 generalization gap은 많은 label이 memorize되었음을 의미하고, 그 역도 성립한다.**

**Lemma 4.3 (Fitting에는 Memorization이 필요하다):** A가 x_i의 label을 관찰 없이 예측할 수 없다면, 해당 label을 fit하려면 memorize해야 한다:

```
Pr_{h~A(S)}[h(x_i) ≠ y_i] = Pr_{h~A(S\i)}[h(x_i) ≠ y_i] - mem(A, S, i)
```

특히 singleton 예제에 대해:

```
errn_S(A, 1) = Σ_{i: x_i ∈ X_{S#1}} [Pr_{h~A(S\i)}[h(x_i) ≠ y_i] - mem(A, S, i)]
```

알고리즘이 x_i의 label을 관찰 없이 예측하지 못하는 이유는 두 가지가 있다. 첫째, **통계적 불확실성** — label 분포 ρ에서의 불확실성을 ‖ρ‖_∞ := max_{y∈Y} ρ(y)로 측정하며, 1 - ‖ρ‖_∞는 Bayes optimal predictor의 오류와 정확히 같다. 둘째, **계산적 한계** — 데이터를 잘 설명하는 간단한 모델이 존재하더라도 학습 알고리즘이 이를 찾을 수 없는 경우이다. 예를 들어 pseudo-random labeling function [Goldreich et al., 1986]을 사용하면 모든 다항 시간 알고리즘에 대해 uniform prior가 달성된다.

**Lemma 4.4 (불확실성과 memorization의 관계):** 임의의 label 분포 ρ에 대해:

```
Pr_{y~ρ, h~A(S^{i←y})}[h(x) ≠ y] ≥ 1 - ‖ρ‖_∞ - E_{y~ρ}[mem(A, S^{i←y}, i)]
```

여기서 S^{i←y}는 S에서 i번째 예제의 label을 y로 바꾼 데이터셋이다. 이를 전체 singleton에 확장하면:

```
E[errn_S(A, 1)] ≥ E[Σ_{i: x_i ∈ X_{S#1}} (1 - ‖F(x_i|S\i)‖_∞ - mem(A, S, i))]
```

여기서 F(x_i|S\i)는 다른 모든 예제를 관찰한 후 x_i의 label에 대한 조건부 분포이다. 증명의 핵심 단계: Definition 4.1로부터 Pr[h(x)=y] = Pr_{A(S\i)}[h(x)=y] + mem(A,S^{i←y},i)이므로, ρ에 대한 기대를 취하면 max_{y'} Pr[y'=y]로 상한이 잡히고, 이것이 ‖ρ‖_∞이다.

### 4.2 Memorization 제한의 비용

**Definition 4.5 (γ-memorization limited):** 알고리즘 A가 모든 S ∈ (X,Y)^n과 모든 i ∈ [n]에 대해 mem(A, S, i) ≤ γ이면 γ-memorization limited라 한다.

이러한 memorization 제한은 다양한 기법에서 자연스럽게 발생한다: 명시적/암시적 정규화, 모델 압축 등. 간단히 말해, 이러한 기법은 정규화 파라미터 λ로 스케일링된 capacity와 경험적 오류의 합을 최소화하는 것으로 볼 수 있다. 나머지 데이터셋으로 정확히 예측되지 않는 label을 fitting하려면 capacity를 증가시켜야 하므로, 정규화된 알고리즘은 capacity 증가(× λ)가 경험적 오류 감소를 상회하지 않으면 해당 예제를 fit하지 않는다.

**Corollary 4.6 (γ-memorization limited 알고리즘의 excess error):** Theorem 2.4의 설정에서, A가 γ-memorization limited이면:

```
ε̄(π, F, A) ≥ opt(π, F) + τ₁ · E[Σ_{i: x_i ∈ X_{S#1}} conf(S,i,F) · (1 - ‖F(x_i|S\i)‖_∞ - γ)]
```

이 bound에서 label의 불확실성 1 - ‖F(x_i|S\i)‖_∞가 핵심이다. 예를 들어 f ~ F에서 labeling이 uniform이고 k-wise independent (k가 전형적인 distinct point 수의 상한)이면, 높은 확률로 ‖F(x_i|S\i)‖_∞ = 1/|Y|이 된다.

**핵심 결론:** Section 2.5에서 논의한 대로, Zipf prior에서 N ≥ n이면:

- γ < 1 - 1/|Y|인 모든 γ-memorization limited 알고리즘은 **Ω(1) 만큼의 excess error**를 갖는다
- 최적 일반화 오류를 달성하는 모든 알고리즘은 **Ω(n)개의 label을 memorize**해야 한다
- 특히 generalization gap이 **Ω(1)**이어야 한다

이 결론들은 **노이즈가 있는 경우에도 유지**된다. Random classification noise 모델 (올바른 label f(x)가 확률 1-κ로 랜덤 label로 교체됨)에서, singleton 예제에 대해 conf(S,i,F) ≥ κ이다. 따라서 κ = Ω(1)인 한 noisy label도 memorize해야 한다.

### 4.3 Differential Privacy의 비용

학습 데이터의 memorization은 privacy 관점에서 바람직하지 않을 수 있다. Memorization은 **black-box membership inference attack** (데이터셋 내 특정 데이터 포인트의 존재를 발견하는 공격) [Shokri et al., 2017; Long et al., 2017, 2018; Truex et al., 2018]과 언어 모델에서 **planted secrets 추출** [Carlini et al., 2019]을 가능하게 한다.

이에 대한 가장 일반적인 방어는 **differential privacy (DP)** [Dwork et al., 2006]이며, 학습 알고리즘의 출력 분포가 개별 데이터 포인트에 너무 민감하지 않도록 요구한다. 하지만 DP로 학습한 모델은 여전히 비-DP 모델에 비해 상당히 뒤처진다.

저자는 이 격차의 일부가 데이터의 long-tailed 특성으로 인해 **본질적(inherent)**임을 보인다. 이를 위해 매우 약한 형태의 privacy — **label privacy for predictions** — 만으로도 memorization이 제한됨을 증명한다.

**Definition 4.7 ((ε,δ)-differentially label-private prediction):** 알고리즘 A가 label 하나만 다른 데이터셋 S, S'에 대해, 모든 x ∈ X와 label 부분집합 Y'에 대해:

```
Pr_{h~A(S)}[h(x) ∈ Y'] ≤ e^ε · Pr_{h~A(S')}[h(x) ∈ Y'] + δ
```

이를 만족하면 A는 (e^ε - 1 + δ)-memorization limited이다.

**Theorem 4.8 (DP의 memorization 제한):** (ε, δ)-differentially label-private prediction 알고리즘 A와 임의의 label 분포 ρ에 대해:

```
Pr_{y~ρ, h~A(S^{i←y})}[h(x) = y] ≤ e^ε · ‖ρ‖_∞ + δ
```

이로부터:

```
E[errn_S(A, 1)] ≥ E[Σ_{i: x_i ∈ X_{S#1}} (1 - e^ε · ‖F(x_i|S\i)‖_∞ - δ)]
```

그리고 최종적으로:

```
ε̄(π, F, A) ≥ opt(π, F) + τ₁ · E[Σ_{i: x_i ∈ X_{S#1}} conf(S,i,F) · (1 - e^ε · ‖F(x_i|S\i)‖_∞ - δ)]
```

증명의 핵심: DP의 정의에 의해 Pr[h(x)=y] ≤ e^ε · Pr_{A(S)}[h(x)=y] + δ이므로, ρ에 대한 기대를 취하면 e^ε · ‖ρ‖_∞ + δ로 상한이 잡힌다.

**ℓ개 예제로의 확장:** Group privacy 성질을 사용하면, ℓ개의 label이 바뀌었을 때 결과 분포가 (ℓε, ℓ·e^{ℓ-1}·δ)-close하므로, 소수의 ℓ개 예제만 관찰된 subpopulation의 총 가중치가 대부분의 현대 데이터셋에서 상당하다. 따라서 이 결과는 DP 학습 알고리즘과 비-DP 알고리즘 간의 격차를 적어도 부분적으로 형식적으로 설명한다.

**Uniform stability와의 관계:** Uniform prediction stability [Bousquet & Elisseeff, 2002; Dwork & Feldman, 2018]는 데이터셋의 어떤 점을 변경해도 어떤 점에서의 label 분포가 TV distance γ 이상 변하지 않도록 요구한다. γ-uniform stability는 γ-memorization limited를 함의하고 (0, γ)-differentially private for predictions도 함의하므로, Corollary 4.6이 이러한 알고리즘의 한계도 설명한다.

### 4.4 Disparate Effect: 소수 그룹에 대한 불균형적 영향

Corollary 4.6과 Theorem 4.8은 memorization 제한이 long-tailed 분포에서 일반화 오류를 증가시킴을 보인다. 더 중요한 것은, excess error가 prior π, 문제의 난이도, 샘플 수 n에 의존하므로, **데이터 분포가 여러 subgroup의 mixture일 때 memorization 제한의 비용이 subgroup마다 다를 수 있다**는 것이다. 특히 더 작은 subgroup이나 더 다양한 subpopulation을 가진 subgroup에서 비용이 높아진다. DP에 대해서는 [Bagdasaryan & Shmatikov, 2019], 모델 압축에 대해서는 [Hooker et al., 2020a, 2020b]에서 이러한 효과가 경험적으로 확인되었으며, 오류 증가가 **비전형적 예제에서 가장 두드러진다**는 것도 실증되었다.

**수치 예시:** 10-class 분류, N = 5,000 subpopulation, Zipf prior, γ = 0.5 (γ 선택은 모든 subgroup의 excess error를 동일한 비율로 스케일링하므로 비교에 영향 없음)

| 시나리오 | opt(π, F) | 제한된 memorization 비용 |
|----------|-----------|------------------------|
| 기본 (N=5000, n=50000) | ≈ 0.018 | ≈ 0.015 |
| 더 적은 샘플 (N=5000, n=10000) | ≈ 0.113 | ≈ 0.035 |
| 더 어려운 문제 (N=25000, n=50000) | ≈ 0.107 | ≈ 0.031 |

**혼합 시나리오 분석:**

- **P = 5/6·P₁ + 1/6·P₂** (기본 + 적은 샘플, n=60,000): 각 subgroup의 최적 오류와 memorization 비용은 동일하게 유지되나, **작은 subgroup에서 memorization 제한 비용이 2배 이상** 높다
- **P = 1/2·P₁ + 1/2·P₃** (기본 + 어려운 문제, n=100,000): **더 어려운 subgroup에서 memorization 제한 비용이 2배** 높다

10개 클래스에서 γ = 0.5의 memorization 비용은 ε = ln(6), δ ≈ 0인 (label) differential privacy for predictions의 비용과 같으므로, Theorem 4.8로부터도 동일한 결론이 따른다.

이러한 disparate effect의 원인을 이해하면 완화 전략을 설계할 수 있다. 예를 들어, 서로 다른 subgroup에 **서로 다른 수준의 정규화(또는 압축)**를 적용하여 비용을 균형화하거나, **서로 다른 privacy parameter**를 subgroup별로 사용할 수 있다 (추가적인 privacy 위반 위험이 정확도 향상으로 정당화되는 경우).

## 5. 경험적 증거

### 5.1 Differentially Private Training의 한계

DP 학습 알고리즘은 interpolation 없이 최신 결과를 달성하는 몇 안 되는 방법이지만, 정확도가 상당히 뒤처진다:

| 데이터셋 | DP 알고리즘 정확도 | 비-DP 정확도 |
|---------|-------------------|-------------|
| MNIST | 98% | 99.2% |
| SVHN | 82.7% | 92.8% |

![Figure 2: DP 알고리즘이 가장 어려워하는 예제 — MNIST 숫자 3](/images/papers/learning-memorization/fig2-dp-mnist3.jpg)
![Figure 2: DP 알고리즘이 가장 어려워하는 예제 — CIFAR-10 비행기](/images/papers/learning-memorization/fig2-dp-cifar-planes.jpg)
*Figure 2: DP 모델이 예측하기 가장 어려운 예제(왼쪽)와 가장 쉬운 예제(오른쪽). MNIST 숫자 "3"(위)과 CIFAR-10 "plane"(아래). [Carlini et al., 2019]에서 인용.*

DP 모델이 실패하는 예제는 **outlier 또는 비전형적 예제**이며, 이는 long-tail 이론의 예측과 정확히 일치한다.

### 5.2 후속 실증 연구 [Feldman & Zhang, 2020]

저자와 Chiyuan Zhang의 후속 연구에서 memorization score의 효율적 proxy를 사용하여 MNIST, CIFAR-10/100, ImageNet에서 memorize된 예제를 발견했다:

- 시각적 검사: memorize된 예제는 outlier/잘못 라벨링된 예제와 올바르게 라벨링되었지만 비전형적인 예제의 혼합
- memorize된 예제를 학습 세트에서 제거하면 모델 정확도가 유의하게 감소
- 학습 세트의 memorize된 예제와 테스트 세트의 "dependent" 예제 쌍이 존재: 학습 예제를 제거하면 해당 테스트 예제의 정확도가 크게 하락

## 6. 표준 일반화 분석과의 비교

저자는 표준 접근법이 이 현상을 포착할 수 없음을 보인다:

**Distribution-independent bounds:** N ≥ n이면 균등 분포에서의 일반화 오류가 ≈ 0.5이므로, 알고리즘 간 차이가 무의미하다.

**Distribution-dependent bounds:** D를 알면 빈도 1/n² 점을 fit할 필요가 없어 excess error ≤ 1/n이 되지만, 실제로 알고리즘은 D를 모르므로 적용 불가.

**Rademacher complexity / LOO stability:** 이들은 "outlier"와 "atypical" singleton을 구분할 수 없어, outlier에서의 fitting 이득이 0이므로 singleton fitting을 권장하지 않게 된다. 또한 최적 알고리즘의 오류가 25% 이상인데 Bayes optimal (0%)과 비교하므로 vacuous한 bound를 제공한다.

## 7. Discussion

### 한계

- 비구조적 이산 도메인에서의 이론이므로 실제 고차원 연속 문제에 직접 적용하려면 mixture model 확장이 필요하다
- Subpopulation coupling 가정의 검증이 실제 데이터에서는 어렵다
- 최적 알고리즘의 정확한 오류를 계산하는 것은 prior π를 모르면 불가능하다

### 함의

**첫째, memorization의 이론적 정당화.** 학습 알고리즘이 outlier와 noisy label까지 memorize하는 것은 결함이 아니라, long-tailed 자연 데이터에서 최적 일반화를 달성하기 위한 필수 전략이다.

**둘째, Privacy-Utility Trade-off의 형식화.** DP가 memorization을 제한하므로 long-tailed 분포에서 반드시 정확도가 하락하며, 이 하락은 소수 subgroup에서 더 크다.

**셋째, 일반화 이론의 새로운 방향.** 빈도 분포에 대한 prior를 명시적으로 모델링하는 것이 고전적 일반화 이론의 한계를 극복하는 열쇠임을 제안한다.

## 논문 참조

- **Feldman, 2020** — Does Learning Require Memorization? A Short Tale about a Long Tail (STOC 2020): [https://arxiv.org/abs/2003.05753](https://arxiv.org/abs/2003.05753)
- **Feldman & Zhang, 2020** — What Neural Networks Memorize and Why: [https://arxiv.org/abs/2008.03703](https://arxiv.org/abs/2008.03703)
- **Zhang et al., 2017** — Understanding deep learning requires rethinking generalization: [https://arxiv.org/abs/1611.03530](https://arxiv.org/abs/1611.03530)
- **Carlini et al., 2019** — Distribution Density, Tails, and Outliers in Machine Learning: [https://arxiv.org/abs/1910.13427](https://arxiv.org/abs/1910.13427)
- **Bagdasaryan & Shmatikov, 2019** — Differential Privacy Has Disparate Impact on Model Accuracy: [https://arxiv.org/abs/1905.12101](https://arxiv.org/abs/1905.12101)
- **Hooker et al., 2020** — Characterising Bias in Compressed Models: [https://arxiv.org/abs/2010.03058](https://arxiv.org/abs/2010.03058)

## 개인 코멘트

이 논문은 ACR memorization 논문과 상호 보완적으로 읽을 수 있다. ACR 논문이 "모델이 학습 데이터를 memorize했는가?"를 **측정**하는 도구를 제공한다면, Feldman의 이 논문은 "왜 memorize해야 하는가?"에 대한 **이론적 정당성**을 제공한다. 특히 long tail 이론은 단순히 memorization 현상을 설명하는 데 그치지 않고, differential privacy와 model compression이 소수 그룹에 불균형적 영향을 미치는 이유까지 설명하는 점에서 실용적 가치가 크다.

다만 이론이 비구조적 이산 도메인에서 출발하기 때문에, 실제 딥러닝 환경에서의 적용에는 mixture model 확장과 subpopulation coupling이라는 추가 가정이 필요하다는 점은 한계로 남는다. 후속 연구 [Feldman & Zhang, 2020]에서 이러한 이론적 예측을 실증적으로 확인한 것은 이 이론의 설득력을 크게 높인다.
