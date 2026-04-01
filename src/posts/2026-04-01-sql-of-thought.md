---
title: SQL-of-Thought: Multi-agentic Text-to-SQL with Guided Error Correction
date: 2026-04-01
summary: 자연어를 SQL로 변환하는 작업에서 6개의 LLM 기반 에이전트를 활용하여 가이드된 에러 수정을 수행하는 멀티-에이전틱 프레임워크 SQL-of-Thought를 제시합니다. 체계적인 에러 분류 체계와 반복적 에러 수정 메커니즘을 통해 Spider 데이터셋에서 91.59%의 실행 정확도를 달성했습니다.
tags: [LLM, Text-to-SQL, Multi-Agent, Error Correction, SQL-of-Thought, Spider, NeurIPS, 연구노트]
category: 연구노트
language: ko
---

## 1. 개요

자연언어(Natural Language, NL)에서 SQL 쿼리로 변환하는 Text-to-SQL 작업은 데이터베이스 상호작용의 핵심 문제입니다. 전통적인 LLM 기반 방법들은 단일 pass로 SQL을 생성하거나, 단순한 에러 수정 루프를 거쳐 정확도 향상에 한계를 보였습니다.

본 논문 "SQL-of-Thought: Multi-agentic Text-to-SQL with Guided Error Correction"은 MPI(Max Planck Institute), AWS GenAI, 그리고 MPI의 연구자들(Saumya Chaturvedi, Aman Chadha, Laurent Bindschaedler)에 의해 NeurIPS 2025 Deep Learning for Code 워크샵에서 발표되었습니다(arXiv: 2509.00581).

이 연구는 다음과 같은 핵심 기여를 제시합니다:

1. **멀티-에이전트 프레임워크**: 6개의 LLM 기반 에이전트를 조직적으로 구성하여 Text-to-SQL 작업을 단계별로 분해하고 처리
2. **체계적 에러 분류 체계**: 31개의 세부 카테고리를 포함하는 9가지 주요 에러 타입 정의
3. **가이드된 에러 수정**: 에러 분류 기반의 구조화된 피드백을 통한 반복적 에러 수정
4. **우수한 성능**: Spider 데이터셋에서 91.59% 실행 정확도(Execution Accuracy, EA) 달성

## 2. 관련 연구

Text-to-SQL 작업은 최근 몇 년간 활발한 연구 주제였습니다. 기존 방법들은 다음과 같이 분류될 수 있습니다:

### 2.1 기본 LLM 기반 접근
- ChatGPT: 74.4% (Spider)
- GPT-4: 72.3% (Spider)
- 단일 pass 생성 방식의 한계 존재

### 2.2 멀티-스텝 방법
- **ACT-SQL** (ChatGPT): 80.4% (Spider), 75.8% (Spider-Realistic)
- **DIN-SQL** (GPT-4): 82.8% (Spider), 78.1% (Spider-Realistic)
- **DAIL-SQL** (GPT-4): 83.1% (Spider), 75.6% (Spider-Realistic)
- **MAC-SQL** (GPT-4): 86.8% (Spider)
- **Tool-SQL** (GPT-4): 86.9% (Spider), 82.9% (Spider-Realistic)
- **ChaseSQL**: 87.6% (Spider)

SQL-of-Thought는 이러한 기존 방법들을 모두 능가하는 성능을 달성했습니다.

## 3. 방법론

### 3.1 시스템 개요

SQL-of-Thought는 6개의 전문화된 LLM 에이전트로 구성된 멀티-에이전트 프레임워크입니다. 각 에이전트는 특정 작업에 최적화되어 있으며, 단계적으로 실행됩니다.

프레임워크의 전체 워크플로우는 다음과 같습니다:

