---
title: "Prior-Aware Memorization: An Efficient Metric for Distinguishing Memorization from Generalization in LLMs"
date: 2026-03-17
summary: "A computationally inexpensive metric, Prior-Aware (PA) Memorization, to distinguish true memorization from generalization in LLMs. Requires no additional model training and can be directly applied to existing LLMs. Evaluation on Llama and OPT models reveals that 55-90% of sequences previously classified as 'memorized' are in fact statistically common (generalizable) sequences. Validated through positive correlation with Counterfactual Memorization using 350+ GPT-2 124M models. Evaluated across Named Entities, Long Sequences, and SATML Challenge settings."
tags: [LLM, Memorization, Generalization, Privacy, Prior-Aware, Counterfactual Memorization, Research Notes]
category: 연구노트
language: en
---

# Efficient Metric for Distinguishing Memorization from Generalization in Large Language Models

**Venue:** ICLR 2025 (Accepted)
**Authors:** Trishita Tiwari (Cornell University), Ari Trachtenberg (Boston University), G. Edward Suh (NVIDIA, Cornell University)
**Paper Link:** [OpenReview](https://openreview.net/forum?id=lduxR2cLsS)

---

## TL;DR

This work proposes **Prior-Aware (PA) Memorization**, a computationally efficient metric that distinguishes true memorization from generalization in LLMs without requiring any additional model training. The key finding: up to **90% of sequences** labeled as "memorized" by prior metrics are actually statistically likely sequences that can be produced through generalization.

---

## 1. Introduction

Training data leakage from Large Language Models (LLMs) has been a concern for two important reasons: (a) copyright and licensing violations, which have been the subject of several lawsuits (Chang et al., 2023; Kadrey v. Meta Platforms, Inc.; The New York Times Company v. Microsoft Corporation), and (b) leakage of sensitive data such as Personally Identifiable Information (PII) (Carlini et al., 2021; Mozes et al., 2023).

Prior approaches to quantifying memorization often **overlook the models' capacity to generalize**, conflating genuine memorization with the generation of statistically common sequences. For example, a prompt like "The murder was committed by" may yield "John Doe" with high probability not because the model memorized this sequence, but because "John Doe" is a **common placeholder name**.

**Counterfactual Memorization** (Zhang et al., 2023) measures how models trained with and without the target sequence would perform, but requires training several "counterfactual" or "baseline" models for every training sequence, making it **very impractical to reproduce on production language models**.

This paper introduces **Prior-Aware (PA) Memorization**, which:

- Requires **no additional model training**
- Can be directly applied to existing pre-trained models
- Shows **positive correlation** with Counterfactual Memorization

---

## 2. Core Insight: High P(s|p) Does Not Necessarily Imply Memorization

### 2.1 Bayesian Decomposition

Existing metrics classify sequences as memorized when the conditional probability P(s | p) is large. However, by Bayes' rule:

> P(s | p) = P(p | s) · P(s) / P(p)

P(s | p) can be high for two distinct reasons:

1. **P(s) is very large** — s may be statistically popular (generic). For instance, if p = "The murder was committed by" and s = "John Doe", P(s) may be large because s is a popular occurrence in the dataset.
2. **The relative belief ratio P(p|s)/P(p) is large** — P(p) is small (the prefix is rare) relative to P(p | s), suggesting that the suffix is a strong indicator of the prefix, as we would expect for memorization.

PA Memorization distinguishes between these two cases.

---

## 3. Prior-Aware (PA) Memorization Definition

### 3.1 Definition 2: PA Memorization

For tunable thresholds m, n ≥ 0, a sequence p‖s ∈ D is **Prior-Aware memorized** by a model M if:

1. **P(s | p; M) > m** — the suffix s has a high probability of being generated verbatim by model M when prompted with p
2. **P(s|p; M) / P(s; M) > n** — the relative belief ratio exceeds threshold n, implying that s is a strong indicator of p (generation of s is specific to prefix p)

### 3.2 Computing P(s | p; M): Verbatim Generation

The probability of producing k-token suffix s given prefix p is the product of each token's conditional probability given all preceding tokens:

> P(s | p) = P(token₁ | context) × P(token₂ | context) × ... × P(tokenₖ | context)

This is computable from a **single forward-pass** through the model.

### 3.3 Computing P(s; M): Monte-Carlo Estimation

Computing the total probability P(s) over all possible prefixes is computationally prohibitive. Instead, an **unbiased estimator** inspired by Monte-Carlo Integration is used:

> v̂(s) = (1/c) × [P(s | q₁) + P(s | q₂) + ... + P(s | qc)]

That is, sample c random prefixes, compute P(s | prefix) for each, and take the average.

**Theoretical guarantees:**

- **Theorem 1** : The expected value of this estimator equals the true value (unbiased)
- **Theorem 2** : The variance of the estimator is at most 1/(4c) (variance bound)

The estimation error converges to 0 as the number of sampled prefixes c increases.

---

## 4. Empirical Correlation with Counterfactual Memorization

### 4.0 Why This Experiment Is Needed

This is a controlled experiment to verify whether PA memorization captures similar information to counterfactual memorization.

**Key Question: "Why should we trust PA memorization?"**

PA memorization is an efficient metric computed using only the target model, without requiring a baseline model. But can we trust that it actually makes the same directional judgments as counterfactual memorization? To answer this, both metrics are computed on **small models (GPT-2 124M)** and compared directly.

Why small models? Counterfactual memorization requires training **both** a target model M and a baseline model M', making it computationally very expensive. For large-scale models like Llama 13B or OPT 13B, this is practically infeasible. However, with GPT-2 124M, it is possible to train over 350 models and compute both metrics precisely.

**Logical Structure of the Experiment:**

1. On small models (GPT-2 124M), compute both counterfactual memorization and PA memorization **exactly**
2. Verify whether the two metrics show a strong positive correlation
3. If correlation is confirmed → establish evidence that "PA memorization captures similar information to counterfactual memorization"
4. Based on this evidence, use **only PA memorization** (which is computationally feasible) on large-scale models (Llama, OPT)

In short: **"Validate that both metrics agree on small models, then use only PA memorization on large models where counterfactual memorization is infeasible."**

### 4.1 Motivation

The fundamental question driving this experiment is: **"Can a model reproduce a target sequence with high probability even when no exact copies exist in the training data — only near-duplicates?"**

Prior memorization research (Liu et al., 2025; Zhang et al., 2023) has used a strategy of injecting "near-duplicate" sequences into training data to study memorization versus generalization. However, these studies commonly used duplicates with **high overlap (e.g., 50%+)**, which does not realistically reflect modern training regimes:

- Lee et al. (2022) found that removing high-overlap sequences improves model performance
- Thus, modern training pipelines (Touvron et al., 2023; Zhang et al., 2022) **actively remove** highly overlapping examples during preprocessing
- Consequently, injecting highly overlapping sequences does not realistically reflect the modern training environment

This paper intentionally adopts a **conservative 20% token overlap** threshold. The goal is to demonstrate that **even with relatively low overlap, models are capable of generalizing to a given sequence without requiring many (or any) exact copies in the training data**. In practice, this means that even when exact copies of a target sequence are absent, if sufficient similar data exists, the model can still generate the target — and traditional extractable memorization metrics would incorrectly label this as "memorization."

### 4.2 Model Training

| Component | Details |
|-----------|---------|
| **Model Architecture** | 124M parameter GPT-2 |
| **Training Data** | 1,000 Wikitext documents |
| **Total Models Trained** | Over 350 (across different seeds and target sequences) |
| **Target Sequences** | 25 |
| **Dataset Variations** | 7 (varying exact copy vs near-duplicate ratio) |

#### Near-duplicate Definition

Near-duplicates are defined as sequences sharing **20% token overlap**. That is, only ~20% of tokens in the original sequence appear identically in the near-duplicate; the remaining ~80% are replaced with different tokens.

![Table 1: Near-duplicate example](/images/pa-memorization/table1_near_duplicate.png)
*Table 1: A sequence and one possible 20% near-duplicate. Matching tokens are highlighted. For example, the exact copy "Quantum doughnuts might not exist, but theoretical bakers remain hopeful." has a near-duplicate "majesticum Nantonuts might Conradavery 258 texted theoretical imperialistmlicks Shim." where only ~20% of tokens match.*

#### Target Model Training Strategy

To simulate varying degrees of generality, the training data is constructed by **systematically varying the ratio of exact copies to near-duplicates** of a target sequence, creating 7 distinct dataset compositions:

| Setting | (Exact Copies, Near-Duplicates) | Interpretation |
|---------|-------------------------------|----------------|
| 1 | (0, 180) | Pure generalization — only near-duplicates, no exact copies. If the model generates the target, it is entirely through generalization |
| 2 | (10, 150) | Weak memorization signal. 30 of the original 180 near-duplicates replaced with 10 exact copies |
| 3 | (20, 120) | |
| 4 | (30, 90) | Balanced |
| 5 | (40, 60) | |
| 6 | (50, 30) | Strong memorization signal |
| 7 | (60, 0) | Pure memorization — only exact copies, no near-duplicates. If the model generates the target, it is due to verbatim learning |

**Key Design Principles:**

- **Total training set size is always fixed at 1,000 sequences** — only the exact vs near-duplicate composition changes, controlling for other variables
- As more exact copies are included, the model is more likely to exhibit **counterfactual memorization**, predicting the target sequence because it has seen it verbatim during training
- Conversely, when the dataset consists mostly of near-duplicates, the model must rely on **generalization** from many similar-but-not-identical examples, simulating the case where a sequence is generated with high probability simply because there is a lot of similar data in the training set (as described by Liu et al., 2025)
- By carefully controlling this ratio, the extent to which the model relies on memorization versus generalization can be **precisely modulated**

25 target sequences × 7 settings = **175 target models** trained. Experiments in each setting are repeated several times with different seeds, resulting in over 350 total models.

#### Baseline Model Training Strategy

Counterfactual memorization (Definition 4, Equation 5) is defined as the performance difference between a model "trained with the target sequence" and a model "trained without." This requires a baseline model:

- **Target model**: Trained on data containing both exact copies and near-duplicates
- **Baseline model**: Only the exact copies of the target sequence are removed; near-duplicates are **kept** in the training data
- Example: If the target model was trained with (10 exact, 150 near-dup), the baseline model is trained with (0 exact, 150 near-dup)

This design simulates a realistic scenario where the exact target data might be removed, but other data that can generalize to the target sequence remains present in the training dataset. In practice, even when specific content is deleted, documents with similar content typically remain in the training corpus.

### 4.3 Metric Measurements

This section describes how Equations (5) and (2) are concretely measured in the experiments.

The setup interprets x as p‖s, where p and s are of equal length. To simplify notation, A(S) and A(S') are written as M (target model) and M' (baseline model) respectively. Model accuracy L(f, x) is measured as **log(P(s | p; M))**, following the definition of extractable memorization from Carlini et al. (2022).

**Counterfactual Memorization measurement:**

> [Average of log P(s|p) across target models] − [Average of log P(s|p) across baseline models]

The expectation is taken over all models trained with the same ratio of near-duplicates to exact copies. Following Zhang et al. (2023), these models are assumed to be uniformly distributed, so the expectation reduces to the **simple average of log P(s|p) across multiple trained models**.

**PA Memorization measurement:**

To keep PA memorization comparable with counterfactual memorization, the **log form** is used:

> PA mem = [Average of log P(s|p) from target model] − [Average of log v̂(s) from target model]

This decomposition is key: PA memorization is the difference between **"how likely the suffix is generated from a specific prefix" (first term)** and **"how commonly the suffix is generated from any prefix" (second term)**. Even if P(s|p) is high, if v̂(s) (≈ P(s)) is also high, the PA memorization value will be low — this is the mechanism that distinguishes generalization from memorization.

The crucial difference: PA memorization **only relies on the target model M**, thus obviating the need for training baseline models M'. This is the key reason PA memorization is computationally more efficient than counterfactual memorization.

### 4.4 Real Data Experiment

In addition to synthetic data, the authors also perform a correlation experiment using **naturally occurring Named Entities** from Wikitext.

- **Model**: 124M parameter GPT-2
- **Data**: Wikitext
- Named Entities as suffixes, 50 $p \| s$ pairs total
- Sampled uniformly across the frequency distribution (e.g., "United States of America" ≈ 500 occurrences, "Starlicide" = 1 occurrence)

![Named Entity frequency distribution](/images/pa-memorization/ne_distribution.png)
*Distribution of Named Entities across Wikitext. x-axis: frequency of each NE; y-axis: number of NEs in each frequency bucket.*

**Baseline Model**: Remove only the specific $p \| s$ pair; retain other occurrences of suffix $s$ with different prefixes. For example, if $p \| s$ = "I live in the | United States of America," only this exact prefix-suffix pair is removed while other appearances of "United States of America" are retained.

### 4.5 Results

#### Synthetic Data Results

![Figure 1a: Counterfactual Memorization vs PA Memorization (Synthetic)](/images/pa-memorization/figure1_counterfactual_vs_pa.png)
*Figure 1a: Counterfactual Memorization (x-axis) vs PA Memorization (y-axis). Each data point is averaged over models with the same frequency of exact matches and near-duplicates.*

**Positive Correlation:** As we move from (0, 180) → (60, 0), i.e., as near-duplicates decrease and exact copies increase, both x-axis (counterfactual memorization) and y-axis (PA memorization) increase correspondingly. This demonstrates a **strong positive correlation** between the two metrics.

#### Real Data Results

![Figure 1b: Counterfactual Memorization vs PA Memorization (Real Data)](/images/pa-memorization/figure1b_wikitext_correlation.png)
*Figure 1b: Counterfactual Memorization (x-axis) vs PA Memorization (y-axis) on real Wikitext data. Each data point represents a single $p \| s$ pair.*

**A positive correlation is also observed in real data.** Even without artificially injecting near-duplicates, the two metrics capture the same directional information using naturally occurring Named Entities.

**Why does this prove PA memorization can substitute for counterfactual memorization?**

The key logic is as follows:

1. **Many near-duplicates, few exact copies (0, 180)**: The target sequence is "generic" in the training data — abundant similar data enables generation through generalization. In this case, counterfactual memorization should be low (the baseline model can also generate it), and PA memorization should also be low (v̂_s is high). **Both metrics indeed show low values.**

2. **Many exact copies, few near-duplicates (60, 0)**: The model has seen the target sequence verbatim, so this represents true memorization. Counterfactual memorization should be high (the baseline model cannot generate it), and PA memorization should also be high (v̂_s is low). **Both metrics indeed show high values.**

3. Intermediate settings (10,150) → (50,30) show **both metrics increasing monotonically together**, demonstrating that PA memorization captures the same directional information as counterfactual memorization.

**Why PA memorization can serve as an efficient alternative to counterfactual memorization:**

- Counterfactual memorization requires training **both** a target model M and a baseline model M', making it computationally expensive
- PA memorization achieves the same directional judgment using **only the target model M**
- The strong positive correlation observed in this experiment empirically demonstrates that PA memorization can distinguish "generalization vs. memorization" **without training baseline models** — capturing essentially the same signal that counterfactual memorization captures, but at a fraction of the computational cost

**Observation on Scale Difference:**

One interesting observation is the **difference in scale** between the two metrics. Counterfactual memorization (x-axis) ranges from 0 to ~50, while PA memorization (y-axis) ranges from ~1 to ~4. This indicates that while both metrics capture the same phenomenon, they measure it from different perspectives. This scale difference is a limitation discussed in detail in Section 7.

---

## 5. Large-Scale Evaluation

### 5.1 Evaluation Models

| Model | Sizes | Training Data |
|-------|-------|---------------|
| **Llama** (Touvron et al., 2023) | 3B, 7B, 13B | Common Crawl |
| **OPT** (Zhang et al., 2022) | 125M, 350M, 1.3B, 2.7B, 6.7B, 13B | The Pile |

Default model size for results: OPT 6.7B and Llama 7B.

### 5.2 Target Sequences for Extraction

To compute P(s), the model is prompted with **5,000 randomly sampled** sequences and the likelihood of generating s is measured. This is repeated for **5 trials**.

Three evaluation settings:

**1) Named Entities**

- Randomly sample ≈ 5,000–8,000 sequences containing Named Entities (NEs) from each dataset (following Lukas et al., 2023)
- Names of individuals, organizations, places → simulate risk of leaking PII
- **50-token prefix + 4-token Named Entity suffix**
- Experiments with prefix lengths up to 400 tokens

**2) Long Sequences**

