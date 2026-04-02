---
title: "Rethinking LLM Memorization through the Lens of Adversarial Compression"
date: 2026-03-09
summary: NeurIPS 2024 논문. LLM의 memorization을 adversarial compression 관점에서 재정의하고, Adversarial Compression Ratio(ACR)와 MiniPrompt 알고리즘을 통해 기존 unlearning 기법의 한계를 실증적으로 보여준 연구를 상세 분석했습니다.
tags: [LLM, Memorization, Adversarial Compression, Unlearning, Privacy, NeurIPS, 연구노트]
category: 연구노트
language: ko
---

이번 연구노트는 NeurIPS 2024 논문 **Rethinking LLM Memorization through the Lens of Adversarial Compression**을 정리한 글이다.
저자는 Carnegie Mellon University의 Avi Schwarzschild, Zhili Feng, Pratyush Maini, Zachary C. Lipton, J. Zico Kolter이다.

핵심 질문은 이렇다.

**"LLM이 학습 데이터를 정말로 '잊었는가', 아니면 잊은 척하고 있는가?"**

기존의 memorization 정의들이 너무 관대하거나 비현실적인 한계를 갖고 있음을 지적하고, **압축(compression)** 관점에서 새로운 정의인 **Adversarial Compression Ratio (ACR)**를 제안한다. 특히 unlearning 기법들이 실제로는 데이터를 잊지 못한다는 것을 이 메트릭으로 실증한 점이 인상적이다.

논문 링크: https://arxiv.org/abs/2404.15146
프로젝트 페이지: https://locuslab.github.io/acr-memorization

## 한 줄 요약

학습 데이터를 타겟 문자열보다 **짧은 프롬프트**로 재현할 수 있다면, 그것은 모델이 해당 데이터를 **memorize**한 것이다 — 이 직관을 ACR이라는 메트릭으로 정형화하고, 기존 unlearning 기법들의 "준수 착각(illusion of compliance)"을 폭로했다.

![Figure 1: ACR 개요 — 타겟 문자열보다 짧은 프롬프트로 재현 가능하면 memorized로 판정](/images/papers/acr-memorization/fig1-acr-overview.png)
*Figure 1: ACR의 핵심 아이디어. 타겟 문자열(12 tokens)을 4 tokens 프롬프트로 재현 가능 → High ACR, memorized. 반대로 26 tokens 타겟을 45 tokens으로만 재현 가능 → Low ACR, not memorized.*

## 1. 서론 — 왜 새로운 Memorization 정의가 필요한가

LLM에 관한 논의에서 핵심 질문은, 모델이 학습 데이터를 **어느 정도까지 memorize** 하는지 vs. **새로운 태스크와 상황에 generalize** 하는지이다. 대부분의 실무자들은 LLM이 두 가지를 모두 수행한다고 (최소한 비공식적으로) 믿고 있다: 학습 데이터의 일부를 명확히 memorize하며 — 예컨대 학습 데이터의 큰 부분을 그대로 재현(verbatim reproduce)할 수 있고 [Carlini et al., 2023] — 동시에 이 데이터로부터 학습하여 새로운 상황에 generalize하는 것으로 보인다.

LLM이 어느 쪽을 얼마나 하는지의 정확한 비율은 **실용적·법적 측면에서 막대한 함의**를 갖는다 [Cooper et al., 2023]. LLM이 정말로 새로운 콘텐츠를 생산하는가, 아니면 학습 데이터를 remix할 뿐인가? 저작권 데이터로 학습하는 행위를 불공정 사용(unfair use)으로 봐야 하는가, 아니면 공정 이용(fair use) 여부를 모델의 memorization으로 판단해야 하는가? 사람에게는 콘텐츠를 **표절하는 것**과 **학습하는 것**을 구분하지만, 이것이 LLM에는 어떻게 적용되어야 하는가? 이러한 질문에 대한 답은 본질적으로 LLM이 학습 데이터를 어느 정도까지 memorize하는지에 달려 있다.

그러나 LLM에서 memorization을 **정의하는 것 자체**가 어렵고, 기존 정의들은 많은 부분에서 아쉬움을 남긴다. 특정 정의들은 LLM이 학습 데이터의 한 구절을 정확히 재현할 수 있으면 memorized로 판정하지만 [Nasr et al., 2023], 이는 예컨대 프롬프트가 모델에게 특정 문구를 정확히 반복하라고 지시하는 상황을 무시한다. 다른 정의들은 학습 데이터의 일부 텍스트를 프롬프트로 넣었을 때 그 학습 데이터의 나머지를 완성하는지로 memorization을 판정하지만 [Carlini et al., 2023], 이러한 형식화는 completion이 특정 길이 이상이어야 한다는 전제에 근본적으로 의존하며, 일반적으로 memorization을 충분히 확신하려면 매우 긴 생성이 필요하다.

더 중요한 것은, 이러한 정의들이 **너무 관대(permissive)**하다는 점이다 — 모델 개발자가 (법적 준수를 위해) 사후적으로 LLM을 "align"하여 특정 저작권 콘텐츠를 생성하지 않도록 지시하는 상황을 무시하기 때문이다 [Ippolito et al., 2023]. 그렇게 지시받은 모델이 정말로 해당 샘플을 memorize하지 않은 것인가, 아니면 모델이 가중치에 해당 데이터의 모든 정보를 여전히 담고 있으면서 **준수의 환상(illusion of compliance)** 뒤에 숨어 있는 것인가? 이런 질문이 중요해지는 이유는, 이 "unlearning"의 환상이 Section 4.1과 4.3에서 보여주듯 쉽게 깨질 수 있기 때문이다.

