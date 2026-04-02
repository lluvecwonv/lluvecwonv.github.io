---
title: "InteractiveSurvey: An LLM-based Personalized and Interactive Survey Paper Generation System"
date: 2026-04-02
summary: "InteractiveSurvey enables users to generate structured, multi-modal survey papers through an interactive pipeline where they can customize reference categorization, outlines, and content at each stage. The system outperforms mainstream LLMs and state-of-the-art survey generation systems across 40 topics from 8 research fields, producing a high-quality survey with ~50 references in just 35 minutes."
tags: [Survey Generation, LLM, Interactive, Personalized, Research Notes]
category: 연구노트
language: en
---

# InteractiveSurvey: LLM-based Personalized Survey Generation

**Paper:** InteractiveSurvey: An LLM-based Personalized and Interactive Survey Paper Generation System
**arXiv:** [2504.08762](https://arxiv.org/abs/2504.08762)
**Venue:** arXiv preprint (April 2025)

---

## Key Idea

An interactive survey generation system where users can intervene at each stage (reference categorization, outline, content) to produce personalized survey papers, rather than a black-box end-to-end approach.

## System Pipeline

1. **Reference Collection:** Online search + user uploads, with automatic categorization that users can refine
2. **Outline Generation:** LLM generates structure based on categorized references; users can modify
3. **Content Generation:** RAG-based section writing with multi-modal support; users can request revisions

## Results

Outperforms GPT-4, Claude, and existing survey generation systems (AutoSurvey) across 8 fields, 40 topics. Average generation time: ~35 minutes with ~50 references.

## Reference

- [arXiv:2504.08762](https://arxiv.org/abs/2504.08762) | [GitHub](https://github.com/TechnicolorGUO/InteractiveSurvey)
