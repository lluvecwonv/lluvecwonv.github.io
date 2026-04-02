---
title: "Large Language Model Enhanced Text-to-SQL Generation: A Survey"
date: 2026-03-31
summary: "자연어를 SQL로 변환하는 Text-to-SQL 태스크에 대해 LLM 기반 접근법을 Prompt, Fine-Tuning, Task-Training, LLM Agent 4가지 카테고리로 체계적으로 분류하고, 20개 이상의 데이터셋과 4가지 평가 메트릭(EM, EX, VES, TS)을 종합적으로 정리한 서베이 논문입니다."
tags: [LLM, Text-to-SQL, NLP, Prompt Engineering, Fine-Tuning, Survey, 연구노트]
category: 연구노트
language: ko
---

본 연구노트는 **Large Language Model Enhanced Text-to-SQL Generation: A Survey** 논문을 정리한 글입니다.
저자는 Xiaohu Zhu, Qian Li, Lizhen Cui, Yongkang Liu 입니다.

핵심 질문은 다음과 같습니다:

**"LLM의 등장 이후, Text-to-SQL 태스크의 방법론은 어떻게 발전해왔으며, 각 접근법의 장단점은 무엇인가?"**

이 서베이는 LLM 기반 Text-to-SQL 방법론을 **Prompt, Fine-Tuning, Task-Training, LLM Agent** 4가지 카테고리로 분류하고, 각 방법론에 속하는 대표적인 모델들을 체계적으로 비교 분석합니다.

## 한 줄 요약

LLM 기반 Text-to-SQL 방법론을 4가지 학습 전략(Prompt / Fine-Tuning / Task-Training / LLM Agent)으로 분류하고, 20개 이상의 데이터셋과 주요 평가 메트릭을 종합 정리한 서베이입니다.

## 1. 서론 — Text-to-SQL이란?

![Figure 1: Text-to-SQL 개요](/figures/text-to-sql/flowchart.png)
*Figure 1: Text-to-SQL 태스크의 전체 흐름도. 사용자 질문과 데이터베이스 스키마가 수집되고, 프롬프트 엔지니어링 및 파인튜닝을 거쳐 LLM이 SQL 쿼리를 생성하는 과정.*

### 1.1 배경

데이터베이스 쿼리 언어(SQL)의 학습 장벽은 일반 사용자에게 높습니다. Text-to-SQL 태스크는 자연어 질문을 SQL 명령어로 변환하여 사용자가 자연어로 데이터베이스와 상호작용할 수 있게 합니다.

예시:
- **자연어 질문 Q**: "가장 높은 급여를 받는 직원의 이름은?"
- **데이터베이스 스키마 S**: Table: Employees (ID, Name, Salary)
- **생성 SQL**: `SELECT Name FROM Employees ORDER BY Salary DESC LIMIT 1;`

Text-to-SQL의 역사는 1973년 LUNAR 시스템까지 거슬러 올라가며, 초기에는 규칙 기반(rule-based) 접근법이 주류였습니다. 이후 LSTM, Transformer 기반 딥러닝 방법론이 등장했고, 최근에는 GPT-4, ChatGPT 등 LLM이 Spider 데이터셋에서 최고 성능을 달성하면서 새로운 패러다임을 열었습니다.

### 1.2 LLM 기반 Text-to-SQL의 4가지 분류

![Figure 2: Text-to-SQL 메트릭, 데이터셋, 방법론 전체 개요](/figures/text-to-sql/Text-to-SQL.png)
*Figure 2: Text-to-SQL의 메트릭, 데이터셋, 방법론에 대한 전체 분류 체계(taxonomy).*

1. **Prompt** (학습 없음): Zero-shot, Few-shot, Chain-of-Thought 등 프롬프트 설계로 LLM이 SQL을 직접 생성
2. **Fine-Tuning** (사전학습 LLM 기반 학습): Full-parameter 또는 Parameter-Efficient Fine-Tuning (PEFT)
3. **Task-Training** (처음부터 학습): Transformer, MoE 등 아키텍처를 Text-to-SQL 전용으로 학습
4. **LLM Agent** (다중 에이전트 + 외부 도구): 여러 에이전트가 협력하여 SQL 생성, 수정, 검증

## 2. 평가 메트릭 (Evaluation Metrics)

### 2.1 Exact Matching Accuracy (EM)

모델이 생성한 SQL이 정답 SQL과 **완전히 동일**한지 평가합니다.

$$EM = \frac{1}{N} \sum_{i=1}^{N} \mathbb{I}(\hat{Y}_i = Y_i)$$

- SQL 문법의 다양성 때문에 동일한 결과를 반환하는 다른 SQL이 오답으로 처리될 수 있는 한계가 있음

