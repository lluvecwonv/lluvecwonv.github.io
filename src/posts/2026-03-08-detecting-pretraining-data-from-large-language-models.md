---
title: Detecting Pretraining Data from Large Language Models 논문 정리
date: 2026-03-08
summary: ICLR 2024 논문 Detecting Pretraining Data from Large Language Models를 바탕으로, pretraining data detection 문제와 MIN-K% PROB, WIKI MIA, 핵심 실험 결과를 정리했습니다.
tags: [LLM, Membership Inference, Pretraining, Memorization, 연구노트]
category: 연구노트
---

이번 연구노트는 ICLR 2024 논문 **Detecting Pretraining Data from Large Language Models**를 정리한 글이다.
질문은 단순하다.

**"이 텍스트를 LLM이 사전학습 때 이미 본 적이 있는가?"**

겉으로는 membership inference 문제처럼 보이지만, 이 논문이 다루는 대상은 일반적인 fine-tuning 데이터가 아니라 **거대 사전학습(pretraining) 데이터**라는 점이 핵심이다. 저자들은 이 문제를 위해 **WIKI MIA**라는 동적 벤치마크를 만들고, 별도 reference model 없이 동작하는 **MIN-K% PROB**라는 탐지 방법을 제안한다.

논문 링크: https://arxiv.org/abs/2310.16789

## 한 줄 요약

이 논문은 "평균적인 perplexity"보다 **가장 확률이 낮은 일부 토큰들의 이상치 패턴**이 pretraining membership을 더 잘 드러낸다고 보고, 그 직관을 실제 탐지 알고리즘으로 연결했다.

## 1. 서론

저자들이 문제를 제기하는 배경은 명확하다.
오늘날 LLM은 대규모 텍스트로 학습되지만, 실제로 **무엇을 학습했는지**는 거의 공개되지 않는다.
이 비공개성은 세 가지 문제를 만든다.

- 저작권 텍스트가 학습 데이터에 포함되었는지 알기 어렵다.
- 개인정보가 모델 안에 남아 있는지 점검하기 어렵다.
- 평가용 벤치마크가 사전학습 데이터에 섞였는지 확인하기 어렵다.

즉, 모델이 강해질수록 "무엇을 외웠는가"를 묻는 일은 더 중요해지는데, 정작 이를 검증할 방법은 부족하다는 것이 출발점이다.

논문은 이 문제를 다음처럼 정의한다.

- 입력: 텍스트 한 조각 `x`
- 접근 권한: 모델 내부 가중치나 학습 데이터는 모르고, 오직 **black-box로 token probability**만 볼 수 있음
- 목표: `x`가 pretraining data에 포함되었는지 판별

여기서 저자들은 기존 fine-tuning membership inference와 다른 두 가지 난점을 짚는다.

첫째, **pretraining data distribution 자체를 모른다.**
기존 MIA는 shadow data나 reference model을 써서 calibration하는 경우가 많지만, LLM pretraining에서는 그 분포를 알기도 어렵고 재학습 비용도 지나치게 크다.

둘째, **탐지 자체가 더 어렵다.**
fine-tuning은 같은 예제를 여러 epoch 반복해서 보지만, pretraining은 훨씬 큰 데이터셋에서 각 샘플을 한 번 정도만 보는 경우가 많다.
그래서 membership signal이 훨씬 약하다.

이 문제 설정은 단순히 공격 기법 하나를 제안하는 것이 아니라, 앞으로의 LLM 감사(auditing)와 데이터 투명성 문제를 위한 측정 도구를 만들겠다는 방향으로 읽힌다.

## 2. 관련 연구들

이 논문에는 전통적인 형태의 긴 Related Work 절이 앞부분에 분리되어 있지는 않다.
대신 서론, 문제 정의, baseline 설명에 관련 연구 축이 흩어져 있고, 이를 묶으면 다음 네 갈래로 정리할 수 있다.

