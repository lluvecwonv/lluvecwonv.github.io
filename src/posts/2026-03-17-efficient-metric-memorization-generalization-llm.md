---
title: "Prior-Aware Memorization: LLM 암기와 일반화를 구분하는 효율적 메트릭"
date: 2026-03-17
summary: "LLM에서 암기(memorization)와 일반화(generalization)를 구분하는 계산 비용이 저렴한 새 메트릭 Prior-Aware(PA) Memorization 제안. 추가 모델 학습 없이 기존 LLM에 바로 적용 가능. Llama·OPT 모델 평가 결과, 기존에 '암기됨'으로 분류된 시퀀스의 55~90%가 실제로는 통계적으로 흔한(generalizable) 시퀀스임을 발견. Counterfactual Memorization과 양의 상관관계 확인. GPT-2 124M 모델 350개 이상 학습, Named Entity·Long Sequence·SATML Challenge 3가지 설정에서 평가."
tags: [LLM, Memorization, Generalization, Privacy, Prior-Aware, Counterfactual Memorization, 연구노트]
category: 연구노트
language: ko
---

# Efficient Metric for Distinguishing Memorization from Generalization in Large Language Models

**학회:** Under review as a conference paper at ICLR 2026
**저자:** Anonymous authors (double-blind review)
**논문 링크:** [OpenReview](https://openreview.net/forum?id=lduxR2cLsS)

---

## 한 줄 요약

추가 모델 학습 없이 LLM의 암기(memorization)와 일반화(generalization)를 구분할 수 있는 효율적인 메트릭 **Prior-Aware (PA) Memorization**을 제안하며, 기존에 "암기됨"으로 분류된 시퀀스의 최대 90%가 실제로는 통계적으로 일반적인 시퀀스임을 밝힘.

---

## 1. 논문 개요

대규모 언어 모델(LLM)에서 학습 데이터 유출(training data leakage)은 저작권·라이선스 위반과 개인식별정보(PII) 유출이라는 두 가지 중요한 문제를 야기한다.

기존의 **Extractable Memorization** (Carlini et al., 2022)은 모델이 학습 데이터를 높은 확률로 그대로 생성하는 경우를 "암기"로 분류하지만, **모델의 일반화 능력을 간과**한다. 예를 들어, "The murder was committed by"라는 프롬프트에 "John Doe"가 나오는 것은 암기가 아니라 "John Doe"가 흔한 이름이기 때문이다.

**Counterfactual Memorization** (Zhang et al., 2023)은 보다 정교하지만, 모든 학습 시퀀스에 대해 별도의 baseline 모델을 학습해야 하므로 프로덕션 모델에 적용하기 매우 비현실적이다.

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

k개 토큰의 suffix s = t_{j+1:j+k}가 j-토큰 prefix p로부터 생성될 확률:

> P(s | p) = ∏_{i=j+1}^{j+k} P(t_i | t_{1:i-1})

이는 **단일 forward pass**로 계산 가능하다.

### 3.3 P(s; M) 계산: 몬테카를로 추정

P(s)를 모든 가능한 prefix에 대해 정확히 계산하는 것은 불가능하므로, **몬테카를로 적분에 기반한 비편향 추정량**을 사용한다:

> v̂_s = (1/c) Σ_{i=0}^{c} P(s | q_i)

여기서 q_i는 V*의 분포에 따라 독립적으로 샘플링된 랜덤 prefix이다.

**이론적 보장:**

- **Theorem 1**: E[v̂_s] = v_s (비편향 추정량)
- **Theorem 2**: Var[v̂_s] = (1/c) · Var[P(s | p_i)] ≤ 1/(4c) (분산 상한)

샘플 수 c가 증가하면 추정 오차가 0에 수렴한다.

---

## 4. Counterfactual Memorization과의 상관관계 검증

### 4.1 실험 세팅

| 항목 | 세부 사항 |
|------|----------|
| **모델** | 124M parameter GPT-2 |
| **학습 데이터** | 1,000개 Wikitext 문서 |
| **학습 모델 수** | 350개 이상 |
| **타겟 시퀀스 수** | 25개 |
| **Near-duplicate 정의** | 20% 토큰 오버랩 (기존 연구보다 보수적) |

**Near-duplicate 주입 전략:**

학습 데이터에 타겟 시퀀스의 exact copy와 near-duplicate의 비율을 변화시켜 7가지 데이터셋 구성:

| 설정 | (Exact Copies, Near-Duplicates) |
|------|-------------------------------|
| 1 | (0, 180) |
| 2 | (10, 150) |
| 3 | (20, 120) |
| 4 | (30, 90) |
| 5 | (40, 60) |
| 6 | (50, 30) |
| 7 | (60, 0) |

총 학습 셋 크기는 항상 1,000으로 고정하며, exact vs near-duplicate 비율만 변경한다.

25개 타겟 시퀀스 × 7가지 설정 = **175개 모델** 학습

![Table 1: Near-duplicate 예시](/images/pa-memorization/table1_near_duplicate.png)
*Table 1: 하나의 시퀀스와 가능한 20% near-duplicate. 일치하는 토큰이 하이라이팅되어 있다.*

**Baseline Model:**

Counterfactual memorization 계산을 위한 baseline 모델은 타겟 시퀀스의 exact copy만 제거하고 near-duplicate은 유지하여 학습한다.

### 4.2 측정 방법

**Counterfactual Memorization:**
> E_M[log(P(s | p; M))] − E_{M'}[log(P(s | p; M'))]

