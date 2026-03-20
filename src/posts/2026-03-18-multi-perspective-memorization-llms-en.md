---
title: "A Multi-Perspective Analysis of Memorization in Large Language Models"
date: 2026-03-18
summary: "A paper by Bowen Chen, Namgi Han, and Yusuke Miyao from The University of Tokyo. This study discusses memorization in LLMs from multiple perspectives including scaling model size, input and output dynamics, entropy analysis, and memorization prediction. Using Pythia models (70M-12B) trained on the Pile corpus, the study reveals: (1) non-linear trends in memorized/unmemorized sentence counts, (2) a boundary effect when generating memorized/unmemorized content, (3) clustering of sentences with different memorization scores in embedding space, and (4) the possibility of predicting memorization using a Transformer model."
tags: [LLM, Memorization, Scaling, Pythia, Boundary Effect, Embedding Dynamics, Entropy, Research Notes]
category: Research Notes
language: en
---

# A Multi-Perspective Analysis of Memorization in Large Language Models

**Paper:** Bowen Chen, Namgi Han, Yusuke Miyao
**Affiliation:** Department of Computer Science, The University of Tokyo
**Keywords:** LLM, Memorization, Scaling Laws, Boundary Effect, Embedding Dynamics

## One-Line Summary

A comprehensive study that analyzes the memorization phenomenon in LLMs from **multiple perspectives** — including model size scaling, input/output dynamics, n-gram frequency, embedding dynamics, entropy, and memorization prediction — using the Pythia model series (70M to 12B) to deeply reveal the mechanisms and characteristics of memorization.

---

## 1. Introduction

From BERT to GPT-4, Large Language Models (LLMs) have revolutionized NLP and AI research. However, due to their black-box nature, our understanding of the underlying mechanisms remains limited. As model size and pre-training data scale grow, a unique behavior called **memorization** has been observed.

Memorization in the context of LLMs means the LLM can generate the same content recorded in their pre-train corpus under certain contexts. On one hand, this allows using LLMs as knowledge bases. On the other hand, personal information contained in the pre-train corpora may be elicited maliciously, raising privacy concerns.

Previous research (Tirumala et al., 2022; Carlini et al., 2023; Biderman et al., 2023) studied memorization at the macro level, leaving more micro yet important questions under-explored: **what makes sentences memorized, what role does model size play, and what are the input and output dynamics while generating memorized or unmemorized content.**

Key findings of this paper:

**(I)** For both memorized and unmemorized sentences, the increase or decrease in model size follows a non-linear trend, indicating a maximum capacity for memorization. The number of memorized sentences decreases sub-linearly with continuation size and increases super-linearly with context size. Transition dynamics between sentences of different memorization scores were observed.

**(II)** A **boundary effect** when generating memorized/unmemorized content and its relation to model size.

**(III)** Sentences of different memorization scores cluster in the embedding space. Entropy analysis in decoding shows an inverse boundary effect.

**(IV)** The possibility of predicting memorization and its relation to model size and continuation length, where unmemorized sequences are easier to predict than memorized content.

---

## 2. Related Works

### 2.1 Scaling Laws of LLMs

Scaling laws (Kaplan et al., 2020) suggest that LLM performance scales with the size of corpora, parameter size, and computation required. In the field of memorization, Carlini et al. (2023) found that the number of memorized texts grows with model size and context size. Biderman et al. (2023) found that a large portion of memorized text in a small-size model is also memorized by a larger model, showing that memorized texts may share certain common features.

### 2.2 Memorization

Before LLMs, overfitting was the closest concept to memorization — near-zero training loss suggesting the neural model perfectly memorized the input-label relationship. However, memorization differs from overfitting as LLMs maintain good real-world performance. Feldman (2020) provided a theoretical analysis showing that in long-tail distributions with few samples per category, memorization is actually the best strategy for the neural model.

For LLMs, memorization is directly observable as they generate their pre-train content, which can be used for knowledge graph construction but also leads to data contamination and privacy risks.

---

## 3. Experiment Setting

### 3.1 Memorization Criteria: K-extractability

