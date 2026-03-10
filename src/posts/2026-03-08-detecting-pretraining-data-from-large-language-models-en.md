---
title: Paper Summary - Detecting Pretraining Data from Large Language Models
date: 2026-03-08
summary: Based on the ICLR 2024 paper "Detecting Pretraining Data from Large Language Models," this post summarizes the pretraining data detection problem, MIN-K% PROB, WIKI MIA, and key experimental results.
tags: [LLM, Membership Inference, Pretraining, Memorization, Research Note]
category: 연구노트
language: en
---

This research note summarizes the ICLR 2024 paper **Detecting Pretraining Data from Large Language Models**.

The question is simple.

**"Has this LLM already seen this text during pretraining?"**

On the surface it resembles a membership inference problem, but the key insight is that the subject of this paper is not general fine-tuning data, but **large-scale pretraining data**. The authors create a dynamic benchmark called **WIKI MIA** to address this problem and propose **MIN-K% PROB**, a detection method that operates without requiring a separate reference model.

Paper link: https://arxiv.org/abs/2310.16789

## TL;DR

This paper shows that the outlier patterns of a small number of tokens with the lowest probabilities reveal pretraining membership better than average perplexity, and connects that intuition to an actual detection algorithm.

## 1. Introduction

The background motivating the authors' problem is clear.
Today's LLMs are trained on massive text corpora, but what they actually **learned** is rarely disclosed.
This opacity creates three problems.

- It is difficult to know whether copyrighted text was included in the training data.
- It is hard to verify whether personal information remains in the model.
- It is challenging to confirm whether evaluation benchmarks leaked into the pretraining data.

In other words, as models become stronger, the question of "what did it memorize?" becomes more important, yet we lack methods to verify this. This is the starting point.

The paper frames this problem as follows.

- Input: a piece of text `x`
- Access: we have no knowledge of the model's internal weights or training data; we can only see **token probabilities as a black-box**
- Goal: determine whether `x` was included in pretraining data

Here the authors identify two key challenges distinct from conventional fine-tuning membership inference.

First, **we don't know the pretraining data distribution itself.**
Existing MIA often uses shadow data or reference models for calibration, but in LLM pretraining the distribution is hard to know and retraining costs are prohibitive.

Second, **detection itself is more difficult.**
Fine-tuning repeats the same examples over multiple epochs, but pretraining typically shows each sample only once in a much larger dataset.
Thus the membership signal is much weaker.

This problem formulation goes beyond proposing a single attack technique; it reads as an effort to build a measurement tool for future LLM auditing and data transparency.

## 2. Related Work

This paper does not have a traditional long Related Work section at the beginning.
Instead, related work is scattered throughout the introduction, problem formulation, and baseline descriptions, and can be organized into four categories.

### 2.1 Membership Inference Attack Family

The foundational work is Shokri et al.'s **membership inference attack**.
The problem of determining whether a sample was in the training data has existed for a long time, but most focus on classification models or relatively small settings.

This paper adapts that framework to LLMs, but reframes the question:

- Can we detect pretraining data rather than fine-tuning data?
- Can we do it without shadow models?
- Can we do it with only black-box probability information?

### 2.2 Fine-tuning Data Detection Research

Prior work by Song & Shmatikov, Watson et al., Carlini et al. and others inferred membership by **calibrating difficulty using a reference model**.
This line of work is strong, but doesn't fit the setting this paper targets.

- The pretraining corpus distribution may be unknown
- Retraining a shadow model from the same distribution is difficult and expensive
- It is practically infeasible to apply to closed, large models

In other words, the insight of this paper is that related work is strong but rests on very strong assumptions.

### 2.3 Reference-free Heuristics

The reference-free approaches this paper uses as comparison baselines include:

- **PPL / LOSS attack**: text with low overall perplexity is likely a seen sample
- **Neighbor**: uses probability curvature in a way similar to DetectGPT
- **Zlib / Lowercase**: uses compression ratio or perplexity difference before/after lowercasing

These are simple to implement and need no reference model, but fundamentally depend on **sentence-level probabilities**.
The authors see this as a weakness.

### 2.4 What Differentiates This Paper

This paper summarizes its difference from prior work in one sentence:

**"Focus on the most suspicious low-probability tokens in the text, not the average sentence probability."**

In other words, rather than asking if the entire sentence appears natural,
the paper hypothesizes that what matters more for membership detection is **how many outlier tokens the model finds unfamiliar**.

