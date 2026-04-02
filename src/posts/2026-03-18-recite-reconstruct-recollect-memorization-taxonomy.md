---
title: "Recite, Reconstruct, Recollect: Memorization in LMs as a Multifaceted Phenomenon"
date: 2026-03-18
summary: "EleutherAI, Google DeepMind, Harvard University 등의 USVSN Sai Prashanth, Alvin Deng, Kyle O'Brien, Naomi Saphra, Katherine Lee 등이 ICLR 2025에 발표한 논문. LLM의 기억화(memorization)를 단일 현상으로 취급하지 않고, 인간의 기억 방식에서 영감을 받아 Recitation(암송), Reconstruction(재구성), Recollection(회상)의 세 가지 분류체계(taxonomy)로 구분한다. Pythia 모델(70M~12B)과 The Pile 코퍼스를 사용하여, 각 카테고리가 모델 크기와 학습 시간에 따라 서로 다르게 변화하며, 특히 Recollection이 가장 빠르게 증가함을 밝힌다. 이 분류체계를 기반으로 로지스틱 회귀 예측 모델을 구축하여, 분류체계 없는 베이스라인과 최적 파티션 모델보다 우수한 성능을 달성한다."
tags: [LLM, Memorization, Taxonomy, Pythia, Recitation, Reconstruction, Recollection, ICLR 2025, 연구노트]
category: 연구노트
language: ko
---

# Recite, Reconstruct, Recollect: Memorization in LMs as a Multifaceted Phenomenon

**저자:** USVSN Sai Prashanth*, Alvin Deng*, Kyle O'Brien*, Jyothir S V*, Mohammad Aflah Khan, Jaydeep Borkar, Christopher A. Choquette-Choo, Jacob Ray Fuehne, Stella Biderman, Tracy Ke†, Katherine Lee†, Naomi Saphra† (*Equal contribution, †Equal senior contribution)
**소속:** EleutherAI, Microsoft, NYU, DatologyAI, Northeastern University, MPI-SWS, IIIT Delhi, Google DeepMind, UIUC, Harvard University, Kempner Institute
**학회:** ICLR 2025
**키워드:** LLM, Memorization, Taxonomy, Recitation, Reconstruction, Recollection, Pythia, The Pile

## 한 줄 요약

LLM의 기억화(memorization)를 인간의 기억 방식에 착안하여 **Recitation(암송)**, **Reconstruction(재구성)**, **Recollection(회상)**의 세 범주로 분류하고, 이 분류체계가 기억화를 이해하고 예측하는 데 유용함을 실험적으로 입증한 연구이다.

---

## 1. 서론 (Introduction)

언어 모델(LM)의 기억화(memorization) 현상 — 학습 데이터의 정확한 복사본을 테스트 시에 생성하는 경향 — 은 기존 문헌에서 다양한 동기로 연구되어 왔다. 저작권(copyright), 프라이버시(privacy), 일반화(generalization)의 과학적 이해 등 목적이 다르며, 때로는 서로 모순되는 기억화 개념을 사용한다.

이 논문은 기억화를 단일하고 동질적인 현상으로 취급하는 기존 접근 방식의 한계를 지적하고, 인간의 기억 방식에서 영감을 받은 **직관적 분류체계(taxonomy)**를 제안한다.

![Figure 1: 기억화 분류체계 — 세 가지 카테고리를 결정하는 직관적 휴리스틱](/images/papers/recite-reconstruct-recollect/intro_figure-1.png)
*Figure 1: 제안된 기억화 분류체계의 세 가지 카테고리를 결정하는 직관적 휴리스틱.*

### 주요 기여

1. **직관적 분류체계와 휴리스틱 제안:** 기억화된 데이터를 분류하기 위한 직관적인 분류체계와 휴리스틱을 도입한다.
2. **기억화에 영향을 미치는 요인 분석:** 코퍼스 통계, 데이터 레벨 메트릭, 표현적 차이 등 다양한 요인이 기억화 가능성에 어떻게 영향을 미치는지 의존성 테스트(dependency tests)를 통해 확인한다. 낮은 perplexity가 기억화와 강하게 연관되지만, 모든 기억화 사례에 동일하게 적용되지는 않는다.
3. **스케일링 요인 연구:** 학습 시간과 모델 크기에 걸쳐 각 분류체계 카테고리를 모니터링한다. 모든 카테고리에서 기억화가 증가하지만, **Recollection이 가장 빠르게 증가**한다.
4. **예측 모델 구축:** 분류체계를 기반으로 로지스틱 회귀 모델을 학습하여, 분류체계 없는 베이스라인과 자동 최적화된 파티션 모델보다 우수한 성능을 달성한다.
5. **카테고리 간 차이 발견:** Recitation은 낮은 perplexity 프롬프트에 의해 가능해지고, Recollection은 희귀 토큰의 존재에 의해 제약을 받는다.