### 2.2 Execution Accuracy (EX)

생성된 SQL을 실제로 실행하여 **결과가 정답과 동일**한지 평가합니다.

$$EX = \frac{1}{N} \sum_{i=1}^{N} \mathbb{I}(f(Q_i, S_i) = A_i)$$

- EM보다 실용적이지만, 우연히 같은 결과를 반환하는 잘못된 SQL도 정답으로 처리될 수 있음

### 2.3 Valid Efficiency Score (VES)

SQL의 정확성뿐 아니라 **실행 효율성**도 함께 평가합니다.

$$VES = \frac{1}{N} \sum_{i=1}^{N} \left( \mathbb{I}(Q_i^{gen} = Q_i^{gold}) \cdot \frac{T_{gold}}{T_{gen}} \right)$$

- 정답 SQL 대비 생성 SQL의 실행 시간 비율을 고려

### 2.4 Test-suite Accuracy (TS)

다양한 데이터베이스 시나리오에 대한 **테스트 스위트**에서 모델 성능을 평가합니다.

$$TS = \frac{1}{N} \sum_{i=1}^{N} \mathbb{I}(f(Q_i, D_i) = R_i)$$

- 의미적 정확성의 엄격한 상한(strict upper limit)을 측정

## 3. 데이터셋 (Datasets)

| 데이터셋 | Train | Valid | Test | Turn | Type | Language | Year |
|---|---|---|---|---|---|---|---|
| ATIS | 4,473 | 497 | 448 | Single | Single-Domain | English | 1990 |
| GeoQuery | 600 | - | 280 | Single | Single-Domain | English | 1996 |
| Scholar | 600 | - | 216 | Single | Single-Domain | English | 2017 |
| WikiSQL | 56,355 | 8,421 | 15,878 | Single | Cross-Domain | English | 2017 |
| Spider | - | - | - | Single | Cross-Domain | English | 2018 |
| BIRD | 8,659 | 1,034 | 2,147 | Single | Cross-Domain | English | 2023 |
| CoSQL | 2,164 | 292 | 551 | Multi | Cross-Domain | English | 2019 |
| SParC | 9,025 | 1,203 | 2,498 | Multi | Cross-Domain | English | 2018 |
| CSpider | 6,831 | 954 | 1,906 | Single | Cross-Domain | Chinese | 2019 |
| DuSQL | 18,602 | 2,039 | 3,156 | Single | Cross-Domain | Chinese | 2020 |
| CHASE | 3,949 | 755 | 755 | Multi | Cross-Domain | Chinese | 2021 |
| EHRSQL | 5,124 | 1,163 | 1,167 | Multi | Single-Domain | English | 2023 |
| BEAVER | 93 | - | - | Multi | Cross-Domain | English | 2024 |
| KaggleDBQA | 272 | - | - | Single | Cross-Domain | English | 2021 |

*Table 1: 주요 Text-to-SQL 데이터셋 통계. Single/Cross-Domain, Single/Multi-Turn 등 다양한 특성을 포함.*

### 주요 데이터셋 특징

- **WikiSQL** (2017): 80,654개 데이터. 단일 테이블, 간단한 SQL 연산만 지원하는 한계
- **Spider** (2018): 현재 가장 복잡한 벤치마크. 138개 도메인의 200개 이상 DB, orderBy/union/except/groupBy/intersect/nested query 지원. 난이도 4단계(Easy~Extra Hard)
- **BIRD** (2023): 실제 응용과 학술 연구 간 격차 해소 목적. 더러운 DB 콘텐츠, 외부 지식 필요, SQL 효율성 평가 포함
- **BEAVER** (2024): 실제 기업 환경의 복잡한 테이블 조인/집계를 모델링. 기존 Spider/BIRD의 한계를 보완

### 증강 데이터셋 (Augmented Datasets)

Spider를 기반으로 다양한 도전 과제를 추가한 변형 데이터셋들:

- **Spider-SYN**: 동의어 치환으로 모델 견고성 테스트
- **Spider-DK**: 도메인 특화 지식이 필요한 상황 평가
- **Spider-Realistic**: 실제 환경에 더 가까운 질문-SQL 쌍 생성
- **Spider-SS&CG**: 스키마 단순화 및 복잡화를 통한 조합 일반화 평가
- **CSpider**: 중국어 Text-to-SQL (저자원 언어 대응)

## 4. 방법론 (Methodology)

### 4.1 전통적 방법 (Traditional Methods)

