---
title: Does Learning Require Memorization? A Short Tale about a Long Tail - Paper Summary
date: 2026-03-29
summary: A STOC 2020 paper that theoretically proves memorization of training labels is necessary for achieving close-to-optimal generalization on natural long-tailed data distributions. The framework quantifies the cost of limiting memorization and explains the disparate accuracy impacts of differential privacy and model compression on minority subgroups.
tags: [LLM, Memorization, Long-tail, Generalization, Differential Privacy, STOC, Research Note]
category: 연구노트
language: en
---

This research note summarizes the STOC 2020 paper **Does Learning Require Memorization? A Short Tale about a Long Tail**.
The author is Vitaly Feldman from Google Research, Brain Team (now at Apple).

The core question is this:

**"Is memorization of outliers and noisy labels by learning algorithms a harmful artifact of overfitting, or is it necessary for achieving optimal generalization?"**

This paper theoretically proves that due to the **long-tailed** nature of natural data distributions, memorization is **necessary** for achieving close-to-optimal generalization error. Crucially, even memorization of outliers and noisy labels is required.

Paper link: https://arxiv.org/abs/2003.05753

## TL;DR

When subpopulation frequencies in natural data follow a **long-tailed distribution**, a learning algorithm that does not memorize the labels of singleton examples (examples appearing only once) will be **systematically suboptimal** in generalization error — this trade-off is quantified via a quantity τ₁.

![Figure 1: Long tail of class frequencies](/images/papers/learning-memorization/fig1-long-tail.jpg)
*Figure 1: Long tail of class frequencies and subpopulation frequencies within classes. Observed from the SUN object detection benchmark. Reproduced from [Zhu et al., 2014] with permission.*

## 1. Introduction — Why Is Memorization Necessary?

### 1.1 The Modern ML Dilemma

Deep learning models are famously **overparameterized**, containing many more tunable parameters than available data points. The classical theoretical approach explains how learning algorithms avoid overfitting through **regularization** — balancing model complexity and empirical error. Fitting mislabeled points or outliers increases model complexity, so theory suggests avoiding this.

However, reality contradicts this view. Deep learning algorithms achieve 95-100% training accuracy while test accuracy is often in the 50-80% range. Such (near) perfect fitting requires memorization of mislabeled data and outliers inevitably present in large datasets. Furthermore, the same learning algorithms achieve training accuracy of over 90% on ImageNet labeled **completely randomly** [Zhang et al., 2017]. These algorithms clearly do not use regularization strong enough to prevent memorization of mislabeled examples and outliers.

This paper provides the **first conceptual explanation and theoretical model** for this phenomenon.

### 1.2 Core Intuition: Long Tails and Subpopulations

The key explanation: the primary hurdle to learning an accurate model is not the noise inherent in the labels but rather an **insufficient amount of data to predict accurately on rare and atypical instances**. Such instances are referred to in practice as the "long tail" of the data distribution.

To formalize the notion of a "long tail," the data distribution of each class is modeled as a **mixture of distinct subpopulations**. For example, images of birds include numerous different species photographed from different perspectives and under different conditions (close-ups, in foliage, in the sky). The subpopulations have different frequencies, and the key observation is that the distribution of subpopulation frequencies is **long-tailed**.

**Core argument flow:**

1. A dataset of n samples will have some subpopulations from which just a single example was observed (**singletons**)
2. To predict accurately on a singleton's subpopulation, the learning algorithm needs to **memorize** its label
3. Based on a single sample, it is **impossible to distinguish** whether a singleton comes from an "atypical" subpopulation or an "outlier" subpopulation
4. Therefore, to avoid the risk of missing "atypical" subpopulations, the algorithm must also memorize labels of "outlier" singletons
5. In a long-tailed distribution, the total weight of frequencies on the order of 1/n is significant, so ignoring these subpopulations will hurt generalization error substantially

### 1.3 Why Noisy Labels Must Be Memorized

The long tail effect also explains why memorizing mislabeled examples can be necessary. A learning algorithm may be unable to infer the label of a singleton example accurately based on the rest of the dataset. As long as the observed label is the most likely to be correct, the algorithm needs to memorize it. In contrast, a mislabeled example from a subpopulation with many other examples can have its correct label inferred, so memorization is not necessary (and can even be harmful).

