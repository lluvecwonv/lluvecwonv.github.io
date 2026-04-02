---
title: "Text-to-SQL Empowered by Large Language Models: A Benchmark Evaluation"
date: 2026-04-02
summary: "DAIL-SQL는 LLM 기반 Text-to-SQL 작업에서 프롬프트 엔지니어링의 체계적 벤치마크 연구입니다. Question Representation, Example Selection, Example Organization 3가지 차원에서 최적 전략을 분석하고, 새로운 DAIL Selection과 DAIL Organization 방법을 제안하여 Spider 데이터셋에서 86.6% EX를 달성했습니다."
tags: [LLM, Text-to-SQL, DAIL-SQL, Prompt Engineering, Spider, BIRD, VLDB, 연구노트]
category: 연구노트
language: ko
---

## 개요

본 논문은 Alibaba Group의 연구진이 발표한 "Text-to-SQL Empowered by Large Language Models: A Benchmark Evaluation" (DAIL-SQL)로, VLDB 2024 Vol 17, No 5에 게재되었습니다. 이 연구는 LLM을 활용한 Text-to-SQL 작업에서 **프롬프트 엔지니어링의 세 가지 핵심 차원**을 체계적으로 분석하고, 새로운 방법론들을 제안하여 최첨단 성능을 달성했습니다.

GitHub: https://github.com/BeachWang/DAIL-SQL
논문: https://arxiv.org/abs/2308.15363

## 배경 및 동기

Text-to-SQL은 자연어 질문을 SQL 쿼리로 변환하는 작업으로, 데이터베이스 접근성을 높이는 중요한 문제입니다. GPT-4, GPT-3.5 등 대규모 언어모델의 발전으로 이 작업에서 뛰어난 성능이 가능해졌지만, **같은 모델이라도 프롬프트 구성 방식에 따라 결과가 크게 달라집니다**.

기존 연구들은 개별적인 프롬프트 엔지니어링 기법을 제안했지만, 이들을 **체계적으로 비교 분석하고 최적 조합을 찾는 연구는 부족**했습니다. DAIL-SQL은 이러한 공백을 메우고, 실무에서 즉시 활용 가능한 가이드라인을 제시합니다.

## 방법론

### 1. Question Representation (질문 표현)

데이터베이스 스키마와 자연어 질문을 LLM에 제시하는 방식에 따라 5가지 옵션을 평가했습니다:

**옵션 1: Minimal Schema**
- 필요한 테이블과 컬럼만 포함
- 토큰 효율성 우수

**옵션 2: Explicit Foreign Key**
- 테이블 간 관계를 명시적으로 표시
- 조인이 많은 쿼리에 효과적

**옵션 3: Explicit Column Type & Description**
- 컬럼 타입과 설명 정보 포함
- 데이터 이해도 향상

**옵션 4: Full Schema with Comments**
- 데이터베이스 주석 정보 포함
- 가장 상세하지만 토큰 많이 소비

**옵션 5: Serialized Format**
- 구조화된 텍스트 형식
- 일관성 있는 표현

실험 결과 **Explicit Foreign Key 정보 포함이 가장 효과적**이었으며, 특히 복잡한 쿼리에서의 정확도 향상이 뚜렷했습니다.

### 2. Example Selection (예시 선택 전략)

Few-shot learning에서 사용할 예시들을 선택하는 4가지 전략을 비교했습니다:

**전략 1: Random Selection**
- 기준선: 무작위 선택
- 재현성 낮음

**전략 2: Similarity-based Selection**
- 질문과 유사한 예시 선택
- 단순 표면적 유사도 기반

**전략 3: SQL Similarity**
- SQL 구조의 유사도로 선택
- 쿼리 복잡도 고려

**DAIL Selection (제안 방법)**

DAIL-SQL의 핵심 기여입니다. 다음과 같이 작동합니다:

1. **Word Masking**: 질문의 중요하지 않은 단어(관사, 전치사 등) 마스킹
2. **Embedding-based Ranking**: 마스킹된 질문과 후보 예시의 임베딩 거리를 계산
3. **SQL Similarity Fusion**: SQL 유사도를 함께 고려하여 최종 순위 결정
4. **Euclidean Distance**: 임베딩 공간에서 유클리드 거리로 근접도 측정

이 방법은 **표면적 단어 유사도에 의존하지 않으면서도** 의미론적으로 유사한 SQL 패턴을 찾아낼 수 있습니다.

### 3. Example Organization (예시 구성 방식)

선택된 예시들을 프롬프트에 배치하는 방식에 따라 2가지 옵션을 평가했습니다:

**Full-Information Organization**
- 각 예시마다 데이터베이스 스키마 정보 포함
- 각 예시가 독립적이고 명확
- 토큰 소비 많음