- Simulate the risk of leaking copyrighted data
- **50-token prefix + 50-token suffix**
- 5,000 randomly sampled sequences from each dataset (following Biderman et al., 2024; Carlini et al., 2022)
- Experiments with prefix lengths up to 400 tokens

**3) SATML Challenge**

- Dataset from Yu et al. (2023): 2023 SATML training data extraction challenge
- **1-eidetic sequences** (each p‖s is known to occur only once in The Pile)
- 15,000 sequences (50-token prefix + 50-token suffix), results reported on **1,000 of the 15,000 sequences**

### 5.3 Hyper-parameter Settings

| Parameter | Value | Description |
|-----------|-------|-------------|
| **m** (4-token suffix) | 0.01 | 1/m = 100 → on average, 100 prompts needed to leak s |
| **m** (50-token suffix) | 0.0001 | Conservative low threshold |
| **n** | Model-specific | Average of P(s\|p)/v̂_s over sequences known to be easy-to-predict for LLMs |
| **c** (sample count) | 5,000 | Random prefix samples for P(s) estimation |
| **Trials** | 5 | Repetitions for estimation stability |

---

## 6. Results

### 6.1 Effect of Model Size on PA Memorization

![Figure 2: Extractable and PA Memorized Sequences by Model Size](/images/pa-memorization/figure2_model_size.png)
*Figure 2: The primary y-axis reports the number of extractable and PA memorized sequences as a function of model size for 4- and 50-token suffixes. The thicker lines denote the proportion of extractable-memorized sequences that are also PA memorized, with their scale on the secondary y-axis.*

