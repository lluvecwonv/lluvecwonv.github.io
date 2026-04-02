---
title: "State of RL for Reasoning LLMs"
date: 2026-03-20
summary: "A. Weers의 블로그 포스트 정리. 추론(reasoning) LLM을 위한 강화학습(RL) 방법론의 현황을 종합 분석한다. REINFORCE, PPO, GRPO, RLOO, Dr. GRPO, DAPO, CISPO, MaxRL, DPPO, ScaleRL을 수식과 함께 비교하며, critic-free 접근법, 토큰 수준 집계, 완화된 trust region이 최근 트렌드임을 보인다."
tags: [LLM, 강화학습, RL, PPO, GRPO, DAPO, RLOO, CISPO, DPPO, MaxRL, Reasoning, 연구노트]
category: 연구노트
language: ko
---

# State of RL for Reasoning LLMs

**출처:** A. Weers (2026년 3월 15일) | [원문 링크](https://aweers.de/blog/2026/rl-for-llms/)
**읽기 시간:** 약 26분

---

## 한 줄 요약

강화학습(RL)은 LLM 후훈련(post-training) 스택에서 가장 중요한 추가 요소 중 하나다. GPT-3를 InstructGPT로 변환한 핵심 재료였으며[1], 이후 현재의 추론 능력 향상 물결의 중심이 되었다[2][3]. 1세대 RL은 PPO[4] 중심이었고, 2세대(2024~2026)는 추론 능력 향상을 목표로 한 알고리즘 정제가 대거 등장했다. 이 글은 REINFORCE부터 ScaleRL까지 주요 발전을 체계적으로 정리한다.

---

## 1. 강화학습 기초 (Brief RL Introduction)

표준 RL 환경에서 에이전트는 상태 $s$를 관찰하고, 정책 $\pi$에 따라 행동 $a$를 선택하며, 환경 역학 $P(s'|s,a)$에 따라 새 상태로 전이하고, 보상 $r$을 받는다.

구체적인 예: 방을 탐색하는 로봇—상태는 현재 위치와 센서 읽기, 행동은 이동 명령, 전이 역학은 물리 법칙(바퀴가 미끄러질 수 있음), 보상은 목표 도달 진척도를 반영한다.

에이전트는 기대 할인 수익을 최대화한다:

$$
J = \mathbb{E}\left[\sum_{t=0}^{T} \gamma^t r_t\right]
$$

여기서 할인 계수 $\gamma$는 미래 보상의 가중치를 조절한다.

정책은 보통 $\theta$로 매개변수화된다. 핵심 객체는 **가치 함수**:

$$
V^\pi(s) = \mathbb{E}_\pi\left[\sum_{l=0}^{T-t} \gamma^l r_{t+l} \mid s_t = s\right]
$$

이것은 정책 $\pi$ 하에서 상태 $s$에 있는 것이 얼마나 좋은지를 측정한다. 여기서 **이점(advantage)**을 도출할 수 있으며, 이는 특정 행동이 기대보다 좋았는지 나빴는지를 추정한다.

**LLM에서의 단순화:** 매개변수화된 모델 $\pi_\theta$가 데이터셋의 프롬프트 $x$에 대해 응답 $y$를 샘플링하고, 스칼라 보상 $r(x,y)$로 평가한다. 목적함수:

$$
J(\theta) = \mathbb{E}_{x \sim \mathcal{D},\; y \sim \pi_\theta(\cdot|x)}[r(x, y)]
$$

여전히 상태 = (프롬프트 + 이전 생성 토큰), 행동 = 다음 토큰으로 모델링할 수 있지만, 실제로는 개별 토큰에 의미 있는 보상을 할당하기 어렵고 전체 응답에 대한 하나의 보상만 제공된다. 마지막 토큰을 제외하면 보상이 0이 되어 설정이 불필요하게 복잡해진다.

---

## 2. REINFORCE

REINFORCE[5]는 가중 정책 그래디언트를 사용하는 기본 알고리즘이다:

$$
\nabla_\theta J(\theta) = \mathbb{E}\left[\nabla_\theta \log \pi_\theta(y|x) \cdot r(x,y)\right]
$$

- 높은 보상을 받은 응답의 로그 확률을 높이고, 낮은 보상을 받은 응답의 로그 확률을 낮춘다.
- **분산 감소**: 기준선(baseline) $b(x)$를 빼서 이점을 추정한다.

---

## 3. PPO (Proximal Policy Optimization)

PPO[4]는 중요도 샘플링 비율과 클리핑 메커니즘을 도입하여 off-policy 학습을 가능하게 한다:

$$
J^{\text{PPO}}(\theta) = \mathbb{E}_t\left[\min\!\left(\rho_t(\theta)\hat{A}_t,\; \operatorname{clip}\!\left(\rho_t(\theta),\, 1-\epsilon,\, 1+\epsilon\right)\hat{A}_t\right)\right]
$$

여기서 **중요도 샘플링 비율**:

$$
\rho_t(\theta) = \frac{\pi_\theta(a_t|s_t)}{\pi_{\theta_{\text{old}}}(a_t|s_t)}
$$

**마스킹 함수** (대칭):

$$
M_{\text{sym}}(\hat{A}_t, \rho_t, \epsilon) = \begin{cases} 0 & \text{if } (\hat{A}_t > 0 \land \rho_t > 1 + \epsilon) \lor (\hat{A}_t < 0 \land \rho_t < 1 - \epsilon) \\ 1 & \text{otherwise} \end{cases}
$$

**메모리 요구사항 — 4가지 컴포넌트:**
1. 현재 정책 (policy)
2. 롤아웃 정책 (rollout policy)
3. 참조 정책 (reference policy)
4. 가치 모델 (critic) — GAE(Generalized Advantage Estimation) 사용

이 높은 메모리 요구사항이 이후 방법론들의 주요 개선 동기가 된다.

---

## 4. GRPO (Group Relative Policy Optimization)

GRPO[8]는 학습된 가치 모델을 **그룹 상대 기준선**으로 대체하여 critic을 제거한다:

$$
\hat{A}_i = \frac{r_i - \mu_G}{\sigma_G}
$$

- 같은 프롬프트에 대해 여러 응답을 샘플링한 뒤, 그룹 내에서 상대적으로 비교한다.
- 학습된 critic 대신 그룹 평균/표준편차를 사용하므로 **메모리를 약 50% 절감**한다.
- PPO 스타일의 대칭 IS 클리핑은 유지한다: $M_{\text{sym}}(\hat{A}_t, \rho_t, 0.2)$
- 손실 집계는 길이 정규화(length normalized)† 방식이다.

†구현체에 따라 다를 수 있음 (예: Huggingface TRL)

---

## 5. RLOO (REINFORCE Leave-One-Out)

RLOO[9]는 **leave-one-out 이점**을 사용한다:

$$
\hat{A}_i = r_i - \frac{1}{K-1}\sum_{j \neq i} r_j
$$

- 자기 자신을 제외한 나머지 응답들의 평균 보상을 기준선으로 사용한다.
- PPO 클리핑을 사용하지 않고, 마스킹도 없다.
- 순수 REINFORCE 스타일 업데이트로 회귀하면서도, leave-one-out 기준선으로 critic 없이 분산을 효과적으로 감소시킨다.
- 손실 집계는 샘플 평균(sample average) 방식이다.

---

## 6. Dr. GRPO ("GRPO Done Right")

DeepSeek은 DeepSeek-Math와 R1 논문에서 RL 학습이 진행됨에 따라 응답 길이가 크게 증가한다고 보고했다. 이를 추론 및 반성 능력 향상("Aha" 모먼트)으로 귀인했지만, Dr. GRPO[10] 저자들은 더 중요한 원인을 지적한다: **표준 샘플 수준 손실 정규화가 짧은 정답과 긴 오답을 편향적으로 선호**한다는 것이다.

일반적인 GRPO 구현에서 토큰 손실은 먼저 시퀀스 내에서 평균되고, 그 다음 시퀀스 간에 평균된다. 이는 고정된 시퀀스 수준 보상이 시퀀스의 모든 토큰에 분배된다는 의미다. 따라서 긴 응답은:
- **정답이면** 토큰당 더 약한 강화를 받고
- **오답이면** 토큰당 더 약한 페널티를 받는다

이것은 불필요하게 장황해지는 인센티브를 만들 수 있다.

**수정 방법:** 시퀀스 길이로 나누고 배치 크기로 나누는 대신, Dr. GRPO는 **고정 상수**(최대 토큰 수)로 나눈다. 이로써 오답이 불필요하게 길어질 인센티브를 효과적으로 제거한다.

또한 **표준편차 정규화도 제거**한다. 프롬프트당 보상이 표준편차로 정규화되면, 모든 답이 비슷한 보상을 가진 프롬프트(예: 하나만 빼고 전부 정답, 보상 분산이 낮음)에서도 작은 보상 차이가 큰 정규화된 이점으로 변할 수 있다. 결과적으로 모델이 이미 거의 정답을 맞추는 프롬프트가 불균형하게 큰 업데이트를 받을 수 있다.

Dr. GRPO의 이점 함수:

$$
\hat{A}_i = r_i - \mu_G
$$

**표준편차로 나누지 않으며**, 손실은 시퀀스 길이 평균 대신 고정 정규화로 토큰 수준에서 집계된다‡.

‡ 고정 상수 분모(constant denominator) 사용

핵심 메시지: GRPO가 근본적으로 결함이 있었다는 것이 아니라, 겉보기에 무해한 정규화들이 중립적이지 않았다는 것이다. 장문 추론에서 어떤 프롬프트와 토큰이 그래디언트 신호를 받는지를 변경한다.

---

## 7. DAPO (Decoupled Advantage Policy Optimization)

DAPO[7]는 GRPO의 여러 구성요소를 심층 분석하고 **4가지 개선**을 제안한다.

### 7.1 토큰 수준 집계 (Token-Level Aggregation)

Dr. GRPO와 유사하게 샘플 수준 평균을 토큰 수준으로 대체한다 (DAPO는 실제 토큰 수로 나누고, Dr. GRPO는 상수를 사용).

### 7.2 비대칭 클리핑 (Asymmetric Clipping)

PPO의 대칭 비율 클리핑은 낮은 확률 토큰에 특히 과도하게 제한적이다. 예: 토큰 확률이 $0.01$이면, $\epsilon = 0.2$에서 확률은 $0.012$까지만 올라갈 수 있어 샘플링 확률이 거의 변하지 않는다. 이는 드물지만 유용한 추론 이어짐의 학습을 억제할 수 있다. DAPO는 클립 경계를 분리하여 더 큰 상한을 사용한다:

$$
\epsilon_{\text{low}} = 0.2, \quad \epsilon_{\text{high}} = 0.28
$$

비대칭 마스킹 함수:

$$
M_{\text{asym}}(\hat{A}_t, \rho_t, \epsilon_l, \epsilon_h) = \begin{cases} 0 & \text{if } (\hat{A}_t > 0 \land \rho_t > 1 + \epsilon_h) \lor (\hat{A}_t < 0 \land \rho_t < 1 - \epsilon_l) \\ 1 & \text{otherwise} \end{cases}
$$

토큰 수준 집계와 비대칭 클리핑을 결합한 **DAPO 목적함수:**

$$
J^{\text{DAPO}}(\theta) = \mathbb{E}\left[ \frac{1}{\sum_{i=1}^{G}|y_i|} \sum_{i=1}^{G}\sum_{t=1}^{|y_i|} \min\!\left( \rho_{i,t}(\theta)\hat{A}_i,\; \operatorname{clip}(\rho_{i,t}(\theta), 1-\epsilon_{\text{low}}, 1+\epsilon_{\text{high}})\hat{A}_i \right) \right]
$$

### 7.3 과도한 길이 보상 셰이핑 (Overlong Reward Shaping)

많은 설정에서 잘린 응답은 완전히 틀린 응답과 동일한 보상을 받는다. 이는 노이즈가 많다—응답이 대부분 올바른 추론을 포함하고도 길이 제한에 의해 잘릴 수 있다. DAPO는 하드 컷오프 전에 소프트 페널티 구간을 추가한다:

$$
R_{\text{length}}(y) = \begin{cases} 0, & |y| \le L_{\text{max}} - L_{\text{cache}} \\ \frac{(L_{\text{max}} - L_{\text{cache}}) - |y|}{L_{\text{cache}}}, & L_{\text{max}} - L_{\text{cache}} < |y| \le L_{\text{max}} \\ -1, & L_{\text{max}} < |y| \end{cases}
$$

약간 긴 응답은 가볍게만 페널티를 받고, 과도하게 긴 응답은 더 강한 부정적 피드백을 받는다. 모델은 응답 길이가 문제라는 것을 학습할 수 있으며, 잘림과 완전한 실패를 혼동하지 않는다.

### 7.4 동적 샘플링 (Dynamic Sampling)

프롬프트에 대한 모든 샘플 응답이 정답이거나 모두 오답이면, 그룹 상대 이점이 모두 0이 되어 그래디언트가 없다. DAPO는 각 프롬프트가 혼합된 결과(성공/실패 혼재)를 가질 때까지 계속 샘플링하여, 최적화 배치의 모든 프롬프트가 학습 신호를 제공하도록 보장한다. 이는 스텝 효율성을 개선하지만, 어려운 배치에서 더 많은 생성이 필요할 수 있어 벽시계 시간은 증가할 수 있다.

---

## 8. CISPO (Clipped Importance Sampling Policy Optimization)

CISPO[11]는 MiniMax-M1 보고서에서 도입되었으며, PPO 스타일 클리핑의 특정 약점을 겨냥한다: **토큰이 클립 범위를 벗어나면 PPO가 그래디언트를 완전히 차단**한다는 점이다.

이 동작은 보수적이지만 지나치게 조심스러울 수 있다. 큰 확률 변화를 겪는 토큰은 종종 추론 행동 학습에 가장 중요한 토큰이다 (보고서에서는 "However", "Recheck", "Wait", "Aha" 같은 토큰이 기본 모델에서 낮은 확률을 가지지만 추론 궤적의 분기점 역할을 할 수 있다고 언급). 비율이 너무 커질 때마다 이러한 토큰을 마스킹하면 유익한 그래디언트를 버려 학습이 느려진다.

CISPO는 **클리핑과 그래디언트 흐름을 분리**한다. 하드 마스크를 유도하는 방식으로 목적함수를 클리핑하는 대신, 중요도 샘플링 **가중치**만 클리핑하고 stop-gradient를 적용한다:

$$
J^{\text{CISPO}}(\theta) = \mathbb{E}\left[ \operatorname{sg}\!\left(\hat{\rho}_t(\theta)\right)\, \hat{A}_t\, \log \pi_\theta(a_t \mid s_t) \right], \qquad \hat{\rho}_t(\theta)=\operatorname{clip}\bigl(\rho_t(\theta), 1-\epsilon_{l}, 1+\epsilon_{h}\bigr)
$$

여기서 $\operatorname{sg}(\cdot)$은 stop-gradient를 나타낸다.

흥미롭게도 상한 클리핑 $\epsilon_h$만 필요하고 조정되며, 하한 $\epsilon_l$은 사실상 활성화되지 않을 정도로 높게 설정된다고 보고한다.

이 공식화는 IS 가중치 클리핑의 분산 감소 이점을 유지하면서 **모든 토큰에 대해 그래디언트가 흐르도록** 허용한다. MiniMax 실험에서 DAPO 대비 **2배 스텝 효율성 향상**을 달성했다.

CISPO는 PPO 스타일 마스킹의 소프트 대안으로 볼 수 있다: trust region 직관은 유지하되, 전체 업데이트를 삭제하지 않고 가중치를 클리핑한다.

---

## 9. MaxRL (Maximum Likelihood Reinforcement Learning)

MaxRL[12]은 다른 관점에서 출발한다: 표준 RL 목적함수는 기대 보상(pass@1)을 최적화하는데, 이는 종종 pass@1이 pass@$k$의 비용으로 개선되는 것이 관찰되며, 반드시 가장 적합한 목적함수는 아니다. 반면 최대우도 학습(사전학습과 SFT에서 사용)은 $\log p_\theta(x)$를 최대화한다.

이것이 중요한 이유:

$$
\log p_\theta(x) = -\sum_{k=1}^{\infty}\frac{(1-p_\theta(x))^k}{k}
$$

따라서 최대우도 그래디언트는 pass@1만이 아닌 pass@$k$ 그래디언트의 **무한 조화 혼합**이다. 표준 RL은 이 전개의 1차 항만 유지한다.

MaxRL은 **계산량 인덱싱된 절단 목적함수 계열**을 정의한다:

$$
J_{\text{MaxRL}}^{(T)}(x) = -\sum_{k=1}^{T}\frac{(1-p_\theta(x))^k}{k}
$$

여기서 $T=1$이면 표준 RL, $T\to \infty$이면 최대우도를 복원한다.

**On-policy 추정기:** 프롬프트에 대해 $N$개의 롤아웃 중 $K$개가 성공이면, 성공한 궤적의 스코어 함수만 평균한다:

$$
\hat{g}_N(x) = \begin{cases} \displaystyle \frac{1}{K}\sum_{i=1}^{N} r_i \nabla_\theta \log \pi_\theta(y_i \mid x), & K \ge 1 \\[0.8em] 0, & K = 0 \end{cases}
$$

이 추정기는 $T=N$인 절단 MaxRL 목적함수에 대해 비편향이다. REINFORCE와의 핵심 차이: 롤아웃 증가가 추정기 분산을 줄이는 동시에 **최적화되는 목적함수 자체를 최대우도에 더 가까운 근사**로 만든다.

REINFORCE 형태로 재작성하면, 성공률 $\hat{r} = K/N$에 대해 유효 이점은:

$$
\hat{A}_i^{\text{MaxRL}} \propto \frac{r_i - \hat{r}}{\hat{r}}
$$

이것은 MaxRL이 **어려운 프롬프트에 학습 신호를 집중**시키는 이유를 보여준다. $\hat{r}$이 작지만 0이 아닐 때, 해당 프롬프트의 성공 롤아웃은 강하게 가중된다. 반면 $\hat{r} \approx 1$인 쉬운 프롬프트는 상대적으로 적은 강조를 받는다.

실증적으로 MaxRL은 pass@$k$를 개선하고, GRPO보다 출력 다양성을 더 잘 보존하며, 테스트 시간 스케일링 효율성에서 상당한 이득을 얻는다.

---

## 10. DPPO (Divergence PPO)

DPPO[13]는 trust region 질문을 DAPO나 CISPO보다 더 직접적으로 재검토한다.

**핵심 비판:** PPO는 샘플링된 토큰의 확률 비율에 기반하여 클리핑한다. 이것은 특히 드문 토큰에서 실제 정책 발산의 나쁜 프록시일 수 있다. 확률이 10배 변해도 전체 분포에 매우 작은 영향만 미칠 수 있다.

이 문제는 학습/추론 프레임워크 불일치에 의해 더 증폭된다: 동일한 매개변수에서도 다른 프레임워크 간 확률 비율이 낮은 확률 토큰에서 매우 불안정할 수 있는 반면, total variation 같은 발산 측정치는 훨씬 안정적이다.

DPPO는 비율 기반 마스킹을 **추정된 정책 발산(TV 또는 KL) 기반 trust region**으로 대체한다:

$$
\upsilon_t(\theta) = \pi_\theta(a|s) - \pi_{\theta_{\text{old}}}(a|s)
$$

$$
M_{\text{div}}(\hat{A}_t, \upsilon_t, \delta) = \begin{cases} 0 & \text{if } (\hat{A}_t > 0 \land \upsilon_t > \delta) \lor (\hat{A}_t < 0 \land \upsilon_t < \delta) \\ 1 & \text{otherwise} \end{cases}
$$

**DPPO 업데이트:**

$$
J^{\text{DPPO}}(\theta) = \mathbb{E}\left[ M_{\text{div}}\!\left(\widehat{D}(\pi_\theta,\pi_{\theta_{\text{old}}}), \tau\right)\, \rho(\theta)\, \hat{A} \right]
$$

어휘 전체에 대한 정확한 발산 계산은 비싸지만, 이진 근사(샘플링된 토큰의 확률만 비교)나 top-K 근사가 실증적으로 잘 작동한다.

흥미로운 실험 통찰: 불안정성의 원인은 업데이트의 극히 일부(0.5% 미만)이며, 부정적 샘플이 정책을 너무 멀리 밀어내는 경우다. 이것만 차단하면 학습이 안정화된다.

---

## 11. ScaleRL

ScaleRL[14]은 새로운 목적함수를 발명하기보다는, **계산이 진지하게 스케일링되면 어떤 설계 선택이 여전히 중요한지** 결정하는 것이 목적이다. 400,000+ GPU-시간의 절삭 실험을 보고하며, 단일 학습 체크포인트 비교가 아닌 **시그모이드 성능 vs 계산량 곡선을 피팅**하여 방법을 평가한다.

이 프레이밍은 종종 혼동되는 두 가지를 분리하기 때문에 유용하다: 주어진 계산 예산에서 얼마나 빨리 개선되는지, 그리고 최종적으로 어디에서 포화되는지. 방법이 낮은 계산량에서 강해 보이면서도 일찍 정체될 수 있다. 다른 방법은 더 천천히 올라가지만 더 나은 점근선에 도달할 수 있다.

### 주요 발견:

**비동기 RL**: 일반적인 생성-후-업데이트 루프 대신 파이프라인된 비동기 설정을 선호한다. 롤아웃이 지속적으로 생성되고 가중치 업데이트가 즉시 푸시된다. 이는 주로 유휴 시간을 줄여 계산 효율성을 향상시킨다.

**손실 유형**: 비교한 off-policy 손실 함수 중 **CISPO와 GSPO가 DAPO를 점근적 성능에서 능가**한다. CISPO가 강한 결과와 상대적 견고성을 결합하여 기본값으로 선택되었다.

**FP32 로짓**: 생성 커널과 학습 커널 간의 작은 수치 불일치가 중요도 샘플링 비율을 실질적으로 왜곡할 수 있다. MiniMax 보고서에서 제안한 대로 **LM 헤드를 FP32로 계산**하면 이 문제가 크게 감소한다.

**손실 집계**: Dr. GRPO와 DAPO가 지적한 것과 같은 편향을 보여준다—샘플 평균이 차선이다. **프롬프트 수준 평균**이 최고 성능을 보인다.

**제로 분산 필터링**: 프롬프트의 모든 답이 정답이거나 모두 오답이면 학습 신호가 없다. 더 많이 샘플링하는 대신(DAPO처럼, 스텝 수에 최적일 수 있음) 해당 프롬프트를 최적화에서 **제외**하여 학습을 가속한다.

**양성 리샘플링 없음**: 프롬프트의 정답률이 90%를 초과하면 향후 에폭에서 제외한다. 학습은 약간 느려지지만 더 높은 점근적 성능에 도달한다.

---

## 12. 방법론 비교 요약표

| 방법론 | Baseline/Advantage | Clipping | Masking | 손실 집계 | 핵심 개선 |
|--------|-------------------|----------|---------|-----------|-----------|
| **REINFORCE** | EMA 또는 배치 평균 보상 | 없음 | 없음 | 샘플 평균 | policy gradient 확립 |
| **PPO** | GAE with critic | 대칭 IS | $M_{\text{sym}}(\hat{A}_t, \rho_t, 0.2)$ | 샘플 평균 | 안정적, 높은 샘플 효율 |
| **GRPO** | $(r-\mu_G)/\sigma_G$ | 대칭 IS | $M_{\text{sym}}(\hat{A}_t, \rho_t, 0.2)$ | 길이 정규화† | 메모리 경감 |
| **RLOO** | Leave-one-out 평균 | 없음 | 없음 | 샘플 평균 | critic 없이 분산 감소 |
| **Dr. GRPO** | $r - \mu_G$ | 대칭 IS | $M_{\text{sym}}(\hat{A}_t, \rho_t, 0.2)$ | 토큰 평균‡ | 길이 편향·σ 가중 제거 |
| **DAPO** | $(r-\mu_G)/\sigma_G$ | 비대칭 IS | $M_{\text{asym}}(\hat{A}_t, \rho_t, 0.2, 0.28)$ | 토큰 평균 | 작은 확률에 더 큰 여유 |
| **CISPO** | 그룹 내 $(r-\mu_G)/\sigma_G$ | 상한 IS | 없음 | 토큰 평균 | 그래디언트 마스킹 대신 클리핑만 |
| **DPPO** | 그룹 내 $(r-\mu)/\sigma$ | 대칭 DV | $M_{\text{div}}(\hat{A}_t, \upsilon_t, 0.15)$ | 샘플 평균 | DV trust region으로 LLM 도메인 적응 |
| **MaxRL** | $(r_i - \hat{r})/(N\cdot \hat{r})$ | 없음 | 없음 | 샘플 평균 | RL과 MLE 사이 보간, 더 나은 pass@k |
| **ScaleRL** | $(r-\mu_B)/\sigma_B$ | 상한 IS | 없음 | 프롬프트 평균 | 대규모 검증 및 스케일링 법칙 |

†구현체에 따라 다를 수 있음 (예: Huggingface TRL) ‡고정 상수 분모

---

## 13. 핵심 패턴 (Key Patterns)

모든 방법론에 걸쳐 반복되는 패턴:

**Critic은 LLM 학습에 불필요해 보인다.** PPO 이후 모든 방법이 더 단순한 기준선(그룹 평균, leave-one-out, greedy 롤아웃)이 학습된 가치 함수와 동등하거나 초과하면서 약 50% 메모리를 절약함을 발견했다. 강력한 사전학습 체크포인트에서 시작하는 LLM 파인튜닝 환경이 PPO의 분산 감소 장치를 대체로 불필요하게 만드는 것으로 보인다.

**표준편차 정규화는 해를 끼치는 경향이 있다.** Dr. GRPO와 MaxRL 모두 이점을 $\sigma$로 나누는 것이 거의 해결된 문제에 너무 많은 가중치를 부여함을 보여준다. ScaleRL 절삭 실험에서도 DAPO(σ 정규화 포함)가 CISPO와 GSPO(σ 정규화 없음)보다 유의미하게 낮은 점근적 성능에 도달함을 확인한다.

**손실 집계는 사소한 세부사항이 아니다.** Dr. GRPO와 DAPO는 시퀀스 수준 보상과 샘플 수준 평균의 결합이 토큰당 학습 신호를 왜곡할 수 있음을 보여준다. 손실의 리덕션은 방법의 핵심 부분이며, 잘못된 선택은 미묘한 편향을 도입할 수 있다.

**Trust region은 좋은 최적화 지점이다.** PPO의 trust region 정의($\epsilon = 0.2$)가 모델과 태스크에 걸쳐 놀랍도록 잘 작동하지만, 최근 많은 방법이 trust region을 타겟팅하여 개선된 성능을 보인다: DAPO는 비대칭으로 완화, CISPO는 그래디언트 마스킹 대신 가중치 클리핑, DPPO는 샘플링된 토큰 비율이 애초에 제약할 잘못된 양이라고 주장한다.

**잠정적 레시피가 등장하고 있다.** 현재 가장 강한 대규모 증거는 critic-free 학습, 토큰/프롬프트 인식 손실 집계, 더 소프트하거나 원칙적인 trust region 처리, 커리큘럼과 계산 할당에 대한 점점 더 명시적인 관심을 지지한다.

---

## 14. 미해결 과제 (Open Problems)

### 14.1 크레딧 할당 (Credit Assignment)

현재 결과 기반 방법은 응답의 모든 토큰에 본질적으로 동일한 보상을 할당한다. 놀랍도록 잘 작동하고 구현이 쉽지만, 명백히 비효율적이다. 추론 실패를 야기한 토큰이 주변의 상용구 토큰과 동일한 신호를 받는다. 프로세스 보상 모델, 단계별 검증기, 탐색 기반 방법, 분기 민감 학습 목적함수 모두 이를 해결하려 하지만, 아직 표준 해법이 되지 못했다.

### 14.2 샘플 효율성 (Sample Efficiency)

RL에서의 정보 이득은 단 1비트(정답/오답)이다. 대부분의 현재 레시피는 프롬프트당 8~64회의 롤아웃에 의존한다. 자동 검증기에서도 비싸고, 검증이 비용이 많이 들거나 부분적으로 수동인 경우 훨씬 나쁘다. 실패한 샘플의 더 나은 재사용, 오프라인-온라인 혼합, 더 나은 프롬프트 선택 정책이 비용을 크게 줄일 수 있다.

### 14.3 매우 어려운 문제 (Very Hard Problems)

모델이 프롬프트에 대해 정답 롤아웃을 생성하지 못하면, 여기의 모든 방법이 그래디언트를 제공하지 않는다. 커리큘럼 학습이 실전에서 도움되지만, 우회책일 뿐이다. 부분적으로 올바른 궤적에서 신호를 추출하거나, 탐색과 RL을 결합하는 더 강력한 방법이 중요한 연구 방향이다.

### 14.4 수학/코드 이외 도메인으로의 확장

거의 모든 최근 진전이 저렴하고 모호하지 않은 검증이 가능한 도메인(수학과 코드)에서 온다. 노이즈 많은 보상, 지연된 보상, 주관적 평가, 다중 턴 상호작용 환경으로의 확장은 여전히 어렵다.

### 14.5 실증적 신뢰성 (Empirical Reliability)

가장 과소평가된 미해결 문제일 수 있다. 이 분야의 증거는 실증적이고, 상대적으로 좁으며, 재현 비용이 높다. 많은 논문이 하나의 모델 계열, 하나의 검증기 설정, 하나의 데이터셋 혼합, 하나의 계산 예산을 테스트한다. ScaleRL이 명확히 하듯, 개입이 초기 학습 속도, 점근적 성능, 또는 둘 다를 변경할 수 있으며, 이들은 호환되지 않는다.

---

## 결론

RL for LLMs는 더 이상 작동하는 알고리즘의 부재에 의해 병목되지 않는다. 이제 여러 개가 있다. 더 어려운 문제는 효율성, 견고성, 일반성, 그리고 어떤 실증적 개선이 실제로 스케일과 전이에서 살아남는지 이해하는 것이다.

---

## 참고문헌

[1] Long Ouyang et al. "Training language models to follow instructions with human feedback." NeurIPS, 2022.
[2] Aaron Jaech et al. "OpenAI o1 system card." arXiv:2412.16720, 2024.
[3] DeepSeek-AI. "DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via Reinforcement Learning." 2025.
[4] John Schulman et al. "Proximal policy optimization algorithms." arXiv:1707.06347, 2017.
[5] Ronald Williams. "Simple statistical gradient-following algorithms for connectionist reinforcement learning." Machine learning, 1992.
[6] John Schulman et al. "Trust region policy optimization." ICML, 2015.
[7] Qiying Yu et al. "DAPO: An Open-Source LLM Reinforcement Learning System at Scale." NeurIPS, 2025.
[8] Zhihong Shao et al. "DeepSeekMath: Pushing the limits of mathematical reasoning in open language models." arXiv:2402.03300, 2024.
[9] Arash Ahmadian et al. "Back to basics: Revisiting REINFORCE-style optimization for learning from human feedback in LLMs." ACL, 2024.
[10] Zichen Liu et al. "Understanding R1-Zero-Like Training: A Critical Perspective." Conference on Language Modeling, 2025.
[11] Aili Chen et al. "Minimax-M1: Scaling test-time compute efficiently with lightning attention." arXiv:2506.13585, 2025.
[12] Fahim Tajwar et al. "Maximum Likelihood Reinforcement Learning." 2026.
[13] Penghui Qi et al. "Rethinking the Trust Region in LLM Reinforcement Learning." arXiv:2602.04879, 2026.
[14] Devvrit Khatri et al. "The art of scaling reinforcement learning compute for LLMs." arXiv:2510.13786, 2025.
[15] Chujie Zheng et al. "Group sequence policy optimization." arXiv:2507.18071, 2025.
[16] Zhenru Zhang et al. "The lessons of developing process reward models in mathematical reasoning." ACL 2025 Findings, 2025.
[17] Shuaijie She et al. "R-PRM: Reasoning-driven process reward modeling." EMNLP, 2025.
[18] Rituraj Sharma et al. "PRISM: Pushing the Frontier of Deep Think via Process Reward Model-Guided Inference." arXiv:2603.02479, 2026.
[19] Yixiu Mao et al. "Dynamics-Predictive Sampling for Active RL Finetuning of Large Reasoning Models." arXiv:2603.10887, 2026.
[20] Amrith Setlur et al. "Reuse your FLOPs: Scaling RL on Hard Problems by Conditioning on Very Off-Policy Prefixes." arXiv:2601.18795, 2026.
[21] Yuxiao Qu et al. "POPE: Learning to Reason on Hard Problems via Privileged On-Policy Exploration." arXiv:2601.18779, 2026.
[22] Xuandong Zhao et al. "Learning to reason without external rewards." arXiv:2505.19590, 2025.
[23] Ximing Lu et al. "Golden Goose: A Simple Trick to Synthesize Unlimited RLVR Tasks from Unverifiable Internet Text." arXiv:2601.22975, 2026.
[24] Chuxuan Hu et al. "Breaking Barriers: Do Reinforcement Post Training Gains Transfer To Unseen Domains?" arXiv:2506.19733, 2025.
[25] Yang Yue et al. "Does reinforcement learning really incentivize reasoning capacity in LLMs beyond the base model?" arXiv:2504.13837, 2025.