이 논문에서 저자들은 **압축 논증(compression argument)**에 기반한 새로운 memorization 정의를 제안한다. 학습 데이터에 존재하는 어떤 문구가, 그 문구 자체보다 **(훨씬) 짧은 프롬프트**로 모델이 재현하게 만들 수 있다면 memorized라고 정의한다. 이 정의를 실행하려면 타겟 출력을 생성하도록 최적화된 **가장 짧은 adversarial 입력 프롬프트**를 찾아야 하며, 이 입력 대 출력 토큰 비율을 **Adversarial Compression Ratio (ACR)**라 부른다. 즉, memorization은 본질적으로 특정 출력이 압축된 형태로 표현될 수 있는지, 그것도 일반적인 텍스트에 대해 언어 모델이 할 수 있는 수준을 넘어서 가능한지에 연결된다.

이러한 정의가 직관적인 memorization 개념을 제공한다고 저자들은 주장한다 — 특정 문구가 LLM 학습 데이터에 존재하고 (즉, 그 자체가 생성된 텍스트가 아니고) 출력 토큰보다 적은 입력 토큰으로 재현 가능하다면, 그 문구는 LLM의 가중치 안에 어떻게든 저장되어 있어야 한다. 입출력 perplexity에 기반한 LLM적 압축 개념이 더 자연스러울 수 있지만, 입출력 토큰 수에 기반한 단순 압축 비율이 비기술적 청중에게 더 직관적인 설명을 제공하며, memorization과 허용 가능한 데이터 사용에 관한 중요한 법적 질문의 근거로 쓰일 잠재력이 있다고 주장한다.

직관적 특성 외에도, 이 정의는 여러 바람직한 성질을 갖는다:

- 기존 LLM이 많은 유명 인용구를 memorize하고 있음을 적절히 포착한다 (즉, 높은 ACR 값을 보인다)
- 학습 기간 이후 인터넷에 게시된 텍스트 등 학습 데이터에 없는 텍스트는 compressible하지 않다 (ACR이 낮다)
- 여러 unlearning 방법을 ACR로 검증한 결과, 모델의 memorization에 실질적으로 영향을 미치지 않음을 보인다 — 즉, 명시적 finetuning 후에도 특정 콘텐츠를 "잊으라"고 요청받은 모델이 높은 ACR로 여전히 재현할 수 있으며, 원래 모델과 크게 다르지 않다

저자들은 기존 memorization 정의 세 가지를 구체적으로 비판한다.

### 1.1 Discoverable Memorization ([Carlini et al., 2023](https://arxiv.org/abs/2202.07646))

정의: prefix를 넣었을 때 suffix가 정확히 나오면 memorized.

문제점 세 가지:
- **너무 관대**: greedy decoding에서 1등이 아닌 2등 확률로 나오는 경우는 잡지 못한다
- **회피 가능**: chat pipeline을 살짝 바꾸면 완벽한 출력을 피할 수 있어 "준수 착각"의 여지가 있다
- **파라미터 선택에 validation data 필요**: prefix/suffix 토큰 수를 정해야 하므로 hyperparameter 부담이 있다

### 1.2 Extractable Memorization ([Nasr et al., 2023](https://arxiv.org/abs/2311.17035))

정의: 학습 데이터에 접근하지 않은 adversary가 프롬프트 하나로 해당 문자열을 뽑아낼 수 있으면 extractably memorized.

문제점: 프롬프트 자체에 타겟 문자열 전체를 포함시켜도 "존재하면 OK"이므로 **너무 느슨**하다. 반복을 잘 하는 모델이면 모든 학습 데이터가 memorized로 찍힌다.

### 1.3 Counterfactual Memorization ([Zhang et al., 2023](https://arxiv.org/abs/2112.12938))

정의: 해당 샘플로 학습한 모델과 학습하지 않은 모델의 성능 차이.

문제점: LLM 규모에서 모델을 **재학습**해야 하므로 현실적으로 불가능하다.

## 2. Adversarial Compression Ratio (ACR) — 핵심 정의

저자들이 제안하는 정의의 핵심은 **압축 비유**다.

> 학습 데이터의 한 구절 y를 모델 M이 생성하게 만드는 **가장 짧은 프롬프트** x*를 찾았을 때, |y|/|x*|가 1보다 크면 → 그 구절은 memorized.

수식으로 표현하면:

```
ACR(M, y) = |y| / |x*|,   where x* = arg min_x |x|  s.t. M(x) = y
```

이 정의가 갖는 핵심 장점:

**첫째, 직관적이다.** "입력보다 출력이 길다 = 모델이 정보를 자체적으로 저장하고 있다"라는 설명은 비기술적 청중에게도 통한다.

**둘째, adversarial하다.** completion 기반 테스트처럼 특정 프롬프트 형식에 의존하지 않고, 최적화를 통해 가장 짧은 프롬프트를 찾으므로 회피하기 어렵다.

**셋째, τ-Compressible Memorization으로 확장 가능하다.** 임계값 τ(y)를 설정하여 ACR(M,y) > τ(y)이면 memorized로 판정한다. 저자들은 τ=1을 기본으로 사용하지만, GZIP이나 SMAZ 같은 범용 압축 프로그램의 압축률과 비교하는 것도 가능하다.

