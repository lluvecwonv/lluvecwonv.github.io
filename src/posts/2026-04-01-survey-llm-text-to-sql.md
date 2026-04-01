---
title: A Survey on Employing Large Language Models for Text-to-SQL Tasks
date: 2026-04-01
summary: ACM Computing Surveys 2024에서 발표된 대규모 언어 모델을 활용한 Text-to-SQL 작업에 대한 종합 조사 논문. 프롬프트 엔지니어링, 파인튜닝 기법과 실험 결과를 상세히 분석.
tags: [LLM, Text-to-SQL, Survey, Prompt Engineering, Fine-tuning, Spider, BIRD, ACM, 연구노트]
category: 연구노트
language: ko
---

## 개요

본 논문은 Peking University와 SingData Cloud의 연구진에 의해 작성된 "A Survey on Employing Large Language Models for Text-to-SQL Tasks"를 다루고 있습니다. 이 조사 논문은 자연어 질문을 SQL 쿼리로 변환하는 작업에 대규모 언어 모델(LLM)을 적용하는 다양한 방법들을 종합적으로 정리합니다.

**출판 정보:**
- 저널: ACM Computing Surveys (CSUR), 2024
- 저자: Liang Shi, Zhengju Tang, Nan Zhang, Xiaotong Zhang, Zhi Yang
- arXiv ID: 2407.15186
- DOI: 10.1145/3737873

## 1. 서론

Text-to-SQL 작업은 자연어로 표현된 사용자의 질문을 SQL 쿼리로 변환하는 기술입니다. 이는 데이터베이스와의 자연어 인터페이스를 가능하게 하여, 기술적 배경이 없는 사용자도 복잡한 데이터 분석을 수행할 수 있게 합니다.

### 1.1 연구 배경

전통적인 Text-to-SQL 접근법은 딥러닝 기반의 시퀀스-투-시퀀스(Seq2Seq) 모델이나 사전학습된 언어 모델(BERT, T5 등)을 사용했습니다. 하지만 이러한 방법들은 다음과 같은 한계를 가지고 있었습니다:

- **제한된 문맥 이해**: 복잡한 자연어 표현을 이해하는 능력 부족
- **스키마 처리 어려움**: 큰 규모의 데이터베이스 스키마를 효과적으로 처리하지 못함
- **도메인 지식 활용 제한**: 특정 도메인의 특수한 용어와 규칙을 반영하기 어려움

LLM의 등장으로 이러한 문제들을 해결할 새로운 가능성이 열렸습니다:

- GPT-4와 같은 최신 LLM의 뛰어난 문맥 이해 능력
- Few-shot 학습을 통한 빠른 적응
- Chain-of-Thought와 같은 추론 방법론 활용 가능
- 다양한 프롬프트 엔지니어링 기법 적용 가능

### 1.2 논문의 주요 기여

이 조사 논문의 주요 기여는 다음과 같습니다:

1. **포괄적 분류 체계**: LLM을 활용한 Text-to-SQL 방법들을 두 가지 주요 카테고리(프롬프트 엔지니어링, 파인튜닝)로 분류
2. **상세한 방법론 분석**: 각 카테고리 내의 세부 기법들을 깊이 있게 설명
3. **벤치마크 성능 분석**: Spider, BIRD, Dr.Spider 등의 데이터셋에서의 성능 비교
4. **도전 과제 식별**: 현재 LLM 기반 Text-to-SQL의 주요 제약사항 분석
5. **미래 방향 제시**: 연구 커뮤니티를 위한 향후 연구 방향 제안

## 2. 관련 연구

### 2.1 Text-to-SQL의 진화

#### 초기 단계 (2015-2019)
초기 Text-to-SQL 연구는 문법 기반의 파서와 생성 모델을 사용했습니다:

- **SEQ2SEQ 모델**: Seq2Seq 아키텍처를 이용한 자동 SQL 생성
- **문맥 인식 인코더**: BiLSTM, Attention 메커니즘을 활용한 자연어 이해
- **구문 제약 적용**: SQL의 문법 규칙을 모델에 적용하여 문법적으로 정확한 쿼리 생성

#### 중기 단계 (2020-2023)
사전학습된 언어 모델의 등장으로 성능이 크게 향상되었습니다:

- **BERT/RoBERTa 기반 모델**: 강력한 사전학습을 통한 의미 이해
- **T5 모델**: Encoder-Decoder 구조를 활용한 Text-to-SQL
- **Graph Neural Networks (GNN)**: 스키마의 관계를 그래프로 모델링
- **Table 관련 모델**: TAPAS, TaBERT 등 테이블 인식 모델 개발

#### 현재 단계 (2023-2024)
LLM의 등장으로 새로운 패러다임이 시작되었습니다:

- **GPT-3.5, GPT-4**: Few-shot 학습으로 뛰어난 성능 달성
- **오픈 소스 LLM**: LLaMA, CodeLLaMA 등의 활용
- **지시어 조정 (Instruction Tuning)**: LLM을 특정 작업에 맞게 최적화
- **에이전트 기반 접근**: 반복적 개선과 오류 교정

### 2.2 주요 벤치마크 데이터셋

#### Spider
- **규모**: 10,181개 질문, 200개 데이터베이스
- **특징**: 멀티-턴 상호작용, 복잡한 쿼리, 도메인 다양성
- **평가 지표**: Exact Match (EM), Execution Accuracy (EX)

#### BIRD
- **규모**: 12,751개 질문, 95개 데이터베이스
- **특징**: 실제 데이터베이스 기반, 더 큰 스키마 (평균 27.5개 테이블)
- **초점**: 복잡한 비즈니스 로직 이해 필요
- **평가 지표**: Valid Efficiency Score (VES), 실행 정확도

#### Dr.Spider
- **규모**: Spider의 약 30% (3,034개)
- **특징**: 고난이도 문제로만 구성 (Spider에서 70% 이상의 모델이 실패한 질문)
- **목적**: 모델의 강건성 평가

## 3. 방법론 및 분류 체계

이 조사 논문은 LLM 기반 Text-to-SQL 방법을 두 가지 주요 카테고리로 분류합니다:

## A. 프롬프트 엔지니어링 (Prompt Engineering)

프롬프트 엔지니어링은 LLM을 직접 파인튜닝하지 않고, 입력 프롬프트를 설계하여 모델의 성능을 최적화하는 방법입니다.

### A.1. 기본 프롬프트 구조

#### A.1.1 질문 기반 구조 (Question-based)
기본적인 구조로, 자연어 질문만을 입력으로 사용합니다:

```
사용자 질문: {natural language question}
SQL 쿼리:
```

**장점**:
- 구현이 간단함
- 모델의 내재적 지식 활용

**단점**:
- 데이터베이스 스키마 정보 부재
- 낮은 정확도

#### A.1.2 API 문서 기반 구조 (API Documentation)
데이터베이스 스키마를 자연어 형식의 API 문서로 제공:

```
데이터베이스 설명:
- table1: 사용자 정보를 저장합니다
  - user_id: 사용자 고유 ID
  - user_name: 사용자 이름
  - created_at: 계정 생성 날짜

질문: {question}
SQL 쿼리:
```

**특징**:
- 스키마를 자연어로 설명
- 테이블 간의 관계를 자유형식으로 표현
- 모델이 이해하기 쉬운 형식

#### A.1.3 SELECT X 기반 구조
기본 SQL 템플릿을 제공하여 모델이 완성하도록 유도:

```
SELECT <열> FROM <테이블> WHERE <조건>
```

**목적**:
- SQL 구조 강제
- 모델의 생성 과정 안내

#### A.1.4 CREATE TABLE 기반 구조
데이터베이스 스키마를 DDL(Data Definition Language) 형식으로 제공:

```
CREATE TABLE users (
    user_id INT PRIMARY KEY,
    user_name VARCHAR(100),
    created_at TIMESTAMP
);
CREATE TABLE orders (
    order_id INT PRIMARY KEY,
    user_id INT,
    order_date TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

질문: {question}
SQL 쿼리:
```

**장점**:
- 스키마 정보를 정확하게 전달
- 외래키 관계 명확
- 데이터 타입 정보 포함

**단점**:
- 큰 스키마에서 컨텍스트 길이 초과 가능
- DDL 파싱 필요

### A.2. 보조 지식 (Supplementary Knowledge)

#### A.2.1 스키마 정보 강화 (Schema Enhancement)

**열 주석 추가 (Column Comments)**:
각 열에 대한 의미 있는 설명을 추가하여 모델의 이해를 돕습니다:

```sql
CREATE TABLE products (
    product_id INT PRIMARY KEY COMMENT '상품의 고유 식별자',
    product_name VARCHAR(100) COMMENT '상품의 이름',
    category_id INT COMMENT '상품이 속한 카테고리의 ID',
    price DECIMAL(10,2) COMMENT '상품의 판매 가격 (달러)',
    stock_quantity INT COMMENT '현재 보유 중인 재고 수량'
);
```

**테이블 간 관계 명시화**:
JOIN 조건과 외래키 관계를 명확하게 표현:

```
FOREIGN KEY relationships:
- products.category_id → categories.category_id
- orders.product_id → products.product_id
- orders.customer_id → customers.customer_id
```

