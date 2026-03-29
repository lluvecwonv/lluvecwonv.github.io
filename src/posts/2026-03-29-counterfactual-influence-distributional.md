---
title: "Counterfactual Influence as a Distributional Quantity 논문 분석"
date: 2026-03-29
summary: "Self-influence(자기 영향)만으로는 near-duplicate가 존재하는 환경에서 LLM 암기를 제대로 측정할 수 없음을 보인 ICML 2025 논문. GPT-Neo 1.3B를 Natural Questions 데이터셋에서 1,000개 모델로 학습하여 전체 influence matrix를 계산. Near-duplicate가 있는 레코드는 self-influence가 3배 낮지만 extractability(BLEU)는 5배 높음. Top-1 Influence Margin 지표를 제안하여 unique record와 near-duplicate를 효과적으로 구분. CIFAR-10에서도 influence distribution만으로 near-duplicate 식별 가능."
tags: [LLM, Memorization, Counterfactual Influence, Near-Duplicate, Extractability, Privacy, ICML 2025, 연구노트]
category: 연구노트
language: ko
---

# Counterfactual Influence as a Distributional Quantity

**학회:** ICML 2025
**저자:** Matthieu Meeus, Igor Shilov, Georgios Kaissis, Yves-Alexandre de Montjoye
**소속:** Imperial College London, Google DeepMind

---

## 한 줄 요약

**Self-influence(자기 영향)** 만으로는 near-duplicate가 존재할 때 암기를 과소평가한다. **전체 influence distribution**을 분석해야 암기의 다면적 특성을 제대로 포착할 수 있다.

---

## 1. 서론 및 동기

LLM이 학습 데이터를 어떻게 암기하는지 연구하는 것은 일반화, 프라이버시, 저작권, 벤치마크 오염 문제를 이해하기 위해 핵심적이다. 암기를 정량화하기 위한 대표적 지표가 **counterfactual self-influence** (Zhang et al., 2023)인데, 이는 특정 샘플을 학습 데이터에서 제외했을 때 모델 예측이 얼마나 변하는지를 측정한다.

그러나 최근 연구(Shilov et al., Mosaic Memory)에서 LLM이 **near-duplicate(유사 중복)** 전반에 걸쳐 상당히 암기한다는 것이 밝혀졌다. Near-duplicate는 실제 LLM 학습 데이터에 광범위하게 존재한다. 이는 핵심적 질문을 제기한다: **특정 텍스트의 암기를 self-influence만으로, 즉 고립적으로 볼 수 있는가?**

이 논문은 self-influence만이 아닌, **전체 학습 데이터셋이 타겟 샘플의 예측에 미치는 영향**을 고려하여 암기를 연구한다. 즉, **counterfactual influence를 분포적 속성(distributional quantity)으로 취급**한다.

---

## 2. 배경: Counterfactual Influence 정의

Zhang et al. (2023)의 정의에 따라, 학습 예제 $x_i$가 타겟 예제 $x_t$에 미치는 counterfactual influence:

$$\mathcal{I}(x_i \Rightarrow x_t) = \underset{A_j: x_i \notin D_j}{\mathbb{E}} \left[\mathcal{L}_{A_j}(x_t)\right] - \underset{A_j: x_i \in D_j}{\mathbb{E}}\left[\mathcal{L}_{A_j}(x_t)\right]$$

여기서 $A_j$는 $D_j$에서 학습된 모델, $\mathcal{L}_{A_j}(x_t)$는 해당 모델의 $x_t$에 대한 손실이다. **양수 값은 $x_i$가 $x_t$ 예측을 개선(손실 감소)**함을 의미한다.

- **Self-influence**: $x_i = x_t$인 경우, 즉 $\mathcal{I}(x_t \Rightarrow x_t)$ = counterfactual memorization
- **본 논문의 핵심**: self-influence 하나만이 아닌, **모든 $x_i$에 대한 $\mathcal{I}(x_i \Rightarrow x_t)$의 전체 분포**를 분석

**Near-duplicate의 효과**: 데이터 분포에 $x_t$의 near-duplicate $x_t'$가 많으면, $x_t$를 포함/제외하는 학습 세트 모두에 이 near-duplicate가 포함될 확률이 높아 $x_t$ 자체의 **한계적 효과(marginal effect)가 줄어든다.**

