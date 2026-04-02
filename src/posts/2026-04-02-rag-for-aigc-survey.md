---
title: "Retrieval-Augmented Generation for AI-Generated Content: A Survey"
date: 2026-04-02
summary: "RAG(Retrieval-Augmented Generation)가 텍스트, 코드, 이미지, 오디오, 비디오, 3D, 과학 등 다양한 AIGC 모달리티에 어떻게 적용되는지를 체계적으로 정리한 서베이. RAG의 기본 구조(검색→생성 파이프라인)에서부터 각 모달리티별 특화 기법, 향후 연구 방향까지 포괄한다."
tags: [Report Generation, RAG, Retrieval-Augmented Generation, AIGC, LLM, Survey, 연구노트]
category: 연구노트
language: ko
---

# Retrieval-Augmented Generation for AI-Generated Content: 종합 서베이

**논문:** A Survey on Retrieval-Augmented Generation for AI-Generated Content
**저자:** Penghao Zhao, Hailin Zhang 외
**arXiv:** [2402.19473](https://arxiv.org/abs/2402.19473)
**학회:** arXiv preprint (2024년 2월, v4: 2024년 6월)

---

## 한 줄 요약

RAG를 AIGC의 여러 모달리티(텍스트, 코드, 이미지, 오디오, 비디오, 3D, 과학)에 걸쳐 종합적으로 분석한 서베이.

---

## 1. RAG의 기본 구조

RAG는 두 단계로 구성된다:

1. **검색(Retrieval):** 외부 데이터 저장소에서 쿼리와 관련된 정보를 검색
2. **생성(Generation):** 검색된 정보를 컨텍스트로 활용하여 LLM이 응답 생성

이 패러다임은 LLM의 핵심 한계인 **환각(hallucination)**, **지식 업데이트 어려움**, **도메인 특화 지식 부족**을 완화한다.

---

## 2. 모달리티별 RAG 적용

### 텍스트
- QA, 요약, 대화 시스템에서 가장 성숙한 적용
- Dense retrieval (DPR, Contriever), Sparse retrieval (BM25) 결합

### 코드
- 코드 생성 시 유사 코드 스니펫, 문서, API 명세 검색
- 코드 검색의 특수성: 구조적 유사성과 기능적 유사성의 구분

### 이미지/비디오/오디오
- 이미지 생성 시 참조 이미지 검색으로 스타일/내용 가이드
- 비디오/오디오 생성에서 RAG는 아직 초기 단계

### 과학
- 분자 설계, 단백질 구조 예측, 수학 문제 풀이에서 관련 데이터 검색 활용

---

## 3. 주요 과제와 미래 방향

- **검색 품질:** 잘못된 정보가 검색되면 오히려 성능 저하 (noise injection)
- **효율성:** 대규모 데이터 저장소에서의 실시간 검색
- **멀티모달 통합:** 텍스트-이미지-코드를 통합하는 cross-modal RAG
- **평가 체계:** RAG 시스템의 표준화된 벤치마크 필요

---

## 참고 문헌

- RAG for AIGC Survey: [arXiv:2402.19473](https://arxiv.org/abs/2402.19473)
