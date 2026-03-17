---
title: "SoK: The Landscape of Memorization in LLMs — Mechanisms, Measurement, and Mitigation - Paper Summary"
date: 2026-03-12
summary: "A comprehensive SoK survey by UC Berkeley & Google DeepMind on LLM memorization. Covers the taxonomy of memorization definitions (Outcome/Elicitation/Causal/Probabilistic), contributing factors (model size, data duplication, sequence length, tokenization, sampling), training-stage dynamics (Pre-training, SFT, RLHF, Distillation), detection techniques (Divergence Attack, Prefix Extraction, MIA, Soft Prompting), mitigation strategies (Data Cleaning, DP, Unlearning, Activation Steering), and privacy/legal risks. Includes open questions for each section."
tags: [LLM, Memorization, Privacy, Survey, SoK, MIA, Differential Privacy, Unlearning, Research Note]
category: 연구노트
language: en
---

# SoK: The Landscape of Memorization in LLMs — Mechanisms, Measurement, and Mitigation

**Authors:** Alexander Xiong (UC Berkeley), Xuandong Zhao (UC Berkeley), Aneesh Pappu (Google DeepMind), Dawn Song (UC Berkeley)
**Venue:** IEEE (IEEEtran format)
**Code:** N/A (Survey paper)

## One-Line Summary

A SoK (Systematization of Knowledge) paper that systematically organizes the phenomenon of LLM memorization from **definitions → contributing factors → training-stage dynamics → detection → mitigation → legal risks**, presenting open questions for each topic and surveying future research directions.

---

## 1. Paper Overview

This paper provides a comprehensive analysis of memorization — the phenomenon where LLMs "remember" their training data. LLM memorization is a double-edged sword: memorizing facts, grammar, and semantic rules is essential for model utility, but verbatim reproduction of sensitive personal information or copyrighted content poses serious privacy and legal risks. The authors argue that this should be understood not as a simple bug, but as a **misaligned feature of data compression**.

![Memorization Taxonomy](/images/papers/memorization-sok/mem_fig-1.png)
*Figure 1: Taxonomy of LLM memorization. A systematic mapping of memorization definitions, detection, mitigation, and privacy/legal risks.*

---

## 2. Taxonomy of Memorization Definitions

Existing memorization definitions in the literature are diverse and overlapping, causing confusion. The authors systematize them into five categories.

### 2.1 Outcome-Centric

**Verbatim/Perfect Memorization:** The strictest form, where a model reproduces training data word-for-word. This serves as direct legal evidence for copyright infringement and PII exposure.

**Approximate/Paraphrased Memorization:** The model generates text that is semantically equivalent to training data but not an exact copy. This type is difficult to detect since most detection methods rely on exact string matching.

**Eidetic Memorization:** An especially strong form of memory that reproduces long, complex, low-probability sequences with high fidelity. This suggests deep internalization of data rather than superficial overfitting.

### 2.2 Elicitation-Centric

**Extractable Memorization:** A state where *some* prompt can induce the model to generate specific training data. The broadest definition, modeling the worst-case attack surface.

**Discoverable Memorization:** Using a prefix from the training data as a prompt to reproduce the suffix. A practical subset that enables systematic, large-scale privacy auditing.

**k-extractable Memorization:** A quantified version of discoverable memorization that specifies prefix length k. This enables analysis of the relationship between context length and extraction probability.

### 2.3 Probabilistic

**(n, p)-Discoverable Extraction:** A sequence is considered memorized if it is generated at least once with probability ≥ p across n attempts. A realistic framework that accounts for various decoding strategies beyond greedy decoding.

### 2.4 Causal

**Counterfactual Memorization:** A definition where a model output qualifies as "true" memorization only if the output changes when the specific training data is removed. The only definition that can causally separate incidental generation from genuine memorization, but it has significant practical limitations as it requires model retraining.

### 2.5 Efficiency & Info-Theoretic

