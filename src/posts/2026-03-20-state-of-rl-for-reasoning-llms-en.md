---
title: "State of RL for Reasoning LLMs — Summary"
date: 2026-03-20
summary: "Summary of A. Weers' blog post. A comprehensive analysis of RL methods for reasoning LLMs covering REINFORCE, PPO, GRPO, RLOO, Dr. GRPO, DAPO, CISPO, MaxRL, DPPO, and ScaleRL with exact equations and comparison. Identifies emerging patterns: critic-free approaches, token-level aggregation, and softer trust regions."
tags: [LLM, Reinforcement Learning, RL, PPO, GRPO, DAPO, RLOO, CISPO, DPPO, MaxRL, Reasoning, Research Note]
category: 연구노트
language: en
---

# State of RL for Reasoning LLMs

**Source:** A. Weers (March 15, 2026) | [Original Post](https://aweers.de/blog/2026/rl-for-llms/)
**Read Time:** ~26 minutes

---

## TL;DR

Reinforcement learning has been one of the most consequential additions to the LLM post-training stack. It was the key ingredient that transformed GPT-3 into InstructGPT [1], and has since become central to the current wave of reasoning improvements [2][3]. The first generation was dominated by PPO [4]; the second generation (2024–2026) brought algorithmic refinement specifically targeting reasoning capabilities. This post provides a compact overview of the major developments from REINFORCE through ScaleRL.

---

## 1. Brief RL Introduction

In the standard RL setting, an agent observes a state $s$, chooses an action $a$ according to a policy $\pi$, transitions to a new state according to environment dynamics $P(s'|s,a)$, and receives a reward $r$.

A concrete example is a robot navigating a room: the state is its current position and sensor reading, the actions are movement commands, the transition dynamics are governed by physics (wheels might slip), and the reward reflects progress toward the goal.

The agent aims to maximize the expected discounted return:

$$
J = \mathbb{E}\left[\sum_{t=0}^{T} \gamma^t r_t\right]
$$

where the discount factor $\gamma$ controls how strongly future rewards are discounted.

The policy is usually parametrized by $\theta$. A central object is the **value function**:

$$
V^\pi(s) = \mathbb{E}_\pi\left[\sum_{l=0}^{T-t} \gamma^l r_{t+l} \mid s_t = s\right]
$$

which measures how good it is to be in state $s$ under policy $\pi$. From this, one can derive advantages, which estimate whether a particular action was better or worse than expected.

**For LLMs**, the setup simplifies substantially. We have a parametrized model $\pi_\theta$ sampling responses $y$ given a prompt $x$ from our dataset, graded with a scalar reward $r(x,y)$. The objective becomes:

$$
J(\theta) = \mathbb{E}_{x \sim \mathcal{D},\; y \sim \pi_\theta(\cdot|x)}[r(x, y)]
$$

One can still model this with states being (prompt + previously generated tokens) and actions being the next token. In practice, however, it is usually not possible to assign meaningful rewards to individual tokens—only one reward for the complete response. The reward would be zero for all tokens except the last, making the setup unnecessarily complicated.

---

## 2. REINFORCE

REINFORCE [5] uses weighted policy gradients:

$$
\nabla_\theta J(\theta) = \mathbb{E}\left[\nabla_\theta \log \pi_\theta(y|x) \cdot r(x,y)\right]
$$

- Increases log-probability of high-reward responses; decreases it for low-reward ones.
- **Variance reduction** via baseline subtraction: Advantage $\hat{A} = r(x,y) - b(x)$.

---

## 3. PPO (Proximal Policy Optimization)

PPO [4] introduces importance sampling ratios and a clipping mechanism to enable off-policy training:

$$
J^{\text{PPO}}(\theta) = \mathbb{E}_t\left[\min\!\left(\rho_t(\theta)\hat{A}_t,\; \operatorname{clip}\!\left(\rho_t(\theta),\, 1-\epsilon,\, 1+\epsilon\right)\hat{A}_t\right)\right]
$$

where the **importance sampling ratio** is:

$$
\rho_t(\theta) = \frac{\pi_\theta(a_t|s_t)}{\pi_{\theta_{\text{old}}}(a_t|s_t)}
$$

**Symmetric masking function:**

$$
M_{\text{sym}}(\hat{A}_t, \rho_t, \epsilon) = \begin{cases} 0 & \text{if } (\hat{A}_t > 0 \land \rho_t > 1 + \epsilon) \lor (\hat{A}_t < 0 \land \rho_t < 1 - \epsilon) \\ 1 & \text{otherwise} \end{cases}
$$

**Memory requirements — four components:**
1. Current policy
2. Rollout policy
3. Reference policy
4. Value model (critic) — using GAE (Generalized Advantage Estimation)

This heavy memory footprint motivates all subsequent methods.

---

## 4. GRPO (Group Relative Policy Optimization)

GRPO [8] replaces the learned value model with **group-relative baselines**:

$$
\hat{A}_i = \frac{r_i - \mu_G}{\sigma_G}
$$

- Samples multiple responses per prompt, compares within the group.
- Uses group mean/standard deviation instead of a learned critic — **saves ~50% memory**.
- Retains PPO-style symmetric IS clipping: $M_{\text{sym}}(\hat{A}_t, \rho_t, 0.2)$.
- Loss aggregation is length-normalized†.

†Implementations may differ (e.g., Huggingface TRL).

---

## 5. RLOO (REINFORCE Leave-One-Out)

RLOO [9] uses **leave-one-out advantages**:

$$
\hat{A}_i = r_i - \frac{1}{K-1}\sum_{j \neq i} r_j
$$

- Uses the mean reward of all other responses (excluding the current one) as the baseline.
- Drops PPO clipping entirely. No masking.
- Returns to pure REINFORCE-style updates with effective variance reduction through the leave-one-out baseline.
- Loss aggregation: sample average.

---

## 6. Dr. GRPO ("GRPO Done Right")

DeepSeek reported that response length increases substantially as RL training progresses, attributing this to improving reasoning ("Aha" moment). Dr. GRPO [10] identifies another, more significant cause: **the standard sample-level loss normalization introduces a bias favoring short correct responses and long incorrect ones**.

In the common GRPO implementation, token losses are first averaged within each sequence, then across sequences. A fixed sequence-level reward is spread over all tokens. Long responses therefore receive weaker per-token reinforcement if correct, and weaker per-token penalty if incorrect. This creates an incentive to be overly verbose.

**The fix:** instead of dividing first by sequence length then by batch size, Dr. GRPO **divides by a fixed constant** (maximum tokens), removing the incentive for incorrect answers to be unnecessarily long.

Dr. GRPO also **removes standard deviation normalization**. When rewards per prompt are normalized by $\sigma$, prompts where all answers have similar rewards (e.g., all but one correct, low variance) can receive disproportionately large updates.

The Dr. GRPO advantage simplifies to:

$$
\hat{A}_i = r_i - \mu_G
$$

**without the division by standard deviation**, and the loss is aggregated at the token level with a fixed normalization‡.

‡With constant denominator.

The practical message: GRPO was not fundamentally broken, but some of its seemingly innocuous normalizations were not neutral. In long-form reasoning, they change which prompts and tokens receive gradient signal.

---

## 7. DAPO (Decoupled Advantage Policy Optimization)

DAPO [7] proposes four improvements after in-depth analysis of GRPO components.

### 7.1 Token-Level Aggregation

Replaces sample-level averaging with token-level aggregation (DAPO divides by actual token count; Dr. GRPO uses a constant).

### 7.2 Asymmetric Clipping

PPO's symmetric ratio clipping is particularly restrictive for low-probability tokens. E.g., if a token has probability $0.01$, then with $\epsilon = 0.2$ its probability can only rise to $0.012$ before being clipped, barely changing its likelihood of being sampled. This suppresses learning of rare but useful reasoning continuations. DAPO decouples clip bounds with a larger upper bound:

$$
\epsilon_{\text{low}} = 0.2, \quad \epsilon_{\text{high}} = 0.28
$$

**Asymmetric masking:**

$$
M_{\text{asym}}(\hat{A}_t, \rho_t, \epsilon_l, \epsilon_h) = \begin{cases} 0 & \text{if } (\hat{A}_t > 0 \land \rho_t > 1 + \epsilon_h) \lor (\hat{A}_t < 0 \land \rho_t < 1 - \epsilon_l) \\ 1 & \text{otherwise} \end{cases}
$$

**DAPO objective** with token-level aggregation and asymmetric clipping:

$$
J^{\text{DAPO}}(\theta) = \mathbb{E}\left[ \frac{1}{\sum_{i=1}^{G}|y_i|} \sum_{i=1}^{G}\sum_{t=1}^{|y_i|} \min\!\left( \rho_{i,t}(\theta)\hat{A}_i,\; \operatorname{clip}(\rho_{i,t}(\theta), 1-\epsilon_{\text{low}}, 1+\epsilon_{\text{high}})\hat{A}_i \right) \right]
$$

### 7.3 Overlong Reward Shaping

Truncated responses receive the same reward as completely wrong ones. DAPO adds a soft penalty zone:

$$
R_{\text{length}}(y) = \begin{cases} 0, & |y| \le L_{\text{max}} - L_{\text{cache}} \\ \frac{(L_{\text{max}} - L_{\text{cache}}) - |y|}{L_{\text{cache}}}, & L_{\text{max}} - L_{\text{cache}} < |y| \le L_{\text{max}} \\ -1, & L_{\text{max}} < |y| \end{cases}
$$

### 7.4 Dynamic Sampling

If all sampled responses for a prompt are correct or all incorrect, group-relative advantages are all zero. DAPO keeps sampling until each prompt has mixed outcomes, ensuring every prompt in the optimization batch provides a learning signal. This improves step efficiency, though wall-clock time may increase for hard batches.

---

## 8. CISPO (Clipped Importance Sampling Policy Optimization)

CISPO [11], introduced in the MiniMax-M1 report, targets PPO-style clipping's specific weakness: **when a token falls outside the clip range, PPO blocks its gradient entirely**.

Tokens undergoing large probability shifts are often precisely the ones that matter most for learning reasoning behavior (e.g., "However", "Recheck", "Wait", "Aha" have low probability in the base model but serve as forks in reasoning traces). Masking them whenever the ratio becomes too large discards informative gradients.

CISPO **decouples clipping from gradient flow**. Instead of clipping the objective in a way that induces a hard mask, it clips only the IS **weight** and applies stop-gradient:

$$
J^{\text{CISPO}}(\theta) = \mathbb{E}\left[ \operatorname{sg}\!\left(\hat{\rho}_t(\theta)\right)\, \hat{A}_t\, \log \pi_\theta(a_t \mid s_t) \right], \qquad \hat{\rho}_t(\theta)=\operatorname{clip}\bigl(\rho_t(\theta), 1-\epsilon_{l}, 1+\epsilon_{h}\bigr)
$$

where $\operatorname{sg}(\cdot)$ denotes stop-gradient.

Interestingly, only the upper clipping $\epsilon_h$ is required and tuned; the lower $\epsilon_l$ is set high enough to be effectively inactive.

This preserves IS weight clipping's variance-reduction benefits while **allowing gradients to flow for all tokens** — achieving a **2x step-efficiency speed-up** vs DAPO in MiniMax experiments.

---

## 9. MaxRL (Maximum Likelihood Reinforcement Learning)

MaxRL [12] starts from a different perspective: standard RL optimizes expected reward (pass@1), but maximum-likelihood training would maximize $\log p_\theta(x)$. This matters because:

$$
\log p_\theta(x) = -\sum_{k=1}^{\infty}\frac{(1-p_\theta(x))^k}{k}
$$

The maximum-likelihood gradient is an **infinite harmonic mixture of pass@$k$ gradients**, not just pass@1. Standard RL keeps only the first-order term.

MaxRL defines a **compute-indexed family of truncated objectives**:

$$
J_{\text{MaxRL}}^{(T)}(x) = -\sum_{k=1}^{T}\frac{(1-p_\theta(x))^k}{k}
$$

where $T=1$ recovers standard RL and $T\to \infty$ recovers maximum likelihood.

**On-policy estimator:** Given $N$ rollouts with $K$ successes, average the score functions of successful trajectories only:

$$
\hat{g}_N(x) = \begin{cases} \displaystyle \frac{1}{K}\sum_{i=1}^{N} r_i \nabla_\theta \log \pi_\theta(y_i \mid x), & K \ge 1 \\[0.8em] 0, & K = 0 \end{cases}
$$

This estimator is unbiased for truncated MaxRL with $T=N$. The key difference from REINFORCE: increasing rollouts reduces estimator variance **and simultaneously makes the optimized objective itself a better approximation** to maximum likelihood.

In REINFORCE-like form with success rate $\hat{r} = K/N$, the effective advantage:

$$
\hat{A}_i^{\text{MaxRL}} \propto \frac{r_i - \hat{r}}{\hat{r}}
$$

This shows why MaxRL **concentrates learning signal on hard prompts**: when $\hat{r}$ is small but non-zero, successful rollouts are weighted strongly. Easy prompts with $\hat{r} \approx 1$ receive relatively little emphasis.

Empirically, MaxRL improves pass@$k$, preserves output diversity better than GRPO, and yields substantial gains in test-time scaling efficiency.

---

## 10. DPPO (Divergence PPO)

DPPO [13] revisits the trust region question more directly. The core critique: PPO clips based on the probability ratio of the sampled token, which may be a poor proxy for actual policy divergence, especially for rare tokens. Their probability could change by an order of magnitude with very small effect on the full distribution.

This problem is amplified by training/inference framework mismatches: even with identical parameters, the probability ratio can be highly volatile for low-probability tokens between different frameworks, while divergence measures (e.g., total variation) are much more stable.

DPPO replaces ratio-based masking with a **trust region defined in terms of estimated policy divergence** (TV or KL):

$$
\upsilon_t(\theta) = \pi_\theta(a|s) - \pi_{\theta_{\text{old}}}(a|s)
$$

$$
M_{\text{div}}(\hat{A}_t, \upsilon_t, \delta) = \begin{cases} 0 & \text{if } (\hat{A}_t > 0 \land \upsilon_t > \delta) \lor (\hat{A}_t < 0 \land \upsilon_t < \delta) \\ 1 & \text{otherwise} \end{cases}
$$

**DPPO update:**

$$
J^{\text{DPPO}}(\theta) = \mathbb{E}\left[ M_{\text{div}}\!\left(\widehat{D}(\pi_\theta,\pi_{\theta_{\text{old}}}), \tau\right)\, \rho(\theta)\, \hat{A} \right]
$$

A binary approximation (comparing just the sampled token's probability) or top-K approximation both work well empirically. An interesting insight: just a small fraction (<0.5%) of updates cause instability — blocking those is sufficient to stabilize training.

---

## 11. ScaleRL

ScaleRL [14] is less about inventing a new objective than about determining **which design choices continue to matter at scale**. It reports 400,000+ GPU-hours of ablations and evaluates methods by fitting **sigmoidal performance vs. compute curves** rather than comparing single checkpoints.

This framing separates two often-conflated quantities: how quickly a method improves at a given compute budget, and where it eventually saturates.

### Key findings:

**Asynchronous RL.** Prefers pipelined asynchronous setup over generate-then-update loops. Rollouts generated continuously and weight updates pushed immediately, mainly improving compute efficiency by reducing idle time.

**Loss type.** CISPO and GSPO outperform DAPO in asymptotic performance. CISPO selected as default for combining strong results with relative robustness.

**FP32 logits.** Small numerical mismatches between generation and training kernels can materially distort IS ratios. Computing the LM head in FP32 sharply reduces this.

**Loss aggregation.** Sample averaging is suboptimal. **Prompt-level averaging** yields best performance.

**Zero variance filtering.** If all answers for a prompt are correct or all incorrect, there is no learning signal. Excluding those prompts from optimization accelerates training.

**No positive resampling.** If a prompt has >90% correct answers, it is excluded from future epochs. Slightly slows training but reaches higher asymptotic performance.

---

## 12. Method Comparison Summary

| Method | Baseline/Advantage | Clipping | Masking | Loss Aggregation | Key Improvement |
|--------|-------------------|----------|---------|------------------|-----------------|
| **REINFORCE** | EMA or batch mean reward | None | None | Sample average | Establishes policy gradients |
| **PPO** | GAE with critic | Symmetric IS | $M_{\text{sym}}(\hat{A}_t, \rho_t, 0.2)$ | Sample average | Stable, more sample efficient |
| **GRPO** | $(r-\mu_G)/\sigma_G$ | Symmetric IS | $M_{\text{sym}}(\hat{A}_t, \rho_t, 0.2)$ | Length normalized† | Less memory-intense |
| **RLOO** | Leave-one-out mean | None | None | Sample average | Variance reduction without critic |
| **Dr. GRPO** | $r - \mu_G$ | Symmetric IS | $M_{\text{sym}}(\hat{A}_t, \rho_t, 0.2)$ | Token average‡ | Remove length-bias and std weighting |
| **DAPO** | $(r-\mu_G)/\sigma_G$ | Asymmetric IS | $M_{\text{asym}}(\hat{A}_t, \rho_t, 0.2, 0.28)$ | Token average | Give small probabilities more room |
| **CISPO** | $(r-\mu_G)/\sigma_G$ within group | Upper-bound IS | None | Token average | Don't mask gradients, just clip |
| **DPPO** | $(r-\mu)/\sigma$ within group | Symmetric DV | $M_{\text{div}}(\hat{A}_t, \upsilon_t, 0.15)$ | Sample average | DV trust regions for LLM domain |
| **MaxRL** | $(r_i - \hat{r})/(N\cdot \hat{r})$ | None | None | Sample average | Interpolates RL and MLE, better pass@k |
| **ScaleRL** | $(r-\mu_B)/\sigma_B$ | Upper-bound IS | None | Prompt average | Large-scale validation and scaling laws |

†Implementations may differ (e.g., Huggingface TRL). ‡With constant denominator.

---

## 13. Key Patterns

Across all methods, several patterns recur:

**The critic appears unnecessary for LLM training.** Every method since PPO has found that simpler baselines match or exceed learned value functions while saving ~50% memory. The LLM fine-tuning setting, starting from strong pretrained checkpoints rather than random initialization, seems to make PPO's variance-reduction machinery largely redundant.

**Standard deviation normalization tends to hurt.** Both Dr. GRPO and MaxRL show that dividing advantages by $\sigma$ adds too much weight on nearly solved problems. ScaleRL confirms that DAPO (with σ normalization) reaches significantly lower asymptotic performance compared to CISPO and GSPO (without it).

**Loss aggregation is not a minor detail.** Dr. GRPO and DAPO show that sequence-level rewards combined with sample-level averaging can distort per-token learning signals. The reduction of loss is a crucial part of the method.

**Trust regions are a good optimization target.** PPO's $\epsilon = 0.2$ works remarkably well, but recent methods show improvements: DAPO relaxes asymmetrically, CISPO clips weights instead of masking gradients, DPPO argues the sampled-token ratio is the wrong quantity to constrain.

**A provisional recipe is emerging.** Critic-free training, token-aware or prompt-aware loss aggregation, softer or more principled trust region handling, and increasingly explicit attention to curriculum and compute allocation.

---

## 14. Open Problems

### 14.1 Credit Assignment

Current outcome-based methods assign the same reward to all tokens. The token that caused a reasoning failure receives the same signal as boilerplate tokens. Process reward models, step-level verifiers, search-based methods, and branch-sensitive objectives all try to address this, but none has become the standard solution.

### 14.2 Sample Efficiency

The information gain in RL is just a single bit (correct/incorrect). Most recipes rely on 8–64 rollouts per prompt. Better reuse of unsuccessful samples, offline-to-online mixing, or better prompt selection policies could reduce cost substantially.

### 14.3 Very Hard Problems

If a model never produces a correct rollout, all methods here provide no gradient. Curriculum learning helps but is only a workaround. Stronger methods for extracting signal from partially correct trajectories remain important.

### 14.4 Extension Beyond Math and Code

Nearly all recent progress comes from domains with cheap, unambiguous verification. Settings with noisy rewards, delayed rewards, subjective evaluation, or multi-turn interaction remain difficult.

### 14.5 Empirical Reliability

Perhaps the most underappreciated problem. Much evidence is empirical, narrow, and expensive to reproduce. As ScaleRL makes clear, an intervention can change early learning speed, asymptotic performance, or both — and these are not interchangeable.

---

## Conclusion

RL for LLMs is no longer bottlenecked by the absence of workable algorithms. We now have several. The harder problems are about efficiency, robustness, generality, and understanding which empirical improvements actually survive scale and transfer.

---

## References

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
