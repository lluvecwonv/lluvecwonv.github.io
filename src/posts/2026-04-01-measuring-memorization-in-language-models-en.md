---
title: "Measuring Memorization in Language Models via Probabilistic Extraction Paper Review"
date: 2026-04-01
summary: "NAACL 2025 paper from Google DeepMind, Google, Microsoft Research, Stanford, and Northeastern. The authors point out the limitations of greedy-sampled discoverable extraction and propose (n,p)-discoverable extraction, which accounts for multiple queries under non-deterministic sampling. With no additional computational overhead, it can approximate extraction probability from a single query, revealing up to 5x higher extraction rates than greedy on Pythia 12B."
tags: [LLM, Memorization, Privacy, Extraction, Sampling, NAACL, Research Notes]
category: Research Notes
language: en
---

# Measuring Memorization in Language Models via Probabilistic Extraction

**Paper:** Hayes et al. (2025) | NAACL 2025
**Authors:** Jamie Hayes, Marika Swanberg, Harsh Chaudhari, Itay Yona, Ilia Shumailov, Milad Nasr, Christopher A. Choquette-Choo, Katherine Lee, A. Feder Cooper
**Affiliations:** Google DeepMind, Google, Northeastern University, Microsoft Research, Stanford University

---

## TL;DR

When measuring training-data extraction in LLMs, the conventional one-shot determination based on greedy sampling is unreliable. Replacing it with **probabilistic (n,p)-discoverable extraction** provides a more nuanced and reliable quantification of extraction risk—with zero additional computational overhead.

---

## 1. Introduction: Why Existing Extraction Measurement Falls Short

Large language models (LLMs) are susceptible to memorizing pieces of their training data, raising concerns about the potential extraction of sensitive information at generation time. The most common method for measuring this is **discoverable extraction**: split a training example into a prefix and suffix, prompt the LLM with the prefix, and deem the example extractable if the LLM generates the matching suffix.

However, discoverable extraction as commonly implemented has critical limitations:

1. **One-shot determination**: It yields a binary yes/no result from a single generation. In practice, users can (and do) query models multiple times with the same prompt.
2. **Reliance on greedy sampling**: Most prior work uses deterministic greedy sampling. But production deployments typically use non-deterministic schemes like top-k, top-p, or temperature sampling.
3. **Underestimation of extraction**: Greedy sampling selects the **locally most likely next token** at each step, but this may not correspond to the **globally most likely sequence**.

---

## 2. Background: Discoverable Extraction and Sampling Schemes

### 2.1 Standard Discoverable Extraction

For a training example $\mathbf{z} = (z_1, \ldots, z_j)$ split into an $a$-length prefix $\mathbf{z}_{1:a}$ and $k$-length suffix $\mathbf{z}_{a+1:a+k}$, $\mathbf{z}$ is discoverably extractable if the autoregressive generation matches the suffix:

$(g_\phi \circ f_\theta)^k(\mathbf{z}_{1:a}) = \mathbf{z}_{1:a+k}$

Typical configurations in prior work: prefix of 50 tokens, suffix of 50 tokens, greedy sampling.

### 2.2 Sampling Schemes

- **Greedy sampling**: Deterministically selects the highest-probability token at each step. When $k=1$ for top-k, this is equivalent to greedy.
- **Random sampling with temperature**: Controls distribution sharpness via temperature $T$; as $T \to 0$, it converges to greedy sampling.
- **Top-k sampling**: Retains only the $k$ highest-probability tokens, zeros out the rest, renormalizes, and samples.

Carlini et al. (2022) argued that stochastic sampling schemes are "antithetical" to maximizing discoverable extraction. This paper demonstrates that **under multiple queries, stochastic sampling can uncover substantially more extraction**.

---

## 3. Methodology: (n,p)-Discoverable Extraction

### 3.1 Core Definition

**Definition 2 — (n, p)-discoverable extraction:**
A training example $\mathbf{z}$ is $(n,p)$-discoverably extractable if, across $n$ independent queries, the probability of generating the target suffix at least once is at least $p$:

$$\Pr\left(\bigcup_{w \in [n]} (g_\phi \circ f_\theta)_w^k(\mathbf{z}_{1:a}) = \mathbf{z}_{1:a+k}\right) \geq p$$