**τ-Compressible Memorization (ACR):** Measures memorization strength as the compression ratio of output length to prompt length. Provides a continuous spectrum rather than binary classification, and has potential relevance to fair use legal discussions.

> **Core Challenge:** The coexistence of these diverse definitions makes direct comparison of detection and mitigation strategies difficult, and the absence of a unified evaluation framework remains a key barrier to research.

---

## 3. Contributing Factors to Memorization

### 3.1 Model Parameter Count

Model size and memorization exhibit a **log-linear** relationship (Carlini et al., 2021). Larger models memorize more content more quickly, which cannot be explained by simple overfitting (Tirumala et al., 2022). Extraction attacks are also more effective on larger models.

### 3.2 Training Data Duplication

Duplicate data is the most powerful driver of memorization. Deduplication reduces memorized token generation by 10× (Lee et al., 2022), and there is a **superlinear relationship** between duplication and memorization — rarely duplicated data is almost never memorized (Kandpal et al., 2022). However, current syntactic deduplication (hash/substring matching) fails to detect near-duplicates (paraphrases, minor edits). Model-centric duplicate-aware approaches using influence functions are needed.

### 3.3 Sequence Length

Memorization increases on a **logarithmic scale** with sequence length (Carlini et al., 2023). Extending from 50 to 950 tokens increases verbatim reproduction probability by several fold. Longer prefixes yield higher extraction success rates.

### 3.4 Tokenization

Larger BPE vocabulary sizes increase memorization (Kharitonov et al., 2021). Named entities, URLs, and rare phrases that are tokenized as single tokens are particularly vulnerable to memorization.

### 3.5 Sampling Method

Stochastic decoding is far more effective at extracting memorized data than greedy decoding. Top-k, nucleus sampling, and temperature optimization can increase extraction volume by up to 2× (Yu et al., 2023). Random decoding nearly doubles the leakage risk compared to greedy decoding (Tiwari & Suh). No single decoding method can minimize leakage across all scenarios, making evaluation across diverse sampling strategies essential.

### 3.6 Factor Interactions

These factors are not independent but interact synergistically and nonlinearly. Data duplication provides the initial signal → large models capture it → tokenization amplifies it → specific prompts serve as keys → diverse sampling reveals latent memories. Because this is a "perfect storm," effective mitigation requires a **holistic approach** rather than targeting individual factors.

### Open Questions (Contributing Factors)

1. Beyond duplication, what intrinsic data properties determine memorization?
2. What is the optimal trade-off between memorization prevention and utility at inference time?
3. How does model architecture scale affect memorization mechanisms?
4. How can we distinguish useful generalization from memorization in LLMs?

---

## 4. Training-Stage Memorization Dynamics

Memorization is not merely a byproduct of overfitting but transforms into **different forms of risk** at each stage of the LLM lifecycle.

### 4.1 Pre-training

In non-deterministic training (data shuffling, dropout, SGD), models tend to forget data seen early in training — parameter drift overwrites prior representations (Jagielski et al., 2023). Therefore, **data seen later in training is more likely to be memorized.** Memorization follows predictable scaling laws, where specific sequences predictably transition from "not memorized" to "memorized" as model size and training duration increase (Biderman et al., 2023).

**Importance of Metric Choice:** Verbatim completion and MIA sometimes produce contradictory results. A paradox arises where a model appears to have "forgotten" a sequence from the MIA perspective, yet perfectly reproduces it when prompted. Data duplication creates weak, distributed membership signals that evade MIA while simultaneously locking in high-probability outputs.

### 4.2 Supervised Fine-tuning (SFT)

- **Head-only fine-tuning:** Highest memorization risk due to overfitting
- **Adapter-based fine-tuning:** Reduces memorization by limiting parameter updates
- **Attention pattern correlation:** Narrow attention patterns (e.g., QA rather than summarization) correlate with higher memorization
- **Janus Interface:** Fine-tuning can *reactivate* latent memories from pre-training data (Nasr et al., 2023; Chen et al., 2024)

