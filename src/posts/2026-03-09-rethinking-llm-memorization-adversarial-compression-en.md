---
title: Rethinking LLM Memorization through the Lens of Adversarial Compression - Paper Summary
date: 2026-03-09
summary: A NeurIPS 2024 paper that redefines LLM memorization from the perspective of adversarial compression, and rigorously demonstrates the limitations of existing unlearning techniques through the Adversarial Compression Ratio (ACR) metric and the MiniPrompt algorithm.
tags: [LLM, Memorization, Adversarial Compression, Unlearning, Privacy, NeurIPS, Research Note]
category: 연구노트
language: en
---

This research note summarizes the NeurIPS 2024 paper **Rethinking LLM Memorization through the Lens of Adversarial Compression**.
The authors are Avi Schwarzschild, Zhili Feng, Pratyush Maini, Zachary C. Lipton, and J. Zico Kolter from Carnegie Mellon University.

The core question is this:

**"Has the LLM truly 'forgotten' its training data, or is it merely pretending to have forgotten?"**

The authors identify critical limitations in existing memorization definitions — that they are either too permissive or unrealistic — and propose a new definition from a compression perspective: **Adversarial Compression Ratio (ACR)**. What is particularly impressive is their empirical demonstration using this metric that unlearning techniques fail to make models actually forget data.

Paper link: https://arxiv.org/abs/2404.15146
Project page: https://locuslab.github.io/acr-memorization

## TL;DR

If a model can reproduce training data using a prompt **shorter than the target string itself**, then the model has **memorized** that data — this intuition is formalized as ACR, a metric that exposes the "illusion of compliance" in existing unlearning techniques.

![Figure 1: ACR Overview — Reproducibility with shorter prompts indicates memorization](/images/papers/acr-memorization/fig1-acr-overview.png)
*Figure 1: Core idea of ACR. The target string (12 tokens) can be reproduced with a 4-token prompt → High ACR, memorized. Conversely, a 26-token target requires 45 tokens to reproduce → Low ACR, not memorized.*

## 1. Introduction — Why Do We Need a New Memorization Definition?

A central question in the discussion of LLMs concerns the extent to which they **memorize** their training data versus how they **generalize** to new tasks and settings. Most practitioners seem to (at least informally) believe that LLMs do some degree of both: they clearly memorize parts of the training data — for example, are often able to reproduce large portions of training data verbatim [Carlini et al., 2023] — but they also seem to learn from this data, allowing them to generalize to new settings.

The precise extent to which they do one or the other has **massive implications for the practical and legal aspects** of such models [Cooper et al., 2023]. Do LLMs truly produce new content, or do they only remix their training data? Should the act of training on copyrighted data be deemed unfair use of data, or should fair use be judged by the model's memorization? With respect to people, we distinguish plagiarizing content from learning from it, but how should this extend to LLMs? The answer to such questions inherently relates to the extent to which LLMs memorize their training data.

However, even **defining memorization** for LLMs is challenging and many existing definitions leave a lot to be desired. Certain formulations claim that a passage from the training data is memorized if the LLM can reproduce it exactly [Nasr et al., 2023], but this ignores situations where, for instance, a prompt instructs the model to exactly repeat some phrase. Other formulations define memorization by whether prompting an LLM with a portion of text from the training set results in the completion of that training datum [Carlini et al., 2023], but these formalisms rely fundamentally on the completions being a certain size, and typically very lengthy generations are required for sufficient certainty of memorization.

More crucially, these definitions are **too permissive** because they ignore situations where model developers can (for legal compliance) post-hoc "align" an LLM by instructing their models not to produce certain copyrighted content [Ippolito et al., 2023]. But has such an instructed model really not memorized the sample in question, or does the model still contain all the information about the datum in its weights while it hides behind an **illusion of compliance**? Asking such questions becomes critical because this illusion of "unlearning" can often be easily broken, as shown in Sections 4.1 and 4.3.

