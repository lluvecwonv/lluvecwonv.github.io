---
title: "Memorize to Forget: Gradient Ascent 없이 Model Extrapolation으로 Machine Unlearning 달성"
date: 2026-03-28
summary: "Gradient Ascent(GA)의 catastrophic collapse 문제를 회피하면서 Machine Unlearning을 달성하는 MOdel eXtrapolation(MOX) 방법론 제안. Forget set에 대해 GD로 memorization 모델을 학습한 뒤, reference 모델 방향으로 extrapolation하여 forget 모델을 획득. TOFU 벤치마크에서 평균 FQ 0.0677, MU 0.6528 달성하며 GA/NPO 대비 안정적 성능. MUSE에서도 Utility Preservation 54.8, Privacy Leakage -18.4로 최고 수준. ICLR 2026 투고 논문."
tags: [Machine Unlearning, LLM, Gradient Ascent, Model Extrapolation, Privacy, ICLR 2026, 연구노트]
category: 연구노트
language: ko
---

# Memorize to Forget: Machine Unlearning without Gradient Ascent via Model Extrapolation

**학회:** ICLR 2026 (Under Review)
**저자:** Zhuo Huang, Qizhou Wang, Ziming Hong, Shanshan Ye, Bo Han, Tongliang Liu
**arXiv:** [2602.06441](https://arxiv.org/abs/2602.06441)
**OpenReview:** [Forum](https://openreview.net/forum?id=iKqQGEOeej)

---

## 한 줄 요약

Gradient Ascent(GA)가 야기하는 catastrophic collapse를 근본적으로 회피하기 위해, forget set에 대한 **memorization 모델을 GD로 학습**한 뒤 reference 모델 방향으로 **model extrapolation**하여 forget 모델을 얻는 **MOX(MOdel eXtrapolation)** 방법론을 제안. GA를 전혀 사용하지 않으면서도 우수한 forgetting 성능과 model utility 보존을 동시에 달성.

---

## 1. 논문 개요 및 동기

Machine Unlearning(MU)은 LLM에서 민감한 정보, 개인 데이터, 저작권 콘텐츠를 제거하기 위한 핵심 기술이다. 가장 직관적인 접근법은 undesired 데이터 없이 처음부터 재학습하는 것이지만, LLaMA, Phi 등의 학습 비용(수백만 달러)을 고려하면 현실적으로 불가능하다.

이에 따라 **Gradient Ascent(GA)** 기반 방법이 주류를 이루고 있다. GA는 forget set에 대한 loss를 최대화하여 학습 과정을 역전시키는 방식이다. 하지만 GA에는 본질적인 문제가 존재한다:

**GA의 핵심 문제점:**

1. **Catastrophic Collapse:** GA는 loss maximization이 unbounded하여 학습이 불안정하고, 모델이 원래 reference 모델에서 크게 이탈한다.
2. **Model Utility 저하:** forget quality를 높이려 할수록 retain set에 대한 성능이 급격히 하락한다.
3. **학습 불안정성:** 다양한 loss reweighting(β) 수준에서도 GA는 항상 모델을 reference로부터 이탈시킨다.

저자들은 Figure 1을 통해 이를 실증적으로 보여준다:

![Figure 1: GA vs GD의 효과 비교](/figures/mox/figure1_ga_gd_effect.png)

Figure 1(a)에서 GA는 다양한 β 값에서 Model Utility가 급격히 하락하는 반면, GD는 안정적으로 유지된다. Figure 1(b)에서 GA는 KL Divergence가 크게 발산하여 reference 모델에서 이탈하지만, GD는 상대적으로 안정적이다. Figure 1(c)에서 memorization 모델의 forget quality는 낮지만, 그 counterpart인 forget 모델은 높은 forget quality를 달성한다.

이러한 관찰에서 핵심 질문이 도출된다: **GA의 많은 결함에도 불구하고, GA 없이 GD만으로 MU를 달성할 수 있는가?**

---

## 2. 방법론: MOX (MOdel eXtrapolation)

### 2.1 핵심 아이디어 — "Memorize to Forget"

MOX의 핵심 직관은 Task Arithmetic(Ilharco et al., 2022)에서 영감을 받았다. 특정 task에 대해 모델을 fine-tuning하면 task vector가 생성되는데, 이 vector를 **반대 방향으로 적용(negation)**하면 해당 task의 성능이 감소한다. 즉:

> 먼저 forget set에 대한 memorization을 강화한 뒤, extrapolation을 통해 반대 방향(forgetting)을 달성할 수 있다.

![Figure 2: MOX 방법론 도식](/figures/mox/figure2_methodology.png)

Figure 2는 MOX의 전체 과정을 보여준다:

**(a)** GA로 직접 θ_for를 얻으려 하면 pre-training 과정을 역전시키므로 학습이 불안정해진다(irreversible gradient 문제).

**(b)** 대신 GD로 forget set D_F를 memorize하여 θ_mem을 얻는다. Model extrapolation을 통해 θ_mem에서 θ_ref 방향으로 외삽하면, D_F의 지식을 성공적으로 잊는 θ_for를 얻을 수 있다.

**(c)** KL-divergence constraint를 추가하여 retain set D_R에 대한 prediction consistency를 유지하면, θ_for의 model utility가 더 향상된다.

**(d)** Targeted MU의 경우, 특정 target을 잊으면서 동시에 D_F를 memorize하는 loss를 결합한다.

### 2.2 수학적 정의

**Irreversible Gradient Criterion (Definition 1):**
Pre-trained 모델 θ가 optimization task Ψ를 통해 학습된 경우, Ψ의 gradient를 역전시키는 downstream fine-tuning은 피해야 한다. 이것이 GA를 사용하지 않는 이론적 근거이다.

**Memorization Objective (GA 기반):**

$$\mathcal{L}_{mem} = \frac{1}{n} \sum_{(x_j, y_j) \in \mathcal{D}_F} \mathcal{L}_{CE}(x_j, y_j, \theta) + \frac{1}{m} \sum_{(x_i, y_i) \in \mathcal{D}_R} \text{KL}(h_{\theta_{ref}}(y|x) \| h_\theta(y|x))$$

첫 번째 항은 forget set에 대한 memorization을 강화하고, 두 번째 항은 retain set에서 reference 모델과의 prediction consistency를 KL-divergence로 유지한다.

**NPO 기반 Memorization Objective:**

$$\mathcal{L}_{mem} = \frac{2}{n\beta} \sum_{(x_i, y_i) \in \mathcal{D}_F} \log \sigma(-\beta \log(\frac{h_\theta(y|x)}{h_{\theta_{ref}}(y|x)})) + \frac{1}{m} \sum_{(x_i, y_i) \in \mathcal{D}_R} \text{KL}(h_{\theta_{ref}}(y|x) \| h_\theta(y|x))$$

Preference Optimization을 활용하여 memorization을 수행할 수도 있다.

**Model Extrapolation:**

$$\theta_{for} := (1+\alpha)\theta_{ref} - \alpha\theta_{mem}, \quad \alpha \in \mathbb{R}^+$$

α는 extrapolation 강도를 조절하는 하이퍼파라미터이다. α가 클수록 forget quality가 향상되지만, 극단적으로 큰 값은 model utility를 저하시킨다. 다만 이 저하는 GA의 catastrophic collapse보다 훨씬 완만하고 예측 가능하다.

직관적으로 전개하면: θ_for = θ_ref + α(θ_ref − θ_mem)으로, task vector (θ_ref − θ_mem)을 α만큼 스케일링하여 θ_ref에 더한다. θ_mem이 memorize한 지식을 반대로 적용하므로 forgetting이 달성된다.

### 2.3 Targeted Unlearning

특정 target ỹ_i를 출력하도록 하는 targeted MU의 경우:

$$\mathcal{L} = \mathcal{L}_{mem} - \frac{1}{m} \sum_{(x_i, \tilde{y}_i) \in \mathcal{D}_R} \mathcal{L}_{CE}(x_i, \tilde{y}_i, \theta)$$

여기서 target을 memorize하는 것은 pre-training 과정을 역전시키지 않으므로 안전하게 적용 가능하다.

### 2.4 Momentum Extrapolation

Extrapolation이 학습 중 동적으로 수행될 수 있으므로, historical versions를 앙상블하여 forget 모델을 점진적으로 업데이트하는 momentum 기법을 도입한다:

$$\theta_{for}^t := \eta \theta_{for}^t + (1-\eta) \theta_{for}^{t-1}$$

η는 momentum 계수로 통상 0.675로 설정한다. 이는 generalization과 forget quality 모두를 향상시킨다.

### 2.5 MOX의 장점 정리

1. **Computation Stability:** GA를 사용하지 않으므로 catastrophic collapse나 task conflict가 없다.
2. **Adaptability:** GD 기반이므로 다양한 objective(GA loss, NPO loss 등)와 호환된다.
3. **Efficiency:** Extrapolation은 단순한 파라미터 연산이며, 학습 중 동적으로 배포 가능하다.

---

## 3. 실험 설정

### 3.1 벤치마크

**TOFU (Task of Fictitious Unlearning):** 200명의 가상 저자 프로필, 각 20개의 QA 쌍으로 구성. Forget Set, Retain Set, Real Authors, Real World의 4가지 데이터셋으로 지식 시뮬레이션. Forget ratio 1%, 5%, 10% 제공. 평가 메트릭: Forget Quality(FQ), Model Utility(MU), Forget Set의 ROUGE-L(F-RL), Retain Set의 ROUGE-L(R-RL).

**MUSE (Machine Unlearning Six-way Evaluation):** BBC 뉴스 코퍼스(2023년 8월 이후 수집) 사용. 4가지 메트릭: VerbMem on Forget Set(↓), KnowMem on Forget Set(↓), KnowMem on Retain Set(↑), PrivLeak(↓).

### 3.2 베이스라인

총 12개의 베이스라인과 비교:

- **GA 기반:** GA, KL, GAD, PO, AltPO, SimNPO, RMU
- **비 GA 기반:** NPO, TV (Task Vectors), LLMU, WHP (Who's Harry Potter), DPO
- 추가로 Original LLM과 Retrained LLM (전체 재학습)도 참고용으로 제시

### 3.3 모델 및 학습 세부사항

**사용 모델:** Llama2-7B, Phi-1.5B

**학습 설정:**
- Optimizer: AdamW (weight decay 0.01)
- Learning rate: 1e-5
- Batch size: 32
- Epochs: 10
- LR schedule: 첫 epoch linear warm-up 후 linear decay
- 기본 하이퍼파라미터: α = 4, η = 0.675
- α 탐색 범위: 0.5, 1.0, 2.0, 4.0, 8.0

**하드웨어:** 2× NVIDIA H100 GPU (또는 단일 A100/H100, 혹은 4× NVIDIA 4090)

**Phi-1.5B Fine-tuning:** Learning rate 2e-5, 5 epochs
**Llama2-7B Fine-tuning:** Learning rate 1e-5, 5 epochs

**평가 방식:** Wang et al.(2024) 방식에 따라 마지막 epoch 기준으로 보고 (학습 중 최적 성능이 아닌 최종 성능).

---

## 4. 실험 결과

### 4.1 TOFU 벤치마크 결과 (Table 1)

![Table 1: TOFU 벤치마크 비교](/figures/mox/table1_tofu.png)

| 방법 | FQ(↑) | MU(↑) | F-RL(↓) | R-RL(↑) | FQ(↑) | MU(↑) | F-RL(↓) | R-RL(↑) |
|------|--------|--------|---------|---------|--------|--------|---------|---------|
| **Base LLM** | **Llama2-7B** | | | | **Phi-1.5B** | | | |
| Original LLM | 0.0000 | 0.6346 | 0.9851 | 0.9833 | 0.0013 | 0.5184 | 0.9607 | 0.9199 |
| Retrained LLM | 1.0000 | 0.6267 | 0.4080 | 0.9833 | 1.000 | 0.5233 | 0.4272 | 0.9269 |
| GA | 0.0143 | 0.6333 | 0.4862 | 0.9008 | 0.0213 | 0.5069 | 0.5114 | 0.8048 |
| KL | 0.0168 | 0.6300 | 0.5281 | 0.9398 | 0.0120 | 0.5047 | 0.5059 | 0.8109 |
| GAD | 0.0268 | 0.6320 | 0.4773 | 0.8912 | 0.0215 | 0.5110 | 0.4996 | 0.8496 |
| PO | 0.0541 | 0.6308 | **0.3640** | 0.8811 | 0.0286 | 0.5127 | 0.3170 | 0.7468 |
| LLMU | 0.0541 | 0.6337 | 0.4480 | 0.8865 | 0.0286 | 0.5110 | **0.3058** | 0.7270 |
| NPO | 0.0068 | 0.6321 | 0.4632 | 0.8950 | 0.0030 | 0.5057 | 0.5196 | 0.8000 |
| TV | 0.0069 | 0.6340 | 0.4512 | **0.9810** | 0.0156 | 0.5012 | 0.4366 | 0.8810 |
| **MOX (α=4.0)** | **0.0625** | **0.6504** | 0.4697 | 0.9653 | **0.0582** | **0.5219** | 0.3138 | 0.8810 |
| **MOX (targeted)** | **0.0677** | 0.6412 | 0.4788 | 0.9710 | 0.0328 | 0.5012 | 0.3366 | 0.8858 |
| **MOX (momentum)** | **0.0680** | **0.6528** | 0.4410 | 0.9802 | **0.0598** | **0.5510** | 0.3120 | **0.8988** |

**핵심 발견:**

1. **MOX (momentum)이 전체적으로 최고 성능:** Llama2-7B에서 FQ 0.0680, MU 0.6528을 동시에 달성. 이는 대부분의 GA 기반 베이스라인을 상회한다.
2. **Model Utility 보존이 탁월:** MOX의 MU는 Original LLM(0.6346)과 거의 동등하거나 오히려 높다(0.6528). GA 기반 방법들은 대부분 MU가 하락한다.
3. **α 조절을 통한 유연한 trade-off:** α가 증가할수록 FQ는 향상되지만 F-RL은 소폭 상승. α=4.0이 적절한 균형점이다.
4. **Phi-1.5B에서도 일관된 우위:** MOX (momentum)이 FQ 0.0598, MU 0.5510으로 모든 베이스라인 대비 최고 성능.

### 4.2 MUSE 벤치마크 결과 (Table 2)

![Table 2: MUSE 벤치마크 비교](/figures/mox/table2_muse.png)

| 방법 | No Verbatim Mem.(↓) | No Knowledge Mem.(↓) | Utility Preserv.(↑) | No Privacy Leak.(↓) |
|------|---------------------|---------------------|---------------------|---------------------|
| Original LLM | 58.4 | 63.9 | 55.2 | -99.8 |
| GA | **0.0** | **0.0** | 0.0 | 17.0 |
| NPO | **0.0** | **0.0** | **55.8** | 24.4 |
| TV | 57.2 | 66.2 | **55.8** | -99.8 |
| MOX (α=0.5) | 36.5 | 38.6 | **56.2** | -93.1 |
| MOX (α=2.0) | 18.2 | 19.8 | 55.2 | -32.0 |
| MOX (α=4.0) | 1.2 | 1.6 | 54.9 | -19.8 |
| MOX (α=8.0) | 0.8 | 1.1 | 49.5 | 35.8 |
| MOX (momentum) | **0.2** | **0.8** | 54.8 | **-18.4** |

**핵심 발견:**

1. **GA, NPO는 verbatim/knowledge memorization을 완전히 제거하지만** model utility도 함께 파괴한다(GA: 0.0, NPO: 0.0).
2. **MOX는 memorization 제거와 utility 보존을 동시에 달성:** MOX (momentum)은 VerbMem 0.2, KnowMem 0.8로 거의 완전한 memorization 제거를 달성하면서도 Utility 54.8을 유지.
3. **Privacy Leakage 방지:** MOX (α=4.0)에서 PrivLeak -19.8, momentum에서 -18.4로, 대부분의 베이스라인 대비 우수.
4. **TV(Task Vectors)와의 비교:** TV는 utility를 잘 보존하지만 memorization 제거가 미흡(57.2/66.2). MOX는 extrapolation 강도 α를 통해 TV보다 훨씬 강력한 forgetting을 달성.

### 4.3 Ablation Study (Table 3)

![Table 3: Ablation Study](/figures/mox/table3_ablation.png)

4가지 설정을 비교한다:
1. **GD:** GD 기반 memorization만 수행
2. **GD+KL:** KL-divergence constraint 추가
3. **GD+target:** Targeted unlearning 추가
4. **GD+KL+target:** 모든 모듈 활용 (full MOX)

GA 및 NPO를 base로 한 두 가지 구현 모두에서, **GD+KL이 포함된 설정이 가장 우수한 성능**을 보인다. 특히 Retain Set에서의 성능이 KL constraint 추가 시 유의미하게 향상되며(0.85→0.87~0.88), Forget Set에서도 일관된 개선이 관찰된다.

### 4.4 하이퍼파라미터 분석

![Figure 3: α와 η에 대한 Parameter Sensitivity](/figures/mox/figure3_param_analysis.png)

**α (extrapolation 강도):**
- α가 1→4로 증가하면 Forget Set의 Truth Ratio가 크게 감소(forgetting 향상)
- Retain Set, Real Authors, Real World에서의 성능 저하는 비교적 완만
- α=8에서야 다른 데이터셋의 성능이 눈에 띄게 하락
- 결론: α를 합리적으로 큰 값(4 정도)으로 설정하면 utility 손실 없이 최대 forgetting 달성 가능

**η (momentum 계수):**
- η를 0.2~0.8로 변화시켜도 성능이 일관적으로 안정적
- MOX는 η에 대해 **insensitive** — 튜닝이 용이함

### 4.5 성능 안정성 (Performance Stability)

![Figure 4: 다양한 extrapolation/weight 값에서의 안정성](/figures/mox/figure4_stability.png)

MOX를 GA, NPO와 다양한 regularization 강도(weight value 1~5)에서 비교한 결과:
- **MOX가 일관적으로 최고 성능**을 유지
- GA와 NPO는 weight 값 변화에 따라 성능이 급격히 변동
- MOX는 다양한 extrapolation 강도에서도 상대적으로 안정적

### 4.6 다양한 Forget Size에서의 성능

![Figure 5: Forget size별 성능 비교](/figures/mox/figure5_forget_size.png)

TOFU에서 forget ratio 1%, 5%, 10%에 대한 실험 결과, MOX가 **모든 forget size에서 NPO 및 GA를 큰 폭으로 상회**한다. 특히 forget size가 커질수록(5%, 10%) GA와 NPO의 성능이 크게 하락하는 반면, MOX는 안정적으로 높은 forget quality를 유지한다.

---

## 5. 추가 분석 (Appendix)

### 5.1 Unlearning Trajectory (Figure 6)

![Figure 6: Unlearning Trajectory](/figures/mox/figure6_trajectory.png)

TOFU 5% forget set에서 Llama2-7B의 학습 궤적을 Model Utility(x축) vs Forget Quality(y축, log p-value)로 시각화한 결과:

- **GA, GAD, KL:** 초기에는 forget quality가 향상되지만, 갑자기 model utility가 급락하고 forget quality도 붕괴 — catastrophic collapse의 전형적 패턴.
- **NPO:** 더 안정적이지만 학습 후반에 forget quality가 저하.
- **TV:** GA를 회피하므로 collapse는 없지만, forgetting 성능이 제한적.
- **MOX / MOX-Mo:** 높은 model utility를 유지하면서 forget quality가 꾸준히 향상. Momentum(MOX-Mo)이 양쪽 모두를 더욱 개선.

### 5.2 Continual Unlearning (Figure 7)

![Figure 7: Continual Unlearning](/figures/mox/figure7_continual.png)

Forget set이 계속 변화하는 현실적 시나리오(1% → 5% → 10% 순차 unlearning)에서:
- GA, GAD, KL은 다른 forget set으로 전환 시 성능이 심각하게 저하
- **MOX는 모든 단계에서 가장 안정적이고 높은 forget quality를 유지** — 실제 운용 환경에서의 실용적 이점

### 5.3 Semantic Overlap 상황 (Table 5)

Forget set과 Retain set이 극도로 겹치는 상황(retain set의 10%를 forget set으로 분리)에서도 MOX가 GA, PO 대비 우수한 성능을 보인다:

| 방법 | FQ(↑) | MU(↑) | F-RL(↓) | R-RL(↑) |
|------|--------|--------|---------|---------|
| GA | 0.0137 | 0.5745 | 0.4856 | 0.8795 |
| PO | 0.0501 | 0.6232 | 0.4620 | 0.8755 |
| **MOX** | **0.0611** | **0.6488** | **0.4500** | **0.9508** |

### 5.4 Relearning Attack 내성 (Table 6)

![Table 6: Relearning Performance](/figures/mox/table6_relearning.png)

WMDP 벤치마크에서 relearning attack에 대한 내성을 평가:

| 방법 | WMDP(↓) |
|------|---------|
| Original | 5.21 |
| GA unlearn | 1.53 |
| GA relearn | 4.88 (+3.35) |
| NPO unlearn | 0.98 |
| NPO relearn | 5.01 (+4.03) |
| **MOX unlearn** | **0.54** |
| **MOX relearn** | **3.82 (+3.28)** |

MOX의 unlearning 후 WMDP 점수가 0.54로 가장 낮고, relearning 후에도 3.82로 GA(4.88), NPO(5.01) 대비 **회복이 가장 적다**. Extrapolation이 원본과 현재 모델의 차이를 식별하고 이를 증폭하므로, relearning으로 이를 쉽게 되돌리기 어렵다.

---

## 6. 논의 및 한계

**강점:**
- GA의 근본적 문제(catastrophic collapse, training instability)를 회피하는 **패러다임 전환적 접근**
- GD만 사용하므로 구현이 간단하고, 기존 학습 인프라와 완벽히 호환
- Momentum extrapolation을 통해 추가적인 성능 향상 가능
- 다양한 forget size, semantic overlap, continual unlearning 시나리오에서 일관된 우수성

**한계:**
- α가 극단적으로 클 때(예: 8) model utility가 하락할 수 있음 — 적절한 α 선택이 필요
- Extrapolation이 hypothesis space에서 선형 관계를 가정하므로, 매우 복잡한 모델 구조에서는 추가 검증 필요
- TOFU, MUSE 외의 더 다양한 벤치마크에서의 검증이 필요
- Double-blind review 중이므로 코드가 아직 공개되지 않음

---

## 주요 기여 요약

1. **GA 없는 MU 패러다임:** GD로 memorization 모델을 학습하고 model extrapolation으로 forget 모델을 획득하는 MOX 제안. Catastrophic collapse를 근본적으로 회피.
2. **Irreversible Gradient Criterion:** GA가 pre-training의 gradient를 역전시키는 것이 왜 문제인지에 대한 이론적 근거 제시.
3. **TOFU에서 최고 수준 성능:** MOX (momentum)이 FQ 0.0680, MU 0.6528을 달성하며, 대부분의 GA/NPO 기반 방법을 상회.
4. **MUSE에서 균형잡힌 성능:** Verbatim memorization 0.2까지 제거하면서 utility 54.8 유지.
5. **다양한 시나리오에서의 강건성:** Continual unlearning, semantic overlap, relearning attack에서 일관된 우수성 입증.

---

## 개인적 코멘트

이 논문의 핵심 기여는 Machine Unlearning에서 GA를 사용하지 않는다는 **발상의 전환**에 있다. 기존 MU 연구의 대부분이 "어떻게 GA를 안정화할 것인가"에 집중했다면, 이 논문은 "GA 자체를 피할 수 있다"는 것을 보여준다. Task Arithmetic에서 영감을 받은 model extrapolation 아이디어는 직관적이면서도 효과적이다.

다만 몇 가지 궁금증이 남는다. 첫째, extrapolation의 선형성 가정이 고차원 파라미터 공간에서 얼마나 유효한지에 대한 더 깊은 이론적 분석이 필요하다. 둘째, α의 최적값이 데이터셋/모델에 따라 달라질 수 있으므로, 자동 α 선택 메커니즘이 있으면 더 실용적일 것이다. 셋째, 더 큰 모델(7B 이상)에서의 스케일링 특성도 확인이 필요하다.

Task Vectors(TV)와의 관계도 흥미롭다. TV도 GA를 피하지만 forgetting 성능이 제한적인데, MOX는 KL constraint와 momentum을 추가하여 이를 크게 개선했다. 이는 단순 extrapolation을 넘어 retain set의 정보를 적극적으로 보존하는 것이 핵심이라는 점을 시사한다.