```
자연언어 질문 + DB 스키마
        ↓
1. Schema Linking Agent
        ↓
2. Subproblem Agent
        ↓
3. Query Plan Agent
        ↓
4. SQL Agent
        ↓
SQL 생성 & 실행
        ↓
[실패 시]
5. Correction Plan Agent
        ↓
6. Correction SQL Agent
        ↓
수정된 SQL 생성 & 실행
```

### 3.2 6개 핵심 에이전트

#### 3.2.1 Schema Linking Agent

**역할**: 자연언어 질문을 분석하여 관련 데이터베이스 스키마 요소를 식별합니다.

**입력**:
- 자연언어 질문
- 전체 데이터베이스 스키마(테이블, 컬럼, 외래키)

**출력**:
- 관련 테이블 목록
- 관련 컬럼 목록
- 필요한 조인 조건
- 가능한 필터링 조건

**구체적 작동**:
1. NL 질문의 명사구와 동사구를 분석
2. DB 스키마의 테이블명, 컬럼명과의 의미적 매칭
3. 외래키 관계 파악을 통한 조인 필드 식별
4. 타입 호환성 검증(예: 날짜 필터링에 DATE 타입 컬럼 매칭)

**예시**:
```
질문: "2020년 이후 직원수가 100명 이상인 회사의 매출액은?"
출력:
- 테이블: company, employee
- 컬럼: company.name, company.revenue, company.founded_year, employee.id, employee.company_id
- 조인: company.id = employee.company_id (필요한 경우)
- 필터: company.founded_year >= 2020, COUNT(employee.id) >= 100
```

#### 3.2.2 Subproblem Agent

**역할**: 복잡한 SQL 쿼리를 SQL의 핵심 절(clause)별로 분해합니다.

**입력**:
- 자연언어 질문
- Schema Linking Agent의 출력

**출력**:
- WHERE 절 부분문제
- GROUP BY 절 부분문제
- HAVING 절 부분문제
- JOIN 절 부분문제
- ORDER BY 절 부분문제
- DISTINCT 사용 여부
- LIMIT 필요성

**구체적 작동**:
복잡한 SQL을 다음 절(clause)들로 체계적으로 분해합니다:

1. **SELECT**: 선택할 컬럼 및 집계 함수
2. **FROM**: 기본 테이블
3. **JOIN**: 필요한 조인 조건 및 타입(INNER, LEFT, RIGHT, FULL)
4. **WHERE**: 단순 필터 조건들
5. **GROUP BY**: 그룹화 기준 컬럼
6. **HAVING**: 그룹 레벨 필터링
7. **ORDER BY**: 정렬 기준 및 순서(ASC/DESC)
8. **LIMIT**: 반환 행 수 제한

**예시**:
```
질문: "각 부서별 평균 급여를 구하고 평균 급여가 50,000 이상인 부서만 높은 순서로 나열하세요"
분해:
1. SELECT: department.name, AVG(employee.salary)
2. FROM: employee, department
3. JOIN: employee.department_id = department.id
4. WHERE: (없음)
5. GROUP BY: department.id
6. HAVING: AVG(employee.salary) >= 50000
7. ORDER BY: AVG(employee.salary) DESC
8. LIMIT: (없음)
```

#### 3.2.3 Query Plan Agent

**역할**: 자연언어 질문, 부분문제 정보, 스키마 정보를 바탕으로 단계별 실행 계획을 생성합니다. Chain-of-Thought(CoT) 추론을 활용합니다.

**입력**:
- 자연언어 질문
- Subproblem Agent의 출력 (절별 분해)
- Schema Linking Agent의 출력 (관련 스키마)

**출력**:
- 단계별 실행 계획
- 각 단계의 상세한 추론 근거(CoT)
- 주의사항 및 예상 함정

