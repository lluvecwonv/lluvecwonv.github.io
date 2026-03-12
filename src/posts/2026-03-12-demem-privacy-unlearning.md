---
title: "Preserving Privacy Through DeMemorization: An Unlearning Technique For Mitigating Memorization Risks In Language Models 논문 분석"
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
*Figure 1: DeMem 프레임워크 개요. LLM을 대규모 코퍼스로 사전학습(중복 제거 적용)한 후, 학습 코퍼스의 부분집합을 사용해 음수 유사도 피드백으로 DeMem 정책을 학습한다.*

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
*Figure 2: 학습/평가 데이터의 시퀀스 분할. 200토큰 = Pre-Prefix(100) + Prefix(50) + Suffix(50).*

| 구간 | 토큰 수 | 용도 |
|------|---------|------|
| Pre-Prefix | 100 | 평가 시에만 사용 (longer context 공격 평가) |
| Prefix | 50 | 학습 + 평가 (입력) |
| Suffix | 50 | 학습 + 평가 (타겟) |

**평가 세팅 2가지:**
1. **Prefix만:** 50토큰 prefix로 suffix 예측
2. **Pre-Prefix + Prefix:** 150토큰 context로 suffix 예측 (discoverability 공격 시뮬레이션)

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

| Model | Method | #Samples | N-SacreBLEU↑ | LM ACC↑ | LM PPL↓ | GEN PPL↓ |
|-------|--------|----------|-------------|---------|---------|----------|
| **NEO 125M** | Baseline | 32/128/256 | 58.44 / 58.41 / 58.82 | 43.36 | 32.28 | 3.46 / 3.83 / 3.79 |
| | +UL | 32/128/256 | 99.19 / 99.69 / 99.63 | 38.62 / 36.87 / 36.34 | 31098 / 9.68M / 25146 | 19.77 / 6.54 / 6.03 |
| | **+DeMem** | 32/128/256 | **67.07 / 66.21 / 67.05** | **43.46** | **33.13** | **3.74 / 3.93 / 3.95** |
| **NEO 1.3B** | Baseline | 32/128/256 | 30.76 / 34.70 / 33.95 | 48.93 | 16.16 | - |
| | +UL | 32/128/256 | 99.57 / 98.33 / 99.15 | 48.61 / 41.55 / 41.34 | - | - |
| | **+DeMem** | 32/128/256 | **52.03 / 51.34 / 52.58** | **49.40** | **16.70** | **2.44 / 2.62 / 2.65** |
| **NEO 2.7B** | Baseline | 32/128/256 | - | - | - | - |
| | +UL | - | - | - | - | - |
| | **+DeMem** | 32/128/256 | - | **52.48** | **14.15** | **2.30 / 2.38 / 2.35** |

### 4.2 주요 결과: OPT — Deduplication + DeMem (Table 2)

| Model | Method | #Samples | N-SacreBLEU↑ | LM ACC↑ | LM PPL↓ | GEN PPL↓ |
|-------|--------|----------|-------------|---------|---------|----------|
| **OPT 125M** | Baseline | 32/128/256 | 89.24 / 90.98 / 91.03 | 41.28 | 31.94 | 9.69 / 9.76 / 9.67 |
| | +UL | 32/128/256 | 99.23 / 99.35 / 99.21 | 37.06 / 36.48 / 37.19 | 449K / 54.9M / 114K | 12.16 / 10.44 / 13.64 |
| | **+DeMem** | 32/128/256 | **94.88 / 95.30 / 95.61** | **42.25** | **33.13** | **10.86 / 10.78 / 10.58** |
| **OPT 1.3B** | Baseline | 32/128/256 | 71.63 / 71.96 / 71.70 | 51.65 | 16.41 | 6.72 / 6.92 / 6.80 |
| | +UL | 32/128/256 | 99.50 / 99.84 / 99.52 | 39.16 / 38.67 / 36.85 | ⋆(∞) | 11.19 / 7.93 / 10.70 |
| | **+DeMem** | 32/128/256 | **92.51 / 91.56 / 91.91** | **51.40** | **17.39** | **9.78 / 9.47 / 9.25** |
| **OPT 2.7B** | Baseline | 32/128/256 | 71.80 / 67.56 / 66.32 | 53.74 | 14.31 | 6.27 / 6.48 / 6.30 |
| | +UL | 32/128/256 | 99.54 / 97.77 / 99.37 | 49.70 / 47.42 / 39.80 | 324 / 41.5 / 118 | 4.93 / 9.67 / 4.53 |
| | **+DeMem** | 32/128/256 | **94.53 / 93.08 / 93.24** | **52.20** | **15.25** | **8.28 / 8.31 / 8.16** |

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
*Figure 3: 잊기 샘플 수(32/128/256)에 따른 NEO 모델별 평균 LM 성능. DeMem(파란 점선)은 안정적, UL(빨간 실선)은 급격한 성능 하락.*

