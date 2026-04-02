---
title: "LLM 에이전트 기반 코드 생성 서베이"
date: 2026-04-02
summary: "LLM 기반 코드 생성 에이전트의 발전 궤적을 추적하는 서베이. 단일 에이전트 및 멀티에이전트 아키텍처의 핵심 기법을 분류하고, 전체 소프트웨어 개발 생명주기(SDLC) 전반에 걸친 적용을 분석한다. 자율성, 확장된 태스크 범위, 엔지니어링 실용성 강화라는 세 가지 핵심 특성을 제시한다."
tags: [Code Generation, LLM, Agent, SDLC, Multi-Agent, Survey, 연구노트]
category: 연구노트
language: ko
---

# LLM 에이전트 기반 코드 생성 서베이

**논문:** A Survey on Code Generation with LLM-based Agents
**저자:** Yihong Dong, Xue Jiang, Jiaru Qian 외
**arXiv:** [2508.00083](https://arxiv.org/abs/2508.00083)
**학회:** arXiv preprint (2025년 7월)

---

## 한 줄 요약

LLM이 단순 코드 완성을 넘어 **자율적인 소프트웨어 개발 에이전트**로 진화하는 과정을 종합 정리.

---

## 1. 코드 생성 에이전트의 3대 특성

### 1.1 자율성 (Autonomy)
- 태스크 분해 → 코딩 → 디버깅 → 테스트의 전 과정을 독립적으로 관리
- 인간의 개입 없이 반복적 수정 가능

### 1.2 확장된 태스크 범위
- 기존: 함수/메서드 단위의 코드 스니펫 생성
- 현재: 전체 레포지토리 수준의 개발, CI/CD, 문서화, 코드 리뷰까지

### 1.3 엔지니어링 실용성 강화
- 알고리즘 혁신 → 실용적 엔지니어링 과제로 연구 초점 이동
- 시스템 안정성, 프로세스 관리, 도구 통합

---

## 2. 아키텍처 분류

### 단일 에이전트
- **ReAct 패턴:** Reasoning + Acting을 교차하며 코드 생성
- **Self-Debugging:** 생성된 코드를 실행하고 에러를 자체 수정
- **Tool-Augmented:** 검색, 실행 환경, 정적 분석 등 외부 도구 활용

### 멀티에이전트
- **역할 분담:** Architect, Developer, Tester, Reviewer 등 전문 에이전트
- **토론 기반:** 에이전트 간 논의를 통한 코드 품질 향상
- **계층적:** 관리 에이전트가 하위 에이전트에게 태스크 할당

---

## 3. SDLC 전반의 적용

| 단계 | 적용 사례 |
|:---|:---|
| 요구사항 분석 | 자연어 → 구조화된 명세 |
| 설계 | 아키텍처, API 설계 |
| 구현 | 코드 생성, 리팩토링 |
| 테스트 | 테스트 케이스 생성, 자동 테스팅 |
| 디버깅 | 버그 로컬라이제이션, 패치 생성 |
| 유지보수 | 코드 리뷰, 문서 업데이트 |
| 배포 | CI/CD, 인프라 코드 |

---

## 4. 대표적 도구

ChatDev, MetaGPT, Devin, Cursor, Claude Code, GitHub Copilot Workspace, SWE-Agent 등 다양한 상용/연구 도구를 카탈로그화.

---

## 참고 문헌

- Code Generation Agents Survey: [arXiv:2508.00083](https://arxiv.org/abs/2508.00083)
