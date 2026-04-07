---
title: "G-Eval: NLG Evaluation using GPT-4 with Better Human Alignment"
date: 2026-04-07
summary: EMNLP 2023 논문 G-Eval을 정리했습니다. Chain-of-Thought와 form-filling 패러다임, 토큰 확률 가중합을 활용해 NLG 품질을 자동 평가하는 프레임워크로, GPT-4 기반 G-Eval이 SummEval에서 Spearman 0.514를 달성하며 기존 메트릭을 큰 폭으로 능가합니다.
tags: [NLG, Evaluation, LLM, GPT-4, Chain-of-Thought, Summarization, Dialogue, 연구노트]
category: 연구노트
language: ko
---

이번 연구노트는 EMNLP 2023 논문 **G-Eval: NLG Evaluation using GPT-4 with Better Human Alignment**를 정리한 글이다.

**저자**: Yang Liu, Dan Iter, Yichong Xu, Shuohang Wang, Ruochen Xu, Chenguang Zhu
**소속**: Microsoft Cognitive Services Research
**논문 링크**: https://arxiv.org/abs/2303.16634
**GitHub**: https://github.com/nlpyang/geval

## 한 줄 요약

LLM에 Chain-of-Thought(CoT)로 평가 단계를 자동 생성하게 하고, form-filling 방식으로 점수를 매긴 뒤, **토큰 확률 가중합**으로 최종 점수를 산출하면, 기존 NLG 평가 메트릭 대비 사람 판단과의 상관관계가 크게 향상된다.

## 1. 서론

NLG(Natural Language Generation) 시스템이 생성한 텍스트의 품질을 자동으로 측정하는 것은 어려운 문제다. LLM이 사람과 구분하기 어려운 고품질 텍스트를 생성할 수 있게 되면서 이 문제는 더 중요해졌다.

기존 자동 평가 메트릭의 한계는 명확하다.

- **BLEU, ROUGE, METEOR** 등 전통적인 reference-based 메트릭은 사람 판단과의 상관관계가 낮다. 특히 창의성과 다양성이 요구되는 태스크에서 그렇다.
- 이 메트릭들은 **reference output**이 필요한데, 새로운 태스크마다 수집하는 비용이 크다.

최근에는 LLM을 직접 reference-free NLG 평가자로 사용하는 연구들이 등장했다. LLM이 고품질 텍스트에 높은 확률을 부여할 것이라는 가정 하에, 후보 텍스트를 생성 확률로 평가하는 방식이다. 하지만 이 LLM 기반 평가자들은 여전히 중간 크기 신경망 평가자보다 사람과의 일치도가 낮다는 meta-evaluation 결과가 있다.

이 논문은 **G-Eval**을 제안한다. 핵심 아이디어는 세 가지다.

1. **Chain-of-Thoughts (CoT)**: Task Introduction과 Evaluation Criteria만 주고 LLM에게 상세한 Evaluation Steps를 자동 생성하게 한다.
2. **Form-filling 패러다임**: 프롬프트, CoT, 입력 텍스트를 조합하여 LLM이 점수를 "폼에 기입"하듯 출력하게 한다.
3. **토큰 확률 가중합(Probability-weighted scoring)**: 출력 토큰의 확률을 이용해 이산 점수를 연속적이고 세분화된 점수로 변환한다.

### 주요 기여

1. LLM 기반 메트릭이 reference-based 및 reference-free baseline 메트릭을 전반적으로 능가하며, 특히 대화 응답 생성 같은 open-ended, 창의적 NLG 태스크에서 그렇다.
2. LLM 기반 메트릭은 instruction과 prompt에 민감하며, CoT가 더 많은 맥락과 가이드를 제공하여 성능을 개선한다.
3. 토큰 확률로 이산 점수를 재가중하면 더 세분화된(fine-grained) 연속 점수를 얻을 수 있다.
4. LLM 기반 평가자가 LLM이 생성한 텍스트를 선호하는 **편향(bias)** 이 있다는 잠재적 문제를 지적한다.

## 2. 방법론 (Method)

