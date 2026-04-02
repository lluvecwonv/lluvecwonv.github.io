---
title: "MAC-SQL: A Multi-Agent Collaborative Framework for Text-to-SQL"
date: 2026-04-02
summary: "Beihang University와 Tencent Youtu Lab 연구팀이 제안한 MAC-SQL은 Selector, Decomposer, Refiner 3개의 에이전트로 구성된 멀티에이전트 프레임워크로, 대규모 데이터베이스의 스키마 필터링, 복잡한 질문 분해, SQL 오류 수정을 단계적으로 수행하여 Text-to-SQL 성능을 크게 향상시킨다. BIRD 벤치마크에서 59.39% 개발세트 정확도, 59.59% 테스트세트 정확도를 달성하며 GPT-4 제로샷 대비 13.24% 성능 개선을 보여준다."
tags: [LLM, Text-to-SQL, MAC-SQL, Multi-Agent, BIRD, Spider, COLING, 연구노트]
category: 연구노트
language: ko
---

## 개요

Text-to-SQL은 자연어 질문을 SQL 쿼리로 변환하는 작업으로, 복잡한 의미론적 이해와 정확한 데이터베이스 스키마 이해가 필요하다. 특히 대규모 데이터베이스에서는 스키마 링킹(schema linking) 문제가 심각하고, 복잡한 다중 조건 쿼리의 생성이 어렵다는 문제가 있다.

본 논문에서는 Beihang University와 Tencent Youtu Lab의 연구팀이 **MAC-SQL** (Multi-Agent Collaborative SQL)이라는 멀티에이전트 프레임워크를 제안한다. 이 프레임워크는 3개의 협력하는 에이전트로 구성되어 있으며, 각각 특정한 역할을 수행함으로써 Text-to-SQL 성능을 획기적으로 향상시킨다.

## 배경

### Text-to-SQL의 도전 과제

1. **스키마 필터링 문제**: 실제 데이터베이스는 수백 개 이상의 테이블과 컬럼을 포함하며, LLM이 전체 스키마를 처리하기는 어렵다.
2. **복잡한 의미론적 이해**: 다중 조건, 중첩된 서브쿼리, 여러 조인이 포함된 복잡한 질문을 정확히 이해해야 한다.
3. **SQL 오류 수정**: 생성된 SQL이 문법적으로 정확하더라도 실행 결과가 의도와 다를 수 있다.

### 기존 접근법의 한계

기존의 시퀀스-to-시퀀스 모델이나 단일 LLM 기반 접근법은:
- 전체 스키마 정보를 처리하는 과정에서 토큰 제한에 부딪힌다
- 오류를 자동으로 감지하고 수정하기 어렵다
- 질문의 난이도를 고려한 차별화된 처리가 없다

## 방법론

### 3-에이전트 협력 프레임워크

MAC-SQL은 다음과 같은 3개의 에이전트로 구성된다:

#### 1. Selector Agent (선택 에이전트)

**목표**: 대규모 데이터베이스에서 관련 있는 스키마만 추출하여 입력 크기 감소

**동작 방식**:
- 사용자의 자연어 질문을 입력받는다
- 데이터베이스의 모든 테이블과 컬럼을 검색하여 관련성을 판단한다
- 질문과 관련된 테이블의 컬럼만 선택하여 "서브-데이터베이스"를 구성한다
- 예: "직원의 평균 연봉은?" → 직원 테이블의 연봉 컬럼만 선택

**기술적 특징**:
- 임베딩 기반 유사도 계산으로 관련 스키마 식별
- 다중 수준의 스키마 필터링 (테이블 → 컬럼)
- 토큰 사용량을 평균 70% 감소시킨다

#### 2. Decomposer Agent (분해 에이전트)

**목표**: 복잡한 자연어 질문을 더 간단한 서브-질문으로 분해

**동작 방식**:
- Chain-of-Thought (CoT) 추론을 사용하여 질문을 단계적으로 분석한다
- 질문의 난이도를 자동으로 평가한다 (Simple, Moderate, Challenging)
- 난이도에 따라 다른 수의 CoT 스텝을 사용한다

**난이도별 처리 전략**:
- **Simple**: 기본 SELECT, 단순 WHERE 조건 → 0-shot 또는 적은 CoT
- **Moderate**: 조인, GROUP BY 포함 → 1-2개 CoT 스텝
- **Challenging**: 중첩된 서브쿼리, 복잡한 조건 → 2개 이상 CoT 스텝

**예시**:
- 원본 질문: "회사별 평균 연봉이 50,000 이상인 경우 회사 이름과 평균 연봉을 구하라"
- 분해:
  1. "각 회사별 평균 연봉을 계산한다"
  2. "평균 연봉이 50,000 이상인 회사를 필터링한다"
  3. "결과에서 회사 이름과 평균 연봉을 SELECT한다"