## 3. Methodology

The methodology has two main axes.

- Benchmark for evaluation: **WIKI MIA**
- Detection method: **MIN-K% PROB**

### 3.1 Problem Definition

Given a model `fθ` and some text `x`, the detector `h(x, fθ)` predicts whether this text was included in pretraining.
The key constraints are:

- We don't know the pretraining data itself
- We cannot access the model's internal weights; we can only obtain token probabilities

In other words, this approach is not white-box memorization analysis but rather **practical black-box auditing**.

### 3.2 WIKI MIA Benchmark

To evaluate membership detection, the authors create a **dynamic benchmark using temporal information**.
The core idea is simple.

- Wikipedia event pages created after January 1, 2023 are **non-members**
- Wikipedia event pages from much earlier times are **member candidates**

This approach virtually guarantees non-members, since the model could not have seen events after 2023 during pretraining.

The paper characterizes WIKI MIA along three dimensions:

- **Accurate**: thanks to temporal information, non-members are likely actually unseen.
- **General**: widely applicable to multiple pretrained LMs that use Wikipedia.
- **Dynamic**: future events can be continuously added to update the benchmark.

It is also important that the benchmark is divided into two settings.

- **Original setting**: detect from original text
- **Paraphrase setting**: paraphrase examples with ChatGPT, then evaluate whether the method can catch membership signals in semantically equivalent text

In addition, text length is evaluated across `32 / 64 / 128 / 256` tokens.
This design is practical.
In real-world scenarios, we must catch not just identical sentences but **semantically equivalent texts with different phrasing**.

### 3.3 MIN-K% PROB

The paper's core hypothesis is:

**Unseen text is likely to show outlier patterns of unusually low probabilities in some tokens, rather than across the entire sentence.**

Conversely, text already seen during training shows fewer such extreme low-probability tokens.

The method is extremely simple.

1. Compute `log p(x_i | x_<i)` for each token in the text.
2. Select only the bottom `k%` of tokens by probability.
3. Use the mean log-likelihood of those tokens as the membership score.

Formally:

```text
MIN-K% PROB(x) = average of log p(x_i | x_<i)
for tokens x_i in the bottom k% probability tokens of x
```

The intuition is:

- **non-member**: a few tokens are unusually unfamiliar, hitting bottom levels
- **member**: overall smoother, with even worst-case tokens being less extreme

What is important in this paper is that this method is **reference-free**.
That is, it can be applied immediately without constructing a separate shadow model.