---

## 2. 실험 설정 (Experiments)

### 2.1 기억화 정의

**k-extractable memorization** (Carlini et al., 2022)을 사용하며, k=32로 설정한다. 즉, LM에 첫 32개 토큰을 프롬프트로 제공했을 때, 이어지는 32개 토큰을 정확히(verbatim) 생성하면 해당 샘플이 기억화된 것으로 판정한다.

### 2.2 언어 모델

**Deduplicated Pythia 모델** (Biderman et al., 2023)을 사용한다. 70M에서 12B 파라미터까지 다양한 크기의 모델을 포함하며(160M 모델은 이상치 행동으로 제외), 중복 제거된 The Pile 코퍼스로 학습되었다. 모든 실행에서 데이터 순서가 고정되어 있어 모델 크기가 기억화에 미치는 인과적 효과에 대한 주장이 가능하다.

### 2.3 데이터셋

- **기억화된 샘플(Memorized sample):** Biderman et al. (2023)이 공개한 Pythia의 32-extractable 샘플 목록. 학습 데이터를 직접 참조하여 검증된 데이터이다.
- **대표 샘플(Representative sample):** The Pile의 무작위 3% 부분집합에서 각 시퀀스의 처음 64개 토큰을 보존한 것.
- **비기억화 분포(Unmemorized distribution):** 대표 샘플에서 추정한 전체 Pile 분포에서 기억화된 데이터 분포를 뺀 것.

---

## 3. 기억화의 잠재적 요인 (Potential Factors in Memorization)

기억화 여부에 관여하는 다양한 요인을 세 가지 범주로 분류하여 분석한다. 각 특성(feature)은 처음 32개 토큰(프롬프트), 마지막 32개 토큰(continuation), 전체 64개 토큰 시퀀스에 대해 계산될 수 있다.

![Figure 2: 기억화된 샘플과 비기억화된 샘플의 다양한 속성 히스토그램](/images/papers/recite-reconstruct-recollect/histograms_percents-1.png)
*Figure 2: 기억화된 샘플과 비기억화 샘플의 다양한 속성 분포 비교. 일부 속성에서는 기억화 분포가 더 집중되어 있고, perplexity와 중복 횟수에서는 중앙값이 뚜렷하게 다르다.*

### 3.1 코퍼스 통계 (Corpus Statistics)

- **Duplicates:** 학습 코퍼스 내 각 32-토큰 윈도우의 중복 횟수를 카운트한다.
- **Semantic Matches:** SBERT 임베딩으로 문서 임베딩을 생성하고, 코사인 유사도 ≥ 0.8인 시퀀스의 수를 카운트한다. 의미적으로 유사하지만 토큰 수준에서 정확히 동일하지 않을 수 있는 시퀀스를 포착한다.
- **Textual Matches:** Semantic match 중 프롬프트의 Levenshtein 편집 거리가 낮은 것을 필터링한다. 보일러플레이트 프롬프트의 미세한 변형을 감지한다. 문자 수준에서 편집 거리를 계산하여 동일 시퀀스의 다른 토큰화를 고려한다.
- **Token Frequency:** 시퀀스 내 개별 토큰의 코퍼스 전체 빈도에 대한 요약 통계(평균, 중앙값, 최대, 최소, 25th/75th 백분위 카운트)를 계산한다.

### 3.2 시퀀스 속성 (Sequence Properties)

- **Templating (템플릿):** 예측 가능한 패턴을 따르는 시퀀스를 감지한다.
  - **Repeating (반복):** 짧은 토큰 시퀀스가 반복되는 경우 (예: "Go Go Go ...")
  - **Incrementing (증가):** 증가하는 수치 시퀀스 (예: "23: 0xf1, 24: 0xf2, 25: 0xf3")
- **Compressibility (압축성):** Huffman Coding 길이로 시퀀스의 압축 용이성을 측정한다. 반복 패턴의 일반화된 측정치이다.

### 3.3 Perplexity