## 2. Theoretical Model

### 2.1 Problem Setup

The domain X is unstructured and discrete with |X| = N, |Y| = m.

**Frequency generation process:** For every x ∈ X, sample frequency p_x independently from the prior π = (π₁, ..., π_N), then normalize to sum to 1. The resulting marginal distribution over individual frequencies is denoted π̄ᴺ.

**Learning objective:** Minimize the expectation of generalization error over the meta-distribution:

```
ε̄(π, F, A) := E_{D~D, f~F} [ E_{S~(D,f)^n, h~A(S)} [ Pr_{x~D}[h(x) ≠ f(x)] ] ]
```

### 2.2 Main Theorem (Theorem 1: The Cost of Not Fitting)

**Definition (errn):** For dataset S and multiplicity ℓ, errn_S(A, ℓ) counts the number of points appearing exactly ℓ times in S that the algorithm does not fit correctly.

**Theorem 1 (Main Bound):** For every learning algorithm A and every dataset Z:

```
ε̄(π, F, A | Z) ≥ opt(π, F | Z) + Σ_{ℓ∈[n]} τ_ℓ · errn_Z(A, ℓ)
```

where the key quantity is:

```
τ_ℓ = E_{α~π̄ᴺ}[α^(ℓ+1) · (1-α)^(n-ℓ)] / E_{α~π̄ᴺ}[α^ℓ · (1-α)^(n-ℓ)]
```

The meaning: **every time the algorithm does not fit a training example, the suboptimality increases proportionally to τ_ℓ.** In particular, τ₁ quantifies the cost of not fitting singleton examples.

### 2.3 Numerical Example

Under **Zipf distribution** (frequency of the i-th most frequent item proportional to 1/i) with N = 50,000 and n = 50,000:

| Quantity | Value |
|----------|-------|
| Expected loss per unfitted example | ≈ 0.47/n |
| Worst-case loss (least frequent element) | ≈ 0.09/n |
| Expected fraction of singleton examples | ≈ 17% |
| Suboptimality when not fitting all singletons | ≈ 7% |
| Optimal top-1 error for 10 balanced classes | ≈ 15% |

Not fitting singletons adds 7% to the optimal error of 15%, yielding 22% — nearly a 50% relative performance degradation.

### 2.4 Extension to Label Noise (Theorem 2)

In the presence of noise, if the posterior probability of the observed label being correct exceeds that of other labels by a confidence margin κ, memorizing singleton labels remains optimal:

```
ε̄(π, F, A) ≥ opt(π, F) + τ₁ · E[Σ_{singleton i} conf(S,i,F) · Pr[h(x_i) ≠ y_i]]
```

In most ML benchmark datasets, the noise rate is low and affects primarily atypical examples, so learning algorithms are tuned to memorize labels aggressively.

### 2.5 From Tails to Bounds

The magnitude of τ₁ is determined by the weight of frequencies around 1/n in the prior:

```
τ₁ ≥ (1/5n) · weight(π̄ᴺ, [1/3n, 2/n])
```

**With a long-tailed distribution:** τ₁ = Ω(1/n) and weight(π̄ᴺ, [0, 1/n]) = Ω(1), so an algorithm that does not fit most singletons will be suboptimal by Ω(1).

**Without a long tail (Lemma 3):** If no frequencies exist around 1/n, then τ₁ ≤ 2θ is negligible, so not fitting singletons incurs little cost.

## 3. Extension to General Mixture Models

### 3.1 Subpopulation Coupling

Real ML problems involve high-dimensional continuous distributions where individual points have exponentially small probability. The paper extends to **mixture models** where the data distribution is M(x) = Σᵢ αᵢ Mᵢ(x) with mixture coefficients generated from the prior π.

The key assumption is **Λ-subpopulation-coupling**: the algorithm's prediction on a data point is correlated with predictions on other points from the same subpopulation.

