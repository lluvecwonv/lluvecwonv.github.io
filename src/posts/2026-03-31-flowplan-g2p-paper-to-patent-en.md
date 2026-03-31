---
title: "FlowPlan-G2P: A Structured Generation Framework for Transforming Scientific Papers into Patent Descriptions — Paper Summary"
date: 2026-03-31
summary: "With over 3.5 million patents filed annually, FlowPlan-G2P proposes a three-stage framework (Concept Graph Induction → Paragraph Planning → Graph-Conditioned Generation) that mirrors the cognitive workflow of expert patent drafters to automatically transform scientific papers into legally compliant patent descriptions. It significantly outperforms all baselines across all Pat-DEVAL dimensions."
tags: [LLM, Patent, NLG, Graph-to-Text, Structured Generation, Agentic AI, 연구노트]
category: 연구노트
language: en
---

This research note summarizes the paper **FlowPlan-G2P: A Structured Generation Framework for Transforming Scientific Papers into Patent Descriptions**.
The authors are Kris W Pan (Amazon) and Yongmin Yoo (Macquarie University).

The central question is:

**"Can we automatically transform scientific papers into patent Detailed Descriptions that satisfy legal requirements such as enablement and sufficiency of disclosure?"**

This paper identifies the limitations of black-box text-to-text approaches that fail to model structural reasoning and legal constraints, and proposes a **three-stage structured transformation framework** that mirrors the cognitive workflow of expert patent drafters.

## One-Line Summary

FlowPlan-G2P automatically generates legally compliant patent descriptions through a three-stage pipeline: Scientific Paper → Concept Graph Induction → Paragraph Planning → Graph-Conditioned Generation, ensuring both legal compliance and technical accuracy.

## 1. Introduction — Why Automating Patent Description Generation is Hard

![Figure 1: Global Patent Application Trends](/figures/flowplan-g2p/output.png)
*Figure 1: Global patent application trends from 2009 to 2023, showing a steady increase to over 3.5 million filings in 2023.*

### 1.1 Problem Background

Over 3.5 million patents are filed worldwide each year. Drafting patent specifications (particularly the Detailed Description) requires deep technical expertise and adherence to legal standards such as enablement and sufficiency of disclosure. With patent attorney fees ranging from $5,000 to $15,000 per application, there is compelling economic justification for automation.

### 1.2 The Unique Challenge of Paper-to-Patent Transformation

Scientific papers and patent specifications have fundamentally different rhetorical purposes:

- **Scientific papers**: Argumentative narratives designed to persuade peers of a discovery's validity, focusing on experimental evidence and theoretical novelty
- **Patent specifications**: Legal instruments centered on disclosure and claim boundaries

This disparity creates a "vocabulary mismatch" where direct translation often results in vague or legally unenforceable text. Crucially, the **Enablement Requirement** (35 U.S.C. § 112) mandates that the Detailed Description must contain sufficient technical detail to allow a "Person Having Ordinary Skill in the Art" (PHOSITA) to replicate the invention without undue experimentation.

### 1.3 Limitations of Existing Approaches

- **PAP2PAT**: Introduced outline-guided chunk generation but relies on static outlines that fail to capture dynamic entity relationships for complex inventions
- **PatentGPT**: Attempted end-to-end specification drafting but struggles with paragraph-level information flow and legal compliance
- Existing methods predominantly treat patent generation as a **surface-level text transformation problem**, overlooking the underlying **structural reasoning** that expert drafters implicitly construct

### 1.4 Key Contributions

1. **Structured Transformation Paradigm**: Reformulates paper-to-patent generation as a structured transformation process rather than surface-level rewriting, introducing Concept Graphs and Paragraph Plans as intermediate representations
2. **FlowPlan-G2P Framework**: A three-stage pipeline integrating Concept Graph Induction, Section Planning, and Graph-Conditioned Generation
3. **Expert-Centric Workflow Modeling**: Unlike black-box models, explicitly emulates the cognitive workflow of patent professionals

