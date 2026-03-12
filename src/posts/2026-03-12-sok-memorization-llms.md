---
title: "SoK: The Landscape of Memorization in LLMs — Mechanisms, Measurement, and Mitigation 논문 분석"
date: 2026-03-12
summary: "UC Berkeley & Google DeepMind의 LLM 메모리제이션 서베이(SoK). 메모리제이션의 정의 분류 체계(Outcome/Elicitation/Causal/Probabilistic), 영향 요인(모델 크기, 데이터 중복, 시퀀스 길이, 토크나이제이션, 샘플링), 학습 단계별 메모리제이션 동역학(Pre-training, SFT, RLHF, Distillation), 탐지 기법(Divergence Attack, Prefix Extraction, MIA, Soft Prompting), 완화 전략(Data Cleaning, DP, Unlearning, Activation Steering), 프라이버시/법적 리스크까지 종합 정리. 각 섹션별 Open Questions 포함."
tags: [LLM, Memorization, Privacy, Survey, SoK, MIA, Differential Privacy, Unlearning, 연구노트]
category: 연구노트
language: ko
---

# SoK: The Landscape of Memorization in LLMs — Mechanisms, Measurement, and Mitigation

**저자:** Alexander Xiong (UC Berkeley), Xuandong Zhao (UC Berkeley), Aneesh Pappu (Google DeepMind), Dawn Song (UC Berkeley)
**학회:** IEEE (IEEEtran format)
**코드:** 해당 없음 (서베이 논문)

## 한 줄 요약

LLM의 메모리제이션 현상을 **정의 → 영향 요인 → 학습 단계별 동역학 → 탐지 → 완화 → 법적 리스크**까지 체계적으로 정리한 SoK(Systematization of Knowledge) 논문으로, 각 주제별 Open Questions를 제시하며 향후 연구 방향을 조망한다.

---

## 1. 논문 개요

이 논문은 LLM이 학습 데이터를 "기억"하는 현상인 메모리제이션을 종합적으로 분석한다. LLM의 메모리제이션은 양날의 검이다 — 사실, 문법, 의미 규칙을 기억하는 것은 모델 유용성에 필수적이지만, 민감한 개인 정보나 저작권 콘텐츠를 그대로 재생산하는 것은 심각한 프라이버시·법적 위험을 초래한다. 저자들은 이를 단순한 버그가 아닌 **데이터 압축의 misaligned feature**로 이해해야 한다고 주장한다.

![Memorization Taxonomy](/images/papers/memorization-sok/mem_fig-1.png)
*Figure 1: LLM 메모리제이션의 분류 체계. 메모리제이션의 정의, 탐지, 완화, 그리고 프라이버시/법적 리스크를 체계적으로 매핑한다.*

---

## 2. 메모리제이션의 정의 분류 체계

기존 문헌에서 사용되는 메모리제이션 정의들은 다양하고 겹치는 부분이 많아 혼란을 야기한다. 저자들은 이를 5개 카테고리로 체계화한다.

### 2.1 Outcome-Centric (결과 중심)

**Verbatim/Perfect Memorization:** 학습 데이터의 단어 하나하나를 정확히 재현하는 가장 엄격한 형태. 저작권 침해와 PII 노출의 직접적 법적 근거가 된다.

**Approximate/Paraphrased Memorization:** 학습 데이터와 의미적으로 동등하지만 정확한 복사본은 아닌 텍스트를 생성. 대부분의 탐지 방법이 exact string matching에 의존하므로 이 유형은 탐지가 어렵다.

**Eidetic Memorization:** 길고 복잡하며 출현 확률이 낮은 시퀀스를 높은 충실도로 재현하는 특별히 강한 기억. 표면적 과적합이 아닌 깊은 수준의 데이터 내재화를 시사한다.

### 2.2 Elicitation-Centric (유출 중심)

**Extractable Memorization:** *어떤* 프롬프트로든 특정 학습 데이터를 생성시킬 수 있는 상태. 가장 넓은 정의로, worst-case 공격 표면을 모델링한다.