```
TV(Dist_{h~A(S)}[h(x)], Dist_{x'~M_x, h~A(S)}[h(x')]) ≤ 1 - λ_ℓ
```

**Theorem 3 (Mixture Model Extension):** For any Λ-subpopulation-coupled learning algorithm:

```
ε̄(π, F, A) ≥ opt(π, F) + E[Σ_ℓ λ_ℓ · τ_ℓ · errn_S(A, ℓ)]
```

### 3.2 When Coupling Holds

**Local algorithms (k-NN):** If subpopulations are sufficiently "clustered," including an example from a subpopulation will affect predictions over the entire subpopulation.

**Linear classifiers:** In high dimension (d ≫ n), when distinct subpopulations are sufficiently uncorrelated, subpopulation coupling holds. Specifically, for (τ, τ²/(8√n))-independent datasets, any approximately margin-maximizing linear classifier achieves coupling λ₁ ≥ 1 - δ (Theorem 4).

## 4. Formal Definition of Memorization and Privacy

### 4.1 Label Memorization Definition

```
mem(A, S, i) := Pr_{h~A(S)}[h(x_i) = y_i] - Pr_{h~A(S\i)}[h(x_i) = y_i]
```

where S\i denotes S with (x_i, y_i) removed. A large value indicates the algorithm has memorized that label.

**Key property:** The expectation of the average memorization value equals the expected generalization gap. Thus a large generalization gap implies that a significant fraction of labels is memorized.

### 4.2 Cost of Limited Memorization

**Definition:** Algorithm A is γ-memorization limited if mem(A, S, i) ≤ γ for all S, i.

**Corollary (Theorem 1 + Lemma 5):** For γ-memorization limited algorithms:

```
ε̄(π, F, A) ≥ opt(π, F) + τ₁ · E[Σ_{singleton i} conf(S,i,F) · (1 - ‖F(x_i|S\i)‖_∞ - γ)]
```

For Zipf prior with N ≥ n, any γ-memorization limited algorithm with γ < 1 - 1/|Y| has excess error of Ω(1).

### 4.3 Cost of Differential Privacy

**Theorem 5:** For an (ε, δ)-differentially label-private prediction algorithm:

```
E[errn_S(A, 1)] ≥ E[Σ_{singleton i} (1 - e^ε · ‖F(x_i|S\i)‖_∞ - δ)]
```

DP algorithms with ε = O(1) cannot memorize individual labels, so on long-tailed distributions, accuracy loss is inherent.

### 4.4 Disparate Effect on Minority Subgroups

The cost of limiting memorization differs across subgroups, quantified numerically.

**Setup:** 10-class classification, N = 5,000 subpopulations, Zipf prior, n = 50,000, γ = 0.5

| Scenario | opt(π, F) | Cost of limited memorization |
|----------|-----------|------------------------------|
| Baseline (N=5000, n=50000) | ≈ 0.018 | ≈ 0.015 |
| Fewer samples (N=5000, n=10000) | ≈ 0.113 | ≈ 0.035 |
| Harder problem (N=25000, n=50000) | ≈ 0.107 | ≈ 0.031 |

In a mixture P = 5/6·P₁ + 1/6·P₂, the **cost of limited memorization is more than twice higher for the smaller subgroup**. This aligns with empirical findings that DP training causes disproportionate accuracy drops on underrepresented subgroups [Bagdasaryan & Shmatikov, 2019].

## 5. Known Empirical Evidence

### 5.1 Differentially Private Training Limitations

DP training algorithms achieve the best results without interpolation but still fall well below state-of-the-art:

| Dataset | DP Algorithm Accuracy | Non-DP Accuracy |
|---------|-----------------------|-----------------|
| MNIST | 98% | 99.2% |
| SVHN | 82.7% | 92.8% |

![Figure 2: Hardest examples for DP — MNIST digit 3](/images/papers/learning-memorization/fig2-dp-mnist3.jpg)
![Figure 2: Hardest examples for DP — CIFAR-10 planes](/images/papers/learning-memorization/fig2-dp-cifar-planes.jpg)
*Figure 2: Hardest examples for a differentially private model to predict accurately (left) vs easiest ones (right). Top row: MNIST digit "3", bottom row: CIFAR-10 "plane". Reproduced from [Carlini et al., 2019] with permission.*