### 2.1 Membership Inference Attack 계열

기본 뿌리는 Shokri et al.의 **membership inference attack**이다.
어떤 샘플이 학습 데이터에 들어갔는지 판별하는 문제는 오래전부터 있었지만, 대부분은 분류 모델이나 비교적 작은 설정에 집중되어 있었다.

이 논문은 그 프레임을 LLM으로 가져오되, 질문을 이렇게 바꾼다.

- fine-tuning data가 아니라 pretraining data를 잡아낼 수 있는가?
- shadow model 없이도 가능한가?
- black-box 확률 정보만으로 가능한가?

### 2.2 Fine-tuning 데이터 탐지 연구

Song & Shmatikov, Watson et al., Carlini et al. 같은 선행연구는 **reference model로 난이도 보정(calibration)**을 해가며 membership 여부를 추론했다.
이 계열은 성능이 강하지만, 이 논문이 겨냥하는 환경에는 맞지 않는다.

- pretraining corpus distribution을 모를 수 있음
- 같은 분포로 shadow model을 다시 학습시키기 어렵고 비쌈
- 공개되지 않은 거대 모델에는 현실적으로 적용하기 어려움

즉, 관련 연구는 강하지만 전제가 너무 강하다는 것이 이 논문의 문제의식이다.

### 2.3 Reference-free 휴리스틱

논문이 비교 대상으로 둔 reference-free 계열은 다음과 같다.

- **PPL / LOSS attack**: 텍스트 전체 perplexity가 낮으면 seen sample일 가능성이 높다고 봄
- **Neighbor**: probability curvature를 활용하는 방식으로, DetectGPT와 유사한 계열
- **Zlib / Lowercase**: 압축률 혹은 소문자 변환 전후 perplexity 차이를 이용

이들은 구현이 간단하고 reference model이 필요 없지만, 모두 기본적으로는 **문장 전체 수준의 확률**에 의존한다.
저자들은 바로 이 점이 약점이라고 본다.

### 2.4 이 논문의 차별점

이 논문은 기존 연구와의 차이를 다음 한 문장으로 요약할 수 있다.

**"평균적인 문장 확률이 아니라, 텍스트 안의 가장 수상한 low-probability token들에 집중하자."**

즉, 전체 문장이 자연스럽게 보이는지보다,
그 문장 안에 **모델이 이상하게 낯설어하는 outlier token**이 몇 개나 있는지가 membership detection에 더 중요하다고 가정한다.

## 3. 방법론

방법론은 크게 두 축이다.

- 평가를 위한 벤치마크: **WIKI MIA**
- 탐지 방법: **MIN-K% PROB**

### 3.1 문제 정의

모델 `fθ`와 어떤 텍스트 `x`가 있을 때, 탐지기 `h(x, fθ)`는 이 텍스트가 pretraining에 포함되었는지 여부를 예측한다.
중요한 제약은 다음 두 가지다.

- pretraining data 자체는 모름
- 모델 내부 가중치에는 접근하지 못하고, token probability만 얻을 수 있음

즉, 이 방법은 white-box memorization 분석이 아니라 **현실적인 black-box auditing**에 더 가깝다.

### 3.2 WIKI MIA 벤치마크

저자들은 membership detection을 평가하기 위해 **시간축을 이용한 동적 벤치마크**를 만든다.
핵심 아이디어는 간단하다.

- 2023년 1월 1일 이후 생성된 Wikipedia event page는 **non-member**
- 훨씬 이전 시점의 Wikipedia event page는 **member 후보**

이렇게 하면 특히 non-member 쪽은 거의 확실하게 보장된다.
모델이 2023년 이후 사건을 pretraining에서 볼 수는 없기 때문이다.

논문에서 정리한 WIKI MIA의 성격은 세 가지다.

