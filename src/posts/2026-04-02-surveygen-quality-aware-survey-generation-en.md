---
title: "SurveyGen: Quality-Aware Scientific Survey Generation with LLMs"
date: 2026-04-02
summary: "SurveyGen presents a large-scale dataset of 4,200+ human-written surveys with 242,143 cited references and quality metadata, along with QUAL-SG, a quality-aware RAG framework that incorporates paper quality indicators into literature retrieval for higher-quality survey generation."
tags: [Report Generation, Survey Generation, LLM, RAG, Quality-Aware, Dataset, EMNLP, Research Notes]
category: 연구노트
language: en
---

# SurveyGen: Quality-Aware Scientific Survey Generation

**Paper:** SurveyGen: Quality-Aware Scientific Survey Generation with Large Language Models
**arXiv:** [2508.17647](https://arxiv.org/abs/2508.17647)
**Venue:** EMNLP 2025

---

## Key Contributions

1. **SurveyGen Dataset:** 4,200+ human-written surveys across CS, Medicine, Biology, Psychology with 242,143 cited references and quality metadata
2. **QUAL-SG Framework:** Enhances standard RAG by incorporating quality-aware indicators (citation count, journal impact, recency) into literature retrieval to select higher-quality source papers
3. **Comprehensive Evaluation:** Three-axis assessment — content quality, citation quality, structural consistency

## Core Insight

"Garbage in, garbage out" — the quality of retrieved source papers determines the quality of generated surveys. Quality-aware retrieval is a simple but effective improvement over vanilla RAG.

## Reference

- [arXiv:2508.17647](https://arxiv.org/abs/2508.17647) | [EMNLP 2025](https://aclanthology.org/2025.emnlp-main.136.pdf) | [GitHub](https://github.com/tongbao96/SurveyGen)
