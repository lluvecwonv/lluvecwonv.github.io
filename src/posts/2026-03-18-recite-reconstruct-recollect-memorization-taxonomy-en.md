---
title: "Paper Review: Recite, Reconstruct, Recollect – Memorization in LMs as a Multifaceted Phenomenon"
date: 2026-03-18
summary: "A paper by USVSN Sai Prashanth, Alvin Deng, Kyle O'Brien, Naomi Saphra, Katherine Lee et al. from EleutherAI, Google DeepMind, and Harvard University, published at ICLR 2025. Rather than treating memorization as a homogeneous phenomenon, this work proposes a taxonomy inspired by human memory: Recitation (highly duplicated sequences), Reconstruction (inherently predictable templates), and Recollection (rare sequences). Using Pythia models (70M–12B) trained on The Pile, the authors demonstrate that different factors influence memorization likelihood differently depending on the taxonomic category, and that recollection grows fastest with model scale. A logistic regression predictor based on this taxonomy outperforms both a generic baseline and an optimally partitioned model."
tags: [LLM, Memorization, Taxonomy, Pythia, Recitation, Reconstruction, Recollection, ICLR 2025, Research Notes]
category: 연구노트
language: en
---

# Recite, Reconstruct, Recollect: Memorization in LMs as a Multifaceted Phenomenon

**Authors:** USVSN Sai Prashanth*, Alvin Deng*, Kyle O'Brien*, Jyothir S V*, Mohammad Aflah Khan, Jaydeep Borkar, Christopher A. Choquette-Choo, Jacob Ray Fuehne, Stella Biderman, Tracy Ke†, Katherine Lee†, Naomi Saphra† (*Equal contribution, †Equal senior contribution)
**Affiliations:** EleutherAI, Microsoft, NYU, DatologyAI, Northeastern University, MPI-SWS, IIIT Delhi, Google DeepMind, UIUC, Harvard University, Kempner Institute
**Venue:** ICLR 2025
**Keywords:** LLM, Memorization, Taxonomy, Recitation, Reconstruction, Recollection, Pythia, The Pile

## One-Line Summary

This paper breaks down LLM memorization into three categories — **Recitation**, **Reconstruction**, and **Recollection** — inspired by human memory, and experimentally demonstrates that this taxonomy is useful for understanding and predicting memorization.

---

## 1. Introduction

Memorization in language models (LMs) — the tendency to generate exact copies of training samples at test time — has been studied under various motivations: copyright, privacy, and scientific understanding of generalization. Although these objectives share commonalities, they drive distinct and sometimes contradictory notions of memorization.

This paper argues that memorization should not be treated as a homogeneous phenomenon. Instead, the authors propose an intuitive taxonomy inspired by colloquial distinctions of memorization behavior in humans.

![Figure 1: Intuitive memorization taxonomy with three categories determined by simple heuristics](/images/papers/recite-reconstruct-recollect/intro_figure-1.png)
*Figure 1: The proposed intuitive memorization taxonomy has three categories determined by simple heuristics.*

### Key Contributions

1. **Intuitive taxonomy and heuristics** for categorizing memorized data into three types.
2. **Dependency tests** comparing memorized and unmemorized distributions across corpus-wide statistics, datum-level metrics, and representational differences. Low perplexity is strongly associated with memorization — though not equally for all memorized examples.
3. **Scaling factor analysis** monitoring each taxonomic category over training time and across model sizes. All categories increase, but **recollection sees the fastest growth** — and this cannot be attributed solely to repeated exposures.
4. **Predictive model** based on the taxonomy that outperforms both a generic baseline without taxonomy and a model using an automatically optimized partition.
5. **Category-specific findings:** Recitation is enabled by low-perplexity prompts, while recollection is constrained by the presence of rare tokens.

---

## 2. Experimental Setup

### 2.1 Memorization Definition

The paper uses **k-extractable memorization** (Carlini et al., 2022) with k=32. A sample is k-extractable if the LM, when prompted with the first k tokens, generates the following k tokens verbatim.

### 2.2 Language Models

The **deduplicated Pythia models** (Biderman et al., 2023) are used, ranging from 70M to 12B parameters (excluding the 160M model due to outlier behavior). These models are trained on a deduplicated version of The Pile, with data order fixed across runs — enabling causal claims about the effect of model scale on memorization.

### 2.3 Datasets

- **Memorized sample:** A public list of all 32-extractable sequences from the Pile, verified by referencing the training data (released by Biderman et al., 2023).
- **Representative sample:** A random 3% subset of The Pile, retaining the first 64 tokens of each sequence.
- **Unmemorized distribution:** Estimated by subtracting the memorized data distribution from the entire Pile distribution, as inferred from the representative sample.

---

## 3. Potential Factors in Memorization

The authors consider a number of possible factors in whether a given sequence is memorized. Features may be computed over the first 32 tokens (the **prompt**), the last 32 tokens (the **continuation**), and the **full sequence** of 64 tokens.