Standard discoverable extraction is the special case where $n = p = 1$.

### 3.2 How Greedy Sampling Misses Extraction

![Figure 1 Left: An example where greedy sampling fails to extract the target. Blue indicates match with target, red indicates mismatch.](/images/papers/measuring-memorization/fig1a.png)

![Figure 1 Right: Probability rank of the target token at each decoding position. At index 87, the target token is rank 2; greedy always selects rank 1, causing subsequent divergence.](/images/papers/measuring-memorization/fig1b.png)

Figure 1 illustrates a concrete example from Pythia 12B. The target suffix has a higher overall likelihood than the greedy-sampled suffix, but at index 87, the target token is the second-highest probability token (rank 2). Greedy sampling cannot select it, causing the generated sequence to diverge entirely. In contrast, top-k sampling ($k=40$, $T=1$) can select this rank-2 token, yielding a **16.2% probability of extracting the target in a single query**—requiring only about 6 queries in expectation.

### 3.3 Relationship Between n and p: Single-Query Approximation

Given the single-query extraction probability $p_\mathbf{z}$, the probability of extracting the target at least once in $n$ attempts is:

$$1 - (1 - p_\mathbf{z})^n \geq p$$

Therefore:

$$n \geq \frac{\log(1-p)}{\log(1-p_\mathbf{z})}$$

The key insight is that $p_\mathbf{z}$ can be computed from **a single forward pass** through the model. By sequentially feeding the target sequence token by token and collecting the conditional log-probabilities (post-processed according to the sampling scheme), one obtains the overall sequence probability under both the model and sampling scheme.

![Empirical p vs. theoretical p comparison (Pythia 6.9B, Wikipedia subset, 250 examples). The single-query approximation matches the 1000-sample empirical estimate.](/images/papers/measuring-memorization/empirical_p.png)

**Additional benefit**: Since the single forward pass yields per-token conditional log-probabilities for the entire sequence, one can compute extraction rates for **arbitrary prefix and suffix lengths without any additional queries**.

### 3.4 Extension to Non-Verbatim Extraction

$(\epsilon, n, p)$-discoverable extraction extends the framework to approximate matches by defining a distance threshold $\text{dist}(\mathbf{b}, \mathbf{c}) \leq \epsilon$. While direct computation can be expensive due to the large number of candidate suffixes, the paper discusses efficient approximation strategies.

---

## 4. Experimental Setup

### 4.1 Models

| Model | Sizes | Training Data |
|-------|-------|---------------|
| **Pythia** | 1B, 2.8B, 6.9B, 12B | The Pile (open) |
| **GPT-Neo** | 1.3B | The Pile (open) |
| **Llama 1** | 7B, 13B | Common Crawl-based (closed) |
| **OPT** | 350M, 1.3B, 2.7B, 6.7B | Closed |

### 4.2 Datasets

- **Training data**: 10,000 examples each from the **Enron**, **Wikipedia**, and **GitHub** subsets of The Pile
- **Test data**: TREC 2007 Spam Classification dataset (not in training)
- **Proxy data**: 10,000 Common Crawl examples for Llama/OPT

### 4.3 Common Experimental Conditions

- Prefix length: **50 tokens**, Suffix length: **50 tokens**
- Primary sampling scheme: **top-k** ($k=40$, $T=1$)
- Baseline: greedy-sampled one-shot discoverable extraction rate
- $(n,p)$ computation: single-query approximation via Equation (2)

---

## 5. Experimental Results

### 5.1 Extraction Rates as a Function of n and p

![Pythia 2.8B (n,p)-discoverable extraction rates for varying p (0.1, 0.5, 0.9, 0.999) as a function of n. The greedy rate (1.3%) is shown as a horizontal line.](/images/papers/measuring-memorization/topk_2b.png)

![Pythia 12B: same experiment. The greedy rate (3.07%) is significantly exceeded by (n,p) rates.](/images/papers/measuring-memorization/topk_12b.png)

**Key observations:**

| Perspective | (n,p) vs. Greedy | Interpretation |
|-------------|-----------------|----------------|
| **High n, low p** (e.g., p=0.1) | (n,p) rate >> greedy rate | Greedy **underestimates** extraction |
| **Low n, high p** (e.g., p=0.999, n<169) | (n,p) rate < greedy rate | Greedy **overestimates** extraction |

