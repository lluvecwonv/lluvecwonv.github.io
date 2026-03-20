---
title: "State of RL for Reasoning LLMs 정리"
date: 2026-03-20
summary: "A. Weers의 블로그 포스트 정리. 추론(reasoning) LLM을 위한 강화학습(RL) 방법론의 현황을 종합적으로 분석한다. REINFORCE, PPO, GRPO, RLOO, Dr. GRPO, DAPO, CISPO, MaxRL, DPPO, ScaleRL 등 주요 알고리즘을 비교하며, critic-free 접근법, 토큰 수준 집계, 완화된 trust region이 최근 트렌드임을 보인다. 크레딧 할당, 샘플 효율성, 수학/코드 이외 도메인 확장 등 미해결 과제도 논의한다."
tags: [LLM, 강화학습, RL, PPO, GRPO, DAPO, RLOO, Reasoning, 연구노트]
category: 연구노트
language: ko
---

# State of RL for Reasoning LLMs

**출처:** A. Weers (2026년 3월 15일) | [원문 링크](https://aweers.de/blog/2026/rl-for-llms/)
**읽기 시간:** 약 26분

## 한 줄 요약

강화학습(RL)은 언어모델의 추론 능력을 향상시키는 핵심 기법으로 자리잡았다. 2024~2026년 사이 등장한 "2세대" RL 방법론들은 범용 지시 따르기가 아닌 **추론(reasoning) 특화** 최적화를 목표로 하며, critic(가치 모델) 없는 경량화, 토큰 수준 집계, 완화된 trust region 등의 공통 패턴을 보인다. 이 글은 REINFORCE부터 ScaleRL까지 주요 알고리즘을 체계적으로 비교 분석한다.

---

## 1. 강화학습 기초 개요

저자는 먼저 RL의 기본 개념을 정리한다:

- **상태(State), 행동(Action), 정책(Policy), 보상(Reward)** 프레임워크
- **기대 수익(Expected Return)**: J = E[Σ γ^t r_t]
- **가치 함수(Value Function)**: V^π(s) — 특정 상태의 질을 측정
- **LLM에 대한 단순화**: 프롬프트 = 상태, 응답 = 행동, 스칼라 보상으로 환원

LLM 맥락에서 RL은 프롬프트가 주어지면 응답을 생성하고, 그 응답의 품질(정답 여부 등)에 기반한 스칼라 보상을 최적화하는 구조다.

---

## 2. REINFORCE

가장 기본적인 policy gradient 알고리즘이다.

**핵심 수식:**

```
∇J(θ) = E[∇log π_θ(y|x) · r(x,y)]
```

- 높은 보상을 받은 응답의 로그 확률을 높이고, 낮은 보상을 받은 응답의 로그 확률을 낮춘다.
- **분산 감소**: 기준선(baseline) b(x)를 빼서 이점(advantage)을 추정한다.
  - Advantage: Â = r(x,y) - b(x)
- 단순하지만 분산이 크다는 한계가 있다.

---

## 3. PPO (Proximal Policy Optimization)

REINFORCE의 불안정성을 해결하기 위해 **trust region** 개념을 도입한 알고리즘이다.

**핵심 메커니즘:**

- **중요도 샘플링 비율(Importance Sampling Ratio)**: ρ_t(θ) = π_θ(a_t|s_t) / π_θ_old(a_t|s_t)
- **클리핑(Clipping)**: 비율을 (1-ε, 1+ε) 범위로 제한하여 정책 업데이트가 너무 크지 않도록 방지
- **KL 정규화**: 참조 정책과의 분포 차이를 제한

**메모리 요구사항:** 4가지 컴포넌트 필요:
1. 현재 정책 (policy)
2. 롤아웃 정책 (rollout policy)
3. 참조 정책 (reference policy)
4. 가치 모델 (value model / critic)

이 높은 메모리 요구사항이 이후 방법론들의 주요 개선 동기가 된다.

---

## 4. GRPO (Group Relative Policy Optimization)

PPO의 critic(가치 모델)을 제거하여 **메모리를 약 50% 절감**한 알고리즘이다.

**핵심 아이디어 — 그룹 상대 이점(Group-Relative Advantage):**

```
Â_i = (r_i - μ_G) / σ_G
```

- 같은 프롬프트에 대해 여러 응답을 샘플링한 뒤, 그룹 내에서 상대적으로 비교한다.
- 학습된 기준선(critic) 대신 그룹 평균/표준편차를 사용한다.
- PPO 스타일의 클리핑은 유지한다.

**장점:** critic이 불필요하므로 메모리 효율이 크게 향상된다.

---

## 5. RLOO (REINFORCE Leave-One-Out)

GRPO와 유사하게 critic을 제거하되, PPO 클리핑도 함께 제거한 순수 REINFORCE 스타일 알고리즘이다.

**Leave-One-Out 기준선:**

```
Â_i = r_i - (1/(K-1)) Σ_{j≠i} r_j
```

- 자기 자신을 제외한 나머지 응답들의 평균 보상을 기준선으로 사용한다.
- 클리핑이 실제로 활성화되는 비율이 5% 미만이라는 관측에 기반하여 클리핑을 제거하였다.

**특징:** 순수 REINFORCE 업데이트로 회귀하면서도, leave-one-out 기준선으로 분산을 효과적으로 감소시킨다.

---

## 6. Dr. GRPO

표준 GRPO의 **정규화 편향(normalization bias)** 문제를 해결한 변형이다.

**주요 변경 사항:**

1. **표준편차 정규화 제거**: σ_G로 나누는 것이 학습 신호를 왜곡할 수 있음을 지적
2. **고정 상수 사용**: 시퀀스 수준 평균 대신 고정 상수로 손실을 집계
3. **단순화된 이점**:

```
Â_i = r_i - μ_G
```

표준편차 정규화를 제거하면 최종 성능이 개선된다는 것이 핵심 발견이다.

---

## 7. DAPO (Decoupled Advantage Policy Optimization)

4가지 핵심 개선사항을 통합한 알고리즘이다:

1. **토큰 수준 집계(Token-Level Aggregation)**: 샘플 수준이 아닌 토큰 수준에서 손실을 집계
2. **비대칭 클리핑(Asymmetric Clipping)**: ε_low = 0.2, ε_high = 0.28로 설정하여 탐색(exploration)을 촉진
3. **과도한 길이에 대한 보상 셰이핑(Overlong Reward Shaping)**: 소프트 페널티 구간으로 긴 응답을 제어
4. **동적 샘플링(Dynamic Sampling)**: 프롬프트별로 혼합된 결과(성공/실패 혼재)를 보장

**장점:** 각 개선사항이 독립적으로도 효과가 있으며, 결합 시 시너지를 발휘한다.

---

## 8. CISPO (Clipped Importance Sampling Policy Optimization)

클리핑과 그래디언트 흐름을 **분리(decouple)**한 알고리즘이다.

**핵심 아이디어:**

- **Stop-gradient**: 클리핑된 가중치에 sg(ρ̂_t(θ))를 적용
- 클리핑에도 불구하고 모든 토큰에 대해 그래디언트가 흐르도록 허용
- DAPO 대비 **2배 속도 향상**을 보고

클리핑이 trust region을 유지하면서도, 그래디언트 차단으로 인한 학습 신호 손실을 방지하는 것이 핵심이다.

---

## 9. MaxRL (Maximum Likelihood RL)

RL을 **근사 최대우도(approximate maximum-likelihood) 학습**으로 재구성한 방법이다.

**핵심 수식:**

```
log p_θ(x) = -Σ (1-p_θ(x))^k / k
```

**성공 전용 평균(Success-Only Averaging):**

```
ĝ_N(x) = (1/K) Σ r_i ∇log π_θ(y_i|x)
```

- pass@1 최적화가 아닌 **pass@k 다양성**을 개선하는 것을 목표로 한다.
- 성공한 응답에서만 학습 신호를 추출한다.

---

## 10. DPPO (Divergence PPO)

비율 기반 마스킹을 **발산 기반 trust region**으로 대체한 알고리즘이다.

**핵심 변경:**

- 확률 비율(ρ) 대신 **TV(Total Variation) 또는 KL 발산** 사용
- **이진 발산 근사(Binary Divergence Approximation)**: 계산 효율성 확보
- 발산 임계값 τ를 초과하는 업데이트를 마스킹

토큰별로 발산이 임계값을 넘으면 해당 토큰의 업데이트를 차단하는 방식으로 trust region을 관리한다.

---

## 11. ScaleRL

400,000+ GPU-시간의 대규모 실험을 통한 검증 연구이다.

**주요 발견:**

1. **비동기 RL 파이프라이닝**: 효율성 향상
2. **CISPO/GSPO가 DAPO보다 대규모에서 우수**
3. **FP32 로짓**: 커널 불일치(kernel mismatch)를 줄임
4. **프롬프트 수준 평균**: 샘플 평균보다 우수
5. **제로 분산 프롬프트 필터링**: 학습 신호가 없는 프롬프트 제거
6. **고정확도 프롬프트 제외**: 이미 잘 풀리는 프롬프트를 재샘플링에서 제외

대규모 환경에서의 실전적인 RL 학습 레시피를 제공한다.

---

## 12. 방법론 비교 요약표

| 방법론 | 기준선/이점 | 클리핑 | 마스킹 | 손실 집계 | 핵심 개선 |
|--------|-------------|--------|--------|-----------|-----------|
| REINFORCE | r(x,y) - b(x) | 없음 | 없음 | 샘플 | 기본 policy gradient |
| PPO | 가치 모델 기반 | 대칭 (1±ε) | 비율 기반 | 샘플 | Trust region + critic |
| GRPO | 그룹 상대 (μ_G, σ_G) | 대칭 (1±ε) | 비율 기반 | 샘플 | Critic 제거 (~50% 메모리 절감) |
| RLOO | Leave-one-out | 없음 | 없음 | 샘플 | 클리핑도 제거 |
| Dr. GRPO | r_i - μ_G (σ 제거) | 대칭 (1±ε) | 비율 기반 | 고정 상수 | 정규화 편향 수정 |
| DAPO | 그룹 상대 | 비대칭 | 비율 기반 | 토큰 수준 | 4가지 통합 개선 |
| CISPO | 그룹 상대 | Stop-gradient | 비율 기반 | 토큰 수준 | 클리핑-그래디언트 분리, 2배 속도 |
| MaxRL | 성공 전용 | 없음 | 없음 | 성공 평균 | 최대우도 재구성 |
| DPPO | 그룹 상대 | 없음 | 발산 기반 | 토큰 수준 | TV/KL trust region |
| ScaleRL | 다양 | CISPO/GSPO | 다양 | 프롬프트 수준 | 대규모 실전 검증 |

---

## 13. 핵심 트렌드 및 패턴

모든 방법론에 걸쳐 다음과 같은 공통 패턴이 관찰된다:

1. **Critic(가치 모델)은 LLM 파인튜닝에 불필요**: 그룹 상대 또는 leave-one-out 기준선이 충분
2. **표준편차 정규화는 성능을 저하시킴**: 단순 평균 빼기가 더 효과적
3. **손실 집계 방식이 학습 신호에 큰 영향**: 토큰 수준 또는 프롬프트 수준 집계가 우수
4. **Trust region 정의가 최적화 기회**: 클리핑, 발산 기반, stop-gradient 등 다양한 접근
5. **최근 레시피**: critic-free + 토큰 인식 집계 + 완화된 trust region

---

## 14. 미해결 과제 (Open Problems)

저자는 5가지 주요 미해결 과제를 제시한다:

### 14.1 크레딧 할당 (Credit Assignment)
현재 방법론들은 모든 토큰에 동일한 보상을 할당한다. 어떤 토큰이 올바른 추론에 기여했는지, 어디서 실패가 발생했는지에 대한 세밀한 분석이 부족하다.

### 14.2 샘플 효율성 (Sample Efficiency)
프롬프트당 8~64회의 롤아웃이 필요하다. 더 나은 재사용 및 오프라인 믹싱 전략이 필요하다.

### 14.3 매우 어려운 문제 (Very Hard Problems)
모든 롤아웃이 실패할 경우 그래디언트 신호가 전혀 없다. 커리큘럼 학습만으로는 부족하다.

### 14.4 수학/코드 이외 도메인으로의 확장
노이즈가 많고, 지연된, 또는 주관적인 보상이 있는 도메인에서의 적용이 어렵다.

### 14.5 실증적 신뢰성 (Empirical Reliability)
증거가 좁고, 재현 비용이 높으며, 스케일링 행동이 맥락에 따라 달라진다.

---

## 15. 결론

RL for Reasoning LLMs 분야는 메모리 집약적 critic 기반 방법에서 더 단순하고 효율적인 critic-free 접근법으로 빠르게 진화하고 있다. 정교한 trust region 처리와 토큰 수준 집계가 새로운 표준으로 자리잡고 있지만, 크레딧 할당, 샘플 효율성, 일반화 등의 핵심 과제는 여전히 해결되지 않았다.

---

## 참고문헌

- Schulman et al. (2017). Proximal Policy Optimization Algorithms.
- DeepSeek-R1 (2025).
- 그 외 25개 이상의 참고문헌은 [원문](https://aweers.de/blog/2026/rl-for-llms/)에서 확인 가능.
