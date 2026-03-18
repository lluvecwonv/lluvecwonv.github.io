---
title: "PerProb: Indirectly Evaluating Memorization in Large Language Models 논문 정리"
date: 2026-03-18
summary: "City University of Hong Kong의 Yihan Liao, Jacky Keung, Xiaoxue Ma 등이 발표한 논문. LLM의 기억화(memorization) 취약성을 간접적으로 평가하기 위한 라벨 프리(label-free) 프레임워크 PerProb를 제안한다. Perplexity(PPL)와 평균 로그 확률(λ(W))을 활용하여 shadow 모델과 victim 모델의 출력 차이를 비교함으로써, 학습 데이터 라벨 없이도 기억화 행동을 추정한다. MIA를 4가지 공격 패턴으로 분류하고, GPT-2, GPT-Neo (1.3B, 2.7B)에서 5개 데이터셋으로 실험한다. Knowledge Distillation, Early Stopping, Differential Privacy 등 방어 전략의 효과도 평가한다."
tags: [LLM, Memorization, MIA, Membership Inference Attack, Privacy, Perplexity, GPT-2, GPT-Neo, 연구노트]
category: 연구노트
language: ko
---

# PerProb: Indirectly Evaluating Memorization in Large Language Models

**저자:** Yihan Liao, Jacky Keung, Xiaoxue Ma (교신저자), Jingyu Zhang, Yicheng Sun
**소속:** Department of Computer Science, City University of Hong Kong / Hong Kong Metropolitan University
**키워드:** Large Language Model, Membership Inference Attack, Privacy-preserving, Perplexity, Log Probability

## 한 줄 요약

LLM의 기억화 취약성을 **라벨 없이** 간접 평가하는 프레임워크 **PerProb**를 제안하고, 4가지 MIA 공격 패턴과 3가지 방어 전략을 체계적으로 실험한 연구이다.

---

## 1. 서론 (Introduction)

대규모 언어 모델(LLM)은 NLP에서 핵심적인 역할을 하지만, 대규모 데이터셋으로 학습하는 과정에서 민감한 정보가 포함될 수 있어 심각한 프라이버시 우려를 제기한다. **Membership Inference Attack (MIA)** 는 가장 대표적인 프라이버시 위협으로, 공격자가 특정 데이터가 모델의 학습 데이터에 포함되었는지를 추론하는 공격이다. EU의 GDPR은 학습 데이터 멤버십 추론 자체를 프라이버시 침해로 간주한다.

그러나 LLM에 대한 MIA의 효과에 대해서는 연구마다 결과가 상반된다. 일부 연구는 성공적인 공격을 보여주지만, 다른 연구들은 MIA가 랜덤 추측보다 약간 나은 수준이라고 주장한다. 이러한 불일치는 다음 두 가지 핵심 과제에 기인한다:

- **Challenge 1: 멤버십 라벨의 부재.** GPT 시리즈 등 대부분의 LLM은 학습 데이터를 공개하지 않아 ground-truth 라벨을 얻을 수 없다.
- **Challenge 2: 일반화 vs. 기억화.** LLM은 방대한 코퍼스에서 일반화하도록 학습되므로, 개별 기억화 사례를 구분하기 어렵다.

### 주요 기여

1. **PerProb 프레임워크 제안:** Perplexity(PPL)와 평균 로그 확률(λ(W))을 기반으로 생성 태스크에서 LLM 기억화를 라벨 없이 간접 평가하는 프레임워크.
2. **4가지 MIA 공격 패턴 하에서 통합 평가:** 블랙박스/화이트박스 4가지 공격 시나리오에서 PerProb의 효과를 모델과 데이터셋에 걸쳐 검증.
3. **방어 전략 평가:** Knowledge Distillation (KD), Early Stopping (ES), Differential Privacy (DP) 등의 방어 전략이 프라이버시 누출을 감소시키는 효과를 실증.

---

## 2. 배경 (Background)

### MIA 기존 방법론과 한계