## 2. Methodology — The Three-Stage Pipeline of FlowPlan-G2P

![Figure 2: FlowPlan-G2P Architecture](/figures/flowplan-g2p/pat1.jpeg)
*Figure 2: Overview of FlowPlan-G2P. Stage 1 induces a concept graph, Stage 2 organizes it into section-level plans, and Stage 3 generates graph-conditioned paragraphs.*

### 2.1 Stage 1: Structured Reasoning-based Concept Graph Induction

The first stage transforms scientific content into patent-eligible components. The model decomposes the input document $D$ into reasoning steps aligned with canonical drafting categories.

**9 Reasoning Categories:**
- Field, TechProblem, PriorArt, Novelty, Solution, Implementation, Effects, Embodiment, Figure

For each category $R_i$, an LLM generates structured text using expert-oriented prompts:

$$R_i = \text{LLM}(\text{expert\_prompt}_i(D, R_{1:i-1}))$$

The prompts incorporate patent-specific boilerplate phrases (e.g., "The present invention relates to...", "However, conventional technology has the following drawbacks...") to prime the LLM to adopt expert drafting conventions.

These reasoning steps form a **directed concept graph** $G = (V, E)$:
- **Nodes $V$**: Patent elements (specific algorithms, functional modules, etc.)
- **Edges $E$**: Functional/causal dependencies (solves, implements, causes, improves, validates)

**Multi-candidate Generation and Merging:**
- Three candidate graphs $\{G_1, G_2, G_3\}$ are generated to maximize structural recall
- The first graph uses rule-based construction with predefined edge templates
- Subsequent graphs leverage LLM-based relation inference to capture implicit dependencies
- **Merging strategy**: Majority voting for conflicting edge types, union semantics for node aggregation
- Pruning of isolated nodes, redundant relations, and invalid cycles
- Post-merging verification ensures mandatory node types (Field, TechProblem, Solution) are present, injecting placeholder nodes where necessary

### 2.2 Stage 2: Paragraph and Section Planning

The second stage reorganizes the refined graph $G^*$ into legally compliant patent sections.

**Plan structure**: $\mathcal{P} = (S, T)$
- $S$: Set of section-specific subgraphs
- $T$: Global order

An LLM clusters related nodes (e.g., aggregating Solution and Implementation into the Detailed Description section), guided by hierarchical embeddings aligned with standard patent sections (Field, Background, Summary, Detailed Description, Effects).

**Candidate Plan Evaluation (Gating Mechanism):**

$k=5$ candidate plans are generated, then evaluated for intra-section connectivity and semantic consistency:

$$C_i = \frac{|E_{\text{in}}(S_i)|}{\max\{1, |S_i|(|S_i|-1)\}}, \quad C = \frac{1}{|S|} \sum_i C_i$$

- $C_i$: Internal link density within section $S_i$
- Semantic consistency: Entropy-based measure of node type homogeneity — $Sim_i = 1 - H(S_i)/H_{\max}$

**Acceptance criteria**: $C \ge \tau_C = 0.5$, $Sim \ge \tau_S = 0.6$. If no plan meets criteria, the candidate with the highest combined score is selected as fallback.

**Rule-based heuristics**: Prune configurations violating domain conventions (e.g., placing embodiments before technical problems, dissociating figures from implementations).

**Global narrative flow constraint**:

$$\textit{Problem} \rightarrow \textit{Solution} \rightarrow \textit{Implementation} \rightarrow \textit{Effects}$$

### 2.3 Stage 3: Graph-Conditioned Generation

The final stage synthesizes patent-style paragraphs from section-level subgraphs.

For each subgraph $S_i$, constituent nodes are linearized and concatenated with a patent-specific instruction:

$$\text{Prompt}(S_i) = [\text{PatentInstruction}; \text{Linearize}(S_i)]$$

