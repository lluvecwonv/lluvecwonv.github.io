---
title: "Measuring Memorization in Language Models via Probabilistic Extraction"
date: 2026-04-01
summary: "Google DeepMind, Google, Microsoft Research, Stanford, Northeastern의 NAACL 2025 논문. 기존 greedy sampling 기반 discoverable extraction의 한계를 지적하고, 비결정적 샘플링 환경에서 다중 쿼리를 고려하는 (n,p)-discoverable extraction을 제안한다. 추가 비용 없이 단일 쿼리로 추출 확률을 근사할 수 있으며, Pythia 12B에서 greedy 대비 최대 5배 이상 높은 추출률을 발견한다."
tags: [LLM, Memorization, Privacy, Extraction, Sampling, NAACL, 연구노트]
category: 연구노트
language: ko
---

# Measuring Memorization in Language Models via Probabilistic Extraction

**논문:** Hayes et al. (2025) | NAACL 2025
**저자:** Jamie Hayes, Marika Swanberg, Harsh Chaudhari, Itay Yona, Ilia Shumailov, Milad Nasr, Christopher A. Choquette-Choo, Katherine Lee, A. Feder Cooper
**소속:** Google DeepMind, Google, Northeastern University, Microsoft Research, Stanford University

---

## 한 줄 요약

LLM의 학습 데이터 추출(extraction)을 측정할 때, 기존의 greedy sampling 기반 일회성(one-shot) 판정은 비현실적이며, **확률적 관점의 (n,p)-discoverable extraction**으로 대체하면 추가 연산 비용 없이 훨씬 신뢰성 있는 추출 위험도를 정량화할 수 있다.

---

## 1. 서론: 왜 기존 추출 측정이 불완전한가

대규모 언어모델(LLM)은 학습 데이터의 일부를 기억(memorize)할 수 있으며, 이는 민감 정보 유출 위험을 야기한다. 이 문제를 측정하는 가장 대표적인 방법이 **discoverable extraction**이다: 학습 데이터를 prefix와 suffix로 나누고, prefix를 프롬프트로 제공한 뒤 모델이 suffix와 일치하는 텍스트를 생성하면 "추출 가능"으로 판정한다.

그러나 기존 discoverable extraction에는 중요한 한계가 있다:

1. **단일 쿼리(one-shot) 판정**: 한 번의 생성 결과만으로 yes/no를 결정한다. 현실에서 사용자는 같은 프롬프트로 여러 번 쿼리할 수 있다.
2. **Greedy sampling 의존**: 대부분의 기존 연구가 결정적(deterministic) greedy sampling을 사용한다. 하지만 실제 프로덕션 환경에서는 top-k, top-p, temperature 등 비결정적 샘플링이 일반적이다.
3. **추출 과소평가**: Greedy sampling은 각 스텝에서 **지역적으로 가장 확률이 높은 토큰**을 선택하지만, 이것이 **전체 시퀀스 수준에서 가장 확률이 높은 출력**과 다를 수 있다.

---

## 2. 배경: Discoverable Extraction과 샘플링 방식

### 2.1 기존 Discoverable Extraction 정의

학습 예제 $\mathbf{z} = (z_1, \ldots, z_j)$를 $a$-길이 prefix $\mathbf{z}_{1:a}$와 $k$-길이 suffix $\mathbf{z}_{a+1:a+k}$로 분할한다. 모델 $f_\theta$와 샘플링 방식 $g_\phi$의 조합으로 자기회귀적으로 생성한 결과가 suffix와 일치하면 추출 성공이다:

> $(g_\phi \circ f_\theta)^k(\mathbf{z}_{1:a}) = \mathbf{z}_{1:a+k}$

기존 연구에서의 일반적 설정은 prefix 50토큰, suffix 50토큰, greedy sampling이다.

### 2.2 샘플링 방식