![Figure 1: Memorization and Research Scope in this study](/images/papers/multi-perspective-memorization/general.png)

The study uses K-extractability (Carlini et al., 2021) to define memorization and calculate memorization scores.

**Method:** The LLM is prompted with a sequence of context tokens C = {c0 ... cn}, and greedy decoding generates continuation tokens. The predicted continuations are compared with actual continuations:

M(X, Y) = (sum of matched tokens from i=0 to n) / L(Y)

- X = {x0 ... xn}: predicted continuation token sequence
- Y = {y0 ... yn}: true continuation tokens
- M(X, Y) = 1: fully memorized (**K-extractable**)
- M(X, Y) = 0: **unmemorized**

### 3.2 Prediction Criteria

- **Token-Level Accuracy:** proportion of correctly predicted memorization labels at each token position
- **Full Accuracy:** all token-level predictions in a sequence must be entirely correct

### 3.3 Model Setting

The study uses the **Pythia model** (Biderman et al., 2023b) to analyze memorization, as it provides LLMs trained across various sizes with the **same training order** using the open-sourced **Pile** (Gao et al., 2020) corpora, ensuring experimental stability.

- **Model sizes:** 70M, 160M, 410M, 1B, 2.8B, 6.9B, 12B (where m and b stand for million and billion)
- **Data:** The deduplicated Pile corpora version is used to avoid the effect of duplicated sentences, as previous research (Kandpal et al., 2022) reported that the chance to be memorized grows **exponentially with the number of duplicates**.

### 3.4 Corpora Setting

The training data is the open-sourced **Pile** (Gao et al., 2020) corpora, a publicly available dataset consisting of **146,432,000 rows**, each with a chunk length of **2,048** tokens, totaling approximately **800GB** in size.

The memorization measurement is conducted by iterating through the **entire Pile dataset without sampling**. Specifically, taking context size 32 and continuation size 96 as an example:

1. The **first 32 tokens (context)** of each row are fed into the model as input.
2. The Pythia model generates the following **96 tokens (continuation)** via greedy decoding.
3. The generated token IDs are compared with the gold token IDs in the data to compute the **memorization score** for that row.

This process is repeated for all **146M rows in the Pile**, distributed across multiple CUDA devices for parallel processing.

### 3.5 Experiment Environment

- **GPU:** 64 A100 40GB GPUs with PyTorch's parallel running packages
- **Precision:** half-precision for speed and memory efficiency
- **Decoding:** greedy decoding
- Running time example: 70M model with 32 context tokens and 16 continuation tokens takes several hours on a single A100. The 12B model can be completed in approximately one day with 64 GPUs.

---

## 4. Experiment Results

### 4.1 Memorization Factors

![Figure 2: Memorization Statistics Across Model Size, Complement Size, and Context Size](/images/papers/multi-perspective-memorization/memorized.png)

#### 4.1.1 The Factor of Model Size

- The number of sentences with low memorization scores (0-0.3) is **significantly higher** than those with high memorization scores, indicating that most pre-train data are not memorized despite the existence of memorization.
- Among high memorization scores, the count of **fully memorized sentences increases most rapidly**, suggesting LLMs have a propensity to fully memorize sentences rather than partially.
- The increase/decrease is **non-linear** with respect to model size. A noticeable increase from 70M to 2.8B compared to 2.8B to 12B suggests a **capacity for memorization** — LLMs cannot memorize the entire corpus even with sufficiently large model sizes.

#### 4.1.2 Context and Complement Size

- **Increasing complement size:** Memorized sentences decrease non-linearly. The change from 64 to 96 results in a relatively minor decrease compared to 32 to 48, indicating some sentences are **firmly memorized**.
- **Larger models show more obvious reduction** with increased complement size — larger models memorize more but their memorization is **less robust** compared to smaller models.
- **Increasing context size:** Memorized sentences increase non-linearly, with longer context leading to an **almost exponential rise**. More significant in larger models, indicating more content is potentially memorized and can be elicited by giving longer context.

### 4.2 Memorization Transition

