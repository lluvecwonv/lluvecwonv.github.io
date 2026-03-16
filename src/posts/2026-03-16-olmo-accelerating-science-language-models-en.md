---
title: "OLMo: Accelerating the Science of Language Models — Paper Analysis"
date: 2026-03-16
summary: "AI2's truly open language model OLMo. Releases not just model weights but also training data (Dolma, 3T tokens), training code, evaluation code, and 500+ intermediate checkpoints under Apache 2.0. 7B decoder-only transformer (SwiGLU, RoPE, non-parametric LayerNorm, no biases). Trained on two GPU clusters (LUMI AMD MI250X + MosaicML NVIDIA A100) with FSDP/ZeRO. Competitive zero-shot performance on 8 core tasks (avg 69.3) against LLaMA-7B, Llama 2-7B, MPT-7B. MMLU improves from 28.3 to 46.2 after SFT+DPO adaptation. Includes Paloma perplexity evaluation and carbon emissions reporting (69.78 tCO₂eq)."
tags: [LLM, Open Source, OLMo, AI2, Pretraining, Dolma, Evaluation, Research Notes]
category: 연구노트
language: en
---

# OLMo: Accelerating the Science of Language Models

**Authors:** Dirk Groeneveld, Iz Beltagy, Pete Walsh, Akshita Bhagia, and many others
**Affiliations:** Allen Institute for AI (AI2), University of Washington, Yale University, etc.
**Venue:** ACL 2024 (Long Paper)
**Code:** https://allenai.org/olmo

## One-Line Summary

A truly open language model framework that releases model weights, training data, training code, evaluation framework, and intermediate checkpoints — all under the Apache 2.0 License — to enable the scientific study of language models.

---

## 1. Paper Overview

The most powerful language models have become closed off, gated behind proprietary interfaces with important details of their training data, architectures, and development left undisclosed. This poses a critical barrier to scientific research, including studying biases and potential risks. OLMo addresses this by providing a competitive open language model where, unlike prior "open" models that only release model weights and inference code, the entire pipeline is made transparent.

---

## 2. OLMo Framework

### 2.1 Model Architecture

OLMo adopts a decoder-only transformer architecture, delivering models at both 1B and 7B scales. The key modifications over the vanilla transformer are:

| Design Choice | Description |
|--------------|-------------|
| **No biases** | Following LLaMA, PaLM — all bias terms excluded to improve training stability |
| **Non-parametric layer norm** | No affine transformation (no adaptive gain or bias), safest and fastest option |
| **SwiGLU activation** | Replaces ReLU. Hidden size approximately 8/3 d, rounded to nearest multiple of 128 (11,008 for 7B) |
| **Rotary positional embeddings (RoPE)** | Replaces absolute positional embeddings for better length generalization |
| **Modified BPE tokenizer** | Based on GPT-NeoX-20B with PII masking tokens. Vocabulary size: 50,280 (padded to 50,304) |

**Model configurations (Table 1):**

| Setting | OLMo-1B | OLMo-7B |
|---------|---------|---------|
| Layers (L) | 16 | 32 |
| Hidden dim (D) | 2048 | 4086 |
| Attention heads (H) | 16 | 32 |
| Training tokens | 2T | 2.46T |
| Peak LR | 4.0E-4 | 3.0E-4 |
| Warmup | 2000 steps | 5000 steps |
| Weight tying | yes | no |
| Batch size | ~4M | ~4M |

### 2.2 Pretraining Data: Dolma

One of OLMo's most significant contributions is the release of the full pretraining dataset, Dolma. This is rare in the field — most open models still keep their training data private.

**Dolma composition (Table 2):**

| Source | Type | UTF-8 Size (GB) | Docs (millions) | Tokens (billions) |
|--------|------|-----------------|-----------------|-------------------|
| Common Crawl | web pages | 9,812 | 3,734 | 2,180 |
| GitHub | code | 1,043 | 210 | 342 |
| Reddit | social media | 339 | 377 | 80 |
| Semantic Scholar | papers | 268 | 38.8 | 57 |
| Project Gutenberg | books | 20.4 | 0.056 | 5.2 |
| Wikipedia | encyclopedic | 16.2 | 6.2 | 3.7 |
| **Total** | | **11,519** | **4,367** | **2,668** |

Dolma was built through a pipeline of (1) language filtering, (2) quality filtering, (3) content filtering, (4) deduplication, (5) multi-source mixing, and (6) tokenization.

### 2.3 Adaptation

Following the TÜLU data and training setup to train OLMo as a general chat assistant:
- **OLMo+SFT:** Instruction finetuning with a mixture of distilled and human-written instruction data
- **OLMo+SFT+DPO:** Additional alignment via Direct Preference Optimization on distilled preference data

### 2.4 Evaluation

- **Online (in-loop):** Downstream task evaluation every 1000 training steps (~4B tokens)
- **Offline:** Catwalk framework for downstream tasks + Paloma benchmark for perplexity

---

## 3. Training Details

### 3.1 Distributed Training Framework

PyTorch FSDP with ZeRO optimizer strategy for sharding model weights and optimizer state across GPUs. Mixed-precision training with bfloat16.

### 3.2 Optimizer

AdamW (Beta1=0.9, Beta2=0.95, Epsilon=1.0E-5). Learning rate warmed up over 5000 steps (~21B tokens), then linearly decayed to one-tenth of peak. Gradient clipping with l²-norm ≤ 1.0.

