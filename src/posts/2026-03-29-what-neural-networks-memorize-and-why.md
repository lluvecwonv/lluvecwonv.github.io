---
title: "What Neural Networks Memorize and Why: Discovering the Long Tail via Influence Estimation"
date: 2026-03-29
summary: "딥러닝 알고리즘의 레이블 암기(label memorization) 현상이 long-tailed 데이터 분포에서 최적 일반화를 위해 필수적이라는 이론(long tail theory)을 최초로 실증적으로 검증한 논문. 서브샘플링 기반 memorization 및 influence 추정기를 설계하여 MNIST, CIFAR-100, ImageNet에서 2,000–4,000개 모델을 학습. 암기된 예제가 무작위 예제보다 높은 한계 유용성을 가지며, 암기된 학습 예제가 시각적으로 유사한 테스트 예제의 정확도를 크게 향상시키는 high-influence pair를 대량 발견. 대부분의 암기가 마지막 층이 아닌 깊은 표현(deep representation)에서 발생함을 실험적으로 입증."
tags: [Deep Learning, Memorization, Long Tail, Influence Estimation, Generalization, Privacy, ImageNet, CIFAR-100, 연구노트]
category: 연구노트
language: ko
---

# What Neural Networks Memorize and Why: Discovering the Long Tail via Influence Estimation

