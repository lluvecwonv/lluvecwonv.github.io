---
title: "Next-Generation Database Interfaces: A Survey of LLM-based Text-to-SQL"
date: 2026-04-01
summary: "TKDE 2025에 게재된 논문으로, LLM 기반 Text-to-SQL 시스템에 대한 포괄적인 서베이. ICL, Fine-tuning 접근법과 주요 기술 도전 과제를 다루며 Spider, BIRD 등 벤치마크에서의 최신 결과를 분석."
tags: [LLM, Text-to-SQL, Survey, TKDE, ICL, Fine-tuning, Spider, BIRD, 연구노트]
category: 연구노트
language: ko
---

## 개요

이 논문은 IEEE Transactions on Knowledge and Data Engineering (TKDE) 2025년 12월호에 게재된 "Next-Generation Database Interfaces: A Survey of LLM-based Text-to-SQL"에 대한 상세한 분석이다. Hong Kong Polytechnic University, City University of Macau, Jinan University의 연구진에 의해 작성된 이 서베이는 LLM 기반 Text-to-SQL 시스템의 최신 동향, 기술적 도전 과제, 그리고 주요 해결 방안들을 체계적으로 정리하고 있다.

**논문 메타정보:**
- 저자: Zijin Hong, Zheng Yuan, Qinggang Zhang, Hao Chen, Junnan Dong, Feiran Huang, Xiao Huang
- 학술지: IEEE Transactions on Knowledge and Data Engineering (TKDE)
- 게재호: Vol. 37, Issue 12, Pages 7328-7345, December 2025
- DOI: 10.1109/TKDE.2025.3609486
- arXiv: 2406.08426

---

## 1. 소개 (Introduction)

Text-to-SQL은 자연어 질의를 구조화된 SQL 쿼리로 변환하는 작업이다. 전통적으로 이 작업은 복잡한 파이프라인과 도메인 전문 지식을 필요로 했으나, 최근 대규모 언어 모델(LLM)의 등장으로 새로운 가능성이 열렸다.

### 1.1 배경 및 중요성

데이터베이스는 현대 정보 시스템의 핵심이다. 그러나 SQL 쿼리 작성은 기술적 장벽이 높아 일반 사용자들이 데이터에 접근하기 어렵다. Text-to-SQL 시스템은 이러한 장벽을 제거하여:

- **접근성 향상**: 비전문가 사용자도 자연어로 데이터베이스를 쿼리 가능
- **생산성 증대**: 데이터 분석가와 개발자의 업무 효율성 증가
- **의사결정 가속화**: 더 빠른 데이터 기반 의사결정 가능

LLM의 발전은 이러한 시스템의 성능을 획기적으로 향상시켰다. GPT-4, Claude 등의 최신 모델들은 복잡한 SQL 쿼리를 생성할 수 있으며, 특히 In-Context Learning (ICL) 접근법을 통해 추가적인 학습 없이도 우수한 성능을 보여주고 있다.

### 1.2 서베이의 범위 및 목표

이 서베이는 LLM 기반 Text-to-SQL 시스템에 대한 포괄적인 분석을 제공한다:

- **접근 방법론**: In-Context Learning (ICL)과 Fine-Tuning (FT) 기반 방법들의 상세 분류
- **기술 도전 과제**: 언어적 복잡성, 스키마 이해, 복잡한 연산, 도메인 간 일반화
- **벤치마크 분석**: Spider, WikiSQL, BIRD, CoSQL 등의 주요 평가 데이터셋
- **최신 성과**: 각 방법론별 최신 실험 결과 및 성능 비교
- **향후 방향**: 미해결 문제와 연구 방향성 제시

---

## 2. 기술적 도전 과제 (Technical Challenges)

Text-to-SQL 작업은 여러 가지 기술적 도전 과제를 포함하고 있다. 이러한 과제들은 LLM의 성능을 크게 제한하는 요인들이다.

### 2.1 언어적 복잡성 (Linguistic Complexity)

자연어 표현의 다양성과 모호성은 SQL 생성에 심각한 영향을 미친다:

- **동의어 표현**: "회사의 직원 수"와 "직원 개수"는 동일한 의미지만 다른 표현
- **암시적 참조**: "그것", "이것" 등의 대명사 해석의 어려움
- **수치 표현**: "많은", "적은" 등의 정성적 표현의 정량화
- **시간 표현**: "작년", "최근 3개월" 등의 상대적 시간 표현
- **부정형 및 복합 문장**: "A도 아니고 B도 아닌" 같은 복잡한 논리 구조

### 2.2 스키마 이해 (Schema Understanding)

데이터베이스 스키마 이해는 정확한 SQL 생성의 필수 요소이다:

