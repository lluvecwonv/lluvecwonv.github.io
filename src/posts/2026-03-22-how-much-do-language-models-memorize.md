---
title: "How Much Do Language Models Memorize? 논문 정리"
date: 2026-03-22
summary: "FAIR at Meta, Google DeepMind, Cornell University의 논문. 언어모델이 데이터를 얼마나 기억하는지 정량적으로 측정하는 새로운 프레임워크를 제안한다. 기억화(memorization)를 unintended memorization(비의도적 기억)과 generalization(일반화)으로 분리하고, 압축 기반 정보이론을 활용하여 모델 용량(capacity)을 측정한다. GPT 계열 모델의 용량은 약 3.6 bits-per-parameter이며, 데이터 크기가 모델 용량을 초과할 때 double descent가 시작됨을 보인다. 또한 membership inference에 대한 스케일링 법칙을 제안하고 대형 모델에서 검증한다."
tags: [LLM, Memorization, Capacity, Information Theory, Kolmogorov Complexity, Scaling Laws, Membership Inference, Privacy, 연구노트]
category: 연구노트
language: ko
---

# How Much Do Language Models Memorize?

**논문:** Morris et al.
**저자:** John X. Morris, Chawin Sitawarin, Chuan Guo, Narine Kokhlikyan, G. Edward Suh, Alexander M. Rush, Kamalika Chaudhuri, Saeed Mahloujifar
**소속:** FAIR at Meta, Google DeepMind, Cornell University, NVIDIA

## 한 줄 요약

언어모델이 학습 데이터를 **얼마나** 기억하는가? 이 논문은 Kolmogorov 정보이론에 기반하여 기억화를 **unintended memorization**(비의도적 기억)과 **generalization**(일반화)으로 분리하고, 모델이 저장할 수 있는 정보의 총량인 **모델 용량(capacity)**을 정밀하게 측정한다. 실험 결과, GPT 계열 트랜스포머는 파라미터당 약 **3.6 bits**의 정보를 저장할 수 있으며, 데이터 크기가 이 용량을 초과하면 grokking이 시작되고 비의도적 기억이 감소하면서 일반화가 시작된다.

---

## 1. 서론: 기억화 문제의 재정의

현대 언어모델은 점점 더 많은 데이터에 학습되고 있다. 예를 들어, LLaMA 3는 80억 파라미터(디스크 상 ~32GB)이지만 15조 토큰(~7TB)에 학습된다. 이러한 모델이 학습 데이터를 의미 있게 기억하는지에 대한 연구가 활발히 진행되어 왔다.

기존 연구는 주로 두 가지 관점에서 이 문제에 접근했다:
- **추출(Extraction)**: 모델에서 학습 데이터를 복원할 수 있는가?
- **멤버십 추론(Membership Inference)**: 특정 데이터가 학습에 사용되었는지 분류할 수 있는가?

하지만 저자들은 기존 추출 기반 정의의 한계를 지적한다. 언어모델은 거의 모든 문자열을 출력하도록 강제될 수 있으므로(Geiping et al.), 모델이 어떤 문자열을 출력한다는 것 자체가 기억화의 증거가 되지 않는다. 예를 들어, 두 수의 덧셈 결과를 출력하는 모델은 그 방정식을 학습에서 본 적이 없을 수 있다.

이 논문은 기억화를 **압축률(compression rate)**로 정량화하는 새로운 정의를 제안한다. 모델이 있을 때 입력을 더 짧은 인코딩으로 압축할 수 있다면, 그 입력은 기억된 것으로 본다. 핵심적으로, 기억화를 두 가지 요소로 분리한다:

- **Unintended memorization**: 모델이 특정 데이터셋에 대해 보유한 정보
- **Generalization**: 모델이 기저 데이터 생성 과정에 대해 획득한 지식

---

## 2. 방법론: 기억화의 정보이론적 정의

### 2.1 통계적 관점 (Shannon Information)

학습 알고리즘 $L$이 데이터셋 $X$를 학습된 모델 $\hat{\Theta}$에 매핑한다고 하자. $X$에 대한 정보가 $\hat{\Theta}$에 얼마나 저장되었는지는 상호 정보량(mutual information)으로 측정할 수 있다:

$$
\text{mem}(X, \hat{\Theta}) = I(X; \hat{\Theta}) = H(X) - H(X|\hat{\Theta})
$$

여기서 일반화를 분리하기 위해, 사전 모델(prior) $\Theta$를 조건으로 하여 **unintended memorization**을 정의한다:

$$
\text{mem}_U(X, \hat{\Theta}, \Theta) = I(X|\Theta; \hat{\Theta}) = H(X|\Theta) - H(X|(\Theta, \hat{\Theta}))
$$

그리고 **generalization**(intended memorization)은:

$$
\text{mem}_I(X, \hat{\Theta}, \Theta) = \text{mem}(X, \hat{\Theta}) - \text{mem}_U(X, \hat{\Theta}, \Theta)
$$

**Proposition (Super-additivity of Unintended Memorization)**: $X = (X_1, \dots, X_n)$이 i.i.d. 데이터셋일 때:

$$
\sum_{i} \text{mem}_U(X_i, \hat{\Theta}, \Theta) \leq \text{mem}_U(X, \hat{\Theta}, \Theta) \leq H(\hat{\Theta})
$$

이는 개별 샘플의 비의도적 기억을 합산하면 데이터셋 수준 기억의 하한을 얻을 수 있음을 보여준다.

### 2.2 Kolmogorov Complexity 기반 측정

위의 통계적 정의는 확률변수에 대해서만 적용 가능하다. 실제로는 단일 모델과 단일 데이터셋만 있으므로, 저자들은 **Kolmogorov complexity** 기반으로 전환한다.

**Kolmogorov memorization** 정의:

$$
\text{mem}^K(\hat{\theta}, x) = I^K(\hat{\theta}; x) = H^K(x) - H^K(x|\hat{\theta})
$$

Unintended와 intended 변형:

$$
\text{mem}^K_U(x, \theta, \hat{\theta}) = H^K(x|\theta) - H^K(x|(\theta, \hat{\theta}))
$$

$$
\text{mem}^K_I(x, \theta, \hat{\theta}) = \text{mem}^K(x, \hat{\theta}) - \text{mem}^K_U(x, \theta, \hat{\theta})
$$

**Proposition (Kolmogorov ≈ Shannon)**: i.i.d. 데이터셋 분포에서, Kolmogorov memorization의 기대값은 Shannon memorization과 상수 $\varepsilon$ 이내로 근사한다.

### 2.3 실제 추정 방법

Kolmogorov complexity는 계산 불가능하므로, **arithmetic coding**을 이용해 근사한다:

- $H^K(x|\hat{\theta})$: 학습된 모델의 negative log-likelihood로 추정, 즉 $-\log p(x|\hat{\theta})$
- $H^K(x|\hat{\theta}, \theta)$: 두 모델 중 더 나은 압축률을 사용, 즉 $-\log \max\{p(x|\hat{\theta}),\; p(x|\theta)\}$

참조 모델(reference model) θ의 선택:
- 합성 데이터: 정확한 데이터 분포를 직접 사용
- 실제 텍스트: 같은 아키텍처의 더 큰 모델(훨씬 더 많은 데이터에 학습)을 사용

---

## 3. 모델 용량 측정 (합성 데이터)

### 3.1 용량 정의

$$
\text{Capacity}(L) = \max_X \text{mem}(X, L(X))
$$

모델 용량에 도달하면, $\text{mem}(X, L(X))$은 데이터셋 크기가 증가해도 더 이상 증가하지 않는다.

### 3.2 실험 설정

| 항목 | 세부 사항 |
|------|----------|
| **아키텍처** | GPT-2 (scratch부터 학습) |
| **모델 크기** | 1~8 레이어, 히든 차원 32~512, 파라미터 100K~20M |
| **학습 스텝** | 10⁶ 스텝 |
| **배치 크기** | 2048 |
| **옵티마이저** | Adam |
| **정밀도** | bfloat16 (A100 GPU) |
| **어휘 크기** | V = 2048 |
| **시퀀스 길이** | S = 64 |
| **랜덤 시드** | 각 설정당 5개 |

