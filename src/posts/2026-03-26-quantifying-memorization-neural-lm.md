---
title: "Quantifying Memorization Across Neural Language Models"
date: 2026-03-26
summary: "LLM의 암기(memorization)를 대규모로 정량 분석한 최초의 종합 연구. GPT-Neo, T5, OPT 세 모델 패밀리에 걸쳐 (1) 모델 크기, (2) 데이터 중복 횟수, (3) 컨텍스트 길이가 암기에 미치는 영향을 세 가지 log-linear 관계로 정립. GPT-J 6B 모델이 학습 데이터의 최소 1%를 추출 가능하게 암기하고 있음을 실증. 중복 제거(deduplication)의 효과와 한계, discoverability 현상도 분석."
tags: [LLM, Memorization, Privacy, Scaling Laws, Data Duplication, GPT-Neo, T5, OPT, 연구노트]
category: 연구노트
language: ko
---

# Quantifying Memorization Across Neural Language Models

**학회:** ICLR 2023
**저자:** Nicholas Carlini, Daphne Ippolito, Matthew Jagielski, Katherine Lee, Florian Tramèr, Chiyuan Zhang (Google Research, University of Pennsylvania, Cornell University)
**논문 링크:** [OpenReview](https://openreview.net/forum?id=TatRHT_1cK)

---

## 한 줄 요약

LLM이 학습 데이터를 얼마나 암기하는지를 세 가지 축(모델 크기, 데이터 중복, 컨텍스트 길이)에서 정량적으로 분석하여, 각 축에서 **log-linear 관계**를 발견하고, GPT-J 6B 모델이 The Pile의 최소 **1%**를 extractable하게 암기하고 있음을 실증한 연구.

---

## 1. 논문 개요

대규모 언어 모델(LM)은 학습 데이터의 일부를 암기(memorize)하여, 적절한 프롬프트가 주어지면 학습 데이터를 그대로(verbatim) 출력하는 것으로 알려져 있다. 이는 프라이버시 침해(사용자 데이터 노출), 유틸리티 저하(반복되는 저품질 텍스트), 공정성 문제(특정 텍스트가 다른 텍스트보다 더 잘 암기됨) 등의 문제를 야기한다.

그러나 기존 연구는 대부분 암기의 **존재(existence)**를 정성적으로 보여주는 데 그쳤으며, **얼마나 많은 데이터가 암기되는지**를 정량적으로 측정하지 못했다. 예를 들어, Carlini et al. (2020)의 GPT-2 추출 공격은 40GB 학습 데이터에서 단 600개의 암기된 예시만 (수동으로) 발견하여, 전체 데이터의 0.00000015%만이 암기된 것으로 나타났다.

본 논문은 세 가지 모델 패밀리(GPT-Neo, T5, OPT)와 각각의 학습 데이터셋에 걸쳐 암기를 **포괄적으로 정량화**하며, 세 가지 log-linear 관계를 발견한다:

1. **모델 크기(Model Scale)**: 모델이 클수록 더 많이 암기 — 모델 크기 10배 증가 시 암기율 19 percentage point 증가
2. **데이터 중복(Data Duplication)**: 학습 데이터에서 더 많이 반복된 시퀀스일수록 더 잘 추출됨
3. **컨텍스트 길이(Context Length)**: 더 긴 프롬프트를 제공할수록 더 많은 암기된 데이터 발견 가능

핵심 결과: GPT-J 6B 모델은 The Pile 학습 데이터의 **최소 1%**를 추출 가능하게 암기하고 있다 — 이전 추정치보다 수 자릿수(orders of magnitude) 높은 수치이다.

---

## 2. 방법론 (Methodology)

### 2.1 Extractable Memorization 정의

본 논문은 다음과 같이 memorization을 정의한다:

> **Definition (Extractable with k tokens of context):** 문자열 s가 모델 f에서 k개 토큰의 context로 extractable하다 함은, 길이 k인 문자열 p가 존재하여 [p || s]가 f의 학습 데이터에 포함되어 있고, p를 프롬프트로 주었을 때 greedy decoding으로 모델이 s를 생성하는 것을 말한다.

예를 들어, 학습 데이터에 "My phone number is 555-6789"가 포함되어 있고, "My phone number is"를 프롬프트로 주었을 때 모델이 "555-6789"를 생성하면, 이 시퀀스는 4개 단어의 context로 extractable하다.

**왜 이 정의를 사용하는가?**

- **Counterfactual memorization** (Feldman, 2020; Zhang et al., 2021): 수백~수천 개의 모델을 학습해야 하므로 대규모 LLM에 비현실적
- **Exposure** (Carlini et al., 2019): 시퀀스당 수천 번의 생성이 필요하며, 인공적으로 설계된 학습 예제에만 적용 가능
- **k-eidetic memorization** (Carlini et al., 2020): unprompted memorization에는 유용하지만, 학습 데이터로 프롬프팅하여 tight bound를 구하는 데는 부적합

### 2.2 평가 데이터 선택 전략

전체 학습 데이터에 대해 테스트하는 것은 계산적으로 불가능하므로(GPT-J 6B 기준 약 30 GPU-years 소요), 두 가지 서브셋 전략을 사용한다:

**1) 균일 랜덤 샘플링 (Uniform Random Sampling)**
- 50,000개 시퀀스를 학습 데이터에서 비복원 추출
- 전체 암기량의 절대적 추정에 유용

