---
title: "State of RL for Reasoning LLMs — Summary"
date: 2026-03-20
summary: "A comprehensive analysis of reinforcement learning methods for reasoning LLMs, summarizing A. Weers' blog post. Covers REINFORCE, PPO, GRPO, RLOO, Dr. GRPO, DAPO, CISPO, MaxRL, DPPO, and ScaleRL. Identifies emerging patterns: critic-free approaches, token-level aggregation, and softer trust regions. Discusses open problems in credit assignment, sample efficiency, and extension beyond math/code domains."
tags: [LLM, Reinforcement Learning, RL, PPO, GRPO, DAPO, RLOO, Reasoning, Research Note]
category: 연구노트
language: en
---

# State of RL for Reasoning LLMs

**Source:** A. Weers (March 15, 2026) | [Original Post](https://aweers.de/blog/2026/rl-for-llms/)
**Read Time:** ~26 minutes

## TL;DR

Reinforcement learning has become central to advancing language model reasoning capabilities. The "second generation" of RL methods (2024–2026) targets **reasoning-specific optimization** rather than general instruction-following. Across all methods, common patterns emerge: critic-free designs, token-level aggregation, and softer trust regions. This post systematically compares algorithms from REINFORCE through ScaleRL.

---

## 1. Brief RL Introduction

The author begins by reviewing fundamental RL concepts:

- **State, Action, Policy, and Reward** framework
- **Expected Return**: J = E[Σ γ^t r_t]
- **Value Function**: V^π(s) — measures state quality
- **LLM Simplification**: prompts as states, responses as actions, scalar rewards

In the LLM context, RL generates responses to prompts and optimizes a scalar reward based on response quality (e.g., correctness).

---

## 2. REINFORCE

The foundational policy gradient algorithm.

**Key equation:**

```
∇J(θ) = E[∇log π_θ(y|x) · r(x,y)]
```

- Increases log-probability of high-reward responses; decreases it for low-reward ones.
- **Variance reduction** via baseline subtraction: Advantage Â = r(x,y) - b(x)
- Simple but suffers from high variance.

---

## 3. PPO (Proximal Policy Optimization)

Introduces **trust regions** to address REINFORCE instability.

**Core mechanisms:**

- **Importance Sampling Ratio**: ρ_t(θ) = π_θ(a_t|s_t) / π_θ_old(a_t|s_t)
- **Clipping**: Constrains ratio within (1-ε, 1+ε) to prevent excessively large policy updates
- **KL Regularization**: Controls divergence from reference policy

**Memory requirements** — four components:
1. Current policy
2. Rollout policy
3. Reference policy
4. Value model (critic)

This heavy memory footprint motivates subsequent methods.

---

## 4. GRPO (Group Relative Policy Optimization)

Removes the critic (value model) to **reduce memory by ~50%**.

**Key idea — Group-Relative Advantage:**

```
Â_i = (r_i - μ_G) / σ_G
```

- Samples multiple responses per prompt, then compares within the group.
- Uses group mean/standard deviation instead of a learned baseline (critic).
- Retains PPO-style clipping.

**Advantage:** Significantly improved memory efficiency by eliminating the critic.

---

## 5. RLOO (REINFORCE Leave-One-Out)

Similar to GRPO in removing the critic, but also **drops PPO clipping** entirely.

**Leave-One-Out baseline:**

```
Â_i = r_i - (1/(K-1)) Σ_{j≠i} r_j
```

- Uses the mean reward of all other responses (excluding the current one) as the baseline.
- Based on the observation that clipping is active less than 5% of the time.

**Key property:** Returns to pure REINFORCE-style updates while effectively reducing variance through the leave-one-out baseline.

---

## 6. Dr. GRPO

Addresses **normalization biases** in standard GRPO.

**Key modifications:**

1. **Removes standard deviation normalization**: Dividing by σ_G can distort learning signals
2. **Uses fixed constant** for loss aggregation instead of sequence-level averaging
3. **Simplified advantage:**

```
Â_i = r_i - μ_G
```

The core finding is that removing standard deviation normalization improves final performance.

---

## 7. DAPO (Decoupled Advantage Policy Optimization)

Integrates four key improvements:

1. **Token-Level Aggregation**: Aggregates loss at token level rather than sample level
2. **Asymmetric Clipping**: ε_low = 0.2, ε_high = 0.28, promoting exploration
3. **Overlong Reward Shaping**: Soft penalty zone to control overly long responses
4. **Dynamic Sampling**: Ensures mixed outcomes (success/failure mix) per prompt

**Advantage:** Each improvement is independently effective and produces synergy when combined.

---

## 8. CISPO (Clipped Importance Sampling Policy Optimization)

**Decouples clipping from gradient flow.**

**Key idea:**

- Applies **stop-gradient** on clipped weights: sg(ρ̂_t(θ))
- Allows gradients to flow for all tokens despite clipping
- Reports **2x speed-up** compared to DAPO

The key insight is that clipping maintains the trust region while stop-gradient prevents loss of learning signal from gradient blocking.

---

## 9. MaxRL (Maximum Likelihood RL)

Reframes RL as **approximate maximum-likelihood training**.

**Key formula:**

```
log p_θ(x) = -Σ (1-p_θ(x))^k / k
```

**Success-Only Averaging:**

```
ĝ_N(x) = (1/K) Σ r_i ∇log π_θ(y_i|x)
```

- Targets **pass@k diversity** improvement rather than pass@1 optimization.
- Extracts learning signal only from successful responses.

---

## 10. DPPO (Divergence PPO)

Replaces ratio-based masking with **divergence-based trust regions**.

**Key changes:**

- Uses **TV (Total Variation) or KL divergence** instead of probability ratios
- **Binary divergence approximation** for computational efficiency
- Masks updates exceeding divergence threshold τ

Manages trust regions by blocking updates for tokens where per-token divergence exceeds the threshold.

---

## 11. ScaleRL

Large-scale validation across **400,000+ GPU-hours**.

**Key findings:**

1. **Asynchronous RL pipelining** improves efficiency
2. **CISPO/GSPO outperform DAPO** at scale
3. **FP32 logits** reduce kernel mismatches
4. **Prompt-level averaging** superior to sample averaging
5. **Zero-variance prompt filtering**: Removes prompts with no learning signal
6. **Exclude high-accuracy prompts** from resampling

Provides practical RL training recipes for large-scale settings.

---

## 12. Method Comparison Summary

| Method | Baseline/Advantage | Clipping | Masking | Loss Aggregation | Key Improvement |
|--------|-------------------|----------|---------|-----------------|-----------------|
| REINFORCE | r(x,y) - b(x) | None | None | Sample | Basic policy gradient |
| PPO | Value model | Symmetric (1±ε) | Ratio-based | Sample | Trust region + critic |
| GRPO | Group-relative (μ_G, σ_G) | Symmetric (1±ε) | Ratio-based | Sample | Critic removal (~50% memory) |
| RLOO | Leave-one-out | None | None | Sample | Removes clipping too |
| Dr. GRPO | r_i - μ_G (no σ) | Symmetric (1±ε) | Ratio-based | Fixed constant | Normalization bias fix |
| DAPO | Group-relative | Asymmetric | Ratio-based | Token-level | Four integrated improvements |
| CISPO | Group-relative | Stop-gradient | Ratio-based | Token-level | Clipping-gradient decoupling, 2x speed |
| MaxRL | Success-only | None | None | Success average | Maximum likelihood reframing |
| DPPO | Group-relative | None | Divergence-based | Token-level | TV/KL trust region |
| ScaleRL | Various | CISPO/GSPO | Various | Prompt-level | Large-scale validation |

---

## 13. Key Patterns and Trends

Common patterns observed across all methods:

1. **Critics appear unnecessary** for LLM fine-tuning: Group-relative or leave-one-out baselines suffice
2. **Standard deviation normalization tends to reduce performance**: Simple mean subtraction is more effective
3. **Loss aggregation significantly impacts learning signals**: Token-level or prompt-level aggregation is superior
4. **Trust region definitions remain an optimization opportunity**: Clipping, divergence-based, stop-gradient approaches
5. **Emerging recipe**: Critic-free + token-aware aggregation + softer trust regions

---

## 14. Open Problems

The author identifies five major unresolved challenges:

### 14.1 Credit Assignment
Current methods assign uniform rewards across all tokens. Fine-grained analysis of which tokens contribute to correct reasoning and where failures occur is lacking.

### 14.2 Sample Efficiency
Methods require 8–64 rollouts per prompt. Better reuse and offline mixing strategies are needed.

### 14.3 Very Hard Problems
When all rollouts fail, there is zero gradient signal. Curriculum learning alone is insufficient.

### 14.4 Extension Beyond Math/Code
Domains with noisy, delayed, or subjective rewards remain difficult to address.

### 14.5 Empirical Reliability
Evidence is narrow, expensive to reproduce, and scaling behavior varies by context.

---

## 15. Conclusion

The field of RL for Reasoning LLMs has evolved rapidly from memory-intensive critic-based methods toward simpler, more efficient critic-free approaches with refined trust region handling. Token-level aggregation and softer trust regions are becoming the new standard, but core challenges in credit assignment, sample efficiency, and generalization remain unsolved.

---

## References

- Schulman et al. (2017). Proximal Policy Optimization Algorithms.
- DeepSeek-R1 (2025).
- Full bibliography of 25+ references available at the [original post](https://aweers.de/blog/2026/rl-for-llms/).
