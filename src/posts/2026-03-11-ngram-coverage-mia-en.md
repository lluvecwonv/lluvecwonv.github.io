---
title: "The Surprising Effectiveness of Membership Inference with Simple N-Gram Coverage - Paper Analysis"
date: 2026-03-11
summary: "COLM 2025 paper. Addresses temporal distribution shift problems in existing MIA benchmarks and proposes new datasets: WikiMIA_2024 Hard and TULU Mix. Achieves membership inference attacks using only model output text based on n-gram coverage, matching or surpassing white-box attack performance. Comprehensive experiments on GPT-3.5/4/4o, LLaMA, TULU, Pythia, OLMo, and more."
tags: [MIA, Membership Inference, Privacy, LLM, N-Gram, Black-Box Attack, Research Notes]
category: Research Notes
language: en
---

# The Surprising Effectiveness of Membership Inference with Simple N-Gram Coverage

**Paper:** COLM 2025 | **Authors:** Skyler Hallinan (USC), Jaehun Jung (UW), Melanie Sclar (UW), Ximing Lu (UW), Abhilasha Ravichander (UW), Sahana Ramnath (USC), Yejin Choi (Stanford), Sai Praneeth Karimireddy (USC), Niloofar Mireshghallah (UW), Xiang Ren (USC)
**Code:** [GitHub](https://github.com/shallinan1/NGramCoverageAttack)

## One-Sentence Summary

This paper proposes N-Gram Coverage Attack, a membership inference attack that uses only model text output, and reports the surprising finding that simple n-gram coverage metrics match or exceed the performance of white-box attacks that access model internals (logits/loss).

---

## 1. Paper Overview and Motivation

### What is Membership Inference Attack (MIA)?

Membership Inference Attack is a technique to determine whether a specific text was included in a model's training data. It is crucial for detecting copyright violations, auditing data leakage, and evaluating privacy protection.

### Limitations of Existing Methods

Most existing MIA methods require **access to model internal information**:

- **Loss-based:** Direct computation of model prediction loss on candidate text (Yeom et al., 2018)
- **Reference Loss:** Comparison of loss differences with a reference model (Carlini et al., 2021)
- **Min-K%:** Use log-likelihood of the k% most unlikely tokens (Shi et al., 2024)
- **zlib:** Normalize loss by zlib compression size (Carlini et al., 2021)

All these methods require access to token probabilities or logits, making them **inapplicable to API-only models like GPT-4 and GPT-4o**.

The only previous black-box method, **DE-COP** (Duarte et al., 2024), uses a complex pipeline that paraphrases candidate documents, converts them to QA tasks, and requires a powerful external paraphraser like Claude, with high computational costs.

### Key Observation in This Paper

> Models are more likely to remember and regenerate text patterns that were included in their training data.

Based on this intuition, the attack gives a candidate document's prefix to the model, generates completions multiple times, and measures n-gram similarity between the generations and the original suffix to infer membership.

---

## 2. Methodology: N-Gram Coverage Attack

![N-Gram Coverage Attack Overview](/images/papers/ngram-coverage-mia/figure_1_ngram_coverage_mia.png)
*Figure 1: Complete pipeline of N-Gram Coverage Attack. (1) Extract prefix from candidate document, (2) sample multiple continuations from target model conditioned on prefix, (3) compare generations with original suffix using n-gram metrics, (4) aggregate similarity to infer membership.*

### Three-Step Framework

**Step 1: Sampling from Target Model**

Using the front portion of candidate text x as prefix x_(<=k), generate d diverse completions from target model M_theta:

{o_theta^(i)}_(i=1)^d ~ M_theta(· | p, x_(<=k))

where p is an instruction prompt. In main experiments, **50% of words are used as prefix**, and generation length is constrained to match the suffix token count, keeping total token budget at O(n).

**Step 2: Computing Similarities**

Compute similarity between each generation o_theta^(i) and original suffix x_(>k):

S_theta^(i) <- sim(o_theta^(i), x_(>k)), ∀ i = 1, ..., d

**Step 3: Aggregation**

Aggregate d similarity scores into a single value:

S_theta^(agg) <- agg({S_theta^(i)}_(i=1)^d)

If S_theta^(agg) > epsilon, classify as **member**, else **non-member**.

### Similarity Metrics

Three n-gram-based similarity functions are used:

**1) Coverage (Cov)**