- **Greedy sampling**: 매 스텝마다 가장 높은 확률의 토큰을 선택 (결정적)
- **Random sampling with temperature**: 온도 $T$로 분포의 날카로움을 제어하며 확률적으로 샘플링
- **Top-k sampling**: 상위 $k$개 토큰만 남기고 나머지 확률을 0으로 설정 후 정규화하여 샘플링

Carlini et al. (2022)은 top-k 같은 확률적 방식이 "언어적 새로움을 극대화"하므로 추출에 불리하다고 주장했으나, 이 논문은 **다중 쿼리 설정에서는 오히려 더 많은 추출을 발견할 수 있음**을 보인다.

---

## 3. 방법론: (n,p)-Discoverable Extraction

### 3.1 핵심 정의

**Definition 2 — (n, p)-discoverable extraction:**
학습 예제 $\mathbf{z}$를 prefix $\mathbf{z}_{1:a}$와 suffix $\mathbf{z}_{a+1:a+k}$로 분할했을 때, $n$번의 독립적 쿼리에서 target suffix를 **적어도 한 번** 생성할 확률이 $p$ 이상이면, $\mathbf{z}$는 $(n,p)$-discoverably extractable이다:

$$\Pr\left(\bigcup_{w \in [n]} (g_\phi \circ f_\theta)_w^k(\mathbf{z}_{1:a}) = \mathbf{z}_{1:a+k}\right) \geq p$$

기존 discoverable extraction은 $n=p=1$인 특수한 경우이다.

### 3.2 Greedy Sampling이 추출을 과소평가하는 메커니즘

![Figure 1 Left: Greedy sampling이 실패하는 예시. 파란색은 target과 일치, 빨간색은 불일치를 나타냄.](/images/papers/measuring-memorization/fig1a.png)

![Figure 1 Right: 각 토큰 위치에서 target 토큰의 확률 순위. Index 87에서 target 토큰이 rank 2인데, greedy는 항상 rank 1을 선택하므로 이후 완전히 다른 시퀀스를 생성한다.](/images/papers/measuring-memorization/fig1b.png)

위 Figure 1은 Pythia 12B에서의 구체적 예시이다. Target suffix가 전체적으로 더 높은 likelihood를 가지지만, greedy sampling은 index 87에서 rank-2인 토큰을 선택하지 못해 이후 시퀀스가 완전히 발산한다. 반면 top-k sampling ($k=40$, $T=1$)은 해당 rank-2 토큰을 선택할 수 있어, **한 번의 시도에서 16.2% 확률로 target을 정확히 추출**한다. 기대값으로 6번의 쿼리만으로 추출에 성공할 수 있다.

### 3.3 n과 p의 관계: 단일 쿼리 근사

단일 쿼리에서의 추출 확률 $p_\mathbf{z}$를 알면, $n$번 시도에서 최소 1회 추출 확률은:

$$1 - (1-p_\mathbf{z})^n \geq p$$

따라서:

$$n \geq \frac{\log(1-p)}{\log(1-p_\mathbf{z})}$$

핵심은 $p_\mathbf{z}$를 **단 한 번의 모델 forward pass**로 계산할 수 있다는 점이다. Target 시퀀스의 각 토큰에 대해 모델이 출력하는 조건부 확률을 순차적으로 곱하면 전체 시퀀스의 생성 확률을 얻는다. 이때 샘플링 방식(top-k, top-p 등)에 따른 확률 재정규화도 적용한다.

![Empirical p vs. Theoretical p 비교 (Pythia 6.9B, Wikipedia subset, 250개 예제). 단일 쿼리 근사와 1000번 실제 샘플링 결과가 정확히 일치한다.](/images/papers/measuring-memorization/empirical_p.png)

**추가적 장점**: 한 번의 forward pass로 모든 토큰의 조건부 log-확률을 얻으므로, **다양한 prefix/suffix 길이에 대한 추출률도 추가 쿼리 없이 계산 가능**하다.

### 3.4 비-정확(non-verbatim) 추출로의 확장

