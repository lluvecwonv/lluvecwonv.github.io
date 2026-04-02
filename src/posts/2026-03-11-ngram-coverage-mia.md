---
title: "The Surprising Effectiveness of Membership Inference with Simple N-Gram Coverage"
date: 2026-03-11
summary: "COLM 2025 논문. 기존 MIA 벤치마크의 temporal distribution shift 문제를 지적하고, WikiMIA_2024 Hard와 TÜLU Mix라는 새 데이터셋을 제안한다. 모델 출력 텍스트만으로 n-gram 커버리지 기반 멤버십 추론 공격(N-Gram Coverage Attack)을 수행하여, white-box 공격에 필적하거나 능가하는 성능을 달성한다. GPT-3.5/4/4o, LLaMA, TÜLU, Pythia, OLMo 등 다양한 모델에 대한 종합 실험 포함."
tags: [MIA, Membership Inference, Privacy, LLM, N-Gram, Black-Box Attack, 연구노트]
category: 연구노트
language: ko
---

# The Surprising Effectiveness of Membership Inference with Simple N-Gram Coverage

**논문:** COLM 2025 | **저자:** Skyler Hallinan (USC), Jaehun Jung (UW), Melanie Sclar (UW), Ximing Lu (UW), Abhilasha Ravichander (UW), Sahana Ramnath (USC), Yejin Choi (Stanford), Sai Praneeth Karimireddy (USC), Niloofar Mireshghallah (UW), Xiang Ren (USC)
**코드:** [GitHub](https://github.com/shallinan1/NGramCoverageAttack)

## 한 줄 요약

LLM의 텍스트 출력**만**으로 멤버십 추론 공격을 수행하는 N-Gram Coverage Attack을 제안하며, 단순한 n-gram 커버리지 메트릭이 모델 내부(logit/loss)에 접근하는 white-box 공격과 동등하거나 더 나은 성능을 보인다는 놀라운 결과를 보고한다.

---

## 1. 논문 개요 및 동기

### Membership Inference Attack(MIA)이란?

멤버십 추론 공격은 특정 텍스트가 모델의 학습 데이터에 포함되었는지를 판별하는 기법이다. 저작권 침해 감지, 데이터 유출 감사, 프라이버시 보호 평가 등에 핵심적으로 사용된다.

### 기존 방법의 한계

기존 MIA 방법들은 대부분 **모델의 내부 정보**에 접근해야 한다:

- **Loss 기반:** 후보 텍스트에 대한 모델의 prediction loss를 직접 계산 (Yeom et al., 2018)
- **Reference Loss:** 참조 모델과의 loss 차이를 비교 (Carlini et al., 2021)
- **Min-K%:** 가장 unlikely한 k% 토큰의 log-likelihood 사용 (Shi et al., 2024)
- **zlib:** loss를 zlib 압축 크기로 정규화 (Carlini et al., 2021)

이 모든 방법은 토큰 확률이나 logit에 접근해야 하므로, **GPT-4, GPT-4o 같은 API-only 모델에는 적용이 불가능**하다.

유일한 black-box 방법이었던 **DE-COP** (Duarte et al., 2024)은 후보 문서를 패러프레이즈한 뒤 QA 태스크로 변환하는 복잡한 파이프라인을 사용하며, Claude 같은 강력한 외부 패러프레이저가 필요하고 계산 비용이 높다.

### 이 논문의 핵심 관찰

> 모델은 학습 데이터에 포함된 텍스트 패턴을 더 잘 기억하고 재생성할 가능성이 높다.

이 직관에 기반하여, 모델에게 후보 문서의 prefix를 주고 여러 번 생성시킨 뒤, 생성물과 원본 suffix 사이의 n-gram 유사도를 측정하면 멤버십을 판단할 수 있다.

---

## 2. 방법론: N-Gram Coverage Attack

![N-Gram Coverage Attack 개요](/images/papers/ngram-coverage-mia/figure_1_ngram_coverage_mia.png)
*Figure 1: N-Gram Coverage Attack의 전체 파이프라인. (1) 후보 문서에서 prefix를 추출하고, (2) prefix를 조건으로 타겟 모델에서 다수의 continuation을 샘플링한 뒤, (3) 생성물과 원본 suffix를 n-gram 메트릭으로 비교하고, (4) 유사도를 집계하여 멤버십을 추론한다.*

### 3단계 프레임워크

**Step 1: 타겟 모델로부터 샘플링 (Sample)**

후보 텍스트 $x$의 앞쪽 일부를 prefix $x_{\leq k}$로 사용하여, 타겟 모델 $M_\theta$에서 $d$개의 다양한 completion을 생성한다:

$$\{o_\theta^{(i)}\}_{i=1}^{d} \sim M_\theta(\cdot \mid p, x_{\leq k})$$

여기서 $p$는 instruction prompt이다. 메인 실험에서는 **단어 기준 50%를 prefix**로 사용하며, 생성 길이는 suffix의 토큰 수와 동일하게 제한하여 전체 토큰 예산이 $O(n)$이 되도록 한다.

**Step 2: 유사도 계산 (Compute Similarities)**

각 생성물 $o_\theta^{(i)}$와 원본 suffix $x_{>k}$ 사이의 유사도를 계산한다:

$$S_\theta^{(i)} \gets \texttt{sim}(o_\theta^{(i)}, x_{>k}), \quad \forall i = 1, \ldots, d$$

**Step 3: 집계 및 판정 (Aggregate)**

$d$개의 유사도 스코어를 하나의 값으로 집계한다:

$$S_\theta^{\text{agg}} \gets \texttt{agg}(\{S_\theta^{(i)}\}_{i=1}^{d})$$

$S_\theta^{\text{agg}} > \epsilon$이면 **멤버**, 아니면 **비멤버**로 판정한다.

### 유사도 메트릭 (Similarity Metrics)

세 가지 n-gram 기반 유사도 함수를 사용한다:

**1) Coverage (Cov)**

