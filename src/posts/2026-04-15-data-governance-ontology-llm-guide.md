---
title: "데이터 거버넌스와 온톨로지 - LLM 시대의 핵심 인프라 완전 정리"
date: 2026-04-15
summary: 데이터 거버넌스와 온톨로지의 개념을 문헌정보학과 컴퓨터공학 관점에서 설명하고, LLM에서 RAG → GraphRAG → Ontology-RAG로 이어지는 최신 연구 흐름과 Knowledge Graph 통합까지 체계적으로 정리한다.
tags: [Data Governance, Ontology, Knowledge Graph, RAG, GraphRAG, LLM, Hallucination, Memorization, Bias]
category: AI/개발
language: ko
---

데이터 거버넌스와 온톨로지는 LLM 시대에 단순한 학술 용어가 아니라, 모델의 신뢰성과 성능을 결정짓는 핵심 인프라다. 이 글에서는 두 개념을 문헌정보학과 컴퓨터공학 양쪽 관점에서 설명하고, LLM에서 RAG → Knowledge Graph → Ontology로 이어지는 최신 연구 흐름까지 정리한다.

---

## 1. 데이터 거버넌스 (Data Governance)

### 1.1 한 줄 정의

데이터 거버넌스 = **데이터의 생성, 관리, 사용 전 과정을 통제하는 규칙과 체계**

### 1.2 문헌정보학 관점

문헌정보학에서 데이터 거버넌스는 "정보를 어떻게 분류하고, 관리하고, 신뢰할 수 있게 만들 것인가"의 문제다. 핵심은 세 가지로 나뉜다.

**분류 체계 (Classification)** — 정보를 어떤 기준으로 나눌 것인가. 도서관에서 DDC(듀이십진분류법)나 KDC(한국십진분류법)를 쓰는 것처럼, 모든 데이터는 일관된 기준으로 분류되어야 한다.

**메타데이터 (Metadata)** — 이 데이터가 무엇인지 설명하는 정보다. 책에 저자, 출판일, 주제 분류, ISBN이 있는 것처럼, 데이터에도 출처, 생성일, 형식, 라이선스 등의 메타데이터가 필요하다.

**통제 (Control)** — 누가, 어떻게, 어떤 조건에서 접근 가능한가를 정의한다. 희귀 자료실에 출입 제한이 있는 것과 같은 원리다.

정보는 그냥 쌓이면 "데이터"가 아니라 쓰레기가 된다. 저자와 출판일이 없는 책은 검색이 불가능하고, 동일한 주제인데 서로 다른 이름으로 저장되면 retrieval이 실패한다. 즉, 데이터 거버넌스란 **검색 가능성(Findability) + 신뢰성(Reliability) + 재사용성(Reusability)** 을 만드는 구조다.

### 1.3 컴퓨터공학 / LLM 관점

LLM에서 데이터 거버넌스는 더욱 critical하다. 모델은 "데이터를 그대로 반영하는 시스템"이기 때문이다.

**학습 데이터 품질 관리**: 잘못된 데이터는 hallucination을 유발하고, 편향된 데이터는 bias를 만들며, 중복 데이터는 memorization을 증가시킨다. FAIR 원칙(Findable, Accessible, Interoperable, Reusable)이 학습 데이터에도 그대로 적용되어야 한다.

**데이터 통제**: 개인정보가 포함된 데이터는 privacy leakage 위험이 있고, 저작권 데이터는 법적 문제를 야기한다. PII(Personally Identifiable Information) 필터링, 라이선스 검증이 학습 전에 반드시 수행되어야 한다.

**데이터 분포 관리**: 특정 도메인에 데이터가 과다하면 해당 영역에 과적합(overfitting)되고, 다른 도메인에서는 성능이 급격히 떨어진다. 도메인별 균형 있는 데이터 분포 설계가 필수다.

즉, **데이터 거버넌스 = 모델 행동을 결정하는 숨겨진 제어 시스템**이다.

