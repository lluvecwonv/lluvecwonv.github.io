---
title: "Preserving Privacy Through DeMemorization"
date: 2026-03-09
summary: EMNLP 2023 논문 Preserving Privacy Through DeMemorization을 바탕으로, RL 기반 unlearning인 DeMem의 문제의식, 관련 연구, 방법론, 핵심 실험 결과를 정리했습니다.
tags: [LLM, Privacy, Memorization, Unlearning, Reinforcement Learning, 연구노트]
category: 연구노트
language: ko
---

이번 연구노트는 EMNLP 2023 논문 **Preserving Privacy Through DeMemorization: An Unlearning Technique For Mitigating Memorization Risks In Language Models**를 정리한 글이다.
문제는 단순하다.

**"모델이 학습 데이터를 외운 상태를 완전히 지우지 않더라도, 적어도 쉽게 꺼내지 못하게 만들 수 있는가?"**

저자들은 여기에 대해 **DeMem**이라는 RL 기반 unlearning 방법을 제안한다.
핵심은 특정 샘플을 통째로 삭제하는 대신, prefix를 주었을 때 원래 suffix를 그대로 재현하지 않도록 **dissimilarity policy**를 학습시키는 것이다.

논문 링크: https://aclanthology.org/2023.emnlp-main.265/

## 한 줄 요약

이 논문은 memorization을 **"prefix를 주었을 때 원래 학습 suffix를 얼마나 비슷하게 복원하느냐"**의 문제로 보고, **negative BERTScore reward + PPO**로 그 재현성을 낮추면서도 모델의 일반 성능은 거의 유지하는 절충점을 보여준다.

## 1. 서론

저자들이 던지는 질문은 오늘날 LLM privacy 논의의 한가운데에 있다.
모델이 커질수록 성능은 좋아지지만, 동시에 학습 데이터 일부를 그대로 혹은 거의 그대로 재생산할 위험도 커진다.
Carlini 계열 연구가 이미 보여줬듯이, 충분한 prefix를 주면 모델은 이메일, 코드, 저작권 텍스트 같은 민감한 정보를 뽑아낼 수 있다.

기존 대응은 크게 네 갈래다.

- 학습 전에 민감 데이터를 제거하거나 정제하는 방식
- 중복 샘플을 줄이는 deduplication
- differential privacy로 애초에 개별 샘플 영향력을 제한하는 방식
- 이미 학습된 모델에서 특정 데이터를 "잊게" 만드는 knowledge unlearning

문제는 이들 모두 분명한 약점이 있다는 점이다.

- data sanitization은 무엇이 민감한지 미리 알아야 한다.
- deduplication은 중복 샘플은 줄여도 비중복 memorization은 남긴다.
- differential privacy는 성능과 계산 비용 면에서 부담이 크다.
- knowledge unlearning은 privacy는 강하지만, 한 번에 보호할 수 있는 샘플 수가 제한되고 성능 저하가 커질 수 있다.

이 논문의 제안은 여기서 나온다.
완전 삭제 대신, 모델이 **원문 suffix를 그대로 이어 쓰는 버릇 자체를 약화**시키자는 것이다.
저자 표현을 빌리면, 이는 정확한 복원보다 **paraphrasing policy**를 배우게 하는 접근이다.

논문이 주장하는 핵심 포인트는 세 가지다.

- RL feedback으로 memorization을 줄이면서도 LM 성능 저하를 매우 작게 유지할 수 있다.
- UL보다 privacy-performance trade-off가 훨씬 실용적이다.
- deduplication이 적용된 모델에도 DeMem을 추가하면 privacy가 더 좋아진다.

## 2. 관련 연구들

논문 3장은 memorization 완화 연구를 세 부류로 나눈다.

### 2.1 Data Pre/Post-Processing

첫 번째 축은 학습 데이터나 생성 결과를 전처리/후처리하는 방식이다.

- **Deduplication**: 중복 데이터를 제거해 memorization을 줄인다.
- **MemFREE decoding**: 생성 시 n-gram 기준으로 memorized output을 감시한다.