$(\epsilon, n, p)$-discoverable extraction은 거리 함수 $\text{dist}(\mathbf{b}, \mathbf{c}) \leq \epsilon$를 만족하는 모든 근사 일치까지 추출 범위를 확대한다. 실제 계산은 $\epsilon$-ball 내 suffix 수가 매우 클 수 있어 비용이 높지만, 논문에서는 효율적 근사 방법도 논의한다.

---

## 4. 실험 설정

### 4.1 모델

| 모델 | 크기 | 학습 데이터 |
|------|------|-------------|
| **Pythia** | 1B, 2.8B, 6.9B, 12B | The Pile (공개) |
| **GPT-Neo** | 1.3B | The Pile (공개) |
| **Llama 1** | 7B, 13B | Common Crawl 기반 (비공개) |
| **OPT** | 350M, 1.3B, 2.7B, 6.7B | 비공개 |

### 4.2 데이터셋

- **학습 데이터**: The Pile의 **Enron** (이메일), **Wikipedia**, **GitHub** 부분집합에서 각 10,000개 예제
- **테스트 데이터**: TREC 2007 Spam Classification dataset (학습에 미포함)
- **프록시 데이터**: Llama/OPT용으로 Common Crawl에서 10,000개 예제

### 4.3 공통 실험 조건

- Prefix 길이: **50 토큰**, Suffix 길이: **50 토큰**
- 주요 샘플링 방식: **top-k** ($k=40$, $T=1$)
- 비교 기준: greedy sampling의 one-shot discoverable extraction rate
- $(n,p)$ 계산: Equation (2)를 이용한 **단일 쿼리 근사**

---

## 5. 실험 결과

### 5.1 n과 p에 따른 추출률 변화

![Pythia 2.8B에서 (n,p)-discoverable extraction rate. 다양한 p값(0.1, 0.5, 0.9, 0.999)에서 n에 따른 추출률 변화. Greedy rate (1.3%)는 수평선으로 표시.](/images/papers/measuring-memorization/topk_2b.png)

![Pythia 12B에서 동일 실험. Greedy rate (3.07%) 대비 (n,p) 추출률이 크게 증가함.](/images/papers/measuring-memorization/topk_12b.png)

**주요 관찰:**

| 관점 | Greedy 대비 (n,p) 비교 | 해석 |
|------|----------------------|------|
| **높은 n, 낮은 p** (예: p=0.1) | (n,p) 추출률 >> greedy rate | Greedy가 추출을 **과소평가** |
| **낮은 n, 높은 p** (예: p=0.999, n<169) | (n,p) 추출률 < greedy rate | Greedy가 추출을 **과대평가** |

이 결과는 greedy rate가 **단일 숫자로는 추출 위험의 전체 그림을 제공하지 못함**을 보여준다. 쿼리 예산(rate limit)에 따라 실제 추출 위험은 크게 달라진다.

### 5.2 최대 추출률 (Worst-case Extraction)

![Pythia 2.8B의 최대 추출률. 모든 p에 대해 수렴하는 상한선이 존재한다.](/images/papers/measuring-memorization/max_extract.png)

| 모델 | Greedy Rate | 최대 (n,p) 추출률 | 배수 |
|------|------------|-------------------|------|
| Pythia 2.8B | 1.3% | **9.04%** | ~7× |
| Pythia 12B | 3.07% | **16.07%** | ~5× |

### 5.3 모델 간 비교: Greedy와 (n,p)가 반대 결론을 도출

![Pythia 1B vs GPT-Neo 1.3B 비교. Greedy에서는 Pythia 1B > GPT-Neo 1.3B이지만, (n,p)에서는 모든 n과 p에서 GPT-Neo 1.3B > Pythia 1B이다.](/images/papers/measuring-memorization/compare_pythia_gptneo.png)