합성 데이터셋은 각 토큰이 사전 정의된 토큰 집합에서 독립적으로 균일 샘플링된다.

### 3.3 핵심 결과

![Figure 1: 균일 랜덤 데이터의 unintended memorization. 다양한 크기의 GPT 모델에서 경험적 용량 한계인 약 3.6 bits-per-parameter에서 기억이 정체된다.](/images/papers/lm-memorization-capacity/fig1_synth_capacity.png)

**모델별 기억 한계**: 데이터셋 크기에 관계없이, 각 모델은 순 기억량에서 뚜렷한 상한을 보인다. 작은 데이터셋은 충분한 용량을 가진 모든 모델에 의해 완전히 기억된다.

![Figure 2: 합성 데이터로 학습된 모델의 bits-per-parameter 용량. GPT 모델의 반정밀도 학습에서 α ≈ 3.64 bits-per-parameter를 추정한다.](/images/papers/lm-memorization-capacity/fig1_synth_bpp.png)

**파라미터당 용량**: 모델 크기와 관측된 용량(모든 데이터셋에서 측정된 최대 기억량) 사이에 매우 매끄러운 관계가 관찰된다. GPT 모델은 반정밀도 학습에서 일관되게 파라미터당 **3.5~3.6 bits**를 기억한다.

![Figure 3: 학습 과정에서의 비트 기억량. 6.86M 파라미터, 23.9MB 용량의 GPT 트랜스포머.](/images/papers/lm-memorization-capacity/fig1_synth_convergence.png)

**수렴 분석**: 16,000~4M 샘플의 데이터셋이 3.56-3.65 × 10⁶ 비트 기억 범위에 수렴한다. 측정이 차수 내에서 견고함을 나타낸다.

### 3.4 정밀도가 용량에 미치는 영향

| 정밀도 | 평균 α (bits-per-parameter) |
|--------|---------------------------|
| **bfloat16** | 3.51 ± 0.1 |
| **float32** | 3.83 ± 0.1 |

bfloat16에서 float32로 정밀도를 두 배로 올려도, 모델 비트의 실제 2배 증가에 비해 용량 증가는 미미하다. 이는 **정밀도 증가 시 추가되는 대부분의 비트가 실제 저장에 사용되지 않음**을 의미한다.

**정밀도별 상세 용량 측정:**

| 레이어 수 | 히든 차원 | 파라미터 | 용량 (fp32, bits) | 용량 (bf16, bits) | α (fp32) | α (bf16) |
|-----------|----------|---------|-------------------|-------------------|----------|----------|
| 1 | 32 | 8.04×10⁴ | 3.39×10⁵ | 3.16×10⁵ | 4.23 | 3.93 |
| 1 | 128 | 4.69×10⁵ | 1.71×10⁶ | 1.69×10⁶ | 3.65 | 3.61 |
| 2 | 128 | 6.67×10⁵ | 2.66×10⁶ | 2.60×10⁶ | 3.99 | 3.89 |
| 4 | 256 | 3.70×10⁶ | 1.36×10⁷ | 1.30×10⁷ | 3.68 | 3.51 |
| 8 | 256 | 6.86×10⁶ | 2.71×10⁷ | 2.51×10⁷ | 3.96 | 3.65 |

---

## 4. 실제 텍스트에서의 Unintended Memorization과 Generalization 분리

### 4.1 실험 설정

합성 데이터 실험을 실제 텍스트로 반복한다.

| 항목 | 세부 사항 |
|------|----------|
| **데이터셋** | FineWeb (최신 중복 제거 기법 적용) |
| **시퀀스 길이** | 64 토큰 |
| **중복 제거** | 완벽한 중복 제거 수행 (64 토큰으로 잘랐을 때 1~2% 중복 발생 방지) |
| **참조 모델** | 같은 파라미터 수의 모델(전체 데이터에 학습) + 오라클 모델(최저 loss 달성 모델) |
| **추가 측정** | 멤버십 추론 성능, 다양한 prefix 길이에서의 추출률 |

### 4.2 핵심 결과

