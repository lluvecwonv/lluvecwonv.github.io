---
title: "Paper Summary - PPTAgent: Generating and Evaluating Presentations Beyond Text-to-Slides"
date: 2026-04-03
summary: A summary of the ACL 2025 paper "PPTAgent," which proposes an agent framework that analyzes reference presentations and generates slides through an edit-based approach instead of the conventional text-to-slides paradigm, along with PPTEval for evaluating presentations across Content, Design, and Coherence.
tags: [LLM, Agent, Presentation Generation, Multimodal, Code Generation, Research Note]
category: 연구노트
subcategory: Agent Generation
language: en
---

This research note summarizes the ACL 2025 paper **PPTAgent: Generating and Evaluating Presentations Beyond Text-to-Slides**.

Paper link: [https://github.com/icip-cas/PPTAgent](https://github.com/icip-cas/PPTAgent)

## TL;DR

Instead of generating presentations by summarizing text into slides, this paper proposes **editing reference slides through edit APIs after analyzing reference presentations** — an agent-based approach. It also introduces **PPTEval**, a framework that evaluates presentation quality across three dimensions: Content, Design, and Coherence.

---

## 1. Introduction

Presentations are a widely used medium for information delivery, but creating high-quality presentations requires a captivating storyline, well-designed layouts, and rich, compelling content. This has driven growing interest in automating the presentation generation process.

Existing approaches typically follow a **text-to-slides** paradigm, converting LLM outputs into slides using predefined rules or templates. The fundamental problem is that they treat presentation generation as an **abstractive summarization** task, focusing primarily on textual content while neglecting the **visual-centric nature** of presentations. This results in text-heavy and monotonous presentations that fail to engage audiences.

![Comparison between PPTAgent and conventional approach](/images/pptagent/fig1.png)
*Figure 1. Comparison between PPTAgent (left) and the conventional abstractive summarization method (right). PPTAgent selects and edits reference slides to preserve visual quality.*

Rather than creating complex presentations from scratch in a single pass, human workflows typically involve selecting exemplary slides as references and then summarizing and transferring key content onto them. PPTAgent is inspired by this process.

However, achieving such an edit-based approach presents two technical challenges. First, due to the layout and modal complexity of presentations, it is difficult for LLMs to directly determine which slides should be referenced. The key challenge lies in enhancing LLMs' understanding of reference presentations' structure and content patterns. Second, most presentations are saved in PowerPoint's XML format, which is inherently verbose and redundant, making it challenging for LLMs to robustly perform editing operations.

---

## 2. PPTAgent Framework

PPTAgent operates in two stages.

![PPTAgent workflow overview](/images/pptagent/fig2.png)
*Figure 2. Overview of the PPTAgent workflow. Stage I analyzes the reference presentation, and Stage II generates a new presentation based on the outline.*

### 2.1 Problem Formulation

The conventional method generates slide elements directly from input content $C$:

$$S = \{e_1, e_2, \dots, e_n\} = f(C)$$

Each element is defined by its type, content, and styling attributes (border, size, position, etc.). This approach requires manual specification of styling attributes, which limits automated generation.

PPTAgent takes input content $C$ and a reference slide $R_j$, generating a **sequence of executable editing actions**:

$$A = \{a_1, a_2, \dots, a_m\} = g(C, R_j)$$

Each action $a_i$ corresponds to a line of executable code. This preserves the well-designed layouts and styles of reference slides while replacing only the content.

### 2.2 Stage I: Presentation Analysis

This stage analyzes the reference presentation to guide subsequent reference selection and slide generation.

**Slide Clustering**: Slides are categorized into two main types based on their functionalities.

- **Structural slides**: Support the presentation's organization (e.g., opening slides, section dividers)
- **Content slides**: Convey specific information (e.g., bullet-point slides)

For structural slides, LLMs' long-context capability is leveraged to analyze all slides, identifying structural roles based on textual features and grouping them accordingly. For content slides, they are converted to images, and a hierarchical clustering approach groups similar slide images. MLLMs then analyze layout patterns within each cluster. The clustering uses a cosine similarity threshold $\theta = 0.65$ based on ViT embeddings, with text replaced by placeholder characters ('a') and images replaced by solid-color backgrounds to focus on layout patterns.

**Schema Extraction**: After clustering, content schemas are extracted for each slide. Each element is represented by its **category**, **description**, and **content**, enabling a clear and structured representation.

### 2.3 Stage II: Presentation Generation

**Outline Generation**: An LLM generates a structured outline where each entry represents a new slide, containing a reference slide selected based on the functional descriptions from Stage I and relevant content identified from the input document.

**Slide Generation**: Slides are generated iteratively based on the outline entries. Each slide adopts the layout of the reference slide while ensuring consistency in content and structural clarity.

Specifically, **edit-based APIs** are designed to enable LLMs to edit reference slides. These APIs support editing, removing, and duplicating slide elements. To address XML format complexity, reference slides are rendered into an **HTML representation**, offering a more precise and intuitive format. This HTML-based format, combined with the edit APIs, enables LLMs to perform precise content modifications.

**Self-Correction Mechanism**: Generated editing actions are executed within a REPL (Read-Eval-Print Loop) environment. When actions fail, the REPL provides execution feedback (Python errors, etc.), and the LLM analyzes this feedback to refine its actions. This process iterates until a valid slide is generated or the maximum retry limit (2 iterations per slide) is reached.

---

## 3. PPTEval: Presentation Evaluation Framework

PPTEval adopts the MLLM-as-a-judge paradigm to evaluate presentations across three dimensions on a 1-to-5 scale.

![PPTEval evaluation framework](/images/pptagent/fig3.png)
*Figure 3. PPTEval assesses presentations across three dimensions: Content, Design, and Coherence.*

| **Dimension** | **Criteria** |
|---|---|
| **Content** | Text should be concise and grammatically sound, supported by relevant images |
| **Design** | Harmonious colors and proper layout ensure readability, while visual elements like geometric shapes enhance overall appeal |
| **Coherence** | Structure develops progressively, incorporating essential background information |

Content and Design are evaluated at the **slide level** and averaged, while Coherence is assessed at the **presentation level**.

---

## 4. Experiments

### 4.1 Dataset: Zenodo10K

Existing presentation datasets suffer from loss of semantic information (stored in PDF/JSON formats) and limited diversity (mostly AI academic presentations). To address this, the authors introduce **Zenodo10K**, a dataset of 10,448 presentations sourced from Zenodo across diverse domains. For experiments, 50 presentations and 50 documents are sampled across 5 domains.

| **Domain** | #Chars (Doc) | #Figs (Doc) | #Chars (Pres) | #Figs (Pres) | #Pages |
|---|---|---|---|---|---|
| Culture | 12,708 | 2.9 | 6,585 | 12.8 | 14.3 |
| Education | 12,305 | 5.5 | 3,993 | 12.9 | 13.9 |
| Science | 16,661 | 4.8 | 5,334 | 24.0 | 18.4 |
| Society | 13,019 | 7.3 | 3,723 | 9.8 | 12.9 |
| Tech | 18,315 | 11.4 | 5,325 | 12.9 | 16.8 |

### 4.2 Implementation Details

PPTAgent is implemented with three models: **GPT-4o-2024-08-06**, **Qwen2.5-72B-Instruct** (text), and **Qwen2-VL-72B-Instruct** (vision). Models are configured as Language Model (LM) + Vision Model (VM) combinations (e.g., Qwen2.5_LM + Qwen2-VL_VM).

Experiments cover 5 domains × 10 input documents × 10 reference presentations = **500 generation tasks per configuration**. Open-source LLMs are deployed using VLLM on NVIDIA A100 GPUs, with total computational cost of approximately **500 GPU hours**.

### 4.3 Baselines

- **DocPres**: A rule-based approach that generates narrative-rich slides through multi-stages with similarity-based image incorporation.
- **KCTV**: A template-based method that creates slides in an intermediate format before converting them into final presentations using predefined templates.

### 4.4 Evaluation Metrics

- **Success Rate (SR)**: Percentage of successfully completed tasks
- **Perplexity (PPL)**: Text fluency measured by Llama-3-8B (lower is better)
- **ROUGE-L**: F1 score based on longest common subsequence
- **FID**: Feature space similarity between generated and reference presentations
- **PPTEval**: Three-dimensional evaluation using GPT-4o as judge

### 4.5 Main Results

| Configuration | | SR(%) | PPL↓ | ROUGE-L↑ | FID↓ | Content↑ | Design↑ | Coherence↑ | Avg.↑ |
|---|---|---|---|---|---|---|---|---|---|
| **DocPres** | GPT-4o_LM | -- | 76.42 | 13.28 | -- | 2.98 | 2.33 | 3.24 | 2.85 |
| | Qwen2.5_LM | -- | 100.4 | 13.09 | -- | 2.96 | 2.37 | 3.28 | 2.87 |
| **KCTV** | GPT-4o_LM | 80.0 | 68.48 | 10.27 | -- | 2.49 | 2.94 | 3.57 | 3.00 |
| | Qwen2.5_LM | 88.0 | **41.41** | **16.76** | -- | 2.55 | 2.95 | 3.36 | 2.95 |
| **PPTAgent** | GPT-4o_LM+VM | **97.8** | 721.54 | 10.17 | 7.48 | 3.25 | 3.24 | 4.39 | 3.62 |
| | Qwen2-VL_LM+VM | 43.0 | 265.08 | 13.03 | 7.32 | 3.13 | **3.34** | 4.07 | 3.51 |
| | Qwen2.5_LM+Qwen2-VL_VM | 95.0 | 496.62 | 14.25 | **6.20** | **3.28** | 3.27 | **4.48** | **3.67** |

Key findings:

**PPTAgent significantly improves overall presentation quality.** It demonstrates statistically significant improvements over baselines across all three PPTEval dimensions. Compared to DocPres: +40.9% in Design, +12.1% in Content. Compared to KCTV: +13.2% in Design, +28.6% in Content. Most notably, Coherence shows the largest improvement (+25.5% over DocPres, +36.6% over KCTV), attributed to PPTAgent's comprehensive analysis of slides' structural roles.

**PPTAgent exhibits robust generation performance.** Both Qwen2.5_LM + Qwen2-VL_VM and GPT-4o_LM + GPT-4o_VM achieve ≥95% success rate, a significant improvement over KCTV (88.0%).

**PPTEval demonstrates superior evaluation capability.** Traditional metrics like PPL and ROUGE-L show inconsistent evaluation trends. For instance, KCTV achieves high ROUGE-L (16.76) but low Content score (2.55), while PPTAgent shows the opposite pattern.

### 4.6 Ablation Study

| Setting | SR(%) | Content | Design | Coherence | Avg. |
|---|---|---|---|---|---|
| PPTAgent (full) | **95.0** | **3.28** | 3.27 | **4.48** | **3.67** |
| w/o Outline | 91.0 | 3.24 | 3.30 | 3.36 | 3.30 |
| w/o Schema | 78.8 | 3.08 | 3.23 | 4.04 | 3.45 |
| w/o Structure | 92.2 | 3.28 | 3.25 | 3.45 | 3.32 |
| w/o CodeRender | 74.6 | 3.27 | **3.34** | 4.38 | 3.66 |

Two key findings:

1. **HTML-based representation significantly reduces interaction complexity**: Removing Code Render causes the success rate to drop from 95.0% to 74.6%.
2. **Presentation analysis is crucial for generation quality**: Removing Outline and Structure significantly degrades Coherence (from 4.48 to 3.36/3.45), and eliminating Schema reduces the success rate from 95.0% to 78.8%.

### 4.7 Score Distribution

![Score Distribution](/images/pptagent/quantitative.png)
*Figure 4. Score distributions of presentations generated by PPTAgent, DocPres, and KCTV across Content, Design, and Coherence. PPTAgent achieves significantly higher proportions of high scores.*

Baselines show scores predominantly concentrated at levels 2 and 3 due to rule-based or template-based paradigm constraints. PPTAgent demonstrates a more dispersed distribution, with over 80% of presentations achieving scores of 3 or higher, and over 80% receiving Coherence scores above 4.

### 4.8 Effectiveness of Self-Correction

![Self-Correction Analysis](/images/pptagent/self-correction.png)
*Figure 5. Number of iterative self-corrections required to generate a single slide under different models.*

GPT-4o exhibits superior self-correction capabilities compared to Qwen2.5, while Qwen2.5 encounters fewer errors in the first generation. Qwen2-VL experiences more frequent errors and poorer self-correction capabilities, likely due to its multimodal post-training. All three models successfully correct more than half of the errors, demonstrating the effectiveness of the iterative self-correction mechanism.

### 4.9 Agreement Evaluation

Correlation between PPTEval and human evaluation:

| Correlation | Content | Design | Coherence | Avg. |
|---|---|---|---|---|
| **Pearson** | 0.70 | 0.90 | 0.55 | 0.71 |
| **Spearman** | 0.73 | 0.88 | 0.57 | 0.74 |

The average Pearson correlation of 0.71 exceeds scores of other evaluation methods, indicating PPTEval aligns well with human preferences. The Design dimension shows a particularly high correlation of 0.90.

![Correlation with existing metrics](/images/pptagent/correlation.png)
*Figure 6. Correlation heatmap between PPTEval's Content/Design dimensions and existing automated metrics. Existing metrics are shown to be ineffective for presentation evaluation.*

### 4.10 Case Study

![Qualitative comparison](/images/pptagent/qualitative_analysis.png)
*Figure 7. Comparative analysis of presentation generation across different methods. PPTAgent generates visually rich slides under diverse references, while DocPres and KCTV produce text-heavy and monotonous results.*

PPTAgent effectively incorporates visual elements with contextually appropriate image placements while maintaining concise slide content. It exhibits diversity in generating visually engaging slides under diverse references. In contrast, DocPres and KCTV produce predominantly text-based slides with limited visual variation.

---

## 5. Limitations

The authors note several limitations: (1) despite a high success rate (>95%), the model occasionally fails to generate presentations; (2) generated quality is influenced by the input reference presentation quality; (3) PPTAgent does not fully utilize visual information to refine slide design, leading to occasional design flaws such as overlapping elements.

---

## 6. Conclusion

PPTAgent redefines presentation generation as a two-stage presentation editing task using LLMs' code understanding and generation abilities. PPTEval provides a new standard for reference-free presentation quality evaluation. Experiments across multiple domains demonstrate the superiority of this approach, offering a new paradigm for slide generation under unsupervised conditions.
