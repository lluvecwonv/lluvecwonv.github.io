---
title: "Awesome LLM-based Text2SQL: 포괄적 자료 수집소"
date: 2026-04-01
summary: "LLM 기반 Text-to-SQL 작업에 대한 종합 자료 모음. 9개의 Survey 논문, 5개의 Benchmark, 14개의 Dataset, 40+ ICL 방법, 15+ Fine-tuning 방법, 그리고 다양한 도구들을 포함한 완전한 가이드"
tags: [LLM, Text-to-SQL, Awesome List, GitHub, Survey, Benchmark, Spider, BIRD, 연구노트]
category: 연구노트
language: ko
---

## 개요

홍콩폴리텍대학교(Hong Kong Polytechnic University) DEEP 연구실에서 2025년 9월 14일 오픈한 **Awesome-LLM-based-Text2SQL** 저장소는 LLM 기반 자연언어-SQL 변환(Text-to-SQL) 분야의 가장 포괄적인 자료 모음입니다. 이 저장소는 최신 학술 논문, 벤치마크 데이터셋, 기존 공개 데이터셋, 실제 응용을 위한 다양한 방법론들을 체계적으로 정리하고 있습니다.

이 글에서는 저장소의 구조, 주요 자료들, 그리고 실제 활용 방법에 대해 상세히 살펴보겠습니다.

## 1. Survey 논문들 (9개)

### 핵심 Survey

**Next-Generation Database Interfaces: A Survey of LLM-based Text-to-SQL** (TKDE 2025)
- 이 저장소를 생성한 핵심 Survey 논문
- LLM 기반 Text-to-SQL의 최신 발전 상황을 종합적으로 다룸
- 모델, 방법론, 평가 메트릭, 향후 방향을 포함

### 주요 Survey 목록

| 논문명 | 학회/저널 | 연도 | 주요 내용 |
|--------|---------|------|---------|
| Next-Generation Database Interfaces Survey | TKDE | 2025 | LLM 기반 Text-to-SQL 전체 개요 |
| ACM CSUR Survey | ACM Computing Surveys | 2025 | Text-to-SQL 방법론의 분류 및 분석 |
| IEEE TKDE Survey | IEEE TKDE | 2025 | 데이터베이스 인터페이스 발전 추적 |
| VLDB Journal Survey | VLDB Journal | 2023 | SQL 생성의 도전과제 분석 |
| COLING Workshop | COLING | 2022 | 자연언어-DB 상호작용 연구 |

이 Survey 논문들은 Text-to-SQL 분야의 발전 과정, 핵심 도전과제, 그리고 최신 기술들을 종합적으로 이해하는 데 필수적입니다.

## 2. Benchmark 데이터셋 (5개)

### BIRD (Big-Bench Instruct-tuning on Real-world and Diverse SQL)
- **출처**: NeurIPS 2023
- **특징**: 현실 세계 데이터베이스 기반 Text-to-SQL 벤치마크
- **크기**: 상당한 규모의 다양한 도메인 포함
- **난이도**: 실제 응용 환경을 반영한 높은 난이도
- **평가 지표**: Execution Accuracy, Valid Efficiency Score

### Spider 1.0
- **출처**: EMNLP 2018
- **데이터**: 10,181개의 질문-SQL 쌍
- **특징**: 200개 이상의 데이터베이스 스키마 포함
- **난이도**: 초급부터 어려운 문제까지 다양
- **영향력**: Text-to-SQL 연구의 가장 영향력 있는 벤치마크

### Spider 2.0
- **출처**: ICLR 2025
- **특징**: Spider 1.0의 개선된 버전
- **새로운 요소**: 더 복잡한 JOIN, 서브쿼리, 집계 함수 포함
- **향상점**: 더 정교한 평가 메트릭

### BIRD-CRITIC
- **출처**: NeurIPS 2025
- **특징**: BIRD의 비판적 분석 추가
- **목표**: 모델의 오류 분석 및 개선 방향 제시
- **포함**: 오류 유형 분류, 어려운 사례 분석

### BIRD-INTERACT
- **출처**: ICLR 2026
- **특징**: 사용자 상호작용 기반 벤치마크
- **포함**: 다중 회차 대화, 명확화 요청 등

## 3. 원본 데이터셋 (7개)

