---
title: "SurveyGen: 품질 인식 기반 과학 서베이 자동 생성"
date: 2026-04-02
summary: "SurveyGen은 4,200편 이상의 인간 작성 서베이와 242,143편의 인용 문헌으로 구성된 대규모 데이터셋과 함께, 문헌 검색 시 품질 지표를 반영하는 QUAL-SG 프레임워크를 제안한다. 콘텐츠 품질, 인용 품질, 구조적 일관성을 종합 평가하며, RAG 파이프라인에 품질 인식(quality-aware) 검색을 통합하여 더 높은 품질의 원천 논문을 선별한다."
tags: [Report Generation, Survey Generation, LLM, RAG, Quality-Aware, Dataset, EMNLP, 연구노트]
category: 연구노트
language: ko
---

# SurveyGen: 품질 인식 기반 과학 서베이 자동 생성

**논문:** SurveyGen: Quality-Aware Scientific Survey Generation with Large Language Models
**저자:** Tong Bao 외
**arXiv:** [2508.17647](https://arxiv.org/abs/2508.17647)
**학회:** EMNLP 2025
**GitHub:** [tongbao96/SurveyGen](https://github.com/tongbao96/SurveyGen)

---

## 한 줄 요약

서베이 자동 생성의 품질을 높이기 위해, 참고 문헌의 **품질 메타데이터**를 활용하여 더 좋은 논문을 선별·인용하는 RAG 기반 프레임워크.

---

## 1. 핵심 기여

### 1.1 SurveyGen 데이터셋

- **4,200편 이상의 인간 작성 서베이** (컴퓨터 과학, 의학, 생물학, 심리학 등 다양한 도메인)
- **242,143편의 인용 문헌** 및 품질 관련 메타데이터
- 기존 SciReviewGen 데이터셋이 CS에만 한정된 것과 달리 다분야 포괄

### 1.2 QUAL-SG 프레임워크

표준 RAG 파이프라인에 **품질 인식 지표(quality-aware indicators)**를 통합:

- 문헌 검색 시 단순 관련성(relevance)뿐 아니라 **논문의 품질**(인용 수, 저널 임팩트, 최신성 등)을 함께 고려
- 고품질 원천 논문을 우선 선별하여 서베이의 전체 품질 향상

### 1.3 종합 평가 체계

세 가지 축으로 서베이 품질 평가:
- **콘텐츠 품질:** 내용의 정확성, 깊이, 포괄성
- **인용 품질:** 인용된 논문의 적절성과 다양성
- **구조적 일관성:** 논리적 흐름과 섹션 간 연결성

---

## 2. 시사점

- **"쓰레기가 들어가면 쓰레기가 나온다"** — RAG에서 검색되는 원천 자료의 품질이 최종 생성물의 품질을 결정
- 품질 메타데이터를 활용한 검색은 서베이 생성뿐 아니라 일반적인 RAG 시스템에도 적용 가능
- EMNLP 2025 accept으로 학계에서의 검증

---

## 참고 문헌

- SurveyGen: [arXiv:2508.17647](https://arxiv.org/abs/2508.17647)
- ACL Anthology: [EMNLP 2025](https://aclanthology.org/2025.emnlp-main.136.pdf)