**SQL-Only Organization (DAIL Organization)**
- 예시는 (자연어 질문, SQL) 쌍만 포함
- 스키마 정보는 프롬프트 상단에 한 번만 포함
- 토큰 효율성 우수 (~1,600 tokens per question on Spider-dev)
- 모델의 문맥 이해도 향상

DAIL Organization은 **토큰 효율성을 유지하면서도 전체 정보 구성과 유사한 성능**을 달성합니다.

## 실험 설정

### 데이터셋
- **Spider**: 10,181개 질문, 138개 데이터베이스 (복잡한 multi-database 쿼리)
- **Spider-dev**: 검증용 부분집합
- **Spider-Realistic**: 실제 사용자 질문 포함
- **BIRD**: 큰 규모 데이터베이스 포함, 외부 데이터 요구

### 모델
- **폐쇄형**: GPT-4, GPT-3.5-Turbo, TEXT-DAVINCI-003
- **오픈소스**: LLaMA-33B, Vicuna-33B

### 평가 지표
- **EX (Exact Match)**: 생성된 SQL이 정답과 정확히 일치
- **EM (Execution Match)**: SQL 실행 결과가 정답과 일치
- 토큰 수: 평균 토큰 소비량 측정

### 프롬프트 구성 프로토콜
1. 시스템 프롬프트: 역할 정의
2. 데이터베이스 스키마: Question Representation 옵션 선택
3. Few-shot 예시: Example Selection + Organization 적용
4. 대상 질문 (Target Question)
5. 특별 규칙: "no explanation" 규칙 등

## 실험 결과

### 메인 결과

| 모델 | 데이터셋 | 방법 | EX (%) | EM (%) | 토큰/질문 |
|------|---------|------|--------|--------|----------|
| GPT-4 | Spider-dev | DAIL-SQL | 83.5 | - | ~1,600 |
| GPT-4 | Spider (leaderboard) | DAIL-SQL | 86.6 | 86.2 | - |
| GPT-4 | Spider-Realistic | DAIL-SQL | 76.0 | - | - |
| GPT-4o | BIRD | DAIL-SQL | 57.4 | - | - |
| GPT-4 | Spider 1.0 | 최적 프롬프트 | 91.2 | - | - |
| GPT-4 | BIRD | 최적 프롬프트 | 73.0 | - | - |
| GPT-3.5-Turbo | Spider-dev | DAIL-SQL | ~74 | - | - |
| LLaMA-33B | Spider-dev | 5-shot + Fine-tuning | 36.4 | - | - |

### 차원별 분석

**Question Representation 효과 (GPT-4, Spider-dev)**

| 방식 | EX (%) | 효율성 |
|------|--------|--------|
| Minimal Schema | 79.2 | 높음 |
| Explicit Foreign Key | 82.1 | 중간 |
| Full Schema with Comments | 80.8 | 낮음 |
| Explicit Column Type & Description | 81.5 | 중간 |

→ Explicit Foreign Key 정보가 가장 효과적

**Example Selection 효과 (GPT-4, Spider-dev)**

| 방식 | EX (%) | 개선도 |
|------|--------|--------|
| Random | 76.3 | - |
| Similarity-based | 79.5 | +3.2% |
| SQL Similarity | 80.8 | +4.5% |
| DAIL Selection | 83.5 | +7.2% |

→ DAIL Selection이 모든 기준선을 초과 달성

**Example Organization 효과 (GPT-4, Spider-dev)**

| 방식 | EX (%) | 토큰 수 |
|------|--------|---------|
| Full-Information | 83.2 | ~2,100 |
| SQL-Only | 82.1 | ~1,600 |
| DAIL Organization | 83.5 | ~1,600 |

→ DAIL Organization은 토큰 효율성을 유지하면서도 Full-Information 수준의 성능 달성

### 모델별 성능

**Spider-dev (5-shot Few-shot)**

| 모델 | EX (%) | 주요 특성 |
|------|--------|----------|
| GPT-4 | 83.5 | 최고 성능 |
| GPT-3.5-Turbo | 74.2 | 약 9.3% 낮음 |
| TEXT-DAVINCI-003 | 71.5 | 약 12% 낮음 |
| LLaMA-33B (few-shot) | 28.3 | 요구되는 능력 부족 |
| LLaMA-33B (fine-tuned) | 36.4 | 5-shot 오히려 방해 |

## Ablation Study (제거 연구)

### Foreign Key 정보의 영향

| 설정 | EX (%) | 변화 |
|------|--------|------|
| Without Foreign Key Info | 80.2 | - |
| With Foreign Key Info | 83.5 | +3.3% |

→ 외래키 정보 포함이 필수적 (복잡한 조인 쿼리에서 특히 중요)

### "No Explanation" 규칙의 영향

프롬프트에 "Generate SQL without explanation" 규칙 추가:

| 설정 | EX (%) | 변화 |
|------|--------|------|
| With Explanation | 81.8 | - |
| No Explanation Rule | 83.5 | +1.7% |