프롬프트, continuation, 전체 시퀀스에 대한 평균 perplexity를 계산한다. 낮은 perplexity 시퀀스가 높은 perplexity 시퀀스보다 기억화될 가능성이 훨씬 높다는 것은 기억화 연구에서 가장 많이 재현된 결과 중 하나이며, 이 논문에서도 확인된다. Perplexity는 데이터 고유 속성이 아닌 모델 행동에 관련된 유일한 요인이다.

![Figure 3: KL divergence — Pythia 12B에서 기억화/비기억화 예시의 생성 perplexity 분포 간 KL divergence](/images/papers/recite-reconstruct-recollect/kl_divergence-1.png)
*Figure 3: 중복 횟수별 기억화/비기억화 샘플의 generation perplexity KL divergence (Pythia 12B). 6개 중복에서 divergence가 최대이며, 높은 중복 시퀀스에서는 기억화/비기억화 분포가 거의 동일하다.*

---

## 4. 기억화 분류체계 (Memorization Taxonomy)

k-extractable 기억화의 근본적 원인을 분석하기 위해, 기억화된 샘플을 세 가지 유형으로 세분화한다.

### 4.1 Recitation (암송)

- **정의:** 학습 코퍼스에서 **높은 중복 횟수(>5 duplicates)**를 가진 시퀀스.
- **직관:** 인간이 반복 노출을 통해 직접 인용문을 외우는 것처럼, LM은 고도로 중복된 시퀀스를 암송한다.
- **예시:** 성경 인용, 소프트웨어 라이선스, 웹페이지 보일러플레이트 텍스트, 종교 전례문, HTML/CSS/JavaScript 보일러플레이트 코드.
- **근거:** 높은 중복 시퀀스에서는 perplexity가 기억화의 좋은 예측자가 아니다. 중복 수 6에서 기억화/비기억화 perplexity 분포 간 KL divergence가 최대이며, 그 이상에서는 분포가 거의 동일해진다.
- **임계값 선택:** 5 이상의 중복 횟수를 기준으로 선택하며, 1 또는 10 등 다른 임계값과 비교하여 동등하거나 더 나은 성능을 보인다.

### 4.2 Reconstruction (재구성)

- **정의:** **본질적으로 예측 가능한(inherently predictable)** 시퀀스 — 반복(repeating) 또는 증가(incrementing) 패턴을 따르는 템플릿.
- **직관:** 인간이 일반적 패턴을 기억하고 빈 곳을 채워 문장을 재구성하는 것처럼, LM은 템플릿 기반 패턴을 재구성한다.
- **예시:** 장 목차, 구절 반복, 산술 시퀀스. 코드가 자연어보다 재구성될 확률이 높다.
- **주의:** 이러한 시퀀스는 학습 중 한 번도 등장하지 않아도 완벽하게 재현될 수 있으므로, "진정한" 기억화라고 보기 어려운 경우가 있다.

### 4.3 Recollection (회상)

- **정의:** 고도 중복(Recitation)도 아니고, 템플릿 기반(Reconstruction)도 아닌, **드물게 등장하지만 기억화된** 시퀀스.
- **직관:** 인간이 단일 노출 후 산발적으로 에피소드 기억이나 단편을 회상하는 것처럼, LM은 학습 중 드물게 본 시퀀스를 회상한다.
- **예시:** 법률 텍스트, 종교 전례문의 미세한 번역 차이, 인덱싱 차이. 코드에서는 엄격한 반복/증가 패턴이 아닌 템플릿 패턴.
- **중요 발견:** 텍스트 매칭 카운트와 기억화 간의 상관관계가 Recollection에서 중립적 또는 부정적이다. 즉, 드문 토큰 시퀀스가 동일 문자열의 다른 토큰화인 경우 기억화 가능성이 *낮아진다*.

---

## 5. 모델 크기와 학습 시간에 따른 분포 변화 (Distribution Across Scale and Time)

![Figure 4: 모델 크기와 학습 시간에 따른 각 분류 카테고리의 기억화 변화](/images/papers/recite-reconstruct-recollect/categories_counts_percents-1.png)
*Figure 4: 파라미터 크기와 학습 시간에 따른 분류체계별 기억화 데이터 양. (a) 완전 학습 모델별 총 카운트, (b) 카테고리별 비율, (c) 12B 모델의 학습 과정 중 총 기억화 카운트, (d) 학습 과정 중 카테고리별 비율. 비율 그래프는 80%에서 잘렸다(Recitation이 일관되게 다수를 차지하므로).*

### 5.1 모델 크기