#### Key Observation 1: Gap in Extractable and PA Memorized Sequences

Consistent with prior work (Carlini et al., 2022; Hayes et al., 2024; Schwarzschild et al., 2024), both extractable and PA memorization increase as the model size increases. However, there is a **significant gap**:

| Setting | PA Memorized Ratio of Extractable |
|---------|----------------------------------|
| Named Entity (4-token suffix) | **~10%** (largest models) |
| Long Sequence (50-token suffix) | **~45%** (largest models) |

For 4-token Named Entity suffixes, **as few as 10% of extractable memorized samples are PA memorized** in the largest models. This suggests that most extractably memorized suffixes are indeed popular entities such as politicians, celebrities, countries, etc.

#### Key Observation 2: Decreasing Proportion of PA Memorized Sequences

As model size increases, the proportion of PA memorized sequences generally **decreases**. This suggests that larger models are increasingly able to reproduce verbatim text by **generalizing from common or near-duplicate data**, rather than through true memorization — consistent with Liu et al. (2025).

### 6.2 Effect of Prefix Length on Discovering PA Memorization

**Experimental Setup:**

Figure 3 analyzes the effect of prompt length p on discovering PA memorized sequences. The default prefix length is 50 tokens, and experiments vary this up to **400 tokens**.

- **Named Entity (4-token suffix)**: ~5,000-8,000 Named Entity sequences randomly sampled from each dataset (following Lukas et al., 2023). Each sequence consists of a 50-token prefix followed by a 4-token Named Entity suffix. Prefix lengths varied from 50 to 100, 200, 300, and 400 tokens.
- **Long Sequence (50-token suffix)**: 5,000 sequences randomly sampled from each dataset (following Biderman et al., 2024; Carlini et al., 2022). Each consists of a 50-token prefix and 50-token suffix. Prefix lengths similarly varied up to 400 tokens.
- P(s) estimation: For each sequence, **5,000 randomly sampled prefixes** are used to compute the likelihood of generating s, repeated for **5 trials**.
- Evaluation models: OPT (125M–13B), Llama (3B, 7B, 13B). Default results reported for OPT 6.7B and Llama 7B.