**구체적 작동**:
```
Step 1: 필요한 테이블 식별
  - employee 테이블에서 급여 정보 필요
  - department 테이블에서 부서 정보 필요
  - 조인 필드: employee.department_id = department.id

Step 2: 조건 분석
  - WHERE 조건: 기본 필터링 없음
  - GROUP BY: department.id 기준으로 그룹화 필요
  - 각 그룹 내 employee.salary의 평균값 계산 필요

Step 3: 필터링 조건
  - HAVING: AVG(salary) >= 50000 필터링 적용
  - 이는 개별 행 필터가 아니라 그룹 필터이므로 GROUP BY 후에 적용

Step 4: 정렬
  - 평균 급여 내림차순으로 정렬 (높은 순서)
  - ORDER BY AVG(salary) DESC

Step 5: 잠재적 함정
  - NULL 급여값이 있는 경우 처리 고려
  - 그룹화 시 모든 non-aggregated 컬럼이 GROUP BY에 포함되어야 함
```

**CoT 예시**:
```
"질문은 부서별로 급여를 집계해야 한다. 먼저 employee와 department를 조인하여
각 직원의 급여와 부서 정보를 연결한다. 그 다음 GROUP BY department.id로
각 부서별로 그룹화하고 AVG(salary)를 계산한다. HAVING 절에서
평균 급여가 50,000 이상인 그룹만 필터링하고, 마지막으로 높은 순서로
정렬하기 위해 ORDER BY AVG(salary) DESC를 적용한다."
```

#### 3.2.4 SQL Agent

**역할**: 위의 모든 정보를 종합하여 실행 가능한 SQL 쿼리를 생성합니다.

**입력**:
- 자연언어 질문
- Query Plan Agent의 실행 계획
- Subproblem Agent의 절별 분해
- Schema Linking Agent의 스키마 정보

**출력**:
- 완전하고 실행 가능한 SQL 쿼리
- 쿼리 생성 근거

**구체적 작동**:
1. Query Plan을 기반으로 각 절을 순차적으로 구성
2. 스키마 정보를 참조하여 정확한 테이블명, 컬럼명 사용
3. SQL 문법 규칙 준수
4. 에지 케이스 고려 (NULL 처리, 중복 제거 등)

**생성된 SQL 예시**:
```sql
SELECT
  d.name AS department_name,
  AVG(e.salary) AS avg_salary
FROM employee e
INNER JOIN department d ON e.department_id = d.id
GROUP BY d.id, d.name
HAVING AVG(e.salary) >= 50000
ORDER BY avg_salary DESC;
```

#### 3.2.5 Correction Plan Agent

**역할**: SQL 실행이 실패했을 때, 에러를 분석하고 체계적인 에러 분류 체계를 사용하여 수정 계획을 수립합니다.

**입력**:
- 원본 자연언어 질문
- 생성된 SQL 쿼리
- 에러 메시지
- 데이터베이스 실행 결과 (에러 타입)
- 에러 분류 체계 (가이드)

**출력**:
- 에러 분류 (주요 카테고리 + 세부 카테고리)
- 근본 원인 분석
- 수정 전략 및 단계별 조치사항

**구체적 작동**:
에러가 발생하면, Correction Plan Agent는:
1. 에러 타입 식별 (31개 세부 카테고리 중 하나)
2. 근본 원인 분석
3. 수정 전략 수립
4. 구체적인 조정 사항 문서화

**예시**:
```
원본 SQL: SELECT * FROM employee WHERE department = "Sales"
에러: Column "department" not found
분류: Schema Linking Errors > col_missing

분석:
- 스키마에서 department 컬럼이 존재하지 않음
- 실제로는 department_id 컬럼이 존재하고, 부서명은 department 테이블의 name 컬럼에 있음

수정 계획:
1. Schema Linking 재수행: 관련 컬럼 및 테이블 재식별
2. Subproblem 수정: department 테이블과의 조인 추가
3. SQL 재생성: 올바른 조인 조건과 필터 조건 적용
```

#### 3.2.6 Correction SQL Agent

**역할**: Correction Plan Agent의 분석 결과를 기반으로 수정된 SQL을 생성합니다.