이 섹션의 데이터셋들은 Text-to-SQL 연구의 기초를 형성하는 공개 벤치마크들입니다.

### WikiSQL
- **크기**: 80,654개 질문-SQL 쌍
- **특징**: Wikipedia 테이블 기반
- **복잡도**: 단순 SELECT 쿼리 중심
- **용도**: 초급 모델 학습, 기초 연구

### Spider
- **크기**: 10,181개 질문-SQL 쌍
- **특징**: 200개 이상의 실제 데이터베이스 스키마
- **복잡도**: 중급~어려움 (JOIN, 서브쿼리 포함)
- **영향력**: 가장 광범위하게 사용되는 벤치마크

### CoSQL
- **크기**: 15,598개 상호작용 기록
- **특징**: Spider 기반 대화형 Text-to-SQL
- **특징**: 사용자-시스템 다중 회차 상호작용
- **용도**: 대화형 SQL 생성 연구

### DuSQL
- **크기**: 23,797개 질문-SQL 쌍
- **언어**: 중국어
- **특징**: 다국어 Text-to-SQL 연구 기반
- **도메인**: 다양한 산업 데이터베이스

### SQUALL
- **크크**: 11,468개 질문-SQL 쌍
- **특징**: 자연언어와 논리 형식(Logical Forms) 모두 포함
- **용도**: 의미 파싱 및 구조적 이해 연구

### KaggleDBQA
- **크기**: 272개 질문-SQL 쌍
- **특징**: Kaggle 데이터셋 기반
- **용도**: 실제 데이터 분석 시나리오

### FinSQL/BULL
- **크기**: 4,966개 질문-SQL 쌍
- **도메인**: 금융 데이터베이스
- **특징**: 금융 용어와 특화된 쿼리 포함
- **용도**: 도메인 특화 Text-to-SQL 연구

## 4. 후처리 데이터셋 (7개)

기존 데이터셋을 특정 목적으로 재주석(Re-annotate)한 데이터셋들입니다.

### Spider-Realistic
- **목표**: 더 현실적인 자연언어 표현
- **개선**: 원본 Spider의 부자연스러운 표현 수정
- **용도**: 실제 사용자 질의 패턴 학습

### Spider-SYN (Syntactic Variations)
- **특징**: 동일한 의미를 가진 다양한 자연언어 표현
- **용도**: 모델의 robust성 및 일반화 능력 평가
- **활용**: 데이터 증강 및 모델 평가

### Spider-DK (Domain Knowledge)
- **특징**: 도메인 지식 기반 주석
- **포함**: 데이터베이스 스키마의 의미론적 정보
- **용도**: 의미 이해 기반 SQL 생성

### Spider-SS/CG (Schema Simplification/Column Generation)
- **특징**: 단순화된 스키마 표현
- **포함**: 자동 생성 컬럼 설명
- **용도**: 스키마 이해도 평가

### ADVETA
- **특징**: 적대적(Adversarial) 테스트 사례
- **목표**: 모델의 약점 발견
- **포함**: 미묘한 오류를 유발하는 사례들

### Dr.Spider
- **특징**: 의료(Doctor) 도메인 Spider
- **용도**: 의료 데이터베이스 쿼리 생성
- **특징**: 의료 용어와 개념 포함

### Spider-Vietnamese
- **특징**: 베트남어로 번역된 Spider
- **용도**: 다국어 Text-to-SQL 연구
- **포함**: 베트남어 자연언어 이해

## 5. In-Context Learning (ICL) 방법 (40+)

LLM의 프롬프팅(Prompting) 기반 방법들로, 모델의 파인튜닝 없이 성능을 높입니다.

### BIRD 벤치마크에서의 최고 성과

**AskData + GPT-4o**
- **개발셋 정확도**: 77.64%
- **테스트셋 정확도**: 81.95%
- **특징**: 체계적인 프롬프트 엔지니어링과 대형 모델의 조합
- **방법**: 데이터베이스 스키마 이해를 위한 다단계 질의

**Agentar-Scale-SQL**
- **개발셋 정확도**: 74.90%
- **특징**: 에이전트 기반 확장 가능한 접근법
- **장점**: 다양한 스케일의 데이터베이스에 확장 가능

