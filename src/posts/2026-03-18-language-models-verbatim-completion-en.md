---
title: "Language Models May Verbatim Complete Text They Were Not Explicitly Trained On"
date: 2026-03-18
summary: "A paper by Ken Ziyu Liu et al. from Google and Stanford University, published at ICML 2025. This work demonstrates that LLMs can verbatim complete text sequences that are 'non-members' under n-gram based membership definitions. After removing extracted sequences from training data and retraining from scratch, ~40% are still completed (lingering sequences). Furthermore, adversarially constructed fine-tuning datasets (casing flips, token dropouts, chunking) with zero n-gram overlap can force verbatim completion of unseen target texts. This reveals fundamental limitations of n-gram membership definitions with implications for privacy, copyright, and AI safety."
tags: [LLM, Memorization, Data Membership, n-gram, Verbatim Completion, Privacy, Copyright, ICML 2025, Research Notes]
category: Research Notes
language: en
---

# Language Models May Verbatim Complete Text They Were Not Explicitly Trained On

**Paper:** Ken Ziyu Liu, Christopher A. Choquette-Choo, Matthew Jagielski, Peter Kairouz, Sanmi Koyejo, Percy Liang, Nicolas Papernot
**Affiliation:** Google, Stanford University
**Venue:** ICML 2025
**Keywords:** Data Membership, n-gram, Verbatim Completion, Lingering Sequences, Adversarial Fine-tuning

## One-Line Summary

This study demonstrates that LLMs can verbatim complete text sequences that are "non-members" under n-gram based membership definitions, revealing fundamental limitations of such definitions through both natural occurrences (lingering sequences in pre-training) and adversarial construction (fine-tuning with noisy transformations).

---

## 1. Introduction

**Training data membership** — whether a data point was used to train a given model — is central to privacy (is the LLM leaking information?), copyright (was the model trained on copyrighted text?), and AI safety (did the LLM successfully unlearn harmful text?).

With direct access to the training dataset, the most common approach to determine membership is comparing sequences by their **n-grams**. Two sequences match verbatim if all their n-grams are equal for all $n$, and approximately if most do for some $n$.

The key question this paper asks: **Can an LLM generate a target sequence even if it was never included as an n-gram in its training data?**

The answer is affirmative: n-gram membership establishes a threshold dependent on $n$, and this threshold can be **gamed**.

![Figure 1: Main setup and findings](/images/papers/verbatim-completion/main-illustration-v2.pdf)

### Main Takeaways

1. There is high overlap between training data membership and LLM completion test being positive. Text not in this overlap is explained by the lack of complexity or limitations in n-gram based definitions.
2. n-gram membership is limited in capturing the intuition of what constitutes a training dataset "member." A model can complete sequences that are not n-gram members of its training dataset.
3. The underlying cause is not in the choice of distance (n-gram overlap) but in the fact that the **membership definition fails to consider auxiliary information** that the training algorithm gets access to, e.g., through pre-processing or other design choices.

---

## 2. Background & Related Work

### 2.1 Definitions of Data Membership

Most definitions fall into versions of n-gram or substring overlap. GPT-4 considers 50-character substring overlap; LLaMA-3 considers 8-gram token overlap. Training data deduplication methods also build on n-gram overlap through suffix arrays for exact matches and MinHash for approximate matches.

### 2.2 Tests for Data Membership

**Membership Inference Attacks (MIA)** predict membership with only model access. However, membership can be inherently blurry for natural language, and existing MIA testbeds suffer from distribution shifts.

### 2.3 Data Completion

A model completing a long, high-entropy sequence from its prefix likely saw it during training. This paper uses such **completion tests** as a black-box membership test and studies non-member completions.

---

## 3. Preliminaries

### 3.1 n-gram Data Membership

> **Definition 1:** A sequence $x$ is a member of dataset $D$ if $x$ shares at least one n-gram with any $x^{(i)} \in D$.

This definition is stringent (overestimates members, underestimates non-members). Setting $n = |x|$ gives verbatim membership; smaller $n$ captures approximate membership definitions including MinHash and edit distance based methods.

