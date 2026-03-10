---
title: "Counterfactual Memorization in Neural Language Models — Paper Summary"
date: 2026-03-10
summary: "A NeurIPS 2023 paper by Google Research, CMU, Google DeepMind, and ETH Zürich. Proposes counterfactual memorization — a principled causal framework to distinguish memorization of rare, specific information from common knowledge in LMs. By training 400 models on random subsets, they estimate how each training example's presence affects model predictions, revealing an inverse correlation between duplication and memorization. Extends to counterfactual influence for tracing information sources at test time."
tags: [LLM, Memorization, Counterfactual, Influence Functions, Privacy, NeurIPS, Research Note]
category: 연구노트
language: en
---

# Counterfactual Memorization in Neural Language Models

**Paper:** Zhang et al. (2023) | NeurIPS 2023
**Authors:** Chiyuan Zhang, Daphne Ippolito, Katherine Lee, Matthew Jagielski, Florian Tramèr, Nicholas Carlini
**Institutions:** Google Research, CMU, Google DeepMind, ETH Zürich
**arXiv:** [2112.12938](https://arxiv.org/abs/2112.12938)

## TL;DR

Language models memorize training data, but measuring *how much* is tricky. Most existing metrics capture "common" memorization (near-duplicates, templates, public knowledge). This paper proposes **counterfactual memorization**—a principled framework inspired by psychology's episodic vs. semantic memory distinction.

The key insight: train multiple models on random subsets of training data, then measure how much a model's predictions change when a specific example is included vs. excluded. By training 400 T5-base models, the authors discover an **inverse correlation between duplication and counterfactual memorization** (r = -0.39)—opposite to what generation-time metrics show. They also introduce **counterfactual influence** to trace which training examples most affect specific predictions.

---

## 1. Introduction: The Memorization Problem

![Figure 1: Per-token accuracy of training examples — IN models (including the example) vs. OUT models (excluding it), for RealNews, C4, and Wiki40B:en. Points above the diagonal indicate the example benefits from being in the training set.](/images/papers/counterfactual-memorization/fig1_scatter_all.png)

Language models demonstrably memorize parts of their training data. We see this most clearly in *exact* memorization—models can reproduce long strings from training verbatim, which is a privacy and copyright concern. But what does "memorization" actually mean?

Existing metrics (like extraction attacks, next-token prediction, or duplicate-based heuristics) typically measure whether models have learned information that appears frequently or in a concentrated form. If a passage appears 100 times in training, of course the model "knows" it. The question becomes: what about rare, specific information? What about documents that appear only once?

The authors argue we need a causal notion of memorization. Inspired by psychology research distinguishing **episodic memory** (specific, context-dependent events) from **semantic memory** (general knowledge), they propose:

- **Counterfactual memorization (CM)**: How much does a model's behavior *change* if we remove a specific training example from the training set?
- **Counterfactual influence (CI)**: Which training examples influence a given test-time prediction?

This reframes memorization from a distributional question ("is this text common?") to a causal question ("does this specific example matter?").

---

## 2. Related Work

The paper situates itself within several research threads:

1. **Memorization in neural networks**: Prior work showed that models can memorize both common patterns and rare examples, but metrics for distinguishing them are limited.

2. **Privacy attacks and extraction**: Carlini et al. and others demonstrated models can be prompted to emit training data. But extraction metrics don't directly measure "memorization"—they measure recoverability.

3. **Influence functions**: Koh & Liang (2017) proposed influence functions to trace model predictions to training examples. This work extends that to a counterfactual, training-subset-independent framework.

4. **Episodic vs. semantic memory**: The psychology framing is novel in ML. It motivates why measuring "is this information uncommon" isn't the same as measuring "did this specific example shape the model."

The novelty here is **proposing counterfactual memorization as a ground-truth causal notion** rather than relying on distributional proxies.

---

## 3. Methodology: Defining and Estimating Counterfactual Memorization

### 3.1 Formal Definition

For a training set S, a model architecture A, and a metric M (e.g., per-token accuracy):

```
mem(x) = E[M(A(S), x) | x ∈ S] - E[M(A(S), x) | x ∉ S]
```

Here:
- **First term**: Expected metric when x *is* in the training set
- **Second term**: Expected metric when x *is not* in the training set
- **Difference**: The causal effect of including x

If including x boosts model performance on x significantly, it's "counterfactually memorized."

### 3.2 Estimation via Subset Training

Computing this directly would require retraining a model for every possible training set, which is intractable. Instead:

1. **Train m independent models** on random subsets of the full training set (each subset samples ~25% of examples)
2. **Partition models into two groups**:
   - **IN models**: models whose subset includes example x
   - **OUT models**: models whose subset excludes example x
3. **Estimate mem(x)** as the difference in average performance between these two groups

**Key efficiency**: Train only m models once, then compute counterfactual memorization for all training examples. No retraining per example needed.

### 3.3 Implementation Details

- **Architecture**: T5-base decoder-only, ~112M parameters
- **Number of models**: m = 400
- **Subset size**: ~25% of training set per model (random sampling)
- **Training epochs**: 60
- **Metric**: Per-token accuracy M(model, x)
- **Datasets**: RealNews, C4, Wiki40B:en (diverse sources)

This design is elegant: the 400 models give a distribution of possible model instances, and each example x naturally appears in ~100 IN models and ~300 OUT models, providing stable estimates.

---

## 4. Analyzing Counterfactual Memorization

### 4.1 Distribution of Memorization Across Examples

![Figure 2: Joint distribution of counterfactual memorization (X-axis) and simplicity (Y-axis, overall accuracy across all models) for RealNews, C4, and Wiki40B:en. Intermediate-difficulty examples show the highest memorization.](/images/papers/counterfactual-memorization/fig2_mem_simplicity_all.png)

A striking finding: **memorization isn't uniformly distributed**. Instead, there's an "intermediate difficulty" peak:

- **Easy examples**: Low memorization (the model learns them even without that specific example)
- **Medium-difficulty examples**: High memorization (the example is crucial for learning)
- **Hard examples**: Low memorization (even IN models can't learn them)

This mirrors human memory: you don't "memorize" trivial facts (everyone knows them), but you do memorize specific, moderately surprising information. Extremely obscure data that even with help is hard to learn shows low memorization.

### 4.2 Per-Domain Analysis

![Figure 3: Per-domain memorization analysis. (a) 95th percentile memorization vs. number of examples per domain for RealNews, (b) same for C4, (c) memorization distributions of representative domains in RealNews, (d) same for C4.](/images/papers/counterfactual-memorization/fig3_url_analysis_all.png)

Analyzing examples by domain reveals fascinating patterns:

| Domain | Characteristic | Memorization Level |
|--------|-----------------|-------------------|
| **reuters.com** | Large publisher, journalistic norms | Low |
| **digitallibrary.un.org** | Multilingual, technical, structured | High |
| **zap2it.com** | TV listings, rigid format | High (structured) |
| **hotair.com** | Commentary, quotes other sources | Low |

The key insight: **structured data, multilingual text, and unique formatting** tend to be counterfactually memorized, even if duplicates appear. In contrast, **large, diverse publishers** with editorial templates show low memorization (context helps prediction).

### 4.3 Convergence, Training Dynamics, and Duplication

![Figure 4: (a) Spearman's R between memorization rankings from disjoint sets of m models — rankings converge by ~192 models. (b) Distribution of memorization across training epochs for RealNews — memorization grows with training. (c) Fraction of examples above memorization thresholds across epochs. (d) Memorization scores vs. number of near-duplicates — the surprising negative correlation (r = -0.39).](/images/papers/counterfactual-memorization/fig4_composite.png)

**Convergence (a):** How many models (m) are needed for stable estimates? Testing Spearman correlation: m=32 gives ~0.85, m=96 gives ~0.98, m=400 gives ~0.99. Practically, ~96-192 models suffice for stable ranking, but 400 provides excellent precision.

**Training Dynamics (b, c):** Memorization isn't static. Counterfactual memorization generally increases from epoch 1 to 60. 59% of examples show consistently increasing memorization with epochs (no phase transitions or sudden drops for most examples). This suggests memorization is a continuous, cumulative process rather than a discrete "learning" event.

---

## 5. Duplicates and Memorization: The Surprising Inverse Correlation

### 5.1 Key Finding

**Panel (d) above** shows one of the paper's most striking results:

One of the paper's most striking results:

```
Pearson correlation between duplication count and
counterfactual memorization: r = -0.39
```

That's a **negative** correlation. Examples that appear many times in the training set show *lower* counterfactual memorization.

### 5.2 Why Is This the Opposite of Generation-Time Metrics?

Previous work (e.g., extraction attacks) showed that **duplicates are more extractable**. Why the reversal?

The intuition:
- **Generation-time memorization** ("How easily can the model generate this text?"): Duplicates help because seeing something multiple times makes it more "entrenched" in model predictions.
- **Counterfactual memorization** ("Does this specific copy matter?"): Duplicates matter *less* because removing one copy doesn't hurt—other copies remain. A document appearing 5 times contributes less per-copy to model performance than a document appearing once.

Put simply: **duplicates are "redundant" from a counterfactual perspective**, even if they're "sticky" from a generation perspective.

### 5.3 Implication

This reveals that "memorization" is not monolithic. Different metrics capture different phenomena:
- Does the model output this text? (Generation metric)
- Does this example causally influence predictions? (Counterfactual metric)

The authors emphasize: *counterfactual memorization measures a fundamentally different type of memorization*.

---

## 6. Counterfactual Influence: Tracing Information Flow

Beyond "Does this example affect itself?", the paper extends to: "Does this training example affect prediction on *other* examples?"

### 6.1 Definition

```
infl(x → x') = E[M(A(S), x') | x ∈ S] - E[M(A(S), x') | x ∉ S]
```

Note: `mem(x) = infl(x → x)` (self-influence is memorization).

![Figure 5: (Left) Histogram of influence from all training examples on specific test examples — most influences are near-zero, but outliers indicate strong training-test connections. (Right) Joint distribution of memorization score and maximum influence on any validation example for RealNews.](/images/papers/counterfactual-memorization/fig5_mem_infl_main.png)

![Figure 5 (extended): Joint distribution of memorization and max-influence across all three datasets — RealNews, C4, and Wiki40B:en.](/images/papers/counterfactual-memorization/fig5_mem_infl_all.png)

### 6.2 Empirical Findings

1. **Sparsity**: Most training examples have negligible influence on validation examples (distribution heavily skewed toward near-zero).

2. **High-influence pairs** include:
   - **Near-identical texts** from different URLs (same content, different publication)
   - **Reports on the same event** from different sources (temporal/semantic proximity)
   - **Paraphrases and variants** (information is similar, phrasing differs)

3. **Asymmetry**: A → B influence differs from B → A influence (one direction might matter more if B is "earlier" in training or more distinctive).

### 6.3 Influence on Generated Texts

![Figure 8: Histogram of max-influence on Grover-Mega generated examples from RealNews training data. Generative tasks show different sensitivity patterns compared to discriminative evaluation.](/images/papers/counterfactual-memorization/fig8_grover_influence.png)

Testing on Grover-Mega (a generative model), influence patterns shift:
- Generative tasks show different sensitivity to training examples
- Some training documents have higher influence on generation than on next-token prediction
- This suggests different mechanisms govern discriminative vs. generative memorization

---

## 7. Summary & Discussion

### 7.1 Main Contributions

1. **Principled counterfactual definition** of memorization grounded in causality and psychology
2. **Efficient estimation** via subset training (400 models, no per-example retraining)
3. **Empirical insights**: intermediate-difficulty peak, domain variations, inverse correlation with duplication
4. **Counterfactual influence framework** to trace information flow
5. **Publicly available analysis** for reproducibility

### 7.2 Limitations & Future Work

The authors acknowledge important limitations:

1. **Scale**: T5-base (112M params) is much smaller than modern LLMs (GPT-3, GPT-4). Scaling behavior is unclear.

2. **Language**: English-only study. Multilingual patterns may differ.

3. **Dataset size**: RealNews, C4, Wiki40B are substantial but smaller than full modern training sets.

4. **Generalization**: Results on generation tasks (Grover) are preliminary; full characterization of generative memorization remains open.

The authors suggest:
- Scaling to larger models (would require distributed training)
- Versioned Wikipedia for systematic paraphrase studies
- Exploring memorization under domain shift
- Testing on code and other modalities

---

## 8. Personal Commentary

This paper makes a conceptual contribution that I find genuinely important. The distinction between "common" memorization (duplicates, public knowledge) and "episodic" memorization (specific, causally important examples) aligns with how humans actually experience memory. When we say "I memorized that," we usually mean a specific fact surprised us or mattered to us—not that we've heard it 100 times.

### What Resonates

1. **The causal framing**: Rather than asking "is this text common?" (a distributional question), asking "does this example matter?" (a causal question) is conceptually cleaner. It directly addresses privacy and attribution concerns.

2. **The inverse duplication effect**: This is genuinely surprising and highlights how different metrics measure different phenomena. It should make us more cautious about conflating "extractable" with "memorized."

3. **Efficiency**: Training 400 models on 25% subsets is clever. It's expensive but tractable—much cheaper than exact retraining per example.

### What I'd Like to See

1. **Scaling analysis**: How does counterfactual memorization scale to 70B+ parameter models? Do the same patterns hold?

2. **Instruction-tuning effects**: Most modern LLMs are fine-tuned on instruction data. Does CM change during fine-tuning? What about RLHF?

3. **Longer-form memorization**: The paper measures per-token accuracy. What about multi-token spans or full-document coherence?

4. **Privacy implications**: If counterfactual memorization correlates with privacy leakage, this could guide more targeted data redaction strategies.

5. **Paraphrase resistance**: Can a model memorize a concept across multiple paraphrases? This speaks to whether CM is truly about "episodic" memory or abstract knowledge.

### Broader Significance

This work sits at an important intersection: **mechanistic understanding of LLMs**, **privacy concerns**, and **attribution/copyright**. As language models grow more powerful, understanding what they've absorbed from training data—and especially, what they'd lose if specific examples were removed—becomes critical for responsible deployment.

The counterfactual framework is likely to inspire follow-up work. I'd expect to see this extended to:
- Tracing influence in larger models
- Relating CM to model editing techniques
- Using influence estimates to select training data
- Defending against memorization via strategic data augmentation

---

## References & Further Reading

- **Original paper**: [arXiv:2112.12938](https://arxiv.org/abs/2112.12938)
- **Institutions**: Google Research, CMU, Google DeepMind, ETH Zürich
- **Venue**: NeurIPS 2023
- **Related work on influence functions**: Koh & Liang (2017), "Understanding Black-box Predictions via Influence Functions"
- **Related work on memorization**: Carlini et al., "Extracting Training Data from Large Language Models"

---

*This blog post summarizes research from the ML community. For full technical details, code, and supplementary materials, please refer to the original paper.*
