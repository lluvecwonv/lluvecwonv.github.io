---
title: "SurveyGen-I: Consistent Survey Generation with Evolving Plans and Memory"
date: 2026-04-02
summary: "SurveyGen-I addresses consistency in long survey generation through coarse-to-fine retrieval, PlanEvo (dynamic planning with evolving memory), and CaM-Writing (citation-aware memory-guided generation). Achieves 8.5% content quality improvement, 27% citation density increase, and 2x more distinct references vs. strongest baseline."
tags: [Report Generation, Survey Generation, LLM, Memory-Guided, Planning, IJCNLP, Research Notes]
category: 연구노트
language: en
---

# SurveyGen-I: Consistent Survey Generation with Evolving Plans

**Paper:** SurveyGen-I: Consistent Scientific Survey Generation with Evolving Plans and Memory-Guided Writing
**arXiv:** [2508.14317](https://arxiv.org/abs/2508.14317)
**Venue:** IJCNLP-AACL 2025

---

## Problem: Consistency in Long Surveys

Generating long surveys suffers from inconsistent terminology, redundant explanations, missing content, and weak inter-section connections. SurveyGen-I solves this with **evolving memory**.

## Three Components

1. **Coarse-to-Fine Retrieval:** Survey-level → subsection-level retrieval with citation expansion and LLM-based relevance scoring
2. **PlanEvo:** Dynamic outline that evolves as each section is written, using accumulated memory of terms and concepts
3. **CaM-Writing:** Citation-tracing module resolves indirect references; memory-guided generation ensures consistency

## Results

vs. strongest baseline: +8.5% content quality, +27% citation density, 2x+ distinct references.

## Reference

- [arXiv:2508.14317](https://arxiv.org/abs/2508.14317) | [IJCNLP-AACL 2025](https://aclanthology.org/2025.ijcnlp-long.193/)
