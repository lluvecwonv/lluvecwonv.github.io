---
title: "Hubble: A Model Suite to Advance the Study of LLM Memorization - Paper Analysis"
date: 2026-03-27
summary: "An analysis of the ICLR 2026 paper presenting Hubble, a fully open-source model suite designed for systematic study of LLM memorization. Through standard/perturbed model variants (1B/8B parameters, 100B/500B tokens), the paper quantitatively measures memorization risks across copyright, privacy, and test set contamination domains, establishing dilution and ordering as two best practices. Also demonstrates Hubble's utility as a benchmark for membership inference attacks and machine unlearning."
tags: [LLM, Memorization, Privacy, Copyright, Test Set Contamination, Machine Unlearning, Membership Inference, Open Source, ICLR 2026, Research Notes]
category: Research Notes
language: en
---

# Hubble: a Model Suite to Advance the Study of LLM Memorization

**Venue:** ICLR 2026 (Oral)
**Authors:** Johnny Tian-Zheng Wei, Ameya Godbole, Mohammad Aflah Khan, Ryan Wang, Xiaoyuan Zhu, James Flemings, Nitya Kashyap, Krishna P. Gummadi, Willie Neiswanger, Robin Jia
**Affiliations:** University of Southern California, Max Planck Institute for Software Systems
**Paper Link:** [Project Page](https://allegro-lab.github.io/hubble/)

![Hubble Logo](/figures/hubble/hubble_patch-min.png)

---

## One-Line Summary

A fully open-source LLM model suite called **Hubble** that enables systematic study of memorization across **copyright, privacy, and test set contamination** domains, empirically establishing **dilution** and **ordering** as two best practices for mitigating memorization risks.

---

## 1. Overview and Motivation

The ability of large language models to memorize training data has dual consequences. On one hand, memorization supports downstream task performance, especially for factual knowledge. On the other hand, it gives rise to deployment risks: copyright risks (reproducing copyrighted material), privacy risks (revealing personal information), and test set contamination risks (memorizing benchmark answers).

Prior work falls on two ends of a spectrum:
- **Controlled studies:** Smaller models trained on synthetic/templated data allow precise measurement but differ substantially from commercial LLMs
- **Observational studies:** Analyze larger pretrained models but cannot estimate causal quantities on memorization

Hubble bridges this gap by enabling **controlled experimentation on larger models**. Inspired by the Pythia model suite, it provides fully open-source LLMs based on the Llama architecture in **standard** and **perturbed** variants. Perturbed models contain controlled text insertions designed to emulate key memorization risks across three domains.

---

## 2. Perturbation Design across Risk Domains

The core design principle of Hubble is the **randomized controlled insertion** of text into training data. Each perturbation example is randomly assigned a duplication count from {0×, 1×, 4×, 16×, 64×, 256×}.

### 2.1 Copyright Domain

**Passages:**
- **Popular Gutenberg** books: Short passages sampled from high-download-count books
- **Unpopular Gutenberg** books: Short passages from low-download-count books, stratified by popularity to study data density effects
- **Wikipedia** articles: Passages from recent events written after the DCLM corpus cutoff date

**Paraphrases:**
- From **MRPC** and **PAWS** datasets: One of two literally different but semantically equivalent paraphrases randomly inserted
- Tests memorization of literal expressions, relevant since copyright protects expression rather than facts

### 2.2 Privacy Domain

**Biographies:**
- **YAGO** knowledge base: Templated biographies with 9 attributes (names, nationalities, birthdays, UUIDs, etc.)
- **ECtHR** (European Court of Human Rights): Court cases with annotated PII
- Enables study of PII leakage during pretraining rather than fine-tuning

**Chats:**
- **Personachat** dialogues with randomly assigned usernames
- Simulates **indirect leakage** where models infer sensitive personal attributes from public text

### 2.3 Test Set Contamination Domain

**Standard test sets:** PopQA, Winogrande (Infill and MCQ formats), MMLU, HellaSwag, PIQA

**New test sets:** ELLie (ellipsis resolution) and MUNCH (metaphor understanding), created after DCLM cutoff to minimize unintended contamination

---

## 3. The Hubble Model Suite

### 3.1 Pretraining Data

**Base corpus:** DataComp-LM (DCLM) baseline dataset, a model-based data filtering pipeline over CommonCrawl. Tokenized with the OLMo tokenizer to produce 500B+ tokens. The 100B corpus is a subset of the first 100B training tokens.

**Decontamination:** Training documents matching perturbations are removed. Only 7,540 documents removed (<0.002% of all documents).

**Perturbation insertion process:**

![Perturbation Insertion Process](/figures/hubble/injection-visualization-v4.png)

The insertion procedure:
1. Sample a training sequence from the standard process
2. Sample a gap between documents in the sequence
3. Splice the perturbation between existing documents
4. Resize to original sequence length while ensuring perturbation is not truncated

Total perturbation data after duplication: 79.9M tokens (818k sequences), only **0.08%** of the 100B corpus and **0.016%** of the 500B corpus.

### 3.2 Model Architecture and Training

**Architecture:** Based on Llama 3, with key modifications:
- OLMo tokenizer (vocabulary 128K → 50K)
- Untied weight embeddings (supports logit lens and other interpretability methods)
- 8B model uses 36 layers instead of 32 (GPU utilization optimization)

**Training configuration:**
- GPT-NeoX framework (Megatron-LM + DeepSpeed)
- Global batch size 1024, sequence length 2048
- Learning rate 4e-4, cosine annealing, Adam optimizer (β1=0.9, β2=0.95)
- 500B tokens: 238,500 gradient updates; 100B tokens: 48,000 updates
- A100 GPU cluster (64 GPUs), 200,000 total GPU hours

### 3.3 Model Variants

| Experiment | Configuration | Purpose |
|-----------|---------------|---------|
| **Core** | 2×2×2 factorial: {1B, 8B} × {Standard, Perturbed} × {100B, 500B} = 8 models | Establish dilution effect |
| **Interference** | 1B, 100B, single-domain perturbations × 3 | Verify minimal cross-domain interference |
| **Timing** | 1B, 100B, perturbations at different training phases × 6 | Study timing effects on memorization |
| **Paraphrased** | 1B/8B, 100B, paraphrased perturbation data | Study memorization of paraphrased knowledge |
| **Architecture** | 1B, 100B, 8/32 layers | Study depth effects |

### 3.4 General Performance Evaluation

Evaluated on the same benchmarks as the Pythia suite, Hubble models perform **on par** with other open-source models at comparable parameter and data scales.

| Model | Tokens | ARC-C | ARC-E | LogiQA | Lambada | PIQA | SciQ | WinoGrande | WSC |
|-------|--------|-------|-------|--------|---------|------|------|------------|-----|
| **Hubble-1B Standard** | 500B | 0.40 | 0.72 | 0.25 | 7.43 | 0.76 | 0.95 | 0.63 | 0.41 |
| **Hubble-1B Perturbed** | 500B | 0.40 | 0.72 | 0.25 | 7.23 | 0.76 | 0.94 | 0.63 | 0.45 |
| Pythia 1B | 300B | 0.28 | 0.57 | 0.25 | 10.86 | 0.70 | 0.92 | 0.53 | 0.43 |
| OLMo-2-1B | 4T | 0.46 | 0.76 | 0.27 | 6.26 | 0.77 | 0.96 | 0.66 | 0.45 |
| **Hubble-8B Standard** | 500B | 0.58 | 0.84 | 0.32 | 3.71 | 0.82 | 0.98 | 0.77 | 0.56 |
| Pythia 6.9B | 300B | 0.39 | 0.71 | 0.28 | 5.65 | 0.77 | 0.95 | 0.64 | 0.51 |
| Llama-3.1-8B | 15T+ | 0.58 | 0.85 | 0.33 | 3.93 | 0.82 | 0.98 | 0.77 | 0.63 |

Minimal difference between Perturbed and Standard models confirms that perturbation insertion does not degrade model quality.

### 3.5 Memorization Evaluation Methods

Three evaluation approaches:

1. **Loss:** Whether seen examples have lower loss compared to unseen examples
2. **Loss-based choice:** Selecting the lowest-loss option among candidate answers
3. **Generative:** Prompting the model and comparing generated continuation against ground truth (exact match, word recall)

---

## 4. Domain-agnostic Results

### 4.1 Dilution: Training on Larger Corpora Reduces Memorization Risks

![Dilution Effect - 8B Models](/figures/hubble/dilution-hubble_8b.png)

The figure shows core experiment results for 8B models. At the same duplication level, **the model trained on 500B tokens shows weaker memorization than the 100B model.** This pattern is consistent across **all domains**: copyright, privacy, and test set contamination.

**Best Practice 1:** Sensitive data can be **diluted** by training on larger corpora. This is complementary to the established practice of deduplication.

### 4.2 Ordering: Placing Sensitive Data Early in Training Reduces Risks

![Timing Effect](/figures/hubble/injectrange-main.png)

When perturbations are inserted only in the **first quarter** of training, the final model does not memorize the data. Conversely, inserting in the **last quarter** results in more memorization than the regular perturbed model.

![Forgetting Curves](/figures/hubble/checkpoint-forgetting-curves.png)

Intermediate checkpoint analysis shows that without continued exposure to duplicates, models can **forget** the perturbations, providing a form of privacy.

**Best Practice 2:** Sensitive data should be **ordered** to appear early in training.

### 4.3 Larger Models Memorize at Lower Duplications

![Model Scale Effect](/figures/hubble/model_scale-dclm_500B.png)

Comparing 1B vs 8B models on the 500B corpus, the **8B model shows higher memorization across all tasks at the same duplication level**, and memorization becomes measurable with fewer duplicates. Increasing model size increases memorization risk, requiring balance with other mitigation strategies.

### 4.4 Minimal Cross-domain Interference

Comparison of single-domain models with the full perturbed model confirms **nearly identical behavior** on each domain's evaluations, establishing that perturbations from different domains minimally interfere with each other.

---

## 5. Domain-specific Results

### 5.1 Copyright

![Copyright Passages Results](/figures/hubble/copyright-passages.png)

**Whether an LLM is considered to memorize depends on the metric:**
- Loss-based metrics show statistically significant differences at low duplicate counts (4×), while k-eidetic memorization only shows differences starting at 16×
- The choice of metric **significantly affects interpretation** of memorization analysis

**Popular vs. unpopular books:**
- At 1B scale: no noticeable difference
- At 8B scale: only slight increase in generative extraction for popular books — the data density hypothesis effect is minimal under basic evaluations

### 5.2 Privacy

![YAGO PII Attack Results](/figures/hubble/privacy-yago.png)

**More auxiliary information leads to higher attack success rates:**
- Full prefix + MCQ attack: accuracy approaches **100%** at 16 duplications on Hubble 8B (100B tokens)
- Name-only strong attacks: accuracy decreases significantly

![PII Type Breakdown](/figures/hubble/privacy-yago-meta.png)

**PII type matters for memorization:**
Attributes such as occupation, email, and UUID are memorized differently. A model may memorize one fact from a document while failing to memorize another from the same source.

![Personachat Results](/figures/hubble/privacy-personachat.png)

**Indirect information inference is difficult but possible:**
- Username → persona inference: near random
- Persona → username inference: up to **34%** accuracy on 64× duplicated chats (8B model)
- All memorization evaluations are only **lower bounds** on what is memorized

**PII can still be inferred from paraphrased biographies:**
- PII reconstruction succeeds even on models trained with paraphrases rather than exact duplicates
- The paraphrased model generalizes to unseen queries for PII — it has not just memorized a fixed string but developed **semantic memory**
- Strong name-only attacks achieve higher accuracy on the 8B paraphrase model than the original perturbed model at high duplication levels

### 5.3 Test Set Contamination

![Test Set Contamination Results](/figures/hubble/testset-set1.png)

**Models begin memorizing with as few as 1 duplicate, but generalization is unpredictable:**
- PopQA, HellaSwag, and PIQA show accuracy increases with just 1 instance of contamination
- However, memorizing test examples **does not translate to task generalization** — performance on unseen examples shows no improvement over standard models, and even degrades for WinoGrande

![WinoGrande Cross-format Results](/figures/hubble/testset-wg.png)

**WinoGrande: models fail to generalize across formats:**
- Examples inserted in MCQ format, tested in infill format: accuracy **decreases** with increased duplication
- Pretraining on a handful of contaminated test examples leads only to memorization, not generalization

---

## 6. Use Cases of Hubble

### 6.1 Membership Inference Attack (MIA) Benchmark

Existing MIA benchmarks (e.g., WikiMIA) suffer from spurious features that trivially leak membership information. Hubble's **randomized duplications** eliminate such confounders, providing a sound benchmark.

**Experimental setup:**
- 4 Hubble model variants × 3 perturbation datasets = 12 settings
- MIA methods: Loss-based, MinK%, MinK%++, Zlib-based
- Non-members: 0 duplications; Members: 1+ duplications

**Results (Hubble 8B, 500B tokens, Perturbed):**

| Evaluation | MIA Method | Dup≠0 | Dup=1 | Dup=4 | Dup=16 | Dup=64 | Dup=256 |
|-----------|-----------|-------|-------|-------|--------|--------|---------|
| Gutenberg Unpopular | Loss | 0.629 | 0.539 | 0.556 | 0.732 | **0.996** | **1.0** |
| | MinK%++ | **0.666** | **0.545** | **0.620** | **0.813** | 0.987 | 0.949 |
| YAGO Biographies | Loss | 0.692 | 0.538 | 0.652 | **0.897** | **1.0** | **1.0** |
| | MinK%++ | **0.714** | **0.571** | **0.686** | 0.892 | 0.995 | 0.983 |
| MMLU | Loss | 0.673 | 0.529 | 0.628 | 0.857 | **1.0** | **1.0** |
| | MinK%++ | **0.743** | **0.580** | **0.731** | **0.943** | 0.994 | 0.986 |

**Key observations:**
- MIA performance consistently improves with increasing duplication
- At **1 duplication, results are near-random** — confirming that MIAs are effective only on highly duplicated data
- **MinK%++** is generally most effective, but surprisingly fails to achieve 100% AUC on 256× duplicates (unlike simpler Loss and MinK%)

### 6.2 Machine Unlearning Benchmark

Existing unlearning benchmarks (TOFU, MUSE, WMDP) operate in fine-tuning settings or target narrow domains. Hubble enables **unlearning evaluation on pretraining data across diverse domains**.

**Setup:**
- Target model: Hubble 8B Perturbed (500B tokens)
- Methods: RMU, RR, SatImp
- Domains: Copyright (Gutenberg Unpopular), Privacy (YAGO)
- Data splits: Unseen (0× duplicated), Unlearn (half of 256× duplicated), Keep (other half of 256×)

![Unlearning Results](/figures/hubble/unlearn_main.png)

**Results:**
- No unlearning method reaches the **desired target** — matching standard model performance on the Unlearn set while retaining everything else
- All methods degrade **Keep set and Test set** performance alongside the Unlearn set
- Keep set degradation (near-neighbors to Unlearn) indicates current methods **erase distribution-level knowledge** rather than precisely targeting selected data
- **SatImp** performs best overall but significant room for improvement remains

---

## 7. Discussion and Conclusion

Hubble pairs a systematic survey of memorization risks with an open-source artifact release. The authors identify three key research directions:

**How is information memorized?**
- Hubble's perturbations enable interpretability studies with controlled causal effects
- Randomized synthetic data (e.g., biographies with UUIDs) can serve as canaries for knowledge localization studies
- Released checkpoints enable study of how memorization evolves throughout training

**How can memorization be measured?**
- More intuitive and robust memorization metrics are needed for copyright and privacy debates
- Hubble's controlled insertions validate new measurements
- Connections to differential privacy and privacy auditing

**How can memorization be mitigated?**
- Two best practices established: dilution and ordering
- Exploration of whether quantization reduces memorization risks
- Since memorization and data poisoning rely on similar mechanisms, advances in memorization mitigation may reduce poisoning vulnerabilities

---

## Key Contributions Summary

1. **Hubble Model Suite**: Fully open-source LLMs in 1B/8B parameters, 100B/500B tokens, standard/perturbed variants
2. **Three-domain perturbation data**: Copyright (book passages, paraphrases), Privacy (YAGO/ECtHR biographies, PersonaChat), Test set contamination (standard/new benchmarks)
3. **Two best practices**: **Dilution** (training on larger corpora) and **Ordering** (placing sensitive data early in training)
4. **New benchmarks**: HubbleMIA (membership inference) and HubbleUnlearning (machine unlearning)
5. **Domain-specific analyses**: Impact of metric choice for copyright, PII type variation for privacy, limitations of generalization from test set contamination

---

## Personal Comments

This paper makes a significant **infrastructural contribution** to LLM memorization research. While Pythia and OLMo serve as open-source model suites for general LLM research, Hubble is the first large-scale model suite **specifically designed for studying memorization**. The randomized controlled insertion experimental design enables causal inference, substantially complementing the limitations of prior observational studies.

The connection of copyright, privacy, and test set contamination to their legal and policy contexts gives the technical research a policy-relevant framing. From a practical standpoint, the two best practices of dilution and ordering provide immediately applicable guidelines for model training.
