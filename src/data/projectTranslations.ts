export type ProjectLocale = 'ko' | 'en'

export interface LocalizedProjectImageTranslation {
  src?: string
  caption?: string
}

export interface LocalizedProjectSectionTranslation {
  heading?: string
  body?: string
  html?: string
  images?: LocalizedProjectImageTranslation[]
}

export interface LocalizedProjectTranslation {
  subtitle?: string
  description?: string
  paper?: string
  paperTitle?: string
  sections?: LocalizedProjectSectionTranslation[]
}

export const projectTitleEnglishGlossary: Record<string, string> = {
  memorization: 'LLM Memorization Measurement Study',
  'qa-unlearning': 'Large Language Model Unlearning based on Question Answering',
  'heritage-monitoring': 'National Heritage Monitoring System',
  'moral-agent': 'PERSONA.I. — AI Ethics Conversational Education System',
}

export const projectTranslations: Record<string, Partial<Record<ProjectLocale, LocalizedProjectTranslation>>> = {
  'curriculum-graph': {
    ko: {
      subtitle: 'LLM 추론을 활용한 그래프 기반 융합 교육과정 생성',
      description: '학과별 교육과정의 선수 관계와 LLM 추론을 활용해 자기설계전공 학생을 위한 개인화된 융합 교육과정을 생성하는 커리큘럼 설계 방법.',
      sections: [
        {
          heading: '문제 정의',
          body: `자기설계전공(independent major, individualized studies major)은 기존 학과 중심 교육과정만으로는 학업 목표를 달성하기 어려운 학생들을 위한 제도입니다. 학생은 자신의 학습 목표에 맞는 맞춤형 융합 교육과정을 직접 설계해야 합니다.

하지만 이러한 교육과정 설계에는 여러 어려움이 있습니다. 첫째, 여러 학문 분야의 과목을 함께 구성할 때 선수 관계를 파악하기가 어렵습니다. 둘째, 학생의 학습 목표와 맞는 과목을 찾고 이를 하나의 일관된 교육과정으로 묶어내는 데 많은 시간과 노력이 듭니다. 셋째, 학생의 목표 자체가 처음에는 모호하거나 지나치게 넓고, 학문 간 연결성이 부족한 경우가 많아 잘 짜인 교육과정을 설계하기가 어렵습니다.`,
        },
        {
          heading: '제안 방법 — 3단계 파이프라인',
          body: `제안 방법은 세 단계로 구성됩니다.

1단계(학습 목표 구체화): 학생의 모호한 학습 목표를 LLM의 Chain-of-Thought 추론으로 더 구체적이고 명확한 형태로 정제합니다. 예를 들어 "AI와 반도체를 결합한 전문가가 되고 싶다"는 목표를 "회로 설계와 딥러닝 하드웨어 최적화를 결합한 AI 반도체 설계 전문성"으로 구체화합니다.

2단계(교육과정 부분 그래프 추출): 정제된 목표를 바탕으로 관련 학과를 검색하고, 각 학과의 교육과정 Directed Acyclic Graph(DAG)에서 핵심 과목과 선수 관계를 추출합니다.

3단계(교육과정 그래프 구성 및 변환): 여러 학과에서 추출한 부분 그래프를 하나의 융합 교육과정 그래프로 통합합니다. LLM은 정제된 목표와 과목 설명을 바탕으로 학과 간 선수 관계를 추론해 최종 교육과정을 완성합니다.`,
          images: [
            {
              caption: '그림 1. 제안한 교육과정 설계 방법 개요 — 학습 목표 구체화 → 교육과정 부분 그래프 추출 → 교육과정 그래프 구성 및 변환',
            },
          ],
        },
        {
          heading: '교육과정 추천 그래프',
          body: `교육과정 추천 그래프는 시스템의 핵심 구성요소로, 과목을 노드로, 선수 관계를 방향 간선으로 표현한 Directed Acyclic Graph(DAG)입니다. 각 학과는 자체 교육과정 그래프를 가지며, 간선은 과목 간 선수 의존성을 나타냅니다.

그래프 구성 파이프라인은 세 단계로 동작합니다. 첫째, FAISS 기반 벡터 검색을 통해 OpenAI의 text-embedding-3-small 모델로 각 학과에서 의미적으로 관련된 과목을 검색합니다. LLM은 학생의 정제된 학습 목표를 더 풍부한 질의로 확장해 검색 범위를 넓힙니다. 둘째, 재귀적인 과목 선택 알고리즘이 선수 그래프를 순회하며 교육과정당 최대 28개 과목을 선택하되, 어떤 과목도 선수 과목 없이 포함되지 않도록 의존성을 엄격히 지킵니다. 셋째, 학과 간 선수 관계는 LLM이 추론합니다. 정제된 목표와 서로 다른 학과의 두 과목 설명이 주어지면, 두 과목 사이에 방향성 있는 관계를 둘지 판단합니다.

최종 그래프는 NetworkX와 Matplotlib로 시각화되며, 학기별 레이아웃(학기당 최대 6과목)을 사용해 기초 과목에서 심화 과목으로 자연스럽게 이어지는 구조를 보여줍니다. 이를 통해 학생은 어떤 과목을 수강해야 하는지뿐 아니라, 어떤 순서로 듣는 것이 적절한지와 각 과목이 포함된 이유까지 함께 이해할 수 있습니다.`,
        },
        {
          heading: '실험 결과',
          body: `평가는 두 가지 정량 지표로 수행했습니다. F1_course는 구성된 교육과정의 과목 집합이 정답 교육과정과 얼마나 잘 일치하는지를, F1_prerequisite는 선수 관계를 얼마나 정확하게 포착하는지를 측정합니다.

제안 방법은 F1_course 41.03, F1_prerequisite 23.16을 기록해 TF-IDF 기반 기준선(15.60, 1.01)과 텍스트 임베딩 기반 방법(32.56, 4.96)을 크게 앞섰습니다. 특히 F1_prerequisite가 기준선의 1~6 수준에서 23.16으로 크게 향상된 점은, 융합 교육과정에서 선수 관계를 정확히 식별하는 데 LLM 추론이 핵심적임을 보여줍니다.

교수 2명과 교육과정 설계 컨설턴트 3명으로 구성된 5명의 평가자가 수행한 정성 평가에서도, 제안 방법은 Consistency 3.47, Interdisciplinarity 3.53, Coherence 3.60, Essentiality 3.00으로 모든 기준선보다 우수한 성능을 보였습니다.`,
          html: `<table>
<thead>
<tr><th>방법</th><th>F1<sub>course</sub> ↑</th><th>F1<sub>prerequisite</sub> ↑</th></tr>
</thead>
<tbody>
<tr><td>TF-IDF</td><td>15.60</td><td>1.01</td></tr>
<tr><td>TF-IDF + 목표 구체화</td><td>19.51</td><td>2.13</td></tr>
<tr><td>텍스트 임베딩</td><td>32.56</td><td>4.96</td></tr>
<tr><td>텍스트 임베딩 + 목표 구체화</td><td>33.63</td><td>5.94</td></tr>
<tr><td><strong>제안 방법</strong></td><td><strong>41.03</strong></td><td><strong>23.16</strong></td></tr>
</tbody>
</table>`,
        },
        {
          heading: '핵심 기여',
          body: `본 연구의 핵심 기여는 세 가지입니다. 첫째, LLM의 Chain-of-Thought를 활용한 추론 기반 학습 목표 구체화를 도입해 모호한 목표를 구체적인 학습 목표로 바꾸고 교육과정 설계 품질을 높였습니다. 둘째, 학과별 교육과정 DAG를 활용한 선수 관계 인지형 부분 그래프 추출 방법을 제안했습니다. 셋째, 여러 학과의 교육과정을 하나로 통합하기 위해 LLM이 학과 간 과목 관계를 추론하는 그래프 구성 방식을 설계했습니다.

이 연구는 "Curriculum Planning for Independent Majors with Large Language Models"라는 제목으로 AIED 2025에 공동 제1저자로 게재되었습니다.`,
        },
      ],
    },
    en: {
      subtitle: 'Graph-Based Interdisciplinary Curriculum Generation via LLM Reasoning',
      description: 'A curriculum planning method that leverages prerequisite relationships in department-specific curricula and LLM reasoning to generate personalized interdisciplinary curricula for independent major students.',
      sections: [
        {
          heading: '1. Problem Definition — Designing Personalized Interdisciplinary Curricula',
          body: `Independent major programs allow students to design customized interdisciplinary studies when their goals fall outside standard departmental offerings. However, curriculum design presents three critical challenges.

First, prerequisite dependencies span multiple disciplines and are difficult to identify automatically. Most curriculum data exists as isolated departmental DAGs with no explicit cross-departmental relationships. Second, students often start with vague, overly broad objectives like "I want to combine AI and semiconductors" without concrete direction on how to structure their coursework. Third, even when students and advisors identify relevant courses, manually arranging them into a logical progression while ensuring all prerequisites are satisfied is time-consuming and error-prone.

This work asks: "Can we leverage LLM reasoning to help students refine their vague objectives, automatically extract relevant courses across disciplines, and intelligently infer prerequisite relationships between interdisciplinary courses?"`,
        },
        {
          heading: '2. Why This Approach — Hypothesis and Design Rationale',
          body: `Recent work on LLM reasoning (Wei et al. 2022, Kojima et al. 2023) shows that Chain-of-Thought prompting can decompose complex tasks into step-by-step reasoning. We hypothesized that LLMs could apply similar reasoning to curriculum design: breaking down vague student objectives into concrete learning goals, retrieving semantically relevant courses, and inferring implicit prerequisite relationships.

Three design decisions emerged from this hypothesis. First, learning objective refinement via Chain-of-Thought transforms "I want to combine AI and semiconductors" into concrete, structured goals like "AI semiconductor design expertise combining circuit design and deep learning hardware optimization." This refinement guides all downstream steps. Second, curriculum subgraph extraction leverages existing departmental curriculum DAGs (which already encode prerequisites within departments) rather than learning from scratch. Third, inter-department prerequisite inference uses the LLM to reason about course descriptions and the refined objective, determining whether courses from different departments should have prerequisite relationships — a task that requires semantic understanding beyond keyword matching.`,
          images: [
            { src: '/projects/jbnu-0.png', caption: 'Figure 1. Three-stage curriculum planning pipeline — Learning Objective Refinement via CoT → Curriculum Subgraph Extraction from departmental DAGs → Interdisciplinary Graph Construction with LLM-inferred prerequisite edges' },
          ],
        },
        {
          heading: '3. Challenges During Project Development',
          body: `Learning objective refinement quality was the first challenge. We found that simple few-shot prompting sometimes generated refinements that were too narrow (e.g., eliminating valid alternative paths) or too broad (remaining vague). We designed a multi-turn refinement process where the LLM iteratively asks clarifying questions and integrates student feedback.

Course retrieval accuracy was another concern. A FAISS vector search using raw course descriptions was sometimes imprecise, missing relevant courses or including false positives. To address this, we had the LLM expand the refined objective into multiple search queries, each targeting different aspects (e.g., one query for "AI systems design", another for "semiconductor physics"), then merged results to improve coverage.

Inferring inter-department prerequisites proved unexpectedly difficult. Two courses from different departments might have a prerequisite relationship based on conceptual dependencies, but this relationship is rarely explicit. We addressed this by providing the LLM with course descriptions, syllabi summaries, and the refined student objective, then having the LLM explicitly reason about whether one course's concepts are prerequisites for another.

Finally, we struggled with graph layout and visualization. A naive topological sort sometimes produced nonsensical semester assignments. We developed a constraint satisfaction approach that respects prerequisites while balancing workload (≤6 courses per semester) and spreading foundational to advanced courses logically.`,
        },
        {
          heading: '4. Experimental Results',
          body: `We evaluated on two quantitative metrics: F1_course (how well selected courses match a gold curriculum) and F1_prerequisite (how accurately inferred prerequisite relationships match ground truth).

The proposed method achieved F1_course 41.03 and F1_prerequisite 23.16, vastly outperforming baselines. TF-IDF (15.60, 1.01) and text embeddings without LLM refinement (32.56, 4.96) showed that vector similarity alone is insufficient for prerequisite inference. Notably, F1_prerequisite improved from ~1–6 for baselines to 23.16 for our method, demonstrating that LLM reasoning is essential for cross-departmental prerequisites.

Qualitative evaluation by five domain experts (2 faculty, 3 curriculum consultants) rated the proposed method highest across all dimensions: Consistency 3.47/5, Interdisciplinarity 3.53/5, Coherence 3.60/5, Essentiality 3.00/5. Experts noted that the method's ability to infer non-obvious interdisciplinary prerequisites was particularly valuable.`,
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
          body: `This work makes four key contributions. First, we show that LLM Chain-of-Thought reasoning can refine vague student learning objectives into concrete, actionable curriculum targets. This refinement step, often overlooked in prior work, is essential for high-quality downstream curriculum generation.

Second, we demonstrate that leveraging existing departmental curriculum DAGs is more effective than learning prerequisites from scratch. By anchoring to institutional curriculum structures, our method ensures prerequisite relationships within departments are sound.

Third, we propose a practical method for inferring inter-department prerequisites through LLM reasoning. This enables truly interdisciplinary curriculum design at scale, something previous methods could not achieve.

Finally, we validate our approach through both quantitative metrics (F1 scores) and qualitative expert evaluation. The stark improvement in F1_prerequisite over baselines (23.16 vs. 5.94 for the strongest baseline) demonstrates that semantic reasoning is irreplaceable for capturing implicit prerequisites in interdisciplinary curricula.

This work was published at AIED 2025 with co-first authorship and has already informed curriculum design practices at the hosting institution.`,
        },
      ],
    },
  },
  aacsum: {
    en: {
      subtitle: 'Aspect-Level Comparative Summarization with LLMs Beyond the Limits of Prior Comparative Summaries',
      description: 'This work defines AACSum, the first abstractive aspect-based comparative summarization task that generates both contrastive and common summaries for fine-grained aspects in online reviews, and proposes a pipeline based on goal-driven clustering and aspect merging, published at WWW 2025.',
      sections: [
        {
          heading: '1. Problem Definition — Limits of Prior Comparative Summarization',
          body: `Online reviews are massive, making it difficult to understand both the differences and similarities between two products or services.

Prior comparative summarization had three major limitations. First, extractive methods simply copied review sentences and therefore produced incomplete summaries. Second, they focused only on contrastive summaries and did not provide common summaries. Third, they did not support aspect-based comparisons, so comparisons from concrete viewpoints such as "Staff" or "Price" were not possible.

This work is the first to define a comparative summarization task that simultaneously satisfies the four properties of being abstractive, aspect-based, contrastive, and common.`,
          images: [
            {
              caption: 'Figure 1. Example of Abstractive Aspect-Based Comparative Summarization: generating both contrastive and common summaries for aspects such as Staff, Parking, and Price from reviews of two hotels',
            },
          ],
        },
        {
          heading: '2. Why This Approach — Hypothesis and Design Rationale',
          body: `We began with the hypothesis that aspect-specific comparative summarization datasets could be induced from existing opinion summarization datasets such as CoCoTrip and AmaSUM by automatically identifying aspects with LLM few-shot prompting.

Based on that hypothesis, we made three design decisions. First, we used goal-driven clustering instead of simple topic modeling so that aspect discovery would produce semantically coherent aspect groups. Second, we used aspect merging to combine semantically similar aspects from different entities through hierarchical clustering, for example "service quality" and "customer service efficiency." Third, we applied LLM-based abstractive summarization so that merged aspects would yield common summaries, while unmerged aspects would produce contrastive summaries.`,
          images: [
            {
              caption: 'Figure 2. Overall pipeline of the proposed method — Review Set → Aspect Generation & Review Assignment → Aspect Merging → Comparative Summary Generation',
            },
          ],
        },
        {
          heading: '3. Challenges and Design Decisions During the Project',
          body: `Dataset construction was the hardest part. Because no benchmark existed for aspect-based comparative summarization, we had to transform existing datasets and then validate and filter the results with two human annotators.

Designing the evaluation protocol was also difficult. Reference aspects and generated aspects often did not have a one-to-one correspondence, for example "Staff service" versus "Hotel staff," so we designed a cosine-similarity-based best-match aspect alignment strategy.

We also had to address granularity mismatches such as "service quality" at a coarse level and "customer service efficiency" at a finer level. We explored suitable merge levels by tuning the threshold of hierarchical clustering. Since no prior model generated both contrastive and common summaries simultaneously, we designed a unified pipeline that could produce both types together.`,
        },
        {
          heading: '4. Datasets and Results',
          body: `We built two benchmark datasets. CoCoCom contains 48 hotel-review pairs with an average of 7.80 reviews and 7.75 aspects, while AmaCom contains 646 Amazon product-review pairs with an average of 77.78 reviews and 11.56 aspects across three categories.`,
        },
        {
          heading: '4-1. Automatic Evaluation Results (Table 3)',
          body: `We evaluated the outputs using four metrics: aspect correctness, lexical overlap, factuality, and contrastiveness. On CoCoCom, the proposed method achieved Asp. 29.93% and CASPR 97.22, outperforming all baselines. On AmaCom, it also showed strong overall performance with Asp. 24.27% and CASPR 95.74.

Existing methods such as CoCoSUM-LLM and STRUM-LLM were extractive and therefore weak in factuality, while GPT-4o-mini struggled to generate sufficiently contrastive summaries. In contrast, the proposed method effectively identified aspects suitable for comparison during aspect generation and merging, achieving the best performance in both contrastiveness and aspect accuracy.`,
        },
        {
          heading: '4-2. Human Evaluation Results (Table 4)',
          body: `Three evaluators conducted human evaluation using five criteria on a 1 to 5 scale. The proposed method achieved the best score on every metric, recording 3.48 for Content Overlap, 3.66 for Content Support, 3.69 for Relevance, 3.57 for Informativeness, and 3.72 for Redundancy.`,
        },
        {
          heading: '4-3. Key Insights and Contributions',
          body: `This work makes three main contributions. First, it is the first to define an abstractive, aspect-based comparative summarization task and to build benchmark datasets for it, namely CoCoCom and AmaCom. Second, it demonstrates the effectiveness of a pipeline that combines aspect discovery via goal-driven clustering with aspect merging via hierarchical clustering, while also allowing entity-wise offline preprocessing. Third, it outperforms existing baselines in both automatic and human evaluation, showing that a relatively simple LLM-based pipeline can solve a complex comparative summarization task.

This work was published in the ACM WWW 2025 Companion Proceedings as a short paper.`,
        },
      ],
    },
  },
  memorization: {
    en: {
      subtitle: 'Near-Duplicate Generation-Based Gradient Alignment Metric Design and Hybrid Unlearning',
      description: 'To quantify how strongly large language models memorize their training data, this work proposes a new memorization metric called PGA based on near-duplicate generation and gradient alignment, and then uses it to build a hybrid unlearning strategy.',
      paper: `KSC 2025 · Master's Thesis`,
      paperTitle: 'Measuring Memorization in Large Language Models through Paraphrase Generation',
      sections: [
        {
          heading: 'Problem Definition — Limits of Existing Memorization Measurement',
          body: `LLMs can memorize training data and reproduce it verbatim, which raises risks such as privacy leakage and copyright infringement.

Membership Inference Attack (MIA) only makes a binary decision about whether a sample was in the training set, so it is difficult to quantify the "strength" of memorization. Influence Functions are impractical for LLMs because they require Hessian inverse computation and multiple checkpoints. TracIn is based on gradient inner products, but it also requires multiple checkpoints and still cannot measure absolute memorization strength for an individual sample.

We therefore needed a method that could measure the absolute memorization strength of each sample from a single checkpoint.`,
          html: `<table>
<thead><tr><th>Approach</th><th>What It Measures</th><th>Limitation</th></tr></thead>
<tbody>
<tr><td>MIA (Membership Inference Attack)</td><td>Binary membership prediction</td><td>Difficult to quantify memorization strength directly</td></tr>
<tr><td>Influence Function</td><td>Impact on model parameters</td><td>Expensive Hessian inverse computation and multiple checkpoints required</td></tr>
<tr><td>TracIn</td><td>Gradient inner-product influence</td><td>Requires multiple training checkpoints and cannot provide absolute strength per sample</td></tr>
<tr><td><strong>Ours (PGA)</strong></td><td><strong>Absolute memorization strength via gradient alignment</strong></td><td><strong>Absolute measurement from a single checkpoint</strong></td></tr>
</tbody>
</table>`,
        },
        {
          heading: 'Why This Approach — Hypothesis and Design Rationale',
          body: `We started from the observation that if a model has strongly memorized a particular sample, it should show a consistent gradient response even across multiple semantically equivalent expressions of that sample.

Based on this idea, we hypothesized that memorization strength could be quantified by generating near-duplicate samples similar to the original sentence and measuring gradient similarity. Concretely, for an original sentence x, we generate N near-duplicates, compute directional similarity with the inner product between the gradient vector g(x) and each g(x'ᵢ), and average them to obtain M(x) = (1/N) Σ⟨g(x), g(x'ᵢ)⟩.

When M(x) is high, the original sentence and its near-duplicates produce gradients in the same direction, which indicates strong memorization. The main advantage is that we can directly measure the absolute memorization strength of an individual sample without comparing it to other samples.`,
          images: [
            {
              caption: 'Overview of the PGA metric: original sentence → near-duplicate generation with an LLM → memorization score from gradient alignment',
            },
          ],
        },
        {
          heading: 'Challenges and Design Decisions During the Project',
          body: `Controlling the quality of near-duplicates was the biggest challenge. Ordinary paraphrases often changed sentence structure and length too much, so we designed a specialized prompt that preserved syntactic structure while only changing vocabulary.

Gradient computation efficiency was another issue. Computing gradients for all LLM parameters was too expensive, so we improved efficiency by using only the gradients from the final layer.

We also did not have a ground-truth binary label for whether a sample was memorized, so following prior work we adopted an MIA-style setting in which training data are treated as members, test data as non-members, and AUROC is used for evaluation.

Interpreting domain-specific performance differences also required care. The method worked very well on DM Mathematics but only weakly on Wikipedia, so we had to analyze whether this reflected a limitation of the metric or a real difference in memorization behavior across domains.`,
        },
        {
          heading: 'Experimental Setup',
          body: `We evaluated Pythia models at four scales, 160M, 1.4B, 2.8B, and 6.9B, on four domains from The Pile: HackerNews, DM Mathematics, Pile CC, and Wikipedia. We compared against Min-K%++ and Hessian-free baselines and used AUROC with members as training data and non-members as test data.`,
        },
        {
          heading: 'Experimental Results (Table 1)',
          body: `Min-K%++ and Hessian-free stayed around AUROC 50 to 53 in most domains, essentially failing to separate memorization signals from random chance.

In contrast, the proposed PGA method reached 80.4% AUROC on DM Mathematics for the 160M model and 78.9% even for the 6.9B model, substantially outperforming prior methods. DM Mathematics contains repeated formula structures and numeric combinations, so models tend to learn it through memorization rather than generalization.

On HackerNews, Pile CC, and Wikipedia, AUROC stayed around 50 to 52. In domains with relatively consistent writing styles, both training and test samples produced similar gradient alignment, making it difficult to distinguish members from non-members. This suggests that structurally repetitive domains are dominated by true memorization, whereas more diverse narrative domains are dominated by pattern-level generalization.`,
        },
        {
          heading: 'Extension to Hybrid Unlearning',
          body: `After measuring memorization strength with PGA, we proposed a hybrid unlearning strategy that classifies data by memorization strength. Samples with strong memorization and high PGA receive aggressive unlearning such as gradient ascent, while weakly memorized samples receive lighter unlearning so that utility can be preserved as much as possible.

On TOFU and MUSE, this strategy achieved both stronger unlearning and better utility preservation than prior methods.`,
          images: [
            {
              caption: 'Hybrid unlearning framework: measure memorization strength with PGA, then apply different unlearning strategies to strongly and weakly memorized data',
            },
          ],
        },
        {
          heading: 'Key Insights and Contributions',
          body: `This work makes three main contributions. First, unlike MIA, which only performs binary prediction, and Influence Functions, which are computationally expensive, PGA measures absolute memorization strength from a single checkpoint. Second, it empirically reveals that memorization patterns differ by domain: structurally repetitive domains are dominated by memorization, while domains with diverse narration are dominated by generalization. Third, it provides an important criterion for distinguishing memorization from generalization.

This work was compiled into the master's thesis "Memorization-Based Unlearning in Large Language Models" and was also presented at KSC 2025.`,
        },
      ],
    },
  },
  'qa-unlearning': {
    en: {
      subtitle: 'Iterative LLM Unlearning Combining Triplet-Based QA Expansion with Membership Inference Filtering',
      description: 'This work proposes an LLM unlearning method that generates QA data from Wikipedia-based triplets (entity, attribute, value), filters training data using Min-K% membership inference, and performs gradient ascent-based unlearning, achieving 26% lower Rouge-L and 32% lower Accuracy compared to the baseline. Published at KCC 2024.',
      paper: 'KCC 2024',
      paperTitle: 'Large Language Model Unlearning based on Question Answering',
      sections: [
        {
          heading: '1. Problem Definition — How to Delete Knowledge Learned by LLMs',
          body: `Large Language Models (LLMs) achieve strong performance across NLP tasks, but they can reproduce personal information and copyrighted content from their training data. With regulations like the EU's GDPR and the Right to be Forgotten, selectively deleting specific knowledge from already-trained models — "machine unlearning" — has become an essential challenge.

Existing unlearning methods had two key limitations. First, simply applying gradient ascent on the given text leaves various expressions of the same knowledge intact in the model, making complete deletion difficult. Second, including non-training data in the unlearning set can degrade the model's general capabilities.

This work starts from the question: "Can we delete knowledge more effectively by expanding it into diverse QA forms and selectively unlearning only the data actually learned by the model?"`,
        },
        {
          heading: '2. Why This Approach — Hypothesis and Design Rationale',
          body: `LLMs encode a single piece of knowledge through diverse contexts and expressions. For example, "Seoul has a population of about 9.7 million" is encoded via questions like "What is Seoul's population?" or "What is the most populated city in South Korea?" Deleting only the original text is therefore insufficient.

From this observation, three key design decisions were made. First, triplet-based data expansion: we extract (entity, attribute, value) triplets from target sentences, then use GPT-4 Turbo to generate multiple QA pairs from each triplet, covering diverse expressions of the knowledge. Second, Min-K% membership inference filtering: among the generated QA data, only samples the model actually learned are selected, preventing unnecessary knowledge loss. Third, iterative unlearning process: after each unlearning round, MIA is re-applied to detect remaining learned data, and additional unlearning rounds are performed.`,
          images: [
            { src: '/projects/qa-unlearning-0.png', caption: 'Figure 1. QA-based LLM Unlearning Pipeline — Triple extraction from Wikipedia data → QA data expansion via GPT-4 Turbo → Min-K% membership inference filtering → Iterative gradient ascent unlearning' },
          ],
        },
        {
          heading: '3. Challenges and Considerations During the Project',
          body: `Quality control for triplet extraction was the first challenge. When automatically extracting (entity, attribute, value) triplets from Wikipedia sentences, incomplete or inaccurate triplets significantly degraded the quality of subsequent QA data. We iteratively refined the extraction prompts to improve accuracy.

Balancing diversity and accuracy during QA expansion was also difficult. When generating QA pairs with GPT-4 Turbo, overly diverse generation included questions unrelated to the original knowledge, while overly conservative generation produced minimal expansion effect. We designed structured prompts utilizing each element of the triplet to resolve this.

Setting the membership inference threshold was another concern. The choice of K value (20%) for Min-K% and the membership decision threshold (TPR@5%FPR) significantly affected filtering results — too strict and the unlearning set became insufficient, too lenient and non-training data was included, degrading model utility.`,
        },
        {
          heading: '4. Experimental Data and Results',
          body: `Experiments used the WikiMIA dataset, which assumes most LLMs were trained on data up to 2023 — pre-2023 data serves as the forget set, while post-2023 data is treated as unseen. Triplets were extracted from the forget set, and GPT-4 was used to generate expanded QA data. The validation dataset was constructed by restructuring the generated QA data with GPT-4, and the evaluation dataset was built by generating QA pairs from entities' Wikipedia articles using the T5 model. Unlearning was performed on Llama-7B with LoRA-Tuning.

Rouge-L and Accuracy were used as evaluation metrics, where lower scores indicate the model fails to reproduce target knowledge — meaning more effective unlearning. The baseline applied gradient ascent without data expansion.

The proposed method achieved Rouge-L 0.14 and Accuracy 0.26, showing additional reductions of 0.05 in Rouge-L and 0.12 in Accuracy compared to the baseline (Rouge-L 0.19, Accuracy 0.38). As the number of iterations increased, both metrics decreased sharply, confirming that repeated detection-unlearning cycles progressively improve effectiveness.`,
          images: [
            { src: '/projects/qa-unlearning-1.png', caption: 'Figure 2. Rouge-L and Accuracy changes per iteration — Both metrics decrease sharply with more iterations, confirming progressively effective unlearning' },
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
          heading: '4-1. Key Insights and Contributions',
          body: `The main contributions of this work are as follows. First, we proposed triplet-based QA data expansion as a novel approach to unlearning data generation, overcoming the limitations of simple text-based unlearning. By expanding triplets extracted from a single sentence into multiple QA pairs, we achieved comprehensive deletion of diverse knowledge representations.

Second, integrating membership inference (Min-K%) into the unlearning pipeline enabled selective unlearning of only the actually-learned data, minimizing utility degradation. Third, we experimentally demonstrated the effectiveness of the iterative detect-unlearn structure, confirming progressive unlearning performance improvement with increasing iteration counts.

This work was published at KCC 2024 and was later extended to memorization measurement and hybrid unlearning in a master's thesis.`,
        },
      ],
    },
  },
  'span-unlearning': {
    ko: {
      subtitle: '모델 내재적 Span 식별을 통한 선택적 LLM 언러닝',
      description: '외부 모델 없이 대상 모델의 gradient 신호만으로 언러닝 대상 span을 식별하는 2단계 프레임워크를 제안합니다.',
      sections: [
        {
          heading: '1. 문제 정의 — 외부 모델 없는 선택적 언러닝',
          body: `머신 언러닝은 LLM이 특정 학습 데이터(개인정보, 저작권 콘텐츠 등)를 "잊도록" 요구합니다. 하지만 기존 언러닝 방법은 근본적인 트레이드오프를 가지고 있습니다.

전체 시퀀스 언러닝(예: 전체 문서에 대한 그래디언트 상승)은 무분별하게 대상 정보를 제거하면서 같은 시퀀스에 포함된 유용한 정보도 함께 삭제하여 모델 유틸리티를 심각하게 저하시킵니다. 최근의 선택적 언러닝 방법들(SU, SEUL, WTNPO)은 토큰이나 span 수준에서 대상을 식별하려 시도하지만, 외부 모델(GPT, BERT)에 의존합니다. 이는 근본적인 문제를 야기합니다. 외부 모델로 식별된 대상 span이 실제 대상 모델이 기억하거나 중요하게 여기는 내용과 일치하지 않을 수 있기 때문입니다.

본 연구는 중심 질문을 던집니다: "대상 모델의 내부 신호만으로, 외부 감독 없이 언러닝 대상을 식별할 수 있는가?"`,
          images: [
            {
              caption: '그림 1. 토큰 vs Span 수준의 언러닝 — 토큰 수준 삭제는 부분 정보 복구 가능, span 수준 교체는 완전한 언러닝 달성',
            },
          ],
        },
        {
          heading: '2. 왜 이 접근 방법인가 — 가설과 설계 근거',
          body: `핵심 관찰에서 출발합니다: 삭제 대상 세트(forget set)와 유지할 데이터 세트(retain set)는 모델의 그래디언트를 반대 방향으로 끌어당깁니다. 삭제 대상 정보를 인코딩하는 토큰은 삭제 목표에 강하게 정렬되면서 유지 목표와는 미정렬되는 gradient를 보이며, 이는 대상 모델 자체에 내재된 성질입니다.

우리의 가설: differential gradient(삭제 gradient − 유지 gradient)를 계산하고 이 미분 방향에 가장 높은 정렬을 보이는 토큰을 식별하면, 외부 모델 없이 모델이 "삭제 가능"하다고 판단하는 정보를 식별할 수 있습니다.

이로부터 두 가지 설계 결정이 나옵니다. 첫째, differential gradient alignment를 사용한 토큰 수준의 중요도 추정입니다(EK-FAC이라는 효율적인 역 Hessian 근사를 사용). 이는 대상 모델의 gradient 신호만 필요하며 외부 감독이 필요 없습니다. 둘째, self-consistency를 통한 span 식별입니다: 토큰만으로는 원자적 중요도를 식별하지만, 의미론적으로 일관된 span을 위해서는 안정성이 필요합니다. K번의 독립적 모델 생성에서 후보 span을 수집하고, 일관되게 나타나는 span만 선택하여 모델 자체가 이 span들을 안정적인 언러닝 대상으로 "동의"하는지 확인합니다.`,
          images: [
            {
              caption: '그림 2. 2단계 프레임워크 — Differential gradient로 중요 토큰 식별 → Self-consistency로 안정적 span 필터링 → 모델 내재적 span-weighted 언러닝 수행',
            },
          ],
        },
        {
          heading: '3. 프로젝트 과정에서의 어려움과 고민',
          body: `Differential gradient의 효율적 계산이 첫 번째 도전이었습니다. 전체 Hessian 역행렬(gradient alignment 가중치에 필요)은 O(n³) 복잡도로, LLM에서는 금지적으로 비쌉니다. 우리는 행렬 없는 효율적 근사인 EK-FAC(Eigenvalue-corrected KFAC)을 채택했으며, 이는 forward/backward 패스만 필요합니다.

안정적인 span 식별은 실제로 까다로웠습니다. 단순한 토큰 중요도 임계값 처리는 때로 비연속적이거나 의미론적으로 단편화된 span을 선택했습니다. Self-consistency 필터링이 도움이 되었지만, K(생성 횟수)를 신중하게 조정해야 함을 발견했습니다. K가 너무 낮으면 노이즈가 지배적이고, 너무 높으면 계산 비용이 폭증합니다. 모델 크기에 따라 K=5–10으로 정했습니다.

언러닝 효과와 유틸리티 보존 간의 트레이드오프 조정은 고통스러웠습니다. 다양한 언러닝 알고리즘(GA, NPO, SO-NPO)은 각기 다른 유틸리티-삭제 트레이드오프를 가지며, 우리의 span 선택은 각각과 다르게 상호작용합니다. (모델, 알고리즘) 쌍마다 consistency 임계값과 중요도 cutoff를 개별적으로 조정해야 했습니다.

마지막으로 평가 지표 설계가 중요했습니다. MIA(멤버십 추론 공격) 같은 표준 언러닝 지표는 span 수준의 삭제를 직접 측정하지 않습니다. 우리는 삭제된 정보가 억압 가능한지를 특별히 테스트하는 새로운 지표(MUSE-News의 VerbMem, KnowMem)를 설계해야 했습니다.`,
        },
        {
          heading: '4. 실험 데이터와 결과',
          body: `TOFU(허구의 저자 생애 정보, forget10 분할)와 MUSE-News(사실 메모라이제이션에 대한 구조화된 ground truth가 있는 실제 뉴스 기사)라는 두 가지 주요 벤치마크에서 평가했습니다.

TOFU에서 SPAN-SO-NPO는 Model Utility(MU) 0.59를 달성하여 모든 베이스라인(SU 0.51, SEUL 0.00, WTNPO 0.45)과 동등하거나 초과했습니다. 순수 SO-NPO만으로는 MU 0.52를 달성했지만 심각한 유틸리티 손실을 입었으며, 우리의 span 방법은 이를 0.59로 개선하면서 언러닝 효과를 유지했습니다.

MUSE-News에서는 그림이 더 명확합니다. 다른 선택적 방법들은 완전히 실패했습니다(VerbMem/KnowMem → 0, 전체 유틸리티 붕괴). SPAN-SO-NPO+KL은 VerbMem 17.66, KnowMem 26.59, PrivLeak 22.70을 달성하고 유틸리티를 38.38/54.31로 유지하여 삭제와 보존의 최고의 균형을 이루었습니다. 정량 평가와 정성 평가에서 모두 기존 베이스라인을 능가하여, LLM 기반 간단한 파이프라인이 복잡한 비교 요약 태스크를 해결할 수 있음을 입증했습니다.`,
        },
        {
          heading: '4-1. 핵심 인사이트와 기여',
          body: `본 연구는 네 가지 핵심 기여를 제시합니다. 첫째, 외부 모델 없는 모델 내재적 span 식별이 가능함을 입증했습니다. 대상 모델의 고유한 gradient 신호를 추론함으로써 모델이 "삭제 가능"하다고 판단하는 정보를 식별할 수 있으며, 이는 식별과 언러닝 알고리즘 간의 밀접한 결합을 만듭니다.

둘째, self-consistency가 토큰 중요도에서 의미론적 단위로 상향하는 원칙적인 방법임을 보였습니다. 정량 평가 결과(표 3) self-consistency가 +0.05 MU 개선을 추가하고 Forget Quality를 크게 향상시켜 실제 span 수준 언러닝에 필수적임을 입증했습니다.

셋째, 여러 언러닝 알고리즘에 걸쳐 일반화하는 프레임워크를 설계했습니다. 우리의 span 식별은 GA, NPO, SO-NPO, KL-variant 방법 등과 작동하여 알고리즘 특정적이 아닌 광범위하게 적용 가능합니다.

마지막으로, 근본적으로 다른 두 데이터셋에서 접근법을 검증했습니다. TOFU(합성, 벤치마크 유사)와 MUSE-News(실제, 자연스러운)는 일관된 개선을 보입니다: MUSE-News에서 38.38/54.31 유틸리티 유지를 달성하면서 강한 언러닝을 유지하며, 이는 다른 선택적 방법들의 근처 0 유틸리티와 대비됩니다. 이는 실제 배포를 위한 span 수준 언러닝의 실용성을 입증합니다.

본 연구는 ACL 2026에 제출되었으며 선택적이고 모델 인식적 머신 언러닝 방향의 중요한 진전을 나타냅니다.`,
        },
      ],
    },
    en: {
      subtitle: 'Selective LLM Unlearning through Model-Intrinsic Span Identification',
      description: `A two-stage framework that identifies spans to unlearn using only the target model's gradient signals, without relying on external models.`,
      sections: [
        {
          heading: '1. Problem Definition — Selective Unlearning with Utility Preservation',
          body: `Machine unlearning requires LLMs to "forget" specific training data (e.g., personal information, copyrighted content). However, traditional unlearning methods face a critical tradeoff: they must choose between deletion effectiveness and model utility.

Conventional full-sequence unlearning (e.g., gradient ascent on entire documents) is indiscriminate — it removes the target information along with any useful context contained in the same sequences, causing severe utility degradation. Recent selective unlearning methods (SU, SEUL, WTNPO) attempt to identify and remove only specific tokens or spans, but they rely on external models (GPT, BERT) to determine what to unlearn. This creates a fundamental problem: the identified target spans may not align with what the target model actually remembers or cares about, since external models operate differently.

This work asks a central question: "Can we identify what to unlearn using only the target model's own internal signals, without external supervision?"`,
          images: [
            {
              caption: 'Figure 1. Token vs. Span-level Unlearning — Token-level deletion leaves partial information recoverable; span-level replacement achieves complete unlearning',
            },
          ],
        },
        {
          heading: '2. Why This Approach — Hypothesis and Design Rationale',
          body: `We start from a simple observation: forget and retain sets pull model gradients in opposite directions. Tokens encoding target information will have gradients strongly aligned with the forget objective but misaligned with the retain objective — a property intrinsic to the target model itself.

Our hypothesis: by computing differential gradients (forget gradient − retain gradient) and identifying tokens with the highest alignment to this differential direction, we can identify information the model deems "forgettable" without external models.

Two design decisions follow from this: First, token-level importance estimation using differential gradient alignment (computed via EK-FAC, an efficient inverse Hessian approximation). This requires only the target model's gradient signals—no external supervision. Second, span identification via self-consistency: tokens alone identify atomic importance, but semantically coherent spans require stability. We collect candidate spans from K independent model generations and keep only those appearing consistently, ensuring the model itself "agrees" these spans are stable units to unlearn.`,
          images: [
            {
              caption: 'Figure 2. Two-stage framework — Differential gradient identifies important tokens → Self-consistency filters stable spans → Model-intrinsic span-weighted unlearning',
            },
          ],
        },
        {
          heading: '3. Challenges During Project Development',
          body: `Computing differential gradients efficiently was the first challenge. Full Hessian inversion (needed for gradient alignment weighting) is O(n³), prohibitively expensive for LLMs. We adopted EK-FAC (Eigenvalue-corrected KFAC), an efficient matrix-free approximation that requires only forward/backward passes.

Identifying stable spans proved tricky in practice. Naive importance thresholding on tokens sometimes selected non-contiguous or semantically fragmented spans. Self-consistency filtering helped, but we discovered that K (number of generations) had to be carefully tuned—too low and noise dominated, too high and computational cost exploded. We settled on K=5–10 depending on model size.

Tradeoff tuning between unlearning efficacy and utility preservation was agonizing. Different unlearning algorithms (GA, NPO, SO-NPO) have different utility-forget tradeoffs, and our span selection interacts differently with each. We had to tune consistency thresholds and importance cutoffs separately per (model, algorithm) pair.

Finally, evaluation metric design was non-trivial. Standard unlearning metrics like MIA (membership inference attack) don't directly measure span-level forgetting. We had to design new metrics (VerbMem, KnowMem from MUSE-News) that specifically test whether unlearned information is suppressable.`,
        },
        {
          heading: '4. Experimental Results',
          body: `We evaluated on two major benchmarks: TOFU (fictional author bios, forget10 split) and MUSE-News (real news articles with structured ground truth about factual memorization).

On TOFU, SPAN-SO-NPO achieved Model Utility (MU) 0.59, matching or exceeding all baselines (SU 0.51, SEUL 0.00, WTNPO 0.45). Standard SO-NPO alone achieved MU 0.52 but suffered severe utility loss; our span method improved this to 0.59 while maintaining unlearning efficacy.

On MUSE-News, the picture is clearer. Other selective methods catastrophically failed (VerbMem/KnowMem → 0, total utility collapse). SPAN-SO-NPO+KL achieved VerbMem 17.66, KnowMem 26.59, PrivLeak 22.70, and retained utility 38.38/54.31—the best balance of forgetting and preservation. Ablation studies confirmed self-consistency is essential: token-only achieved MU 0.54, span (with self-consistency) achieved MU 0.59 on SO-NPO (+0.05), with Forget Quality improving from -10.79 to -8.83.`,
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
          body: `This work makes four core contributions. First, we demonstrate that model-intrinsic span identification is possible without external models. By reasoning about the target model's own gradient signals, we can identify what the model finds "forgettable," creating a tight coupling between identification and the unlearning algorithm.

Second, we show that self-consistency is a principled way to lift from token importance to meaningful semantic units. The ablation confirms that self-consistency adds +0.05 MU improvement and significantly improves Forget Quality, making it essential for practical span-level unlearning.

Third, we design a framework that generalizes across unlearning algorithms. Our span identification works with GA, NPO, SO-NPO, and KL-variant methods, making it broadly applicable rather than algorithm-specific.

Finally, we validate our approach on two fundamentally different datasets. TOFU (synthetic, benchmark-like) and MUSE-News (real, naturalistic) show consistent improvements: on MUSE-News, we achieve 38.38/54.31 utility retention while maintaining strong unlearning, compared to near-zero utility for other selective methods. This demonstrates practical viability of span-level unlearning for real-world deployment.

This work was submitted to ACL 2026 and represents a significant step toward selective, model-aware machine unlearning.`,
        },
      ],
    },
  },
  'moral-agent': {
    en: {
      subtitle: 'A Conversational System Where 7 Agents Maintain Ethical Personas via LangGraph State Machines and DPO Fine-tuning',
      description:
        'A conversational system exploring two ethical dilemmas — AI Art and AI Resurrection — where 7 LangGraph-based agents (2 Facilitators + 4 Persona + 1 SPT) consistently maintain deontological, utilitarian, and neutral perspectives to promote ethical reasoning.',
      sections: [
        {
          heading: '1. Problem Definition — How Do Agents Maintain Personas in AI Ethics Dialogue?',
          body: `When designing conversational systems for AI ethics education, the core challenge is "maintaining consistent ethical stances and character traits throughout the conversation." If agents break character or waver in their positions, the educational impact drops significantly.

PERSONA.I. addresses two ethical dilemmas. First, "Should AI-generated artwork be exhibited in a gallery?" (AI Art topic). Second, "Should we use AI to recreate deceased people?" (AI Resurrection topic). For each topic, players converse sequentially with a facilitator agent, a deontological agent, and a utilitarian agent to form their own ethical stance.

Three core technical challenges emerged. First, 7 agents must each maintain their ethical framework (neutral/deontological/utilitarian) and character settings consistently throughout conversations. Second, agents must facilitate multi-faceted ethical reasoning through Social Perspective Taking (SPT). Third, natural conversation flow must be controlled through LLM-based intent detection combined with turn counters as fallback against infinite loops.`,
          images: [
            { caption: 'Figure 1. Conversation with the Artist Apprentice agent — asking the player about their opinion on AI art' },
          ],
        },
        {
          heading: '2. Why This Approach — 3-Stage State Machine + DPO + Intent-Aligned Response',
          body: `All agents follow a 3-stage conversation state machine implemented with LangGraph StateGraph. Stage 1 is character introduction and context setting, Stage 2 is opinion gathering with empathetic acknowledgment, and Stage 3 is deep exploration of ethical reasoning. Stage transitions are controlled by LLM-based intent detection with turn counters as fallback.

Agents are divided into two types.

Facilitator Agents — Artist Apprentice (AI Art) and Friend (AI Resurrection) — use a modular pipeline architecture handling intent detection, acknowledgment generation, explanation, and opinion exploration. The key design is Intent-Aligned Response: in Stage 2, the user's intent is first detected (positive/negative/neutral), then the response matches that direction. For example, if the user says "I think it could help" (positive), the agent must respond with "Right, it could really help" (positive), never "That could be worrying" (negative).

Persona Agents — Colleague 1 and Jangmo (deontology), Colleague 2 and Son (utilitarianism) — are fine-tuned via DPO to internalize their ethical stances at the model weight level. They use a Three-Phase reasoning architecture (Reflection → SPT Planning → Response), performing self-reflection before every response with 8 persona check items.

The SPT Agent is a Social Perspective Taking specialist that operates across topics, guiding players to consider multiple stakeholder viewpoints.`,
          images: [
            { caption: "Figure 2. In-game voting screen — prompting the player's ethical judgment" },
          ],
        },
        {
          heading: '3. Challenges During the Project',
          body: `This project was built by a team of three. I was responsible for all AI agent development, while a backend developer handled the FastAPI server and database design, and a frontend developer built the game UI and interactions. Each domain was clear, but problems arose at the boundaries — the agent response format sometimes clashed with frontend rendering, and the backend API structure conflicted with agent state management. We settled on an "agent-centric design": define the agent response schema first, then have frontend and backend implement around that contract.

The hardest challenge in my AI agent domain was Intent-Aligned Response consistency. When the facilitator agent failed to accurately detect user intent, direction mismatches occurred — responding negatively to a positive intent. We resolved this by implementing a two-stage pipeline in stage2_acknowledgment.txt: first detect intent, then generate a response aligned with the detected direction.

For persona agents, as conversations grew longer, the LLM would slip into academic tone or revert to neutral stances. We added an 8-item Persona Check section to reflection_prompt.txt — self-checking before every response and rewriting if any item fails.

Constructing DPO training data was also challenging. Preferred/dispreferred response pairs had to be manually crafted from deontological and utilitarian perspectives. The key was teaching "consistent stance aligned with the character," not "the correct ethical position."`,
        },
        {
          heading: '4. System Architecture and Agent Design',
          body: `The system features 7 independent agents operating across two episodes (AI Art and AI Resurrection).

The Artist Apprentice is the AI Art facilitator — an aspiring painter going through a creative slump. The 3-stage conversation (empathize with slump → AI tool suggestion → choice exploration) draws out the player's stance. The Friend is the AI Resurrection facilitator, discussing an AI service that recreates a deceased grandfather.

Colleague 1 is a DPO fine-tuned model opposing AI art exhibition from a deontological perspective, emphasizing the essence of art, humanity, and the value of the creative process. Colleague 2 supports AI art from a utilitarian perspective, emphasizing greatest happiness, accessibility, and efficiency.

Jangmo is a mother-in-law character opposing AI resurrection from a deontological perspective, emphasizing human dignity and moral duty. Son supports AI resurrection from a utilitarian perspective, emphasizing family happiness and emotional comfort.

The SPT Agent is a Social Perspective Taking specialist that operates across topics, guiding players to consider multiple stakeholder viewpoints.`,
          images: [
            { caption: 'Figure 3. Colleague 1 agent (Deontological) — opposing AI art exhibition' },
            { caption: 'Figure 4. Colleague 2 agent (Utilitarian) — supporting AI art exhibition' },
          ],
          html: `<table>
<thead>
<tr><th>Agent</th><th>Ethical Framework</th><th>Topic</th><th>Type</th><th>Key Strategy</th></tr>
</thead>
<tbody>
<tr><td>Artist Apprentice</td><td>Neutral (Facilitator)</td><td>AI Art</td><td>Facilitator</td><td>Modular Pipeline + Intent-Aligned</td></tr>
<tr><td>Friend</td><td>Neutral (Facilitator)</td><td>AI Resurrection</td><td>Facilitator</td><td>Modular Pipeline + Intent-Aligned</td></tr>
<tr><td>Colleague 1</td><td>Deontology (Oppose)</td><td>AI Art</td><td>Persona</td><td>DPO + Three-Phase Reflection</td></tr>
<tr><td>Colleague 2</td><td>Utilitarianism (Support)</td><td>AI Art</td><td>Persona</td><td>DPO + Three-Phase Reflection</td></tr>
<tr><td>Jangmo</td><td>Deontology (Oppose)</td><td>AI Resurrection</td><td>Persona</td><td>DPO + Three-Phase Reflection</td></tr>
<tr><td>Son</td><td>Utilitarianism (Support)</td><td>AI Resurrection</td><td>Persona</td><td>DPO + Three-Phase Reflection</td></tr>
<tr><td>SPT Agent</td><td>Perspective Shifting</td><td>Cross-topic</td><td>SPT</td><td>Social Perspective Taking</td></tr>
</tbody>
</table>`,
        },
        {
          heading: '4-1. Key Insights and Contributions',
          body: `This project makes four key contributions.

First, Intent-Aligned Response design improved facilitator agent empathy quality. Detecting user intent first and responding in the same direction prevents direction mismatches that break conversation flow, enabling natural empathetic dialogue.

Second, a dual-defense structure of DPO Fine-tuning and Self-Reflection strengthened persona consistency. Internalizing ethical stances in model weights via DPO and verifying real-time consistency through Three-Phase Reflection proved more effective than either approach alone.

Third, we designed a scalable multi-agent architecture integrating 7 agents across two topics (AI Art + AI Resurrection). The LangGraph StateGraph-based 3-stage state machine makes it easy to add new ethical topics and agents.

Fourth, cross-topic perspective shifting through the SPT Agent enables multi-faceted ethics education that goes beyond single-topic boundaries.`,
        },
      ],
    },
  },
  'jbnu-ai-mentor': {
    en: {
      subtitle: 'AI-Powered Academic Mentoring Chatbot System for Jeonbuk National University',
      description: 'An AI academic mentoring system for Jeonbuk National University students, implemented with a LangGraph-based multi-agent architecture and Docker microservices for personalized curriculum recommendation and academic information retrieval.',
      sections: [
        {
          heading: 'Project Overview',
          body: `We developed an AI-powered academic mentoring system for Jeonbuk National University students. When a student asks a question in natural language, the system provides guidance across the academic journey, including personalized curriculum recommendations, course search, professor information, and department information.

Students can access the system through an Open WebUI-based chat interface, and the service is built around the 2024 academic information dataset. It is designed to handle complex questions such as "I want to become an expert who combines AI and semiconductors. Which courses should I take?"`,
        },
        {
          heading: 'System Architecture — Multi-Agent Microservices',
          body: `The system is composed of multiple microservices that communicate through HTTP APIs. Open WebUI on port 8080 provides the frontend chat interface, the Pipeline service on port 9099 handles request routing, and the LLM Agent on port 8001 performs the main LangGraph-based orchestration.

All services are containerized with Docker Compose, so the full system can be deployed with a single \`docker-compose up -d\` command. LangGraph's stateful multi-turn conversation management allows the agents to preserve context and answer complex requests.`,
        },
        {
          heading: 'AI Agent Design',
          body: `Four specialized AI agents run as independent microservices.

The Curriculum Recommendation Agent on port 7996 takes a student's learning goal, combines FAISS vector search with LLM query expansion, and generates a semester-by-semester curriculum graph with up to 28 courses. It visualizes prerequisite relations with NetworkX and arranges up to six courses per semester.

The SQL Agent on port 7999 uses GPT-4o-mini to convert natural-language questions into SQL queries. With a low temperature setting of 0.05, it generates stable queries and directly retrieves professor information, course schedules, credits, and other academic data.

The FAISS Agent on port 7997 performs a two-stage hybrid retrieval process. The LLM first generates SQL filters for pre-filtering, and then the OpenAI text-embedding-3-small model retrieves semantically similar courses through vector search.

The Department Agent on port 8000 provides department-level information such as curricula, graduation requirements, certification criteria, and major core courses.`,
          images: [
            {
              caption: 'Real usage example of JBNU AI Mentor — personalized curriculum recommendation and academic information retrieval through the chatbot interface',
            },
          ],
        },
        {
          heading: 'Key Features',
          body: `The curriculum recommendation feature analyzes a student's learning goal and recommends semester-by-semester courses across multiple departments while respecting prerequisite relationships. The course recommendation feature answers questions such as "I'm interested in data analysis. Which classes should I take?" by retrieving semantically relevant courses. The academic information retrieval feature answers questions like "Which professor teaches machine learning?" with SQL-backed factual responses. The department information feature provides detailed guidance on curricula, graduation requirements, and program structure for questions such as "Tell me about the School of Computer Artificial Intelligence."

In addition, the system supports conversation-context management across all agents, LangGraph-based multi-agent query routing, validation for academically focused requests, and real-time streaming responses.`,
        },
      ],
    },
  },
  'heritage-monitoring': {
    en: {
      subtitle: 'AI-Based App for Climate-Responsive Conservation Management',
      description: 'A deep learning-based multi-class damage detection model using DETR to help prevent climate-change-induced deterioration of national heritage sites.',
      sections: [
        {
          heading: 'Project Overview',
          body: `We developed a national heritage monitoring system with AI-based damage detection to help prevent climate-change-related deterioration of heritage assets. The core AI module uses DETR to build a deep learning-based multi-class damage recognition model.`,
        },
        {
          heading: 'Mobile App UI',
          body: `We built a mobile and web monitoring app for managing field survey data in real time. The system supports a structured field-workflow including login, survey registration, metadata management, photo capture, location recording, and damage inspection.`,
          images: [
            {
              caption: 'National heritage monitoring app — login and survey registration screens',
            },
            {
              caption: 'Field survey screen — basic information, metadata, location, photo capture, and damage inspection',
            },
          ],
        },
        {
          heading: 'AI-Based Automated Damage Detection',
          body: `We implemented an automated damage detection function based on AI image analysis. The model was trained and evaluated on eight damage classes including discoloration, cracks, crushing or bursting, decay, flaking, detachment, and biological damage. It achieved mAP 0.615, where mAP (Mean Average Precision) summarizes average detection accuracy across multiple object classes.`,
          images: [
            {
              caption: 'Examples from the automated damage detection gallery — the AI automatically identifies damaged regions in images',
            },
            {
              caption: 'Experimental results on the validation dataset — achieving mAP 0.615',
            },
          ],
        },
      ],
    },
  },
}