**Discoverable Memorization:** 학습 데이터의 prefix를 프롬프트로 사용하여 suffix를 재현시키는 것. 체계적이고 대규모 프라이버시 감사에 활용 가능한 실용적 부분집합이다.

**k-extractable Memorization:** Discoverable의 정량화 버전으로, prefix 길이 k를 명시. 컨텍스트 길이와 추출 확률의 관계를 분석할 수 있게 한다.

### 2.3 Probabilistic (확률적)

**(n, p)-Discoverable Extraction:** 시퀀스가 n번 시도 중 확률 p 이상으로 1회 이상 생성되면 기억된 것으로 간주. Greedy 이외의 다양한 디코딩 전략을 고려한 현실적 프레임워크이다.

### 2.4 Causal (인과적)

**Counterfactual Memorization:** 특정 학습 데이터를 제거했을 때 모델 출력이 변화하는 경우에만 "진정한" 기억으로 판단. 우연적 생성과 기억을 인과적으로 분리할 수 있는 유일한 정의이지만, 모델 재학습이 필요하여 실용적 한계가 크다.

### 2.5 Efficiency & Info-Theoretic (효율/정보이론적)

**τ-Compressible Memorization (ACR):** 프롬프트 길이 대비 출력 길이의 압축 비율로 메모리제이션 강도를 측정. 이진 분류가 아닌 연속 스펙트럼을 제공하며, fair use 법적 논의에 잠재적으로 연관된다.

> **핵심 문제:** 이처럼 다양한 정의가 혼재하면서 탐지·완화 전략의 직접 비교가 어렵고, 통합된 평가 프레임워크의 부재가 연구의 핵심 장벽이 되고 있다.

---

## 3. 메모리제이션 영향 요인

### 3.1 모델 파라미터 크기

모델 크기와 메모리제이션은 **log-linear** 관계를 보인다 (Carlini et al., 2021). 큰 모델은 더 많은 콘텐츠를 더 빠르게 기억하며, 이는 단순한 과적합으로 설명되지 않는다 (Tirumala et al., 2022). 추출 공격도 대형 모델에서 더 효과적이다.

### 3.2 학습 데이터 중복

중복 데이터는 메모리제이션의 가장 강력한 드라이버이다. 중복 제거는 기억된 토큰 생성을 10배 감소시키며 (Lee et al., 2022), 중복과 기억 사이에는 **초선형 관계**가 있어 드물게 중복된 데이터는 거의 기억되지 않는다 (Kandpal et al., 2022). 그러나 현재의 구문적 중복 제거(해시/부분문자열 매칭)는 near-duplicate(패러프레이즈, 소소한 편집)을 탐지하지 못하는 한계가 있다. 이를 위해 influence function 등을 활용한 모델 중심의 중복 인식 접근이 필요하다.

### 3.3 시퀀스 길이

시퀀스가 길수록 기억이 **로그 스케일**로 증가한다 (Carlini et al., 2023). 50토큰에서 950토큰으로 확장하면 verbatim 재현 확률이 수 배 증가한다. Prefix 길이가 길수록 추출 성공률이 높아진다.

### 3.4 토크나이제이션

BPE 어휘 크기가 클수록 메모리제이션이 증가한다 (Kharitonov et al., 2021). Named entity, URL, 희귀 구문이 단일 토큰화되면 기억에 특히 취약해진다.

### 3.5 샘플링 방법

확률적 디코딩이 greedy보다 기억된 데이터 추출에 훨씬 효과적이다. Top-k, nucleus sampling, temperature 최적화로 추출량이 2배까지 증가할 수 있다 (Yu et al., 2023). 랜덤 디코딩이 greedy 대비 누출 위험을 거의 두 배로 늘린다 (Tiwari & Suh). 단일 디코딩 방법으로는 모든 시나리오에서 누출을 최소화할 수 없으므로, 다양한 샘플링 전략에서의 평가가 필수적이다.