- 모든 유형의 기억화가 모델 크기와 함께 증가하지만, 증가 속도가 다르다.
- **Recollection이 가장 빠르게 증가:** 70M 모델에서 기억화된 예시의 4.49%에서 12B 모델에서 11.34%로 성장. 더 큰 모델이 사소하게 재구성할 수 없는 희귀 시퀀스를 기억화하는 경향이 있음을 시사한다.
- **Reconstruction은 거의 증가하지 않음:** 가장 작은 모델도 반복/증가 템플릿을 거의 최대 모델만큼 효과적으로 외삽하는 것을 학습했음을 의미한다.

### 5.2 학습 시간

- 학습이 진행될수록 기억화 풀이 증가하는 것은 알려져 있지만, 그 원인이 순전히 더 많은 시퀀스에 대한 노출 때문인지, 반복 노출 때문인지, 또는 후기 모델의 구조적 특성 때문인지를 규명한다.
- **기억화가 서브-선형적으로 증가:** 균일한 확률로 누적되지 않는다.
- **Recitation 비율은 감소:** 만약 기억화가 순전히 반복 노출 때문이라면 Recitation이 주요 원인이어야 하지만, 실제로는 Recitation의 상대적 비율이 감소한다.
- **Recollection이 가장 큰 비율 증가:** 이 추세는 총 학습 시간의 약 86%까지 유지되며, 이후 Reconstruction이 급격히 증가한다(더 복잡한 템플릿의 일반화에 대한 breakthrough로 추정).
- **결론:** 기억화는 반복 노출, 새로운 시퀀스 기억화 기회, 기타 미탐구 요인의 조합을 통해 학습 후기까지 계속 발생한다.

---

## 6. 기억화 예측 (Predicting Memorization)

### 6.1 분류체계의 유용성

유용한 분류체계(taxonomy)는 카테고리 간 특성(feature)의 의존성(dependency)이 다른 **자연종(natural kinds)**을 반영해야 한다. 가장 명백한 사례는 **Simpson's Paradox** — 전체 인구에서는 두 변수가 상관관계를 보이지만, 각 하위집단을 별도로 고려하면 상관관계 방향이 역전되는 현상이다.

### 6.2 예측 모델 설계

각 모델은 L2 정규화, 바이어스 파라미터, 균형 클래스 가중치를 사용한 **로지스틱 회귀(logistic regression)**이다.

- **Generic baseline model (일반 베이스라인):** 분류체계 없이 전체 기억화 데이터셋에서 학습된 단일 로지스틱 회귀 모델.
- **Intuitive taxonomic model (직관적 분류체계 모델, 제안 모델):** 샘플을 분류체계 그룹으로 나눈 후, 각 카테고리에 대해 별도의 로지스틱 회귀를 학습. 총 3개의 이진 로지스틱 회귀 모델 세트.
- **Optimally partitioned model (최적 파티션 모델):** 동일한 3-회귀 아키텍처를 사용하되, 특성-임계값(feature-threshold) 조합을 탐색하여 최적의 파티션을 찾는다. 각 특성의 25th, 50th, 75th 백분위수를 잠재적 임계값으로 고려하고, 대표 테스트 셋의 F1 점수 기반으로 최적 3-카테고리 파티션을 선택한다. 최적 파티션은 Huffman coding length와 시퀀스 중복 카운트를 기반으로 한다.

### 6.3 결과

![Figure 5: 베이스라인, 제안 분류체계, 최적 파티션 모델의 성능 비교](/images/papers/recite-reconstruct-recollect/model_performance_evals.png)
*Figure 5: 베이스라인, 제안 분류체계(taxonomy), 최적 파티션 모델의 다양한 메트릭에 대한 성능 비교. 부트스트래핑으로 계산된 표준편차 신뢰구간 포함.*

- 탐욕적 최적 파티션(greedy-optimal partition)은 대부분의 메트릭에서 집계 베이스라인보다 약간 우수하다.
- **직관적 분류체계(intuitive taxonomy)가 더 잘 보정(calibrated)되고 정확하다.** 단, Recollection 세트에서는 낮은 precision을 보인다.
- 직관이 가능한 데이터 파티션 탐색보다 더 나은 분류체계를 안내했다는 결론.

### 6.4 카테고리 간 차이

![Figure 6: 균일 집계 베이스라인과 직관적 분류체계 카테고리에서 학습된 예측 모델의 특성 가중치](/images/papers/recite-reconstruct-recollect/model_weights.png)
*Figure 6: 균일 집계 베이스라인과 직관적 분류체계 카테고리별 예측 모델의 특성 가중치(feature weights).*