| 방법론 | 가정 | 필요 접근 | LLM에서의 한계 |
|--------|------|-----------|----------------|
| Confidence 기반 | 라벨링된 member/non-member 데이터 필요 | 모델 출력 확률 (블랙박스) | LLM 일반화로 confidence 구분 어려움 |
| Loss 기반 | member 샘플의 loss가 더 낮다고 가정 | Loss 점수 또는 logits | LLM에서 loss 값이 유의미하게 다르지 않을 수 있음 |
| Gradient 기반 | 모델 gradient 접근 필요 | 모델 파라미터 (화이트박스) | 대규모 API 접근 LLM에서 비현실적 |
| Shadow 모델 | 유사 데이터로 shadow 모델 학습 | 데이터 생성기 및 모델 구조 | 라벨 데이터 필요; 실제 LLM에서 데이터 불일치 |
| Prompt 기반 | 보정된 프롬프트로 멤버십 추론 | 조작된 프롬프트에 대한 응답 | 프롬프트 디자인과 태스크에 크게 의존 |
| **PerProb (제안)** | **라벨이나 내부 접근 불필요** | **모델 출력만 사용; 생성/분류 모두 적용 가능** | 간접 추론, 학습 유도 기억에 따른 모델 행동 차이 가정 |

---

## 3. 방법론 (Methodology)

### 3.1 대상 모델

- **GPT-2:** 학습 데이터가 비공개 → ground-truth member/non-member 라벨 사용 불가능한 시나리오 대표
- **GPT-Neo (1.3B, 2.7B):** The Pile로 학습, 부분적 투명성 시나리오 → 공개 데이터셋이 있지만 추가 비공개 데이터도 존재

### 3.2 생성 태스크에서의 PerProb

PerProb는 학습 전후의 모델 출력 차이를 비교하여 기억화를 평가한다. 두 가지 핵심 메트릭을 사용한다:

**Perplexity (PPL):**

PPL(W) = exp(−(1/N) × Σ log p_θ(w_i | w_{<i}))

**평균 로그 확률 (λ(W)):**

λ(W) = (1/N) × Σ log p_θ(w_i | w_{<i})

**핵심 직관:** 모델이 특정 학습 데이터를 기억했다면, 해당 데이터에 더 높은 likelihood를 부여한다. 따라서:
- 기억화된 데이터: 낮은 PPL, 높은 λ(W)
- 비기억화 데이터: 높은 PPL, 낮은 λ(W)

PerProb는 라벨 없이, shadow 모델과 victim 모델 간의 PPL과 λ(W) 차이를 통해 학습 유도 기억 효과를 추정한다.

### 3.3 분류 태스크

분류 태스크에서는 ground-truth 라벨을 사용하여 직접적으로 MIA를 평가한다. LLM이 입력 데이터에 대해 예측한 클래스 확률을 기반으로, **Random Forest (RF)**와 **Multi-Layer Perceptron (MLP)**을 공격 모델로 사용한다. F1-score가 50% (랜덤 추측) 이상이면 공격이 성공한 것으로 간주한다.

---

## 4. 위협 모델 분류 (Threat Model Taxonomy)

MIA를 4가지 공격 패턴으로 분류한다. 각 패턴에서 shadow 모델(S)은 victim 모델(V)의 프록시 역할을 한다.

![Figure 1: 4가지 공격 패턴의 구조](/images/papers/perprob-memorization/overview2.png)
*Figure 1: 생성 태스크와 분류 태스크에서의 4가지 공격 패턴 구조.*

### Adversary 1 (블랙박스)
- 미학습 LLM을 S로 사용, V의 학습 데이터와 동일 분포의 shadow 데이터셋(D_shadow)으로 학습
- 가장 현실적인 시나리오

### Adversary 2 (화이트박스)
- S가 V의 **모델 파라미터를 공유**
- V가 완전히 침해된 가장 심각한 시나리오

### Adversary 3 (블랙박스)
- **보조 데이터셋(D_aux)**과 D_shadow의 10%를 결합하여 S를 학습
- V의 학습 데이터와 분포가 다른 제한적 오버랩 시나리오

### Adversary 4 (화이트박스)
- V의 **학습 데이터 일부(D_victim의 부분집합)**에 접근 가능
- 부분적 데이터 누출 시나리오