G-Eval은 prompt-based evaluator로, 세 가지 핵심 구성요소로 이루어진다.

### 2.1 Prompt for NLG Evaluation

프롬프트는 **평가 태스크 정의**와 **평가 기준(Evaluation Criteria)**을 담은 자연어 지시문이다. 예를 들어 text summarization의 coherence 평가 프롬프트는 다음과 같다:

> *"You will be given one summary written for a news article. Your task is to rate the summary on one metric."*

여기에 태스크별 맞춤 평가 기준을 추가한다. Coherence의 경우:

> *"Coherence (1-5) - the collective quality of all sentences. We align this dimension with the DUC quality question of structure and coherence whereby 'the summary should be well-structured and well-organized. The summary should not just be a heap of related information, but should build from sentence to sentence to a coherent body of information about a topic.'"*

### 2.2 Auto Chain-of-Thoughts for NLG Evaluation

CoT는 LLM이 텍스트 생성 과정에서 만들어내는 **중간 표현의 연쇄(sequence of intermediate representations)**이다. 일부 평가 기준은 단순한 정의 이상으로 상세한 평가 지침이 필요한데, 이를 태스크마다 수동으로 설계하는 것은 시간이 많이 든다.

핵심 발견: **LLM이 이러한 평가 단계를 스스로 생성할 수 있다.** 프롬프트에 *"Evaluation Steps:"*라는 한 줄을 추가하면 LLM이 자동으로 상세한 CoT를 생성한다.

예시 — Coherence 평가를 위해 LLM이 자동 생성한 CoT:

> *1. Read the news article carefully and identify the main topic and key points.*
> *2. Read the summary and compare it to the news article. Check if the summary covers the main topic and key points of the news article, and if it presents them in a clear and logical order.*
> *3. Assign a score for coherence on a scale of 1 to 5, where 1 is the lowest and 5 is the highest based on the Evaluation Criteria.*

### 2.3 Scoring Function

**직접 점수 매기기(Direct Scoring)**의 문제점:

1. **점수 분포 편중**: 일부 태스크에서 특정 숫자(예: 1-5 척도에서 3)가 분포를 지배하여, 점수의 분산이 낮아지고 사람 판단과의 상관관계가 떨어진다.
2. **정수 출력 경향**: LLM은 소수점 값을 명시적으로 요청해도 정수만 출력하는 경향이 있다. 이로 인해 동점(tie)이 많아져 생성 텍스트 간 미묘한 차이를 포착하지 못한다.

**해결: 토큰 확률 가중합**

프롬프트에 미리 정의된 점수 집합 $S = \{s_1, s_2, ..., s_n\}$ (예: 1부터 5)이 주어졌을 때, LLM이 각 점수에 부여하는 확률 $p(s_i)$를 계산하고, 최종 점수를 다음과 같이 산출한다:

$$score = \sum_{i=1}^{n} p(s_i) \times s_i$$

이 방법으로 더 세분화된(fine-grained) 연속 점수를 얻어, 생성 텍스트의 품질과 다양성을 더 잘 반영할 수 있다.

### Framework 전체 흐름 (Figure 1)

1. **Task Introduction + Evaluation Criteria** → LLM에 입력
2. LLM이 **Auto CoT** (상세 Evaluation Steps)를 생성
3. 프롬프트 + CoT + Input Context + Input Target → LLM이 **form-filling** 방식으로 점수 출력
4. 출력 토큰의 **확률 가중합**으로 최종 점수 산출

## 3. 실험 (Experiments)

### 3.1 Implementation Details

- **모델**: OpenAI GPT 계열 — GPT-3.5 (text-davinci-003)와 GPT-4
- **GPT-3.5**: decoding temperature = 0 (결정론적 출력)
- **GPT-4**: 토큰 확률 출력을 지원하지 않으므로, $n = 20$, $temperature = 1$, $top\_p = 1$로 설정하여 20번 샘플링해서 토큰 확률을 추정
- **표기**: G-Eval-4 = GPT-4 backbone, G-Eval-3.5 = GPT-3.5 backbone

### 3.2 벤치마크

