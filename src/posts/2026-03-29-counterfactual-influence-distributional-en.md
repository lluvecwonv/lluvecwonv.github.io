---
title: "Counterfactual Influence as a Distributional Quantity - Paper Analysis"
date: 2026-03-29
summary: "ICML 2025 paper showing that self-influence alone severely underestimates memorization risks in the presence of near-duplicates. Computing the full influence matrix with 1,000 GPT-Neo 1.3B models on Natural Questions, records with near-duplicates have 3x lower self-influence but 5x higher extractability (BLEU). The proposed Top-1 Influence Margin effectively distinguishes unique records from those with near-duplicates. On CIFAR-10, influence distributions alone reveal natural near-duplicates."
tags: [LLM, Memorization, Counterfactual Influence, Near-Duplicate, Extractability, Privacy, ICML 2025, Research Note]
category: Research Note
language: en
---

# Counterfactual Influence as a Distributional Quantity

**Venue:** ICML 2025
**Authors:** Matthieu Meeus, Igor Shilov, Georgios Kaissis, Yves-Alexandre de Montjoye
**Affiliations:** Imperial College London, Google DeepMind

---

## One-Line Summary

**Self-influence** alone severely underestimates memorization risks when near-duplicates are present. Memorization is a **multi-faceted phenomenon** better captured by the **full influence distribution** than by self-influence alone.

---

## 1. Introduction and Motivation

Studying how LLMs memorize training data is crucial for understanding generalization, privacy risks, copyright concerns, and benchmark contamination. The standard metric for quantifying memorization is **counterfactual self-influence** (Zhang et al., 2023), which measures how much a model's prediction for a sample changes when that sample is excluded from training.

However, recent work (Shilov et al., Mosaic Memory) has shown that LLMs memorize substantially across **near-duplicates**, which are widespread in LLM training data. This raises a fundamental question: **can memorization of a piece of text be viewed in isolation, i.e., by just looking at self-influence?**

This paper investigates memorization by considering how the **entire training dataset** impacts the model's predictions on the target sample, treating **counterfactual influence as a distributional property**.

---

## 2. Background: Counterfactual Influence

Following Zhang et al. (2023), the counterfactual influence of training example $x_i$ on target $x_t$:

$$\mathcal{I}(x_i \Rightarrow x_t) = \underset{A_j: x_i \notin D_j}{\mathbb{E}} \left[\mathcal{L}_{A_j}(x_t)\right] - \underset{A_j: x_i \in D_j}{\mathbb{E}}\left[\mathcal{L}_{A_j}(x_t)\right]$$

where $A_j$ is a model trained on $D_j$, and $\mathcal{L}_{A_j}(x_t)$ is its loss on $x_t$. A positive value indicates $x_i$ **reduces the loss** (improves prediction) for $x_t$.

- **Self-influence:** $\mathcal{I}(x_t \Rightarrow x_t)$ = counterfactual memorization
- **This paper's key insight:** Analyze the **full distribution** $\mathcal{I}(x_i \Rightarrow x_t)$ for all $x_i$, not just self-influence

**Near-duplicate effect:** When the data distribution contains many near-duplicates $x_t'$ of $x_t$, these duplicates are likely included in both the sets where $x_t \in D_j$ and where $x_t \notin D_j$. If these near-duplicates strongly influence model behavior on $x_t$, the **marginal effect of including $x_t$ itself gets diminished**.

---

## 3. Experimental Setup

### 3.1 Model and Dataset

- **Model:** GPT-Neo 1.3B (further pretrained)
- **Dataset:** Natural Questions subset
- **Each record:** $x_i = (q_i, a_i)$ — question-answer pair, concatenated as "Q: {$q_i$} A: {$a_i$}"
- **Training:** bfloat16, 3 epochs, LR 2e-4, batch size 50, max sequence length 100

### 3.2 Target Dataset Construction

**Unique records ($D_{\text{unique}}$):** 1,000 random samples from Natural Questions

**Near-duplicate records:** 100 additional records $c_i$, each with $n_{\text{dup}} = 5$ near-duplicates
- $c_{i1} = a_i$: original ground truth answer
- Remaining 4: Generated via $\mathcal{A}_{\text{replace}}$ from Shilov et al. (2024) — replacing one randomly selected token with another random token from the model's vocabulary

**Total target dataset $D_t$:** $N_t = 1,500$ records (1,000 unique + 500 near-duplicate)

### 3.3 Computing the Influence Matrix: Why 1,000 Models Are Needed