두 문서 $x_1$, $x_2$ 사이에서, $x_2$의 토큰 중 $x_1$에서 길이 $L$ 이상인 n-gram으로 매칭되는 비율을 계산한다:

$$\text{Cov}_L(x_1, x_2) = \frac{\sum_{w \in x_2} \mathbb{1}(\exists\; n\text{-gram}\; g \subseteq x_1, \|g\| \geq L \text{ s.t. } w \in g)}{\|x_2\|} \in [0, 1]$$

**2) Creativity Index (Cre)**

Lu et al. (2024)이 제안한 메트릭으로, 여러 n-gram 길이에 걸쳐 1 - Coverage를 합산하여 텍스트의 새로움을 측정한다:

$$\text{Creativity Index}(x_1, x_2) = \sum_{L=A}^{B} (1 - \text{Cov}_L(x_1, x_2)) \in [0, B-A]$$

실제로는 $-$Creativity Index를 사용하여, 높은 값이 높은 유사도를 의미하도록 한다.

**3) Longest Common Substring (LCS)**

두 텍스트 사이의 가장 긴 공통 연속 부분 문자열의 길이를 계산한다. 문자 수준($\text{LCS}_c$)과 단어 수준($\text{LCS}_w$) 두 가지 변형이 있다. Coverage/Creativity와 달리 길이 정규화를 하지 않는다.

### 집계 함수 (Aggregation Functions)

max, min, mean, median 네 가지를 고려한다. **False positive(학습에 안 들어갔는데 정확히 재생성하는 경우)**가 드물기 때문에, 가장 강한 멤버십 신호를 포착하는 **max**가 가장 효과적이며, 모든 실험에서 max를 사용한다.

---

## 3. 기존 데이터셋의 문제점과 새로운 데이터셋

### 기존 데이터셋의 문제: Temporal Distribution Shift

기존 MIA 벤치마크들의 가장 큰 문제는 **시간적 분포 차이(temporal distribution shift)**이다.

**WikiMIA** (Shi et al., 2024)는 2017년 이전에 작성된 위키피디아 문서를 멤버로, 2023년 이후 작성된 문서를 비멤버로 사용한다. 문제는 멤버와 비멤버가 **완전히 다른 주제와 시기의 문서**라는 점이다. 모델이 실제로 해당 텍스트를 기억해서 구별하는 것이 아니라, 단순히 문서의 주제나 스타일 차이를 이용해 판별할 수 있다. Duan et al. (2024)이 이 한계를 명시적으로 지적했다.

