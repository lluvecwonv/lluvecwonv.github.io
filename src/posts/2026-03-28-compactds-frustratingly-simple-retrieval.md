---
title: "CompactDS: Frustratingly Simple Retrieval Improves Challenging, Reasoning-Intensive Benchmarks"
date: 2026-03-28
summary: "기존 RAG가 추론 집약적 태스크에 무효하다는 통념을 뒤집는 연구. 380B 단어 규모의 다양하고 고품질인 웹 스케일 데이터스토어 CompactDS를 구축하고, ANN+Exact Search 2단계 파이프라인으로 단일 노드에서 서브초 지연 검색을 달성. LLaMA 3.1 8B에서 MMLU +10%, MMLU Pro +33%, GPQA +14%, MATH +19% 향상. Google Search 기반 RAG를 능가하며, Search-o1 같은 복잡한 에이전틱 RAG 시스템에도 필적. ICLR 2026 논문."
tags: [RAG, Retrieval, LLM, Datastore, Dense Retrieval, ICLR 2026, 연구노트]
category: 연구노트
language: ko
---

# Frustratingly Simple Retrieval Improves Challenging, Reasoning-Intensive Benchmarks

**학회:** ICLR 2026
**저자:** Xinxi Lyu*, Michael Duan*, Rulin Shao, Pang Wei Koh, Sewon Min
**소속:** University of Illinois Urbana-Champaign, University of Southern California, Allen Institute for AI, University of Washington, UC Berkeley
**arXiv:** [2507.01297](https://arxiv.org/abs/2507.01297)
**OpenReview:** [Forum](https://openreview.net/forum?id=9lPq01iKOV)
**코드:** [GitHub - compactds-retrieval](https://github.com/facebookresearch/CompactDS) <!-- placeholder -->
**데이터:** [HuggingFace - alrope/CompactDS-102GB](https://huggingface.co/datasets/alrope/CompactDS-102GB)

---

## 한 줄 요약

"RAG는 추론 집약적 태스크에 무효하다"는 기존 통념을 뒤집으며, **다양하고 고품질인 웹 스케일 데이터스토어(CompactDS)**와 **ANN+Exact Search 2단계 검색 파이프라인**만으로 MMLU, MMLU Pro, GPQA, MATH 등 추론 벤치마크에서 일관된 대폭 성능 향상을 달성. Google Search 기반 RAG보다도 우수한 성능을 보임.

---

## 1. 논문 개요 및 동기

Retrieval-Augmented Generation(RAG)은 factoid QA(예: Natural Questions, TriviaQA) 같은 사실 기반 태스크에서 큰 성공을 거뒀다. 하지만 MMLU, GPQA, MATH 등 **추론 집약적(reasoning-intensive) 벤치마크**에서는 RAG가 효과가 없거나 오히려 성능을 저하시킨다는 것이 기존 연구의 결론이었다(Behnamghader et al., 2022; Geng et al., 2024).

저자들은 이 통념에 의문을 제기한다. 기존 연구가 실패한 핵심 원인은 **적절한 데이터스토어의 부재**라고 진단한다:

**기존 데이터스토어의 한계:**
- **Wikipedia 기반:** 커버리지가 좁아 일반적인 벤치마크에서 효과가 제한적
- **MassiveDS(Shao et al., 2024):** 1,441B 단어, 12.4TB RAM 필요 — 분산 인프라 없이는 배포 불가능
- **소규모 Common Crawl 서브셋(RePlug 등):** 50억 토큰 수준으로 커버리지 부족

이에 대한 해답으로 **CompactDS**를 제안한다: 380B 단어 규모의 다양하고 고품질인 데이터스토어로, **단일 노드(456GB RAM)에서 서브초 지연으로 검색 가능**하다.

---

## 2. CompactDS 데이터스토어 구성

### 2.1 데이터 소스

CompactDS는 pre-training 코퍼스의 breadth를 매치하면서도 품질을 보장하기 위해 전략적으로 구성된다.

**Web Crawl — High-quality CC (172B 단어):**
Common Crawl(894B 단어)에서 시작하여, C4와 DCLM-Baseline의 합집합을 취하고, FineWeb-Edu classifier(threshold 4.0)로 추가 필터링. 결과적으로 **원래 크기의 약 19%로 축소**하면서도 커버리지를 유지.

**Wikipedia & Books:**
- Wikipedia: DPR 기반(2018) + RedPajama-V1 기반(2023) 두 버전
- Books: RedPajama-V1 Books subset (디지털화된 eBooks)
- Educational Text: Shi et al.(2025)의 디지털화 PDF 기반 교육 텍스트

**Expert Data:**
- Math: OpenWebMath + NaturalProofs (정리, 증명, 정의)
- Academic Papers: Pes2o, PubMed, ArXiv
- Github: RedPajama-V1 GitHub subset

**Q&A Forums:**
- Stack Exchange, Reddit

**Decontamination:** 평가 데이터셋과 70% 이상의 13-gram Jaccard similarity를 가진 단락을 필터링.

**최종 규모:** 380.5B 단어, 6.39억 문서, 256 단어 단위로 분할하여 **19억 passages**.

### 2.2 핵심 인사이트

1. **대부분의 웹 콘텐츠는 검색에 불필요하다:** 공격적인 필터링으로 크기를 대폭 줄여도 커버리지와 다양성을 유지 가능.
2. **다양한 소스의 조합이 핵심:** 어떤 단일 소스도 모든 벤치마크를 커버하지 못하며, 약한 소스를 제거해도 성능이 하락.

---

## 3. 검색 파이프라인

### 3.1 2단계 Dense Retrieval

**문제:** 19억 passages × 768차원 = **5.4TB** 벡터 데이터 → 메모리에 전부 올리기 불가능.

**해결: ANN + Exact Search 2단계 파이프라인**

![Figure 1: CompactDS 2단계 Dense Retrieval 파이프라인](/figures/compactds/figure1_pipeline.png)

**1단계 — Approximate Nearest Neighbor (ANN) via IVFPQ:**
- Contriever-msmarco를 E_Approx로 사용
- IVFPQ(Inverted File with Product Quantization)로 벡터 공간을 클러스터링 + 양자화
- **456GB RAM**에서 서브초 지연으로 검색 가능
- 하지만 양자화의 lossy nature로 인해 성능 저하 발생

**2단계 — Exact Inner Product Search:**
- ANN에서 K개 후보(K≫k)를 검색한 후, 원본(비양자화) 임베딩으로 re-ranking
- 더 표현력 있는 인코더 **GritLM-7B**을 E_Exact로 사용
- 원본 임베딩은 **디스크에 저장** — 적절한 K(100~1000)에서 합리적인 I/O

이 설계는 DiskANN 접근법을 따르지만, FAISS 등 표준 라이브러리에 구현되지 않아 널리 채택되지 못했다.

### 3.2 Augmentation 방식

**Generation:** Top-k 검색 결과를 역순으로 연결(가장 관련성 높은 문서를 쿼리에 가장 가까이 배치)하여 LLM에 입력.

**LM Reranking (선택적):** 검색 결과를 LLM으로 재순위 — 도움 점수(helpfulness score)를 매기는 프롬프트 사용. Generator와 동일한 모델 사용.

**Oracle Reranking (상한선 측정):** Ground truth answer를 활용하여 모델의 정답 likelihood를 최대로 높이는 passage를 선택 — 이론적 상한.

---

## 4. 실험 설정

### 4.1 벤치마크

5개의 추론 집약적 벤치마크 + 2개의 추가 벤치마크:

- **MMLU:** 57개 다지선다 태스크 (STEM, Humanities, Social Sciences, Others)
- **MMLU Pro:** 14개 분야, 10지선다 — MMLU보다 난이도 높음
- **AGI Eval:** SAT, LSAT 등 표준화 시험 문제
- **GPQA:** 대학원 수준 전문가 작성 물리/생물/화학 문제 (웹 검색으로도 풀기 어렵게 설계)
- **MATH:** AMC 12, AIME 등 경쟁 수학 문제
- **GPQA Diamond:** GPQA의 고품질 부분집합 (198문항)
- **MATH-500:** MATH의 500문항 부분집합

### 4.2 사용 모델

- **기본:** LLaMA 3.1 8B Instruct
- **스케일링:** LLaMA 3.3 70B Instruct, Mistral 7B Instruct, Qwen3 8B, QwQ 32B

---

## 5. 실험 결과

### 5.1 메인 결과 (Table 1)

![Table 1: 단일 소스 데이터스토어 vs CompactDS 비교 (LLaMA 3.1 8B Instruct)](/figures/compactds/table1_main_results.png)

**CompactDS의 성능 향상 (LLaMA 3.1 8B Instruct, No Retrieval → CompactDS k=10):**

| 벤치마크 | No Retrieval | CompactDS | 상대 향상 |
|---------|-------------|-----------|----------|
| MMLU STEM | 60.2 | 66.8 | **+11.0%** |
| MMLU Humanities | 72.0 | 77.9 | +8.1% |
| MMLU Social | 78.7 | 85.2 | +8.3% |
| MMLU Others | 68.9 | 77.0 | +11.8% |
| MMLU Pro | 39.8 | 53.1 | **+33.4%** |
| AGI Eval | 56.2 | 60.2 | +7.1% |
| MATH | 46.9 | 55.9 | **+19.2%** |
| GPQA Physics | 26.7 | 33.2 | **+36.3%** |
| **평균** | **48.3** | **55.1** | **+14.1%** |

**핵심 발견:**

1. **데이터스토어 다양성이 핵심:** 단일 소스 데이터스토어는 특정 벤치마크에만 도움 — Educational Text는 MMLU/GPQA, Math는 MATH, DPR Wikipedia는 GPQA Biology에 효과적. 하지만 개별 소스의 향상은 제한적.

2. **CompactDS-ANN(모든 소스 조합)은 평균 8.1% 향상** — 다양한 데이터 커버리지의 중요성을 입증.

3. **Wikipedia(DPR)는 RAG 문헌에서 가장 많이 사용되지만**, 이 벤치마크들에서는 평균적으로 거의 효과 없으며, 여러 데이터셋에서 오히려 성능을 저하시킴.

4. **Educational content와 Expert data(Math)가 가장 큰 단일 소스 향상** — 웹 크롤에 없는 교육 자료의 가치를 입증.

### 5.2 MassiveDS와의 비교 (Table 2)

![Table 2: CompactDS vs MassiveDS MMLU 비교](/figures/compactds/table2_massiveds.png)

| 시스템 | RAM 사용량 | MMLU AVG | 전체 AVG |
|-------|-----------|----------|---------|
| No Retrieval | - | 68.9 | 48.3 |
| MassiveDS (Exact Search) | **12.4TB** | ~73.6 | - |
| CompactDS-ANN only | **0.5TB** | 75.2 | 53.8 |
| CompactDS (ANN+GRIT ES) | 0.5TB | 75.3 | 55.1 |
| CompactDS + LM Reranking | 0.5TB | **78.2** | **56.0** |

CompactDS는 MassiveDS 대비 **RAM의 4%만 사용하면서도 MMLU에서 더 높은 성능**을 달성한다. 이는 데이터스토어의 신중한 구성(필터링 + 다양한 소스)과 ANN+Exact Search 파이프라인의 효과를 보여준다.

### 5.3 Exact Search의 효과 (Table 4)

![Table 4: 검색 파이프라인별 비교 (K=1,000)](/figures/compactds/table4_pipeline.png)

Table 4의 ablation에서:
- ANN(Contriever) + ES(Contriever): ANN만 대비 큰 향상 없음
- ANN(Contriever) + ES(**GritLM**): 유의미한 향상 (AVG 53.8 → 55.1)
- **더 표현력 있는 모델(GritLM)이 성능 향상의 주요 원인** — 2단계 설계의 핵심 이점

### 5.4 Oracle Reranking 상한 (Table 3)

![Table 3: Oracle Performance](/figures/compactds/table3_oracle.png)

Oracle reranking으로 100개 후보 중 최적 3개를 선택하면:
- 평균 향상: 8.0% → **16.2%** (No Retrieval 대비)
- 8B Oracle 모델(AVG 71.2)이 **70B 모델의 No Retrieval 성능(AVG 70.1)을 능가**

이는 CompactDS가 이미 유용한 정보를 포함하고 있으며, **더 나은 검색/리랭킹 또는 더 강한 LLM**으로 성능을 크게 더 높일 수 있음을 시사.

### 5.5 다양한 모델에서의 효과 (Table 5)

![Table 5: 다양한 모델에서의 CompactDS 효과](/figures/compactds/table5_different_models.png)

| 모델 | No Retrieval AVG | CompactDS AVG | 상대 향상 |
|------|-----------------|---------------|----------|
| LLaMA 3.1 8B Inst | 48.3 | 55.1 | +14.1% |
| LLaMA 3.3 70B Inst | 68.8 | 71.2 | +3.5% |
| Mistral 7B Inst | 37.1 | 42.6 | +14.8% |
| Qwen3 8B | 57.0 | 61.6 | +8.1% |

**핵심 발견:**
- **70B에서도 일관된 향상:** MMLU STEM +5%, MMLU Pro +13%, MATH +7%
- **다양한 모델 패밀리에서 효과적:** Mistral, Qwen3에서도 유의미한 향상
- GPQA는 70B에서 예외 — baseline 성능이 이미 매우 높아(예: Physics 26.7→64.2) 추가 향상이 제한적

### 5.6 정성적 분석 (Table 6)

![Table 6: GPQA에서 검색된 top passage 예시](/figures/compactds/table6_qualitative.png)

Table 6은 GPQA의 한 질문에 대해 CompactDS가 검색한 passage 예시를 보여준다. Sirius의 대기 중 수소 원자의 2차 들뜬 상태 비율에 대한 질문에 대해, 유사한 문제와 풀이 과정이 포함된 passage를 검색하여 모델의 추론을 보조한다.

---

## 6. Google Search와의 비교

### 6.1 Search Engine RAG 파이프라인

Google Programmable Search Engine을 사용하여 경쟁력 있는 웹 검색 RAG 파이프라인을 구축:
- Resiliparse + BeautifulSoup으로 웹 페이지 파싱
- olmOCR로 PDF 파싱 (기존 연구의 PDFPlumber보다 우수)
- 13-gram overlap 기반 decontamination + huggingface.co 차단

### 6.2 CompactDS vs Google Search (Table 7)

![Table 7: Search Engine vs CompactDS 비교 (LLaMA 3.1 8B Instruct)](/figures/compactds/table7_web_vs_local.png)

| 방법 | MMLU STEM | MMLU Pro | AGI Eval | MATH | GPQA Phys | AVG |
|------|-----------|---------|---------|------|-----------|-----|
| No Retrieval | 60.2 | 39.8 | 56.2 | 46.9 | 26.7 | 48.3 |
| Search Engine | 61.8 | 42.8 | 59.7 | 51.4 | 25.7 | 51.3 |
| Search Engine + LM Rerank | 61.3 | 44.0 | **59.8** | 50.2 | 32.1 | 51.5 |
| **CompactDS** | 66.8 | 53.1 | 58.9 | **55.9** | 29.4 | 55.1 |
| **CompactDS + LM Rerank** | **69.1** | **54.6** | 59.5 | 53.0 | **33.7** | **56.0** |

**CompactDS가 Google Search를 일관적으로 능가:** 평균 14% vs 6% 상대 향상. 특히 MMLU Pro(54.6 vs 44.0), MATH(55.9 vs 51.4)에서 격차가 크다.

### 6.3 QwQ 32B + Search-o1 비교 (Table 8)

![Table 8: QwQ 32B 기반 CompactDS vs Search-o1 비교](/figures/compactds/table8_qwq.png)

| 방법 | Self-contained? | GPQA Diamond | MATH-500 |
|------|----------------|-------------|----------|
| **Search-o1 계열** | | | |
| No Retrieval | O | 58.1 | 83.2 |
| RAG with Search Engine | X | 61.6 | 85.0 |
| **Agentic RAG (Search-o1)** | X | **63.6** | **86.4** |
| **본 논문** | | | |
| No Retrieval | O | 58.1 | 91.0 |
| RAG with Search Engine | X | 63.1 | **94.0** |
| **RAG with CompactDS** | O | **63.1** | 93.2 |

**핵심 발견:**
1. 본 논문의 실험 설정이 Search-o1보다 강력 (MATH-500에서 No Retrieval 91.0 vs 83.2)
2. **단순한 minimal RAG + CompactDS가 복잡한 Agentic RAG(Search-o1)에 필적 또는 능가**
3. CompactDS는 **self-contained** — 외부 검색 엔진 의존 없이 재현 가능

### 6.4 검색 엔진 vs 인하우스 데이터스토어의 상호보완성

검색 엔진의 장점: 다양한 웹 PDF(강의 노트, 문제 풀이 등) 접근 가능
CompactDS의 장점: 재현 가능, 비용 효율적, 안정적, 자체 완결적

특히 **PDF가 핵심 보완 소스:** MMLU Pro에서 PDF만으로도 웹+PDF 조합에 근접한 성능, GPQA에서는 PDF만이 오히려 더 우수.

---

## 7. 논의 및 한계

**강점:**
- **패러다임 전환:** "RAG는 추론 태스크에 무효하다"는 통념을 뒤집음
- **실용적:** 단일 노드(456GB RAM)에서 서브초 지연으로 동작 — 학계에서도 활용 가능
- **재현 가능:** 데이터스토어와 파이프라인 공개, 상용 검색 엔진 의존 없음
- **확장성:** 8B~70B, 다양한 모델 패밀리에서 일관된 효과

**한계:**
- GPQA 같은 일부 벤치마크에서 모델 크기가 클 때 향상이 제한적
- LM Reranking이 CoT 태스크(MATH, GPQA)에서는 덜 효과적 — 태스크별 맞춤 리랭킹 필요
- 교육용 PDF 등 웹 검색으로만 접근 가능한 소스는 포함되지 않음

---

## 주요 기여 요약

1. **CompactDS:** 380B 단어, 다양한 소스, 고품질 필터링. 단일 노드에서 서브초 검색 가능한 최초의 실용적 웹 스케일 데이터스토어.
2. **ANN + Exact Search 2단계 파이프라인:** Contriever(ANN) + GritLM-7B(Exact)로 메모리 효율과 검색 품질을 동시 달성.
3. **추론 벤치마크에서의 일관된 대폭 향상:** MMLU +10%, MMLU Pro +33%, GPQA +14%, MATH +19%.
4. **Google Search 능가:** 인하우스 데이터스토어가 상용 검색 엔진 대비 우위 — 기존 RAG 벤치마크에서는 관찰할 수 없었던 결과.
5. **Search-o1에 필적:** 단순한 minimal RAG로 복잡한 Agentic RAG 시스템 수준 달성.

---

## 개인적 코멘트

이 논문의 가장 큰 기여는 "데이터스토어만 제대로 만들면 단순한 RAG로도 추론 태스크를 크게 개선할 수 있다"는 것을 실증한 점이다. 기존 연구가 Wikipedia 기반 데이터스토어로 실패하고 "RAG는 추론에 무효"라고 결론 내린 것은, 방법론의 한계가 아니라 데이터스토어의 한계였다는 것이 핵심 메시지다.

특히 인상적인 것은 **125GB 압축 인덱스로도 성능 하락이 1%에 불과**하다는 점이다. 이는 대학 연구실 수준의 하드웨어에서도 CompactDS를 활용할 수 있음을 의미한다.

다만, Oracle reranking과 실제 성능 사이의 큰 갭(14.5% vs 32.6%)은 현재 LLM의 검색 결과 활용 능력에 상당한 개선 여지가 있음을 시사한다. 이는 향후 Agentic RAG나 검색 특화 모델 학습 연구의 좋은 출발점이 될 것이다.