The influence $\mathcal{I}(x_i \Rightarrow x_t)$ is an **expectation**. A single model gives only one loss value for "$x_i$ included" — far too noisy for reliable estimation. Therefore, **many models must be trained to approximate the expectation**.

**Concrete procedure:**

**Step 1. Generate the partition matrix**

Create a binary matrix $P \in \{0, 1\}^{1500 \times 1000}$ (1,500 records × 1,000 models). Each entry $p_{ij}$ is sampled **independently with probability 0.5**:

$$p_{ij} = \begin{cases} 1 & \text{(include record } x_i \text{ in model } A_j\text{'s training data)} \\ 0 & \text{(exclude)} \end{cases}$$

Each model $A_j$'s training set $D_j$ thus contains **~750 records on average**, with different records included for different models.

**Step 2. Train 1,000 models**

Fine-tune GPT-Neo 1.3B on each $D_j$, producing 1,000 distinct models.

**Step 3. Measure loss for all records on all models**

For each trained model $A_j$, compute the loss $\mathcal{L}_{A_j}(x_t)$ for **all 1,500 records** $x_t$. This yields a $1500 \times 1000$ loss matrix.

**Step 4. Estimate influence — the key trick**

To estimate the influence of a specific pair $(x_i, x_t)$:

- Among the 1,000 models, those where **$x_i$ was included** (~500 models): compute the mean of $\mathcal{L}_{A_j}(x_t)$
- Among the 1,000 models, those where **$x_i$ was excluded** (~500 models): compute the mean of $\mathcal{L}_{A_j}(x_t)$

$$\hat{\mathcal{I}}(x_i \Rightarrow x_t) = \underset{j: p_{ij}=0}{\text{mean}}[\mathcal{L}_{A_j}(x_t)] - \underset{j: p_{ij}=1}{\text{mean}}[\mathcal{L}_{A_j}(x_t)]$$

This estimates **how much $x_i$ reduces the loss on $x_t$** (i.e., how much it helps).

**Why this method is efficient:**

The key insight is that **the same 1,000 models can estimate all $(x_i, x_t)$ pairs simultaneously**. Each model $A_j$ contributes information about every record pair through the partition matrix's $j$-th column. This fills the entire $1,500 \times 1,500 = 2,250,000$ influence matrix.

**For self-influence:** When $x_i = x_t$, this becomes "the difference in loss on itself when included vs. excluded from training" — these are the diagonal entries. They are estimated from the same 1,000 models.

**Result:** The complete influence matrix $I \in \mathbb{R}^{1500 \times 1500}$, where diagonal = self-influence, off-diagonal = cross-influence.

### 3.4 Measuring Extraction

- **BLEU score:** Prompt model with "Q: {$q_i$} A:" → greedy decoding → compare generated answer with ground truth
- High BLEU = approximate extraction of training data

---

## 4. Key Results

### 4.1 Influence Matrix Visualization

![Influence matrix](/images/papers/counterfactual-influence-dist/influence_matrix_GPT1.3B_zoomed.png)
*Figure 1(a): Full influence matrix $I$. The diagonal (self-influence) is the most prominent pattern.*

- **Diagonal pattern:** Self-influence values tend to be larger than others
- Off-diagonal influence varies widely: up to +2 (improving prediction) or negative (degrading prediction)

### 4.2 Influence Distribution: Unique vs Near-Duplicate

![Unique record influence distribution](/images/papers/counterfactual-influence-dist/influence_distribution_1201.png)
*Figure 1(b): Influence distribution for a unique record $x_t$. Self-influence is the clear maximum.*

![Near-duplicate record influence distribution](/images/papers/counterfactual-influence-dist/influence_distribution_123.png)
*Figure 1(c): Influence distribution for a record $x_t$ with near-duplicates. Multiple samples show similarly large influence.*

**Key difference:**
- **Unique record:** Self-influence is the clear dominant peak; all others broadly distributed
- **Near-duplicate record:** Self-influence still largest, but **4 near-duplicates show similarly large influence** → influence is diffused

### 4.3 Core Statistics Comparison

| Metric | Unique Records | Records with Near-Duplicates |
|---|---|---|
| **Self-influence** $\mathcal{I}(x_t \Rightarrow x_t)$ | $1.410 \pm 0.568$ | $0.495 \pm 0.133$ |
| **BLEU score** (extractability) | $0.070 \pm 0.142$ | $0.363 \pm 0.313$ |
| **Top-1 Influence Margin** $\text{IM}(x_t)$ | $9.1 \pm 7.1$ | $1.3 \pm 0.3$ |

**Three key findings:**

1. **Self-influence 3× lower:** Records with near-duplicates have self-influence of $0.495$ vs $1.410$ for unique records. The marginal contribution of the target record itself diminishes when near-duplicates are present.

2. **Extractability 5× higher:** Despite lower self-influence, the mean BLEU score for near-duplicate records is **5× higher** ($0.363$ vs $0.070$). **Relying solely on self-influence severely underestimates tangible memorization risks.**

3. **Top-1 Influence Margin discriminates effectively:** The ratio of the largest to second-largest influence is $9.1$× for unique records (self-influence dominates) vs $1.3$× for near-duplicates (multiple competing influences). **More effective than self-influence at distinguishing unique records from those with near-duplicates.**

### 4.4 Top-1 Influence Margin (IM) Definition

$$\text{IM}(x_t) = \frac{\max_i \mathcal{I}(x_i \Rightarrow x_t)}{\max_{i \neq i^*} \mathcal{I}(x_i \Rightarrow x_t)}$$

where $i^* = \arg\max_i \mathcal{I}(x_i \Rightarrow x_t)$. Captures how dominant the most influential training sample is.

### 4.5 BLEU Score Examples

| Record Type | Example Question | BLEU |
|---|---|---|
| Regular member (included once) | "what age did brett favre retire from football" | 0.086 |
| Member with near-duplicates | "where did the name chilean sea bass come from" | 0.499 |
| Held-out (not trained) | "who played legolas in lord of the rings" | 0.062 |

Records with near-duplicates don't produce exact reproductions, but generate answers with **substantial overlap** — key phrases like "making it attractive to the American market" are preserved.

---

## 5. Validation on CIFAR-10

### 5.1 Setup

- **Model:** ResNet, $M = 1,000$ models
- **Dataset:** $N_t = 20,000$ randomly sampled records from CIFAR-10
- **Full influence matrix** $I$ computed

### 5.2 Results

![CIFAR-10 target](/images/papers/counterfactual-influence-dist/target_12951_cifar.png)
*Figure 2(a): Target $x_t$ with the smallest Top-1 Influence Margin*

![CIFAR-10 most influential](/images/papers/counterfactual-influence-dist/target_14753_cifar.png)
*Figure 2(b): Most influential sample $x_i \neq x_t$ — a visually compelling near-duplicate*

![CIFAR-10 influence distribution](/images/papers/counterfactual-influence-dist/influence_distribution_cifar_12951.png)
*Figure 2(c): Full influence distribution for target $x_t$*

**Finding:** The target with the lowest Top-1 Influence Margin has a most-influential sample that is a **natural, visually compelling near-duplicate**. This pattern confirmed across all top-6 targets with lowest IM.

**Implication:** Even without artificially crafted near-duplicates, **influence distributions alone can identify near-duplicates in real-world datasets**.

---

## 6. Discussion and Implications

### 6.1 Limitations of Self-Influence

The paper's central message: **Self-influence alone does not capture tangible memorization risks when near-duplicates are present.**
- Low self-influence can coexist with high extractability
- Privacy and copyright risk assessments relying solely on self-influence are unreliable

### 6.2 Value of the Distributional Perspective

Analyzing the full influence distribution enables:
- Detection of near-duplicate presence
- Capturing the **multi-faceted** nature of memorization
- Top-1 Influence Margin as a more effective discriminator than self-influence

### 6.3 Connection to Related Work

- **Shilov et al. (2024), Mosaic Memory:** Showed near-duplicates increase MIA susceptibility → this paper confirms via the counterfactual influence framework
- **Zhang et al. (2023), Counterfactual Memorization:** Introduced self-influence → this paper extends to a distributional perspective
- **Feldman & Zhang (2020):** Subsampled influence estimation → similar subsampling methodology used here

---

## 7. Overall Assessment

This paper delivers a concise but critical insight. While **self-influence is widely used as a proxy for memorization**, its limitations become clear in the presence of near-duplicates — common in real-world training data. The striking finding that near-duplicate records show **3× lower self-influence but 5× higher extractability** powerfully demonstrates the inadequacy of self-influence as a standalone metric.

The proposed Top-1 Influence Margin is a simple yet effective new metric, and the CIFAR-10 experiments showing natural near-duplicate identification through influence distributions alone have significant practical value. Read together with the Mosaic Memory paper, this provides a comprehensive understanding of the role of near-duplicates in LLM memorization.