- **Accurate**: 시간 정보 덕분에 non-member가 실제로 unseen일 가능성이 높다.
- **General**: Wikipedia를 쓰는 여러 pretrained LM에 폭넓게 적용 가능하다.
- **Dynamic**: 이후 시점의 새 이벤트를 계속 추가해 벤치마크를 갱신할 수 있다.

또한 벤치마크를 두 방식으로 나눈 점이 중요하다.

- **Original setting**: 원문 그대로 탐지
- **Paraphrase setting**: ChatGPT로 예제를 패러프레이즈한 뒤, 의미적으로 동등한 텍스트에서도 membership signal을 잡을 수 있는지 평가

여기에 더해 텍스트 길이도 `32 / 64 / 128 / 256` 토큰으로 나눠 평가한다.
이 설계는 실전적이다.
현실에서는 정확히 같은 문장만 찾는 것이 아니라, **의미는 같지만 표현이 바뀐 텍스트**도 잡아야 하기 때문이다.

### 3.3 MIN-K% PROB

논문의 핵심 가설은 다음과 같다.

**학습되지 않은 텍스트는 문장 전체가 아니라, 일부 토큰에서 유난히 낮은 확률의 outlier를 보일 가능성이 높다.**

반대로 이미 학습에서 본 텍스트는 그런 극단적 저확률 토큰이 상대적으로 덜 나온다.

방법은 매우 단순하다.

1. 텍스트의 각 토큰에 대해 `log p(x_i | x_<i)`를 계산한다.
2. 그중 확률이 가장 낮은 토큰 하위 `k%`만 고른다.
3. 그 토큰들의 평균 log-likelihood를 membership score로 쓴다.

형태로 쓰면 아래와 같다.

```text
MIN-K% PROB(x) = average of log p(x_i | x_<i)
for tokens x_i in the bottom k% probability tokens of x
```

직관은 이렇다.

- **non-member**: 몇 개의 토큰이 유독 낯설어서 바닥을 침
- **member**: 전체적으로 smoother하고, 최악의 토큰들도 덜 극단적임

이 논문에서 중요한 점은 이 방법이 **reference-free**라는 것이다.
즉, 별도 shadow model을 만들지 않고도 바로 적용할 수 있다.

![MIN-K% PROB overview](/posts/detect-pretraining-figure1-overview.png)
*Figure 1. MIN-K% PROB 개요. 각 토큰 확률을 계산한 뒤, 가장 확률이 낮은 하위 k% 토큰만 골라 평균 log-likelihood로 membership을 판정한다. 이미지 출처: Shi et al., ICLR 2024.*

### 3.4 왜 이 방식이 의미가 있나

기존 PPL 기반 방법은 문장 전체를 평균내기 때문에, membership signal이 일부 토큰에만 집중되어 있으면 희석될 수 있다.
반면 MIN-K% PROB는 가장 약한 고리만 따로 본다.

개인적으로 이 설계의 장점은 두 가지다.

- 구현이 단순해 재현성이 높다.
- "평균"보다 "이상치"에 주목한다는 점에서 직관과 잘 맞는다.

반대로 약점도 있다.
이 방법은 여전히 **token logprob 접근이 가능한 API**를 가정한다.
완전한 의미의 블랙박스라기보다, **log probability를 노출하는 제한적 black-box** 설정에 가깝다.

## 4. 실험 결과

### 4.1 실험 세팅

평가는 WIKI MIA에서 진행되며, 대상 모델은 다음과 같다.

- Pythia-2.8B
- GPT-NeoX-20B
- LLaMA-30B
- LLaMA-65B
- OPT-66B

평가 지표는 다음 두 가지다.

- **AUC**
- **TPR@5%FPR**

비교 baseline은 Neighbor, PPL, Zlib, Lowercase, Smaller Reference model이다.
MIN-K% PROB의 핵심 하이퍼파라미터 `k`는 validation에서 `20`이 가장 좋아서 고정 사용했다.

### 4.2 메인 결과