![Figure 4: 텍스트의 unintended memorization - 모델 및 데이터 크기별. 오라클 참조 모델 기준으로 계산.](/images/papers/lm-memorization-capacity/fig2_2_kolmogorov_oracle.png)

**샘플 수준 관찰**: Unintended memorization은 모델 파라미터 수에 비례하여 증가하고, 학습 셋 크기에 반비례하여 감소한다. 오라클 참조 모델 기준으로 측정하면, 작은 모델이 소규모 학습 셋에 대해 오라클보다 더 많이 학습할 때 기억이 꾸준히 증가하다가, 모델이 일반화를 시작하면서 감소한다.

### 4.3 Double Descent와 모델 용량의 관계

![Figure 5: 합성 비트스트링 실험에서 double descent가 데이터셋 크기가 모델 용량을 초과하기 시작하는 정확한 지점에서 발생한다.](/images/papers/lm-memorization-capacity/fig1_synth_double_descent.png)

![Figure 6: 텍스트로 학습한 다양한 모델/데이터 크기의 train/test loss. 데이터셋 크기가 모델 용량을 초과할 때 double descent가 발생한다.](/images/papers/lm-memorization-capacity/fig2_0_text_train_val.png)

**핵심 발견**: **Double descent는 데이터 용량이 모델 용량을 초과하는 정확한 시점에서 시작된다.** 모델이 더 이상 개별 데이터포인트를 기억할 수 없게 되면, 용량을 절약하기 위해 데이터포인트 간 정보를 공유해야 하고, 이것이 일반화로 이어진다.

### 4.4 추출률과 일반화의 관계

![Figure 7: 64토큰 학습 시퀀스의 추출률 - 다양한 prefix 길이별, train/eval 모두.](/images/papers/lm-memorization-capacity/fig2_5_extraction_rates_eval_train.png)

32토큰 prefix에서 매우 작은 학습 셋의 경우 100% 추출이 가능하다. 데이터셋이 충분히 커지면 추출률이 0으로 가지 않지만, **테스트 추출률과 거의 정확히 수렴한다**. 즉, 중복 제거된 대규모 데이터셋에서 **성공적인 학습 데이터 추출은 모두 일반화에 기인한다**.

### 4.5 어떤 데이터포인트가 가장 많이 기억되는가?

![Figure 8: Unintended memorization vs. TF-IDF. 20M 파라미터 모델, 2¹⁶개 텍스트 시퀀스. 가장 드문 단어를 포함한 문서가 가장 많이 기억된다.](/images/papers/lm-memorization-capacity/fig3_kolmogorov_tfidf.png)

양의 unintended memorization을 가진 샘플에서 **TF-IDF 점수와 기억화 사이에 강한 상관관계**가 관찰된다. 가장 높은 TF-IDF를 가진 샘플(일본어 단어 시퀀스)은 세 번째로 높은 기억화를 보였으며, 26만 학습 샘플 중 하나임에도 단일 토큰만으로 전체 시퀀스를 재생성할 수 있었다.

![Table 3: 가장 높은 TF-IDF 학습 예제들. 모두 기억된 것으로 간주되며, 비영어 언어(일본어, 중국어, 히브리어, 그리스어)의 텍스트를 포함한다.](/images/papers/lm-memorization-capacity/table03_text_memorization_examples.png)

상위 20개 가장 많이 기억된 시퀀스 중 17개가 다른 언어(일본어, 중국어, 히브리어)의 토큰 시퀀스를 포함한다.

### 4.6 합성 데이터 vs. 텍스트 데이터의 분포 비교

![Figure 9: 동일 크기 트랜스포머(4레이어, d=128)로 학습한 랜덤 비트스트링(좌)과 텍스트(우)의 압축률 분포.](/images/papers/lm-memorization-capacity/fig3_dist_synth.png)

![Figure 9 (우): 텍스트 데이터의 train/test 압축률 분포.](/images/papers/lm-memorization-capacity/fig3_dist_text.png)