### 1.4 구체적 예시: QA 데이터셋 구축

거버넌스가 없는 경우를 보자. 같은 질문에 다른 답이 달려 있고, 출처가 없으며, outdated 정보가 포함되어 있다. 결과적으로 hallucination이 발생하고 inconsistent answer가 나온다.

반면 거버넌스가 있는 경우에는 질문-답 정합성이 검증되고, 출처가 tagging되며, 최신성이 유지된다. 정확도가 상승하고 hallucination이 감소한다.

| 항목 | 거버넌스 없음 | 거버넌스 있음 |
|------|-------------|-------------|
| 질문-답 관계 | 같은 질문, 다른 답 | 정합성 검증 완료 |
| 출처 | 없음 | 출처 태깅 |
| 최신성 | outdated 포함 | 주기적 갱신 |
| 결과 | hallucination, inconsistency | 정확도 상승 |

---

## 2. 온톨로지 (Ontology)

### 2.1 한 줄 정의

온톨로지 = **개념과 그 관계를 명시적으로 정의한 구조**

### 2.2 문헌정보학 관점

문헌정보학에서 온톨로지는 "정보를 단순히 분류하는 것이 아니라, 의미 관계까지 정의하는 것"이다.

기존 분류는 단순한 위계 구조다: 컴퓨터공학 > 인공지능 > NLP. 하지만 온톨로지는 이보다 훨씬 풍부한 의미 네트워크를 형성한다.

```
NLP ⊂ AI ⊂ Computer Science
NLP → has_task → Translation, QA, Summarization
QA → requires → Context
QA → evaluated_by → F1, Exact Match
Translation → related_to → Multilingual NLP
```

단순 분류가 아니라 "의미 네트워크"다. 이것이 왜 중요하냐면, 검색을 "키워드"가 아니라 "의미"로 할 수 있게 되기 때문이다. "기계번역"을 검색했을 때 "Translation"이라는 영어 키워드로 저장된 문서도 함께 찾을 수 있는 것이 바로 온톨로지의 힘이다.

### 2.3 컴퓨터공학 / LLM 관점

LLM에서 온톨로지의 역할은 세 가지로 정리된다.

**의미 구조 제공**: 단어 간 관계를 명시적으로 이해하게 하여 context reasoning을 강화한다. "cat is a feline"과 "feline belongs to animal class"라는 관계를 알면, 모델은 "cat is an animal"을 직접 학습하지 않아도 추론할 수 있다.

**RAG에서의 핵심 역할**: 문서 간 관계 기반 retrieval이 가능해진다. 단순 embedding 유사도보다 구조적 검색이 더 정확한 문맥을 제공한다. 이에 대해서는 아래 섹션에서 자세히 다룬다.

**Hallucination 감소**: 관계 검증이 가능해진다. "A는 B의 일부인가?", "X는 Y를 필요로 하는가?" 같은 consistency check가 가능하고, 이를 통해 모델의 출력을 검증할 수 있다.

즉, **온톨로지 = 모델이 세상을 이해하는 구조적 지도**다.

### 2.4 구체적 예시: "Apple" 처리

온톨로지가 없을 때 "Apple"이라는 단어는 과일인지 회사인지 ambiguity가 발생한다. 하지만 온톨로지가 있으면:

```
Apple (Company) → produces → iPhone, MacBook
Apple (Company) → founded_by → Steve Jobs
Apple (Fruit) → category → Food
Apple (Fruit) → grows_on → Tree
```

이렇게 context 기반 disambiguation이 가능해지고, "Apple의 신제품"이라는 질문에서 자동으로 Company 온톨로지를 선택할 수 있다.

---

## 3. 데이터 거버넌스 vs 온톨로지

### 3.1 핵심 차이

거버넌스는 "관리 규칙"이고, 온톨로지는 "의미 구조"다.