이것은 중요한 결과이다: **Greedy만으로 모델 간 추출 위험을 비교하면 잘못된 결론을 내릴 수 있다.** Pythia 1B는 greedy rate가 더 높지만, 실제 확률적 추출 환경에서는 GPT-Neo 1.3B가 더 높은 위험을 가진다.

### 5.4 모델 크기 및 데이터 반복 횟수의 영향

**모델 크기 증가 시:**
- 모든 n, p에서 추출률 증가 (예: Pythia 2.8B → 12B)
- Greedy와 (n,p) 간의 **격차도 함께 증가** (2.8B: 7.74%p, 12B: 13%p)
- 더 큰 모델은 greedy rate에 도달하는 데 필요한 쿼리 수도 적음 (p=0.9일 때 Pythia 1B: n=150, Pythia 12B: n=40)

**데이터 반복 횟수 증가 시:**

![학습 데이터 반복 횟수에 따른 추출률 (Pythia 2.8B, Enron 전화번호). 반복이 많을수록 greedy와 (n,p) 간 격차가 커진다.](/images/papers/measuring-memorization/repetitions.png)

The Pile에서 전화번호가 반복 출현하는 경우를 분석한 결과, 반복 횟수가 많을수록 (n,p) 추출률이 greedy 대비 더 크게 증가한다.

### 5.5 (n,p)-Discoverable Extraction의 타당성 검증

![학습 데이터(Enron) vs 테스트 데이터(TREC 2007 Spam) 추출률 비교 (Pythia 2.8B). 테스트 데이터의 생성률은 학습 데이터 대비 수십 배 이하이다.](/images/papers/measuring-memorization/compare_train_test.png)

| 설정 | 학습 데이터 추출률 | 테스트 데이터 생성률 |
|------|------------------|--------------------|
| p=0.1, 대규모 n | >5% | <1% |
| p=0.9, n=500,000 | 4.4% | 0.3% |

테스트 데이터(학습에 미포함)를 "우연히" 생성하는 확률은 학습 데이터 추출률보다 **수십 배 낮다**. 이는 (n,p)-discoverable extraction의 측정 결과가 실제 memorization을 반영함을 뒷받침한다.

---

## 6. 결론 및 시사점

### 세 가지 핵심 기여

1. **추출의 신뢰성 있는 정량화**: Greedy sampling은 전체 추출 가능 범위의 일부만 포착한다. (n,p)-discoverable extraction은 쿼리 수(n)와 확률 임계값(p)에 따른 연속적 위험도를 제공한다.

2. **추가 연산 비용 없음**: 단일 forward pass로 $p_\mathbf{z}$를 계산하고 Equation (2)로 임의의 n, p 조합을 분석할 수 있다. 기존 discoverable extraction과 동일한 비용이다.

3. **맥락별 위험도 분석**: 일반 문구 추출은 낮은 위험일 수 있지만, PII 추출은 한 번이라도 문제가 된다. (n,p)의 유연한 설정으로 데이터 민감도에 따른 차별화된 위험 평가가 가능하다.

### Limitations

- 상대적으로 약한 적대자(adversary)만 고려: API 접근만 가능하고 부가 정보가 제한된 설정
- 서로 다른 유형의 target 시퀀스(예: PII vs 일반 텍스트)를 구분하여 분석하지 않음
- PII 추출은 전화번호에 한정된 반복 실험만 수행

---

## 개인 메모

이 논문은 기존 memorization 측정 방식의 근본적 한계를 깔끔하게 지적한다. 핵심 통찰은 단순하지만 강력하다: greedy sampling의 결정론적 특성이 실제 추출 위험을 왜곡할 수 있으며, 확률적 관점의 전환이 추가 비용 없이 더 정확한 측정을 가능케 한다. 특히 Figure 3 (Pythia 1B vs GPT-Neo 1.3B)의 결과는 모델 비교 시 greedy rate만 보고하는 기존 관행에 대한 경종이다. 향후 모델 릴리스 보고서에서 (n,p) 기반 추출률을 표준 지표로 채택할 가능성이 있다.