이 계열은 구현이 현실적이고 이미 대형 모델 학습 파이프라인에 들어가기도 쉽다.
하지만 deduplication만으로는 충분하지 않다.
논문도 OPT를 통해 보여주듯, **중복 제거 모델도 여전히 높은 memorization을 보인다.**

### 2.2 Differential Privacy

DP는 가장 강한 이론적 privacy 보장을 주는 축이지만, 이 논문에서는 현실적 제약이 크다고 본다.

- 학습 비용이 크다.
- 수렴이 느리다.
- 비공개가 아닌 일반 학습보다 utility가 떨어지기 쉽다.
- 언어 데이터에서 "무엇을 private unit으로 볼 것인가" 정의가 까다롭다.

즉, privacy guarantee는 강하지만, 대형 생성 모델 학습에는 아직 비싸고 불편한 선택지라는 문제의식이다.

### 2.3 Knowledge Unlearning

UL은 이미 학습된 모델에서 특정 샘플의 negative log-likelihood 최소화 방향을 사실상 되돌리는 방식이다.
privacy 관점에서는 강력하지만, 이 논문은 두 가지 한계를 짚는다.

- 한 번에 너무 많은 샘플을 지우면 성능이 빠르게 떨어진다.
- forgetting 이후 생성 fluent/coherent quality가 흔들릴 수 있다.

이 논문은 바로 이 지점에서 UL과 선을 긋는다.
**"정확한 삭제"보다 "꺼내기 어렵게 만들기"**에 더 무게를 둔 것이다.

### 2.4 이 논문이 가져온 관점

DeMem은 privacy를 formal guarantee가 아니라 **extractability reduction**으로 다룬다.
즉, 특정 prefix를 줬을 때 모델이 학습 suffix를 유사하게 이어 쓰는 능력을 약화하는 것이 목표다.

이 관점은 장단점이 분명하다.

- 장점: 더 실용적이고, 성능 손실이 작다.
- 단점: DP나 exact unlearning처럼 "완전히 지웠다"는 보장은 아니다.

## 3. 방법론

### 3.1 데이터 구성과 문제 설정

훈련/평가에는 Google의 **LM Extraction Benchmark용 Pile subset** 15,000개 샘플을 사용한다.

- train 13,500
- test 1,500
- 각 샘플은 총 200 tokens

토큰 분할은 아래처럼 구성된다.