PEFT methods (LoRA, etc.) concentrate updates on a small subset of weights, potentially creating "memorization circuits" that are difficult to separate from task capabilities.

### 4.3 RLHF/Post-training

Data memorized during fine-tuning persists at high rates through RLHF. In contrast, evidence of memorization from reward model data or RL data is minimal (Pappu et al., 2024). There is concern that **the reward model's own memorization/biases may implicitly incentivize the policy model to reproduce memorized content**.

### 4.4 Distillation

Biases injected into teacher models can be **amplified** in students through distillation (Chaudhari et al., 2025). The KL divergence objective directly transfers the teacher's overconfidence on memorized sequences to the student. However, this remains a formally unanalyzed area.

### Open Questions (Training Stages)

1. How do training dynamics govern forgetting/stabilization of memorized information?
2. How do memorization scaling laws differ between pre-training and fine-tuning?
3. Can memorized outputs be causally attributed to specific training stages?
4. What are the mechanisms by which pre-training memories are reinforced or forgotten during fine-tuning?
5. Can knowledge be distilled from teacher to student without transferring memorized data?

---

## 5. Memorization Detection Techniques

The authors classify detection techniques into three categories: **Extraction-based**, **Classification-based**, and **Learned-Prompting**.

### 5.1 Divergence Attack (Extraction-based)

Reverts aligned models to their pre-alignment state, causing them to emit memorized training data at high likelihood (Nasr et al., 2023). Verbatim sequences increase by up to **150×** compared to normal queries. The key mechanism is that prompts induce decoding similar to end-of-text tokens during pre-training. Only black-box access is required, but effectiveness varies by model, can be patched, and transferability is limited.

### 5.2 Prefix-based Data Extraction (Extraction-based)

Queries the model with known training data prefixes and observes verbatim completions (first demonstrated by Carlini et al., 2021; systematized by Lee et al., 2022). Structured prefixes (email headers, document beginnings) are particularly effective. Limitations include the requirement for training data access and the ability to detect only verbatim copying.

### 5.3 Membership Inference Attack (Classification-based)

Classifies whether data was included in the training set based on model outputs (loss, perplexity, etc.). Key techniques:

- **Loss-based** (Yeom et al., 2018): Low loss = likely training data
- **Reference Loss** (Carlini et al., 2021): Corrects for input difficulty using loss differential with a reference model
- **zlib entropy**: Normalizes loss by zlib compression size
- **Neighborhood Attack** (Mattern et al., 2023): Compares loss with minor perturbations of the input
- **Min-K% Prob** (Shi et al., 2023): Prediction confidence of the most uncertain k% of tokens

**Key Limitation:** MIA lacks statistical validity as a per-instance metric. The true null distribution cannot be constructed, making false positive rates impossible to meaningfully estimate (Duan et al., 2024; Zhang et al., 2025). Therefore, MIA should be **reframed as an aggregate-level privacy auditing tool rather than evidence of individual training data inclusion**.

### 5.4 Soft Prompting (Learned-Prompting)

Learns optimal prompts by prepending trainable continuous vectors to inputs to maximize/minimize memorized content extraction. Can amplify memory leakage by 9.3% or suppress it by 97.7% (Ozdayi et al., 2023). Transferable prompts across models have also been discovered (Kim et al., 2023, ProPILE). Dynamic soft prompting achieves higher memorization detection rates by conditioning on input context. However, **requiring full white-box access and incurring extremely high computational costs** limits its practicality as an attack vector.

### 5.5 The Boundary Between Reasoning and Memorization

With the emergence of Large Reasoning Models (LRMs), distinguishing between "is the model actually reasoning or reproducing memorized patterns?" has become critical. When models fail on perturbations that are superficially similar but require different strategies, this suggests reliance on brittle pattern matching (Huang et al., 2025).

### Open Questions (Detection)

1. Can memorization be reliably detected without access to training data?
2. How can we attribute outputs to in-context information vs. parametric memory?
3. How do we detect semantic memorization?
4. How do we distinguish memorized reasoning shortcuts from generalizable problem-solving abilities?

