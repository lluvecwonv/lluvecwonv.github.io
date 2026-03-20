---
title: "A Multi-Perspective Analysis of Memorization in Large Language Models 논문 정리"
date: 2026-03-18
summary: "The University of Tokyo의 Bowen Chen, Namgi Han, Yusuke Miyao가 발표한 논문. LLM의 기억화(memorization) 현상을 모델 크기 스케일링, 입출력 다이나믹스, 엔트로피 분석, 기억화 예측 등 다양한 관점에서 분석한다. Pythia 모델(70M~12B)과 Pile 코퍼스를 사용하여, (1) 기억화/비기억화 문장 수의 비선형적 변화, (2) 기억화/비기억화 콘텐츠 생성 시 boundary effect, (3) 임베딩 공간에서의 기억화 점수별 클러스터링, (4) Transformer를 이용한 기억화 예측 가능성을 밝힌다."
tags: [LLM, Memorization, Scaling, Pythia, Boundary Effect, Embedding Dynamics, Entropy, 연구노트]
category: 연구노트
language: ko
---

# A Multi-Perspective Analysis of Memorization in Large Language Models

**논문:** Bowen Chen, Namgi Han, Yusuke Miyao
**소속:** Department of Computer Science, The University of Tokyo
**키워드:** LLM, Memorization, Scaling Laws, Boundary Effect, Embedding Dynamics

## 한 줄 요약

LLM의 기억화(memorization) 현상을 모델 크기, 입력/출력 다이나믹스, n-gram 빈도, 임베딩 동역학, 엔트로피, 기억화 예측 등 **다중 관점(multi-perspective)** 에서 종합적으로 분석한 연구이다. Pythia 모델 시리즈(70M~12B)를 사용하여 기억화의 메커니즘과 특성을 심층적으로 밝힌다.

---

## 1. 서론 (Introduction)

BERT에서 GPT-4에 이르기까지, 대규모 언어모델(LLM)은 NLP와 AI 연구를 혁신시켰다. 하지만 블랙박스 특성상 내부 메커니즘에 대한 이해는 여전히 부족하다. 특히 모델 크기와 사전학습 데이터 규모가 커지면서 **기억화(memorization)**라는 독특한 행동이 관찰된다.

기억화란 LLM이 사전학습 코퍼스에 기록된 콘텐츠를 특정 컨텍스트 하에서 그대로 생성할 수 있는 현상을 의미한다. 이는 한편으로는 LLM을 지식 베이스로 활용할 수 있게 하지만, 다른 한편으로는 사전학습 데이터에 포함된 개인정보가 악의적으로 유출될 수 있는 프라이버시 위험을 야기한다.

기존 연구(Tirumala et al., 2022; Carlini et al., 2023; Biderman et al., 2023)는 기억화를 매크로 수준에서 연구했지만, **어떤 문장이 기억되는지, 모델 크기가 어떤 역할을 하는지, 기억화/비기억화 콘텐츠를 생성할 때의 입출력 다이나믹스는 무엇인지** 등 더 미시적이고 중요한 질문은 충분히 탐구되지 않았다.

이 논문의 주요 발견:

**(I)** 기억화/비기억화 문장 수는 모델 크기에 따라 비선형적으로 변하며, 기억화에는 최대 용량(capacity)이 존재한다. 기억화 문장 수는 continuation 크기에 따라 sub-linearly 감소하고, context 크기에 따라 super-linearly 증가한다. 또한 모델 크기 증가 시 기억화 점수 간 전이(transition) 다이나믹스가 관찰된다.

**(II)** 기억화/비기억화 콘텐츠 생성 시작 시점에 **boundary effect**가 관찰되며, 이는 모델 크기와 관련이 있다.

**(III)** 다른 기억화 점수를 가진 문장들이 임베딩 공간에서 클러스터를 형성하며, 엔트로피 분석에서도 반대 방향의 boundary effect가 관찰된다.

**(IV)** Transformer 모델로 기억화를 예측할 수 있으며, 비기억화 시퀀스가 기억화 콘텐츠보다 예측하기 쉬운데, 이는 boundary effect의 유의성으로 설명된다.

---

## 2. 관련 연구 (Related Works)

### 2.1 LLM의 스케일링 법칙

