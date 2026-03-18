---
title: "Language Models May Verbatim Complete Text They Were Not Explicitly Trained On 논문 정리"
date: 2026-03-18
summary: "Google, Stanford University의 Ken Ziyu Liu et al.이 ICML 2025에 발표한 논문. LLM이 n-gram 기반 멤버십 정의에 따른 '비멤버(non-member)' 텍스트도 verbatim으로 완성할 수 있음을 보인다. 사전학습 데이터에서 추출된 시퀀스를 제거하고 처음부터 재학습해도 약 40%가 여전히 완성되며(lingering sequences), 적대적으로 구성한 파인튜닝 데이터(casing flip, token dropout, chunking)로 n-gram 중복 없이도 원본 텍스트를 verbatim 완성시킬 수 있다. 이는 n-gram 기반 멤버십 정의의 근본적 한계를 드러내며, 프라이버시·저작권·AI 안전성에 중요한 함의를 가진다."
tags: [LLM, Memorization, Data Membership, n-gram, Verbatim Completion, Privacy, Copyright, ICML 2025, 연구노트]
category: 연구노트
language: ko
---

# Language Models May Verbatim Complete Text They Were Not Explicitly Trained On

**논문:** Ken Ziyu Liu, Christopher A. Choquette-Choo, Matthew Jagielski, Peter Kairouz, Sanmi Koyejo, Percy Liang, Nicolas Papernot
**소속:** Google, Stanford University
**학회:** ICML 2025
**키워드:** Data Membership, n-gram, Verbatim Completion, Lingering Sequences, Adversarial Fine-tuning

## 한 줄 요약

LLM이 n-gram 기반 멤버십 정의상 학습 데이터의 '멤버'가 아닌 텍스트도 verbatim으로 완성할 수 있음을 보이며, n-gram 멤버십 정의의 근본적 한계를 실증적으로 드러내는 연구이다. 사전학습에서의 자연적 발생(lingering sequences)과 적대적 파인튜닝(adversarial construction) 두 가지 시나리오를 모두 실험한다.

---

## 1. 서론 (Introduction)

**학습 데이터 멤버십(training data membership)**은 특정 데이터 포인트가 모델 학습에 사용되었는지를 묻는 문제로, 프라이버시(LLM이 학습 데이터에 포함된 정보를 유출하는가?), 저작권(모델이 저작권이 있는 텍스트로 학습되었는가?), AI 안전성(유해한 텍스트가 성공적으로 unlearning 되었는가?)과 직결된다.

학습 데이터에 직접 접근할 수 있을 때, 시퀀스 멤버십을 판단하는 가장 일반적인 접근법은 **n-gram 비교**이다. 두 시퀀스가 **verbatim**으로 일치하면 모든 n에 대해 n-gram이 동일하고, **approximate**로 일치하면 특정 n에 대해 대부분이 동일하다.

핵심 질문: **LLM이 학습 데이터에 n-gram으로 포함된 적 없는 타겟 시퀀스를 생성할 수 있는가?**

이 논문의 발견은 긍정적이다: n-gram 멤버십은 n에 의존하는 임계값을 설정하며, 이 임계값은 **게이밍(gaming)** 될 수 있다.

![Figure 1: Main setup and findings](/images/papers/verbatim-completion/main-illustration-v2.pdf)

### 주요 발견

1. 학습 데이터 멤버십과 LLM completion test 사이에 높은 중첩이 있지만, 중첩에 속하지 않는 텍스트들은 복잡성 부족 또는 n-gram 기반 정의의 한계로 설명된다.
2. n-gram 멤버십은 학습 데이터 "멤버"의 직관을 포착하는 데 한계가 있다. 모델은 학습 데이터의 n-gram 멤버가 아닌 시퀀스도 완성할 수 있다.
3. 근본 원인은 거리 측정(n-gram overlap)의 선택이 아니라, **멤버십 정의가 학습 알고리즘이 접근하는 보조 정보(auxiliary information)를 고려하지 못한다**는 점이다.

---

## 2. 관련 연구 (Background & Related Work)

### 2.1 데이터 멤버십 정의

대부분의 경우 n-gram 또는 substring overlap 기반이다. GPT-4는 50-character substring overlap을, LLaMA-3은 8-gram token overlap을 사용한다. 학습 데이터 중복 제거(deduplication)에서도 suffix array를 이용한 정확한 substring 매칭이나 MinHash를 이용한 근사 매칭이 모두 n-gram overlap에 기반한다.

