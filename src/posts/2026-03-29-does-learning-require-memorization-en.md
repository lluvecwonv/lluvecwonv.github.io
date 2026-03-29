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

## 4. Memorization, Privacy, and Stability

The preceding sections discussed memorization informally. This section gives a formal definition of label memorization and demonstrates that fitting the training data requires label memorization whenever there is sufficient (statistical or computational) uncertainty in the labels. This allows showing that limits on the memorization ability of an algorithm translate into a loss of accuracy (on long-tailed distributions), and that even relatively weak forms of differential privacy imply the algorithm cannot memorize well.

### 4.1 Label Memorization Definition (Definition 4.1)

To measure the ability of algorithm A to memorize labels, the author examines how much the labeled example (x, y) affects the prediction of the model on x:

```
mem(A, S, i) := Pr_{h~A(S)}[h(x_i) = y_i] - Pr_{h~A(S\i)}[h(x_i) = y_i]
```

where S\i denotes S with (x_i, y_i) removed. The effect is measured as the total variation distance between the distributions of the indicator of the label being y. Strictly speaking, the memorization value can be negative (in which case it equals the negation of the TV distance), but for most practical algorithms this value is expected to be non-negative.

This definition is closely related to leave-one-out stability. LOO stability upper bounds the expected memorization:

```
(1/n) · E_{S~P^n}[Σ_{i∈[n]} mem(A, S, i)] ≤ LOOstab(P, A)
```

**Lemma 4.2 (Memorization equals Generalization Gap):** For every distribution P and any learning algorithm A:

```
(1/n) · E_{S~P^n}[Σ_{i∈[n]} mem(A, S, i)] = E_{S~P^n}[err_S(A, S)] - E_{S'~P^{n-1}}[err_P(A, S')]
```

