---
title: "Paper Review: How Much Do Language Models Memorize?"
date: 2026-03-22
summary: "A paper from FAIR at Meta, Google DeepMind, Cornell University, and NVIDIA. The authors propose a new framework for quantitatively measuring how much language models memorize their training data. They formally separate memorization into unintended memorization and generalization using compression-based information theory. They measure that GPT-family transformers have an approximate capacity of 3.6 bits-per-parameter, and show that double descent begins exactly when data capacity exceeds model capacity. They also propose scaling laws for membership inference and validate on models up to 1.5B parameters."
tags: [LLM, Memorization, Capacity, Information Theory, Kolmogorov Complexity, Scaling Laws, Membership Inference, Privacy, Research Notes]
category: Research Notes
language: en
---

# How Much Do Language Models Memorize?

**Paper:** Morris et al.
**Authors:** John X. Morris, Chawin Sitawarin, Chuan Guo, Narine Kokhlikyan, G. Edward Suh, Alexander M. Rush, Kamalika Chaudhuri, Saeed Mahloujifar
**Affiliations:** FAIR at Meta, Google DeepMind, Cornell University, NVIDIA

## TL;DR

How much do language models memorize their training data? This paper proposes a definition of memorization based on Kolmogorov information theory that formally separates **unintended memorization** (information about specific datasets) from **generalization** (knowledge about the underlying data-generating process). They precisely measure **model capacity** — the total amount of information a model can store. Key finding: GPT-family transformers store approximately **3.6 bits-per-parameter**, and when dataset size exceeds this capacity, grokking begins and unintended memorization decreases as the model starts to generalize.

---

## 1. Introduction: Redefining the Memorization Problem

Modern language models are trained on increasingly large amounts of data. For example, LLaMA 3 has 8 billion parameters (~32GB on disk) but is trained on 15 trillion tokens (~7TB on disk). A long line of work questions whether such pretrained language models memorize their training data in a meaningful way.

Existing research approaches this problem through two lenses:
- **Extraction**: Recovering full training datapoints from model weights
- **Membership inference**: Classifying whether a training point was present in the training data

The authors argue that extraction-based definitions are fundamentally flawed. Language models can be coerced to output almost any string (Geiping et al.), so the fact that a model outputs something is not necessarily a sign of memorization. For example, a language model prompted to add two numbers can output the answer without having seen the equation before.

This paper proposes a definition of memorization that quantifies the extent to which a model retains information about a specific datapoint using **compression rate in bits**. A model is considered to have memorized an input if the input can be compressed into a shorter encoding when the model is available. The framework separates memorization into two components:

- **Unintended memorization**: Information the model retains about a specific dataset
- **Generalization**: Knowledge the model acquires about the underlying data-generating process

---

## 2. Methodology: Information-Theoretic Definitions of Memorization

### 2.1 Statistical View (Shannon Information)

Given a learning algorithm L that maps dataset X to trained model Θ̂, the total information about X stored in Θ̂ is captured by mutual information:

```
mem(X, Θ̂) = I(X, Θ̂) = H(X) - H(X|Θ̂)
```

To separate generalization, the authors condition on a prior model Θ to define **unintended memorization**:

```
mem_U(X, Θ̂, Θ) = I([X|Θ], Θ̂) = H(X|Θ) - H(X|(Θ, Θ̂))
```

And **generalization** (intended memorization):

```
mem_I(X, Θ̂, Θ) = mem(X, Θ̂) - mem_U(X, Θ̂, Θ)
```

**Proposition (Super-additivity of Unintended Memorization)**: For i.i.d. dataset X = (X₁, ..., Xₙ):

```
Σᵢ mem_U(Xᵢ, Θ̂, Θ) ≤ mem_U(X, Θ̂, Θ) ≤ H(Θ̂)
```

This shows that summing per-sample unintended memorization gives a lower bound on dataset-level memorization.

### 2.2 Kolmogorov Complexity-Based Measurement

The statistical definition only applies to random variables. Since we observe only a single trained model and a single dataset, the authors switch to **Kolmogorov complexity**:

**Kolmogorov memorization**:

```
mem^K(θ̂, x) = I^K(θ̂, x) = H^K(x) - H^K(x|θ̂)
```

Unintended and intended variants:

```
mem^K_U(x, θ, θ̂) = H^K(x|θ) - H^K(x|(θ, θ̂))
mem^K_I(x, θ, θ̂) = mem^K(x, θ̂) - mem^K_U(x, θ, θ̂)
```

**Proposition (Kolmogorov ≈ Shannon)**: Over i.i.d. dataset distributions, the expected value of Kolmogorov memorization approximates Shannon memorization within a constant ε.

### 2.3 Practical Estimation

