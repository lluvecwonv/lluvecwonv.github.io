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

**Datasets and Preprocessing:**

| Dataset | Source | Characteristics |
|---------|--------|----------------|
| **RealNews** (Zellers et al., 2019) | News articles | Journalistic text, domain diversity |
| **C4** (Raffel et al., 2020a) | Web crawl | General web text, most diverse distribution |
| **Wiki40B:en** (Guo et al., 2020) | Wikipedia | Encyclopedic text, relatively clean distribution |

To save computation and enable more direct comparisons across datasets, the training set for each dataset is **truncated by taking the first 2^21 documents**.

**Model Training Configuration:**

| Item | Details |
|------|---------|
| **Architecture** | Transformer-based, equivalent to T5-base (decoder-only) |
| **Parameters** | ~112M |
| **Number of models (m)** | 400 (per dataset) |
| **Subset size** | ~25% of training set per model (random sampling) |
| **Optimizer** | Adam (Kingma and Ba, 2015) |
| **Learning rate** | 0.1 |
| **Weight decay** | 10^-5 |
| **Training epochs** | 60 |
| **Metric** | Per-token accuracy |

**Convergence Performance:**

| Dataset | Training set avg. accuracy | Validation set avg. accuracy |
|---------|---------------------------|------------------------------|
| **C4** | 44.21% | 27.90% |
| **RealNews** | 47.59% | 31.09% |
| **Wiki40B:en** | 66.35% | 49.55% |

On average, **models start to overfit at around epoch 5**, as indicated by the validation accuracy starting to decrease.

This design is elegant: the 400 models give a distribution of possible model instances, and each example x naturally appears in ~100 IN models and ~300 OUT models, providing stable estimates.

### 3.4 Hash-Based Subsampling Procedure

Each of the 400 models must be trained on an independent random subset of training examples. However, the data loading APIs for large text corpora (Tensorflow Datasets, TFDS) generally support only sequential visits to examples with limited shuffling and subsampling capability within a window. TFDS does not support subset loading from a list of indices. A naive implementation — checking whether the current example's index is in a given list of subset indices — is very slow and scales poorly with subset size.

To mitigate this issue, the paper implements a **hash-based subset sampling predicate** that can be evaluated efficiently for each example.

**Core Idea:**

Let N be the total number of training examples, n < N be the expected subset size:

1. Map the index i of each example to **N/n hash buckets**
2. Select all examples that fall into **one particular bucket**
3. Use **different hash functions** (based on model index as seed) for each model to ensure independent subset sampling

Specifically, a known hash function for `uint64` types is composed with a simple pseudo-random number based on the model index:

```python
def hash_sampler(mod, seed, system):
    """Get hash based subset sampler.
    Args:
        mod: total_n_egs // subset_size
        seed: different seed leads to different subset sample
        system: 'np' or 'tf'
    """
    np_hash = hash_uint64_builder('np')
    mul, offset, remainder = np_hash(seed + 1234 + np.arange(3))
    remainder = remainder % mod
    # ...returns tf_filter or np_sampler
```

