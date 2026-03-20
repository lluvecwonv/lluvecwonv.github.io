---
title: "OLMo 2: A New Milestone in Fully Open Language Models (2 OLMo 2 Furious)"
date: "2026-03-21"
summary: "OLMo 2 from Allen Institute for AI (Ai2) is a family of 7B, 13B, and 32B fully open language models that release training data, code, and checkpoints while achieving competitive performance against open-weight models like Qwen 2.5 and Llama 3.1."
tags: ["LLM", "OLMo", "Open Source", "Pretraining", "Post-Training", "RLVR"]
category: "Paper Review"
language: "en"
---

# OLMo 2: A New Milestone in Fully Open Language Models

**Paper**: 2 OLMo 2 Furious
**Authors**: OLMo Team (Allen Institute for AI)
**Link**: [arXiv 2501.00656](https://arxiv.org/abs/2501.00656)
**Status**: Public Release (January 2025)

---

## 1. Overview

OLMo 2 is a family of **fully open** large language models developed by the Allen Institute for AI (Ai2), comprising **7B, 13B, and 32B** parameter dense autoregressive models. "Fully open" means that not only are the model weights released, but also **training data, training code, evaluation code, intermediate checkpoints, and training logs**.

Key contributions of OLMo 2:

1. **Improved training stability**: Architecture modifications including RMSNorm, QK-norm, Z-Loss, and reordered norm to resolve loss spikes and gradient norm divergence
2. **Two-stage training recipe**: Large-scale web data pretraining followed by mid-training on high-quality Dolminos data
3. **Model souping**: Training multiple times with different random data orders on the same mix, then averaging the resulting model weights
4. **Tülu 3-based post-training**: Three-stage pipeline of SFT → DPO → RLVR

![OLMo 2 Pareto Frontier](/images/olmo2/olmo2.png)
*Figure 1: OLMo 2 achieves the best performance among fully-open models and is competitive with open-weight models relative to training FLOPs.*

---

## 2. Model Architecture

OLMo 2 is based on a decoder-only transformer architecture with key modifications for training stability over the original OLMo.

### 2.1 Evolution from OLMo to OLMo 2

**Base design (retained from OLMo 1)**:
- No biases: All bias terms excluded
- SwiGLU activation function (hidden size ≈ 8/3 d, rounded to nearest multiple of 128)
- RoPE (Rotary Positional Embeddings)

**Stability improvements added in OLMo 2**:
- **RMSNorm**: Replaces non-parametric LayerNorm with RMSNorm
- **Reordered norm**: Normalizes **outputs** of attention and MLP layers instead of inputs (first proposed by Swin Transformer V2)
- **QK-norm**: Normalizes query and key projections with RMSNorm before computing attention, avoiding attention logits from becoming too large
- **Z-Loss**: Regularization term that prevents final output logits from growing too large
- **RoPE θ = 500,000**: Increased from 10,000 to improve positional encoding resolution, matching Llama 3

### 2.2 Model Hyperparameters by Size

| Parameter | OLMo 2 7B | OLMo 2 13B | OLMo 2 32B |
|-----------|-----------|------------|------------|
| Layers | 32 | 40 | 64 |
| Hidden Size | 4096 | 5120 | 5120 |
| Attention Heads (Q/KV) | 32/32 (MHA) | 40/40 (MHA) | 40/8 (GQA) |
| Batch Size | 1024 | 2048 | 2048 |
| Sequence Length | 4096 | 4096 | 4096 |
| Peak LR | 3.0×10⁻⁴ | 9.0×10⁻⁴ | 6.0×10⁻⁴ |
| Total Training Tokens | 4.05T | 5.6T | 6.6T |

The 32B model adopts **GQA (Grouped Query Attention)** instead of MHA for efficiency, inspired by its use in concurrent work Qwen 3.

### 2.3 Tokenizer

OLMo 2 borrows the pre-tokenizer and vocabulary from `cl100k`, the tokenizer developed for GPT-3.5 and GPT-4 (Apache 2.0 license). Compared to the original OLMo tokenizer, it has a larger vocabulary, showing +0.8 OLMES and +0.4 MMLU improvement on a 1B model trained for 100B tokens.

---

## 3. Training Data

### 3.1 Stage 1: Pretraining Data (OLMo Mix)

The pretraining data consists of approximately **3.9 trillion tokens**, with over 95% derived from web data.

| Source | Type | Tokens |
|--------|------|--------|
| DCLM-Baseline | Web pages | 3.71T |
| StarCoder (filtered) | Code | 83.0B |
| peS2o | Academic papers | 58.6B |
| arXiv | STEM papers | 20.8B |
| OpenWebMath | Math web pages | 12.2B |
| Algebraic Stack | Math proof code | 11.8B |
| Wikipedia & Wikibooks | Encyclopedic | 3.7B |
| **Total** | | **3.90T** |

For code data (StarCoder), repositories with fewer than 2 GitHub stars were removed, and documents with repeated n-gram sequences of 32 or more were filtered out.

### 3.2 Stage 2: Mid-training Data (Dolminos)

The mid-training data is composed of **high-quality web data + domain-specific data**.

**High Quality Subset** (~832.6B tokens):
- DCLM-Baseline (FastText top 7%, FineWeb ≥ 2 filter) — 752B
- FLAN (decontaminated) — 17.0B
- peS2o — 58.6B
- Wikipedia — 3.7B
- Stack Exchange (Q&A format) — 1.26B

**Math Mix** (~10.7B tokens):
- TuluMath (synthetic math via persona-driven generation) — 230M
- DolminoSynthMath — 28.7M
- TinyGSM-MIND (synthetic, MIND-rewritten to natural language) — 6.48B
- MathCoder2 Synth Books — 3.87B
- Metamath, CodeSearchNet, GSM8K Train, etc.

---

## 4. Training Stability (Deep Dive)

The previous OLMo (OLMo April) suffered from **sudden loss spikes** and **slow growth in gradient norm** magnitude during training. OLMo 2 systematically addresses these issues.

![Training Loss and Gradient Norm](/images/olmo2/mitchishvpeteish-v2.png)
*Figure 2: Training loss and gradient norm curves for OLMo April and OLMo 2. The OLMo April run was characterized by frequent loss spikes and growing gradient norm, while OLMo 2 shows much improved stability.*

### 4.1 Repeated n-Gram Filtering

Investigation of training batches at which spikes occurred revealed a high prevalence of instances containing long, repeated n-gram sequences. Documents with sequences of 32 or more repeated n-grams (1-13 tokens) are removed at data curation time, with an additional safeguard in the trainer that masks these sequences during loss computation.

![N-gram Filter Effect](/images/olmo2/without_data_filter_gnorm.png)
*Figure 3a: Gradient norm without n-gram filter*

![N-gram Filter Effect](/images/olmo2/with_data_filter_gnorm.png)
*Figure 3b: Gradient norm with n-gram filter — spikes are significantly reduced*

### 4.2 Model Initialization

OLMo 2 initializes every parameter from a normal distribution with mean 0 and standard deviation 0.02. The previous approach (scaled initialization from Zhang et al., 2019) scaled output projections by $1 / \sqrt{2 \cdot d_{model} \cdot \text{layer\_idx}}$, meaning later layers were initialized to smaller values, leading to instability.

![Initialization Comparison](/images/olmo2/inits.png)
*Figure 4: OLMo April initialization shows instabilities quickly, while OLMo 2 stays stable.*

### 4.3 QK-norm and Reordered Norm

QK-norm normalizes query and key projections with RMSNorm before calculating attention, preventing attention logits from becoming too large. Reordered norm normalizes the **outputs** of attention and MLP layers, stabilizing training.

![QK-norm and Reordered Norm](/images/olmo2/qk_norm_reorder.png)
*Figure 5: Effect of QK-norm and reordered norm on training stability*

### 4.4 Z-Loss

Z-loss regularization keeps final output logits from growing too large, which has been empirically shown to improve run stability.

![Z-Loss Effect](/images/olmo2/zloss.png)
*Figure 6: Effect of Z-Loss on gradient norm behavior*

### 4.5 Additional Stability Improvements

- **Weight decay**: Excluding embeddings from weight decay prevents the slow growth in gradient norm
- **AdamW ε**: Lowering from 10⁻⁵ to **10⁻⁸** improves training stability

---

## 5. Mid-training Deep Dive (Annealing)

### 5.1 Learning Rate Schedule

In the mid-training stage, the learning rate is **linearly decayed to zero** over the remaining training tokens, starting from where the cosine schedule left off during pretraining.

![Learning Rate Schedules](/images/olmo2/learningrates.png)
*Figure 7: Comparison of various learning rate schedules for mid-training*

### 5.2 Microanneal Experiments

To efficiently evaluate math data quality, the team used **microanneals** — short annealing runs focused on small math subsets at roughly 50/50 ratio with general web data.

**Experiment 1 — Domain-specific data is helpful even in small proportions**: At math/DCLM ratio 35/65, GSM* reached 63.5; at 10/90, still 61.0 (baseline: 28.5)

**Experiment 2 — Some duplication is beneficial**: Duplicating math data 2× yielded GSM* 66.0, 4× yielded 65.0

**Experiment 3 — Rewriting can help dramatically**: The code version of TinyGSM degraded GSM* to 25.0, while the MIND-rewritten natural language version dramatically improved it to 65.5

### 5.3 Model Souping

Multiple models trained on different random orderings of the same mid-training data are averaged to produce the final model.

- **7B**: 3 runs on 50B tokens → average of 3
- **13B, 32B**: 3 runs on 100B tokens + 1 run on 300B tokens → average of 4

Across six different mid-training mixes, souping consistently equaled or outperformed the single best checkpoint.

---

## 6. Post-training (Tülu 3 Recipe)

Post-training follows the **Tülu 3** recipe with three stages.

### 6.1 Supervised Finetuning (SFT)

Uses PersonaHub-based synthetic data combined with existing high-quality instruction datasets. The 7B/13B mix contains 939,104 prompts; the 1B/32B mix contains 866,138 prompts.

### 6.2 Direct Preference Optimization (DPO)

Responses are generated from a pool of 20 diverse models of different families and sizes. GPT-4o serves as an LM judge to rate completions based on helpfulness, truthfulness, honesty, and instruction-following. On-policy data from development OLMo 2 SFT models is also included.

### 6.3 Reinforcement Learning with Verifiable Rewards (RLVR)

RLVR uses PPO where rewards are only given when the answer is verifiably correct (e.g., math problems). For the 32B model, **GRPO** (Group Relative Policy Optimization) was used, which forgoes the need for a reward model.

![RLVR Training Curves (13B)](/images/olmo2/combined_plots.png)
*Figure 8: RLVR training curves for OLMo 2 13B Instruct. Three stages of RLVR progressively improve GSM8K and MATH performance.*

### 6.4 Performance Across Post-training Stages

| Model | Stage | Avg | GSM8K | MATH | MMLU | IFEval | Safety |
|-------|-------|-----|-------|------|------|--------|--------|
| OLMo 2 7B | SFT | 51.4 | 74.6 | 25.3 | 61.1 | 66.9 | 94.6 |
| OLMo 2 7B | DPO | 55.9 | 82.6 | 30.3 | 60.8 | 73.0 | 93.7 |
| OLMo 2 7B | **Instruct** | **56.5** | **85.1** | **32.5** | **61.3** | 72.3 | 93.3 |
| OLMo 2 13B | SFT | 56.6 | 76.3 | 29.5 | 68.0 | 68.6 | 94.3 |
| OLMo 2 13B | DPO | 62.0 | 82.3 | 35.2 | 67.9 | 80.2 | 90.3 |
| OLMo 2 13B | **Instruct** | **63.4** | **87.4** | **39.2** | **68.5** | 82.6 | 89.7 |
| OLMo 2 32B | SFT | 61.7 | 78.4 | 35.9 | 76.1 | 72.4 | 93.8 |
| OLMo 2 32B | DPO | 68.8 | 85.7 | 46.8 | 78.0 | 83.8 | 91.9 |
| OLMo 2 32B | **Instruct** | **68.8** | **87.6** | **49.7** | 77.3 | **85.6** | 85.9 |

---

## 7. Evaluation Results

### 7.1 Base Model Evaluation

Models were evaluated using the OLMES evaluation suite, with a clear separation between **development benchmarks** and **held-out tasks** not used during model development.

| Model | Avg | FLOPs(×10²³) | MMLU | ARC_C | HSwag | GSM8K | MMLU_PRO | TriviaQA |
|-------|-----|--------------|------|-------|-------|-------|----------|----------|
| Llama 3.1 8B | 61.8 | 7.2 | 66.9 | 79.5 | 81.6 | 56.5 | 34.7 | 80.3 |
| Qwen 2.5 7B | 67.4 | 8.2 | 74.4 | 89.5 | 89.7 | 81.5 | 45.8 | 69.4 |
| Gemma 2 9B | 67.8 | 4.4 | 70.6 | 89.5 | 87.3 | 70.1 | 42.0 | 81.8 |
| **OLMo 2 7B** | **62.9** | **1.8** | 63.7 | 79.8 | 83.8 | 67.5 | 31.0 | 78.0 |
| **OLMo 2 13B** | **68.3** | **4.6** | 67.5 | 83.5 | 86.4 | 75.1 | 35.1 | 81.9 |
| **OLMo 2 32B** | **73.3** | **13.0** | 74.9 | 90.4 | 89.7 | 78.8 | 46.9 | 88.0 |
| Llama 3.1 70B | 75.5 | 64.0 | 79.2 | 93.1 | 87.6 | 80.6 | 47.1 | 92.2 |

**Key finding**: OLMo 2 models are **competitive with the best open-weights models** of comparable size, despite requiring **far fewer training FLOPs**. OLMo 2 7B achieves similar performance to Llama 3.1 8B with only 1/4 of the FLOPs. OLMo 2 32B approaches Llama 3.1 70B performance with 1/5 of the FLOPs.

### 7.2 Pre- vs. Post-Midtraining Comparison

| Model | Stage | Avg | MMLU | GSM8K | DROP |
|-------|-------|-----|------|-------|------|
| OLMo 2 1B | Pretraining | 31.9 | 26.9 | 3.3 | 25.1 |
| OLMo 2 1B | + Mid-training | **43.7** | **44.3** | **43.8** | **34.0** |
| OLMo 2 7B | Pretraining | 53.0 | 59.8 | 24.1 | 40.7 |
| OLMo 2 7B | + Mid-training | **62.9** | **63.7** | **67.5** | **60.8** |
| OLMo 2 13B | Pretraining | 58.9 | 63.4 | 37.3 | 49.6 |
| OLMo 2 13B | + Mid-training | **68.3** | **67.5** | **75.1** | **70.7** |

The benefit of mid-training is larger for smaller models (1B: +37.0%, 7B: +18.7%, 13B: +15.9%, 32B: +12.3%), with particularly dramatic improvements in **math performance (GSM8K)**.

### 7.3 Instruct Model Evaluation

| Instruct Model | Avg | AlpacaEval 2 | BBH | GSM8K | IFEval | MATH | MMLU | Safety |
|----------------|-----|-------------|-----|-------|--------|------|------|--------|
| GPT-4o Mini | 65.7 | 49.7 | 65.9 | 83.0 | 83.5 | 67.9 | 82.2 | 84.9 |
| Llama 3.1 8B Instruct | 59.1 | 25.8 | 71.9 | 83.4 | 80.6 | 42.5 | 71.3 | 70.2 |
| Qwen 2.5 7B Instruct | 61.6 | 29.7 | 70.2 | 83.8 | 74.7 | 69.9 | 76.6 | 75.0 |
| **OLMo 2 7B Instruct** | **56.5** | 29.1 | 51.4 | 85.1 | 72.3 | 32.5 | 61.3 | **93.3** |
| **OLMo 2 13B Instruct** | **63.5** | 39.5 | 63.0 | 87.4 | 82.6 | 39.2 | 68.5 | **89.7** |
| **OLMo 2 32B Instruct** | **68.8** | 42.8 | 70.6 | 87.6 | 85.6 | 49.7 | 77.3 | 85.9 |

OLMo 2 Instruct models excel particularly in **Safety scores** and achieve very strong **GSM8K** performance. OLMo 2 32B Instruct matches the average performance of Qwen 2.5 72B Instruct (68.8) with 1/6 of the parameters.

---

## 8. Infrastructure

### 8.1 Clusters

OLMo 2 was trained on two clusters:

- **Jupiter** (Austin, TX): 128 nodes, 1,024× NVIDIA H100 GPUs (80GB HBM3), InfiniBand 400Gbps × 8 per node, PUE 1.2
- **Augusta** (Council Bluffs, IA): 160 nodes, Google Cloud A3 Mega VMs, GPUDirect-TCPXO, PUE 1.12

### 8.2 Efficiency Optimizations

- **torch.compile()**: Eliminates Python overhead from individual PyTorch operations
- **Minimizing host-device syncs**: Asynchronous tensor copies, minimizing GPU→CPU transfers
- **Asynchronous bookkeeping**: Metric logging and checkpointing performed in a separate thread with its own backend
- **Explicit Python GC**: Disabling automatic garbage collection and running it manually at synchronized intervals across all distributed processes

![Garbage Collection Performance](/images/olmo2/gc-perf.png)
*Figure 9: Training throughput comparison between automatic and manual garbage collection. Manual GC provides more stable and faster throughput.*

### 8.3 Environmental Impact

Training OLMo 2 7B + 13B consumed approximately **391 MWh of energy**, emitting an estimated **154 tCO₂eq** of carbon and consuming approximately **1.1 million liters of water**.

---

## 9. Conclusion

OLMo 2 demonstrates that fully open language models can compete with commercial open-weight models. Through training stability improvements, a two-stage training recipe, model souping, and Tülu 3-based post-training, OLMo 2 achieves highly efficient performance relative to training FLOPs. With all training and evaluation code, datasets, checkpoints, and logs publicly released, OLMo 2 significantly contributes to reproducibility and transparency in LLM research.