---

## 5. 실험 설정 (Experimental Setup)

### 5.1 데이터셋

5개 공개 텍스트 데이터셋 사용:

| 데이터셋 | 설명 | 규모 |
|----------|------|------|
| IMDB | 극성 영화 리뷰, 긍정/부정 균형 | 50,000 |
| Agnews | 뉴스 기사, 4개 카테고리 | 2,000+ 소스 |
| 20Newsgroup | 20개 뉴스그룹 문서 | 18,846 |
| Bank77 | 온라인 뱅킹 쿼리, 평균 길이 56 | 13,083 |
| WOS (Web of Science) | 학술 논문, 134개 하위 카테고리 | 46,985 |

### 5.2 생성 태스크 설정

- **대상 데이터셋:** IMDB, Agnews, WOS (다양한 텍스트 유형)
- 각 데이터셋에 맞춤 프롬프트를 설계하여 **원본 LLM에서 1,000개 텍스트 생성 (D_ori)**
- 각 Adversary 별로 S가 생성한 데이터(D_ad1~D_ad4)에 대해 PerProb 측정
- Adversary 3에서는 IMDB↔Agnews, IMDB↔WOS, Agnews↔WOS 쌍으로 D_aux를 구성

### 5.3 분류 태스크 설정

- 5개 데이터셋 전체 사용, GPT-2에 집중
- RF: 단순 데이터셋(IMDB, Agnews, 20Newsgroup)은 estimator 100개, 복잡 데이터셋(Bank77, WOS)은 200개
- MLP: 단순 데이터셋은 hidden layer 3개, 복잡 데이터셋은 4개

### 5.4 모델 파라미터

- 생성 태스크: 10 에폭, 학습률 1e-6 (gradient explosion 방지)
- 분류 태스크: RF와 MLP를 데이터셋 특성에 맞게 구성

---

## 6. 실험 결과 (Evaluation)

### 6.1 생성 태스크 결과

#### GPT-2

![Figure 2: GPT-2에서의 4가지 공격 패턴별 생성 데이터 특성](/images/papers/perprob-memorization/gpt2.png)
*Figure 2: GPT-2에서 4가지 공격 패턴별 생성 데이터의 PerProb 특성.*

#### GPT-Neo 1.3B

![Figure 3: GPT-Neo 1.3B에서의 4가지 공격 패턴별 생성 데이터 특성](/images/papers/perprob-memorization/1.3B.png)
*Figure 3: GPT-Neo 1.3B에서 4가지 공격 패턴별 생성 데이터의 PerProb 특성.*

#### GPT-Neo 2.7B

![Figure 4: GPT-Neo 2.7B에서의 4가지 공격 패턴별 생성 데이터 특성](/images/papers/perprob-memorization/2.7B.png)
*Figure 4: GPT-Neo 2.7B에서 4가지 공격 패턴별 생성 데이터의 PerProb 특성.*

**주요 발견:**

- **Adversary 1, 2 (클래식 블랙/화이트박스):** 일반적으로 더 높은 λ(W)와 더 낮은 PPL을 보임 — V의 분포에 더 가까운 S를 사용하기 때문
- **Adversary 3, 4:** 더 높은 PPL과 더 많은 λ(W) = -∞ 인스턴스 발생
- **모델 크기 효과:** 더 큰 모델(GPT-Neo 2.7B)이 더 많은 λ(W) = -∞, PPL = ∞ 값을 생성 → 학습 후에도 학습 데이터를 크게 기억하지 않고 강한 일반화 능력을 유지함을 시사
- **데이터셋 특성:** IMDB, Agnews는 잘 정의된 의미 구조로 상대적으로 일관된 결과를 보이지만, WOS는 100개 이상의 하위 카테고리로 더 큰 변동을 보임
- **Adversary 3에서 D_aux의 역할:** 의미적으로 유사한 D_aux (예: Agnews에 대한 20Newsgroup)가 더 낮은 PPL과 높은 λ(W)를 생성 → 공격 효과 향상