가장 중요한 결과는 Table 1이다.
논문에서 MIN-K% PROB는 전체 평균 **AUC 0.72**를 기록했고, 가장 강한 baseline이던 **PPL 0.67**보다 높았다.
논문 표현으로는 **7.4% improvement**, 절대값으로 보면 **+0.05 AUC**다.

모델별로 보면 다음 경향이 뚜렷하다.

- Pythia-2.8B: original 0.67, paraphrase 0.66
- NeoX-20B: original 0.76, paraphrase 0.74
- LLaMA-30B: original 0.74, paraphrase 0.73
- LLaMA-65B: original 0.74, paraphrase 0.74
- OPT-66B: original 0.71, paraphrase 0.69

즉, 특정 모델 하나에서만 우연히 먹힌 게 아니라 여러 pretrained LM에서 일관되게 우세했다.
특히 paraphrase setting에서도 성능이 유지된다는 점이 중요하다.
이건 단순 문자열 매칭이 아니라, 모델이 그 텍스트의 분포를 얼마나 "익숙하게" 느끼는지를 어느 정도 포착한다는 뜻이다.

TPR@5%FPR 기준으로도 MIN-K% PROB 평균은 **22.2**로, baseline보다 가장 높은 수치를 보였다.
저오탐 조건에서도 쓸 만한 신호를 준다는 의미다.

| Method | Pythia Ori. | Pythia Para. | NeoX Ori. | NeoX Para. | LLaMA-30B Ori. | LLaMA-30B Para. | LLaMA-65B Ori. | LLaMA-65B Para. | OPT-66B Ori. | OPT-66B Para. | Avg. |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Neighbor | 0.61 | 0.59 | 0.68 | 0.58 | 0.71 | 0.62 | 0.71 | 0.69 | 0.65 | 0.62 | 0.65 |
| PPL | 0.61 | 0.61 | 0.70 | 0.70 | 0.70 | 0.70 | 0.71 | 0.72 | 0.66 | 0.64 | 0.67 |
| Zlib | 0.65 | 0.54 | 0.72 | 0.62 | 0.72 | 0.64 | 0.72 | 0.66 | 0.67 | 0.57 | 0.65 |
| Lowercase | 0.59 | 0.60 | 0.68 | 0.67 | 0.59 | 0.54 | 0.63 | 0.60 | 0.59 | 0.58 | 0.61 |
| Smaller Ref | 0.60 | 0.58 | 0.68 | 0.65 | 0.72 | 0.64 | 0.74 | 0.70 | 0.67 | 0.64 | 0.66 |
| **MIN-K% PROB** | **0.67** | **0.66** | **0.76** | **0.74** | **0.74** | **0.73** | **0.74** | **0.74** | **0.71** | **0.69** | **0.72** |

*Table 1. WIKI MIA에서의 AUC 비교. 원 논문의 Table 1을 그대로 옮겼다.*

### 4.3 분석 실험

논문은 단순 성능 비교를 넘어서, 어떤 조건에서 탐지가 쉬워지는지도 본다.

첫째, **모델이 클수록 탐지가 쉬워진다.**
LLaMA 7B, 13B, 30B, 65B 비교에서 모델 크기가 커질수록 AUC가 올라간다.
저자들은 더 큰 모델이 더 많은 파라미터를 가져, pretraining 데이터를 더 강하게 기억할 가능성이 있다고 해석한다.

![AUC vs model size](/posts/detect-pretraining-figure2a-model-size.png)
*Figure 2(a). 모델 크기가 커질수록 AUC가 상승한다. 이미지 출처: Shi et al., ICLR 2024.*

둘째, **텍스트가 길수록 탐지가 쉬워진다.**
32, 64, 128, 256 토큰으로 자를수록 길이가 늘어날수록 AUC가 높아진다.
짧은 문장은 membership signal이 약해서 어렵고, 긴 문장은 기억 흔적이 더 많이 드러난다는 뜻이다.