Since Kolmogorov complexity is uncomputable, the authors approximate it using **arithmetic coding**:

- **H^K(x|θ̂)**: Estimated by negative log-likelihood under the trained model, i.e. -log(p(x|θ̂))
- **H^K(x|θ̂, θ)**: Uses the better compression from both models, i.e. -log(max{p(x|θ̂), p(x|θ)})

Reference model θ choices:
- Synthetic data: exact underlying data distribution
- Real text: larger model of same family, trained on a much larger superset of training data

---

## 3. Measuring Model Capacity (Synthetic Data)

### 3.1 Capacity Definition

```
Capacity(L) = max_X mem(X, L(X))
```

When model capacity is reached, mem(X, L(X)) no longer increases with dataset size.

### 3.2 Experimental Setup

| Setting | Details |
|---------|---------|
| **Architecture** | GPT-2 (trained from scratch) |
| **Model sizes** | 1–8 layers, hidden dim 32–512, 100K–20M parameters |
| **Training steps** | 10⁶ steps |
| **Batch size** | 2048 |
| **Optimizer** | Adam |
| **Precision** | bfloat16 (single A100 GPU) |
| **Vocabulary size** | V = 2048 |
| **Sequence length** | S = 64 |
| **Random seeds** | 5 per configuration |

Synthetic datasets: each token is uniformly sampled from a predefined set of tokens, independently.

### 3.3 Key Results

![Figure 1: Unintended memorization of uniform random data. Memorization plateaus at the empirical capacity limit of different-sized GPT-family models, approximately 3.6 bits-per-parameter.](/images/papers/lm-memorization-capacity/fig1_synth_capacity.png)

**Per-model memorization ceiling**: Regardless of dataset size, each model exhibits a clear upper bound in net memorization. Small datasets are completely memorized by all models with enough capacity.

![Figure 2: Capacity in bits-per-parameter for models trained on synthetic data. Estimated α = 3.64 bits-per-parameter for GPT models trained in half precision.](/images/papers/lm-memorization-capacity/fig1_synth_bpp.png)

**Bits-per-parameter**: A very smooth relationship between observed capacity (maximum memorization measured over all datasets) and model parameters. GPT models consistently memorize between **3.5 and 3.6 bits per parameter** in half precision.

![Figure 3: Bits memorized across training. 6.86M parameter GPT transformer with 23.9MB capacity.](/images/papers/lm-memorization-capacity/fig1_synth_convergence.png)

**Convergence analysis**: All datasets from 16,000 to 4M samples converge within a range of 3.56–3.65 × 10⁶ bits memorized, indicating robust measurements within an order of magnitude.

### 3.4 Effect of Precision on Capacity

| Precision | Mean α (bits-per-parameter) |
|-----------|---------------------------|
| **bfloat16** | 3.51 ± 0.1 |
| **float32** | 3.83 ± 0.1 |

Doubling precision from bfloat16 to float32 yields only a small increase in capacity — far less than the actual 2× increase in model bits. This indicates that **most of the extra model bits added when increasing precision are not used** for raw storage.

**Detailed capacity measurements across precisions:**

| Layers | Hidden dim | Params | Capacity (fp32, bits) | Capacity (bf16, bits) | α (fp32) | α (bf16) |
|--------|-----------|--------|----------------------|----------------------|----------|----------|
| 1 | 32 | 8.04×10⁴ | 3.39×10⁵ | 3.16×10⁵ | 4.23 | 3.93 |
| 1 | 128 | 4.69×10⁵ | 1.71×10⁶ | 1.69×10⁶ | 3.65 | 3.61 |
| 2 | 128 | 6.67×10⁵ | 2.66×10⁶ | 2.60×10⁶ | 3.99 | 3.89 |
| 4 | 256 | 3.70×10⁶ | 1.36×10⁷ | 1.30×10⁷ | 3.68 | 3.51 |
| 8 | 256 | 6.86×10⁶ | 2.71×10⁷ | 2.51×10⁷ | 3.96 | 3.65 |

---

## 4. Disentangling Unintended Memorization from Generalization on Text

### 4.1 Experimental Setup

| Setting | Details |
|---------|---------|
| **Dataset** | FineWeb (state-of-the-art deduplication) |
| **Sequence length** | 64 tokens |
| **Deduplication** | Additional perfect deduplication step (prevents 1–2% duplicates when truncating to 64 tokens) |
| **Reference model** | Same parameter count model (trained on full dataset) + oracle model (best compression rate) |
| **Additional measurements** | Membership inference performance, extraction rates across prefix lengths |

### 4.2 Key Results

![Figure 4: Unintended memorization of text across model and dataset sizes. All quantities calculated with respect to a large oracle model trained on the full data distribution.](/images/papers/lm-memorization-capacity/fig2_2_kolmogorov_oracle.png)