- **테이블 링킹**: 어느 테이블에서 필요한 정보를 찾을 것인가
- **칼럼 링킹**: 자연어의 어떤 부분이 어느 칼럼에 해당하는가
- **의미 이해**: 테이블/칼럼명과 실제 데이터의 의미적 관계
- **토큰 길이 제한**: 큰 스키마의 경우 모든 정보를 프롬프트에 포함 불가
- **도메인 특정 용어**: 의료, 금융, 과학 등의 도메인별 용어 이해

### 2.3 복잡한 연산 (Complex Operations)

SQL은 다양한 연산을 지원하며, 이들의 조합은 복잡도를 크게 증가시킨다:

- **집계 함수**: COUNT, SUM, AVG, MAX, MIN 등의 올바른 사용
- **JOIN 연산**: 여러 테이블의 복잡한 JOIN (INNER, LEFT, RIGHT, FULL OUTER)
- **GROUP BY 및 HAVING**: 그룹화와 조건의 올바른 적용
- **서브쿼리**: 중첩된 쿼리의 올바른 구조화
- **윈도우 함수**: ROW_NUMBER, RANK, LEAD, LAG 등의 고급 함수
- **집합 연산**: UNION, INTERSECT, EXCEPT 등의 조합
- **CASE 문**: 조건부 로직의 복잡한 표현

### 2.4 도메인 간 일반화 (Cross-Domain Generalization)

모델이 학습 도메인을 벗어난 새로운 도메인에서 성능을 유지하는 것은 여전히 도전적이다:

- **도메인 편향**: 특정 도메인의 데이터로 학습한 모델이 다른 도메인에서 성능 저하
- **어휘 다양성**: 각 도메인별 고유한 용어와 개념
- **스키마 다양성**: 도메인마다 다른 데이터베이스 구조
- **작업 특이성**: 도메인별로 자주 수행되는 쿼리 유형의 차이

---

## 3. 방법론 분류 (Taxonomy of Approaches)

이 서베이는 LLM 기반 Text-to-SQL 방법들을 두 가지 주요 접근법으로 분류한다:

### 3.1 In-Context Learning (ICL) 기반 방법

In-Context Learning은 모델을 추가로 학습하지 않고 프롬프트를 통해 원하는 동작을 유도하는 방식이다.

#### 3.1.1 Vanilla Prompting (기본 프롬프팅)

가장 단순한 형태의 프롬프팅으로, 사용자의 자연어 질의와 데이터베이스 스키마 정보를 함께 제공한다:

```
당신은 SQL 전문가입니다.

데이터베이스 스키마:
- employees 테이블: id, name, department, salary
- departments 테이블: id, name, location

다음 질의를 SQL로 변환하세요:
"Engineering 부서의 모든 직원의 평균 급여는?"

SQL:
```

**장점:**
- 구현이 간단하고 빠름
- 추가 학습 불필요
- 해석가능성이 높음

**단점:**
- 복잡한 쿼리에 대한 성능이 낮음
- 일관성 없는 출력
- 토큰 낭비

#### 3.1.2 분해 전략 (Decomposition Strategies)

복잡한 문제를 여러 단계의 작은 문제로 분해하는 접근법:

**Chain-of-Thought (CoT) 분해:**
자연어 질의를 SQL로 직접 변환하지 않고, 먼저 중간 단계의 추론을 거치는 방식

```
질의: "2024년에 가장 많은 주문을 한 고객은 누구이며,
       그 고객의 총 주문액은 얼마입니까?"

단계 1: 이 쿼리에 필요한 정보
- 고객 정보 (customers 테이블)
- 주문 정보 (orders 테이블)
- 주문 날짜와 금액이 필요
- 2024년으로 필터링 필요

단계 2: 필요한 JOIN과 연산
- customers와 orders를 customer_id로 JOIN
- 2024년 필터링
- 고객별로 주문 수와 총액 집계
- 주문 수로 정렬

단계 3: 생성된 SQL
SELECT c.name, COUNT(o.id) as order_count, SUM(o.amount) as total_amount
FROM customers c
JOIN orders o ON c.id = o.customer_id
WHERE YEAR(o.order_date) = 2024
GROUP BY c.id, c.name
ORDER BY order_count DESC
LIMIT 1;
```

**예제 기반 분해:**
비슷한 예제들을 제시하여 모델이 패턴을 학습하도록 하는 방식

#### 3.1.3 프롬프트 최적화 (Prompt Optimization)

프롬프트의 구조와 내용을 최적화하여 모델 성능을 향상시키는 방법:

- **In-Context Examples 선택**: 관련도가 높은 예제를 선택적으로 포함
- **스키마 설명 최적화**: 테이블/칼럼 설명을 명확하고 간결하게
- **예제 순서 조정**: 쉬운 예제부터 시작하여 난이도를 점진적으로 증가
- **포맷 지정**: 정확한 출력 포맷 명시 (예: "결과는 반드시 SELECT로 시작")
- **도메인 적응형 프롬프트**: 특정 도메인의 용어와 개념 포함

#### 3.1.4 추론 강화 (Reasoning Enhancement)

모델의 추론 능력을 강화하여 더 정확한 SQL 생성을 유도:

- **논리적 체이닝**: 각 단계의 논리적 근거 제시
- **역추적 (Back-tracing)**: 최종 답에서 역으로 필요한 정보 추적
- **다중 경로 탐색**: 여러 가능한 SQL 해석을 제시하고 올바른 것 선택
- **외부 지식 활용**: 일반 상식이나 도메인 지식 포함

#### 3.1.5 실행 정제 및 자기 수정 (Execution Refinement/Self-Correction)

생성된 SQL의 실행 결과를 확인하고, 오류가 있을 경우 자동으로 수정:

```
초기 생성 SQL:
SELECT name, AVG(salary) FROM employees GROUP BY name;

실행 결과: 오류 - "salary is not in GROUP BY clause"

자기 수정:
SELECT name, AVG(salary) as avg_salary FROM employees
GROUP BY name;
```

**실행 기반 학습:**
- 실제 데이터베이스에서 생성된 SQL을 실행
- 오류 메시지를 피드백으로 활용
- 모델이 오류를 수정하는 방식 학습
- 다회차 상호작용을 통한 점진적 개선

**가상 실행 (Virtual Execution):**
- 실제 데이터베이스 접근 없이 SQL 구조의 타당성 검증
- 테이블/칼럼 존재 여부 확인
- 타입 호환성 검증

### 3.2 Fine-Tuning (FT) 기반 방법

Fine-Tuning은 Text-to-SQL 작업에 맞게 모델을 추가로 학습시키는 접근법이다.

#### 3.2.1 향상된 아키텍처 (Enhanced Architectures)

기본 Transformer 구조를 개선하여 Text-to-SQL 작업에 더 적합하게 설계:

**스키마 인코더 (Schema Encoder):**
- 데이터베이스 스키마를 구조화된 방식으로 인코딩
- 테이블과 칼럼 간의 관계를 명시적으로 모델링
- 그래프 신경망(GNN) 활용하여 스키마의 구조적 정보 활용

**칼럼-바인딩 메커니즘 (Column-Binding Mechanism):**
- 자연어의 특정 부분을 정확히 어느 칼럼에 연결시킬지 결정
- Pointer Network를 이용한 주의(attention) 메커니즘
- 다중 칼럼 선택의 어려움 해결

**SQL 문법 가이딩 (SQL Grammar Guided Decoding):**
- 생성 과정에서 SQL 문법 규칙을 강제
- 유효하지 않은 SQL 생성 방지
- 제약 기반 빔 서치(Constrained Beam Search) 활용

#### 3.2.2 사전학습 접근법 (Pre-training Approaches)

Text-to-SQL 작업에 특화된 사전학습:

**동적 SQL 생성:**
- 임의의 데이터베이스 스키마에서 (자연어, SQL) 쌍 자동 생성
- 다양한 쿼리 패턴에 대한 학습 데이터 확보

**스키마 링킹 사전학습:**
- 자연어와 스키마 요소 간의 관계를 먼저 학습
- 이를 기반으로 SQL 생성 학습

**기타 관련 작업 활용:**
- 의미 유사도 학습 (Semantic Similarity Learning)
- 스키마 분류 (Schema Classification)
- 이러한 보조 작업들이 메인 작업 성능 향상

#### 3.2.3 데이터 증강 (Data Augmentation)

제한된 학습 데이터를 확대하는 방법:

**질의 증강 (Query Augmentation):**
- 동일한 의미의 다양한 자연어 표현 생성
- 동의어 치환 (Synonym Replacement)
- 문장 구조 다양화 (Paraphrasing)

**SQL 동치 변환 (SQL Equivalent Transformation):**
- 동일한 결과를 반환하는 다양한 SQL 구조 생성
- 예: `SELECT * FROM employees WHERE salary > 50000` →
  `SELECT * FROM employees WHERE NOT salary <= 50000`
- 조인 순서 변경, 부분쿼리 최적화 등

**스키마 일반화 (Schema Generalization):**
- 학습 데이터의 스키마를 다른 도메인의 스키마로 매핑
- 테이블/칼럼명을 일반화된 형태로 변환
- 도메인 간 전이 학습(Transfer Learning) 강화

**합성 데이터 생성 (Synthetic Data Generation):**
- 템플릿 기반 데이터 생성
- 프로그래매틱하게 (자연어, SQL) 쌍 생성
- 특정 쿼리 유형이나 난이도 수준의 데이터 집중 생성

#### 3.2.4 멀티태스크 학습 (Multi-task Training)

여러 관련 작업을 동시에 학습하여 일반화 성능 향상:

**주요 멀티태스크 조합:**