#### 3. Refiner Agent (정제 에이전트)

**목표**: 생성된 SQL의 오류를 감지하고 수정

**동작 방식**:
- 생성된 SQL을 실제 데이터베이스에서 실행한다
- 실행 결과나 오류 메시지를 분석한다
- 오류가 발생하면 다음 정보를 기반으로 수정:
  - 데이터베이스 오류 메시지 (예: "Unknown column 'salary'")
  - 예상 출력 형식과의 불일치
  - 의미론적 오류 (SQL 문법은 맞지만 의도와 다름)

**수정 전략**:
- 문법 오류: 데이터베이스 오류 메시지를 직접 사용하여 수정
- 의미론적 오류: 원본 질문과 생성 SQL 비교를 통해 의도 파악 후 수정
- 최대 3회까지 재시도하며, 매번 이전 시도와 오류를 컨텍스트로 제공

### 추가 기여: SQL-Llama

연구팀은 Code Llama 7B를 기반으로 10,000개의 Agent-Instruct 데이터셋으로 fine-tuning한 **SQL-Llama**를 개발했다.

**특징**:
- 오픈소스 LLM으로 GPT-4 없이도 사용 가능
- 중소규모 Text-to-SQL 작업에 적합
- 전체 파이프라인에서 더 경량화된 버전 제공

## 실험 설정

### 데이터셋

1. **BIRD (Big Bench for Database)**: 미국 실제 데이터베이스 95개, 질문 14,047개 (dev: 1,534개, test: 1,540개)
   - 큰 규모 스키마 (평균 130개 테이블)
   - 매우 도전적인 복잡한 SQL 쿼리 필요
   - Domain-specific 어휘 포함

2. **Spider**: 200개 데이터베이스, 11,237개 SQL 쿼리 (dev: 1,034개, test: 2,000개)
   - 중소규모 스키마
   - 상대적으로 단순한 쿼리

### 평가 지표

1. **Exact Match (EX)**: 생성된 SQL과 정답이 정확히 일치 (토큰 레벨)
2. **Valid Execution Similarity (VES)**: 생성된 SQL이 올바르게 실행되고, 실행 결과가 정답과 일치

### 실험 환경

- **LLM 모델**: GPT-4, GPT-3.5-turbo, SQL-Llama 7B
- **데이터베이스 시스템**: SQLite (개발), MySQL (테스트)
- **온도 설정**: 0.0 (결정론적 생성)
- **최대 토큰**: 2048
- **API**: OpenAI API (GPT-4/3.5), Hugging Face (SQL-Llama)

## 실험 결과

### BIRD 벤치마크 결과

| 모델 | 데이터셋 | EX (%) | VES (%) |
|------|---------|--------|---------|
| **MAC-SQL + GPT-4** | **Dev** | **59.39** | **66.39** |
| **MAC-SQL + GPT-4** | **Test** | **59.59** | **67.68** |
| MAC-SQL + GPT-3.5 | Dev | 50.56 | 61.25 |
| MAC-SQL + SQL-Llama | Dev | 43.94 | 57.36 |
| GPT-4 Zero-shot (기준) | Test | 46.35 | 54.00 |
| **개선율 (vs GPT-4 Zero-shot)** | **Test** | **+13.24%** | **+13.68%** |

### Spider 벤치마크 결과

| 모델 | 데이터셋 | EX (%) | VES (%) |
|------|---------|--------|---------|
| **MAC-SQL + GPT-4** | **Dev** | **86.75** | **82.80** |
| MAC-SQL + GPT-3.5 | Dev | 78.42 | 75.65 |
| MAC-SQL + SQL-Llama | Dev | 71.20 | 68.94 |

### 난이도별 성능 분석 (BIRD Dev, GPT-4)

| 난이도 | 질문 수 | EX (%) | VES (%) |
|--------|--------|--------|---------|
| Simple | 281 | 65.73 | 72.95 |
| Moderate | 654 | 52.69 | 59.43 |
| Challenging | 599 | 40.28 | 49.08 |

분석:
- Simple 질문에서 가장 높은 정확도
- Challenging 질문의 경우 여전히 40% 이하의 정확도로 개선 여지 많음
- 난이도가 높을수록 성능 저하폭이 큼

### Ablation Study (BIRD Dev, GPT-4)

| 모델 변형 | EX (%) | 감소폭 | VES (%) |
|----------|--------|--------|---------|
| **Full (MAC-SQL)** | **59.39** | **기준** | **66.39** |
| w/o Selector Agent | 57.28 | -2.11% | 64.15 |
| w/o Decomposer Agent | 55.54 | -3.85% | 62.08 |
| w/o Refiner Agent | 54.76 | -4.63% | 60.31 |

