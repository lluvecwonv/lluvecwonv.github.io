---
title: "The Mosaic Memory of Large Language Models 논문 분석"
date: 2026-03-29
summary: "LLM이 정확한 중복(exact duplicate)뿐 아니라 유사 중복(fuzzy duplicate)으로부터도 정보를 조합하여 암기하는 '모자이크 메모리(mosaic memory)' 현상을 밝힌 논문. Llama-3.2, Phi-2, Gemma-2, GPT-Neo 4개 모델에서 10% 토큰 교체 시 정확한 중복 대비 ρ=0.50–0.60의 암기 기여를, 50% 교체 시에도 ρ=0.15–0.19의 기여를 보임. 암기가 의미론적(semantic)보다 구문론적(syntactic)임을 실험적으로 입증하고, SlimPajama 데이터셋에서 fuzzy duplicate의 광범위한 존재를 확인."
tags: [LLM, Memorization, Fuzzy Duplicate, Mosaic Memory, Privacy, MIA, Deduplication, SlimPajama, 연구노트]
category: 연구노트
language: ko
---

# The Mosaic Memory of Large Language Models

**저자:** Igor Shilov*, Matthieu Meeus*, Yves-Alexandre de Montjoye
**소속:** Imperial College London
**논문 링크:** [GitHub](https://github.com/computationalprivacy/mosaic_memory)

---

## 한 줄 요약

LLM은 훈련 데이터의 **정확한 반복(exact duplicate)**만 암기하는 것이 아니라, 부분적으로 겹치는 텍스트 조각들(**fuzzy duplicates**)로부터 정보를 모아 조합하는 **모자이크 메모리(mosaic memory)** 능력을 가지며, 이 현상은 의미론적이라기보다 **구문론적(syntactic)**이다.

---

## 1. 논문 개요 및 동기

LLM이 훈련 데이터를 암기하는 메커니즘은 그동안 주로 **정확한(verbatim) 반복**의 관점에서 이해되어 왔다. 즉, 훈련 데이터에서 특정 시퀀스가 여러 번 **정확히** 반복될수록 암기 확률이 높아진다는 것이다. 이러한 이해를 바탕으로 모델 개발자들은 **데이터 중복 제거(deduplication)** 기법을 적용하여 모델 유틸리티를 개선하고, 프라이버시·기밀성 리스크를 완화하며, 벤치마크 데이터를 오염(contamination)으로부터 보호해 왔다.

그러나 이 논문은 LLM 암기를 **정확한 반복의 렌즈**로만 보는 것은 **부정확하다**고 주장한다. 대신 LLM이 **모자이크 메모리(mosaic memory)**를 가진다는 것을 보여준다. 이는 부분적으로 겹치는 조각들(**fuzzy duplicates**)로부터 시퀀스를 암기하는 능력이다.

이 발견의 실질적 함의는 크다. 현재 업계 표준인 정확한 n-gram 매칭 기반 중복 제거 기법(예: GPT-3 평가에 사용된 13-gram 겹침, 50-토큰 부분 문자열 매칭)은 fuzzy duplicate을 제거하지 못하므로, 프라이버시 보호, 벤치마크 오염 제거, 데이터 전처리 모두에서 **불충분한 보호**를 제공한다.

---

## 2. Mosaic Memory 측정 프레임워크

### 2.1 핵심 개념

논문은 LLM이 fuzzy duplicate을 어떻게 암기하는지를 **정확한 중복 대비(relative to exact duplicates)** 측정하는 프레임워크를 제시한다.

**Canary 기반 접근:** 기존 연구를 따라, 인위적으로 생성된 시퀀스인 **canary**에 대한 **Membership Inference Attack(MIA)** 성능으로 암기를 정량화한다.

- **Reference canary** $\{X_{\text{ref}}^i \mid i = 1, \ldots, C\}$: Llama-2 7B에서 temperature $\mathcal{T}=1.0$으로 합성 생성, 각 100 토큰 길이, 총 200개(member 100 + non-member 100)
- **Fuzzy duplicate** 생성: 알고리즘 $\mathcal{A}$가 reference canary를 체계적으로 변형하여 $n_{\text{dup}}=10$개의 fuzzy duplicate 생성

**실험 프로토콜:**

1. 각 reference canary $X_{\text{ref}}^i$에 대해 공정한 동전을 던져 $b_i \sim \{0, 1\}$ 결정
2. $b_i = 1$이면 reference canary와 fuzzy duplicate을 훈련 데이터 $D$에 주입
3. 사전 학습된 LLM $\textit{LM}_0$를 $D$에서 추가 학습하여 타깃 모델 $\textit{LM}$ 생성
4. MIA를 적용하여 membership score $\alpha(X_{\text{ref}}^i)$ 계산
5. ROC AUC $\tilde{\phi}$로 암기 정량화

### 2.2 Exact Duplicate Equivalent (ρ)

핵심 지표는 **exact duplicate equivalent** $\rho$이다.

- 먼저 동일한 실험 설정에서 정확한 중복 $\nu \in \{1, \ldots, n_{\text{dup}}\}$개를 주입했을 때의 MIA 성능 $\phi_{\nu}$를 측정
- $\tilde{\phi} \approx \phi_{\nu_{\text{eq}}}$가 되는 $\nu_{\text{eq}}$를 결정
- $\rho$는 $\nu_{\text{eq}}$를 fuzzy duplicate 수로 나누어 정규화

**해석:**
- $\rho = 1$: fuzzy duplicate 하나가 exact duplicate 하나와 동일한 암기 기여
- $\rho = 0$: fuzzy duplicate이 암기에 기여하지 않음

이 설계의 장점은 모델 특성(파라미터 수), 학습 절차(학습률), 시퀀스 속성(길이, perplexity) 등에 의한 **절대적 암기 수준의 변동에 불변(invariant)**하다는 것이다.

---

## 3. 실험 1: 토큰 교체를 통한 Fuzzy Duplicate ($\mathcal{A}_{\text{replace}}$)

### 3.1 실험 설정

**대상 모델:** Llama-3.2-1B (Meta), Phi-2 (Microsoft), Gemma-2B (Google), GPT-Neo 1.3B (EleutherAI)

**Fuzzy duplicate 생성 ($\mathcal{A}_{\text{replace}}$):**
- Reference canary의 100개 토큰 중 $R$개를 무작위로 교체
- $R = \{1, 5, 10, 15, 20, 25, 50, 75\}$ 범위
- 교체 토큰은 masked language model(RoBERTa, 어휘 크기 50,000)의 top-$k$ 예측에서 균일하게 샘플링
- $k = |\mathcal{V}_{\textit{MLM}}|$(무작위 교체)을 기본으로 사용

**훈련 데이터:** Project Gutenberg에서 수집한 100개 공개 도메인 도서를 기본 데이터셋 $D_{\text{orig}}$로 사용

### 3.2 주요 결과

![LLMs have a mosaic memory](/images/papers/mosaic-memory/neq_vs_R_all_models_big.png)
*Figure 1: 교체된 토큰 수(R)에 따른 exact duplicate equivalent ρ. 모든 모델에서 ρ > 0이 R=100(전체 교체)까지 유지됨.*

| 교체 토큰 수 (R) | GPT-Neo 1.3B (ρ) | Llama-3.2-1B (ρ) | Phi-2 (ρ) | Gemma-2B (ρ) |
|---|---|---|---|---|
| R = 10 (10%) | 0.60 | 0.60 | 0.50 | 0.50 |
| R = 20 (20%) | ~0.35 | ~0.35 | ~0.30 | ~0.30 |
| R = 50 (50%) | 0.19 | ~0.18 | 0.15 | 0.15 |

**핵심 발견:**
- $\rho$는 교체 토큰 수 $R$이 증가할수록 **점진적으로(gradually)** 감소하며, 모든 토큰이 교체될 때($R=100$)까지 일관되게 $\rho > 0$을 유지
- 10%의 토큰이 교체된 fuzzy duplicate은 exact duplicate 대비 $\rho = 0.50$–$0.60$의 암기 기여 → **실무적으로, 10% 토큰 교체된 fuzzy duplicate 2개가 훈련 데이터에 있으면 exact duplicate 1개보다 더 높은 암기를 유발**
- 50%의 토큰이 교체되어도 여전히 $\rho = 0.15$–$0.19$로 유의미하게 0보다 큼
- 결과는 원래 훈련 데이터, 벤치마크 성능, 모델 아키텍처가 크게 다른 모델들(GPT-Neo 1.3B vs Llama-3.2-1B) 사이에서도 **놀라울 정도로 일관적(remarkably consistent)**

### 3.3 Ablation 연구

논문은 다양한 ablation을 통해 결과의 견고성을 확인했다:

- **3가지 MIA 방법론** (Yeom et al., Carlini et al., Shi et al.) 모두에서 일관된 결과
- **다양한 초기 학습률**에서 일관된 결과
- **다양한 모델 크기**에서 일관된 결과
- **다양한 reference canary 생성 전략**(temperature $\mathcal{T} = 1.0, 2.5, 5.0$)에서 일관된 결과
- 교체할 토큰 위치 선택 방식($\mathcal{R}_j^i$의 구성)은 **제한적인 영향(limited impact)**만 미침

---

## 4. 실험 2: 토큰 삽입을 통한 Fuzzy Duplicate ($\mathcal{A}_{\text{insert}}$)

### 4.1 실험 설정

$\mathcal{A}_{\text{insert}}$는 reference canary의 원래 토큰을 유지하면서, 토큰화된 시퀀스를 $n$-gram으로 분할하고 각 n-gram 사이에 $X_{\text{insert}}$개의 무작위 토큰을 삽입한다.

- $n = \{1, 2, 5, 10, 20\}$: n-gram 크기
- $X_{\text{insert}} = \{1, 2, 5, 10\}$: 삽입 토큰 수
- **베이스라인**: $X_{\text{insert}} = \infty$ (n-gram이 훈련 데이터 전체에 무작위 분산)

### 4.2 주요 결과

![Insertion and Shuffle experiments](/images/papers/mosaic-memory/insertion_exp.png)
*Figure 2(a): 토큰 삽입 실험 결과. n-gram 사이에 삽입된 토큰 수에 따른 ρ 변화.*

| n-gram 크기 | $X_{\text{insert}}$ | ρ | 베이스라인 ($X_{\text{insert}}=\infty$) |
|---|---|---|---|
| 20-gram | 1 | 0.84 | 0.41 |
| 20-gram | 10 | 0.64 | 0.41 |
| 1-gram (개별 토큰) | 1 | 0.22 | 0 |

**핵심 발견:**
- LLM은 **무관한 토큰을 건너뛰는 데 놀라운 견고성(remarkable robustness)** 을 보임
- 20-gram 사이에 1개 노이즈 토큰 삽입 시에도 $\rho = 0.84$로, 베이스라인 $\rho = 0.41$보다 훨씬 높음
- 개별 토큰 사이에 1개 토큰 삽입(n=1, $X_{\text{insert}}=1$)이라는 극단적 경우에도 $\rho = 0.22$
- **가설**: 이러한 견고성은 **attention mechanism**에서 기인할 수 있으며, LLM이 삽입된 토큰에 낮은 attention score를 할당하여 노이즈로 필터링할 수 있다고 추측

---

## 5. 실험 3: 토큰 셔플을 통한 Fuzzy Duplicate ($\mathcal{A}_{\text{shuffle}}$)

### 5.1 실험 설정

$\mathcal{A}_{\text{shuffle}}$은 reference canary를 $n$-gram ($n = \{2, 5, 10\}$)으로 분할한 뒤, 각 n-gram 내부 순서는 유지하면서 n-gram 간 순서를 무작위로 치환(permute)한다.

순서 변화의 정도는 **정규화 Kendall tau 거리** ($\tau$)로 측정한다:

$$\tau = \frac{\Delta}{L(L-1)/2}$$

여기서 $L$은 총 토큰 수, $\Delta$는 불일치 쌍(discordant pair)의 수이다.

- $\tau = 0$: 원래 순서 유지 (셔플 없음)
- $\tau = 1$: 완전한 역순

### 5.2 주요 결과

![Shuffle experiments](/images/papers/mosaic-memory/kendall.png)
*Figure 2(b): 셔플 실험 결과. Kendall-Tau 거리에 따른 ρ 변화.*

| Kendall-Tau ($\tau$) | n=10 ρ | n=10 베이스라인 ($X_{\text{insert}}=\infty$) |
|---|---|---|
| 0.1 (10% 쌍 역전) | ~0.55 | 0.321 |
| 0.5 (50% 쌍 역전) | 0.411 | 0.321 |

**핵심 발견 두 가지:**

1. **순서에 대한 높은 민감도**: 단 10%의 토큰 쌍 순서가 뒤바뀌어도 ($\tau = 0.1$) $\rho$가 1에서 약 0.55로 급격히 떨어짐
2. **그럼에도 베이스라인 이상의 암기**: 50%의 토큰 쌍이 역전된 경우($\tau = 0.5$)에도 10-gram 기준 $\rho = 0.411$로, n-gram을 무작위 분산시킨 베이스라인($\rho = 0.321$)보다 유의미하게 높음 → **모델이 fuzzy duplicate 전체에 걸친 공유 어휘를 순서가 거의 보존되지 않더라도 유지**

---

## 6. Mosaic Memory는 구문론적(Syntactic)이다

### 6.1 실험: Semantic Coherence 조절

**설계:** $\mathcal{A}_{\text{replace}}$에서 교체 토큰의 의미적 유사도를 조절한다. RoBERTa MLM의 top-$k$ 예측에서 교체 토큰을 샘플링하며, $k$값을 변화시킨다.
- $k = 10$: 의미적으로 매우 유사한 교체 (예: 'control' → 'tempo')
- $k = |\mathcal{V}_{\textit{MLM}}|$: 무작위 교체 (의미 크게 왜곡)

![Semantic coherence experiment](/images/papers/mosaic-memory/mlm_topk_exp.png)
*Figure 3: 의미적 일관성 수준에 따른 ρ. k가 작을수록 의미적으로 유사한 교체.*

**핵심 결과:**
- 의미적으로 유사한 토큰($k=10$)은 무작위 토큰($k=|\mathcal{V}_{\textit{MLM}}|$)보다 일관되게 더 높은 $\rho$를 보이지만, 그 **효과 크기는 주목할 만큼 작음(notably small)**
- 예: $R=20$ 교체 시, $k=10$은 $k=|\mathcal{V}_{\textit{MLM}}|$ 대비 $\rho$를 0.06만 증가 (0.35 → 0.41)
- 이 0.06의 의미적 이득은, 의미를 유지하면서 5개 토큰을 더 교체하는 것($R=25, k=10$에서 $\rho=0.33$)보다 작음
- **결론: 모자이크 메모리는 의미론적(semantic)이라기보다 구문론적(syntactic)** — 모델은 fuzzy duplicate 전반에 걸쳐 특정 겹치는 토큰 간의 연결을 암기

### 6.2 실험: 패러프레이즈 비교

**설계 ($\mathcal{A}_{\text{paraphrase}}$):** instruction-tuned LLM을 사용하여 reference canary를 **패러프레이즈**하여 fuzzy duplicate 생성. 토큰 겹침을 명시적으로 제어하지 않으면서 의미적 일관성을 유지.

**사용 모델:** Llama-3-8B, Mistral-7B, GPT-4o

| Fuzzy Duplicate 생성 모델 | ρ | 1-gram 겹침 | 2-gram 겹침 | 4-gram 겹침 |
|---|---|---|---|---|
| Llama-3-8B | 0.11 | 39.02 ± 19.97 | 17.68 ± 15.39 | 7.97 ± 9.95 |
| Mistral-7B | 0.17 | 49.52 ± 20.50 | 26.28 ± 17.83 | 12.85 ± 13.87 |
| GPT-4o | 0.30 | 70.70 ± 18.73 | 45.63 ± 23.15 | 27.89 ± 22.89 |

**핵심 발견:**

- 패러프레이즈의 $\rho$는 비교적 **낮으며**(0.11–0.30), 이는 무작위 토큰 20% 교체($R=20, k=|\mathcal{V}_{\textit{MLM}}|$)의 $\rho=0.35$보다도 낮음
- 의미가 크게 왜곡된 무작위 교체가 의미를 보존한 패러프레이즈보다 오히려 더 높은 암기 기여
- **n-gram 겹침과 ρ 사이의 엄격한 양의 상관관계**: GPT-4o 패러프레이즈가 가장 높은 ρ를 보이는 이유는 가장 높은 n-gram 겹침(4-gram 평균 27.89)을 가지기 때문
- **결론**: 패러프레이즈에서 관찰되는 암기도 대부분 의미적 유사성이 아닌 **구문론적(토큰) 겹침**으로 설명 가능

---

## 7. 실세계 훈련 데이터에서 Fuzzy Duplicate의 광범위한 존재

### 7.1 실험 설정

**대상 데이터셋:** SlimPajama (627B 토큰, 895GB) — RedPajama에서 문서 수준 중복 제거(Jaccard 유사도 기반 13-gram, 임계값 0.8)를 거쳐 49.6%의 바이트가 제거된 데이터셋

**거리 지표:**
- **Levenshtein 거리**: 한 시퀀스를 다른 시퀀스로 변환하는 데 필요한 최소 단일 문자 편집 수. 교체($\mathcal{A}_{\text{replace}}$), 삽입($\mathcal{A}_{\text{insert}}$), 셔플($\mathcal{A}_{\text{shuffle}}$) 모두를 포괄
- **Hamming 거리**: 대응하는 토큰이 다른 위치의 수. $\mathcal{A}_{\text{replace}}$에 직접 대응

**분석 방법:**
- 데이터셋에서 정확히 1,000회(±1%) 반복되는 시퀀스 100개 선택 (이러한 시퀀스는 데이터셋에 700,000개 이상 존재)
- 데이터셋의 5%를 스캔하고 결과를 외삽(데이터셋이 무작위 셔플되었으므로 합리적 가정)

### 7.2 주요 결과

| Levenshtein 거리 | 평균 fuzzy duplicate 수 | 해당 ρ 범위 |
|---|---|---|
| 0 (exact) | ~1,000 (선택 기준) | 1.0 |
| ≤ 10 | ~5,000 (+4,000 fuzzy) | 0.6–1.0 |
| ≤ 50 | > 20,000 | 0.2–0.4 |

**핵심 발견:**
- 기본 1,000개 exact duplicate 외에도, Levenshtein 거리 10 이내에 **약 4,000개의 추가 fuzzy duplicate** 존재
- 이 거리 범위에서 $\rho = 0.6$–$1.0$이므로, **fuzzy duplicate의 누적 영향이 exact duplicate의 영향을 능가할 가능성이 높음**
- Levenshtein 거리 50까지 확장하면 **20,000개 이상**의 fuzzy duplicate — exact duplicate의 20배 이상
- Hamming 거리 기준으로도 거리 20에서 약 5,000개, 거리 40에서 약 10,000개 발견

### 7.3 중복 제거(Deduplication) 분석

![Deduplication analysis](/images/papers/mosaic-memory/cum_near_duplicates_dedup.png)
*Figure 4: 다양한 수준의 시퀀스 수준 중복 제거 후 남는 fuzzy duplicate 수.*

**$n=50$ 중복 제거 (업계 표준):**
- Levenshtein 거리 ≤10에서 상당수 fuzzy duplicate 제거에 성공
- 그러나 Levenshtein 거리 20에서 **시퀀스당 평균 2,500개**, 거리 30에서 **6,000개**의 fuzzy duplicate이 잔존
- 이 범위의 fuzzy duplicate은 $\rho > 0.3$으로 여전히 상당한 암기 기여

**$n=25$ 중복 제거 (GPT-3 벤치마크 오염 제거 수준):**
- 50-gram보다 공격적이지만, Levenshtein 거리 20–50에서 여전히 수천 개의 fuzzy duplicate 잔존
- 이 범위에서 $\rho \geq 0.2$

**$n=20$ 중복 제거 (가장 공격적):**
- 가장 영향력 있는 fuzzy duplicate 제거에 도움이 될 수 있으나, **상당한 트레이드오프(significant trade-offs)** 발생 가능

---

## 8. 논의 (Discussion)

### 8.1 프라이버시 및 기밀성에 대한 영향

- LLM은 프리트레이닝(공개 인터넷 데이터)과 포스트트레이닝(의료 기록, 대화 데이터 등) 과정에서 민감한 정보에 노출
- 시퀀스 수준 중복 제거($n=50$)가 프라이버시 완화 전략으로 사용되어 왔으나, **본 연구는 모든 exact duplicate을 제거해도 fuzzy duplicate으로 인한 MIA 취약성이 상당히 증가함을 보임**
- MIA에 대한 보호는 재구성(reconstruction) 및 추론(inference) 공격에 대한 보호도 내포하므로, 결과가 extraction 공격으로도 일반화될 것으로 합리적으로 기대
- 최근 연구는 verbatim 재생산만 연구하는 것이 너무 제한적이며, 훈련 세트와 매우 유사한 시퀀스 생성의 리스크도 고려해야 한다고 주장

### 8.2 벤치마크 오염 제거(Benchmark Decontamination)에 대한 영향

- GPT-3: 약 25토큰 등가 겹침 기준으로 오염 제거
- PaLM: 8-gram에서 70% 이상 겹침 시 제거
- GPT-4: 50자 무작위 시퀀스 3개 중 하나가 겹치면 제거
- Llama-2: 10-gram 수준 20% 이상 토큰 겹침 시 제거 (4토큰 skipgram 허용)
- **본 논문의 결과: 정확한 n-gram 중복 제거만으로는 모든 fuzzy duplicate을 제거할 수 없으며**, Llama-3처럼 더 세분화된 접근이 필요하지만 아직 널리 채택되지 않음

### 8.3 (적대적) Canary에 대한 함의

- Copyright trap이나 GUID 문자열 같은 canary 기법은 exact deduplication으로 쉽게 제거될 수 있음
- **모자이크 메모리를 활용하면 훈련 데이터 중복 제거에 저항하면서도 의미 있게 암기되는 canary를 설계 가능**
- 반대로, 유사한 기법이 편향된 의견이나 잘못된 정보의 암기를 유도하는 데 악용될 수도 있음

---

## 9. 한계점 및 향후 방향

- 전체 데이터셋 스캔이 아닌 5% 샘플링 기반 분석으로, 정확한 정량화에는 추가 연구 필요
- 더 공격적인 구문론적 중복 제거가 의미론적 중복 제거보다 훈련 효율성에 더 효과적일 수 있다는 가설 제시 — 향후 검증 필요
- Levenshtein/Hamming 거리 기반 중복 제거는 전체 데이터셋에 적용 시 계산 비용이 높음

---

## 10. 총평

이 논문은 LLM 암기에 대한 기존의 **"정확한 반복 = 암기"**라는 지배적 가정에 도전하는 중요한 연구이다. Mosaic memory라는 개념을 통해, LLM이 부분적으로 겹치는 텍스트 조각들로부터 정보를 조합하여 암기한다는 것을 4개 주요 모델에서 체계적으로 입증했다. 특히 암기가 의미론적이 아니라 구문론적이라는 발견은 현재의 중복 제거 전략이 근본적으로 불충분할 수 있음을 시사한다.

프라이버시 보호, 벤치마크 오염 제거, 데이터 전처리 등 실질적으로 중요한 영역에서의 함의가 크며, fuzzy duplicate을 고려한 보다 정교한 중복 제거 기법의 개발이 시급함을 보여준다.