세 가지 meta-evaluation 벤치마크를 사용한다.

**SummEval** (Fabbri et al., 2021): 요약 평가 벤치마크. CNN/DailyMail 데이터셋 기반. 네 가지 aspect에 대한 사람 평가 포함: `fluency`, `coherence`, `consistency`, `relevance`.

**Topical-Chat** (Mehri and Eskenazi, 2020): 대화 응답 생성 평가 테스트베드. 네 가지 aspect: `naturalness`, `coherence`, `engagingness`, `groundedness`. Turn-level 평가.

**QAGS** (Wang et al., 2020): 요약의 hallucination 평가 벤치마크. `consistency` 차원 측정. CNN/DailyMail과 XSum 두 데이터셋 포함.

### 3.3 Baselines

비교 대상 평가자들:

- **N-gram 기반**: ROUGE-1, ROUGE-2, ROUGE-L
- **Embedding 기반**: BERTScore, MoverScore
- **학습 기반**: BARTScore, UniEval, FactCC, QAGS(메트릭), CTC
- **LLM 기반**: GPTScore
- **대화 전용**: USR

### 3.4 Results for Summarization (SummEval)

Summary-level Spearman ($\rho$) 및 Kendall-Tau ($\tau$) 상관관계:

| Metrics | Coherence |  | Consistency |  | Fluency |  | Relevance |  | AVG |  |
|---------|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
|  | $\rho$ | $\tau$ | $\rho$ | $\tau$ | $\rho$ | $\tau$ | $\rho$ | $\tau$ | $\rho$ | $\tau$ |
| ROUGE-1 | 0.167 | 0.126 | 0.160 | 0.130 | 0.115 | 0.094 | 0.326 | 0.252 | 0.192 | 0.150 |
| ROUGE-2 | 0.184 | 0.139 | 0.187 | 0.155 | 0.159 | 0.128 | 0.290 | 0.219 | 0.205 | 0.161 |
| ROUGE-L | 0.128 | 0.099 | 0.115 | 0.092 | 0.105 | 0.084 | 0.311 | 0.237 | 0.165 | 0.128 |
| BERTScore | 0.284 | 0.211 | 0.110 | 0.090 | 0.193 | 0.158 | 0.312 | 0.243 | 0.225 | 0.175 |
| MOVERScore | 0.159 | 0.118 | 0.157 | 0.127 | 0.129 | 0.105 | 0.318 | 0.244 | 0.191 | 0.148 |
| BARTScore | 0.448 | 0.342 | 0.382 | 0.315 | 0.356 | 0.292 | 0.356 | 0.273 | 0.385 | 0.305 |
| UniEval | 0.575 | 0.442 | 0.446 | 0.371 | 0.449 | 0.371 | 0.426 | 0.325 | 0.474 | 0.377 |
| GPTScore | 0.434 | – | 0.449 | – | 0.403 | – | 0.381 | – | 0.417 | – |
| G-Eval-3.5 | 0.440 | 0.335 | 0.386 | 0.318 | 0.424 | 0.347 | 0.385 | 0.293 | 0.401 | 0.320 |
| G-Eval-3.5 - Probs | 0.359 | *0.313* | 0.361 | *0.344* | 0.339 | *0.323* | 0.327 | 0.288 | 0.346 | *0.317* |
| **G-Eval-4** | **0.582** | **0.457** | **0.507** | **0.425** | **0.455** | **0.378** | **0.547** | **0.433** | **0.514** | **0.418** |
| G-Eval-4 - Probs | 0.560 | *0.472* | 0.501 | *0.459* | 0.438 | *0.408* | 0.511 | *0.444* | 0.502 | *0.446* |
| G-Eval-4 - CoT | 0.564 | 0.413 | 0.493 | 0.413 | 0.403 | 0.334 | 0.538 | 0.427 | 0.500 | 0.407 |

*Table 1: SummEval 벤치마크에서 summary-level Spearman ($\rho$) 및 Kendall-Tau ($\tau$) 상관관계. 확률 없는 G-Eval(이탤릭)은 동점이 많아 $\tau$에서 공정한 비교가 아님.*

