---
title: "InteractiveSurvey: LLM 기반 맞춤형 서베이 논문 자동 생성 시스템"
date: 2026-04-02
summary: "InteractiveSurvey는 LLM을 활용하여 사용자가 대화형으로 서베이 논문을 생성할 수 있는 시스템이다. 온라인 검색과 사용자 업로드를 통해 참고 문헌을 수집하고, 참고 문헌 분류·아웃라인·본문 생성의 각 단계에서 사용자가 개입하여 커스터마이즈할 수 있다. 8개 분야 40개 주제에서 주류 LLM 및 기존 서베이 생성 시스템을 능가하며, 약 50편의 참고 문헌으로 35분 만에 고품질 서베이를 생성한다."
tags: [Survey Generation, LLM, Interactive, Personalized, 연구노트]
category: 연구노트
language: ko
---

# InteractiveSurvey: LLM 기반 맞춤형 서베이 논문 자동 생성 시스템

**논문:** InteractiveSurvey: An LLM-based Personalized and Interactive Survey Paper Generation System
**저자:** Shuaiqi Liu 외
**arXiv:** [2504.08762](https://arxiv.org/abs/2504.08762)
**학회:** arXiv preprint (2025년 4월)
**프로젝트:** [interactivesurvey.cn](https://interactivesurvey.cn/)

---

## 한 줄 요약

LLM으로 서베이 논문을 자동 생성하되, 사용자가 중간 과정(참고 문헌 분류, 아웃라인, 본문)에 개입하여 맞춤형으로 다듬을 수 있는 대화형 시스템.

---

## 1. 문제 인식

기존 서베이 자동 생성 시스템은 대부분 end-to-end 방식으로, 사용자가 주제만 입력하면 결과물이 나오는 블랙박스 구조다. 이는 두 가지 문제를 야기한다:

- **맞춤화 부재:** 연구자마다 관심 각도, 강조점, 분류 체계가 다름
- **중간 결과 제어 불가:** 참고 문헌 선택이나 아웃라인 구조가 부적절해도 수정 불가

InteractiveSurvey는 이를 해결하기 위해 **각 생성 단계에서 사용자 피드백을 받아 반복적으로 개선**하는 인터랙티브 파이프라인을 제안한다.

---

## 2. 시스템 구조

### 2.1 참고 문헌 수집

- **온라인 검색:** Semantic Scholar API 등을 활용한 자동 논문 검색
- **사용자 업로드:** 특정 논문을 직접 추가 가능
- 수집된 논문은 자동으로 분류(categorization)되며, 사용자가 분류 결과를 검토·수정 가능

### 2.2 아웃라인 생성

- LLM이 참고 문헌 분류를 기반으로 서베이 아웃라인(섹션/서브섹션 구조)을 생성
- 사용자가 아웃라인을 수정하면 이를 반영하여 재생성

### 2.3 본문 생성

- 각 섹션별로 관련 참고 문헌을 RAG 방식으로 참조하며 본문 작성
- 멀티모달 지원: 그림, 표 등도 포함 가능
- 사용자가 특정 섹션의 내용을 수정·보완 요청 가능

---

## 3. 주요 성과

- **8개 연구 분야, 40개 주제**에서 평가
- 주류 LLM(GPT-4, Claude 등) 직접 생성 대비 우수
- 기존 서베이 생성 시스템(AutoSurvey 등) 대비 우수
- 약 **50편의 참고 문헌으로 평균 35분** 만에 서베이 생성

---

## 4. 시사점

- **인간-AI 협업 패러다임:** 완전 자동화보다 인간이 개입하는 반자동화가 더 높은 품질을 달성
- **연구 워크플로우 가속:** 서베이 논문 작성의 초기 드래프트를 빠르게 생성하고, 연구자가 전문성을 투입하여 완성
- **개인화:** 같은 주제라도 연구자의 관점에 따라 다른 서베이 생성 가능

---

## 참고 문헌

- InteractiveSurvey: [arXiv:2504.08762](https://arxiv.org/abs/2504.08762)
- GitHub: [TechnicolorGUO/InteractiveSurvey](https://github.com/TechnicolorGUO/InteractiveSurvey)