### 3.6 요인 간 상호작용

이 요인들은 독립적이 아니라 시너지적이고 비선형적으로 상호작용한다. 데이터 중복이 초기 신호를 제공 → 대형 모델이 포착 → 토크나이제이션이 증폭 → 특정 프롬프트가 key 역할 → 다양한 샘플링이 잠재 기억을 드러냄. "perfect storm"의 결과이므로, 효과적 완화에는 개별 요인이 아닌 **전체론적 접근**이 필요하다.

### Open Questions (영향 요인)

1. 중복 외에 어떤 내재적 데이터 속성이 기억을 결정하는가?
2. 추론 시점에서 메모리제이션 방지 vs. 유용성의 최적 트레이드오프는?
3. 모델 아키텍처 스케일이 기억 메커니즘에 어떤 영향을 미치는가?
4. LLM에서 유용한 일반화와 기억을 어떻게 구분할 수 있는가?

---

## 4. 학습 단계별 메모리제이션 동역학

메모리제이션은 단순한 과적합의 산물이 아니라, LLM 라이프사이클의 각 단계에서 **다른 형태의 위험**으로 변형된다.

### 4.1 Pre-training

비결정적 학습(데이터 셔플링, 드롭아웃, SGD)에서 모델은 학습 초기에 본 데이터를 잊는 경향이 있다 — parameter drift가 이전 표현을 덮어쓰기 때문이다 (Jagielski et al., 2023). 따라서 **학습 후반에 본 데이터가 더 많이 기억된다.** 메모리제이션은 예측 가능한 스케일링 법칙을 따르며, 모델 크기와 학습 기간이 증가하면 특정 시퀀스가 예측 가능하게 "미기억→기억" 상태로 전환된다 (Biderman et al., 2023).

**메트릭 선택의 중요성:** Verbatim completion과 MIA는 때로 모순된 결과를 낸다. 모델이 MIA 관점에서는 시퀀스를 "잊은" 것처럼 보이면서도, 프롬프팅하면 완벽하게 재현하는 역설이 발생한다. 데이터 중복이 약하고 분산된 멤버십 신호를 만들어 MIA를 회피하면서, 동시에 높은 확률의 출력으로 고착시키기 때문이다.

### 4.2 Supervised Fine-tuning (SFT)

- **Head-only fine-tuning:** 과적합으로 인한 가장 높은 기억 위험
- **Adapter 기반 fine-tuning:** 파라미터 업데이트를 제한하여 기억을 감소
- **주의(Attention) 패턴과의 연관:** 좁은 attention 패턴(예: 요약보다 QA)이 더 높은 기억과 상관
- **Janus Interface:** 파인튜닝이 사전학습 데이터의 잠재적 기억을 *재활성화*할 수 있다는 위험 (Nasr et al., 2023; Chen et al., 2024)

PEFT(LoRA 등)는 업데이트를 소수 가중치에 집중시켜, 태스크 능력과 분리하기 어려운 "memorization circuits"를 생성할 가능성이 있다.

### 4.3 RLHF/Post-training

RLHF에서 파인튜닝 중 기억된 데이터가 높은 빈도로 지속된다. 반면 보상 모델 데이터나 RL 데이터의 기억 증거는 미미하다 (Pappu et al., 2024). **보상 모델의 자체 기억/편향이 정책 모델에 기억된 콘텐츠 재생산을 암묵적으로 장려**할 수 있다는 우려가 있다.

### 4.4 Distillation

Teacher 모델에 주입된 편향이 distillation을 통해 student에서 **증폭**될 수 있다 (Chaudhari et al., 2025). KL divergence 목적함수가 teacher의 기억된 시퀀스에 대한 과신(overconfidence)을 student에게 직접 전달한다. 그러나 아직 공식적으로 분석되지 않은 영역이다.

### Open Questions (학습 단계)