**WikiMIA-24** (Fu et al., 2025)도 비멤버의 시점을 2024년 3월 이후로 업데이트했을 뿐, 근본적인 수집 방법은 WikiMIA와 동일하여 **같은 temporal shift 취약점**을 상속한다.

**BookMIA** (Shi et al., 2024)는 유명 문학작품(멤버)과 2023년 이후 출판된 책(비멤버)을 사용하는데, GPT-3.5 계열에서만 사용 가능하고 데이터 규모가 제한적이다.

### 새로운 데이터셋 1: WikiMIA₂₀₂₄ Hard

저자들이 WikiMIA의 temporal distribution shift 문제를 해결하기 위해 구축한 데이터셋이다. 두 가지 핵심 개선이 있다:

**개선 1: 같은 문서의 다른 버전 사용**

멤버와 비멤버가 완전히 다른 문서가 아니라, **같은 위키피디아 문서의 서로 다른 시점 버전**을 사용한다:
- **멤버:** 2016년 말 버전의 위키피디아 요약 (대규모 사전학습 코퍼스에 스크랩되었을 가능성이 높음)
- **비멤버:** 2024년 이후 편집된 최신 버전 (대부분 모델의 knowledge cutoff 이후)

같은 문서의 다른 버전을 사용함으로써, 멤버/비멤버 간의 **주제적 차이를 최소화**한다.

**개선 2: 최신 모델로 타겟 확장**

기존 WikiMIA가 GPT-3.5와 LLaMA 계열만 대상으로 했던 반면, WikiMIA₂₀₂₄ Hard는 **GPT-4와 GPT-4o**까지 타겟 모델을 확장한다.

**추가 필터링 조건:**
- 멤버/비멤버 버전 간 **Levenshtein Edit Distance > 0.5** (의미 있는 차이를 보장)
- 두 버전의 길이 차이가 **20% 이내** (길이 기반 편향 방지)
- 요약의 처음 256 단어만 사용

구축 과정: Wikimedia API로 약 27,000개 문서를 스크랩 → 2016년 이전 존재 + 2024년 이후 편집 필터링 → 중복 제거 및 길이/편집 거리 필터링 후 1,040개 → 랜덤 1,000개 선택 → 최종 2,000개 (멤버 1,000 + 비멤버 1,000)

### 새로운 데이터셋 2: TÜLU Mix

**파인튜닝 멤버십 추론**을 평가하기 위한 최초의 데이터셋이다. 기존 연구는 거의 모두 사전학습 멤버십만 다루었다.

- **멤버:** TÜLU Mix에 포함된 instruction-tuning 데이터 (GPT-4 Alpaca, OASST1, Dolly, Code Alpaca, ShareGPT 등)
- **비멤버:** 후보였으나 최종 Mix에 선택되지 않은 데이터셋 (Baize, Self Instruct, Stanford Alpaca, Unnatural Instructions, Super NI 등)
- **타겟 모델:** TÜLU 1 (LLaMA 1 7B/13B/30B/65B 기반), TÜLU 1.1 (LLaMA 2 7B/13B/70B 기반)

**길이 매칭을 위한 Binned Sampling:**
멤버/비멤버 간 길이 분포가 다른 문제를 해결하기 위해:
1. 상하위 5% 극단값 제거
2. 10개 bin으로 균등 분할
3. 각 bin에서 균등 샘플링

최종 데이터셋: 멤버 924개, 비멤버 928개. 첫 번째 대화 턴만 사용.

---

## 4. 실험 세팅

### 타겟 모델

다양한 크기와 접근 수준의 모델을 공격 대상으로 사용한다:

**오픈 웨이트 모델:**
- **LLaMA 1:** 7B, 13B, 30B, 65B (Meta, 2023년 2월)
- **Pythia:** 1.4B, 2.8B, 6.9B, 12B (Eleuther AI)
- **OLMo:** 1B, 7B, 7B-SFT, 7B-Instruct (Ai2, 07-2024 체크포인트)
- **TÜLU 1:** LLaMA 1 기반 7B/13B/30B/65B
- **TÜLU 1.1:** LLaMA 2 기반 7B/13B/70B