**2) 중복 횟수 정규화 샘플링 (Duplicate-Normalized Sampling)**
- 중복 횟수 분포가 극도로 치우쳐 있으므로(heavy-tailed), 균일 샘플링으로는 고빈도 중복 시퀀스를 포착하기 어려움
- 각 시퀀스 길이 ℓ ∈ {50, 100, 150, ..., 500}에 대해, 2^{n/4} ~ 2^{(n+1)/4}번 반복된 시퀀스 1,000개씩 샘플링
- 총 약 500,000개 시퀀스 수집
- suffix array (Lee et al., 2021)를 활용하여 800GB 데이터셋에서 효율적으로 중복 횟수 계산

**평가 방식:** 각 시퀀스를 prefix(길이 ℓ-50)와 suffix(50 토큰)로 분할 → prefix를 모델에 제공 → 생성된 50 토큰이 실제 suffix와 정확히 일치하면 "extractable"로 판정. 50 토큰은 평균 127자 / 25단어에 해당하며, 전형적인 영어 문장 길이를 초과한다.

---

## 3. 주요 실험 결과 (GPT-Neo)

### 3.1 모델 크기와 암기 (Bigger Models Memorize More)

**실험 모델:** GPT-Neo 125M, 1.3B, 2.7B, GPT-J 6B (모두 The Pile로 학습)
**베이스라인:** GPT-2 125M ~ 1.5B (WebText로 학습, The Pile이 아닌 다른 데이터셋)

![Figure 1a: 모델 크기 vs 암기율](/images/papers/quantifying-memorization/fig1a_model_size.png)
*Figure 1a: 모델 크기에 따른 extractable 시퀀스 비율. GPT-Neo(녹색)는 모델 크기에 따라 log-linear 관계(R²=99.8%)를 보인다. GPT-2(노란색)는 The Pile로 학습하지 않았으므로 "일반화"로 인한 정확한 생성만을 측정하는 베이스라인 역할을 한다.*

**핵심 결과:**

- **Log-linear 관계**: 모델 크기 10배 증가 → 암기율 19 percentage point 증가 (R² = 99.8%)
- **일반화가 아닌 진정한 암기**: GPT-2는 약 6%만 정확히 완성하는 반면, 비슷한 크기의 GPT-Neo 1.3B는 약 40%를 정확히 완성 → 크기 증가에 따른 암기 증가는 단순한 일반화 능력 향상이 아님
- GPT-2가 맞춘 예시들은 대부분 숫자 시퀀스, 같은 토큰의 반복, 흔한 구문 등 "흥미롭지 않은" 시퀀스

### 3.2 데이터 중복과 암기 (Repeated Strings are Memorized More)

![Figure 1b: 데이터 중복 vs 암기율](/images/papers/quantifying-memorization/fig1b_data_duplication.png)
*Figure 1b: 학습 데이터에서의 반복 횟수에 따른 extractable 시퀀스 비율. Log-linear 관계를 보인다.*

**핵심 결과:**

- 중복 횟수와 암기 사이에 **명확한 log-linear 관계** 존재
- 소수 번 반복된 시퀀스는 거의 암기되지 않지만, 고빈도 중복 시퀀스의 암기 확률은 급격히 증가
- **Deduplication**의 긍정적 효과를 뒷받침하지만, 소수의 중복만으로도 암기가 발생 → deduplication만으로는 완벽한 방지 불가

### 3.3 컨텍스트 길이와 암기 (Longer Context Discovers More Memorization)

![Figure 1c: 컨텍스트 길이 vs 암기율](/images/papers/quantifying-memorization/fig1c_context_length.png)
*Figure 1c: 프롬프트 토큰 수에 따른 extractable 시퀀스 비율. 컨텍스트가 길어질수록 log-linear하게 더 많은 암기 발견.*

**핵심 결과:**