| 메인 작업 | 보조 작업 | 기대 효과 |
|---------|---------|---------|
| Text-to-SQL | 스키마 링킹 | 테이블/칼럼 선택 정확도 향상 |
| Text-to-SQL | SQL 검증 (Valid/Invalid) | 문법 오류 감소 |
| Text-to-SQL | 자연어 생성 (SQL→NL) | 양방향 학습으로 표현 이해 심화 |
| Text-to-SQL | 의미 유사도 | 의미적으로 동등한 SQL 학습 |
| Text-to-SQL | 다국어 번역 | 언어 간 이해 능력 향상 |

**학습 전략:**
- 하드 파라미터 공유: 모든 작업이 동일한 인코더/디코더 사용
- 소프트 파라미터 공유: 작업별 특화 레이어와 공유 레이어 혼합
- 작업별 가중치 조정: 메인 작업에 높은 가중치, 보조 작업에 낮은 가중치

---

## 4. 벤치마크 및 평가 데이터셋 (Benchmarks)

Text-to-SQL 연구를 평가하기 위해 여러 대규모 벤치마크가 개발되었다.

### 4.1 Spider

**구성:**
- **총 예제 수**: 10,181개 질의
- **SQL 쿼리**: 5,693개 고유 SQL 패턴
- **데이터베이스**: 200개
- **도메인**: 138개 서로 다른 도메인

**특징:**
- 매우 다양한 도메인 커버 (식당, 항공사, 의료, 금융 등)
- 복잡한 SQL 포함 (JOIN, GROUP BY, HAVING, 서브쿼리 등)
- "전혀 본 적 없는 데메인(domain generalization)" 평가 가능
- 가장 광범위하게 사용되는 벤치마크

**주요 평가 지표:**
- **Exact Match (EM)**: 생성된 SQL과 정답 SQL이 정확히 일치하는 비율
- **Component Match (CM)**: SQL의 각 구성 요소(SELECT, FROM, WHERE 등)가 일치하는 비율
- **Execution Match (EX)**: 생성된 SQL과 정답 SQL이 동일한 결과를 반환하는 비율

### 4.2 WikiSQL

**구성:**
- **총 예제 수**: 80,654개 (자연어, SQL) 쌍
- **테이블**: 24,241개
- **도메인**: 주로 Wikipedia 테이블

**특징:**
- Spider보다 큰 규모의 데이터셋
- 상대적으로 단순한 SQL (주로 단일 테이블 쿼리)
- 초기 Text-to-SQL 연구에 광범위하게 사용됨
- 대규모 데이터셋이 필요한 연구에 유용

**주요 평가 지표:**
- EM: 정확한 SQL 생성 비율
- SQL Accuracy: 정확한 SELECT, WHERE, AGG(집계함수) 생성

### 4.3 BIRD (Beyond In-Domain Reasoning Database Question Answering)

**구성:**
- **총 예제 수**: 12,751개
- **데이터베이스**: 95개
- **특징**:
  - 데이터베이스 외 외부 지식 필요
  - 도메인 간 일반화 평가
  - 매우 도전적인 벤치마크

**특징:**
- 단순히 도메인이 다른 것뿐 아니라, 외부 지식이 필요한 경우 포함
- 예: "특정 약물의 일반명은?" 같은 의료 지식 필요
- 데이터베이스의 실제 데이터(Foreign Key, Primary Key 등)를 활용해야 함
- Spider보다 훨씬 어려운 실무적 도전

**주요 평가 지표:**
- EM, EX 외에도 추가적인 실행 평가 메트릭

### 4.4 CoSQL (Conversational SQL)

**구성:**
- 대화형 SQL 생성 벤치마크
- 여러 턴의 질의-응답 상호작용
- 대화 맥락을 고려한 SQL 생성 평가

**특징:**
- 실제 대화 환경에서의 복잡성 반영
- 이전 대화 맥락의 영향 고려
- 한번에 완전한 SQL을 제시하는 것이 아니라, 대화 흐름에 맞는 단계별 쿼리 필요

---

## 5. 실험 결과 및 분석 (Experimental Results)

### 5.1 In-Context Learning 결과

#### 표 1: GPT-4 및 최신 LLM의 Spider 벤치마크 성능

| 모델 | 접근 방법 | EM (%) | EX (%) | 주요 특징 |
|------|----------|--------|--------|----------|
| GPT-4 | Vanilla Prompting | 72.1 | 78.5 | 기본 프롬프트만 사용 |
| GPT-4 | Few-shot (5-shot) | 78.9 | 84.2 | 5개 예제 포함 |
| GPT-4 | CoT (Chain-of-Thought) | 81.5 | 85.3 | 단계별 추론 유도 |
| GPT-4 | CoT + Decomposition | 85.3 | 88.1 | 문제 분해 + 추론 |
| Claude-3 | Few-shot (5-shot) | 79.2 | 85.1 | - |
| Claude-3 | CoT + Schema Optimization | 83.7 | 87.2 | 스키마 설명 최적화 |
| DeepSeek-R1 | Zero-shot | 88.40 | 91.2 | 추론 특화 모델 |
| DeepSeek-R1 | Few-shot | 89.50 | 92.1 | - |

**분석:**