→ 모델이 설명을 시도하지 않을 때 SQL 생성에 더 집중

### DAIL Organization + GPT-4

| 구성 | EX (%) | 토큰 수 | 특성 |
|------|--------|---------|------|
| Full-Information | 83.2 | 2,100 | 기준선 |
| SQL-Only | 82.1 | 1,600 | 성능 저하 |
| DAIL Organization | 83.5 | 1,600 | 최적 |

→ DAIL Organization이 토큰 효율성 수준의 토큰 소비로 최고 성능 달성

### 오픈소스 LLM과 Few-shot의 관계

**LLaMA-33B (Spider-dev)**

| 구성 | EM (%) |
|------|--------|
| Zero-shot | 22.1 |
| 2-shot | 30.5 |
| 5-shot | 36.4 |
| 5-shot + Fine-tuning | **40.2** |

흥미롭게도, **Fine-tuning 후에는 Few-shot 예시가 오히려 성능을 해친다**는 발견:

| 구성 | EM (%) | 변화 |
|------|--------|------|
| Fine-tuned (zero-shot) | 42.1 | - |
| Fine-tuned + 5-shot | 40.2 | -1.9% |

→ Fine-tuned 모델은 충분한 능력을 가지고 있어 추가 예시가 필요하지 않거나 오히려 방해

## 주요 발견 및 분석

### 1. 프롬프트 엔지니어링의 중요성

**동일 모델, 다른 프롬프트: 성능 편차 7% 이상**

GPT-4에서 Best 프롬프트 (83.5%)와 Worst 프롬프트 (76.3%)의 성능 차이가 7% 이상입니다. 이는 모델의 고유 성능 한계가 아닌 **프롬프트 설계의 중요성**을 명확히 보여줍니다.

### 2. DAIL Selection의 우수성

- Random: 76.3% → DAIL Selection: 83.5% (+7.2%)
- 표면적 단어 유사도 대신 임베딩과 SQL 구조 유사도 활용
- 계산 비용은 약간 증가하지만 성능 향상이 명확

### 3. 토큰 효율성과 성능의 조화

DAIL Organization은 **토큰 소비 20% 감소**하면서도 **성능은 Full-Information 수준 유지**:
- Full-Information: 2,100 tokens, 83.2% EX
- DAIL Organization: 1,600 tokens, 83.5% EX

실무 배포에서 API 비용 절감과 응답 속도 향상이 가능합니다.

### 4. 모델 능력에 따른 전략 차이

- **고성능 모델 (GPT-4)**: 복잡한 예시도 활용 가능
- **중등 모델 (GPT-3.5)**: 간단한 예시가 더 효과적
- **미세조정 모델**: Few-shot 예시가 성능을 해칠 수 있음

## 한계 및 미래 방향

### 한계점

1. **계산 비용**: DAIL Selection은 임베딩 계산으로 약간의 추가 비용 발생
2. **데이터셋 편향**: Spider 기반으로 최적화, BIRD에서는 성능 저하 (57.4%)
3. **오픈소스 LLM**: 여전히 큰 성능 격차 (36.4% EM vs 83.5% EX for GPT-4)
4. **동적 스키마**: 스키마가 자주 변경되는 환경에 대한 연구 부족

### 실제 적용 고려사항

1. **지속적 모니터링**: 프롬프트 효과는 모델 업데이트에 따라 변할 수 있음
2. **도메인 적응**: 특정 도메인 데이터에 대한 재검증 필요
3. **하이브리드 접근**: LLM 기반 방법과 전통적 구문 분석 결합 고려

## 결론

DAIL-SQL은 Text-to-SQL 작업에서 프롬프트 엔지니어링의 중요성을 체계적으로 입증했습니다. 특히:

1. **Question Representation**: Explicit Foreign Key 정보 포함이 효과적
2. **Example Selection**: DAIL Selection으로 7% 성능 향상
3. **Example Organization**: DAIL Organization으로 20% 토큰 절감 동시 달성

최종적으로 Spider 데이터셋에서 **86.6% EX를 달성**하였으며, 이는 당시 최첨단 성능입니다.

더 중요한 것은 이 연구가 제시하는 **실무 가이드라인**입니다. 연구자와 실무자는 이 논문의 프롬프트 엔지니어링 방법론을 자신의 데이터셋과 모델에 맞게 적용하여 즉시 성능 향상을 기대할 수 있습니다.

오픈소스 LLM과 미세조정을 활용한 경로는 여전히 성능 격차가 크지만, 비용 효율성을 고려한 실무 배포에서는 GPT-4 기반 DAIL-SQL이 최고의 선택입니다.

---

**참고 자료**
- Paper: https://arxiv.org/abs/2308.15363
- GitHub: https://github.com/BeachWang/DAIL-SQL
- Published: PVLDB Vol 17, No 5, pp 1132-1145, 2024