| 구분 | 데이터 거버넌스 | 온톨로지 |
|------|---------------|---------|
| 역할 | 데이터 품질/분포 제어 | 모델의 reasoning 구조 제공 |
| 질문 | "어떤 데이터를 넣을 것인가?" | "데이터 간 관계는 무엇인가?" |
| 실패 시 | garbage in, garbage out | semantic confusion |
| 비유 | 도서관 운영 규칙 | 도서 분류 체계 |

### 3.2 상호 관계

온톨로지는 거버넌스의 일부로 사용된다. 예를 들어 RAG 시스템에서 거버넌스는 어떤 문서를 넣을지 결정하고 품질을 필터링한다. 온톨로지는 문서 간 관계를 정의하고 retrieval 구조를 개선한다. 둘 다 있어야 제대로 작동한다.

---

## 4. LLM에서 RAG → Knowledge Graph → Ontology 연결 구조

이 섹션에서는 LLM의 retrieval 패러다임이 어떻게 발전해왔는지, 그리고 RAG, Knowledge Graph, Ontology가 어떻게 연결되는지 체계적으로 정리한다.

### 4.1 1세대: Vanilla RAG (벡터 검색 기반)

가장 기본적인 RAG 구조다. 문서를 chunk로 나누고, 각 chunk를 embedding하여 벡터 DB에 저장한다. 질문이 들어오면 embedding 유사도로 관련 chunk를 검색하고, 이를 LLM의 context로 넣는다.

```
[질문] → embedding → 벡터 DB 검색 → top-k chunk → LLM → [답변]
```

**장점**: 구현이 간단하고, 어떤 도메인이든 빠르게 적용 가능하다.

**한계**: 단순 벡터 유사도만 사용하기 때문에 **관계(relation)를 무시**한다. "A 회사의 CEO는 누구인가?"라는 질문에 A 회사에 대한 chunk와 CEO에 대한 chunk가 따로 검색될 수 있어, 정확한 연결이 어렵다. multi-hop reasoning이 필요한 질문에 특히 취약하다.

### 4.2 2세대: GraphRAG (Knowledge Graph 기반 검색)

GraphRAG는 문서에서 entity와 relation을 추출하여 Knowledge Graph(KG)를 구축하고, 이를 retrieval에 활용한다.

```
[문서] → entity/relation 추출 → Knowledge Graph 구축
[질문] → KG 탐색 + 벡터 검색 → 구조화된 context → LLM → [답변]
```

**Knowledge Graph란**: entity(개체)와 relation(관계)으로 이루어진 그래프 구조다. 예를 들어:

```
(Elon Musk) --[CEO_of]--> (Tesla)
(Tesla) --[produces]--> (Model 3)
(Model 3) --[category]--> (Electric Vehicle)
```

이 구조를 활용하면 "Tesla CEO가 만든 전기차는?"이라는 multi-hop 질문에 Elon Musk → Tesla → Model 3 경로를 따라 정확한 답을 찾을 수 있다.

**장점**: entity 간 관계를 활용하여 multi-hop reasoning이 가능하다. 단순 벡터 검색보다 구조적이고 정확한 context를 제공한다.

**한계**: KG는 개별 entity 간의 관계만 정의하고, 상위 수준의 **개념 체계(conceptual schema)** 가 없다. "Electric Vehicle"과 "Automobile"의 관계, "CEO"와 "Executive" 사이의 포함 관계 등은 KG만으로는 표현하기 어렵다.

### 4.3 3세대: Ontology-RAG (온톨로지 기반 검색)

Ontology-RAG는 KG 위에 온톨로지를 얹어, 개념 수준의 의미 구조를 활용한 retrieval을 수행한다.

```
[도메인 지식] → Ontology 정의 (개념 + 관계 + 제약)
[문서] → Ontology 기반 entity 분류 + KG 구축
[질문] → Ontology 기반 의미 검색 + KG 탐색 + 벡터 검색 → LLM → [답변]
```

**온톨로지가 KG에 추가하는 것**:

```
# Knowledge Graph (인스턴스 수준)
(Tesla) --[produces]--> (Model 3)

# Ontology (개념 수준)
Company ⊃ {Tesla, Toyota, BMW}
Product ⊃ {Model 3, Camry, i4}
Company --[produces]--> Product  (클래스 간 관계)
ElectricVehicle ⊂ Vehicle ⊂ Product  (개념 위계)
```

온톨로지가 있으면 "전기차 제조사"라는 질문에서 "ElectricVehicle ⊂ Vehicle"이라는 개념 위계를 따라 Tesla뿐 아니라 관련 모든 전기차 제조사를 검색할 수 있다.

### 4.4 세 세대 비교

| 구분 | Vanilla RAG | GraphRAG | Ontology-RAG |
|------|------------|----------|-------------|
| 검색 단위 | 텍스트 chunk | entity + relation | concept + relation + instance |
| 관계 활용 | 없음 | 있음 (인스턴스 수준) | 있음 (인스턴스 + 개념 수준) |
| multi-hop | 약함 | 가능 | 강화됨 |
| disambiguation | 어려움 | 부분 가능 | 개념 기반 완전 가능 |
| hallucination | 높음 | 감소 | 크게 감소 |
| 구축 난이도 | 낮음 | 중간 | 높음 |

### 4.5 전체 파이프라인 구조

최종적으로 세 기술은 아래와 같이 계층 구조를 이룬다:

```
┌─────────────────────────────────────────────┐
│           Ontology (개념 체계)                │
│  - 클래스 위계, 속성 정의, 제약 조건           │
│  - "Electric Vehicle ⊂ Vehicle ⊂ Product"    │
├─────────────────────────────────────────────┤
│        Knowledge Graph (지식 그래프)          │
│  - entity + relation 인스턴스                 │
│  - "(Tesla) --produces--> (Model 3)"         │
├─────────────────────────────────────────────┤
│          RAG (검색 증강 생성)                  │
│  - 벡터 검색 + 구조적 검색 결합               │
│  - context로 LLM에 전달                      │
├─────────────────────────────────────────────┤
│              LLM (언어 모델)                  │
│  - 최종 답변 생성                             │
└─────────────────────────────────────────────┘
```

Ontology가 가장 상위에서 개념 체계를 제공하고, Knowledge Graph가 그 체계 안에서 구체적 entity와 relation을 저장하며, RAG가 이 구조를 활용해 검색을 수행하고, LLM이 최종 답변을 생성하는 구조다.

---

## 5. 최신 연구 동향 (2024~2026)

### 5.1 Ontology + RAG 연구

**OG-RAG (EMNLP 2025)** — Ontology-Grounded Retrieval-Augmented Generation. 기존 RAG의 단순 벡터 검색 한계를 ontology 기반 retrieval로 극복한다. factual recall이 55% 향상되었고, correctness가 40% 향상되었다.

**OntoRAG (2025)** — Automated Ontology Derivation for QA. 비정형 데이터(PDF, 웹)에서 ontology를 자동 생성하여 RAG에 활용한다. 벡터 RAG보다 성능이 높았고, GraphRAG보다도 comprehensiveness에서 우위를 보였다.

**Ontology-based RAG (2024~2025)** — triple(subject-predicate-object) 기반 retrieval 방법으로, hallucination을 감소시키고 의미 기반 검색을 가능하게 한다.

### 5.2 Ontology + Reasoning 연구

**Ontology-Guided Reverse Thinking (ACL 2025)** — 온톨로지를 reasoning 과정에 직접 사용하여, 단순 text reasoning이 아닌 구조 기반 reasoning을 수행한다. LLM의 역할이 "문장 생성기"에서 "지식 추론기"로 변화하는 방향을 제시했다.

### 5.3 Ontology 자동 생성 연구

**RIGOR (2025)** — Retrieval-Augmented Ontology Generation. 데이터베이스에서 schema + LLM + RAG를 결합하여 ontology를 자동 생성한다. 데이터 거버넌스의 자동화 시작점이라 할 수 있다.