![Figure 3: Transition Across Different Model Size](/images/papers/multi-perspective-memorization/transition_matrix.png)

Sentences are classified by memorization scores with 0.2 range difference into five levels: very low, low, medium, high, and very high. Transition matrices are plotted for 410M→2.8B and 2.8B→12B.

- **Most sentences remain in their previous state** even with larger models (high diagonal entries). Over 90% of highly memorized sentences remain memorized.
- **With increasing model size, sentences are more likely to stay in their original state** (higher diagonal probability for 2.8B→12B vs. 410M→2.8B). Memorized/unmemorized states become more **fixed** as model size increases.
- A small chance of highly memorized sentences transitioning to low memorized states implies some sentences may be memorized **randomly** rather than due to specific features.

### 4.3 Input Dynamics

#### 4.3.1 Token Level Frequency Analysis

![Figure 4: One-gram Analysis at Each Index](/images/papers/multi-perspective-memorization/one-gram.png)

- A clear **boundary effect** is observed around index 32 (the first generated token): frequency drops then rises for memorized sentences (**positive boundary effect**), rises then drops for unmemorized sentences (**negative boundary effect**). The negative boundary effect is more pronounced.
- For **half-memorized sentences**, the negative boundary effect appears around index 39 (half the continuation length), confirming that **memorized tokens are distributed continuously** rather than scattered.
- The positive boundary effect suggests **higher frequency of initial tokens drives memorization**. Conversely, the negative boundary effect indicates **low frequency of initial tokens makes following sequences easier to forget**.

#### 4.3.2 Sentence Level Frequency Analysis

| Size | Context One-gram (M/H/U) | Continuation One-gram (M/H/U) | Boundary Freq Diff One-gram (M/H/U) |
|------|---------------------------|-------------------------------|--------------------------------------|
| 160M | 1.708/1.713/1.744 | 1.739/1.837/1.628 | 0.114/0.330/-0.939 |
| 1B | 1.713/1.711/1.752 | 1.736/1.832/1.631 | 0.103/0.270/-0.981 |
| 6.8B | 1.721/1.710/1.759 | 1.736/1.829/1.638 | 0.090/0.140/-0.963 |
| 12B | 1.721/1.720/1.760 | 1.736/1.846/1.626 | 0.039/0.237/-1.016 |

*(Frequency unit: billion. M=Memorized, H=Half-memorized, U=Unmemorized)*

- One-gram frequency is approximately 3.5 times higher than two-gram. The boundary effect is consistent in the two-gram setting.
- **Memorized sentences:** lower context frequency + higher continuation frequency. **Unmemorized sentences:** the opposite pattern. The boundary effect persists at a broader sequence level.
- **With increasing model size:** positive boundary effect decreases (less significant), negative boundary effect increases (more significant). The significance of the positive boundary effect correlates with the ease of memorizing a sentence.

### 4.4 Output Dynamics

#### 4.4.1 Embedding Dynamics

![Figure 5: Embedding Dynamics Across Different Model Size](/images/papers/multi-perspective-memorization/plot.png)

Hidden states from the last layer of each generated token are collected, and pair-wise Euclidean distance and cosine similarity are computed, then visualized via PCA.

- **Cosine similarity remains relatively stable** across decoding steps between sentences of different memorization extents. Euclidean distance decreases with token generation — the angle between sentence vectors in high-dimensional space remains stable while the magnitude converges.
- **Highly memorized sentences cluster closely** in the embedding space even when not fully memorized, suggesting the existence of **paraphrased memorization**.
- **Larger models exhibit higher Euclidean distances and lower cosine similarities.** This is due to hidden size expansion (e.g., 512 for 70M, 2048 for 1B), which increases the expressivity of the embedding space. Larger models distribute different sentences more distinctly with fewer embedding overlaps, while smaller models mix embeddings more, leading to ambiguity and degraded performance.

#### 4.4.2 Generation Dynamics and Entropy

![Figure 6: Averaged Entropy at Each Index](/images/papers/multi-perspective-memorization/entropy_across_steps.png)

Entropy across vocabulary is calculated for each token over 10,000 sentences.