**PA Memorization:**
> E_M[log(P(s | p; M) / v̂_s)] = E_M[log(P(s | p; M))] − E_M[log(v̂_{s;M})]

PA memorization은 target model M만 필요하고 baseline model M'이 불필요하다.

### 4.3 결과

![Figure 1: Counterfactual Memorization vs PA Memorization](/images/pa-memorization/figure1_counterfactual_vs_pa.png)
*Figure 1: Counterfactual Memorization (x축) vs PA Memorization (y축). 두 메트릭이 다양한 학습 설정에서 양의 상관관계를 보인다. 각 데이터 포인트의 라벨은 (exact copies, near-duplicates) 수를 나타낸다.*

Near-duplicate이 줄어들면서 시퀀스가 덜 generic해질수록 counterfactual memorization과 PA memorization 모두 증가하며, **강한 양의 상관관계**를 확인할 수 있다.

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

![Figure 3: Prefix 길이별 PA Memorized 및 Extractable 시퀀스 수](/images/pa-memorization/figure3_prefix_length.png)
*Figure 3: 두 종류의 suffix에 대한 prefix 길이별 Extractable 및 PA Memorized 시퀀스 수.*

- 더 긴 prefix는 더 많은 PA memorized 시퀀스를 발견 가능
- 그러나 **4-토큰 Named Entity suffix**의 경우 긴 prefix의 효과가 제한적 → 많은 Named Entity가 웹 텍스트에서 흔하여 특정 프롬프트 없이도 생성 가능하기 때문

### 6.3 SATML Challenge 결과

![Figure 4: SATML Challenge 결과](/images/pa-memorization/figure4_satml.png)
*Figure 4: (a) SATML challenge 데이터셋 1K 시퀀스에 대한 모델 크기별 memorization. (b) P(s|p)와 P(s)의 exact copy 수에 따른 변화.*

놀라운 발견: 전체 학습 데이터에서 **단 한 번만 등장**하는 SATML challenge 시퀀스 중에서도 약 **40%가 "common"**한 것으로 나타남. 이는 시퀀스의 빈도만으로는 암기를 판단할 수 없음을 보여준다.

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

## 9. ICLR 2026 리뷰 결과: Reject

이 논문은 ICLR 2026에 제출되었으나 **Reject** 결정을 받았다. 5명의 리뷰어 평가와 Area Chair의 Meta Review를 정리한다.

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