스케일링 법칙(Kaplan et al., 2020)은 LLM의 성능이 코퍼스 크기, 파라미터 크기, 필요한 연산량에 따라 스케일링됨을 시사한다. 기억화 분야에서는 Carlini et al. (2023)이 모델 크기에 따라 기억화된 텍스트 수가 증가함을 보였고, Biderman et al. (2023)은 소형 모델에서 기억화된 텍스트의 상당 부분이 대형 모델에서도 기억화되어 있음을 발견했다.

### 2.2 기억화

기존 머신러닝에서 기억화와 가장 가까운 개념은 **과적합(overfitting)** 이다. 하지만 LLM은 실제 태스크에서도 좋은 성능을 보이므로, 과적합과는 구별된다. Feldman (2020)은 long-tail 분포에서 소수 샘플만 가진 카테고리의 경우, 뉴럴 모델이 일반적 특징을 추출하지 못하고 단순히 기억하는 것이 최선의 전략임을 이론적으로 분석했다.

LLM에서의 기억화는 사전학습 콘텐츠를 직접 생성하므로 관찰 가능하며, 이는 지식 그래프 구축에 활용되기도 하지만, 데이터 오염(data contamination)과 프라이버시 위험을 초래한다.

---

## 3. 실험 세팅 (Experiment Setting)

### 3.1 기억화 기준: K-extractability

![Figure 1: Memorization and Research Scope in this study](/images/papers/multi-perspective-memorization/general.png)

K-extractability (Carlini et al., 2021)를 기반으로 기억화를 정의하고 기억화 점수를 계산한다.

**방법:** 컨텍스트 토큰 시퀀스 C = {c_0 ... c_n}을 LLM에 프롬프트로 제공하고, greedy decoding으로 continuation 토큰을 생성한다. 예측된 continuation과 실제 continuation을 비교하여 기억화 점수를 계산한다:

M(X, Y) = (sum of x_i == y_i from i=0 to n) / L(Y)

- X = {x_0 ... x_n}: 예측된 continuation 토큰 시퀀스
- Y = {y_0 ... y_n}: 실제 continuation 토큰
- M(X, Y) = 1이면 **완전 기억화(K-extractable)**
- M(X, Y) = 0이면 **비기억화(unmemorized)**

### 3.2 예측 기준

- **Token-Level Accuracy:** 각 토큰 위치에서 기억화 여부를 올바르게 예측한 비율
- **Full Accuracy:** 시퀀스의 모든 토큰 레벨 예측이 완전히 정확한 경우

### 3.3 모델 세팅

**Pythia 모델** (Biderman et al., 2023b)을 사용하여 기억화를 분석한다. Pythia는 다양한 크기의 LLM을 **동일한 학습 순서(same training order)** 로, 오픈소스 **Pile** (Gao et al., 2020) 코퍼스를 사용하여 학습시킨 모델 시리즈로, 이를 통해 실험의 안정성을 보장한다.

- **모델 크기:** 70M, 160M, 410M, 1B, 2.8B, 6.9B, 12B (m = million, b = billion)
- **데이터:** 중복 제거된(deduplicated) Pile 코퍼스 버전을 사용한다. 이는 선행 연구(Kandpal et al., 2022)에서 중복 문장의 기억화 확률이 중복 횟수에 따라 **기하급수적으로 증가** 한다고 보고했기 때문이며, 중복 문장의 영향을 배제하기 위함이다.

### 3.4 코퍼스 세팅

오픈소스 **Pile** (Gao et al., 2020) 코퍼스는 공개적으로 이용 가능한 데이터이다. 데이터는 **146,432,000개의 행(row)** 으로 구성되며, 각 행의 청크 길이(chunk length)는 **2,048 토큰** 이고, 전체 데이터 크기는 약 **800GB** 에 달한다.

실험은 **전체 학습 데이터 행렬을 순회(iterate)** 하는 방식으로 수행되었다. 즉, 행에 대한 샘플링을 수행하지 않고 전체 Pile 행렬을 순회했다. 예를 들어, context 크기가 32이고 continuation 크기가 96인 경우, 각 행의 첫 32개 토큰을 모델에 프롬프트로 제공하고, Pythia 모델이 continuation 크기와 동일한 96개의 토큰을 생성한다. 그런 다음, 생성된 토큰 ID와 데이터의 정답(gold) 토큰 ID를 비교하여 각 행의 기억화 점수를 계산한다. 이 과정은 **전체 Pile 행렬에 대해 반복** 되며, 서로 다른 CUDA 디바이스에 분산 처리된다.

