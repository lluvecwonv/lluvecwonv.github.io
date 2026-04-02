---
title: "SurveyG: 계층적 인용 그래프와 멀티에이전트 LLM 기반 서베이 생성"
date: 2026-04-02
summary: "SurveyG는 논문 간 인용 관계와 의미적 유사성을 계층적 그래프(Foundation→Development→Frontier)로 구조화한 뒤, 멀티에이전트 LLM이 수평·수직 탐색을 통해 다층 요약을 생성하고, 검증 단계를 거쳐 최종 서베이를 완성하는 프레임워크다."
tags: [Survey Generation, Multi-Agent, Citation Graph, LLM, 연구노트]
category: 연구노트
language: ko
---

# SurveyG: 계층적 인용 그래프와 멀티에이전트 LLM 기반 서베이 생성

**논문:** SurveyG: A Multi-Agent LLM Framework with Hierarchical Citation Graph for Automated Survey Generation
**arXiv:** [2510.07733](https://arxiv.org/abs/2510.07733)
**학회:** arXiv preprint (2025년 10월)

---

## 한 줄 요약

논문들의 **인용 관계를 3계층 그래프**로 구조화하고, 멀티에이전트가 이 그래프를 탐색하여 체계적인 서베이를 생성.

---

## 1. 핵심 아이디어

기존 서베이 생성 시스템의 한계: 대량의 논문을 수집한 뒤 LLM에게 직접 요약시키는 방식은 **논문 간 구조적 관계를 무시**한다. 결과적으로 분류 체계(taxonomy)가 부재하고, 연구 흐름에 대한 깊은 이해가 결여된다.

SurveyG는 **Hierarchical Citation Graph**를 도입하여 이 문제를 해결한다.

---

## 2. 3계층 인용 그래프

- **Foundation 층:** 해당 분야의 근본적인(seminal) 논문들. 높은 인용 수, 넓은 영향력
- **Development 층:** Foundation 위에 세워진 점진적 발전(incremental advances). 방법론 개선, 변형, 확장
- **Frontier 층:** 최신 연구 방향. 아직 인용이 적지만 새로운 패러다임을 제시

노드는 개별 논문, 엣지는 인용 관계 + 의미적 유사성을 포착한다.

---

## 3. 멀티에이전트 탐색

- **수평 탐색(Horizontal Search):** 같은 층 내에서 관련 논문들을 클러스터링하고 요약
- **수직 탐색(Vertical Depth Traversal):** 층 간을 오가며 연구의 진화 과정 추적
- **다층 요약(Multi-level Summary):** 각 층과 클러스터별 요약을 생성한 후 통합하여 서베이 아웃라인 구성

### 멀티에이전트 검증 단계

- **일관성 검증:** 섹션 간 모순이 없는지 확인
- **포괄성 검증:** 중요한 논문이 누락되지 않았는지 확인
- **사실 정확성 검증:** 인용된 내용이 원 논문과 일치하는지 확인

---

## 4. 실험 결과

인간 전문가 평가 및 LLM-as-a-judge 평가 모두에서 기존 SOTA 프레임워크 대비 우수한 포괄성과 구조적 체계성을 보임.

---

## 참고 문헌

- SurveyG: [arXiv:2510.07733](https://arxiv.org/abs/2510.07733)