**클로즈드 API 모델:**
- **GPT-3.5 Instruct** (`gpt-3.5-turbo-instruct`): knowledge cutoff 2021년 8월 31일
- **GPT-3.5 Turbo** (`gpt-3.5-turbo-0125`, `gpt-3.5-turbo-1106`): knowledge cutoff 2021년 8월 31일
- **GPT-4 Turbo** (`gpt-4-turbo-2024-04-09`): knowledge cutoff 2023년 말
- **GPT-4o** (`gpt-4o-2024-04-09`): knowledge cutoff 2023년 말
- **GPT-4o mini** (`gpt-4o-mini-0718`): knowledge cutoff 2023년 말

### 생성 하이퍼파라미터

| 파라미터 | 설정값 |
|---------|--------|
| Sampling 방법 | Nucleus sampling |
| Temperature | 1.0 |
| top_p | 0.95 |
| Prefix 비율 | 단어 기준 50% |
| 생성 최대 길이 | suffix의 토큰 수와 동일 |
| 생성 수 (BookMIA) | 100개/후보 |
| 생성 수 (기타) | 50개/후보 |
| 집계 함수 | max |
| 검증 세트 비율 | 5% (하이퍼파라미터 스윕용) |

### 프롬프트 템플릿

데이터셋마다 다른 프롬프트를 사용한다:

- **BookMIA:** "You will be shown a series of passages from famous literary works... Complete the prefix: {prefix}"
- **WikiMIA / WikiMIA-24 / WikiMIA₂₀₂₄ Hard:** "Continue the generation as closely to verbatim as possible. {prefix}"
- **Pile / OLMo:** "Continue the text: {prefix}"
- **TÜLU:** 별도 프롬프트 없이 첫 번째 user 턴을 prefix로 사용, 모델이 전체 completion을 생성

### 베이스라인

**Black-box:**
- **DE-COP** (Duarte et al., 2024): 후보 문서를 패러프레이즈(GPT-4o 사용, temp=0.1) → QA 태스크로 변환 → 모델의 정답률로 멤버십 판단. Claude 대신 GPT-4o를 패러프레이저로 사용.

**White-box (참조용):**
- **Loss:** 후보 텍스트의 prediction loss 직접 사용
- **Reference Loss (R-Loss):** 같은 계열의 가장 작은 모델을 참조 모델로 사용 (예: LLaMA 13B/30B/65B → LLaMA 7B 참조)
- **zlib:** loss를 zlib 압축 크기로 나누어 정규화
- **Min-K%:** K를 10%~60% (10% 간격) 6가지 변형 중 검증 세트에서 최적 선택

### 평가 지표

모든 실험에서 **AUROC (Area Under the ROC Curve)**를 사용한다. 고정 threshold 대신 threshold-independent하게 멤버/비멤버 분리 능력을 측정하며, 값이 높을수록 공격이 강력하다는 것을 의미한다.

### 구현

- Loss 기반 베이스라인: HuggingFace Transformers
- 생성 (DE-COP, N-Gram Coverage Attack): vLLM
- OpenAI 모델: OpenAI API

---

## 5. 실험 결과

### 5.1 WikiMIA / WikiMIA-24 / WikiMIA₂₀₂₄ Hard 결과

**WikiMIA 주요 결과 (AUROC):**

| 모델 | Cov. | Cre. | LCS_c | LCS_w | D-C | Loss | R-Loss | zlib | MinK |
|------|------|------|-------|-------|-----|------|--------|------|------|
| GPT-3.5-0125 | **0.64** | 0.63 | 0.61 | 0.60 | 0.55 | - | - | - | - |
| GPT-3.5 Inst. | **0.62** | 0.61 | 0.58 | 0.58 | 0.54 | - | - | - | - |
| GPT-3.5-1106 | **0.64** | 0.62 | 0.61 | 0.60 | 0.52 | - | - | - | - |
| LLaMA-7B | **0.60** | 0.59 | 0.56 | 0.55 | 0.48 | 0.62 | - | 0.63 | 0.64 |
| LLaMA-13B | **0.62** | 0.59 | 0.57 | 0.54 | 0.52 | 0.64 | 0.63 | 0.65 | 0.66 |
| LLaMA-30B | **0.63** | 0.62 | 0.57 | 0.58 | 0.49 | 0.66 | 0.69 | 0.67 | 0.69 |
| LLaMA-65B | **0.65** | 0.64 | 0.61 | 0.58 | 0.50 | 0.68 | 0.74 | 0.69 | 0.70 |