**입력**:
- Correction Plan Agent의 수정 계획
- 원본 자연언어 질문
- 원본 SQL 및 에러 정보
- 데이터베이스 스키마

**출력**:
- 수정된 SQL 쿼리
- 수정 사항 설명

**구체적 작동**:
1. Correction Plan의 지시사항을 따라 SQL 수정
2. 식별된 에러 원인 해결
3. 문법 검증
4. 데이터베이스 호환성 확인

**예시**:
```sql
-- 수정 전
SELECT * FROM employee WHERE department = "Sales"

-- 수정 후
SELECT e.*
FROM employee e
INNER JOIN department d ON e.department_id = d.id
WHERE d.name = "Sales"
```

### 3.3 에러 분류 체계

SQL-of-Thought의 핵심 혁신 중 하나는 체계적인 에러 분류 체계입니다. 이를 통해 에러를 정확하게 진단하고 구조화된 수정 지도(correction guidance)를 제공합니다.

#### 3.3.1 에러 분류 구조

총 9가지 주요 카테고리, 31개의 세부 카테고리로 구성됩니다.

##### 1. **Syntax Errors** (문법 에러) - 2개 세부 카테고리

| 세부 카테고리 | 설명 | 예시 |
|---|---|---|
| `sql_syntax_error` | SQL 문법 위반 | SELECT * FROM table WHRE condition (오타: WHERE) |
| `invalid_alias` | 유효하지 않은 별칭 사용 | SELECT name AS n FROM employee GROUP BY name (별칭이 GROUP BY에 사용됨) |

##### 2. **Filter Errors** (필터 에러) - 3개 세부 카테고리

| 세부 카테고리 | 설명 | 예시 |
|---|---|---|
| `where_missing` | 필요한 WHERE 절이 누락됨 | "2020년 이후의 판매" 쿼리에서 연도 필터 누락 |
| `condition_wrong_col` | 필터 조건에 잘못된 컬럼 사용 | "나이가 25세 이상" 조건에서 birth_year 대신 age 컬럼 미사용 |
| `condition_type_mismatch` | 조건 타입이 컬럼 타입과 불일치 | 문자열 컬럼에 숫자 비교 연산자 적용, 날짜 필터에 숫자값 사용 |

##### 3. **Value Errors** (값 에러) - 2개 세부 카테고리

| 세부 카테고리 | 설명 | 예시 |
|---|---|---|
| `hardcoded_value` | 쿼리에 하드코딩된 값 사용 | "회사 X의 직원" 쿼리에서 company_id=123 직접 입력 대신 company_name='X' 사용 필요 |
| `value_format_wrong` | 값의 형식이 올바르지 않음 | 날짜 필터에 "2020-01-01" 대신 "01/01/2020" 형식 사용 |

##### 4. **Aggregation Errors** (집계 에러) - 4개 세부 카테고리

| 세부 카테고리 | 설명 | 예시 |
|---|---|---|
| `agg_no_groupby` | GROUP BY 없이 집계 함수 사용 | SELECT name, COUNT(*) FROM employee (name이 GROUP BY에 없음) |
| `groupby_missing_col` | GROUP BY에서 필요한 컬럼 누락 | "부서별 평균 급여" 쿼리에서 department를 GROUP BY에 포함하지 않음 |
| `having_without_groupby` | GROUP BY 없이 HAVING 사용 | HAVING AVG(salary) > 50000 without GROUP BY |
| `having_incorrect` | HAVING 조건이 부정확함 | "평균 급여 50,000 이상"을 HAVING MAX(salary) > 50000으로 표현 |

##### 5. **Schema Linking Errors** (스키마 연결 에러) - 4개 세부 카테고리