![Figure 2: Histograms of various properties for memorized and unmemorized samples](/images/papers/recite-reconstruct-recollect/histograms_percents-1.png)
*Figure 2: Distribution comparison of various properties for memorized vs. unmemorized samples. For some properties, the memorized distribution is more concentrated; for perplexity and duplicate count, the medians are visibly different.*

### 3.1 Corpus Statistics

- **Duplicates:** Count of exact duplicates for each 32-token window in the Pile.
- **Semantic Matches:** Document embeddings generated using SBERT; count sequences with cosine similarity ≥ 0.8. These capture semantically similar but not token-level identical sequences.
- **Textual Matches:** Filtered from semantic matches based on low Levenshtein edit distance in prompts. Computed at the character level to account for different tokenizations of identical sequences.
- **Token Frequency:** Summary statistics (mean, median, max, min, 25th/75th percentile) of corpus-wide frequency of individual tokens.

### 3.2 Sequence Properties

- **Templating:** Detecting sequences that follow predictable patterns.
  - **Repeating:** Short repeating sequence of tokens (e.g., "Go Go Go ...").
  - **Incrementing:** Incrementing numerical sequences (e.g., "23: 0xf1, 24: 0xf2, 25: 0xf3").
- **Compressibility:** Huffman Coding length measuring how easily a sequence can be compressed. Generalizes repeating templates to cases with minor variations.

### 3.3 Perplexity

Average perplexity across tokens computed on the prompt, continuation, and full sequence. Low perplexity sequences are far more likely to be memorized — one of the most reproduced findings in memorization research. Perplexity is the only factor relating to model behavior rather than being intrinsic to the data.

![Figure 3: KL divergence between generation perplexity of memorized and non-memorized examples](/images/papers/recite-reconstruct-recollect/kl_divergence-1.png)
*Figure 3: KL divergence between generation perplexity of memorized and non-memorized examples for Pythia 12B with bootstrapped confidence intervals. Divergence is highest at 6 duplicates; highly duplicated sequences have near-identical memorized and unmemorized distributions.*

---

## 4. Memorization Taxonomy

The taxonomy subdivides memorized samples into three types based on colloquial descriptions of human memorization.

### 4.1 Recitation

- **Definition:** Sequences with **high duplication count (>5 duplicates)** in the training corpus.
- **Intuition:** Just as humans recite direct quotes committed to memory through repeated exposure, LMs recite highly duplicated sequences.
- **Examples:** Bible quotes, software licenses, webpage boilerplate text, liturgy, HTML/CSS/JavaScript boilerplate code.
- **Rationale:** For highly duplicated sequences, perplexity is no longer a good predictor of memorization. The KL divergence between memorized and non-memorized perplexity distributions peaks at 6 duplicates and nearly vanishes for higher duplication counts.
- **Threshold selection:** The >5 duplicate threshold matches or beats alternatives like >1 or >10.

### 4.2 Reconstruction

- **Definition:** **Inherently predictable** sequences — templates with a single logical continuation, classified as repeating or incrementing.
- **Intuition:** Just as humans reconstruct a passage by remembering a general pattern and filling in gaps, LMs reconstruct template-based patterns.
- **Examples:** Chapter indices, phrase repetition, arithmetic sequences. Code is more likely to be reconstructed than natural language.
- **Note:** Such sequences can be perfectly reproduced even if they never appeared during training, raising the question of whether they are truly "memorized."

### 4.3 Recollection

- **Definition:** Sequences that are candidates for **neither recitation nor reconstruction** — rare sequences that are nonetheless memorized.
- **Intuition:** Just as humans sporadically recollect an episodic memory or fragment after a single exposure, LMs recollect sequences seen rarely during training.
- **Examples:** Legal texts, liturgical texts with slight translation differences, indexing variations. In code: templating patterns not strictly matching the repeating/incrementing definition.
- **Key finding:** The correlation between textual match count and memorization is consistently neutral or negative for recollection candidates. A rare token sequence is *less* likely to be memorized, not more, if it is a different tokenization of a common string.

---

## 5. Distribution Across Scale and Time

![Figure 4: Memorized data categorized by taxonomy across parameter size and training time](/images/papers/recite-reconstruct-recollect/categories_counts_percents-1.png)
*Figure 4: Quantity of memorized data by taxonomy across parameter size and training time. (a) Total counts by model size, (b) proportions by category, (c) total counts during 12B model training, (d) proportions during training. Proportional plots are truncated at 80% as recitation consistently dominates.*

### 5.1 Model Size

- All types of memorization increase with model size, but at different rates.
- **Recollection grows the fastest:** From 4.49% of memorized examples in the 70M model to 11.34% in the 12B model, suggesting that larger models tend to memorize rarer sequences that cannot be trivially reconstructed.
- **Reconstruction barely increases:** Even the smallest models have learned to extrapolate repeating and incrementing templates almost as effectively as the largest.

### 5.2 Training Time

- Memorization increases sub-linearly over training — models do not simply accumulate memorized samples with uniform probability.
- **Recitation proportion decreases relative to total memorization:** If memorization accumulated solely due to repeated exposure to duplicated samples, recitation would be the main source of growth. Instead, the proportion of recitation decreases.
- **Recollection shows the largest proportional increase** among all categories. This trend holds until approximately 86% of total training time, where a sudden increase in reconstruction occurs (conjectured as a breakthrough in generalizing more complex templates).
- **Conclusion:** Memorization continues to occur late in training through a combination of repeated exposure, opportunities for memorizing new sequences, and other unexplored factors.