**WikiMIA-24 주요 결과 (AUROC):**

| 모델 | Cov. | Cre. | LCS_c | LCS_w | D-C | Loss | R-Loss | zlib | MinK |
|------|------|------|-------|-------|-----|------|--------|------|------|
| GPT-3.5-0125 | **0.67** | **0.67** | 0.64 | 0.66 | 0.48 | - | - | - | - |
| GPT-4 | **0.84** | 0.82 | 0.76 | 0.79 | 0.56 | - | - | - | - |
| GPT-4o-1120 | **0.83** | 0.82 | 0.77 | 0.79 | 0.50 | - | - | - | - |
| GPT-4o Mini | 0.73 | **0.74** | 0.66 | 0.69 | 0.44 | - | - | - | - |
| LLaMA-65B | 0.64 | **0.65** | **0.65** | **0.65** | 0.50 | 0.74 | 0.74 | 0.75 | 0.76 |

**WikiMIA₂₀₂₄ Hard 주요 결과 (AUROC):**

| 모델 | Cov. | Cre. | LCS_c | LCS_w | D-C | Loss | R-Loss | zlib | MinK |
|------|------|------|-------|-------|-----|------|--------|------|------|
| GPT-3.5 Inst. | **0.64** | 0.63 | 0.61 | 0.61 | 0.45 | - | - | - | - |
| GPT-4 | 0.57 | **0.58** | 0.55 | 0.57 | 0.44 | - | - | - | - |
| GPT-4o-1120 | **0.55** | 0.55 | 0.54 | 0.52 | 0.51 | - | - | - | - |
| LLaMA-30B | **0.61** | **0.61** | 0.55 | 0.57 | 0.50 | 0.56 | 0.61 | 0.53 | 0.60 |
| LLaMA-65B | **0.64** | 0.63 | 0.59 | 0.60 | 0.51 | 0.57 | 0.57 | 0.54 | 0.58 |

핵심 발견: WikiMIA₂₀₂₄ Hard에서는 N-Gram Coverage Attack이 **모든 모델에서 white-box 공격을 능가**한다. 이는 temporal shift가 제거된 더 어려운 세팅에서 출력 기반 방법이 오히려 loss 기반 방법보다 강건할 수 있음을 보여준다.

### 5.2 BookMIA 결과

| 모델 | Cov. | Cre. | LCS_c | LCS_w | D-C |
|------|------|------|-------|-------|-----|
| GPT-3.5-0125 | 0.84 | **0.85** | 0.84 | 0.83 | 0.84 |
| GPT-3.5 Inst. | 0.91 | 0.91 | 0.92 | **0.93** | 0.68 |
| GPT-3.5-1106 | 0.84 | **0.85** | 0.83 | 0.84 | **0.85** |

BookMIA는 모든 black-box 방법이 높은 성능을 보이지만, GPT-3.5 Instruct에서 N-Gram Coverage Attack(0.91~0.93)이 DE-COP(0.68)을 크게 앞선다. 이 모델들은 클로즈드 모델이라 white-box 베이스라인 자체가 계산 불가능하다.

### 5.3 TÜLU (파인튜닝 멤버십) 결과

| 모델 | Cov. | Cre. | LCS_c | LCS_w | D-C | Loss | R-Loss | zlib | MinK |
|------|------|------|-------|-------|-----|------|--------|------|------|
| TÜLU-7B | **0.79** | **0.79** | 0.73 | 0.74 | 0.48 | 0.84 | - | 0.81 | 0.84 |
| TÜLU-13B | **0.80** | **0.80** | 0.74 | 0.76 | 0.47 | 0.87 | 0.63 | 0.83 | 0.87 |
| TÜLU-30B | **0.82** | **0.82** | 0.76 | 0.77 | 0.52 | 0.87 | 0.54 | 0.84 | 0.87 |
| TÜLU-65B | 0.85 | **0.86** | 0.80 | 0.80 | 0.45 | 0.92 | 0.68 | 0.90 | 0.92 |
| TÜLU-1.1-7B | 0.72 | **0.73** | 0.70 | 0.71 | 0.47 | 0.77 | - | 0.74 | 0.76 |
| TÜLU-1.1-13B | **0.76** | 0.75 | 0.71 | 0.72 | 0.43 | 0.81 | 0.58 | 0.78 | 0.81 |
| TÜLU-1.1-70B | **0.79** | 0.78 | 0.75 | 0.77 | 0.45 | 0.86 | 0.64 | 0.84 | 0.86 |