**OntoEKG (2026)** — LLM-driven Ontology Construction for Enterprise. 기업 데이터에서 ontology를 자동 생성하여, 데이터 거버넌스가 자동화되는 단계에 진입했다.

### 5.4 Knowledge Graph + LLM 통합

**Ontology-grounded Knowledge Graph for LLM Reliability (2026)** — ontology와 KG를 결합하여 LLM 출력 검증 시스템을 구축한다. clinical QA에서 hallucination 감소 및 신뢰성 향상을 달성했다.

**LLM and Knowledge Graph Integration Survey (2026)** — LLM + KG + Ontology 통합 방향을 제시한다. KG-enhanced LLM(KG로 LLM 강화)과 LLM-generated KG(LLM으로 KG 자동 생성) 두 방향의 연구 흐름을 정리했다.

---

## 6. LLM 핵심 문제와의 연결

### 6.1 Bias (편향)

원인은 거버넌스 실패, 즉 데이터 편향이다. 특정 인종, 성별, 지역에 치우친 학습 데이터는 모델의 출력에서 그대로 편향으로 나타난다. 해결 방향은 데이터 분포 제어(거버넌스)와 ontology 기반 균형 구조 설계다. 온톨로지로 개념 간 균형을 정의하면 데이터 수집 단계에서부터 편향을 제어할 수 있다.

### 6.2 Hallucination (환각)

원인은 이중적이다. 잘못된 데이터(거버넌스 문제)와 관계 이해 부족(온톨로지 문제)이 모두 작용한다. Ontology-RAG는 이 두 문제를 동시에 해결하는 접근법이다. 개념 구조를 통해 사실 관계를 검증하고, 거버넌스를 통해 학습 데이터의 품질을 보장한다.

### 6.3 Memorization (기억화)

원인은 주로 거버넌스 실패에 기인한다. 중복 데이터가 많으면 모델이 특정 문장을 통째로 외워버린다(verbatim memorization). 해결 방향은 deduplication과 data tracking이다.

여기서 흥미로운 연결이 있다. Memorization과 ontology의 관계다. Memorization은 surface-level pattern(표면 수준 패턴)에 묶이고, ontology는 semantic structure(의미 구조)에 묶인다. 즉 memorization은 "문장"에 의존하지만, ontology는 "개념"에 의존한다.

```
Memorization: "고양이는 동물이다" → 이 문장만 기억
Ontology:     고양이 ⊂ 포유류 ⊂ 동물 → 개념 관계를 이해
```

이 차이가 바로 memorization과 genuine understanding을 구분하는 핵심이다.

---

## 7. 연구 트렌드 정리

### 7.1 RAG 진화 방향

```
Vanilla RAG → GraphRAG → Ontology-RAG
(단순 검색)   (관계 검색)   (의미 검색)
```

### 7.2 데이터 구조 진화 방향

```
Raw Data → Knowledge Graph → Ontology
(비정형)    (구조화)          (의미화)
```

### 7.3 LLM 역할 변화

```
Text Generator → Knowledge Reasoner
(문장 생성기)     (지식 추론기)
```

---

## 8. 핵심 요약

**데이터 거버넌스**는 모델이 "무엇을 배우는지"를 결정한다. **온톨로지**는 모델이 "그걸 어떻게 이해하는지"를 결정한다.

둘을 합치면: **LLM의 행동은 데이터 거버넌스와 온톨로지 설계의 결과물이다.**

최신 연구의 방향은 명확하다: **LLM + Ontology + Knowledge Graph = 신뢰 가능한 AI**. RAG는 벡터 검색에서 관계 기반 검색으로, 다시 의미 기반 검색으로 진화하고 있으며, 온톨로지는 이 진화의 중심축이다.

거버넌스 없이 온톨로지만 있으면 garbage in, garbage out이고, 온톨로지 없이 거버넌스만 있으면 semantic confusion이 발생한다. 둘 다 있어야 LLM은 진정으로 신뢰할 수 있는 시스템이 된다.
