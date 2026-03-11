---
title: "RewardFlow: Propagating Reward in the State Graphs of Agentic Learning with LLMs 논문 분석"
date: 2026-03-11
summary: "ICLR 2026 제출(Rejected) 논문. LLM 에이전트의 멀티턴 RL에서 희소 보상 문제를 해결하기 위해 상태 그래프 기반 보상 전파 프레임워크 RewardFlow를 제안한다. GRPO의 궤적 수준 보상을 상태 수준으로 확장하여, BFS 기반 역전파로 dense reward를 생성한다. Sokoban +28%, ALFWorld +12.5% 성능 향상. OpenReview 3명 리뷰어(Rating 0/4/6) 코멘트 포함 종합 분석."
tags: [LLM, Reinforcement Learning, GRPO, Reward Shaping, Credit Assignment, Agentic AI, 연구노트]
category: 연구노트
language: ko
---

# RewardFlow: Propagating Reward in the State Graphs of Agentic Learning with LLMs

**논문:** ICLR 2026 Submission (#23102) | **최종 결과: Rejected**
**OpenReview:** [forum](https://openreview.net/forum?id=5oGJbM5u86) | [PDF](https://openreview.net/pdf?id=5oGJbM5u86)

## 한 줄 요약

LLM 에이전트가 멀티턴 태스크에서 최종 성공/실패로만 보상을 받는 문제를 해결하기 위해, 여러 롤아웃 궤적을 **상태 그래프**로 통합하고 BFS로 보상을 역전파하여 **모든 중간 상태에 dense reward**를 부여하는 프레임워크이다.

---

## 1. 논문 개요

이 논문은 LLM 기반 에이전트의 멀티턴 강화학습(RL)에서 발생하는 **희소 보상(sparse reward)** 문제와 **크레딧 할당(credit assignment)** 문제를 해결하기 위해 **RewardFlow**라는 그래프 기반 보상 모델링 프레임워크를 제안한다. 핵심 아이디어는 에이전트의 행동 궤적(trajectory)을 **상태 그래프(state graph)**로 모델링하고, 성공한 터미널 상태로부터 그래프 전파 알고리즘(BFS, Personalized PageRank)을 사용해 모든 중간 상태에 보상 신호를 역전파하는 것이다.

---

## 2. 배경: GRPO (Group Relative Policy Optimization) 개념

RewardFlow를 이해하려면 먼저 GRPO를 이해해야 한다. GRPO는 DeepSeekMath(Shao et al., 2024)에서 제안된 RL 알고리즘으로, PPO의 critic 모델 없이도 효과적인 정책 최적화를 가능하게 한다.

### GRPO의 핵심 메커니즘

GRPO는 하나의 태스크에 대해 현재 정책으로부터 **K개의 롤아웃(rollout)**을 샘플링한다. 이 K개의 궤적을 하나의 "그룹"으로 묶고, 각 궤적이 받는 최종 보상을 그룹 내에서 상대적으로 비교한다:

```
A_trajectory = (r - μ) / σ
```

별도의 가치 함수 모델 없이도 상대적 비교만으로 정책을 업데이트할 수 있다.

### GRPO의 한계

GRPO의 근본적 한계는 **궤적 전체에 하나의 보상만 할당**한다는 점이다. 에이전트가 20~40 스텝의 행동을 취한 뒤, 최종 성공/실패 여부로만 보상이 결정되어 중간 단계의 좋은/나쁜 행동을 구분할 수 없고, 크레딧 할당이 불명확하다.

### RewardFlow가 GRPO를 확장하는 방식

RewardFlow는 GRPO의 그룹 샘플링 메커니즘은 유지하되, 보상 할당 방식을 **궤적 수준에서 상태 수준으로** 변환한다. 여러 궤적에서 관찰된 상태와 행동을 하나의 상태 그래프로 통합하고, 성공 노드로부터 역전파된 보상을 사용하여 각 (상태, 행동) 쌍에 대한 세밀한 어드밴티지를 계산한다.

---

## 3. RewardFlow 방법론 상세

### Figure 1: 에이전틱 시나리오에서의 상태 그래프

![Figure 1: 에이전틱 시나리오에서의 롤아웃 궤적을 상태 그래프로 투영하는 과정. 왼쪽 상단은 LLM 에이전트의 상호작용, 오른쪽 상단은 통합된 상태 그래프(s₀→s₁~s₅→s_f), 하단은 ALFWorld(텍스트 기반)와 Sokoban(비주얼 퍼즐) 환경에서의 구체적 예시.](/images/papers/rewardflow/figure1.png)

왼쪽 상단은 LLM-Driven Agent가 "State s"에서 "Action a"를 취하는 기본 구조, 오른쪽 상단은 노드 s₀(초기, 갈색)에서 중간 상태 s₁~s₅(흰색)를 거쳐 터미널 s_f(보라색)에 도달하는 그래프다. 하단 ALFWorld 예시는 "Go to shelf 1" → "Put cup on table" 등의 텍스트 행동으로 분기하는 궤적, Sokoban은 6×6 격자에서 up/down/left/right 행동으로 상자를 밀어 목표에 넣는 상태 전이를 보여준다.

### 3.1 상태 그래프 구축

에이전트 환경을 MDP `M = ⟨S, A, P, r, γ⟩`로 모델링한다. 에이전틱 MDP에서 많은 상태는 **합류적(junctional)** — 여러 경로로 도달 가능하고, **발산적(divergent)** — 여러 후속 상태로 분기한다. 따라서 MDP를 선형 체인이 아닌 **그래프**로 표현하는 것이 자연스럽다.

### 3.2 그룹 샘플링을 통한 근사 그래프 구축

K개의 롤아웃 궤적을 수집하여 근사한다. 이 궤적들의 합집합으로 원시 상태 그래프를 구성한다 (노드: 관찰된 상태 합집합, 엣지: 관찰된 전이 합집합).

### 3.3 그래프 정제 (Refinement)

**(1) 무효 엣지 제거:** self-loop이나 환경에서 거부된 행동을 제거한다.
**(2) 역방향 엣지 추가:** open ↔ close, go left ↔ go right 같은 역 행동 엣지를 추가하여 보상 전파의 도달 범위를 확대한다.

### 3.4 보상 전파 (Dense Shaping)

### Figure 2: RewardFlow 프레임워크 전체 파이프라인

![Figure 2: RewardFlow 파이프라인. 왼쪽 상단에서 K개의 롤아웃 궤적을 수집하고, 왼쪽 하단에서 상태 그래프를 구축(self-loop 제거, 역방향 엣지 추가)한 뒤 성공 터미널에서 보상을 역전파하고, 오른쪽에서 state-wise 그룹 어드밴티지를 계산하여 정책을 업데이트한다.](/images/papers/rewardflow/figure2.png)

3단계로 보상을 전파한다:

**(1) 최단 홉 거리:** 성공 터미널 상태로부터 역방향 BFS를 실행하여 각 상태의 최단 홉 거리 `d(s)`를 계산.

**(2) 상태별 보상:** `R(s) = γ^{d(s)}` — 성공에 가까울수록 높은 포텐셜.

**(3) 행동 수준 셰이핑:** `r̃(s_t, a_t) = R(s_{t+1}) - R(s_t)` — 성공에 가까워지면 양수, 멀어지면 음수.

### 3.5 상태별 그룹 어드밴티지 추정

각 상태 s에서 취해진 모든 행동-보상 쌍을 수집하여 상태별 평균과 표준편차로 정규화한다:

```
A(s, a) = (r̃ - μ(s)) / σ(s)
```

### 3.6 정책 최적화

PPO 스타일의 클리핑된 대리 목적함수를 사용한다.

---

## 4. 상태 그래프 시각화: 롤아웃 수에 따른 변화

### Figure 3: 1개 롤아웃으로 구축된 상태 그래프

![Figure 3: ALFWorld 환경에서 1개 롤아웃으로 구축된 상태 그래프. 노드 색상이 진할수록 높은 전파 보상. 초기 상태는 Node 0, 성공 터미널은 ★.](/images/papers/rewardflow/figure3.png)

### Figure 5: 2개 롤아웃으로 구축된 상태 그래프

![Figure 5: 2개 롤아웃으로 구축된 상태 그래프. 노드와 엣지가 증가하여 더 풍부한 그래프 구조.](/images/papers/rewardflow/figure5.png)

### Figure 7: 3개 롤아웃으로 구축된 상태 그래프

![Figure 7: 3개 롤아웃으로 구축된 상태 그래프. 그래프가 더 조밀해지며 보상 전파 정확도가 향상.](/images/papers/rewardflow/figure7.png)

ALFWorld 환경에서 롤아웃 수를 1→2→3으로 증가시킬 때, 상태 그래프가 확장되는 과정이다. 색상 스펙트럼(흰색→진한 파란)은 전파된 보상값을 나타내며, 진한 색일수록 성공 터미널에 가깝다. 롤아웃이 추가될수록 새로운 상태와 전이가 발견되어 BFS 기반 보상 전파가 더 정확해진다.

---

## 5. 실험 설계

**데이터셋:** Sokoban (비주얼 퍼즐), ALFWorld (텍스트 가정환경, 6종 태스크), WebShop (118만 Amazon 제품 웹 네비게이션), DeepResearch (검색 기반 QA)

**베이스라인:** Base(프롬프팅), RLOO, GRPO, GiGPO

**모델:** Qwen2.5-VL-3B/7B-Instruct (Sokoban), Qwen2.5-1.5B/3B/7B-Instruct (ALFWorld, WebShop), Qwen2.5-3B-Instruct (DeepResearch)

**학습:** 100 스텝(Sokoban/ALFWorld/WebShop), 200 스텝(DeepResearch). 매 스텝 16개 태스크, 8개 롤아웃.

**하드웨어:** 4× NVIDIA A100 (80GB) 또는 4× H20 (90GB). Verl-Agent 프레임워크.

---

## 6. 실험 결과 상세

### 6.1 메인 결과 (Table 1)

![Table 1: ALFWorld, WebShop, Sokoban에서의 성능 비교. 각 서브태스크 및 전체 평균 성공률(%).](/images/papers/rewardflow/table1.png)

**핵심:**
- Sokoban: 2위 대비 3B 기준 **+22.6%**, 7B 기준 **+28.1%** 향상
- ALFWorld: 평균 **+12.5%** 성능 향상
- WebShop: 모든 모델 규모에서 일관적으로 최고 성능

### 6.2 DeepResearch 결과 (Table 2)

![Table 2: DeepResearch에서 GRPO 대비 RewardFlow 성능 비교.](/images/papers/rewardflow/table2.png)

GRPO 대비 평균 +2.09% 개선. 특히 멀티 홉 QA인 2WikiMultiHopQA에서 **+5.9%** 향상.

### 6.3 Ablation Study & 프로세스 보상 모델 비교 (Tables 3 & 4)

![Tables 3 & 4: (좌) 각 컴포넌트 제거 시 성능 변화. (우) 프로세스 보상 모델과의 비교.](/images/papers/rewardflow/table3_4.png)

- 상태 전처리 제거: **-15.6%p** → 고품질 그래프 구축에 핵심
- 무효 행동 필터링 제거: **-9.3%p** → 노이즈 방지
- 역방향 엣지 제거: **-3.9%p** → 포괄적 보상 전파에 기여
- PPO 대비 **+22.6%**, GRPO+PRM 대비 **+34.3%** 성능 향상이면서 학습 시간도 가장 짧음 (320.3초/스텝)

### 6.4 탐색 다양성 & 학습 효율 (Tables 5 & 6)

![Tables 5 & 6: (상) 롤아웃 수에 따른 탐색 다양성 및 성능 변화. (하) 학습 스텝당 시간 분해.](/images/papers/rewardflow/table5_6.png)

- 롤아웃 4개에서도 RewardFlow가 GiGPO를 매칭 또는 능가
- 롤아웃 수 증가 시 이득이 더 크게 확대
- **그래프 구축 + 보상 전파: 세 환경 모두 2.39초 이하** — 전체 학습 시간의 무시할 수 있는 비중

---

## 7. OpenReview 리뷰어 평가

이 논문은 ICLR 2026에 제출되어 3명의 리뷰어로부터 평가를 받았다.

### Reviewer nRsk — Rating: 4 (marginally below acceptance)

**점수:** Soundness 3, Presentation 3, Contribution 3

**강점:**
1. 상태 그래프 + 전파 알고리즘을 활용한 dense reward shaping은 sparse-reward credit assignment 문제의 창의적 해법
2. 명확한 작성, 유용한 다이어그램
3. 상당한 성능 향상 — Sokoban 최대 28%, ALFWorld 12.5%
4. 여러 LLM 규모(1.5B/3B/7B)에서 일반화 입증

**약점:**
1. **그래프 품질 의존** — 확률적/모호한 환경에서 구축 어려움
2. **텍스트 상태 모호성** — ALFWorld에서 동일 상태 식별 전략 부족
3. **평가 범위** — GUI/웹 에이전트 등 더 다양한 환경 필요
4. **보상 학습과의 비교 부족** — step-wise feedback, preference-based learning 등

**질문:** 롤아웃 품질 민감도, 상태 앨리어싱 환경 확장, GNN 기반 전파 함수 가능성

### Reviewer XBZr — Rating: 0 (strong reject)

**점수:** Soundness 1, Presentation 2, Contribution 1

**강점:** state-wise reward shaping의 중요성 인정, 논문이 따라가기 쉬움

**약점:**
1. **프레젠테이션** — 기초 개념에 과도한 지면, 분석 깊이 부족
2. **소규모 MDP 한정** — 이산적/결정론적 환경 가정, 홉 기반 거리가 확률적 설정에서 미정의
3. **분석 부재** — 정책 엔트로피와 그래프 커버리지 관계 분석 없음
4. **확장성 의문** — BFS 대신 A*, Dijkstra가 더 효과적일 수 있음

**질문:** 불일치 상태 언급 이유(환경 상태는 항상 유효), 비방향 그래프 변환의 비가역적 환경 제한

### Reviewer ajjd — Rating: 6 (marginally above acceptance)

**점수:** Soundness 3, Presentation 3, Contribution 2

**강점:**
1. 프로세스 보상 모델의 복잡성 없이 세밀한 보상 할당을 달성하는 **효율적 솔루션**
2. GRPO/GiGPO 대비 유의미한 향상, 다양한 백본에서 안정적 학습
3. 명확한 작성, 일관된 표기법, 생동감 있는 그림

**약점:**
1. **적용 가능성 제한** — 자연어 추론처럼 상태 공간이 방대한 태스크에서 어려움
2. **학습 수렴** — 100 스텝 내 미수렴 징후
3. **백본 규모** — 제한된 역량의 모델만 사용, 대규모 LLM에서의 효과 불확실
4. **효율성 분석** — 명시적 지연 시간 분석 필요

---

## 8. 종합 분석

### 공통 강점
세 리뷰어 모두 (1) 상태 그래프 기반 보상 전파의 참신성, (2) 일관된 성능 향상, (3) 명확한 작성을 긍정 평가.

### 공통 약점
가장 핵심 우려는 **적용 가능성의 범위**. Sokoban/ALFWorld 같은 이산적 환경에서는 잘 작동하지만, 자연어/연속 상태 공간으로의 확장이 불분명.

### 핵심 논쟁점
Reviewer XBZr(soundness 1)과 나머지(soundness 3) 사이의 극단적 시각차가 rejection의 주요 원인. XBZr은 소규모 MDP 한정이라 판단한 반면, nRsk/ajjd는 방법론 자체는 건전하다고 인정.

### 저자 리버틀
WebShop과 DeepResearch 추가 실험, 탐색 다양성 ablation, 학습 효율 데이터로 대응했으나 XBZr의 근본적 우려를 해소하지 못한 것으로 보임.

---

## 9. 한계 및 향후 연구

1. **상태 그래프 품질 의존** — 제한된 롤아웃이 충분한 전이를 포착하지 못하면 성능 저하
2. **희소 환경 한계** — 상태가 선형 체인에 가까우면 그래프 기반 이점 감소
3. **비가역적 행동** — 양방향 엣지가 부적합한 환경 존재

향후: 그래프 강건성 향상, 적응적 디노이징, GNN 기반 보상 전파, 대규모 LLM + 복잡한 실제 환경 검증.
