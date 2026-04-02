---
title: "학습 데이터 귀인(Training Data Attribution) 방법론 총정리: Influence Functions에서 EK-FAC까지"
date: 2026-03-24
summary: "딥러닝 모델의 예측을 학습 데이터로 역추적하는 Training Data Attribution(TDA) 방법론을 종합 정리한다. Influence Functions(Koh & Liang, 2017), TracIn(Pruthi et al., 2020), Representer Points(Yeh et al., 2018), 그리고 Anthropic의 EK-FAC 기반 대규모 Influence Functions(Grosse et al., 2023)까지 — 핵심 아이디어, 수학적 정의, 계산 방법, 장단점, 그리고 상호 관계를 체계적으로 다룬다."
tags: [Influence Functions, TracIn, Representer Points, Training Data Attribution, XAI, LLM, Memorization, EK-FAC, 연구노트]
category: 연구노트
language: ko
---

# 학습 데이터 귀인(Training Data Attribution) 방법론 총정리

**키워드:** Influence Functions, TracIn, Representer Points, EK-FAC, Training Data Attribution

딥러닝 모델이 특정 예측을 내놓았을 때, *왜* 그런 예측을 하는지를 이해하는 것은 중요한 문제다. 특히 "어떤 학습 데이터가 이 예측에 가장 큰 영향을 미쳤는가?"라는 질문은 **Training Data Attribution(TDA)**이라는 연구 분야를 형성했다. 이 포스트에서는 TDA의 핵심 방법론 네 가지를 깊이 있게 다룬다.

---

## 1. Influence Functions (Koh & Liang, 2017)