where err_S(A, S) is the expected empirical error of A on S. Since E[err_P(A, S')] differs from the expected generalization error by typically less than 1/n, **a large generalization gap indicates that many labels are memorized and vice versa.**

**Lemma 4.3 (Fitting requires Memorization):** If A cannot predict the label y_i of x_i without observing it, then it needs to memorize it to fit it:

```
Pr_{h~A(S)}[h(x_i) ≠ y_i] = Pr_{h~A(S\i)}[h(x_i) ≠ y_i] - mem(A, S, i)
```

In particular, for singleton examples:

```
errn_S(A, 1) = Σ_{i: x_i ∈ X_{S#1}} [Pr_{h~A(S\i)}[h(x_i) ≠ y_i] - mem(A, S, i)]
```

There are two reasons why an algorithm A cannot predict the label on x_i without observing it. First, **statistical uncertainty** — measured by ‖ρ‖_∞ := max_{y∈Y} ρ(y), where 1 - ‖ρ‖_∞ is the error of the Bayes optimal predictor. Second, **computational limitations** — even if a simple model explaining the data exists, the learning algorithm may not be able to find it. For example, using a pseudo-random labeling function [Goldreich et al., 1986] achieves the uniform prior for all polynomial-time algorithms.

**Lemma 4.4 (Uncertainty implies need for memorization):** For an arbitrary label distribution ρ:

```
Pr_{y~ρ, h~A(S^{i←y})}[h(x) ≠ y] ≥ 1 - ‖ρ‖_∞ - E_{y~ρ}[mem(A, S^{i←y}, i)]
```

where S^{i←y} denotes S with (x_i, y) in place of (x_i, y_i). Extending to all singletons:

```
E[errn_S(A, 1)] ≥ E[Σ_{i: x_i ∈ X_{S#1}} (1 - ‖F(x_i|S\i)‖_∞ - mem(A, S, i))]
```

where F(x_i|S\i) is the conditional distribution over x_i's label after observing all other examples. The proof follows from Definition 4.1: Pr[h(x)=y] = Pr_{A(S\i)}[h(x)=y] + mem(A, S^{i←y}, i), so taking the expectation over ρ yields an upper bound of max_{y'} Pr[y'=y] = ‖ρ‖_∞.

### 4.2 Cost of Limited Memorization

**Definition 4.5 (γ-memorization limited):** A learning algorithm A is γ-memorization limited if for all S ∈ (X,Y)^n and all i ∈ [n], mem(A, S, i) ≤ γ.

Bounds on memorization ability result directly from various techniques such as implicit and explicit regularization and model compression. One can think of these techniques as minimizing the sum of some notion of capacity scaled by a regularization parameter λ and the empirical error. Fitting a label not correctly predicted from the rest of the dataset requires increasing the capacity, so a regularized algorithm will not fit the example if the capacity increase (scaled by λ) does not outweigh the decrease in empirical error.

**Corollary 4.6 (Excess error of γ-memorization limited algorithms):** In the setting of Theorem 2.4, for any γ-memorization limited algorithm A:

```
ε̄(π, F, A) ≥ opt(π, F) + τ₁ · E[Σ_{i: x_i ∈ X_{S#1}} conf(S,i,F) · (1 - ‖F(x_i|S\i)‖_∞ - γ)]
```

The bound depends on the uncertainty 1 - ‖F(x_i|S\i)‖_∞. For example, if labeling under f ~ F is uniform and k-wise independent for k upper-bounding the typical number of distinct points, then with high probability ‖F(x_i|S\i)‖_∞ = 1/|Y|.

**Key conclusions:** For Zipf prior with N ≥ n:

- Any γ-memorization limited algorithm with γ < 1 - 1/|Y| has **excess error of Ω(1)**
- Any algorithm achieving optimal generalization error must memorize **Ω(n) labels**
- In particular, it must have a **generalization gap of Ω(1)**

These conclusions hold **even with noise**. In the random classification noise model where the correct label f(x) is replaced with a uniformly random one with probability 1 - κ, we have conf(S, i, F) ≥ κ for singleton examples. Thus even noisy labels need to be memorized as long as κ = Ω(1).

### 4.3 Cost of Differential Privacy

Memorization of training data can be undesirable — it enables **black-box membership inference attacks** [Shokri et al., 2017; Long et al., 2017, 2018; Truex et al., 2018] and **extraction of planted secrets from language models** [Carlini et al., 2019]. The standard defense is **differential privacy (DP)** [Dwork et al., 2006], which limits the output distribution's sensitivity to individual data points. Despite significant progress, DP models still lag substantially behind non-DP state-of-the-art.

The author proves that some of this gap is **inherent** due to long-tailed data, even for a very weak form of privacy: label privacy for predictions.

**Definition 4.7 ((ε,δ)-differentially label-private prediction):** Algorithm A satisfies this if for every x ∈ X and datasets S, S' differing only in a single label, for any label subset Y':

```
Pr_{h~A(S)}[h(x) ∈ Y'] ≤ e^ε · Pr_{h~A(S')}[h(x) ∈ Y'] + δ
```

Any algorithm satisfying this is (e^ε - 1 + δ)-memorization limited.

**Theorem 4.8 (DP limits memorization):** For (ε, δ)-differentially label-private prediction algorithm A and arbitrary label distribution ρ:

```
Pr_{y~ρ, h~A(S^{i←y})}[h(x) = y] ≤ e^ε · ‖ρ‖_∞ + δ
```

This yields:

```
E[errn_S(A, 1)] ≥ E[Σ_{i: x_i ∈ X_{S#1}} (1 - e^ε · ‖F(x_i|S\i)‖_∞ - δ)]
```

And consequently:

```
ε̄(π, F, A) ≥ opt(π, F) + τ₁ · E[Σ_{i: x_i ∈ X_{S#1}} conf(S,i,F) · (1 - e^ε · ‖F(x_i|S\i)‖_∞ - δ)]
```

The proof follows from the DP definition: Pr[h(x)=y] ≤ e^ε · Pr_{A(S)}[h(x)=y] + δ, so taking the expectation over ρ yields e^ε · ‖ρ‖_∞ + δ.

**Extension to ℓ examples via group privacy:** If ℓ labels are changed, the resulting distributions are (ℓε, ℓ·e^{ℓ-1}·δ)-close. The total weight of subpopulations with at most ℓ examples is significant in most modern datasets, formally explaining at least some of the gap between DP and non-DP results.

**Uniform stability:** Uniform prediction stability [Bousquet & Elisseeff, 2002; Dwork & Feldman, 2018] requires that changing any point changes the label distribution on any point by at most γ in TV distance. γ-uniform stability implies both γ-memorization limited and (0, γ)-differentially private for predictions, so Corollary 4.6 applies.

### 4.4 Disparate Effect on Minority Subgroups

Corollary 4.6 and Theorem 4.8 imply that limiting memorization increases generalization error on long-tailed distributions. Crucially, the excess error depends on the prior π, problem hardness, and sample count n, implying that **when the data distribution is a mixture of subgroups with different properties, the cost of limiting memorization can differ across subgroups**. In particular, the cost is higher for smaller subgroups or those with more distinct subpopulations. These effects were empirically confirmed for DP by [Bagdasaryan & Shmatikov, 2019] and for model compression by [Hooker et al., 2020a, 2020b], who also demonstrated that the error increase is **most pronounced on atypical examples**.

**Numerical example:** 10-class classification, N = 5,000 subpopulations, Zipf prior, γ = 0.5 (the choice of γ does not affect comparisons as it scales excess error uniformly across subgroups)

| Scenario | opt(π, F) | Cost of limited memorization |
|----------|-----------|------------------------------|
| Baseline (N=5000, n=50000) | ≈ 0.018 | ≈ 0.015 |
| Fewer samples (N=5000, n=10000) | ≈ 0.113 | ≈ 0.035 |
| Harder problem (N=25000, n=50000) | ≈ 0.107 | ≈ 0.031 |

**Mixture analysis:**

- **P = 5/6·P₁ + 1/6·P₂** (baseline + fewer samples, n=60,000): Each subgroup retains the same optimum and memorization cost, but the **cost of limited memorization is more than twice higher for the smaller subgroup**
- **P = 1/2·P₁ + 1/2·P₃** (baseline + harder problem, n=100,000): The **cost of limited memorization is twice higher for the harder subgroup**

The cost of memorization with 10 classes and γ = 0.5 equals the cost of (label) differential privacy for predictions with ε = ln(6) and δ ≈ 0, so the same conclusions follow from Theorem 4.8.

Understanding these disparate effects enables mitigation strategies: applying **different levels of regularization (or compression)** per subgroup to balance costs, or using **different privacy parameters** per subgroup (assuming the additional privacy risk is justified by accuracy gains).

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
