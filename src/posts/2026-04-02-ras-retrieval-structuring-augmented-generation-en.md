---
title: "RAS: A Survey on Retrieval And Structuring Augmented Generation"
date: 2026-04-02
summary: "Goes beyond standard RAG by introducing a structuring stage between retrieval and generation. Examines retrieval mechanisms (sparse/dense/hybrid), text structuring techniques (taxonomy construction, hierarchical classification, information extraction), and LLM integration methods (prompt-based, reasoning frameworks, knowledge embedding)."
tags: [Report Generation, RAG, RAS, Structured Knowledge, LLM, KDD, Survey, Research Notes]
category: 연구노트
language: en
---

# RAS: Retrieval And Structuring Augmented Generation

**Paper:** A Survey on Retrieval And Structuring Augmented Generation with Large Language Models
**arXiv:** [2509.10697](https://arxiv.org/abs/2509.10697)
**Venue:** KDD 2025 (Toronto, Canada)

---

## RAG → RAS

**RAG's limitation:** Feeding raw retrieved text to LLMs loses structural relationships, hierarchies, and temporal order — degrading complex reasoning.

**RAS adds structuring:** After retrieval, organize information into taxonomies, hierarchical classifications, knowledge graphs, and extracted entities/relations before generation.

## Three Axes

1. **Retrieval:** BM25, DPR, Contriever, E5, hybrid approaches
2. **Structuring:** Taxonomy construction, hierarchical classification, information extraction (entities, relations, events)
3. **LLM Integration:** Prompt-based injection, Chain/Graph-of-Thought reasoning, knowledge embedding

## Significance

Accepted at KDD 2025 — validated by the data mining community. Structuring is the next evolution of RAG.

## Reference

- [arXiv:2509.10697](https://arxiv.org/abs/2509.10697) | [KDD 2025](https://dl.acm.org/doi/10.1145/3711896.3736557)