---

## 3. 실험 설정

### 3.1 모델 및 데이터셋

- **모델:** GPT-Neo 1.3B (사전학습 모델에서 추가 학습)
- **데이터셋:** Natural Questions 부분집합
- **각 레코드:** $x_i = (q_i, a_i)$ — 질문과 답변 쌍, "Q: {$q_i$} A: {$a_i$}" 형태로 연결
- **학습 파라미터:** bfloat16, 3 에포크, 학습률 2e-4, 배치 크기 50, 최대 시퀀스 길이 100

### 3.2 타겟 데이터셋 구성

**Unique records ($D_{\text{unique}}$):** Natural Questions에서 무작위 1,000개 샘플

**Near-duplicate records:** 추가로 100개 레코드 $c_i$를 무작위 선택, 각 레코드에 대해 $n_{\text{dup}} = 5$개의 near-duplicate 생성
- $c_{i1} = a_i$: 원본 정답
- 나머지 4개: Shilov et al. (2024)의 $\mathcal{A}_{\text{replace}}$ 알고리즘으로 답변에서 무작위 1개 토큰을 다른 토큰으로 교체

**전체 타겟 데이터셋 $D_t$:** $N_t = 1,500$개 레코드 (unique 1,000 + near-duplicate 500)

### 3.3 Influence Matrix 계산: 왜 1,000개 모델이 필요한가

influence $\mathcal{I}(x_i \Rightarrow x_t)$는 **기댓값(expectation)**이다. 모델 1개로는 "$x_i$가 포함된 경우의 loss" 하나만 얻을 수 있을 뿐, 안정적인 추정이 불가능하다. 따라서 **수많은 모델을 학습하여 기댓값을 근사**해야 한다.

**구체적 절차:**

**Step 1. Partition matrix 생성**

1,500개 레코드 × 1,000개 모델의 이진 행렬 $P \in \{0, 1\}^{1500 \times 1000}$을 만든다. 각 원소 $p_{ij}$는 **독립적으로 확률 0.5**로 0 또는 1이 된다.

$$p_{ij} = \begin{cases} 1 & \text{(레코드 } x_i \text{를 모델 } A_j \text{의 학습 데이터에 포함)} \\ 0 & \text{(제외)} \end{cases}$$

따라서 각 모델 $A_j$의 학습 데이터 $D_j$는 **평균 750개 레코드**를 포함하며, 어떤 레코드가 포함되는지는 모델마다 다르다.

**Step 2. 1,000개 모델 학습**

각 모델 $A_j$를 해당 $D_j$에서 GPT-Neo 1.3B를 파인튜닝하여 학습한다. 이렇게 1,000개의 서로 다른 모델이 생긴다.

**Step 3. 각 모델에서 모든 레코드의 loss 측정**

학습된 각 모델 $A_j$에 대해, **모든 1,500개 레코드** $x_t$의 loss $\mathcal{L}_{A_j}(x_t)$를 계산한다. 이 결과로 $1500 \times 1000$ 크기의 loss 행렬을 얻는다.

**Step 4. Influence 추정 — 핵심 트릭**

특정 쌍 $(x_i, x_t)$의 influence를 추정하려면:

- 1,000개 모델 중 **$x_i$가 포함된 모델들** (약 500개): 이 모델들의 $\mathcal{L}_{A_j}(x_t)$ 평균을 구함
- 1,000개 모델 중 **$x_i$가 제외된 모델들** (약 500개): 이 모델들의 $\mathcal{L}_{A_j}(x_t)$ 평균을 구함

$$\hat{\mathcal{I}}(x_i \Rightarrow x_t) = \underset{j: p_{ij}=0}{\text{mean}}[\mathcal{L}_{A_j}(x_t)] - \underset{j: p_{ij}=1}{\text{mean}}[\mathcal{L}_{A_j}(x_t)]$$

즉, "$x_i$가 없을 때의 평균 loss"에서 "$x_i$가 있을 때의 평균 loss"를 빼면, **$x_i$가 $x_t$의 loss를 얼마나 줄이는지**(= 얼마나 도움이 되는지)를 추정할 수 있다.

**왜 이 방법이 효율적인가:**