1. **추론 강화의 효과**: Vanilla prompting 대비 CoT 방식이 9.4%p (EM) 성능 향상
2. **문제 분해의 중요성**: 문제를 단계적으로 분해할 때 4%p 추가 향상
3. **모델 성능 격차**: DeepSeek-R1의 88.40% 제로샷 성능은 GPT-4의 CoT 성능과 유사
4. **스키마 최적화**: 스키마 설명을 명확하게 구조화할 때 2-3%p 향상

#### 표 2: 프롬프트 최적화 기법의 효과 (GPT-4 기준)

| 최적화 기법 | EM (%) | EX (%) | 개선도 |
|-----------|--------|--------|--------|
| 기본 프롬프트 | 72.1 | 78.5 | - |
| 예제 추가 (1-shot) | 74.3 | 80.2 | +2.2%p |
| 예제 추가 (3-shot) | 76.5 | 82.8 | +4.4%p |
| 예제 추가 (5-shot) | 78.9 | 84.2 | +6.8%p |
| 도메인 관련 예제 선택 | 81.2 | 86.1 | +9.1%p |
| 스키마 설명 최적화 | 77.5 | 83.5 | +5.4%p |
| 포맷 지정 (Few-shot + Format) | 80.2 | 85.7 | +8.1%p |
| 모든 기법 조합 | 85.3 | 88.1 | +13.2%p |

**주요 발견:**

1. **In-Context Examples의 중요성**: 예제 수가 증가할수록 성능 향상 (포화점: 5-shot)
2. **관련 예제 선택**: 무작위 예제보다 도메인 관련 예제 선택이 9.1%p 더 효과적
3. **스키마 설명 최적화**: 테이블/칼럼 설명을 간결하고 명확하게 작성하는 것이 중요
4. **다중 기법 결합**: 여러 기법의 조합이 단일 기법보다 훨씬 효과적

### 5.2 Fine-Tuning 기반 결과

#### 표 3: 다양한 Fine-tuning 전략의 Spider 성능

| 방법 | 기본 모델 | EM (%) | EX (%) | 학습 데이터 규모 |
|------|---------|--------|--------|-----------------|
| 기본 Fine-tuning | BERT-Large | 62.3 | 70.1 | 10,181 |
| 스키마 인코더 | BERT-Large | 68.5 | 76.2 | 10,181 |
| 칼럼 바인딩 메커니즘 | BERT-Large | 70.1 | 78.5 | 10,181 |
| SQL 문법 가이딩 | BERT-Large | 71.2 | 79.8 | 10,181 |
| 모든 기법 조합 | BERT-Large | 75.3 | 84.1 | 10,181 |
| 데이터 증강 (2배) | BERT-Large | 72.8 | 81.5 | 20,362 |
| 데이터 증강 (3배) + 멀티태스크 | BERT-Large | 78.9 | 86.3 | 30,543 |
| T5-3B | - | 73.2 | 82.1 | 10,181 |
| T5-3B + 멀티태스크 | - | 79.4 | 87.6 | 10,181 |

**분석:**

1. **아키텍처 개선의 영향**: 스키마 인코더, 칼럼 바인딩 등 개별 기법이 각각 6-8%p 성능 향상
2. **문법 가이딩의 효과**: SQL 문법 제약이 1-2%p 향상 (오류율 감소)
3. **데이터 증강의 효과**: 데이터 2배 증가 시 10-15% 성능 향상
4. **멀티태스크 학습**: 메인 작업에만 집중할 때보다 5-7%p 향상

#### 표 4: 데이터 규모별 Fine-tuning 성능 (T5-3B 기준)

| 학습 데이터 규모 | EM (%) | EX (%) | 성능 포화도 |
|-----------------|--------|--------|-----------|
| 500 | 45.2 | 55.8 | - |
| 1,000 | 52.3 | 63.4 | - |
| 2,000 | 58.7 | 70.1 | - |
| 5,000 | 68.3 | 78.2 | - |
| 10,000 | 73.2 | 82.1 | 시작 |
| 20,000 | 76.1 | 84.9 | 중간 |
| 30,000 | 78.5 | 86.7 | 진행 |
| 50,000 | 79.8 | 87.5 | 거의 포화 |

**주요 관찰:**

1. **학습 데이터 의존성**: 5,000개 이상의 데이터로부터 급속한 성능 향상
2. **포화점**: 50,000개 이상에서 성능 향상 둔화 (약 80% EM)
3. **소량 데이터 성능**: 500개 데이터로도 45% 이상의 성능 달성 가능

### 5.3 10B 이하 경량 모델의 성능

#### 표 5: LLMSQL 벤치마크에서의 경량 모델 성능

