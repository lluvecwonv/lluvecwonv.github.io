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

With direct access to the training dataset, the most common approach to determine membership is comparing sequences by their **n-grams**. Two sequences match verbatim if all their n-grams are equal for all n, and approximately if most do for some n.

The key question this paper asks: **Can an LLM generate a target sequence even if it was never included as an n-gram in its training data?**

The answer is affirmative: n-gram membership establishes a threshold dependent on n, and this threshold can be **gamed**.

![Figure 1: Main setup and findings](/images/papers/verbatim-completion/main-illustration-v2.png)

### Main Takeaways

1. There is high overlap between training data membership and LLM completion test being positive. Text not in this overlap is explained by the lack of complexity or limitations in n-gram based definitions.
2. n-gram membership is limited in capturing the intuition of what constitutes a training dataset "member." A model can complete sequences that are not n-gram members of its training dataset.
3. The underlying cause is not in the choice of distance (n-gram overlap) but in the fact that the **membership definition fails to consider auxiliary information** that the training algorithm gets access to, e.g., through pre-processing or other design choices.

---

## 2. Background & Related Work

### 2.1 Definitions of Data Membership

Many language model tasks require a definition of data membership. In most cases, these definitions fall into versions of **n-gram or substring overlap** (Anil et al., 2023; Gemini Team et al., 2023; 2024; Gemma Team et al., 2024a;b; Touvron et al., 2023; Dubey et al., 2024; Zhang et al., 2024a; Duan et al., 2024; Carlini et al., 2021; Singh et al., 2024). n-gram based definitions capture near-duplicates by matching smaller text segments, offering flexibility, simplicity, and intuitiveness.

**Membership definitions by major models:**

- **GPT-4** (Achiam et al., 2023): 50-character substring overlap
- **LLaMA-3** (Dubey et al., 2024): 8-gram token overlap
- Much of the prior work on **data contamination** also uses n-gram based definitions (Sainz et al., 2023; Jiang et al., 2024; Dekoninck et al., 2024; Singh et al., 2024)

For **training data deduplication** (Lee et al., 2021; Kandpal et al., 2022; Mou, 2023), duplicates are identified based on training data membership. Recent methods use **suffix arrays** for exact substring matches (Lee et al., 2021) and **MinHash or locality sensitive hashing** for approximate matches (Broder, 1997; Mou, 2023); both build on n-gram overlap.

The prevalent use of n-gram based definitions reflects a practical balance between accuracy and simplicity. **A key focus of this work is to highlight the limitations of these n-gram based definitions.**

### 2.2 Tests for Data Membership

Unlike membership definitions (which define the ground-truth), **membership tests** aim to detect whether a data sample was in a dataset. This paper focuses on **model-level membership tests** — those that predict membership with only access to a trained model and not the training dataset — because they are more relevant to downstream uses of membership in LLMs (e.g., privacy, copyright, and safety).

**Membership Inference Attacks (MIA):** The most widely studied model-level membership test, originally proposed by Shokri et al. (2017).

- **Computer vision:** Extensive work by Yeom et al. (2018), Salem et al. (2018), Sablayrolles et al. (2019), Choquette-Choo et al. (2021), Carlini et al. (2022a), and Jagielski et al. (2024).
- **Example-level MIA for LLMs:** More recently studied by Zarifzadeh et al. (2023), Shi et al. (2023), Mattern et al. (2023), and Li et al. (2023).

Despite these attempts, progress is hindered by **flawed evaluations** (Meeus et al., 2024; Zhang et al., 2024b):

- **Duan et al. (2024):** Argue that membership can be inherently blurry for natural language
- **Das et al. (2024):** Report that existing MIA testbeds suffer from distribution shifts
- **Kong et al. (2023):** Refute MIAs using a gradient-space attack

This work situates in this body of research by studying **systematic failure modes of operationalizing membership through definitions and tests**, and the consequences when these definitions and tests mismatch.