**논문:** Understanding Black-box Predictions via Influence Functions
**저자:** Pang Wei Koh, Percy Liang (Stanford)
**학회:** ICML 2017 (Best Paper Award)
**arXiv:** [1703.04730](https://arxiv.org/abs/1703.04730)

### 핵심 질문

> "학습 데이터 하나를 제거하면 모델의 예측이 어떻게 변하는가?"

가장 직관적인 접근은 **Leave-One-Out(LOO) 재학습**이다 — 학습 데이터 $z_i$를 제거하고 처음부터 다시 학습한 후 예측 변화를 관찰하는 것. 하지만 이는 $n$개의 학습 데이터에 대해 $n$번 재학습해야 하므로 비현실적이다.

Influence Functions은 **재학습 없이** 이를 근사한다.

### 수학적 정의

경험적 위험 최소화(ERM)로 학습된 모델 파라미터를 $\hat{\theta}$라 하자:

$$\hat{\theta} = \arg\min_\theta \frac{1}{n} \sum_{i=1}^{n} L(z_i, \theta)$$

학습 데이터 $z$에 무한소 가중치 $\epsilon$을 부여하면:

$$\hat{\theta}_{\epsilon, z} = \arg\min_\theta \frac{1}{n} \sum_{i=1}^{n} L(z_i, \theta) + \epsilon \cdot L(z, \theta)$$

**파라미터에 대한 influence**는 다음과 같이 유도된다:

$$\mathcal{I}_{\text{up,params}}(z) = \left.\frac{d\hat{\theta}_{\epsilon,z}}{d\epsilon}\right|_{\epsilon=0} = -H_{\hat{\theta}}^{-1} \nabla_\theta L(z, \hat{\theta})$$

여기서 $H_{\hat{\theta}} = \frac{1}{n}\sum_{i=1}^{n}\nabla_\theta^2 L(z_i, \hat{\theta})$는 **Hessian 행렬**이다.

특정 테스트 포인트 $z_{\text{test}}$의 손실에 대한 **학습 데이터 $z$의 influence**는 체인 룰로:

$$\mathcal{I}_{\text{up,loss}}(z, z_{\text{test}}) = -\nabla_\theta L(z_{\text{test}}, \hat{\theta})^\top H_{\hat{\theta}}^{-1} \nabla_\theta L(z, \hat{\theta})$$

직관적으로 이는 *학습 그래디언트*와 *테스트 그래디언트*의 Hessian-가중 내적이다.

### 계산 방법

Hessian의 직접 역행렬 계산은 $O(p^3)$으로 비현실적이다(파라미터 수 $p$가 수백만~수억). 두 가지 근사 방법이 사용된다:

1. **Conjugate Gradients(CG):** $H^{-1}v$를 반복적으로 풀기 — Hessian-Vector Product(HVP)만 필요
2. **Stochastic Estimation (LiSSA):** HVP의 확률적 근사를 통한 반복 계산

### 응용 및 시사점

- **디버깅:** 오분류된 테스트 샘플에 가장 영향을 미친 학습 데이터 식별
- **레이블 오류 탐지:** 영향력 높은 학습 데이터 중 레이블이 잘못된 것을 찾기
- **데이터 중독 공격:** 소수의 조작된 학습 데이터가 모델에 미치는 영향 분석
- **도메인 적응:** 어떤 학습 데이터가 타겟 도메인에 유용한지 선별

### 한계

- **볼록성 가정:** 이론적 보장은 강볼록(strongly convex) 모델에 한정. 딥러닝은 비볼록이므로 근사의 질이 불확실
- **Hessian 계산 비용:** 파라미터가 많을수록 HVP 계산과 반복 풀이가 비용이 큼
- **LOO와의 불일치:** 비볼록 설정에서 influence function 추정이 실제 LOO와 크게 다를 수 있음
- **단일 모델 의존:** 최종 수렴점 $\hat{\theta}$ 주변의 국소 근사이므로, 학습 경로(trajectory)를 반영하지 못함

---

## 2. TracIn (Pruthi et al., 2020)

**논문:** Estimating Training Data Influence by Tracing Gradient Descent
**저자:** Garima Pruthi, Frederick Liu, Satyen Kale, Mukund Sundararajan (Google)
**학회:** NeurIPS 2020 (Spotlight)
**arXiv:** [2002.08484](https://arxiv.org/abs/2002.08484)

### 핵심 아이디어

Influence Functions이 최종 모델의 Hessian에 의존하는 반면, TracIn은 **학습 과정 전체를 추적**한다. 즉, 학습 중 특정 학습 데이터가 사용될 때마다 테스트 포인트의 손실이 얼마나 변했는지를 누적한다.

> "학습 데이터 $z$가 학습 과정에서 사용될 때마다, 테스트 포인트 $z'$의 손실이 얼마나 줄었는가?"

### 수학적 정의

**이상적 TracIn (Ideal TracIn):**

학습이 $T$번의 스텝으로 진행되고, 스텝 $t$에서 학습 데이터 $z_t$가 사용되며 학습률이 $\eta_t$라 하면:

$$\text{TracIn}_{\text{ideal}}(z, z') = \sum_{t: z_t = z} \eta_t \nabla_\theta L(z', \theta_t) \cdot \nabla_\theta L(z, \theta_t)$$

이것은 학습 데이터 $z$가 사용된 모든 스텝에서의 **그래디언트 내적의 가중합**이다.

**실용적 TracIn (TracInCP — CheckPoint 기반):**

모든 스텝을 추적하는 것은 비현실적이므로, 저장된 체크포인트 $\theta_{c_1}, \theta_{c_2}, \ldots, \theta_{c_k}$를 사용한다:

$$\text{TracInCP}(z, z') = \sum_{i=1}^{k} \eta_{c_i} \nabla_\theta L(z', \theta_{c_i}) \cdot \nabla_\theta L(z, \theta_{c_i})$$

### 왜 단순 그래디언트 내적이 작동하는가?

1차 테일러 근사로 손실 변화를 추적하면:

$$L(z', \theta_{t+1}) - L(z', \theta_t) \approx \nabla_\theta L(z', \theta_t) \cdot (\theta_{t+1} - \theta_t)$$

SGD에서 $\theta_{t+1} - \theta_t = -\eta_t \nabla_\theta L(z_t, \theta_t)$이므로:

$$L(z', \theta_{t+1}) - L(z', \theta_t) \approx -\eta_t \nabla_\theta L(z', \theta_t) \cdot \nabla_\theta L(z_t, \theta_t)$$

### Influence Functions과의 관계

TracIn과 Influence Functions 사이에는 깊은 연결이 있다:

- 학습률 $\eta \to 0$이고 무한 스텝인 극한에서, 볼록 손실 함수에 대해 TracIn은 Influence Functions과 동치가 된다
- TracIn은 Hessian을 항등행렬 $I$로 대체한 것으로 볼 수 있다(1차 근사)
- 반면, Influence Functions은 곡률(curvature)을 반영하므로 더 정확한 국소 근사

### 장점

- **단순성:** Hessian 계산이 필요 없다. 그래디언트만 계산하면 됨
- **일반성:** SGD로 학습된 모든 모델에 적용 가능 (아키텍처 무관)
- **학습 경로 반영:** 학습 과정 전체의 동역학을 포착
- **확장성:** 레이어 선별(cherry-picking)로 더 효율적으로 계산 가능

### 한계

- **체크포인트 의존:** 학습 중 체크포인트를 저장해야 함 (사후 분석 불가)
- **1차 근사:** 곡률을 무시하므로 손실 표면이 고도로 비선형인 경우 부정확
- **배치 효과 무시:** 미니배치 내 다른 데이터 포인트의 상호작용을 고려하지 않음

---

## 3. Representer Points (Yeh et al., 2018)

**논문:** Representer Point Selection for Explaining Deep Neural Networks
**저자:** Chih-Kuan Yeh, Joon Sik Kim, Ian En-Hsu Yen, Pradeep Ravikumar (CMU)
**학회:** NeurIPS 2018
**arXiv:** [1811.09720](https://arxiv.org/abs/1811.09720)

### 핵심 아이디어

커널 방법의 **Representer Theorem**에서 영감을 받은 방법이다. 딥러닝의 마지막 레이어에서의 예측이 학습 데이터의 활성화값(activation)의 **선형 결합**으로 분해될 수 있다는 점을 이용한다.

> "테스트 포인트의 pre-softmax 예측 = 학습 데이터 활성화의 가중합"

### 수학적 정의

L2-정규화된 손실 함수로 학습된 신경망에서, 마지막 레이어의 파라미터를 $W$, 마지막 은닉층의 활성화를 $f_\theta(x)$라 하면, 최적점에서:

$$\frac{\partial}{\partial W} \left[\frac{1}{n}\sum_{i=1}^n L(z_i, \theta) + \frac{\lambda}{2}\|W\|^2\right] = 0$$

이를 정리하면 최적 가중치 행렬은:

$$W^* = -\frac{1}{n\lambda}\sum_{i=1}^n \alpha_i f_\theta(x_i)^\top$$

여기서 **representer 값** $\alpha_i$는:

$$\alpha_i = -\frac{1}{2n\lambda}\frac{\partial L}{\partial \Phi_i}$$

$\Phi_i = W^\top f_\theta(x_i)$는 학습 데이터 $x_i$의 pre-softmax 출력이다.

테스트 포인트 $x_{\text{test}}$의 pre-softmax 출력은:

$$\Phi(x_{\text{test}}) = \sum_{i=1}^n \alpha_i \cdot k(x_i, x_{\text{test}})$$

여기서 $k(x_i, x_{\text{test}}) = f_\theta(x_i)^\top f_\theta(x_{\text{test}})$는 마지막 은닉층의 **내적 커널**이다.

### 해석

- **$\alpha_i > 0$ (양의 representer 값):** $x_i$는 테스트 포인트의 예측을 **촉진(excitatory)**. 일반적으로 같은 클래스의 잘 학습된 예제
- **$\alpha_i < 0$ (음의 representer 값):** $x_i$는 예측을 **억제(inhibitory)**. 반례(counterexample)나 잘못 분류된 학습 데이터
- **$|k(x_i, x_{\text{test}})|$가 클수록:** 특성 공간에서 유사한 데이터

### 장점

- **실시간 계산:** Hessian 역행렬 계산이 필요 없음. 활성화 내적과 representer 값만 계산
- **해석 가능성:** 촉진/억제 관계로 직관적인 설명 제공
- **확장성:** Influence Functions보다 훨씬 빠름 — $O(n \cdot d)$ (Influence Functions은 $O(n \cdot p)$ + HVP 반복)
- **Representer Theorem의 수학적 근거:** L2 정규화된 모델에 대해 이론적으로 정당화

### 한계

- **마지막 레이어 한정:** 전체 네트워크가 아닌 마지막 레이어의 가중치에만 적용. 중간 층의 표현 학습 영향은 무시
- **L2 정규화 필수:** 이론이 L2 정규화에 의존. Dropout, BatchNorm 등 다른 정규화 사용 시 근사의 질 저하
- **정확한 최적점 가정:** 실제 학습은 정확한 최적점에 도달하지 않으므로, representer 분해에 잔차가 발생
- **분류 문제 중심:** 회귀나 생성 모델에의 적용은 추가 연구 필요

---

## 4. Scaling Up: LLM에 Influence Functions 적용 (Grosse et al., 2023)

**논문:** Studying Large Language Model Generalization with Influence Functions
**저자:** Roger Grosse, Juhan Bae, Cem Anil, Nelson Elhage, Alex Tamkin, Amirhossein Tajdini 외 (Anthropic)
**arXiv:** [2308.03296](https://arxiv.org/abs/2308.03296)

### 배경: 왜 LLM에 Influence Functions이 어려운가?

Influence Functions의 핵심 병목은 **Inverse-Hessian-Vector Product(IHVP)** 계산이다. 52B 파라미터 모델의 경우:

- Hessian 행렬 크기: $52B \times 52B$ → 메모리에 저장 불가
- Conjugate Gradients: 수천 번의 HVP 반복 → 비용이 너무 큼
- LiSSA: 분산이 크고 수렴이 느림

### EK-FAC: Eigenvalue-corrected Kronecker-Factored Approximate Curvature

Grosse et al.은 **EK-FAC**를 사용하여 이 문제를 해결했다.

**KFAC(Kronecker-Factored Approximate Curvature)**는 피셔 정보 행렬을 레이어별로 Kronecker 곱으로 근사한다:

$$F_l \approx A_l \otimes G_l$$

여기서 $A_l$은 입력 활성화의 공분산, $G_l$은 출력 그래디언트의 공분산이다.

**EK-FAC**는 여기에 고유값 보정을 추가한다:

1. $A_l$과 $G_l$을 고유값 분해
2. 회전된 공간에서 대각 행렬로 근사
3. 고유값을 보정하여 실제 피셔의 대각 요소와 일치시킴

이를 통해 IHVP를 **$O(p)$ 시간에 계산** — 기존 방법 대비 수 자릿수 빠르다.

### 주요 발견

EK-FAC influence를 52B 파라미터 LLM에 적용하여 다음을 발견했다:

1. **Influence의 희소성(sparsity):** 대부분의 학습 데이터는 주어진 테스트 예측에 거의 영향을 미치지 않음. 소수의 학습 데이터가 대부분의 영향력을 가짐

2. **규모에 따른 추상화 증가:** 작은 모델은 표면적 유사성(n-gram overlap)에 의존하지만, 큰 모델은 더 추상적인 의미적 유사성을 학습

3. **수학/프로그래밍 능력:** 수학 문제에 대한 influence를 보면, 모델이 유사한 수학적 구조를 가진 학습 데이터에서 일반화하고 있음을 확인

4. **교차 언어 일반화:** 한 언어의 테스트 텍스트에 대해 다른 언어의 학습 데이터가 높은 influence를 가지는 경우가 있음 — 다국어 LLM의 교차 언어 전이 증거

5. **구문 순서 민감성:** 핵심 구문의 순서가 뒤바뀌면 influence가 0에 가까워짐 — 놀라울 정도로 강한 위치 의존성

### TDA 방법론 비교에서의 위치

Grosse et al.의 접근은 Koh & Liang의 Influence Functions을 LLM 규모로 확장한 것이다. 기존의 TracIn이나 Representer Points가 Hessian을 완전히 무시하는 반면, EK-FAC는 곡률을 효율적으로 반영한다.

---

## 5. 방법론 비교 요약

| 항목 | Influence Functions | TracIn | Representer Points | EK-FAC IF |
|:---|:---|:---|:---|:---|
| **핵심 원리** | LOO의 무한소 근사 | 학습 경로 추적 | Representer Theorem | KFAC으로 Hessian 근사 |
| **필요 정보** | 최종 모델 + Hessian | 체크포인트들 | 최종 모델 (마지막 층) | 최종 모델 + EK-FAC 인자 |
| **Hessian 사용** | 예 (IHVP) | 아니오 (항등행렬 근사) | 아니오 (마지막 층만) | 예 (Kronecker 근사) |
| **계산 비용** | 높음 ($O(np + p^2)$) | 중간 ($O(nkd)$) | 낮음 ($O(nd)$) | 중간-높음 (전처리 후 $O(p)$) |
| **볼록성 가정** | 필요 (이론적 보장) | 불필요 | 필요 (L2 정규화) | 불필요 (경험적) |
| **규모 확장성** | 수백만 파라미터까지 | 수십억 파라미터 가능 | 수억 파라미터 가능 | 520억 파라미터 검증 |
| **학습 경로 반영** | 아니오 | 예 | 아니오 | 아니오 |
| **연도** | 2017 | 2020 | 2018 | 2023 |
| **학회** | ICML (Best Paper) | NeurIPS (Spotlight) | NeurIPS | arXiv |

---

## 6. 언제 어떤 방법을 쓸 것인가?

**Influence Functions (원본):** 소규모 모델에서 이론적으로 정밀한 분석이 필요할 때. 볼록이거나 볼록에 가까운 모델 (로지스틱 회귀, SVM 등)에서 가장 신뢰도 높음.

**TracIn:** 학습 체크포인트가 있고, Hessian 계산 없이 빠르게 influence를 추정하고 싶을 때. 레이블 오류 탐지, 데이터 정제에 실용적.

**Representer Points:** 분류 모델의 예측을 실시간으로 설명해야 할 때. 계산 효율이 가장 높고, 촉진/억제 관계의 직관적 해석이 필요할 때.

**EK-FAC Influence Functions:** LLM 규모에서 곡률을 반영한 정밀한 influence 분석이 필요할 때. 일반화 패턴 연구, 데이터 출처 추적 등.

---

## 7. 관련 연구와의 연결

이 네 가지 방법은 더 넓은 연구 맥락과 연결된다:

- **Counterfactual Memorization (Zhang et al., 2023):** Influence Functions을 대규모로 실행하는 대신, 400개의 모델을 실제로 재학습하여 인과적 영향을 측정. 계산 비용은 높지만, 근사 오차가 없는 금본위(gold standard).

- **Machine Unlearning:** TDA로 식별된 영향력 높은 데이터를 모델에서 "잊게" 하는 연구. GDPR의 "잊힐 권리"와 직결.

- **Data Valuation (Data Shapley):** TDA와 유사하지만, 게임 이론적 관점에서 각 학습 데이터의 "가치"를 공정하게 분배.

- **Membership Inference Attacks:** 모델이 특정 데이터로 학습되었는지를 외부에서 판별하는 공격. TDA 방법론은 이에 대한 방어/분석 도구로도 활용.

---

## 참고 문헌

1. Koh, P.W. & Liang, P. (2017). Understanding Black-box Predictions via Influence Functions. *ICML 2017*. [arXiv:1703.04730](https://arxiv.org/abs/1703.04730)

2. Pruthi, G., Liu, F., Kale, S., & Sundararajan, M. (2020). Estimating Training Data Influence by Tracing Gradient Descent. *NeurIPS 2020*. [arXiv:2002.08484](https://arxiv.org/abs/2002.08484)

3. Yeh, C.K., Kim, J.S., Yen, I.E.H., & Ravikumar, P. (2018). Representer Point Selection for Explaining Deep Neural Networks. *NeurIPS 2018*. [arXiv:1811.09720](https://arxiv.org/abs/1811.09720)

4. Grosse, R., Bae, J., Anil, C., Elhage, N., Tamkin, A., Tajdini, A., et al. (2023). Studying Large Language Model Generalization with Influence Functions. *Anthropic Research*. [arXiv:2308.03296](https://arxiv.org/abs/2308.03296)

5. Zhang, C., Ippolito, D., Lee, K., Jagielski, M., Tramèr, F., & Carlini, N. (2023). Counterfactual Memorization in Neural Language Models. *NeurIPS 2023*. [arXiv:2112.12938](https://arxiv.org/abs/2112.12938)
