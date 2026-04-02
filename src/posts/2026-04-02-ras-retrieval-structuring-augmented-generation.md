---
title: "A Survey on Retrieval And Structuring Augmented Generation (RAS)"
date: 2026-04-02
summary: "기존 RAG를 넘어 Retrieval And Structuring(RAS) 증강 생성을 제안하는 서베이. 동적 정보 검색과 구조화된 지식 표현(택소노미 구축, 계층적 분류, 정보 추출)을 통합하며, 프롬프트 기반 방법, 추론 프레임워크, 지식 임베딩 등 LLM과의 통합 기법을 분석한다."
tags: [Report Generation, RAG, RAS, Structured Knowledge, LLM, KDD, Survey, 연구노트]
category: 연구노트
language: ko
---

# RAS: 검색과 구조화 증강 생성 서베이

**논문:** A Survey on Retrieval And Structuring Augmented Generation with Large Language Models
**arXiv:** [2509.10697](https://arxiv.org/abs/2509.10697)
**학회:** KDD 2025 (31st ACM SIGKDD, Toronto, Canada)

---

## 한 줄 요약

단순한 검색-생성(RAG)을 넘어, 검색된 정보를 **구조화(Structuring)**한 뒤 LLM에 제공하는 **RAS** 패러다임을 종합 분석.

---

## 1. RAG vs RAS

**RAG의 한계:** 검색된 문서를 그대로 LLM에 전달하면:
- 비구조적 텍스트의 노이즈가 생성에 전파
- 문서 간 관계, 위계 구조, 시간적 순서 등이 손실
- 복잡한 추론이 필요한 태스크에서 성능 저하

**RAS의 해결:** 검색 후 **구조화** 단계를 추가:
- 택소노미(taxonomy) 구축
- 계층적 분류(hierarchical classification)
- 정보 추출(information extraction) — 엔티티, 관계, 이벤트
- 지식 그래프 구성

---

## 2. 세 가지 축

### 2.1 검색 메커니즘
- **Sparse Retrieval:** BM25, TF-IDF
- **Dense Retrieval:** 임베딩 기반 (DPR, Contriever, E5)
- **Hybrid:** Sparse + Dense 결합

### 2.2 텍스트 구조화 기법
- **택소노미 구축:** 개념 간 is-a 관계 자동 추출
- **계층적 분류:** 다중 레벨 카테고리 할당
- **정보 추출:** 엔티티, 관계, 이벤트를 구조적 형태로 변환

### 2.3 LLM 통합
- **프롬프트 기반:** 구조화된 정보를 프롬프트에 직접 삽입
- **추론 프레임워크:** Chain-of-Thought, Graph-of-Thought 등과 결합
- **지식 임베딩:** 구조화된 지식을 모델 파라미터에 통합

---

## 3. 시사점

- KDD 2025 accept — 정보 검색과 데이터 마이닝 커뮤니티에서의 검증
- RAG의 다음 진화 방향으로 **구조화**가 핵심
- 지식 그래프 + LLM의 시너지 가능성

---

## 참고 문헌

- RAS Survey: [arXiv:2509.10697](https://arxiv.org/abs/2509.10697)
- ACM DL: [KDD 2025](https://dl.acm.org/doi/10.1145/3711896.3736557)