![AUC vs text length](/posts/detect-pretraining-figure2b-text-length.png)
*Figure 2(b). 텍스트 길이가 길수록 탐지가 쉬워진다. 이미지 출처: Shi et al., ICLR 2024.*

이 결과는 실전 해석에도 중요하다.
즉, 이 방법은 짧은 문장 하나를 법적 증거처럼 단정하는 도구라기보다,
**길이가 있는 텍스트 단위에서 pretraining 흔적을 추정하는 감사 도구**에 더 가깝다.

## 5. 사례 연구: 저작권 도서 탐지

논문은 WIKI MIA 벤치마크를 넘어서, 실제 응용으로 **저작권 도서가 GPT-3 pretraining에 들어갔는지**도 탐지한다.

설정은 다음과 같다.

- 검증셋: ChatGPT가 암기한 것으로 알려진 50권 vs 2023년 출간 신간 50권
- 테스트셋: Books3에서 무작위로 고른 100권, 각 책당 100개 512-word snippet
- 판단 기준: 검증셋에서 고른 threshold로 snippet contamination rate 계산

Figure 3 결과는 단순하다.
**MIN-K% PROB가 AUC 0.88**로 가장 높고, PPL 0.84보다도 앞선다.

![Figure 3 recreated: copyrighted books AUC](/posts/detect-pretraining-figure3-books-auc.png)
*Figure 3. GPT-3에서 저작권 도서 snippet을 탐지하는 AUC. 논문 수치를 바탕으로 재구성한 그래프다.*

| Method | Book AUC |
| --- | ---: |
| Neighbor | 0.75 |
| PPL | 0.84 |
| Zlib | 0.81 |
| Lowercase | 0.80 |
| **MIN-K% PROB** | **0.88** |

*Figure 3 수치를 표로 다시 정리한 것.*

그리고 Figure 4는 더 직접적이다.
논문에 따르면 **100권 중 거의 90%가 contamination rate 50%를 넘는다.**
즉, 일부 snippet이 아니라 상당한 비율의 도서 조각이 GPT-3에 이미 들어가 있었을 가능성을 시사한다.

![Figure 4: contamination rate distribution](/posts/detect-pretraining-figure4-books-contamination.png)
*Figure 4. 100권의 오염률 분포. 80~100% 구간에 많은 책이 몰려 있다. 이미지 출처: Shi et al., ICLR 2024.*

### 5.1 책 오염도(contamination rate)란 무엇인가

여기서 **책 오염도**는 각 책에서 무작위로 뽑은 `100개 snippet` 중,
몇 개가 "이 텍스트는 GPT-3 pretraining에서 이미 본 것 같다"라고 탐지되었는지를 퍼센트로 표현한 값이다.

즉,

- `100% contamination`이면 그 책에서 뽑은 100개 snippet 전부가 pretraining member로 판정된 것
- `50% contamination`이면 절반 정도의 snippet이 pretraining 흔적을 보인 것

이 정의로 보면 Figure 4의 의미가 더 선명해진다.

- 책 단위로 봐도 contamination이 낮은 예외보다 **높은 책이 훨씬 많다**
- 특히 **80~100% 구간에 밀집**되어 있어서, GPT-3가 일부 짧은 문장만 스쳐 본 것이 아니라 도서 텍스트를 넓게 흡수했을 가능성을 시사한다
- 논문이 직접 적었듯이 **거의 90%의 책이 50% 초과 contamination rate**를 보인다

### 5.2 오염도가 높은 책들

Table 2를 보면 상위 오염 도서들은 거의 모두 `98~100%` 구간에 있다.
즉, 탐지기가 "책 전체에서 일관되게 pretraining 흔적이 보인다"라고 판단한 셈이다.

특히 눈에 띄는 포인트는 다음이다.

- 상위 7권은 **오염도 100%**
- 상위 20권 전체가 **98% 이상**
- 특정 장르 한쪽에만 치우친 게 아니라 소설, 논픽션, 리더십/교양서가 함께 섞여 있다

