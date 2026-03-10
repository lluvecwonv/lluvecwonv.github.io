---
title: "MUSE: Machine Unlearning Six-Way Evaluation for Language Models"
date: 2026-03-10
category: 연구노트
tags: [Machine Unlearning, LLM, Privacy, Copyright, Benchmark, NeurIPS 2024]
language: en
summary: "MUSE proposes a comprehensive six-dimensional benchmark for evaluating machine unlearning in language models, covering both data owner expectations (no verbatim/knowledge memorization, no privacy leakage) and deployer requirements (utility, scalability, sustainability). Results show current methods fall far short of practical deployment."
---

# MUSE: Machine Unlearning Six-Way Evaluation for Language Models

**Authors:** Weijia Shi\*, Jaechan Lee\*, Yangsibo Huang\*, Sadhika Malladi, Jieyu Zhao, Ari Holtzman, Daogao Liu, Luke Zettlemoyer, Noah A. Smith, Chiyuan Zhang

**Venue:** NeurIPS 2024 (Datasets and Benchmarks Track)
**Links:** [Project Page](https://muse-bench.github.io) · [arXiv](https://arxiv.org/abs/2406.06369)

---

## Why Machine Unlearning Matters

Language models are trained on massive text corpora that inevitably include private and copyrighted content. Under regulations like the GDPR, data owners can request their data be removed from trained models. Recent copyright lawsuits against AI companies further emphasize this need. The ideal solution — retraining from scratch without the offending data — is prohibitively expensive for modern LMs. This has driven research into **machine unlearning**: approximate algorithms that transform a trained model to behave as if certain data was never seen.

But how do we know if unlearning actually works? Previous evaluations have been narrow, typically checking only whether a model can still answer questions about forgotten content. MUSE argues this is insufficient and proposes a much more comprehensive evaluation framework.

## The Six Dimensions of MUSE

MUSE evaluates unlearning along six dimensions, organized by two stakeholder perspectives:

### Data Owner Expectations

1. **No Verbatim Memorization (C1):** The unlearned model should not reproduce exact text from the forget set. Measured via ROUGE-L between model continuations and original text, given 32-token prompts.

2. **No Knowledge Memorization (C2):** Beyond verbatim text, factual knowledge from the forget set should also be removed. Evaluated using QA pairs — for Harry Potter books, questions about plot, characters, and events; for news, questions about article content.

3. **No Privacy Leakage (C3):** An adversary should not be able to determine whether specific data was in the original training set. MUSE uses membership inference attacks (specifically Min-K% Prob) to test whether the forget set can be distinguished from truly held-out data. This is measured as the gap between the MIA metric distributions on forget vs. hold-out data.

### Deployer Expectations

4. **Utility Preservation (C4):** Unlearning should not degrade the model's performance on data it should still know (the retain set). MUSE measures this as the ratio of KnowMem on the retain set before and after unlearning.

5. **Scalability (C5):** The method should handle varying sizes of forget sets — from small to large-scale content removal (0.8M to 3.3M tokens in MUSE's experiments).

6. **Sustainability (C6):** In practice, unlearning requests arrive sequentially over time. The method should handle multiple successive unlearning operations without catastrophic degradation.

## Experimental Setup

MUSE benchmarks eight unlearning algorithms from four families:

**Four base methods:**
- **Gradient Ascent (GA):** Reverses the training objective on the forget set
- **Negative Preference Optimization (NPO):** Treats forget data as negative preferences, adapted from DPO
- **Task Vectors (TV):** Subtracts the weight direction learned from the forget set
- **Who's Harry Potter (WHP):** Interpolates output distributions between the target and a reinforced model

**Two regularizers** (combined with GA and NPO):
- **GDR:** Additional gradient descent on the retain set
- **KLR:** KL divergence minimization between the unlearned and target model on retain data

This yields 8 methods total: GA, GA+GDR, GA+KLR, NPO, NPO+GDR, NPO+KLR, TV, WHP.

**Datasets:** Two realistic scenarios using 7B-parameter models:
- **Books:** Harry Potter series (copyright scenario) with a specially pretrained base model that excluded HP from training
- **News:** BBC news articles collected after LLaMA-2's release date (privacy scenario)

## Key Findings

### Most methods remove memorization, but at a steep cost

GA and NPO without regularizers achieve perfect scores on verbatim and knowledge memorization (reducing both to zero). However, this comes because these methods essentially cause the model to collapse — they also destroy utility on the retain set entirely.

Regularized variants (GA+KLR, NPO+KLR) and methods like TV and WHP achieve more nuanced forgetting, but the trade-off between forgetting and utility preservation remains stark. All methods degrade utility by 24% to 100%.

### Privacy leakage remains a critical failure

This is perhaps MUSE's most important finding. Most unlearning methods either **under-unlearn** (leaving statistical traces of the forget data) or **over-unlearn** (making the forget data look suspiciously unfamiliar), both of which leak membership information.

Methods without regularizers (GA, NPO+GDR) tend to over-unlearn, pushing MIA scores far above 0.5. KLR-regularized methods tend to under-unlearn, barely improving over the target model. Only Task Vectors achieve AUC close to the ideal 0.5 — but at the cost of significant utility degradation.

### Scalability and sustainability are unsolved

As the forget set grows from 0.8M to 3.3M tokens, model utility drops sharply across all methods. Even more critically, sequential unlearning — applying the algorithm multiple times for successive requests — causes faster degradation than a single large unlearning operation. Most methods collapse to zero utility after just a few sequential rounds.

## Why This Matters

MUSE reveals a fundamental tension in current unlearning approaches: methods that effectively remove memorization tend to destroy general capabilities, while methods that preserve utility fail to provide meaningful privacy guarantees. No existing method satisfies all six criteria simultaneously.

This has direct practical implications. Organizations subject to GDPR or facing copyright claims cannot currently rely on approximate unlearning to fulfill their obligations — the algorithms either fail to truly erase the data (detectable via MIA) or render the model unusable.

The benchmark also highlights that scalability and sustainability — arguably the most important properties for real-world deployment where requests arrive continuously — are the least developed aspects of current approaches.

## Personal Takeaways

The privacy leakage dimension is particularly thought-provoking. The insight that over-unlearning is just as bad as under-unlearning — because making data look "too unfamiliar" is itself an information leak — challenges the intuitive assumption that "more forgetting = better privacy."

The sustainability results are sobering for anyone hoping to deploy unlearning in production. If each unlearning request degrades the model, and you cannot realistically retrain from scratch every time, current methods create an unsustainable trajectory.

MUSE makes a strong case that the field needs fundamentally new approaches rather than incremental improvements to existing gradient-based methods. The benchmark itself — with its comprehensive evaluation framework and realistic scenarios — provides a solid foundation for measuring progress.
