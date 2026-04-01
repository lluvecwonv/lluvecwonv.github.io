---
title: "Causal Estimation of Memorisation Profiles"
date: 2026-03-18
summary: "A paper by Pietro Lesci et al. from University of Cambridge and ETH Zürich, published at ACL 2024 (Long Paper). This work proposes a new, principled, and efficient method to estimate memorisation based on the difference-in-differences (DiD) design from econometrics. Using this method to characterise memorisation profiles of the Pythia model suite (70M–12B), the authors find that memorisation is (i) stronger and more persistent in larger models, (ii) determined by data order and learning rate, and (iii) stable across model sizes, making memorisation in larger models predictable from smaller ones."
tags: [LLM, Memorisation, Causal Inference, Difference-in-Differences, Pythia, Privacy, Copyright, ACL 2024, Research Notes]
category: 연구노트
language: en
---

# Causal Estimation of Memorisation Profiles

**Paper:** Pietro Lesci, Clara Meister, Thomas Hofmann, Andreas Vlachos, Tiago Pimentel

**Affiliation:** University of Cambridge, ETH Zürich

**Venue:** ACL 2024 (Long Paper)

**Keywords:** Counterfactual Memorisation, Difference-in-Differences, Memorisation Profile, Pythia, Causal Inference

**Code:** [github.com/pietrolesci/memorisation-profiles](https://github.com/pietrolesci/memorisation-profiles)

## One-Line Summary

This paper proposes an unbiased and efficient estimator of LLM memorisation based on the difference-in-differences (DiD) design from econometrics, and analyses memorisation profiles across the Pythia model suite.

---

## 1. Introduction

Large language models (LMs) are often pretrained with a single pass on web-scale datasets (Raffel et al., 2020; Gao et al., 2020; Penedo et al., 2023). Given the colossal size of training sets, one may expect each individual instance to have little impact on the final model. Yet, LMs can still reproduce entire sequences from their training set verbatim (Carlini et al., 2021), suggesting that models can store, or **memorise**, precise knowledge about individual training instances.

Measuring memorisation in large LMs is crucial for NLP practitioners:

- **Copyright and data protection** (Hu et al., 2022; Vyas et al., 2023; Lee et al., 2023)
- Understanding **how models encode factual information** (Cao et al., 2022; Tirumala et al., 2022)
- Understanding **training dynamics** (Arpit et al., 2017; Chang and Bergen, 2024)

Prior work adopts a causal definition of **memorisation**: it is the causal effect of observing an instance during training on a model's ability to correctly predict that instance (Feldman, 2020). Quantifying this requires knowledge of a **counterfactual** — how the model would have performed had it not been trained on that instance.

### Limitations of Existing Methods

1. **Multiple retraining** (Feldman and Zhang, 2020; Zheng and Jiang, 2022): Train multiple models on different subsets → measures **architectural memorisation** rather than memorisation for a specific model instance
2. **Negligible counterfactual assumption** (Carlini et al., 2021): Assumes the counterfactual value is negligible → relies on a **strong assumption**

### Contributions

1. Formalise **counterfactual memorisation** as the difference between two potential outcomes, unifying prior definitions within a single framework
2. Propose a new estimation method based on the **difference-in-differences (DiD)** design from econometrics — requiring only observational data (log-likelihood on a subset of instances throughout training)
3. Analyse **memorisation profiles** (memorisation trends across training) in the Pythia model suite

---

## 2. Background

### 2.1 Language Modelling

A language model p_θ(x) with parameters θ ∈ R^d defines a probability distribution over all finite sequences x ∈ V* constructed from alphabet V.

Dataset D = {x_n} is sampled i.i.d., shuffled via permutation σ, split into T ≤ ⌊N/B⌋ batches B_t with batch size B. At each iteration, model parameters are updated using:

**θ_t = θ_{t-1} − η ∇_θ L(θ_{t-1}, B_t)**

where η is the learning rate. This single-pass procedure is standard for recent LMs (Touvron et al., 2023; Jiang et al., 2023; Dey et al., 2023).

**Key terminology:**

- **Checkpoint step** c ∈ {0, 1, ..., T}: index for model checkpoint θ_c
- **Treatment step** g ∈ {1, ..., T} ∪ {∞}: timestep at which a batch is used for training (borrowing from econometrics). g = ∞ denotes the validation set (never used for training)

### 2.2 Causal Analysis

Causal estimation involves three steps:

1. Define a **causal estimand** — the target quantity to estimate
2. Derive a **statistical estimand** — rewrite the causal estimand in terms of observable data (identification)
3. Define an **estimator** — a statistical procedure to approximate the statistical estimand

The paper uses the **potential outcomes framework** of Rubin (1974, 2005) to formally define memorisation as a causal estimand.

---

## 3. Counterfactual Memorisation

### Core Question

For an instance x, how would the model's performance at checkpoint c differ if it had not been trained on x at timestep g?

### Key Definitions

**Treatment assignment variable** G(x): the step g at which instance x is trained on.

**Outcome variable** Y_c(x) := γ(θ_c, x): model's performance on instance x at checkpoint c (default: sequence-level log-likelihood).

> **Definition 1 (Potential outcome):** The potential outcome of instance x at checkpoint c under treatment assignment g, denoted Y_c(x; g), is the value the outcome would have taken if G(x) was equal to g.

> **Definition 2 (Counterfactual memorisation):** The causal effect of using instance x for training at the observed timestep G(x)=g on the model's performance on the same instance at checkpoint c:

**τ_{x,c} = Y_c(x; g) − Y_c(x; ∞)**

The first term is the performance when trained on x (observable), while the second is the performance when not trained on x (**counterfactual, unobservable**).

> **Definition 3 (Expected counterfactual memorisation):** The average causal effect of using instances for training at timestep g on the model's performance on these same instances at checkpoint c:

**τ_{g,c} = E_x [Y_c(x; g) − Y_c(x; ∞) | G(x) = g]**

The τ_{g,c} values together form a **memorisation profile**; each row is a **memorisation path**.

### Types of Memorisation

- **Instantaneous memorisation:** when c = g (immediately after training)
- **Persistent memorisation:** when c > g (persisting after training)
- **Residual memorisation:** when c = T (at the end of training)

---

## 4. Estimating Memorisation

### 4.1 The Difference Estimator

The simplest approach: requires only observed outcomes of a held-out validation set, but relies on a strong identification assumption.

> **Assumption 1 (I.I.D. Dataset Sampling):** Instances x are independently and identically distributed, following p(x), and are randomly assigned to treatment groups g.

**Difference estimator:**

**τ̂_{g,c}^{diff} = Ȳ_c(g) − Ȳ_c(∞)**

where Ȳ_c(g) is the mean performance of instances in batch B_g and Ȳ_c(∞) is the mean performance of validation instances. This is an **unbiased estimator** of τ_{g,c} under Assumption 1.

**Limitations:** Training and validation data distributions may not match exactly (e.g., NLP practitioners may deduplicate training data but not validation). Variance can be high.

### 4.2 The Difference-in-Differences (DiD) Estimator

The key intuition of DiD is to **use the time dimension** to help with identification. DiD identifies a causal estimand using the difference in the **trends** over time of the outcome on treated vs. untreated instances.

Two additional assumptions are required:

> **Assumption 2 (Parallel Trends):** In the absence of training, the expected change in model performance across checkpoints would be the same regardless of treatment. That is, for all c, c' ≤ g − 1: E[Y_c(x; ∞) − Y_{c'}(x; ∞) | G(x) = g] = E[Y_c(x; ∞) − Y_{c'}(x; ∞) | G(x) = ∞].

> **Assumption 3 (No Anticipation):** Training has no effect before it happens. That is, for all c < g: E[Y_c(x; g) | G(x) = g] = E[Y_c(x; ∞) | G(x) = g].

**DiD estimator:**

**τ̂_{g,c}^{did} = (Ȳ_c(g) − Ȳ_{g-1}(g)) − (Ȳ_c(∞) − Ȳ_{g-1}(∞))**

- First bracket: change in performance over time for treated instances (diff in trained)
- Second bracket: change in performance over time for untreated instances (diff in untrained)

**Advantages of DiD:**

- Assumption 2 (Parallel Trends) is **strictly weaker** than Assumption 1 (I.I.D.): i.i.d. implies parallel trends, but not vice versa
- Does not require training and validation distributions to match exactly (challenge sets or deduplicated data can be used)
- When ρ > 0.5 (correlation between performance before and after training), **variance is lower** than the Difference estimator

---

## 5. Relation to Prior Notions of Memorisation

The paper's framework unifies three existing memorisation concepts:

### 5.1 Architectural Counterfactual Memorisation

Approach of Feldman (2020), Feldman and Zhang (2020): train multiple models with/without x and compare. Marginalises over training variables ψ (data permutation, initial parameters, etc.), thus measuring **architecture-level memorisation** rather than for a specific model instance.

**Drawbacks:** Cannot analyse effects of checkpoint or treatment step; computationally expensive.

### 5.2 Influence Functions

Approach of Koh and Liang (2017): approximate parameter changes from removing x without retraining. Requires (i) strict convexity of loss, (ii) positive-definite Hessian, (iii) model convergence — assumptions that are **generally not satisfied in LLMs**, which can lead to strong biases (Basu et al., 2020; Bae et al., 2022).

### 5.3 Extractable Memorisation

Carlini et al. (2023)'s (k,ℓ)-extractability: a string is extractable if the model correctly predicts ℓ of its tokens given a prefix of k tokens. This **implicitly assumes Y_c(x; ∞) = 0** — reasonable for long complex strings, but may overestimate memorisation for shorter or less complex sequences.

---

## 6. Experimental Setup

### The Pythia Suite

| Item | Details |
|------|---------|
| **Models** | Pythia suite (Biderman et al., 2023b): 70M, 160M, 410M, 1.4B, 6.9B, 12B |
| **Training data** | The Pile (deduplicated version, 207B tokens) |
| **Sequence length** | 2,049 tokens (BPE tokenised + packed) |
| **Learning schedule** | Cosine learning rate with warm-up |
| **Batch size** | 1,024 sequences |
| **Total optimisation steps** | 143k (approximately 1.5 epochs) |
| **Analysis scope** | 1st epoch (steps 1k–95k), 96 checkpoints |
| **Hardware** | NVIDIA A100 80GB PCIe, 32 CPUs, 32GB RAM |

### Constructing the Panel

- **Training instances:** Randomly choose 10 batches per macro-batch, sample 10 instances from each → 14.3k training instances
- **Validation instances:** Sample 2k instances from the Pile validation set
- **Total panel:** 16.3k instances × 96 timesteps
- **Performance metric:** Sequence-level log-likelihood: γ(θ, x) = log p_θ(x)
- **Statistical inference:** Simple Multiplier Bootstrap procedure of Callaway and Sant'Anna (2021) for simultaneous confidence intervals

---

## 7. Results

### 7.1 Instantaneous Memorisation

![Figure 3: Instantaneous memorisation (τ_{g,c} for g = c). Only statistically significant estimates shown.](/images/papers/memorisation-profiles/fig3-instantaneous-memorisation.png)

- **Effect of treatment step:** Instances treated earlier in training exhibit stronger instantaneous memorisation.
- **Correlation with learning rate:** Correlates with the cosine learning rate schedule — stronger after the warm-up period (around timestep 1.5k) than before it.
- **Model size effect:** Instantaneous memorisation increases with model size.

### 7.2 Persistent Memorisation

![Figure 4: Average persistent memorisation — τ_{g,c} averaged per timestep after treatment (c − g). Only statistically significant estimates shown.](/images/papers/memorisation-profiles/fig4-persistent-memorisation.png)

- **Model size effect:** Smaller models (70M) have no persistent memorisation, while larger models show increasingly persistent memorisation.
- **Temporal pattern:** Persistent memorisation **plateaus after approximately 25k timesteps**.
- **Implication for data ordering:** If there are particular instances we do not want the model to memorise but still want to use during training, they should be included in earlier batches.

### 7.3 Residual Memorisation

![Figure 5: Residual memorisation (τ_{g,c} for c = T = 95k). Stronger colour intensity indicates statistical significance.](/images/papers/memorisation-profiles/fig5-residual-memorisation.png)

- **Recency effect:** The final macro-batches are the most memorised.
- **Explained by learning rate:** When learning rate is high → high instantaneous, low residual (previous information is "overwritten"). When learning rate is low → low instantaneous, high residual (previous information is less "forgotten").
- Many macro-batches show **statistically insignificant** residual memorisation at the end of the first epoch — many instances are forgotten.

### 7.4 Memorisation Across Scales

![Figure 6: Pearson correlation between memorisation profiles of different models.](/images/papers/memorisation-profiles/fig6-pearson-correlation.png)

| Model | 70M | 160M | 410M | 1.4B | 6.9B | 12B |
|-------|-----|------|------|------|------|-----|
| **70M** | 1.0 | 0.71 | 0.22 | 0.25 | 0.22 | 0.24 |
| **160M** | | 1.0 | 0.63 | 0.63 | 0.57 | 0.53 |
| **410M** | | | 1.0 | 0.93 | 0.88 | 0.8 |
| **1.4B** | | | | 1.0 | 0.93 | 0.88 |
| **6.9B** | | | | | 1.0 | 0.94 |
| **12B** | | | | | | 1.0 |

**Key finding:** Memorisation for larger models (e.g., 12B) is predictable from smaller ones (e.g., 410M) with correlation of 0.8. However, 70M and 160M are less predictive due to training instability (Godey et al., 2024).

---

## 8. Full Memorisation Profiles

![Figure 2: Memorisation profiles (τ_{g,c}) for all Pythia sizes. Only statistically significant entries shown. Diagonal = instantaneous, off-diagonal = persistent, final column = residual.](/images/papers/memorisation-profiles/fig2-memorisation-profiles-all.png)

---

## 9. Limitations

- **Model scope:** Limited to the Pythia suite (English, single architecture). Generalisation to other architectures, training procedures, and natural languages requires further investigation.
- **Computational cost:** Even in inference mode, extracting performance measures for large pretrained LMs can be expensive.
- **Subsampling:** Panel data construction involves subsampling instances, which can significantly increase estimator variance.

---

## 10. Conclusions

This work presents an unbiased and efficient estimator of memorisation based on the difference-in-differences design from econometrics. Studying memorisation profiles of the Pythia model suite reveals:

1. **Memorisation is stronger and more persistent in larger models**
2. **Data order and learning rate determine memorisation** — instances treated when the learning rate is high show stronger instantaneous memorisation, while residual memorisation is higher for later-treated instances
3. **Memorisation profiles are stable across model sizes** — memorisation in larger models can be predicted from smaller ones

These findings have important implications for understanding and managing memorisation in LLMs from the perspectives of privacy, copyright, and AI safety.
