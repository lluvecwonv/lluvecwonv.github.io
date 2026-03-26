---
title: "Quantifying Memorization Across Neural Language Models"
date: 2026-03-26
summary: "The first comprehensive quantitative analysis of memorization in LLMs. Identifies three log-linear relationships across GPT-Neo, T5, and OPT model families: memorization scales with (1) model capacity, (2) data duplication count, and (3) prompt context length. Demonstrates that GPT-J 6B memorizes at least 1% of The Pile extractably. Analyzes deduplication effectiveness and the discoverability phenomenon."
tags: [LLM, Memorization, Privacy, Scaling Laws, Data Duplication, GPT-Neo, T5, OPT, Research Notes]
category: 연구노트
language: en
---

# Quantifying Memorization Across Neural Language Models

**Venue:** ICLR 2023
**Authors:** Nicholas Carlini, Daphne Ippolito, Matthew Jagielski, Katherine Lee, Florian Tramèr, Chiyuan Zhang (Google Research, University of Pennsylvania, Cornell University)
**Paper Link:** [OpenReview](https://openreview.net/forum?id=TatRHT_1cK)

---

## TL;DR

This paper quantitatively analyzes how much LLMs memorize their training data across three axes — model size, data duplication, and context length — finding **log-linear relationships** in each, and demonstrating that GPT-J 6B extractably memorizes at least **1%** of The Pile.

---

## 1. Introduction

Large language models (LMs) have been shown to memorize parts of their training data, emitting memorized training data verbatim when prompted appropriately. This is undesirable because memorization violates privacy (exposing user data), degrades utility (repeated easy-to-memorize text is often low quality), and hurts fairness (some texts are memorized over others).

However, prior work mostly demonstrated the **existence** of extractable data qualitatively, without precisely quantifying how much data models memorize. For example, Carlini et al. (2020) manually identified just 600 memorized examples from GPT-2's 40GB training dataset — establishing a loose lower bound that only 0.00000015% of the data is memorized.

This paper comprehensively quantifies memorization across three families of neural language models (GPT-Neo, T5, OPT) and their associated datasets, identifying three log-linear relationships:

1. **Model Scale**: Larger models memorize 2–5× more than smaller models. A ten-fold increase in model size corresponds to a 19 percentage point increase in memorization.
2. **Data Duplication**: Examples repeated more often are more likely to be extractable, following a log-linear trend.
3. **Context Length**: It is orders of magnitude easier to extract sequences when given a longer context.

Key finding: The 6 billion parameter GPT-J model **memorizes at least 1% of its training dataset** (The Pile) — orders of magnitude more than previously estimated.

---

## 2. Methodology

### 2.1 Definition of Extractable Memorization

The paper adopts the following definition:

> **Definition (Extractable with k tokens of context):** A string s is extractable with k tokens of context from a model f if there exists a length-k string p such that the concatenation [p || s] is contained in the training data for f, and f produces s when prompted with p using greedy decoding.

For example, if the training data contains "My phone number is 555-6789" and the model produces "555-6789" when prompted with "My phone number is", this sequence is extractable with 4 words of context.

**Why this definition over alternatives?**

- **Counterfactual memorization** (Feldman, 2020; Zhang et al., 2021): Requires training hundreds/thousands of models — impractical for large LMs
- **Exposure** (Carlini et al., 2019): Requires thousands of generations per sequence; designed only for carefully crafted training examples
- **k-eidetic memorization** (Carlini et al., 2020): Useful for unprompted memorization but less useful for tightly bounding memorization by prompting with training data

### 2.2 Evaluation Data Selection Strategy

Testing the entire training dataset is computationally prohibitive (~30 GPU-years for GPT-J 6B). Two subset strategies are employed:

**1) Uniform Random Sampling**
- 50,000 sequences sampled without repetition from the training dataset
- Useful for estimating absolute memorization levels

**2) Duplicate-Normalized Sampling**
- The frequency of training data duplication decays extremely quickly (heavy-tailed distribution), so uniform sampling is unlikely to capture signals from highly duplicated data
- For each sequence length ℓ ∈ {50, 100, 150, ..., 500}, sample 1,000 sequences that are repeated between 2^{n/4} and 2^{(n+1)/4} times
- Approximately 500,000 total sequences collected
- Suffix arrays (Lee et al., 2021) used for efficient duplicate counting in the 800GB dataset

**Evaluation procedure:** Split each sequence into prefix (length ℓ-50) and suffix (50 tokens) → prompt the model with the prefix → report as "extractable" if the generated 50 tokens exactly match the true suffix. 50 tokens corresponds to an average of 127 characters or 25 words, well over the length of a typical English sentence.

---

## 3. Main Experimental Results (GPT-Neo)

### 3.1 Bigger Models Memorize More