- 50 토큰 context에서 GPT-J 6B 모델이 33%의 시퀀스를 추출 가능 → 450 토큰 context에서 **65%**로 증가
- **Discoverability 현상**: 일부 암기는 충분히 긴 context가 주어져야만 드러남 — 모델 내에 "숨겨진" 암기가 존재
- **보안 측면**: 긴 프롬프트가 필요한 암기는 공격자가 추출하기 어렵고, 비적대적 상황에서의 자발적 데이터 유출도 줄어듦
- **감사 측면**: 프라이버시 감사(auditing) 시 학습 데이터로 프롬프팅해야 암기의 전체 범위를 파악 가능

---

## 4. 추가 실험 설정 (Alternate Experimental Settings)

### 4.1 균일 랜덤 샘플링 결과

![Figure 2a: 균일 랜덤 샘플에서의 모델 크기 효과](/images/papers/quantifying-memorization/fig2a_random_model_size.png)
*Figure 2a: 학습 데이터에서 균일하게 샘플링한 경우의 결과. 동일한 정성적 트렌드를 보인다.*

- 균일 랜덤 샘플에서도 동일한 정성적 트렌드 확인
- GPT-J 6B: 길이 1000 시퀀스의 마지막 50 토큰을 **7%** 확률로 추출 가능 (GPT-Neo 125M: 4%, GPT-2 XL: 2%)
- **The Pile 데이터의 최소 1%가 GPT-J 6B에 의해 extractable** (GPT-2 XL로는 추출 불가)

### 4.2 디코딩 전략 비교

![Figure 2c: Beam search 및 전체 데이터셋 탐색](/images/papers/quantifying-memorization/fig2c_beam_search.png)
*Figure 2c: (좌) Beam search(b=100) 사용 시 greedy보다 약간 더 많은 암기 발견. (우) 생성 결과를 전체 학습 데이터와 비교하면 상당히 더 많은 암기 발견.*

- **Beam search (b=100)**: Greedy 대비 평균 2 percentage point 증가, 최대 5.6% 증가. Greedy와 동일한 출력을 내는 비율은 45%
- **전체 데이터셋 탐색**: 특정 prefix의 ground truth suffix와 비교하는 대신, 생성 결과가 학습 데이터 **어디에든** 존재하는지 확인 → 100번 반복 시퀀스에서 ground truth 매칭 15.8% vs 전체 데이터셋 매칭 **32.6%**

---

## 5. 모델 패밀리 간 Replication Study

### 5.1 T5 (Masked Language Model, C4 데이터셋)

| 항목 | 세부 사항 |
|------|----------|
| **모델** | T5 v1.1 (77M ~ 11B 파라미터) |
| **학습 데이터** | C4 (806GB, Common Crawl 기반) |
| **학습 목표** | Masked Language Modeling (15% 토큰 랜덤 마스킹 후 복원) |

![Figure 3a: T5 모델 크기 vs 암기율](/images/papers/quantifying-memorization/fig3a_t5_size.png)
*Figure 3a: T5에서도 모델 크기에 따른 암기 증가 트렌드 확인.*

![Figure 3b: T5 데이터 중복 vs 암기율](/images/papers/quantifying-memorization/fig3b_t5_dups.png)
*Figure 3b: T5에서 중복 횟수와 암기의 관계. GPT-Neo에 비해 훨씬 큰 분산(variance)을 보임.*

**핵심 발견:**

- 모델 크기에 따른 스케일링 트렌드는 **재현**됨
- 그러나 절대적 암기량은 causal LM 대비 **한 자릿수(order of magnitude) 낮음**: T5 3B가 100번 반복 시퀀스의 3.5%를 암기 vs GPT-Neo 2.7B가 53.6% 암기
- 데이터 중복과의 관계에서는 **단조(monotonic) 스케일링이 깨짐** — 통계적으로 유의미하게, 159~196번 반복된 시퀀스보다 138~158번 반복된 시퀀스가 더 잘 암기됨
- 원인: 138~158번 반복 버킷의 시퀀스 대부분이 whitespace 토큰으로 구성되어 예측이 매우 쉬웠음

### 5.2 Deduplicated C4 모델

![Figure 3c: Deduplicated 데이터로 학습한 모델](/images/papers/quantifying-memorization/fig3c_dedup.png)
*Figure 3c: C4 원본, 문서 수준 중복 제거, 문자열 수준 중복 제거 모델의 비교.*

| 모델 | 설명 |
|------|------|
| **C4 원본** | 중복 제거 없이 학습 |
| **Near-dup 제거** | 유사 문서(near-duplicate) 제거 후 학습 |
| **Exact-dup 제거** | 50 토큰 이상 정확히 동일한 문자열 제거 후 학습 |

**핵심 발견:**

