---
title: "Speed Always Wins: A Survey on Efficient Architectures for LLMs"
date: 2026-04-02
summary: "Systematic examination of efficient LLM architectures that address Transformer's quadratic complexity bottleneck. Covers four families: linear sequence modeling (Mamba, RWKV, Linear Attention), sparse sequence modeling (local/dilated/hash-based attention), efficient full attention variants (FlashAttention, MQA, GQA), and sparse Mixture-of-Experts (Switch Transformer, Mixtral)."
tags: [LLM, Efficient Architecture, Transformer, Mamba, MoE, Linear Attention, Survey, Research Notes]
category: 연구노트
language: en
---

# Speed Always Wins: Efficient LLM Architectures Survey

**Paper:** Speed Always Wins: A Survey on Efficient Architectures for Large Language Models
**arXiv:** [2508.09834](https://arxiv.org/abs/2508.09834)
**Venue:** arXiv preprint (August 2025)

---

## The Problem

Transformer self-attention: $O(n^2)$ time and memory in sequence length. This bottleneck limits long-context processing, inflates KV cache, and escalates training costs.

## Four Architecture Families

### 1. Linear Sequence Modeling
- **SSMs (Mamba, S4):** $O(n)$ sequence processing
- **RWKV:** RNN + Transformer hybrid with linear complexity
- **Linear Attention:** Kernel trick linearization (Performers)

### 2. Sparse Sequence Modeling
- **Local Attention:** Fixed window (Longformer, BigBird)
- **Hash-based:** LSH for similar-token attention (Reformer)

### 3. Efficient Full Attention
- **FlashAttention:** IO-aware implementation, 2-4x speedup with exact computation
- **MQA/GQA:** Shared K/V heads to reduce KV cache (LLaMA 2, Mistral)

### 4. Sparse MoE
- **Switch Transformer, Mixtral:** Large total params, small active params per token
- **Routing:** Top-k, Expert Choice, Hash-based

## Takeaway

Hybrid architectures (Transformer + SSM, Attention + MoE) are the pragmatic path forward. Non-Transformer models are rising but haven't fully replaced Transformers.

## Reference

- [arXiv:2508.09834](https://arxiv.org/abs/2508.09834) | [GitHub](https://github.com/weigao266/Awesome-Efficient-Arch)