---

## 6. Memorization Mitigation Strategies

Mitigation is classified into three stages: **Training-Time**, **Post-Training**, and **Inference-Time**.

### 6.1 Training-Time Interventions

**Data Cleaning**
- **Deduplication:** Implicit regularization that reduces overfitting on repeated sequences (Carlini et al., 2021; Lee et al., 2022)
- **PII Scrubbing:** Removes rare but high-risk memorization targets from training data. Rule-based + ML-based removal by categories such as CARDINAL, DATE, PERSON (Lukas et al., 2023)
- **Copyrighted Content Filtering:** Extends DP concepts to provide provable certificates for near-exact copy mitigation through bounded memorization budgets (Vyas et al., 2023)

**Differential Privacy (DP)**

DP-SGD guarantees privacy through per-example gradient clipping and calibrated Gaussian noise injection. LLMs show high resilience to DP-SGD when built on pre-trained representations, achieving performance close to non-private baselines (Li et al., 2021). CRT (Confidentially Redacted Training) combines deduplication + redaction + DP-SGD (Zhao et al., 2022).

**Key DP Challenges:**
- Strict privacy budgets cause performance degradation
- Defining "group size" (frequency of individual data occurrences) in web-scale data is difficult, making the strength of guarantees unclear
- PEFT + DP combinations are promising (Ma et al., 2024), but there is a hypothesis that concentrating noise on few parameters may weaken privacy protection
- User-level DP guarantees are also needed (Chua et al., 2024)

### 6.2 Post-Training Interventions

**Machine Unlearning**

The goal is to remove the influence of specific training data so the model behaves as if it never saw that data. Approximate unlearning methods (gradient ascent, negative re-labeling, adversarial sampling) are over 10^5× more efficient than retraining (Yao et al., 2024), but unlike DP, **they lack formal guarantees**, leaving risks of persistent memorization.

**ParaPO**

After identifying memorized data from the pre-training corpus, a separate LLM generates summaries to form (memorized sequence, summary) pairs for DPO. This reduces unintended memorization while preserving desired verbatim recall (e.g., direct quotations), though it incurs slight utility loss on math/reasoning benchmarks (Chen et al., 2025).

**Model Alignment**

Instruction tuning and RLHF reduce extraction of memorized data through normal prompts, but it remains inducible via divergence-based prompting or targeted fine-tuning. **Alignment reduces the accessibility of memorization, not the memorization itself** — a crucial distinction between safety/utility and true privacy/unlearning.

### 6.3 Inference-Time Interventions

**MemFree Decoding**

Represents all training data n-grams in a Bloom filter to filter memorized sequences in real-time during generation (Ippolito et al., 2023). Limitations: fails to detect near-identical n-grams and requires access to training n-gram data.

**TokenSwap**

A lightweight method that disrupts memorized sequences through token-level interventions. Operates without access to the training corpus or model weights, serving as a plug-and-play solution easily integrated with platforms like HuggingFace.

**Activation Steering**

Injects targeted perturbations into internal activations during inference to suppress/redirect generation of memorized sequences. Identifies memorization-related activation patterns using sparse autoencoders, achieving **up to 60% memorization reduction** with minimal performance degradation (Suri et al., 2025).

Research on **localization** of memorization is also important: specific attention heads (single heads in early layers) respond to rare token combinations seen during training to trigger verbatim recall, and removing less than 0.5% of neurons causes ~60% drop in memorization accuracy (Chang et al., 2023; Stoehr et al., 2024). However, since neurons involved in one memory also contribute to others, per-memory interventions carry the risk of collateral forgetting.

### Open Questions (Mitigation)

1. How can DP training be scaled up, and what are the cost-utility trade-offs?
2. How can DP enhance PEFT's memorization reduction?
3. How should activation steering for memorization removal be optimized?
4. How can post-training methods reduce memorization while preserving utility?
5. Can a memorization-detecting reward model be integrated online during RLHF?
6. When does memorization contribute to utility/generalization, and when does it harm?
7. Does memorization mitigation also affect other harmful behaviors such as hallucination or toxic stereotypes?