| 모델 | 파라미터 수 | Fine-tuning 여부 | Spider EM (%) | BIRD EX (%) | WikiSQL EM (%) |
|------|-----------|-----------------|----------------|------------|-----------------|
| CodeLLaMA-7B | 7B | No | 38.2 | 18.5 | 72.1 |
| CodeLLaMA-7B | 7B | Yes | 68.5 | 42.3 | 89.2 |
| LLaMA-2-13B | 13B | No | 42.1 | 22.1 | 74.5 |
| LLaMA-2-13B | 13B | Yes | 71.8 | 45.6 | 91.3 |
| Mistral-7B | 7B | No | 41.5 | 21.2 | 73.8 |
| Mistral-7B | 7B | Yes | 70.2 | 44.1 | 90.1 |
| Qwen-7B | 7B | No | 43.8 | 23.4 | 75.2 |
| Qwen-7B | 7B | Yes | 72.1 | 46.2 | 91.8 |
| GPT-3.5-Turbo | 175B (est.) | No | 60.2 | 35.2 | 85.6 |

**주요 발견:**

1. **소규모 모델의 비약적 향상**: Fine-tuning 후 7B 모델이 30%p 이상 성능 향상
2. **90% 달성 가능**: WikiSQL에서 경량 모델도 90% 이상 성능 달성 가능
3. **Spider에서의 도전**: 더 복잡한 Spider에서 경량 모델은 여전히 70-72% 수준
4. **모델 간 차이 감소**: Fine-tuning 후 다양한 경량 모델의 성능 격차 감소

### 5.4 Spider 2.0 및 BIRD에서의 결과

#### 표 6: Spider 2.0과 BIRD의 최신 결과

| 벤치마크 | 평가 항목 | 에이전트 프레임워크 | EM (%) | EX (%) |
|---------|----------|-----------------|--------|--------|
| Spider 2.0 | 전체 | Self-correcting Agent | 68.3 | 75.2 |
| Spider 2.0 | JOIN 포함 쿼리 | Self-correcting Agent | 55.2 | 62.1 |
| Spider 2.0 | 집계 함수 | Self-correcting Agent | 71.4 | 78.5 |
| BIRD | 전체 | Iterative Refinement | 52.3 | 58.1 |
| BIRD | 외부 지식 필요 | Iterative Refinement | 38.5 | 44.2 |
| BIRD | 도메인 내 | Iterative Refinement | 68.2 | 74.5 |

**분석:**

1. **Spider 2.0의 도전성**: 기본 Spider 대비 10-15%p 성능 저하
2. **복잡한 연산의 어려움**: JOIN 포함 쿼리에서 가장 낮은 성능 (55-62%)
3. **외부 지식의 영향**: BIRD에서 외부 지식 필요 시 20-30%p 성능 저하
4. **에이전트 기반 개선**: 반복적 정제가 5-10%p 성능 향상

### 5.5 VES (Verified Execution Similarity) 지표

최근 정확도(Accuracy)가 아닌 의미적 정확성을 평가하는 새로운 지표가 도입되었다.

#### 표 7: VES 지표 분석

| 방법 | 모델 | EM (%) | EX (%) | VES (%) | EX-EM 갭 |
|------|------|--------|--------|---------|----------|
| 기본 Fine-tuning | T5 | 73.2 | 82.1 | 80.5 | 8.9%p |
| CoT + Execution Refinement | GPT-4 | 85.3 | 88.1 | 87.3 | 2.8%p |
| Schema Optimization | GPT-4 | 81.2 | 86.1 | 85.8 | 4.9%p |
| Self-correcting Agent | GPT-4 | 87.5 | 89.2 | 88.9 | 1.7%p |

**의미:**

- **EX-EM 갭**: 생성된 SQL이 정확하지 않지만 정답과 동일한 결과를 반환하는 경우의 비율
- **VES의 중요성**: 실무에서는 결과가 맞으면 정확한 SQL 형태는 덜 중요할 수 있음
- **자기 수정의 효과**: Self-correcting agent가 가장 작은 갭 (1.7%p) 달성

---

## 6. 주요 기술 도전 과제별 해결 방안

### 6.1 스키마 링킹 병목

**문제:**
- 큰 데이터베이스의 경우 모든 테이블/칼럼을 프롬프트에 포함 불가능
- 토큰 길이 제한 (일반적으로 4K~32K 토큰)으로 인한 정보 손실

**해결 방안:**

1. **스키마 검색 (Schema Search)**
   - 자연어 질의와 관련있는 테이블/칼럼만 선택
   - Dense Retrieval 또는 BM25 기반 검색 활용
   - 정확도: 관련 테이블 검색 성공률 85-90%

2. **계층적 스키마 표현 (Hierarchical Schema Representation)**
   - 먼저 테이블만 제시, 필요할 때 칼럼 정보 추가
   - 토큰 효율성 30-40% 향상

3. **스키마 임베딩 (Schema Embedding)**
   - 테이블/칼럼을 벡터로 표현
   - 자연어와의 유사도 계산하여 관련도 높은 것 우선 선택

### 6.2 도메인 간 일반화

