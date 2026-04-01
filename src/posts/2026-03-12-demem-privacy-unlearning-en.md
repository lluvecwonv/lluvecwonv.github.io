---
title: "Preserving Privacy Through DeMemorization: An Unlearning Technique For Mitigating Memorization Risks In Language Models - Paper Analysis"
date: 2026-03-12
summary: "EMNLP 2023 paper. DeMem framework using PPO-based reinforcement learning to mitigate memorization in LLMs. Uses negative BERTScore as a reward signal to learn a paraphrasing policy, achieving ~94% N-SacreBLEU with only ~0.5% performance loss compared to Knowledge Unlearning. Comprehensive experiments on 6 models across 9 benchmarks."
tags: [LLM, Memorization, Privacy, Unlearning, Reinforcement Learning, PPO, EMNLP, Research Notes]
category: 연구노트
language: en
---

# Preserving Privacy Through DeMemorization (DeMem)

**Paper:** EMNLP 2023 | **Authors:** Aly M. Kassem (U Windsor), Omar Mahmoud (Deakin U), Sherif Saad (U Windsor)
**Link:** [ACL Anthology](https://aclanthology.org/2023.emnlp-main.265/)

## One-Line Summary

This paper proposes DeMem, a framework using PPO-based reinforcement learning with **negative BERTScore** as a reward signal to teach LLMs a **paraphrasing policy**. It effectively mitigates training data memorization while maintaining general model performance with only ~0.5% accuracy loss, achieving ~94% N-SacreBLEU.

---

## 1. Paper Overview and Motivation

### Problem: Memorization in LLMs

Large language models can memorize and reproduce portions of their training data. For example, GPT-J (6B) remembers at least 1% of its training data, and adversarial prompts can extract personally identifiable information, code, and copyrighted content.

### Limitations of Existing Methods

| Method | Limitation |
|--------|-----------|
| **Data Sanitization** | Sensitive information varies by context, making identification difficult |
| **Differential Privacy (DP)** | Significant performance degradation and high computational cost |
| **Data Deduplication** | Deduplication alone provides only partial protection |
| **Knowledge Unlearning (UL)** | Limited samples per operation (~32), severe performance degradation |

### DeMem's Core Idea

While existing methods either **remove** or **block** data, DeMem learns a **paraphrasing policy**:

> "Alice Green lives at 187 Bob Street" → "Alice Green lives at 12 Red Street"

Rather than completely deleting the prefix-suffix relationship, DeMem fine-tunes the model to generate suffixes that are semantically similar but **different** from the original.

![DeMem Pipeline](/images/papers/demem/figure_1_pipeline.png)
*Figure 1: Two-stage pipeline of the DeMem framework.*

Figure 1 shows the complete DeMem pipeline. The **upper section** represents typical LLM pretraining on large deduplicated corpora. The **lower section** is the core RL fine-tuning phase. A subset of the training corpus is fed to the DeMem-Policy-LLM, generating outputs that pass through the Reward Function to compute a **Negative Similarity** score. This score feeds back to the policy model, creating a feedback loop that updates the model to generate outputs different from the original.

---

## 2. Methodology

### 2.1 DeMemorization via Dissimilarity Policy

DeMem's core mechanism consists of three steps:

**Step 1:** Sample prefix P and true suffix S_T from training data

P, S_T ~ D_t

**Step 2:** Generate suffix S_G by inputting prefix to pretrained LM

S_G = f_θ(s_Gi+1 | x_P1, ..., x_Pi)

**Step 3:** Compute **negative BERTScore** between generated and true suffix

DisScore = -BERTScore(S_G, S_T)

### 2.2 Reward Function Design

#### Dissimilarity Learning: BERTScore

BERTScore was chosen because:
- Operates on **pairwise contextual embeddings** rather than token-level matching
- Assigns high similarity to different words sharing the same entity, inducing flexible paraphrasing
- Uses F-score metric

#### Stability via KL Divergence Penalty

To prevent excessive divergence from the original model, a KL divergence penalty is added:

KL(θ || θ_c) = sum over i in [1,t] π_θ(a_i|s_i) * log(π_θ(a_i|s_i) / π_θ_c(a_i|s_i))

- θ: pretrained original policy
- θ_c: updated policy
- **β = 0.2** (KL penalty weight)

### 2.3 Policy Optimization: PPO + NLPO

| Hyperparameter | Value |
|----------------|-------|
| Algorithm | PPO (Proximal Policy Optimization) |
| Sampling | top-p = 0.95 (NLPO) |
| Batch Size | 32 |
| Learning Rate | 1.41 × 10^-5 |
| KL Beta | 0.2 |
| Clip Range | 0.2 |

**NLPO (Natural Language Policy Optimization):** Combines PPO with top-p sampling to effectively explore natural language's vast action space. A value network V is added alongside the language modeling head to estimate the value function.

### 2.4 Approximate Memorization Measurement

Measuring only **eidetic memorization** (exact matching) is insufficient. This paper adopts **approximate memorization** based on **SacreBLEU**:

- **N-SacreBLEU ↑**: 100 - SacreBLEU(S_G, S_T). Higher is better (more forgetting)
- Threshold: SacreBLEU ≥ 75% is classified as approximate memorization

---

## 3. Experimental Setup

### 3.1 Dataset

**Pile Subset** (google-research/lm-extraction-benchmark):
- 15,000 samples, 200 tokens each
- Training: 13,500 / Testing: 1,500
- Sources: code, news, logs, conversations, copyrighted text, links, etc. (16 categories)
- English text

### 3.2 Sequence Splitting

![Sequence Splitting](/images/papers/demem/figure_2_sequence_splitting.png)
*Figure 2: Three-part structure of 200-token sequences.*

Figure 2 shows how each training sample is split. The full 200-token sequence is divided into three sections:

| Section | Tokens | Purpose |
|---------|--------|---------|
| Pre-Prefix | 100 | Evaluation only (longer context attack assessment) |
| Prefix | 50 | Training + Evaluation (input) |
| Suffix | 50 | Training + Evaluation (target) |

The **Evaluation** bracket in the figure refers to the Pre-Prefix region, while **Train & Evaluation** refers to Prefix+Suffix. During training, only Prefix→Suffix is used. During evaluation, two settings are applied:

1. **Prefix only (50 tokens):** Baseline forgetting performance measurement
2. **Pre-Prefix + Prefix (150 tokens):** Simulates **discoverability attack** with longer context. This tests how memorization becomes easier to extract when more context is provided.

### 3.3 Models

| Model Family | Parameters | Training Data | Characteristics |
|--------------|------------|---------------|-----------------|
| **GPT-Neo** | 125M, 1.3B, 2.7B | Pile (825GB) | Original with duplicates |
| **OPT** | 125M, 1.3B, 2.7B | Deduplicated Pile + others | Deduplicated version (Deduplication baseline) |

### 3.4 Baselines

1. **Knowledge Unlearning (UL)** (Jang et al., 2022): Uses gradient ascent to reverse the training objective for forgetting specific samples. Can only process 32 samples at a time.
2. **Deduplication:** OPT models trained on deduplicated Pile serve as preprocessing baseline.

### 3.5 Evaluation Metrics

| Metric | Measurement Target | Direction |
|--------|-------------------|-----------|
| **N-SacreBLEU** | Forgetting level | ↑ Higher is better |
| **LM ACC** | Average accuracy on 8 classification benchmarks | ↑ Higher is better |
| **LM PPL** | Perplexity on Wikitext | ↓ Lower is better |
| **GEN PPL** | Perplexity of generated suffix | ↓ Lower is better |

**9 downstream benchmarks:** Hellaswag, Lambada, Winogrande, COPA, ARC-Easy, ARC-Challenge, PIQA, MathQA, PubmedQA

---

## 4. Experimental Results

### 4.1 Main Results: GPT-Neo (Table 1)

#### NEO 125M

| Method | N-SacreBLEU↑ | LM ACC↑ | LM PPL↓ |
|--------|-------------|---------|---------|
| Baseline | 58.44~58.82 | 43.36 | 32.28 |
| +UL | 99.19~99.63 | 36.34~38.62 | 31K~9.68M |
| **+DeMem** | **66.21~67.07** | **43.46** | **33.13** |

#### NEO 1.3B

| Method | N-SacreBLEU↑ | LM ACC↑ | LM PPL↓ |
|--------|-------------|---------|---------|
| Baseline | 30.76~34.70 | 48.93 | 16.16 |
| +UL | 98.33~99.57 | 41.34~48.61 | - |
| **+DeMem** | **51.34~52.58** | **49.40** | **16.70** |

#### NEO 2.7B

| Method | N-SacreBLEU↑ | LM ACC↑ | LM PPL↓ |
|--------|-------------|---------|---------|
| **+DeMem** | - | **52.48** | **14.15** |

> UL sometimes reaches infinite PPL (marked with ⋆), making it practically unusable. DeMem's GEN PPL remains stable across all NEO models in the 2-4 range.

### 4.2 Main Results: OPT — Deduplication + DeMem (Table 2)

#### OPT 125M (Deduplicated Pile)

| Method | N-SacreBLEU↑ | LM ACC↑ | LM PPL↓ |
|--------|-------------|---------|---------|
| Baseline | 89.24~91.03 | 41.28 | 31.94 |
| +UL | 99.21~99.35 | 36.48~37.19 | 449K~54.9M |
| **+DeMem** | **94.88~95.61** | **42.25** | **33.13** |

#### OPT 1.3B (Deduplicated Pile)

| Method | N-SacreBLEU↑ | LM ACC↑ | LM PPL↓ |
|--------|-------------|---------|---------|
| Baseline | 71.63~71.96 | 51.65 | 16.41 |
| +UL | 99.50~99.84 | 36.85~39.16 | ⋆(∞) |
| **+DeMem** | **91.56~92.51** | **51.40** | **17.39** |

#### OPT 2.7B (Deduplicated Pile)

| Method | N-SacreBLEU↑ | LM ACC↑ | LM PPL↓ |
|--------|-------------|---------|---------|
| Baseline | 66.32~71.80 | 53.74 | 14.31 |
| +UL | 97.77~99.54 | 39.80~49.70 | 41~324 |
| **+DeMem** | **93.08~94.53** | **52.20** | **15.25** |

### Key Observations

**DeMem vs UL Comparison:**

| Aspect | DeMem | UL |
|--------|-------|-----|
| N-SacreBLEU | ~94% (OPT), ~67% (NEO) | ~99% |
| Performance Loss (LM ACC) | **~0.5%** | **~11%** |
| Perplexity Stability | Nearly unchanged | Can reach ∞ |
| Sample Limit | **None (universal policy)** | 32 at a time (repeated) |
| Generated Text Quality | Fluent and coherent | Potentially meaningless |

### 4.3 Sample Quantity, Stability, and Universal Policy

![Performance Comparison](/images/papers/demem/figure_3_performance.png)
*Figure 3: Average LM performance on NEO (125M, 1.3B, 2.7B) models with different numbers of forgetting samples (32/128/256).*

Figure 3 visually demonstrates DeMem's strongest advantage: **stability**. The x-axis shows the number of samples forgotten at once (32, 128, 256), while the y-axis shows average performance on 8 benchmarks.

**Blue dashed line (DeMem):** Nearly horizontal across all three graphs. Performance remains consistent at ~43.3 for 125M, ~49.4 for 1.3B, and ~52.5 for 2.7B regardless of sample count. This is because DeMem learns a **universal policy** — a single fine-tuning handles all test samples.

**Red solid line (UL):** Sharp decline as sample count increases. For 1.3B, performance drops from 48.5 to 41.0, and for 2.7B from 49.5 to 39.4. UL repeats gradient ascent on the same samples, causing greater parameter degradation with more samples.

### 4.4 Deduplication + DeMem Combination

When DeMem is applied to OPT models (trained on deduplicated Pile):
- OPT models already have high baseline N-SacreBLEU (71~91%)
- DeMem further increases this to **~94%** with only **~0.5%** performance loss
- Deduplication alone is insufficient, but combined with DeMem it is highly effective

### 4.5 Discoverability Attack Defense (Table 3)

Defense against attacks using longer context (Pre-Prefix 100 + Prefix 50 = 150 tokens):

#### GPT-Neo — Longer Context

| Parameters | Before N-SacreBLEU↑ | After↑ | Change |
|------------|---------------------|--------|--------|
| 125M | 45.74 | 55.04 | +9.3 |
| 1.3B | 59.58 | 88.91 | +29.3 |
| 2.7B | 10.55 | 32.66 | +22.1 |

#### OPT — Longer Context

| Parameters | Before N-SacreBLEU↑ | After↑ | Change |
|------------|---------------------|--------|--------|
| 125M | 89.35 | 94.47 | +5.1 |
| 1.3B | 59.58 | 88.91 | +29.3 |
| 2.7B | 56.35 | 89.37 | +33.0 |

- 125M models: ~10% increase in forgetting rate
- **1.3B, 2.7B models: ~30% increase**
- Larger models show greater defense effectiveness against discoverability attacks
- PPL increase is minimal (NEO 125M: 4.12→4.15, OPT 2.7B: 5.95→6.76)

### 4.6 Approximate Memorization Threshold Analysis

![Threshold Analysis](/images/papers/demem/figure_4_threshold.png)
*Figure 4: SacreBLEU histograms for NEO 2.7B (Longer Context) before (left) and after (right) applying DeMem.*

Figure 4 shows the SacreBLEU distribution for the NEO 2.7B model under longer context (150 tokens). The x-axis is the SacreBLEU score, y-axis is sample count.

**Left (Before DeMem):** Distribution concentrates on the right (high SacreBLEU, high memorization). The **red area** represents the 75% threshold and above, where samples are classified as approximate memorization.

**Right (After DeMem):** Distribution shifts left and spreads more evenly. The red area (75%+) is significantly reduced.

Change in memorized samples using SacreBLEU >= 75% threshold:

| Model | Before | After | Reduction Rate |
|-------|--------|-------|-----------------|
| NEO 1.3B | 910 | 497 | **45.4%** |
| NEO 2.7B | 1,036 | 321 | **69.0%** |

For NEO 2.7B, memorized samples decreased from 1,036 to 321, a ~70% reduction. This shows DeMem not only lowers average SacreBLEU but actively shifts samples from the high-risk zone (75%+) to the safe zone.

### 4.7 Qualitative Results

![Qualitative Examples](/images/papers/demem/figure_5_qualitative.png)
*Figure 5: Qualitative comparison of generated suffixes before and after applying DeMem. Shows Prefix, True Suffix, Generated Suffix (Before/After), N-SacreBLEU, and PPL for 4 samples.*

Figure 5 intuitively shows how DeMem operates on real samples. Each row represents one sample, with **green highlights** showing parts matching the True Suffix (memorization) and **red highlights** showing differently generated parts.

**Case 1: Translation Metadata (containing email addresses)**
- Prefix: "POT-Creation-Date: 2017-02-24..."
- Before (Generated Suffix-Before): Nearly identical to True Suffix — reproduces "FULL NAME <EMAIL@ADDRESS>", "Language-Team: LANGUAGE" identically. N-SacreBLEU 12.97 (nearly perfect memorization)
- **After (Generated Suffix-After):** Changes Language-Team to "English (India)" and appends a Transifex URL, **maintaining structure but completely changing content**. N-SacreBLEU **62.38**

**Case 2: Open Source License (GPL)**
- Before: ".org is distributed in the hope...WITHOUT ANY WARRANTY" — nearly reproduces original license text verbatim
- **After:** Generates completely different content. N-SacreBLEU **99.95** (virtually complete forgetting)

**Case 3: Email Address Chain**
- Before: Reproduces masked email addresses identically (N-SacreBLEU: 69.87)
- **After:** Maintains email pattern but generates different specific addresses (N-SacreBLEU: **86.04**)

**Case 4: SSL Code License**
- Before: Reproduces original copyright notice content (N-SacreBLEU: 80.12)
- **After:** Paraphrases with different content, PPL increases from 1.56→6.64. N-SacreBLEU: **96.52**

Notably, all Before examples have very low PPL (1.68~3.80, expected for training data), while After ranges from 1.98~6.64, showing minimal degradation. However, Case 4 shows slight PPL increase, representing a trade-off in DeMem.

---

## 5. Model Size and Convergence Speed

| Model Size | DeMem Convergence Steps | UL Epochs |
|------------|------------------------|-----------|
| 125M | 4 steps | 18 epochs |
| 1.3B | 2 steps | 7~14 epochs |
| 2.7B | 2 steps | 7~11 epochs |

- **Larger models converge faster:** 2.7B converges in just 2 steps
- Larger models' dissimilarity scores are higher, leading to faster "forgetting"
- UL requires multiple epochs regardless of model size

---

## 6. Limitations and Future Research

### Limitations

- **Single scalar reward:** Optimizes two objectives (dissimilarity and perplexity) with one reward signal
- Difficult to fine-tune trade-offs between objectives

### Future Research Directions

- **Multi-objective RL:** Simultaneously optimize dissimilarity and perplexity as separate objectives
- Validation on larger models (6B+)
- Evaluation on multilingual data

---

## 7. Key Takeaways

1. **RL-based paraphrasing > data deletion:** Teaching the model to generate differently, rather than directly removing training data, is far superior in the performance-privacy trade-off.

2. **Scalability of universal policy:** While UL requires repeated 32-sample batches, DeMem learns a universal policy from a single training session that handles unlimited samples.

3. **Synergy with deduplication:** Pretraining deduplication combined with DeMem is most effective, and practical given that recent large models already employ deduplication.

4. **Importance of approximate memorization:** Measuring only exact matches (verbatim) provides false security. SacreBLEU-based approximate memorization measurement is more realistic.

5. **Discoverability defense:** Even with longer context attacks, larger models (1.3B+) achieve ~30% increase in forgetting rate, defending effectively.

---

## Open Questions

- Will larger models (7B, 13B, 70B+) show similar convergence speed and stability?
- Can multi-objective RL (dissimilarity + perplexity + fluency) further improve performance?
- Is DeMem effective for memorization arising in SFT/RLHF stages?
- Can DeMem be applied to memorization in other modalities (images, code)?
- How would alternative semantic similarity metrics (MoverScore, BARTScore, etc.) beyond BERTScore compare?