### 2.2 데이터 멤버십 테스트

**Membership Inference Attack (MIA)**는 학습 데이터 접근 없이 모델만으로 멤버십을 예측하는 방법이다. 그러나 자연어에서 멤버십이 본질적으로 모호하다는 연구도 있으며, 기존 MIA 테스트베드가 분포 이동(distribution shift) 문제를 겪는다는 지적도 있다.

### 2.3 데이터 완성 (Data Completion)

모델이 prefix를 받아 suffix를 생성하여 학습 데이터를 재현하는지 확인하는 방법이다. 직관적으로, 긴 시퀀스의 prefix만으로 suffix를 정확히 완성하면 해당 시퀀스가 학습 데이터에 있었을 가능성이 높다. 본 논문은 이 completion test를 블랙박스 멤버십 테스트로 사용한다.

---

## 3. 사전 정의 (Preliminaries)

### 3.1 n-gram 데이터 멤버십

> **정의 1 (n-gram data membership):** 시퀀스 $x$가 데이터셋 $D = \{x^{(i)}\}_{i=1}^{N}$의 멤버란, $x$의 n-gram 중 적어도 하나가 $D$의 어떤 $x^{(i)}$의 n-gram과 일치하는 것이다.

이 정의는 stringent하여 멤버를 과대추정하고 비멤버를 과소추정한다. $n = |x|$로 설정하면 Carlini et al. (2022)의 verbatim 멤버십이 되고, 작은 $n$은 MinHash, edit distance 기반 등 다양한 approximate 멤버십 정의를 포괄한다.

### 3.2 데이터 완성 정의

![Figure 2: Completion vs. Extraction](/images/papers/verbatim-completion/venn-complete.pdf)

- **Exact completion:** $M(prompt) = suffix$ (greedy decoding)
- **r-similar completion:** normalized Levenshtein edit distance가 $1-r$ 이내
- **Case-insensitive completion:** 대소문자 무시 시 일치

**Data Extraction = Data Completion + Data Membership.** 즉, extraction은 completion이 성공하고 그 결과가 학습 데이터의 멤버임이 확인될 때 성립한다. 본 논문은 **비멤버의 completion**을 연구한다.

---

## 4. 실험 1: 멤버 제거가 항상 Verbatim Completion을 방지하지 않는다 (Pre-training)

### 4.1 실험 세팅

**핵심 질문:** 학습 데이터에서 n-gram overlap이 있는 모든 시퀀스를 제거하고 LLM을 처음부터 재학습해도, LLM이 여전히 텍스트를 verbatim 완성하는가?

**절차:**

1. **Base 모델 사전학습:** GPT-2 아키텍처 기반, {350M, 774M, 1.6B, 2.8B} 파라미터. LLM.c 사용.
2. **Verbatim completion 식별:** base 모델이 완성할 수 있는 길이 $k$의 시퀀스 집합 $D_{mem}$ 수집 (학습 데이터의 모든 문서의 첫 $k$ 토큰 검사).
3. **n-gram 필터링:** $D_{mem}$의 각 시퀀스를 $D_{base}$에서 제거. sliding window 방식으로 n-gram 공유 시 해당 윈도우 삭제.
4. **Counterfactual 모델 재학습:** 필터링된 데이터로 LLM을 처음부터 재학습.

**데이터:** FineWeb-Edu, 33.6B 토큰 (1.6B 모델에 대해 Chinchilla optimal). 시퀀스 길이 $k=50$ (prefix=suffix=25 토큰).

| Model size | 304M | 774M | 1.6B | 2.8B |
|------------|------|------|------|------|
| \|D_mem\| | 76,648 | 116,270 | 151,598 | 175,813 |

### 4.2 결과

![Figure 3: LLMs can verbatim complete texts with zero n-gram overlap to training data](/images/papers/verbatim-completion/pretrain_scale_vs_lingering.pdf)

**발견 #1 (Lingering Sequences의 존재):** 학습 데이터에서 삭제된 시퀀스의 상당 부분을 LLM이 여전히 verbatim 완성한다. 가장 약한 n-gram 필터(n=50, verbatim 매치만 제거)로는 **약 40%**가 여전히 완성된다. 이를 **"lingering sequences"**라 부른다.

