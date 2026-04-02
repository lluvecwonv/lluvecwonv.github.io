---
title: "A Comprehensive Guide to Training Data Attribution: From Influence Functions to EK-FAC"
date: 2026-03-24
summary: "A systematic review of Training Data Attribution (TDA) methods for tracing deep learning predictions back to training data. Covers Influence Functions (Koh & Liang, 2017), TracIn (Pruthi et al., 2020), Representer Points (Yeh et al., 2018), and Anthropic's EK-FAC-based Influence Functions scaled to 52B parameter LLMs (Grosse et al., 2023) — including core ideas, mathematical formulations, computational methods, trade-offs, and interconnections."
tags: [Influence Functions, TracIn, Representer Points, Training Data Attribution, XAI, LLM, Memorization, EK-FAC, Research Notes]
category: 연구노트
language: en
---

# A Comprehensive Guide to Training Data Attribution Methods

**Keywords:** Influence Functions, TracIn, Representer Points, EK-FAC, Training Data Attribution

When a deep learning model makes a prediction, understanding *why* it made that prediction is crucial. The question "which training examples most influenced this prediction?" has given rise to the field of **Training Data Attribution (TDA)**. This post provides an in-depth review of four foundational TDA methods.

---

## 1. Influence Functions (Koh & Liang, 2017)