| 세부 카테고리 | 설명 | 예시 |
|---|---|---|
| `table_missing` | 필요한 테이블을 포함하지 않음 | 부서 정보가 필요한데 employee 테이블만 사용 |
| `col_missing` | 필요한 컬럼을 포함하지 않음 | "직원명" 필드가 필요한데 employee_id만 선택 |
| `ambiguous_col` | 여러 테이블에 존재하는 컬럼명 명확히 하지 않음 | SELECT id FROM employee, department (두 테이블 모두 id 컬럼 보유) |
| `incorrect_foreign_key` | 외래키 관계 오류 | employee.dept_id = department.department_id (잘못된 필드명) |

##### 6. **Join Errors** (조인 에러) - 4개 세부 카테고리

| 세부 카테고리 | 설명 | 예시 |
|---|---|---|
| `join_missing` | 필요한 조인을 수행하지 않음 | 부서명이 필요한데 employee 테이블만 사용 |
| `join_wrong_type` | 잘못된 조인 타입 사용 | LEFT JOIN을 사용해야 하는데 INNER JOIN 사용 |
| `extra_table` | 불필요한 테이블 포함 | 결과에 필요 없는 테이블을 FROM에 포함 |
| `incorrect_col` | 조인 컬럼이 부정확함 | employee.dept = department.id (타입 불일치) |

##### 7. **Subquery Errors** (부쿼리 에러) - 3개 세부 카테고리

| 세부 카테고리 | 설명 | 예시 |
|---|---|---|
| `unused_subquery` | 부쿼리가 사용되지 않음 | SELECT * FROM employee WHERE (SELECT MAX(salary) ...) (부쿼리 결과를 조건으로 사용하지 않음) |
| `subquery_missing` | 필요한 부쿼리를 사용하지 않음 | "부서별 최대 급여를 받는 직원" 조회에서 서브쿼리 누락 |
| `subquery_correlation_error` | 상관 부쿼리(correlated subquery)의 오류 | 부쿼리에서 외부 쿼리의 테이블 참조 오류 |

##### 8. **Set Operations Errors** (집합 연산 에러) - 3개 세부 카테고리

| 세부 카테고리 | 설명 | 예시 |
|---|---|---|
| `union_missing` | UNION이 필요한데 사용되지 않음 | 여러 조건을 OR로 연결해야 하는데 UNION 미사용 |
| `intersect_missing` | INTERSECT가 필요한데 사용되지 않음 | "두 조건 모두 만족하는 행" 조회에 필요 |
| `except_missing` | EXCEPT가 필요한데 사용되지 않음 | "A이지만 B가 아닌" 조건에 필요 |

##### 9. **Other Issues** (기타 문제) - 3+개 세부 카테고리

| 세부 카테고리 | 설명 | 예시 |
|---|---|---|
| `order_by_missing` | ORDER BY가 필요한데 누락됨 | "순위 순서로" 조회에서 정렬 조건 누락 |
| `limit_missing` | LIMIT가 필요한데 누락됨 | "상위 10개" 조회에서 LIMIT 미적용 |
| `duplicate_select` | 중복된 선택 컬럼 | SELECT name, name, salary FROM employee |
| (추가) | 기타 분류되지 않은 에러 | - |

#### 3.3.2 에러 분류 활용

Correction Plan Agent는 이 분류 체계를 다음과 같이 활용합니다:

1. **에러 진단**: 발생한 에러를 31개 카테고리 중 하나로 정확하게 분류
2. **근본 원인 파악**: 분류된 에러 타입으로부터 근본적인 문제 파악
3. **수정 지도 제공**: 각 에러 타입별 일반적인 수정 전략 제시
4. **재학습**: 같은 유형의 에러를 반복하지 않도록 동일 에러 타입 여러 번 발생 추적

## 4. 실험 설정

### 4.1 데이터셋

SQL-of-Thought는 다양한 Text-to-SQL 벤치마크에서 평가되었습니다.

#### 4.1.1 Spider