The examples on which a DP model errs are either **outliers or atypical ones**, exactly matching the predictions of the long-tail theory.

### 5.2 Follow-up Empirical Study [Feldman & Zhang, 2020]

In a subsequent work, using an efficiently computable proxy for the memorization score, the authors discovered memorized examples in MNIST, CIFAR-10/100, and ImageNet:

- Visual inspection: memorized examples are a mix of outlier/mislabeled examples and correctly labeled but atypical examples
- Removing memorized examples from the training set decreases model accuracy significantly
- Pairs of training set memorized examples and test set "dependent" examples exist: removing the training example drops accuracy on the corresponding test example significantly

## 6. Comparison with Standard Generalization Approaches

The author demonstrates that standard approaches cannot capture this phenomenon:

**Distribution-independent bounds:** When N ≥ n, generalization error on the uniform distribution is ≈ 0.5, making differences between algorithms insignificant.

**Distribution-dependent bounds:** An algorithm knowing D need not fit points with frequency 1/n², achieving excess error ≤ 1/n. But the algorithm does not know D in practice.

**Rademacher complexity / LOO stability:** These cannot distinguish "outlier" from "atypical" singletons. Since fitting outliers has zero benefit, these bounds will not recommend fitting any singletons. Additionally, comparing with Bayes optimal (0% error) when the optimal algorithm's error is over 25% yields vacuous bounds.

## 7. Discussion

### Limitations

- The theory starts from unstructured discrete domains; application to high-dimensional continuous problems requires the mixture model extension with subpopulation coupling assumptions
- Verifying the subpopulation coupling condition on real data is challenging
- Computing the exact error of the optimal algorithm requires knowledge of the prior π

### Implications

**First, theoretical justification for memorization.** Learning algorithms memorizing outliers and noisy labels is not a flaw but a necessary strategy for achieving optimal generalization on long-tailed natural data.

**Second, formalization of the privacy-utility trade-off.** Since DP limits memorization, accuracy loss on long-tailed distributions is inherent, and this loss is disproportionately higher for minority subgroups.

**Third, a new direction for generalization theory.** Explicitly modeling the prior distribution over subpopulation frequencies is key to overcoming limitations of classical generalization theory.

## Paper References

- **Feldman, 2020** — Does Learning Require Memorization? A Short Tale about a Long Tail (STOC 2020): [https://arxiv.org/abs/2003.05753](https://arxiv.org/abs/2003.05753)
- **Feldman & Zhang, 2020** — What Neural Networks Memorize and Why: [https://arxiv.org/abs/2008.03703](https://arxiv.org/abs/2008.03703)
- **Zhang et al., 2017** — Understanding deep learning requires rethinking generalization: [https://arxiv.org/abs/1611.03530](https://arxiv.org/abs/1611.03530)
- **Carlini et al., 2019** — Distribution Density, Tails, and Outliers in Machine Learning: [https://arxiv.org/abs/1910.13427](https://arxiv.org/abs/1910.13427)
- **Bagdasaryan & Shmatikov, 2019** — Differential Privacy Has Disparate Impact on Model Accuracy: [https://arxiv.org/abs/1905.12101](https://arxiv.org/abs/1905.12101)
- **Hooker et al., 2020** — Characterising Bias in Compressed Models: [https://arxiv.org/abs/2010.03058](https://arxiv.org/abs/2010.03058)

## Personal Commentary

This paper is mutually complementary with the ACR memorization paper. While the ACR paper provides a tool for **measuring** whether a model has memorized training data, Feldman's paper provides the **theoretical justification** for why memorization is necessary. The long-tail theory not only explains the memorization phenomenon but also explains why differential privacy and model compression have disproportionate effects on minority groups, giving it significant practical value.

However, since the theory starts from unstructured discrete domains, applying it to real deep learning settings requires the mixture model extension with the additional assumption of subpopulation coupling. The follow-up study [Feldman & Zhang, 2020] empirically confirming these theoretical predictions greatly strengthens the theory's persuasiveness.
