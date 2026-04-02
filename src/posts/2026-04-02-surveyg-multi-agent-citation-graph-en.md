---
title: "SurveyG: Multi-Agent LLM Framework with Hierarchical Citation Graph"
date: 2026-04-02
summary: "SurveyG structures papers into a three-layer hierarchical citation graph (Foundation→Development→Frontier) capturing citation dependencies and semantic relatedness. Multi-agent LLMs traverse this graph horizontally and vertically to produce multi-level summaries, followed by a validation stage ensuring consistency, coverage, and factual accuracy."
tags: [Survey Generation, Multi-Agent, Citation Graph, LLM, Research Notes]
category: 연구노트
language: en
---

# SurveyG: Multi-Agent Survey Generation with Citation Graphs

**Paper:** SurveyG: A Multi-Agent LLM Framework with Hierarchical Citation Graph for Automated Survey Generation
**arXiv:** [2510.07733](https://arxiv.org/abs/2510.07733)
**Venue:** arXiv preprint (October 2025)

---

## Key Innovation

Existing survey generation methods ignore structural relationships between papers. SurveyG builds a **Hierarchical Citation Graph** with three layers:
- **Foundation:** Seminal papers with high citation count
- **Development:** Incremental advances building on foundations
- **Frontier:** Emerging directions with new paradigms

## Multi-Agent Traversal

- **Horizontal search:** Clustering and summarizing within each layer
- **Vertical traversal:** Tracing research evolution across layers
- **Multi-agent validation:** Consistency, coverage, and factual accuracy checks

## Results

Outperforms SOTA frameworks in comprehensiveness and structural organization per both human expert and LLM-as-a-judge evaluations.

## Reference

- [arXiv:2510.07733](https://arxiv.org/abs/2510.07733)