> **Finding 1:** MIA의 효과는 학습 데이터셋과 LLM의 생성 능력에 의존한다. 큰 모델은 더 강한 일반화와 과적합 저항을 보이고, 작은 모델은 MIA에 더 민감하다.

### 6.2 분류 태스크 결과

#### Adversary 1 & 2
- 5개 데이터셋 평균 F1-score: Adversary 1 = **71.41%**, Adversary 2 = **73.66%** → 성공적인 MIA
- Adversary 2가 V의 학습된 파라미터를 활용하여 약간 더 높은 성능

#### Adversary 3

![Figure 5: Adversary 3에서 victim과 auxiliary 데이터셋의 MIA precision/recall](/images/papers/perprob-memorization/att3_imdb.png) ![](/images/papers/perprob-memorization/att3_ag.png)
![](/images/papers/perprob-memorization/att3_news.png) ![](/images/papers/perprob-memorization/att3_bank.png)
*Figure 5: Adversary 3에서 victim과 auxiliary 데이터셋의 MIA precision과 recall.*

- Adversary 1 대비 precision이 약 5% 감소
- D_aux와 D_victim의 유사성이 핵심: Agnews에 대해 20Newsgroup을 D_aux로 사용했을 때 precision 79.86%, recall 77.63%

#### Adversary 4

![Figure 6: Adversary 4에서 공격 모델의 F1-score](/images/papers/perprob-memorization/att4_imdb.png) ![](/images/papers/perprob-memorization/att4_ag.png) ![](/images/papers/perprob-memorization/att4_news.png)
![](/images/papers/perprob-memorization/att4_bank.png) ![](/images/papers/perprob-memorization/att4_wos.png)
*Figure 6: Adversary 4에서 shadow 모델과 공격 모델(RF, MLP)의 F1-score.*

- D_victim에서의 학습 데이터 증가에 따라 S의 F1-score가 일관되게 향상
- S의 성능이 최적이 아니어도 공격 모델 A가 60% 이상의 F1-score 달성 → S의 posterior 분포가 멤버십 추론에 충분한 정보를 인코딩

> **Finding 2:** 같은 주제의 보조 데이터셋이 공격 모델의 효과를 향상시킨다. 또한 공격 모델은 victim 데이터의 최소한의 누출로도 성공적으로 MIA를 수행할 수 있다.

---

## 7. 방어 전략 (Defenses)

3가지 프라이버시 보호 기법을 평가한다.

### 7.1 기법

- **Knowledge Distillation (KD):** 대형 teacher 모델(GPT-Neo 2.7B)에서 소형 student 모델(GPT-2 medium, GPT-Neo 1.3B)로 지식 전달. Temperature 2, KL divergence loss 최소화.
- **Early Stopping (ES):** PPL을 모니터링하며 성능 안정화 시 학습 중단. 임계값 0.001~0.01.
- **Differential Privacy (DP):** 출력 posterior에 Laplace 분포 노이즈 주입. 개선된 DP에서는 최대 posterior 값을 노이즈 평균(μ)으로 사용. 프라이버시 예산 ε = 0.5, 1, 2.

### 7.2 생성 태스크 방어 결과

**GPT-2에서의 KD/ES 효과:**

| 데이터셋 | Adversary 1 PPL | KD PPL | ES PPL | Adversary 1 λ(W) | KD λ(W) | ES λ(W) |
|----------|----------------|--------|--------|-------------------|---------|---------|
| IMDB | 252.22 | 201.83 | **478.23** | -18.56 | **-23.5** | -19.52 |
| Agnews | 1149.91 | 205.35 | **1483.73** | -38.76 | **-51.32** | -35.84 |
| WOS | 240.17 | 179.23 | 245.27 | -24.62 | **-29.25** | **-26.49** |

- **ES:** PPL 상승에 우수 (과적합 방지로 모델의 학습 데이터 적응을 차단)
- **KD:** λ(W) 감소에 우수 (일반화 지식 전달로 모델 confidence 감소)
- **단, Adversary 3에서 KD의 한계:** D_aux와 D_victim의 의미적 유사성이 있을 때, KD가 오히려 S와 V 간 정렬을 향상시켜 PPL이 감소할 수 있음

