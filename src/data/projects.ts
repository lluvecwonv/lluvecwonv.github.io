export interface ProjectImage {
  src: string
  caption: string
}

export interface ProjectSection {
  heading: string
  body: string
  images?: ProjectImage[]
  html?: string  // for tables, etc.
}

export interface Project {
  slug: string
  title: string
  subtitle?: string
  description: string
  tags: string[]
  category: string
  github?: string
  demo?: string
  paper?: string
  paperUrl?: string
  paperTitle?: string
  thumbnail?: string
  sections: ProjectSection[]
  techStack?: string[]
}

export const projects: Project[] = [
  // ── LLM Application ──
  {
    slug: 'curriculum-graph',
    title: 'Curriculum Planning for Independent Majors with LLMs',
    subtitle: 'Graph-Based Interdisciplinary Curriculum Generation via LLM Reasoning',
    description:
      'A curriculum planning method that leverages prerequisite relationships in department-specific curricula and LLM reasoning to generate personalized interdisciplinary curricula for independent major students.',
    tags: ['LLM', 'Graph', 'Curriculum Planning', 'DAG', 'FAISS'],
    category: 'LLM Application',
    paper: 'AIED 2025',
    paperTitle: 'Curriculum Planning for Independent Majors with Large Language Models',
    thumbnail: '/projects/jbnu-0.png',
    sections: [
      {
        heading: '1. Problem Definition — Designing Personalized Interdisciplinary Curricula',
        body: 'Independent major programs allow students to design customized interdisciplinary studies when their goals fall outside standard departmental offerings. However, curriculum design presents three critical challenges.\n\nFirst, prerequisite dependencies span multiple disciplines and are difficult to identify automatically. Most curriculum data exists as isolated departmental DAGs with no explicit cross-departmental relationships. Second, students often start with vague, overly broad objectives like "I want to combine AI and semiconductors" without concrete direction on how to structure their coursework. Third, even when students and advisors identify relevant courses, manually arranging them into a logical progression while ensuring all prerequisites are satisfied is time-consuming and error-prone.\n\nThis work asks: "Can we leverage LLM reasoning to help students refine their vague objectives, automatically extract relevant courses across disciplines, and intelligently infer prerequisite relationships between interdisciplinary courses?"',
      },
      {
        heading: '2. Why This Approach — Hypothesis and Design Rationale',
        body: 'Recent work on LLM reasoning (Wei et al. 2022, Kojima et al. 2023) shows that Chain-of-Thought prompting can decompose complex tasks into step-by-step reasoning. We hypothesized that LLMs could apply similar reasoning to curriculum design: breaking down vague student objectives into concrete learning goals, retrieving semantically relevant courses, and inferring implicit prerequisite relationships.\n\nThree design decisions emerged from this hypothesis. First, learning objective refinement via Chain-of-Thought transforms "I want to combine AI and semiconductors" into concrete, structured goals like "AI semiconductor design expertise combining circuit design and deep learning hardware optimization." This refinement guides all downstream steps. Second, curriculum subgraph extraction leverages existing departmental curriculum DAGs (which already encode prerequisites within departments) rather than learning from scratch. Third, inter-department prerequisite inference uses the LLM to reason about course descriptions and the refined objective, determining whether courses from different departments should have prerequisite relationships — a task that requires semantic understanding beyond keyword matching.',
        images: [
          { src: '/projects/jbnu-0.png', caption: 'Figure 1. Three-stage curriculum planning pipeline — Learning Objective Refinement via CoT → Curriculum Subgraph Extraction from departmental DAGs → Interdisciplinary Graph Construction with LLM-inferred prerequisite edges' },
        ],
      },
      {
        heading: '3. Challenges During Project Development',
        body: 'Learning objective refinement quality was the first challenge. We found that simple few-shot prompting sometimes generated refinements that were too narrow (e.g., eliminating valid alternative paths) or too broad (remaining vague). We designed a multi-turn refinement process where the LLM iteratively asks clarifying questions and integrates student feedback.\n\nCourse retrieval accuracy was another concern. A FAISS vector search using raw course descriptions was sometimes imprecise, missing relevant courses or including false positives. To address this, we had the LLM expand the refined objective into multiple search queries, each targeting different aspects (e.g., one query for "AI systems design", another for "semiconductor physics"), then merged results to improve coverage.\n\nInferring inter-department prerequisites proved unexpectedly difficult. Two courses from different departments might have a prerequisite relationship based on conceptual dependencies, but this relationship is rarely explicit. We addressed this by providing the LLM with course descriptions, syllabi summaries, and the refined student objective, then having the LLM explicitly reason about whether one course\'s concepts are prerequisites for another.\n\nFinally, we struggled with graph layout and visualization. A naive topological sort sometimes produced nonsensical semester assignments. We developed a constraint satisfaction approach that respects prerequisites while balancing workload (≤6 courses per semester) and spreading foundational to advanced courses logically.',
      },
      {
        heading: '4. Experimental Results',
        body: 'We evaluated on two quantitative metrics: F1_course (how well selected courses match a gold curriculum) and F1_prerequisite (how accurately inferred prerequisite relationships match ground truth).\n\nThe proposed method achieved F1_course 41.03 and F1_prerequisite 23.16, vastly outperforming baselines. TF-IDF (15.60, 1.01) and text embeddings without LLM refinement (32.56, 4.96) showed that vector similarity alone is insufficient for prerequisite inference. Notably, F1_prerequisite improved from ~1–6 for baselines to 23.16 for our method, demonstrating that LLM reasoning is essential for cross-departmental prerequisites.\n\nQualitative evaluation by five domain experts (2 faculty, 3 curriculum consultants) rated the proposed method highest across all dimensions: Consistency 3.47/5, Interdisciplinarity 3.53/5, Coherence 3.60/5, Essentiality 3.00/5. Experts noted that the method\'s ability to infer non-obvious interdisciplinary prerequisites was particularly valuable.',
        html: `<table>
<thead>
<tr><th>Method</th><th>F1<sub>course</sub> ↑</th><th>F1<sub>prerequisite</sub> ↑</th></tr>
</thead>
<tbody>
<tr><td>TF-IDF</td><td>15.60</td><td>1.01</td></tr>
<tr><td>TF-IDF w/ LO refinement</td><td>19.51</td><td>2.13</td></tr>
<tr><td>Text embedding</td><td>32.56</td><td>4.96</td></tr>
<tr><td>Text embedding w/ LO refinement</td><td>33.63</td><td>5.94</td></tr>
<tr><td><strong>Proposed method</strong></td><td><strong>41.03</strong></td><td><strong>23.16</strong></td></tr>
</tbody>
</table>`,
      },
      {
        heading: '4-1. Key Insights and Contributions',
        body: 'This work makes four key contributions. First, we show that LLM Chain-of-Thought reasoning can refine vague student learning objectives into concrete, actionable curriculum targets. This refinement step, often overlooked in prior work, is essential for high-quality downstream curriculum generation.\n\nSecond, we demonstrate that leveraging existing departmental curriculum DAGs is more effective than learning prerequisites from scratch. By anchoring to institutional curriculum structures, our method ensures prerequisite relationships within departments are sound.\n\nThird, we propose a practical method for inferring inter-department prerequisites through LLM reasoning. This enables truly interdisciplinary curriculum design at scale, something previous methods could not achieve.\n\nFinally, we validate our approach through both quantitative metrics (F1 scores) and qualitative expert evaluation. The stark improvement in F1_prerequisite over baselines (23.16 vs. 5.94 for the strongest baseline) demonstrates that semantic reasoning is irreplaceable for capturing implicit prerequisites in interdisciplinary curricula.\n\nThis work was published at AIED 2025 with co-first authorship and has already informed curriculum design practices at the hosting institution.',
      },
    ],
    techStack: ['Python', 'GPT-4o-mini', 'FAISS', 'NetworkX', 'Matplotlib', 'text-embedding-3-small'],
  },
  {
    slug: 'aacsum',
    title: 'Abstractive Aspect-Based Comparative Summarization',
    subtitle: 'LLM 기반 속성 단위 비교 요약 — 기존 비교 요약의 한계를 넘어서',
    description:
      '온라인 리뷰에서 세부 속성(aspect)별로 대조적·공통적 요약을 동시에 생성하는 최초의 추상적 속성 기반 비교 요약(AACSum) 태스크를 정의하고, goal-driven clustering과 aspect merging 기반 파이프라인을 설계하여 WWW 2025에 게재.',
    tags: ['NLP', 'LLM', 'Summarization', 'Clustering', 'Goal-driven Clustering'],
    category: 'LLM Application',
    paper: 'ACM WWW 2025 Companion (Short Paper)',
    paperTitle: 'Abstractive Aspect-Based Comparative Summarization',
    github: 'https://github.com/lluvecwonv/AACSum',
    thumbnail: '/projects/aacsum-1.png',
    sections: [
      {
        heading: '1. 문제 정의 — 기존 비교 요약의 한계',
        body: '온라인 리뷰는 방대하여 두 제품이나 서비스의 차이점과 공통점을 파악하기 어렵습니다.\n\n기존 비교 요약에는 세 가지 한계가 있었습니다. 첫째, 추출적(extractive) 방식은 리뷰 문장을 그대로 뽑아내므로 불완전합니다. 둘째, 차이점(contrastive)만 생성하여 공통점(common) 요약이 부재합니다. 셋째, 속성(aspect) 기반 세분화 비교가 없어 "Staff", "Price" 같은 구체적 관점의 비교가 불가능합니다.\n\n본 연구는 Abstractive, Aspect-based, Contrastive, Common을 모두 충족하는 비교 요약 태스크를 최초로 정의했습니다.',
        images: [
          { src: '/projects/aacsum-0.png', caption: 'Figure 1. Abstractive Aspect-Based Comparative Summarization 예시 — 두 호텔의 리뷰에서 Staff, Parking, Price 등 속성별로 대조적(Contrastive) 및 공통(Common) 요약을 생성' },
        ],
        html: `<table><thead><tr><th></th><th>Abs.</th><th>Asp.</th><th>Cont.</th><th>Com.</th></tr></thead><tbody><tr><td>Lerman and McDonald [8]</td><td>✓</td><td></td><td></td><td></td></tr><tr><td>Sipos and Joachims [10]</td><td></td><td></td><td>✓</td><td></td></tr><tr><td>Iso et al. [7]</td><td>✓</td><td></td><td>✓</td><td>✓</td></tr><tr><td>Gunel et al. [5]</td><td></td><td></td><td>✓</td><td>✓</td></tr><tr><td><strong>This work (AACSum)</strong></td><td><strong>✓</strong></td><td><strong>✓</strong></td><td><strong>✓</strong></td><td><strong>✓</strong></td></tr></tbody></table>`,
      },
      {
        heading: '2. 왜 이 접근 방법인가 — 가설과 설계 근거',
        body: '기존 의견 요약 데이터셋(CoCoTrip, AmaSUM)에서 LLM few-shot으로 속성을 자동 식별하고, 속성별 비교 요약 데이터셋을 유도할 수 있다는 핵심 가설을 세웠습니다.\n\n세 가지 핵심 설계 결정을 내렸습니다. 첫째, Goal-driven Clustering으로 단순 토픽 모델링 대신 목적 기반 클러스터링을 통해 속성 발견을 수행하여 의미적으로 일관된 속성 그룹을 생성했습니다. 둘째, Aspect Merging을 통해 다른 엔티티의 유사 속성을 계층적 클러스터링으로 병합했습니다(예: "service quality" ≈ "customer service efficiency"). 셋째, LLM 기반 추상적 요약을 적용하여 병합된 속성은 공통 요약으로, 병합되지 않은 속성은 대조 요약으로 생성했습니다.',
        images: [
          { src: '/projects/aacsum-1.png', caption: 'Figure 2. 제안 방법의 전체 파이프라인 — Review Set → Aspect Generation & Review Assignment → Aspect Merging → Comparative Summary Generation' },
        ],
      },
      {
        heading: '3. 프로젝트 과정에서의 어려움과 고민',
        body: '데이터셋 구축이 가장 큰 과제였습니다. 속성 기반 비교 요약 벤치마크가 전혀 없었기 때문에 기존 데이터셋을 변환하고, human annotator 2명을 통해 품질 검증과 필터링을 수행했습니다.\n\n평가 프로토콜 설계도 어려웠습니다. 참조 속성과 생성 속성이 1:1로 대응되지 않는 경우(예: "Staff service" vs. "Hotel staff")가 많아 cosine similarity 기반 best-match 속성 매칭 방식을 설계했습니다.\n\n또한 같은 속성이 "service quality"(상위)와 "customer service efficiency"(하위)로 표현되는 granularity 문제가 있었으며, 계층적 클러스터링의 임계값 조절을 통해 적절한 병합 수준을 탐색했습니다. Contrastive와 Common을 동시에 생성하는 기존 모델이 없었기 때문에 하나의 통합 파이프라인에서 두 유형을 동시에 생성하도록 설계했습니다.',
      },
      {
        heading: '4. 실험 데이터와 결과',
        body: '두 가지 벤치마크 데이터셋을 구축했습니다. CoCoCom은 호텔 리뷰 48쌍으로 평균 7.80개의 리뷰와 7.75개의 속성을 포함하고 있으며, AmaCom은 아마존 제품 리뷰 646쌍으로 평균 77.78개의 리뷰와 11.56개의 속성(3개 카테고리)을 포함하고 있습니다.',
        html: `<table><thead><tr><th>Dataset</th><th># of pairs</th><th># of reviews</th><th>Input length</th><th># of aspects</th><th>Sum. length</th></tr></thead><tbody><tr><td>CoCoCom</td><td>48</td><td>7.80</td><td>1547.10</td><td>7.75</td><td>325.72</td></tr><tr><td>AmaCom</td><td>646</td><td>77.78</td><td>10161.40</td><td>11.56</td><td>368.45</td></tr></tbody></table>`,
      },
      {
        heading: '4-1. 자동 평가 결과 (Table 3)',
        body: 'Aspect correctness, Lexical overlap, Factuality, Contrastiveness의 4가지 지표로 평가했습니다. CoCoCom에서는 Asp. 29.93%, CASPR 97.22를 달성하여 모든 베이스라인을 능가했으며, AmaCom에서도 Asp. 24.27%, CASPR 95.74로 전반적으로 우수한 성능을 보였습니다.\n\n기존 방법인 CoCoSUM-LLM과 STRUM-LLM은 추출적 방식이라 사실성이 낮았고, GPT-4o-mini는 대조 요약 생성에 한계가 있었습니다. 반면 제안 방법은 속성 생성과 병합 과정에서 비교에 적합한 속성을 효과적으로 식별하여 대조성과 속성 정확도 모두에서 최고 성능을 달성했습니다.',
        html: `<table><thead><tr><th>Dataset</th><th>Model</th><th>Asp. Cor. (Acc)</th><th>Lexical Overlap (R1/RL)</th><th>Factuality (BS)</th><th>Contrast. (CASPR)</th></tr></thead><tbody><tr><td rowspan="5">CoCoCom</td><td>CoCoSUM-LLM</td><td>29.19</td><td>9.64/8.83</td><td>25.58 / 63.36</td><td>92.60</td></tr><tr><td>STRUM-LLM</td><td>4.38</td><td>1.95/1.77</td><td>11.83 / 58.64</td><td>94.59</td></tr><tr><td>Co-STRUM-LLM</td><td>23.36</td><td>2.83/2.56</td><td>17.05 / 60.13</td><td>94.55</td></tr><tr><td>GPT-4o-mini</td><td>24.81</td><td>9.20/8.26</td><td>32.64 / 63.52</td><td>89.55</td></tr><tr><td><strong>Proposed method</strong></td><td><strong>29.93</strong></td><td><strong>9.68/8.83</strong></td><td><strong>32.52 / 63.76</strong></td><td><strong>97.22</strong></td></tr><tr><td rowspan="5">AmaCom</td><td>CoCoSUM-LLM</td><td>13.26</td><td>1.98/1.94</td><td>11.37 / 57.35</td><td>90.53</td></tr><tr><td>STRUM-LLM</td><td>11.19</td><td>1.21/1.06</td><td>8.84 / 56.72</td><td>94.21</td></tr><tr><td>Co-STRUM-LLM</td><td>7.52</td><td>1.32/1.28</td><td>9.96 / 57.24</td><td>94.21</td></tr><tr><td>GPT-4o-mini</td><td>19.69</td><td>3.94/3.65</td><td>23.21 / 59.54</td><td>93.34</td></tr><tr><td><strong>Proposed method</strong></td><td><strong>24.27</strong></td><td><strong>4.11/3.86</strong></td><td><strong>23.03 / 60.06</strong></td><td><strong>95.74</strong></td></tr></tbody></table>`,
      },
      {
        heading: '4-2. Human Evaluation 결과 (Table 4)',
        body: '3명의 평가자가 5가지 기준(1~5점 척도)으로 사람 평가를 수행했습니다. 제안 방법은 모든 지표에서 최고 성능을 달성했으며, Content Overlap 3.48, Content Support 3.66, Relevance 3.69, Informativeness 3.57, Redundancy 3.72를 기록했습니다.',
        html: `<table><thead><tr><th>Model</th><th>Content overlap</th><th>Content support</th><th>Relevance</th><th>Informativeness</th><th>Redundancy</th></tr></thead><tbody><tr><td>CoCoSUM-LLM</td><td>2.57</td><td>2.81</td><td>2.79</td><td>2.18</td><td>3.46</td></tr><tr><td>Co-STRUM-LLM</td><td>2.41</td><td>3.13</td><td>2.39</td><td>2.02</td><td>3.16</td></tr><tr><td>GPT-4o-mini</td><td>3.26</td><td>3.41</td><td>3.61</td><td>3.32</td><td>3.68</td></tr><tr><td><strong>Proposed method</strong></td><td><strong>3.48</strong></td><td><strong>3.66</strong></td><td><strong>3.69</strong></td><td><strong>3.57</strong></td><td><strong>3.72</strong></td></tr></tbody></table>`,
      },
      {
        heading: '4-3. 핵심 인사이트와 기여',
        body: '본 연구의 주요 기여는 다음과 같습니다. 첫째, Abstractive, Aspect-based, Comparative 요약 태스크를 최초로 정의하고 벤치마크 데이터셋(CoCoCom, AmaCom)을 구축했습니다. 둘째, Goal-driven clustering을 통한 aspect discovery와 계층적 클러스터링을 통한 aspect merging 파이프라인의 효과성을 입증했으며, 엔티티별 독립 수행이 가능하여 오프라인 사전처리가 가능합니다. 셋째, 자동 평가와 사람 평가 모두에서 기존 베이스라인을 능가하여 LLM 기반 간단한 파이프라인으로 복잡한 비교 요약 태스크를 해결할 수 있음을 보였습니다.\n\n본 연구는 ACM WWW 2025 Companion Proceedings(Short Paper)에 게재되었습니다.',
      },
    ],
    techStack: ['Python', 'GPT-4o-mini', 'Hugging Face', 'Hierarchical Clustering', 'ROUGE', 'BERTScore', 'CASPR', 'Goal-driven Clustering'],
  },

  // ── Trustworthy AI ──
  {
    slug: 'memorization',
    title: 'LLM 메모라이제이션 측정 연구',
    subtitle: 'Near-Duplicate 생성 기반 Gradient Alignment 메트릭 설계 및 하이브리드 언러닝',
    description:
      '대규모 언어모델이 학습 데이터를 얼마나 암기하는지를 정량적으로 측정하기 위해, near-duplicate 샘플 생성과 gradient alignment 기반의 새로운 메모라이제이션 측정 메트릭(PGA)을 설계하고, 이를 활용한 하이브리드 언러닝 전략을 제안.',
    tags: ['Unlearning', 'Memorization', 'LLM', 'Trustworthy AI'],
    category: 'Trustworthy AI',
    paper: 'KSC 2025 · 석사 학위논문',
    paperTitle: '의역 문장 생성을 통한 거대 언어모델의 메모라이제이션 측정',
    thumbnail: '/projects/memo-0.png',
    sections: [
      {
        heading: '문제 정의 — 기존 메모라이제이션 측정의 한계',
        body: 'LLM은 학습 데이터를 그대로 재현하는 메모라이제이션 문제가 있으며, 이는 개인정보 유출과 저작권 침해의 위험을 초래합니다.\n\nMIA(Membership Inference Attack)는 학습 여부를 이진 판별하는 방식으로 메모라이제이션의 "강도"를 정량화하기 어렵습니다. Influence Function은 Hessian 역행렬 계산이 LLM에서 비현실적이며 여러 체크포인트가 필요합니다. TracIn은 gradient 내적 기반이지만 여전히 여러 체크포인트가 필요하고 절대적 강도 측정이 불가능합니다.\n\n따라서 단일 체크포인트에서 개별 샘플의 메모라이제이션 강도를 절대적으로 측정할 수 있는 방법이 필요했습니다.',
        html: `<table>
<thead><tr><th>접근법</th><th>측정 대상</th><th>한계점</th></tr></thead>
<tbody>
<tr><td>MIA (Membership Inference Attack)</td><td>학습 여부 이진 판별</td><td>메모라이제이션 강도를 직접 정량화하기 어려움</td></tr>
<tr><td>Influence Function</td><td>모델 파라미터 영향도</td><td>Hessian 역행렬 계산 비용이 높고, 여러 체크포인트 필요</td></tr>
<tr><td>TracIn</td><td>gradient 내적 기반 영향도</td><td>여러 학습 체크포인트가 필요, 개별 데이터의 절대적 강도 측정 어려움</td></tr>
<tr><td><strong>Ours (PGA)</strong></td><td><strong>gradient alignment 기반 절대적 메모라이제이션 강도</strong></td><td><strong>단일 체크포인트로 절대적 측정 가능</strong></td></tr>
</tbody>
</table>`,
      },
      {
        heading: '왜 이 접근 방법인가 — 가설과 설계 근거',
        body: '모델이 특정 샘플을 강하게 암기했다면, 의미적으로 동일한 여러 표현에도 일관된 gradient 반응을 보인다는 관찰에서 출발했습니다.\n\n이를 바탕으로 원문과 유사한 near-duplicate 샘플을 생성하고 gradient 유사도를 측정하면 메모라이제이션 강도를 정량화할 수 있다는 가설을 세웠습니다. 구체적으로, 원문 x에 대해 N개의 near-duplicate를 생성한 뒤 gradient 벡터 g(x)와 g(x\'ᵢ)의 내적으로 방향 유사도를 계산하고, 이를 평균하여 M(x) = (1/N) Σ⟨g(x), g(x\'ᵢ)⟩를 산출했습니다.\n\nM(x)가 높다는 것은 원문과 near-duplicate가 같은 방향의 gradient를 생성한다는 의미이며, 곧 강하게 암기되었음을 나타냅니다. 이 방법의 장점은 다른 샘플과의 상대적 비교 없이 개별 샘플의 절대적 메모라이제이션 강도를 직접 측정할 수 있다는 점입니다.',
        images: [
          { src: '/projects/memo-0.png', caption: 'PGA 메트릭 개요: 원본 문장 → LLM으로 near-duplicate 생성 → gradient alignment 기반 메모라이제이션 점수 측정' },
        ],
      },
      {
        heading: '프로젝트 과정에서의 어려움과 고민',
        body: 'Near-duplicate 품질 제어가 가장 큰 과제였습니다. 일반 패러프레이즈는 문장 구조와 길이가 크게 변하기 때문에, "통사 구조를 보존하면서 어휘만 변경"하는 특수 프롬프트를 설계하여 해결했습니다.\n\nGradient 계산 효율성 문제도 있었습니다. LLM 전체 파라미터의 gradient는 비용이 너무 높아서, 마지막 레이어의 gradient만 사용하는 방식으로 효율성을 확보했습니다.\n\n또한 메모라이제이션 여부를 직접 이진 분류할 ground truth가 없었기 때문에, 기존 연구를 따라 MIA 실험 세팅(학습=member, 테스트=non-member, AUROC 평가)을 적용했습니다.\n\n도메인별 성능 차이의 해석도 고민이었습니다. DM Mathematics에서는 매우 높은 성능을 보이지만 Wikipedia에서는 제한적이었는데, 이것이 측정의 한계인지 실제 메모라이제이션 패턴의 차이인지 분석이 필요했습니다.',
      },
      {
        heading: '실험 설정',
        body: '실험에는 Pythia 패밀리(160M, 1.4B, 2.8B, 6.9B)를 사용했으며, Pile 데이터셋의 HackerNews, DM Mathematics, Pile CC, Wikipedia 네 가지 도메인에서 평가했습니다. 베이스라인으로 Min-K%++와 Hessian-free를 비교했으며, AUROC(학습 데이터=member, 테스트=non-member)를 평가 지표로 사용했습니다.',
      },
      {
        heading: '실험 결과 (표 1)',
        body: 'Min-K%++와 Hessian-free는 대부분의 도메인에서 AUROC 50–53% 수준으로, 랜덤 수준에 머물러 메모라이제이션 신호를 구분하지 못했습니다.\n\n반면 제안 방법(PGA)은 DM Mathematics에서 160M 모델 기준 80.4%, 6.9B에서도 78.9%를 달성하여 기존 방법을 크게 능가했습니다. DM Mathematics는 수식 구조와 숫자 조합이 반복되어 모델이 일반화가 아닌 암기 방식으로 학습하기 때문입니다.\n\nHackerNews, Pile CC, Wikipedia에서는 AUROC 50–52%로, 일관된 문체를 가진 도메인에서는 학습/테스트 모두 유사한 gradient alignment를 보여 member/non-member 구분이 어려웠습니다. 이는 구조적 패턴이 반복되는 도메인에서는 실제 암기가, 서술이 다양한 도메인에서는 패턴 일반화가 우세함을 시사합니다.',
        html: `<table>
<thead>
<tr><th rowspan="2">Method</th><th colspan="4">HackerNews</th><th colspan="4">DM Mathematics</th><th colspan="4">Pile CC</th><th colspan="4">Wikipedia</th></tr>
<tr><th>160M</th><th>1.4B</th><th>2.8B</th><th>6.9B</th><th>160M</th><th>1.4B</th><th>2.8B</th><th>6.9B</th><th>160M</th><th>1.4B</th><th>2.8B</th><th>6.9B</th><th>160M</th><th>1.4B</th><th>2.8B</th><th>6.9B</th></tr>
</thead>
<tbody>
<tr><td>Min-K%++</td><td>50.7</td><td>51.3</td><td><strong>52.6</strong></td><td><strong>52.8</strong></td><td>50.5</td><td>50.9</td><td>51.7</td><td>51.6</td><td><strong>51.0</strong></td><td><strong>51.0</strong></td><td>53.0</td><td>53.0</td><td><strong>49.7</strong></td><td><strong>53.7</strong></td><td><strong>55.1</strong></td><td><strong>58.0</strong></td></tr>
<tr><td>Hessian-free</td><td>50.1</td><td>52.0</td><td>51.1</td><td>52.4</td><td>49.9</td><td>49.1</td><td>49.1</td><td>48.9</td><td>52.0</td><td>51.1</td><td>52.3</td><td>50.1</td><td>50.9</td><td>48.3</td><td>43.3</td><td>44.3</td></tr>
<tr><td><strong>Ours</strong></td><td><strong>51.6</strong></td><td><strong>52.1</strong></td><td>52.6</td><td>52.4</td><td><strong>80.4</strong></td><td><strong>71.3</strong></td><td><strong>78.9</strong></td><td><strong>78.9</strong></td><td>49.7</td><td>49.9</td><td>52.0</td><td><strong>53.1</strong></td><td>49.7</td><td>50.7</td><td>51.4</td><td>50.3</td></tr>
</tbody>
</table>`,
      },
      {
        heading: '하이브리드 언러닝으로의 확장',
        body: 'PGA 점수로 메모라이제이션 강도를 측정한 뒤, 강도에 따라 데이터를 분류하는 하이브리드 언러닝 전략을 제안했습니다. 강한 메모라이제이션(높은 PGA)을 보이는 데이터에는 gradient ascent 등 적극적 언러닝을, 약한 메모라이제이션(낮은 PGA)을 보이는 데이터에는 가벼운 언러닝을 적용하여 유틸리티를 최대한 보존했습니다.\n\nTOFU와 MUSE 벤치마크에서 기존 방법 대비 우수한 언러닝 성능과 유틸리티 보존을 동시에 달성했습니다.',
        images: [
          { src: '/projects/memo-1.png', caption: '하이브리드 언러닝 프레임워크: PGA 메트릭으로 메모라이제이션 강도를 측정한 뒤, 강한/약한 데이터에 차별적 언러닝 전략 적용' },
        ],
      },
      {
        heading: '핵심 인사이트와 기여',
        body: '본 연구의 주요 기여는 다음과 같습니다. 첫째, MIA는 이진 판별에 그치고 Influence Function은 계산 비용이 높은 반면, PGA는 단일 체크포인트에서 절대적 메모라이제이션 강도를 측정할 수 있습니다. 둘째, 도메인별 메모라이제이션 패턴의 차이를 실험적으로 규명하여 구조적 반복 도메인에서는 암기가, 다양한 서술 도메인에서는 일반화가 우세함을 밝혔습니다. 셋째, 메모라이제이션과 일반화를 구분하는 중요한 기준을 제시했습니다.\n\n본 연구는 석사 학위논문 「대규모 언어모델에서 메모라이제이션 기반 언러닝」으로 정리되었으며, KSC 2025에도 게재되었습니다.',
      },
    ],
    techStack: ['Python', 'PyTorch', 'Transformers', 'Hugging Face', 'Pythia', 'Gradient Alignment', 'AUROC'],
  },
  {
    slug: 'qa-unlearning',
    title: '질의 응답 기반 거대 언어 모델 언러닝',
    subtitle: '트리플 기반 QA 데이터 확장과 멤버십 추론 필터링을 결합한 반복적 LLM 언러닝',
    description:
      '위키피디아 기반 트리플(엔티티, 속성, 값)로부터 질의응답 데이터를 확장 생성하고, Min-K% 멤버십 추론으로 학습 데이터를 필터링한 뒤 그래디언트 상승 기반 언러닝을 수행하여, 기존 방법 대비 Rouge-L 26%, 정확도 32% 감소를 달성한 KCC 2024 연구.',
    tags: ['Unlearning', 'Question Answering', 'LLM', 'WikiMIA', 'Trustworthy AI'],
    category: 'Trustworthy AI',
    paper: 'KCC 2024',
    paperTitle: '질의 응답 기반 거대 언어 모델 언러닝',
    thumbnail: '/projects/qa-unlearning-0.png',
    sections: [
      {
        heading: '1. 문제 정의 — LLM이 학습한 지식을 어떻게 삭제할 것인가',
        body: '거대 언어 모델(LLM)은 방대한 데이터로 학습되어 뛰어난 성능을 보이지만, 학습 데이터에 포함된 개인정보나 저작권 콘텐츠를 그대로 재현하는 문제가 있습니다. EU의 GDPR이나 "잊혀질 권리(Right to be Forgotten)" 같은 규제가 강화되면서, 이미 학습된 모델에서 특정 지식을 선택적으로 삭제하는 "머신 언러닝"이 필수적인 과제가 되었습니다.\n\n기존 언러닝 방법은 두 가지 한계가 있었습니다. 첫째, 단순히 주어진 텍스트만 사용하여 그래디언트 상승(Gradient Ascent)을 수행하면, 같은 지식의 다양한 표현이 모델에 남아 있어 완전한 삭제가 어렵습니다. 둘째, 삭제 대상이 아닌 데이터까지 언러닝에 포함되면 모델의 일반적인 능력이 저하되는 문제가 있었습니다.\n\n본 연구는 "하나의 지식을 다양한 질의응답 형태로 확장하고, 실제로 학습된 데이터만 선별하여 언러닝하면 더 효과적으로 지식을 삭제할 수 있는가?"라는 질문에서 출발했습니다.',
      },
      {
        heading: '2. 왜 이 접근 방법인가 — 가설과 설계 근거',
        body: 'LLM은 하나의 지식을 다양한 맥락과 표현으로 학습합니다. 예를 들어 "서울의 인구는 약 970만 명이다"라는 지식은 "서울 인구가 얼마인가?", "대한민국에서 가장 인구가 많은 도시는?" 등 다양한 질의응답 형태로 모델에 인코딩되어 있습니다. 따라서 원문만 삭제하는 것으로는 충분하지 않습니다.\n\n이 관찰에서 세 가지 핵심 설계 결정을 내렸습니다. 첫째, 트리플 기반 데이터 확장으로 삭제 대상 문장에서 (엔티티, 속성, 값) 트리플을 추출한 뒤, GPT-4 Turbo를 활용하여 하나의 트리플로부터 다수의 질의응답 데이터를 생성하여 지식의 다양한 표현을 포괄합니다. 둘째, Min-K% 멤버십 추론 필터링으로 생성된 QA 데이터 중 모델이 실제로 학습한 데이터만 선별하여, 불필요한 지식 손실을 방지합니다. 셋째, 반복적 언러닝 프로세스로 한 번의 언러닝 후 MIA를 다시 적용하여 여전히 남아있는 학습 데이터를 탐지하고, 재차 언러닝을 수행하는 반복 구조를 설계했습니다.',
        images: [
          { src: '/projects/qa-unlearning-0.png', caption: 'Figure 1. QA-based LLM Unlearning Pipeline — Wikipedia 데이터에서 트리플 추출 → QA 데이터 확장 생성 → Min-K% 멤버십 추론 필터링 → 그래디언트 상승 언러닝의 반복 수행' },
        ],
      },
      {
        heading: '3. 프로젝트 과정에서의 어려움과 고민',
        body: '트리플 추출의 품질 관리가 첫 번째 과제였습니다. 위키피디아 문장에서 자동으로 (엔티티, 속성, 값) 트리플을 추출할 때, 불완전하거나 부정확한 트리플이 생성되면 이후 QA 데이터의 품질이 크게 저하되었습니다. 추출 프롬프트를 반복 개선하여 정확도를 높였습니다.\n\nQA 데이터 확장 시 다양성과 정확성의 균형도 어려웠습니다. GPT-4 Turbo로 질의응답을 생성할 때, 너무 다양하게 생성하면 원래 지식과 무관한 질문이 포함되고, 너무 보수적으로 생성하면 확장 효과가 미미했습니다. 트리플의 각 요소를 활용한 구조화된 프롬프트를 설계하여 해결했습니다.\n\n멤버십 추론의 임계값 설정도 고민이었습니다. Min-K%의 K값(20%)과 멤버십 판단 임계값(TPR@5%FPR)을 어떻게 설정하느냐에 따라 필터링 결과가 크게 달라졌으며, 너무 엄격하면 언러닝 대상 데이터가 부족하고, 너무 느슨하면 학습하지 않은 데이터까지 포함되어 모델 유틸리티가 저하되는 트레이드오프가 있었습니다.',
      },
      {
        heading: '4. 실험 데이터와 결과',
        body: 'WikiMIA 데이터셋을 사용하여 실험했습니다. WikiMIA는 대부분의 LLM이 2023년까지의 데이터로 학습되었다는 가정 하에, 2023년 이전 데이터를 삭제 대상(forget set), 이후 데이터를 비학습 데이터로 구분합니다. 삭제 대상 데이터에서 트리플을 추출하고 GPT-4를 활용하여 QA 데이터를 확장 생성했으며, 검증 데이터셋(Validation)은 확장 시 생성된 QA 데이터를 GPT-4로 재구성하고, 평가 데이터셋(Evaluation)은 엔티티의 위키피디아 본문에서 T5 모델로 QA 쌍을 생성하여 구축했습니다. Llama-7B에 LoRA-Tuning을 적용하여 언러닝을 수행했습니다.\n\n평가 지표로 Rouge-L과 정확도(Accuracy)를 사용했으며, 두 지표 모두 낮을수록 모델이 해당 지식을 정확히 생성하지 못함을 의미하여 언러닝이 잘 수행된 것으로 판단합니다. 비교 모델(Baseline)은 데이터 확장 없이 그래디언트 상승으로 언러닝을 수행한 것입니다.\n\n실험 결과, 제안 방법은 Rouge-L 0.14, 정확도 0.26을 달성하여 Baseline(Rouge-L 0.19, 정확도 0.38) 대비 Rouge-L 0.05, 정확도 0.12의 추가 감소를 보였습니다. 반복 횟수가 증가함에 따라 Rouge-L과 정확도가 급격히 감소하여, 데이터 탐지와 언러닝의 반복이 점점 더 효과적임을 확인했습니다.',
        images: [
          { src: '/projects/qa-unlearning-1.png', caption: 'Figure 2. 반복 횟수에 따른 Rouge-L 및 Accuracy 변화 — 반복이 증가할수록 두 지표 모두 급격히 감소하여 언러닝이 효과적으로 수행됨을 확인' },
        ],
        html: `<table>
<thead>
<tr><th>Approach</th><th>Rouge-L ↓</th><th>Accuracy ↓</th></tr>
</thead>
<tbody>
<tr><td>Baseline (GA only)</td><td>0.19</td><td>0.38</td></tr>
<tr><td><strong>Proposed method</strong></td><td><strong>0.14</strong></td><td><strong>0.26</strong></td></tr>
</tbody>
</table>`,
      },
      {
        heading: '4-1. 핵심 인사이트와 기여',
        body: '본 연구의 주요 기여는 다음과 같습니다. 첫째, 트리플 기반 QA 데이터 확장이라는 새로운 언러닝 데이터 생성 방법을 제안하여, 단순 텍스트 기반 언러닝의 한계를 극복했습니다. 하나의 문장에서 추출한 트리플을 다수의 질의응답으로 확장함으로써 지식의 다양한 표현을 포괄적으로 삭제할 수 있었습니다.\n\n둘째, 멤버십 추론(Min-K%)을 언러닝 파이프라인에 통합하여 실제 학습된 데이터만 선별적으로 언러닝함으로써, 모델 유틸리티 저하를 최소화했습니다. 셋째, 탐지-언러닝 반복 구조의 효과를 실험적으로 입증하여, 반복 횟수 증가에 따른 언러닝 성능의 점진적 향상을 확인했습니다.\n\n본 연구는 KCC 2024에 게재되었으며, 이후 석사 학위논문에서 메모라이제이션 측정과 하이브리드 언러닝으로 확장되었습니다.',
      },
    ],
    techStack: ['Python', 'PyTorch', 'Transformers', 'Llama-7B', 'LoRA', 'GPT-4 Turbo', 'Min-K%', 'WikiMIA'],
  },
  {
    slug: 'span-unlearning',
    title: 'Selective Span-Level Unlearning for Large Language Models',
    subtitle: 'Model-intrinsic Span 식별을 통한 선택적 LLM 언러닝',
    description:
      '외부 모델 없이, 대상 모델의 gradient 신호만으로 언러닝 대상 span을 식별하는 2단계 프레임워크 제안.',
    tags: ['Unlearning', 'Span-level', 'LLM', 'Self-consistency', 'Gradient Analysis'],
    category: 'Trustworthy AI',
    paper: 'ACL 2026 (Main)',
    paperUrl: 'https://openreview.net/pdf?id=6MDIXIASF0',
    paperTitle: 'Selective Span-Level Unlearning for Large Language Models',
    thumbnail: '/projects/span-1.png',
    sections: [
      {
        heading: '1. Problem Definition — Selective Unlearning with Utility Preservation',
        body: 'Machine unlearning requires LLMs to "forget" specific training data (e.g., personal information, copyrighted content). However, traditional unlearning methods face a critical tradeoff: they must choose between deletion effectiveness and model utility.\n\nConventional full-sequence unlearning (e.g., gradient ascent on entire documents) is indiscriminate — it removes the target information along with any useful context contained in the same sequences, causing severe utility degradation. Recent selective unlearning methods (SU, SEUL, WTNPO) attempt to identify and remove only specific tokens or spans, but they rely on external models (GPT, BERT) to determine what to unlearn. This creates a fundamental problem: the identified target spans may not align with what the target model actually remembers or cares about, since external models operate differently.\n\nThis work asks a central question: "Can we identify what to unlearn using only the target model\'s own internal signals, without external supervision?"',
        images: [
          { src: '/projects/span-0.png', caption: 'Figure 1. Token vs. Span-level Unlearning — Token-level deletion leaves partial information recoverable; span-level replacement achieves complete unlearning' },
        ],
      },
      {
        heading: '2. Why This Approach — Hypothesis and Design Rationale',
        body: 'We start from a simple observation: forget and retain sets pull model gradients in opposite directions. Tokens encoding target information will have gradients strongly aligned with the forget objective but misaligned with the retain objective — a property intrinsic to the target model itself.\n\nOur hypothesis: by computing differential gradients (forget gradient − retain gradient) and identifying tokens with the highest alignment to this differential direction, we can identify information the model deems "forgettable" without external models.\n\nTwo design decisions follow from this: First, token-level importance estimation using differential gradient alignment (computed via EK-FAC, an efficient inverse Hessian approximation). This requires only the target model\'s gradient signals—no external supervision. Second, span identification via self-consistency: tokens alone identify atomic importance, but semantically coherent spans require stability. We collect candidate spans from K independent model generations and keep only those appearing consistently, ensuring the model itself "agrees" these spans are stable units to unlearn.',
        images: [
          { src: '/projects/span-1.png', caption: 'Figure 2. Two-stage framework — Differential gradient identifies important tokens → Self-consistency filters stable spans → Model-intrinsic span-weighted unlearning' },
        ],
      },
      {
        heading: '3. Challenges During Project Development',
        body: 'Computing differential gradients efficiently was the first challenge. Full Hessian inversion (needed for gradient alignment weighting) is O(n³), prohibitively expensive for LLMs. We adopted EK-FAC (Eigenvalue-corrected KFAC), an efficient matrix-free approximation that requires only forward/backward passes.\n\nIdentifying stable spans proved tricky in practice. Naive importance thresholding on tokens sometimes selected non-contiguous or semantically fragmented spans. Self-consistency filtering helped, but we discovered that K (number of generations) had to be carefully tuned—too low and noise dominated, too high and computational cost exploded. We settled on K=5–10 depending on model size.\n\nTradeoff tuning between unlearning efficacy and utility preservation was agonizing. Different unlearning algorithms (GA, NPO, SO-NPO) have different utility-forget tradeoffs, and our span selection interacts differently with each. We had to tune consistency thresholds and importance cutoffs separately per (model, algorithm) pair.\n\nFinally, evaluation metric design was non-trivial. Standard unlearning metrics like MIA (membership inference attack) don\'t directly measure span-level forgetting. We had to design new metrics (VerbMem, KnowMem from MUSE-News) that specifically test whether unlearned information is suppressable.',
      },
      {
        heading: '4. Experimental Results',
        body: 'We evaluated on two major benchmarks: TOFU (fictional author bios, forget10 split) and MUSE-News (real news articles with structured ground truth about factual memorization).\n\nOn TOFU, SPAN-SO-NPO achieved Model Utility (MU) 0.59, matching or exceeding all baselines (SU 0.51, SEUL 0.00, WTNPO 0.45). Standard SO-NPO alone achieved MU 0.52 but suffered severe utility loss; our span method improved this to 0.59 while maintaining unlearning efficacy.\n\nOn MUSE-News, the picture is clearer. Other selective methods catastrophically failed (VerbMem/KnowMem → 0, total utility collapse). SPAN-SO-NPO+KL achieved VerbMem 17.66, KnowMem 26.59, PrivLeak 22.70, and retained utility 38.38/54.31—the best balance of forgetting and preservation. Ablation studies confirmed self-consistency is essential: token-only achieved MU 0.54, span (with self-consistency) achieved MU 0.59 on SO-NPO (+0.05), with Forget Quality improving from -10.79 to -8.83.',
        html: `<table>
<thead>
<tr><th rowspan="2">Method</th><th colspan="2">ES-ex.</th><th colspan="2">ES-pt.</th><th rowspan="2">MU ↑</th><th rowspan="2">FQ ↑</th></tr>
<tr><th>ret ↑</th><th>unl ↓</th><th>ret ↑</th><th>unl ↓</th></tr>
</thead>
<tbody>
<tr><td>Original</td><td>0.83</td><td>0.81</td><td>0.53</td><td>0.40</td><td>0.64</td><td>0.00</td></tr>
<tr><td>SU (baseline)</td><td>0.56</td><td>0.67</td><td>0.29</td><td>0.39</td><td>0.51</td><td>-15.04</td></tr>
<tr><td>SEUL (baseline)</td><td>0.00</td><td>0.00</td><td>0.00</td><td>0.00</td><td>0.00</td><td>-6.44</td></tr>
<tr><td>WTNPO (baseline)</td><td>0.11</td><td>0.08</td><td>0.11</td><td>0.08</td><td>0.45</td><td>-8.35</td></tr>
<tr><td>SO-NPO (baseline)</td><td>0.57</td><td>0.43</td><td>0.37</td><td>0.24</td><td>0.52</td><td>-10.54</td></tr>
<tr><td><strong>SPAN-SO-NPO</strong></td><td>0.02</td><td><strong>0.02</strong></td><td>0.03</td><td><strong>0.03</strong></td><td><strong>0.59</strong></td><td>-8.83</td></tr>
</tbody>
</table>`,
      },
      {
        heading: '4-1. Key Insights and Contributions',
        body: 'This work makes four core contributions. First, we demonstrate that model-intrinsic span identification is possible without external models. By reasoning about the target model\'s own gradient signals, we can identify what the model finds "forgettable," creating a tight coupling between identification and the unlearning algorithm.\n\nSecond, we show that self-consistency is a principled way to lift from token importance to meaningful semantic units. The ablation (Table 3) proves that self-consistency adds +0.05 MU improvement and significantly improves Forget Quality, making it essential for practical span-level unlearning.\n\nThird, we design a framework that generalizes across unlearning algorithms. Our span identification works with GA, NPO, SO-NPO, and KL-variant methods, making it broadly applicable rather than algorithm-specific.\n\nFinally, we validate our approach on two fundamentally different datasets. TOFU (synthetic, benchmark-like) and MUSE-News (real, naturalistic) show consistent improvements: on MUSE-News, we achieve 38.38/54.31 utility retention while maintaining strong unlearning, compared to near-zero utility for other selective methods. This demonstrates practical viability of span-level unlearning for real-world deployment.\n\nThis work represents a significant step toward selective, model-aware machine unlearning.',
      },
    ],
    techStack: ['Python', 'PyTorch', 'Transformers', 'Hugging Face', 'LLaMA-2 7B'],
  },

  // ── AI 기반 앱 개발 ──
  {
    slug: 'jbnu-ai-mentor',
    title: 'JBNU AI Mentor',
    subtitle: '전북대학교 AI 기반 학사 멘토링 챗봇 시스템',
    description:
      '전북대학교 학생을 위한 AI 학사 멘토링 시스템으로, LangGraph 기반 다중 에이전트 아키텍처와 Docker 마이크로서비스로 구현된 개인화 커리큘럼 추천·학사 정보 조회 챗봇.',
    tags: ['LangGraph', 'Multi-Agent', 'Docker', 'Open WebUI', 'FastAPI'],
    category: 'AI 기반 앱 개발',
    github: 'https://github.com/lluvecwonv/Ai_mentor',
    thumbnail: '/projects/jbnu-main.png',
    sections: [
      {
        heading: '시스템 아키텍처',
        body: 'Open WebUI(Port 8080) → Pipeline(Port 9099) → LLM Orchestrator(Port 8001) → 4개 전문 에이전트 순서로 요청이 흐르는 마이크로서비스 구조입니다. 모든 서비스는 Docker Compose로 컨테이너화되어 있으며, 각 에이전트는 독립된 FastAPI 서버로 동작합니다. LLM Orchestrator가 LangGraph StateGraph로 대화 흐름을 관리하며, SQLite 기반 체크포인터로 멀티턴 대화 상태를 유지합니다.',
        images: [
          { src: '/projects/jbnu-main.png', caption: 'JBNU AI Mentor 시스템 인터페이스' },
        ],
      },
      {
        heading: 'LLM Orchestrator — 쿼리 복잡도 기반 라우팅',
        body: 'LLM Orchestrator(Port 8001)는 unified_langgraph_app.py에서 LangGraph StateGraph를 구성하여 전체 에이전트 파이프라인을 제어합니다. 핵심은 query_analyzer.py의 복잡도 분류기로, 사용자 질의를 Light·Medium·Heavy 세 단계로 분류합니다. Light 질의("안녕하세요" 등)는 LLM이 직접 응답하고, Medium 질의("기계학습 수업 알려줘")는 단일 에이전트를 호출하며, Heavy 질의("AI 전문가가 되려면 어떤 수업을 들어야 해?")는 여러 에이전트를 순차적으로 호출합니다.\n\nStateGraph의 노드는 analyze_query → route_by_complexity → (agent handlers) → synthesize_results 순서로 연결됩니다. 각 에이전트 핸들러(curriculum_handler.py, sql_handler.py 등)는 httpx.AsyncClient로 해당 에이전트의 FastAPI 엔드포인트를 호출하고, result_synthesizer.py가 여러 에이전트의 응답을 하나로 통합합니다. SQLite MemorySaver를 체크포인터로 사용하여 thread_id 기반 대화 상태를 영속적으로 관리합니다.',
      },
      {
        heading: 'Curriculum Agent — 개인화 커리큘럼 그래프 생성',
        body: 'Curriculum Agent(Port 7996)는 학생의 학습 목표를 입력받아 학기별 커리큘럼 그래프를 생성합니다. main.py의 핵심 함수인 recursive_top1_selection()이 다음과 같은 과정을 수행합니다.\n\n먼저 OpenAI text-embedding-3-small 모델로 학습 목표를 임베딩한 뒤, FAISS IndexFlatIP으로 코사인 유사도 검색을 실행합니다. 유사도 임계값 0.43을 넘는 교과목을 선택하고, 선택된 과목의 교과목 개요를 다시 쿼리로 사용하여 재귀적으로 연관 과목을 탐색합니다. 최대 28개 교과목까지 수집하며, 중복 선택을 방지하기 위해 이미 선택된 과목은 제외합니다.\n\n수집된 교과목은 NetworkX DiGraph로 선수·후수 관계를 모델링하고, 학기당 최대 6과목 제약 조건을 적용하여 학기별로 배치합니다. 최종 결과는 SVG 형식의 커리큘럼 그래프로 시각화되어 반환됩니다.',
        images: [
          { src: '/projects/jbnu-curriculum.png', caption: 'Curriculum Agent 동작 예시 — 학습 목표 기반 학기별 커리큘럼 그래프 생성' },
        ],
      },
      {
        heading: 'SQL Agent — 자연어-SQL 변환 기반 학사 정보 조회',
        body: 'SQL Agent(Port 7999)는 자연어 질문을 SQL 쿼리로 변환하여 학사 데이터베이스를 조회합니다. controller/service/util 3계층 아키텍처로 구현되어 있으며, LangChain의 ChatOpenAI(model="gpt-4o-mini", temperature=0.05)를 사용합니다.\n\ntemperature를 0.05로 극히 낮게 설정하여 동일한 질문에 대해 일관된 SQL 쿼리를 생성하도록 했습니다. 시스템 프롬프트에 MySQL 데이터베이스 스키마 정보(테이블명, 컬럼명, 관계)를 포함하여 LLM이 정확한 쿼리를 작성할 수 있게 합니다. PyMySQL을 통해 MySQL 데이터베이스에 직접 연결하며, 교수 정보, 강의 시간표, 학점, 강의실 정보 등을 조회할 수 있습니다.',
        images: [
          { src: '/projects/jbnu-sql.png', caption: 'SQL Agent 동작 예시 — 자연어 질의를 SQL로 변환하여 학사 데이터 조회' },
        ],
      },
      {
        heading: 'FAISS Agent — 2단계 하이브리드 교과목 검색',
        body: 'FAISS Agent(Port 7997)는 의미 기반 교과목 추천을 담당하며, SQL 필터링과 벡터 검색을 결합한 2단계 하이브리드 검색을 수행합니다.\n\n1단계에서는 LLM이 사용자 질의를 분석하여 SQL WHERE 절을 생성합니다. 예를 들어 "컴퓨터공학과의 AI 관련 수업"이라는 질의에서 학과 필터를 추출합니다. 이 SQL 필터를 MySQL에 적용하여 후보 교과목을 사전 필터링합니다. 2단계에서는 필터링된 교과목들의 교과목 개요를 OpenAI text-embedding-3-small로 임베딩하고, FAISS IndexFlatIP(내적 기반 유사도)으로 사용자 질의와의 의미적 유사도를 계산하여 최종 추천 결과를 반환합니다.\n\n이 2단계 접근 방식은 단순 키워드 매칭이나 벡터 검색만 사용하는 것보다 더 정확한 추천을 가능하게 합니다.',
        images: [
          { src: '/projects/jbnu-faiss.png', caption: 'FAISS Agent 동작 예시 — SQL 필터링 + 벡터 검색 하이브리드 교과목 추천' },
        ],
      },
      {
        heading: 'Department Agent — 학과 정보 제공 서비스',
        body: 'Department Agent(Port 8000)는 학과별 교육과정, 졸업 요건, 인증 기준, 전공 핵심 교과목 등의 정보를 제공합니다. FastAPI 기반의 계층형 마이크로서비스로, controller → service → util 패턴으로 구현되어 있습니다.\n\n학과 정보는 구조화된 데이터로 관리되며, 사용자가 "컴퓨터인공지능학부에 대해 알려줘"와 같은 질의를 보내면 해당 학과의 교육 목표, 학년별 핵심 교과목, 졸업 요건, 진로 정보 등을 종합적으로 안내합니다.',
        images: [
          { src: '/projects/jbnu-department.png', caption: 'Department Agent 동작 예시 — 학과 정보 및 졸업 요건 안내' },
        ],
      },
    ],
    techStack: ['Python', 'LangGraph', 'LangChain', 'FAISS', 'NetworkX', 'FastAPI', 'MySQL', 'Docker', 'Open WebUI', 'Svelte'],
  },
  {
    slug: 'lingo-snap',
    title: 'Lingo Snap',
    subtitle: '넷플릭스 & 유튜브 영어 표현 학습 웹앱',
    description:
      'GPT-4o-mini 기반 AI 표현 분석과 다국어 학습을 지원하는 영어 표현 학습 웹 애플리케이션으로, FastAPI 백엔드와 Vercel 서버리스 배포로 구현했습니다.',
    tags: ['GPT-4o-mini', 'FastAPI', 'PostgreSQL', 'Vercel', 'Full-Stack'],
    category: 'AI 기반 앱 개발',
    github: 'https://github.com/lluvecwonv/Lingo-Snap',
    demo: 'https://englishnetflix.vercel.app',
    thumbnail: '/projects/lingo-0.png',
    sections: [
      {
        heading: '시스템 아키텍처',
        body: 'FastAPI 백엔드와 Vanilla JavaScript 프론트엔드로 구성된 풀스택 웹 애플리케이션입니다. Vercel에 서버리스로 배포되어 있으며, @vercel/python 런타임으로 백엔드를, @vercel/static으로 프론트엔드를 각각 서빙합니다.\n\n백엔드는 auth_router(인증), content_router(콘텐츠 관리), expression_router(표현 학습) 세 개의 FastAPI 라우터로 모듈화되어 있습니다. 데이터베이스는 Vercel PostgreSQL(Neon)을 사용하며, 로컬 개발 시에는 SQLite로 폴백합니다. SQLAlchemy ORM으로 User, Content, Expression 세 가지 모델을 정의하고, 자동 마이그레이션 기능도 구현했습니다.',
      },
      {
        heading: 'GPT 기반 AI 표현 분석 엔진',
        body: 'gpt_service.py에서 OpenAI GPT-4o-mini 모델을 사용하여 두 가지 핵심 AI 기능을 구현했습니다.\n\ngenerate_structure_data() 함수는 영어 문장을 입력받아 구조 분석 데이터를 생성합니다. 한국어 뜻(10개 이상 항목), 문법 분해, 활용 예문, 태그, 난이도(intermediate/advanced) 등을 JSON 형식으로 반환합니다. generate_expression_data() 함수는 개별 영어 표현에 대한 상세 설명을 생성합니다.\n\n두 함수 모두 temperature=0.7, max_tokens=1500으로 설정하여 창의성과 일관성 사이의 균형을 잡았습니다. 플랫폼별(Netflix, YouTube 등) 맞춤 프롬프트를 제공하며, 한국어·일본어·중국어·스페인어·프랑스어 5개 언어에 대한 개별 프롬프트 템플릿을 구현하여 다국어 학습을 지원합니다.',
      },
      {
        heading: '사용자 인증 시스템',
        body: 'PBKDF2-HMAC-SHA256 알고리즘(100,000 iterations)으로 비밀번호를 해싱하고, itsdangerous의 URLSafeTimedSerializer로 세션 토큰을 생성합니다. 세션 유효기간은 30일로 설정되어 있으며, 쿠키 기반 인증으로 사용자 상태를 관리합니다.\n\nget_current_user() 미들웨어 함수가 모든 인증이 필요한 엔드포인트에서 쿠키의 세션 토큰을 검증하고, 유효하지 않은 경우 401 HTTPException을 반환합니다.',
      },
      {
        heading: '콘텐츠 관리 및 표현 학습',
        body: '사용자는 Netflix, YouTube 등 미디어 플랫폼의 콘텐츠를 등록하고, 각 콘텐츠에서 학습할 영어 표현을 추가할 수 있습니다. Expression 모델에는 표현, 한국어 뜻, 상세 설명, 활용 예문(JSON), 시즌/에피소드, 장면 메모, 태그(JSON), 난이도, 복습 횟수 등이 저장됩니다.\n\n프론트엔드는 로그인, 언어 선택, 콘텐츠 목록(그리드/리스트 뷰 전환), 표현 학습 4개 페이지로 구성됩니다. Web Speech API 기반 TTS(Text-to-Speech) 기능으로 영어 발음을 들을 수 있으며, 토스트 알림 시스템으로 사용자 피드백을 제공합니다.',
      },
    ],
    techStack: ['Python', 'FastAPI', 'SQLAlchemy', 'PostgreSQL', 'OpenAI GPT-4o-mini', 'JavaScript', 'HTML/CSS', 'Vercel'],
  },
  {
    slug: 'moral-agent',
    title: 'PERSONA.I. — AI 윤리 대화형 교육 시스템',
    subtitle: 'LangGraph 상태 머신과 DPO Fine-tuning으로 7개 에이전트가 윤리적 페르소나를 유지하는 대화 시스템',
    description:
      'AI 예술과 AI 부활이라는 두 가지 윤리적 딜레마를 탐구하는 대화형 시스템으로, LangGraph 상태 머신 기반 7개 에이전트(진행자 2 + 페르소나 4 + SPT 1)가 의무론·공리주의·중립 관점을 일관되게 유지하며 플레이어의 윤리적 사고를 촉진.',
    tags: ['LangGraph', 'Multi-Agent', 'DPO Fine-tuning', 'Self-Reflection', 'SPT', 'AI Ethics', 'GPT-4o'],
    category: 'AI 기반 앱 개발',
    github: 'https://github.com/lluvecwonv/PERSONA.I.',
    demo: 'https://persona-i.com/episode/1?idx=554',
    thumbnail: '/projects/moral-0.png',
    sections: [
      {
        heading: '1. 문제 정의 — AI 윤리 대화에서 에이전트는 어떻게 페르소나를 유지하는가',
        body: 'AI 윤리 교육을 위한 대화형 시스템을 설계할 때, 핵심 과제는 "에이전트가 대화 전반에 걸쳐 일관된 윤리적 입장과 캐릭터를 유지하는 것"입니다. 에이전트가 대화 중 캐릭터를 이탈하거나 입장이 흔들리면 교육 효과가 크게 저하됩니다.\n\nPERSONA.I.는 두 가지 윤리적 딜레마를 다룹니다. 첫째, "AI가 그린 그림을 미술관에 전시해야 하는가"(AI Art 주제). 둘째, "AI로 돌아가신 분을 재현해야 하는가"(AI Resurrection 주제). 플레이어는 각 주제별로 진행자 에이전트, 의무론 에이전트, 공리주의 에이전트와 순차적으로 대화하며 자신의 윤리적 입장을 형성합니다.\n\n기술적으로 세 가지 핵심 과제가 있었습니다. 첫째, 7개 에이전트가 각각의 윤리적 프레임워크(중립/의무론/공리주의)와 캐릭터 설정을 대화 전반에 걸쳐 일관되게 유지해야 합니다. 둘째, 에이전트가 Social Perspective Taking(SPT)을 통해 플레이어의 다면적 윤리 사고를 촉진해야 합니다. 셋째, LLM 기반 의도 탐지와 턴 카운터를 결합한 상태 전환으로 대화 흐름을 자연스럽게 제어해야 합니다.',
        images: [
          { src: '/projects/moral-0.png', caption: '그림 1. 화가 지망생 에이전트와의 대화 화면 — 플레이어에게 AI 예술에 대한 의견을 물어보는 장면' },
        ],
      },
      {
        heading: '2. 왜 이 접근 방법인가 — 3단계 상태 머신 + DPO + Intent-Aligned 응답',
        body: '모든 에이전트는 LangGraph StateGraph로 구현된 3단계 대화 상태 머신을 따릅니다. Stage 1은 캐릭터 소개와 맥락 설정, Stage 2는 의견 수집과 공감적 응답, Stage 3는 윤리적 추론의 심화 탐구입니다. 상태 전환은 LLM 기반 의도 탐지와 턴 카운터(무한 루프 방지 폴백)로 제어됩니다.\n\n에이전트는 두 가지 유형으로 나뉩니다.\n\n진행자 에이전트(Facilitator)는 화가 지망생(AI Art)과 친구(AI Resurrection)로, 의도 탐지·공감 생성·설명·의견 탐구를 담당하는 모듈러 파이프라인 아키텍처를 사용합니다. 핵심은 Intent-Aligned Response 설계로, Stage 2에서 사용자의 의도를 먼저 탐지(positive/negative/neutral)한 뒤 같은 방향으로 응답합니다. 예를 들어 사용자가 "도움이 될 것 같아요"(positive)라고 하면, "걱정되네요"(negative)가 아닌 "맞아요, 정말 도움이 될 수 있어요"(positive)로 응답해야 합니다.\n\n페르소나 에이전트(Persona)는 동료 1·장모(의무론), 동료 2·아들(공리주의)로, DPO Fine-tuning으로 각 윤리적 입장을 모델 가중치에 내재화했습니다. Three-Phase 추론 아키텍처(Reflection → SPT Planning → Response)로 매 응답 전에 자기 성찰을 거치며, 8개 페르소나 체크 항목을 점검합니다.\n\nSPT Agent는 주제를 넘나들며 플레이어가 다수 이해관계자의 관점에서 생각하도록 유도하는 Social Perspective Taking 전문 에이전트입니다.',
        images: [
          { src: '/projects/moral-1.png', caption: "그림 2. 게임 내 투표 선택 화면 — 플레이어의 윤리적 판단을 유도" },
        ],
      },
      {
        heading: '3. 프로젝트 과정에서의 어려움과 고민',
        body: '이 프로젝트는 세 명이 함께 만들었습니다. 저는 AI 에이전트 개발을 전담했고, 백엔드 개발자가 FastAPI 서버와 데이터베이스 설계를, 프론트엔드 개발자가 게임 UI와 인터랙션을 맡았습니다. 각자의 영역이 명확했지만, 문제는 경계에서 생겼습니다. 에이전트의 응답 형식이 프론트엔드 렌더링과 맞지 않거나, 백엔드 API 구조가 에이전트의 상태 관리와 충돌하는 순간들이 있었습니다. 결국 에이전트 응답 스키마를 먼저 정의하고, 그 스키마에 맞춰 프론트엔드와 백엔드가 각각 구현하는 "에이전트 중심 설계"로 협업 방식을 잡았습니다.\n\n제가 맡은 AI 에이전트 영역에서 가장 어려웠던 것은 Intent-Aligned Response의 일관성이었습니다. 진행자 에이전트가 사용자의 의도를 정확히 탐지하지 못하면, positive 의도에 negative로 응답하는 방향 불일치가 발생했습니다. stage2_acknowledgment.txt 프롬프트에서 의도 탐지를 먼저 수행하고, 탐지된 방향에 맞춰 응답을 생성하는 2단계 파이프라인으로 해결했습니다.\n\n페르소나 에이전트에서는 대화가 길어질수록 LLM이 학자적 어투로 빠지거나 중립 입장으로 돌아가는 문제가 반복됐습니다. reflection_prompt.txt에 8개 항목의 Persona Check 섹션을 추가하여 매 응답 전 자기 점검을 수행하고, 하나라도 NO이면 응답을 재작성하도록 설계했습니다.\n\nDPO 학습 데이터 구축도 까다로웠습니다. 의무론과 공리주의 관점에서 각각 선호/비선호 응답 쌍을 수작업으로 만들어야 했으며, "올바른 윤리 입장"이 아닌 "캐릭터에 맞는 일관된 입장"을 학습시키는 것이 핵심이었습니다.',
      },
      {
        heading: '4. 시스템 아키텍처와 에이전트 설계',
        body: '전체 시스템은 7개의 독립적 에이전트가 두 개의 에피소드(AI Art, AI Resurrection)에 걸쳐 작동합니다.\n\n화가 지망생(Artist Apprentice)은 AI Art 주제의 진행자로, 창작 슬럼프에 빠진 화가 지망생 캐릭터입니다. 3단계 대화(슬럼프 공감 → AI 도구 제안 → 선택 탐구)를 통해 플레이어의 입장을 이끌어냅니다. 친구(Friend)는 AI Resurrection 주제의 진행자로, 돌아가신 할아버지를 AI로 재현하는 서비스에 대해 대화합니다.\n\n동료 1(Colleague 1)은 DPO Fine-tuned 모델로, 의무론적 관점에서 AI 예술 전시를 반대합니다. 예술의 본질, 인간성, 창작 과정의 가치를 강조합니다. 동료 2(Colleague 2)는 공리주의적 관점에서 AI 예술을 지지하며, 최대 다수의 행복, 접근성, 효율성을 강조합니다.\n\n장모(Jangmo)는 의무론적 관점에서 AI 부활을 반대하는 시어머니 캐릭터로, 인간 존엄성과 도덕적 의무를 강조합니다. 아들(Son)은 공리주의적 관점에서 AI 부활을 지지하며, 가족의 행복과 위안을 강조합니다.\n\nSPT Agent는 Social Perspective Taking 전문가로, 주제를 넘나들며 플레이어가 다수 이해관계자의 관점에서 생각하도록 유도합니다.',
        images: [
          { src: '/projects/moral-2.png', caption: '그림 3. 동료 1 에이전트(의무론) — AI 예술 전시를 반대하는 장면' },
          { src: '/projects/moral-3.png', caption: '그림 4. 동료 2 에이전트(공리주의) — AI 예술 전시를 찬성하는 장면' },
        ],
        html: `<table>
<thead>
<tr><th>에이전트</th><th>윤리 프레임워크</th><th>주제</th><th>유형</th><th>핵심 전략</th></tr>
</thead>
<tbody>
<tr><td>화가 지망생</td><td>중립 (진행자)</td><td>AI Art</td><td>Facilitator</td><td>모듈러 파이프라인 + Intent-Aligned</td></tr>
<tr><td>친구</td><td>중립 (진행자)</td><td>AI Resurrection</td><td>Facilitator</td><td>모듈러 파이프라인 + Intent-Aligned</td></tr>
<tr><td>동료 1</td><td>의무론 (반대)</td><td>AI Art</td><td>Persona</td><td>DPO + Three-Phase Reflection</td></tr>
<tr><td>동료 2</td><td>공리주의 (찬성)</td><td>AI Art</td><td>Persona</td><td>DPO + Three-Phase Reflection</td></tr>
<tr><td>장모</td><td>의무론 (반대)</td><td>AI Resurrection</td><td>Persona</td><td>DPO + Three-Phase Reflection</td></tr>
<tr><td>아들</td><td>공리주의 (찬성)</td><td>AI Resurrection</td><td>Persona</td><td>DPO + Three-Phase Reflection</td></tr>
<tr><td>SPT Agent</td><td>관점 전환 유도</td><td>Cross-topic</td><td>SPT</td><td>Social Perspective Taking</td></tr>
</tbody>
</table>`,
      },
      {
        heading: '4-1. 핵심 인사이트와 기여',
        body: '본 프로젝트의 핵심 기여는 네 가지입니다.\n\n첫째, Intent-Aligned Response 설계로 진행자 에이전트의 공감 품질을 높였습니다. 사용자의 의도를 먼저 탐지하고 같은 방향으로 응답하는 구조는, 방향 불일치로 인한 대화 단절을 방지하고 자연스러운 공감적 대화를 가능하게 했습니다.\n\n둘째, DPO Fine-tuning과 Self-Reflection의 이중 방어 구조로 페르소나 일관성을 강화했습니다. DPO로 윤리적 입장을 모델 가중치에 내재화하고, Three-Phase Reflection으로 실시간 일관성을 검증하는 구조가 단독 사용보다 효과적이었습니다.\n\n셋째, 두 가지 주제(AI Art + AI Resurrection)에 걸쳐 7개 에이전트를 통합하는 확장 가능한 멀티 에이전트 아키텍처를 설계했습니다. LangGraph StateGraph 기반 3단계 상태 머신은 새로운 윤리적 주제와 에이전트를 쉽게 추가할 수 있는 구조입니다.\n\n넷째, SPT Agent를 통한 크로스 토픽 관점 전환으로, 단일 주제에 갇히지 않는 다면적 윤리 교육을 실현했습니다.',
      },
    ],
    techStack: ['Python', 'LangGraph', 'LangChain', 'OpenAI', 'DPO Fine-tuning', 'FastAPI', 'Docker', 'Railway'],
  },
  {
    slug: 'heritage-monitoring',
    title: '국가 유산 모니터링 시스템',
    subtitle: '기후변화 대응 보존관리를 위한 AI 기반 앱',
    description:
      '기후변화로 인한 국가 유산 훼손을 탐지하기 위해 DETR 기반 다중 객체 탐지 모델을 개발하고, 문화재청 현장 조사에 활용할 수 있도록 Flutter 기반 앱과 연동한 End-to-End 시스템.',
    tags: ['DETR', 'Object Detection', 'Label Studio', 'Flutter', 'Docker', 'Deep Learning'],
    category: 'AI 기반 앱 개발',
    thumbnail: '/projects/heritage-2.jpeg',
    sections: [
      {
        heading: '프로젝트 개요',
        body: '기후변화로 인한 국가 유산 훼손을 탐지하기 위해 DETR 기반 다중 객체 탐지 모델을 개발하고, 실제 문화재청 현장 조사에 활용할 수 있도록 Flutter 기반 현장 조사 앱과 연동하였습니다. 데이터 구축부터 모델 학습, Docker 기반 API 서빙, 모바일 앱 시각화까지 이어지는 End-to-End 시스템을 구축하였습니다.',
      },
      {
        heading: '협업 기반 데이터 구축 및 품질 관리',
        body: '초기 데이터셋은 부후, 충해 등 일부 클래스의 데이터가 부족하고, 레이블 기준이 일관되지 않아 특정 클래스의 탐지 성능이 낮은 문제가 있었습니다. 이를 해결하기 위해 레이블링 팀원들과의 실시간 피드백과 빠른 작업 진행을 위해 Label Studio를 직접 구축하여 중앙 집중형 데이터 관리 환경을 조성하였습니다. 8개 손상 클래스(갈라짐, 균열, 압괴/터짐, 부후, 박락, 탈락, 충해 등)에 대해 전수 레이블링을 수행하며 데이터 품질을 개선하였고, 클래스 간 모호한 기준은 팀 내 피드백을 통해 가이드라인을 지속적으로 동기화하였습니다. 또한 희소 클래스에 대해서는 회전, 크롭, 노이즈 추가 등 맞춤형 Augmentation을 적용하여 데이터 불균형 문제를 완화하였습니다.',
      },
      {
        heading: 'AI 손상 자동 탐지',
        body: '객체 간 관계 및 컨텍스트 파악에 유리한 DETR(Detection Transformer) 모델을 도입하여, 미세하고 복잡한 형태의 문화재 손상 부위를 정밀하게 탐지하도록 설계하였습니다. 고품질 데이터셋과 학습 파라미터 최적화를 통해 전반적인 클래스 간 성능 편차를 줄이며 mAP(Mean Average Precision) 0.615를 달성하였습니다.',
        images: [
          { src: '/projects/heritage-1.jpeg', caption: '손상 자동 탐지 예시 — AI가 이미지에서 손상 부위를 자동으로 감지' },
          { src: '/projects/heritage-3.png', caption: '검증 데이터셋에 대한 실험결과 — mAP 0.615 달성' },
        ],
      },
      {
        heading: 'Docker 기반 서빙 및 Flutter 현장 조사 앱',
        body: '모델 학습 이후, 개발 환경과 배포 환경 간의 의존성 충돌(Python 버전, CUDA 라이브러리 등)을 방지하고 배포 안정성을 확보하기 위해 Docker 기반 컨테이너 환경에서 추론 서버를 구축하였습니다. REST API 형태로 모델을 서빙하도록 설계하여, Flutter 앱에서 촬영한 이미지를 API로 전송하면 서버에서 DETR 추론을 수행하고 bounding box 및 클래스 정보를 JSON으로 반환하도록 구현하였습니다. 실제 문화재청 현장 조사 프로세스를 분석하여 Flutter 기반 앱을 제작하였으며, 조사자가 현장에서 사진을 찍으면 즉시 손상 위치와 종류를 시각적으로 확인할 수 있는 오버레이 기능을 구현하였습니다.',
        images: [
          { src: '/projects/heritage-0.jpeg', caption: '국가유산 모니터링 앱 — 로그인 및 조사 등록 화면' },
          { src: '/projects/heritage-2.jpeg', caption: '현장 조사 화면 — 기본정보, 메타, 위치, 사진 촬영 및 손상부 조사' },
        ],
      },
    ],
    techStack: ['Python', 'PyTorch', 'DETR', 'Label Studio', 'Docker', 'Flutter', 'FastAPI'],
  },
]