---

## 7. Key Datasets and Benchmarks Referenced in the Paper

This survey references various datasets and benchmarks used in memorization research. These are organized into **training corpora**, **MIA/detection benchmarks**, and **evaluation tools**.

### 7.1 Training Corpora

| Dataset | Description | Associated Models | Role in Memorization Research |
|---------|-------------|-------------------|-------------------------------|
| **The Pile** (Gao et al., 2020) | An 800GB+ English text corpus built by EleutherAI. Composed of diverse sources including academic papers, code, web text, and **Books3 (copyrighted books)** | Pythia, LLaMA 1 | Key evidence for copyright infringement — verbatim reproduction of works like Harry Potter and Dr. Seuss from the Books3 section. The Pile's train/test split is also used as an MIA benchmark |
| **Dolma** (Soldaini et al., 2024) | A 3-trillion-token English corpus released by Ai2. Includes books, scientific papers, code, social media, etc. | OLMo | A representative case enabling memorization research on models with open training data |
| **TÜLU Mix** (Wang et al., 2023) | A mixture of instruction-tuning datasets including GPT-4 Alpaca, OASST1, Dolly, Code Alpaca, ShareGPT, etc. | TÜLU 1/1.1 | Key data for **fine-tuning memorization** research. Used for studying memorization dynamics during SFT and comparing head-only vs. adapter-based fine-tuning |
| **GPT-2 Training Data** (WebText) | Web text based on OpenAI Reddit links | GPT-2 | Target of Carlini et al.'s (2021) first training data extraction attack demonstration. Recovered hundreds of memorized examples, marking the starting point of memorization research |

### 7.2 MIA/Detection Benchmarks

| Benchmark | Authors | Description | Evaluation Target | Key Findings/Limitations |
|-----------|---------|-------------|-------------------|--------------------------|
| **PatentMIA** | Zhang et al., 2024 | Patent document-based MIA benchmark. Claims improved MIA reliability via divergence-based calibration | Pre-training data membership | Maini et al. (2024) showed that **distributional shift in the benchmark itself was an artifact inflating MIA performance**. Suggests the fundamental calibration problem of MIA remains unsolved |
| **LLM-PBE** | Li et al., 2024 | Toolkit/benchmark for evaluating privacy risks of prefix-based extraction | PII extraction vulnerability across various LLMs | Confirmed that structured prefixes (email headers, document beginnings) are particularly effective at leaking memorized sequences. Larger models are more vulnerable to extraction attacks |
| **Canary Insertion** | Carlini et al., 2019; Chua et al., 2024 | Technique that inserts unique "canary" sequences into training data to directly measure memorization | Privacy protection effectiveness of DP and training techniques | User-level DP reduces canary extraction rates more than record-level DP. A standard methodology for verifying the practical effectiveness of DP |
| **ProPILE** | Kim et al., 2023 | White-box PII extraction privacy auditing framework based on soft prompt tuning | Degree of PII memorization in LLMs | Learned prompts are transferable across models, suggesting consistent memorization patterns exist |

### 7.3 Key Data Sources for Copyright/Memorization Research

| Source | Context | Role in the Paper |
|--------|---------|-------------------|
| **Books3 (Pile subset)** | A collection of copyrighted books, part of the PILE dataset | Henderson et al. (2023) and Zhang et al. (2022) showed that the first few pages of books like Harry Potter and Dr. Seuss are verbatim reproducible. Technical basis for legal disputes such as NYT v. Microsoft |
| **New York Times Articles** | Copyright-protected NYT articles | Core of the NYT v. Microsoft/OpenAI lawsuit — the claim that ChatGPT can reproduce NYT article passages. Freeman et al. (2024) conducted a technical analysis of the lawsuit's claims |
| **GitHub Code** | Open-source code repositories | Doe v. GitHub lawsuit — the claim that Copilot's verbatim code reproduction violates the DMCA |