**Key trick:** After the main training run, the learning rate was linearly decayed to 0 over the final 1,000 steps on the Dolma dataset, providing meaningful boosts on both perplexity and end-task evaluations.

### 3.3 Data Preparation

2T-token sample from Dolma. Documents concatenated with EOS tokens, chunked into 2048-token instances, shuffled. Data order and exact batch composition can be fully reconstructed from the released artifacts.

### 3.4 Hardware

| Cluster | GPU | Nodes | GPU Memory | Interconnect |
|---------|-----|-------|------------|-------------|
| **LUMI** | AMD MI250X | up to 256 | 128GB | 800Gbps |
| **MosaicML** | NVIDIA A100 | 27 | 40GB | 800Gbps |

Both clusters produced nearly identical results despite minor batch size differences.

---

## 4. Results

### 4.1 Downstream Evaluation (Table 3)

| Model | ARC-c | ARC-e | BoolQ | HellaSwag | OpenBookQA | PIQA | SciQ | WinoGrande | Avg. |
|-------|-------|-------|-------|-----------|------------|------|------|------------|------|
| StableLM 1.6B | 43.8 | 63.7 | 76.6 | 68.2 | 45.8 | 74.0 | 94.7 | 64.9 | 66.5 |
| Pythia 1B | 33.1 | 50.2 | 61.8 | 44.7 | 37.8 | 69.1 | 86.0 | 53.3 | 54.5 |
| **OLMo-1B** | **34.5** | **58.1** | **60.7** | **62.5** | **46.4** | **73.7** | **88.1** | **58.9** | **60.4** |
| Falcon-7B | 47.5 | 70.4 | 74.6 | 75.9 | 53.0 | 78.5 | 93.9 | 68.9 | 70.3 |
| LLaMA 7B | 44.5 | 67.9 | 75.4 | 76.2 | 51.2 | 77.2 | 93.9 | 70.5 | 69.6 |
| Llama 2 7B | 48.5 | 69.5 | 80.2 | 76.8 | 48.4 | 76.7 | 94.5 | 69.4 | 70.5 |
| MPT-7B | 46.5 | 70.5 | 74.2 | 77.6 | 48.6 | 77.3 | 93.7 | 69.9 | 69.8 |
| Pythia 6.9B | 44.1 | 61.9 | 61.1 | 63.8 | 45.0 | 75.1 | 91.1 | 62.0 | 63.0 |
| RPJ-INCITE-7B | 42.8 | 68.4 | 68.6 | 70.3 | 49.4 | 76.0 | 92.9 | 64.7 | 66.6 |
| **OLMo-7B** | **48.5** | **65.4** | **73.4** | **76.4** | **50.4** | **78.4** | **93.8** | **67.9** | **69.3** |

OLMo-7B is competitive across the board. Notably achieves 48.5 on ARC-challenge, matching Llama 2 7B for the top score.

### 4.2 Adaptation Evaluation (Table 4)

| Model | MMLU (0-shot ↑) | AlpacaEval (% win ↑) | ToxiGen (% Toxic ↓) | TruthfulQA (% Info+True ↑) |
|-------|-----------------|---------------------|---------------------|---------------------------|
| OLMo (base) | 28.3 | - | 81.4 | 31.6 |
| Llama-2-Chat | 46.8 | 87.3 | 0.0 | 26.3 |
| TÜLU 2+DPO | 50.7 | 85.1 | 0.5 | - |
| **OLMo+SFT** | **47.3** | **57.0** | **14.4** | **41.2** |
| **OLMo+SFT+DPO** | **46.2** | **69.3** | **1.7** | **52.0** |

Instruction tuning dramatically improves OLMo-7B. MMLU jumps from 28.3 to 47.3, ToxiGen drops from 14.4% to 1.7% after DPO.

### 4.3 Carbon Emissions (Table 6)

| Model | GPU | Power (MWh) | Emissions (tCO₂eq) |
|-------|-----|-------------|---------------------|
| Gopher-280B | TPU v3 | 1,066 | 380 |
| LLaMA-7B | A100-80GB | 33 | 14 |
| OLMo-7B (MI250X) | MI250X | 135 | 0* |
| OLMo-7B (A100) | A100-40GB | 104 | 70 |

*LUMI runs on 100% renewable energy. Total estimated emissions: 69.78 tCO₂eq.

---

## 5. Released Artifacts

- **Model weights:** 7B, 7B-twin, 1B + 500+ intermediate checkpoints at 1000-step intervals
- **Training data:** Full Dolma corpus + curation and analysis tools (WIMBD)
- **Training code:** Full code + Weights & Biases metrics
- **Adaptation:** OLMo+SFT, OLMo+SFT+DPO weights and code
- **Evaluation:** Catwalk + Paloma + TÜLU evaluation suite

All under Apache 2.0 License.

---

## 6. Limitations

- **Data:** English-only; multilingual support is future work
- **Adaptation:** TÜLU mix designed for Llama, may not be optimal for OLMo
- **Evaluation:** Downstream tasks are not representative of actual user interactions; evaluation noise is considerable

---

## 7. Conclusion

OLMo's value lies not in being the highest-performing 7B model, but in being the most transparent and reproducible large language model ever released. It provides an invaluable resource for studying how training data composition affects model behavior, understanding training dynamics, and ensuring reproducibility — a landmark paper for open science in AI.