Between two documents x_1 and x_2, compute the proportion of tokens in x_2 that match n-grams of length L or greater in x_1:

Cov_L(x_1, x_2) = (sum of (w in x_2) indicator(exists n-gram g subseteq x_1, |g| >= L s.t. w in g)) / |x_2| in [0, 1]

**2) Creativity Index (Cre)**

A metric proposed by Lu et al. (2024) that sums 1 - Coverage across multiple n-gram lengths to measure text novelty:

Creativity Index(x_1, x_2) = sum_(L=A)^B (1 - Cov_L(x_1, x_2)) in [0, B-A]

In practice, use -Creativity Index so higher values indicate higher similarity.

**3) Longest Common Substring (LCS)**

Compute the length of the longest common contiguous substring between two texts. Two variants exist: character-level (LCS_c) and word-level (LCS_w). Unlike Coverage/Creativity, no length normalization is applied.

### Aggregation Functions

Consider four functions: max, min, mean, median. Since false positives (accurately regenerating unseen data) are rare, **max** captures the strongest membership signal most effectively and is used in all experiments.

---

## 3. Existing Dataset Problems and New Datasets

### Problem with Existing Datasets: Temporal Distribution Shift

The biggest problem with existing MIA benchmarks is **temporal distribution shift**.

**WikiMIA** (Shi et al., 2024) uses Wikipedia documents written before 2017 as members and documents written after 2023 as non-members. The problem is that members and non-members are **completely different topics and time periods**. Models can distinguish them simply by exploiting topic or style differences rather than actually remembering the specific text. Duan et al. (2024) explicitly highlighted this limitation.

**WikiMIA-24** (Fu et al., 2025) only updates the non-member cutoff to March 2024, but inherits the **same fundamental temporal shift vulnerability** from WikiMIA's collection method.

**BookMIA** (Shi et al., 2024) uses famous literary works (members) and books published after 2023 (non-members), but is only available for GPT-3.5 series and has limited data scale.

### New Dataset 1: WikiMIA_2024 Hard

A dataset constructed by the authors to resolve WikiMIA's temporal distribution shift. Two key improvements are made:

**Improvement 1: Using Different Versions of Same Document**