**Generation Settings:**
- Low temperature ($\tau=0.2$) for deterministic and legally consistent outputs
- Tailored generation strategies per section:
  - **Field**: Prioritizes conciseness and technical specificity
  - **Background**: Requires explicit problem framing using markers like "However, such technology has the following problems..."
  - **Detailed Description**: Integrates multiple embodiments with direct figure references
- Few-shot examples retrieved from professional patent corpora to mitigate stylistic drift

**Post-generation validation:**
- LLM-based entailment metric assesses semantic fidelity between generated paragraph and source subgraph
- Regeneration triggered if discrepancies exceed a predefined threshold
- Token-level coverage analysis guarantees all key concepts from the subgraph are represented

## 3. Dataset

The **Pap2Pat-EvalGold** dataset is used. While the original Pap2Pat corpus provides large-scale paper-patent alignment, it relies on heuristic matching that can introduce noisy associations.

Pap2Pat-EvalGold refines through rigorous filtration:
- **Semantic alignment**: Cosine similarity ≥ 0.8 based on Sentence-BERT
- **Authorship consistency**: Author Overlap Ratio ≥ 0.5 (patent inventors and paper authors are substantially the same individuals)
- Final: **146 high-quality** paper-patent pairs

## 4. Experiments and Results

### 4.1 Evaluation Metric: Pat-DEVAL

Standard NLG metrics (BLEU, ROUGE, BERTScore) primarily measure surface-level lexical overlap and fail to distinguish between legally valid specifications and plausible-sounding hallucinations.

**Pat-DEVAL** leverages a Chain-of-Legal-Thought (CoLT) mechanism to simulate PHOSITA reasoning, assessing four dimensions:
- **TCF** (Technical Content Fidelity)
- **DP** (Data Precision)
- **SC** (Structural Coverage)
- **LPC** (Legal-Professional Compliance)

### 4.2 Metric Divergence — The Paradox of Traditional Metrics

| Model | R-1 | R-2 | R-L | BERTScore | Human-LPC |
|---|---|---|---|---|---|
| Zero-Shot | 0.3591 | 0.1903 | **0.1780** | **0.8704** | 1.5 |
| Few-Shot | 0.3312 | 0.1224 | 0.1377 | 0.8337 | 2.1 |
| **FlowPlan-G2P** | **0.5446** | **0.2204** | 0.1689 | 0.8302 | **4.7** |

*Table 1: The "Metric Divergence" phenomenon. The Zero-Shot baseline achieves the highest BERTScore (0.8704) and ROUGE-L (0.1780), yet is rated as legally invalid (Human-LPC 1.5) by expert evaluation. FlowPlan-G2P receives lower scores in these metrics (0.8302/0.1689) but achieves near-perfect legal compliance (4.7).*

This **inverse correlation** confirms that metrics measuring lexical overlap or semantic embedding similarity are misleading for patent drafting tasks.

### 4.3 Reliability of Pat-DEVAL

| Model | Human-TCF | Human-DP | Human-SC | Human-LPC | Kendall's τ |
|---|---|---|---|---|---|
| Zero-Shot | 1.7 | 1.4 | 1.8 | 1.5 | 0.72 |
| Few-Shot | 2.3 | 2.0 | 2.4 | 2.1 | 0.67 |
| Pap2Pat | 3.4 | 3.1 | 3.3 | 3.0 | 0.69 |
| **FlowPlan-G2P** | **4.5** | **4.4** | **4.6** | **4.7** | **0.76** |

*Table 2: Correlation analysis between Pat-DEVAL and human experts. Consistently high Kendall's τ ([0.67, 0.76]) across all models confirms Pat-DEVAL as a reliable surrogate for professional judgment.*

### 4.4 Baseline Comparison

