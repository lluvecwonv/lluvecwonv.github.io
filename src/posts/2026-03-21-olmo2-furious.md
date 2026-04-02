---
title: "OLMo 2: A New Milestone in Fully Open Language Models (2 OLMo 2 Furious)"
date: "2026-03-21"
summary: "Allen Institute for AI(Ai2)의 OLMo 2는 7B, 13B, 32B 파라미터의 완전 오픈소스 언어 모델로, 학습 데이터/코드/체크포인트를 모두 공개하면서도 Qwen 2.5, Llama 3.1 등 기존 오픈웨이트 모델과 경쟁력 있는 성능을 달성했다."
tags: ["LLM", "OLMo", "Open Source", "Pretraining", "Post-Training", "RLVR"]
category: "논문 리뷰"
language: "ko"
---

# OLMo 2: 완전 오픈소스 LLM의 새로운 이정표

**논문**: 2 OLMo 2 Furious
**저자**: OLMo Team (Allen Institute for AI)
**링크**: [arXiv 2501.00656](https://arxiv.org/abs/2501.00656)
**상태**: 공개 (2025년 1월)

---

## 1. 개요

OLMo 2는 Allen Institute for AI(Ai2)에서 개발한 **완전 오픈소스(fully open)** 대규모 언어 모델 패밀리로, **7B, 13B, 32B** 파라미터 규모의 dense autoregressive 모델을 포함한다. "완전 오픈소스"란 모델 가중치뿐 아니라, **학습 데이터, 학습 코드, 평가 코드, 중간 체크포인트, 학습 로그**까지 모두 공개한다는 의미이다.

OLMo 2의 핵심 기여는 다음과 같다:

1. **학습 안정성 개선**: RMSNorm, QK-norm, Z-Loss, reordered norm 등 아키텍처 수정으로 loss spike와 gradient norm 발산을 해결
2. **2단계 학습 레시피**: 대규모 웹 데이터 pretraining 후 고품질 Dolminos 데이터로 mid-training
3. **모델 수프(souping)**: 동일 데이터의 서로 다른 순서로 여러 번 mid-training 후 가중치를 평균
4. **Tülu 3 기반 post-training**: SFT → DPO → RLVR의 3단계 후처리

![OLMo 2 Pareto Frontier](/images/olmo2/olmo2.png)
*Figure 1: OLMo 2는 fully-open 모델 중 최고 성능을 달성하며, 오픈웨이트 모델과 비교해도 학습 FLOPs 대비 경쟁력 있는 성능을 보인다.*

---

## 2. 모델 아키텍처

OLMo 2는 decoder-only transformer 아키텍처를 기반으로 하며, 이전 OLMo 대비 학습 안정성을 위한 주요 변경사항이 있다.

### 2.1 OLMo에서 OLMo 2로의 변화

**기본 설계 (OLMo 1에서 유지)**:
- No biases: 모든 bias term 제거
- SwiGLU 활성화 함수 (hidden size ≈ 8/3 d, 128의 배수로 올림)
- RoPE (Rotary Positional Embeddings)

**OLMo 2에서 추가된 안정성 개선**:
- **RMSNorm**: 기존 non-parametric LayerNorm 대신 RMSNorm 사용
- **Reordered norm**: attention/MLP의 입력이 아닌 **출력**을 정규화 (Swin Transformer V2에서 제안)
- **QK-norm**: attention 계산 전 query, key를 RMSNorm으로 정규화
- **Z-Loss**: 최종 출력 logit이 과도하게 커지는 것을 방지하는 정규화
- **RoPE θ = 500,000**: 기존 10,000에서 증가하여 positional encoding 해상도 향상

### 2.2 모델 크기별 하이퍼파라미터

| 항목 | OLMo 2 7B | OLMo 2 13B | OLMo 2 32B |
|------|-----------|------------|------------|
| Layers | 32 | 40 | 64 |
| Hidden Size | 4096 | 5120 | 5120 |
| Attention Heads (Q/KV) | 32/32 (MHA) | 40/40 (MHA) | 40/8 (GQA) |
| Batch Size | 1024 | 2048 | 2048 |
| Sequence Length | 4096 | 4096 | 4096 |
| Peak LR | 3.0×10⁻⁴ | 9.0×10⁻⁴ | 6.0×10⁻⁴ |
| 총 학습 토큰 | 4.05T | 5.6T | 6.6T |

32B 모델에서는 MHA 대신 **GQA (Grouped Query Attention)**를 채택하여 효율성을 높였다.

### 2.3 토크나이저

OLMo 2는 GPT-3.5/GPT-4의 `cl100k` 토크나이저를 차용했다 (Apache 2.0 라이선스). 기존 OLMo 토크나이저 대비 vocabulary가 더 크며, 1B 모델 100B 토큰 학습 시 OLMES +0.8, MMLU +0.4의 성능 향상을 보였다.

---

## 3. 학습 데이터

### 3.1 Stage 1: Pretraining Data (OLMo Mix)

Pretraining에는 약 **3.9조(3.9T) 토큰**이 사용되며, 95% 이상이 웹 데이터이다.

| 소스 | 타입 | 토큰 |
|------|------|------|
| DCLM-Baseline | 웹 페이지 | 3.71T |
| StarCoder (필터링) | 코드 | 83.0B |
| peS2o | 학술 논문 | 58.6B |
| arXiv | STEM 논문 | 20.8B |
| OpenWebMath | 수학 웹 | 12.2B |
| Algebraic Stack | 수학 증명 코드 | 11.8B |
| Wikipedia & Wikibooks | 백과사전 | 3.7B |
| **합계** | | **3.90T** |

코드 데이터(StarCoder)에서는 GitHub 별 2개 미만 레포를 제거하고, 반복 n-gram이 있는 문서를 필터링했다.

### 3.2 Stage 2: Mid-training Data (Dolminos)

Mid-training 데이터는 **고품질 웹 + 도메인 특화 데이터**로 구성된다.

**High Quality Subset** (~832.6B 토큰):
- DCLM-Baseline (FastText top 7%, FineWeb ≥ 2 필터) — 752B
- FLAN (decontaminated) — 17.0B
- peS2o — 58.6B
- Wikipedia — 3.7B
- Stack Exchange (Q&A) — 1.26B

**Math Mix** (~10.7B 토큰):
- TuluMath (합성 수학) — 230M
- DolminoSynthMath — 28.7M
- TinyGSM-MIND (합성, 자연어 재작성) — 6.48B
- MathCoder2 Synth Books — 3.87B
- Metamath, CodeSearchNet, GSM8K Train 등

---

## 4. 학습 안정성 (Deep Dive: Training Stability)

이전 OLMo (OLMo April)는 학습 중 **loss spike**와 **gradient norm의 느린 증가** 문제가 있었다. OLMo 2에서는 이를 체계적으로 해결했다.

![Training Loss and Gradient Norm](/images/olmo2/mitchishvpeteish-v2.png)
*Figure 2: OLMo April vs OLMo 2의 학습 loss 및 gradient norm 비교. OLMo 2에서 spike가 크게 감소했다.*

### 4.1 반복 n-gram 필터링

학습 배치 조사 결과, loss spike 발생 시 반복 n-gram 시퀀스가 많이 포함되어 있음을 발견했다. 32개 이상의 반복 n-gram(1~13 토큰)을 포함하는 문서를 데이터에서 제거하고, 학습 중에도 해당 시퀀스의 loss를 마스킹했다.

![N-gram Filter Effect](/images/olmo2/without_data_filter_gnorm.png)
*Figure 3a: n-gram 필터 미적용 시 gradient norm*

![N-gram Filter Effect](/images/olmo2/with_data_filter_gnorm.png)
*Figure 3b: n-gram 필터 적용 시 gradient norm — 스파이크가 크게 감소*

### 4.2 초기화 (Initialization)

OLMo 2에서는 모든 파라미터를 평균 0, 표준편차 0.02의 정규분포로 초기화한다. 이전 방식(scaled initialization)에서는 레이어가 깊어질수록 값이 작아져 불안정성을 야기했다.

![Initialization Comparison](/images/olmo2/inits.png)
*Figure 4: OLMo April 초기화 vs OLMo 2 초기화 비교. OLMo 2 초기화가 훨씬 안정적이다.*

### 4.3 QK-norm과 Reordered Norm

QK-norm은 attention logit이 과도하게 커지는 것을 방지한다. Reordered norm은 attention/MLP의 **출력**을 정규화하여 학습을 안정시킨다.

![QK-norm and Reordered Norm](/images/olmo2/qk_norm_reorder.png)
*Figure 5: QK-norm과 reordered norm의 효과*

### 4.4 Z-Loss

Z-Loss는 최종 출력 logit의 크기를 제한하는 정규화 항으로, 학습 안정성에 기여한다.

![Z-Loss Effect](/images/olmo2/zloss.png)
*Figure 6: Z-Loss 적용 효과*

### 4.5 기타: Weight Decay, AdamW ε

- **Weight decay**: 임베딩에 weight decay를 적용하지 않음으로써 gradient norm 증가 문제 해결
- **AdamW ε**: 10⁻⁵에서 **10⁻⁸**로 낮춤으로써 학습 안정성 향상

---

## 5. Mid-training Deep Dive

### 5.1 Learning Rate Schedule

Mid-training 단계에서는 pretraining의 cosine schedule 이후 남은 learning rate에서 **선형으로 0까지 감소**시킨다.

![Learning Rate Schedules](/images/olmo2/learningrates.png)
*Figure 7: 다양한 learning rate schedule 비교*

### 5.2 Microanneal 실험

수학 데이터의 품질을 효율적으로 평가하기 위해 **microanneal** 기법을 사용했다.

**실험 1 — 도메인 특화 데이터는 소량이라도 효과적**: math/DCLM 비율 35/65에서 GSM* 63.5, 10/90에서도 61.0 달성 (baseline 28.5)

**실험 2 — 적절한 중복은 도움이 됨**: 수학 데이터를 2배 중복 시 GSM* 66.0, 4배 시 65.0

**실험 3 — 자연어 재작성의 효과**: TinyGSM 코드 버전은 GSM* 25.0으로 오히려 하락했지만, MIND 재작성 버전은 65.5로 크게 향상

### 5.3 모델 수프 (Model Souping)

동일한 mid-training 데이터의 서로 다른 랜덤 순서로 여러 번 학습한 후, 결과 모델들의 **가중치를 평균**한다.

- **7B**: 50B 토큰 × 3회 → 3개 평균
- **13B, 32B**: 100B 토큰 × 3회 + 300B 토큰 × 1회 → 4개 평균

6가지 mid-training mix에서 실험한 결과, souping은 항상 단일 최고 체크포인트와 동등하거나 더 나은 성능을 보였다.

---

## 6. Post-training (Tülu 3 레시피)

Post-training은 **Tülu 3** 레시피를 기반으로 3단계로 진행된다.

### 6.1 Supervised Finetuning (SFT)

PersonaHub 방법론 기반 합성 데이터 + 기존 고품질 instruction 데이터셋을 사용. 7B/13B 모델용 mix는 939,104개 프롬프트, 1B/32B 모델용 mix는 866,138개 프롬프트.

### 6.2 Direct Preference Optimization (DPO)

20개의 다양한 모델 풀에서 응답을 생성하고, GPT-4o를 LM judge로 사용하여 합성 선호도 데이터를 생성. On-policy 데이터(개발 중인 OLMo 2 SFT 모델의 출력)도 포함.

### 6.3 Reinforcement Learning with Verifiable Rewards (RLVR)

정답 검증이 가능한 도메인(수학 문제 등)에서 PPO를 사용하여 학습. 32B 모델에서는 reward model이 필요 없는 **GRPO**를 사용.

![RLVR Training Curves (13B)](/images/olmo2/combined_plots.png)
*Figure 8: OLMo 2 13B Instruct의 RLVR 학습 곡선. 3단계에 걸친 RLVR로 GSM8K, MATH 성능이 점진적으로 향상.*

### 6.4 Post-training 단계별 성능

| 모델 | Stage | Avg | GSM8K | MATH | MMLU | IFEval | Safety |
|------|-------|-----|-------|------|------|--------|--------|
| OLMo 2 7B | SFT | 51.4 | 74.6 | 25.3 | 61.1 | 66.9 | 94.6 |
| OLMo 2 7B | DPO | 55.9 | 82.6 | 30.3 | 60.8 | 73.0 | 93.7 |
| OLMo 2 7B | **Instruct** | **56.5** | **85.1** | **32.5** | **61.3** | 72.3 | 93.3 |
| OLMo 2 13B | SFT | 56.6 | 76.3 | 29.5 | 68.0 | 68.6 | 94.3 |
| OLMo 2 13B | DPO | 62.0 | 82.3 | 35.2 | 67.9 | 80.2 | 90.3 |
| OLMo 2 13B | **Instruct** | **63.4** | **87.4** | **39.2** | **68.5** | 82.6 | 89.7 |
| OLMo 2 32B | SFT | 61.7 | 78.4 | 35.9 | 76.1 | 72.4 | 93.8 |
| OLMo 2 32B | DPO | 68.8 | 85.7 | 46.8 | 78.0 | 83.8 | 91.9 |
| OLMo 2 32B | **Instruct** | **68.8** | **87.6** | **49.7** | 77.3 | **85.6** | 85.9 |

---

## 7. 실험 결과

### 7.1 Base Model 평가

OLMES 평가 스위트를 사용하여 평가했으며, development 벤치마크와 **held-out 평가**(개발 중 사용하지 않은 태스크)를 구분했다.

| 모델 | Avg | FLOPs(×10²³) | MMLU | ARC_C | HSwag | GSM8K | MMLU_PRO | TriviaQA |
|------|-----|--------------|------|-------|-------|-------|----------|----------|
| Llama 3.1 8B | 61.8 | 7.2 | 66.9 | 79.5 | 81.6 | 56.5 | 34.7 | 80.3 |
| Qwen 2.5 7B | 67.4 | 8.2 | 74.4 | 89.5 | 89.7 | 81.5 | 45.8 | 69.4 |
| Gemma 2 9B | 67.8 | 4.4 | 70.6 | 89.5 | 87.3 | 70.1 | 42.0 | 81.8 |
| **OLMo 2 7B** | **62.9** | **1.8** | 63.7 | 79.8 | 83.8 | 67.5 | 31.0 | 78.0 |
| **OLMo 2 13B** | **68.3** | **4.6** | 67.5 | 83.5 | 86.4 | 75.1 | 35.1 | 81.9 |
| **OLMo 2 32B** | **73.3** | **13.0** | 74.9 | 90.4 | 89.7 | 78.8 | 46.9 | 88.0 |
| Llama 3.1 70B | 75.5 | 64.0 | 79.2 | 93.1 | 87.6 | 80.6 | 47.1 | 92.2 |

**핵심 발견**: OLMo 2 모델은 **학습 FLOPs 대비** 매우 경쟁력 있는 성능을 달성. OLMo 2 7B는 1.8×10²³ FLOPs로 Llama 3.1 8B(7.2×10²³)와 유사한 성능. OLMo 2 32B는 13.0×10²³ FLOPs로 Llama 3.1 70B(64.0×10²³)에 근접하는 성능.

### 7.2 Mid-training 전후 비교

| 모델 | 단계 | Avg | MMLU | GSM8K | DROP |
|------|------|-----|------|-------|------|
| OLMo 2 1B | Pretraining | 31.9 | 26.9 | 3.3 | 25.1 |
| OLMo 2 1B | + Mid-training | **43.7** | **44.3** | **43.8** | **34.0** |
| OLMo 2 7B | Pretraining | 53.0 | 59.8 | 24.1 | 40.7 |
| OLMo 2 7B | + Mid-training | **62.9** | **63.7** | **67.5** | **60.8** |
| OLMo 2 13B | Pretraining | 58.9 | 63.4 | 37.3 | 49.6 |
| OLMo 2 13B | + Mid-training | **68.3** | **67.5** | **75.1** | **70.7** |

Mid-training의 효과는 작은 모델일수록 더 크며(1B: +37.0%, 7B: +18.7%, 13B: +15.9%, 32B: +12.3%), 특히 **수학 성능(GSM8K)**에서 극적인 향상을 보인다.

### 7.3 Instruct Model 평가

| Instruct Model | Avg | AlpacaEval 2 | BBH | GSM8K | IFEval | MATH | MMLU | Safety |
|----------------|-----|-------------|-----|-------|--------|------|------|--------|
| GPT-4o Mini | 65.7 | 49.7 | 65.9 | 83.0 | 83.5 | 67.9 | 82.2 | 84.9 |
| Llama 3.1 8B Instruct | 59.1 | 25.8 | 71.9 | 83.4 | 80.6 | 42.5 | 71.3 | 70.2 |
| Qwen 2.5 7B Instruct | 61.6 | 29.7 | 70.2 | 83.8 | 74.7 | 69.9 | 76.6 | 75.0 |
| **OLMo 2 7B Instruct** | **56.5** | 29.1 | 51.4 | 85.1 | 72.3 | 32.5 | 61.3 | **93.3** |
| **OLMo 2 13B Instruct** | **63.5** | 39.5 | 63.0 | 87.4 | 82.6 | 39.2 | 68.5 | **89.7** |
| **OLMo 2 32B Instruct** | **68.8** | 42.8 | 70.6 | 87.6 | 85.6 | 49.7 | 77.3 | 85.9 |

OLMo 2 Instruct 모델은 **Safety에서 특히 높은 점수**를 보이며, GSM8K에서도 매우 강한 성능을 달성. OLMo 2 32B Instruct는 Qwen 2.5 72B Instruct(Avg 68.8)와 동등한 평균 성능을 1/6의 파라미터로 달성.

---

## 8. 인프라

### 8.1 클러스터

OLMo 2는 두 개의 클러스터에서 학습되었다:

- **Jupiter** (Austin, TX): 128노드, 1024× NVIDIA H100 GPU (80GB HBM3), InfiniBand 400Gbps × 8 per node, PUE 1.2
- **Augusta** (Council Bluffs, IA): 160노드, Google Cloud A3 Mega VM, GPUDirect-TCPXO, PUE 1.12

### 8.2 효율성 최적화

- **torch.compile()**: 개별 PyTorch 연산의 Python 오버헤드를 제거
- **Host-device sync 최소화**: 비동기 텐서 복사, GPU→CPU 전송 최소화
- **비동기 부기 작업**: 메트릭 로깅과 체크포인팅을 별도 스레드에서 비동기 수행
- **명시적 Python GC**: 분산 학습에서 자동 가비지 컬렉션을 비활성화하고, 모든 프로세스에서 동시에 수동 실행

![Garbage Collection Performance](/images/olmo2/gc-perf.png)
*Figure 9: 자동 vs 수동 가비지 컬렉션의 처리량 비교. 수동 GC가 더 안정적이고 빠르다.*

### 8.3 환경 영향

OLMo 2 7B + 13B 학습에 약 **391 MWh의 에너지**를 소비하였으며, 약 **154 tCO₂eq**의 탄소를 배출하고, 약 **110만 리터**의 물을 소비한 것으로 추정된다.

---

## 9. 결론

OLMo 2는 완전 오픈소스 언어 모델이 상업적 오픈웨이트 모델과 경쟁할 수 있음을 보여준다. 학습 안정성 개선, 2단계 학습 레시피, 모델 수프, Tülu 3 기반 post-training 등의 기술을 통해, 학습 FLOPs 대비 매우 효율적인 성능을 달성했다. 모든 학습/평가 코드, 데이터셋, 체크포인트, 로그가 공개되어 있어, LLM 연구의 재현성과 투명성에 크게 기여한다.