핵심 차이점:
- **UL:** 샘플 수가 증가하면 성능이 급격히 하락 (NEO 2.7B: 49.5→39.4)
- **DeMem:** 샘플 수에 **무관하게 안정적** (NEO 2.7B: 52.5±0.3)
- DeMem은 **1회 파인튜닝**으로 **무제한** 샘플에 대한 universal policy를 학습

### 4.4 Deduplication + DeMem 조합

OPT 모델(deduplicated Pile 학습)에 DeMem을 추가 적용한 결과:
- OPT 모델은 이미 높은 baseline N-SacreBLEU (71~91%)
- DeMem 적용 후 **~94%까지 상승**, 성능 손실 **~0.5%**
- Deduplication 단독으로는 불충분하지만, DeMem과 조합하면 효과적

### 4.5 Discoverability 공격 방어 (Table 3)

Longer context (Pre-Prefix 100 + Prefix 50 = 150 토큰)를 사용한 공격에 대한 방어:

| Model | #Params | Before N-SacreBLEU↑ | Before PPL↓ | After N-SacreBLEU↑ | After PPL↓ |
|-------|---------|---------------------|-------------|---------------------|------------|
| NEO | 125M | 45.74 | 4.12 | 55.04 | 4.15 |
| NEO | 1.3B | 59.58 | 6.64 | 88.91 | 7.68 |
| NEO | 2.7B | 10.55 | 1.41 | 32.66 | 1.54 |
| OPT | 125M | 89.35 | 11.99 | 94.47 | 12.38 |
| OPT | 1.3B | 59.58 | 6.64 | 88.91 | 7.68 |
| OPT | 2.7B | 56.35 | 5.95 | 89.37 | 6.76 |

- 125M 모델: forgetting rate ~10% 증가
- **1.3B, 2.7B 모델: ~30% 증가**
- 큰 모델일수록 discoverability 공격에 대한 방어 효과가 큼

### 4.6 Approximate Memorization 임계값 분석

![임계값 분석](/images/papers/demem/figure_4_threshold.png)
*Figure 4: NEO 2.7B Longer Context에서 DeMem 적용 전후 SacreBLEU 분포. 빨간 영역이 75% 임계값 이상(메모리제이션 판정) 구간.*

SacreBLEU ≥ 75% 기준 memorized 샘플 수 변화:

| Model | Before | After | 감소율 |
|-------|--------|-------|-------|
| NEO 1.3B | 910 | 497 | **45.4%** |
| NEO 2.7B | 1,036 | 321 | **69.0%** |

DeMem 적용 후 분포가 75% 임계값 아래로 고르게 분산된다.

### 4.7 정성적 결과

![정성적 예시](/images/papers/demem/figure_5_qualitative.png)
*Figure 5: DeMem 적용 전후 생성 suffix 비교. 초록색 = 원본과 일치(메모리제이션), 빨간색 = 원본과 다른 부분.*

대표 사례:

| Prefix | True Suffix | Before DeMem | After DeMem |
|--------|-------------|-------------|-------------|
| "POT-Creation-Date: 2017-02-24..." | "-Translator: FULL NAME \<EMAIL\>..." | 거의 그대로 재생성 (N-SacreBLEU: 12.97) | Language-Team을 "English (India)"로 패러프레이즈 (N-SacreBLEU: 62.38) |
| "Free Software Foundation..." | "-sdk is distributed..." | ".org is distributed..." 유사하게 재생성 (16.41) | 다르게 생성 (99.95) |

핵심: DeMem은 메모리제이션된 개인 데이터(이메일 주소 등)를 효과적으로 패러프레이즈하지만, 일부 경우 perplexity가 증가할 수 있다.

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