**핵심 발견**:
- G-Eval-4가 평균 Spearman **0.514**로 모든 기존 메트릭을 큰 폭으로 능가했다.
- 이전 SOTA인 UniEval(0.474)보다 상당히 높다.
- G-Eval-4가 G-Eval-3.5보다 모든 차원에서 높은 상관관계를 보여, **모델 크기가 클수록 평가 능력이 향상**됨을 확인했다.
- GPTScore도 GPT를 사용하지만, 조건부 생성 확률 기반이므로 form-filling 방식의 G-Eval보다 여러 차원에서 낮았다.

### 3.5 Results for Dialogue Generation (Topical-Chat)

Turn-level Spearman ($\rho$) 및 Kendall-Tau ($\tau$) 상관관계:

| Metrics | Naturalness |  | Coherence |  | Engagingness |  | Groundedness |  | AVG |  |
|---------|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
|  | $r$ | $\rho$ | $r$ | $\rho$ | $r$ | $\rho$ | $r$ | $\rho$ | $r$ | $\rho$ |
| ROUGE-L | 0.176 | 0.146 | 0.193 | 0.203 | 0.295 | 0.300 | 0.310 | 0.327 | 0.243 | 0.244 |
| BLEU-4 | 0.180 | 0.175 | 0.131 | 0.235 | 0.232 | 0.316 | 0.213 | 0.310 | 0.189 | 0.259 |
| METEOR | 0.212 | 0.191 | 0.250 | 0.302 | 0.367 | 0.439 | 0.333 | 0.391 | 0.290 | 0.331 |
| BERTScore | 0.226 | 0.209 | 0.214 | 0.233 | 0.317 | 0.335 | 0.291 | 0.317 | 0.262 | 0.273 |
| USR | 0.337 | 0.325 | 0.416 | 0.377 | 0.456 | 0.465 | 0.222 | 0.447 | 0.358 | 0.403 |
| UniEval | 0.455 | 0.330 | 0.602 | 0.455 | 0.573 | 0.430 | 0.577 | 0.453 | 0.552 | 0.417 |
| G-Eval-3.5 | 0.532 | 0.539 | 0.519 | 0.544 | **0.660** | **0.691** | **0.586** | 0.567 | 0.574 | 0.585 |
| **G-Eval-4** | **0.549** | **0.565** | **0.594** | **0.605** | 0.627 | 0.631 | 0.531 | **0.551** | **0.575** | **0.588** |

*Table 2: Topical-Chat 벤치마크에서 Turn-level Pearson ($r$) 및 Spearman ($\rho$) 상관관계*

**핵심 발견**:
- G-Eval이 Topical-Chat에서도 모든 기존 SOTA를 큰 폭으로 능가했다.
- 흥미롭게도 G-Eval-3.5가 G-Eval-4와 비슷한 수준의 성능을 달성했다. 이는 대화 평가가 요약 평가보다 상대적으로 쉬운 태스크임을 시사한다.
- 유사도 기반 메트릭(ROUGE, BERTScore)은 `engaging`과 `grounded` 에서만 어느 정도 동작했고, 나머지 aspect에서는 매우 낮았다.

### 3.6 Results on Hallucinations (QAGS)