핵심은 **같은 1,000개 모델로 모든 $(x_i, x_t)$ 쌍의 influence를 동시에 추정**할 수 있다는 점이다. 모델 $A_j$를 학습하면, partition matrix의 $j$번째 열이 어떤 레코드가 포함/제외되었는지를 알려주므로, 이 모델 하나로 모든 레코드 쌍에 대한 정보를 기여한다. 결과적으로 $1,500 \times 1,500 = 2,250,000$개의 influence 값을 모두 채울 수 있다.

**Self-influence의 경우:** $x_i = x_t$일 때, 즉 "자기 자신이 학습에 포함되었을 때 vs 제외되었을 때 자기 자신에 대한 loss 차이"가 대각선 원소가 된다. 이것도 동일한 1,000개 모델에서 추정된다.

**결과:** 전체 influence matrix $I \in \mathbb{R}^{1500 \times 1500}$이 완성되며, 대각선 = self-influence, 비대각선 = cross-influence이다.

### 3.4 Extractability 측정

- **BLEU score**: 학습된 모델에 "Q: {$q_i$} A:"로 프롬프트 → greedy decoding 생성 → 정답과 비교
- 높은 BLEU = 학습 데이터의 근사적 추출(approximate extraction)

---

## 4. 주요 결과

### 4.1 Influence Matrix 시각화

![Influence matrix](/images/papers/counterfactual-influence-dist/influence_matrix_GPT1.3B_zoomed.png)
*Figure 1(a): 전체 influence matrix $I$. 대각선(self-influence)이 가장 두드러짐.*

- **대각선 패턴**: self-influence 값이 다른 값보다 일반적으로 큼
- 대각선 외의 영향은 크게 변동: +2까지(예측 개선) 또는 음수(예측 악화)

### 4.2 Unique Record vs Near-Duplicate의 Influence Distribution

![Unique record influence distribution](/images/papers/counterfactual-influence-dist/influence_distribution_1201.png)
*Figure 1(b): Unique record $x_t$의 influence distribution. Self-influence가 가장 큰 값.*

![Near-duplicate record influence distribution](/images/papers/counterfactual-influence-dist/influence_distribution_123.png)
*Figure 1(c): Near-duplicate가 있는 record $x_t$의 influence distribution. Self-influence 외에도 유사한 크기의 영향이 여러 개 존재.*

**핵심 차이:**
- **Unique record**: self-influence가 확실한 최댓값, 나머지는 넓게 분포
- **Near-duplicate record**: self-influence가 여전히 가장 크지만, **4개의 near-duplicate가 유사한 크기의 영향**을 보임 → influence가 분산됨

### 4.3 핵심 통계 비교

| 지표 | Unique Records | Records with Near-Duplicates |
|---|---|---|
| **Self-influence** $\mathcal{I}(x_t \Rightarrow x_t)$ | $1.410 \pm 0.568$ | $0.495 \pm 0.133$ |
| **BLEU score** (extractability) | $0.070 \pm 0.142$ | $0.363 \pm 0.313$ |
| **Top-1 Influence Margin** $\text{IM}(x_t)$ | $9.1 \pm 7.1$ | $1.3 \pm 0.3$ |

**핵심 발견 세 가지:**

1. **Self-influence 3배 감소**: Near-duplicate가 있는 레코드의 self-influence($0.495$)는 unique record($1.410$)의 약 1/3. Near-duplicate가 존재하면 타겟 레코드 자체의 한계적 기여가 줄어듦.

2. **Extractability 5배 증가**: 그럼에도 불구하고 near-duplicate 레코드의 **BLEU score는 5배 높음** ($0.363$ vs $0.070$). **Self-influence만 보면 암기 리스크를 심각하게 과소평가하게 된다.**

3. **Top-1 Influence Margin의 식별력**: 가장 큰 영향과 두 번째 큰 영향의 비율. Unique record는 $9.1$배 (self-influence가 압도적), near-duplicate는 $1.3$배 (여러 유사 영향이 경쟁). **Self-influence보다 unique/near-duplicate 구분에 훨씬 효과적.**

### 4.4 Top-1 Influence Margin (IM) 정의

$$\text{IM}(x_t) = \frac{\max_i \mathcal{I}(x_i \Rightarrow x_t)}{\max_{i \neq i^*} \mathcal{I}(x_i \Rightarrow x_t)}$$