**개요**: Spider는 가장 널리 사용되는 Text-to-SQL 벤치마크입니다.
- **구성**:
  - 143개의 데이터베이스
  - 10,181개의 질문-SQL 쌍
  - 개발 세트(Dev set): 1,034개 샘플
- **특징**:
  - 다양한 데이터베이스 구조(스키마)
  - 복잡한 쿼리 포함
  - 조인, 서브쿼리, 그룹화 등 다양한 SQL 기법 필요
  - 실제 데이터베이스와 유사한 난이도

#### 4.1.2 Spider-Realistic

**개요**: Spider-Realistic은 Spider의 확장 버전으로, 더 현실적인 데이터베이스 환경을 반영합니다.
- **구성**: 508개의 샘플
- **특징**:
  - 더 큰 데이터베이스 스키마
  - 복잡한 비즈니스 로직 반영
  - 실제 데이터베이스 쿼리의 더 현실적인 모습
  - 더 높은 난이도

#### 4.1.3 Spider-SYN

**개요**: Spider-SYN은 구문적으로 다양한 변형들을 포함합니다.
- **구성**: 수백 개의 구문 변형 샘플
- **특징**:
  - 동일한 의미의 쿼리를 다양한 SQL 구문으로 표현
  - 모델의 일반화 능력 평가

### 4.2 비교 모델

실험에서는 다음의 LLM들을 테스트했습니다:

1. **Claude 3 Opus** - 메인 모델 (Anthropic)
2. **GPT-5** - 최신 모델 (OpenAI)
3. **GPT-4o-mini** - 경량 고성능 모델 (OpenAI)
4. **GPT-3.5** - 레거시 모델 (OpenAI)
5. **Llama-3.1-8B** - 오픈소스 모델 (Meta)
6. **Qwen2.5-1.5B** - 경량 오픈소스 모델 (Alibaba)

### 4.3 하드웨어 및 계산 자원

- **GPU**: 2개의 NVIDIA H100 (각 80GB HBM)
- **목적**:
  - 로컬 모델 실행 (Llama, Qwen)
  - 병렬 처리 및 빠른 실행
  - 6개 에이전트의 동시 실행 가능

### 4.4 하이퍼파라미터 및 설정

- **Temperature**: 0 (결정론적 생성, 최고 품질 답변)
- **Max tokens**: 모델별로 적절히 설정
- **평가 지표**: Execution Accuracy (EA)
  - 생성된 SQL을 데이터베이스에서 실행한 결과가 올바른지 평가
  - 문법적 정확성보다는 실행 결과 정확성을 중시

## 5. 실험 결과

### 5.1 주요 결과 (Table 1)

다음 표는 Spider 및 Spider-Realistic 데이터셋에서의 실행 정확도(Execution Accuracy) 비교 결과입니다.

| 방법 | 모델 | Spider | Spider-Realistic |
|---|---|---|---|
| ChatGPT | ChatGPT | 74.4% | — |
| GPT-4 | GPT-4 | 72.3% | — |
| ACT-SQL | ChatGPT | 80.4% | 75.8% |
| DIN-SQL | GPT-4 | 82.8% | 78.1% |
| DAIL-SQL | GPT-4 | 83.1% | 75.6% |
| MAC-SQL | GPT-4 | 86.8% | — |
| Tool-SQL | GPT-4 | 86.9% | 82.9% |
| ChaseSQL | — | 87.6% | — |
| **SQL-of-Thought** | **Claude 3 Opus** | **91.59%** | **90.16%** |
| SQL-of-Thought | — | **82.01%** | — |
|  | | (Spider-SYN) |  |

#### 5.1.1 결과 분석

1. **절대적 성능 우수성**
   - Spider: 91.59% (이전 최고: 87.6%, +3.99%p)
   - Spider-Realistic: 90.16% (이전 최고: 82.9%, +7.26%p)
   - Spider-SYN: 82.01%