### 3.5 실험 환경

- **GPU:** 64 A100 40GB GPUs
- **정밀도:** half-precision (속도 향상 및 메모리 절약)
- **디코딩:** greedy decoding
- 70M 모델, context 32 토큰, continuation 16 토큰 기준: 단일 A100에서 수 시간. 12B 모델은 64 GPU로 약 1일 소요.

---

## 4. 실험 결과 (Experiment Results)

### 4.1 기억화 요인 (Memorization Factors)

![Figure 2: Memorization Statistics Across Model Size, Complement Size, and Context Size](/images/papers/multi-perspective-memorization/memorized.png)

#### 4.1.1 모델 크기의 영향

- 낮은 기억화 점수(0~0.3)를 가진 문장의 수가 높은 기억화 점수를 가진 문장보다 **압도적으로 많다** . 즉, LLM의 기억화 현상이 존재하지만 대부분의 사전학습 데이터는 기억되지 않는다.
- 높은 기억화 점수를 가진 문장 중 **완전 기억화(score=1.0) 문장 수가 가장 빠르게 증가** 하여, LLM이 부분적 기억보다는 완전 기억을 선호함을 시사한다.
- 기억화/비기억화 문장 수의 증감은 모델 크기에 대해 **비선형적** 이다. 70M~2.8B 구간에서의 변화가 2.8B~12B 구간보다 현저하여, **기억화에 최대 용량(capacity)이 존재** 함을 시사한다.

#### 4.1.2 Context 크기와 Continuation 크기

- **Continuation 크기 증가:** 기억화 문장 수가 비선형적으로 감소. 예: continuation 64→96 증가 시 감소폭이 32→48보다 작아, **일부 문장은 견고하게(firmly) 기억화** 되어 있음을 시사.
- **대형 모델에서 continuation 크기 증가에 따른 감소폭이 더 큼:** 대형 모델이 더 많은 문장을 기억하지만, 기억화의 견고성은 소형 모델보다 낮다.
- **Context 크기 증가:** 기억화 문장 수가 비선형적으로, 거의 기하급수적으로 증가. 대형 모델에서 더 현저하며, 더 긴 context를 제공하면 더 많은 잠재적 기억화 콘텐츠를 이끌어낼 수 있음을 의미.

### 4.2 기억화 전이 (Memorization Transition)

![Figure 3: Transition Across Different Model Size](/images/papers/multi-perspective-memorization/transition_matrix.png)

기억화 점수를 0.2 간격으로 very low, low, medium, high, very high의 5단계로 분류하고, 모델 크기 증가에 따른 전이 행렬을 분석한다 (410M→2.8B, 2.8B→12B).

- **대부분의 문장은 모델 크기가 커져도 이전 상태를 유지** 한다 (대각선 항목이 높음). 기억화 점수가 높을수록 상태 유지 확률이 높아, 완전 기억화 문장의 90% 이상이 기억화 상태를 유지.
- **모델 크기가 커질수록 상태 유지 확률이 더 높아진다** (2.8B→12B의 대각선 확률이 410M→2.8B보다 높음). 기억화/비기억화 상태가 모델 크기 증가와 함께 **고정화(fixed)** 된다.
- 완전 기억화 문장에서도 소수가 낮은 기억화 상태로 전이되는데, 이는 일부 문장이 특정 특성이 아닌 **무작위적으로 기억화** 됨을 시사.

### 4.3 입력 다이나믹스 (Input Dynamics)

#### 4.3.1 토큰 레벨 빈도 분석

![Figure 4: One-gram Analysis at Each Index](/images/papers/multi-perspective-memorization/one-gram.png)

사전학습 코퍼스의 n-gram 통계를 분석하여 기억화/비기억화 문장의 입력 특성을 연구한다.

- **뚜렷한 boundary effect 관찰:** 인덱스 32(첫 번째 생성 토큰) 부근에서, 기억화 문장은 빈도가 떨어졌다가 상승(**positive boundary effect** ), 비기억화 문장은 빈도가 올라갔다가 하락(**negative boundary effect** ). negative boundary effect가 positive보다 더 뚜렷하다.
- **반기억화(half-memorized) 문장:** 인덱스 39(생성 토큰 길이의 절반) 부근에서 negative boundary effect 관찰. 반기억화 문장의 전반부가 주로 기억화되고 후반부가 비기억화됨을 의미하며, **기억화 토큰이 산발적이 아닌 연속적으로 분포** 함을 보여준다.
- **Positive boundary effect는 초기 토큰의 높은 빈도** 가 전체 문장 기억화를 유도함을 시사. **Negative boundary effect는 초기 토큰의 낮은 빈도** 가 이후 시퀀스의 비기억화를 유발.

