---
title: "CompactDS: Frustratingly Simple Retrieval Improves Challenging, Reasoning-Intensive Benchmarks"
date: 2026-03-28
summary: "Challenges the prevailing view that RAG is ineffective for reasoning-intensive tasks. Introduces CompactDS, a 380B-word diverse, high-quality web-scale datastore with a two-stage ANN+Exact Search pipeline enabling sub-second retrieval on a single node (456GB RAM). With LLaMA 3.1 8B, achieves +10% on MMLU, +33% on MMLU Pro, +14% on GPQA, and +19% on MATH. Outperforms Google Search-based RAG and matches complex agentic systems like Search-o1. Published at ICLR 2026."
tags: [RAG, Retrieval, LLM, Datastore, Dense Retrieval, ICLR 2026, Research Notes]
category: 연구노트
language: en
---

# Frustratingly Simple Retrieval Improves Challenging, Reasoning-Intensive Benchmarks

**Venue:** ICLR 2026
**Authors:** Xinxi Lyu*, Michael Duan*, Rulin Shao, Pang Wei Koh, Sewon Min
**Affiliations:** University of Illinois Urbana-Champaign, University of Southern California, Allen Institute for AI, University of Washington, UC Berkeley
**arXiv:** [2507.01297](https://arxiv.org/abs/2507.01297)
**OpenReview:** [Forum](https://openreview.net/forum?id=9lPq01iKOV)
**Data:** [HuggingFace - alrope/CompactDS-102GB](https://huggingface.co/datasets/alrope/CompactDS-102GB)

---

## One-Line Summary

Challenges the prevailing view that RAG is ineffective for reasoning-intensive tasks by introducing **CompactDS**, a diverse, high-quality, web-scale datastore with a **two-stage ANN + Exact Search pipeline**, achieving consistent large improvements on MMLU, MMLU Pro, GPQA, and MATH — even outperforming Google Search-based RAG — all with sub-second latency on a single node.

---

## 1. Overview and Motivation

Retrieval-Augmented Generation (RAG) has been highly effective for factoid QA tasks (e.g., Natural Questions, TriviaQA). However, prior work concluded that RAG is ineffective or even harmful on **reasoning-intensive benchmarks** like MMLU, GPQA, and MATH (Behnamghader et al., 2022; Geng et al., 2024).

The authors challenge this assumption. They identify the root cause of prior failures as the **absence of a suitable datastore**:

**Limitations of existing datastores:**
- **Wikipedia-based:** Too narrow in coverage for general-purpose benchmarks
- **MassiveDS (Shao et al., 2024):** 1,441B words, requires 12.4TB RAM — infeasible without distributed infrastructure
- **Small Common Crawl subsets (RePlug, etc.):** ~5B tokens, insufficient coverage

The solution is **CompactDS**: a 380B-word datastore built from diverse, high-quality sources, deployable on a **single node with 456GB RAM** with sub-second retrieval latency.

---

## 2. CompactDS Datastore Construction

### 2.1 Data Sources

CompactDS is strategically constructed to match the breadth of pretraining corpora while ensuring quality and diversity.

**Web Crawl — High-quality CC (172B words):**
Starting from Common Crawl (894B words), taking the union of C4 and DCLM-Baseline, then further filtering with FineWeb-Edu classifier (threshold 4.0). This reduces Common Crawl to **~19% of its original size** while preserving coverage.

**Wikipedia & Books:**
- Wikipedia: DPR-based (2018) + RedPajama-V1-based (2023)
- Books: RedPajama-V1 Books subset (digitized eBooks)
- Educational Text: Digitized PDFs from Shi et al. (2025)

**Expert Data:**
- Math: OpenWebMath + NaturalProofs (theorems, proofs, definitions)
- Academic Papers: Pes2o, PubMed, ArXiv
- Github: RedPajama-V1 GitHub subset

**Q&A Forums:** Stack Exchange, Reddit

**Decontamination:** Paragraphs with >70% 13-gram Jaccard similarity to any evaluation query are filtered out.

**Final scale:** 380.5B words, 639M documents, split into 256-word passages → **1.9B passages**.

### 2.2 Key Insights

1. **Most web content can be filtered out without sacrificing coverage:** Aggressive filtering yields a compact yet representative dataset.
2. **Diversity of sources is critical:** No single data source suffices alone; even removing the weakest contributing sources degrades performance.

---

## 3. Retrieval Pipeline

### 3.1 Two-Stage Dense Retrieval

**Challenge:** 1.9B passages × 768 dimensions = **5.4TB** vector data — cannot fit in memory.

**Solution: ANN + Exact Search Two-Stage Pipeline**

![Figure 1: Two-stage dense retrieval pipeline with CompactDS](/figures/compactds/figure1_pipeline.png)

**Stage 1 — Approximate Nearest Neighbor (ANN) via IVFPQ:**
- Uses Contriever-msmarco as E_Approx
- IVFPQ (Inverted File with Product Quantization) for clustering + quantization
- Fits in **456GB RAM** with sub-second latency
- Incurs some performance degradation due to lossy quantization

**Stage 2 — Exact Inner Product Search:**
- Retrieves K candidates (K≫k) from ANN, then re-ranks with original (non-quantized) embeddings
- Uses the more expressive **GritLM-7B** as E_Exact
- Exact embeddings stored **on disk** — feasible I/O for moderate K (100–1000)

This design follows the DiskANN approach but has not been widely adopted due to lack of implementation in standard libraries like FAISS.

### 3.2 Augmentation Strategy

**Generation:** Top-k retrieved passages concatenated in reverse order (most relevant closest to query) and fed to the LLM.

**LM Reranking (optional):** LLM-based relevance scoring using a helpfulness prompt. Same model as the generator.

**Oracle Reranking (upper bound):** Uses ground truth answer to select passages that maximize the model's likelihood of the correct answer — measures the theoretical ceiling.

---

## 4. Experimental Setup

### 4.1 Benchmarks

5 reasoning-intensive benchmarks + 2 additional:

- **MMLU:** 57 multiple-choice tasks across STEM, Humanities, Social Sciences, Others
- **MMLU Pro:** 14 disciplines, 10 answer choices — harder than MMLU
- **AGI Eval:** SAT, LSAT standardized exam questions
- **GPQA:** Graduate-level expert-written physics/biology/chemistry (designed to be web-search-proof)
- **MATH:** Competition mathematics (AMC 12, AIME)
- **GPQA Diamond:** High-quality subset (198 questions)
- **MATH-500:** 500-question subset

### 4.2 Models

- **Default:** LLaMA 3.1 8B Instruct
- **Scaling:** LLaMA 3.3 70B Instruct, Mistral 7B Instruct, Qwen3 8B, QwQ 32B

---

## 5. Experimental Results

### 5.1 Main Results (Table 1)

![Table 1: Main Results](/figures/compactds/table1_main_results.png)

**CompactDS performance gains (LLaMA 3.1 8B Instruct, No Retrieval → CompactDS k=10):**

| Benchmark | No Retrieval | CompactDS | Relative Gain |
|-----------|-------------|-----------|---------------|
| MMLU STEM | 60.2 | 66.8 | **+11.0%** |
| MMLU Humanities | 72.0 | 77.9 | +8.1% |
| MMLU Social | 78.7 | 85.2 | +8.3% |
| MMLU Others | 68.9 | 77.0 | +11.8% |
| MMLU Pro | 39.8 | 53.1 | **+33.4%** |
| AGI Eval | 56.2 | 60.2 | +7.1% |
| MATH | 46.9 | 55.9 | **+19.2%** |
| GPQA Physics | 26.7 | 33.2 | **+36.3%** |
| **Average** | **48.3** | **55.1** | **+14.1%** |

**Key Findings:**

1. **Datastore diversity is critical:** Single-source datastores help specific benchmarks only — Educational Text benefits MMLU/GPQA, Math boosts MATH, DPR Wikipedia helps GPQA Biology. But individual source gains are limited.

2. **CompactDS-ANN (all sources combined) achieves 8.1% average improvement** — demonstrating the importance of diverse data coverage.

3. **Wikipedia (DPR), the most common RAG datastore**, provides almost no average benefit on these benchmarks and even hurts performance on several datasets.

4. **Educational content and expert data (Math) deliver the largest single-source improvements** — highlighting the value of materials absent from web crawls.

### 5.2 Comparison with MassiveDS (Table 2)

![Table 2: CompactDS vs MassiveDS MMLU Comparison](/figures/compactds/table2_massiveds.png)

| System | RAM Usage | MMLU AVG | Overall AVG |
|--------|----------|----------|-------------|
| No Retrieval | - | 68.9 | 48.3 |
| MassiveDS (Exact Search) | **12.4TB** | ~73.6 | - |
| CompactDS-ANN only | **0.5TB** | 75.2 | 53.8 |
| CompactDS (ANN+GRIT ES) | 0.5TB | 75.3 | 55.1 |
| CompactDS + LM Reranking | 0.5TB | **78.2** | **56.0** |

CompactDS achieves **higher MMLU performance using only 4% of MassiveDS's RAM**. This demonstrates the effectiveness of careful datastore construction (filtering + diverse sources) combined with the ANN + Exact Search pipeline.

### 5.3 Effect of Exact Search (Table 4)

![Table 4: Retrieval Pipeline Comparison (K=1,000)](/figures/compactds/table4_pipeline.png)

From the ablation in Table 4:
- ANN(Contriever) + ES(Contriever): No significant improvement over ANN-only
- ANN(Contriever) + ES(**GritLM**): Meaningful improvement (AVG 53.8 → 55.1)
- **The more expressive model (GritLM) is the primary driver of improvement** — the key benefit of the two-stage design

### 5.4 Oracle Reranking Upper Bound (Table 3)

![Table 3: Oracle Performance](/figures/compactds/table3_oracle.png)

With oracle reranking selecting the 3 best passages from 100 candidates:
- Average improvement: 8.0% → **16.2%** (vs No Retrieval)
- An 8B Oracle model (AVG 71.2) **surpasses the 70B model's no-retrieval performance (AVG 70.1)**

This shows CompactDS already contains highly useful information, and **better retrieval/reranking or stronger LLMs** could yield significantly higher performance.

### 5.6 Effectiveness Across Models (Table 5)

![Table 5: Different Models](/figures/compactds/table5_different_models.png)

| Model | No Retrieval AVG | CompactDS AVG | Relative Gain |
|-------|-----------------|---------------|---------------|
| LLaMA 3.1 8B Inst | 48.3 | 55.1 | +14.1% |
| LLaMA 3.3 70B Inst | 68.8 | 71.2 | +3.5% |
| Mistral 7B Inst | 37.1 | 42.6 | +14.8% |
| Qwen3 8B | 57.0 | 61.6 | +8.1% |

**Key Findings:**
- **Consistent gains at 70B scale:** +5% MMLU STEM, +13% MMLU Pro, +7% MATH
- **Effective across model families:** Significant improvements with Mistral and Qwen3
- GPQA is an exception at 70B — baseline is already very strong (e.g., Physics 26.7→64.2)

### 5.7 Qualitative Analysis (Table 6)

![Table 6: Example of top retrieved passage from CompactDS on GPQA](/figures/compactds/table6_qualitative.png)

Table 6 shows an example of a passage retrieved by CompactDS for a GPQA question. For a question about the fraction of hydrogen atoms in the second excited state in the atmosphere of Sirius, the retrieved passage contains a similar problem with solution steps, assisting the model's reasoning process.

---

## 6. Comparison with Google Search

### 6.1 Search Engine RAG Pipeline

A competitive web search RAG pipeline built with Google Programmable Search Engine:
- Resiliparse + BeautifulSoup for web page parsing
- olmOCR for PDF parsing (superior to PDFPlumber used in prior work)
- 13-gram overlap decontamination + huggingface.co blocking

### 6.2 CompactDS vs Google Search (Table 7)

![Table 7: Search Engine vs CompactDS Comparison (LLaMA 3.1 8B Instruct)](/figures/compactds/table7_web_vs_local.png)

| Method | MMLU STEM | MMLU Pro | AGI Eval | MATH | GPQA Phys | AVG |
|--------|-----------|---------|---------|------|-----------|-----|
| No Retrieval | 60.2 | 39.8 | 56.2 | 46.9 | 26.7 | 48.3 |
| Search Engine | 61.8 | 42.8 | 59.7 | 51.4 | 25.7 | 51.3 |
| Search Engine + LM Rerank | 61.3 | 44.0 | **59.8** | 50.2 | 32.1 | 51.5 |
| **CompactDS** | 66.8 | 53.1 | 58.9 | **55.9** | 29.4 | 55.1 |
| **CompactDS + LM Rerank** | **69.1** | **54.6** | 59.5 | 53.0 | **33.7** | **56.0** |

**CompactDS consistently outperforms Google Search:** 14% vs 6% average relative improvement. The gap is especially large on MMLU Pro (54.6 vs 44.0) and MATH (55.9 vs 51.4).

### 6.3 QwQ 32B + Search-o1 Comparison (Table 8)

![Table 8: QwQ 32B CompactDS vs Search-o1 Comparison](/figures/compactds/table8_qwq.png)

| Method | Self-contained? | GPQA Diamond | MATH-500 |
|--------|----------------|-------------|----------|
| **Search-o1** | | | |
| No Retrieval | Yes | 58.1 | 83.2 |
| RAG with Search Engine | No | 61.6 | 85.0 |
| **Agentic RAG (Search-o1)** | No | **63.6** | **86.4** |
| **This Paper** | | | |
| No Retrieval | Yes | 58.1 | 91.0 |
| RAG with Search Engine | No | 63.1 | **94.0** |
| **RAG with CompactDS** | Yes | **63.1** | 93.2 |

**Key Findings:**
1. The paper's experimental setup is stronger than Search-o1's (MATH-500 No Retrieval: 91.0 vs 83.2)
2. **Simple minimal RAG + CompactDS matches or outperforms complex Agentic RAG (Search-o1)**
3. CompactDS is **self-contained** — fully reproducible without external search engine dependencies

### 6.4 Complementary Strengths

Search engines offer access to diverse web PDFs (lecture notes, problem sets) unavailable in CompactDS. CompactDS provides reproducibility, cost efficiency, stability, and self-containment.

**PDFs are a key complementary source:** On MMLU Pro, PDF-only retrieval nearly matches PDF+Web combined; on GPQA, PDFs alone outperform the combination.

---

## 7. Discussion and Limitations

**Strengths:**
- **Paradigm shift:** Overturns the assumption that RAG is ineffective for reasoning tasks
- **Practical:** Sub-second latency on a single node (456GB RAM) — accessible to academic labs
- **Reproducible:** Released datastore and pipeline, no commercial search engine dependency
- **Scalable:** Consistent gains from 8B to 70B across multiple model families

**Limitations:**
- Limited improvements on GPQA at larger model sizes where baseline performance is already high
- LM Reranking less effective for CoT tasks (MATH, GPQA) — task-specific reranking needed
- Educational PDFs available only through web search are not included in CompactDS

---

## Key Contributions Summary

1. **CompactDS:** 380B words, diverse sources, quality filtering. The first practical web-scale datastore deployable on a single node with sub-second retrieval.
2. **Two-stage ANN + Exact Search pipeline:** Contriever (ANN) + GritLM-7B (Exact) achieves both memory efficiency and retrieval quality.
3. **Consistent large improvements on reasoning benchmarks:** +10% MMLU, +33% MMLU Pro, +14% GPQA, +19% MATH.
4. **Outperforms Google Search:** In-house datastore surpasses commercial search engines — a result unobservable on prior RAG benchmarks.
5. **Matches Search-o1:** Simple minimal RAG achieves the level of complex agentic RAG systems.

---

## Personal Comments

The most significant contribution of this paper is empirically demonstrating that "a well-constructed datastore enables simple RAG to substantially improve reasoning tasks." Prior work that concluded RAG is ineffective for reasoning was limited not by the method but by the datastore — this is the core message.

Particularly impressive is that a **125GB compressed index preserves nearly all gains with only a 1% performance drop**, making CompactDS accessible to academic-level hardware.

However, the large gap between oracle reranking and actual performance (14.5% vs 32.6%) reveals considerable room for improving how LLMs utilize retrieved results. This gap represents a promising direction for future research on agentic RAG systems and retrieval-specialized model training.

The finding that Wikipedia — the most commonly used RAG datastore — provides almost no benefit on these benchmarks is a wake-up call for the RAG community. It suggests that many negative conclusions about RAG's utility may need to be revisited with more appropriate datastores.