| Metrics | QAGS-CNN |  |  | QAGS-XSUM |  |  | Average |  |  |
|---------|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
|  | $r$ | $\rho$ | $\tau$ | $r$ | $\rho$ | $\tau$ | $r$ | $\rho$ | $\tau$ |
| ROUGE-2 | 0.459 | 0.418 | 0.333 | 0.097 | 0.083 | 0.068 | 0.278 | 0.250 | 0.200 |
| ROUGE-L | 0.357 | 0.324 | 0.254 | 0.024 | -0.011 | -0.009 | 0.190 | 0.156 | 0.122 |
| BERTScore | 0.576 | 0.505 | 0.399 | 0.024 | 0.008 | 0.006 | 0.300 | 0.256 | 0.202 |
| MoverScore | 0.414 | 0.347 | 0.271 | 0.054 | 0.044 | 0.036 | 0.234 | 0.195 | 0.153 |
| FactCC | 0.416 | 0.484 | 0.376 | 0.297 | 0.259 | 0.212 | 0.356 | 0.371 | 0.294 |
| QAGS | 0.545 | – | – | 0.175 | – | – | 0.375 | – | – |
| BARTScore | **0.735** | 0.680 | 0.557 | 0.184 | 0.159 | 0.130 | 0.459 | 0.420 | 0.343 |
| CTC | 0.619 | 0.564 | 0.450 | 0.309 | 0.295 | 0.242 | 0.464 | 0.430 | 0.346 |
| UniEval | 0.682 | 0.662 | 0.532 | 0.461 | 0.488 | 0.399 | 0.571 | 0.575 | 0.465 |
| G-Eval-3.5 | 0.477 | 0.516 | 0.410 | 0.211 | 0.406 | 0.343 | 0.344 | 0.461 | 0.377 |
| **G-Eval-4** | 0.631 | **0.685** | **0.591** | **0.558** | **0.537** | **0.472** | **0.599** | **0.611** | **0.525** |

*Table 3: QAGS 벤치마크에서 Pearson ($r$), Spearman ($\rho$), Kendall-Tau ($\tau$) 상관관계*

**핵심 발견**:
- G-Eval-4가 평균적으로 모든 SOTA를 능가했으며, 특히 **QAGS-XSum** (더 추상적인 요약)에서 큰 차이를 보였다.
- BARTScore는 extractive한 QAGS-CNN에서는 강했지만, abstractive한 QAGS-XSum에서는 매우 낮은 상관관계를 보였다.
- G-Eval-3.5는 QAGS에서 성능이 좋지 않았는데, 이는 **consistency 평가가 LLM의 능력에 민감**하다는 것을 시사한다.

## 4. 분석 (Analysis)

### 4.1 G-Eval은 LLM 생성 텍스트를 선호하는가?

LLM을 평가자로 사용할 때의 핵심 우려: **LLM이 자기가 생성한 텍스트를 사람이 쓴 텍스트보다 선호할 수 있다.**

저자들은 Zhang et al. (2023)의 데이터셋을 사용하여 실험했다. 이 데이터셋은 프리랜서 작가가 쓴 사람 요약과 GPT-3.5가 생성한 요약을 비교하며, 사람 annotator가 선호도를 판단한 것이다.

데이터를 세 범주로 나누었다:
1. 사람이 쓴 요약이 **더 낫다**고 판단된 경우
2. GPT-3.5 요약이 **더 낫다**고 판단된 경우
3. **동등하다**고 판단된 경우

**결과** (Figure 2):
- G-Eval-4는 사람이 선호하는 경우 사람 요약에 더 높은 점수를 부여하고, GPT-3.5가 선호되는 경우 GPT-3.5 요약에 더 높은 점수를 부여했다 — 여기까지는 사람과 일치한다.
- **그러나**, G-Eval-4는 **항상** GPT-3.5 요약에 사람 요약보다 높은 점수를 부여했다. 심지어 사람 판단에서 사람 요약이 더 좋다고 한 경우에도.