Members and non-members are not completely different documents, but **different versions of the same Wikipedia document from different time points**:
- **Members:** Wikipedia summaries from late 2016 (likely scraped into large-scale pretraining corpus)
- **Non-members:** Latest versions edited after 2024 (mostly after models' knowledge cutoff)

By using different versions of the same document, **topical differences between members/non-members are minimized**.

**Improvement 2: Extend Target Models to Latest**

While existing WikiMIA targeted only GPT-3.5 and LLaMA series, WikiMIA_2024 Hard extends target models to **GPT-4 and GPT-4o**.

**Additional Filtering Criteria:**
- Levenshtein Edit Distance > 0.5 between member/non-member versions (ensures meaningful differences)
- Length difference between two versions within 20% (prevents length-based bias)
- Use only first 256 words of summaries

Construction process: Scraped ~27,000 documents via Wikimedia API → filtered for existence before 2016 and edits after 2024 → deduplicated and filtered by length/edit distance → 1,040 documents remaining → randomly selected 1,000 → final 2,000 samples (1,000 members + 1,000 non-members)

### New Dataset 2: TULU Mix

The **first dataset for evaluating fine-tuning membership inference**. Existing research has almost exclusively focused on pretraining membership.

- **Members:** Instruction-tuning data included in TULU Mix (GPT-4 Alpaca, OASST1, Dolly, Code Alpaca, ShareGPT, etc.)
- **Non-members:** Datasets that were candidates but not selected in final Mix (Baize, Self Instruct, Stanford Alpaca, Unnatural Instructions, Super NI, etc.)
- **Target Models:** TULU 1 (LLaMA 1 7B/13B/30B/65B based), TULU 1.1 (LLaMA 2 7B/13B/70B based)

**Binned Sampling for Length Matching:**
To address the problem of different length distributions between members/non-members:
1. Remove top/bottom 5% outliers
2. Divide into 10 equal bins
3. Uniform sampling from each bin

Final dataset: 924 members, 928 non-members. Only the first conversation turn is used.

---

## 4. Experimental Setup

### Target Models

Use diverse models in terms of size and access level:

**Open-weight Models:**
- **LLaMA 1:** 7B, 13B, 30B, 65B (Meta, February 2023)
- **Pythia:** 1.4B, 2.8B, 6.9B, 12B (Eleuther AI)
- **OLMo:** 1B, 7B, 7B-SFT, 7B-Instruct (Ai2, 07-2024 checkpoint)
- **TULU 1:** LLaMA 1 based 7B/13B/30B/65B
- **TULU 1.1:** LLaMA 2 based 7B/13B/70B

**Closed API Models:**
- **GPT-3.5 Instruct** (`gpt-3.5-turbo-instruct`): knowledge cutoff August 31, 2021
- **GPT-3.5 Turbo** (`gpt-3.5-turbo-0125`, `gpt-3.5-turbo-1106`): knowledge cutoff August 31, 2021
- **GPT-4 Turbo** (`gpt-4-turbo-2024-04-09`): knowledge cutoff end of 2023
- **GPT-4o** (`gpt-4o-2024-04-09`): knowledge cutoff end of 2023
- **GPT-4o mini** (`gpt-4o-mini-0718`): knowledge cutoff end of 2023

### Generation Hyperparameters

| Parameter | Setting |
|-----------|---------|
| Sampling Method | Nucleus sampling |
| Temperature | 1.0 |
| top_p | 0.95 |
| Prefix Ratio | 50% by word count |
| Max Generation Length | Same as suffix token count |
| Number of Generations (BookMIA) | 100 per candidate |
| Number of Generations (Others) | 50 per candidate |
| Aggregation Function | max |
| Validation Set Ratio | 5% (for hyperparameter sweep) |

### Prompt Templates

Different prompts are used for different datasets:

- **BookMIA:** "You will be shown a series of passages from famous literary works... Complete the prefix: {prefix}"
- **WikiMIA / WikiMIA-24 / WikiMIA_2024 Hard:** "Continue the generation as closely to verbatim as possible. {prefix}"
- **Pile / OLMo:** "Continue the text: {prefix}"
- **TULU:** No separate prompt, use first user turn as prefix, model generates full completion

### Baselines

**Black-box:**
- **DE-COP** (Duarte et al., 2024): Paraphrase candidate document (using GPT-4o, temp=0.1) → convert to QA task → judge membership by model answer rate. Uses GPT-4o instead of Claude as paraphraser.

**White-box (for reference):**
- **Loss:** Direct use of prediction loss on candidate text
- **Reference Loss (R-Loss):** Use smallest model in same family as reference (e.g., LLaMA 13B/30B/65B → LLaMA 7B as reference)
- **zlib:** Normalize loss by zlib compression size
- **Min-K%:** Try K in 10%-60% (10% intervals), 6 variants, select best on validation set

### Evaluation Metrics

All experiments use **AUROC (Area Under the ROC Curve)**. Rather than fixed threshold, this threshold-independent metric measures member/non-member separation ability, with higher values indicating stronger attacks.

### Implementation

- Loss-based baselines: HuggingFace Transformers
- Generation (DE-COP, N-Gram Coverage Attack): vLLM
- OpenAI models: OpenAI API

---

## 5. Experimental Results

### 5.1 WikiMIA / WikiMIA-24 / WikiMIA_2024 Hard Results

**WikiMIA Main Results (AUROC):**

| Model | Cov. | Cre. | LCS_c | LCS_w | D-C | Loss | R-Loss | zlib | MinK |
|-------|------|------|-------|-------|-----|------|--------|------|------|
| GPT-3.5-0125 | **0.64** | 0.63 | 0.61 | 0.60 | 0.55 | - | - | - | - |
| GPT-3.5 Inst. | **0.62** | 0.61 | 0.58 | 0.58 | 0.54 | - | - | - | - |
| GPT-3.5-1106 | **0.64** | 0.62 | 0.61 | 0.60 | 0.52 | - | - | - | - |
| LLaMA-7B | **0.60** | 0.59 | 0.56 | 0.55 | 0.48 | 0.62 | - | 0.63 | 0.64 |
| LLaMA-13B | **0.62** | 0.59 | 0.57 | 0.54 | 0.52 | 0.64 | 0.63 | 0.65 | 0.66 |
| LLaMA-30B | **0.63** | 0.62 | 0.57 | 0.58 | 0.49 | 0.66 | 0.69 | 0.67 | 0.69 |
| LLaMA-65B | **0.65** | 0.64 | 0.61 | 0.58 | 0.50 | 0.68 | 0.74 | 0.69 | 0.70 |

**WikiMIA-24 Main Results (AUROC):**

| Model | Cov. | Cre. | LCS_c | LCS_w | D-C | Loss | R-Loss | zlib | MinK |
|-------|------|------|-------|-------|-----|------|--------|------|------|
| GPT-3.5-0125 | **0.67** | **0.67** | 0.64 | 0.66 | 0.48 | - | - | - | - |
| GPT-4 | **0.84** | 0.82 | 0.76 | 0.79 | 0.56 | - | - | - | - |
| GPT-4o-1120 | **0.83** | 0.82 | 0.77 | 0.79 | 0.50 | - | - | - | - |
| GPT-4o Mini | 0.73 | **0.74** | 0.66 | 0.69 | 0.44 | - | - | - | - |
| LLaMA-65B | 0.64 | **0.65** | **0.65** | **0.65** | 0.50 | 0.74 | 0.74 | 0.75 | 0.76 |

**WikiMIA_2024 Hard Main Results (AUROC):**

| Model | Cov. | Cre. | LCS_c | LCS_w | D-C | Loss | R-Loss | zlib | MinK |
|-------|------|------|-------|-------|-----|------|--------|------|------|
| GPT-3.5 Inst. | **0.64** | 0.63 | 0.61 | 0.61 | 0.45 | - | - | - | - |
| GPT-4 | 0.57 | **0.58** | 0.55 | 0.57 | 0.44 | - | - | - | - |
| GPT-4o-1120 | **0.55** | 0.55 | 0.54 | 0.52 | 0.51 | - | - | - | - |
| LLaMA-30B | **0.61** | **0.61** | 0.55 | 0.57 | 0.50 | 0.56 | 0.61 | 0.53 | 0.60 |
| LLaMA-65B | **0.64** | 0.63 | 0.59 | 0.60 | 0.51 | 0.57 | 0.57 | 0.54 | 0.58 |

Key finding: In WikiMIA_2024 Hard, N-Gram Coverage Attack **surpasses white-box attacks on all models**. This shows that output-based methods can be more robust than loss-based methods in harder settings where temporal shift is removed.

### 5.2 BookMIA Results

| Model | Cov. | Cre. | LCS_c | LCS_w | D-C |
|-------|------|------|-------|-------|-----|
| GPT-3.5-0125 | 0.84 | **0.85** | 0.84 | 0.83 | 0.84 |
| GPT-3.5 Inst. | 0.91 | 0.91 | 0.92 | **0.93** | 0.68 |
| GPT-3.5-1106 | 0.84 | **0.85** | 0.83 | 0.84 | **0.85** |

BookMIA shows high performance across all black-box methods, but N-Gram Coverage Attack (0.91–0.93) significantly outperforms DE-COP (0.68) on GPT-3.5 Instruct. Since these are closed models, white-box baselines are not computable.

### 5.3 TULU (Fine-tuning Membership) Results

| Model | Cov. | Cre. | LCS_c | LCS_w | D-C | Loss | R-Loss | zlib | MinK |
|-------|------|------|-------|-------|-----|------|--------|------|------|
| TULU-7B | **0.79** | **0.79** | 0.73 | 0.74 | 0.48 | 0.84 | - | 0.81 | 0.84 |
| TULU-13B | **0.80** | **0.80** | 0.74 | 0.76 | 0.47 | 0.87 | 0.63 | 0.83 | 0.87 |
| TULU-30B | **0.82** | **0.82** | 0.76 | 0.77 | 0.52 | 0.87 | 0.54 | 0.84 | 0.87 |
| TULU-65B | 0.85 | **0.86** | 0.80 | 0.80 | 0.45 | 0.92 | 0.68 | 0.90 | 0.92 |
| TULU-1.1-7B | 0.72 | **0.73** | 0.70 | 0.71 | 0.47 | 0.77 | - | 0.74 | 0.76 |
| TULU-1.1-13B | **0.76** | 0.75 | 0.71 | 0.72 | 0.43 | 0.81 | 0.58 | 0.78 | 0.81 |
| TULU-1.1-70B | **0.79** | 0.78 | 0.75 | 0.77 | 0.45 | 0.86 | 0.64 | 0.84 | 0.86 |

Fine-tuning membership inference is also effective. N-Gram Coverage Attack significantly outperforms DE-COP across all models and achieves approximately 90% of white-box performance. TULU 1.1 models show higher resistance compared to same-sized TULU 1 models, and Reference Loss performance drops significantly in the fine-tuning setting.

### 5.4 Pythia/Pile and OLMo/Dolma Results

**Pythia on Pile (AUROC):**

| Model | Cov. | Cre. | LCS_c | LCS_w | D-C | Loss | R-Loss | zlib | MinK |
|-------|------|------|-------|-------|-----|------|--------|------|------|
| Pythia 1.4B | 0.53 | 0.53 | 0.51 | 0.52 | 0.50 | 0.54 | 0.56 | 0.53 | 0.54 |
| Pythia 2.8B | 0.54 | 0.54 | 0.49 | 0.50 | 0.50 | 0.54 | 0.58 | 0.54 | 0.54 |
| Pythia 6.9B | 0.53 | 0.53 | 0.50 | 0.51 | 0.50 | 0.55 | 0.60 | 0.55 | 0.55 |
| Pythia 12B | 0.54 | 0.54 | 0.52 | 0.51 | 0.50 | 0.56 | 0.62 | 0.55 | 0.56 |

**OLMo on Dolma (AUROC):**

| Model | Cov. | Cre. | LCS_c | LCS_w | D-C | Loss | R-Loss | zlib | MinK |
|-------|------|------|-------|-------|-----|------|--------|------|------|
| OLMo-1B | 0.54 | 0.54 | 0.51 | 0.50 | 0.49 | 0.47 | - | 0.51 | 0.45 |
| OLMo-7B | 0.54 | 0.54 | 0.54 | 0.51 | 0.50 | 0.47 | 0.53 | 0.51 | 0.46 |
| OLMo-7B-SFT | 0.52 | 0.52 | 0.53 | 0.51 | 0.50 | 0.47 | 0.53 | 0.51 | 0.46 |
| OLMo-7B-Instruct | 0.52 | 0.52 | 0.52 | 0.51 | 0.50 | 0.47 | 0.52 | 0.51 | 0.46 |

Pile and Dolma are very challenging benchmarks for all methods. Nevertheless, N-Gram Coverage Attack consistently outperforms DE-COP and **surpasses white-box baselines on some OLMo models** (OLMo-1B: Cov 0.54 vs Loss 0.47, MinK 0.45).

---

## 6. Ablation Study

Analysis of key hyperparameter impacts using BookMIA + GPT-3.5-0125 + max aggregation as baseline.

### 6.1 Scaling with Number of Generations

![Generation Count Scaling](/images/papers/ngram-coverage-mia/num_sequences.png)
*Figure 2 (top): AUROC improves consistently across all metrics as generation count increases.*

As generation count increases, AUROC consistently improves across all n-gram metrics. More samples better approximate the model's true output distribution. This scaling trend is consistently observed across other datasets as well.

### 6.2 Performance by Prefix Ratio

![Prefix Ratio](/images/papers/ngram-coverage-mia/num_proportion_from_end.png)
*Figure 2 (middle): With fixed token budget, 50% prefix achieves optimal performance.*

Under fixed token budget (generation length = suffix length), 50% prefix ratio consistently achieves optimal performance across all metrics. While more context helps, excessive prefix length reduces both suffix and generation length, degrading performance.

### 6.3 Temperature Impact

![Temperature](/images/papers/ngram-coverage-mia/temperature.png)
*Figure 2 (bottom): Temperature around 1.0 is optimal across all metrics.*

Temperature 1.0 consistently achieves optimal performance. Higher temperature promotes diversity and may elicit hidden memories, but too high distorts the true distribution. The balance point of this tradeoff is around 1.0.

---

## 7. Computational Efficiency Comparison

N-Gram Coverage Attack is significantly more efficient than DE-COP:

**DE-COP Token Budget:** For candidate document length n:
- Paraphrase generation: input approximately n, output approximately 3n
- QA task: 24 generations, each with input approximately 4n, output 1
- **Total approximately 100n tokens/document**
- Additionally requires external paraphraser model (Claude/GPT-4o)

**N-Gram Coverage Attack Token Budget:** For prefix index k and generation count d:
- **Total d × n tokens/document** (d=50 means 50n)
- No external model required, uses only target model

Practical measurement: WikiMIA_2024 Hard + LLaMA models + d=50, DE-COP takes **average 2.6x longer** than N-Gram Coverage Attack while achieving significantly lower performance.

---

## 8. Key Findings Summary

1. **Black-box methods match white-box:** Simple n-gram metrics using only text output achieve performance equal to or exceeding loss-based methods accessing model internals. Especially in WikiMIA_2024 Hard, surpass white-box across all models.

2. **Coverage and Creativity consistently outperform LCS:** Due to considering multiple matches and length normalization. Coverage shows slight advantage in low-match settings, Creativity in high-match settings.

3. **Newer models (GPT-4o) show higher resistance:** GPT-4o demonstrates higher resistance to membership inference than older models, suggesting an improving trend in privacy protection.

4. **Fine-tuning membership inference is also effective:** On TULU dataset, both pretraining and fine-tuning data membership can be determined with high accuracy.

5. **Attack performance scales with compute budget:** Increasing generation count leads to sustained performance improvement, enabling cost-performance tradeoffs.

---

## 9. Significance and Limitations

### Significance
N-Gram Coverage Attack provides a practical tool for LLM privacy audits. It can detect critical concerns that arise when models train on web-scale data, such as PII exposure and copyright content reproduction. Notably, it applies to API-only models, making it valuable for monitoring deployed models and proactively identifying memorization risks.

### Limitations
- Performance remains low on datasets like Pile/Dolma, where challenging settings still exist
- Generation-based approach incurs API call costs (white-box methods only require single forward pass)
- Hyperparameters like temperature and prefix ratio may be sensitive to different datasets/models