랜덤 학습 데이터는 train/test 압축률 간 겹침이 적은 정규 분포를 따른다. 텍스트 loss는 평균적으로 낮지만 더 퍼져 있고, train/test loss 분포 간 겹침이 훨씬 크다. 이는 텍스트 데이터에서 멤버십 추론이 더 어려운 이유를 설명한다.

---

## 5. 기억화와 멤버십 추론

### 5.1 멤버십 추론 실험

모든 멤버십 추론 결과는 표준 loss 기반 멤버십 추론(Yeom et al., Sablayrolles et al.)에서 나온다. 방법은 간단하다: 컷오프 loss 값을 설정하여 샘플이 학습 데이터셋의 멤버인지 예측한다.

![Figure 10: 데이터셋 크기별 멤버십 추론 F1 점수. F1 = 0.5는 랜덤 추측을 의미.](/images/papers/lm-memorization-capacity/fig2_6_membership_f1.png)

고정된 모델 크기에서, **데이터 크기가 증가할수록 멤버십 추론이 더 어려워진다**. 데이터셋이 모델에 비해 너무 크면, 평균 학습 샘플에 대한 멤버십 추론이 불가능해질 수 있다.

![Figure 11: 멤버십 추론 vs. 32토큰 prefix 추출률. 멤버십 추론이 일반적으로 추출보다 쉽다.](/images/papers/lm-memorization-capacity/fig2_7_membership_vs_extraction.png)

멤버십 추론은 모든 경우에서 추출보다 성능이 높다. 일부 경우 추출률이 0이면서도 멤버십 추론 점수가 0.97에 달한다.

### 5.2 멤버십 추론을 위한 스케일링 법칙

고정된 모델 용량에서 멤버십 추론은 데이터셋 크기에 대해 대략 시그모이드 형태를 따른다:

$$
\text{Membership}_{F_1}(\theta, \mathcal{D}) = \frac{1}{2}\left(1 + c_1 \cdot \sigma\left(c_2 \cdot \left(\frac{\text{Capacity}(\theta)}{|\mathcal{D}|} + c_3\right)\right)\right)
$$

여기서 $\sigma(x) = \frac{1}{1 + e^{-x}}$.

**직관적 설명**: 작은 데이터셋에 과적합된 큰 모델의 M.I.는 쉬우므로 점수가 1에서 시작한다. 데이터셋 크기가 증가하면 train/test 데이터를 loss로 구별하기 점점 어려워지고, 결국 0.5로 수렴한다.

비선형 최소자승법으로 최적값을 구한다: $c_1 = 1.34$, $c_2 = -0.034$, $c_3 = -33.14$.

![Figure 12: 실험 데이터와 오버레이된 멤버십 추론 스케일링 법칙 곡선.](/images/papers/lm-memorization-capacity/fig4_membership_inference.png)

### 5.3 대형 모델에서의 검증

예상 멤버십 F1 점수 0.55, 0.75, 0.95를 목표로 GPT-2 small (125M)과 GPT-2 XL (1.5B)을 학습하여 검증한다.

| 모델 | d_emb | n_layer | 파라미터 | 데이터셋 크기 | 예측 F1 | 관측 F1 |
|------|-------|---------|---------|-------------|---------|---------|
| GPT2-XL | 1600 | 48 | 1,556M | 170,654,583 | 0.55 | 54.61 ± 1.3 |
| GPT2-XL | 1600 | 48 | 1,556M | 76,795,021 | 0.75 | 71.08 ± 0.4 |
| GPT2-XL | 1600 | 48 | 1,556M | 18,851,574 | 0.95 | 95.85 ± 0.8 |
| GPT2-Medium | 768 | 12 | 124M | 13,566,442 | 0.55 | 53.44 ± 1.1 |
| GPT2-Medium | 768 | 12 | 124M | 6,104,935 | 0.75 | 65.69 ± 0.6 |
| GPT2-Medium | 768 | 12 | 124M | 1,498,634 | 0.95 | 97.98 ± 0.3 |

예측은 일반적으로 실제 F1 점수와 **1.5 포인트 이내**로 정확하다. F1 = 0.75 (시그모이드가 가장 가파른 지점)에서 가장 부정확하다.