**원인 분석**:
1. 고품질 NLG 출력은 본질적으로 평가하기 어렵다. 원래 논문에서도 사람 간 일치도(Krippendorff's alpha)가 0.07로 매우 낮았다.
2. G-Eval이 LLM이 생성한 텍스트에 편향이 있을 수 있다. 모델이 생성과 평가에 **동일한 평가 기준 개념**을 공유하기 때문이다.

**시사점**: LLM 기반 평가를 reward signal로 사용하여 LLM을 더 개선하면, 실제 NLG 태스크의 평가 기준이 아니라 **LLM 자체의 평가 기준에 과적합**되는 self-reinforcement 문제가 발생할 수 있다.

### 4.2 Chain-of-Thoughts의 효과

Table 1에서 G-Eval-4 vs G-Eval-4 - CoT(CoT 제거 버전)를 비교하면, CoT가 있는 G-Eval-4가 **모든 차원에서** 더 높은 상관관계를 보였다. 특히 `fluency`에서 차이가 컸다. CoT가 LLM에게 더 많은 맥락과 가이드를 제공하여 평가 과정과 결과를 설명하는 데 도움이 된다.

### 4.3 Probability Normalization의 효과

Table 1에서 G-Eval-4 vs G-Eval-4 - Probs (확률 가중합 제거, 직접 점수 사용)를 비교하면:

- **Kendall-Tau ($\tau$)**: 확률 없는 버전이 더 높다. 하지만 이는 동점이 많아 concordant/discordant pair 계산에서 유리해지기 때문이며, 모델의 진정한 평가 능력을 반영하지 않는다.
- **Spearman ($\rho$)**: 확률 가중합 버전이 더 높다. Spearman은 순위 기반이므로 더 세분화된 연속 점수가 생성 텍스트 간 미묘한 차이를 더 잘 포착한다.

### 4.4 모델 크기의 효과

Table 1과 Table 3에서 G-Eval-4가 G-Eval-3.5보다 대부분의 차원과 데이터셋에서 더 높은 상관관계를 보였다. 단, Topical-Chat의 `engagingness`와 `groundedness`는 예외였다. 이는 **모델이 클수록 더 어렵고 복잡한 평가 태스크** (예: `consistency`, `relevance`)에서 특히 성능이 향상됨을 보여준다.

## 5. 관련 연구

### N-gram 기반 메트릭
BLEU는 수정된 n-gram precision의 기하평균과 brevity penalty를 사용한다. ROUGE는 recall 지향 메트릭으로 요약 평가에 주로 사용된다. 최근 NLG 논문의 60% 이상이 ROUGE나 BLEU만으로 평가하지만, 이 메트릭들은 콘텐츠 품질이나 문법 오류를 제대로 측정하지 못한다.

### Embedding 기반 메트릭
BERTScore는 BERT의 contextualized embedding으로 생성 텍스트와 참조 텍스트의 유사도를 측정한다. MoverScore는 soft alignment과 새로운 aggregation 방법을 추가하여 BERTScore를 개선한다.

### Task-specific 평가자
FactCC는 요약의 consistency를 예측하는 BERT 기반 classifier이다. QAGS는 요약에서 질문을 생성하고 원본 문서에서 답을 찾을 수 있는지 확인하는 QA 기반 평가자이다. USR은 대화 응답을 다양한 관점에서 평가한다.

### Unified 평가자
UniEval은 사전학습된 T5 모델로 평가 태스크를 QA 형태로 인코딩하여 여러 aspect를 평가한다.

### LLM 기반 평가자
GPTScore는 GPT-3 같은 생성 모델이 고품질 텍스트에 높은 확률을 부여한다는 가정 하에, 조건부 생성 확률을 평가 메트릭으로 사용한다. G-Eval과 달리 조건부 생성 문제로 정의하여 form-filling 방식이 아니다.

## 6. 결론

이 논문은 LLM에 Chain-of-Thoughts (CoT)를 활용하여 생성 텍스트의 품질을 평가하는 **G-Eval** 프레임워크를 제안했다.

**핵심 결과**:
- Text summarization과 dialogue generation 두 NLG 태스크에서 G-Eval이 모든 기존 SOTA를 능가하며 사람 판단과 더 높은 상관관계를 달성했다.
- GPT-4 기반 G-Eval이 SummEval에서 평균 Spearman **0.514**를 달성했다.
- LLM 기반 평가자의 행동에 대한 분석을 수행하고, LLM 생성 텍스트를 선호하는 편향의 잠재적 위험성을 지적했다.

**한계 및 시사점**:
- LLM 기반 평가자가 LLM 생성 텍스트를 선호하는 편향은 self-reinforcement 문제로 이어질 수 있다.
- GPT-4의 토큰 확률 접근 불가로 20번 샘플링으로 확률을 추정해야 하는 비용 문제가 있다.
- 모델 크기가 평가 능력에 큰 영향을 미치므로, 더 강한 LLM이 나올수록 평가 성능도 개선될 것으로 기대된다.