**Dataset-level MIA:** Maini et al. (2021; 2024) and Kandpal et al. (2023) enhance membership signals by leveraging multiple correlated samples as inputs. These are closely related to contamination tests (Golchin & Surdeanu, 2023; Oren et al., 2023).

This paper focuses on **sequence-level data membership tests based on data completion**, because these focus on scenarios where the LLM generates the text, presenting novel concerns for privacy, copyright, and safety.

### 2.3 Data Completion

There is a long body of work studying generation of training data in both **diffusion models** (Somepalli et al., 2023; Carlini et al., 2023) and **LLMs** (Carlini et al., 2019; Tirumala et al., 2022; Kudugunta et al., 2024; Biderman et al., 2024; Freeman et al., 2024). These works are often studied from the perspective of memorization, where the entity performing the model test has access to the training dataset.

In this line of literature, two types of memorization definitions exist:

- **Verbatim definitions:** Exact reproduction of training data (Carlini et al., 2022b)
- **Approximate definitions:** Near-reproduction within some tolerance (Ippolito et al., 2022)

When studied from a **black-box perspective** — without access to the training dataset — researchers typically match completions against known auxiliary databases as a surrogate confirmation of membership (Carlini et al., 2021; Nasr et al., 2023).

**Key intuition:** If a model completes a long sequence x when prompted with its prefix, it likely saw x during training because x has high entropy due to its length and vocabulary size (Carlini et al., 2019; 2022b).

This work focuses on these **completion tests as a black-box membership test**, specifically studying cases where completion succeeds for sequences that are non-members under n-gram based definitions.

---

## 3. Preliminaries

### 3.1 n-gram Data Membership

> **Definition 1:** A sequence x is a member of dataset D if x shares at least one n-gram with any x^(i) in D.

This definition is stringent (overestimates members, underestimates non-members). Setting n = |x| gives verbatim membership; smaller n captures approximate membership definitions including MinHash and edit distance based methods.

### 3.2 Definitions of Data Completion

![Figure 2: Completion vs. Extraction](/images/papers/verbatim-completion/venn-complete.png)

- **Exact completion:** M(prompt) = suffix using greedy decoding
- **r-similar completion:** normalized Levenshtein edit distance within 1-r
- **Case-insensitive completion:** matching after lowercasing both sides

**Data Extraction = Data Completion + Data Membership.** This paper specifically studies **non-member completions**.

---

## 4. Experiment 1: Removing Members Does Not Always Prevent LLM Verbatim Completion

### 4.1 Experimental Setup

**Main Question:** Will an LLM still complete a text sequence even after removing all training sequences that have n-gram overlap with it?

**Procedure:**

1. **Pre-train a base model** M_base from scratch on D_base
2. **Identify verbatim completions** D_mem: sequences of length k that M_base can complete verbatim
3. **n-gram filtering**: Remove from D_base all windows sharing any n-gram with sequences in D_mem
4. **Re-train a counterfactual model** M_filter from scratch on filtered data

**Models:** GPT-2 architecture, sizes {350M, 774M, 1.6B, 2.8B}. Trained using LLM.c.

**Data:** FineWeb-Edu, 33.6B tokens (Chinchilla optimal for 1.6B). Sequence length k=50 (prefix=suffix=25 tokens).

| Model size | 304M | 774M | 1.6B | 2.8B |
|------------|------|------|------|------|
| \|D_mem\| | 76,648 | 116,270 | 151,598 | 175,813 |

### 4.2 Results

![Figure 3: LLMs can verbatim complete texts with zero n-gram overlap to training data](/images/papers/verbatim-completion/pretrain_scale_vs_lingering.png)

**Finding #1 (Existence of Lingering Sequences):** Simply deleting sequences from pre-training data does not always prevent them from being generated. Under the weakest n-gram filter (n=50, verbatim matches only), the fraction of **lingering sequences** can be as high as **~40%**. This observation is consistent across model scales.