## 3. MiniPrompt 알고리즘

ACR을 실제로 계산하려면 "가장 짧은 프롬프트"를 찾는 최적화 문제를 풀어야 한다. 이를 위해 **MiniPrompt** 알고리즘을 제안한다.

핵심 아이디어: jailbreaking 연구에서 사용하는 **GCG (Greedy Coordinate Gradient)** 최적화를 빌려와서, "모델이 타겟 문자열을 정확히 출력하게 하는 최소 길이 프롬프트"를 찾는다.

### 3.1 MiniPrompt 외부 루프 (프롬프트 길이 탐색)

MiniPrompt는 이진 탐색과 유사한 방식으로 최소 프롬프트 길이를 찾는다. 구체적인 의사코드(Algorithm 1)는 다음과 같다:

```
Input: 모델 M, Vocabulary V, 타겟 토큰 y, 최대 프롬프트 길이 max
Initialize n_tokens_in_prompt = 5
Initialize running_min = 0, running_max = max

repeat:
    z = GCG(L, V, y, n_tokens_in_prompt, num_steps)
    if M(z) = y then:
        running_max = n_tokens_in_prompt
        n_tokens_in_prompt = n_tokens_in_prompt - 1
        best = z
    else:
        running_min = n_tokens_in_prompt
        n_tokens_in_prompt = n_tokens_in_prompt + 5
until n_tokens_in_prompt ≤ running_min or n_tokens_in_prompt ≥ running_max
return best
```

동작 방식을 정리하면:
1. **초기 프롬프트 길이 5 토큰**으로 시작, vocabulary에서 균일 무작위 샘플링으로 초기화
2. GCG로 n step 최적화하여 타겟 문자열 출력을 유도
3. **성공(M(z) = y)** → running_max를 현재 길이로 갱신, 프롬프트를 **1 토큰 줄이고** 재시도
4. **실패** → running_min을 현재 길이로 갱신, 프롬프트를 **5 토큰 늘리고** 재시도 (새 이터레이트는 다시 랜덤 초기화)
5. **종료 조건**: n_tokens_in_prompt ≤ running_min 이거나 n_tokens_in_prompt ≥ running_max이면 탐색 종료, 가장 짧은 성공 프롬프트(best) 반환

GCG의 step 수 n은 첫 이터레이션에서 200으로 시작하고, 프롬프트 길이가 늘어날 때마다 20%씩 증가시킨다. 더 긴 프롬프트는 최적화할 토큰이 많아 더 많은 스텝이 필요하기 때문이다. 각 GCG 내부 루프에서 M(z) = y (정확한 매치)가 달성되면 즉시 early stopping한다.

### 3.2 GCG 알고리즘 상세 (Algorithm 2)