This reveals that greedy rate as a single number fails to capture the full picture of extraction risk. The actual risk depends critically on the query budget (which can be controlled through rate limiting).

### 5.2 Worst-Case Extraction Rates

![Maximum extraction rate for Pythia 2.8B (Enron). An upper bound exists that all p values converge to.](/images/papers/measuring-memorization/max_extract.png)

| Model | Greedy Rate | Max (n,p) Rate | Multiplier |
|-------|------------|----------------|------------|
| Pythia 2.8B | 1.3% | **9.04%** | ~7× |
| Pythia 12B | 3.07% | **16.07%** | ~5× |

### 5.3 Cross-Model Comparison: Greedy and (n,p) Yield Opposite Conclusions

![Pythia 1B vs GPT-Neo 1.3B. Greedy rate: Pythia 1B > GPT-Neo 1.3B. But for all n and p: GPT-Neo 1.3B > Pythia 1B.](/images/papers/measuring-memorization/compare_pythia_gptneo.png)

This is a striking result: **relying solely on greedy rates for cross-model comparison can lead to incorrect conclusions.** While Pythia 1B has a higher greedy extraction rate, GPT-Neo 1.3B poses a higher extraction risk under probabilistic sampling at every n and p.

### 5.4 Effect of Model Size and Data Repetition

**Scaling with model size:**
- Extraction rates increase with model size across all n and p (e.g., Pythia 2.8B → 12B)
- The **gap** between greedy and (n,p) rates also increases with size (2.8B: 7.74%p gap, 12B: 13%p gap)
- Larger models need fewer queries to match the greedy rate (at p=0.9: Pythia 1B needs n=150, Pythia 12B needs only n=40)

**Scaling with data repetition:**

![Extraction rate vs. training data repetitions (Pythia 2.8B, phone numbers in Enron). The gap between greedy and (n,p) widens with more repetitions.](/images/papers/measuring-memorization/repetitions.png)

Analyzing phone numbers appearing multiple times in The Pile, the gap between (n,p) and greedy extraction rates grows with the number of repetitions.

### 5.5 Validation of (n,p)-Discoverable Extraction

![Training data (Enron) vs. test data (TREC 2007 Spam) extraction rates for Pythia 2.8B. Test data generation rates are orders of magnitude lower.](/images/papers/measuring-memorization/compare_train_test.png)

| Setting | Training Data Rate | Test Data Rate |
|---------|-------------------|----------------|
| p=0.1, large n | >5% | <1% |
| p=0.9, n=500,000 | 4.4% | 0.3% |

The rate of "extracting" unseen test data is orders of magnitude lower than training data extraction at all settings, confirming that (n,p)-discoverable extraction measurements genuinely reflect memorization rather than coincidental generation.

---

## 6. Conclusion and Implications

### Three Key Contributions

1. **Reliable quantification of extraction**: Greedy sampling captures only a fraction of true extraction risk. (n,p)-discoverable extraction provides a continuous risk measure parameterized by query budget n and probability threshold p.

2. **Zero computational overhead**: A single forward pass yields $p_\mathbf{z}$, from which arbitrary (n,p) combinations can be analyzed via Equation (2)—the same cost as standard discoverable extraction.

3. **Context-specific risk analysis**: While extracting generic phrases may be low-risk, even rare PII leakage can be problematic. The flexible (n,p) parameterization enables differentiated risk assessment based on data sensitivity.

### Limitations

- Only considers a relatively benign adversary with API access and limited side information
- Does not separately analyze extraction rates for different target types (e.g., PII vs. general text)
- PII extraction experiments are limited to phone number repetition analysis

---

## Personal Notes

This paper provides a clean and compelling critique of conventional memorization measurement. The core insight is simple yet powerful: the deterministic nature of greedy sampling can distort the true extraction risk, and a probabilistic perspective yields more accurate measurements at no extra cost. The result in Figure showing that Pythia 1B vs GPT-Neo 1.3B comparison flips between greedy and (n,p) measurement is particularly impactful—it challenges the common practice of reporting only greedy extraction rates in model release reports. This measure has strong potential to become a standard reporting metric for future model releases.