#### LSTM 기반
초기 딥러닝 접근법으로 Bi-LSTM을 사용하여 질문-SQL 쌍의 의미적 표현을 학습합니다. TypeSQL, Seq2SQL, SQLNet, SyntaxSQLNet 등이 대표적입니다. 순차 처리 기반이므로 복잡한 쿼리의 장거리 의존성에 한계가 있습니다.

#### Transformer 기반
Self-attention 메커니즘으로 장거리 의존성을 효과적으로 처리합니다. 주요 모델:
- **GraPPa**: Grammar-augmented pretraining으로 스키마 이해 강화
- **TaBERT**: 테이블 + 텍스트 데이터를 공동 이해하는 사전 학습
- **TAPEX**: 논리 절차 기반 테이블 사전 학습
- **S²SQL**: 질문-스키마 상호작용에 구문 주입
- **ShadowGNN / LGESQL**: 그래프 신경망 기반 스키마 연결

### 4.2 Prompt 기반 방법

![Figure 3: Prompt Engineering 방법론](/figures/text-to-sql/prompt_examples.png)
*Figure 3: Text-to-SQL에서의 Prompt Engineering 3가지 접근법: (a) Zero-shot — 예시 없이 SQL 생성, (b) Few-shot — 소수 예시로 가이드, (c) Reasoning (CoT) — 단계별 추론.*

#### Zero-shot Prompt
모델에 태스크 설명, 테스트 문제, DB 스키마만 제공하고 예시 없이 SQL을 생성합니다.
- **장점**: 새로운 태스크/도메인에 빠르게 적용 가능, 추가 학습 불필요
- **단점**: 복잡한 쿼리에서 정확도가 떨어질 수 있음

#### Few-shot Prompt
소수의 예시(demonstrations)와 함께 질문을 제공합니다.
- **SC-prompt**: 분할 정복(divide-and-conquer) 접근. 구조 단계(SQL 골격 생성) → 내용 단계(구체적 값 대입)
- **MCS-SQL**: 스키마 링킹 → 병렬 SQL 생성 → 최적 쿼리 선택. 다중 프롬프트로 더 넓은 탐색 공간 확보
- **SQL-PaLM**: 유사성과 다양성 균형을 고려한 Few-shot 예시 선택 전략

#### Chain of Thought (CoT)
중간 추론 단계를 통해 복잡한 사고 능력을 활성화합니다.
- **Chat2Query**: Zero-shot SQL 생성 + CoT 프롬프트로 단계별 SQL 생성. TiDB Serverless 기반
- **ACT-SQL**: 정적 + 동적 예시를 결합한 하이브리드 방법

### 4.3 Fine-Tuning 기반 방법

#### Full-Parameter Fine-Tuning
모델의 모든 파라미터를 학습합니다.
- **DIN-SQL**: 복잡한 태스크를 소규모 서브태스크로 분해 → 쿼리 분류(Easy/Non-nested Complex/Nested Complex) → NatSQL 중간 표현 → 자기 수정 모듈. **Spider 85.3%, BIRD 55.9% EX 달성**
- **MAC-SQL**: 다중 에이전트 협업 (Decomposer + Selector + Refiner). Code Llama 기반 SQL-Llama 오픈소스 모델 공개
- **Knowledge-to-SQL**: DPO 알고리즘으로 관련 지식 생성 능력 향상. LLaMA-2-13b 기반
- **SGU-SQL**: 그래프 기반 구조와 문법 트리로 복잡한 구조 분해

#### Parameter-Efficient Fine-Tuning (PEFT)
모델의 일부 파라미터만 학습하여 효율성을 높입니다.
- **DAIL-SQL**: Supervised Fine-Tuning 전략 탐색. GPT-4 기반으로 Spider, Spider-Realistic에서 평가
- **StructLM**: Instruction Fine-Tuning으로 구조화된 지식 태스크 일반화 향상. 코드 사전학습이 구조화 태스크에 유의미한 효과
- **CLLMs**: Consistency loss + AR loss 결합으로 수렴 속도 향상. 단일 반복에서 여러 토큰 생성
- **LoRA / QLoRA**: 메모리 요구량 감소 + SQL 생성 적응. 사전 학습 가중치 동결 후 각 Transformer 블록에 학습 가능한 레이어 주입

### 4.4 Task-Training (처음부터 학습)

#### Mixture of Experts (MoE) 모델
- **SQL-GEN**: SQL 템플릿 확장 + 방언별(BigQuery, PostgreSQL) 모델을 MoE로 결합

#### Transformer 기반 모델
- **CodeS**: 오픈소스 대안 (1B~15B 파라미터). BM25로 관련 테이블/컬럼/값 필터링. 양방향 데이터 증강으로 새 도메인 적응
- **MIGA**: T5 기반. 3가지 서브태스크(RSP, TWP, FUP) + 4가지 SQL 교란으로 에러 전파 최소화
- **RESDSQL**: 스키마 링킹과 스켈레톤 파싱 분리(decoupling)
- **SQLova**: BERT 임베딩 + 다층 LSTM으로 SQL 생성. 실행 기반 디코딩(EG)

