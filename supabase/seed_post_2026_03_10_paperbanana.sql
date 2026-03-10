-- PaperBanana 연구노트 seed SQL
-- Generated: 2026-03-10

INSERT INTO public.posts (slug, title, date, summary, tags, category, content, published, language)
VALUES (
  '2026-03-10-paperbanana-automating-academic-illustration',
  'PaperBanana: Automating Academic Illustration for AI Scientists 논문 정리',
  '2026-03-10',
  'Google Cloud AI Research와 북경대의 공동 연구. 5개 특화 에이전트(Retriever, Planner, Stylist, Visualizer, Critic)를 오케스트레이션하여 학술 논문의 방법론 다이어그램과 통계 플롯을 자동 생성하는 agentic framework PaperBanana를 제안하고, NeurIPS 2025 기반 벤치마크에서 기존 베이스라인을 전면 초과 달성한 연구.',
  ARRAY['Academic Illustration', 'Methodology Diagram', 'Statistical Plot', 'Multi-Agent', 'VLM', 'Image Generation', 'Agentic Framework', 'NeurIPS', '연구노트'],
  '연구노트',
  $$이번 연구노트는 arXiv:2601.23265 논문 **PaperBanana: Automating Academic Illustration for AI Scientists**를 정리한 글이다.
저자는 Peking University의 Dawei Zhu, Xiyu Wei, Sujian Li와 Google Cloud AI Research의 Rui Meng, Yale Song, Tomas Pfister, Jinsung Yoon이다.

핵심 질문은 이렇다.

**"AI 과학자가 논문의 방법론 다이어그램과 통계 플롯을 publication-ready 수준으로 자동 생성할 수 있는가?"**

기존 코드 기반 접근법(TikZ, Python-PPTX, SVG)은 구조화된 콘텐츠에 효과적이지만 복잡한 시각 요소 표현에 한계가 있고, 최신 이미지 생성 모델은 고품질 출력을 보여주지만 학술 표준에 부합하는 일러스트레이션을 일관되게 생성하기 어렵다. PaperBanana는 이 간극을 메우기 위해 **reference-driven agentic framework**를 제안한다.

논문 링크: https://arxiv.org/abs/2601.23265
프로젝트 페이지: https://dwzhu-pku.github.io/PaperBanana/

## 한 줄 요약

5개 특화 에이전트(Retriever, Planner, Stylist, Visualizer, Critic)가 협력하여 **참고 예제 검색 → 콘텐츠 계획 → 스타일 최적화 → 이미지 생성 → 자기 비평 반복**의 파이프라인으로 학술 일러스트레이션을 자동 생성하며, NeurIPS 2025 기반 벤치마크에서 Faithfulness +2.8%, Conciseness +37.2%, Readability +12.9%, Aesthetics +6.6%, Overall +17.0%의 성능 향상을 달성했다.

## 1. 서론 — 왜 학술 일러스트레이션 자동화가 필요한가

LLM의 발전으로 문헌 검토, 아이디어 생성, 실험 반복 등 연구 라이프사이클의 많은 부분이 자동화되었지만, 과학적 발견을 시각적으로 전달하는 일러스트레이션(다이어그램, 플롯) 생성은 여전히 노동 집약적인 병목 지점으로 남아 있다.

방법론 다이어그램 생성이 특히 어려운 이유:
- **콘텐츠 충실도와 시각적 미학 모두**를 요구한다
- 기존 코드 기반 접근법(TikZ, Python-PPTX, SVG)은 특수 아이콘이나 커스텀 도형 같은 복잡한 시각 요소 표현에 한계가 있다
- 최신 이미지 생성 모델(Nano-Banana-Pro, GPT-Image 등)은 고품질 시각적 출력을 보여주지만, 학술 기준에 맞는 일러스트레이션을 일관되게 생성하는 것은 어렵다
- 전문 일러스트레이션 도구에 필요한 전문 지식이 연구자들의 아이디어 자유로운 표현을 제약한다

### 주요 기여 (Contributions)

- **PaperBanana**: 특화된 에이전트들을 오케스트레이션하여 publication-ready 학술 일러스트레이션을 자동 생성하는 완전 자동화 agentic framework 제안
- **PaperBananaBench**: 학술 일러스트레이션, 특히 방법론 다이어그램의 품질을 평가하기 위한 종합 벤치마크 구축 (NeurIPS 2025 기반 292개 테스트 케이스)
- 포괄적 실험을 통해 기존 베이스라인 대비 유의미한 성능 향상 입증

## 2. 태스크 정의 (Task Formulation)

자동화된 학술 일러스트레이션 생성을 **소스 컨텍스트(S)**와 **의사소통 의도(C)**로부터 시각적 표현으로의 매핑을 학습하는 과제로 정의한다:

```
I = f(S, C)
```

- **S** (Source Context): 방법론 섹션 텍스트 등 핵심 정보를 담은 소스 컨텍스트
- **C** (Communicative Intent): 원하는 일러스트레이션의 범위와 초점을 명시하는 캡션
- **I**: 생성된 일러스트레이션

N개의 참고 예제 세트 ε = {E_n}을 통해 few-shot 학습을 지원하며, 각 예제 E_n = (S_n, C_n, I_n)은 컨텍스트, 캡션, 참고 일러스트레이션의 튜플로 구성된다. 통합 태스크:

```
I = f(S, C, ε)
```

ε가 공집합이면 zero-shot 생성이 된다.

## 3. 방법론 (Methodology) — PaperBanana Framework

PaperBanana는 **reference-driven agentic framework**로, 5개의 특화된 에이전트를 협력적으로 오케스트레이션하여 원시 과학 콘텐츠를 publication-quality 다이어그램과 플롯으로 변환한다. 전체 프레임워크는 **Linear Planning Phase**와 **Iterative Refinement Loop** 두 단계로 구성된다.

### 3.1 Retriever Agent

주어진 소스 컨텍스트 S와 의사소통 의도 C를 바탕으로, 고정된 참고 세트 R에서 가장 관련성 높은 N개의 예제를 식별한다.

```
ε = VLM_Ret(S, C, {(S_i, C_i)}_{E_i ∈ R})
```

VLM의 추론 능력을 활용한 **generative retrieval** 방식으로, 연구 분야(예: Agent & Reasoning)와 다이어그램 유형(예: pipeline, architecture)을 매칭하며, **시각적 구조 유사성을 주제 유사성보다 우선시**한다.

핵심 설계 원칙:
- 같은 주제 + 같은 시각적 의도 → 최상의 매칭
- 다른 주제 + 같은 시각적 의도 → 차선 (구조가 주제보다 중요)
- 같은 주제 + 다른 시각적 의도 → 회피

### 3.2 Planner Agent

시스템의 **인지적 핵심(cognitive core)**. 소스 컨텍스트 S, 의사소통 의도 C, 검색된 예제 ε를 입력받아 in-context learning을 통해 비구조화된 데이터를 타겟 일러스트레이션의 포괄적이고 상세한 텍스트 설명(P)으로 변환한다.

```
P = VLM_plan(S, C, {(S_i, C_i, I_i)}_{E_i ∈ ε})
```

설명은 최대한 상세해야 한다 — 각 요소와 연결을 의미론적으로 명확히 기술하고, 배경 스타일, 색상, 선 두께, 아이콘 스타일 등의 형식적 세부사항도 포함해야 한다. 모호하거나 불명확한 명세는 생성된 이미지의 품질을 저하시킨다.

### 3.3 Stylist Agent

**디자인 컨설턴트** 역할. 전체 참고 컬렉션 R을 탐색하여 다음 핵심 차원을 다루는 **Aesthetic Guideline G**를 자동 합성한다:
- 색상 팔레트
- 도형 및 컨테이너
- 선 및 화살표
- 레이아웃 및 구성
- 타이포그래피 및 아이콘

이 가이드라인으로 초기 설명 P를 스타일적으로 최적화된 버전 P*로 변환한다:

```
P* = VLM_style(P, G)
```

Stylist의 핵심 설계 원칙:
1. 입력 설명이 이미 고품질 미학을 묘사하고 있다면 **보존**한다
2. 부족하거나 구식으로 보이는 경우에만 개입한다
3. 도메인별 스타일 다양성을 존중한다
4. 평이한 입력이면 가이드라인의 시각적 속성으로 풍부하게 만든다
5. **의미적 콘텐츠, 논리, 구조는 절대 변경하지 않는다** — 순수 미학적 편집만 수행

### 3.4 Visualizer Agent

스타일적으로 최적화된 설명 P*를 받아 이미지 생성 모델을 활용하여 텍스트 설명을 시각적 출력으로 변환한다.

```
I_t = Image-Gen(P_t),  초기 P_0 = P*
```

### 3.5 Critic Agent

Visualizer와 함께 **closed-loop refinement 메커니즘**을 형성한다. 생성된 이미지 I_t를 원본 소스 컨텍스트(S, C)와 대조하여 사실적 불일치, 시각적 결함, 개선 영역을 식별하고, 수정된 설명 P_{t+1}을 생성한다.

```
P_{t+1} = VLM_critic(I_t, S, C, P_t)
```

Critic의 비평 규칙:
- **Content**: Fidelity & Alignment, Text QA, Validation of Examples, Caption Exclusion
- **Presentation**: Clarity & Readability, Legend Management

Visualizer-Critic 루프는 **T=3회 반복**되며, 최종 출력은 I = I_T이다. 추가 반복은 미학과 기술적 정확성 사이의 균형을 보장하면서 모든 지표를 더 향상시킨다.

### 3.6 통계 플롯으로의 확장

통계 플롯에서는 수치적 정확성이 필요하므로, Visualizer가 설명 P_t를 **실행 가능한 Python Matplotlib 코드**로 변환하는 **코드 기반 접근법**을 채택한다:

```
I_t = VLM_code(P_t)
```

Critic은 렌더링된 플롯을 평가하고 부정확성이나 불완전성을 해결하는 수정된 설명을 생성한다. 동일하게 T=3회 반복 과정이 적용된다.

## 4. 벤치마크 구축 (PaperBananaBench)

### 4.1 데이터 큐레이션

**수집 및 파싱**: NeurIPS 2025의 5,275편 논문 중 2,000편을 무작위 샘플링하여 PDF를 검색하고, MinerU 툴킷을 사용하여 방법론 섹션 텍스트, 모든 다이어그램 및 캡션을 추출.

**필터링**:
- 방법론 다이어그램이 없는 논문 제외 → 1,359개 유효 후보
- 가로세로 비율(w:h) [1.5, 2.5] 범위로 제한:
  - 1.5 미만: 논리적 흐름에 필요한 넓은 가로 레이아웃에 부적합
  - 2.5 초과: 현재 이미지 모델 미지원
  - 이상치 포함 시 side-by-side 평가에서 인간 원본이 드러나는 편향 발생
- → 610개 유효 후보. 각 후보는 (S, I, C) 튜플: S=방법론 설명, I=방법론 다이어그램, C=캡션

**카테고리화**: 시각적 토폴로지와 콘텐츠 기반으로 4개 클래스로 분류:
- **Agent & Reasoning** (31.5%): LLM 에이전트, 멀티에이전트, 추론, 계획, 도구 사용, 코드 생성
- **Vision & Perception** (25.0%): 컴퓨터 비전, 3D 재구성, 렌더링, 깊이 추정
- **Generative & Learning** (25.0%): 확산 모델, GAN, VAE, 강화학습, 최적화
- **Science & Applications** (18.5%): AI for Science, GNN, 이론적 분석

Gemini-3-Pro를 사용하여 분류 수행.

**휴먼 큐레이션**: 어노테이터들이 추출된 방법론 설명과 캡션을 검증/수정하고, 다이어그램 분류 정확성을 검증하며, 시각적 품질이 부족한 다이어그램(지나치게 단순, 어수선, 추상적 디자인 등)을 필터링. 결과: **584개 유효 샘플** → 테스트 세트(N=292)와 참고 세트(N=292)로 균등 분할. 평균 소스 컨텍스트/캡션 길이: 3,020.1 / 70.4 단어.

### 4.2 평가 프로토콜

**VLM-as-a-Judge** 방식을 사용하여 모델 생성 다이어그램을 사람이 그린 다이어그램과 비교하는 **referenced comparison** 방식을 채택.

**평가 차원** (Quispel et al., 2018 기반):
- **Content - Faithfulness**: 소스 컨텍스트(방법론 설명) 및 의사소통 의도(캡션)와의 정렬. 핵심 로직 흐름과 모듈 상호작용을 보존해야 하며, 날조 없이 사실적으로 정확해야 함
- **Content - Conciseness**: "Visual Signal-to-Noise Ratio". 시각적 클러터 없이 핵심 정보에 집중. 복잡한 로직을 깔끔한 블록, 플로차트, 아이콘으로 증류
- **Presentation - Readability**: 이해하기 쉬운 레이아웃, 읽기 쉬운 텍스트, 과도한 교차선 없음
- **Presentation - Aesthetics**: 학술 논문의 스타일 규범(NeurIPS, CVPR 등) 준수

**참조 기반 점수 방식**: 각 차원별로 VLM 심판이 모델 생성 다이어그램을 사람 참고와 비교하여 Model wins(100점), Human wins(0점), Tie(50점)을 부여.

**계층적 집계 전략**: Faithfulness와 Readability를 **주요(primary)** 차원으로, Conciseness와 Aesthetics를 **보조(secondary)** 차원으로 설정하여 콘텐츠 충실도와 명확성이 미학보다 우선시되도록 함. 주요 차원에서 확실한 승자가 나오면 이것이 최종 승자, 동점이면 보조 차원에 같은 규칙 적용.

## 5. 실험 (Experiments)

### 5.1 실험 세팅 (Experimental Settings)

**베이스라인 방법 및 모델**:

| 방법 | 설명 |
|------|------|
| **(1) Vanilla** | 이미지 생성 모델에 입력 컨텍스트(방법론 설명 + 캡션)를 직접 프롬프팅 |
| **(2) Few-shot** | Vanilla에 10개 few-shot 예제(방법론 설명, 캡션, 다이어그램 튜플)를 추가하여 in-context learning 활성화 |
| **(3) Paper2Any** (Liu et al., 2025) | 논문의 high-level 아이디어를 다이어그램으로 생성하는 agentic framework. 본 평가 세팅에 가장 가까운 기존 연구 |

**모델 구성**:
- VLM backbone: **Gemini-3-Pro** (기본)
- 이미지 생성 모델: **Nano-Banana-Pro** (primary), **GPT-Image-1.5** (comparison)
- 생성 온도(temperature): **1** (모든 실험)
- 생성 이미지 가로세로 비율: ground-truth 다이어그램의 비율에 맞춤 (Nano-Banana-Pro: 3:2, 16:9, 21:9 중 가장 가까운 비율로 반올림)

**평가 세팅 상세**:
- VLM-as-a-Judge로 **Gemini-3-Pro** 사용
- 신뢰성 검증을 위해 50개 케이스(Vanilla 25개 + PaperBanana 25개) 무작위 샘플링하여 2단계 검증:
  - **Inter-Model Agreement (일관성)**: Gemini-3-Pro 판정과 Gemini-3-Flash/GPT-5의 Kendall의 tau 상관관계 측정
    - Gemini-3-Flash: Faithfulness 0.51, Conciseness 0.60, Readability 0.45, Aesthetics 0.56, 집계 0.55
    - GPT-5: 0.43, 0.47, 0.44, 0.42, 집계 0.45
    - → 다른 심판 모델 간 프로토콜의 일관성 확인 (Kendall tau > 0.4는 상대적으로 강한 일치로 간주)
  - **Human Alignment (타당성)**: 2명의 경험 있는 연구원이 동일한 50개 샘플에 대해 독립적으로 reference-based scoring 수행 후 토의로 합의
    - Gemini-3-Pro와 인간 평가 간 Kendall tau: 0.43, 0.57, 0.45, 0.41, 집계 0.45
    - → 인간 인식과 잘 정렬됨

### 5.2 메인 결과 (Main Results)

| Method | Faithfulness ↑ | Conciseness ↑ | Readability ↑ | Aesthetic ↑ | Overall ↑ |
|--------|:---:|:---:|:---:|:---:|:---:|
| *Vanilla Settings* | | | | | |
| GPT-Image-1.5 | 4.5 | 37.5 | 30.0 | 37.0 | 11.5 |
| Nano-Banana-Pro | 43.0 | 43.5 | 38.5 | 65.5 | 43.2 |
| Few-shot Nano-Banana-Pro | 41.6 | 49.6 | 37.6 | 60.5 | 41.8 |
| *Agentic Frameworks* | | | | | |
| Paper2Any (w/ Nano-Banana-Pro) | 6.5 | 44.0 | 20.5 | 40.0 | 8.5 |
| **PaperBanana (Ours)** | | | | | |
| w/ GPT-Image-1.5 | 16.0 | 65.0 | 33.0 | 56.0 | 19.0 |
| **w/ Nano-Banana-Pro** | **45.8** | **80.7** | **51.4** | **72.1** | **60.2** |
| Human | 50.0 | 50.0 | 50.0 | 50.0 | 50.0 |

PaperBanana (w/ Nano-Banana-Pro)는 Vanilla Nano-Banana-Pro 대비:
- **Faithfulness**: +2.8% (45.8 vs. 43.0)
- **Conciseness**: +37.2% (80.7 vs. 43.5)
- **Readability**: +12.9% (51.4 vs. 38.5)
- **Aesthetics**: +6.6% (72.1 vs. 65.5)
- **Overall**: +17.0% (60.2 vs. 43.2)

GPT-Image-1.5는 Nano-Banana-Pro 대비 약한 instruction following 및 텍스트 렌더링 능력으로 저조한 성능. Paper2Any는 high-level 아이디어 표현을 우선시하여 구체적인 방법론 흐름 표현에서 부족.

**카테고리별 성능**: Agent & Reasoning이 가장 높은 Overall 점수(69.9%), Scientific & Application(58.8%), Generative & Learning(57.0%), Vision & Perception이 가장 낮은 점수(52.1%).

**Blind Human Evaluation**: 50개 케이스에 대한 3명의 인간 평가자에 의한 blind A/B 테스트 결과, PaperBanana vs. Vanilla Nano-Banana-Pro 평균 **win/tie/loss = 72.7% / 20.7% / 6.6%**.

### 5.3 어블레이션 스터디 (Ablation Study)

| # | Retriever | Planner | Stylist | Visualizer | Critic | Faith. ↑ | Conc. ↑ | Read. ↑ | Aesth. ↑ | Overall ↑ |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| ① | ✓ | ✓ | ✓ | ✓ | 3 iters | **45.8** | **80.7** | **51.4** | 72.1 | **60.2** |
| ② | ✓ | ✓ | ✓ | ✓ | 1 iter | 38.3 | 75.2 | 50.6 | 68.9 | 51.8 |
| ③ | ✓ | ✓ | ✓ | ✓ | - | 30.7 | 79.2 | 47.0 | 72.1 | 45.6 |
| ④ | ✓ | ✓ | - | ✓ | - | 39.2 | 61.7 | 47.9 | 67.4 | 49.2 |
| ⑤ | ○ | - | ✓ | ✓ | - | 37.3 | 62.7 | 51.1 | 65.6 | 48.3 |
| ⑥ | - | ✓ | - | ✓ | - | 41.9 | 58.6 | 43.1 | 62.9 | 44.2 |

(○ = Random Retriever, - = 해당 컴포넌트 없음)

**Retriever Agent의 영향**: 참고 예제 없이(⑥)는 Planner가 장황하고 소모적인 설명으로 기본 설정되어 Conciseness, Readability, Aesthetics에서 크게 저하. 흥미롭게도 random retriever(⑤)가 semantic 접근법과 비슷한 성능을 보여, 정확한 콘텐츠 매칭보다 **일반적인 구조적/스타일적 패턴 제공이 더 중요**함을 시사.

**Stylist Agent의 영향**: ③과 ④ 비교 시 Stylist는 Conciseness(+17.5%)와 Aesthetics(+4.7%)를 향상시키지만 Faithfulness를 저하(-8.5%)시킨다 (시각적 폴리싱 과정에서 기술적 세부사항이 생략될 수 있음).

**Critic Agent의 영향**: ① vs. ③ 비교 시 Critic Agent(3회 반복)가 Stylist에 의한 Faithfulness 격차를 효과적으로 해소하여 모든 지표를 향상시키며, **미학과 기술적 정확성 사이의 균형을 보장**. 1회 반복(②) vs. 3회 반복(①): 3회 반복이 모든 차원에서 더 나은 성능.

### 5.4 통계 플롯 생성 (Statistical Plots Generation)

**테스트셋 구성**: ChartMimic(Yang et al., 2025b) 데이터셋을 재활용하여 240개 테스트 케이스와 240개 참고 예제를 구성. 7개 플롯 카테고리(bar chart, line chart, tree & pie chart, scatter plot, heatmap, radar chart, miscellaneous)와 2개 복잡도 수준(easy, hard)으로 계층화.

**결과**: PaperBanana는 Vanilla Gemini-3-Pro 대비 모든 차원에서 우수:
- Faithfulness +1.4%, Conciseness +5.0%, Readability +3.1%, Aesthetics +4.0%, Overall +4.1%
- Conciseness, Readability, Aesthetics에서는 **인간 성능을 약간 초과**하며, Faithfulness에서는 경쟁력을 유지

**코드 vs. 이미지 생성 비교**: 코드 기반(Gemini-3-Pro)과 이미지 생성 기반(Nano-Banana-Pro) 비교 결과:
- 이미지 생성은 프레젠테이션(가독성, 미학)에서 우수하지만 콘텐츠 충실도(충실성, 간결성)에서 부족
- 이미지 모델은 희박한 플롯을 충실하게 렌더링하지만, 밀집하거나 복잡한 데이터에서 수치적 할루시네이션이나 요소 반복 오류 발생
- → **희박한 시각화에는 이미지 생성, 밀집한 플롯에는 코드**를 하이브리드로 사용하는 것이 최적

## 6. 논의 (Discussion)

### 6.1 인간 작성 다이어그램의 미학 향상

요약된 Aesthetic Guideline G를 활용하여 기존 인간 작성 다이어그램의 미학적 품질을 높일 수 있는지 탐구. Gemini-3-Pro가 최대 10개의 실행 가능한 제안(색상 팔레트, 폰트, 아이콘, 커넥터, 선 굵기, 도형 등)을 생성하고 Nano-Banana-Pro가 이미지를 개선하는 파이프라인 구현. 292개 테스트 케이스에서 aesthetics 기준 **win/tie/loss = 56.2% / 6.8% / 37.0%**, 유의미한 향상 확인.

### 6.2 코드 vs. 이미지 생성 방식 비교

통계 플롯에서 코드 기반과 이미지 생성 기반 접근법의 트레이드오프:
- 이미지 생성: Readability와 Aesthetics에서 우수, Faithfulness와 Conciseness에서 부족
- 수동 검사: 이미지 모델은 희박한 플롯은 잘 렌더링하지만 밀집/복잡 데이터에서 수치 할루시네이션이나 요소 반복 발생
- 결론: 희박한 시각화에는 이미지 생성, 밀집한 플롯에는 코드를 하이브리드로 사용하는 것이 최적 균형 제공

## 7. 관련 연구 (Related Work)

### 7.1 자동화된 학술 다이어그램 생성

기존 연구는 주로 TikZ(Belouadi and Eger, 2024; Belouadi et al., 2025)나 Python-PPT(Pang et al., 2025; Zheng et al., 2025)를 사용한 코드 기반 접근법 채택. 구조화된 콘텐츠에는 효과적이지만 복잡한 시각적 요소 표현에 한계. 최근 이미지 생성 모델이 대안으로 부상하였으며, 동시기 연구로 AutoFigure(Anonymous, 2026)가 GPT-Image로 과학 콘텐츠를 심볼릭 표현으로 변환 후 이미지로 렌더링. PaperBanana는 adaptive retrieval과 academic-style transfer를 통해 더 넓은 일반화와 확장성 제공.

평가 벤치마크로는 SridBench(Chang et al., 2025)가 method 섹션과 캡션으로부터의 자동 다이어그램 생성을 CS와 자연과학 도메인에서 평가.

### 7.2 코드 기반 데이터 시각화

LSTM 기반 모델(Data2vis, Dibia & Demiralp, 2019) → few-shot/zero-shot 코딩 방식(Dibia, 2023; Galimzyanov et al., 2025) → ChatGPT 기반 대규모 백본 활용(Li et al., 2024; Tian et al., 2024) → agentic framework(Chen et al., 2025; Goswami et al., 2025; Yang et al., 2024) 및 test-time scaling(Snell et al., 2024), self-reflection(Shinn et al., 2023) 등으로 발전.

## 8. 결론 (Conclusion)

PaperBanana는 Retriever, Planner, Stylist, Visualizer, Critic 등 5개의 특화된 에이전트를 오케스트레이션하여 과학적 콘텐츠를 고충실도 방법론 다이어그램과 통계 플롯으로 변환하는 agentic framework이다. 평가를 위해 톱 AI 학회에서 큐레이션된 종합 벤치마크 PaperBananaBench를 제시하였으며, 포괄적 실험을 통해 faithfulness, conciseness, readability, aesthetics 모든 차원에서 기존 베이스라인을 유의미하게 초과함을 입증하였다. AI 과학자가 전문가 수준의 시각화로 발견을 자율적으로 소통할 수 있는 길을 열었다.

## 9. 한계 및 미래 방향 (Limitations & Future Directions)

### 9.1 편집 가능한 일러스트레이션

PaperBanana의 출력이 래스터 이미지이므로 편집이 본질적으로 어렵다. 4K 해상도 출력이 대안이지만, 생성 후 수정 문제를 근본적으로 해결하지 못한다.

미래 방향:
- **경미한 조정**: 이미지 편집 모델(Nano-Banana-Pro) 활용
- **구조적 수정**: OCR+SAM3 기반 재구성 파이프라인(Paper2Any, Edit Banana) — OCR로 텍스트 추출, SAM3로 패턴 세그멘테이션 후 프레젠테이션 슬라이드에 재조립
- **고급 방법**: Adobe Illustrator 등의 벡터 디자인 소프트웨어를 자율적으로 조작하는 GUI Agent 개발

### 9.2 스타일 표준화 vs. 다양성 트레이드오프

통일된 스타일 가이드가 학술 규범 준수를 보장하지만, 스타일적 다양성을 불가피하게 감소시킨다. 보다 동적인 스타일 적응 메커니즘 탐구 필요.

### 9.3 세밀한 충실성의 도전

PaperBanana는 aesthetics에서는 우수하지만, faithfulness에서는 여전히 인간 전문가 대비 성능 격차가 있다. 가장 흔한 실패 모드는 **연결 오류**(misaligned start/end points, 잘못된 화살표 방향)로, critic 모델이 이런 미세한 문제를 탐지하지 못하는 경우가 많다. Foundation VLM의 세밀한 시각적 인식 능력 향상에 달려 있다.

### 9.4 평가 패러다임 발전

VLM-as-a-Judge 방식의 한계: faithfulness에서 미세한 구조적 정확성 평가가 어렵고, 미학 등 주관적 차원에서 텍스트 프롬프팅만으로는 VLM을 인간 선호와 완전히 정렬시키기 어렵다. Fine-grained, structure-based 메트릭 및 커스터마이즈된 보상 모델 훈련이 미래 방향.

### 9.5 다양한 선호를 위한 Test-Time Scaling

현재 단일 출력 생성에서, 다양한 스타일/구성의 후보를 생성하고 사용자나 VLM 기반 선호 모델이 선택하는 **generate-and-select** 방식으로 확장 가능.

### 9.6 보다 넓은 도메인으로의 확장

Retrieval을 활용한 구조 계획 + 자동 스타일 요약을 통한 미학 렌더링 분리 패러다임은 **UI/UX 디자인, 특허 도면, 산업 도식도** 등 커뮤니티 규범을 엄격히 준수해야 하는 전문 영역에도 적용 가능성이 있다.

---

## 관련 링크

- **프로젝트 페이지**: [https://dwzhu-pku.github.io/PaperBanana/](https://dwzhu-pku.github.io/PaperBanana/)
- **arXiv**: [https://arxiv.org/abs/2601.23265](https://arxiv.org/abs/2601.23265)
- **Paper2Any**: [https://github.com/OpenDCAI/Paper2Any](https://github.com/OpenDCAI/Paper2Any)
- **Edit Banana**: [https://github.com/BIT-DataLab/Edit-Banana](https://github.com/BIT-DataLab/Edit-Banana)
- **ChartMimic (벤치마크)**: Yang et al., 2025b — chart-to-code generation 데이터셋
- **SridBench (관련 벤치마크)**: Chang et al., 2025 — arXiv:2505.22126$$,
  true,
  'ko'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  date = EXCLUDED.date,
  summary = EXCLUDED.summary,
  tags = EXCLUDED.tags,
  category = EXCLUDED.category,
  content = EXCLUDED.content,
  published = EXCLUDED.published,
  updated_at = now();