| Model | TCF | DP | SC | LPC |
|---|---|---|---|---|
| Zero-Shot Prompting | 1.8 | 1.5 | 1.9 | 1.6 |
| Few-Shot Prompting | 2.4 | 2.1 | 2.5 | 2.2 |
| Pap2Pat | 3.5 | 3.2 | 3.4 | 3.1 |
| **FlowPlan-G2P (Ours)** | **4.6** | **4.5** | **4.7** | **4.8** |

*Table 3: Baseline comparison using Pat-DEVAL. All methods employ Claude-4.5 as backbone. FlowPlan-G2P achieves superior performance above 4.5 in all dimensions.*

**Analysis:**
- Zero-Shot, Few-Shot: Produce fluent text but fail to adhere to the rigid structural requirements of patent specifications, particularly low in SC and LPC
- Pap2Pat: Shows moderate improvements (3.1–3.5) by leveraging structured inputs, but struggles with deep technical reasoning. Generates generic descriptions lacking precise data correlation for high DP
- **FlowPlan-G2P**: The graph-based planning mechanism ensures every technical feature is logically expanded into the description. LPC of 4.8 indicates effective hallucination suppression and strict adherence to statutory enablement requirements

### 4.5 Robustness Analysis across LLM Backbones

| Backbone | Vanilla (Few-Shot) | + FlowPlan-G2P |
|---|---|---|
| Llama-4-scout | 2.0 | 4.3 |
| Deepseek-v3.1 | 2.2 | 4.6 |
| Claude-4.5 | 2.3 | 4.8 |

*Table 4: Robustness analysis across LLM backbones. Vanilla scores align with Few-Shot results. FlowPlan-G2P consistently elevates performance to professional levels (>4.3) across all backbones.*

**Key Findings:**
1. **Structural guidance outweighs raw model scale**: The open-weights Llama-4-scout with FlowPlan-G2P (4.3) achieves nearly double the performance of vanilla Claude-4.5 (2.3). For complex tasks like patent drafting, a sophisticated planning methodology is a more critical determinant of quality than model size or reputation.
2. **Positive scaling behavior**: Stronger backbones utilize generated plans more effectively. Deepseek-v3.1 (4.6) and Claude-4.5 (4.8) reach exceptional scores, suggesting that as base models advance, the framework can facilitate near-perfect compliance with professional patent standards.

## 5. Summary of Key Findings

1. **Managing Complexity via Graph Topology**: Patent drafting requires maintaining logical consistency across high-dimensional technical relationships. Graph-based planning acts as a "logical anchor," ensuring structural integrity of the invention regardless of text length.
2. **The Metric Paradox**: Legally invalid Zero-Shot outputs achieve higher ROUGE and BERTScore than professional-grade specifications — proving that lexical overlap is an insufficient proxy for statutory validity.
3. **Methodology as a Performance Equalizer**: A structured methodology is a more vital determinant of quality than raw model scale, as the open-weights Llama-4-scout with FlowPlan-G2P significantly outperforms vanilla state-of-the-art Claude-4.5.

## 6. Limitations

- **Legal Consistency with Claims**: The current framework focuses on Detailed Description generation. It lacks a mechanism for real-time legal correspondence verification between induced claims and generated description.
- **Dynamic Legal Precedents**: Patent law interpretation shifts based on new judicial precedents and legislative amendments. The system relies on knowledge at training time and general legal principles, making it difficult to reflect real-time changes in legal standards. Future work could integrate RAG techniques tied to up-to-date legal databases.

## 7. Conclusion

FlowPlan-G2P is a structured generation framework that automates the transformation of scientific papers into legally compliant patent descriptions. Through its three-stage pipeline — Concept Graph Induction → Paragraph Planning → Graph-Conditioned Generation — it mirrors the cognitive workflow of expert patent drafters, effectively bridging the rhetorical and structural disparities between scientific and legal domains. The work reveals a "Metric Paradox" exposing the limitations of traditional NLG metrics, and empirically demonstrates that structured planning methodology is a more critical determinant of generation quality than raw model scale.