---

## 6. Predicting Memorization

### 6.1 Why Taxonomy Matters

A useful taxonomy should reflect natural kinds — categories where dependencies between features of interest differ. The most obvious example is **Simpson's Paradox**, where the direction of correlation reverses when considering each subpopulation separately.

### 6.2 Predictive Model Design

Each model is a logistic regression with L2 regularization, bias parameter, and balanced class weights.

- **Generic baseline model:** A single logistic regression trained on the entire memorized dataset without taxonomy.
- **Intuitive taxonomic model (Proposed):** Three binary logistic regressions, one per taxonomic category. Samples are divided into taxonomic groups before training separate regressions.
- **Optimally partitioned model:** Same three-regression architecture, but partitioning based on feature-threshold combinations searched over the 25th, 50th, and 75th percentiles of each feature's distribution. The optimal partition uses Huffman coding length followed by sequence duplicate count.

### 6.3 Results

![Figure 5: Performance comparison of baseline, proposed taxonomy, and optimally partitioned models](/images/papers/recite-reconstruct-recollect/model_performance_evals.png)
*Figure 5: Performance of baseline, proposed taxonomy, and optimally partitioned models across various metrics. Confidence intervals are standard deviations computed by bootstrapping.*

- The greedy-optimal partition slightly outperforms the aggregate baseline on most metrics.
- **The intuitive taxonomy is better calibrated and more accurate**, except on the recollection set where it has low precision.
- The authors conclude that intuition guided a better taxonomy than searching possible data partitions.

### 6.4 Categorical Differences

![Figure 6: Feature weights from predictive models](/images/papers/recite-reconstruct-recollect/model_weights.png)
*Figure 6: Feature weights from predictive models trained on the homogeneous aggregate baseline and the intuitive taxonomy categories.*

Key findings from the feature weights:

- **Recollection (rare sequences):** More likely to be memorized if they have **no rare tokens**. The hypothesis is that there is more resistance to memorizing rare tokens within a sequence, as their prior probability is low.
- **Effect of duplicate count:** For recollection candidates, more duplicates increase memorization likelihood. For recitation candidates, duplicate count barely matters — suggesting that beyond the 5-duplicate threshold, greater exposure hardly leads to additional memorization.
- **Effect of perplexity:** Predictable continuations are strongly associated with memorization across all categories. However, unpredictable (high-perplexity) prompts are strongly associated with memorization **except for reconstruction**. The explanation: high-perplexity prompts often *only* occur as a prelude to the same continuation, providing a unique index for the memorized sequence, whereas low-perplexity prompts may also initiate common templates enabling reconstruction.

---

## 7. Discussion and Future Work

### 7.1 Ontologies of Memorization

Connections to prior work:
- Dankers et al. (2023): Investigated factors influencing counterfactual memorization in machine translation (rare tokens, long sequence lengths, high BPE segmentation rate). This paper confirms that rare tokens predict recollection in particular.
- Hartmann et al. (2023): Considered memorization facets relevant to copyright and privacy.
- Bansal et al. (2023): Distinguished heuristic memorization (shortcut learning) from example memorization. This paper further decomposes example memorization.

### 7.2 Which Categories Do We Care About?

The relevance of each category depends on the motivation for studying memorization:

- **Intellectual property violations:** Focus on highly duplicated data → Recitation. Rare memorized sequences also relevant → Recollection.
- **Privacy:** Focus on preventing personally identifying information from being generated even after few exposures → **Recollection**.
- **Scientific understanding of generalization:** Focus on the direct link between apparent overfitting and general pattern recognition → **Reconstruction**.

### 7.3 Ontologies and Statistics

This taxonomy serves as an example for future methods of interpreting complex phenomena. By studying interactions and nonlinearities, researchers may find complex dependencies and artifacts like Simpson's paradox in arbitrary settings. The approach of validating an intuitive ontology through predictive improvement is broadly applicable beyond memorization.

---

## 8. Limitations

1. **Linear dependence assumption:** The predictive models in the main body assume linear dependence. More general statistical dependencies are only studied in supplementary experiments (Appendix).
2. **Memorization definition:** The 32-extractable definition loses the notion of fuzzy or partial memorization. Under a counterfactual memorization definition, recitation and reconstruction patterns may not appear substantially.
3. **Reconstruction coverage:** Only repeating and incrementing patterns are considered; this does not comprehensively cover all possible template patterns.

---

## 9. Conclusion

This paper proposes an intuitive taxonomy for LLM memorization — Recitation, Reconstruction, and Recollection — inspired by human memory processes. The taxonomy reveals that different factors influence memorization differently depending on the category, and that taxonomy-based predictive models outperform both generic baselines and automatically optimized partition models. The finding that recollection grows fastest with model scale and training time has important implications for privacy research, as it suggests that larger models are increasingly vulnerable to memorizing rare sequences even from limited exposure.