The hash function itself uses a [well-known uint64 hash](https://stackoverflow.com/questions/664014/):

```python
def hash_uint64(x):
    x = uint64_cast(x)
    x = op_xor(x, op_rshift(x, 30)) * uint64_cast(0xbf58476d1ce4e5b9)
    x = op_xor(x, op_rshift(x, 27)) * uint64_cast(0x94d049bb133111eb)
    x = op_xor(x, op_rshift(x, 31))
    return x
```

**Validation Results (Paper Figure 11):**

1. **Sample size consistency:** The hash-based sampler always samples close to n points with small variance
2. **Selection probability distribution:** With r = 0.25, the empirical fraction of total models containing each point should average 0.25. The hash-based sampler's probability distribution is highly consistent with `numpy.random.choice`
3. **Pairwise independence:** The probability that two different training points x1, x2 both appear IN or both OUT of a model's training set should be 0.625 (= r² + (1−r)²). The hash-based sampler's independence is very similar to `numpy.random.choice`

**Advantages** of this hash-based approach: each example can be evaluated individually and efficiently, enabling fast subset determination even for large-scale datasets. The subset size sampled is close to n but not guaranteed to be exactly n, which is acceptable in this setting.

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

## 6. From Memorization to Influence

Counterfactual memorization identifies training examples that contain rare information not conveyed by other examples. A natural question is whether a model would leak the information in a memorized example during inference. Previous work studies **membership inference attacks** (Shokri et al., 2017; Sablayrolles et al., 2019; Long et al., 2020) where an attacker tries to figure out if a particular example exists in the training set. In this paper, the authors consider standard model evaluation without adversarial attackers, and quantify **"does seeing a particular training example strongly influence the prediction on a validation example?"** Another way of asking this is whether a single example in the training set has a large and over-representative impact on the prediction of a validation example.

### 6.1 Definition

**Definition 6.1 (Counterfactual Influence).** Given a training algorithm A that maps a training set D to a trained model, and a performance measure M, the counterfactual influence of a training example x ∈ D on another example x' is:

```
infl(x ⇒ x') ≜ E_{S⊂D, x∈S}[M(A(S), x')] - E_{S⊂D, x∉S}[M(A(S), x')]    (3)
```

where S is a subset of training examples sampled from D. The expectation is taken with respect to the random sampling of S, as well as the randomness in the training algorithm A. Here x' can be an example from the validation set, test set, a generated example, or a training example.

An empirical estimation of the influence can be computed similarly to counterfactual memorization by uniformly sampling m subsets S₁, ..., Sₘ from D, where |Sᵢ| = r|D|, and calculating:

```
inflc(x ⇒ x') ≜ mean_{i: x∈Sᵢ}[M(A(Sᵢ), x')] - mean_{i: x∉Sᵢ}[M(A(Sᵢ), x')]    (4)
```

This measures how much a training sample x's presence influences the prediction of a different example x'. Note: **`mem(x) = infl(x ⇒ x)`** — i.e., counterfactual memorization is self-influence.

### 6.2 Influence on Examples of the Validation Set

With the same models trained for estimating memorization, the authors can estimate the counterfactual influence on the validation set according to Equation (4). For each example in the validation set, they estimate the influence on it from each training example.

![Figure 4: (a) Histogram of the influence of all training examples on a specific test example for three different test examples on RealNews. The blue and orange examples have high and intermediate influence from some training examples, as indicated by the outlier values to the right. The green one is a random example, where the influence from all individual training examples are close to zero. (b) The joint distribution of the memorization score of each training example and its maximum influence on any validation set example. The histograms are in log scale to better visualize the tail of the distributions.](/images/papers/counterfactual-memorization/fig5_mem_infl_main.png)

![Figure 4 (extended): Joint distribution of memorization and max-influence across all three datasets — RealNews, C4, and Wiki40B:en.](/images/papers/counterfactual-memorization/fig5_mem_infl_all.png)

Figure 4(a) shows the distribution of influence from all training examples on three different validation set examples:

- **Green example** (randomly chosen): Represents the behavior for most validation examples — it receives close-to-zero influence from all the (individual) training examples.
- **Blue and orange examples** (sampled to have high and intermediate maximum influence): Each has one (or a few) strong influencers from the training set, as indicated by the bars to the right of the histogram. They also only receive tiny influence from all the rest of the training examples, though the variance of influence is larger than for the green example.

Intuitively, most training examples will have small influence on validation set examples because the models learn distributional patterns shared across many training examples, and individual training examples tend to have insignificant influence. However, **a training example x with high counterfactual memorization contains rare information that is not shared with other examples**. Therefore, if a validation set example x' contains similar information, infl(x ⇒ x') could be large.

**Relationship between Memorization and Influence (Figure 4b):**

Figure 4(b) plots mem(x) of each training example x against its maximum influence max_{x'} infl(x ⇒ x') across the validation set. Consistent with our intuition:

- **Examples with small memorization scores** have small max-influence scores.
- **Larger influence scores** on the validation set generally require larger memorization scores — not exceeding the memorization score of the training example itself.
- However, **not all training examples with large memorization scores lead to large influence scores**. In particular, the max-influences drop significantly for examples with memorization larger than 0.4. Two potential reasons:
  1. Many examples with very high memorization are simply low quality text, so memorization is required to learn them, but they do not encode anything interesting that could influence a validation example.
  2. Even if a memorized example encodes some rare and useful information, the max-influence could still be low because the validation set does not contain a relevant document — especially true given that all datasets have considerably smaller validation sets than training sets.

**Table 2: Train-Validation Example Pairs at Different Influence Levels (RealNews)**

![Table 2: Train-validation example pairs of RealNews sampled at a variety of influence levels. [...] indicate text omitted for brevity. Differences in each document pair are highlighted yellow.](/images/papers/counterfactual-memorization/table2_influence_pairs.png)

Table 2 shows train-validation example pairs from RealNews sampled at different influence value ranges. Analysis by influence level:

| Influence Level | Estimated Influence | Observed Pattern |
|----------------|-------------------|-----------------|
| **Highest** (infl ≈ 0.378) | Train-validation pairs with nearly identical text | Only URL protocol difference (http:// vs. https://); text content is identical |
| **High** (infl ≈ 0.121) | (Almost) identical reports from different websites | Same AP/Reuters article published on different outlets — one may cite the other or both cite a third party |
| **Intermediate** (infl ≈ 0.067) | Same event with slightly different wordings | Covering the same sports game but with different phrasings (e.g., "might have been lost without their programs" vs. "needed programs to identify the players") |
| **Low** (infl ≈ 0.036) | Same event reporting with differing detail levels | Same food recall event, but one embedded significantly more product detail information |

At influence scores below 0.02, no noticeable relationships in the document pairs were observed due to high signal-to-noise ratio.

At low influence ranges, two types of correlations are commonly observed:
1. **Templated texts with high similarity** — the reason for low influence is that there are many similar training examples that split the influence
2. **Superficially related documents** — due to a shared prefix such as "ST. CLOUD – This week in our 'Behind the Scenes' series on WJON" or a shared substring of common knowledge like "FSIS, the Centers for Disease Control and Prevention"

**Key Takeaway:** Influence turns out to be an effective tool for analyzing and attributing model predictions at test time. For predictions that rely on information obtained by (counterfactual) memorization, we can identify exactly which training example provided such information. The observation of near-duplicated training-validation document pairs is consistent with recent studies that identify data contamination in large Internet-crawled text corpora (Lee et al., 2021; Dodge et al., 2021).

### 6.3 Influence on Generated Texts

The influence estimation is not restricted to the validation set. We can also estimate influence on generated examples. In this section, the authors evaluate on the publicly released generations from the **Grover models** (Zellers et al., 2019) trained on RealNews. Specifically, they take the generations from **Grover-Mega (p=0.96)**, a 1.5-billion-parameter model trained on the RealNews dataset.

![Figure 8: Histogram of max-influence on Grover-Mega generated examples from RealNews training data. Compared with the train-validation influence in Figure 4b, the histogram decays faster as max-influence grows. Moreover, the value range of max-influence is also twice smaller.](/images/papers/counterfactual-memorization/fig8_grover_influence.png)

Compared with the train-validation influence in Figure 4(b), the histogram for generated text **decays faster** as max-influence grows. Moreover, the value range of max-influence is also **twice smaller**.

The reasons for not finding many highly influenced generated examples are two-fold:

1. **Limited number of generations**: There are only 24,576 generations in the public release, which is much fewer than the validation examples. As a result, the corresponding examples of many memorized training examples do not get sampled in the generations. For comparison, previous work (Carlini et al., 2020; Lee et al., 2021) generated 100,000+ examples to identify memorization in generation. These approaches also count duplicates in the training set, which counterfactual memorization filters out.

2. **Training set scope mismatch**: The Grover model was trained on the full RealNews training set, while this analysis is restricted to the first 2M training examples. There could potentially be more high-influence training examples that are missed in the calculation.

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
