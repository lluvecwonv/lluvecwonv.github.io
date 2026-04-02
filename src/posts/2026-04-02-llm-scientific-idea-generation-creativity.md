---
title: "LLM의 과학적 아이디어 생성: 창의성 중심 서베이"
date: 2026-04-02
summary: "LLM 기반 과학적 아이디어 생성 방법론을 창의성 관점에서 체계적으로 정리한 서베이. Boden 분류법(탐색적/결합적/변환적 창의성)과 Rhodes 4P 프레임워크(Person/Process/Product/Press)를 적용하여 5가지 방법론 계열 — 외부 지식 보강, 프롬프트 기반 분포 조향, 추론 시간 스케일링, 멀티에이전트 협업, 파라미터 수준 적응 — 을 분석한다."
tags: [LLM, Scientific Discovery, Creativity, Idea Generation, Survey, 연구노트]
category: 연구노트
language: ko
---

# LLM의 과학적 아이디어 생성: 창의성 중심 서베이

**논문:** Large Language Models for Scientific Idea Generation: A Creativity-Centered Survey
**저자:** Fatemeh Shahhosseini 외
**arXiv:** [2511.07448](https://arxiv.org/abs/2511.07448)
**학회:** arXiv preprint (2025년 11월)

---

## 한 줄 요약

LLM이 과학적 아이디어를 생성할 때의 **창의성**을 체계적으로 분석하기 위해, 심리학의 창의성 이론을 적용한 서베이.

---

## 1. 두 가지 창의성 프레임워크

### Boden 분류법

- **탐색적 창의성(Exploratory):** 기존 개념 공간 내에서 새로운 조합 탐색
- **결합적 창의성(Combinational):** 서로 다른 영역의 아이디어를 연결
- **변환적 창의성(Transformational):** 개념 공간 자체를 재정의

### Rhodes 4P 프레임워크

- **Person:** 창의적 주체의 특성 (LLM의 학습 데이터, 아키텍처)
- **Process:** 창의적 과정 (프롬프팅, 검색, 추론 전략)
- **Product:** 창의적 산출물의 특성 (신규성, 타당성, 유용성)
- **Press:** 환경적 요인 (평가 기준, 피드백 루프)

---

## 2. 5가지 방법론 계열

### 2.1 외부 지식 보강 (External Knowledge Augmentation)
RAG, 논문 데이터베이스 검색 등으로 LLM이 접근할 수 있는 지식 범위를 확대

### 2.2 프롬프트 기반 분포 조향 (Prompt-based Distributional Steering)
프롬프트 엔지니어링으로 LLM의 출력 분포를 창의적 방향으로 유도

### 2.3 추론 시간 스케일링 (Inference-time Scaling)
더 많은 연산 자원을 추론 단계에 투입하여 깊은 사고 유도 (Chain-of-Thought 등)

### 2.4 멀티에이전트 협업 (Multi-agent Collaboration)
여러 LLM 에이전트가 다른 역할(비평가, 제안자, 검증자 등)을 맡아 아이디어를 발전

### 2.5 파라미터 수준 적응 (Parameter-level Adaptation)
파인튜닝, RLHF 등으로 모델 자체를 과학적 창의성에 맞게 조정

---

## 3. 핵심 통찰

- **신규성 vs 타당성 트레이드오프:** 모든 방법론은 새로움(novelty)과 과학적 유효성(validity) 사이의 균형을 조절
- LLM의 "창의성"은 대부분 **탐색적·결합적** 수준에 머물며, 진정한 **변환적** 창의성은 아직 드묾
- 평가 방법론의 표준화가 시급한 과제

---

## 참고 문헌

- LLM Scientific Idea Generation Survey: [arXiv:2511.07448](https://arxiv.org/abs/2511.07448)