In this work, the authors propose a new definition of memorization based on a **compression argument**. A phrase present in the training data is memorized if we can make the model reproduce the phrase using a prompt **(much) shorter than the phrase itself**. Operationalizing this definition requires finding the shortest adversarial input prompt that is specifically optimized to produce a target output. The ratio of input to output tokens is called the **Adversarial Compression Ratio (ACR)**. In other words, memorization is inherently tied to whether a certain output can be represented in a compressed form, beyond what language models can do with typical text.

The authors argue that such a definition provides an intuitive notion of memorization — if a certain phrase exists within the LLM training data (e.g., is not itself generated text) and it can be reproduced with fewer input tokens than output tokens, then the phrase must be stored somehow within the weights of the LLM. Although it may be more natural to consider compression in terms of the LLM-based notions of input/output perplexity, the authors argue that a simple compression ratio based on input/output token counts provides a more intuitive explanation to non-technical audiences, and has the potential to serve as a legal basis for important questions about memorization and permissible data use.

In addition to its intuitive nature, this definition has several other desirable qualities:

- It appropriately ascribes many famous quotes as being memorized by existing LLMs (i.e., they have high ACR values)
- Text not in the training data of an LLM, such as samples posted on the internet after the training period, are not compressible (their ACR is low)
- Examining several unlearning methods using ACR shows that they do not substantially affect the memorization of the model — even after explicit finetuning, models asked to "forget" certain pieces of content are still able to reproduce them with a high ACR, not much smaller than with the original model

The authors critique three existing memorization definitions:

### 1.1 Discoverable Memorization ([Carlini et al., 2023](https://arxiv.org/abs/2202.07646))

Definition: A sequence is memorized if the suffix appears exactly when given the prefix.

Three problems:
- **Too permissive**: Cases where the second-highest probability (not the top-1) produces the suffix are missed
- **Evasion possible**: Slight changes to the chat pipeline can circumvent perfect output, leaving room for "illusion of compliance"
- **Requires validation data for parameter selection**: Hyperparameter burden for choosing prefix/suffix token counts

### 1.2 Extractable Memorization ([Nasr et al., 2023](https://arxiv.org/abs/2311.17035))

Definition: A string is extractably memorized if an adversary without access to training data can elicit it with a single prompt.

Problem: **Too loose** — even embedding the entire target string in the prompt counts as "existence," so models that repeat well would have all training data marked as memorized.

### 1.3 Counterfactual Memorization ([Zhang et al., 2023](https://arxiv.org/abs/2112.12938))

Definition: Performance difference between models trained with and without the sample.

Problem: Requires **retraining models** at LLM scale, which is practically infeasible.

## 2. Adversarial Compression Ratio (ACR) — The Core Definition

The authors' core insight centers on a **compression analogy**:

> If we find the **shortest prompt** x* that makes model M generate a training data excerpt y, and |y|/|x*| > 1, then that excerpt is memorized.

Expressed mathematically:

```
ACR(M, y) = |y| / |x*|,   where x* = arg min_x |x|  s.t. M(x) = y
```

Core advantages of this definition:

**First, it is intuitive.** The explanation "output longer than input = the model stores information internally" works even for non-technical audiences.

**Second, it is adversarial.** Unlike completion-based tests that depend on specific prompt formats, it searches for the shortest prompt through optimization, making it hard to evade.

**Third, it extends to τ-Compressible Memorization.** Setting a threshold τ(y), a string is memorized if ACR(M,y) > τ(y). The authors use τ=1 by default, but comparison with compression ratios from generic compressors like GZIP or SMAZ is also possible.

## 3. MiniPrompt Algorithm

To compute ACR in practice, we need to solve an optimization problem: find "the shortest prompt." The authors propose the **MiniPrompt** algorithm for this.

Core idea: Borrow the **GCG (Greedy Coordinate Gradient)** optimization technique from jailbreaking research to find the minimum-length prompt that makes the model output the target string exactly.