**Evaluation models:** GPT-Neo 125M, 1.3B, 2.7B, GPT-J 6B (all trained on The Pile)
**Baseline:** GPT-2 125M–1.5B (trained on WebText, a different dataset)

![Figure 1a: Model size vs memorization](/images/papers/quantifying-memorization/fig1a_model_size.png)
*Figure 1a: Fraction of extractable sequences as a function of model size. GPT-Neo (green) shows a near-perfect log-linear fit (R²=99.8%). GPT-2 (yellow) serves as a baseline measuring what fraction of data is sufficiently "easy" that any language model can correctly predict the suffix, even without training on The Pile.*

**Key results:**

- **Log-linear relationship**: 10× model size increase → 19 percentage point increase in memorization (R² = 99.8%)
- **True memorization, not just better generalization**: GPT-2 correctly completes approximately 6% of examples, compared to 40% for the similarly sized GPT-Neo 1.3B → the increase with model size is not merely due to improved accuracy
- Examples "memorized" by GPT-2 are largely uninteresting sequences (number sequences, token repetitions, common phrases)

### 3.2 Repeated Strings are Memorized More

![Figure 1b: Data duplication vs memorization](/images/papers/quantifying-memorization/fig1b_data_duplication.png)
*Figure 1b: Fraction of extractable sequences as a function of duplication count in the training data. Clear log-linear trend observed.*

**Key results:**

- Clear **log-linear trend** between duplication count and memorization
- Models rarely regurgitate strings repeated only a few times, but the probability increases severely for highly duplicated strings
- Corroborates the positive impact of training dataset **deduplication** (Lee et al., 2021), but memorization still occurs even with just a few duplicates — deduplication will not perfectly prevent leakage

### 3.3 Longer Context Discovers More Memorization

![Figure 1c: Context length vs memorization](/images/papers/quantifying-memorization/fig1c_context_length.png)
*Figure 1c: Fraction of extractable sequences as a function of prompt context length. Log-linear increase with more context tokens.*

**Key results:**

- GPT-J 6B: 33% extractable at 50 tokens of context → **65%** at 450 tokens of context
- **Discoverability phenomenon**: Some memorization only becomes apparent under certain conditions, such as when the model is prompted with a sufficiently long context — some strings are "hidden" in the model
- **Security perspective**: Memorization requiring long exact prompts is harder for attackers to exploit, and also reduces non-adversarial data regurgitation (e.g., GitHub Copilot rarely emits memorized code without long code excerpts)
- **Auditing perspective**: Correctly auditing LLMs likely requires prompting the model with training data, as there are no known techniques to identify the tail of memorized data without large context

---

## 4. Alternate Experimental Settings

### 4.1 Uniform Random Sampling Results

![Figure 2a: Uniform random sample — model size effect](/images/papers/quantifying-memorization/fig2a_random_model_size.png)
*Figure 2a: Results with uniformly sampled training data. Same qualitative trends hold.*

- GPT-J 6B extracts the last 50 tokens of length-1000 sequences with **7%** probability (GPT-Neo 125M: 4%, GPT-2 XL: 2%)
- Taken together, these results establish a lower bound that **at least 1% of The Pile** is extractable by GPT-J 6B but not by GPT-2 XL

### 4.2 Decoding Strategy Comparison

![Figure 2c: Beam search and full dataset search](/images/papers/quantifying-memorization/fig2c_beam_search.png)
*Figure 2c: (Left) Beam search (b=100) slightly increases extracted memorization. (Right) Checking whether generated text appears anywhere in the training set reveals considerably more memorization.*

- **Beam search (b=100)**: Average 2 percentage point increase over greedy; maximum 5.6% increase. Beam search and greedy produce identical outputs 45% of the time
- **Full dataset search**: Checking if generation [p || f(p)] exists anywhere in the training set finds more memorization — at 100 repetitions, ground truth matching yields 15.8% vs full dataset matching yields **32.6%**

---

## 5. Replication Study Across Model Families

### 5.1 T5 (Masked Language Model, C4 Dataset)

| Component | Details |
|-----------|---------|
| **Models** | T5 v1.1 (77M to 11B parameters) |
| **Training Data** | C4 (806GB, curated from Common Crawl) |
| **Training Objective** | Masked Language Modeling (random 15% token masking and recovery) |

![Figure 3a: T5 model size vs memorization](/images/papers/quantifying-memorization/fig3a_t5_size.png)
*Figure 3a: The model scaling trend replicates for T5 masked language models.*

![Figure 3b: T5 data duplication vs memorization](/images/papers/quantifying-memorization/fig3b_t5_dups.png)
*Figure 3b: Relationship between duplication count and memorization for T5. Shows much larger variance compared to GPT-Neo.*

**Key findings:**