이 점 때문에 이 사례 연구는 단순한 anecdote가 아니라,
**Books3 계열 저작권 텍스트가 실제 대규모 사전학습에 포함되었을 가능성**을 꽤 강하게 뒷받침한다.

논문 원문의 Table 2는 상위 20권을 보여준다. 길이가 너무 길어 두 표로 나눠 옮긴다.

| Contamination % | Book Title | Author | Year |
| --- | --- | --- | ---: |
| 100 | The Violin of Auschwitz | Maria Àngels Anglada | 2010 |
| 100 | North American Stadiums | Grady Chambers | 2018 |
| 100 | White Chappell Scarlet Tracings | Iain Sinclair | 1987 |
| 100 | Lost and Found | Alan Dean | 2001 |
| 100 | A Different City | Tanith Lee | 2015 |
| 100 | Our Lady of the Forest | David Guterson | 2003 |
| 100 | The Expelled | Mois Benarroch | 2013 |
| 99 | Blood Cursed | Archer Alex | 2013 |
| 99 | Genesis Code: A Thriller of the Near Future | Jamie Metzl | 2014 |
| 99 | The Sleepwalker’s Guide to Dancing | Mira Jacob | 2014 |

| Contamination % | Book Title | Author | Year |
| --- | --- | --- | ---: |
| 99 | The Harlan Ellison Hornbook | Harlan Ellison | 1990 |
| 99 | The Book of Freedom | Paul Selig | 2018 |
| 99 | Three Strong Women | Marie NDiaye | 2009 |
| 99 | The Leadership Mind Switch: Rethinking How We Lead in the New World of Work | D. A. Benton, Kylie Wright-Ford | 2017 |
| 99 | Gold | Chris Cleave | 2012 |
| 99 | The Tower | Simon Clark | 2005 |
| 98 | Amazon | Bruce Parry | 2009 |
| 98 | Ain’t It Time We Said Goodbye: The Rolling Stones on the Road to Exile | Robert Greenfield | 2014 |
| 98 | Page One | David Folkenflik | 2011 |
| 98 | Road of Bones: The Siege of Kohima 1944 | Fergal Keane | 2010 |

## 6. 사례 연구: Downstream Dataset Contamination

저자들은 또 다른 실전 문제로 **downstream benchmark leakage**를 다룬다.
설정은 RedPajama pretraining corpus에 BoolQ, IMDB, TruthfulQA, CommonsenseQA 예제를 섞어 넣은 뒤,
LLaMA 7B를 추가 pretraining하고 contaminant example을 잡아낼 수 있는지 보는 방식이다.

메인 결과는 Table 3이다.
여기서도 **MIN-K% PROB가 평균 0.86 AUC**로 가장 높다.
특히 IMDB에서는 0.98, BoolQ에서는 0.91까지 올라간다.

| Method | BoolQ | Commonsense QA | IMDB | Truthful QA | Avg. |
| --- | ---: | ---: | ---: | ---: | ---: |
| Neighbor | 0.68 | 0.56 | 0.80 | 0.59 | 0.66 |
| Zlib | 0.76 | 0.63 | 0.71 | 0.63 | 0.68 |
| Lowercase | 0.74 | 0.61 | 0.79 | 0.56 | 0.68 |
| PPL | 0.89 | 0.78 | 0.97 | 0.71 | 0.84 |
| **MIN-K% PROB** | **0.91** | **0.80** | **0.98** | **0.74** | **0.86** |

*Table 3. contaminant downstream example 탐지 AUC.*

이후 ablation이 더 흥미롭다.

- **Figure 5(a)**: downstream contaminant처럼 outlier인 샘플은 pretraining data size가 커질수록 오히려 더 탐지되기 쉬워진다.
- **Figure 5(b)**: 반대로 in-distribution contaminant는 dataset size가 커질수록 더 탐지되기 어려워진다.
- **Figure 5(c)**: 샘플 occurrence frequency가 높을수록 탐지가 쉬워진다.