![Figure 2. sequence split](https://xspdvydnpreiccnpzunm.supabase.co/storage/v1/object/public/blog-images/papers/demem-figure2-sequence-split.png)
*Figure 2. 각 샘플을 pre-prefix 100, prefix 50, suffix 50으로 나눈다. 학습은 prefix-suffix 중심으로 하고, 평가에서는 longer context 공격을 보기 위해 pre-prefix까지 붙인 설정도 따로 본다. 이미지 출처: Kassem et al., EMNLP 2023.*

평가 설정은 두 가지다.

- **standard setting**: prefix만 주고 suffix 생성
- **longer context setting**: pre-prefix + prefix를 주고 suffix 생성

후자는 더 긴 문맥이 memorization을 더 쉽게 드러내는지 보는 실험이다.

### 3.2 DeMem 전체 구조

DeMem의 파이프라인은 아래 그림 한 장으로 거의 정리된다.

![Figure 1. DeMem overview](https://xspdvydnpreiccnpzunm.supabase.co/storage/v1/object/public/blog-images/papers/demem-figure1-overview.png)
*Figure 1. pretraining 이후, 학습 코퍼스의 subset을 써서 RL fine-tuning을 수행하고 negative similarity reward로 DeMem policy를 학습한다. 이미지 출처: Kassem et al., EMNLP 2023.*

직관은 이렇다.

1. prefix `P`를 넣어 모델이 suffix `S_G`를 생성한다.
2. 원래 suffix `S_T`와 얼마나 비슷한지 측정한다.
3. 너무 비슷하면 reward를 낮게 줘서, 모델이 덜 비슷한 출력을 하도록 유도한다.

논문 수식의 핵심은 아래 두 줄이다.

```text
S_G = f_theta(P)
DisScore = -BERTScore(S_G, S_T)
```

즉, **BERTScore가 높을수록 reward는 더 나빠진다.**
원문 suffix와 비슷하게 복원할수록 페널티를 받는 구조다.

### 3.3 Reward 설계: negative BERTScore + KL penalty

reward 설계는 두 목적을 동시에 잡으려 한다.

- 원래 suffix와는 달라야 한다.
- 그렇다고 모델이 완전히 망가지면 안 된다.

그래서 저자들은 다음 두 요소를 사용한다.

- **negative BERTScore**: 원래 suffix와의 유사도를 낮추는 보상
- **KL penalty**: 업데이트된 정책이 원래 pretrained policy에서 너무 멀어지지 않게 제약

논문 기본값은 `beta = 0.2`다.
이 KL 항이 중요한 이유는, privacy만 세게 밀면 모델이 엉뚱하고 비문법적인 출력을 낼 수 있기 때문이다.
DeMem은 suffix를 덜 외우게 하되, **언어 모델로서의 일관성은 유지**하려는 설계다.

### 3.4 PPO / NLPO 최적화

최적화에는 PPO 계열을 쓰고, 실제 언어 생성 안정화를 위해 **NLPO(top-p 0.95)**를 사용한다.
batch size는 32, value head도 추가한다.

이 부분의 의미는 단순하다.
DeMem은 supervised fine-tuning이 아니라 **reward를 최대화하는 policy learning**으로 작동한다.
그래서 "정답 suffix를 맞추는 학습"이 아니라, **"덜 외운 듯한 suffix를 내는 학습"**이다.

### 3.5 Memorization 측정 방식

이 논문은 exact memorization이 아니라 **approximate memorization**을 택한다.
즉, 토씨 하나 안 틀리고 복제해야만 memorization이라고 보지 않는다.

측정에는 **SacreBLEU**를 쓴다.

- `SacreBLEU`가 높다: 생성 suffix가 원래 suffix와 비슷하다.
- `Negative SacreBLEU`가 높다: 원래 suffix와 덜 비슷하다. 즉, forgetting이 더 잘 됐다.

결과 표를 읽을 때 이 점이 중요하다.

**이 논문에서는 `N-SacreBLEU`가 높을수록 privacy 측면에서 더 좋다.**

## 4. 실험 결과

### 4.1 실험 세팅

비교 모델은 두 패밀리다.

- **GPT-Neo 125M / 1.3B / 2.7B**
- **OPT 125M / 1.3B / 2.7B**

여기서 OPT는 deduplicated pretraining 데이터를 사용한 모델이라, 사실상 **deduplication baseline** 역할도 한다.

평가는 세 축으로 본다.

- forgetting: `N-SacreBLEU`
- 일반 성능: 8개 classification benchmark 평균 accuracy
- 언어 품질: WikiText perplexity, generated suffix perplexity

즉, 이 논문은 privacy만 보는 게 아니라, **privacy를 얻기 위해 얼마나 capability를 잃는지**를 같이 본다.

### 4.2 메인 결과: GPT-Neo와 OPT 모두에서 trade-off가 좋다

먼저 GPT-Neo 결과다.

![Table 1. GPT-Neo main results](https://xspdvydnpreiccnpzunm.supabase.co/storage/v1/object/public/blog-images/papers/demem-table1-gptneo-results.png)
*Table 1. GPT-Neo 계열 메인 결과. 이미지 출처: Kassem et al., EMNLP 2023.*

여기서 읽어야 할 포인트는 명확하다.

- UL은 `N-SacreBLEU`를 거의 `99` 수준까지 끌어올리지만, accuracy와 perplexity 손실이 크다.
- DeMem은 UL보다 forgetting 수치는 약하지만, 일반 성능 손실이 매우 작다.
- 예를 들어 `NEO 2.7B`에서 baseline `26.26 -> 49.24`, `LM ACC 52.67 -> 52.48`로 privacy는 크게 좋아지고 성능은 거의 유지된다.

OPT 결과도 같은 패턴이다.

![Table 2. OPT main results](https://xspdvydnpreiccnpzunm.supabase.co/storage/v1/object/public/blog-images/papers/demem-table2-opt-results.png)
*Table 2. OPT 계열 메인 결과. 이미지 출처: Kassem et al., EMNLP 2023.*

중요한 해석은 다음과 같다.

- OPT는 deduplication 덕분에 baseline부터 GPT-Neo보다 memorization이 덜하다.
- 그런데도 DeMem을 더하면 forgetting score가 추가로 오른다.
- 예를 들어 `OPT 2.7B`는 baseline `71.80 -> 94.53`, `LM ACC 53.74 -> 52.20`으로 변한다.

즉, **deduplication만으로는 충분하지 않고, deduplication + DeMem 조합이 더 강하다**는 것이 논문의 핵심 주장이다.

저자들이 본문에서 직접 요약한 메시지도 같다.

- UL은 privacy가 가장 강하지만 평균 capability loss가 약 `11%`
- DeMem은 memorization 완화 효과가 UL에 가깝지만 capability loss는 약 `0.5%`

이 지점이 이 논문의 가장 설득력 있는 결과다.

### 4.3 샘플 수가 늘어나도 DeMem은 비교적 안정적이다

UL의 고질적인 문제는 한 번에 잊게 해야 하는 샘플 수가 늘면 성능이 무너지기 쉽다는 점이다.
Figure 3은 그 차이를 직관적으로 보여준다.

![Figure 3. stability vs forgotten sample count](https://xspdvydnpreiccnpzunm.supabase.co/storage/v1/object/public/blog-images/papers/demem-figure3-sample-stability.png)
*Figure 3. GPT-Neo에서 forgotten sample 수를 32, 128, 256으로 늘렸을 때, UL은 평균 성능이 꾸준히 떨어지지만 DeMem은 거의 평평하게 유지된다. 이미지 출처: Kassem et al., EMNLP 2023.*

이 그림에서 볼 수 있는 해석은 간단하다.

- **UL**: sample 수가 커질수록 성능 하락이 누적된다.
- **DeMem**: 한 번 policy를 배우면 sample 수 변화에 둔감하다.

저자들은 이를 **universal policy**라고 부른다.
즉, DeMem은 "이번 32개 샘플만 잊는 작업"이 아니라, 더 일반적인 forgetting behavior를 학습했다는 주장이다.

부가적으로 흥미로운 점은 DeMem step 수다.
표를 보면 작은 모델은 더 많은 step이 필요하고, 큰 모델은 더 적은 step에서도 수렴한다.
저자들이 말한 **larger models forget faster**라는 관찰은 바로 이 지점과 연결된다.

### 4.4 긴 문맥 공격(longer context)에서도 효과가 남는다

LLM memorization은 짧은 prefix만으로는 잘 안 보이다가, 문맥을 충분히 길게 주면 갑자기 드러나는 경우가 있다.
논문은 이를 **discoverability phenomenon**과 연결해 본다.

Table 3은 longer context에서 DeMem 전후 변화를 보여준다.

| Model | Params | Before N-SacreBLEU | Before PPL | After N-SacreBLEU | After PPL |
| --- | --- | ---: | ---: | ---: | ---: |
| NEO | 125M | 45.74 | 4.12 | 55.04 | 4.15 |
| NEO | 1.3B | 59.58 | 6.64 | 88.91 | 7.68 |
| NEO | 2.7B | 10.55 | 1.41 | 32.66 | 1.54 |
| OPT | 125M | 89.35 | 11.99 | 94.47 | 12.38 |
| OPT | 1.3B | 59.58 | 6.64 | 88.91 | 7.68 |
| OPT | 2.7B | 56.35 | 5.95 | 89.37 | 6.76 |

이 표에서 중요한 건 두 가지다.

- 긴 문맥을 주면 원래 memorization이 더 쉽게 드러난다.
- 그래도 DeMem 적용 후에는 `N-SacreBLEU`가 전반적으로 크게 올라간다.

특히 `NEO 2.7B`는 longer context에서 baseline `10.55`로 매우 취약했지만, DeMem 후 `32.66`까지 올라간다.
완벽한 방어는 아니지만, **긴 문맥 공격에서도 extractability를 눈에 띄게 줄였다**는 뜻이다.

Figure 4는 이를 threshold 관점에서 더 직관적으로 보여준다.

![Figure 4. 75% threshold before and after DeMem](https://xspdvydnpreiccnpzunm.supabase.co/storage/v1/object/public/blog-images/papers/demem-figure4-longer-context-threshold.png)
*Figure 4. Neo 2.7B longer context 설정에서 75% SacreBLEU 기준으로 approximate memorization 영역(붉은 상단 구간)을 보면, DeMem 이후 분포가 threshold 아래로 더 넓게 퍼진다. 이미지 출처: Kassem et al., EMNLP 2023.*

즉, DeMem 이후에는 고득점 memorized sample이 한쪽에 뭉쳐 있는 패턴이 약해진다.

참고로 원문 Table 3에는 `NEO 1.3B`와 `OPT 1.3B` 행이 동일한 숫자로 실려 있다.
이 연구노트에서는 원문 표기를 그대로 옮겼지만, **논문 자체의 표기 중복 가능성**은 염두에 둘 필요가 있다.

### 4.5 정성 결과: 이메일과 문자열을 덜 그대로 내뱉는다

Figure 5는 DeMem 전후 qualitative example이다.

![Figure 5. qualitative examples](https://xspdvydnpreiccnpzunm.supabase.co/storage/v1/object/public/blog-images/papers/demem-figure5-qualitative-examples.png)
*Figure 5. DeMem 적용 전에는 원문 suffix와 매우 비슷한 문자열, 이메일, 라이선스 문구가 복원되지만, 적용 후에는 더 다른 문자열로 바뀌는 사례가 늘어난다. 이미지 출처: Kassem et al., EMNLP 2023.*

이 그림의 의미는 꽤 직접적이다.

- before: 원문 suffix 일부를 거의 그대로 이어 쓴다.
- after: 동일한 prefix에서도 더 다른 continuation이 나온다.

특히 이메일 주소나 특정 라이선스 텍스트처럼 **verbatim leakage가 위험한 유형**에서 변화가 눈에 띈다.

## 5. 내 해석

이 논문을 읽고 가장 중요하다고 느낀 지점은, privacy를 **"삭제"가 아니라 "재현 난이도 상승"**으로 재정의했다는 점이다.
이건 엄밀한 privacy 보장과는 다르지만, 실제 LLM 운영에서는 오히려 더 현실적인 목표일 수 있다.

장점은 분명하다.

- 성능 손실이 작다.
- deduplication과 결합 가능하다.
- 한 번 학습한 policy가 더 많은 샘플에도 일반화된다.

하지만 한계도 분명하다.

- 이건 **certified deletion**이 아니다.
- semantic leakage까지 완전히 막는다고 보기는 어렵다.
- 평가 모델도 공개형 125M~2.7B 규모라, 초대형 frontier model에서 같은 trade-off가 유지된다고 단정하긴 어렵다.

특히 privacy 관점에서 보면, DeMem은 **"원문 그대로 말하지 않게 만들기"**에는 강하지만, **"그 사실 자체를 전혀 알지 못하게 만들기"**와는 다르다.
그래서 DP나 stronger unlearning을 대체한다기보다, 그 사이의 실용적 중간지점으로 보는 편이 더 정확하다.

## 6. 정리

이 논문은 memorization mitigation을 단순한 삭제 문제로 보지 않고, **generation policy 자체를 바꾸는 문제**로 다뤘다는 점에서 인상적이다.
결론적으로 DeMem은 UL보다 훨씬 실용적인 trade-off를 보여줬고, deduplication만으로 부족한 privacy 문제를 후속 RL fine-tuning으로 보완할 수 있음을 보여준다.

한 문장으로 줄이면 이렇다.

**"민감한 suffix를 아예 지우는 대신, 모델이 그 suffix를 그대로 꺼내기 어렵게 만드는 쪽이 실제 LLM privacy engineering에서는 더 현실적일 수 있다."**