![MIN-K% PROB overview](https://xspdvydnpreiccnpzunm.supabase.co/storage/v1/object/public/blog-images/papers/detect-pretraining-figure1-overview.png)
*Figure 1. MIN-K% PROB overview. After computing token probabilities, select only the bottom k% tokens and determine membership based on average log-likelihood. Image source: Shi et al., ICLR 2024.*

### 3.4 Why This Approach Matters

Existing PPL-based methods average across the entire sentence, which can dilute the membership signal if it is concentrated in a few tokens.
MIN-K% PROB, by contrast, looks only at the weakest link.

Personally, the advantages of this design are two:

- The implementation is simple, making it highly reproducible.
- By focusing on "outliers" rather than "averages," it aligns well with intuition.

There are also weaknesses:

The method still assumes access to an API that permits **token logprob access**.
It is less a true black-box and more of a **restricted black-box that exposes log probabilities**.

## 4. Experimental Results

### 4.1 Experimental Setup

Evaluation is performed on WIKI MIA, with the following target models:

- Pythia-2.8B
- GPT-NeoX-20B
- LLaMA-30B
- LLaMA-65B
- OPT-66B

Evaluation metrics are:

- **AUC**
- **TPR@5%FPR**

Comparison baselines are Neighbor, PPL, Zlib, Lowercase, and Smaller Reference model.
The key hyperparameter `k` for MIN-K% PROB was found to be optimal at `20` on validation and was fixed.

### 4.2 Main Results

The most important result is Table 1.
In the paper, MIN-K% PROB achieves an overall average **AUC of 0.72**, outperforming the strongest baseline **PPL at 0.67**.
In the paper's terms this is a **7.4% improvement**, or in absolute terms **+0.05 AUC**.

The pattern by model is clear:

- Pythia-2.8B: original 0.67, paraphrase 0.66
- NeoX-20B: original 0.76, paraphrase 0.74
- LLaMA-30B: original 0.74, paraphrase 0.73
- LLaMA-65B: original 0.74, paraphrase 0.74
- OPT-66B: original 0.71, paraphrase 0.69

In other words, this was not a one-off success on a single model but rather consistent superiority across multiple pretrained LMs.
Notably, performance is maintained in the paraphrase setting.
This means the method captures not just string matching, but to some extent how "familiar" the model finds the text's distribution.

On the TPR@5%FPR metric, MIN-K% PROB averages **22.2**, the highest among baselines.
This means it provides usable signal even under strict false positive constraints.

| Method | Pythia Ori. | Pythia Para. | NeoX Ori. | NeoX Para. | LLaMA-30B Ori. | LLaMA-30B Para. | LLaMA-65B Ori. | LLaMA-65B Para. | OPT-66B Ori. | OPT-66B Para. | Avg. |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Neighbor | 0.61 | 0.59 | 0.68 | 0.58 | 0.71 | 0.62 | 0.71 | 0.69 | 0.65 | 0.62 | 0.65 |
| PPL | 0.61 | 0.61 | 0.70 | 0.70 | 0.70 | 0.70 | 0.71 | 0.72 | 0.66 | 0.64 | 0.67 |
| Zlib | 0.65 | 0.54 | 0.72 | 0.62 | 0.72 | 0.64 | 0.72 | 0.66 | 0.67 | 0.57 | 0.65 |
| Lowercase | 0.59 | 0.60 | 0.68 | 0.67 | 0.59 | 0.54 | 0.63 | 0.60 | 0.59 | 0.58 | 0.61 |
| Smaller Ref | 0.60 | 0.58 | 0.68 | 0.65 | 0.72 | 0.64 | 0.74 | 0.70 | 0.67 | 0.64 | 0.66 |
| **MIN-K% PROB** | **0.67** | **0.66** | **0.76** | **0.74** | **0.74** | **0.73** | **0.74** | **0.74** | **0.71** | **0.69** | **0.72** |

*Table 1. AUC comparison on WIKI MIA. Taken directly from Table 1 in the original paper.*

### 4.3 Analysis Experiments

The paper moves beyond simple performance comparison to examine under what conditions detection becomes easier.

First, **detection becomes easier with larger models.**
In comparisons of LLaMA 7B, 13B, 30B, and 65B, AUC increases as model size grows.
The authors interpret this as larger models having more parameters and thus potentially stronger memorization of pretraining data.

![AUC vs model size](https://xspdvydnpreiccnpzunm.supabase.co/storage/v1/object/public/blog-images/papers/detect-pretraining-figure2a-model-size.png)
*Figure 2(a). AUC increases with model size. Image source: Shi et al., ICLR 2024.*

Second, **detection becomes easier with longer text.**
As text length increases from 32, 64, 128, to 256 tokens, AUC rises.
Shorter sentences have weaker membership signals and are harder to detect, while longer sentences reveal more traces of memorization.

![AUC vs text length](https://xspdvydnpreiccnpzunm.supabase.co/storage/v1/object/public/blog-images/papers/detect-pretraining-figure2b-text-length.png)
*Figure 2(b). Detection becomes easier with longer text. Image source: Shi et al., ICLR 2024.*

This result is also important for practical interpretation.
In other words, this method is less a tool for making definitive legal conclusions about single short sentences, and more of an **auditing tool for estimating pretraining traces in longer text units**.

## 5. Case Study: Copyrighted Book Detection

Beyond the WIKI MIA benchmark, the paper applies the method in a real-world setting: **detecting whether copyrighted books were in GPT-3 pretraining**.

The setup is as follows:

- Validation set: 50 books known to be memorized by ChatGPT vs. 50 newly published books from 2023
- Test set: 100 randomly selected books from Books3, with 100 512-word snippets per book
- Decision criterion: snippet contamination rate calculated using threshold selected from validation set

Figure 3 results are straightforward.
**MIN-K% PROB achieves AUC 0.88**, the highest, surpassing PPL at 0.84.

![Figure 3 recreated: copyrighted books AUC](https://xspdvydnpreiccnpzunm.supabase.co/storage/v1/object/public/blog-images/papers/detect-pretraining-figure3-books-auc.png)
*Figure 3. AUC for detecting copyrighted book snippets in GPT-3. Reconstructed graph based on paper figures.*

| Method | Book AUC |
| --- | ---: |
| Neighbor | 0.75 |
| PPL | 0.84 |
| Zlib | 0.81 |
| Lowercase | 0.80 |
| **MIN-K% PROB** | **0.88** |

*Figure 3 data reorganized as a table.*

And Figure 4 is even more direct.
According to the paper, **nearly 90% of the 100 books exceed a contamination rate of 50%.**
This suggests that not just isolated snippets but a substantial portion of book content was likely already in GPT-3.

![Figure 4: contamination rate distribution](https://xspdvydnpreiccnpzunm.supabase.co/storage/v1/object/public/blog-images/papers/detect-pretraining-figure4-books-contamination.png)
*Figure 4. Distribution of contamination rates across 100 books. Many books cluster in the 80-100% range. Image source: Shi et al., ICLR 2024.*

### 5.1 What is Book Contamination Rate?

Here, **book contamination rate** is the percentage of 100 randomly sampled snippets from each book that are detected as "this text appears to have been seen during GPT-3 pretraining."

In other words,

- `100% contamination` means all 100 snippets from that book were classified as pretraining members
- `50% contamination` means roughly half the snippets showed pretraining traces

With this definition, the meaning of Figure 4 becomes clearer:

- By book-level view, contaminated books are far more common than exceptions with low contamination
- Particularly concentrated in the **80-100% range**, suggesting GPT-3 may have absorbed book text broadly rather than just skimming a few short sentences
- As the paper states directly, **nearly 90% of books show contamination rates exceeding 50%**

### 5.2 Highly Contaminated Books

Looking at Table 2, the most contaminated books are nearly all in the `98-100%` range.
In other words, the detector concluded "pretraining traces are consistently visible across this entire book."

Particularly noteworthy points:

- Top 7 books have **100% contamination**
- Top 20 books are all **98% or above**
- The mix is not skewed to a single genre, but includes fiction, non-fiction, and self-help/general knowledge books together

For this reason, this case study is not merely anecdotal but provides fairly strong evidence that **Books3-related copyrighted text was likely included in actual large-scale pretraining**.

The original paper's Table 2 shows the top 20 books. Due to length, I present them in two tables.

| Contamination % | Book Title | Author | Year |
| --- | --- | --- | ---: |
| 100 | The Violin of Auschwitz | Maria Àngels Anglada | 2010 |
| 100 | North American Stadiums | Grady Chambers | 2018 |
| 100 | White Chappell Scarlet Tracings | Iain Sinclair | 1987 |
| 100 | Lost and Found | Alan Dean | 2001 |
| 100 | A Different City | Tanith Lee | 2015 |
| 100 | Our Lady of the Forest | David Guterson | 2003 |
| 100 | The Expelled | Mois Benarroch | 2013 |
| 99 | Blood Cursed | Archer Alex | 2013 |
| 99 | Genesis Code: A Thriller of the Near Future | Jamie Metzl | 2014 |
| 99 | The Sleepwalker's Guide to Dancing | Mira Jacob | 2014 |

| Contamination % | Book Title | Author | Year |
| --- | --- | --- | ---: |
| 99 | The Harlan Ellison Hornbook | Harlan Ellison | 1990 |
| 99 | The Book of Freedom | Paul Selig | 2018 |
| 99 | Three Strong Women | Marie NDiaye | 2009 |
| 99 | The Leadership Mind Switch: Rethinking How We Lead in the New World of Work | D. A. Benton, Kylie Wright-Ford | 2017 |
| 99 | Gold | Chris Cleave | 2012 |
| 99 | The Tower | Simon Clark | 2005 |
| 98 | Amazon | Bruce Parry | 2009 |
| 98 | Ain't It Time We Said Goodbye: The Rolling Stones on the Road to Exile | Robert Greenfield | 2014 |
| 98 | Page One | David Folkenflik | 2011 |
| 98 | Road of Bones: The Siege of Kohima 1944 | Fergal Keane | 2010 |

## 6. Case Study: Downstream Dataset Contamination

The authors also address another practical problem: **downstream benchmark leakage**.
The setup involves inserting examples from BoolQ, IMDB, TruthfulQA, and CommonsenseQA into the RedPajama pretraining corpus, then continuing pretraining LLaMA 7B and testing whether contaminant examples can be detected.

The main result is Table 3.
Here too, **MIN-K% PROB achieves the highest average AUC of 0.86**.
Particularly, it reaches 0.98 on IMDB and 0.91 on BoolQ.

| Method | BoolQ | Commonsense QA | IMDB | Truthful QA | Avg. |
| --- | ---: | ---: | ---: | ---: | ---: |
| Neighbor | 0.68 | 0.56 | 0.80 | 0.59 | 0.66 |
| Zlib | 0.76 | 0.63 | 0.71 | 0.63 | 0.68 |
| Lowercase | 0.74 | 0.61 | 0.79 | 0.56 | 0.68 |
| PPL | 0.89 | 0.78 | 0.97 | 0.71 | 0.84 |
| **MIN-K% PROB** | **0.91** | **0.80** | **0.98** | **0.74** | **0.86** |

*Table 3. AUC for detecting contaminant downstream examples.*

The subsequent ablation is more interesting.

- **Figure 5(a)**: outlier samples like downstream contaminants are actually easier to detect as pretraining dataset size grows.
- **Figure 5(b)**: conversely, in-distribution contaminants become harder to detect as dataset size increases.
- **Figure 5(c)**: higher sample occurrence frequency makes detection easier.

![Figure 5(a): outlier contaminants](https://xspdvydnpreiccnpzunm.supabase.co/storage/v1/object/public/blog-images/papers/detect-pretraining-figure5a-dataset-size-outlier.png)
*Figure 5(a). Outlier contaminants become more apparent as dataset size grows. Image source: Shi et al., ICLR 2024.*

![Figure 5(b): in-distribution contaminants](https://xspdvydnpreiccnpzunm.supabase.co/storage/v1/object/public/blog-images/papers/detect-pretraining-figure5b-dataset-size-in-distribution.png)
*Figure 5(b). In-distribution contaminants become more hidden as dataset size increases. Image source: Shi et al., ICLR 2024.*

![Figure 5(c): occurrence frequency](https://xspdvydnpreiccnpzunm.supabase.co/storage/v1/object/public/blog-images/papers/detect-pretraining-figure5c-occurrence-frequency.png)
*Figure 5(c). Detection becomes easier as the same contaminant appears more frequently. Image source: Shi et al., ICLR 2024.*

The learning rate effect is also clear.
According to Table 4 in the paper, raising the learning rate from `1e-5` to `1e-4` produces a noticeable AUC increase across all tasks.
The authors interpret this as higher learning rates strengthening memorization.

| Learning Rate | BoolQ | Commonsense QA | IMDB | LSAT QA | Truthful QA |
| --- | ---: | ---: | ---: | ---: | ---: |
| 1 × 10⁻⁵ | 0.64 | 0.59 | 0.76 | 0.72 | 0.56 |
| **1 × 10⁻⁴** | **0.91** | **0.80** | **0.98** | **0.82** | **0.74** |

*Table 4. Higher learning rates make contaminant detection easier.*

## 7. My Interpretation & Limitations

This paper is good for two reasons.

First, the problem formulation is realistic.
Real external users cannot see model weights or training data; at best they obtain probability information at the API level.
Proposing a detection method that operates under those constraints is practical.

Second, the benchmark design is clever.
WIKI MIA leverages temporal asymmetry—future events would not have been in past pretraining—to create fairly reliable non-member data.

But there are clear limitations.

- **Member-side gold labels are not absolute guarantees.** We cannot 100% confirm that older Wikipedia events were actually included in every model's pretraining.
- **Logprob access is required.** Many commercial APIs or fully closed models may block this access entirely.
- **AUC 0.72 is strong but not definitive.** Useful for auditing and risk detection, but still cautious for use as legal evidence about individual samples.
- **Weak on short text.** The paper itself demonstrates detection becomes harder as text length decreases.

## 8. Summary

This paper shows that when addressing LLM memorization and data auditing, a simple strategy of **looking at just a few lowest-probability tokens** is surprisingly strong compared to complex shadow models.

In my view, the paper's three core contributions are:

- **Problem formulation**: elevated pretraining data detection as an independent research problem.
- **Benchmark foundation**: proposed WIKI MIA, a dynamic benchmark.
- **Methodology**: proposed MIN-K% PROB, a simple yet practical reference-free detector.

In an era when we must verify what LLMs have memorized and what they "claim to have forgotten," this is an important starting point.