**발견 #2 (Lingering Sequences의 본질):** 창의적 일반화(creative generalization)에 해당하는 lingering sequence는 발견되지 않았다. 모든 경우가 **near-duplicate, 짧은 n-gram overlap, 또는 인식 가능한 패턴의 연속**으로 설명된다. 무작위로 선택한 lingering sequence에 대해 사전학습 데이터에서 근접 텍스트(Levenshtein distance < 20)를 검색한 결과, 모두 near-duplicate가 발견되었다.

**발견 #3 (Lingering Sequences의 지속성):** 더 강한 필터(작은 n)를 적용하면 lingering sequences가 줄어들지만 완전히 제거되지는 않는다. n=5에서도 **약 1%**가 남는다. 필터가 강해질수록 lingering sequences의 내용이 의미론적으로 유용한 텍스트에서 **일반화 가능한 패턴**(예: 로마 숫자 세기)으로 이동한다.

![Figure 4: Stronger filters shift lingering completions toward generalizable patterns](/images/papers/verbatim-completion/pretrain_lingering_vs_mem.pdf)

패턴 이동을 정량화하기 위해 세 가지 프록시 메트릭 사용: (1) off-the-shelf GPT-2-XL의 완성율, (2) 분리된 사전학습 데이터로 학습한 counterfactual 모델의 완성율, (3) Gemini 1.5 Pro의 패턴 연속 판단. 세 메트릭 모두 강한 필터가 일반화 행동을 걸러냄을 확인.

---

## 5. 실험 2: 비멤버 추가로 LLM Verbatim Completion 강제하기 (Fine-tuning)

### 5.1 실험 세팅

**핵심 질문:** 선택한 (미학습) 텍스트 시퀀스 $x$에 대해, $x$와 n-gram overlap이 없는 학습 시퀀스 $D_{ft}$를 추가하여, $D_{ft}$로 파인튜닝한 LLM이 $x$를 verbatim 완성할 수 있는가?

**핵심 아이디어:** 노이즈 변환(noisy transformation) $f$를 적용하여 $\tilde{x} = f(x)$를 생성. $\tilde{x}$는 $x$의 정보를 일부 보존하지만 n-gram overlap은 없다. 다양한 랜덤성으로 생성한 $\tilde{x}$들로 LLM을 학습시키면, denoising autoencoder처럼 원본 $x$를 복원하도록 학습.

**세 가지 적대적 데이터 구성 방법:**

#### 방법 1: Stitching Chunks
타겟 $x$를 겹치는(overlapping) 세그먼트로 분할하고 나머지를 랜덤 토큰으로 패딩.

예시: $x = [1,2,3,4,5,6]$ → $D_{ft} = \{[1,2,3,\cdot,\cdot,\cdot], [\cdot,\cdot,3,4,5,\cdot], [\cdot,\cdot,\cdot,\cdot,5,6], ...\}$ (chunk size=3, overlap=1)

LLM의 과제: 토큰 청크를 다시 이어 붙여 $x$를 복원.

#### 방법 2: Token Dropouts
$x$의 토큰을 최소 $n$번째 위치마다 랜덤 토큰으로 마스킹하여 n-gram overlap을 방지.

예시: $x = [1,2,3,4,5,6]$ → $D_{ft} = \{[1,2,3,\cdot,5,6], [1,\cdot,3,4,5,\cdot], [\cdot,2,3,4,\cdot,6], ...\}$ (drop interval=4)

Goldfish loss (Hans et al., 2024)와 관련되지만, 여기서는 학습 목적함수가 아닌 **데이터 중심(data-centric)** 접근.

#### 방법 3: Casing Flips
영문자의 대소문자를 확률 $p$로 랜덤 반전. BPE 토큰화 메커니즘으로 인해 대소문자만 바꿔도 **완전히 다른 토큰 시퀀스**가 생성됨.

예시: `'This is a string'` → `'THIS Is A stRinG'`

$p=0.5$가 가장 높은 분산을 만들고, $p \approx 1$은 거의 모든 문자를 반전.

#### 합성 (Compositions)
Token dropout + Casing flip을 조합하여 더 세밀한 난이도와 탐지 가능성 조절 가능.

**모델:** Gemma-2 (2B, 9B), Qwen-2.5 (0.5B, 7B). Batch size 32, learning rate $10^{-5}$.