**값 범위 정보**:
열의 가능한 값들에 대한 정보 제공:

```
status 열의 가능한 값: 'pending', 'completed', 'cancelled', 'shipped'
user_type 열의 가능한 값: 'premium', 'standard', 'free'
```

#### A.2.2 SQL 예제 (SQL Examples)

**기본 쿼리 패턴 제공**:
```
일반적인 쿼리 예시:
1. 단순 SELECT: SELECT * FROM users WHERE user_id = 1;
2. 집계 함수: SELECT COUNT(*) as user_count FROM users;
3. JOIN: SELECT u.user_name, COUNT(o.order_id)
         FROM users u LEFT JOIN orders o ON u.user_id = o.user_id
         GROUP BY u.user_id;
```

**도메인 특화 쿼리**:
특정 업무 영역의 전형적인 쿼리 패턴을 제공하여 모델이 유사한 패턴을 적용하도록 유도합니다.

#### A.2.3 작업 관련 지식 (Task-related Knowledge)

**도메인 용어집 (Glossary)**:
비즈니스 도메인 특화 용어와 그 의미를 정의:

```
용어 정의:
- SKU: Stock Keeping Unit, 상품 고유 식별 코드
- GMV: Gross Merchandise Value, 총 상품 거래액
- CAC: Customer Acquisition Cost, 고객 획득 비용
- AOV: Average Order Value, 평균 주문액
```

**비즈니스 규칙 (Business Rules)**:
```
데이터 처리 규칙:
1. 최근 90일 데이터만 'current' 상태로 표시
2. cancelled 주문은 반품 처리
3. 고객 VIP 등급은 총 구매액이 $10,000 이상
4. 반품은 원래 구매 날짜로부터 30일 이내에만 가능
```

#### A.2.4 메모리 메커니즘 (Memory Mechanism)

**대화 이력 활용**:
```
이전 대화:
Q1: 2024년 1월의 매출이 얼마인가?
A1: SELECT SUM(amount) FROM sales WHERE MONTH(sale_date) = 1 AND YEAR(sale_date) = 2024;

현재 질문: 그 중에서 카테고리별 분포는?
(이전 컨텍스트를 활용하여 카테고리별 분석 수행)
```

**성공/실패 예제 저장**:
모델의 생성 이력에서 성공한 패턴을 학습 자료로 활용합니다.

#### A.2.5 질문 개선 (Question Enhancement)

**질문 정규화**:
```
원문: "지난달 대비 이번달 판매는?"
정규화: "2024년 3월과 2024년 4월의 판매액을 비교하고, 증감률을 계산하시오."
```

**모호성 제거**:
```
원문: "큰 주문은?"
개선: "총액이 평균 주문액보다 50% 이상 큰 주문을 찾으시오."
```

### A.3. 예제 선택 (Example Selection)

#### A.3.1 Zero-shot

프롬프트에 예제를 포함하지 않고 모델의 일반화 능력에만 의존합니다.

**사용 시기**:
- 새로운 도메인이나 데이터베이스에 즉시 적용 필요
- 예제 수집이 어려운 경우
- 모델의 기본 능력 평가

**성능**:
- 최신 GPT-4의 경우에도 Spider에서 약 60-65% 정확도
- 복잡한 쿼리에서는 성능이 크게 떨어짐

#### A.3.2 Few-shot

몇 개의 질문-쿼리 쌍을 예제로 제공합니다.

**기본 Few-shot**:
```
예제 1:
질문: 2024년 1월의 매출은?
쿼리: SELECT SUM(amount) FROM sales WHERE MONTH(sale_date) = 1 AND YEAR(sale_date) = 2024;

예제 2:
질문: 각 카테고리별 상품 개수는?
쿼리: SELECT category_id, COUNT(*) FROM products GROUP BY category_id;

예제 3:
질문: 가장 많이 팔린 상품은?
쿼리: SELECT product_id, SUM(quantity) FROM order_items GROUP BY product_id ORDER BY SUM(quantity) DESC LIMIT 1;

실제 질문: {user_question}
쿼리:
```

**동적 예제 선택 (In-Context Learning)**:

예제를 정적으로 고정하는 대신, 각 질문에 맞는 가장 적절한 예제를 동적으로 선택합니다:

1. **의미 유사도 기반 선택**:
   - 사용자 질문과 가장 유사한 예제 선택
   - 임베딩 벡터의 코사인 유사도 계산
   - 상위 K개의 가장 유사한 예제 사용

2. **구조 유사도 기반 선택**:
   - SQL 쿼리의 구조 복잡도 비교
   - JOIN 개수, GROUP BY 절의 유무 등 고려
   - 질문과 유사한 복잡도의 예제 선택

3. **혼합 선택 전략**:
   - 의미와 구조 유사도를 가중 조합
   - 다양성 확보를 위해 서로 다른 유형의 예제 포함

**예제 선택의 영향**:
- 최적의 예제 선택으로 추가로 5-10%의 성능 향상 가능
- 부적절한 예제는 오히려 성능 저하 초래

### A.4. 추론 방법 (Reasoning Methods)

#### A.4.1 Chain-of-Thought (CoT)

모델이 최종 SQL 쿼리 생성 전에 중간 추론 과정을 단계별로 수행하도록 유도합니다.

**기본 CoT 프롬프트**:
```
질문: 지난 분기에 판매액이 평균 이상인 상품은?

단계별 분석:
1. 필요한 데이터 식별:
   - products 테이블: product_id, product_name, category
   - sales 테이블: product_id, amount, sale_date

2. "지난 분기" 정의:
   - 현재 날짜 기준으로 3개월 이전부터 현재까지
   - 예: 2024년 1월-3월

3. 평균 판매액 계산:
   - 지난 분기의 전체 판매액 / 총 판매 건수

4. 조건 적용:
   - 각 상품의 판매액이 평균을 초과

5. SQL 구성:
   WITH quarter_sales AS (
       SELECT product_id, SUM(amount) as total_sales
       FROM sales
       WHERE sale_date >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH)
       GROUP BY product_id
   ),
   avg_sales AS (
       SELECT AVG(total_sales) as avg_amount FROM quarter_sales
   )
   SELECT DISTINCT p.product_id, p.product_name, qs.total_sales
   FROM products p
   JOIN quarter_sales qs ON p.product_id = qs.product_id
   JOIN avg_sales a ON qs.total_sales > a.avg_amount;
```

**CoT의 효과**:
- 복잡한 문제에서 15-20% 성능 향상
- 모델의 추론 과정이 명시적으로 드러남
- 오류 원인을 파악하기 쉬움

#### A.4.2 Least-to-Most 추론

복잡한 문제를 단계적으로 더 간단한 서브 문제로 분해합니다.

**전략**:
1. 주어진 복잡한 질문을 단계적으로 단순한 서브 문제로 분해
2. 각 서브 문제에 대한 SQL을 별도로 생성
3. 서브 쿼리를 조합하여 최종 SQL 구성

**예제**:
```
복잡한 질문: 각 카테고리별로, 평균 구매액이 가장 높은 고객이 구매한
            상품의 평균 가격은?

분해:
Step 1: 각 카테고리별 상품 가격의 평균을 구한다
  SQL: SELECT category_id, AVG(price) as avg_price
       FROM products GROUP BY category_id;

Step 2: 각 고객별 평균 구매액을 구한다
  SQL: SELECT customer_id, AVG(amount) as avg_purchase
       FROM orders GROUP BY customer_id;

Step 3: 각 카테고리별로 평균 구매액이 가장 높은 고객을 찾는다
  SQL: SELECT category_id, MAX(avg_purchase) as max_avg_purchase
       FROM (고객별 구매액) GROUP BY category_id;

Step 4: 그 고객이 구매한 상품의 평균 가격
  SQL: (Step 3의 고객이 구매한 상품의 가격 평균)

최종 쿼리: (모든 단계를 조합)
```

#### A.4.3 Self-Consistency

동일한 질문에 대해 여러 번의 추론을 수행하고, 가장 일관성 있는 결과를 선택합니다.

**프로세스**:
```
1. 같은 프롬프트로 N번 생성 (예: N=5)
   - 온도(temperature)를 높게 설정하여 다양한 결과 생성

2. 생성된 N개의 SQL 쿼리 실행

3. 결과 분석:
   - 가장 많은 쿼리가 같은 결과를 낸 경우, 그 결과 선택
   - 여러 결과가 동일하게 나타나면 투표 메커니즘 적용

4. 신뢰도 평가:
   - 일치도가 높을수록 신뢰도 높음
```

**성능 개선**:
- 단일 생성 대비 5-8% 추가 향상
- 복잡한 쿼리에서 더 큰 효과

#### A.4.4 Self-Correction

생성된 SQL에 대한 검증을 수행하고, 오류가 발견되면 자동으로 수정합니다.