**Sample-level observations**: Unintended memorization increases with model parameters and decreases with training set size. When measured with respect to an oracle reference model, memorization steadily increases as the smaller model learns more than the oracle about the small training set, then decreases as the model starts to generalize and perform worse on average than the higher-capacity oracle.

### 4.3 Double Descent and Model Capacity

![Figure 5: In synthetic bitstring experiments, double descent occurs exactly when dataset size begins to exceed model capacity.](/images/papers/lm-memorization-capacity/fig1_synth_double_descent.png)

![Figure 6: Train and test losses of different model and dataset sizes trained on text. Double descent occurs when dataset size exceeds model capacity.](/images/papers/lm-memorization-capacity/fig2_0_text_train_val.png)

**Key finding**: **Double descent begins exactly when the data capacity exceeds the model capacity.** One theory is that once the model can no longer memorize datapoints individually, it is forced to share information between datapoints to save capacity, which leads to generalization.

### 4.4 Extraction Rates and Generalization

![Figure 7: Extraction rates of 64-token training sequences across prefix lengths, for both train and evaluation.](/images/papers/lm-memorization-capacity/fig2_5_extraction_rates_eval_train.png)

For 32-token prefixes, 100% are extractable for very small training sets. When the dataset grows sufficiently large, the extraction rate does not go fully to zero but converges to **nearly exactly the test extraction rate**. This means that in sufficiently large, deduplicated datasets, **all successful training data extraction is attributable to generalization**.

### 4.5 Which Datapoints Are Most Memorized?

![Figure 8: Unintended memorization vs. TF-IDF for all training points of a 20M param model trained past its capacity on 2¹⁶ sequences of English text. Training documents with rarest words are typically the most memorized.](/images/papers/lm-memorization-capacity/fig3_kolmogorov_tfidf.png)

There is a **strong correlation between TF-IDF score and memorization** for samples with positive unintended memorization. The sample with the highest TF-IDF (a sequence of Japanese words) has the third-highest measured memorization — even though it is just one of 260,000 training samples, the model can regurgitate the entire sequence given just a single token.

![Table 3: Highest TF-IDF training examples from a 20M param model. All contain text from non-English languages (Japanese, Chinese, Hebrew, Greek).](/images/papers/lm-memorization-capacity/table03_text_memorization_examples.png)

Out of the top 20 most memorized sequences, all but three contain token sequences from other languages (Japanese, Chinese, Hebrew).

### 4.6 Distribution Comparison: Synthetic vs. Text Data

![Figure 9: Distribution of compression rates for equal-sized transformers trained on random bitstrings (left) and text (right).](/images/papers/lm-memorization-capacity/fig3_dist_synth.png)

![Figure 9 (right): Text data train/test compression rate distributions.](/images/papers/lm-memorization-capacity/fig3_dist_text.png)

Random training data follows a normal distribution with small overlap between train and test compression rates. Text loss is lower on average but more spread out, with much more overlap between train and test loss distributions — explaining why membership inference is more difficult for text data.

---

## 5. Memorization and Membership Inference

### 5.1 Membership Inference Experiments

All membership inference results use standard loss-based membership inference (Yeom et al., Sablayrolles et al.). The method sets a cutoff loss value to predict membership.

![Figure 10: Membership inference F1 across dataset sizes. F1 score of 0.5 implies random guessing.](/images/papers/lm-memorization-capacity/fig2_6_membership_f1.png)

For a fixed model size, **membership inference gets more difficult as the size of the data increases**. When the dataset size is too large compared to the model, membership inference of an average training sample may not be possible.

![Figure 11: Membership inference vs. 32-token-prefix suffix extraction rate. Membership inference is generally easier than extraction.](/images/papers/lm-memorization-capacity/fig2_7_membership_vs_extraction.png)

Membership inference is strictly higher than extraction in every case. In some cases, membership inference achieves a score of 0.97 with an extraction rate of 0.

### 5.2 Scaling Laws for Membership Inference

For a fixed model capacity, membership inference follows a roughly sigmoidal form with respect to dataset size:

```
Membership_F1(θ, D) = (1/2)(1 + c₁ · σ(c₂ · (Capacity(θ)/|D| + c₃)))
```

where σ(x) = 1/(1 + e^(-x)).

**Limiting behavior**: As |D| → ∞, membership inference performance decreases to 0.5 (essentially random). For a model trained on an infinite dataset, both membership inference and extraction are predicted to be impossible.

Optimal constants found via non-linear least squares: **c₁ = 1.34, c₂ = -0.034, c₃ = -33.14**.

![Figure 12: Scaling law curves for membership inference overlaid with empirical data.](/images/papers/lm-memorization-capacity/fig4_membership_inference.png)