### 4.5 LLM Agent 기반 방법

다중 에이전트 협업으로 SQL 생성, 수정, 검증을 수행합니다.

- **MAC-SQL**: Decomposer (태스크 분해) + Selector (DB 필터링) + Refiner (SQL 수정)
- **Tool-SQL**: 검색기(Retriever) + 탐지기(Detector) 도구로 DB 불일치 진단/수정
- **SQLFixAgent**: SQLRefiner (최종 SQL 생성) + SQLReviewer (구문/의미 오류 탐지) + SQLTool (후보 SQL 생성)
- **MAG-SQL**: 소프트 컬럼 선택 → 문제 분해 → 반복적 서브SQL 생성 → 외부 도구로 최적화
- **MAGIC**: 자기 수정 가이드를 자동 생성하여 인간 전문가의 수정 과정 모방
- **SuperSQL**: RESDSQL 스키마 링크 + BRIDGE v2 DB 콘텐츠 + DAIL-SQL Few-shot 프롬프트 + 자기 일관성(self-consistency)

## 5. Text-to-SQL 방법론 비교 (Taxonomy Table)

| Method | Backbone | Optimization | Query Strategy | Error Handling | Dataset | Metrics | Schema Linking |
|---|---|---|---|---|---|---|---|
| SC-prompt | T5 | Task Decomposition | Guided Decoding | - | Spider, CoSQL | EM, EX | ✗ |
| MCS-SQL | GPT-4 | Prompt Tuning | Guided Decoding | Self-Consistency | Spider, BIRD | EX, VES | ✓ |
| SQL-PaLM | PaLM-2 | Prompt Tuning | Consistency Decoding | Self-Correction | Spider, BIRD-SYN | EX, TS | ✓ |
| ACT-SQL | - | CoT | Greedy Search | Self-Correction | Spider, SParC, CoSQL | EM, EX, TS | ✓ |
| DIN-SQL | GPT-4 | Task Decomposition | Greedy Search | Self-Correction | Spider, BIRD | EX, EM | ✓ |
| MAC-SQL | GPT-4 | Task Decomposition | Greedy Search | Refiner | BIRD | EX, EM, VES | ✓ |
| DAIL-SQL | GPT-4 | SFT | Greedy Search | Self-Consistency | Spider, Spider-Realistic | EX, EM | ✗ |
| CodeS | StarCoder | - | Beam Search | Execution-Guided | Spider, BIRD | EX, TS | ✓ |
| RESDSQL | T5 | Skeleton Parsing | Beam Search | Execution-Guided | Spider-DK, Spider-Syn | EM, EX | ✓ |
| Tool-SQL | GPT-4 | Query Error Handling | Python Interpreter | - | Spider, Spider-Realistic | EX, EM | ✓ |
| SQLFixAgent | GPT-3.5-turbo | Query Error Handling | Perturbation-Based | Refiner | Spider, BIRD | EX, EM, VES | ✓ |
| MAG-SQL | - | Query Error Handling | - | Refiner | Spider, BIRD | EX, VES | ✓ |
| SuperSQL | GPT-4 | - | Greedy Search | Self-Consistency | Spider, BIRD | EX, EM | ✓ |

*Table 2: Text-to-SQL 방법론 분류표. 각 모델의 백본, 최적화 전략, 쿼리 생성 전략, 에러 처리, 사용 데이터셋, 평가 메트릭, 스키마 링킹 여부를 비교.*

## 6. 결론 및 향후 연구 방향

이 서베이는 LLM 기반 Text-to-SQL 방법론을 체계적으로 분류하고 분석했습니다.

**주요 발견:**
1. **Prompt 기반 방법**: 추가 학습 없이 빠르게 적용 가능하지만, 복잡한 쿼리에서 한계
2. **Fine-Tuning**: 특정 태스크에 대한 높은 정확도를 달성하지만, 학습 비용이 큼
3. **Task-Training**: 완전한 맞춤형 모델이지만, 대규모 데이터와 컴퓨팅 리소스 필요
4. **LLM Agent**: 가장 유연하고 적응적이며, 동적 수정과 외부 도구 활용 가능

**향후 연구 방향:**
- 크로스 도메인, 크로스 언어 환경에서의 일반화 능력 향상
- 더 효율적이고 비용 효과적인 SQL 생성 방법 개발
- 실제 기업 환경의 복잡한 스키마에 대한 적응력 강화