**현대 언어모델에 대한 시사점**: tokens-per-parameter 비율이 10² 이상인 모든 현대 언어모델은 스케일링 법칙에 따르면 멤버십 추론 점수가 0.5, 즉 **통계적으로 유의한 loss 기반 멤버십 추론이 불가능**하다.

![Figure 13: 시그모이드 스케일링 법칙을 실험 데이터에 피팅한 결과.](/images/papers/lm-memorization-capacity/fig4_pred_sigmoid.png)

---

## 6. 용량 추정의 신뢰성 검증

시퀀스 길이(S)와 어휘 크기(V)를 변화시켜 용량 추정의 일반성을 검증한다.

**시퀀스 길이별 용량 추정:**

| S | 파라미터 | 측정된 기억 | 예측값 | 오차(%) |
|---|---------|-----------|--------|---------|
| 4 | 6.59×10⁵ | 1.73×10⁵ | 1.80×10⁵ | 4.19 |
| 8 | 6.60×10⁵ | 3.54×10⁵ | 3.60×10⁵ | 1.80 |
| 16 | 6.61×10⁵ | 7.15×10⁵ | 7.21×10⁵ | 0.84 |
| 32 | 6.63×10⁵ | 1.44×10⁶ | 1.44×10⁶ | 0.41 |
| 64 | 6.67×10⁵ | 2.29×10⁶ | 2.36×10⁶ | 2.97 |
| 128 | 6.75×10⁵ | 2.36×10⁶ | 2.39×10⁶ | 1.24 |
| 256 | 6.92×10⁵ | 2.44×10⁶ | 2.45×10⁶ | 0.44 |

평균 오차율 **1.7%**로 매우 정확하다.

**어휘 크기별 용량 추정:**

| V | 파라미터 | 측정된 기억 | 예측값 | 오차(%) |
|---|---------|-----------|--------|---------|
| 128 | 4.21×10⁵ | 1.49×10⁶ | 1.49×10⁶ | 0.36 |
| 512 | 4.71×10⁵ | 1.71×10⁶ | 1.67×10⁶ | 2.78 |
| 1024 | 5.36×10⁵ | 1.95×10⁶ | 1.90×10⁶ | 2.70 |
| 2048 | 6.67×10⁵ | 2.39×10⁶ | 2.36×10⁶ | 1.11 |
| 4096 | 9.29×10⁵ | 3.13×10⁶ | 3.15×10⁶ | 0.47 |

평균 오차율 **1.8%**.

![Figure 14: 시퀀스 길이별 모델 기억화. 예측 오차율 평균 1.7%.](/images/papers/lm-memorization-capacity/fig1_synth_est_seqlen.png)

![Figure 15: 어휘 크기별 모델 기억화. 예측 오차율 평균 1.8%.](/images/papers/lm-memorization-capacity/fig1_synth_est_vocab.png)

---

## 7. 한계점

- 결과는 제안된 실험 환경(GPT 아키텍처, 특정 데이터셋)에 특화되어 있으며, 다른 데이터셋, 아키텍처, 학습 설정에 반드시 일반화되지 않을 수 있다
- 경사 하강법으로 학습하므로 전역 최적해를 보장하지 않으며, 항상 용량의 하한만을 측정한다
- Kolmogorov complexity의 근사를 위해 arithmetic coding을 사용하는데, 더 정교한 압축 알고리즘이 더 정확한 추정을 제공할 수 있다

---

## 8. 결론

이 논문은 모델이 데이터셋에 대해 알고 있는 정확한 비트 수를 측정할 수 있는 새로운 기억화 정의를 제안한다. 이 정의를 사용하여 현대 트랜스포머 언어모델의 **용량을 약 3.6 bits-per-parameter로 측정**하고, 추출과 F1 점수가 모델 및 데이터셋 크기에 따라 어떻게 스케일링되는지 분석한다. 또한 멤버십 추론에 대한 **스케일링 법칙을 제안하고 대형 모델에서 검증**한다. 이 결과는 언어모델이 어떻게 기억하는지, 그리고 다양한 모델 및 데이터셋 스케일에서 무엇을 기억할 수 있고 없는지에 대한 실무자의 이해를 돕는다.