### 5.3 Validation on Larger Models

Models trained with target membership F1 scores of 0.55, 0.75, and 0.95 for GPT-2 small (125M) and GPT-2 XL (1.5B):

| Model | d_emb | n_layer | Params | Dataset size | Predicted F1 | Observed F1 |
|-------|-------|---------|--------|-------------|-------------|-------------|
| GPT2-XL | 1600 | 48 | 1,556M | 170,654,583 | 0.55 | 54.61 ± 1.3 |
| GPT2-XL | 1600 | 48 | 1,556M | 76,795,021 | 0.75 | 71.08 ± 0.4 |
| GPT2-XL | 1600 | 48 | 1,556M | 18,851,574 | 0.95 | 95.85 ± 0.8 |
| GPT2-Medium | 768 | 12 | 124M | 13,566,442 | 0.55 | 53.44 ± 1.1 |
| GPT2-Medium | 768 | 12 | 124M | 6,104,935 | 0.75 | 65.69 ± 0.6 |
| GPT2-Medium | 768 | 12 | 124M | 1,498,634 | 0.95 | 97.98 ± 0.3 |

Predictions are generally within **1.5 points** of the true F1 score. The score is most inaccurate for estimated F1 of 0.75, the steepest point of the sigmoid.

**Implications for modern LLMs**: All contemporary language models trained with a tokens-per-parameter ratio of 10² or higher would have a membership inference score of 0.5 — **statistically significant loss-based membership inference is not possible**.

![Figure 13: Sigmoidal scaling law for membership inference fit to experimental data.](/images/papers/lm-memorization-capacity/fig4_pred_sigmoid.png)

---

## 6. Reliability of Capacity Estimates

The authors verify generality by varying sequence length (S) and vocabulary size (V).

**Capacity estimates across sequence length:**

| S | Params | Memorized | Expected | Error (%) |
|---|--------|-----------|----------|-----------|
| 4 | 6.59×10⁵ | 1.73×10⁵ | 1.80×10⁵ | 4.19 |
| 8 | 6.60×10⁵ | 3.54×10⁵ | 3.60×10⁵ | 1.80 |
| 16 | 6.61×10⁵ | 7.15×10⁵ | 7.21×10⁵ | 0.84 |
| 32 | 6.63×10⁵ | 1.44×10⁶ | 1.44×10⁶ | 0.41 |
| 64 | 6.67×10⁵ | 2.29×10⁶ | 2.36×10⁶ | 2.97 |
| 128 | 6.75×10⁵ | 2.36×10⁶ | 2.39×10⁶ | 1.24 |
| 256 | 6.92×10⁵ | 2.44×10⁶ | 2.45×10⁶ | 0.44 |

Average error rate: **1.7%**.

**Capacity estimates across vocabulary size:**

| V | Params | Memorized | Expected | Error (%) |
|---|--------|-----------|----------|-----------|
| 128 | 4.21×10⁵ | 1.49×10⁶ | 1.49×10⁶ | 0.36 |
| 512 | 4.71×10⁵ | 1.71×10⁶ | 1.67×10⁶ | 2.78 |
| 1024 | 5.36×10⁵ | 1.95×10⁶ | 1.90×10⁶ | 2.70 |
| 2048 | 6.67×10⁵ | 2.39×10⁶ | 2.36×10⁶ | 1.11 |
| 4096 | 9.29×10⁵ | 3.13×10⁶ | 3.15×10⁶ | 0.47 |

Average error rate: **1.8%**.

![Figure 14: Model memorization across sequence lengths. Prediction error rate averages 1.7%.](/images/papers/lm-memorization-capacity/fig1_synth_est_seqlen.png)

![Figure 15: Model memorization across vocabulary sizes. Prediction error rate averages 1.8%.](/images/papers/lm-memorization-capacity/fig1_synth_est_vocab.png)

---

## 7. Limitations

- Results are specific to the proposed environment (GPT architecture, specific datasets) and may not necessarily generalize to other datasets, architectures, or training setups
- Models are learned via gradient descent and are not guaranteed to find global optima; thus, only a lower bound on model capacity is ever measured
- Kolmogorov complexity is approximated using arithmetic coding; more sophisticated compression algorithms could provide more accurate estimates

---

## 8. Conclusion

This paper proposes a new definition of memorization that enables measuring the exact number of bits a model knows about a dataset. Using this definition, the authors measure the capacity of modern transformer language models at approximately **3.6 bits-per-parameter** and analyze how extraction and F1 scores scale with model and dataset size. They propose **scaling laws for membership inference** and validate them on larger models. The results provide evidence for why membership inference attacks fail on models trained on extremely large datasets and offer an intuitive explanation for the double descent phenomenon.