#### 4.3.2 문장 레벨 빈도 분석

| Size | Context One-gram (M/H/U) | Continuation One-gram (M/H/U) | Boundary Freq Diff One-gram (M/H/U) |
|------|---------------------------|-------------------------------|--------------------------------------|
| 160M | 1.708/1.713/1.744 | 1.739/1.837/1.628 | 0.114/0.330/-0.939 |
| 1B | 1.713/1.711/1.752 | 1.736/1.832/1.631 | 0.103/0.270/-0.981 |
| 6.8B | 1.721/1.710/1.759 | 1.736/1.829/1.638 | 0.090/0.140/-0.963 |
| 12B | 1.721/1.720/1.760 | 1.736/1.846/1.626 | 0.039/0.237/-1.016 |

*(빈도 단위: billion. M=Memorized, H=Half-memorized, U=Unmemorized)*

- One-gram 빈도가 two-gram보다 약 3.5배 높다. Boundary effect는 two-gram에서도 일관되게 관찰.
- **기억화 문장:** context 빈도 낮음 + continuation 빈도 높음. **비기억화 문장:** 반대 패턴.
- **모델 크기 증가 시:** positive boundary effect는 감소(기억화가 어려워짐), negative boundary effect는 증가(비기억화가 쉬워짐). 이는 **positive boundary effect의 유의성이 문장 기억화의 용이성과 상관** 됨을 의미.

### 4.4 출력 다이나믹스 (Output Dynamics)

#### 4.4.1 임베딩 다이나믹스

![Figure 5: Embedding Dynamics Across Different Model Size](/images/papers/multi-perspective-memorization/plot.png)

각 생성 토큰의 마지막 레이어 hidden state를 수집하고, 기억화 점수별 문장 간 pair-wise 유클리드 거리와 코사인 유사도를 계산한 뒤 PCA로 시각화한다.

- **코사인 유사도는 디코딩 단계 간 비교적 안정적** 이며, 유클리드 거리는 토큰 생성이 진행됨에 따라 감소한다. 즉, 고차원 공간에서 문장 벡터 간의 각도는 안정적이면서 크기는 수렴.
- **완전 기억화되지 않더라도 높은 기억화 점수의 문장은 임베딩 공간에서 가깝게 클러스터링** 된다. 이는 **패러프레이즈된 기억화(paraphrased memorization)** 의 존재를 시사.
- **대형 모델은 유클리드 거리가 더 크고 코사인 유사도가 더 낮다.** hidden size 확장(70M: 512, 1B: 2048)으로 임베딩 공간의 표현력이 증가하여 문장 간 구분이 더 명확해짐. 이것이 모델 크기 간 성능 차이를 설명한다.

#### 4.4.2 생성 다이나믹스와 엔트로피

![Figure 6: Averaged Entropy at Each Index](/images/papers/multi-perspective-memorization/entropy_across_steps.png)

10,000개 문장의 각 토큰별 vocabulary에 대한 엔트로피를 계산한다.

- **비기억화 문장의 평균 엔트로피가 기억화 문장보다 높다.** LLM이 기억화 콘텐츠 생성 시 더 높은 확신을 가짐.
- **Boundary effect가 엔트로피에서도 관찰되나 반대 방향:** 비기억화 토큰 생성 시작 시 엔트로피가 급증하고, 기억화 콘텐츠 생성 시작 시 엔트로피가 감소. 빈도 분석의 boundary effect와 반대 방향.
- 완전 기억화 문장의 엔트로피 감소가 반기억화 문장보다 덜 두드러짐 — 완전 기억화 시 모델이 더 확신을 가져 엔트로피가 낮음.
- **모델 크기 증가 시 전체적으로 엔트로피 감소** (대형 모델이 토큰 생성에 더 확신). 기억화 콘텐츠의 boundary effect는 모델 크기 증가와 함께 감소하지만, 비기억화 콘텐츠에서는 유지.

### 4.5 기억화 예측 (Prediction of Memorization)