파인튜닝 멤버십 추론도 효과적이다. 모든 모델에서 N-Gram Coverage Attack은 DE-COP을 크게 앞서며, white-box 대비 약 90% 수준의 성능을 달성한다. TÜLU 1.1 모델이 동일 크기의 TÜLU 1 대비 더 높은 저항성을 보이며, Reference Loss는 파인튜닝 세팅에서 성능이 크게 떨어진다.

### 5.4 Pythia/Pile 및 OLMo/Dolma 결과

**Pythia on Pile (AUROC):**

| 모델 | Cov. | Cre. | LCS_c | LCS_w | D-C | Loss | R-Loss | zlib | MinK |
|------|------|------|-------|-------|-----|------|--------|------|------|
| Pythia 1.4B | 0.53 | 0.53 | 0.51 | 0.52 | 0.50 | 0.54 | 0.56 | 0.53 | 0.54 |
| Pythia 2.8B | 0.54 | 0.54 | 0.49 | 0.50 | 0.50 | 0.54 | 0.58 | 0.54 | 0.54 |
| Pythia 6.9B | 0.53 | 0.53 | 0.50 | 0.51 | 0.50 | 0.55 | 0.60 | 0.55 | 0.55 |
| Pythia 12B | 0.54 | 0.54 | 0.52 | 0.51 | 0.50 | 0.56 | 0.62 | 0.55 | 0.56 |

**OLMo on Dolma (AUROC):**

| 모델 | Cov. | Cre. | LCS_c | LCS_w | D-C | Loss | R-Loss | zlib | MinK |
|------|------|------|-------|-------|-----|------|--------|------|------|
| OLMo-1B | 0.54 | 0.54 | 0.51 | 0.50 | 0.49 | 0.47 | - | 0.51 | 0.45 |
| OLMo-7B | 0.54 | 0.54 | 0.54 | 0.51 | 0.50 | 0.47 | 0.53 | 0.51 | 0.46 |
| OLMo-7B-SFT | 0.52 | 0.52 | 0.53 | 0.51 | 0.50 | 0.47 | 0.53 | 0.51 | 0.46 |
| OLMo-7B-Instruct | 0.52 | 0.52 | 0.52 | 0.51 | 0.50 | 0.47 | 0.52 | 0.51 | 0.46 |

Pile과 Dolma는 모든 방법에 대해 매우 도전적인 벤치마크이다. 그럼에도 N-Gram Coverage Attack은 DE-COP보다 일관되게 우수하며, OLMo에서는 일부 모델에서 **white-box 베이스라인을 능가**하기도 한다 (OLMo-1B: Cov 0.54 vs Loss 0.47, MinK 0.45).

---

## 6. 어블레이션 스터디

BookMIA + GPT-3.5-0125 + max 집계를 기준으로 핵심 하이퍼파라미터의 영향을 분석한다.

### 6.1 생성 수에 따른 스케일링

![생성 수 스케일링](/images/papers/ngram-coverage-mia/num_sequences.png)
*Figure 2 (상단): 생성 수를 늘릴수록 모든 메트릭에서 공격 성능이 향상된다.*

생성 수를 증가시키면 모든 n-gram 메트릭에서 AUROC가 꾸준히 상승한다. 더 많은 샘플을 생성할수록 모델의 실제 출력 분포를 더 정확히 근사하기 때문이다. 이 스케일링 경향은 다른 데이터셋에서도 일관되게 관찰된다.

### 6.2 Prefix 비율에 따른 성능