- Model size scaling trend **replicates** for T5
- However, absolute memorization is an **order of magnitude lower** than comparably sized causal LMs: T5 3B memorizes 3.5% of sequences repeated 100 times, compared to GPT-Neo 2.7B at 53.6%
- The monotonic scaling relationship with data duplication **breaks down** — statistically significantly, sequences repeated 138–158 times are more likely to be memorized than those repeated 159–196 times (despite being repeated less often)
- Cause: The 138–158 repetition bucket consists mainly of whitespace tokens, which are trivially easy to predict

### 5.2 Models Trained on Deduplicated Data

![Figure 3c: Deduplicated data models](/images/papers/quantifying-memorization/fig3c_dedup.png)
*Figure 3c: Comparison of models trained on original C4, near-duplicate removed C4, and exact-duplicate removed C4.*

| Model | Description |
|-------|-------------|
| **C4 Original** | Trained without deduplication |
| **Near-dup Removed** | Near-duplicate documents removed before training |
| **Exact-dup Removed** | Exact 50-token string duplicates removed before training |

**Key findings:**

- Models trained on deduplicated data **memorize less**: Below 35 repetitions, exact-dedup model memorizes 1.2% vs original 3.6% (3× reduction, p < 10⁻¹⁵)
- **However, for sequences repeated 100+ times, deduplication loses its effectiveness!** Extractability at 408+ repetitions is statistically significantly higher than any lower bucket
- Cause: Any deduplication strategy is necessarily imperfect at the scale of hundreds of gigabytes — different valid definitions of duplicates mean deduplication is not exhaustive

### 5.3 OPT (Modified Pile Dataset)

| Component | Details |
|-----------|---------|
| **Models** | OPT 125M to 66B |
| **Training Data** | Modified 800GB dataset overlapping with The Pile (some sources added/removed, deduplicated) |

![Figure 4: OPT model size vs memorization](/images/papers/quantifying-memorization/fig4_opt_size.png)
*Figure 4: Memorization as a function of model size for OPT models.*

![Figure 4: OPT duplication vs memorization](/images/papers/quantifying-memorization/fig4_opt_dups.png)
*Figure 4: Memorization vs data duplication for OPT models.*

**Key findings:**

- Nearly identical scaling trends to GPT-Neo
- However, the **effect size is orders of magnitude smaller** — even the 66B model memorizes a smaller fraction of The Pile than the smallest 125M GPT-Neo model
- Two possible explanations: (a) careful data curation and training can mitigate memorization, or (b) even slight shifts in data distribution can significantly alter what content gets memorized

---

## 6. Conclusion

| Key Conclusion | Details |
|---------------|---------|
| **Log-linear Scaling** | Model size, data duplication, and context length all exhibit log-linear relationships with memorization |
| **Far More Memorization Than Expected** | GPT-J 6B extractably memorizes at least 1% of The Pile — orders of magnitude above prior estimates |
| **Risk for Future Larger Models** | Current SOTA models are 200×+ larger than analyzed models → even more memorization expected |
| **Discoverability** | Memorization exists but can be hard to discover → impacts both auditing and attacks |
| **Deduplication Limits** | Deduplication is effective but imperfect → diminishing returns for highly duplicated content |
| **Implications for Generalization** | Larger models may learn unintended dataset peculiarities (e.g., duplication artifacts) rather than the true underlying distribution |

---

## 7. Related Work

### 7.1 Training Data Extraction Attacks

Carlini et al. (2020) demonstrated extraction attacks recovering memorized URLs, phone numbers, and personal information from GPT-2, but this was largely qualitative (only 600 examples found). Ziegler et al. (2021) studied code extraction from GitHub Copilot. This paper goes beyond demonstrating the existence of extractable data to precisely **quantifying how much** models memorize.

### 7.2 Memorization Definitions

Various memorization definitions have been proposed: differential privacy (Dwork et al., 2006), counterfactual memorization (Feldman, 2020; Zhang et al., 2021), exposure (Carlini et al., 2019), and k-eidetic memorization (Carlini et al., 2020). This paper adopts the "extractable with k tokens of context" definition as the most practical and actionable when training data access is available.

### 7.3 Privacy Attacks on ML

Membership inference attacks (Shokri et al., 2017; Yeom et al., 2018), property inference (Ganju et al., 2018; Fredrikson et al., 2015), and other privacy attacks have been studied. This paper focuses on extraction attacks due to their particular relevance for language modeling, where extraction implies significant leakage and grows with data duplication.

### 7.4 Prior Scaling Hypotheses

Preliminary evidence from prior work informed this study: model size effects (Carlini et al., 2020's GPT-2 URL experiments), data duplication impact (Lee et al., 2021), and context length effects (Carlini et al., 2020; Ziegler et al., 2021). This paper validates and quantifies these hypotheses through large-scale experiments across multiple model families.
