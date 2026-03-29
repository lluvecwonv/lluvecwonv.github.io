---
title: "The Mosaic Memory of Large Language Models - Paper Analysis"
date: 2026-03-29
summary: "Analysis of a paper demonstrating that LLMs memorize by assembling information from similar sequences (fuzzy duplicates), a phenomenon called 'mosaic memory'. Across Llama-3.2, Phi-2, Gemma-2, and GPT-Neo, fuzzy duplicates with 10% token replacement contribute ρ=0.50–0.60 of an exact duplicate's memorization impact, and even 50% replacement yields ρ=0.15–0.19. The mosaic memory is shown to be predominantly syntactic rather than semantic, and fuzzy duplicates are found to be ubiquitous in real-world training data."
tags: [LLM, Memorization, Fuzzy Duplicate, Mosaic Memory, Privacy, MIA, Deduplication, SlimPajama, Research Note]
category: Research Note
language: en
---

# The Mosaic Memory of Large Language Models

**Authors:** Igor Shilov*, Matthieu Meeus*, Yves-Alexandre de Montjoye
**Affiliation:** Imperial College London
**Paper Link:** [GitHub](https://github.com/computationalprivacy/mosaic_memory)

---

## One-Line Summary

LLMs do not only memorize **exact repetitions** in training data; they have a **mosaic memory** — an ability to memorize sequences from text with **partially overlapping fragments (fuzzy duplicates)** — and this memorization is predominantly **syntactic** rather than **semantic**.

---

## 1. Overview and Motivation

The mechanism by which LLMs memorize training data has predominantly been understood as **exact, or verbatim**. Current studies have shown that a piece of content repeated *exactly* several times in the training data has a much higher chance to be memorized. This understanding has led model developers to implement **data deduplication** techniques to improve model utility, mitigate privacy and confidentiality risks, and decontaminate benchmark data. However, the presumed verbatim nature of memorization has led most mitigation strategies to rely on removing **exact repetitions** of sequences of text.

This paper argues that viewing LLM memorization solely through the lens of exact repetitions is **incorrect**. Instead, it shows LLMs to have a **mosaic memory** — an ability to memorize sequences from text with partially overlapping fragments (**fuzzy duplicates**).

The practical implications are significant: current industry-standard deduplication techniques based on exact n-gram matching (e.g., 13-gram overlaps used in GPT-3 evaluations, substring matching of 50 tokens) fail to eliminate fuzzy duplicates, providing **insufficient privacy protection, incomplete benchmark decontamination, and suboptimal data preprocessing**.

---

## 2. Framework for Quantifying Mosaic Memory

### 2.1 Core Concepts

The paper introduces a framework to measure how an LLM memorizes fuzzy duplicates **relative to exact duplicates** in its training data.

**Canary-based approach:** Following prior work, memorization is quantified by measuring the performance of **Membership Inference Attacks (MIAs)** on artificially crafted sequences known as **canaries**.

- **Reference canaries** $\{X_{\text{ref}}^i \mid i = 1, \ldots, C\}$: Synthetically generated using Llama-2 7B at temperature $\mathcal{T}=1.0$, each containing exactly 100 tokens ($|T(X_{\text{ref}}^i)|=100$), with $C=200$ total (100 members + 100 non-members)
- **Fuzzy duplicate generation:** Algorithm $\mathcal{A}$ systematically modifies each reference canary to produce $n_{\text{dup}}=10$ fuzzy duplicates

**Experimental protocol:**

1. For each reference canary $X_{\text{ref}}^i$, flip a fair coin to determine $b_i \sim \{0, 1\}$
2. If $b_i = 1$, inject the reference canary and its fuzzy duplicates into training dataset $D$
3. Further train a pretrained LLM $\textit{LM}_0$ on $D$ to yield target model $\textit{LM}$
4. Apply MIAs to compute membership score $\alpha(X_{\text{ref}}^i)$
5. Quantify memorization using ROC AUC $\tilde{\phi}$

### 2.2 Exact Duplicate Equivalent (ρ)

The key metric is the **exact duplicate equivalent** $\rho$.

- First, measure MIA performance $\phi_{\nu}$ when injecting $\nu \in \{1, \ldots, n_{\text{dup}}\}$ exact copies in the same experimental setup
- Determine $\nu_{\text{eq}}$ such that $\tilde{\phi} \approx \phi_{\nu_{\text{eq}}}$
- Normalize $\nu_{\text{eq}}$ by the total number of fuzzy duplicates to get $\rho$

**Interpretation:**
- $\rho = 1$: A single fuzzy duplicate contributes to memorization as much as an exact duplicate
- $\rho = 0$: The fuzzy duplicate has no impact on memorization

This design is **invariant to the absolute level of memorization**, which is known to be highly sensitive to model characteristics (number of parameters), training procedures (learning rate), and sequence properties (length, perplexity).

---

## 3. Experiment 1: Fuzzy Duplicates via Token Replacement ($\mathcal{A}_{\text{replace}}$)

### 3.1 Experimental Setup

**Target models:** Llama-3.2-1B (Meta), Phi-2 (Microsoft), Gemma-2B (Google), GPT-Neo 1.3B (EleutherAI)

**Fuzzy duplicate generation ($\mathcal{A}_{\text{replace}}$):**
- Replace $R$ randomly chosen tokens from the 100-token reference canary
- $R = \{1, 5, 10, 15, 20, 25, 50, 75\}$
- Replacement tokens sampled uniformly from top-$k$ predictions of a masked language model (RoBERTa, vocabulary size 50,000)
- Default: $k = |\mathcal{V}_{\textit{MLM}}|$ (effectively random replacement)

**Training data:** 100 public domain books collected from Project Gutenberg as base dataset $D_{\text{orig}}$

### 3.2 Key Results

![LLMs have a mosaic memory](/images/papers/mosaic-memory/neq_vs_R_all_models_big.png)
*Figure 1: The exact duplicate equivalent ρ for fuzzy duplicates across number of replacements R. For all models, ρ remains consistently above 0 until all tokens are replaced (R=100).*

| Tokens Replaced (R) | GPT-Neo 1.3B (ρ) | Llama-3.2-1B (ρ) | Phi-2 (ρ) | Gemma-2B (ρ) |
|---|---|---|---|---|
| R = 10 (10%) | 0.60 | 0.60 | 0.50 | 0.50 |
| R = 20 (20%) | ~0.35 | ~0.35 | ~0.30 | ~0.30 |
| R = 50 (50%) | 0.19 | ~0.18 | 0.15 | 0.15 |

**Key findings:**
- $\rho$ decreases **gradually** with the number of replaced tokens $R$, consistently finding $\rho > 0$ until all tokens are replaced ($R=100$)
- Fuzzy duplicates with 10% tokens replaced contribute $\rho = 0.50$–$0.60$ — **in practice, having two fuzzy duplicates with 10% tokens replaced in the training data yields higher memorization than one exact repetition**
- Even with 50% tokens replaced, $\rho$ remains significantly above zero at $0.15$–$0.19$
- Results are **remarkably consistent** across models with substantially different original training data, benchmark performance, and architectures (GPT-Neo 1.3B vs. Llama-3.2-1B)

### 3.3 Ablation Studies

The paper confirms robustness across:

- **3 state-of-the-art MIA methodologies** (Yeom et al., Carlini et al., Shi et al.)
- **Different initial learning rates**
- **Different model sizes**
- **Different reference canary generation strategies** (temperature $\mathcal{T} = 1.0, 2.5, 5.0$)
- Token position selection strategies have **limited impact**

---

## 4. Experiment 2: Fuzzy Duplicates via Token Insertion ($\mathcal{A}_{\text{insert}}$)

### 4.1 Experimental Setup

$\mathcal{A}_{\text{insert}}$ preserves the original tokens while splitting the tokenized reference canary into $n$-grams and inserting $X_{\text{insert}}$ random tokens between each n-gram.

- $n = \{1, 2, 5, 10, 20\}$: n-gram size
- $X_{\text{insert}} = \{1, 2, 5, 10\}$: number of inserted tokens
- **Baseline:** $X_{\text{insert}} = \infty$ (n-grams randomly scattered throughout the training dataset)

### 4.2 Key Results

![Insertion experiment](/images/papers/mosaic-memory/insertion_exp.png)
*Figure 2(a): The exact duplicate equivalent ρ for fuzzy duplicates when n-grams are separated by $X_{\text{insert}}$ random tokens.*

| n-gram Size | $X_{\text{insert}}$ | ρ | Baseline ($X_{\text{insert}}=\infty$) |
|---|---|---|---|
| 20-gram | 1 | 0.84 | 0.41 |
| 20-gram | 10 | 0.64 | 0.41 |
| 1-gram (individual tokens) | 1 | 0.22 | 0 |

**Key findings:**
- LLMs exhibit a **remarkable robustness in skipping irrelevant tokens**
- With 1 noise token inserted between all 20-grams, $\rho = 0.84$, significantly larger than the baseline $\rho = 0.41$
- Even in the extreme case of individual tokens separated by 1 random token ($n=1, X_{\text{insert}}=1$), $\rho = 0.22$, far exceeding the baseline of $\rho = 0$
- **Hypothesis:** This robustness may derive from the **attention mechanism**, which could allow the LLM to assign low attention scores to inserted tokens, effectively filtering them out as noise

---

## 5. Experiment 3: Fuzzy Duplicates via Token Shuffling ($\mathcal{A}_{\text{shuffle}}$)

### 5.1 Experimental Setup

$\mathcal{A}_{\text{shuffle}}$ partitions reference canaries into $n$-grams ($n = \{2, 5, 10\}$), then randomly permutes these n-grams while maintaining original token order within each n-gram.

The degree of permutation is measured using the **normalized Kendall tau distance** ($\tau$):

$$\tau = \frac{\Delta}{L(L-1)/2}$$

where $L$ is the total number of tokens and $\Delta$ is the number of discordant pairs.

- $\tau = 0$: Original order preserved (no shuffling)
- $\tau = 1$: Exact reversal

### 5.2 Key Results

![Shuffle experiment](/images/papers/mosaic-memory/kendall.png)
*Figure 2(b): The exact duplicate equivalent ρ for fuzzy duplicates obtained by shuffling n-grams, as a function of Kendall-Tau distance.*

| Kendall-Tau ($\tau$) | n=10 ρ | n=10 Baseline ($X_{\text{insert}}=\infty$) |
|---|---|---|
| 0.1 (10% pairs inverted) | ~0.55 | 0.321 |
| 0.5 (50% pairs inverted) | 0.411 | 0.321 |

**Two key insights:**

1. **High sensitivity to ordering:** With only 10% of token pairs having their relative order inverted ($\tau = 0.1$), $\rho$ drops from 1 to approximately 0.55
2. **Memorization remains above baseline:** Even with 50% of pairs inverted ($\tau = 0.5$), for 10-grams $\rho = 0.411$, still significantly higher than the baseline of $\rho = 0.321$ — the model retains the shared vocabulary across fuzzy duplicates despite minimal preserved ordering

---

## 6. Mosaic Memory is Syntactic Rather Than Semantic

### 6.1 Experiment: Varying Semantic Coherence

**Design:** Vary the semantic similarity of replacement tokens in $\mathcal{A}_{\text{replace}}$ by changing $k$ in RoBERTa MLM's top-$k$ predictions.
- $k = 10$: Semantically very similar replacement (e.g., 'control' → 'tempo')
- $k = |\mathcal{V}_{\textit{MLM}}|$: Effectively random replacement (semantic meaning significantly distorted)

![Semantic coherence experiment](/images/papers/mosaic-memory/mlm_topk_exp.png)
*Figure 3: The exact duplicate equivalent ρ for fuzzy duplicates when tokens are replaced with a token sampled from the top-k predictions of the masked language model.*

**Key results:**
- Semantically similar tokens ($k=10$) consistently yield higher $\rho$ than random tokens ($k=|\mathcal{V}_{\textit{MLM}}|$), but the impact is **notably small compared to syntactic changes**
- For $R=20$ replacements, using $k=10$ only increases $\rho$ by 0.06 (from 0.35 to 0.41) compared to random tokens
- This semantic gain of 0.06 is smaller than replacing just 5 more tokens while keeping semantic meaning intact ($R=25, k=10$: $\rho=0.33$)
- **Conclusion: The mosaic memory is more syntactic — the model memorizes the connection between specific, overlapping tokens across fuzzy duplicates — than it is semantic**

### 6.2 Experiment: Comparison to Paraphrasing

**Design ($\mathcal{A}_{\text{paraphrase}}$):** Use instruction-tuned LLMs to **paraphrase** reference canaries, preserving semantic meaning without explicitly controlling token overlap.

**Models used:** Llama-3-8B, Mistral-7B, GPT-4o

| Paraphrasing Model | ρ | 1-gram Overlap | 2-gram Overlap | 4-gram Overlap |
|---|---|---|---|---|
| Llama-3-8B | 0.11 | 39.02 ± 19.97 | 17.68 ± 15.39 | 7.97 ± 9.95 |
| Mistral-7B | 0.17 | 49.52 ± 20.50 | 26.28 ± 17.83 | 12.85 ± 13.87 |
| GPT-4o | 0.30 | 70.70 ± 18.73 | 45.63 ± 23.15 | 27.89 ± 22.89 |

**Key findings:**

- $\rho$ for paraphrases is relatively **low** (0.11–0.30), remarkably low compared to random token replacement at 20% ($R=20, k=|\mathcal{V}_{\textit{MLM}}|$: $\rho=0.35$)
- Fuzzy duplicates with 20% of tokens replaced by random ones — where semantic meaning is significantly distorted — contribute **more** to memorization than any paraphrased fuzzy duplicates
- **Strict positive correlation between n-gram overlap and ρ**: GPT-4o paraphrases show the highest $\rho$ because they have the highest n-gram overlap (mean 4-gram overlap of 27.89)
- **Conclusion:** The memorization observed in paraphrases can be largely explained by **syntactic (token) overlap** rather than shared semantic meaning

---

## 7. Fuzzy Duplicates in Real-World Training Corpora

### 7.1 Experimental Setup

**Target dataset:** SlimPajama (627B tokens, 895GB) — derived from RedPajama, with document-level deduplication using Jaccard similarity based on 13-grams at threshold 0.8, removing 49.6% of all bytes

**Distance metrics:**
- **Levenshtein distance:** Minimum number of single-character edits (replacements, insertions, deletions) to transform one sequence into another. Captures $\mathcal{A}_{\text{replace}}$, $\mathcal{A}_{\text{insert}}$, and effectively $\mathcal{A}_{\text{shuffle}}$
- **Hamming distance:** Number of positions where corresponding tokens differ. Directly corresponds to $\mathcal{A}_{\text{replace}}$

**Analysis method:**
- Select 100 sequences repeated exactly 1,000 (±1%) times in SlimPajama (over 700,000 such sequences exist in the dataset)
- Scan 5% of the dataset and extrapolate (reasonable since the dataset is randomly shuffled)

### 7.2 Key Results

| Levenshtein Distance | Avg. Fuzzy Duplicates | Corresponding ρ Range |
|---|---|---|
| 0 (exact) | ~1,000 (by selection) | 1.0 |
| ≤ 10 | ~5,000 (+4,000 fuzzy) | 0.6–1.0 |
| ≤ 50 | > 20,000 | 0.2–0.4 |

**Key findings:**
- Beyond the baseline of 1,000 exact duplicates, approximately **4,000 additional fuzzy duplicates** exist at Levenshtein distance ≤ 10
- At this distance range, $\rho$ is between $0.6$–$1.0$, indicating these fuzzy duplicates **significantly contribute to memorization, with their cumulative impact likely outweighing that of exact repetitions**
- At Levenshtein distance ≤ 50, the number expands to over **20,000** — more than 20× the original exact duplicates
- Even using the more conservative Hamming distance, approximately 5,000 fuzzy duplicates at distance 20 and 10,000 at distance 40

### 7.3 Deduplication Analysis

![Deduplication analysis](/images/papers/mosaic-memory/cum_near_duplicates_dedup.png)
*Figure 4: The number of fuzzy duplicates in SlimPajama impacted by varying levels of sequence-level deduplication.*

**$n=50$ deduplication (industry standard):**
- Successfully removes substantial fuzzy duplicates at low Levenshtein distances (≤ 10)
- However, at Levenshtein distance 20, an average of **2,500 fuzzy duplicates per sequence persist**, increasing to **6,000** at distance 30
- These remaining fuzzy duplicates still contribute substantially to memorization ($\rho > 0.3$)

**$n=25$ deduplication (GPT-3 benchmark decontamination level):**
- More aggressive than 50-gram, but thousands of fuzzy duplicates remain at Levenshtein distances 20–50
- In this range, $\rho \geq 0.2$

**$n=20$ deduplication (most aggressive):**
- May help remove the most impactful fuzzy duplicates but likely introduces **significant trade-offs** in valuable data removal

---

## 8. Discussion

### 8.1 Impact on Privacy and Confidentiality

- LLMs are exposed to sensitive information during both pretraining (public internet data) and posttraining (healthcare records, conversations, licensed publisher data)
- Sequence-level deduplication at $n=50$ has been applied as a mitigation strategy, but **this paper shows that failing to account for fuzzy duplicates leads to a substantial increase in MIA risk**
- As protection against MIAs also implies protection against reconstruction and inference attacks, results are reasonably expected to generalize to extraction attacks
- Recent work argues that studying verbatim regurgitation alone is too restrictive and does not address risks associated with generating sequences highly similar to training data

### 8.2 Impact on Benchmark Decontamination

- GPT-3: Decontamination at ~25 token overlap equivalent
- PaLM: Removes samples with ≥70% overlap in 8-grams
- GPT-4: Excludes samples where any of 3 random 50-character sequences overlap
- Llama-2: Filters at 10-gram level with 20% token overlap threshold and 4-token skipgram budget
- **This paper's results show that exact n-gram deduplication alone fails to eliminate all fuzzy duplicates**, and more granular approaches like Llama-3's are needed but not yet widely adopted

### 8.3 Implications for (Adversarial) Canaries

- Copyright traps and GUID strings used as canaries can be trivially removed by standard deduplication
- **The mosaic memory could be leveraged to design canaries that are resistant to deduplication while still being meaningfully memorized**
- Conversely, similar techniques could be exploited to induce memorization of biased opinions or misinformation

---

## 9. Limitations and Future Directions

- Analysis based on 5% dataset sampling rather than full scan; thorough quantification requires further research
- Hypothesis that more aggressive syntactic deduplication may be more effective than semantic deduplication for training efficiency — requires future validation
- Levenshtein/Hamming distance-based deduplication is computationally expensive when applied to entire datasets

---

## 10. Overall Assessment

This paper makes an important contribution by challenging the dominant assumption that **"exact repetition = memorization"** in LLMs. Through the concept of mosaic memory, it systematically demonstrates across four major models that LLMs assemble memorized information from partially overlapping text fragments. The finding that memorization is syntactic rather than semantic is particularly significant, suggesting that current deduplication strategies may be fundamentally insufficient.

The implications span critically important areas — privacy protection, benchmark decontamination, and data preprocessing — highlighting the urgent need for more sophisticated deduplication techniques that account for fuzzy duplicates.