### 3.2 Definitions of Data Completion

![Figure 2: Completion vs. Extraction](/images/papers/verbatim-completion/venn-complete.pdf)

- **Exact completion:** $M(prompt) = suffix$ using greedy decoding
- **r-similar completion:** normalized Levenshtein edit distance within $1-r$
- **Case-insensitive completion:** matching after lowercasing both sides

**Data Extraction = Data Completion + Data Membership.** This paper specifically studies **non-member completions**.

---

## 4. Experiment 1: Removing Members Does Not Always Prevent LLM Verbatim Completion

### 4.1 Experimental Setup

**Main Question:** Will an LLM still complete a text sequence even after removing all training sequences that have n-gram overlap with it?

**Procedure:**

1. **Pre-train a base model** $M_{base}$ from scratch on $D_{base}$
2. **Identify verbatim completions** $D_{mem}$: sequences of length $k$ that $M_{base}$ can complete verbatim
3. **n-gram filtering**: Remove from $D_{base}$ all windows sharing any n-gram with sequences in $D_{mem}$
4. **Re-train a counterfactual model** $M_{filter}$ from scratch on filtered data

**Models:** GPT-2 architecture, sizes {350M, 774M, 1.6B, 2.8B}. Trained using LLM.c.

**Data:** FineWeb-Edu, 33.6B tokens (Chinchilla optimal for 1.6B). Sequence length $k=50$ (prefix=suffix=25 tokens).

| Model size | 304M | 774M | 1.6B | 2.8B |
|------------|------|------|------|------|
| \|D_mem\| | 76,648 | 116,270 | 151,598 | 175,813 |

### 4.2 Results

![Figure 3: LLMs can verbatim complete texts with zero n-gram overlap to training data](/images/papers/verbatim-completion/pretrain_scale_vs_lingering.pdf)

**Finding #1 (Existence of Lingering Sequences):** Simply deleting sequences from pre-training data does not always prevent them from being generated. Under the weakest n-gram filter ($n=50$, verbatim matches only), the fraction of **lingering sequences** can be as high as **~40%**. This observation is consistent across model scales.

**Finding #2 (Nature of Lingering Sequences):** No lingering sequences correspond to creative generalization. All cases are explained by **exact duplicates, near-duplicates, and short overlaps** — they are either still contained in the dataset via a different membership definition (for some $m < n$) or lack sufficient entropy. Searching for neighboring texts (Levenshtein distance < 20) in the pre-training data, near-duplicates were found for all queried lingering sequences.

**Finding #3 (Persistence of Lingering Sequences):** Stronger filters (smaller $n$) reduce but do not eliminate lingering sequences. Even at $n=5$, **~1%** of $D_{mem}$ persists. As the fraction decreases, their content shifts from semantically useful text to **generalizable patterns** (e.g., counting in Roman numerals).

![Figure 4: Strong filters shift lingering completions toward generalizable patterns](/images/papers/verbatim-completion/pretrain_lingering_vs_mem.pdf)

Three proxy metrics confirm this shift: (1) verbatim completion rate by off-the-shelf GPT-2-XL, (2) completion rate by a counterfactual model trained on disjoint data, (3) pattern continuation judgment by Gemini 1.5 Pro.

---

## 5. Experiment 2: Adding Non-Members Can Force LLM Verbatim Completion

### 5.1 Experimental Setup

**Main Question:** Given a chosen unseen text sequence $x$, can we add training sequences $D_{ft}$ that have no n-gram overlap with $x$, and yet an LLM fine-tuned on $D_{ft}$ can complete $x$ verbatim?

**Key Idea:** Apply noisy transformations $f$ such that $\tilde{x} = f(x)$ retains information about $x$ but has no n-gram overlap. Training on multiple instances with different randomness enables the LLM to recover original $x$, similar to a denoising autoencoder.

**Three adversarial data construction methods:**

#### Method 1: Stitching Chunks
Split $x$ into overlapping segments padded with random tokens.