![Prefix 비율](/images/papers/ngram-coverage-mia/num_proportion_from_end.png)
*Figure 2 (중단): 고정 토큰 예산에서 prefix 50%가 최적 성능을 보인다.*

고정 토큰 예산(생성 길이 = suffix 길이) 하에서, prefix 비율 50%가 모든 메트릭에서 일관되게 최적이다. 더 많은 context는 도움이 되지만, prefix가 너무 길면 suffix와 생성 길이가 모두 줄어들어 성능이 저하된다.

### 6.3 Temperature 영향

![Temperature](/images/papers/ngram-coverage-mia/temperature.png)
*Figure 2 (하단): Temperature 1.0 근처가 모든 메트릭에서 최적이다.*

Temperature 1.0이 일관되게 최적의 성능을 보인다. 높은 temperature가 다양성을 촉진해 숨겨진 기억을 끌어낼 수 있지만, 너무 높으면 실제 분포를 왜곡한다. 이 트레이드오프의 균형점이 1.0 근처에 있다.

---

## 7. 계산 효율성 비교

N-Gram Coverage Attack은 DE-COP보다 훨씬 효율적이다:

**DE-COP의 토큰 예산:** 후보 문서 길이 $n$에 대해:
- 패러프레이즈 생성: 입력 $\approx n$, 출력 $\approx 3n$
- QA 태스크: 24회 생성, 각 입력 $\approx 4n$, 출력 1
- **총 $\approx 100n$ 토큰/문서**
- 추가로 외부 패러프레이저 모델(Claude/GPT-4o) 필요

**N-Gram Coverage Attack의 토큰 예산:** prefix 인덱스 $k$, 생성 수 $d$에 대해:
- **총 $d \times n$ 토큰/문서** ($d=50$이면 $50n$)
- 외부 모델 불필요, 타겟 모델만 사용

실제 측정: WikiMIA₂₀₂₄ Hard + LLaMA 모델 + $d=50$ 기준, DE-COP은 N-Gram Coverage Attack보다 **평균 2.6배 더 오래** 걸리면서 성능은 훨씬 낮다.

---

## 8. 주요 발견 요약

1. **Black-box 방법이 white-box에 필적:** 텍스트 출력만 사용하는 단순한 n-gram 메트릭이, 모델 내부에 접근하는 loss 기반 방법과 동등하거나 능가하는 성능을 달성한다. 특히 WikiMIA₂₀₂₄ Hard에서는 모든 모델에서 white-box를 능가.

2. **Coverage와 Creativity가 LCS보다 일관적으로 우수:** 복수 매칭을 고려하고 길이 정규화를 하기 때문. Coverage는 매칭이 적은 세팅에서, Creativity는 매칭이 많은 세팅에서 각각 약간 우위.

3. **최신 모델(GPT-4o)이 더 높은 저항성:** GPT-4o는 older 모델보다 멤버십 추론에 대한 저항성이 높아, 프라이버시 보호가 개선되는 추세를 시사.

4. **파인튜닝 멤버십 추론도 효과적:** TÜLU 데이터셋에서 사전학습뿐 아니라 파인튜닝 데이터의 멤버십도 높은 정확도로 판별 가능.

5. **공격 성능이 compute budget에 따라 스케일:** 생성 수를 늘리면 성능이 지속적으로 향상되어, 비용-성능 트레이드오프가 가능.

---

## 9. 의의 및 한계

### 의의
N-Gram Coverage Attack은 LLM의 프라이버시 감사를 위한 실용적 도구를 제공한다. PII 유출, 저작권 콘텐츠 재생산 등 모델이 웹 규모 데이터로 학습될 때 발생하는 핵심 우려사항을 탐지하는 데 활용할 수 있다. 특히 API-only 모델에도 적용 가능하다는 점에서, 배포된 모델의 모니터링과 선제적 기억화 위험 식별에 가치가 있다.

### 한계
- Pile/Dolma 같은 데이터셋에서는 모든 방법의 성능이 낮아, 여전히 도전적인 세팅이 존재
- 생성 기반이므로 API 호출 비용이 발생 (white-box 방법은 단일 forward pass)
- Temperature, prefix 비율 등 하이퍼파라미터가 데이터셋/모델에 따라 민감할 수 있음
