---
title: "A Comprehensive Survey of Retrieval-Augmented Generation (RAG): Evolution, Current Landscape and Future Directions"
date: 2026-04-02
summary: "Retrieval-Augmented Generation(RAG)의 탄생부터 현재까지의 진화를 추적하는 포괄적 서베이. RAG의 기본 아키텍처, 검색-생성 통합 방식, 지식 집약적 태스크에서의 핵심 혁신, 그리고 확장성·편향·윤리적 과제까지 다룬다. CMU 연구팀 작성."
tags: [Report Generation, RAG, Survey, LLM, Knowledge-Intensive, Evolution, 연구노트]
category: 연구노트
language: ko
---

# RAG 종합 서베이: 진화, 현재, 미래 방향

**논문:** A Comprehensive Survey of Retrieval-Augmented Generation (RAG): Evolution, Current Landscape and Future Directions
**저자:** Shailja Gupta, Rajesh Ranjan (CMU), Surya Narayan Singh
**arXiv:** [2410.12837](https://arxiv.org/abs/2410.12837)
**학회:** arXiv preprint (2024년 10월)

---

## 한 줄 요약

RAG의 **역사적 진화**(초기 개념 → 현재 SOTA)를 추적하며, 기술적 혁신과 실용적 과제를 균형 있게 다룬 종합 서베이.

---

## 1. RAG의 진화 단계

### 1단계: 초기 개념 (2020)
- Lewis et al.의 RAG 논문: 사전학습된 retriever + generator를 end-to-end로 학습
- REALM (Guu et al.): 사전학습 단계에서 검색 통합

### 2단계: 검색 기법의 발전
- **Sparse → Dense → Hybrid:** BM25에서 DPR, 그리고 두 방식의 결합으로 진화
- **학습 가능한 검색기:** 생성 품질을 피드백으로 검색기를 파인튜닝

### 3단계: 현재 (Advanced RAG)
- **Self-RAG:** 모델이 스스로 검색 필요성을 판단하고 검색 결과를 비판적으로 평가
- **CRAG (Corrective RAG):** 검색 결과의 품질을 자동 평가하고, 부적절하면 웹 검색으로 대체
- **Adaptive RAG:** 쿼리 복잡도에 따라 검색 전략을 동적으로 선택

---

## 2. 핵심 과제

- **확장성(Scalability):** 수십억 문서 규모의 실시간 검색
- **편향(Bias):** 검색된 문서의 편향이 생성에 전파
- **윤리적 고려:** 개인정보가 포함된 문서의 검색·활용
- **환각 완화의 한계:** RAG도 완전히 환각을 제거하지는 못함

---

## 참고 문헌

- Comprehensive RAG Survey: [arXiv:2410.12837](https://arxiv.org/abs/2410.12837)