- 중복 제거된 데이터로 학습한 모델이 확실히 **덜 암기함**: 35번 이하 반복 시퀀스에서 exact dedup 모델 1.2% vs 원본 3.6% (3배 차이, p < 10⁻¹⁵)
- **그러나 100번 이상 반복된 시퀀스에서는 중복 제거 효과가 사라짐!** — 408번 이상 반복 시퀀스의 extractability는 이전 버킷보다 통계적으로 유의미하게 높음
- 원인: 대규모 데이터에서 중복 제거 전략은 필연적으로 불완전(imperfect)하며, 고빈도 중복은 일부가 살아남아 암기로 이어짐

### 5.3 OPT (The Pile 변형 데이터셋)

| 항목 | 세부 사항 |
|------|----------|
| **모델** | OPT 125M ~ 66B |
| **학습 데이터** | The Pile 기반이지만 수정된 800GB 데이터셋 (일부 소스 추가/제거, 중복 제거 포함) |

![Figure 4: OPT 모델 크기 vs 암기율](/images/papers/quantifying-memorization/fig4_opt_size.png)
*Figure 4: OPT 모델에서의 크기별 암기율.*

![Figure 4: OPT 데이터 중복 vs 암기율](/images/papers/quantifying-memorization/fig4_opt_dups.png)
*Figure 4: OPT 모델에서 데이터 중복 횟수와 암기의 관계.*

**핵심 발견:**

- 스케일링 트렌드는 GPT-Neo와 **거의 동일**하게 재현
- 그러나 **절대적 효과 크기(effect size)는 수 자릿수(orders of magnitude) 작음** — 66B 모델조차 GPT-Neo 125M보다 The Pile의 시퀀스를 덜 암기
- 두 가지 가능한 설명: (a) 신중한 데이터 큐레이션과 학습이 암기를 완화할 수 있음, (b) 학습 데이터 분포의 작은 변화만으로도 어떤 콘텐츠가 암기되는지가 크게 달라질 수 있음

---

## 6. 결론 (Conclusion)

| 핵심 결론 | 세부 내용 |
|----------|----------|
| **Log-linear 스케일링** | 모델 크기, 데이터 중복, 컨텍스트 길이 모두 암기와 log-linear 관계 |
| **예상보다 훨씬 많은 암기** | GPT-J 6B는 The Pile의 최소 1%를 extractable하게 암기 (이전 추정치 대비 수 자릿수 증가) |
| **미래 대형 모델의 위험** | 현 SOTA 모델은 분석 대상(6B)보다 200배 이상 큼 → 더 극심한 암기 예상 |
| **Discoverability** | 암기는 존재하지만 발견하기 어려울 수 있음 → 감사와 공격 모두에 영향 |
| **Deduplication의 한계** | 중복 제거는 효과적이지만 완벽하지 않음 → 고빈도 중복에는 효과 감소 |
| **일반화 연구에 대한 시사점** | 대형 모델이 학습 데이터의 통계적 특성을 정확히 모델링하더라도, 의도된 기저 분포가 아닌 데이터셋의 quirks(중복 등)를 학습할 수 있음 |

---

## 7. 관련 연구 (Related Work)

### 7.1 Training Data Extraction Attacks

Carlini et al. (2020)은 GPT-2에서 URL, 전화번호, 개인정보 등을 추출하는 공격을 시연했으나, 정량적이라기보다 정성적 분석에 가까웠다 (600개 예시만 발견). Ziegler et al. (2021)은 GitHub Copilot에서 코드 추출을 시도했다. 본 논문은 이러한 공격의 존재를 보이는 것을 넘어, 모델이 **얼마나 많이** 암기하는지를 정밀하게 정량화한다.

### 7.2 Memorization 정의

다양한 memorization 정의가 제안되어 왔다: differential privacy (Dwork et al., 2006), counterfactual memorization (Feldman, 2020; Zhang et al., 2021), exposure (Carlini et al., 2019), k-eidetic memorization (Carlini et al., 2020). 본 논문은 학습 데이터에 접근 가능한 상황에서 가장 실용적이고 actionable한 "extractable with k tokens of context" 정의를 채택한다.

### 7.3 Privacy Attacks on ML

Membership inference attacks (Shokri et al., 2017; Yeom et al., 2018), property inference (Ganju et al., 2018; Fredrikson et al., 2015) 등의 프라이버시 공격이 연구되어 왔다. 본 논문은 언어 모델링에 특히 관련성이 높은 extraction attacks에 집중하며, 이는 데이터 중복과 함께 심화되는 특성을 가진다.

### 7.4 Scaling Laws

모델 크기와 암기의 관계에 대한 예비 증거(Carlini et al., 2020의 GPT-2 URL 실험), 데이터 중복의 영향(Lee et al., 2021), 컨텍스트 길이의 영향(Carlini et al., 2020; Ziegler et al., 2021) 등 선행 연구의 가설을 본 논문이 대규모 실험으로 검증하고 정량화한다.