- **Unmemorized sentences have higher average entropy** than memorized sentences, showing LLMs are more confident when generating memorized content.
- An **inverse boundary effect** in entropy: entropy suddenly increases for unmemorized content and decreases for memorized content at the boundary — opposite to the frequency analysis.
- The entropy drop for fully memorized sentences is less significant than for half-memorized sentences, showing the model is even more confident when content is fully memorized.
- **Overall entropy decreases with model size** (larger models are more confident). The boundary effect significance decreases for memorized content with model size but remains unchanged for unmemorized content.

### 4.5 Prediction of Memorization

A Transformer model is trained to predict memorization from the LLM's last layer embeddings and statistical features (entropy), outputting binary classification labels at each index.

#### 4.5.1 Results

| Length | 70M Token/Full | 410M Token/Full | 1B Token/Full | 2.8B Token/Full | 6.9B Token/Full | 12B Token/Full |
|--------|----------------|-----------------|---------------|-----------------|-----------------|----------------|
| 16 | 78.2/10.2 | 78.6/10.4 | 78.8/10.6 | 80.1/10.7 | 77.4/8.3 | 80.3/**10.9** |
| 32 | 78.6/5.9 | 79.6/6.0 | 79.7/6.1 | 80.1/6.3 | 80.5/6.4 | 80.8/6.4 |
| 48 | 79.6/5.2 | 80.3/5.4 | 80.4/5.6 | 80.4/5.5 | 80.8/5.8 | 81.0/6.0 |
| 64 | 80.1/4.7 | 80.8/4.8 | 81.2/5.2 | 81.5/5.5 | 81.8/5.8 | **82.1**/6.0 |

*(Context length = 32. Token = Token-Level Accuracy, Full = Full Accuracy)*

- Token-level accuracy can reach **80% and higher**, showing token-level memorization prediction is achievable with a naive Transformer model.
- **As LLM size increases, both token-level and full-level accuracy improve**, because greater embedding distances make classification easier.
- **Token-level accuracy increases with continuation size** (more training data), but **full accuracy decreases** (more tokens to predict correctly).

#### 4.5.2 Analysis of Full Accuracy

![Figure 7: Distribution Across Model Size of Full Accurate Predictions](/images/papers/multi-perspective-memorization/normalized_full_accuracy_count_distribution.png)

- For any model size, the model is **better at predicting sentences with low memorization scores**. Sentences with high memorization scores are harder to predict accurately.
- As model size increases, the proportion of correctly predicted low memorization scores rises and decreases for high memorization scores (reaching zero for the 6.9B model).
- This can be attributed to the **significance of the boundary effect**: the boundary effect for unmemorized sequences is more obvious in both token frequency and entropy, and it increases with model size for unmemorized sentences while decreasing for memorized sentences.

---

## 5. Conclusion

This study comprehensively discussed LLM memorization from various perspectives:

1. **Statistical level:** Extended the scope of previous research to sentences with lower memorization scores and showed memorization transition dynamics across model sizes.
2. **Input dynamics:** Discovered positive and negative boundary effects when generating memorized and unmemorized tokens through frequency analysis, and their relation to how easily a sentence can be memorized/unmemorized.
3. **Output dynamics (embedding):** Found clusters of sentences with different memorization scores in the embedding space, where close distances between highly memorized sentences indicate the existence of paraphrased memorization.
4. **Output dynamics (entropy):** Observed an opposite boundary effect and analyzed its change with model size.
5. **Memorization prediction:** Token-level prediction is easy while sentence-level is challenging. Unmemorized tokens are easier to predict than memorized tokens, explained by the significance of the boundary effect.

---

## 6. Limitations

- Only Pythia models up to 12B were used. Larger models like LLaMA (70B) may show different results due to emergent abilities.
- Limited availability of LLMs with both open models and data makes cross-LLM comparison difficult.
- The Transformer-based memorization prediction is analysis-oriented; performance optimization was not the main focus.
- The discussion of memorization is limited to **verbatim memorization**, where generated tokens are identical to the same sentence in the corpus.
