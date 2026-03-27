---
title: "Memorize to Forget: Machine Unlearning without Gradient Ascent via Model Extrapolation"
date: 2026-03-28
summary: "Analysis of MOX (MOdel eXtrapolation), a novel machine unlearning method that avoids gradient ascent's catastrophic collapse by training a memorization model via GD on the forget set, then extrapolating toward the reference model to obtain the forget model. Achieves FQ 0.0677, MU 0.6528 on TOFU benchmark, outperforming GA/NPO baselines with stable training. On MUSE, achieves Utility Preservation 54.8 with Privacy Leakage -18.4. Under review at ICLR 2026."
tags: [Machine Unlearning, LLM, Gradient Ascent, Model Extrapolation, Privacy, ICLR 2026, Research Notes]
category: Research Notes
language: en
---

# Memorize to Forget: Machine Unlearning without Gradient Ascent via Model Extrapolation

**Venue:** ICLR 2026 (Under Review)
**Authors:** Zhuo Huang, Qizhou Wang, Ziming Hong, Shanshan Ye, Bo Han, Tongliang Liu
**arXiv:** [2602.06441](https://arxiv.org/abs/2602.06441)
**OpenReview:** [Forum](https://openreview.net/forum?id=iKqQGEOeej)

---

## One-Line Summary

To fundamentally avoid the catastrophic collapse caused by Gradient Ascent (GA), the paper proposes **MOX (MOdel eXtrapolation)**: train a memorization model on the forget set via standard gradient descent (GD), then extrapolate from the memorization model toward the reference model to obtain a forget model — achieving superior forgetting performance and model utility preservation **without ever using GA**.

---

## 1. Overview and Motivation

Machine Unlearning (MU) is a critical technique for removing sensitive information, personal data, and copyrighted content from LLMs. The most intuitive approach — retraining from scratch without the undesired data — is practically infeasible given the training costs of models like LLaMA and Phi (millions of dollars).

**Gradient Ascent (GA)** has been the mainstream approach, maximizing the loss on the forget set to reverse the learning process. However, GA suffers from fundamental problems:

**Core Issues with GA:**

1. **Catastrophic Collapse:** GA's loss maximization is unbounded, leading to training instability and severe deviation from the original reference model.
2. **Model Utility Degradation:** Improving forget quality comes at the cost of drastic performance drops on the retain set.
3. **Training Instability:** Across various loss reweighting levels (β), GA consistently causes the model to diverge from the reference.

The authors empirically demonstrate these issues in Figure 1:

![Figure 1: Effect of GA vs GD](/figures/mox/figure1_ga_gd_effect.png)

Figure 1(a) shows that GA causes rapid Model Utility degradation across various β values, while GD remains stable. Figure 1(b) reveals that GA's KL Divergence diverges significantly from the reference model, whereas GD stays relatively stable. Figure 1(c) demonstrates that while the memorization model shows poor forget quality, its counterpart (the forget model obtained via extrapolation) achieves high forget quality.

This leads to the central question: **Since GA has so many deficiencies compared to standard GD, is it possible to conduct GD without GA to achieve MU?**

---

## 2. Methodology: MOX (MOdel eXtrapolation)

### 2.1 Core Idea — "Memorize to Forget"

MOX's key intuition draws from Task Arithmetic (Ilharco et al., 2022). When fine-tuning a model on a specific task, a task vector is produced. Applying the **negation** of this vector reduces performance on that task. Therefore:

> It is possible to first enhance memorization on the forget set, then use extrapolation to achieve forgetting in the opposite direction.

![Figure 2: MOX Methodology Illustration](/figures/mox/figure2_methodology.png)

Figure 2 illustrates the full process:

**(a)** Directly obtaining θ_for via GA is infeasible as it reverses the pre-training process (irreversible gradient problem).

**(b)** Instead, we use GD to memorize the forget set D_F, obtaining θ_mem. Through model extrapolation from θ_mem to θ_ref, we produce θ_for that successfully forgets the knowledge in D_F.

**(c)** Adding a KL-divergence constraint ensures prediction consistency on the retain set D_R between θ_ref and the training model, further improving model utility of θ_for.

**(d)** For targeted MU, an additional loss is introduced to forget the target while simultaneously memorizing D_F.

### 2.2 Mathematical Formulation

**Irreversible Gradient Criterion (Definition 1):**
Given a pre-trained model θ trained through an optimization task Ψ, any downstream fine-tuning with a gradient that reverses the gradient of Ψ should be avoided. This provides the theoretical basis for avoiding GA.

**Memorization Objective (GA-based):**

$$\mathcal{L}_{mem} = \frac{1}{n} \sum_{(x_j, y_j) \in \mathcal{D}_F} \mathcal{L}_{CE}(x_j, y_j, \theta) + \frac{1}{m} \sum_{(x_i, y_i) \in \mathcal{D}_R} \text{KL}(h_{\theta_{ref}}(y|x) \| h_\theta(y|x))$$

The first term enhances memorization on the forget set, while the second term maintains prediction consistency with the reference model on the retain set via KL-divergence.

**NPO-based Memorization Objective:**

$$\mathcal{L}_{mem} = \frac{2}{n\beta} \sum_{(x_i, y_i) \in \mathcal{D}_F} \log \sigma(-\beta \log(\frac{h_\theta(y|x)}{h_{\theta_{ref}}(y|x)})) + \frac{1}{m} \sum_{(x_i, y_i) \in \mathcal{D}_R} \text{KL}(h_{\theta_{ref}}(y|x) \| h_\theta(y|x))$$

Preference optimization can also be leveraged for the memorization objective.

**Model Extrapolation:**

$$\theta_{for} := (1+\alpha)\theta_{ref} - \alpha\theta_{mem}, \quad \alpha \in \mathbb{R}^+$$

where α controls the extrapolation strength. Higher α improves forget quality, but extreme values can degrade model utility — though this degradation is much slower and more predictable than GA's catastrophic collapse.

Intuitively, rearranging: θ_for = θ_ref + α(θ_ref − θ_mem), where the task vector (θ_ref − θ_mem) is scaled by α and added to θ_ref. Since θ_mem has memorized the knowledge, the opposite direction achieves forgetting.

### 2.3 Targeted Unlearning

For targeted MU where specific targets ỹ_i are provided:

$$\mathcal{L} = \mathcal{L}_{mem} - \frac{1}{m} \sum_{(x_i, \tilde{y}_i) \in \mathcal{D}_R} \mathcal{L}_{CE}(x_i, \tilde{y}_i, \theta)$$

Memorizing the target does not reverse the pre-training process, so this can be safely applied.

### 2.4 Momentum Extrapolation

Since extrapolation can be conducted on-the-fly during training, the authors introduce momentum to gradually update the forget model by ensembling historical versions:

$$\theta_{for}^t := \eta \theta_{for}^t + (1-\eta) \theta_{for}^{t-1}$$

where η is the momentum coefficient (typically set to 0.675). This improves both generalization and forget quality.

### 2.5 Advantages of MOX

1. **Computation Stability:** No GA means no catastrophic collapse or task conflicts.
2. **Adaptability:** GD-based, so compatible with various objectives (GA loss, NPO loss, etc.).
3. **Efficiency:** Extrapolation is a simple parameter operation, deployable dynamically during training.

---

## 3. Experimental Setup

### 3.1 Benchmarks

**TOFU (Task of Fictitious Unlearning):** 200 fictitious author profiles with 20 QA pairs each. Four dataset types: Forget Set, Retain Set, Real Authors, Real World. Forget ratios: 1%, 5%, 10%. Metrics: Forget Quality (FQ), Model Utility (MU), ROUGE-L on Forget Set (F-RL), ROUGE-L on Retain Set (R-RL).

**MUSE (Machine Unlearning Six-way Evaluation):** Uses a BBC news corpus collected after August 2023. Four metrics: VerbMem on Forget Set (↓), KnowMem on Forget Set (↓), KnowMem on Retain Set (↑), PrivLeak (↓).

### 3.2 Baselines

Comparison against 12 baselines:

- **GA-based:** GA, KL, GAD, PO, AltPO, SimNPO, RMU
- **Non-GA:** NPO, TV (Task Vectors), LLMU, WHP (Who's Harry Potter), DPO
- Additionally, Original LLM and Retrained LLM for reference

### 3.3 Models and Training Details

**Models:** Llama2-7B, Phi-1.5B

**Training Configuration:**
- Optimizer: AdamW (weight decay 0.01)
- Learning rate: 1e-5
- Batch size: 32
- Epochs: 10 for unlearning
- LR schedule: Linear warm-up for the first epoch, then linear decay
- Default hyperparameters: α = 4, η = 0.675
- α search range: 0.5, 1.0, 2.0, 4.0, 8.0

**Hardware:** 2× NVIDIA H100 GPUs (or single A100/H100, or 4× NVIDIA 4090)

**Phi-1.5B fine-tuning:** LR 2e-5, 5 epochs
**Llama2-7B fine-tuning:** LR 1e-5, 5 epochs

**Evaluation:** Following Wang et al. (2024), results are reported based on the last epoch rather than the best performance during training.

---

## 4. Experimental Results

### 4.1 TOFU Benchmark Results (Table 1)

![Table 1: Comparison on TOFU Benchmark](/figures/mox/table1_tofu.png)

| Method | FQ(↑) | MU(↑) | F-RL(↓) | R-RL(↑) | FQ(↑) | MU(↑) | F-RL(↓) | R-RL(↑) |
|--------|--------|--------|---------|---------|--------|--------|---------|---------|
| **Base LLM** | **Llama2-7B** | | | | **Phi-1.5B** | | | |
| Original LLM | 0.0000 | 0.6346 | 0.9851 | 0.9833 | 0.0013 | 0.5184 | 0.9607 | 0.9199 |
| Retrained LLM | 1.0000 | 0.6267 | 0.4080 | 0.9833 | 1.000 | 0.5233 | 0.4272 | 0.9269 |
| GA | 0.0143 | 0.6333 | 0.4862 | 0.9008 | 0.0213 | 0.5069 | 0.5114 | 0.8048 |
| KL | 0.0168 | 0.6300 | 0.5281 | 0.9398 | 0.0120 | 0.5047 | 0.5059 | 0.8109 |
| NPO | 0.0068 | 0.6321 | 0.4632 | 0.8950 | 0.0030 | 0.5057 | 0.5196 | 0.8000 |
| TV | 0.0069 | 0.6340 | 0.4512 | **0.9810** | 0.0156 | 0.5012 | 0.4366 | 0.8810 |
| **MOX (α=4.0)** | **0.0625** | **0.6504** | 0.4697 | 0.9653 | **0.0582** | **0.5219** | 0.3138 | 0.8810 |
| **MOX (targeted)** | **0.0677** | 0.6412 | 0.4788 | 0.9710 | 0.0328 | 0.5012 | 0.3366 | 0.8858 |
| **MOX (momentum)** | **0.0680** | **0.6528** | 0.4410 | 0.9802 | **0.0598** | **0.5510** | 0.3120 | **0.8988** |

**Key Findings:**

1. **MOX (momentum) achieves the best overall performance:** FQ 0.0680 with MU 0.6528 on Llama2-7B, surpassing most GA-based baselines.
2. **Outstanding model utility preservation:** MOX's MU is comparable to or even higher than the Original LLM (0.6346 vs 0.6528).
3. **Flexible trade-off via α tuning:** Higher α improves FQ with controlled utility trade-off. α=4.0 provides a good balance.
4. **Consistent superiority on Phi-1.5B:** MOX (momentum) achieves FQ 0.0598, MU 0.5510 — best across all baselines.

### 4.2 MUSE Benchmark Results (Table 2)

![Table 2: Comparison on MUSE Benchmark](/figures/mox/table2_muse.png)

| Method | No Verbatim Mem.(↓) | No Knowledge Mem.(↓) | Utility Preserv.(↑) | No Privacy Leak.(↓) |
|--------|---------------------|---------------------|---------------------|---------------------|
| Original LLM | 58.4 | 63.9 | 55.2 | -99.8 |
| GA | **0.0** | **0.0** | 0.0 | 17.0 |
| NPO | **0.0** | **0.0** | **55.8** | 24.4 |
| TV | 57.2 | 66.2 | **55.8** | -99.8 |
| MOX (α=0.5) | 36.5 | 38.6 | **56.2** | -93.1 |
| MOX (α=4.0) | 1.2 | 1.6 | 54.9 | -19.8 |
| MOX (momentum) | **0.2** | **0.8** | 54.8 | **-18.4** |

**Key Findings:**

1. **GA and NPO completely eliminate memorization but destroy utility:** GA achieves 0.0 utility; NPO preserves utility but has high privacy leakage.
2. **MOX achieves both memorization removal and utility preservation:** MOX (momentum) reaches VerbMem 0.2, KnowMem 0.8 while maintaining Utility 54.8.
3. **Superior privacy protection:** MOX (momentum) achieves PrivLeak -18.4, among the best.
4. **Comparison with TV (Task Vectors):** TV preserves utility well but fails at memorization removal (57.2/66.2). MOX achieves far stronger forgetting through the extrapolation strength parameter α.

### 4.3 Ablation Study (Table 3)

![Table 3: Ablation Study](/figures/mox/table3_ablation.png)

Four settings are compared: GD only, GD+KL, GD+target, and GD+KL+target (full MOX). In both GA-based and NPO-based implementations, **configurations including GD+KL achieve the best performance**. The KL constraint significantly improves Retain Set performance (0.85→0.87~0.88) while maintaining consistent improvements on the Forget Set.

### 4.4 Hyperparameter Analysis

![Figure 3: Parameter Sensitivity Analysis for α and η](/figures/mox/figure3_param_analysis.png)

**α (extrapolation strength):**
- Increasing α from 1→4 significantly reduces Truth Ratio on the Forget Set (improved forgetting)
- Performance degradation on Retain Set, Real Authors, and Real World is relatively gradual
- Only at α=8 does performance on other datasets noticeably decline
- Conclusion: Setting α to a reasonably large value (~4) achieves maximum forgetting without significant utility loss

**η (momentum coefficient):**
- Performance remains consistently stable across η values from 0.2 to 0.8
- MOX is **insensitive to η** — easy to tune

### 4.5 Performance Stability

![Figure 4: Stability under Various Extrapolation/Weight Values](/figures/mox/figure4_stability.png)

Comparing MOX with GA and NPO across different regularization strengths (weight values 1–5):
- **MOX consistently achieves the best performance**
- GA and NPO show dramatic fluctuations with weight changes
- MOX remains relatively stable across various extrapolation strengths

### 4.6 Performance under Various Forget Sizes

![Figure 5: Performance Comparison under Various Forget Sizes](/figures/mox/figure5_forget_size.png)

Experiments with forget ratios of 1%, 5%, and 10% on TOFU show that MOX **consistently outperforms NPO and GA by a large margin** across all forget sizes. Notably, as forget size increases (5%, 10%), GA and NPO's performance degrades significantly, while MOX maintains stably high forget quality.

---

## 5. Additional Analysis (Appendix)

### 5.1 Unlearning Trajectory (Figure 6)

![Figure 6: Unlearning Trajectory](/figures/mox/figure6_trajectory.png)

Visualizing the learning trajectory on TOFU 5% forget set with Llama2-7B (Model Utility on x-axis vs Forget Quality on y-axis as log p-value):

- **GA, GAD, KL:** Initially improve forget quality, then suddenly collapse in both model utility and forget quality — the classic catastrophic collapse pattern.
- **NPO:** More stable but shows forget quality degradation late in training.
- **TV:** Avoids collapse (no GA) but has limited forgetting performance.
- **MOX / MOX-Mo:** Maintain high model utility while steadily improving forget quality. Momentum (MOX-Mo) further enhances both axes.

### 5.2 Continual Unlearning (Figure 7)

![Figure 7: Continual Unlearning](/figures/mox/figure7_continual.png)

In a realistic scenario where the forget set keeps changing (sequential unlearning: 1% → 5% → 10%):
- GA, GAD, KL severely degrade when switching to different forget sets
- **MOX maintains the most stable and highest forget quality across all stages** — a practical advantage for real-world deployment

### 5.3 Semantic Overlap Scenario (Table 5)

Under extreme semantic overlap between forget and retain sets (splitting 10% of retain set as forget set), MOX outperforms GA and PO:

| Method | FQ(↑) | MU(↑) | F-RL(↓) | R-RL(↑) |
|--------|--------|--------|---------|---------|
| GA | 0.0137 | 0.5745 | 0.4856 | 0.8795 |
| PO | 0.0501 | 0.6232 | 0.4620 | 0.8755 |
| **MOX** | **0.0611** | **0.6488** | **0.4500** | **0.9508** |

### 5.4 Relearning Attack Resistance (Table 6)

![Table 6: Relearning Performance](/figures/mox/table6_relearning.png)

On the WMDP benchmark evaluating resistance to relearning attacks:

| Method | WMDP(↓) |
|--------|---------|
| Original | 5.21 |
| GA unlearn | 1.53 |
| GA relearn | 4.88 (+3.35) |
| NPO unlearn | 0.98 |
| NPO relearn | 5.01 (+4.03) |
| **MOX unlearn** | **0.54** |
| **MOX relearn** | **3.82 (+3.28)** |

MOX achieves the lowest post-unlearning WMDP score (0.54) and shows the **least recovery after relearning** (3.82 vs GA's 4.88 and NPO's 5.01). Extrapolation identifies and amplifies the difference between the original and current model, making it harder for relearning to reverse.

---

## 6. Discussion and Limitations

**Strengths:**
- A **paradigm-shifting approach** that avoids the fundamental problems of GA (catastrophic collapse, training instability)
- Uses only GD, making implementation simple and fully compatible with existing training infrastructure
- Momentum extrapolation provides additional performance gains
- Consistent superiority across various forget sizes, semantic overlap, and continual unlearning scenarios

**Limitations:**
- Extreme α values (e.g., 8) can degrade model utility — requires appropriate α selection
- Extrapolation assumes a linear relationship in hypothesis space, which may need further validation for highly complex model architectures
- Validation on benchmarks beyond TOFU and MUSE is needed
- Code is not yet publicly available (under double-blind review)

---

## Key Contributions Summary

1. **GA-free MU paradigm:** MOX trains a memorization model via GD and obtains a forget model through model extrapolation, fundamentally avoiding catastrophic collapse.
2. **Irreversible Gradient Criterion:** Provides theoretical justification for why reversing pre-training gradients via GA is problematic.
3. **State-of-the-art on TOFU:** MOX (momentum) achieves FQ 0.0680, MU 0.6528, surpassing most GA/NPO-based methods.
4. **Balanced performance on MUSE:** Removes verbatim memorization down to 0.2 while preserving 54.8 utility.
5. **Robustness across diverse scenarios:** Demonstrated consistent superiority in continual unlearning, semantic overlap, and relearning attack settings.

---

## Personal Comments

The core contribution of this paper lies in the **conceptual shift** of not using GA in machine unlearning. While most prior MU research focused on "how to stabilize GA," this work shows that "GA can be avoided entirely." The model extrapolation idea inspired by Task Arithmetic is both intuitive and effective.

A few open questions remain. First, deeper theoretical analysis is needed on how well the linearity assumption of extrapolation holds in high-dimensional parameter spaces. Second, an automatic α selection mechanism would make the method more practical, since the optimal α may vary across datasets and models. Third, scaling characteristics on larger models (>7B) require further investigation.

The relationship with Task Vectors (TV) is also interesting. While TV also avoids GA, its forgetting performance is limited. MOX significantly improves upon TV by adding KL constraints and momentum, suggesting that actively preserving retain set information — not just simple extrapolation — is the key to effective unlearning.