**저자:** Vitaly Feldman* (Apple), Chiyuan Zhang* (Google Research, Brain Team)
**arXiv:** [2008.03703](https://arxiv.org/abs/2008.03703)
**코드/사이트:** [pluskid.github.io/influence-memorization](https://pluskid.github.io/influence-memorization/)

---

## 한 줄 요약

딥러닝 알고리즘의 **레이블 암기(label memorization)** 현상이 단순한 과적합이 아니라, **long-tailed 분포**에서 최적 일반화를 달성하기 위해 **필수적**이라는 이론을 서브샘플링 기반 influence estimation을 통해 **최초로 실증적으로 검증**한 연구.

---

## 1. 서론: 왜 신경망은 암기하는가?

딥러닝 알고리즘의 가장 매혹적인 측면은 보지 못한 데이터에 대한 일반화 능력이다. 하지만 동시에 학습 데이터를 매우 잘 피팅하여, 보통 95–100%의 학습 정확도를 달성하며, 이상치(outlier)나 잘못 라벨링된(mislabeled) 예제까지도 피팅한다. 나머지 데이터셋으로 레이블을 예측할 수 없는 예제를 피팅하는 유일한 방법은 레이블을 **암기(memorize)**하는 것이다.

**기존 이해와의 모순:** 고전적 일반화 이론은 일반화 오차를 모델 복잡도(또는 안정성)에 의해 제어되는 일반화 갭과 경험적 오차의 합으로 상한을 설정한다. 이상치와 오라벨 예제의 피팅은 일반화 오차를 개선하지 않으므로, "과적합"을 피하려면 레이블 암기를 방지해야 한다고 본다. **암기는 일반적으로 일반화의 반대**로 여겨진다.

**Feldman (2020)의 Long Tail Theory:** 데이터 분포가 **long-tailed**일 때 — 즉 희귀하고 비전형적인 인스턴스가 상당 비율을 차지할 때 — 암기가 최적에 가까운 일반화 오차를 달성하기 위해 **필수적**이라는 이론. 이러한 분포에서 "long tail"의 유용한 예제(암기하면 일반화 오차가 개선되는)는 이상치나 오라벨 예제와 **통계적으로 구분 불가능**하다. 따라서 쓸모없는 예제의 암기(와 결과적인 큰 일반화 갭)도 최적 일반화를 위해 필수적이다.

그러나 이 이론은 추상적 모델에서만 이론적으로 증명되었을 뿐, **직접적인 실증적 증거**는 제시되지 않았다. 본 논문은 이 이론을 실험적으로 검증하기 위한 접근법을 설계한다.

---

## 2. 추정기 설계: Subsampled Memorization & Influence

### 2.1 레이블 암기(Label Memorization) 정의

Feldman (2020)의 정의를 따른다. 학습 알고리즘 $\mathcal{A}$가 데이터셋 $S = ((x_1, y_1), \ldots, (x_n, y_n))$에서 예제 $(x_i, y_i)$에 대한 레이블 암기량:

$$\text{mem}(\mathcal{A}, S, i) := \Pr_{h \leftarrow \mathcal{A}(S)}[h(x_i) = y_i] - \Pr_{h \leftarrow \mathcal{A}(S^{\setminus i})}[h(x_i) = y_i]$$

여기서 $S^{\setminus i}$는 $(x_i, y_i)$가 제거된 데이터셋이다. **직관**: 알고리즘이 나머지 데이터셋 기반 예측에서 $(x_i, y_i)$가 추가되면 크게 변할 때 레이블을 암기한다.

### 2.2 직접 추정의 계산적 불가능성

표준편차 $\sigma$로 memorization 추정 시 모든 $n$개 예제에 대해 $\Omega(n/\sigma^2)$회 학습 필요. $n = 50,000$, $\sigma < 0.1$이면 **수백만 회** 학습 필요 → 계산적으로 불가능.

### 2.3 Subsampled Influence 추정기

**핵심 아이디어:** 전체 데이터셋 $S$ 대신, $S$의 크기 $m$인 **무작위 부분집합**에 대한 기대 영향을 측정한다.

$$\text{infl}_m(\mathcal{A}, S, i, z) := \mathbb{E}_{I \sim P([n] \setminus \{i\}, m-1)} \left[ \text{infl}(\mathcal{A}, S_{I \cup \{i\}}, i, z) \right]$$

**Lemma 1:** $t$회 학습만으로 **모든** $n$개 예제의 추정을 동시에 표준편차 $\sigma$로 달성 가능. $O(1/\sigma^2)$회 학습이면 충분.

**Algorithm 1 (핵심 알고리즘):**

1. $t$개의 크기 $m$인 무작위 부분집합 $I_1, \ldots, I_t$를 샘플링
2. 각 부분집합에서 모델 $h_k$를 학습
3. 각 학습 예제 $i$에 대해:
   - **암기 추정**: $\widetilde{\text{mem}}_m(i) = \Pr_{k}[h_k(x_i) = y_i \mid i \in I_k] - \Pr_{k}[h_k(x_i) = y_i \mid i \notin I_k]$
   - **영향 추정**: $\widetilde{\text{infl}}_m(i, j) = \Pr_{k}[h_k(x'_j) = y'_j \mid i \in I_k] - \Pr_{k}[h_k(x'_j) = y'_j \mid i \notin I_k]$

**참고:** $m = n/2$일 때 이 추정기는 예제 $(x_i, y_i)$의 정확도 함수에 대한 **Shapley value**와 밀접하게 관련된다.

### 2.4 실험 파라미터

| 파라미터 | MNIST / CIFAR-100 | ImageNet |
|---|---|---|
| 부분집합 크기 $m$ | $0.7n$ | $0.7n$ |
| 학습 횟수 $t$ | 4,000 | 2,000 |
| 암기 임계값 $\theta_{\text{mem}}$ | 0.25 | 0.25 |
| 영향 임계값 $\theta_{\text{infl}}$ | 0.15 | 0.15 |

$\theta_{\text{infl}} = 0.15$의 선택 근거: CIFAR-100에서 2,000회 학습을 두 번 독립적으로 수행 시, 이 임계값에서 선택된 쌍의 **Jaccard 유사도 계수 ≥ 0.7** (1,095개와 1,062개 쌍 선택, ~82%가 양쪽 모두에 존재).

---

## 3. 실험 결과

### 3.1 실험 환경

- **모델:** ResNet50 (ImageNet, CIFAR-100), Inception (MNIST)
- **데이터셋:** MNIST (60K 학습), CIFAR-100 (50K 학습), ImageNet (1.28M 학습)
- **학습 횟수:** MNIST/CIFAR-100: 4,000회, ImageNet: 2,000회

### 3.2 암기 값 추정 예시

![Memorization value examples](/images/papers/what-nn-memorize/imagenet-memscore-class450-bobsled.png)
*Figure 1 (상): ImageNet "bobsled" 클래스의 암기 값 예시*

![CIFAR-100 memorization](/images/papers/what-nn-memorize/cifar100-memscore-class6-bee.png)
*Figure 1 (좌하): CIFAR-100 "bee" 클래스의 암기 값 예시*

![MNIST memorization](/images/papers/what-nn-memorize/mnist-memscore-fig1.png)
*Figure 1 (우하): MNIST 클래스 2, 3, 5, 6의 암기 값 예시*

**관찰:**
- 암기 추정값 ≈ 0인 예제: 명확히 **전형적(typical)**인 이미지
- 암기 추정값 ≈ 1인 예제: **비전형적(atypical)**, 매우 모호하거나, 잘못 라벨링된 이미지
- 암기 추정값 ≈ 0.5인 예제: 약간 비전형적이지만 해석 가능

### 3.3 암기된 예제의 한계 유용성(Marginal Utility)

![Marginal utility of memorized examples](/images/papers/what-nn-memorize/memscore-subset-plot-imagenet-comb.png)
*Figure 2 (ImageNet): 암기 값 임계값 이상의 예제 제거 시 테스트 정확도 변화*

![CIFAR-100 removal](/images/papers/what-nn-memorize/memscore-subset-plot-cifar100-comb.png)
*Figure 2 (CIFAR-100): 동일 실험*

![MNIST removal](/images/papers/what-nn-memorize/memscore-subset-plot-mnist-comb.png)
*Figure 2 (MNIST): 동일 실험*

| 데이터셋 | 암기 ≥ 0.3 비율 | 제거 시 정확도 하락 | 동일 수 랜덤 제거 시 하락 |
|---|---|---|---|
| ImageNet | ~32% | ~3.4% | ~2.6% |
| CIFAR-100 | 상당 | 유의미 | 더 작음 |
| MNIST | 매우 적음 | 미미 | 미미 |

**핵심 발견: 암기된 예제의 한계 유용성이 동일 수의 무작위 예제보다 높다.** 무작위 예제의 대부분은 쉬운 예제여서 한계 유용성이 없기 때문이다. MNIST는 데이터 변동성이 낮아(클래스당 예제 수 풍부, subpopulation 수 적음) 암기의 역할이 훨씬 작다.

---

## 4. High-Influence Pair 발견

### 4.1 선택 기준

학습-테스트 예제 쌍 $(x_i, y_i)$와 $(x'_j, y'_j)$에서:
1. $\widetilde{\text{mem}}_m(\mathcal{A}, S, i) \geq 0.25$ (유의미한 암기)
2. $\widetilde{\text{infl}}_m(\mathcal{A}, S, i, j) \geq 0.15$ (유의미한 영향)
3. $y_i = y'_j$ (같은 클래스)

### 4.2 발견된 High-Influence Pair 수

| 데이터셋 | 발견된 쌍 수 | 고유 테스트 예제 수 (테스트셋 비율) | 단일 학습 예제에만 영향받는 수 |
|---|---|---|---|
| MNIST | 35 | 33 (0.33%) | 31 |
| CIFAR-100 | 1,015 | 888 (8.88%) | 774 |
| ImageNet | 1,641 | 1,462 (2.92%) | 1,298 |

![Influence histograms](/images/papers/what-nn-memorize/influence-hist-imagenet-18bins.png)
*Figure 3 (ImageNet): 선택된 high-influence 쌍의 영향 추정치 히스토그램*

![CIFAR-100 influence histogram](/images/papers/what-nn-memorize/influence-hist-cifar100_resnet50_jn05_4k-18bins.png)
*Figure 3 (CIFAR-100)*

**핵심 발견:**
- 영향받는 테스트 예제 중 대부분이 **단 하나의 학습 예제**에 의해서만 유의미하게 영향받음 (CIFAR-100: 774/888, ImageNet: 1298/1462)
- 이러한 **고유 대표성(unique representative)**은 long tail theory의 핵심 예측과 정확히 일치: 희귀 subpopulation의 유일한 대표자가 해당 subpopulation의 정확도를 크게 높이며, 이러한 대표자는 이상치/오라벨과 통계적으로 구분 불가능

### 4.3 High-Influence 학습 예제의 한계 유용성 검증

CIFAR-100에서 정량적 검증:

| 학습 세트 | 전체 테스트 정확도 | High-influence 테스트 예제 정확도 |
|---|---|---|
| 전체 $S$ | 76.06 ± 0.28% | 72.14 ± 1.32% |
| $S \setminus S_h$ (high-influence 학습 예제 제거) | 73.52 ± 0.25% | 45.38 ± 1.45% |
| **차이** | **2.54 ± 0.2%** | **26.76 ± 1.96%** |

High-influence 테스트 예제에서의 정확도 차이 기여분: $2.38 \pm 0.17\%$ → 전체 차이 $2.54 \pm 0.2\%$의 1 표준편차 이내. **즉, 검출된 high-influence가 $S_h$의 한계 유용성을 거의 완전히 포착한다.**

### 4.4 High-Influence Pair의 시각적 분석

![MNIST influence examples](/images/papers/what-nn-memorize/mnist-influence-newfig1.png)
*Figure 4: MNIST high-influence 쌍 예시. 왼쪽 열: 암기된 학습 예제(위에 암기 추정치). 각 학습 예제에 대해 가장 영향받는 테스트 예제 4개(위에 영향 추정치).*

![CIFAR-100 influence examples](/images/papers/what-nn-memorize/cifar100-influence-newfig1.png)
*Figure 5: CIFAR-100 high-influence 쌍 예시*

![ImageNet influence examples](/images/papers/what-nn-memorize/imagenet-influence-newfig1.png)
*Figure 6: ImageNet high-influence 쌍 예시*

**시각적 관찰:**
- **매우 높은 영향 (> 0.4)**: 거의 항상 거의-중복(near duplicate) 또는 함께 촬영된 사진 세트. CIFAR-100에 특히 많음
- **중간~낮은 영향 (0.15–0.4, 전체의 80% 이상)**: 시각적으로 매우 유사하지만 같은 세트가 아닌 경우가 대부분
- 예제들은 체리피킹 없이 선택됨: 영향 크기 순으로 정렬 후 균등 간격으로 추출

---

## 5. 아키텍처 간 일관성

CIFAR-100에서 ResNet50, ResNet18, Inception, DenseNet100 간 비교:

![Cross-architecture consistency](/images/papers/what-nn-memorize/cross-arch-mem-jaccard.png)
*Figure 7 (좌): 아키텍처 간 암기 추정 Jaccard 유사도*

![Cross-architecture score diff](/images/papers/what-nn-memorize/cross-arch-mem-score_diff.png)
*Figure 7 (우): 아키텍처 간 암기 추정 평균 차이*

**발견:**
- 같은 아키텍처(ResNet50)의 두 독립 실행 간: 높은 일관성, 선택 편향 거의 없음
- **다른 아키텍처 간에도 암기된 예제와 high-influence 쌍에 강한 상관관계** 존재
- 추정치의 차이는 아키텍처 간 **정확도 차이**와 밀접하게 상관
- **시사점:** 유사한 정확도를 달성하는 한 아키텍처 변동에 크게 민감하지 않음

---

## 6. 마지막 층만으로 충분한가?

### 6.1 실험 설계

계산 속도를 높이기 위한 시도: 전체 CIFAR-100 학습 세트에서 ResNet50을 학습한 후, 끝에서 두 번째 층의 출력을 **표현(representation)**으로 사용하고, 무작위 부분집합에서 **마지막 선형 층만** 새로 학습. 학습 시간 **720배 절감**.

### 6.2 결과

| 방법 | 테스트 정확도 | 암기 ≥ 0.25 예제 수 | High-influence 쌍 수 |
|---|---|---|---|
| 전체 ResNet50 (70% 학습) | 72.3 ± 0.3% | 18,099 | 1,015 |
| 선형 분류기 (70% 학습) | 75.8 ± 0.1% | **38** | 457 |
| 전체 ResNet50 (100% 학습) | 75.9% | — | — |

**핵심 발견:**
- 선형 모델은 **암기된 예제를 감지하는 데 완전히 실패** (18,099 vs. 38)
- 선형 모델의 high-influence 쌍에서도 대부분 시각적 유사성이 관찰되지 않음
- **결론: 대부분의 암기는 마지막 층이 아닌 깊은 표현(deep representation)에서 발생한다.** 학습된 표현에서 암기된 예제의 표현이 같은 클래스의 다른 예제와 이미 가까워져 있음

---

## 7. 논의 및 결론

### 7.1 주요 기여

1. **Long tail theory의 최초 실증적 검증**: 형식적으로 정의되고 직관적인 기준에 기반한 memorization과 그 정확도 효과에 대한 최초의 실증 연구
2. **효율적 추정기 설계**: $O(1/\sigma^2)$회 학습으로 모든 예제의 memorization/influence를 동시 추정
3. **실증적 발견들**:
   - 암기된 예제가 무작위 예제보다 높은 한계 유용성
   - 시각적으로 유사한 학습-테스트 쌍에서의 high-influence 대량 발견
   - 대부분의 영향받는 테스트 예제가 단일 학습 예제에 의존 (unique representative)
4. **마지막 층 실험**: 암기가 deep representation에서 발생한다는 증거

### 7.2 사회적 함의

학습 알고리즘의 암기 능력을 제한하는 기법(모델 압축, differential privacy 등)은 **과소 대표된 subpopulation에 불균형적인 영향**을 미칠 수 있다. 이는 이미 differential privacy 맥락에서 알려져 있으며(Bagdasaryan et al., 2019), 본 논문의 결과는 이를 더 넓은 맥락으로 확장한다.

### 7.3 관련 연구와의 비교

- **Zhang et al. (2017)**: 신경망이 무작위 라벨도 피팅함을 보임 → 본 논문은 왜 이런 피팅이 유익한지 설명
- **Influence Functions (Koh & Liang, 2017)**: Hessian 역행렬 기반 → 본 논문은 서브샘플링 기반으로 더 신뢰성 있는 추정
- **Carlini et al. (2019)**: 다양한 "prototypicality" 메트릭 비교, 영향 추정 시도 실패 → 본 논문은 계산적으로 실행 가능한 방법 제시
- **Forgetting (Toneva et al., 2019)**: "forgotten" 예제와 한계 유용성 연구 → 본 논문의 암기 정의와는 직접적으로 관련 없음

---

## 8. 총평

이 논문은 딥러닝의 근본적 질문 — "왜 신경망은 암기하는가?" — 에 대한 설득력 있는 실증적 답변을 제공한다. Long tail theory를 서브샘플링 기반 추정기라는 우아한 방법론으로 검증하여, **암기가 과적합의 부산물이 아니라 long-tailed 분포에서의 최적 일반화를 위한 필수 메커니즘**임을 보였다.

특히 ImageNet에서 1,641개의 high-influence 쌍을 발견하고, 그 중 1,298개의 테스트 예제가 단 하나의 학습 예제에만 의존한다는 결과는 이론적 예측과 놀라울 정도로 정확하게 일치한다. 마지막 층 실험에서 암기가 deep representation에서 발생한다는 발견도 모델의 내부 메커니즘에 대한 중요한 통찰을 제공한다.

Feldman (2020)의 이론적 연구와 함께 읽으면, 딥러닝에서의 암기·일반화 관계에 대한 가장 포괄적인 이해를 얻을 수 있다.