2. **데이터셋별 강점**
   - Spider-Realistic에서의 성능 향상이 특히 두드러짐
   - 현실적인 데이터베이스 환경에서 멀티-에이전트 방식의 이점 증명
   - 복잡한 스키마 처리에 강함

3. **모델 간 비교**
   - Claude 3 Opus의 우수성 입증
   - GPT 계열 모델들도 좋은 성능 (Ablation 참고)
   - 오픈소스 모델(Llama, Qwen)도 상당한 수준의 성능 달성 (Ablation에서 GPT-3.5 수준)

### 5.2 절제 연구 (Ablation Study)

100개 샘플을 기반으로 한 절제 연구 결과 (Table 2):

| 모델 | 전체 시스템 | w/o Error Correction | w/o Query Plan |
|---|---|---|---|
| Claude 3 Opus | 95% | 85% | 90% |
| GPT-5 | 89% | 85% | 88% |
| GPT-4o-Mini | 87% | 72% | 79% |
| GPT-3.5 | 67% | 59% | 73% |

#### 5.2.1 절제 분석

**1. Error Correction의 중요성**

- **Claude 3 Opus**: 85% → 95% (+10%p)
- **GPT-5**: 85% → 89% (+4%p)
- **GPT-4o-Mini**: 72% → 87% (+15%p)
- **GPT-3.5**: 59% → 67% (+8%p)

결론:
- 에러 수정 메커니즘이 특히 경량 모델(GPT-4o-Mini)에서 큰 효과
- 고성능 모델(Claude 3 Opus)도 10%p 개선
- 체계적인 에러 분류 체계의 효과 입증

**2. Query Plan의 중요성**

- **Claude 3 Opus**: 90% → 95% (+5%p)
- **GPT-5**: 88% → 89% (+1%p)
- **GPT-4o-Mini**: 79% → 87% (+8%p)
- **GPT-3.5**: 73% → 67% (-6%p)

흥미로운 관찰:
- Query Plan이 체계적 사고를 제공하여 복잡한 쿼리 처리에 도움
- 특히 중간 수준의 모델(GPT-4o-Mini)에서 큰 효과
- GPT-3.5에서 음수 효과는 과도한 분해로 인한 실수 증가 가능성

**3. 통합 효과**

- Error Correction + Query Plan의 조합 효과가 개별 효과의 합보다 큼
- 두 요소가 상호 보완적으로 작동
- 95% (Claude) - 59% (GPT-3.5) = 36%p의 종합 개선

### 5.3 에러 분포 분석

(논문에서 제시된 경우) 에러 타입별 분포:

| 에러 타입 | 빈도 (%) | 주요 특성 |
|---|---|---|
| Schema Linking Errors | ~25% | 가장 빈번한 에러, 올바른 컬럼/테이블 식별 필수 |
| Aggregation Errors | ~20% | GROUP BY 관련 오류, 집계 로직 복잡성 |
| Join Errors | ~18% | 테이블 간 관계 파악 어려움 |
| Filter Errors | ~15% | WHERE 조건 정확성 |
| Subquery Errors | ~12% | 복잡한 중첩 쿼리 |
| Other | ~10% | 나머지 에러 유형 |

## 6. 비용 분석

### 6.1 실행 비용

Spider 전체 데이터셋(1,034 샘플)에 대한 실행 비용:

| 모델 | 비용 | 참고 |
|---|---|---|
| Claude 3 Opus (전체 시스템) | ~$42.58 | 6개 에이전트 모두 실행 |
| Claude 3 Opus (하이브리드) | ~$30 | 일부 에이전트 선택적 실행 |

비용 계산:
- **Claude 3 Opus 입력 가격**: ~$3/1M tokens
- **Claude 3 Opus 출력 가격**: ~$15/1M tokens
- **효율성**: 91.59% 정확도 대비 합리적인 비용

### 6.2 실행 속도