Example: $x = [1,2,3,4,5,6]$ → $D_{ft} = \{[1,2,3,\cdot,\cdot,\cdot], [\cdot,\cdot,3,4,5,\cdot], [\cdot,\cdot,\cdot,\cdot,5,6], ...\}$ (chunk size=3, overlap=1)

#### Method 2: Token Dropouts
Replace tokens at least every $n$ positions with random tokens, ensuring no n-gram overlap.

Example: $x = [1,2,3,4,5,6]$ → $D_{ft} = \{[1,2,3,\cdot,5,6], [1,\cdot,3,4,5,\cdot], [\cdot,2,3,4,\cdot,6], ...\}$ (drop interval=4)

Related to goldfish loss (Hans et al., 2024) but entirely data-centric rather than modifying the training objective.

#### Method 3: Casing Flips
Randomly flip the casing of English letters with probability $p$. Due to BPE tokenization mechanisms, flipping casing creates **completely distinct token sequences**.

Example: `'This is a string'` → `'THIS Is A stRinG'`

#### Compositions
Token dropouts + casing flips combined for finer control of difficulty and detectability.

**Models:** Gemma-2 (2B, 9B), Qwen-2.5 (0.5B, 7B). Batch size 32, learning rate $10^{-5}$.

**Target texts (~250 tokens each, recent temporal cutoff):**
1. **Lyles (NYT article):** Recent New York Times article about Noah Lyles and the Olympics
2. **Karpathy (tweet):** Andrej Karpathy's tweet about LLM tokenization
3. **Willow (blog):** Google blog post on the Willow quantum computing chip

$N=2,000$ transformed examples per target text.

### 5.2 Results

![Figure 5: Completion success across methods and target texts](/images/papers/verbatim-completion/finetune_main.pdf)

**Finding #1: It is possible for an LLM to complete an unseen string with no n-gram membership after minimal fine-tuning.**

- **Chunking:** Least effective. Small chunk size ($c=25$) mostly fails; only some models succeed at $c=100$.
- **Token dropouts:** **Extremely effective.** Even the smallest model (Qwen-2.5 0.5B) easily completes the target verbatim at drop interval 2 (50% drop probability). This presents a counter-case to goldfish loss — models can still complete targets verbatim when given multiple versions with different dropout positions.
- **Casing flips:** Generally effective across models.
- **Compositions (Dropout + Casing):** Increases task difficulty but still enables verbatim completion.

![Figure 6: Completion success may only require a few gradient steps](/images/papers/verbatim-completion/willow_goldfish_casing_4_09_qwen7b_tall.pdf)

**Finding #2: Completion success scales with model size.** As model size increases, completion success generally improves under the same configurations, suggesting frontier models should be more capable at synthesizing n-gram non-members into target texts.

---

## 6. Interpretations and Outlook

### Implications of Adversarial Fine-tuning

- **Data poisoning:** n-gram non-members of a poison text can be added to training data and still induce its generation.
- **Data contamination:** A dishonest model developer may game model evaluations through deliberate contamination while evading n-gram based detection.
- **Reporting train-test overlap metrics:** It is desirable that developers report additional metrics beyond n-gram overlap.

---

## 7. Concluding Remarks

Lingering sequences and adversarially constructed fine-tuning datasets demonstrate the remarkable ability of LLMs to generalize from neighboring text. Key implications:

1. **Membership definitions and tests should incorporate new similarity measures.** n-gram based membership emits false negatives that may not capture human intuition nor the pragmatic concerns of the copyright, privacy, and AI safety community.

2. **Machine unlearning alone is insufficient for output suppression.** The golden baseline of unlearning (retraining from scratch without target data) still results in some excluded sequences being verbatim generated. Unlearning alone may not always prevent a model from generating a sequence of interest.

3. **Connection to forging.** Just as gradients can be forged using non-overlapping datasets, our methods can be viewed as attempting to forge model outputs.

---

## 8. Limitations

- Pre-training experiments only go up to 2.8B parameters. Larger models may exhibit creative generalization.
- The exploration of adversarial transformations is limited; finding the optimal (stealthiest) transformation was not the goal.
- Membership in natural language is inherently fuzzy, and no single definition may perfectly capture all downstream concerns.