**Finding #2 (Nature of Lingering Sequences):** No lingering sequences correspond to creative generalization. All cases are explained by **exact duplicates, near-duplicates, and short overlaps** — they are either still contained in the dataset via a different membership definition (for some m < n) or lack sufficient entropy. Searching for neighboring texts (Levenshtein distance < 20) in the pre-training data, near-duplicates were found for all queried lingering sequences.

**Finding #3 (Persistence of Lingering Sequences):** Stronger filters (smaller n) reduce but do not eliminate lingering sequences. Even at n=5, **~1%** of D_mem persists. As the fraction decreases, their content shifts from semantically useful text to **generalizable patterns** (e.g., counting in Roman numerals).

![Figure 4: Strong filters shift lingering completions toward generalizable patterns](/images/papers/verbatim-completion/pretrain_lingering_vs_mem.png)

Three proxy metrics confirm this shift: (1) verbatim completion rate by off-the-shelf GPT-2-XL, (2) completion rate by a counterfactual model trained on disjoint data, (3) pattern continuation judgment by Gemini 1.5 Pro.

---

## 5. Experiment 2: Adding Non-Members Can Force LLM Verbatim Completion

### 5.1 Experimental Setup

**Main Question:** Given a chosen unseen text sequence x, can we add training sequences D_ft that have no n-gram overlap with x, and yet an LLM fine-tuned on D_ft can complete x verbatim?

**Key Idea:** Apply noisy transformations f such that x̃ = f(x) retains information about x but has no n-gram overlap. Training on multiple instances with different randomness enables the LLM to recover original x, similar to a denoising autoencoder.

**Three adversarial data construction methods:**

#### Method 1: Stitching Chunks
Split x into overlapping segments padded with random tokens.

Example: x = [1,2,3,4,5,6] → D_ft = {[1,2,3,·,·,·], [·,·,3,4,5,·], [·,·,·,·,5,6], ...} (chunk size=3, overlap=1)

#### Method 2: Token Dropouts
Replace tokens at least every n positions with random tokens, ensuring no n-gram overlap.

Example: x = [1,2,3,4,5,6] → D_ft = {[1,2,3,·,5,6], [1,·,3,4,5,·], [·,2,3,4,·,6], ...} (drop interval=4)

Related to goldfish loss (Hans et al., 2024) but entirely data-centric rather than modifying the training objective.

#### Method 3: Casing Flips
Randomly flip the casing of English letters with probability p. Due to BPE tokenization mechanisms, flipping casing creates **completely distinct token sequences**.

Example: `'This is a string'` → `'THIS Is A stRinG'`

#### Compositions
Token dropouts + casing flips combined for finer control of difficulty and detectability.

**Models:** Gemma-2 (2B, 9B), Qwen-2.5 (0.5B, 7B). Batch size 32, learning rate 10^-5.

**Target texts (~250 tokens each, recent temporal cutoff):**
1. **Lyles (NYT article):** Recent New York Times article about Noah Lyles and the Olympics
2. **Karpathy (tweet):** Andrej Karpathy's tweet about LLM tokenization
3. **Willow (blog):** Google blog post on the Willow quantum computing chip

N=2,000 transformed examples per target text.

### 5.2 Results

![Figure 5: Completion success across methods and target texts](/images/papers/verbatim-completion/finetune_main.png)

**Finding #1: It is possible for an LLM to complete an unseen string with no n-gram membership after minimal fine-tuning.**

- **Chunking:** Least effective. Small chunk size (c=25) mostly fails; only some models succeed at c=100.
- **Token dropouts:** **Extremely effective.** Even the smallest model (Qwen-2.5 0.5B) easily completes the target verbatim at drop interval 2 (50% drop probability). This presents a counter-case to goldfish loss — models can still complete targets verbatim when given multiple versions with different dropout positions.
- **Casing flips:** Generally effective across models.
- **Compositions (Dropout + Casing):** Increases task difficulty but still enables verbatim completion.

![Figure 6: Completion success may only require a few gradient steps](/images/papers/verbatim-completion/willow_goldfish_casing_4_09_qwen7b_tall.png)

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