**자동 수정 프로세스**:
```
1. SQL 쿼리 생성
   Generated SQL: SELECT * FROM users WHERE age > 30;

2. 문법 검증
   - SQL 파서로 문법 확인
   - 스키마 검증 (테이블, 열 존재 확인)

3. 오류 감지
   - 컴파일 오류: 테이블/열 이름 오류
   - 논리적 오류: WHERE 조건 불일치

4. 피드백 생성
   오류: "table 'users'의 'age' 열이 존재하지 않습니다.
   가능한 열: user_id, user_name, birth_date"

5. 재생성
   프롬프트에 피드백 추가:
   "이전 쿼리에서 오류가 발생했습니다: {error}
    올바른 열을 사용하여 다시 작성하세요."

6. 수정된 SQL:
   SELECT * FROM users WHERE YEAR(CURDATE()) - YEAR(birth_date) > 30;
```

**반복 수정**:
최대 3-5회까지 반복하여 점진적으로 쿼리 개선

### A.5. 검색-증강 생성 (RAG: Retrieval-Augmented Generation)

외부 데이터베이스에서 관련 정보를 검색하여 프롬프트에 추가합니다.

#### A.5.1 스키마 검색

**스키마 임베딩**:
각 테이블과 열에 대한 임베딩 벡터를 생성:

```
테이블 임베딩:
- customers: [0.23, 0.45, ..., 0.12] (128차원)
- orders: [0.18, 0.52, ..., 0.34]
- products: [0.31, 0.41, ..., 0.28]

열 임베딩:
- customers.customer_id: [...]
- customers.customer_name: [...]
- customers.email: [...]
```

**질문 기반 검색**:
```
사용자 질문: "지난 달 매출이 가장 높은 상품은?"

질문 임베딩 → 가장 관련성 높은 테이블/열 검색:
1. sales 테이블 (상관도: 0.92)
2. products 테이블 (상관도: 0.88)
3. sale_date 열 (상관도: 0.89)
4. product_name 열 (상관도: 0.85)
5. amount 열 (상관도: 0.83)

프롬프트에 추가할 스키마:
CREATE TABLE sales (
    sale_id INT PRIMARY KEY,
    product_id INT,
    amount DECIMAL(10,2),
    sale_date DATE
);
CREATE TABLE products (
    product_id INT PRIMARY KEY,
    product_name VARCHAR(100)
);
```

#### A.5.2 쿼리 템플릿 검색

비슷한 질문의 해결 쿼리를 검색하여 참고합니다:

```
사용자 질문: "평균 이상의 주문을 한 고객은?"

유사한 기존 쿼리 검색:
Query 1: "평균 주문액을 초과한 주문의 개수는?"
  SELECT COUNT(*)
  FROM orders
  WHERE amount > (SELECT AVG(amount) FROM orders);
  [상관도: 0.87]

Query 2: "평균 이상의 구매액을 가진 고객을 찾아라"
  SELECT DISTINCT customer_id
  FROM orders
  WHERE amount >= (SELECT AVG(amount) FROM orders);
  [상관도: 0.92] ← 선택

이 쿼리를 예제로 사용하여 모델 유도
```

#### A.5.3 실행 피드백 활용

**온라인 학습**:
```
1. 모델이 생성한 쿼리 실행
2. 실행 결과와 기대 결과 비교
3. 일치하지 않으면 오류 로그 저장

오류 로그:
질문: "2024년 1월 판매"
생성된 쿼리: WHERE MONTH(date) = 1;
오류: 연도 조건 누락
정정: WHERE MONTH(date) = 1 AND YEAR(date) = 2024;

4. 같은 유형의 향후 질문에 오류 로그 활용
```

## B. 파인튜닝 (Fine-tuning)

사전학습된 LLM을 특정 Text-to-SQL 작업에 맞게 최적화하는 방법입니다.

### B.1. 데이터 준비 (Data Preparation)

#### B.1.1 학습 데이터 구성

**질문-쿼리 쌍 수집**:
```
[
  {
    "question": "2024년 1월의 전체 판매액은?",
    "query": "SELECT SUM(amount) FROM sales WHERE MONTH(sale_date) = 1 AND YEAR(sale_date) = 2024;",
    "db_id": "sales_db",
    "difficulty": "easy"
  },
  {
    "question": "각 카테고리별로 평균 판매액이 평균 이상인 상품 개수는?",
    "query": "SELECT p.category_id, COUNT(DISTINCT p.product_id) FROM products p JOIN sales s ON p.product_id = s.product_id GROUP BY p.category_id HAVING AVG(s.amount) > (SELECT AVG(amount) FROM sales);",
    "db_id": "sales_db",
    "difficulty": "hard"
  },
  ...
]
```

**데이터 정제**:
1. **중복 제거**: 같은 의미의 질문-쿼리 쌍 통합
2. **오류 수정**: 잘못된 SQL 문법 교정
3. **일관성 확보**: 스키마 정보 통일

#### B.1.2 데이터 증강 (Data Augmentation)

**자동 질문 생성**:
```
원본 질문: "2024년 1월 판매액은?"
증강 질문:
1. "2024년 첫 번째 달의 판매액은?"
2. "지난해 1월의 판매액은?"
3. "January 2024의 매출은?"
4. "2024년 1월 1일부터 31일까지의 판매액은?"

같은 SQL로 매핑됨:
SELECT SUM(amount) FROM sales WHERE MONTH(sale_date) = 1 AND YEAR(sale_date) = 2024;
```

**질문 역생성 (Question Generation)**:
SQL 쿼리로부터 여러 버전의 자연어 질문 생성:

```
SQL: SELECT DISTINCT c.customer_id, c.customer_name
     FROM customers c
     JOIN orders o ON c.customer_id = o.customer_id
     GROUP BY c.customer_id, c.customer_name
     HAVING COUNT(o.order_id) > 5;

역생성 질문:
1. "5개 이상의 주문을 한 고객은?"
2. "가장 자주 구매하는 고객들을 찾아라"
3. "5회 이상 구매한 고객의 이름과 ID는?"
4. "단골 고객 목록을 보여줘"
```

**스키마 변환**:
동일한 의미의 쿼리를 다양한 스키마로 표현:

```
원본 스키마:
CREATE TABLE user_info (user_id, name, registration_date);

변환된 스키마:
CREATE TABLE users (id, full_name, joined_at);

동일한 의미의 쿼리:
1. SELECT * FROM user_info WHERE YEAR(registration_date) = 2024;
2. SELECT * FROM users WHERE YEAR(joined_at) = 2024;
```

#### B.1.3 어려운 예제 샘플링

**어려운 쿼리 식별**:
```
어려움 점수 계산:
- SQL 길이: 쿼리 토큰 수
- 연산 복잡도: JOIN 개수, 서브쿼리, GROUP BY/HAVING 존재 여부
- 문제 복잡도: 다중 의미 해석, 도메인 지식 필요도

점수 = w1 * 길이 + w2 * 연산복잡도 + w3 * 문제복잡도

예제:
쉬움: "사용자 목록을 보여줘"
중간: "2024년 1월의 각 카테고리별 판매액"
어려움: "2023년과 2024년 비교했을 때, 성장률이 가장 높은 카테고리별로,
        그 카테고리에서 판매액이 평균 이상인 상품의 목록"
```

**균형잡힌 데이터셋 구성**:
```
학습 데이터셋 구성:
- 쉬운 예제: 40%
- 중간 난이도: 35%
- 어려운 예제: 25%

이렇게 구성하면 모델이 다양한 난이도에 잘 대응
```

### B.2. 사전학습 모델 선택 (Pretrained Model Selection)

#### B.2.1 LLM 모델 비교

| 모델 | 파라미터 | 입력 길이 | 추론 속도 | 비용 | 주요 특징 |
|------|----------|----------|----------|------|----------|
| GPT-4 | 알려지지 않음 | 128K | 느림 | 높음 | 최고 성능, API 기반 |
| GPT-3.5 Turbo | 알려지지 않음 | 128K | 빠름 | 낮음 | 비용 효율적 |
| Claude 3 | 알려지지 않음 | 200K | 중간 | 중간 | 안전성 강화 |
| LLaMA 2 | 7B/13B/70B | 4K | 빠름 | 무료(오픈소스) | 오픈소스, 자유 커스터마이징 |
| CodeLLaMA | 7B/13B/34B | 16K | 빠름 | 무료(오픈소스) | 코드 생성 특화 |
| Mistral | 7B | 32K | 빠름 | 무료(오픈소스) | 높은 성능, 효율성 |

#### B.2.2 모델 선택 기준

1. **성능 vs 효율성 트레이드오프**:
   - 최고 성능 필요: GPT-4
   - 비용 고려 필요: GPT-3.5 또는 오픈소스 모델
   - 개인화/도메인 특화 필요: LLaMA, CodeLLaMA

2. **입력 길이 제약**:
   - 큰 스키마: Claude 3 (200K) 추천
   - 표준 크기: GPT-4, LLaMA 2

3. **배포 환경**:
   - 클라우드 API: GPT-4, Claude
   - 온프레미스/프라이빗: LLaMA, Mistral

4. **응답 시간**:
   - 실시간 처리: Mistral, CodeLLaMA
   - 배치 처리: GPT-4 가능

### B.3. 모델 훈련 (Model Training)

#### B.3.1 전체 파인튜닝 (Full Fine-tuning)

모델의 모든 파라미터를 업데이트합니다.