마지막 레이어 임베딩과 통계적 특징(엔트로피 등)을 입력으로 받아, 각 인덱스의 토큰이 기억화되었는지 여부를 이진 분류하는 Transformer 모델을 학습한다.

#### 4.5.1 예측 결과

| Length | 70M Token/Full | 410M Token/Full | 1B Token/Full | 2.8B Token/Full | 6.9B Token/Full | 12B Token/Full |
|--------|----------------|-----------------|---------------|-----------------|-----------------|----------------|
| 16 | 78.2/10.2 | 78.6/10.4 | 78.8/10.6 | 80.1/10.7 | 77.4/8.3 | 80.3/**10.9** |
| 32 | 78.6/5.9 | 79.6/6.0 | 79.7/6.1 | 80.1/6.3 | 80.5/6.4 | 80.8/6.4 |
| 48 | 79.6/5.2 | 80.3/5.4 | 80.4/5.6 | 80.4/5.5 | 80.8/5.8 | 81.0/6.0 |
| 64 | 80.1/4.7 | 80.8/4.8 | 81.2/5.2 | 81.5/5.5 | 81.8/5.8 | **82.1**/6.0 |

*(Context length = 32. Token = Token-Level Accuracy, Full = Full Accuracy)*

- **Token-level accuracy는 약 80% 이상** 달성 가능하여, 토큰 수준의 기억화 예측이 비교적 쉬움.
- **LLM 크기 증가 시 token-level 및 full-level accuracy 모두 향상.** 임베딩 거리가 커지면서 분류가 쉬워짐.
- **Token-level accuracy는 continuation 크기 증가와 함께 상승** (학습 데이터 증가 효과). 하지만 **full accuracy는 감소** (예측해야 할 토큰 수 증가로 전체 정확 예측이 어려워짐).

#### 4.5.2 Full Accuracy 분석

![Figure 7: Distribution Across Model Size of Full Accurate Predictions](/images/papers/multi-perspective-memorization/normalized_full_accuracy_count_distribution.png)

- **모든 모델 크기에서 낮은 기억화 점수의 문장을 더 잘 예측.** 높은 기억화 점수의 문장은 정확한 예측이 더 어렵다.
- **모델 크기 증가 시 낮은 기억화 점수 문장의 예측 비율 상승, 높은 기억화 점수 문장의 비율 하락** (6.9B에서 0에 도달).
- 이 현상은 **boundary effect의 유의성** 으로 설명된다: 비기억화 시퀀스의 boundary effect가 빈도와 엔트로피 모두에서 기억화 시퀀스보다 뚜렷하고, 모델 크기 증가에 따라 비기억화 문장의 boundary effect는 강해지고 기억화 문장의 boundary effect는 약해짐.

---

## 5. 결론 (Conclusion)

이 연구는 LLM의 기억화를 다양한 관점에서 종합적으로 분석했다:

1. **통계적 수준:** 기존 연구의 범위를 낮은 기억화 점수 문장까지 확장하고, 모델 크기 간 기억화 전이 실험을 수행.
2. **입력 다이나믹스:** 빈도 분석을 통해 기억화/비기억화 토큰 생성 시 positive/negative boundary effect를 발견하고, 문장의 기억화 용이성과의 관계를 규명.
3. **출력 다이나믹스 (임베딩):** 기억화 점수별 문장의 임베딩 클러스터링을 발견하고, 높은 기억화 점수 문장의 근접성이 패러프레이즈된 기억화의 존재를 시사.
4. **출력 다이나믹스 (엔트로피):** 반대 방향의 boundary effect를 관찰하고 모델 크기에 따른 변화를 분석.
5. **기억화 예측:** Transformer 모델로 토큰 수준 예측은 쉽지만 문장 수준은 어려우며, 비기억화 토큰이 기억화 토큰보다 예측하기 쉬움을 확인.

---

## 6. 한계 (Limitations)

- Pythia 모델만 사용하여 최대 12B까지만 분석. LLaMA(70B) 등 더 큰 모델에서는 emergent abilities로 인해 결과가 다를 수 있음.
- 모델과 데이터가 모두 공개된 LLM이 제한적이어서 다양한 LLM 간 비교가 어려움.
- Transformer 기반 기억화 예측은 분석 지향적이며, 성능 최적화가 주목적은 아님.
- 본 연구의 기억화 논의는 **verbatim memorization** (생성 토큰이 코퍼스의 동일 문장과 완전히 일치)에 한정됨.