### Spider 벤치마크에서의 최고 성과

**MiniSeek**
- **테스트셋 정확도**: 91.2%
- **특징**: 경량 모델을 통한 고효율 달성
- **장점**: 추론 속도와 정확도의 균형

**DAIL-SQL + GPT-4**
- **테스트셋 정확도**: 86.6%
- **방법**: 동적 상호작용 학습(Dynamic In-Context Learning)
- **특징**: 맥락 길이 최적화

### 주목할 만한 방법들

**DIN-SQL (Decoupled In-Context Numbering)**
- 스키마와 질의 처리를 분리
- 복잡한 조인 처리 개선

**C3 (Chain-of-thought Cross-consistency)**
- 여러 추론 경로의 일관성 확인
- 오류 정정 메커니즘

**LinkAlign**
- 자연언어와 스키마 요소의 정렬
- 의미론적 매핑 개선

**ReFoRCE (Retrieval-Free Reasoning for Complex Entities)**
- 검색 없이 복잡한 엔티티 처리
- 메모리 효율성 증대

## 6. Fine-Tuning 방법 (15+)

모델을 직접 학습시키는 방법들로, 높은 정확도를 달성할 수 있습니다.

### 주요 Fine-Tuning 방법들

**RESDSQL-3B + NatSQL**
- **모델 크기**: 3B 파라미터
- **Spider 테스트셋 정확도**: 79.9%
- **특징**: 자연 SQL(Natural SQL) 표현 사용
- **장점**: 작은 모델로 높은 성능 달성

**OmniSQL**
- **특징**: 다목적 SQL 생성 모델
- **포함**: 여러 도메인과 언어 지원
- **용도**: 범용 Text-to-SQL 시스템

**MARS-SQL (Multi-Agent Reasoning for SQL)**
- **특징**: 다중 에이전트 기반 추론
- **포함**: 스키마 분석, 쿼리 생성 에이전트
- **성능**: 복잡한 쿼리 처리 개선

**ROUTE (Routing-based Task-specific Execution)**
- **특징**: 작업별 라우팅 메커니즘
- **포함**: 난이도별 서로 다른 모델 사용
- **이점**: 각 난이도에 최적화된 모델 활용

**CodeS (Code-based SQL Generation)**
- **특징**: 코드 생성 기반 접근
- **포함**: 중간 표현(Intermediate Representation) 활용
- **장점**: 논리적 정확성 향상

### 다양한 Fine-Tuning 접근법

| 방법명 | 특징 | 주요 개선점 |
|--------|------|-----------|
| Sequence-to-Sequence | 기본 인코더-디코더 | 기초 구조 |
| Graph Neural Networks | 스키마 그래프 활용 | 관계 이해 |
| Syntax-aware Methods | 구문 제약 적용 | 문법적 정확성 |
| Semantic Parsing | 의미 표현 학습 | 의미론적 이해 |
| Reinforcement Learning | 정책 최적화 | 실행 정확도 |

## 7. 도구 및 라이브러리 (Tools)

### SQLGlot
- **특징**: SQL 방언 간 변환 도구
- **기능**: 쿼리 정규화, 검증, 최적화
- **용도**: 생성된 SQL의 유효성 검사 및 표준화

### DB-GPT
- **특징**: 데이터베이스 전용 GPT 시스템
- **포함**: 자연언어-DB 상호작용 인터페이스
- **기능**: 데이터 분석, 보고서 생성, 데이터 관리

### DB-GPT-Hub
- **특징**: DB-GPT의 확장 에코시스템
- **포함**: 다양한 플러그인 및 커뮤니티 모델
- **용도**: 실제 프로덕션 환경 배포

### PremSQL
- **특징**: 프리미엄 Text-to-SQL 서비스
- **포함**: 클라우드 기반 API
- **장점**: 자동 스케일링 및 관리

### AI-for-Database
- **특징**: AI 기반 데이터베이스 최적화
- **포함**: 인덱스 최적화, 쿼리 최적화
- **용도**: 데이터베이스 성능 향상

## 8. 저장소 활용 방법

### 8.1 연구 시작 시

Text-to-SQL 연구를 시작할 때는 다음 순서를 추천합니다:

1. **Survey 논문 읽기**: TKDE 2025 Survey부터 시작하여 분야의 전체 그림 파악
2. **Benchmark 이해**: Spider 1.0과 BIRD의 특징과 차이 이해
3. **기본 방법 이해**: DIN-SQL, C3 등 주요 ICL 방법의 원리 학습
4. **코드 실행**: 저장소의 제공 코드로 기본 성능 재현

### 8.2 모델 평가

자신의 모델을 평가할 때:

1. **Spider부터 시작**: 가장 널리 사용되는 벤치마크로 기본 성능 측정
2. **BIRD로 검증**: 더 현실적인 상황에서의 성능 평가
3. **상세 분석**: 오류 유형별 분석 (BIRD-CRITIC 활용)
4. **다양한 도메인**: Spider-Vietnamese, FinSQL 등으로 다국어/도메인 특화 성능 확인

### 8.3 개선 방법 선택

성능 개선 방향에 따른 선택:

**빠른 성능 향상 필요:**
- ICL 방법 시도 (DIN-SQL, C3, LinkAlign 등)
- 최소한의 추가 학습 필요
- GPT-4o, Claude 등 대형 모델 활용

**높은 정확도 추구:**
- Fine-tuning 방법 적용 (RESDSQL, OmniSQL 등)
- 상당한 계산 자원 필요
- 특화된 모델 개발

**실제 운영 환경:**
- DB-GPT, DB-GPT-Hub 등의 도구 활용
- 프로덕션 수준의 안정성 필요
- 자동 스케일링 및 모니터링

## 9. 최근 발전 동향

### 2025년의 주요 변화

1. **대형 모델의 영향 증대**: GPT-4o와 같은 대형 모델의 성능 향상으로 ICL 방법의 중요성 증가

2. **벤치마크의 고도화**: Spider 2.0, BIRD-INTERACT 등 더욱 현실적이고 도전적인 벤치마크 등장

3. **사용자 상호작용 고려**: CoSQL, BIRD-INTERACT 등을 통한 대화형 시스템 연구 활발화

4. **다국어 확장**: DuSQL, Spider-Vietnamese 등 다국어 Text-to-SQL 연구 증가

5. **도메인 특화**: FinSQL, Dr.Spider 등 특정 도메인을 위한 전문 데이터셋 개발

### 향후 연구 방향

- **효율성**: 작은 모델로 높은 성능 달성 (예: MiniSeek의 91.2%)
- **해석 가능성**: 모델의 의사결정 과정 이해 및 설명 가능성
- **안정성**: 적대적 공격(ADVETA)에 대한 견고성
- **실시간성**: 낮은 지연시간으로 대화형 처리
- **외국어**: 다양한 언어에 대한 지원 확대

## 10. 결론

**Awesome-LLM-based-Text2SQL** 저장소는 Text-to-SQL 분야의 가장 포괄적인 자료 모음입니다. 9개의 Survey 논문부터 시작하여 5개의 벤치마크, 14개의 데이터셋, 40개 이상의 ICL 방법, 15개 이상의 Fine-tuning 방법까지 모든 주요 자료를 한 곳에 정리하고 있습니다.

이 저장소를 통해 다음을 할 수 있습니다:

1. **학문적 이해**: 최신 Survey 논문으로 분야의 현황 파악
2. **실험적 검증**: 다양한 벤치마크로 모델 평가
3. **방법론 학습**: 다양한 ICL 및 Fine-tuning 방법의 비교 분석
4. **실제 적용**: 제공되는 도구로 실제 프로덕션 시스템 구축

Text-to-SQL은 자연언어로 데이터베이스에 접근할 수 있게 해주는 중요한 기술입니다. 이 저장소는 이 분야에서 최고의 자료와 방법을 모두 포함하고 있어, 연구자와 실무자 모두에게 매우 유용한 자원이 될 것입니다.

## 참고 자료

- GitHub: https://github.com/DEEP-PolyU/Awesome-LLM-based-Text2SQL
- Organization: DEEP-PolyU (Hong Kong Polytechnic University)
- Launch Date: 2025년 9월 14일
- 주요 Survey: "Next-Generation Database Interfaces: A Survey of LLM-based Text-to-SQL" (TKDE 2025)

---

**최종 업데이트**: 2026년 4월 1일
**작성자**: 연구 노트