1. 학습 동역학이 기억 정보의 망각/안정화를 어떻게 지배하는가?
2. 기억 스케일링 법칙은 사전학습과 파인튜닝에서 어떻게 다른가?
3. 기억된 출력을 특정 학습 단계에 인과적으로 귀속시킬 수 있는가?
4. 사전학습 기억이 파인튜닝 중 강화/망각되는 메커니즘은?
5. Teacher에서 student로 기억 데이터 없이 지식만 증류할 수 있는가?

---

## 5. 메모리제이션 탐지 기법

저자들은 탐지 기법을 3개 범주로 분류한다: **추출 기반(Extraction)**, **분류 기반(Classification)**, **학습 프롬프팅(Learned-Prompting)**.

### 5.1 Divergence Attack (추출 기반)

정렬된 모델을 정렬 전 상태로 되돌려, 기억된 학습 데이터를 high-likelihood로 방출하게 만든다 (Nasr et al., 2023). 일반 쿼리 대비 **150배**까지 verbatim 시퀀스 증가. 프롬프트가 사전학습 시 end-of-text 토큰과 유사한 디코딩을 유도하는 것이 핵심. Black-box 접근만 필요하지만, 모델별 효과가 다르고 패치 가능하며 전이성이 제한적이다.

### 5.2 Prefix-based Data Extraction (추출 기반)

알려진 학습 데이터 prefix로 모델에 쿼리하여 verbatim completion을 관찰 (Carlini et al., 2021 최초 시연, Lee et al., 2022 체계화). 구조화된 prefix(이메일 헤더, 문서 시작 등)가 특히 효과적. 학습 데이터 접근이 필수적이며, verbatim 복제만 탐지 가능하다는 한계가 있다.

### 5.3 Membership Inference Attack (분류 기반)

모델 출력(loss, perplexity 등)을 기반으로 데이터가 학습셋에 포함되었는지 분류한다. 주요 기법들:

- **Loss 기반** (Yeom et al., 2018): 낮은 loss = 학습 데이터일 가능성
- **Reference Loss** (Carlini et al., 2021): 참조 모델과의 loss 차이로 입력 난이도 보정
- **zlib entropy**: loss를 zlib 압축 크기로 정규화
- **Neighborhood Attack** (Mattern et al., 2023): 입력의 미세 변형과 loss 비교
- **Min-K% Prob** (Shi et al., 2023): 가장 불확실한 k% 토큰의 예측 신뢰도

**핵심 한계:** MIA는 per-instance 지표로서 통계적 타당성이 부족하다. True null distribution 구성이 불가능하여 false positive rate를 의미 있게 추정할 수 없다 (Duan et al., 2024; Zhang et al., 2025). 따라서 MIA는 **개별 학습 데이터 포함 증거가 아닌 집계 수준 프라이버시 감사 도구**로 재정립해야 한다.

### 5.4 Soft Prompting (학습 프롬프팅)

학습 가능한 연속 벡터를 입력에 prepend하여 기억된 콘텐츠 추출을 최대화/최소화하는 최적 프롬프트를 학습한다. 기억 누출을 9.3% 증폭하거나 97.7% 억제할 수 있다 (Ozdayi et al., 2023). 모델 간 전이 가능한 프롬프트도 발견됨 (Kim et al., 2023, ProPILE). Dynamic soft prompting은 입력 컨텍스트에 조건화하여 더 높은 기억 탐지율을 달성한다. 그러나 **완전한 white-box 접근이 필요하고 계산 비용이 극도로 높아** 실용적 공격 벡터로서는 한계가 있다.

### 5.5 Reasoning과 기억의 경계

Large Reasoning Model(LRM)의 등장으로 "모델이 실제로 추론하는가, 기억된 패턴을 재생산하는가"의 구분이 중요해지고 있다. 표면적으로 유사하지만 다른 전략이 필요한 perturbation에서 모델이 실패하는 경우, 이는 brittle한 패턴 매칭에 의존하고 있음을 시사한다 (Huang et al., 2025).

### Open Questions (탐지)

