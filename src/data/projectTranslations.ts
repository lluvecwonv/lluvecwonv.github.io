export type ProjectLocale = 'ko' | 'en'

export interface LocalizedProjectImageTranslation {
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
          body: `Experiments used the WikiMIA dataset, which assumes most LLMs were trained on data up to 2023 — pre-2023 data is treated as training data (member) and post-2023 data as unseen (non-member). Triplets were extracted from pre-2023 data, QA data was generated via GPT-4 Turbo, and unlearning was performed on Llama-7B with LoRA-Tuning.

Rouge-L and Accuracy were used as evaluation metrics, where lower scores indicate the model fails to reproduce target knowledge — meaning more effective unlearning. The baseline applied gradient ascent using paraphrased text without triplet extraction.

The proposed method achieved Rouge-L 0.14 and Accuracy 0.26, showing 26% and 32% additional reduction respectively compared to the baseline (Rouge-L 0.19, Accuracy 0.38). As the number of iterations increased, both metrics decreased sharply, confirming that repeated detection-unlearning cycles progressively improve effectiveness.`,
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
        {},
        {
          heading: 'Step 1 — 토큰 중요도 추정',
        },
        {
          heading: 'Step 2 — Self-Consistency 기반 Span 식별',
          images: [
            {
              caption: '1단계: differential gradient 기반 토큰 선별 → 2단계: self-consistency 기반 span 식별 → span-weighted 언러닝',
            },
          ],
        },
      ],
    },
    en: {
      subtitle: 'Selective LLM Unlearning through Model-Intrinsic Span Identification',
      description: 'A two-stage framework that identifies spans to unlearn using only the target model’s gradient signals, without relying on external models.',
      sections: [
        {
          heading: 'Problem Definition — Limits of Existing Unlearning',
          body: `LLMs can memorize private information or copyrighted content from training data, so unlearning is required. Conventional unlearning methods remove entire sequences, which means that non-sensitive content is deleted together with sensitive information and model utility drops significantly.

Recent selective unlearning methods such as SU, SEUL, and WTNPO attempt to identify targets at the token or span level, but they rely on external models such as GPT or BERT. That creates a mismatch with the internal behavior of the target model itself.

This work asks a central question: can we accurately identify what the model should forget using only the model’s own internal signals, without external supervision?`,
          images: [
            {
              caption: '(a) Token-level: removing only part of a name still allows the original identity to be inferred; (b) Span-level: replacing the full name with another name enables complete unlearning',
            },
          ],
        },
        {
          heading: 'Step 1 — Token-Level Importance Estimation',
          body: `We started from the intuition that the forget set and the retain set update model parameters in different directions. Tokens whose gradients align strongly with the forget objective while moving against the retain objective are likely to encode the information that should be unlearned.

We computed token-level importance scores using the alignment between each token gradient and the differential gradient between the average forget gradient and the average retain gradient, with EK-FAC as an inverse-Hessian approximation. This is a model-intrinsic method that uses only the gradients of the target model, without any external model.`,
        },
        {
          heading: 'Step 2 — Span Identification via Self-Consistency',
          body: `Token-level importance alone is not sufficient to identify semantically coherent spans. To address this, we collected candidate spans by repeatedly generating around high-importance anchor tokens.

We then applied a consistency threshold τ and selected only spans that appeared consistently across K independent generations. In this way, only spans that the model itself judged to be stable and consistent were finalized as unlearning targets, while unstable outputs were filtered out automatically.`,
          images: [
            {
              caption: 'Step 1: token filtering with differential gradients → Step 2: span identification with self-consistency → span-weighted unlearning',
            },
          ],
        },
        {
          heading: 'Experimental Setup',
          body: `We evaluated on two benchmarks: TOFU, which contains fictional author information in the forget10 split, and MUSE-News, which contains real news articles. The backbone model was LLaMA-2 7B, and we compared against prior selective unlearning baselines including SU, SEUL, and WTNPO. We also evaluated standard unlearning algorithms such as GA, NPO, SO-NPO, and KL-divergence variants.`,
        },
        {
          heading: 'Results — TOFU (Table 1)',
          body: `On TOFU, SPAN-SO-NPO achieved MU 0.59, a substantial improvement over the prior best result. Existing selective methods such as SU, SEUL, and WTNPO showed MU values between 0.00 and 0.51 with severe utility degradation, whereas the SPAN-based methods preserved much more utility while maintaining strong unlearning performance.`,
        },
        {
          heading: 'Results — MUSE-News (Table 2)',
          body: `On MUSE-News, prior selective methods showed severe over-forgetting, with VerbMem and KnowMem collapsing to 0. In contrast, SPAN-SO-NPO+KL achieved the most balanced result with VerbMem 17.66, KnowMem 26.59, and PrivLeak 22.70, while preserving retain-set utility up to 38.38 and still suppressing target information effectively.`,
        },
        {
          heading: 'Ablation — Contribution of Self-Consistency (Table 3)',
          body: `Comparing token-only selection with span selection using self-consistency showed clear gains. Under SO-NPO, token selection achieved MU 0.54 while span selection reached MU 0.59, an improvement of +0.05. Forget Quality also improved from -10.79 for token selection to -8.83 for span selection, showing that self-consistency is a key ingredient for stable span identification.`,
        },
        {
          heading: 'Key Contributions',
          body: `This work makes three main contributions. First, it proposes a model-intrinsic approach that identifies unlearning targets using only the internal signals of the target model, without external models or annotations. Second, it designs a two-stage framework combining differential gradients and self-consistency so that it can be plugged into existing algorithms such as GA, NPO, and SO-NPO. Third, it substantially improves utility preservation while maintaining strong unlearning efficacy on both TOFU and MUSE.`,
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

All services are containerized with Docker Compose, so the full system can be deployed with a single \`docker-compose up -d\` command. LangGraph’s stateful multi-turn conversation management allows the agents to preserve context and answer complex requests.`,
        },
        {
          heading: 'AI Agent Design',
          body: `Four specialized AI agents run as independent microservices.

The Curriculum Recommendation Agent on port 7996 takes a student’s learning goal, combines FAISS vector search with LLM query expansion, and generates a semester-by-semester curriculum graph with up to 28 courses. It visualizes prerequisite relations with NetworkX and arranges up to six courses per semester.

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
          body: `The curriculum recommendation feature analyzes a student’s learning goal and recommends semester-by-semester courses across multiple departments while respecting prerequisite relationships. The course recommendation feature answers questions such as "I’m interested in data analysis. Which classes should I take?" by retrieving semantically relevant courses. The academic information retrieval feature answers questions like "Which professor teaches machine learning?" with SQL-backed factual responses. The department information feature provides detailed guidance on curricula, graduation requirements, and program structure for questions such as "Tell me about the School of Computer Artificial Intelligence."

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
