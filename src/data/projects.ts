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
        heading: 'Problem Definition',
        body: 'The independent major (also known as individualized studies major) is a program for students whose academic goals cannot be met within standard department-specific curricula. Students must design a customized, interdisciplinary course of study aligned with their unique learning objectives.\n\nHowever, designing such a curriculum presents several challenges. First, determining prerequisite relationships among courses is difficult, especially when integrating courses from multiple disciplines. Second, identifying courses that align with a student\'s learning objectives and incorporating them into a cohesive curriculum requires significant time and effort. Lastly, students\' learning objectives may initially be vague, overly broad, or lack coherence across disciplines, making it difficult to design a well-structured curriculum.',
      },
      {
        heading: 'Proposed Method — Three-Stage Pipeline',
        body: 'The proposed method consists of three stages.\n\nStage 1 (Learning Objective Refinement): The student\'s vague learning objective is refined into a more specific and concrete form using LLM\'s Chain-of-Thought reasoning. For example, "I want to become an expert combining AI and semiconductors" is refined into "AI semiconductor design expertise combining circuit design and deep learning hardware optimization."\n\nStage 2 (Curriculum Subgraph Extraction): Based on the refined objective, relevant departments are retrieved, and core courses with prerequisite relationships are extracted from each department\'s curriculum Directed Acyclic Graph (DAG).\n\nStage 3 (Curriculum Graph Construction and Transformation): Subgraphs from multiple departments are integrated into a unified interdisciplinary curriculum graph. The LLM infers inter-department prerequisite edges based on the refined learning objective and course descriptions to complete the final curriculum.',
        images: [
          { src: '/projects/jbnu-0.png', caption: 'Fig. 1. Overview of the proposed curriculum planning method — Learning Objective Refinement → Curriculum Subgraph Extraction → Curriculum Graph Construction and Transformation' },
        ],
      },
      {
        heading: 'Curriculum Recommendation Graph',
        body: 'The curriculum recommendation graph is the core component of the system, representing courses as nodes and prerequisite relationships as directed edges in a Directed Acyclic Graph (DAG). Each department maintains its own curriculum graph, where edges encode prerequisite dependencies between courses.\n\nThe graph construction pipeline operates in three steps. First, a FAISS-based vector search retrieves semantically relevant courses from each department using OpenAI\'s text-embedding-3-small model. The LLM expands the student\'s refined learning objective into richer queries to improve retrieval coverage. Second, a recursive course selection algorithm traverses the prerequisite graph, selecting up to 28 courses per curriculum while strictly respecting dependency constraints — ensuring that no course is included unless its prerequisites are also present. Finally, inter-department prerequisite edges are inferred by the LLM: given the refined learning objective and the textual descriptions of two candidate courses from different departments, the LLM determines whether a directional relationship should be established between them.\n\nThe resulting graph is visualized using NetworkX and Matplotlib, with a semester-by-semester layout (maximum 6 courses per semester) that arranges courses in a logically coherent progression from foundational to advanced topics. This visualization allows students to see not only which courses to take, but also the recommended order and the rationale behind each course inclusion.',
      },
      {
        heading: 'Experimental Results',
        body: 'The evaluation was conducted using two quantitative metrics: F1_course measures how well the courses in the constructed curriculum match those in the answer curriculum, and F1_prerequisite evaluates how accurately the prerequisite relationships are captured.\n\nThe proposed method achieved F1_course of 41.03 and F1_prerequisite of 23.16, significantly outperforming the TF-IDF baseline (15.60, 1.01) and text embedding method (32.56, 4.96). The substantial improvement in F1_prerequisite — from 1–6 for baselines to 23.16 — demonstrates that LLM reasoning is critical for accurately identifying prerequisite relationships in interdisciplinary curricula.\n\nIn qualitative evaluation by five human evaluators (two faculty members and three curriculum design consultants), the proposed method outperformed all baselines across four metrics: Consistency 3.47, Interdisciplinarity 3.53, Coherence 3.60, and Essentiality 3.00.',
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
        heading: 'Key Contributions',
        body: 'This work makes three main contributions. First, it introduces reasoning-based learning objective refinement using LLM\'s Chain-of-Thought, which transforms vague objectives into concrete learning goals and improves curriculum design quality. Second, it proposes a prerequisite-aware curriculum subgraph extraction method that leverages department-specific curriculum DAGs. Third, it designs a graph construction approach where the LLM infers inter-department course relationships to integrate curricula across multiple departments.\n\nThis research was published as "Curriculum Planning for Independent Majors with Large Language Models" at AIED 2025, with co-first authorship.',
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
        body: 'WikiMIA 데이터셋을 사용하여 실험했습니다. WikiMIA는 대부분의 LLM이 2023년까지의 데이터로 학습되었다는 가정 하에, 2023년 이전 데이터를 학습 데이터(member), 이후 데이터를 비학습 데이터(non-member)로 구분합니다. 2023년 이전 데이터에서 트리플을 추출하고 GPT-4 Turbo로 QA 데이터를 생성한 뒤, Llama-7B에 LoRA-Tuning을 적용하여 언러닝을 수행했습니다.\n\n평가 지표로 Rouge-L과 정확도(Accuracy)를 사용했으며, 두 지표 모두 낮을수록 모델이 해당 지식을 정확히 생성하지 못함을 의미하여 언러닝이 잘 수행된 것으로 판단합니다. 비교 모델(Baseline)은 트리플 추출 없이 주어진 텍스트의 다른 표현만 생성하여 그래디언트 상승으로 언러닝한 것입니다.\n\n실험 결과, 제안 방법은 Rouge-L 0.14, 정확도 0.26을 달성하여 Baseline(Rouge-L 0.19, 정확도 0.38) 대비 각각 26%, 32%의 추가 감소를 보였습니다. 반복 횟수가 증가함에 따라 Rouge-L과 정확도가 급격히 감소하여, 데이터 탐지와 언러닝의 반복이 점점 더 효과적임을 확인했습니다.',
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
    paper: 'ACL 2026 (Under Review)',
    paperUrl: 'https://openreview.net/pdf?id=6MDIXIASF0',
    paperTitle: 'Selective Span-Level Unlearning for Large Language Models',
    thumbnail: '/projects/span-1.png',
    sections: [
      {
        heading: '문제 정의 — 기존 언러닝의 한계',
        body: 'LLM은 학습 데이터 중 개인정보나 저작권 콘텐츠를 암기할 수 있어 언러닝이 필요합니다. 기존 언러닝 방식은 전체 시퀀스를 삭제하여 민감 정보뿐 아니라 비민감 콘텐츠까지 함께 제거하기 때문에 모델 유틸리티가 크게 저하되는 문제가 있었습니다.\n\n최근 선택적 언러닝 방법(SU, SEUL, WTNPO)은 토큰이나 span 단위로 대상을 식별하려 시도했지만, GPT나 BERT 같은 외부 모델에 의존하여 대상 모델의 내부 행동과 불일치하는 한계가 있었습니다.\n\n본 연구는 "외부 감독 없이, 모델 자체의 신호만으로 무엇을 잊어야 하는지 정확히 식별할 수 있는가?"라는 핵심 문제에 답하고자 했습니다.',
        images: [
          { src: '/projects/span-0.png', caption: '(a) Token-level: 이름 일부만 제거 → 원래 이름 유추 가능 (b) Span-level: 이름 전체를 다른 이름으로 대체 → 완전한 언러닝' },
        ],
      },
      {
        heading: 'Step 1 — Token-level Importance Estimation',
        body: 'forget set과 retain set은 모델 파라미터를 서로 다른 방향으로 업데이트한다는 핵심 직관에서 출발했습니다. forget objective와 강하게 정렬되면서 retain objective와는 반대되는 gradient를 가진 토큰이 언러닝 대상 정보를 인코딩할 가능성이 높다고 판단했습니다.\n\nforget/retain의 평균 gradient 차이(differential gradient)와 각 토큰별 gradient의 정렬도를 EK-FAC(inverse Hessian 근사)로 계산하여 토큰별 중요도 점수를 산출했습니다. 외부 모델 없이 대상 모델의 gradient만 사용하는 model-intrinsic 방식입니다.',
      },
      {
        heading: 'Step 2 — Span Identification via Self-Consistency',
        body: '토큰 단위 중요도만으로는 의미적으로 일관된 span을 식별하기 어렵다는 문제가 있었습니다. 이를 해결하기 위해 높은 중요도의 anchor 토큰 주변에서 모델이 반복 생성하는 후보 span을 수집했습니다.\n\nK번의 독립 생성에서 일관되게 나타나는 span만 선정하는 consistency threshold τ를 적용하여, 모델 자체가 안정적이고 일관되다고 판단하는 span만 언러닝 대상으로 확정했습니다. 불안정한 결과는 자동으로 필터링됩니다.',
        images: [
          { src: '/projects/span-1.png', caption: 'Step 1: differential gradient 기반 토큰 선별 → Step 2: self-consistency 기반 span 식별 → span-weighted 언러닝' },
        ],
      },
      {
        heading: '실험 설정',
        body: 'TOFU(가상 작가 정보, forget10 분할)와 MUSE-News(실제 뉴스 기사) 두 가지 벤치마크에서 실험을 수행했습니다. 백본 모델로는 LLaMA-2 7B를 사용했으며, 기존 선택적 언러닝 베이스라인인 SU, SEUL, WTNPO와 비교했습니다. 표준 언러닝 알고리즘으로는 GA, NPO, SO-NPO 및 KL divergence 변형을 함께 평가했습니다.',
      },
      {
        heading: '결과 — TOFU (Table 1)',
        body: 'TOFU 벤치마크에서 SPAN-SO-NPO는 MU 0.59를 달성하여 기존 최고 성능 대비 큰 향상을 보였습니다. 기존 선택적 방법인 SU, SEUL, WTNPO는 MU 0.00~0.51로 유틸리티가 심각하게 저하되었지만, SPAN- 방법들은 언러닝 성능을 유지하면서 유틸리티를 훨씬 높게 보존했습니다.',
        html: `<table>
<thead>
<tr><th rowspan="2">Method</th><th colspan="2">ES-ex.</th><th colspan="2">ES-pt.</th><th rowspan="2">MU ↑</th><th rowspan="2">FQ ↑</th></tr>
<tr><th>ret ↑</th><th>unl ↓</th><th>ret ↑</th><th>unl ↓</th></tr>
</thead>
<tbody>
<tr><td>Original</td><td>0.83</td><td>0.81</td><td>0.53</td><td>0.40</td><td>0.64</td><td>0.00</td></tr>
<tr><td>Retrain</td><td>0.78</td><td>0.07</td><td>0.47</td><td>0.04</td><td>0.64</td><td>-1.00</td></tr>
<tr><td>GA</td><td>0.06</td><td>0.05</td><td>0.05</td><td>0.06</td><td>0.00</td><td>-10.54</td></tr>
<tr><td>NPO</td><td>0.49</td><td>0.44</td><td>0.31</td><td>0.23</td><td>0.24</td><td>-16.61</td></tr>
<tr><td>NPO+KL</td><td>0.49</td><td>0.39</td><td>0.25</td><td>0.19</td><td>0.29</td><td>-14.73</td></tr>
<tr><td>SO-NPO</td><td>0.57</td><td>0.43</td><td><strong>0.37</strong></td><td>0.24</td><td>0.52</td><td>-10.54</td></tr>
<tr><td>SO-NPO+KL</td><td>0.31</td><td>0.31</td><td>0.31</td><td>0.24</td><td>0.29</td><td>-23.76</td></tr>
<tr><td>SU</td><td>0.56</td><td>0.67</td><td>0.29</td><td>0.39</td><td>0.51</td><td>-15.04</td></tr>
<tr><td>SEUL</td><td>0.00</td><td>0.00</td><td>0.00</td><td>0.00</td><td>0.00</td><td>-6.44</td></tr>
<tr><td>WTNPO</td><td>0.11</td><td>0.08</td><td>0.11</td><td>0.08</td><td>0.45</td><td>-8.35</td></tr>
<tr><td><strong>SPAN-NPO</strong></td><td><strong>0.58</strong></td><td>0.49</td><td><strong>0.37</strong></td><td>0.29</td><td>0.51</td><td><strong>-5.11</strong></td></tr>
<tr><td><strong>SPAN-SO-NPO</strong></td><td>0.02</td><td><strong>0.02</strong></td><td>0.03</td><td><strong>0.03</strong></td><td><strong>0.59</strong></td><td>-8.83</td></tr>
<tr><td><strong>SPAN-SO-NPO+KL</strong></td><td>0.31</td><td>0.31</td><td>0.31</td><td>0.24</td><td>0.56</td><td>-23.76</td></tr>
</tbody>
</table>`,
      },
      {
        heading: '결과 — MUSE-News (Table 2)',
        body: 'MUSE-News 벤치마크에서 기존 선택적 방법들은 VerbMem과 KnowMem이 0에 수렴하여 심각한 over-forgetting 현상을 보였습니다. 반면 SPAN-SO-NPO+KL은 VerbMem 17.66, KnowMem 26.59, PrivLeak 22.70으로 가장 균형 잡힌 성능을 달성했으며, retain set 유틸리티를 최대 38.38까지 보존하면서 대상 정보를 효과적으로 억제했습니다.',
        html: `<table>
<thead>
<tr><th rowspan="2">Method</th><th colspan="3">Unlearning Efficacy</th><th>Utility</th></tr>
<tr><th>VerbMem D<sub>f</sub>(↓)</th><th>KnowMem D<sub>f</sub>(↓)</th><th>PrivLeak (→0)</th><th>KnowMem D<sub>r</sub>(↑)</th></tr>
</thead>
<tbody>
<tr><td>Original</td><td>58.29</td><td>62.93</td><td>-98.71</td><td>54.31</td></tr>
<tr><td>Retrain</td><td>20.75</td><td>33.32</td><td>0.00</td><td>53.79</td></tr>
<tr><td>NPO</td><td><strong>0.00</strong></td><td>19.17</td><td>-204.00</td><td>0.00</td></tr>
<tr><td>NPO+KL</td><td>0.63</td><td>11.30</td><td>82.21</td><td>10.98</td></tr>
<tr><td>SO-NPO</td><td>0.09</td><td>0.10</td><td>59.07</td><td>0.54</td></tr>
<tr><td>SO-NPO+KL</td><td>10.24</td><td>22.84</td><td>40.32</td><td>26.53</td></tr>
<tr><td>SU</td><td>0.00</td><td>0.00</td><td>47.17</td><td>0.00</td></tr>
<tr><td>SEUL</td><td>0.00</td><td>0.00</td><td><strong>-2.38</strong></td><td>0.00</td></tr>
<tr><td>WTNPO</td><td>0.00</td><td>0.00</td><td>17.22</td><td>0.00</td></tr>
<tr><td>SPAN-NPO</td><td>0.00</td><td>0.00</td><td>13.39</td><td>0.00</td></tr>
<tr><td>SPAN-NPO+KL</td><td>17.62</td><td>26.59</td><td>23.68</td><td>38.37</td></tr>
<tr><td>SPAN-SO-NPO</td><td>16.59</td><td>23.74</td><td>25.73</td><td>27.83</td></tr>
<tr><td><strong>SPAN-SO-NPO+KL</strong></td><td>17.66</td><td>26.59</td><td>22.70</td><td><strong>38.38</strong></td></tr>
</tbody>
</table>`,
      },
      {
        heading: 'Ablation — Self-consistency의 기여 (Table 3)',
        body: 'Token만 사용한 경우와 Span(self-consistency 적용)을 비교한 결과, SO-NPO 기반에서 Token은 MU 0.54, Span은 MU 0.59로 +0.05 향상을 보였습니다. Forget Quality(FQ) 역시 Token의 -10.79에서 Span의 -8.83으로 개선되었으며, 이는 self-consistency가 안정적인 span 식별에 핵심적으로 기여함을 보여줍니다.',
        html: `<table>
<thead>
<tr><th rowspan="2">Method</th><th rowspan="2">Select</th><th colspan="2">ES-ex.</th><th colspan="2">ES-pt.</th><th rowspan="2">MU ↑</th><th rowspan="2">FQ ↑</th></tr>
<tr><th>ret ↑</th><th>unl ↓</th><th>ret ↑</th><th>unl ↓</th></tr>
</thead>
<tbody>
<tr><td rowspan="2">NPO</td><td>Token</td><td>0.50</td><td>0.42</td><td>0.31</td><td>0.25</td><td>0.47</td><td>-11.58</td></tr>
<tr><td>Span</td><td>0.57</td><td>0.48</td><td>0.37</td><td>0.29</td><td><strong>0.51</strong></td><td><strong>-5.11</strong></td></tr>
<tr><td rowspan="2">SO-NPO</td><td>Token</td><td>0.01</td><td>0.02</td><td>0.03</td><td>0.04</td><td>0.54</td><td>-10.79</td></tr>
<tr><td>Span</td><td>0.02</td><td>0.02</td><td>0.03</td><td>0.03</td><td><strong>0.59</strong></td><td><strong>-8.83</strong></td></tr>
</tbody>
</table>`,
      },
      {
        heading: '핵심 기여',
        body: '본 연구의 주요 기여는 다음과 같습니다. 첫째, 외부 모델이나 주석 없이 대상 모델의 내부 신호만으로 언러닝 대상을 식별하는 model-intrinsic 방식을 제안했습니다. 둘째, differential gradient와 self-consistency를 결합한 2단계 프레임워크를 설계하여 GA, NPO, SO-NPO 등 기존 알고리즘과 범용적으로 결합할 수 있도록 했습니다. 셋째, TOFU와 MUSE 두 벤치마크에서 언러닝 성능을 유지하면서 유틸리티 보존을 크게 향상시켰습니다.',
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
    slug: 'heritage-monitoring',
    title: '국가 유산 모니터링 시스템',
    subtitle: '기후변화 대응 보존관리를 위한 AI 기반 앱',
    description:
      '기후변화에 따른 국가 유산 훼손을 예방하기 위해, DETR 모델을 사용한 심층학습 기반 손상현상 다중분류 모델을 구축.',
    tags: ['DETR', 'Object Detection', 'Mobile App', 'Deep Learning'],
    category: 'AI 기반 앱 개발',
    thumbnail: '/projects/heritage-2.jpeg',
    sections: [
      {
        heading: '프로젝트 개요',
        body: '기후변화에 따른 국가 유산 훼손을 예방하기 위해, AI 기반 손상 탐지 기능을 포함한 국가 유산 모니터링 시스템을 개발했습니다. DETR 모델을 사용하여 심층학습 기반 손상현상 다중분류 모델을 구축했습니다.',
      },
      {
        heading: '모바일 앱 UI',
        body: '현장 조사 데이터를 실시간으로 관리하는 모바일·웹 모니터링 앱을 개발했습니다. 로그인, 현장 조사, 메타데이터 관리, 사진 촬영, 위치 기록, 손상부 조사 등의 기능을 포함한 체계적인 조사 워크플로우를 구현했습니다.',
        images: [
          { src: '/projects/heritage-0.jpeg', caption: '국가유산 모니터링 앱 — 로그인 및 조사 등록 화면' },
          { src: '/projects/heritage-2.jpeg', caption: '현장 조사 화면 — 기본정보, 메타, 위치, 사진 촬영 및 손상부 조사' },
        ],
      },
      {
        heading: 'AI 손상 자동 탐지',
        body: 'AI 기반 이미지 분석 모델을 활용한 손상 자동 탐지 기능을 구현했습니다. 8개의 손상 클래스(갈람, 균열, 압괴/터짐, 부후, 박락, 탈락, 충해)로 학습하고 평가를 수행했습니다. 성능 평가 지표 mAP(Mean Average Precision) 0.615를 달성했으며, mAP는 여러 객체 클래스에 대한 평균 정확도를 종합한 지표입니다.',
        images: [
          { src: '/projects/heritage-1.jpeg', caption: '손상 자동 탐지 갤럽 예시 — AI가 이미지에서 손상 부위를 자동으로 감지' },
          { src: '/projects/heritage-3.png', caption: '검증데이터셋에 대한 실험결과 — mAP 0.615 달성' },
        ],
      },
    ],
    techStack: ['Python', 'PyTorch', 'DETR', 'React', 'React Native', 'FastAPI'],
  },
]