1. 학습 데이터 접근 없이 기억을 신뢰성 있게 탐지할 수 있는가?
2. In-context 정보 vs. parametric memory에서 온 출력을 어떻게 귀속시키는가?
3. 의미적(semantic) 기억을 어떻게 탐지하는가?
4. 기억된 추론 shortcut과 일반화 가능한 문제 해결 능력을 어떻게 구분하는가?

---

## 6. 메모리제이션 완화 전략

완화는 **학습 시점(Training-Time)**, **학습 후(Post-Training)**, **추론 시점(Inference-Time)**의 3단계로 분류된다.

### 6.1 Training-Time 개입

**Data Cleaning (데이터 정제)**
- **중복 제거:** 반복 시퀀스에 대한 과적합을 줄이는 암묵적 정규화 (Carlini et al., 2021; Lee et al., 2022)
- **PII 스크러빙:** 희귀하지만 고위험인 기억 대상을 학습 데이터에서 제거. CARDINAL, DATE, PERSON 등 카테고리별 규칙 기반 + ML 기반 제거 (Lukas et al., 2023)
- **저작권 콘텐츠 필터링:** DP 개념을 확장하여 bounded memorization budget으로 near-exact 복사 완화에 대한 provable certificate 제공 (Vyas et al., 2023)

**Differential Privacy (차분 프라이버시)**

DP-SGD는 per-example gradient clipping + 보정된 가우시안 노이즈 주입으로 프라이버시를 보장한다. LLM은 사전학습된 표현 위에서 DP-SGD에 높은 내성을 보여, non-private 베이스라인에 근접하는 성능을 달성한다 (Li et al., 2021). CRT(Confidentially Redacted Training)는 중복 제거 + 수정 + DP-SGD를 결합한다 (Zhao et al., 2022).

**DP의 주요 과제:**
- 엄격한 프라이버시 예산은 성능 저하를 야기
- 웹 스케일 데이터에서 "group size"(개인 데이터 출현 횟수) 정의가 어려워 보장 강도가 불명확
- PEFT + DP 조합이 유망하나 (Ma et al., 2024), 소수 파라미터에 노이즈가 집중되어 프라이버시 보호가 약화될 수 있다는 가설 존재
- User-level DP 보장도 필요 (Chua et al., 2024)

### 6.2 Post-Training 개입

**Machine Unlearning (기계 학습 삭제)**

특정 학습 데이터의 영향을 제거하여, 해당 데이터가 없었던 것처럼 모델을 만드는 것이 목표. Gradient ascent, negative re-labeling, adversarial sampling 등의 approximate unlearning 방법은 재학습 대비 10^5배 이상 효율적이지만 (Yao et al., 2024), DP와 달리 **공식적 보장이 없어** 기억 지속 위험이 존재한다.

**ParaPO**

사전학습 코퍼스에서 기억된 데이터를 식별한 뒤, 별도 LLM으로 요약을 생성하여 (기억된 시퀀스, 요약) 쌍으로 DPO를 수행. 의도치 않은 기억은 감소시키면서 원하는 verbatim recall(직접 인용 등)은 보존하지만, 수학/추론 벤치마크에서 약간의 유틸리티 감소가 발생한다 (Chen et al., 2025).

**Model Alignment**

Instruction tuning과 RLHF는 정상적 프롬프트로 기억된 데이터가 추출되는 것을 줄이지만, divergence 기반 프롬프팅이나 표적 파인튜닝으로는 여전히 유도 가능하다. **정렬은 기억의 접근성을 낮추지 기억 자체를 제거하지 않는다** — safety/utility와 진정한 privacy/unlearning의 핵심적 차이이다.

### 6.3 Inference-Time 개입

**MemFree Decoding**

Bloom filter로 학습 데이터의 모든 n-gram을 표현하여, 생성 중 기억된 시퀀스를 실시간 필터링한다 (Ippolito et al., 2023). 한계: near-identical n-gram 미탐지, 학습 n-gram 데이터 접근 필요.

**TokenSwap**