![Figure 3: Effect of Prefix Length](/images/pa-memorization/figure3_prefix_length.png)
*Figure 3: Number of a) Extractable, and b) PA Memorized Sequences as a function of model prefix length for two types of suffixes.*

**Results Analysis:**

- Longer prefixes can discover more PA memorized sequences — unsurprisingly, as longer prompts provide more context to the model
- However, the PA memorized count for **4-token Named Entity suffixes does not benefit as much** from longer prefixes as the 50-token suffixes. This is because many Named Entities (e.g., "United States of America") are popular occurrences in web-text, and likely do not need specific prompts to be produced correctly
- **50-token suffixes** show a clear increase in PA memorized count with longer prefixes — longer suffixes are more specific and depend more heavily on the given prefix

### 6.3 SATML Challenge Dataset Results

**Experimental Setup:**

This experiment uses the **2023 SATML Training Data Extraction Challenge** dataset released by Yu et al. (2023). Key characteristics:

| Item | Details |
|------|---------|
| **Data composition** | 1-eidetic sequences (each p‖s is known to occur **exactly once** in The Pile training data) |
| **Total sequences** | 15,000 |
| **Sequence structure** | prefix of 50 tokens + suffix of 50 tokens |
| **Evaluation subset** | Results reported on **1,000** of the 15,000 sequences |
| **Evaluation models** | OPT (125M–13B), Llama (3B, 7B, 13B) |
| **P(s) estimation** | 5,000 random prefixes per sequence, 5 trials |

