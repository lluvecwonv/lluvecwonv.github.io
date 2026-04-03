---
title: "PPTAgent: Generating and Evaluating Presentations Beyond Text-to-Slides"
date: 2026-04-03
summary: ACL 2025 논문 PPTAgent를 정리한 글. 기존 text-to-slides 패러다임 대신 reference presentation을 분석하고 edit-based approach로 프레젠테이션을 생성하는 에이전트 프레임워크와, Content·Design·Coherence 3차원으로 평가하는 PPTEval을 제안한다.
tags: [LLM, Agent, Presentation Generation, Multimodal, Code Generation, 연구노트]
category: 연구노트
language: ko
---

이번 연구노트는 ACL 2025 논문 **PPTAgent: Generating and Evaluating Presentations Beyond Text-to-Slides**를 정리한 글이다.

논문 링크: [https://github.com/icip-cas/PPTAgent](https://github.com/icip-cas/PPTAgent)

## 한 줄 요약

문서를 입력받아 프레젠테이션을 자동 생성할 때, 기존처럼 텍스트를 요약해서 슬라이드를 만드는 것이 아니라 **reference presentation을 분석한 뒤 edit API로 슬라이드를 편집**하는 에이전트 기반 접근법을 제안하고, 프레젠테이션 품질을 Content·Design·Coherence 3차원으로 평가하는 **PPTEval** 프레임워크도 함께 제시한다.

---

## 1. 서론

프레젠테이션은 정보 전달에 널리 활용되지만, 좋은 프레젠테이션을 만들려면 스토리라인, 레이아웃 디자인, 풍부한 콘텐츠를 모두 갖춰야 한다. 이 때문에 자동 프레젠테이션 생성(Automated Presentation Generation)에 대한 관심이 커지고 있다.

기존 접근법들은 대부분 **text-to-slides** 패러다임을 따른다. 즉, LLM의 출력을 미리 정의된 규칙이나 템플릿으로 변환하는 방식이다. 이 방식의 근본적인 문제는 프레젠테이션 생성을 **추상적 요약(abstractive summarization)** 태스크로 취급한다는 것이다. 텍스트 콘텐츠에만 집중하고 프레젠테이션의 **시각적 특성(visual-centric nature)**을 무시하기 때문에, 텍스트로 가득 차고 단조로운 결과물을 만들게 된다.

![기존 방식과 PPTAgent 비교](/images/pptagent/fig1.png)
*Figure 1. PPTAgent(왼쪽)와 기존 abstractive summarization 방식(오른쪽)의 비교. PPTAgent는 reference slide를 선택하고 편집하는 방식으로 시각적 품질을 유지한다.*

실제 사람이 프레젠테이션을 만드는 워크플로우를 생각해보면, 처음부터 복잡한 슬라이드를 한 번에 만드는 것이 아니라 **잘 만들어진 슬라이드를 참고하여 핵심 내용을 요약하고 옮기는** 과정을 거친다. PPTAgent는 이 직관에서 출발한다.

하지만 이런 edit-based approach를 실현하는 데에는 두 가지 핵심적인 기술적 어려움(challenge)이 있다.

첫째, 프레젠테이션의 레이아웃과 모달리티가 복잡하기 때문에 LLM이 어떤 슬라이드를 reference로 사용해야 하는지 직접 판단하기 어렵다. 핵심 과제는 LLM이 reference presentation의 구조와 콘텐츠 패턴을 잘 이해하도록 하는 것이다. → 이를 해결하기 위해 **Stage I(Presentation Analysis)**에서 slide clustering과 schema extraction을 수행한다.

둘째, 대부분의 프레젠테이션은 **PowerPoint의 XML 포맷**으로 저장되는데, 하나의 슬라이드가 **1,000줄 이상의 XML**로 표현될 정도로 장황하고 중복이 많다(Gryk, 2022). 이런 verbose한 XML을 LLM에 직접 입력하면 토큰 낭비가 심하고, 정확한 위치를 찾아 편집하는 것이 극도로 어렵다. → 이를 해결하기 위해 **XML을 HTML representation으로 렌더링**하여 LLM이 훨씬 간결하고 직관적인 포맷으로 슬라이드를 이해하고 편집할 수 있게 한다. Ablation study에서 이 HTML 렌더링(CodeRender)을 제거하면 성공률이 95.0%에서 74.6%로 급락하는 것이 이 기여의 중요성을 보여준다.

---

## 2. PPTAgent 프레임워크

PPTAgent는 두 단계(Stage)로 구성된다.

![PPTAgent 전체 워크플로우](/images/pptagent/fig2.png)
*Figure 2. PPTAgent 워크플로우 개요. Stage I에서 reference presentation을 분석하고, Stage II에서 outline 기반으로 새 프레젠테이션을 생성한다.*

### 2.1 문제 정의

기존 방식은 입력 콘텐츠 $C$로부터 슬라이드 요소들을 직접 생성한다:

$$S = \{e_1, e_2, \dots, e_n\} = f(C)$$

각 요소는 (타입, 콘텐츠, 스타일 속성) 튜플로 정의된다. 예를 들어 `(Textbox, "Hello", {border, size, position, ...})`처럼 **요소의 내용뿐 아니라 위치·크기·테두리 등 스타일까지 모두 직접 지정**해야 한다. 이렇게 모든 styling attribute를 수동으로 명시하는 것은 자동 생성에서 매우 어렵다.

PPTAgent는 완전히 다른 접근을 취한다. 슬라이드를 처음부터 만드는 대신, 이미 잘 디자인된 reference slide $R_j$를 가져와서 **코드로 편집**한다:

$$A = \{a_1, a_2, \dots, a_m\} = g(C, R_j)$$

여기서 각 액션 $a_i$는 **edit API 호출 한 줄**에 대응한다. 논문에서 제공하는 edit API는 다음과 같다:

| API | 설명 |
|---|---|
| `replace_span(element, text)` | 텍스트 span의 내용을 교체 |
| `replace_image(element, image)` | 이미지 요소의 소스를 교체 |
| `del_span(element)` | 텍스트 span 삭제 |
| `del_image(element)` | 이미지 요소 삭제 |
| `clone_paragraph(element)` | 기존 paragraph를 복제 |

예를 들어 "AI 트렌드" 주제의 새 슬라이드를 만든다면, LLM은 다음과 같은 **편집 코드 시퀀스**를 생성한다:

```python
replace_span("title_1", "2025 AI Trends")        # a1: 제목 교체
replace_span("body_2", "Key developments in...")  # a2: 본문 교체
replace_image("img_3", "ai_chart.png")            # a3: 이미지 교체
del_span("footer_4")                              # a4: 불필요한 푸터 삭제
```

이렇게 하면 reference slide의 **레이아웃, 색상, 폰트, 위치 등 모든 디자인 속성은 그대로 유지**하면서 콘텐츠만 교체할 수 있다. LLM이 스타일을 하나하나 지정할 필요가 없어지는 것이 핵심이다.

### 2.2 Stage I: Presentation Analysis

이 단계에서는 reference presentation을 분석하여 이후 reference 선택과 슬라이드 생성을 안내한다.

**Slide Clustering**: 슬라이드는 기능에 따라 두 가지 유형으로 분류된다.

- **Structural slides**: 프레젠테이션의 구조를 지원하는 슬라이드 (예: 오프닝 슬라이드, 섹션 구분 슬라이드)
- **Content slides**: 구체적인 정보를 전달하는 슬라이드 (예: 불릿 포인트 슬라이드)

Structural slides는 LLM의 long-context 능력을 활용하여 텍스트 특성 기반으로 식별하고 그룹화한다. Content slides는 이미지로 변환한 뒤 hierarchical clustering으로 유사한 이미지를 그룹핑하고, MLLM을 이용해 각 클러스터의 레이아웃 패턴을 분석한다. 클러스터링 시 코사인 유사도 threshold $\theta = 0.65$를 사용하며, 레이아웃 패턴에 집중하기 위해 텍스트는 placeholder 문자('a')로, 이미지 요소는 단색 배경으로 대체한 뒤 ViT 임베딩 기반으로 유사도 행렬을 계산한다.

**Schema Extraction**: 클러스터링 후 각 슬라이드의 content schema를 추출한다. 각 요소는 **category(카테고리)**, **description(설명)**, **content(내용)**으로 표현되어, 슬라이드의 구조적 정보를 명확하게 파악할 수 있다.

### 2.3 Stage II: Presentation Generation

**Outline Generation**: LLM을 이용해 구조화된 outline을 생성한다. 각 항목(entry)은 새 슬라이드 하나를 나타내며, Stage I에서 추출한 functional description을 기반으로 선택된 reference slide와 입력 문서에서 파악된 관련 콘텐츠를 포함한다.

**Slide Generation**: outline의 각 항목에 따라 슬라이드를 반복적으로 생성한다. 각 슬라이드는 reference slide의 레이아웃을 채택하면서 콘텐츠와 구조적 명확성을 유지한다.

구체적으로, 앞서 2.1에서 설명한 **edit-based API**(replace_span, replace_image, del_span, del_image, clone_paragraph)를 사용하여 LLM이 reference slide를 편집하는 코드를 생성한다. 이때 핵심적인 설계 결정은 LLM에 슬라이드를 어떤 포맷으로 보여줄 것인가이다. 원본 PowerPoint XML은 하나의 슬라이드가 1,000줄 이상으로 표현되어 LLM이 이해하기 어렵다. 이를 해결하기 위해 reference slide를 **HTML representation**으로 렌더링하여, LLM이 각 요소의 id와 내용을 직관적으로 파악하고 정확한 edit API 호출을 생성할 수 있게 한다.

**Self-Correction Mechanism**: 생성된 편집 액션은 REPL(Read-Eval-Print Loop) 환경에서 실행된다. 액션이 reference slide에 적용되지 못하면, REPL이 실행 피드백(Python 에러 등)을 제공하고, LLM이 이를 분석하여 편집 액션을 수정한다. 이 과정을 유효한 슬라이드가 생성되거나 최대 재시도 횟수에 도달할 때까지 반복한다. 슬라이드당 최대 2회의 self-correction iteration을 허용한다.

---

## 3. PPTEval: 프레젠테이션 평가 프레임워크

기존에는 프레젠테이션 품질을 종합적으로 평가하는 프레임워크가 없었다. PPTEval은 MLLM-as-a-judge 패러다임을 채택하여 프레젠테이션을 세 가지 차원에서 평가한다 (1-5 스케일).

![PPTEval 평가 프레임워크](/images/pptagent/fig3.png)
*Figure 3. PPTEval은 Content, Design, Coherence 세 차원에서 프레젠테이션을 평가한다.*

| **차원** | **평가 기준** |
|---|---|
| **Content** | 텍스트는 간결하고 문법적으로 정확해야 하며, 관련 이미지로 보강되어야 한다 |
| **Design** | 조화로운 색상과 적절한 레이아웃으로 가독성을 보장하며, 기하학적 도형 등 시각 요소가 전체적인 매력을 높여야 한다 |
| **Coherence** | 구조가 점진적으로 발전하며, 필수적인 배경 정보가 포함되어야 한다 |

Content와 Design은 **슬라이드 레벨**에서 평가하고 평균을 내며, Coherence는 **프레젠테이션 전체 레벨**에서 평가한다.

---

## 4. 실험

### 4.1 데이터셋: Zenodo10K

기존 프레젠테이션 데이터셋들은 PDF나 JSON 포맷으로 저장되어 구조적 관계나 스타일 속성 같은 시맨틱 정보가 손실되고, 대부분 AI 분야 학술 프레젠테이션으로 구성되어 다양성이 부족했다.

이를 해결하기 위해 Zenodo에서 수집한 **Zenodo10K** 데이터셋(10,448개 프레젠테이션)을 제안한다. 실험에는 5개 도메인(Culture, Education, Science, Society, Tech)에서 각각 10개의 reference presentation과 10개의 입력 문서를 샘플링했다.

| **Domain** | #Chars (Doc) | #Figs (Doc) | #Chars (Pres) | #Figs (Pres) | #Pages |
|---|---|---|---|---|---|
| Culture | 12,708 | 2.9 | 6,585 | 12.8 | 14.3 |
| Education | 12,305 | 5.5 | 3,993 | 12.9 | 13.9 |
| Science | 16,661 | 4.8 | 5,334 | 24.0 | 18.4 |
| Society | 13,019 | 7.3 | 3,723 | 9.8 | 12.9 |
| Tech | 18,315 | 11.4 | 5,325 | 12.9 | 16.8 |

### 4.2 구현 세부사항

PPTAgent는 세 가지 모델로 구현된다.

- **GPT-4o-2024-08-06** (GPT-4o)
- **Qwen2.5-72B-Instruct** (Qwen2.5): 텍스트 처리
- **Qwen2-VL-72B-Instruct** (Qwen2-VL): 시각 처리

모델은 Language Model(LM)과 Vision Model(VM) 조합으로 구성된다 (예: Qwen2.5_LM + Qwen2-VL_VM).

실험 데이터는 5개 도메인 × 10개 입력 문서 × 10개 reference presentation = **설정당 500개 생성 태스크**로 구성된다. 오픈소스 LLM은 VLLM 프레임워크를 사용하여 NVIDIA A100 GPU에서 배포했으며, 총 실험 비용은 약 **500 GPU 시간**이다.

### 4.3 베이스라인

- **DocPres**: 규칙 기반(rule-based) 방법. multi-stage로 narrative-rich 슬라이드를 생성하고, 유사도 기반으로 이미지를 삽입한다.
- **KCTV**: 템플릿 기반(template-based) 방법. 중간 포맷으로 슬라이드를 만든 뒤 미리 정의된 템플릿으로 변환한다.

베이스라인은 시각 정보를 처리하지 않으므로 vision model 없이 동작한다.

### 4.4 평가 메트릭

- **Success Rate (SR)**: 성공적으로 완료된 태스크 비율
- **Perplexity (PPL)**: Llama-3-8B로 측정한 텍스트 유창성 (낮을수록 좋음)
- **ROUGE-L**: 생성·참조 텍스트 간 최장 공통 부분수열 기반 F1
- **FID**: 생성·참조 프레젠테이션 간 feature space 유사도
- **PPTEval**: GPT-4o를 judge로 사용하여 Content, Design, Coherence 3차원 평가

### 4.5 주요 실험 결과

| Configuration | | SR(%) | PPL↓ | ROUGE-L↑ | FID↓ | Content↑ | Design↑ | Coherence↑ | Avg.↑ |
|---|---|---|---|---|---|---|---|---|---|
| **DocPres** | GPT-4o_LM | -- | 76.42 | 13.28 | -- | 2.98 | 2.33 | 3.24 | 2.85 |
| | Qwen2.5_LM | -- | 100.4 | 13.09 | -- | 2.96 | 2.37 | 3.28 | 2.87 |
| **KCTV** | GPT-4o_LM | 80.0 | 68.48 | 10.27 | -- | 2.49 | 2.94 | 3.57 | 3.00 |
| | Qwen2.5_LM | 88.0 | **41.41** | **16.76** | -- | 2.55 | 2.95 | 3.36 | 2.95 |
| **PPTAgent** | GPT-4o_LM+VM | **97.8** | 721.54 | 10.17 | 7.48 | 3.25 | 3.24 | 4.39 | 3.62 |
| | Qwen2-VL_LM+VM | 43.0 | 265.08 | 13.03 | 7.32 | 3.13 | **3.34** | 4.07 | 3.51 |
| | Qwen2.5_LM+Qwen2-VL_VM | 95.0 | 496.62 | 14.25 | **6.20** | **3.28** | 3.27 | **4.48** | **3.67** |

핵심 발견 사항:

**PPTAgent는 전체 프레젠테이션 품질을 유의미하게 개선한다.** PPTEval의 세 차원 모두에서 베이스라인을 크게 능가한다. 규칙 기반 DocPres 대비 Design에서 +40.9%, Content에서 +12.1% 향상을 보인다. 템플릿 기반 KCTV 대비 Design에서 +13.2%, Content에서 +28.6% 개선된다. 특히 Coherence 차원에서 가장 큰 향상(DocPres 대비 +25.5%, KCTV 대비 +36.6%)을 보이는데, 이는 PPTAgent가 슬라이드의 구조적 역할을 종합적으로 분석하기 때문이다.

**PPTAgent는 높은 생성 안정성을 보인다.** Qwen2.5_LM + Qwen2-VL_VM과 GPT-4o_LM + GPT-4o_VM 모두 95% 이상의 성공률을 달성하며, KCTV(88.0%)보다 크게 높다.

**PPTEval이 기존 메트릭보다 우수한 평가 능력을 보인다.** PPL이나 ROUGE-L 같은 전통적 메트릭은 일관되지 않은 평가 경향을 보인다. 예를 들어 KCTV는 높은 ROUGE-L(16.76)을 달성하지만 Content 점수는 낮고(2.55), PPTAgent는 그 반대 패턴을 보인다.

### 4.6 Ablation Study

| Setting | SR(%) | Content | Design | Coherence | Avg. |
|---|---|---|---|---|---|
| PPTAgent (full) | **95.0** | **3.28** | 3.27 | **4.48** | **3.67** |
| w/o Outline | 91.0 | 3.24 | 3.30 | 3.36 | 3.30 |
| w/o Schema | 78.8 | 3.08 | 3.23 | 4.04 | 3.45 |
| w/o Structure | 92.2 | 3.28 | 3.25 | 3.45 | 3.32 |
| w/o CodeRender | 74.6 | 3.27 | **3.34** | 4.38 | 3.66 |

두 가지 핵심 발견:

1. **HTML 기반 표현이 상호작용 복잡성을 크게 줄인다**: Code Render를 제거하면 성공률이 95.0%에서 74.6%로 급락한다.
2. **Presentation Analysis가 생성 품질에 필수적이다**: Outline과 Structure를 제거하면 Coherence가 4.48에서 3.36/3.45로 크게 하락하고, Schema를 제거하면 성공률이 95.0%에서 78.8%로 감소한다.

### 4.7 Score Distribution

![Score Distribution](/images/pptagent/quantitative.png)
*Figure 4. PPTAgent, DocPres, KCTV로 생성한 프레젠테이션의 Content, Design, Coherence 차원 점수 분포. PPTAgent가 고점수 비율이 훨씬 높다.*

베이스라인들은 규칙/템플릿 기반 패러다임의 한계로 Content와 Design 점수가 대부분 2-3에 몰려 있다. 반면 PPTAgent는 80% 이상의 프레젠테이션이 이 차원에서 3 이상을 달성하며, Coherence에서는 80% 이상이 4 이상을 받았다.

### 4.8 Self-Correction 효과

![Self-Correction 분석](/images/pptagent/self-correction.png)
*Figure 5. 서로 다른 모델에서 단일 슬라이드를 생성하는 데 필요한 반복적 self-correction 횟수.*

GPT-4o는 Qwen2.5보다 우수한 self-correction 능력을 보이지만, Qwen2.5는 첫 생성에서 오류가 더 적다. Qwen2-VL은 multimodal post-training으로 인해 오류가 더 빈번하고 self-correction 능력도 떨어진다. 세 모델 모두 절반 이상의 오류를 성공적으로 수정하여, iterative self-correction 메커니즘이 효과적임을 보여준다.

### 4.9 Agreement Evaluation

PPTEval과 인간 평가 간 상관관계:

| Correlation | Content | Design | Coherence | Avg. |
|---|---|---|---|---|
| **Pearson** | 0.70 | 0.90 | 0.55 | 0.71 |
| **Spearman** | 0.73 | 0.88 | 0.57 | 0.74 |

평균 Pearson 상관계수 0.71로, 다른 평가 방법들의 점수를 능가하며 PPTEval이 인간 선호도와 잘 일치함을 보여준다. 특히 Design 차원에서 0.90의 매우 높은 상관을 보인다.

![기존 메트릭과의 상관관계](/images/pptagent/correlation.png)
*Figure 6. PPTEval의 Content/Design 차원과 기존 자동 평가 메트릭 간 상관 히트맵. 기존 메트릭들은 프레젠테이션 평가에 비효과적임을 보여준다.*

### 4.10 Case Study

![정성적 비교 분석](/images/pptagent/qualitative_analysis.png)
*Figure 7. 서로 다른 방법으로 생성된 프레젠테이션의 비교. PPTAgent는 다양한 reference에서 시각적으로 풍부한 슬라이드를 생성하는 반면, DocPres와 KCTV는 텍스트 위주의 단조로운 결과를 보인다.*

PPTAgent는 맥락에 맞는 이미지 배치와 간결한 슬라이드 콘텐츠를 효과적으로 결합하며, 다양한 reference에서 시각적으로 매력적인 슬라이드를 생성한다. 반면 DocPres와 KCTV는 규칙/템플릿 기반의 한계로 주로 텍스트 중심의 슬라이드를 생성하며 시각적 다양성이 제한된다.

---

## 5. Limitations

저자들이 언급한 한계점:

1. 95% 이상의 높은 성공률에도 불구하고 간혹 생성에 실패하여 신뢰성에 제약이 있다.
2. 생성 품질이 입력 reference presentation의 품질에 영향을 받으며, 이는 차선의 결과물로 이어질 수 있다.
3. 레이아웃 최적화에서 개선을 보였지만, 시각적 정보를 완전히 활용하지는 못하여 요소 겹침 같은 디자인 결함이 발생할 수 있다.

---

## 6. 결론

PPTAgent는 프레젠테이션 생성을 "reference presentation을 분석하고 편집하는 2단계 에이전트 태스크"로 재정의함으로써, 기존 text-to-slides 방식의 한계를 극복한다. PPTEval은 reference-free 프레젠테이션 품질 평가의 새로운 기준을 제시한다. 다양한 도메인 데이터에서의 실험 결과가 이 방법론의 우수성을 입증하며, 비지도 조건에서의 슬라이드 생성에 새로운 패러다임을 제공한다.