**해석**:
- Selector Agent 제거: 약 2.1% 성능 하락 (스키마 필터링의 중요성)
- Decomposer Agent 제거: 약 3.85% 성능 하락 (CoT 추론 분해의 효과)
- Refiner Agent 제거: 약 4.63% 성능 하락 (오류 수정의 가장 큰 효과)
- Refiner가 3개 에이전트 중 가장 중요한 역할 수행

### Few-shot 학습 성능 (BIRD Dev, GPT-4)

| Few-shot 수 | EX (%) | VES (%) |
|------------|--------|---------|
| 0-shot (Zero-shot) | 55.54 | 62.15 |
| 1-shot | 57.26 | 63.98 |
| 2-shot | **59.39** | **66.39** |
| 3-shot | 58.91 | 65.87 |

**분석**:
- 2-shot에서 최고 성능 달성 (추가 샘플은 오히려 성능 저하)
- 적절한 수의 예제는 도움이 되지만 과도하면 컨텍스트 크기 증가로 방해

## 오류 분석

### BIRD 개발셋 오류 분류 (정확도 41%)

| 오류 유형 | 수량 | 비율 |
|---------|------|------|
| **Gold Error** | 460 | 30% |
| **Semantic Correct** | 214 | 14% |
| **Schema Linking Error** | 30 | 2% |
| **Other Errors** | 796 | 54% |

### Spider 개발셋 오류 분류 (정확도 86.75%)

| 오류 유형 | 수량 | 비율 |
|---------|------|------|
| **Gold Error** | 142 | 22% |
| **Semantic Correct** | 141 | 22% |
| **Schema Linking Error** | 51 | 8% |
| **Other Errors** | 318 | 48% |

**주요 발견 사항**:

1. **Gold Error (30% in BIRD, 22% in Spider)**
   - 정답 SQL이 질문의 의도를 제대로 반영하지 못하는 경우
   - 데이터셋 레이블링 오류 또는 모호한 질문 표현
   - 모델의 책임이 아닌 데이터 품질 문제

2. **Semantic Correct (14% in BIRD, 22% in Spider)**
   - 생성된 SQL이 의미론적으로 정확하지만 형식이 다른 경우
   - 예: 다른 조인 순서, 다른 집계 방식이지만 결과는 동일
   - 현재 EX 지표의 한계를 드러냄

3. **Schema Linking Error (2% in BIRD, 8% in Spider)**
   - 부정확한 테이블/컬럼 선택
   - Selector Agent 개선으로 감소 가능

## 한계 및 개선 방향

### 현재 한계

1. **Challenging 질문에 대한 성능 부족**: 40% 이하의 EX 성능으로 매우 복잡한 쿼리 생성 어려움
2. **다중 턴 대화 지원 부족**: 현재는 단일 질문에 대한 SQL 생성만 가능
3. **데이터베이스 실행 필요성**: Refiner Agent가 실제 DB 접근이 필요하여 온라인 서비스 제약
4. **언어 제약**: 주로 영어 데이터셋에서만 평가 (다국어 지원 미흡)

### 개선 제안

1. Challenging 질문을 위한 더 정교한 분해 전략
2. 자동 회귀 학습을 통한 오류 패턴 개선
3. 캐싱된 실행 결과를 활용한 더 빠른 오류 수정
4. 다국어 데이터셋 추가 및 테스트

## 결론

MAC-SQL은 멀티에이전트 협력을 통해 Text-to-SQL 성능을 획기적으로 향상시킨다. 특히:

1. **Selector Agent**로 대규모 스키마 처리 문제 해결
2. **Decomposer Agent**로 복잡한 질문을 단계적으로 분석
3. **Refiner Agent**로 생성된 SQL의 오류를 자동 수정

이러한 접근으로 BIRD에서 59.39% 개발세트 정확도를 달성하며 GPT-4 제로샷 대비 13.24% 성능 개선을 보여준다.

또한 SQL-Llama 7B를 통해 오픈소스 기반의 경량 솔루션도 제시하여 실용적인 활용 가능성을 높였다.

향후 이 프레임워크는 실제 BI 시스템, 데이터베이스 질의 서비스, 자동 보고서 생성 등 다양한 산업 응용에 활용될 수 있을 것으로 기대된다.

---

**논문 정보**
- **제목**: MAC-SQL: A Multi-Agent Collaborative Framework for Text-to-SQL
- **저자**: Bing Wang, Changyu Ren, Jian Yang, Xinnian Liang, Jiaqi Bai, Linzheng Chai, Zhao Yan, Qian-Wen Zhang, Di Yin, Xing Sun, Zhoujun Li
- **소속**: Beihang University, Tencent Youtu Lab
- **발표**: COLING 2025 (2025년 1월 19-24일, 아부다비)
- **arXiv**: https://arxiv.org/abs/2312.11242
- **GitHub**: https://github.com/wbbeyourself/MAC-SQL
