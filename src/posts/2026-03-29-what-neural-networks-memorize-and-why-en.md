---
title: "What Neural Networks Memorize and Why: Discovering the Long Tail via Influence Estimation - Paper Analysis"
date: 2026-03-29
summary: "First empirical validation of the long tail theory of memorization: label memorization in deep learning is necessary for close-to-optimal generalization on long-tailed distributions. Using subsampled memorization and influence estimators with 2,000–4,000 models on MNIST, CIFAR-100, and ImageNet, the paper shows memorized examples have higher marginal utility than random examples and discovers substantial high-influence train-test pairs where memorized training examples significantly boost accuracy on visually similar test examples. Most memorization happens in deep representations, not the last layer."
tags: [Deep Learning, Memorization, Long Tail, Influence Estimation, Generalization, Privacy, ImageNet, CIFAR-100, Research Note]
category: 연구노트
language: en
---

# What Neural Networks Memorize and Why: Discovering the Long Tail via Influence Estimation

**Authors:** Vitaly Feldman* (Apple), Chiyuan Zhang* (Google Research, Brain Team)
**arXiv:** [2008.03703](https://arxiv.org/abs/2008.03703)
**Code/Site:** [pluskid.github.io/influence-memorization](https://pluskid.github.io/influence-memorization/)

---

## One-Line Summary

Deep learning algorithms' propensity for **label memorization** is not mere overfitting — it is **necessary for achieving close-to-optimal generalization** on **long-tailed distributions**, as empirically validated for the first time using subsampled influence estimation across MNIST, CIFAR-100, and ImageNet.

---

## 1. Introduction: Why Do Neural Networks Memorize?

Perhaps the most captivating aspect of deep learning algorithms is their ability to generalize to unseen data. Yet, the models typically achieve 95–100% training accuracy, fitting even obvious outliers and mislabeled examples. The only way for a training algorithm to fit an example whose label cannot be predicted based on the rest of the dataset is to **memorize** the label.

**Disconnect with classical theory:** The standard approach upper-bounds generalization error by a sum of model complexity-controlled generalization gap and empirical error. Fitting outliers and mislabeled examples does not improve generalization error. Therefore, to avoid "overfitting," the balance should be tuned to prevent label memorization. **Memorization is generally thought of as being the opposite of generalization.**

**Feldman (2020)'s Long Tail Theory:** When the data distribution is **long-tailed** — rare and atypical instances make up a significant fraction — memorization is **necessary** for achieving close-to-optimal generalization error. Moreover, useful examples from the "long tail" (memorizing them improves generalization) are **statistically indistinguishable** from useless ones (outliers and mislabeled examples). This makes memorization of useless examples (and the resulting large generalization gap) necessary for optimal generalization.

However, this theory was only demonstrated theoretically using an abstract model. **No direct empirical evidence** was previously provided. This paper designs experiments to test the key ideas in this theory.

---

## 2. Estimator Design: Subsampled Memorization & Influence

### 2.1 Label Memorization Definition

Following Feldman (2020), the amount of label memorization by algorithm $\mathcal{A}$ on dataset $S = ((x_1, y_1), \ldots, (x_n, y_n))$ for example $(x_i, y_i) \in S$:

$$\text{mem}(\mathcal{A}, S, i) := \Pr_{h \leftarrow \mathcal{A}(S)}[h(x_i) = y_i] - \Pr_{h \leftarrow \mathcal{A}(S^{\setminus i})}[h(x_i) = y_i]$$

where $S^{\setminus i}$ denotes $S$ with $(x_i, y_i)$ removed. **Intuition:** An algorithm memorizes the label $y_i$ if its prediction at $x_i$ changes significantly when $(x_i, y_i)$ is added to the dataset.

### 2.2 Computational Infeasibility of Direct Estimation

Estimating memorization values with standard deviation $\sigma$ requires $\Omega(n/\sigma^2)$ training runs — **millions of runs** needed for $\sigma < 0.1$ on datasets with $n = 50,000$.

### 2.3 Subsampled Influence Estimator

**Key insight:** Instead of the full dataset $S$, measure the expected influence relative to a random subset of size $m < n$:

$$\text{infl}_m(\mathcal{A}, S, i, z) := \mathbb{E}_{I \sim P([n] \setminus \{i\}, m-1)} \left[ \text{infl}(\mathcal{A}, S_{I \cup \{i\}}, i, z) \right]$$

**Lemma 1:** There exists an algorithm that runs $\mathcal{A}$ only $t$ times and outputs estimates such that for every $i \in [n]$ and $p = \min(m/n, 1 - m/n)$:

$$\mathbb{E}[(\text{infl}_m - \mu_i)^2] \leq \frac{1}{pt} + \frac{1}{(1-p)t} + \frac{e^{-pt/16}}{2}$$

This means $O(1/\sigma^2)$ training runs suffice to estimate **all** $n$ examples simultaneously.

**Algorithm 1 (Core Algorithm):**

1. Sample $t$ random subsets $I_1, \ldots, I_t$ of $[n]$ of size $m$
2. Train model $h_k$ on each subset $S_{I_k}$
3. For each training example $i$:
   - **Memorization estimate:** $\widetilde{\text{mem}}_m(i) = \Pr_k[h_k(x_i) = y_i \mid i \in I_k] - \Pr_k[h_k(x_i) = y_i \mid i \notin I_k]$
   - **Influence estimate:** $\widetilde{\text{infl}}_m(i, j) = \Pr_k[h_k(x'_j) = y'_j \mid i \in I_k] - \Pr_k[h_k(x'_j) = y'_j \mid i \notin I_k]$

**Note:** For $m = n/2$, this estimator is closely related to the **Shapley value** of example $(x_i, y_i)$ for the accuracy function.

### 2.4 Experimental Parameters

| Parameter | MNIST / CIFAR-100 | ImageNet |
|---|---|---|
| Subset size $m$ | $0.7n$ | $0.7n$ |
| Number of trials $t$ | 4,000 | 2,000 |
| Memorization threshold $\theta_{\text{mem}}$ | 0.25 | 0.25 |
| Influence threshold $\theta_{\text{infl}}$ | 0.15 | 0.15 |

Justification for $\theta_{\text{infl}} = 0.15$: On CIFAR-100, two independent runs of 2,000 trials selected 1,095 and 1,062 pairs respectively, with **Jaccard similarity ≥ 0.7** (~82% overlap).

---

## 3. Experimental Results

### 3.1 Setup

- **Models:** ResNet50 (ImageNet, CIFAR-100), Inception (MNIST)
- **Datasets:** MNIST (60K train), CIFAR-100 (50K train), ImageNet (1.28M train)
- **Training runs:** MNIST/CIFAR-100: 4,000; ImageNet: 2,000

### 3.2 Memorization Value Examples

![Memorization value examples - ImageNet](/images/papers/what-nn-memorize/imagenet-memscore-class450-bobsled.png)
*Figure 1 (top): ImageNet "bobsled" class memorization values*

![CIFAR-100 memorization](/images/papers/what-nn-memorize/cifar100-memscore-class6-bee.png)
*Figure 1 (bottom-left): CIFAR-100 "bee" class memorization values*

![MNIST memorization](/images/papers/what-nn-memorize/mnist-memscore-fig1.png)
*Figure 1 (bottom-right): MNIST classes 2, 3, 5, 6 memorization values*

**Observations:**
- Memorization estimate ≈ 0: Clearly **typical** images
- Memorization estimate ≈ 1: **Atypical**, highly ambiguous, or mislabeled images
- Memorization estimate ≈ 0.5: Somewhat atypical but interpretable

### 3.3 Marginal Utility of Memorized Examples

![Marginal utility - ImageNet](/images/papers/what-nn-memorize/memscore-subset-plot-imagenet-comb.png)
*Figure 2 (ImageNet): Effect on test accuracy of removing examples with memorization above a threshold vs. removing the same number of random examples*

![Marginal utility - CIFAR-100](/images/papers/what-nn-memorize/memscore-subset-plot-cifar100-comb.png)
*Figure 2 (CIFAR-100)*

![Marginal utility - MNIST](/images/papers/what-nn-memorize/memscore-subset-plot-mnist-comb.png)
*Figure 2 (MNIST)*

| Dataset | Fraction mem ≥ 0.3 | Accuracy Drop (memorized removed) | Accuracy Drop (random removed) |
|---|---|---|---|
| ImageNet | ~32% | ~3.4% | ~2.6% |
| CIFAR-100 | Substantial | Significant | Smaller |
| MNIST | Very few | Negligible | Negligible |

**Key finding: Memorized examples have higher marginal utility than the identical number of randomly chosen examples.** The likely reason is that most randomly chosen examples are easy and have no marginal utility. MNIST shows minimal memorization effect due to low data variability (fewer subpopulations, more examples per class).

---

## 4. Discovery of High-Influence Pairs

### 4.1 Selection Criteria

For train-test example pairs $(x_i, y_i)$ and $(x'_j, y'_j)$:
1. $\widetilde{\text{mem}}_m(\mathcal{A}, S, i) \geq 0.25$ (significant memorization)
2. $\widetilde{\text{infl}}_m(\mathcal{A}, S, i, j) \geq 0.15$ (significant influence)
3. $y_i = y'_j$ (same class)

### 4.2 High-Influence Pairs Found

| Dataset | Pairs Found | Unique Test Examples (% of test set) | Influenced by Single Training Example |
|---|---|---|---|
| MNIST | 35 | 33 (0.33%) | 31 |
| CIFAR-100 | 1,015 | 888 (8.88%) | 774 |
| ImageNet | 1,641 | 1,462 (2.92%) | 1,298 |

![Influence histograms - ImageNet](/images/papers/what-nn-memorize/influence-hist-imagenet-18bins.png)
*Figure 3 (ImageNet): Histogram of influence estimates for selected high-influence pairs*

![Influence histograms - CIFAR-100](/images/papers/what-nn-memorize/influence-hist-cifar100_resnet50_jn05_4k-18bins.png)
*Figure 3 (CIFAR-100)*

**Key findings:**
- Most influenced test examples are significantly influenced by **only a single training example** (CIFAR-100: 774/888, ImageNet: 1298/1462)
- This **uniqueness** precisely matches the key prediction of the long tail theory: unique representatives of rare subpopulations are the ones that significantly increase accuracy on their subpopulation and are statistically indistinguishable from outliers

### 4.3 Quantitative Validation of Marginal Utility

On CIFAR-100:

| Training Set | Full Test Accuracy | High-Influence Test Examples Accuracy |
|---|---|---|
| Full $S$ | 76.06 ± 0.28% | 72.14 ± 1.32% |
| $S \setminus S_h$ (high-influence removed) | 73.52 ± 0.25% | 45.38 ± 1.45% |
| **Difference** | **2.54 ± 0.2%** | **26.76 ± 1.96%** |

The accuracy difference on high-influence test examples contributes $2.38 \pm 0.17\%$ to the total difference of $2.54 \pm 0.2\%$ — **within one standard deviation**. This means the detected high-influences capture the marginal utility of $S_h$ almost entirely.

### 4.4 Visual Analysis of High-Influence Pairs

![MNIST influence examples](/images/papers/what-nn-memorize/mnist-influence-newfig1.png)
*Figure 4: MNIST high-influence pair examples. Left column: memorized training examples (memorization estimate above). For each, the 4 most influenced test examples (influence estimate above each).*

![CIFAR-100 influence examples](/images/papers/what-nn-memorize/cifar100-influence-newfig1.png)
*Figure 5: CIFAR-100 high-influence pair examples*

![ImageNet influence examples](/images/papers/what-nn-memorize/imagenet-influence-newfig1.png)
*Figure 6: ImageNet high-influence pair examples*

**Visual observations:**
- **Very high influence (> 0.4):** Almost always near-duplicates or images from the same photo set (particularly prominent in CIFAR-100)
- **Moderate to lower influence (0.15–0.4, >80% of cases):** Visually very similar but not from the same set
- Examples selected without any cherry-picking: sorted by influence magnitude, then evenly spaced

---

## 5. Cross-Architecture Consistency

Comparison across ResNet50, ResNet18, Inception, and DenseNet100 on CIFAR-100:

![Cross-architecture Jaccard](/images/papers/what-nn-memorize/cross-arch-mem-jaccard.png)
*Figure 7 (left): Jaccard similarity of memorization estimates across architectures*

![Cross-architecture score difference](/images/papers/what-nn-memorize/cross-arch-mem-score_diff.png)
*Figure 7 (right): Average difference in memorization estimates across architectures*

**Findings:**
- Two independent runs of ResNet50: high consistency, negligible selection bias
- **Strong correlations** between memorized examples and high-influence pairs across different architectures
- Estimation differences correlate with **accuracy differences** between architectures
- **Implication:** Memorization estimates are not very sensitive to architecture variations as long as they achieve similar accuracy

---

## 6. Does the Last Layer Suffice for Memorization?

### 6.1 Experimental Design

Speed-up attempt: Train ResNet50 on full CIFAR-100, extract penultimate layer outputs as **representations**, then train only the last linear layer on random subsets. **720× reduction** in training time.

### 6.2 Results

| Method | Test Accuracy | Examples with mem ≥ 0.25 | High-Influence Pairs |
|---|---|---|---|
| Full ResNet50 (70% training) | 72.3 ± 0.3% | 18,099 | 1,015 |
| Linear classifier (70% training) | 75.8 ± 0.1% | **38** | 457 |
| Full ResNet50 (100% training) | 75.9% | — | — |

**Key finding:**
- The linear model **completely fails to detect memorized examples** (18,099 vs. 38)
- Most high-influence pairs from linear models show no visual similarity
- **Conclusion: Most of the memorization effectively happens in the deep representation, not in the last layer.** Trained representations of memorized examples are already close to those of other examples from the same class.

---

## 7. Discussion and Conclusions

### 7.1 Main Contributions

1. **First empirical validation of the long tail theory:** Based on formally defined and intuitive criteria for memorization and its effects on accuracy
2. **Efficient estimator design:** $O(1/\sigma^2)$ training runs to simultaneously estimate all memorization and influence values
3. **Empirical findings:**
   - Memorized examples have higher marginal utility than random examples
   - Substantial number of visually interpretable high-influence train-test pairs
   - Most influenced test examples depend on a single training example (unique representatives)
4. **Last layer experiment:** Evidence that memorization occurs in deep representations

### 7.2 Societal Implications

Techniques that limit an algorithm's ability to memorize data will have a **disproportionate effect on under-represented subpopulations**. This is already known in the context of differential privacy (Bagdasaryan et al., 2019), and this paper extends the implication to a broader context — model compression, training time optimization, and any regularization that reduces memorization.

### 7.3 Comparison with Related Work

- **Zhang et al. (2017):** Showed neural networks can fit random labels → this paper explains why such fitting is beneficial for true labels
- **Influence Functions (Koh & Liang, 2017):** Hessian-based approach → this paper uses subsampling for more reliable estimates
- **Carlini et al. (2019):** Compared prototypicality metrics, unsuccessfully attempted influence estimation on MNIST → this paper provides a computationally feasible method
- **Forgetting (Toneva et al., 2019):** Studied "forgetting" events → not directly related to this paper's memorization definition

---

## 8. Overall Assessment

This paper provides a compelling empirical answer to a fundamental question in deep learning: "Why do neural networks memorize?" Through an elegant subsampled estimation methodology, it validates the long tail theory — showing that **memorization is not a byproduct of overfitting but a necessary mechanism for optimal generalization on long-tailed distributions**.

The discovery of 1,641 high-influence pairs on ImageNet, with 1,298 test examples depending on a single training example, matches theoretical predictions with remarkable precision. The last-layer experiment revealing that memorization occurs in deep representations rather than the final layer provides an important insight into the model's internal mechanics.

Read alongside Feldman (2020)'s theoretical work, this paper provides the most comprehensive understanding of the memorization-generalization relationship in deep learning.
