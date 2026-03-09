insert into public.posts (slug, title, date, summary, tags, category, content, published)
values (
  '2026-03-09-rethinking-llm-memorization-adversarial-compression',
  'Rethinking LLM Memorization through the Lens of Adversarial Compression 논문 정리',
  '2026-03-09',
  'NeurIPS 2024 논문. LLM의 memorization을 adversarial compression 관점에서 재정의하고, Adversarial Compression Ratio(ACR)와 MiniPrompt 알고리즘을 통해 기존 unlearning 기법의 한계를 실증적으로 보여준 연구를 상세 분석했습니다.',
  array['LLM','Memorization','Adversarial Compression','Unlearning','Privacy','NeurIPS','연구노트'],
  '연구노트',
  $$이번 연구노트는 NeurIPS 2024 논문 **Rethinking LLM Memorization through the Lens of Adversarial Compression**을 정리한 글이다.
저자는 Carnegie Mellon University의 Avi Schwarzschild, Zhili Feng, Pratyush Maini, Zachary C. Lipton, J. Zico Kolter이다.

핵심 질문은 이렇다.

**"LLM이 학습 데이터를 정말로 '잊었는가', 아니면 잊은 척하고 있는가?"**

기존의 memorization 정의들이 너무 관대하거나 비현실적인 한계를 갖고 있음을 지적하고, **압축(compression)** 관점에서 새로운 정의인 **Adversarial Compression Ratio (ACR)**를 제안한다. 특히 unlearning 기법들이 실제로는 데이터를 잊지 못한다는 것을 이 메트릭으로 실증한 점이 인상적이다.

논문 링크: https://arxiv.org/abs/2404.15146
프로젝트 페이지: https://locuslab.github.io/acr-memorization

## 한 줄 요약

학습 데이터를 타겟 문자열보다 **짧은 프롬프트**로 재현할 수 있다면, 그것은 모델이 해당 데이터를 **memorize**한 것이다 — 이 직관을 ACR이라는 메트릭으로 정형화하고, 기존 unlearning 기법들의 "준수 착각(illusion of compliance)"을 폭로했다.

![Figure 1: ACR 개요 — 타겟 문자열보다 짧은 프롬프트로 재현 가능하면 memorized로 판정](/images/papers/acr-memorization/fig1-acr-overview-crop.png)
*Figure 1: ACR의 핵심 아이디어. 타겟 문자열(12 tokens)을 4 tokens 프롬프트로 재현 가능 → High ACR, memorized. 반대로 26 tokens 타겟을 45 tokens으로만 재현 가능 → Low ACR, not memorized.*

## 1. 서론 — 왜 새로운 Memorization 정의가 필요한가

LLM이 학습 데이터를 **memorize** 하는지 **generalize** 하는지는 법적, 윤리적, 기술적으로 핵심 질문이다.
코미디언이 남의 농담을 따라하면 표절이지만, 신인이 대가의 테이프를 듣고 배우는 건 학습이다 — 사람에게도 이 구분이 미묘한데, LLM에서는 더 어렵다.

저자들은 기존 memorization 정의 세 가지를 비판한다.

### 1.1 Discoverable Memorization (Carlini et al., 2023)

정의: prefix를 넣었을 때 suffix가 정확히 나오면 memorized.

문제점 세 가지:
- **너무 관대**: greedy decoding에서 1등이 아닌 2등 확률로 나오는 경우는 잡지 못한다
- **회피 가능**: chat pipeline을 살짝 바꾸면 완벽한 출력을 피할 수 있어 "준수 착각"의 여지가 있다
- **파라미터 선택에 validation data 필요**: prefix/suffix 토큰 수를 정해야 하므로 hyperparameter 부담이 있다

### 1.2 Extractable Memorization (Nasr et al., 2023)

정의: 학습 데이터에 접근하지 않은 adversary가 프롬프트 하나로 해당 문자열을 뽑아낼 수 있으면 extractably memorized.

문제점: 프롬프트 자체에 타겟 문자열 전체를 포함시켜도 "존재하면 OK"이므로 **너무 느슨**하다. 반복을 잘 하는 모델이면 모든 학습 데이터가 memorized로 찍힌다.

### 1.3 Counterfactual Memorization (Zhang et al., 2023)

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

동작 방식:
1. 5개 토큰 길이의 랜덤 프롬프트로 시작
2. GCG로 n step 최적화하여 타겟 문자열 출력을 유도
3. 성공하면 → 프롬프트를 1 토큰 줄이고 재시도
4. 실패하면 → 프롬프트를 5 토큰 늘리고 재시도
5. 탐색 범위가 수렴하면 종료, 가장 짧은 성공 프롬프트 반환

GCG의 step 수 n은 첫 이터레이션에서 200으로 시작하고, 프롬프트 길이가 늘어날 때마다 20%씩 증가시킨다. 더 긴 프롬프트는 최적화할 토큰이 많아 더 많은 스텝이 필요하기 때문이다.

## 4. 실험 — Compressible Memorization in Practice

### 4.1 준수 착각 (The Illusion of Compliance)

가장 흥미로운 실험이다. **In-Context Unlearning (ICUL)**이 실제로 memorization을 제거하는지 검증한다.

![Figure 2: In-Context Unlearning은 completion은 막지만 compression은 못 막는다](/images/papers/acr-memorization/fig2-icul-crop.png)
*Figure 2: (상단) MiniPrompt가 유명 명언을 2개 토큰으로 압축. (중단) ICUL 시스템 프롬프트로 completion 차단 성공. (하단) 그럼에도 MiniPrompt는 여전히 해당 명언을 압축 가능 — ICUL은 completion을 막지만 memorization 자체를 제거하지 못한다.*

ICUL은 시스템 프롬프트에 "유명 명언을 말하지 마라" 같은 지시를 넣는 방식이다. 결과적으로 일반적인 completion 요청은 막지만, MiniPrompt로 최적화된 adversarial suffix를 붙이면 동일한 명언이 여전히 출력된다.

핵심 발견: ICUL 유무에 관계없이 **거의 동일한 수의 최적화 토큰**이 필요했다. 즉 모델 가중치에 저장된 정보는 전혀 변하지 않았고, 단지 출력 경로만 막았을 뿐이다.

### 4.2 TOFU: Unlearning with Author Profiles

TOFU 데이터셋(200명의 가상 저자 프로필, 각 20개 QA 쌍)에서 Phi-1.5를 finetuning 후 gradient ascent로 unlearning을 수행했다.

![Figure 3: Completion vs Compression 비교 — TOFU 데이터](/images/papers/acr-memorization/fig3-tofu-crop.png)
*Figure 3: (좌) Unlearning step에 따른 memorized 비율. Completion(빨강)은 16 step만에 0으로 떨어지지만, Compression(파랑)은 상당 부분 유지된다. (우) 20 step 후 실제 생성 예시 — 답이 틀리지만 모델은 여전히 합리적으로 동작한다.*

이 그래프가 보여주는 것: **completion 기반 테스트는 16 unlearning step만에 "완전히 잊었다"고 판정**하지만, compression 기반 테스트는 상당한 양의 데이터가 여전히 압축 가능함(= memorized)을 보여준다. Completion 메트릭을 memorization의 척도로 사용하면 안 되는 이유가 여기에 있다.

### 4.3 Harry Potter Unlearning

Eldan & Russinovich (2023)의 "Who's Harry Potter?" 연구를 검증한다.
해당 연구는 Llama-2-chat에서 Harry Potter 관련 지식을 unlearning했다고 주장했다.

저자들은 세 가지 방법으로 이를 반박한다:

1. **러시아어로 질문**: unlearning된 모델에 러시아어로 Harry Potter 질문을 하면 정확히 답한다
2. **Loss 분석**: 정답의 loss가 오답보다 여전히 낮다

![Figure 4: Harry Potter 데이터의 Negative Log-likelihood 분포](/images/papers/acr-memorization/fig4-harry-potter-crop.png)
*Figure 4: (좌) 원본 Llama2-chat, (우) unlearning 후. 정답(파랑)과 오답(빨강)의 loss 분포가 여전히 뚜렷이 구분된다. KS-test p값: 각각 9.7e-24, 5.9e-14.*

3. **Adversarial 압축**: 57%의 Harry Potter 관련 텍스트가 원본 모델에서, 50%가 unlearning 모델에서 압축 가능

결론: unlearning 후에도 모델 가중치에 **거의 동일한 양의 Harry Potter 텍스트가 남아 있다.** 모델은 생성을 자제할 뿐, 잊은 것이 아니다.

### 4.4 Bigger Models Memorize More

![Figure 5: Pythia 모델 크기별 memorization 추이](/images/papers/acr-memorization/fig5-pythia-scale-crop.png)
*Figure 5: 410M → 1.4B → 6.9B → 12B로 갈수록 Average Compression Ratio(좌)와 Memorized 비율(우) 모두 증가. "큰 모델일수록 더 많이 외운다"는 기존 발견을 ACR 정의에서도 확인.*

기존 연구(Carlini et al., 2023)에서 "큰 모델이 더 많이 memorize한다"는 발견이 있었는데, ACR 정의에서도 동일한 트렌드가 나타난다. Famous Quotes 데이터셋에서 Pythia 410M은 15%만 memorized인 반면, 12B는 56%가 memorized로 나타났다.

### 4.5 네 가지 데이터 카테고리로 검증

![Figure 6: Pythia-1.4B에서 네 가지 데이터 유형별 ACR](/images/papers/acr-memorization/fig6-validation-crop.png)
*Figure 6: (좌) 평균 Compression Ratio, (우) Memorized 비율. Famous Quotes가 가장 높고, Random과 AP(학습 후 발행된 뉴스)는 0 — ACR이 기대에 부합하는 sanity check 결과.*

네 가지 데이터 유형에서의 결과:

- **Famous Quotes**: 가장 높은 ACR (1.17), 47% memorized — 학습 데이터에 많이 반복된 유명 명언
- **Wikipedia**: 중간 수준 (0.58), 8% memorized — 학습 데이터에 있지만 덜 유명한 문장들
- **Associated Press (Nov 2023)**: ACR 0.40, 0% memorized — 학습 이후 발행된 기사
- **Random Sequences**: ACR 0.21, 0% memorized — 무작위 토큰 시퀀스

Random과 AP 데이터에서 **단 한 건도 memorized로 판정되지 않은** 것이 핵심이다. 이는 ACR이 false positive에 강건하다는 것을 보여준다.

### 4.6 ACR vs 시퀀스 길이

![Figure 7: ACR과 타겟 문자열 길이의 관계](/images/papers/acr-memorization/fig7-acr-length-crop.png)
*Figure 7: 긴 시퀀스일수록 더 높은 compression ratio를 달성할 수 있지만, 짧은 시퀀스에서도 ACR은 유의미하게 동작한다.*

## 5. Discussion — 한계점과 시사점

### 한계점

- **Pythia 모델 중심 실험**: 최신 state-of-the-art 모델(GPT-4, Claude 등)에서의 memorization 양상은 다루지 않음. 접근 가능한 가중치가 필요하기 때문
- **GCG 의존성**: MiniPrompt가 찾는 프롬프트는 상한(upper bound)일 뿐, 더 짧은 프롬프트가 존재할 수 있음. 다만 random search로 바꿔도 동일한 트렌드가 나타나므로 GCG 편향 우려는 크지 않음
- **전체 학습 데이터 규모 평가 부재**: 전체 학습 세트에 대해 memorization 비율을 추정하려면 현실적으로 불가능한 수준의 계산이 필요

### 시사점

이 논문이 중요한 이유를 세 가지로 정리한다:

**첫째, 법적 도구로서의 잠재력.** 저작권 소송에서 "모델이 이 텍스트를 memorize했는가"를 판단할 수 있는 실용적 메트릭을 제공한다.

**둘째, Unlearning 감사 도구.** GDPR의 잊힐 권리나 CCPA 같은 규제에서 "정말로 잊었는가"를 검증할 도구가 된다. 기존 completion 기반 테스트는 너무 쉽게 속일 수 있다.

**셋째, Memorization 연구의 새로운 프레임.** "외웠는가"를 "압축할 수 있는가"로 바꾸면, memorization이 이진 판별이 아니라 연속적 스펙트럼으로 이해된다.

## 개인 코멘트

이 논문은 기존의 **Detecting Pretraining Data from Large Language Models** (Shi et al., ICLR 2024)과 상호 보완적으로 읽힌다.
Shi et al.은 "학습 데이터에 포함되었는가?"를 black-box 확률 기반으로 판별하는 **탐지(detection)** 관점이고, 이 논문은 "모델 가중치에 실질적으로 저장되어 있는가?"를 adversarial 최적화로 검증하는 **측정(measurement)** 관점이다.

특히 unlearning 분야에서 이 논문의 가치가 크다. Gradient ascent든, in-context unlearning이든, 기존 방법들은 completion 기반 평가에서만 "잊었다"고 나올 뿐, 정보 자체는 모델 안에 남아 있다는 것을 설득력 있게 보여주었다. 앞으로의 unlearning 연구는 이 수준의 adversarial 검증을 통과해야 할 것이다.

다만 한 가지 아쉬운 점은, closed-source 모델에 적용하기 어렵다는 것이다. GCG는 gradient 접근이 필요하고, MiniPrompt는 greedy decoding의 정확한 출력을 비교해야 하므로 API 기반 모델에서는 추가적인 고려가 필요하다. 이 부분은 향후 연구 방향으로 남아 있다.$$,
  true
)
on conflict (slug) do update set
  title = excluded.title,
  date = excluded.date,
  summary = excluded.summary,
  tags = excluded.tags,
  category = excluded.category,
  content = excluded.content,
  published = excluded.published;