This dataset is particularly important because every sequence occurs **only once** in the training data. Therefore, if a model generates the sequence with high probability, it is strong evidence of true memorization. Conversely, if PA memorization classifies a sequence as "common," this provides strong evidence that the content is indeed statistically generic — reproducible through generalization alone.

Figure 4(b) shows results from the counterfactual correlation experiment (Section 3.3), illustrating how the number of exact copies of p‖s affects P(s | p) and P(s).

![Figure 4a: SATML Challenge Results](/images/pa-memorization/figure4_satml_a.png)
*Figure 4a: Memorization as a function of model size for 1K sequences from the SATML challenge dataset.*

![Figure 4b: P(s|p) and P(s) breakdown](/images/pa-memorization/figure4_satml_b.png)
*Figure 4b: P(s|p) and P(s) as a function of the number of exact copies of p‖s in the training dataset. Both quantities are positively correlated, limiting the sensitivity of the ratio.*

**Results Analysis:**

- **Surprising finding**: In the SATML challenge dataset, around **40% of sequences are "common"** in nature, despite each sequence occurring **only once in the entire training data**
- This strongly suggests that frequency alone is insufficient for determining memorization — even 1-eidetic sequences can be statistically generic and reproducible through generalization
- Figure 4(b): As exact copies are added, both P(s | p) and P(s) increase, but the ratio P(s|p)/P(s) increases very slowly → a limitation of PA memorization (discussed in Section 7)

