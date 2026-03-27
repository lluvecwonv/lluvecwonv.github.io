---
title: "Hubble: LLM 암기(Memorization) 연구를 위한 모델 스위트 논문 분석"
date: 2026-03-27
summary: "LLM 암기 현상을 체계적으로 연구하기 위해 설계된 완전 오픈소스 모델 스위트 Hubble을 소개하는 ICLR 2025 논문 분석. Standard/Perturbed 변형 모델(1B/8B, 100B/500B 토큰)을 통해 저작권·프라이버시·테스트셋 오염 세 도메인에 걸친 암기 리스크를 정량적으로 측정하고, 희석(dilution)과 순서(ordering)라는 두 가지 모범 사례를 확립. Membership Inference Attack 및 Machine Unlearning 벤치마크로서의 활용도 제시."
tags: [LLM, Memorization, Privacy, Copyright, Test Set Contamination, Machine Unlearning, Membership Inference, Open Source, ICLR 2025, 연구노트]
category: 연구노트
language: ko
---

# Hubble: a Model Suite to Advance the Study of LLM Memorization

**학회:** ICLR 2025
**저자:** Johnny Tian-Zheng Wei, Ameya Godbole, Mohammad Aflah Khan, Ryan Wang, Xiaoyuan Zhu, James Flemings, Nitya Kashyap, Krishna P. Gummadi, Willie Neiswanger, Robin Jia
**소속:** University of Southern California, Max Planck Institute for Software Systems
**논문 링크:** [프로젝트 페이지](https://allegro-lab.github.io/hubble/)

![Hubble Logo](/figures/hubble/hubble_patch-min.png)

---

## 한 줄 요약

LLM 암기(memorization) 현상을 **저작권, 프라이버시, 테스트셋 오염** 세 도메인에 걸쳐 체계적으로 연구할 수 있는 완전 오픈소스 모델 스위트 **Hubble**을 제시하며, **희석(dilution)**과 **순서(ordering)**라는 두 가지 암기 리스크 완화 모범 사례를 실증적으로 확립한 연구.

---

## 1. 논문 개요 및 동기

대규모 언어 모델(LLM)이 학습 데이터를 암기하는 현상은 이중적 결과를 가져온다. 한편으로는 사실적 지식이 필요한 하류 과제의 성능을 지원하지만, 다른 한편으로는 다양한 배포 리스크를 야기한다. 구체적으로 저작권 리스크(모델이 저작권 자료를 재생산), 프라이버시 리스크(개인 정보 노출), 테스트셋 오염 리스크(벤치마크 데이터셋 암기)가 있다.

기존 연구는 크게 두 가지 스펙트럼에 놓여 있다:
- **통제된 연구(Controlled Studies):** 합성/템플릿 데이터로 소규모 모델을 학습하여 정밀 측정이 가능하지만, 상용 LLM과 크게 다름
- **관찰적 연구(Observational Studies):** 대형 사전학습 모델을 분석하지만, 인과적 양(causal quantities)을 추정하기 어려움

Hubble은 이 두 접근법의 **중간 지점**에서, **대규모 모델에 대한 통제된 실험**을 가능하게 한다. Pythia 모델 스위트에서 영감을 받아, Llama 아키텍처 기반의 완전 오픈소스 LLM 스위트를 제공하며, **표준(standard)** 모델과 **변형(perturbed)** 모델 쌍으로 구성된다. 변형 모델에는 세 가지 암기 리스크 도메인을 에뮬레이션하도록 설계된 텍스트가 통제된 방식으로 삽입되어 있다.

---

## 2. 변형 데이터(Perturbation) 설계

Hubble의 핵심 설계 원리는 학습 데이터에 **무작위로 통제된 텍스트를 삽입**하여 암기 리스크를 에뮬레이션하는 것이다. 각 변형 예시는 무작위로 {0×, 1×, 4×, 16×, 64×, 256×} 중 하나의 중복 횟수가 할당된다.

### 2.1 저작권(Copyright) 도메인

**구텐베르크 도서 발췌문(Passages):**
- **인기 구텐베르크(Popular Gutenberg)** 도서에서 짧은 발췌문 샘플링 및 삽입
- **비인기 구텐베르크(Unpopular Gutenberg)** 도서에서 짧은 발췌문 샘플링 및 삽입
- 도서를 다운로드 수 기준으로 인기/비인기를 층화하여, 데이터 밀도(data density)가 암기에 미치는 역할을 연구 가능
- **위키피디아(Wikipedia)** 기사에서 발췌문 삽입 (DCLM 코퍼스 컷오프 이후 작성된 최근 사건 기사)

**패러프레이즈(Paraphrases):**
- **MRPC**, **PAWS** 데이터셋에서 의미적으로 동일하지만 표현이 다른 두 패러프레이즈 중 하나를 무작위 삽입
- 저작권법이 사실이 아닌 표현(expression)을 보호한다는 점에서, 리터럴 표현의 암기를 테스트

### 2.2 프라이버시(Privacy) 도메인

**전기문(Biographies):**
- **YAGO** 지식 베이스에서 샘플링한 템플릿 전기문: 이름, 국적, 생년월일, UUID 등 9개 속성 포함
- **ECtHR** (유럽인권법원) 판례문: 피고인의 전기 정보 포함, PII 주석 제공
- 사전학습 단계에서의 PII(개인 식별 정보) 누출을 연구하기 위함

**채팅(Chats):**
- **Personachat** 데이터셋: 무작위 할당된 사용자명으로 대화 삽입
- PII가 명시적으로 나타나지 않더라도 모델이 민감한 개인 속성을 추론할 수 있는 **간접 누출(indirect leakage)** 시뮬레이션

### 2.3 테스트셋 오염(Test Set Contamination) 도메인

**표준 테스트셋:**
- **PopQA**, **Winogrande** (Infill/MCQ 두 가지 형식), **MMLU**, **HellaSwag**, **PIQA** 삽입
- 오염 탐지 및 평가 점수 조정 방법 연구를 가능하게 함

**신규 테스트셋:**
- **ELLie** (생략 해소 과제), **MUNCH** (은유 이해 과제)
- DCLM 데이터셋 컷오프 이후 생성되어 의도치 않은 오염 가능성 최소화

---

## 3. Hubble 모델 스위트 구성

### 3.1 사전학습 데이터

**베이스 코퍼스:** DataComp-LM (DCLM) 베이스라인 데이터셋 사용. CommonCrawl에 대한 모델 기반 필터링 파이프라인으로, 이미 Bloom 필터로 중복 제거됨. OLMo 토크나이저로 토큰화하여 500B 토큰 이상의 코퍼스 생성. 100B 코퍼스는 500B 코퍼스의 부분집합.

**오염 제거(Decontamination):** 삽입할 변형 데이터와 매칭되는 학습 문서를 제거. 7540개 문서 제거 (전체의 0.002% 미만).

**변형 데이터 삽입 방식:**

![Perturbation Insertion Process](/figures/hubble/injection-visualization-v4.png)

삽입 과정은 다음과 같다:
1. 표준 학습 시퀀스를 샘플링
2. 학습 시퀀스의 문서 사이 간격(gap)을 샘플링
3. 변형 데이터를 해당 위치에 스플라이싱(splicing)
4. 원래 시퀀스 길이에 맞게 리사이징 (변형 데이터가 잘리지 않도록 보장)

중복 후 변형 데이터 총량은 79.9M 토큰 (818k 시퀀스)으로, 100B 코퍼스의 **0.08%**, 500B 코퍼스의 **0.016%**에 불과하다.

### 3.2 모델 아키텍처 및 학습

**아키텍처:** Llama 3 기반, 주요 수정사항:
- OLMo 토크나이저 사용 (어휘 크기 128K → 50K로 축소)
- 가중치 임베딩 비공유(untied) — logit lens 등 해석 가능성 방법 지원
- 8B 모델은 32 → 36 레이어로 변경 (GPU 활용 극대화)

**학습 구성:**
- GPT-NeoX 프레임워크 사용 (Megatron-LM + DeepSpeed)
- 글로벌 배치 크기 1024, 시퀀스 길이 2048
- Learning rate 4e-4, Cosine annealing, Adam optimizer (β1=0.9, β2=0.95)
- 500B 토큰 학습 시 238,500 gradient updates, 100B 시 48,000 updates
- A100 GPU 클러스터 (64 GPUs), 총 200,000 GPU 시간 사용

### 3.3 모델 변형 목록

| 실험 유형 | 모델 구성 | 설명 |
|-----------|----------|------|
| **Core** | 2×2×2 factorial design: {1B, 8B} × {Standard, Perturbed} × {100B, 500B} = 8개 모델 | 희석(dilution) 효과 검증 |
| **Interference** | 1B, 100B, 단일 도메인 변형 × 3 | 도메인 간 간섭 확인 |
| **Timing** | 1B, 100B, 서로 다른 학습 시점에 변형 삽입 × 6 | 삽입 시점이 암기에 미치는 영향 |
| **Paraphrased** | 1B/8B, 100B, 패러프레이즈된 변형 데이터 | 패러프레이즈된 지식의 암기 연구 |
| **Architecture** | 1B, 100B, 8/32 레이어 변형 | 모델 깊이의 영향 |

### 3.4 일반 성능 평가

Pythia 스위트와 동일한 벤치마크로 평가한 결과, Hubble 모델은 비슷한 파라미터/데이터 규모의 다른 오픈소스 모델과 **대등한 성능**을 보인다.

| 모델 | 토큰 | ARC-C | ARC-E | LogiQA | Lambada | PIQA | SciQ | WinoGrande | WSC |
|------|------|-------|-------|--------|---------|------|------|------------|-----|
| **Hubble-1B Standard** | 500B | 0.40 | 0.72 | 0.25 | 7.43 | 0.76 | 0.95 | 0.63 | 0.41 |
| **Hubble-1B Perturbed** | 500B | 0.40 | 0.72 | 0.25 | 7.23 | 0.76 | 0.94 | 0.63 | 0.45 |
| Pythia 1B | 300B | 0.28 | 0.57 | 0.25 | 10.86 | 0.70 | 0.92 | 0.53 | 0.43 |
| OLMo-2-1B | 4T | 0.46 | 0.76 | 0.27 | 6.26 | 0.77 | 0.96 | 0.66 | 0.45 |
| **Hubble-8B Standard** | 500B | 0.58 | 0.84 | 0.32 | 3.71 | 0.82 | 0.98 | 0.77 | 0.56 |
| Pythia 6.9B | 300B | 0.39 | 0.71 | 0.28 | 5.65 | 0.77 | 0.95 | 0.64 | 0.51 |
| Llama-3.1-8B | 15T+ | 0.58 | 0.85 | 0.33 | 3.93 | 0.82 | 0.98 | 0.77 | 0.63 |

Perturbed 모델과 Standard 모델 간 일반 성능 차이가 거의 없어, 변형 데이터 삽입이 모델 품질을 저하시키지 않음을 확인.

### 3.5 암기 평가 방법

세 가지 평가 방식을 사용:

1. **Loss 기반:** 본 적 있는 예시가 본 적 없는 예시보다 낮은 loss를 가지는지 확인
2. **Loss 기반 선택(Loss-based choice):** 여러 후보 답 중 가장 낮은 loss의 옵션 선택
3. **생성적(Generative):** 모델에 프롬프트를 주고 정확한 continuation을 생성하는지 확인 (exact match, word recall)

---

## 4. 도메인 비의존적 결과 (Domain-agnostic Results)

### 4.1 희석(Dilution): 더 큰 코퍼스로 학습하면 암기 리스크가 감소

![Dilution Effect - 8B Models](/figures/hubble/dilution-hubble_8b.png)

위 그림은 8B 모델의 코어 실험 결과를 보여준다. 동일한 중복 수준에서, **500B 토큰으로 학습한 모델이 100B 토큰 모델보다 암기가 약하다.** 이는 저작권, 프라이버시, 테스트셋 오염 **모든 도메인**에서 일관되게 나타나는 결과이다.

**핵심 모범 사례(Best Practice) 1:** 민감한 데이터는 더 큰 코퍼스로 학습하여 **희석(dilute)**할 수 있으며, 이는 중복 제거(deduplication)와 보완적인 전략이다.

### 4.2 순서(Ordering): 민감한 데이터를 학습 초기에 배치하면 암기 리스크 감소

![Timing Effect](/figures/hubble/injectrange-main.png)

변형 데이터를 학습의 **첫 번째 1/4에만** 삽입하면, 최종 모델은 해당 데이터를 암기하지 않는다. 반면, **마지막 1/4에** 삽입하면 일반 변형 모델보다 더 많은 데이터가 암기되고 추출 가능하다.

![Forgetting Curves](/figures/hubble/checkpoint-forgetting-curves.png)

중간 체크포인트를 분석하면, 모델이 중복 데이터에 지속적으로 노출되지 않으면 **잊어버릴 수(forget)** 있음을 보여준다.

**핵심 모범 사례(Best Practice) 2:** 민감한 데이터는 학습 **초기(early)**에 배치하도록 **순서를 정할(order)** 수 있다.

### 4.3 더 큰 모델은 더 낮은 중복에서도 암기

![Model Scale Effect](/figures/hubble/model_scale-dclm_500B.png)

500B 토큰 코퍼스에서 1B vs 8B 모델을 비교하면, **8B 모델이 모든 과제에서 동일 중복 수준에서 더 높은 암기율**을 보이며, 더 적은 중복으로도 암기가 측정 가능하다. 모델 크기를 키우면 암기 리스크가 증가하므로, 다른 완화 전략과 균형을 맞춰야 한다.

### 4.4 도메인 간 간섭 최소

서로 다른 도메인의 변형 데이터가 하나의 학습에서 상호 간섭하는지 확인하기 위해, 단일 도메인 모델과 전체 변형 모델을 비교한 결과, **각 도메인 평가에서 거의 동일한 행동**을 보여 간섭이 최소임을 확인.

---

## 5. 도메인 특화 결과 (Domain-specific Results)

### 5.1 저작권(Copyright)

![Copyright Passages Results](/figures/hubble/copyright-passages.png)

**암기 여부는 메트릭 선택에 따라 달라진다:**
- Loss 기반 메트릭은 낮은 중복 수(4회)에서도 통계적으로 유의미한 차이를 보여주지만, k-eidetic memorization 메트릭은 16회부터 차이를 보임
- 저작권 논쟁에서 **메트릭 선택이 해석에 큰 영향**을 미침

**인기 도서 vs 비인기 도서:**
- 1B 모델에서는 눈에 띄는 차이 없음
- 8B 모델에서는 인기 도서의 생성적 추출에서만 약간의 차이 — 데이터 밀도 가설(data density hypothesis)의 효과가 기본 평가에서는 미미

### 5.2 프라이버시(Privacy)

![YAGO PII Attack Results](/figures/hubble/privacy-yago.png)

**공격자의 보조 정보가 많을수록 성공률이 높다:**
- 풀 프리픽스 + 선택형(MCQ) 공격: 16회 중복에서 Hubble 8B (100B) 모델의 정확도가 거의 **100%**에 근접
- 이름만 아는 강한 공격: 정확도가 크게 감소

![PII Type Breakdown](/figures/hubble/privacy-yago-meta.png)

**PII 유형별 암기 차이:**
직업(occupation), 이메일, UUID 등 속성별로 암기 정도가 다르다. 동일 문서에서도 한 사실은 암기하고 다른 사실은 암기하지 못할 수 있으므로, 암기 연구에서는 PII 유형의 다양성을 고려해야 한다.

![Personachat Results](/figures/hubble/privacy-personachat.png)

**간접 정보 추론은 어렵지만 가능:**
- 사용자명 → 페르소나 추론: 거의 랜덤 수준
- 페르소나 → 사용자명 추론: 8B 모델에서 64회 중복 시 최대 **34%** 정확도 달성
- 모든 암기 평가는 실제 암기된 정보의 **하한(lower bound)**일 뿐

**패러프레이즈된 전기문에서도 PII 추론 가능:**
- 정확한 중복이 아닌 패러프레이즈로 학습한 모델에서도 PII 재구성/추론 성공
- 패러프레이즈 모델은 고정 문자열을 암기한 것이 아니라 의미적 지식을 일반화하여 보유
- 이름만 아는 강한 공격에서는 원래 perturbed 모델보다 **더 높은 정확도** — 패러프레이즈가 더 강한 의미적 기억(semantic memory)을 형성

### 5.3 테스트셋 오염(Test Set Contamination)

![Test Set Contamination Results](/figures/hubble/testset-set1.png)

**1회 중복만으로도 암기가 시작되나, 일반화는 예측 불가능:**
- PopQA, HellaSwag, PIQA에서 1회 오염만으로 정확도 증가
- 하지만 오염된 테스트 예시의 암기가 **해당 과제의 일반화로 이어지지 않음**
- 오염되지 않은 예시에서의 성능은 Standard 모델과 거의 동일하거나 오히려 감소

![WinoGrande Cross-format Results](/figures/hubble/testset-wg.png)

**WinoGrande: 형식 간 일반화 실패:**
- MCQ 형식으로 삽입된 예시를 Infill 형식으로 테스트하면, 중복 증가에 따라 오히려 **정확도 감소**
- 이는 학습 시 소수의 오염된 예시로는 과제 자체를 일반화하기에 불충분하며, 단순 암기만 발생함을 시사

---

## 6. Hubble의 활용 사례

### 6.1 Membership Inference Attack (MIA) 벤치마크

기존 MIA 벤치마크(WikiMIA 등)는 시간적 단서 같은 허위 특징이 멤버십 정보를 사소하게 누출하는 문제가 있다. Hubble에서는 각 변형이 **무작위로 중복**되므로, 멤버와 비멤버 간에 허위 특징이 없는 건전한 벤치마크를 제공한다.

**실험 설정:**
- 4개 Hubble 모델 × 3개 변형 데이터셋 = 12개 설정
- MIA 방법: Loss-based, MinK%, MinK%++, Zlib-based
- 비멤버: 0회 중복, 멤버: 1회 이상 중복

**결과 (Hubble 8B, 500B 토큰, Perturbed 모델):**

| 평가 데이터 | MIA 방법 | Dup≠0 | Dup=1 | Dup=4 | Dup=16 | Dup=64 | Dup=256 |
|------------|---------|-------|-------|-------|--------|--------|---------|
| Gutenberg Unpopular | Loss | 0.629 | 0.539 | 0.556 | 0.732 | **0.996** | **1.0** |
| | MinK%++ | **0.666** | **0.545** | **0.620** | **0.813** | 0.987 | 0.949 |
| YAGO Biographies | Loss | 0.692 | 0.538 | 0.652 | **0.897** | **1.0** | **1.0** |
| | MinK%++ | **0.714** | **0.571** | **0.686** | 0.892 | 0.995 | 0.983 |
| MMLU | Loss | 0.673 | 0.529 | 0.628 | 0.857 | **1.0** | **1.0** |
| | MinK%++ | **0.743** | **0.580** | **0.731** | **0.943** | 0.994 | 0.986 |

**핵심 관찰:**
- 중복 횟수 증가에 따라 MIA 성능이 일관되게 향상
- **1회 중복에서는 거의 랜덤** 수준 — MIA가 고빈도 중복 데이터에서만 효과적이라는 기존 관찰 확인
- **MinK%++**가 전반적으로 가장 효과적이나, 놀랍게도 256회 중복에서 100% AUC 달성하지 못함 (Loss, MinK%는 달성)

### 6.2 Machine Unlearning 벤치마크

기존 언러닝 벤치마크(TOFU, MUSE, WMDP)는 파인튜닝 환경이거나 특정 도메인에 제한적이다. Hubble은 **사전학습 데이터에 대한 다양한 도메인의 언러닝 평가**를 가능하게 한다.

**실험 설정:**
- 대상 모델: Hubble 8B Perturbed (500B 토큰)
- 언러닝 방법: RMU, RR, SatImp
- 도메인: 저작권(Gutenberg Unpopular), 프라이버시(YAGO)
- 데이터 분할: Unseen (0회 중복), Unlearn (256회 중복의 절반), Keep (256회 중복의 나머지 절반)

![Unlearning Results](/figures/hubble/unlearn_main.png)

**결과:**
- 어떤 언러닝 방법도 **목표 지점(desired target)에 도달하지 못함** — Standard 모델의 Unlearn 세트 성능을 달성하면서 나머지를 유지하는 것이 불가능
- 모든 방법이 Unlearn 세트뿐 아니라 **Keep 세트와 Test 세트까지 성능 저하**
- Keep 세트(Unlearn과 같은 분포의 이웃 데이터)의 저하는 현재 방법들이 **분포 수준의 지식을 삭제**하며 표적 데이터만 정밀하게 제거하지 못함을 시사
- **SatImp**가 전반적으로 가장 나은 성능을 보이지만, 여전히 개선 여지가 큼

---

## 7. 논의 및 결론

Hubble은 암기 리스크에 대한 체계적 서베이와 오픈소스 아티팩트 공개를 결합하여, LLM 암기 연구를 진전시키기 위한 것이다. 저자들은 후속 연구를 위한 세 가지 핵심 질문을 제시한다:

**정보는 어떻게 암기되는가?**
- Hubble의 변형 데이터로 해석 가능성(interpretability) 연구 가능
- 중복 횟수, 삽입 시점 등의 인과적 효과 분석
- 합성 전기문의 무작위성은 지식 국소화(localization) 연구에 유용한 canary 역할

**암기를 어떻게 측정할 것인가?**
- 저작권/프라이버시 논쟁에서 더 직관적이고 강건한 암기 메트릭 필요
- Hubble의 통제된 삽입은 새로운 메트릭 개발 및 검증에 활용 가능
- 차분 프라이버시(differential privacy)의 직관을 빌려올 수 있는 가능성

**암기를 어떻게 완화할 것인가?**
- 희석과 순서라는 두 모범 사례 확립
- 양자화(quantization)가 암기 리스크를 줄일 수 있는지 탐구
- 암기와 데이터 포이즈닝은 유사한 메커니즘에 의존하므로, 암기 완화가 포이즈닝 취약성도 줄일 가능성

---

## 주요 기여 요약

1. **Hubble 모델 스위트**: 1B/8B 파라미터, 100B/500B 토큰, Standard/Perturbed 변형의 완전 오픈소스 LLM 스위트
2. **세 도메인의 변형 데이터**: 저작권(도서 발췌, 패러프레이즈), 프라이버시(YAGO/ECtHR 전기문, PersonaChat), 테스트셋 오염(표준/신규 벤치마크)
3. **두 가지 모범 사례**: **희석(dilution)** — 더 큰 코퍼스로 학습, **순서(ordering)** — 민감한 데이터를 학습 초기에 배치
4. **벤치마크 제공**: HubbleMIA (membership inference), HubbleUnlearning (machine unlearning)
5. **도메인 특화 분석**: 저작권 메트릭 선택의 영향, PII 유형별 암기 차이, 테스트셋 오염의 일반화 한계

---

## 개인적 코멘트

이 논문은 LLM 암기 연구를 위한 **인프라적 기여**로서 매우 중요하다. 기존에 Pythia나 OLMo가 일반적인 LLM 연구를 위한 오픈소스 모델 스위트였다면, Hubble은 **암기 현상에 특화**하여 설계된 최초의 대규모 모델 스위트라 할 수 있다. 특히 무작위 통제된 삽입(randomized controlled insertion)이라는 실험 설계가 인과적 추론을 가능하게 하며, 이는 기존 관찰적 연구의 한계를 크게 보완한다.

또한 저작권·프라이버시·테스트셋 오염이라는 세 도메인을 법적·정책적 맥락과 연결하여 기술적 연구에 정책적 프레이밍을 부여한 점이 인상적이다. 실용적 측면에서 희석과 순서라는 두 모범 사례는 모델 학습 시 즉시 적용 가능한 가이드라인을 제공한다.