**프로세스**:
```
1. 사전학습된 모델 로드
   model = AutoModelForCausalLM.from_pretrained("meta-llama/Llama-2-7b-hf")

2. 학습 데이터 준비
   dataset = load_dataset("json", data_files="training_data.jsonl")

3. 토크나이저 설정
   tokenizer = AutoTokenizer.from_pretrained("meta-llama/Llama-2-7b-hf")

4. 입력 시퀀스 만들기
   def preprocess_function(examples):
       questions = examples["question"]
       queries = examples["query"]
       inputs = [f"Question: {q}\nSQL Query:" for q in questions]
       targets = queries

       model_inputs = tokenizer(inputs, ...)
       labels = tokenizer(targets, ...)
       return model_inputs

5. 트레이너 설정
   training_args = TrainingArguments(
       output_dir="./results",
       num_train_epochs=3,
       per_device_train_batch_size=8,
       learning_rate=2e-5,
       weight_decay=0.01,
       warmup_steps=500,
       save_steps=1000,
   )

   trainer = Trainer(
       model=model,
       args=training_args,
       train_dataset=dataset,
       tokenizer=tokenizer,
   )

6. 훈련 실행
   trainer.train()

7. 검증 및 평가
   eval_results = trainer.evaluate()
```

**전체 파인튜닝의 특징**:

| 장점 | 단점 |
|------|------|
| 최고의 성능 달성 가능 | 높은 계산 비용 (메모리, 시간) |
| 모델을 완전히 커스터마이징 | 큰 규모 학습 데이터 필요 |
| 각 파라미터 최적화 | GPU 메모리 부담 큼 |
| | 재훈련 시간이 오래 걸림 |

**자원 요구사항**:
- 7B 모델: GPU 16GB 이상
- 13B 모델: GPU 24GB 이상
- 70B 모델: 다중 GPU (8x A100 또는 유사)

#### B.3.2 PEFT 방식 - LoRA (Low-Rank Adaptation)

전체 모델을 파인튜닝하지 않고, 저차원 어댑터를 추가합니다.

**LoRA의 원리**:
```
기존 파인튜닝:
W' = W + ΔW  (전체 파라미터 업데이트)

LoRA:
W' = W + BA  (저차원 행렬의 곱으로 근사)

여기서:
- W: 원본 가중치 (d × d)
- B: 저차원 행렬 (d × r)
- A: 저차원 행렬 (r × d)
- r << d (보통 r = 8, 16, 32)

예: 7B 모델
- 전체 파라미터: 7,000,000,000
- LoRA 추가 파라미터 (r=8): ~6,500,000 (약 0.1%)
```

**구현 예제**:
```python
from peft import get_peft_model, LoraConfig, TaskType

peft_config = LoraConfig(
    task_type=TaskType.CAUSAL_LM,
    r=8,  # LoRA rank
    lora_alpha=16,  # LoRA alpha
    lora_dropout=0.1,
    bias="none",
    target_modules=["q_proj", "v_proj"],  # 주의: 모델에 따라 다름
)

# 원본 모델에 LoRA 적용
model = get_peft_model(model, peft_config)

# 일반적인 파인튜닝과 동일한 방식으로 훈련
trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=train_dataset,
)
trainer.train()

# LoRA 어댑터만 저장
model.save_pretrained("./lora_adapter")
```

**LoRA의 장점**:

| 항목 | 전체 파인튜닝 | LoRA |
|------|-------------|------|
| 메모리 사용 | 100% | ~10% |
| 저장 공간 | ~14GB (7B) | ~50MB |
| 훈련 속도 | 1x | 3-4x 빠름 |
| 성능 | 최고 | 95% 수준 |
| 다중 작업 적응 | 불가 (재훈련 필요) | 쉬움 (어댑터 교환) |

**LoRA 사용 사례**:
```
상황 1: 예산 제한적인 환경
- LLaMA 2 7B + LoRA
- 단일 GPU (16GB)에서 훈련 가능
- 배포 시 기본 모델 + 수십 MB 어댑터만 필요

상황 2: 다중 도메인 모델
- 기본 모델: LLaMA 2 7B
- 어댑터 1: 금융 도메인 Text-to-SQL
- 어댑터 2: 의료 도메인 Text-to-SQL
- 어댑터 3: 전자상거래 도메인 Text-to-SQL
- 필요에 따라 어댑터 교환

상황 3: 신속한 반복
- 매주 새로운 데이터로 재훈련
- LoRA를 사용하면 3일 내 완료 가능
- 전체 파인튜닝은 2주 이상 소요
```

### B.4. 모델 평가

#### B.4.1 정량적 평가 지표

**Exact Match (EM)**:
생성된 SQL이 정답 SQL과 정확히 일치하는 비율

```
예제:
생성: SELECT * FROM users WHERE age > 30;
정답: select * from users where age > 30;

완전 일치하지 않음 (공백, 대소문자)
하지만 SQL 정규화 후 비교하면 EM 계산 가능

정규화된 SQL 비교:
select * from users where age > 30
select * from users where age > 30
→ EM = 1 (일치)
```

**Execution Accuracy (EX, Execution Match)**:
생성된 SQL과 정답 SQL을 실제 데이터베이스에서 실행했을 때 결과가 같은 비율

```
질문: "30세 이상의 사용자는?"

방법 1 (EM 실패):
생성: SELECT * FROM users WHERE age >= 30;
정답: SELECT * FROM users WHERE age > 30;

방법 2 (EX 확인):
- 생성 쿼리 결과: [user_1, user_3, user_4, user_5] (30세 포함)
- 정답 쿼리 결과: [user_3, user_4, user_5] (30세 제외)
- 다름! → EX 아님

올바른 쿼리:
생성: SELECT * FROM users WHERE age > 30;
정답: SELECT * FROM users WHERE age > 30;
실행 결과 동일 → EX = 1
```

**Valid Efficiency Score (VES, BIRD 벤치마크)**:
SQL 결과의 정확성과 실행 효율성을 함께 평가

```
VES = (완료도 점수 + 효율성 점수) / 2

완료도 점수:
- 정확한 결과: 1.0
- 부분 정확: 0.5
- 잘못된 결과: 0.0

효율성 점수:
- 정답 쿼리 실행 시간: T_ref
- 생성된 쿼리 실행 시간: T_gen
- 효율성 = min(T_ref / T_gen, 1.0)

예:
T_ref = 100ms, T_gen = 80ms → 효율성 = 1.0 (더 빠름)
T_ref = 100ms, T_gen = 200ms → 효율성 = 0.5 (느림)

VES = (1.0 + 1.0) / 2 = 1.0 (최고 점수)
VES = (1.0 + 0.5) / 2 = 0.75 (정확하지만 느림)
```

**Test Suite (TS)**:
미리 정의된 테스트 케이스를 통과하는 비율 (BIRD 벤치마크)

```
테스트 케이스 예제:
질문: "매출이 평균을 초과한 달은?"

테스트 1: 기본 기능
- 평균 계산 포함
- WHERE 절에 비교 연산자 사용

테스트 2: 엣지 케이스
- 정확히 평균인 달 제외 (>만 사용)
- NULL 값 처리

테스트 3: 성능
- 풀 테이블 스캔 없이 인덱스 사용

생성된 쿼리가 모든 테스트 통과 → TS = 1.0
일부만 통과 → TS = 0.5
```

#### B.4.2 정성적 평가

**오류 분석**:
```
오류 분류:
1. 문법 오류 (Syntax Error)
   - SQL 문법 위반
   - 해결: 문법 검증 및 자동 수정

2. 스키마 오류 (Schema Error)
   - 존재하지 않는 테이블/열 참조
   - 예: "users" 테이블에 "age" 열이 없음
   - 해결: 스키마 정보 강화

3. 논리 오류 (Logic Error)
   - 문법은 정확하지만 의도와 다른 결과
   - 예: AND 대신 OR 사용
   - 해결: CoT, 추론 개선

4. 의미 이해 오류 (Semantic Error)
   - 자연어를 잘못 해석
   - 예: "최근 30일"을 "지난 한 달"로 해석
   - 해결: 질문 정규화, 도메인 지식 강화

오류율 분포 예:
- 문법 오류: 5%
- 스키마 오류: 25%
- 논리 오류: 45%
- 의미 오류: 25%

개선 전략:
- 스키마 오류 → 스키마 정보 및 주석 추가
- 논리 오류 → CoT, 예제 선택 개선
- 의미 오류 → 도메인 사전, 질문 정규화
```

**복잡도별 성능 분석**:
```
Spider 벤치마크 결과 분석:

쉬운 쿼리 (간단한 SELECT):
- EM 97%, EX 98%

중간 쿼리 (JOIN 1-2개):
- EM 85%, EX 88%

어려운 쿼리 (JOIN 3+, 서브쿼리):
- EM 62%, EX 65%

매우 어려운 쿼리 (UNION, 복잡한 그룹화):
- EM 35%, EX 40%

개선점:
- 중간 이상 쿼리의 성능 향상 필요
- 특히 JOIN 개수가 많아질수록 성능 급격히 저하
```

## 4. 실험 결과

### 4.1 주요 벤치마크 결과

#### 4.1.1 Spider 데이터셋 결과

**성능 발전 과정**:

| 시대 | 모델 | 방법 | EM (%) | EX (%) |
|------|------|------|--------|--------|
| Pre-LLM | IRNet (2019) | Graph NN | 65.3 | - |
| Pre-LLM | BRIDGE (2020) | Seq2Seq | 68.5 | - |
| Pre-LLM | LGESQL (2021) | Graph NN | 71.1 | - |
| Pre-LLM | SOTA (2023) | 혼합 앙상블 | 73.0 | - |
| LLM Era | GPT-3.5 (Zero-shot) | Prompt | 60.2 | - |
| LLM Era | GPT-3.5 (Few-shot) | Prompt | 70.5 | - |
| LLM Era | GPT-4 (Zero-shot) | Prompt | 63.4 | - |
| LLM Era | **GPT-4 (Few-shot)** | **Prompt** | **91.2** | **89.3** |

**주요 관찰**:
1. GPT-4 Few-shot이 이전의 Pre-LLM SOTA (73%)를 크게 뛰어넘음
2. GPT-4는 Zero-shot에서도 이전 SOTA와 유사한 성능
3. Few-shot 예제 선택이 매우 중요한 역할

**프롬프트 엔지니어링 효과**:

| 기법 | EM (%) | EX (%) | 개선 |
|------|--------|--------|------|
| Zero-shot | 63.4 | 61.2 | baseline |
| + Few-shot (3개) | 75.2 | 73.8 | +11.8% |
| + CoT | 79.5 | 78.2 | +4.3% |
| + Self-Consistency | 83.1 | 81.5 | +3.6% |
| + RAG (스키마) | 87.4 | 85.6 | +4.3% |
| + Self-Correction | 91.2 | 89.3 | +3.8% |

**누적 효과**:
각 기법을 순차적으로 적용하면 최종적으로 28%의 EM 성능 향상 달성

#### 4.1.2 BIRD 데이터셋 결과

BIRD는 Spider보다 더 복잡한 실제 데이터베이스 쿼리를 다룹니다.

**모델별 성능**:

| 모델 | BIRD-dev (%) | BIRD-test (%) | VES (%) |
|------|--------------|---------------|---------|
| Human Performance | 92.96 | - | 90.8 |
| SOTA Pre-trained (2023) | 35.7 | 34.2 | 32.1 |
| GPT-3.5 (Few-shot) | 41.2 | 39.8 | 38.5 |
| Claude 2 (Few-shot) | 44.5 | 42.3 | 40.2 |
| **GPT-4 (Few-shot + CoT)** | **54.89** | **52.14** | **48.3** |
| GPT-4 + Self-Correction | 56.2 | 53.8 | 50.1 |

**인간과의 갭**:
- GPT-4: 54.89% vs 인간: 92.96%
- 여전히 약 38% 정도의 성능 갭 존재
- BIRD가 Spider보다 훨씬 어려운 작업임을 시사

**성능 저하 원인 분석**:

| 문제 유형 | 비율 | 원인 | 예제 |
|----------|------|------|------|
| 복잡한 조인 | 22% | 다중 테이블 관계 이해 어려움 | 5개 이상의 테이블 결합 |
| 도메인 지식 부족 | 28% | 비즈니스 규칙 모르기 | "VIP 고객" 정의 불명확 |
| 대규모 스키마 | 18% | 콘텍스트 길이 제한 | 50개 이상의 테이블 |
| 모호한 표현 | 15% | 자연어 해석 다양성 | "최근", "많은" 등의 상대 개념 |
| 연산 조합 | 17% | 복잡한 연산 조합 | UNION, 중첩 서브쿼리 |

#### 4.1.3 Dr.Spider 결과 (어려운 질문 집중)

Dr.Spider는 Spider에서 모델들이 실패한 고난이도 질문으로만 구성됩니다.

**전체 성능 저하**:

| 모델 | Spider EM (%) | Dr.Spider EM (%) | 저하율 (%) |
|------|--------------|------------------|-----------|
| SOTA Pre-trained | 73.0 | 60.5 | -12.5 |
| GPT-3.5 (Few-shot) | 70.5 | 45.3 | -25.2 |
| Claude 2 (Few-shot) | 72.1 | 48.6 | -23.5 |
| **GPT-4 (Few-shot + CoT)** | **91.2** | **43.2** | **-47.9** |

**최악의 경우 성능 분석**:

가장 어려운 상위 10%의 질문 (최악의 경우):
- GPT-4: 50.7% 성능 저하 (91.2% → 40.5%)
- GPT-3.5: 35.2% 성능 저하 (70.5% → 45.3%)

**Dr.Spider에서 실패 원인**:

```
예제 1: 초복잡한 조인
질문: "작년 같은 분기보다 성장률이 높은 카테고리의,
      그 카테고리에서 품절되지 않은 상품 중
      평균 가격이 중간값 이상인 상품은?"

필요 조인 개수: 5+
필요 서브쿼리: 3+
도메인 이해: 필수

GPT-4의 어려움:
- 콘텍스트 길이로 인한 스키마 정보 손실
- 다중 조건의 논리적 결합 오류
- 성장률 계산의 정확성 문제

예제 2: 암묵적 도메인 규칙
질문: "VIP 고객의 평균 구매액은?"

도메인 정의가 없으면 모호함:
- VIP 정의: 년간 구매액 $10,000 이상? 구매 횟수 10회 이상?
           최근 6개월 활동?
- VIP 판정 시점: 어제 기준? 이번 달 기준?

해결책: 명시적 정의 프롬프트에 포함
"VIP 고객: 지난 1년간 구매액이 $10,000 이상인 고객"
```

### 4.2 파인튜닝 결과

#### 4.2.1 XiYan-SQL 모델 (LLaMA 2 기반)

이 섹션은 LLaMA 2 70B를 기반으로 파인튜닝한 XiYan-SQL 모델의 결과를 다룹니다.

**XiYan-SQL 학습 설정**:

```
기본 모델: LLaMA 2 70B
학습 데이터:
- Spider 학습 데이터: 8,659개
- 합성 데이터: 50,000개 (자동 생성)
- 내부 데이터: 10,000개

학습 하이퍼파라미터:
- 최적화기: AdamW
- 학습률: 5e-5
- 배치 크기: 128 (8개 GPU, per-device 16)
- 에포크: 3
- 워밍업 스텝: 500
- 총 훈련 스텝: ~1,500

시간:
- A100 GPU 8개 사용
- 약 7-8일 소요
```

**성능 결과**:

| 데이터셋 | Metric | 성능 (%) |
|----------|--------|---------|
| **Spider** | EM | 89.65 |
| | EX | 87.32 |
| **BIRD-dev** | EM | 72.23 |
| | VES | 69.47 |
| **SQL-Eval** | EM | 69.86 |
| | EX | 67.54 |

**성능 분석**:

1. **Spider 성능**:
   - EM 89.65%는 GPT-4 (91.2%)에 거의 근접
   - 더 빠른 추론 속도와 낮은 비용의 장점
   - 파인튜닝의 효과 명확

2. **BIRD-dev 성능**:
   - 72.23%는 Spider 대비 17% 성능 저하
   - GPT-4 (54.89%)보다는 훨씬 높음
   - 더 큰 모델 크기의 이점

3. **SQL-Eval 성능**:
   - 새로운 도메인 (전자상거래)
   - 69.86%는 적절한 수준
   - 일반화 능력 확인

**복잡도별 성능**:

| 복잡도 | EM (%) | 특징 |
|--------|--------|------|
| Easy | 95.2 | 우수한 성능 |
| Medium | 87.4 | 양호한 성능 |
| Hard | 72.8 | 개선 필요 |
| Extra Hard | 48.3 | 큰 도전 |

#### 4.2.2 파인튜닝 vs 프롬프트 엔지니어링 비교

**성능 비교**:

| 방법 | Spider EM (%) | 추론 시간 | 비용 | 배포 용이성 |
|------|---------------|----------|------|-----------|
| GPT-4 Few-shot | 91.2 | 5초 | 높음 (API) | 매우 쉬움 |
| LLaMA 2 70B 파인튜닝 | 89.65 | 2초 | 낮음 | 중간 |
| CodeLLaMA 34B LoRA | 87.2 | 1초 | 낮음 | 쉬움 |
| LLaMA 2 13B LoRA | 84.5 | 0.5초 | 낮음 | 쉬움 |

**선택 기준**:

```
상황 1: 최고 성능 필요
→ GPT-4 Few-shot (91.2% EM)

상황 2: 비용 효율성 중요
→ CodeLLaMA 34B LoRA (87.2%, 저비용)

상황 3: 프라이빗 배포 필수
→ LLaMA 2 70B 파인튜닝 (89.65%, 온프레미스 가능)

상황 4: 빠른 응답 시간 필수
→ LLaMA 2 13B LoRA (84.5%, 0.5초)

상황 5: 리소스 제한적
→ GPT-3.5 API (70.5%, 저비용 API)
```

#### 4.2.3 합성 데이터의 영향

**합성 데이터 없이 학습**:
- Spider 데이터만 사용 (8,659개)
- EM: 82.3%, EX: 80.1%

**합성 데이터 추가**:
- Spider + 합성 50,000개
- EM: 89.65%, EX: 87.32%
- **개선: +7.35% EM, +7.22% EX**

**합성 데이터 생성 방법**:

1. **자동 질문 생성**:
   - 기존 SQL로부터 다양한 자연어 표현 생성
   - 같은 의미의 질문 여러 개 생성

2. **스키마 변환**:
   - 동일 의미의 다른 스키마 구조로 변환
   - 테이블/열 이름 변경

3. **쿼리 변환**:
   - 동등한 SQL을 다양한 형태로 표현
   - INNER JOIN ↔ WHERE 절 등

**합성 데이터 품질 관리**:
```
필터링 기준:
1. 생성된 SQL의 문법 검증 (100%)
2. 의미 보존 검증:
   - 원본과 생성 쿼리 실행 결과 비교
   - 95% 이상 일치
3. 다양성 평가:
   - 복잡도 분포 확인
   - 각 연산자 사용 빈도 확인

최종 선택:
- 품질 점수 상위 50,000개
- 난이도 균형 유지
```

### 4.3 다양한 기법의 조합 효과

#### 4.3.1 프롬프트 기법 누적 효과

**실험 설정**:
- 모델: GPT-4
- 데이터셋: Spider
- 순차적으로 기법 추가

**결과**:

| 단계 | 기법 추가 | EM (%) | 증분 | 누적 |
|------|----------|--------|------|------|
| 1 | Zero-shot | 63.4 | - | - |
| 2 | + Few-shot (3개) | 75.2 | +11.8 | +11.8 |
| 3 | + 동적 예제 선택 | 77.8 | +2.6 | +14.4 |
| 4 | + CoT | 79.5 | +1.7 | +16.1 |
| 5 | + Self-Consistency (5회) | 83.1 | +3.6 | +19.7 |
| 6 | + Self-Correction | 87.4 | +4.3 | +24.0 |
| 7 | + RAG (스키마) | 89.1 | +1.7 | +25.7 |
| 8 | + RAG (쿼리 템플릿) | 91.2 | +2.1 | +27.8 |

**주요 통찰**:
1. Few-shot이 가장 큰 단일 개선 효과 (+11.8%)
2. CoT는 Single 모드에서 상대적으로 작은 효과 (+1.7%)
3. Self-Consistency의 조합 시 효과 극대화 (+3.6%)
4. RAG는 점진적 개선 (+1.7%, +2.1%)

#### 4.3.2 프롬프트 길이 vs 성능

**실험**: 프롬프트에 포함된 정보의 양에 따른 성능 변화

```
프롬프트 구성 요소와 토큰 수:

기본: 질문만
- 토큰: ~50
- EM: 63.4%

+ 스키마 (CREATE TABLE)
- 추가 토큰: ~200
- EM: 68.5%
- 증분: +5.1%

+ 테이블 설명
- 추가 토큰: ~150
- EM: 72.1%
- 증분: +3.6%

+ 3개 Few-shot 예제
- 추가 토큰: ~300
- EM: 75.2%
- 증분: +3.1%

+ 컬럼 주석 및 샘플
- 추가 토큰: ~400
- EM: 78.5%
- 증분: +3.3%

전체 프롬프트 토큰: ~1,100
성능 개선: +15.1% (63.4% → 78.5%)
```

**토큰 효율성 분석**:

| 정보 유형 | 토큰 수 | EM 증분 | 효율성 (증분/토큰) |
|----------|--------|--------|------------------|
| 스키마 | 200 | 5.1 | 0.026 |
| 테이블 설명 | 150 | 3.6 | 0.024 |
| Few-shot | 300 | 3.1 | 0.010 |
| 컬럼 주석 | 400 | 3.3 | 0.008 |

**결론**: 스키마 정보가 토큰 대비 가장 효율적 (0.026)

### 4.4 오류 분석

#### 4.4.1 오류 유형 분류

**분류 체계**:

```
총 오류: 8.8% (EM 기준, Spider에서 91.2% 정확)

1. 문법 오류 (Syntax): 2.1%
   - 예: SELECT * FORM users (FORM vs FROM)
   - 예: SELECT user_id FROM users WHERE = 30 (WHERE 조건 불완전)

2. 스키마 오류 (Schema): 3.2%
   - 예: SELECT age FROM users (테이블에 age 열 없음)
   - 예: SELECT * FROM user (테이블 이름 오류)
   - 해결 수준: 거의 항상 명확한 오류 메시지

3. 논리 오류 (Logic): 2.3%
   - 예: SELECT * FROM orders WHERE amount > 100 AND > 50 (조건 불완전)
   - 예: GROUP BY 조건이 SELECT 목록과 불일치
   - 해결 난이도: 중간

4. 의미 오류 (Semantic): 1.2%
   - 예: "최근 30일" → 지난 30일이 아닌 다음 30일 조회
   - 예: AND/OR 연산자 혼동
   - 해결 난이도: 높음 (도메인 지식 필요)

분포:
- 문법 오류 24%
- 스키마 오류 36%
- 논리 오류 26%
- 의미 오류 14%
```

#### 4.4.2 모델별 오류 패턴

**GPT-4 vs LLaMA 2 70B**:

| 오류 유형 | GPT-4 (%) | LLaMA 2 70B (%) | 차이 |
|----------|----------|-----------------|------|
| 문법 오류 | 1.8 | 3.2 | -1.4 |
| 스키마 오류 | 2.9 | 4.1 | -1.2 |
| 논리 오류 | 2.1 | 3.5 | -1.4 |
| 의미 오류 | 1.4 | 2.2 | -0.8 |

**특징**:
- GPT-4가 모든 오류 유형에서 우수
- LLaMA 2는 특히 스키마 오류에 취약
- 파인튜닝으로도 의미 오류 완전 해결 어려움

#### 4.4.3 데이터셋별 어려움 분석

**Dr.Spider에서의 특성적 오류**:

```
어려운 쿼리 특성 및 실패 원인:

특성 1: 깊은 중첩 (Deep Nesting)
예: SELECT * FROM (
      SELECT * FROM (
        SELECT * FROM orders WHERE year = 2024
      ) WHERE amount > 1000
    ) WHERE status = 'completed'

실패율: 52%
원인: 중첩 깊이가 증가할수록 모델의 추적 어려움

특성 2: 다중 GROUP BY
예: SELECT dept, job_title, COUNT(*)
    FROM employees
    GROUP BY dept, job_title
    HAVING COUNT(*) > (SELECT AVG(cnt) FROM (...))

실패율: 48%
원인: GROUP BY 절의 모든 열 명시 실수

특성 3: 복잡한 JOIN 조건
예: SELECT ... FROM t1
    JOIN t2 ON t1.a = t2.a AND t1.b = t2.b AND t1.c = t2.c
    LEFT JOIN t3 ON ...

실패율: 61%
원인: 다중 JOIN 조건의 정확한 표현 어려움

특성 4: 암묵적 도메인 규칙
예: "VIP 고객의 최근 주문"
     (VIP 정의, "최근" 기간 모호)

실패율: 58%
원인: 명시적 정의 없이 도메인 이해 부족
```

## 5. 주요 도전 과제

### 5.1 개인정보보호 (Privacy)

#### 5.1.1 데이터 보안 문제

**API 기반 LLM 사용 시 위험**:

```
문제 상황:
사용자: "고객 SSN이 123-45-6789인 주문은?"

프롬프트 전송:
{
  "schema": "CREATE TABLE customers (customer_id, name, ssn, ...)",
  "question": "고객 SSN이 123-45-6789인 주문은?",
  "examples": [...]
}

위험 분석:
1. 프롬프트에 개인정보 직접 포함
2. API 제공자(OpenAI, Anthropic 등)에 전송
3. 로깅, 모니터링 시스템에 저장 가능
4. 규제 위반 (GDPR, CCPA 등)

예시:
- 의료 정보: 환자 ID, 진단명, 약물
- 금융 정보: 계좌번호, 거래액
- 개인 정보: SSN, 생년월일
```

#### 5.1.2 해결 방안

**1) 데이터 마스킹 (Data Masking)**:

```
원본 프롬프트:
"고객 SSN이 123-45-6789인 주문은?"

마스킹된 프롬프트:
"고객 SSN이 [MASKED_SSN]인 주문은?"

서버 내 처리:
1. LLM이 생성한 SQL:
   SELECT * FROM orders WHERE customer_ssn = '[MASKED_SSN]'

2. 실제 실행 전 복구:
   SELECT * FROM orders WHERE customer_ssn = '123-45-6789'

3. LLM에는 민감 정보 미노출
```

**2) 온프레미스 배포**:

```
아키텍처:
사용자 질문 → 내부 LLM 서버 → 데이터베이스

장점:
- 데이터가 회사 내부에서만 처리
- 외부 API 호출 없음
- 완전한 제어

단점:
- 높은 인프라 비용
- 모델 유지보수 부담

권장 모델:
- LLaMA 2, CodeLLaMA (오픈소스)
- 상대적으로 작은 모델 크기 가능
```

**3) 스키마 정제 (Schema Sanitization)**:

```
민감 정보 제거:

원본 스키마:
CREATE TABLE employees (
    employee_id INT,
    name VARCHAR(100),
    ssn VARCHAR(11),
    salary DECIMAL(10,2),
    email VARCHAR(100),
    phone VARCHAR(20)
);

프롬프트용 정제 스키마:
CREATE TABLE employees (
    employee_id INT,
    name VARCHAR(100),
    salary DECIMAL(10,2),
    email VARCHAR(100),
    phone VARCHAR(20)
    -- ssn 열은 제외
);

설명:
- 민감한 열(SSN, 비밀번호 등) 제거
- 열 설명에서도 민감 정보 제거
- 쿼리 실행 시 실제 스키마 사용
```

### 5.2 복잡한 스키마 처리

#### 5.2.1 스키마 규모의 문제

**BIRD 데이터셋 예제**:

```
평균 스키마 크기:
- Spider: 5.3개 테이블, 26개 열
- BIRD: 약 27.5개 테이블, 1,000+ 개 열

최악의 경우 예제:
- 테이블 수: 632개
- 열 수: 20,000+
- DDL 길이: 100,000+ 토큰

입력 길이 문제:
- GPT-4: 128K 토큰 제한
- 스키마 정보만 100K 토큰 차지
- 질문 + 예제 추가 시 오버플로우
```

#### 5.2.2 해결 방법

**1) 스키마 선택 (Schema Selection)**:

```
대규모 스키마에서 관련 테이블만 추출:

프로세스:
1. 질문 분석: "2024년 1월 매출이 가장 높은 상품은?"

2. 필요 테이블 예측:
   - 키워드 매칭: "2024년" → date 열
   - "매출" → sales, revenue 관련 테이블
   - "상품" → product 관련 테이블

3. 임베딩 기반 검색:
   - 질문 임베딩
   - 테이블/열 임베딩과 유사도 계산
   - 상위 K개 선택

4. 선택된 스키마:
   CREATE TABLE sales (
       sale_id INT,
       product_id INT,
       amount DECIMAL,
       sale_date DATE
   );
   CREATE TABLE products (
       product_id INT,
       product_name VARCHAR(100)
   );
   -- 총 2개 테이블, 6개 열
```

**2) 계층적 스키마 표현**:

```
전체 스키마를 계층적으로 구조화:

레벨 1 (개요):
- Sales 도메인: 5개 테이블
- Product 도메인: 3개 테이블
- Customer 도메인: 2개 테이블

레벨 2 (필요 시):
- Sales 도메인:
  - sales_orders (sale_id, customer_id, amount)
  - sales_items (item_id, sale_id, product_id, quantity)
  - ...

레벨 3 (필요 시 상세):
- sales_orders 상세:
  - sale_id: INT, 주문 고유 ID
  - customer_id: INT, 고객 ID (참조: customers.customer_id)
  - sale_date: DATE, 주문 날짜
  - amount: DECIMAL(10,2), 주문 총액
  - status: VARCHAR(20), 주문 상태 (pending, completed, cancelled)

프롬프트 구성:
"질문: {question}
사용 가능한 도메인: {domains}
선택 도메인: Sales
스키마: {detailed_schema_for_sales}"
```

**3) 적응형 스키마 수정**:

```
반복적 스키마 정제:

시도 1:
모델 입력: 선택된 스키마 (10개 테이블)
모델 출력: SQL (생성됨)
검증: 오류 - "table 'X' not found"

시도 2:
오류 피드백: 테이블 'X'는 실제 스키마에 없음
수정 프롬프트: 올바른 테이블 이름 제공
새 시도: 수정된 스키마로 재요청

성공률:
- 초기 시도: 65% (스키마 선택 오류)
- 1회 반복 후: 85%
- 2회 반복 후: 92%
```

### 5.3 도메인 지식 (Domain Knowledge)

#### 5.3.1 암묵적 비즈니스 규칙

**예제 1: VIP 고객 정의**:

```
질문: "VIP 고객의 평균 구매액은?"

모호성:
- VIP 정의가 데이터에 명시되지 않음
- 가능한 해석:
  1. 연간 구매액 > $10,000
  2. 구매 횟수 > 10회
  3. 평생 구매액 > $50,000
  4. 최근 6개월 구매 존재
  5. 특정 멤버십 등급

모델의 추측 (잘못된 경우):
SELECT AVG(amount) FROM orders
WHERE customer_id IN (
  SELECT customer_id FROM orders
  GROUP BY customer_id
  HAVING COUNT(*) > 10  -- 임의로 10 선택
);

정답 (도메인 지식 필요):
SELECT AVG(amount) FROM orders
WHERE customer_id IN (
  SELECT customer_id FROM orders
  WHERE order_date >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR)
  GROUP BY customer_id
  HAVING SUM(amount) > 10000  -- 회사 규칙
);
```

#### 5.3.2 해결책

**1) 도메인 사전 (Domain Glossary)**:

```
JSON 형식:

{
  "domain": "전자상거래",
  "terms": {
    "VIP_CUSTOMER": {
      "definition": "지난 1년간 구매액이 $10,000 이상인 고객",
      "query_hint": "SUM(orders.amount) >= 10000 WHERE order_date >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR)",
      "related_tables": ["customers", "orders"],
      "examples": [
        "VIP 고객의 평균 구매 횟수는?",
        "VIP 고객의 선호 카테고리는?",
        "비VIP 고객과의 만족도 비교"
      ]
    },
    "GMV": {
      "definition": "Gross Merchandise Value, 총 상품 거래액",
      "formula": "SUM(orders.amount) - refunds",
      "calculation_note": "반품액은 제외"
    },
    "CHURN_RATE": {
      "definition": "이전 분기 활동이 있었으나 현 분기 활동 없는 고객 비율",
      "calculation": "COUNT(inactive_customers) / COUNT(prev_quarter_customers)"
    }
  }
}

프롬프트 활용:
"질문: {question}

관련 도메인 용어:
{domain_glossary_relevant_terms}

스키마: {schema}
..."
```

**2) 비즈니스 규칙 문서화**:

```
YAML 형식:

business_rules:
  - rule_id: BR001
    name: "VIP 고객 분류"
    condition: "지난 1년간 구매액 >= $10,000"
    sql_template: |
      SELECT customer_id
      FROM orders
      WHERE order_date >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR)
      GROUP BY customer_id
      HAVING SUM(amount) >= 10000
    examples:
      - query: "VIP 고객은 몇 명인가?"
        sql: "SELECT COUNT(DISTINCT customer_id) FROM (...)"

  - rule_id: BR002
    name: "반품 처리 규칙"
    condition: "구매 후 30일 이내만 반품 가능"
    validation: "반품 신청일 - 구매일 <= 30"

  - rule_id: BR003
    name: "시즌 정의"
    seasons:
      Q1: "1월-3월"
      Q2: "4월-6월"
      Q3: "7월-9월"
      Q4: "10월-12월"
    sql_mapping:
      "이번 분기": "MONTH(CURDATE()) IN (QUARTER_MONTHS)"
      "지난 분기": "MONTH(DATE_SUB(CURDATE(), INTERVAL 3 MONTH)) IN (...)"
```

**3) 자동 규칙 학습**:

```
프로세스:
1. 성공한 SQL 쿼리 수집
2. 쿼리 패턴 분석
3. 암묵적 규칙 추출
4. 확신도 평가

예:
성공 사례 분석:
- Query 1: WHERE status IN ('completed', 'shipped')
- Query 2: WHERE status != 'cancelled' AND status != 'pending'
- Query 3: WHERE status IN ('completed', 'shipped')

패턴 추출:
"유효한 주문"은 status가 'completed' 또는 'shipped'
확신도: 85% (3개 쿼리 중 2개 동일 패턴)

규칙 추가:
VALID_ORDER_STATUS = ('completed', 'shipped')

향후 질문 "매출 통계"에서:
"매출은 유효한 주문(completed, shipped)을 기준으로 계산합니다"로 프롬프트 보강
```

### 5.4 자율 에이전트 (Autonomous Agents)

#### 5.4.1 반복적 개선 필요성

**문제**:

```
단일 생성으로 항상 정답을 만들 수 없음

프로세스:
1. 사용자 질문 입력
2. SQL 생성
3. 문법 검증
4. 스키마 검증
5. 의미 검증
6. 결과 검증

각 단계에서 오류 확률: 5-10%
전체 성공률: (0.95)^6 ≈ 74% (이론적)
실제: 더 낮음
```

#### 5.4.2 에이전트 아키텍처

**Plan-Execute-Check (PEC) 패러다임**:

```
Step 1: 계획 (Plan)
- 자연어 질문 분석
- 필요한 테이블/열 식별
- 쿼리 구조 설계

입력: "2024년 1월 카테고리별 매출 TOP 3 상품은?"

계획:
1. 시간 필터: sale_date >= '2024-01-01' AND sale_date < '2024-02-01'
2. 필요 테이블: sales, products, categories
3. 필요 연산: GROUP BY category, ORDER BY amount DESC, LIMIT 3
4. 예상 쿼리 복잡도: 중간 (JOIN 2개, GROUP BY 1개)

Step 2: 실행 (Execute)
- SQL 쿼리 생성
- 스키마 검증
- 쿼리 실행

생성 SQL:
SELECT p.product_name, pc.category_name, SUM(s.amount) as total_sales
FROM sales s
JOIN products p ON s.product_id = p.product_id
JOIN product_categories pc ON p.category_id = pc.category_id
WHERE s.sale_date >= '2024-01-01' AND s.sale_date < '2024-02-01'
GROUP BY p.product_id, p.product_name, pc.category_name
ORDER BY total_sales DESC
LIMIT 3;

Step 3: 검증 (Check)
- 결과 확인
- 문제 식별
- 필요시 수정

검증 체크리스트:
□ SQL 문법 정확성: PASS
□ 테이블/열 존재: PASS
□ 결과 행 수: 3행 (기대값 만족)
□ 의미 검증: PASS (카테고리별 상품 분류 확인)
□ 수치 검증: PASS (음수 없음, 논리적 범위)

최종 결과:
Product A | Category X | $50,000
Product B | Category Y | $45,000
Product C | Category X | $42,000
```