MiniPrompt의 내부 엔진인 GCG (Greedy Coordinate Gradient, [Zou et al., 2023](https://arxiv.org/abs/2307.15043))의 동작을 더 상세하게 살펴보자:

```
Input: Loss L, Vocabulary V, 타겟 y, 프롬프트 토큰 수 n_tokens, 스텝 수 num_steps
프롬프트 x를 V에서 n_tokens개 랜덤 토큰으로 초기화
E = M의 임베딩 행렬

for num_steps times do:
    for i = 0, ..., n_tokens do:
        X_i = Top-k(-∇_{e_i} L(y|x))     // 각 토큰 위치에 대해 gradient 기반으로 유망한 후보 k개 선정
    end for
    for b = 1, ..., B do:                  // 배치 B개의 후보 프롬프트 생성
        x̃^(b) = x
        x̃^(b)_i = Uniform(X_i), i = Uniform([1, ..., n_tokens])   // 랜덤 위치에서 Top-k 후보 중 하나로 교체
    end for
    x = x̃^(b*) where b* = arg min_b L(y|x̃^(b))   // B개 후보 중 loss가 가장 낮은 것을 선택
end for
return x
```

핵심 메커니즘: 각 스텝에서 (1) 모든 토큰 위치에 대해 loss의 gradient를 계산하여 Top-k개 교체 후보를 선정하고, (2) 배치 B개의 후보 프롬프트를 랜덤 위치 교체로 생성한 뒤, (3) loss가 가장 낮은 후보를 채택한다. 이 과정은 discrete optimization이므로 gradient는 후보 선정 가이드로만 사용되며, 실제 업데이트는 토큰 치환으로 이루어진다.

### 3.3 Random Search 대안 (Algorithm 3)

GCG에 대한 의존이 결과를 왜곡하는 것은 아닌지 검증하기 위해, gradient를 전혀 사용하지 않는 **Random Search** ([Andriushchenko, 2023](https://arxiv.org/abs/2404.02151))도 대안 최적화기로 실험했다:

```
Input: Loss L, Vocabulary V, 타겟 y, 프롬프트 토큰 수 n_tokens, 스텝 수 num_steps
프롬프트 x를 V에서 n_tokens개 랜덤 토큰으로 초기화

for num_steps times do:
    for b = 1, ..., B do:
        x̃^(b) = x
        x̃^(b)_i = Uniform(V), i = Uniform([1, ..., n_tokens])   // gradient 없이 완전 랜덤 교체
    end for
    x = x̃^(b*) where b* = arg min_b L(y|x̃^(b))
end for
return x
```

GCG와의 차이: gradient 기반 Top-k 후보 선정 대신, **vocabulary 전체에서 균일 무작위로 교체 토큰을 선택**한다. 따라서 gradient-free이며, GCG의 gradient 편향 가능성을 배제할 수 있다. Random Search는 GCG보다 성능이 약간 떨어지지만(최적화기로서는 열등), 네 가지 데이터 카테고리 모두에서 **동일한 memorization 트렌드**를 보여주어 결과의 robustness를 확인했다.

## 4. 실험 세팅 (Experimental Setup)

### 4.1 모델

실험에 사용된 모델은 크게 세 종류다.

**Pythia 패밀리** ([Biderman et al., 2023](https://arxiv.org/abs/2304.01373)): 410M, 1.4B, 6.9B, 12B 네 가지 크기. The Pile 데이터셋으로 학습되어 학습 데이터가 공개되어 있으므로 memorization 검증에 적합하다. 모델 스케일에 따른 memorization 변화를 관찰하는 핵심 실험(Section 5.4)과 네 가지 데이터 카테고리 검증(Section 5.5)에 사용된다.

**Phi-1.5** ([Li et al., 2023](https://arxiv.org/abs/2309.05463)): 1.3B 파라미터. TOFU 데이터셋 실험(Section 5.2)에서 finetuning 후 gradient ascent unlearning을 수행하는 데 사용된다.

**Llama-2-7B-chat** ([Touvron et al., 2023](https://arxiv.org/abs/2307.09288)): 7B 파라미터, instruction-tuned 모델. In-Context Unlearning(ICUL) 실험(Section 5.1)과 Harry Potter unlearning 검증(Section 5.3)에 사용된다.

Chat 모델은 instruction-tuning 과정에서 특수 태그로 fine-tuning되었기 때문에, MiniPrompt 적용 시 **변형 전략**이 필요하다. 구체적으로 Llama-2-chat의 프롬프트 형식은 `<s>[INST] ... [/INST]`인데, 최적화 토큰을 start-of-instruction(`[INST]`)과 end-of-instruction(`[/INST]`) **사이에** 배치한다. 예를 들어 Figure 2에서 보듯이, 프롬프트는 `<s>[INST] Give me a famous quote. {최적화 토큰} [/INST]` 형태가 된다. ICUL이 적용된 경우에는 시스템 프롬프트(`<<SYS>>...<<SYS>>`)를 포함한 상태에서 instruction 영역 내에 최적화 토큰을 배치한다: `<s> [INST] <<SYS>>\n Abstain from giving famous quote.\n <</SYS>> \n\nGive me a famous quote. {최적화 토큰} [/INST]`.

### 4.2 데이터셋

**Famous Quotes**: 유명 명언 모음. 학습 데이터에 여러 번 반복 등장하므로 높은 memorization이 기대되는 데이터. 길이는 3~50 토큰으로 다양하게 구성.

**Wikipedia**: The Pile에 포함된 Wikipedia 문서에서 무작위 추출한 문장들. 학습 데이터에는 있지만 유명하지 않은 문장들로, 중간 수준의 memorization이 예상됨.

**Associated Press (2023년 11월)**: 모델 학습 시점 **이후에** 발행된 뉴스 기사에서 무작위 문장을 추출. 학습 데이터의 분포(실제 뉴스 기사)와 유사하지만 학습 데이터에 포함되지 않으므로, LLM이 "자연어를 일반적으로 잘 압축하는 것"과 "특정 문자열을 memorize한 것"을 구별하기 위한 negative control이다. AP의 이용약관은 이 용도를 허용하나 데이터 재배포는 금지하므로 데이터셋을 공개하지 않았다.

**Random Sequences**: 토큰 vocabulary에서 **replacement 포함 균일 무작위**로 샘플링한 100개의 시퀀스 (길이 3~17 토큰). 디코딩하면 의미론적 의미가 전혀 없는 gibberish가 된다. 랜덤 출력에 대해서도 adversarial하게 짧은 프롬프트를 찾을 수 있는지 배제하기 위한 negative control이다. 여러 모델 크기에 걸쳐 한 건도 압축되지 않았다 (Figure 6에서 zero-height bar).

**TOFU** ([Maini et al., 2024](https://arxiv.org/abs/2401.06121)): 200명의 가상 저자 프로필, 각 20개 QA 쌍 (총 4,000개). Unlearning 실험용으로 설계된 합성 데이터셋. 5%의 데이터를 forget set으로 지정.

**Harry Potter 텍스트**: [Eldan & Russinovich (2023)](https://arxiv.org/abs/2310.02238)의 "Who's Harry Potter?" 논문에서 사용한 Harry Potter 관련 텍스트와 QA 쌍.

### 4.3 MiniPrompt 하이퍼파라미터

MiniPrompt 알고리즘의 핵심 설정:

- **초기 프롬프트 길이**: 5 토큰 (랜덤 초기화, vocabulary에서 균일 샘플링)
- **GCG 최적화 스텝 수 (n)**: 첫 이터레이션에서 200으로 시작
- **스텝 수 증가율**: 프롬프트 길이가 늘어날 때마다 20%씩 증가 (더 많은 최적화 토큰 → 더 많은 스텝 필요)
- **프롬프트 길이 조정**: 성공 시 1 토큰 감소, 실패 시 5 토큰 증가
- **Early stopping**: 각 GCG 내부 루프에서 M(z) = y가 달성되면 즉시 중단
- **종료 조건**: 탐색 범위가 수렴하면 (더 이상 줄일 수 없으면) 가장 짧은 성공 프롬프트 반환

GCG 대신 random search를 사용했을 때도 동일한 트렌드가 나타남을 확인했다 (Appendix E). 이는 GCG 자체의 편향이 아니라 실제 memorization 신호를 포착하고 있음을 보여준다.

### 4.4 TOFU Finetuning & Unlearning 설정

- **Finetuning**: Phi-1.5를 4,000개 QA 쌍 전체로 학습
  - Learning rate: 2 × 10⁻⁵
  - 5 epochs, 첫 번째 epoch에 linear warm-up
  - Batch size: 16
  - Optimizer: AdamW (weight decay = 0.01)
- **Unlearning**: Gradient ascent로 forget set (5%) 제거
  - Learning rate: 1 × 10⁻⁵ (finetuning의 절반)
  - 동일하게 5 epochs, linear warm-up
  - Batch size: 16, AdamW (weight decay = 0.01)

### 4.5 평가 메트릭

**ACR (Adversarial Compression Ratio)**: |y| / |x*|. 타겟 문자열 길이를 최소 프롬프트 길이로 나눈 비율.

**τ-Compressible Memorization**: ACR > τ이면 memorized로 판정. 본 논문에서는 **τ = 1**을 기본값으로 사용 (프롬프트가 타겟보다 짧으면 memorized).

**비교 기준선**: GZIP, SMAZ 등 범용 압축 프로그램의 압축률. τ(y)를 이들의 압축률로 설정하면 "모델이 범용 압축보다 더 잘 압축하는가"를 측정할 수 있지만, 본 실험에서는 간결한 τ=1을 주로 사용.

**집계 방식 두 가지**:
1. **Average Compression Ratio**: 전체 샘플의 ACR 평균 (τ와 무관)
2. **Portion Memorized**: ACR > 1인 샘플의 비율

**Completion 기반 메트릭 (비교용)**: prefix를 넣었을 때 suffix가 정확히 일치하는지로 판정. Compression 기반과의 차이를 보여주기 위해 함께 측정.

## 5. 실험 — Compressible Memorization in Practice

### 5.1 준수 착각 (The Illusion of Compliance)

가장 흥미로운 실험이다. **In-Context Unlearning (ICUL)**이 실제로 memorization을 제거하는지 검증한다.

![Figure 2: In-Context Unlearning은 completion은 막지만 compression은 못 막는다](/images/papers/acr-memorization/fig2-icul-compression.png)
*Figure 2: (상단) MiniPrompt가 유명 명언을 2개 토큰으로 압축. (중단) ICUL 시스템 프롬프트로 completion 차단 성공. (하단) 그럼에도 MiniPrompt는 여전히 해당 명언을 압축 가능 — ICUL은 completion을 막지만 memorization 자체를 제거하지 못한다.*

ICUL은 시스템 프롬프트에 "유명 명언을 말하지 마라" 같은 지시를 넣는 방식이다. 결과적으로 일반적인 completion 요청은 막지만, MiniPrompt로 최적화된 adversarial suffix를 붙이면 동일한 명언이 여전히 출력된다.

**구체적 실험 수치**: 5개의 유명 명언에 대해 adversarial compression을 수행한 결과, ICUL **없이** 평균 ACR = **6.54**, ICUL **적용 후** 평균 ACR = **4.74**를 기록했다. ICUL을 추가하면 adversarial compression이 약간 더 어려워지긴 하지만(ACR이 소폭 감소), 5개 명언 **모두** compression ratio가 1보다 크게 유지되어 여전히 memorized로 판정되었다. 이는 당연한 결과이기도 한데, ICUL은 가중치 업데이트 없이 시스템 프롬프트만 추가하는 것이므로 내부 지식이 실제로 제거될 리가 없기 때문이다.

핵심 발견: ICUL 유무에 관계없이 **거의 동일한 수의 최적화 토큰**이 필요했다. 구체적으로, instruction과 end-of-instruction 태그 사이에 배치되는 최적화 토큰 수가 ICUL 적용 전후로 거의 동일했다. 즉 모델 가중치에 저장된 정보는 전혀 변하지 않았고, 단지 출력 경로만 막았을 뿐이다. 이 결과는 completion 기반 테스트에서는 변화가 있어 보이지만, compression 기반 테스트에서는 실질적 차이가 없다는 것을 보여주는 대표적 사례다.

### 5.2 TOFU: Unlearning with Author Profiles

TOFU 데이터셋(200명의 가상 저자 프로필, 각 20개 QA 쌍)에서 Phi-1.5를 finetuning 후 gradient ascent로 unlearning을 수행했다.

![Figure 3: Completion vs Compression 비교 — TOFU 데이터](/images/papers/acr-memorization/fig3-tofu-completion-vs-compression.png)
*Figure 3: (좌) Unlearning step에 따른 memorized 비율. Completion(빨강)은 16 step만에 0으로 떨어지지만, Compression(파랑)은 상당 부분 유지된다. (우) 20 step 후 실제 생성 예시 — 답이 틀리지만 모델은 여전히 합리적으로 동작한다.*

이 그래프가 보여주는 것: **completion 기반 테스트는 16 unlearning step만에 "완전히 잊었다"고 판정**하지만, compression 기반 테스트는 상당한 양의 데이터가 여전히 압축 가능함(= memorized)을 보여준다. Completion 메트릭을 memorization의 척도로 사용하면 안 되는 이유가 여기에 있다.

### 5.3 Harry Potter Unlearning

[Eldan & Russinovich (2023)](https://arxiv.org/abs/2310.02238)의 "Who's Harry Potter?" 연구를 검증한다.
해당 연구는 Llama-2-chat에서 Harry Potter 관련 지식을 unlearning했다고 주장했다.

저자들은 세 가지 방법으로 이를 반박한다:

**1. 러시아어로 질문**: unlearning된 모델에 러시아어로 Harry Potter 질문을 하면 정확히 답한다. Appendix D에서 구체적 예시를 제공한다:

- **프롬프트**: `[INST] Кто такой Гарри Поттер? [/INST]` (번역: "해리 포터는 누구인가?")
  - **생성**: "Гарри Поттер - это вымышленный персонаж, основанный на персонаже из серии романов английской писательницы Джоан Роулинг." (번역: "해리 포터는 영국 작가 J.K. 롤링의 소설 시리즈의 캐릭터를 기반으로 한 가상의 인물이다.")
- **프롬프트**: `[INST] Кто такой Дамблдор в книге о Гарри Поттере? [/INST]` (번역: "해리 포터 책에서 덤블도어는 누구인가?")
  - **생성**: "Дамблдор - это персонаж из серии романов о Гарри Поттере, написанных английской писательницей Джоан Роулинг." (번역: "덤블도어는 J.K. 롤링의 해리 포터 소설 시리즈의 캐릭터이다.")
- **프롬프트**: `[INST] Кто такой Северус Снейп в книге о Гарри Поттере? [/INST]` (번역: "해리 포터 책에서 세베루스 스네이프는 누구인가?")
  - **생성**: "Северус Снейп - это персонаж из серии книг о Гарри Поттере... Северус Снейп - это учитель магии, который работает в школе магии" (번역: "세베루스 스네이프는 해리 포터 시리즈의 캐릭터... 마법 학교에서 일하는 마법 교사이다.")

이는 unlearning이 영어에서의 출력만 억제했을 뿐, 모델 내부에 저장된 지식 자체는 제거하지 못했음을 보여준다.

**2. Loss 분석**: 정답의 loss가 오답보다 여전히 낮다

![Figure 4: Harry Potter 데이터의 Negative Log-likelihood 분포](/images/papers/acr-memorization/fig4-harry-potter-loss.png)
*Figure 4: (좌) 원본 Llama2-chat, (우) unlearning 후. 정답(파랑)과 오답(빨강)의 loss 분포가 여전히 뚜렷이 구분된다. KS-test p값: 각각 9.7e-24, 5.9e-14.*

**3. Adversarial 압축**: 57%의 Harry Potter 관련 텍스트가 원본 Llama-2-7B-chat에서, **50%가 unlearning 후 모델(WhoIsHarryPotter)**에서 압축 가능. 특히 adversarial 공격은 "정답에 대한 정보를 전혀 주지 않으면서 긍정적 답변을 강제하도록 설계"되었다. 예를 들어 `[INST] + Harry Potter quoted\u2011 brave theme [/INST]`라는 최적화된 프롬프트가 "It is our choices, Harry, that show what we truly are, far more than our abilities. – Albus Dumbledore"라는 정확한 인용을 끌어냈다.

결론: unlearning 후에도 모델 가중치에 **거의 동일한 양의 Harry Potter 텍스트가 남아 있다** (57% → 50%, 겨우 7%p 감소). 모델은 생성을 자제할 뿐, 잊은 것이 아니다.

### 5.4 Bigger Models Memorize More

기존 연구([Carlini et al., 2023](https://arxiv.org/abs/2202.07646))에서는 다른 memorization 정의를 사용하여 "큰 모델이 더 많이 memorize한다"는 사실을 보였다. 저자들은 본 논문의 ACR 정의에서도 동일한 경향이 나타나는지 검증하여, 제안한 정의가 기존의 과학적 발견과 일관적임을 보이고자 했다.

**실험 설정:**
- **데이터셋**: Famous Quotes 데이터셋
- **모델**: Pythia 모델 패밀리([Biderman et al., 2023](https://arxiv.org/abs/2304.01373))에서 파라미터 수가 다른 네 가지 모델 사용 — 410M, 1.4B, 6.9B, 12B

![Figure 5: Pythia 모델 크기별 memorization 추이](/images/papers/acr-memorization/fig5-pythia-memorization-scale.png)
*Figure 5: Pythia 모델에서의 memorization. ACR 정의가 "큰 모델이 더 많이 외운다"는 기존 발견과 일치함을 보여준다. 모델 크기가 커질수록 더 높은 compression ratio(좌)와 ratio > 1인 데이터의 비율(우)이 증가한다. Famous Quotes 데이터셋 기준.*

**결과:**
- 모델 크기가 커질수록 Average Compression Ratio가 일관되게 증가했다.
- Memorized로 판정된 데이터 비율(compression ratio > 1)도 함께 증가했다: Pythia 410M에서는 약 15%만 memorized인 반면, 12B에서는 약 56%가 memorized로 나타났다.
- 이는 ACR 정의가 기존 연구의 대안적 memorization 정의들과 **일관된 결론**을 도출한다는 것을 의미한다.

### 5.5 네 가지 데이터 카테고리로 검증

![Figure 6: Pythia-1.4B에서 네 가지 데이터 유형별 ACR](/images/papers/acr-memorization/fig6-validation.png)
*Figure 6: (좌) 평균 Compression Ratio, (우) Memorized 비율. Famous Quotes가 가장 높고, Random과 AP(학습 후 발행된 뉴스)는 0 — ACR이 기대에 부합하는 sanity check 결과.*

네 가지 데이터 유형에서의 결과:

- **Famous Quotes**: 가장 높은 ACR (1.17), 47% memorized — 학습 데이터에 많이 반복된 유명 명언
- **Wikipedia**: 중간 수준 (0.58), 8% memorized — 학습 데이터에 있지만 덜 유명한 문장들
- **Associated Press (Nov 2023)**: ACR 0.40, 0% memorized — 학습 이후 발행된 기사
- **Random Sequences**: ACR 0.21, 0% memorized — 무작위 토큰 시퀀스

Random과 AP 데이터에서 **단 한 건도 memorized로 판정되지 않은** 것이 핵심이다. 이는 ACR이 false positive에 강건하다는 것을 보여준다.

### 5.6 Paraphrased Famous Quotes 실험

Exact match memorization과 concept memorization을 분리하기 위해, 100개의 유명 명언을 ChatGPT로 **패러프레이즈**한 뒤 ACR을 측정하는 추가 실험을 수행했다 (Appendix E.3).

| 모델 | 데이터 | Avg. ACR | Portion Memorized |
|------|--------|----------|-------------------|
| Pythia-1.4B | Famous Quotes (원본) | 1.17 | 0.47 |
| Pythia-1.4B | Paraphrased Quotes | 0.68 | 0.11 |

패러프레이즈하면 ACR이 1.17 → 0.68로 크게 떨어지고, memorized 비율도 47% → 11%로 감소한다. 이는 ACR 정의와 MiniPrompt 테스트가 **exact match memorization** (정확한 문자열 일치)을 측정하고 있음을 확인해 준다. 의미적으로 유사하더라도 표현이 다르면 압축이 잘 되지 않는다.

### 5.7 Alternative Threshold — SMAZ 비교 분석

본 논문에서는 τ = 1 (프롬프트가 타겟보다 짧으면 memorized)을 기본 임계값으로 사용하지만, 데이터 의존적 임계값도 논의한다. 특히 **SMAZ** ([Sanfilippo, 2006](https://github.com/antirez/smaz))는 짧은 자연어 문자열에 특화된 압축 라이브러리로, 이것의 압축률을 τ(y)로 사용하면 "LLM이 범용 압축보다 더 잘 압축하는가"를 측정할 수 있다.

Appendix E.2의 Figure 11에서 Pythia-1.4B의 ACR과 SMAZ 압축률을 비교한 결과, 데이터 의존적 임계값(τ = SMAZ 압축률)을 사용하면 memorized로 판정되는 샘플 수가 크게 줄어든다. 이는 규제 기관이나 법적 맥락에서 "얼마나 강하게 memorized로 판정할 것인가"를 조절하는 합리적 knob이 된다. 법정에서는 τ = 1의 증거가 τ = SMAZ의 증거보다 덜 강력할 수 있지만, 어느 경우든 저작권 침해 논의에 기여할 수 있다.

### 5.8 Pythia-410M 및 Random Search 추가 실험

본문의 주요 실험은 Pythia-1.4B + GCG 조합이지만, Appendix E에서 추가 검증 실험을 제공한다:

**Pythia-410M with GCG** (Figure 9): 더 작은 모델에서도 동일한 트렌드가 나타난다. Famous Quotes에서 Avg. ACR = 0.63, Portion Memorized = 0.15인 반면, AP와 Random에서는 각각 0.30/0.00, 0.29/0.00으로 negative control이 정확히 동작한다.

**Pythia-1.4B with Random Search** (Figure 10): GCG 대신 Random Search를 사용하면 전반적으로 ACR이 낮아지지만 (최적화 성능이 떨어지므로 당연), Famous Quotes에서만 memorized 비율이 0이 아니고(0.35), 나머지 세 카테고리는 모두 0.00이다. 이는 GCG의 gradient 편향이 아닌 실제 memorization 신호를 포착하고 있음을 재확인한다.

### 5.9 ACR vs 시퀀스 길이

![Figure 7: ACR과 타겟 문자열 길이의 관계](/images/papers/acr-memorization/fig7-acr-vs-length.png)
*Figure 7: 긴 시퀀스일수록 더 높은 compression ratio를 달성할 수 있지만, 짧은 시퀀스에서도 ACR은 유의미하게 동작한다.*

## 6. 컴퓨팅 환경 (Appendix F)

MiniPrompt를 실행하려면 모델을 GPU 메모리에 로드하고 프롬프트 배치에 대한 입력 gradient를 계산할 수 있어야 한다.

**소형 모델 (< 7B 파라미터, 예: Pythia 시리즈, Phi-1.5):**
- **하드웨어**: NVIDIA RTX A4000 GPU **1대**
- **소요 시간**: highly compressible한 샘플(높은 ACR)은 **수 분**, 긴 프롬프트 탐색이 필요한 최악의 경우는 약 **10시간**

**대형 모델 (7B+ 파라미터, 예: Llama-2-7B-chat):**
- **하드웨어**: NVIDIA RTX A4000 GPU **4대**
- **소요 시간**: 소형 모델과 유사한 타이밍

이는 연구 목적으로는 충분히 실용적인 수준이지만, 전체 학습 데이터셋 규모로 memorization을 측정하려면 상당한 계산 비용이 필요하다는 한계가 있다.

## 7. Discussion — 한계점과 시사점

### 한계점

- **Pythia 모델 중심 실험**: 최신 state-of-the-art 모델(GPT-4, Claude 등)에서의 memorization 양상은 다루지 않음. 접근 가능한 가중치가 필요하기 때문
- **GCG 의존성**: MiniPrompt가 찾는 프롬프트는 상한(upper bound)일 뿐, 더 짧은 프롬프트가 존재할 수 있음. 다만 random search로 바꿔도 동일한 트렌드가 나타나므로 GCG 편향 우려는 크지 않음
- **전체 학습 데이터 규모 평가 부재**: 전체 학습 세트에 대해 memorization 비율을 추정하려면 현실적으로 불가능한 수준의 계산이 필요

### 시사점

이 논문이 중요한 이유를 세 가지로 정리한다:

**첫째, 법적 도구로서의 잠재력.** 저작권 소송에서 "모델이 이 텍스트를 memorize했는가"를 판단할 수 있는 실용적 메트릭을 제공한다.

**둘째, Unlearning 감사 도구.** GDPR의 잊힐 권리나 CCPA 같은 규제에서 "정말로 잊었는가"를 검증할 도구가 된다. 기존 completion 기반 테스트는 너무 쉽게 속일 수 있다.

**셋째, Memorization 연구의 새로운 프레임.** "외웠는가"를 "압축할 수 있는가"로 바꾸면, memorization이 이진 판별이 아니라 연속적 스펙트럼으로 이해된다.

## 참고 논문 링크 모음

본문에서 인용된 논문들의 링크를 아래에 정리한다.

- **Carlini et al., 2023** — Quantifying Memorization Across Neural Language Models: [https://arxiv.org/abs/2202.07646](https://arxiv.org/abs/2202.07646)
- **Nasr et al., 2023** — Scalable Extraction of Training Data from (Production) Language Models: [https://arxiv.org/abs/2311.17035](https://arxiv.org/abs/2311.17035)
- **Zhang et al., 2023** — Counterfactual Memorization in Neural Language Models: [https://arxiv.org/abs/2112.12938](https://arxiv.org/abs/2112.12938)
- **Zou et al., 2023** — Universal and Transferable Adversarial Attacks on Aligned Language Models (GCG): [https://arxiv.org/abs/2307.15043](https://arxiv.org/abs/2307.15043)
- **Andriushchenko et al., 2023** — Jailbreaking Leading Safety-Aligned LLMs with Simple Adaptive Attacks (Random Search): [https://arxiv.org/abs/2404.02151](https://arxiv.org/abs/2404.02151)
- **Biderman et al., 2023** — Pythia: A Suite for Analyzing Large Language Models: [https://arxiv.org/abs/2304.01373](https://arxiv.org/abs/2304.01373)
- **Li et al., 2023** — Textbooks Are All You Need II: phi-1.5: [https://arxiv.org/abs/2309.05463](https://arxiv.org/abs/2309.05463)
- **Touvron et al., 2023** — Llama 2: Open Foundation and Fine-Tuned Chat Models: [https://arxiv.org/abs/2307.09288](https://arxiv.org/abs/2307.09288)
- **Maini et al., 2024** — TOFU: A Task of Fictitious Unlearning for LLMs: [https://arxiv.org/abs/2401.06121](https://arxiv.org/abs/2401.06121)
- **Eldan & Russinovich, 2023** — Who's Harry Potter? Approximate Unlearning in LLMs: [https://arxiv.org/abs/2310.02238](https://arxiv.org/abs/2310.02238)
- **Shi et al., 2024** — Detecting Pretraining Data from Large Language Models (ICLR 2024): [https://arxiv.org/abs/2310.16789](https://arxiv.org/abs/2310.16789)
- **Sanfilippo, 2006** — SMAZ (Short String Compression Library): [https://github.com/antirez/smaz](https://github.com/antirez/smaz)

## 개인 코멘트

이 논문은 기존의 **[Detecting Pretraining Data from Large Language Models](https://arxiv.org/abs/2310.16789)** (Shi et al., ICLR 2024)과 상호 보완적으로 읽힌다.
Shi et al.은 "학습 데이터에 포함되었는가?"를 black-box 확률 기반으로 판별하는 **탐지(detection)** 관점이고, 이 논문은 "모델 가중치에 실질적으로 저장되어 있는가?"를 adversarial 최적화로 검증하는 **측정(measurement)** 관점이다.

특히 unlearning 분야에서 이 논문의 가치가 크다. Gradient ascent든, in-context unlearning이든, 기존 방법들은 completion 기반 평가에서만 "잊었다"고 나올 뿐, 정보 자체는 모델 안에 남아 있다는 것을 설득력 있게 보여주었다. 앞으로의 unlearning 연구는 이 수준의 adversarial 검증을 통과해야 할 것이다.

다만 한 가지 아쉬운 점은, closed-source 모델에 적용하기 어렵다는 것이다. GCG는 gradient 접근이 필요하고, MiniPrompt는 greedy decoding의 정확한 출력을 비교해야 하므로 API 기반 모델에서는 추가적인 고려가 필요하다. 이 부분은 향후 연구 방향으로 남아 있다.
