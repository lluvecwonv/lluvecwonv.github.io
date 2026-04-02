---
title: "SurveyGen-I: 진화하는 계획과 메모리 기반 서베이 생성"
date: 2026-04-02
summary: "SurveyGen-I는 coarse-to-fine 검색, 적응적 계획(PlanEvo), 메모리 기반 생성(CaM-Writing)을 결합한 서베이 자동 생성 프레임워크다. 기존 최강 베이스라인 대비 콘텐츠 품질 8.5% 향상, 인용 밀도 27% 증가, 고유 참고 문헌 수 2배 이상 달성한다."
tags: [Survey Generation, LLM, Memory-Guided, Planning, IJCNLP, 연구노트]
category: 연구노트
language: ko
---

# SurveyGen-I: 진화하는 계획과 메모리 기반 서베이 생성

**논문:** SurveyGen-I: Consistent Scientific Survey Generation with Evolving Plans and Memory-Guided Writing
**저자:** Jing Chen 외
**arXiv:** [2508.14317](https://arxiv.org/abs/2508.14317)
**학회:** IJCNLP-AACL 2025 (14th International Joint Conference on Natural Language Processing)

---

## 한 줄 요약

서베이 생성에서 **일관성(consistency)** 문제를 해결하기 위해, 이전 섹션의 내용을 기억(memory)하며 계획을 동적으로 진화시키는 프레임워크.

---

## 1. 핵심 문제: 일관성

긴 서베이 논문을 생성할 때 가장 큰 문제는 **일관성**이다:
- 앞에서 사용한 용어와 뒤에서 사용한 용어가 다름
- 같은 개념을 반복 설명하거나, 반대로 중요한 내용이 누락됨
- 섹션 간 논리적 연결이 약함

SurveyGen-I는 이를 **진화하는 메모리(evolving memory)**로 해결한다.

---

## 2. 세 가지 핵심 구성 요소

### 2.1 Coarse-to-Fine 문헌 검색

1. **서베이 레벨 검색:** 주제 전체에 대한 관련 논문 수집
2. **서브섹션 레벨 검색:** 각 서브섹션에 특화된 논문 추가 검색
3. **인용 확장(citation expansion):** 검색된 논문의 참고 문헌에서 추가 관련 논문 발굴
4. **LLM 기반 관련성 평가:** 수집된 논문의 관련성을 LLM으로 점수화

### 2.2 PlanEvo (Dynamic Planning)

- 초기 아웃라인을 생성한 후, 각 섹션을 작성할 때마다 **진화하는 메모리**를 참조하여 아웃라인을 업데이트
- 메모리에는 이전 섹션에서 사용된 용어, 다룬 내용, 정의된 개념 등이 축적
- **의존성 인식 작성 계획(dependency-aware writing plan):** 어떤 섹션이 어떤 섹션에 의존하는지를 그래프로 모델링

### 2.3 CaM-Writing (Citation-Aware Memory-Guided Writing)

- **인용 추적 모듈:** 검색된 패시지에서 간접 인용(indirect reference)을 탐지하고, 원래 출처 논문으로 역추적
- **메모리 기반 생성:** 축적된 메모리를 참조하여 이전 섹션과 일관된 문체·용어로 새 섹션 작성

---

## 3. 실험 결과

최강 베이스라인 대비:
- **콘텐츠 품질 8.5% 향상**
- **인용 밀도 27% 증가**
- **고유 참고 문헌 수 2배 이상**

---

## 참고 문헌

- SurveyGen-I: [arXiv:2508.14317](https://arxiv.org/abs/2508.14317)
- ACL Anthology: [IJCNLP-AACL 2025](https://aclanthology.org/2025.ijcnlp-long.193/)