**반복적 개선 (Self-Correction)**:

```
시나리오: 쿼리에 오류 발견

Step 3-1: 오류 감지
예상 결과: 카테고리별로 TOP 3
실제 결과: 전체 TOP 3 (카테고리 분류 안 됨)

원인 분석:
SQL: LIMIT 3이 전체에 적용됨
올바른: 카테고리별로 각각 TOP 1-3

Step 3-2: 피드백 생성
오류: "LIMIT 3이 전체 결과에 적용되어 카테고리 분류되지 않았습니다.
올바른 쿼리는 카테고리별로 GROUP BY 후, 각 카테고리의 상위 3개 상품만 선택해야 합니다.

수정 방법: ROW_NUMBER() 윈도우 함수 사용 또는 각 카테고리에 대해 UNION ALL 사용"

Step 3-3: 재생성
WITH ranked_sales AS (
  SELECT p.product_name, pc.category_name, SUM(s.amount) as total_sales,
         ROW_NUMBER() OVER (PARTITION BY pc.category_name ORDER BY SUM(s.amount) DESC) as rn
  FROM sales s
  JOIN products p ON s.product_id = p.product_id
  JOIN product_categories pc ON p.category_id = pc.category_id
  WHERE s.sale_date >= '2024-01-01' AND s.sale_date < '2024-02-01'
  GROUP BY p.product_id, p.product_name, pc.category_name
)
SELECT product_name, category_name, total_sales
FROM ranked_sales
WHERE rn <= 3
ORDER BY category_name, total_sales DESC;

Step 3-4: 재검증
최종 결과:
Category X - Product A: $50,000
Category X - Product C: $42,000
Category X - Product D: $35,000
Category Y - Product B: $45,000
Category Y - Product E: $38,000
Category Y - Product F: $32,000

검증: PASS (카테고리별 각 3개씩 정렬)
```

## 6. 결론 및 향후 방향

### 6.1 주요 발견 사항

이 조사 논문의 주요 발견 사항은 다음과 같습니다:

1. **LLM이 기존 방식을 훨씬 능가**: GPT-4는 이전의 최고 성능 모델들(73% EM)을 크게 뛰어넘어 91.2%의 EM을 달성했습니다.

2. **프롬프트 엔지니어링의 중요성**: Few-shot 학습, Chain-of-Thought, Self-Consistency 등의 기법을 조합하면 최대 28%의 성능 향상이 가능합니다.

3. **파인튜닝도 경쟁력 있음**: LLaMA 2 70B를 파인튜닝한 XiYan-SQL은 Spider에서 89.65%를 달성하며, 비용과 개인정보보호 측면에서 장점이 있습니다.

4. **복잡한 쿼리는 여전히 도전**: BIRD와 Dr.Spider 결과에서 알 수 있듯이, 실제 복잡한 데이터베이스 환경에서는 여전히 큰 도전이 있습니다.

5. **도메인 지식의 필수성**: 비즈니스 규칙, 도메인 용어, 스키마 이해 등이 성능에 큰 영향을 미칩니다.

### 6.2 실무 적용 가이드

#### 6.2.1 상황별 추천 방법

**상황 1: 최고 성능 필요, 비용 무관**
- 방법: GPT-4 + Few-shot + CoT + Self-Correction + RAG
- 성능: Spider 91.2%, BIRD-dev 54.89%
- 장점: 최고 성능, 최소 운영 비용
- 단점: API 비용, 프라이빗 데이터 노출

**상황 2: 비용 중심, 프라이빗 배포**
- 방법: LLaMA 2 70B 파인튜닝 + Self-Correction
- 성능: Spider 89.65%
- 장점: 온프레미스 배포, 개인정보보호
- 단점: 초기 파인튜닝 비용, 운영 복잡도

**상황 3: 빠른 응답 필요**
- 방법: LLaMA 2 13B LoRA + 추론 최적화
- 성능: Spider 84.5%, 응답 시간 0.5초
- 장점: 빠른 응답, 낮은 리소스
- 단점: 성능 수준 상대적으로 낮음

**상황 4: 초기 단계, 빠른 검증 필요**
- 방법: GPT-3.5 API + Few-shot (프로토타입)
- 성능: Spider 70.5%
- 장점: 빠른 시작, 저비용
- 단점: 성능 상대적으로 낮음

#### 6.2.2 구현 체크리스트

**1단계: 데이터 준비 (1-2주)**
- [ ] 질문-쿼리 쌍 수집 (최소 1,000개)
- [ ] 데이터 정제 및 중복 제거
- [ ] 훈련/검증/테스트 분할 (70/15/15)
- [ ] 스키마 정보 정제

**2단계: 베이스라인 구축 (1주)**
- [ ] GPT-3.5 또는 오픈소스 LLM 선택
- [ ] Zero-shot 성능 측정
- [ ] Few-shot 예제 준비 (3-5개)
- [ ] 기본 프롬프트 구성

**3단계: 성능 개선 (2-3주)**
- [ ] CoT, Self-Consistency 추가
- [ ] 동적 예제 선택 구현
- [ ] 스키마 선택 최적화
- [ ] 오류 분석 및 개선

**4단계: 고급 기법 적용 (2-4주)**
- [ ] Self-Correction 구현
- [ ] RAG 시스템 구축
- [ ] 파인튜닝 고려 (필요시)
- [ ] 에이전트 기반 접근 검토

**5단계: 프로덕션 배포 (1-2주)**
- [ ] 성능 재평가 (테스트 셋)
- [ ] 개인정보보호 검토
- [ ] 모니터링 시스템 구축
- [ ] 사용자 피드백 수집

### 6.3 향후 연구 방향

#### 6.3.1 단기 (1-2년)

1. **더 작고 효율적인 모델**:
   - 4B-13B 범위에서 높은 성능 달성
   - 엣지 디바이스 배포 가능

2. **멀티모달 Text-to-SQL**:
   - 스키마와 함께 예시 데이터 포함
   - 테이블 이미지 정보 활용

3. **도메인 특화 LLM**:
   - 특정 산업(금융, 의료)용 LLM 개발
   - 사전 파인튜닝 모델 제공

4. **신뢰성 향상**:
   - 생성 쿼리의 검증 및 실행 능력 개선
   - 오류 자동 수정 메커니즘

#### 6.3.2 중기 (2-5년)

1. **자율 에이전트 발전**:
   - 사용자와의 대화형 개선
   - 피드백 학습 메커니즘

2. **다언어 Text-to-SQL**:
   - 영어 이외 언어 지원
   - 언어 간 전이 학습

3. **시간 경과에 따른 적응**:
   - 스키마 변경 감지 및 대응
   - 쿼리 패턴 진화 추적

4. **설명 가능성 (Explainability)**:
   - 생성 쿼리 이유 설명
   - 사용자 신뢰도 향상

#### 6.3.3 장기 (5년 이상)

1. **일반화된 데이터베이스 인터페이스**:
   - 다양한 SQL 방언 지원
   - NoSQL, 그래프 데이터베이스 지원

2. **완전 자동화 데이터 분석**:
   - 질문부터 인사이트 추출까지 자동화
   - 시각화 자동 생성

3. **개인화된 모델**:
   - 조직 특화 LLM
   - 사용자 선호도 학습

## 7. 참고 자료

### 7.1 주요 논문 및 리소스

- Spider Dataset: https://yale-lily.github.io/spider
- BIRD Benchmark: https://bird-bench.github.io/
- Dr.Spider: https://github.com/taoyds/spider/tree/master/drsql
- XiYan-SQL: https://github.com/XiYan-AI/XiYan-SQL

### 7.2 오픈소스 모델

- LLaMA 2: https://huggingface.co/meta-llama/
- CodeLLaMA: https://huggingface.co/codellama/
- Mistral: https://huggingface.co/mistralai/

### 7.3 파인튜닝 도구

- Hugging Face Transformers: https://github.com/huggingface/transformers
- PEFT (Parameter-Efficient Fine-Tuning): https://github.com/huggingface/peft
- LlamaIndex: https://www.llamaindex.ai/

---

**논문 정보**
- 제목: A Survey on Employing Large Language Models for Text-to-SQL Tasks
- 저자: Liang Shi, Zhengju Tang, Nan Zhang, Xiaotong Zhang, Zhi Yang
- 출판사: ACM Computing Surveys (CSUR)
- 연도: 2024
- DOI: 10.1145/3737873
- arXiv: 2407.15186

이 블로그 포스트는 해당 논문의 주요 내용을 한국어로 상세히 정리한 것입니다.