토큰 수준 개입으로 기억된 시퀀스를 파괴하는 경량 방법. 학습 코퍼스나 모델 가중치 접근 없이 작동하며 HuggingFace 등과 쉽게 통합 가능한 plug-and-play 솔루션.

**Activation Steering**

추론 중 내부 활성화에 표적 perturbation을 주입하여 기억된 시퀀스 생성을 억제/방향 전환. Sparse autoencoder로 기억 관련 활성화 패턴을 식별하여 **60%까지 기억 감소**, 최소한의 성능 저하 (Suri et al., 2025).

기억의 **지역화(localization)** 연구도 중요하다: 특정 attention head(초기 레이어의 단일 head)가 학습 중 본 드문 토큰 조합에 반응하여 verbatim recall을 트리거하며, 0.5% 미만의 뉴런 제거로 기억 정확도가 ~60% 하락하는 결과가 보고되었다 (Chang et al., 2023; Stoehr et al., 2024). 그러나 하나의 기억에 관련된 뉴런이 다른 기억에도 기여하므로, 기억별 개입 시 collateral forgetting 위험이 있다.

### Open Questions (완화)

1. DP 학습을 어떻게 스케일업하며, 비용과 유틸리티 트레이드오프는?
2. DP가 PEFT의 기억 감소를 어떻게 개선할 수 있는가?
3. 기억 제거를 위한 activation steering을 어떻게 최적화하는가?
4. Post-training 방법으로 유틸리티를 보존하면서 기억을 줄이는 방법은?
5. RLHF 중 memorization-detecting reward model을 온라인으로 통합할 수 있는가?
6. 기억이 유틸리티/일반화에 언제 기여하고 언제 해치는가?
7. 기억 완화가 hallucination이나 toxic stereotype 등 다른 유해 행동에도 영향을 미치는가?

---

## 7. 논문에서 언급하는 주요 데이터셋/벤치마크 정리

이 서베이에서는 메모리제이션 연구에 사용되는 다양한 데이터셋과 벤치마크를 참조한다. 이를 **학습 코퍼스**, **MIA/탐지 벤치마크**, **평가 도구**로 정리한다.

### 7.1 학습 코퍼스 (Training Corpora)

| 데이터셋 | 설명 | 관련 모델 | 메모리제이션 연구에서의 역할 |
|---------|------|----------|------------------------|
| **The Pile** (Gao et al., 2020) | EleutherAI가 구축한 800GB+ 영어 텍스트 코퍼스. 학술 논문, 코드, 웹텍스트, **Books3(저작권 도서)** 등 다양한 소스로 구성 | Pythia, LLaMA 1 | 저작권 침해의 핵심 증거 — Books3 섹션에서 Harry Potter, Dr. Seuss 등의 저작물이 verbatim 재생산됨. Pile의 train/test 분할은 MIA 벤치마크로도 활용 |
| **Dolma** (Soldaini et al., 2024) | Ai2가 공개한 3조 토큰 규모의 영어 코퍼스. 책, 과학논문, 코드, 소셜미디어 등 | OLMo | 오픈소스 학습 데이터가 공개된 모델에서 메모리제이션 연구가 가능한 대표적 사례 |
| **TÜLU Mix** (Wang et al., 2023) | GPT-4 Alpaca, OASST1, Dolly, Code Alpaca, ShareGPT 등의 instruction-tuning 데이터셋 혼합 | TÜLU 1/1.1 | **파인튜닝 메모리제이션** 연구의 핵심 데이터. SFT 단계에서의 기억 동역학과 head-only vs. adapter 기반 파인튜닝 비교 연구에 활용 |
| **GPT-2 학습 데이터** (WebText) | OpenAI Reddit 링크 기반 웹 텍스트 | GPT-2 | Carlini et al. (2021)의 최초 학습 데이터 추출 공격 시연 대상. 수백 개의 기억된 예시를 복원하여 메모리제이션 연구의 시발점이 됨 |

### 7.2 MIA/탐지 벤치마크