**Paper:** Understanding Black-box Predictions via Influence Functions
**Authors:** Pang Wei Koh, Percy Liang (Stanford)
**Venue:** ICML 2017 (Best Paper Award)
**arXiv:** [1703.04730](https://arxiv.org/abs/1703.04730)

### Core Question

> "How would the model's prediction change if we removed a single training example?"

The most straightforward approach is **Leave-One-Out (LOO) retraining** — remove training point $z_i$, retrain from scratch, and observe the prediction change. But this requires $n$ retraining runs for $n$ training points, which is infeasible.

Influence Functions approximate this **without retraining**.

### Mathematical Formulation

Let $\hat{\theta}$ be the model parameters trained via empirical risk minimization:

$$\hat{\theta} = \arg\min_\theta \frac{1}{n} \sum_{i=1}^{n} L(z_i, \theta)$$

Upweighting training point $z$ by an infinitesimal $\epsilon$:

$$\hat{\theta}_{\epsilon, z} = \arg\min_\theta \frac{1}{n} \sum_{i=1}^{n} L(z_i, \theta) + \epsilon \cdot L(z, \theta)$$

The **influence on parameters** is:

$$\mathcal{I}_{\text{up,params}}(z) = \left.\frac{d\hat{\theta}_{\epsilon,z}}{d\epsilon}\right|_{\epsilon=0} = -H_{\hat{\theta}}^{-1} \nabla_\theta L(z, \hat{\theta})$$

where $H_{\hat{\theta}} = \frac{1}{n}\sum_{i=1}^{n}\nabla_\theta^2 L(z_i, \hat{\theta})$ is the **Hessian matrix**.

The **influence of training point $z$ on the loss at test point $z_{\text{test}}$** is:

$$\mathcal{I}_{\text{up,loss}}(z, z_{\text{test}}) = -\nabla_\theta L(z_{\text{test}}, \hat{\theta})^\top H_{\hat{\theta}}^{-1} \nabla_\theta L(z, \hat{\theta})$$

Intuitively, this is the Hessian-weighted inner product of the training gradient and test gradient.

### Computation

Direct Hessian inversion is $O(p^3)$, infeasible for millions of parameters. Two approximation methods:

1. **Conjugate Gradients (CG):** Iteratively solve $H^{-1}v$ using only Hessian-Vector Products
2. **Stochastic Estimation (LiSSA):** Stochastic approximation of HVP through iterative computation

### Strengths and Limitations

**Strengths:** Theoretically principled LOO approximation, useful for debugging, label error detection, data poisoning analysis, and domain adaptation.

**Limitations:** Theory requires strong convexity (breaks down for deep networks), expensive Hessian computation, potential mismatch with actual LOO in non-convex settings, only captures local behavior around $\hat{\theta}$.

---

## 2. TracIn (Pruthi et al., 2020)

**Paper:** Estimating Training Data Influence by Tracing Gradient Descent
**Authors:** Garima Pruthi, Frederick Liu, Satyen Kale, Mukund Sundararajan (Google)
**Venue:** NeurIPS 2020 (Spotlight)
**arXiv:** [2002.08484](https://arxiv.org/abs/2002.08484)

### Core Idea

While Influence Functions depend on the Hessian at the final model, TracIn **traces the entire training process**. It accumulates how much the test loss changed each time a training example was used.

### Mathematical Formulation

**Ideal TracIn:**

$$\text{TracIn}_{\text{ideal}}(z, z') = \sum_{t: z_t = z} \eta_t \nabla_\theta L(z', \theta_t) \cdot \nabla_\theta L(z, \theta_t)$$

**Practical TracInCP (Checkpoint-based):**

$$\text{TracInCP}(z, z') = \sum_{i=1}^{k} \eta_{c_i} \nabla_\theta L(z', \theta_{c_i}) \cdot \nabla_\theta L(z, \theta_{c_i})$$

### Why Simple Gradient Dot Products Work

Via first-order Taylor approximation of loss change under SGD, the loss change at each step naturally decomposes into the dot product of the test gradient and training gradient.

### Relationship to Influence Functions

In the limit of $\eta \to 0$ with infinite steps, for convex losses, TracIn becomes equivalent to Influence Functions. TracIn can be viewed as replacing the Hessian with the identity matrix (first-order approximation).

### Strengths and Limitations

**Strengths:** Simple (no Hessian needed), general (any SGD-trained model), captures training dynamics, scalable with layer selection.

**Limitations:** Requires saved checkpoints, ignores curvature, ignores mini-batch interactions.

---

## 3. Representer Points (Yeh et al., 2018)

**Paper:** Representer Point Selection for Explaining Deep Neural Networks
**Authors:** Chih-Kuan Yeh, Joon Sik Kim, Ian En-Hsu Yen, Pradeep Ravikumar (CMU)
**Venue:** NeurIPS 2018
**arXiv:** [1811.09720](https://arxiv.org/abs/1811.09720)

### Core Idea

Inspired by the Representer Theorem from kernel methods, this approach decomposes a neural network's pre-softmax prediction as a **linear combination** of training data activations.

### Mathematical Formulation

For an L2-regularized neural network, the optimal last-layer weights satisfy:

$$W^* = -\frac{1}{n\lambda}\sum_{i=1}^n \alpha_i f_\theta(x_i)^\top$$

where the **representer values** $\alpha_i = -\frac{1}{2n\lambda}\frac{\partial L}{\partial \Phi_i}$.

The test prediction decomposes as:

$$\Phi(x_{\text{test}}) = \sum_{i=1}^n \alpha_i \cdot k(x_i, x_{\text{test}})$$

where $k(x_i, x_{\text{test}}) = f_\theta(x_i)^\top f_\theta(x_{\text{test}})$ is the inner product kernel in the last hidden layer.

### Interpretation

- **$\alpha_i > 0$:** Excitatory training points (typically same-class, well-learned examples)
- **$\alpha_i < 0$:** Inhibitory training points (counterexamples or mislabeled data)

### Strengths and Limitations

**Strengths:** Real-time computation (no Hessian inversion), intuitive excitatory/inhibitory interpretation, most efficient among all methods.

**Limitations:** Only applies to the last layer, requires L2 regularization, assumes exact optimum, primarily designed for classification.

---

## 4. Scaling Up: Influence Functions for LLMs (Grosse et al., 2023)

**Paper:** Studying Large Language Model Generalization with Influence Functions
**Authors:** Roger Grosse, Juhan Bae, Cem Anil, Nelson Elhage, Alex Tamkin, et al. (Anthropic)
**arXiv:** [2308.03296](https://arxiv.org/abs/2308.03296)

### The Challenge

The core bottleneck of Influence Functions is the **Inverse-Hessian-Vector Product (IHVP)**. For a 52B parameter model, the Hessian is impossibly large to store or invert.

### EK-FAC Solution

**KFAC** approximates the Fisher information matrix per-layer as a Kronecker product: $F_l \approx A_l \otimes G_l$

**EK-FAC** adds eigenvalue correction to improve accuracy while maintaining computational efficiency, enabling IHVP computation in **$O(p)$ time**.

### Key Findings

Applied to 52B parameter LLMs:

1. **Sparse influence patterns** — few training examples dominate
2. **Increasing abstraction with scale** — larger models rely on semantic rather than surface similarity
3. **Cross-lingual generalization** — training data in one language influences predictions in another
4. **Strong positional sensitivity** — flipping key phrase order collapses influence to near-zero

---

## 5. Method Comparison

| Aspect | Influence Functions | TracIn | Representer Points | EK-FAC IF |
|:---|:---|:---|:---|:---|
| **Core Principle** | Infinitesimal LOO | Training trajectory | Representer Theorem | Kronecker Hessian approx |
| **Hessian** | Yes (IHVP) | No (identity approx) | No (last layer only) | Yes (Kronecker approx) |
| **Compute Cost** | High | Medium | Low | Medium-High (after preprocessing) |
| **Convexity Required** | Yes (theory) | No | Yes (L2 regularization) | No (empirical) |
| **Scale** | Millions of params | Billions possible | Hundreds of millions | 52B verified |
| **Training Trajectory** | No | Yes | No | No |
| **Year / Venue** | 2017 / ICML Best Paper | 2020 / NeurIPS Spotlight | 2018 / NeurIPS | 2023 / arXiv |

---

## References

1. Koh, P.W. & Liang, P. (2017). Understanding Black-box Predictions via Influence Functions. *ICML 2017*. [arXiv:1703.04730](https://arxiv.org/abs/1703.04730)

2. Pruthi, G., Liu, F., Kale, S., & Sundararajan, M. (2020). Estimating Training Data Influence by Tracing Gradient Descent. *NeurIPS 2020*. [arXiv:2002.08484](https://arxiv.org/abs/2002.08484)

3. Yeh, C.K., Kim, J.S., Yen, I.E.H., & Ravikumar, P. (2018). Representer Point Selection for Explaining Deep Neural Networks. *NeurIPS 2018*. [arXiv:1811.09720](https://arxiv.org/abs/1811.09720)

4. Grosse, R., Bae, J., Anil, C., Elhage, N., Tamkin, A., et al. (2023). Studying Large Language Model Generalization with Influence Functions. *Anthropic Research*. [arXiv:2308.03296](https://arxiv.org/abs/2308.03296)

5. Zhang, C., Ippolito, D., Lee, K., Jagielski, M., Tramèr, F., & Carlini, N. (2023). Counterfactual Memorization in Neural Language Models. *NeurIPS 2023*. [arXiv:2112.12938](https://arxiv.org/abs/2112.12938)