![Figure 5(a): outlier contaminants](/posts/detect-pretraining-figure5a-dataset-size-outlier.png)
*Figure 5(a). outlier contaminant는 데이터셋이 커질수록 더 잘 드러난다. 이미지 출처: Shi et al., ICLR 2024.*

![Figure 5(b): in-distribution contaminants](/posts/detect-pretraining-figure5b-dataset-size-in-distribution.png)
*Figure 5(b). in-distribution contaminant는 데이터셋이 커질수록 더 숨겨진다. 이미지 출처: Shi et al., ICLR 2024.*

![Figure 5(c): occurrence frequency](/posts/detect-pretraining-figure5c-occurrence-frequency.png)
*Figure 5(c). 같은 contaminant가 더 자주 등장할수록 탐지가 쉬워진다. 이미지 출처: Shi et al., ICLR 2024.*

학습률 효과도 분명하다.
논문 Table 4에 따르면 learning rate를 `1e-5`에서 `1e-4`로 올리면 모든 태스크에서 AUC가 뚜렷하게 증가한다.
저자들은 이를 더 높은 learning rate가 memorization을 강하게 만들기 때문이라고 해석한다.

| Learning Rate | BoolQ | Commonsense QA | IMDB | LSAT QA | Truthful QA |
| --- | ---: | ---: | ---: | ---: | ---: |
| 1 × 10⁻⁵ | 0.64 | 0.59 | 0.76 | 0.72 | 0.56 |
| **1 × 10⁻⁴** | **0.91** | **0.80** | **0.98** | **0.82** | **0.74** |

*Table 4. learning rate가 높을수록 contaminant detection이 쉬워진다.*

## 7. 내 해석과 한계

이 논문이 좋은 이유는 두 가지다.

첫째, 문제 설정이 현실적이다.
실제 외부 사용자는 모델 가중치나 학습 데이터를 볼 수 없고, 많아야 API 수준의 확률 정보만 얻는다.
그 조건에서 작동하는 탐지법을 제안했다는 점이 실용적이다.

둘째, 벤치마크 설계가 영리하다.
WIKI MIA는 "미래 시점의 사건은 과거 pretraining에 없었다"는 시간적 비대칭을 이용해,
non-member 데이터를 꽤 신뢰도 높게 만든다.

하지만 한계도 분명하다.

- **member 쪽 gold label은 완전한 보장이 아니다.** 오래된 Wikipedia 이벤트가 모든 모델의 pretraining에 실제 포함되었다고 100% 단정할 수는 없다.
- **logprob 접근이 필요하다.** 많은 상용 API나 완전 폐쇄형 모델에서는 이 접근 자체가 막혀 있을 수 있다.
- **AUC 0.72는 강하지만 결정적이지는 않다.** 감사와 위험 탐지에는 유용하지만, 개별 샘플에 대한 법적 확정 증거로 쓰기엔 여전히 조심스럽다.
- **짧은 텍스트에는 약하다.** 논문 스스로도 길이가 짧을수록 탐지가 어려워진다고 보여준다.

## 8. 정리

이 논문은 LLM memorization과 데이터 감사 문제를 다룰 때,
복잡한 shadow model보다도 **가장 낮은 확률 토큰 몇 개를 보는 간단한 전략**이 surprisingly strong하다는 점을 보여준다.

내가 보기에 이 논문의 핵심 기여는 세 가지다.

- **문제 제기**: pretraining data detection을 독립된 연구 문제로 전면화했다.
- **평가 기반**: WIKI MIA라는 동적 벤치마크를 제안했다.
- **방법론**: 간단하지만 실용적인 reference-free detector인 MIN-K% PROB를 제안했다.

LLM이 무엇을 외웠는지, 그리고 무엇을 "잊었다고 주장하는지"를 검증해야 하는 시대에 꽤 중요한 출발점이 되는 논문이다.