| 벤치마크 | 제안자 | 설명 | 평가 대상 | 주요 발견/한계 |
|---------|--------|------|----------|--------------|
| **PatentMIA** | Zhang et al., 2024 | 특허 문서 기반 MIA 벤치마크. Divergence 기반 보정 방법으로 MIA 신뢰도 개선 주장 | 사전학습 데이터 멤버십 | Maini et al. (2024)이 **벤치마크 자체의 분포 이동(distributional shift)이 MIA 성능 향상의 아티팩트**임을 보여줌. MIA의 근본적 보정 문제가 해결되지 않았음을 시사 |
| **LLM-PBE** | Li et al., 2024 | Prefix 기반 추출의 프라이버시 위험 평가 툴킷/벤치마크 | 다양한 LLM의 PII 추출 취약성 | 구조화된 prefix(이메일 헤더, 문서 시작 등)가 기억된 시퀀스 유출에 특히 효과적임을 확인. 대형 모델일수록 추출 공격에 더 취약 |
| **Canary Insertion** | Carlini et al., 2019; Chua et al., 2024 | 학습 데이터에 고유한 "카나리아" 시퀀스를 삽입하여 기억 여부를 직접 측정하는 기법 | DP, 학습 기법의 프라이버시 보호 효과 | User-level DP가 record-level DP보다 카나리아 추출률을 더 낮춤. DP의 실질적 효과를 검증하는 표준 방법론 |
| **ProPILE** | Kim et al., 2023 | Soft prompt tuning 기반 PII 추출 프라이버시 감사 프레임워크 (white-box) | LLM의 PII 기억 정도 | 학습된 프롬프트가 모델 간 전이 가능하여, 일관된 기억 패턴이 존재함을 시사 |

### 7.3 저작권/기억 연구 핵심 데이터 소스

| 소스 | 맥락 | 논문에서의 역할 |
|------|------|--------------|
| **Books3 (The Pile 하위셋)** | 저작권이 있는 도서 컬렉션. PILE 데이터셋의 일부 | Henderson et al. (2023), Zhang et al. (2022)이 Harry Potter, Dr. Seuss 등의 첫 몇 페이지가 verbatim으로 재생산됨을 보여줌. NYT v. Microsoft 소송 등 법적 분쟁의 기술적 근거 |
| **New York Times 기사** | NYT의 저작권 보호 기사 | NYT v. Microsoft/OpenAI 소송의 핵심 — ChatGPT가 NYT 기사 구절을 재생산할 수 있다는 주장. Freeman et al. (2024)이 소송 주장의 기술적 분석 수행 |
| **GitHub 코드** | 오픈소스 코드 저장소 | Doe v. GitHub 소송 — Copilot이 코드를 verbatim 재생산하여 DMCA 위반이라는 주장 |

### 7.4 메모리제이션 연구에 사용되는 주요 모델 패밀리

논문에서 메모리제이션 연구 대상으로 반복 언급되는 모델들:

| 모델 패밀리 | 연구에서의 역할 |
|-----------|--------------|
| **GPT-2** (OpenAI) | 최초의 학습 데이터 추출 공격 대상. 메모리제이션 연구의 시작점 |
| **Pythia** (EleutherAI, 70M-12B) | 학습 데이터(Pile)가 공개되어 있어 메모리제이션 스케일링 법칙 연구에 핵심. 중간 체크포인트도 공개되어 학습 동역학 분석 가능 |
| **LLaMA 1** (Meta, 7B-65B) | 모델 크기에 따른 메모리제이션 스케일링 연구. Pile 학습 데이터 일부 포함 |
| **ChatGPT/GPT-3.5/GPT-4** (OpenAI) | Divergence attack의 주요 대상. 정렬(alignment)이 기억 접근성을 줄이지만 기억 자체를 제거하지 못함을 보여줌 |
| **OLMo** (Ai2, 1B/7B) | 학습 데이터(Dolma)가 완전 공개된 오픈 모델. 투명한 메모리제이션 연구 가능 |
| **TÜLU 1/1.1** (UW) | 파인튜닝 메모리제이션 연구. TÜLU Mix의 멤버/비멤버 데이터로 파인튜닝 단계 기억 분석 |