### 6.4 Qualitative Analysis

| Score (Low) | Sequence (p‖s) | Score (High) | Sequence (p‖s) |
|------------|----------------|-------------|----------------|
| 2.9 | ...and is a tributary to **Saginaw Bay** | 4052 | ...t1="Sea Zone" t2=" **South Atlantic Sea Zone** |
| 3.0 | ...special prosecutor **Leon Jaworski** | 3358 | ...misguided members of the **Autonomie Club** |
| 3.7 | ...Jack Germond and **Jules Witcover** | 2544 | ...I'm watching Gore's **Warmista-Fest** |
| 4.0 | ...Hospital had received **Hill-Burton** | 1560 | ...PLUS Gold certification.- **Corsair Gold AX850** |

*Table 2: Examples of low and high scoring p‖s. s in each sequence is in bold text.*

- **Low score (Not PA memorized)**: All suffixes are places, political figures, etc. — common entities generated through generalization
- **High score (PA memorized)**: Rare terms, artifact-like text, niche topics, or boiler-plate text that appears verbatim several times on the web
- The highest scoring sequence (4052) had just **a single search result**, which is precisely the sequence included in the dataset

---

## 7. Limitations

One limitation of PA memorization compared to counterfactual memorization is that P(s; M) can be large due to either many near-duplicates **or** even due to many exact copies of p‖s. As shown in Figure 4b, both P(s; M) and P(s | p; M) increase when exact copies are added, even though near-duplicates are removed. As a result, P(s|p; M)/P(s; M) increases very **slowly** as more exact copies are added, indicating the metric may be less effective than counterfactual memorization at distinguishing whether a high P(s) arises from near-duplicates or from exact copies.