**타겟 텍스트 (약 250 토큰, 학습 데이터에 포함 불가능한 최근 텍스트):**
1. **Lyles:** Noah Lyles와 올림픽에 관한 최근 NYT 기사 발췌
2. **Karpathy:** Andrej Karpathy의 LLM 토큰화에 관한 트윗
3. **Willow:** Google의 양자 컴퓨팅 칩 Willow에 관한 블로그 포스트 발췌

각 타겟에 대해 $N=2,000$개의 변환된 예시를 $D_{ft}$로 구성.

### 5.2 결과

![Figure 5: Completion success across methods and target texts](/images/papers/verbatim-completion/finetune_main.pdf)

**발견 #1: 최소한의 파인튜닝으로 n-gram 멤버십 없이 미학습 문자열을 완성할 수 있다.**

- **Chunking:** 가장 비효과적. 작은 chunk size(c=25)에서는 대부분 실패하고, c=100에서야 일부 모델만 성공.
- **Token dropouts:** **매우 효과적.** 가장 작은 모델(Qwen-2.5 0.5B)도 drop interval 2(50% 드롭)에서 타겟을 verbatim 완성. Goldfish loss에 대한 반례(counter-case)를 제시 — 드롭 위치가 다른 여러 버전이 있으면 모델은 여전히 verbatim 완성 가능.
- **Casing flips:** 전반적으로 효과적.
- **합성 (Dropout + Casing):** 난이도 증가(소형 모델에서 성공률 감소)하지만 verbatim 완성은 여전히 가능.

![Figure 6: Completion success may only require a few gradient steps](/images/papers/verbatim-completion/willow_goldfish_casing_4_09_qwen7b_tall.pdf)

**발견 #2: Completion 성공률은 모델 크기에 비례한다.** 동일 설정에서 모델 크기가 커질수록 completion 성공률이 일반적으로 향상되어, 프론티어 모델이 n-gram 비멤버를 타겟 텍스트로 합성하는 데 더 유능할 것임을 시사한다.

---

## 6. 해석 및 함의 (Interpretations and Outlook)

### 적대적 파인튜닝의 잠재적 영향

- **Data poisoning:** 독 텍스트 $x$의 n-gram 비멤버를 학습 데이터에 추가해도 $x$의 생성을 유도할 수 있다.
- **Data contamination:** 부정직한 모델 개발자가 n-gram 기반 탐지를 회피하면서 의도적으로 데이터 오염을 수행할 수 있다.
- **학습-테스트 overlap 보고:** 모델 개발자가 n-gram overlap 통계만 자가 보고하는 것은 불충분하며, 추가적인 메트릭이 필요하다.

---

## 7. 결론 (Concluding Remarks)

Lingering sequences(§4)와 적대적 파인튜닝 데이터셋(§5)은 LLM이 인접 텍스트로부터 일반화하는 놀라운 능력을 보여준다. 주요 함의:

1. **멤버십 정의와 테스트는 새로운 유사도 측정을 포함해야 한다.** n-gram 기반 멤버십은 인간의 직관이나 저작권·프라이버시·AI 안전성 커뮤니티의 실용적 관심사를 포착하지 못하는 **false negative**을 발생시킨다.

2. **Machine unlearning만으로는 출력 억제(output suppression)에 충분하지 않다.** 처음부터 재학습하는 것이 unlearning의 golden baseline이지만, 본 실험은 정확히 이 counterfactual을 수행하여 일부 제외된 시퀀스가 여전히 verbatim 생성됨을 보였다. Unlearning만으로는 유해한 시퀀스의 생성을 항상 방지할 수 없다.

3. **Forging과의 연결.** 기울기 forging이 비중복 데이터셋으로 가능하듯, 본 연구의 방법은 **모델 출력의 forging**으로 볼 수 있다.

---

## 8. 한계 (Limitations)

- 사전학습 실험은 최대 2.8B까지만 수행. 더 큰 모델에서는 창의적 일반화(creative generalization)가 나타날 가능성.
- 적대적 변환 방법의 탐색이 제한적이며, 최적의(가장 은밀한) 변환을 찾는 것이 목표는 아님.
- 자연어에서의 멤버십은 본질적으로 모호하며, 어떤 단일 정의도 모든 downstream 관심사를 완벽히 포착하지 못할 수 있음.