> **핵심 관찰:** 메모리제이션 연구에서 가장 중요한 데이터셋 조건은 **학습 데이터가 공개된 모델**의 존재이다. Pythia(Pile), OLMo(Dolma)처럼 학습 데이터가 알려진 모델에서만 ground truth 기반의 엄밀한 메모리제이션 측정이 가능하다. GPT-4 같은 클로즈드 모델은 학습 데이터가 비공개이므로, 간접적 방법(MIA, extraction attack)에 의존해야 하며 이는 근본적 한계를 가진다.

---

## 8. 프라이버시 및 법적 리스크

### 8.1 개인정보 유출

학습 데이터의 PII가 adversarial 프롬프팅을 통해 추출될 수 있다. 신경 피싱 공격은 사전학습 중 포이즌을 주입하여 파인튜닝 시 PII 유출 성공률 50%를 달성했다 (Panda et al., 2024). 의료/고객 서비스 산업에서 기밀성 기대치 위반은 현행 프라이버시 규정 하에서 상당한 책임을 야기한다.

### 8.2 저작권/독점 콘텐츠

오픈소스 LLM(EleutherAI의 PILE 데이터셋 내 Books3 섹션)에서 Harry Potter나 Dr. Seuss의 책을 verbatim으로 재생산하는 사례가 확인되었다 (Henderson et al., 2023; Zhang et al., 2022).

### 8.3 법적 지형

진행 중인 핵심 소송들:
- **NYT v. Microsoft/OpenAI:** 저작권 있는 기사로 학습 + 기사 구절 재생산이 대규모 저작권 침해라는 주장
- **Chabon v. OpenAI:** 저자들의 저작권 침해 주장
- **Doe v. GitHub:** Copilot의 verbatim 코드 재현이 DMCA 위반이라는 주장

이 소송들은 LLM 메모리제이션을 기술적 관심사에서 **공공 정책과 비즈니스 영역**으로 전환시키고 있다.

### Open Questions (법적)

1. LLM을 저작권 콘텐츠를 기억하지 않도록 학습시킬 수 있는가?
2. 기억 메트릭이 법적 분석(공정 이용, 저작권)에 어떻게 정보를 제공할 수 있는가?
3. 법적으로 유의미한 기억의 기술적 임계값은 무엇인가?

---

## 9. 핵심 메시지 정리

1. **메모리제이션은 버그가 아니라 데이터 압축의 misaligned feature이다.** 모델 유틸리티와 프라이버시 간의 근본적 긴장을 만든다.

2. **정의의 파편화가 핵심 장벽이다.** Verbatim completion과 MIA가 모순된 결과를 낼 수 있으며, 메트릭을 명시하지 않은 기억 동역학 주장은 사실상 "ill-defined"이다.

3. **학습 단계별로 다른 위험이 존재한다.** Pre-training에서 데이터 무결성 문제로 도입 → SFT에서 "memorization circuits"로 집중 → RLHF에서 보상 모델에 의해 인센티브화 → Distillation에서 상속으로 전파. 단일 사후 수정이 아닌 **각 단계 맞춤형 개입**이 필요하다.

4. **탐지 방법은 증상 식별에서 진정한 knowledge attribution으로 진화해야 한다.** MIA는 집계 수준 도구로 재정립되어야 하며, semantic 기억 탐지와 reasoning 기억 탐지가 새로운 프론티어이다.

5. **완화는 제거가 아닌 선택적 통제를 목표로 해야 한다.** 유익한 사실 기억과 유해한 instance-specific 재생산을 분리하는 "principled, selective control"이 핵심 목표이다.

6. **법적 지형이 급격히 변화 중이다.** 기술적 메모리제이션 메트릭이 법적 논의(fair use, substantial similarity)에 직접 연결될 필요가 있다.