### 7.4 Major Model Families Used in Memorization Research

Models repeatedly referenced as memorization research subjects in the paper:

| Model Family | Role in Research |
|-------------|-----------------|
| **GPT-2** (OpenAI) | First target of training data extraction attacks. The starting point of memorization research |
| **Pythia** (EleutherAI, 70M-12B) | Essential for memorization scaling law research due to publicly available training data (Pile). Intermediate checkpoints are also released, enabling training dynamics analysis |
| **LLaMA 1** (Meta, 7B-65B) | Memorization scaling research across model sizes. Trained on data partially including the Pile |
| **ChatGPT/GPT-3.5/GPT-4** (OpenAI) | Primary targets of divergence attacks. Demonstrated that alignment reduces memorization accessibility but does not eliminate the memorization itself |
| **OLMo** (Ai2, 1B/7B) | Fully open model with publicly available training data (Dolma). Enables transparent memorization research |
| **TÜLU 1/1.1** (UW) | Fine-tuning memorization research. Analyzes fine-tuning stage memorization using member/non-member data from the TÜLU Mix |

> **Key Observation:** The most critical dataset condition in memorization research is the existence of **models with publicly available training data**. Rigorous ground-truth memorization measurement is only possible with models whose training data is known, such as Pythia (Pile) and OLMo (Dolma). Closed models like GPT-4 have undisclosed training data, requiring reliance on indirect methods (MIA, extraction attacks) that carry fundamental limitations.

---

## 8. Privacy and Legal Risks

### 8.1 Personal Information Leakage

PII from training data can be extracted through adversarial prompting. Neural phishing attacks inject poisons during pre-training to achieve a 50% PII leakage success rate during fine-tuning (Panda et al., 2024). Confidentiality expectation violations in healthcare and customer service industries incur significant liability under current privacy regulations.

### 8.2 Copyrighted/Proprietary Content

Cases have been confirmed where open-source LLMs (Books3 section within EleutherAI's PILE dataset) verbatim reproduce books such as Harry Potter and Dr. Seuss (Henderson et al., 2023; Zhang et al., 2022).

### 8.3 Legal Landscape

Key ongoing lawsuits:
- **NYT v. Microsoft/OpenAI:** The claim that training on copyrighted articles + reproducing article passages constitutes large-scale copyright infringement
- **Chabon v. OpenAI:** Authors' copyright infringement claims
- **Doe v. GitHub:** The claim that Copilot's verbatim code reproduction violates the DMCA

These lawsuits are transforming LLM memorization from a technical concern into a **public policy and business domain** issue.

### Open Questions (Legal)

1. Can LLMs be trained not to memorize copyrighted content?
2. How can memorization metrics inform legal analysis (fair use, copyright)?
3. What is the legally meaningful technical threshold for memorization?

---

## 9. Key Takeaways

1. **Memorization is not a bug but a misaligned feature of data compression.** It creates a fundamental tension between model utility and privacy.

2. **Fragmentation of definitions is a key barrier.** Verbatim completion and MIA can produce contradictory results, and claims about memorization dynamics without specifying metrics are effectively "ill-defined."

3. **Different risks exist at different training stages.** Introduced as data integrity issues during pre-training → concentrated into "memorization circuits" during SFT → incentivized by reward models during RLHF → propagated through inheritance during distillation. **Stage-specific interventions** are needed rather than single post-hoc fixes.

4. **Detection methods must evolve from symptom identification to true knowledge attribution.** MIA should be reframed as an aggregate-level tool, and semantic memorization detection and reasoning memorization detection represent new frontiers.

5. **Mitigation should aim for selective control rather than elimination.** The core goal is "principled, selective control" that separates beneficial factual memorization from harmful instance-specific reproduction.

6. **The legal landscape is shifting rapidly.** Technical memorization metrics need to be directly connected to legal discussions (fair use, substantial similarity).