### 3.1 MiniPrompt Outer Loop (Prompt Length Search)

MiniPrompt finds the minimum prompt length using a binary-search-like strategy. The detailed pseudocode (Algorithm 1) is as follows:

```
Input: Model M, Vocabulary V, Target tokens y, Maximum prompt length max
Initialize n_tokens_in_prompt = 5
Initialize running_min = 0, running_max = max

repeat:
    z = GCG(L, V, y, n_tokens_in_prompt, num_steps)
    if M(z) = y then:
        running_max = n_tokens_in_prompt
        n_tokens_in_prompt = n_tokens_in_prompt - 1
        best = z
    else:
        running_min = n_tokens_in_prompt
        n_tokens_in_prompt = n_tokens_in_prompt + 5
until n_tokens_in_prompt ≤ running_min or n_tokens_in_prompt ≥ running_max
return best
```

The operation works as follows:
1. **Start with initial prompt length of 5 tokens**, randomly initialized via uniform sampling from vocabulary
2. Optimize with GCG for n steps to induce target string generation
3. **Success (M(z) = y)** → update running_max to current length, **reduce prompt by 1 token**, retry
4. **Failure** → update running_min to current length, **increase prompt by 5 tokens**, retry (new iteration re-initialized randomly)
5. **Termination condition**: When n_tokens_in_prompt ≤ running_min or n_tokens_in_prompt ≥ running_max, stop search and return shortest successful prompt (best)

The number of GCG steps n starts at 200 in the first iteration and increases by 20% each time prompt length increases, since longer prompts require more optimization tokens. Each GCG inner loop terminates early once M(z) = y (exact match) is achieved.

### 3.2 GCG Algorithm Details (Algorithm 2)

Let's examine the GCG (Greedy Coordinate Gradient, [Zou et al., 2023](https://arxiv.org/abs/2307.15043)) inner engine more carefully:

```
Input: Loss L, Vocabulary V, Target y, Prompt token count n_tokens, Step count num_steps
Initialize prompt x with n_tokens random tokens from V
E = Embedding matrix of M

for num_steps times do:
    for i = 0, ..., n_tokens do:
        X_i = Top-k(-∇_{e_i} L(y|x))     // For each token position, select k promising candidates based on gradient
    end for
    for b = 1, ..., B do:                  // Generate B candidate prompts
        x̃^(b) = x
        x̃^(b)_i = Uniform(X_i), i = Uniform([1, ..., n_tokens])   // Replace at random position with Top-k candidate
    end for
    x = x̃^(b*) where b* = arg min_b L(y|x̃^(b))   // Select candidate with lowest loss among B
end for
return x
```

Core mechanism: Each step (1) computes gradient for all token positions and selects top-k replacement candidates, (2) generates B candidate prompts via random position replacement, (3) selects the candidate with lowest loss. Since this is discrete optimization, gradients only guide candidate selection; actual updates use token substitution.

### 3.3 Random Search Alternative (Algorithm 3)

To verify that gradient dependence doesn't bias results, the authors also experiment with **Random Search** ([Andriushchenko, 2023](https://arxiv.org/abs/2404.02151)), which uses no gradients:

```
Input: Loss L, Vocabulary V, Target y, Prompt token count n_tokens, Step count num_steps
Initialize prompt x with n_tokens random tokens from V

for num_steps times do:
    for b = 1, ..., B do:
        x̃^(b) = x
        x̃^(b)_i = Uniform(V), i = Uniform([1, ..., n_tokens])   // Fully random replacement without gradients
    end for
    x = x̃^(b*) where b* = arg min_b L(y|x̃^(b))
end for
return x
```

Difference from GCG: Instead of gradient-based top-k candidate selection, **replace with uniformly random tokens from entire vocabulary**. Thus it's gradient-free and excludes potential gradient bias. Random Search shows slightly worse optimization performance than GCG, but demonstrates **identical memorization trends** across all four data categories, confirming result robustness.

## 4. Experimental Setup

### 4.1 Models