주요 발견:

- **Recollection (희귀 시퀀스):** 희귀 토큰이 없을수록 기억화 가능성이 높다. 시퀀스 내 희귀 토큰의 사전 확률이 낮아 기억화에 대한 저항이 더 큰 것으로 추정된다.
- **중복 횟수의 효과:** Recollection 후보에서는 중복 횟수가 많을수록 기억화 가능성이 높지만, Recitation 후보에서는 중복 횟수의 영향이 거의 없다. 5-중복 임계값을 넘으면 추가 노출이 기억화에 크게 기여하지 않음을 시사한다.
- **Perplexity의 효과:** 예측 가능한 continuation은 모든 카테고리에서 기억화와 강하게 연관되지만, 예측 불가능한(높은 perplexity) 프롬프트는 Reconstruction을 제외한 모든 경우에서 기억화와 강하게 연관된다. 높은 perplexity 프롬프트는 종종 동일한 continuation의 고유한 인덱스로 작용하여 기억화된 시퀀스를 트리거하지만, 낮은 perplexity 프롬프트는 공통 템플릿을 시작하여 재구성을 가능하게 할 수 있다.

---

## 7. 논의 및 향후 연구 (Discussion and Future Work)

### 7.1 기억화의 존재론(Ontologies of Memorization)

기존 연구와의 관계:
- Dankers et al. (2023): 기계 번역에서 counterfactual memorization에 영향을 미치는 요인(희귀 토큰, 긴 시퀀스 길이, 높은 BPE segmentation rate) 조사. 본 논문은 그 중 희귀 토큰이 특히 Recollection을 예측함을 확인.
- Hartmann et al. (2023): 저작권 침해와 프라이버시에 관련된 기억화의 측면을 고찰.
- Bansal et al. (2023): heuristic memorization(shortcut learning)과 example memorization을 구분. 본 논문은 example memorization을 더 세분화.

### 7.2 각 카테고리의 관련성

기억화를 연구하는 동기에 따라 관련 카테고리가 다르다:

- **지적 재산권 침해:** 자주 발췌되는 인기 도서의 구절 같은 고중복 데이터 → Recitation. 희귀 시퀀스의 기억화도 가능하므로 Recollection도 관련.
- **프라이버시:** 개인 식별 정보의 기억화 방지가 목표 → 적은 노출 횟수에도 생성될 수 있으므로 **Recollection**에 집중.
- **일반화의 과학적 이해:** 기억화와 일반적 패턴 인식 간의 직접적 연결을 노출하는 **Reconstruction**에 집중.

### 7.3 존재론과 통계

이 분류체계는 기억화에 대한 집계(aggregate) 처리와 다면적(multifaceted) 처리를 비교하는 예측 모델을 통해 검증되었다. 기억화와 각 분류 카테고리를 정의하는 속성 간의 의존적, 비선형적 임계값 관계에서의 예측적 판단 향상을 측정함으로써 분류체계 모델에 대한 증거를 제공한다.

---

## 8. 한계점 (Limitations)

1. **선형 의존성 가정:** 본문의 예측 모델은 선형 의존성만 고려하며, 더 일반적인 통계적 의존성은 부록의 보충 실험에서만 다룬다.
2. **기억화 정의의 제한:** 32-extractable 정의는 fuzzy 또는 partial memorization 개념을 포착하지 못한다. Counterfactual memorization 정의를 사용하면 Recitation이나 Reconstruction 패턴이 크게 줄어들 수 있다.
3. **Reconstruction 카테고리의 포괄성:** 반복과 증가 패턴만 고려하며, 모든 가능한 템플릿 패턴을 포괄하지 않는다.

---

## 9. 결론

이 논문은 LLM의 기억화를 인간의 기억 방식에서 영감을 받아 Recitation, Reconstruction, Recollection의 세 가지 범주로 분류하는 직관적 분류체계를 제안했다. 이 분류체계를 통해 기억화에 영향을 미치는 요인이 카테고리별로 다르게 작용함을 밝히고, 분류체계 기반 예측 모델이 분류체계 없는 베이스라인과 자동 최적화된 모델보다 우수한 성능을 달성함을 입증했다. 특히 Recollection이 모델 크기와 학습 시간에 따라 가장 빠르게 증가하는 카테고리라는 발견은, 큰 모델이 희귀 시퀀스의 기억화에 더 취약함을 시사하며, 프라이버시 연구에 중요한 시사점을 제공한다.