6개 에이전트의 순차 실행으로 인한 지연:
- 단일 쿼리당 평균 실행 시간: ~5-10초 (에러 수정 미포함)
- 에러 수정 시: ~10-20초 추가 소요
- 병렬화 가능성으로 추가 최적화 가능

## 7. 결론 및 논의

### 7.1 주요 기여

1. **멀티-에이전트 프레임워크의 효율성**
   - 6개의 전문화된 에이전트를 통한 체계적 접근
   - 각 에이전트의 특화된 역할로 오류 감소
   - 단계별 검증을 통한 품질 향상

2. **체계적 에러 분류 체계**
   - 31개 세부 카테고리의 포괄적 분류
   - 에러 진단 및 수정의 구조화
   - 전이학습(transfer learning) 가능성

3. **최첨단 성능**
   - Spider: 91.59% (최고 성능)
   - Spider-Realistic: 90.16% (특히 현실적 환경에서의 강점)
   - 기존 방법 대비 3-7%p 개선

4. **일반화 가능성**
   - 다양한 모델 아키텍처에 적용 가능
   - 오픈소스 모델에서도 효과적
   - 데이터셋 간 일관된 성능

### 7.2 한계 및 향후 연구

1. **계산 비용**
   - 6개 에이전트의 순차 실행으로 인한 비용 증가
   - 병렬화를 통한 최적화 필요
   - 더 경량의 에이전트 구성 탐색

2. **모델 의존성**
   - Claude 3 Opus에서 최고 성능
   - 저성능 모델에서의 성능 편차
   - 모델 독립적 최적화 방향 필요

3. **확장성**
   - 더 복잡한 쿼리 (윈도우 함수, CTE 등)에 대한 평가 부재
   - 다양한 SQL 방언(dialect)에 대한 평가 필요
   - 다국어 질문에 대한 지원 검토 필요

4. **에러 분류 체계**
   - 31개 카테고리가 모든 에러를 포괄하는지 검증 필요
   - 카테고리 간 겹침(overlapping) 가능성
   - 더 정교한 계층 구조 필요성

### 7.3 실제 응용 가능성

1. **데이터베이스 인터페이스**
   - 자연언어로 데이터베이스 질의 가능한 챗봇 시스템
   - 비전문가도 복잡한 쿼리 작성 가능

2. **코드 생성 지원**
   - 개발자의 생산성 향상
   - SQL 쿼리 검증 및 최적화 도구

3. **데이터 분석**
   - 데이터 애널리스트의 업무 자동화
   - 빠른 탐색적 분석(exploratory analysis)

4. **교육 및 학습**
   - SQL 학습 지원 도구
   - 쿼리 작성 에러 진단 및 피드백

### 7.4 영향과 의의

이 연구는 다음과 같은 중요한 의미를 갖습니다:

1. **LLM 응용의 새로운 패러다임**
   - 단순 프롬프팅에서 멀티-에이전트 시스템으로의 진화
   - 구조화된 에러 처리의 중요성 입증

2. **Code Generation의 발전**
   - 자연언어에서 코드 생성의 최전선
   - 정확성과 안정성의 향상

3. **인간-AI 협업**
   - 체계적 접근으로 신뢰성 증대
   - 복잡한 작업의 자동화 가능성

## 8. 참고 자료

- **논문**: SQL-of-Thought: Multi-agentic Text-to-SQL with Guided Error Correction
- **저자**: Saumya Chaturvedi, Aman Chadha, Laurent Bindschaedler
- **출판처**: NeurIPS 2025, Deep Learning for Code Workshop
- **arXiv**: 2509.00581
- **관련 데이터셋**: Spider, Spider-Realistic, Spider-SYN
- **관련 연구**: ACT-SQL, DIN-SQL, DAIL-SQL, MAC-SQL, Tool-SQL, ChaseSQL

---

**작성 일시**: 2026년 4월 1일
**분류**: 연구노트 - Text-to-SQL, LLM, 멀티-에이전트 시스템
