---
title: "RewardFlow: Propagating Reward in the State Graphs of Agentic Learning with LLMs Paper Analysis"
date: 2026-03-11
summary: "ICLR 2026 Submission (Rejected). This paper proposes RewardFlow, a state graph-based reward propagation framework to address the sparse reward problem in multi-turn RL for LLM agents. By extending GRPO's trajectory-level rewards to the state level and generating dense rewards through BFS-based backpropagation, the method achieves Sokoban +28%, ALFWorld +12.5% improvements. Comprehensive analysis with OpenReview reviewer feedback (Rating 0/4/6)."
tags: [LLM, Reinforcement Learning, GRPO, Reward Shaping, Credit Assignment, Agentic AI, Research Notes]
category: Research Notes
language: en
---

# RewardFlow: Propagating Reward in the State Graphs of Agentic Learning with LLMs

**Paper:** ICLR 2026 Submission (#23102) | **Final Status: Rejected**
**OpenReview:** [forum](https://openreview.net/forum?id=5oGJbM5u86) | [PDF](https://openreview.net/pdf?id=5oGJbM5u86)

## One-Line Summary

To address the problem where LLM agents receive rewards only from final success/failure on multi-turn tasks, RewardFlow integrates multiple rollout trajectories into a **state graph** and backpropagates rewards via BFS to assign **dense rewards to all intermediate states**.

---

## 1. Paper Overview

This paper proposes **RewardFlow**, a graph-based reward modeling framework to address the **sparse reward** and **credit assignment** problems in multi-turn reinforcement learning for LLM-based agents. The core idea is to model agent behavior trajectories as **state graphs** and use graph propagation algorithms (BFS, Personalized PageRank) to backpropagate reward signals from successful terminal states to all intermediate states.

---

## 2. Background: GRPO (Group Relative Policy Optimization) Concept

To understand RewardFlow, one must first understand GRPO. GRPO is an RL algorithm proposed in DeepSeekMath (Shao et al., 2024) that enables effective policy optimization without a critic model in PPO.

### GRPO Core Mechanism

GRPO samples **K rollouts** from the current policy for a single task. These K trajectories are grouped, and each trajectory's final reward is compared relatively within the group:

```
A_trajectory = (r - mu) / sigma
```

Without a separate value function model, policy can be updated through relative comparison alone.

### GRPO Limitations

The fundamental limitation of GRPO is that **only one reward is assigned to the entire trajectory**. After the agent takes 20-40 steps of actions, the reward is determined only by final success/failure, making it impossible to distinguish between good and bad intermediate actions, with unclear credit assignment.

### How RewardFlow Extends GRPO

RewardFlow maintains GRPO's group sampling mechanism but transforms the reward assignment from **trajectory level to state level**. It integrates observed states and actions from multiple trajectories into a single state graph, and uses backpropagated rewards from successful nodes to compute fine-grained advantages for each (state, action) pair.

---

## 3. RewardFlow Methodology in Detail

### Figure 1: State Graph in Agentic Scenarios

![Figure 1: Process of projecting rollout trajectories into a state graph in the ALFWorld environment. Upper left shows LLM agent interaction, upper right shows the integrated state graph (s0→s1~s5→sf), and lower section shows concrete examples in ALFWorld (text-based) and Sokoban (visual puzzle) environments.](/images/papers/rewardflow/figure1.png)

Upper left shows the basic structure where an LLM-Driven Agent takes "Action a" from "State s", upper right shows a graph where nodes s0 (initial, brown) reach terminal sf (purple) through intermediate states s1~s5 (white). The lower ALFWorld example shows trajectories branching by text actions like "Go to shelf 1" → "Put cup on table", while Sokoban shows state transitions on a 6×6 grid where actions (up/down/left/right) push a box toward the goal.

### 3.1 State Graph Construction

The agent environment is modeled as an MDP M = ⟨S, A, P, r, γ⟩. In agentic MDPs, many states are **junctional** — reachable via multiple paths, and **divergent** — branching to multiple subsequent states. Therefore, representing the MDP as a **graph** rather than a linear chain is natural.

### 3.2 Approximate Graph Construction via Group Sampling

K rollout trajectories are collected for approximation. A raw state graph is constructed from their union (nodes: union of observed states, edges: union of observed transitions).

### 3.3 Graph Refinement

**(1) Invalid Edge Removal:** Remove self-loops or actions rejected by the environment.
**(2) Reverse Edge Addition:** Add reverse action edges like open ↔ close, go left ↔ go right to expand the reach of reward propagation.

### 3.4 Reward Propagation (Dense Shaping)

### Figure 2: RewardFlow Framework Complete Pipeline

![Figure 2: RewardFlow pipeline. Upper left collects K rollout trajectories, lower left constructs the state graph (self-loop removal, reverse edge addition) and backpropagates rewards from successful terminals, right side computes state-wise group advantage and updates policy.](/images/papers/rewardflow/figure2.png)

Rewards are propagated in three stages:

**(1) Shortest Hop Distance:** Execute reverse BFS from successful terminal state to compute shortest hop distance d(s) for each state.

**(2) State-wise Reward:** R(s) = γ^(d(s)) — higher potential for states closer to success.

**(3) Action-level Shaping:** r(st, at) = R(st+1) - R(st) — positive when moving closer to success, negative when moving away.

### 3.5 State-wise Group Advantage Estimation

All action-reward pairs taken from each state s are collected and normalized by state-specific mean and standard deviation:

```
A(s, a) = (r - mu(s)) / sigma(s)
```

### 3.6 Policy Optimization

Uses clipped surrogate objective function in PPO style.

---

## 4. State Graph Visualization: Changes with Rollout Count

### Figure 3: State Graph Constructed from 1 Rollout

![Figure 3: State graph constructed from 1 rollout in ALFWorld environment. Darker node colors indicate higher propagated reward. Initial state is Node 0, successful terminal is ★.](/images/papers/rewardflow/figure3.png)

### Figure 5: State Graph Constructed from 2 Rollouts

![Figure 5: State graph constructed from 2 rollouts. Increased nodes and edges create a richer graph structure.](/images/papers/rewardflow/figure5.png)

### Figure 7: State Graph Constructed from 3 Rollouts

![Figure 7: State graph constructed from 3 rollouts. Graph becomes denser and reward propagation accuracy improves.](/images/papers/rewardflow/figure7.png)

This shows the expansion process of the state graph as rollout count increases from 1→2→3 in ALFWorld. The color spectrum (white→dark blue) represents propagated reward values, with darker colors closer to the successful terminal. As rollouts increase, new states and transitions are discovered, making BFS-based reward propagation more accurate.

---

## 5. Experimental Design

**Datasets:** Sokoban (visual puzzle), ALFWorld (text-based household environment, 6 task types), WebShop (1.18M Amazon product web navigation), DeepResearch (search-based QA)

**Baselines:** Base (prompting), RLOO, GRPO, GiGPO

**Models:** Qwen2.5-VL-3B/7B-Instruct (Sokoban), Qwen2.5-1.5B/3B/7B-Instruct (ALFWorld, WebShop), Qwen2.5-3B-Instruct (DeepResearch)

**Training:** 100 steps (Sokoban/ALFWorld/WebShop), 200 steps (DeepResearch). Per step: 16 tasks, 8 rollouts.

**Hardware:** 4× NVIDIA A100 (80GB) or 4× H20 (90GB). Verl-Agent framework.

---

## 6. Experimental Results in Detail

### 6.1 Main Results (Table 1)

![Table 1: Performance comparison on ALFWorld, WebShop, and Sokoban. Success rates (%) for each subtask and overall average.](/images/papers/rewardflow/table1.png)

**Key findings:**
- Sokoban: **+22.6%** improvement over 2nd place on 3B baseline, **+28.1%** on 7B
- ALFWorld: Average **+12.5%** performance improvement
- WebShop: Consistently best performance across all model scales

### 6.2 DeepResearch Results (Table 2)

![Table 2: DeepResearch performance comparison of RewardFlow against GRPO.](/images/papers/rewardflow/table2.png)

Average +2.09% improvement over GRPO. Particularly, **+5.9%** improvement on 2WikiMultiHopQA, a multi-hop QA task.

### 6.3 Ablation Study & Process Reward Model Comparison (Tables 3 & 4)

![Tables 3 & 4: (Left) Performance change when removing each component. (Right) Comparison with process reward models.](/images/papers/rewardflow/table3_4.png)

- State preprocessing removal: **-15.6%p** → critical for high-quality graph construction
- Invalid action filtering removal: **-9.3%p** → prevents noise
- Reverse edge removal: **-3.9%p** → contributes to comprehensive reward propagation
- **+22.6%** over PPO, **+34.3%** over GRPO+PRM while having the shortest training time per step (320.3 seconds/step)

### 6.4 Exploration Diversity & Learning Efficiency (Tables 5 & 6)

![Tables 5 & 6: (Upper) Exploration diversity and performance changes with rollout count. (Lower) Time breakdown per training step.](/images/papers/rewardflow/table5_6.png)

- RewardFlow with 4 rollouts matches or exceeds GiGPO
- Performance gains expand further as rollout count increases
- **Graph construction + reward propagation: under 2.39 seconds across all three environments** — negligible portion of total training time

---

## 7. OpenReview Reviewer Evaluation

The paper was submitted to ICLR 2026 and received evaluations from 3 reviewers.

### Reviewer nRsk — Rating: 4 (marginally below acceptance)

**Scores:** Soundness 3, Presentation 3, Contribution 3

**Strengths:**
1. Creative solution to sparse-reward credit assignment problem using state graph + propagation algorithms
2. Clear writing, useful diagrams
3. Substantial performance improvements — up to 28% on Sokoban, 12.5% on ALFWorld
4. Demonstrated generalization across multiple LLM scales (1.5B/3B/7B)

**Weaknesses:**
1. **Graph quality dependency** — difficult to construct in stochastic/ambiguous environments
2. **Text state ambiguity** — ALFWorld lacks explicit strategy for identical state identification
3. **Limited evaluation scope** — need more diverse environments like GUI/web agents
4. **Insufficient comparison with reward learning** — missing step-wise feedback, preference-based learning comparisons

**Questions:** Rollout quality sensitivity, state aliasing in extended environments, possibility of GNN-based propagation functions

### Reviewer XBZr — Rating: 0 (strong reject)

**Scores:** Soundness 1, Presentation 2, Contribution 1

**Strengths:** Acknowledges importance of state-wise reward shaping, paper is easy to follow

**Weaknesses:**
1. **Presentation** — excessive space on foundational concepts, insufficient analytical depth
2. **Limited to small MDPs** — assumes discrete/deterministic environments, hop-based distance is undefined in stochastic settings
3. **Missing analysis** — no analysis of relationship between policy entropy and graph coverage
4. **Scalability concerns** — A*, Dijkstra might be more effective than BFS

**Questions:** Why mention inconsistent states (environment states always valid), non-directional graph conversion's limitation with irreversible environments

### Reviewer ajjd — Rating: 6 (marginally above acceptance)

**Scores:** Soundness 3, Presentation 3, Contribution 2

**Strengths:**
1. **Efficient solution** that achieves fine-grained reward assignment without complexity of process reward models
2. Significant improvements over GRPO/GiGPO, stable learning across diverse backbones
3. Clear writing, consistent notation, vivid figures

**Weaknesses:**
1. **Limited applicability** — difficult for tasks with large state spaces like natural language reasoning
2. **Learning convergence** — signs of non-convergence within 100 steps
3. **Model scale** — only limited-capacity models used, effect on large-scale LLMs uncertain
4. **Efficiency analysis** — needs explicit latency analysis

---

## 8. Comprehensive Analysis

### Common Strengths

All three reviewers positively evaluate (1) novelty of state graph-based reward propagation, (2) consistent performance improvements, (3) clear writing.

### Common Weaknesses

The most critical concern is **scope of applicability**. The method works well in discrete environments like Sokoban/ALFWorld, but extension to natural language/continuous state spaces remains unclear.

### Core Dispute

The extreme divergence between Reviewer XBZr (soundness 1) and others (soundness 3) is the main reason for rejection. XBZr judges the work as limited to small MDPs, while nRsk/ajjd acknowledge the methodology itself as sound.

### Author Rebuttal

Response with additional WebShop and DeepResearch experiments, exploration diversity ablation, and learning efficiency data did not resolve XBZr's fundamental concerns.

---

## 9. Limitations and Future Work

1. **Graph quality dependency** — insufficient rollouts may not capture sufficient transitions, leading to performance degradation
2. **Sparse environment limitations** — if states form a linear chain, graph-based advantages diminish
3. **Irreversible actions** — environments exist where bidirectional edges are inappropriate

Future directions: improve graph robustness, adaptive denoising, GNN-based reward propagation, validation with large-scale LLMs and complex real-world environments.