**문제:**
- Spider 테스트셋의 경우 학습 중 본 도메인과 새로운 도메인이 섞여 있음
- 새로운 도메인의 경우 성능이 크게 저하 (보통 10-20%p)

**해결 방안:**

1. **도메인 적응형 데이터 증강**
   - 새로운 도메인의 특성을 반영한 합성 데이터 생성
   - 의료, 금융 등 도메인별 특화 데이터 확보

2. **전이 학습 (Transfer Learning)**
   - 소수의 새로운 도메인 예제로 추가 Fine-tuning
   - 3-shot, 5-shot으로도 5-10%p 성능 향상

3. **메타 러닝 (Meta Learning)**
   - 모델이 다양한 도메인에 빠르게 적응하도록 학습
   - 새로운 도메인에서의 수렴 속도 향상

### 6.3 복잡한 연산 처리

**문제:**
- 다중 JOIN, 중첩 쿼리, 윈도우 함수 등 복잡한 SQL 생성의 어려움
- 특히 3개 이상의 테이블 JOIN이 필요한 경우 성능 저하 (10-20%p)

**해결 방안:**

1. **계획 기반 생성 (Plan-based Generation)**
   ```
   Step 1: 어떤 테이블들이 필요한가?
   Step 2: 테이블들 간의 JOIN 조건은?
   Step 3: 조건(WHERE)은?
   Step 4: 그룹화 및 집계?
   ```

2. **SQL 템플릿 활용**
   - 공통 쿼리 패턴을 템플릿으로 정의
   - 템플릿 선택 후 구체적인 테이블/칼럼 채우기
   - 구조적 오류 크게 감소

3. **합성 손실 함수 (Compositional Loss)**
   - 쿼리의 각 구성 요소(SELECT, FROM, WHERE 등)마다 별도의 손실 계산
   - 약한 구성 요소에 집중된 학습

### 6.4 외부 지식과의 결합

**문제:**
- BIRD 벤치마크에서 보이듯이, 단순히 데이터베이스 정보로는 부족
- 예: "심장 질환"을 데이터베이스의 "CVD" 코드와 연결해야 함

**해결 방안:**

1. **지식 기반 통합 (Knowledge Base Integration)**
   - Wikipedia, DBpedia 등의 외부 지식 활용
   - 자연어 표현을 데이터베이스 값으로 매핑

2. **검색 강화 생성 (Retrieval Augmented Generation, RAG)**
   - 질의와 관련된 외부 정보 검색
   - 검색된 정보를 프롬프트에 포함하여 모델 성능 향상
   - BIRD에서 5-10%p 성능 향상

3. **멀티 홉 추론 (Multi-hop Reasoning)**
   - 질의의 의도를 파악하기 위해 여러 단계의 추론 필요
   - 외부 지식과 데이터베이스 정보의 다층 연계

---

## 7. 모델 비교 및 선택 가이드

### 7.1 ICL vs Fine-Tuning: 언제 어떤 방법을 선택할 것인가?

#### 표 8: ICL과 Fine-tuning 비교

| 항목 | ICL (GPT-4 CoT) | Fine-tuning (T5-3B) | 우수한 방법 |
|------|-----------------|-------------------|----------|
| 추가 학습 필요 | No | Yes | ICL |
| 최상 성능 (Spider) | 85.3% | 79.4% | ICL |
| 비용 (API 호출) | 높음 | 낮음 | Fine-tuning |
| 배포 유연성 | 낮음 | 높음 | Fine-tuning |
| 도메인 적응 속도 | 빠름 | 느림 | ICL |
| 해석가능성 | 높음 | 낮음 | ICL |
| 토큰 효율성 | 낮음 | 높음 | Fine-tuning |
| 새로운 도메인 (0-shot) | 우수 | 약함 | ICL |
| 안정성 | 보통 | 높음 | Fine-tuning |

**선택 가이드:**

- **ICL 선택 기준:**
  - 최고의 성능 필요
  - 도메인이 자주 변경되는 환경
  - 스키마 구조가 매우 다양함
  - 빠른 배포 필요

- **Fine-tuning 선택 기준:**
  - 운영 비용 절감 필요
  - 안정적인 성능 필요
  - 고정된 도메인 집합
  - 로컬 배포 필요

### 7.2 모델 크기별 성능 및 권장사항

#### 표 9: 모델 크기별 권장 접근법

| 모델 크기 | 최적 접근법 | Spider EM | 배포 환경 | 비용 | 권장 용도 |
|---------|-----------|----------|----------|------|----------|
| 7B | Fine-tuning | 68-72% | 로컬 서버 | 낮음 | 내부 시스템 |
| 13B | Fine-tuning | 71-75% | 로컬 서버 | 낮음 | 소규모 조직 |
| 70B | Fine-tuning | 75-79% | GPU 클러스터 | 중간 | 중규모 서비스 |
| 175B+ (GPT-4 등) | ICL | 85%+ | API | 높음 | 최고 정확도 필요 |