---

## 8. Conclusion

| Key Conclusion | Details |
|---------------|---------|
| **Overestimation Problem** | Up to **90%** of sequences labeled as memorized by prior metrics are statistically likely sequences |
| **Efficiency** | No additional baseline model training needed → **practically applicable** to large-scale production models |
| **Generalization Capacity** | Larger models increasingly reproduce text through **generalization** rather than true memorization |

This work highlights how traditional metrics may overstate memorization in LLMs by labeling generic sequences as memorized, and urges the research community to rethink existing notions about memorization in LLMs.

---

## 9. ICLR 2026 Review Outcome (Initial Submission: Reject → Later Accepted at ICLR 2025)

This paper was initially submitted to ICLR 2026 and received a **Reject** decision. However, after revisions, it was ultimately **accepted at ICLR 2025** (Authors: Trishita Tiwari, Ari Trachtenberg, G. Edward Suh). Below is a summary of the initial submission's 5 reviewer evaluations and the Area Chair's Meta Review.

### 9.1 Score Summary

| Reviewer | Rating | Soundness | Presentation | Contribution | Confidence |
|----------|--------|-----------|-------------|-------------|------------|
| **Reviewer SbhA** | 2 (reject) | 1 (poor) | 2 (fair) | 2 (fair) | 5 (absolutely certain) |
| **Reviewer 3GmT** | 2 (reject) | 1 (poor) | 2 (fair) | 1 (poor) | 4 (confident) |
| **Reviewer 8jkg** | 2 (reject) | 2 (fair) | 2 (fair) | 2 (fair) | 3 (fairly confident) |
| **Reviewer Yckr** | 6 (marginally above) | 3 (good) | 2 (fair) | 2 (fair) | 3 (fairly confident) |
| **Reviewer VzFo** | 0 (strong reject) | 1 (poor) | 2 (fair) | 2 (fair) | 4 (confident) |

### 9.2 Area Chair Meta Review Summary

The Area Chair noted:

- The core idea is **promising**, but the submission does not yet establish robustness under realistic pretraining data characteristics
- **Multiple reviewers question the core assumption** that high probability of a suffix across randomly sampled prefixes reliably indicates generalization rather than memorization in real-world corpora, where duplication, templating, and natural near-duplicates are common
- The current evaluation relies heavily on **synthetic injected-sequence experiments**, which may not faithfully reflect realistic pretraining data distributions
- The empirical comparison with counterfactual memorization is **not sufficiently direct or comprehensive**: reviewers requested clearer head-to-head comparisons and experimental comparisons with other non-retraining memorization proxies
- **Clarity and notation issues** compound these concerns

### 9.3 Detailed Reviewer Critiques

#### Reviewer SbhA (Rating: 2, Confidence: 5)

**Key criticisms:**
- **Core assumption (line 53-54) not well justified**: The assumption that if a suffix appears with high confidence across many unrelated prefixes then it arises from generalization does not account for real-world corpora where duplication, templating, and natural near-duplicates are common
- **False claims on SATML Challenge dataset**: Authors claim SATML consists of "1-eidetic sequences," but the official documentation does not guarantee this property across the entire training data
- **No comparison with other training-free memorization measurements**: Missing comparison with Schwarzschild et al. (2024)
- **Related work not discussed**: Huang et al. (2024), Lesci et al. (2024), Prashanth et al. (2025)

#### Reviewer 3GmT (Rating: 2, Confidence: 4)

**Key criticisms:**
- **Mathematical notation rigorousness**: Operators like E, E_M not properly defined in Equation 1
- **Insufficient comparison between Cm and PAm**: PAm is positioned as an efficient alternative to Cm, but lacks direct head-to-head evaluation
- **Presentation issues**: Unnecessary elements in figures, grammatical errors
- **Missing influential metrics**: Wang et al. (2025) proposes a conceptually similar definition not discussed
- **Threshold-based approach questionable**: Why use thresholds rather than studying the distribution of P(s|p)/P(s) directly?

#### Reviewer 8jkg (Rating: 2, Confidence: 3)

**Key criticisms:**
- **Novelty of problem formulation questioned**: Carlini et al. (2022) already noted that P(s|p) can overcount "popular" sequences
- **Test sequences are primarily randomly sampled**: Not representative of what an adversary would actually target for extraction
- **Dubious claim about decreasing PA memorization proportion**: Simply observing a decreasing ratio does not conclusively demonstrate increased generalization

#### Reviewer Yckr (Rating: 6, Confidence: 3) — Only Positive Reviewer

**Strengths acknowledged:**
- Practical metric usable with any model without additional training
- Interesting derivation of PA-Memorization from Bayes' rule
- Well-written methodological section
- Empirical results suggest the metric is useful

**Weaknesses noted:**
- Sections 4.4 and 4.5 experimental results need polishing
- Source of "55-90%" claim is unclear from the text
- More thorough experiments needed across diverse datasets/models
- Figure visualization can be improved; spelling mistakes present

#### Reviewer VzFo (Rating: 0 = strong reject, Confidence: 4)

**Key criticisms:**
- **Equation 1 derivation is flawed**: Questions the validity of using the average over random prefixes to approximate P(s). The model is not trained to learn P(s), but rather P(t_{i+1}|t_{1:i})
- What v̂_s actually captures is unclear
- Pervasive notation and mathematical rigor issues throughout

### 9.4 Summary of Rejection Reasons

The main reasons for rejection:

1. **Insufficient justification of core assumption**: The claim that "high suffix probability across random prefixes = generalization" is not adequately validated for realistic pretraining data where duplication and templating are common
2. **Over-reliance on synthetic data**: Correlation validation experiments depend on synthetic near-duplicate injection, which may not reflect real data distributions
3. **Insufficient comparisons**: Lack of direct head-to-head comparison with counterfactual memorization and other training-free metrics (Schwarzschild et al. 2024, Wang et al. 2025)
4. **Mathematical rigor and notation issues**: Equation 1 derivation, operator definitions, notation consistency
5. **Inaccurate claims about SATML dataset**: Wrong assumptions about the dataset's properties undermine the credibility of "surprising findings"