> **Finding 3:** KD와 ES 모두 LLM의 MIA 위험을 효과적으로 완화한다. ES는 PPL 상승에, KD는 λ(W) 감소에 더 우수하다. 또한 공격 패턴에 따라 적절한 방어 전략 선택이 중요함을 강조한다.

### 7.3 분류 태스크 방어 결과 (Differential Privacy)

**전통 DP와 개선된 DP의 F1-score 비교 (일부 발췌):**

| DP μ | ε | IMDB Adv.1 | Agnews Adv.1 | 20News Adv.1 | Bank77 Adv.1 | WOS Adv.1 |
|------|---|------------|--------------|--------------|--------------|-----------|
| 0 | 0.5 | 0.644 | **0.706** | 0.604 | 0.725 | 0.549 |
| Max posterior | 0.5 | **0.626** | 0.714 | **0.572** | 0.722 | **0.525** |
| Original | - | 0.652 | 0.765 | 0.711 | 0.753 | 0.689 |

- 20Newsgroup과 WOS에서 DP 효과가 가장 뚜렷 (각각 12.43%, 16.15% 개선)
- **개선된 DP(μ = max posterior)가 전통 DP보다 일관되게 우수**, 특히 카테고리 복잡도가 높은 데이터셋에서
- 낮은 프라이버시 예산(작은 ε)이 DP 효과를 증폭시키지만, 모델 성능과의 트레이드오프 존재

![Figure 7: Adversary 4에서 DP 메커니즘 하의 공격 모델 F1-score](/images/papers/perprob-memorization/dp_imdb.png) ![](/images/papers/perprob-memorization/dp_ag.png) ![](/images/papers/perprob-memorization/dp_news.png)
![](/images/papers/perprob-memorization/dp_bank.png) ![](/images/papers/perprob-memorization/dp_wos.png)
*Figure 7: Adversary 4에서 DP 메커니즘 하의 공격 모델 F1-score.*

> **Finding 4:** Adversary 3을 제외하면, DP는 MIA를 유의미하게 방어할 수 있으며, 개선된 DP(최대 posterior를 노이즈 분포의 평균으로 설정)의 효과가 더 두드러진다.

---

## 8. 한계점 (Limitations)

1. **모델 규모의 제한:** GPT-2, GPT-Neo 등 중간 규모 오픈소스 모델에 집중. GPT-4나 Claude 같은 대규모 독점 LLM에 대한 평가는 향후 과제.
2. **프롬프트 일관성 가정:** 생성 태스크에서 shadow와 victim 모델 간 일관된 프롬프트를 가정. 실제 배포 환경의 프롬프트 변동성은 메트릭 안정성에 영향을 줄 수 있음.
3. **분류 공격 모델의 제한:** RF와 MLP만 사용. GBDT, neural attacker 등 다른 공격 모델로의 확장이 필요.
4. **기존 MIA 방법과의 직접 비교 부재:** 기존 shadow 모델 공격이나 confidence 기반 thresholding은 LLM 평가 제약(라벨 및 내부 접근 필요)과 맞지 않아 직접 비교하지 않음.

---

## 9. 결론

PerProb는 PPL과 λ(W)를 사용하여 LLM의 기억화를 간접적으로 평가하는 통합 프레임워크이다. 핵심 발견:

- **큰 모델(GPT-Neo 2.7B):** 더 강한 일반화 능력과 기억화 저항성을 보임
- **작은 모델(GPT-2):** 과적합과 직접적 기억화에 더 취약
- **방어 전략:** KD는 λ(W) 감소에, ES는 PPL 상승에 더 효과적이며, DP는 블랙박스 설정이나 높은 카테고리 복잡도 데이터셋에서 특히 효과적
- **KD의 미묘한 한계:** 의미적으로 유사한 D_aux를 사용하는 Adversary 3에서 오히려 S와 V 간 정렬을 향상시킬 수 있음
- 공격 패턴에 따른 적절한 방어 전략 선택의 중요성을 강조하며, KD, ES, DP의 결합 가능성을 시사