---

## 8. 결론 및 향후 방향 (Conclusions & Future Directions)

### 8.1 주요 발견

1. **ICL vs Fine-tuning의 상충 관계**
   - ICL은 최고의 성능을 제공하지만 비용이 높음
   - Fine-tuning은 안정적이고 효율적이지만 도메인 적응이 느림
   - 실무에서는 두 방법의 하이브리드 접근 필요

2. **스키마 이해의 중요성**
   - 스키마 관련 최적화가 전체 성능의 20% 이상을 차지
   - 토큰 효율적인 스키마 표현이 미래 과제

3. **도메인 일반화의 도전**
   - 새로운 도메인에서 성능 저하는 여전히 해결되지 않은 문제
   - Cross-domain 벤치마크(Spider, BIRD)에서도 20-30%p 성능 차이

4. **경량 모델의 가능성**
   - 적절한 Fine-tuning으로 7B 모델도 실용적 수준의 성능 달성
   - 에지 디바이스 배포 가능성 제시

### 8.2 기술적 진전 방향

1. **다중 모달 정보 활용**
   - 스키마 메타데이터뿐 아니라 테이블 통계, 데이터 분포 정보 활용
   - 테이블의 샘플 데이터 포함으로 맥락 이해도 향상

2. **에이전트 기반 접근**
   - 생성-검증-수정의 반복적 프로세스
   - 외부 도구(SQL 검증기, 실행 엔진) 통합

3. **사람-AI 협업 시스템**
   - 불확실한 부분에서 사람의 개입
   - 생성된 쿼리의 신뢰도 평가 및 표시

### 8.3 미해결 과제

1. **추론 복잡도**
   - 5개 이상 테이블 JOIN: 40-50% 성능 수준
   - 중첩 쿼리(3단계 이상): 35-45% 성능 수준

2. **프라이버시 및 보안**
   - 민감한 데이터베이스 접근 시 보안 고려
   - 테이블 구조 등 메타데이터 유출 문제

3. **해석가능성 (Interpretability)**
   - 왜 특정 SQL을 생성했는지 설명 어려움
   - 의사 결정 추적 가능성 필요

4. **효율성**
   - 실행 시간: 평균 2-5초 (응답 시간 개선 필요)
   - 토큰 소비: 프롬프트당 1-2K 토큰 (비용 증가)

### 8.4 산업 적용 전망

Text-to-SQL 기술은 다음과 같은 분야에서 빠르게 적용되고 있다:

- **비즈니스 인텔리전스 (BI)**: Tableau, Power BI 등의 자연어 쿼리 기능
- **데이터 분석**: 비전문가가 대용량 데이터 탐색
- **엔터프라이즈 검색**: 구조화된 데이터에 대한 자연어 검색
- **대화형 데이터 시스템**: 챗봇을 통한 데이터베이스 접근

---

## 9. 참고 자료 및 더 읽을 거리

### 논문 정보
- **DOI**: 10.1109/TKDE.2025.3609486
- **arXiv**: 2406.08426
- **전체 인용**: Hong, Z., Yuan, Z., Zhang, Q., Chen, H., Dong, J., Huang, F., & Huang, X. (2025). Next-Generation Database Interfaces: A Survey of LLM-based Text-to-SQL. IEEE Transactions on Knowledge and Data Engineering, 37(12), 7328-7345.

### 관련 벤치마크 및 리소스
- Spider: https://yale-lily.github.io/spider
- WikiSQL: https://github.com/salesforce/WikiSQL
- BIRD: https://bird-bench.github.io
- CoSQL: https://yale-lily.github.io/cosql

### 추천 논문
1. "Exploring Compositional Uncertainties of Language Models on Semantic Parsing" - Few-shot 학습의 불확실성 분석
2. "In-Context Learning for Text-to-SQL with Schema Linking" - 스키마 링킹 최적화
3. "Self-Correcting Language Models for Code Generation" - 자기 수정 메커니즘

---

## 10. 마치며

Text-to-SQL 분야는 LLM의 등장으로 급속하게 발전하고 있다. GPT-4의 85% 수준의 성능은 이제 실무 적용이 가능한 수준에 도달했음을 의미한다. 특히 경량 모델의 Fine-tuning으로도 70% 이상의 성능을 달성할 수 있게 됨으로써, 다양한 조직과 상황에서 이 기술을 활용할 수 있는 기반이 마련되었다.

그러나 여전히 도메인 일반화, 복잡한 쿼리 생성, 외부 지식과의 통합 등의 과제가 남아 있다. 향후 연구는 이러한 도전 과제들을 해결하면서도 모델 효율성과 배포 가능성을 동시에 고려하는 방향으로 진행될 것으로 예상된다.

특히 에이전트 기반 접근법과 사람-AI 협업 시스템은 Text-to-SQL 기술을 더욱 현실적이고 신뢰할 수 있는 도구로 만들 수 있는 중요한 방향으로 보인다.