여기서 $i^* = \arg\max_i \mathcal{I}(x_i \Rightarrow x_t)$. 가장 영향력 있는 학습 샘플이 얼마나 지배적인지를 포착한다.

### 4.5 BLEU Score 예시

| 레코드 유형 | 질문 예시 | BLEU |
|---|---|---|
| Regular member (1회 포함) | "what age did brett favre retire from football" | 0.086 |
| Member with near-duplicates | "where did the name chilean sea bass come from" | 0.499 |
| Held-out (미학습) | "who played legolas in lord of the rings" | 0.062 |

Near-duplicate가 있는 레코드는 모델이 정확한 원문을 재생산하지는 않지만, **상당한 겹침**을 가진 답변을 생성한다 (예: "making it attractive to the American market" 같은 핵심 구문이 유지됨).

---

## 5. CIFAR-10에서의 검증

### 5.1 실험 설정

- **모델:** ResNet, $M = 1,000$개 모델 학습
- **데이터셋:** CIFAR-10에서 $N_t = 20,000$개 레코드 무작위 샘플링
- **전체 influence matrix** $I$ 계산

### 5.2 결과

![CIFAR-10 near-duplicate detection](/images/papers/counterfactual-influence-dist/target_12951_cifar.png)
*Figure 2(a): 가장 낮은 Top-1 Influence Margin을 가진 타겟 $x_t$*

![Most influential sample](/images/papers/counterfactual-influence-dist/target_14753_cifar.png)
*Figure 2(b): $x_t$에 가장 영향을 미치는 다른 샘플 $x_i$ — 시각적으로 명확한 near-duplicate*

![CIFAR-10 influence distribution](/images/papers/counterfactual-influence-dist/influence_distribution_cifar_12951.png)
*Figure 2(c): 해당 타겟의 전체 influence distribution*

**발견:** Top-1 Influence Margin이 가장 낮은 타겟의 가장 영향력 있는 샘플은 **자연적이고 시각적으로 설득력 있는 near-duplicate**였다. 가장 낮은 IM을 가진 상위 6개 타겟 모두에서 동일한 패턴 확인.

**시사점:** 인공적으로 near-duplicate를 만들지 않더라도, **실제 데이터셋에서도 influence distribution만으로 near-duplicate를 식별 가능**하다.

---

## 6. 논의 및 시사점

### 6.1 Self-Influence의 한계

이 논문의 가장 중요한 메시지는: **self-influence만으로는 near-duplicate 존재 시 암기의 실질적 리스크를 포착하지 못한다.**
- Self-influence가 낮아도 extractability가 높을 수 있음
- 프라이버시, 저작권 리스크 평가에서 self-influence에만 의존하면 위험

### 6.2 분포적 관점의 가치

전체 influence distribution을 분석함으로써:
- Near-duplicate의 존재를 감지
- 암기의 **다면적(multi-faceted)** 특성을 포착
- Top-1 Influence Margin이 self-influence보다 더 효과적인 식별 지표

### 6.3 관련 연구와의 연결

- **Shilov et al. (2024), Mosaic Memory**: near-duplicate가 MIA 취약성을 높인다는 것을 보임 → 본 논문은 이를 counterfactual influence framework에서 확인
- **Zhang et al. (2023), Counterfactual Memorization**: self-influence 개념을 도입 → 본 논문은 이를 분포적 관점으로 확장
- **Feldman & Zhang (2020)**: subsampled influence → 유사한 서브샘플링 방법론 사용

---

## 7. 총평

이 논문은 짧지만 핵심적인 통찰을 제공한다. **Self-influence가 암기의 대리 지표로 널리 사용되지만, near-duplicate가 풍부한 현실 데이터에서는 그 한계가 명확하다.** Near-duplicate 레코드가 self-influence 3배 감소에도 불구하고 extractability 5배 증가를 보인다는 결과는 매우 인상적이다.

Top-1 Influence Margin이라는 간단하면서도 효과적인 새 지표 제안과, CIFAR-10 실험에서 influence distribution만으로 near-duplicate를 자연스럽게 식별한 결과도 실용적 가치가 크다. Mosaic Memory 논문과 함께 읽으면 LLM 암기에서 near-duplicate의 역할에 대한 포괄적 이해를 얻을 수 있다.