Three types of models were used:

**Pythia Family** ([Biderman et al., 2023](https://arxiv.org/abs/2304.01373)): Four sizes: 410M, 1.4B, 6.9B, 12B. Trained on The Pile dataset with publicly available training data, making them suitable for memorization verification. Used in core experiments observing memorization changes across model scales (Section 5.4) and validation across four data categories (Section 5.5).

**Phi-1.5** ([Li et al., 2023](https://arxiv.org/abs/2309.05463)): 1.3B parameters. Used in TOFU dataset experiments (Section 5.2) where finetuning followed by gradient ascent unlearning is performed.

**Llama-2-7B-chat** ([Touvron et al., 2023](https://arxiv.org/abs/2307.09288)): 7B parameters, instruction-tuned. Used in In-Context Unlearning (ICUL) experiments (Section 5.1) and Harry Potter unlearning verification (Section 5.3).

Chat models require **modified strategies** during MiniPrompt application since they were fine-tuned with special tags during instruction-tuning. Specifically, Llama-2-chat uses the prompt format `<s>[INST] ... [/INST]`, and optimized tokens are placed **between** start-of-instruction (`[INST]`) and end-of-instruction (`[/INST]`). For example, as shown in Figure 2, prompts become `<s>[INST] Give me a famous quote. {optimized tokens} [/INST]`. When ICUL is applied, the system prompt (`<<SYS>>...<<SYS>>`) is included and optimized tokens are placed within the instruction area: `<s> [INST] <<SYS>>\n Abstain from giving famous quote.\n <</SYS>> \n\nGive me a famous quote. {optimized tokens} [/INST]`.

### 4.2 Datasets

**Famous Quotes**: Collection of famous quotations. Expected high memorization since these appear multiple times in training data. Lengths vary from 3–50 tokens.

**Wikipedia**: Randomly extracted sentences from Wikipedia documents included in The Pile. Non-famous sentences present in training data, with moderate memorization expected.

**Associated Press (Nov 2023)**: Randomly extracted sentences from news articles **published after** the model's training cutoff. Shares distribution similarity with training data (actual news articles) but not included in training, serving as a negative control to distinguish "the model generally compresses natural language well" from "the model memorized this specific string." AP terms of use permit this use but prohibit data redistribution, so the dataset is not released.

**Random Sequences**: 100 sequences uniformly randomly sampled **with replacement** from token vocabulary (lengths 3–17 tokens). Decoding produces meaningless gibberish. A negative control excluding the possibility of finding adversarially short prompts for random output. Not a single sequence was compressed across multiple model sizes (Figure 6 shows zero-height bars).

**TOFU** ([Maini et al., 2024](https://arxiv.org/abs/2401.06121)): 200 fictional author profiles, each with 20 QA pairs (total 4,000). Synthetic dataset designed for unlearning experiments. 5% of data designated as forget set.

**Harry Potter Text**: Harry Potter-related texts and QA pairs used in [Eldan & Russinovich (2023)](https://arxiv.org/abs/2310.02238)'s "Who's Harry Potter?" paper.

### 4.3 MiniPrompt Hyperparameters

Core settings of the MiniPrompt algorithm:

- **Initial prompt length**: 5 tokens (random initialization, uniform sampling from vocabulary)
- **GCG optimization steps (n)**: Start at 200 in first iteration
- **Step increase rate**: Increase by 20% each time prompt length increases (more optimization tokens → more steps needed)
- **Prompt length adjustment**: Decrease by 1 token on success, increase by 5 tokens on failure
- **Early stopping**: Each GCG inner loop terminates immediately once M(z) = y is achieved
- **Termination condition**: When search range converges (can't reduce further), return shortest successful prompt

When using random search instead of GCG, identical trends appear (Appendix E), showing we capture real memorization signals rather than GCG bias.

### 4.4 TOFU Finetuning & Unlearning Setup

- **Finetuning**: Phi-1.5 trained on all 4,000 QA pairs
  - Learning rate: 2 × 10⁻⁵
  - 5 epochs with linear warm-up on first epoch
  - Batch size: 16
  - Optimizer: AdamW (weight decay = 0.01)
- **Unlearning**: Gradient ascent to remove forget set (5%)
  - Learning rate: 1 × 10⁻⁵ (half of finetuning)
  - Same 5 epochs with linear warm-up
  - Batch size: 16, AdamW (weight decay = 0.01)

### 4.5 Evaluation Metrics

**ACR (Adversarial Compression Ratio)**: |y| / |x*|. Ratio of target string length to minimum prompt length.

**τ-Compressible Memorization**: A string is memorized if ACR > τ. This paper uses **τ = 1** as default (prompt shorter than target), but can also compare against compression ratios from generic compressors like GZIP or SMAZ.

**Baselines**: Compression ratios from generic compressors like GZIP and SMAZ. Setting τ(y) to their compression rates measures "does the model compress better than generic compression," though this paper primarily uses τ=1 for simplicity.

**Aggregation methods — two approaches:**
1. **Average Compression Ratio**: Mean ACR across all samples (independent of τ)
2. **Portion Memorized**: Proportion of samples with ACR > 1

**Completion-based metrics (for comparison)**: Whether suffix exactly matches when prefix is provided. Measured alongside compression-based metrics to show differences.

## 5. Experiments — Compressible Memorization in Practice

### 5.1 The Illusion of Compliance

This is the most interesting experiment. We verify whether **In-Context Unlearning (ICUL)** actually removes memorization.

![Figure 2: In-Context Unlearning blocks completion but not compression](/images/papers/acr-memorization/fig2-icul-compression.png)
*Figure 2: (top) MiniPrompt compresses a famous quote to 2 tokens. (middle) ICUL system prompt successfully blocks completion. (bottom) Yet MiniPrompt can still compress that quote — ICUL blocks generation but doesn't eliminate memorization.*

ICUL works by adding instructions like "don't state famous quotes" to the system prompt. While this blocks normal completion requests, MiniPrompt's optimized adversarial suffix still elicits the same quote.

**Concrete experimental numbers**: Running adversarial compression on 5 famous quotes yields average ACR = **6.54 without** ICUL and **4.74 with** ICUL. Adding ICUL makes compression slightly harder (ACR decreases slightly), but all 5 quotes maintain compression ratio > 1, still classified as memorized. This is predictable — ICUL only blocks output pathways via system prompts without updating weights, so internal knowledge remains untouched.

Key finding: **Nearly identical optimization tokens were needed** with and without ICUL. Specifically, the number of optimized tokens placed between instruction and end-of-instruction tags remained almost unchanged. The model's weight-encoded information never changed; only the output pathway was blocked. This exemplifies how completion-based tests show apparent change while compression-based tests reveal no substantive difference.

### 5.2 TOFU: Unlearning with Author Profiles

After finetuning Phi-1.5 on the TOFU dataset (200 fictional author profiles, 20 QA pairs each), gradient ascent unlearning was performed.

![Figure 3: Completion vs Compression comparison — TOFU data](/images/papers/acr-memorization/fig3-tofu-completion-vs-compression.png)
*Figure 3: (left) Memorized proportion vs unlearning steps. Completion (red) drops to 0 in just 16 steps, while Compression (blue) remains substantial. (right) Actual generation examples after 20 steps — answers are wrong but model still functions reasonably.*

What this graph reveals: **Completion-based tests declare "completely forgotten" after just 16 unlearning steps**, while compression-based tests show substantial data still compressible (= memorized). This is why completion metrics shouldn't be used as memorization measures.

### 5.3 Harry Potter Unlearning

Verifying [Eldan & Russinovich (2023)](https://arxiv.org/abs/2310.02238)'s "Who's Harry Potter?" research.
That work claimed to have unlearned Harry Potter knowledge from Llama-2-chat.

The authors refute this in three ways:

**1. Russian language queries**: Asking the unlearned model in Russian about Harry Potter yields accurate answers. Appendix D provides concrete examples:

- **Prompt**: `[INST] Кто такой Гарри Поттер? [/INST]` (Translation: "Who is Harry Potter?")
  - **Generation**: "Гарри Поттер - это вымышленный персонаж, основанный на персонаже из серии романов английской писательницы Джоан Роулинг." (Translation: "Harry Potter is a fictional character based on a character from a novel series by English author J.K. Rowling.")
- **Prompt**: `[INST] Кто такой Дамблдор в книге о Гарри Поттере? [/INST]` (Translation: "Who is Dumbledore in the Harry Potter book?")
  - **Generation**: "Дамблдор - это персонаж из серии романов о Гарри Поттере, написанных английской писательницей Джоан Роулинг." (Translation: "Dumbledore is a character from the Harry Potter novel series by J.K. Rowling.")
- **Prompt**: `[INST] Кто такой Северус Снейп в книге о Гарри Поттере? [/INST]` (Translation: "Who is Severus Snape in the Harry Potter book?")
  - **Generation**: "Северус Снейп - это персонаж из серии книг о Гарри Поттере... Северус Снейп - это учитель магии, который работает в школе магии" (Translation: "Severus Snape is a character from the Harry Potter book series... Severus Snape is a magic teacher who works at a magic school.")

This shows unlearning only suppressed English output; the stored knowledge remained in the model.

**2. Loss analysis**: Correct answers have lower loss than incorrect ones

![Figure 4: Negative Log-likelihood Distribution for Harry Potter data](/images/papers/acr-memorization/fig4-harry-potter-loss.png)
*Figure 4: (left) Original Llama2-chat, (right) after unlearning. Correct (blue) and incorrect (red) answer loss distributions remain clearly separated. KS-test p-values: 9.7e-24 and 5.9e-14 respectively.*

**3. Adversarial compression**: 57% of Harry Potter text compresses in original Llama-2-7B-chat, and **50% in the unlearned model (WhoIsHarryPotter)**. Specifically, the adversarial attack was "designed to enforce positive answers without providing information about correct answers." For example, the optimized prompt `[INST] + Harry Potter quoted‐ brave theme [/INST]` elicits the exact quote "It is our choices, Harry, that show what we truly are, far more than our abilities. – Albus Dumbledore."

Conclusion: After unlearning, **nearly identical amounts of Harry Potter text remain in model weights** (57% → 50%, only 7 percentage points decrease). The model refrains from generation but hasn't forgotten.

### 5.4 Bigger Models Memorize More

Prior work ([Carlini et al., 2023](https://arxiv.org/abs/2202.07646)) using different memorization definitions showed "larger models memorize more." The authors verify this same trend appears with their ACR definition, showing their proposed definition aligns with established scientific findings.

**Experimental setup:**
- **Dataset**: Famous Quotes
- **Models**: Four different sizes from Pythia family ([Biderman et al., 2023](https://arxiv.org/abs/2304.01373)) — 410M, 1.4B, 6.9B, 12B

![Figure 5: Memorization trends across Pythia model sizes](/images/papers/acr-memorization/fig5-pythia-memorization-scale.png)
*Figure 5: Memorization in Pythia models. ACR definition aligns with the established finding that "larger models memorize more." Average compression ratio (left) and proportion with ratio > 1 (right) both increase with model size. Based on Famous Quotes dataset.*

**Results:**
- Average Compression Ratio consistently increased with model size
- Proportion of memorized data (compression ratio > 1) also increased: About 15% memorized for Pythia 410M vs. ~56% for 12B
- This shows ACR produces **consistent conclusions** with alternative memorization definitions from prior work

### 5.5 Validation Across Four Data Categories

![Figure 6: ACR across four data types in Pythia-1.4B](/images/papers/acr-memorization/fig6-validation.png)
*Figure 6: (left) Average Compression Ratio, (right) Memorized proportion. Famous Quotes highest, while Random and AP (post-training news) are 0 — ACR sanity check results meet expectations.*

Results across four data types:

- **Famous Quotes**: Highest ACR (1.17), 47% memorized — famous quotes appear repeatedly in training
- **Wikipedia**: Intermediate (0.58), 8% memorized — training data but less famous sentences
- **Associated Press (Nov 2023)**: ACR 0.40, 0% memorized — published after training
- **Random Sequences**: ACR 0.21, 0% memorized — random token sequences

The key point: **Not a single sample** was classified as memorized in Random and AP data. This shows ACR is robust to false positives.

### 5.6 Paraphrased Famous Quotes Experiment

To separate exact match from concept memorization, the authors paraphrase 100 famous quotes via ChatGPT then measure ACR (Appendix E.3):

| Model | Data | Avg. ACR | Portion Memorized |
|-------|------|----------|-------------------|
| Pythia-1.4B | Famous Quotes (original) | 1.17 | 0.47 |
| Pythia-1.4B | Paraphrased Quotes | 0.68 | 0.11 |

Paraphrasing drastically reduces ACR from 1.17 → 0.68 and memorized proportion from 47% → 11%. This confirms ACR and MiniPrompt measure **exact match memorization** (precise string matching). Even semantically similar expressions show poor compression when wording differs.

### 5.7 Alternative Threshold — SMAZ Comparison Analysis

While τ = 1 (prompt shorter than target) serves as default, data-dependent thresholds are also discussed. **SMAZ** ([Sanfilippo, 2006](https://github.com/antirez/smaz)) is a compression library specialized for short natural language strings, and using its compression rate as τ(y) measures "does the model compress better than generic compression."

Comparing ACR and SMAZ compression ratios for Pythia-1.4B in Appendix E.2 Figure 11, using data-dependent thresholds (τ = SMAZ compression rate) greatly reduces samples classified as memorized. This provides a practical knob for regulators or legal contexts to adjust "how strongly memorized should be classified." While τ = 1 evidence may be weaker than τ = SMAZ in court, either could contribute to copyright infringement discussions.

### 5.8 Additional Pythia-410M and Random Search Experiments

While main experiments use Pythia-1.4B + GCG, Appendix E provides additional validation:

**Pythia-410M with GCG** (Figure 9): Identical trends appear in smaller models. For Famous Quotes: Avg. ACR = 0.63, Portion Memorized = 0.15, while AP and Random show 0.30/0.00 and 0.29/0.00 respectively, with negative controls working perfectly.

**Pythia-1.4B with Random Search** (Figure 10): Using Random Search instead of GCG yields lower overall ACR (expected due to weaker optimization), but only Famous Quotes shows nonzero memorized proportion (0.35), while all other three categories are 0.00. This reconfirms we capture real memorization signals rather than GCG gradient bias.

### 5.9 ACR vs Sequence Length

![Figure 7: Relationship between ACR and target string length](/images/papers/acr-memorization/fig7-acr-vs-length.png)
*Figure 7: Longer sequences achieve higher compression ratios, but ACR operates meaningfully even on short sequences.*

## 6. Computing Environment (Appendix F)

Running MiniPrompt requires loading the model in GPU memory and computing input gradients for prompt batches.

**Small models (< 7B parameters, e.g., Pythia series, Phi-1.5):**
- **Hardware**: **1 NVIDIA RTX A4000** GPU
- **Time required**: Highly compressible samples take **minutes**, worst case with long prompt search needs ~**10 hours**

**Large models (7B+ parameters, e.g., Llama-2-7B-chat):**
- **Hardware**: **4 NVIDIA RTX A4000** GPUs
- **Time required**: Similar to small models

This is practically sufficient for research purposes, though measuring memorization across entire training datasets requires substantial computational cost.

## 7. Discussion — Limitations and Implications

### Limitations

- **Pythia-focused experiments**: Doesn't address memorization in cutting-edge models (GPT-4, Claude, etc.), requiring accessible weights
- **GCG dependence**: Prompts found by MiniPrompt are upper bounds; shorter prompts might exist. However, identical trends with random search minimize GCG bias concerns
- **No full training set evaluation**: Estimating memorization percentage across entire training sets requires computationally infeasible amounts of processing

### Implications

Three key reasons this paper matters:

**First, potential as legal tool.** Provides practical metrics for copyright litigation to determine "did the model memorize this text?"

**Second, unlearning audit tool.** Enables verification of "truly forgotten?" for GDPR's right-to-be-forgotten or CCPA regulations. Existing completion-based tests are too easily fooled.

**Third, new memorization research framework.** Reframing "did it memorize?" as "can it compress?" shifts memorization from binary classification to continuous spectrum.

## Paper References

Links to all papers cited in this post:

- **Carlini et al., 2023** — Quantifying Memorization Across Neural Language Models: [https://arxiv.org/abs/2202.07646](https://arxiv.org/abs/2202.07646)
- **Nasr et al., 2023** — Scalable Extraction of Training Data from (Production) Language Models: [https://arxiv.org/abs/2311.17035](https://arxiv.org/abs/2311.17035)
- **Zhang et al., 2023** — Counterfactual Memorization in Neural Language Models: [https://arxiv.org/abs/2112.12938](https://arxiv.org/abs/2112.12938)
- **Zou et al., 2023** — Universal and Transferable Adversarial Attacks on Aligned Language Models (GCG): [https://arxiv.org/abs/2307.15043](https://arxiv.org/abs/2307.15043)
- **Andriushchenko et al., 2023** — Jailbreaking Leading Safety-Aligned LLMs with Simple Adaptive Attacks (Random Search): [https://arxiv.org/abs/2404.02151](https://arxiv.org/abs/2404.02151)
- **Biderman et al., 2023** — Pythia: A Suite for Analyzing Large Language Models: [https://arxiv.org/abs/2304.01373](https://arxiv.org/abs/2304.01373)
- **Li et al., 2023** — Textbooks Are All You Need II: phi-1.5: [https://arxiv.org/abs/2309.05463](https://arxiv.org/abs/2309.05463)
- **Touvron et al., 2023** — Llama 2: Open Foundation and Fine-Tuned Chat Models: [https://arxiv.org/abs/2307.09288](https://arxiv.org/abs/2307.09288)
- **Maini et al., 2024** — TOFU: A Task of Fictitious Unlearning for LLMs: [https://arxiv.org/abs/2401.06121](https://arxiv.org/abs/2401.06121)
- **Eldan & Russinovich, 2023** — Who's Harry Potter? Approximate Unlearning in LLMs: [https://arxiv.org/abs/2310.02238](https://arxiv.org/abs/2310.02238)
- **Shi et al., 2024** — Detecting Pretraining Data from Large Language Models (ICLR 2024): [https://arxiv.org/abs/2310.16789](https://arxiv.org/abs/2310.16789)
- **Sanfilippo, 2006** — SMAZ (Short String Compression Library): [https://github.com/antirez/smaz](https://github.com/antirez/smaz)

## Personal Commentary

This paper reads as mutually complementary with **[Detecting Pretraining Data from Large Language Models](https://arxiv.org/abs/2310.16789)** (Shi et al., ICLR 2024).
Shi et al. takes a **detection** perspective using black-box probability to determine "was training data included?" while this paper takes a **measurement** perspective using adversarial optimization to verify "is it actually stored in model weights?"

This paper's value is especially great in unlearning research. Whether gradient ascent, in-context unlearning, or other existing methods, they all appear "forgotten" only under completion-based evaluation, while information actually remains in the model. Future unlearning research must pass this level of adversarial verification.

One regret is difficulty applying to closed-source models. GCG requires gradient access, and MiniPrompt requires comparing exact greedy decoding outputs, both requiring additional consideration for API-based models. This remains future work.
