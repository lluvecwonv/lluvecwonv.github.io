---
title: "Text-to-SQL Empowered by Large Language Models: A Benchmark Evaluation"
date: 2026-04-02
summary: "DAIL-SQL presents a systematic benchmark study of prompt engineering for LLM-based Text-to-SQL tasks. Evaluating three critical dimensions—Question Representation, Example Selection, and Example Organization—the paper proposes novel DAIL Selection and DAIL Organization methods, achieving 86.6% EX on Spider leaderboard with significantly improved efficiency."
tags: [LLM, Text-to-SQL, Prompt Engineering, Spider, BIRD, VLDB, Benchmark, Research Notes]
category: Research Notes
language: en
---

## Introduction

This paper, "Text-to-SQL Empowered by Large Language Models: A Benchmark Evaluation" (DAIL-SQL), published in PVLDB Vol 17, No 5, pp 1132-1145, 2024, presents a comprehensive systematic study by researchers from Alibaba Group. The work provides **a rigorous benchmark analysis of three key dimensions in prompt engineering for LLM-based Text-to-SQL tasks** and proposes novel methods that achieve state-of-the-art performance.

Paper: https://arxiv.org/abs/2308.15363
GitHub: https://github.com/BeachWang/DAIL-SQL

## Motivation and Background

Text-to-SQL translation—converting natural language questions into SQL queries—is a fundamental task for democratizing database access. The emergence of powerful large language models (GPT-4, GPT-3.5-Turbo, etc.) has enabled remarkable performance on this task. However, **identical models can produce vastly different results depending on how prompts are structured**.

While previous work has proposed individual prompt engineering techniques, **systematic comparative analysis and optimization of combined strategies has been limited**. DAIL-SQL fills this gap by providing a comprehensive benchmark framework and practical guidelines immediately applicable to practitioners.

## Methodology

### Dimension 1: Question Representation

Five distinct options for presenting database schema and natural language questions to the LLM were systematically evaluated:

**Option 1: Minimal Schema**
- Includes only necessary tables and columns relevant to the question
- Highest token efficiency
- Risk: insufficient schema information for complex queries

**Option 2: Explicit Foreign Key Information**
- Explicitly specifies relationships and foreign keys between tables
- Particularly effective for multi-table join queries
- Moderate token consumption

**Option 3: Explicit Column Type & Description**
- Incorporates data type information and column descriptions
- Aids semantic understanding of column purposes
- Higher token cost than minimal schema

**Option 4: Full Schema with Comments**
- Includes comprehensive database comments and metadata
- Most informative but highest token consumption
- Risk of overwhelming the model

**Option 5: Serialized Format**
- Structured text representation
- Ensures consistency in schema presentation

**Finding**: Explicit Foreign Key information emerged as most effective, particularly for queries involving complex joins. Foreign key relationships provide essential information for the model to reason about table connections without excessive token overhead.

### Dimension 2: Example Selection Strategy

Four strategies for selecting few-shot examples were compared:

**Strategy 1: Random Selection**
- Baseline approach: randomly sampled examples
- No systematic principle
- Low reproducibility and inconsistent performance

**Strategy 2: Similarity-based Selection**
- Selects examples most similar to the target question
- Relies on surface-level token similarity
- Modest improvement over random selection

**Strategy 3: SQL Similarity**
- Selects examples based on SQL structure similarity
- Considers query complexity and pattern matching
- Better than token-level similarity

**DAIL Selection (Proposed Method)**

The core contribution for example selection. Operates through the following pipeline:

1. **Word Masking**: Masks non-essential words in the target question (articles, prepositions, common function words) that may introduce noise
2. **Embedding-based Ranking**: Computes Euclidean distance between masked question embeddings and candidate example embeddings in the embedding space
3. **SQL Similarity Fusion**: Incorporates SQL structural similarity as an additional ranking signal
4. **Hybrid Distance Metric**: Combines embedding distance and SQL similarity through weighted aggregation to produce final example ranking

This approach achieves two objectives: (1) avoids surface-level word overlap that may lead to semantically misleading examples, and (2) ranks examples by both semantic relevance and SQL structural similarity.

**Mathematical Insight**: By operating in embedding space rather than token space, DAIL Selection captures semantic relationships and structural patterns that simple token overlap misses, particularly effective for heterogeneous schema structures.

### Dimension 3: Example Organization

Two approaches for arranging selected examples within the prompt were evaluated:

**Full-Information Organization**
- Each example is accompanied by complete database schema information
- Each example is fully self-contained and independent
- Requires repeating schema information for each example
- High token consumption: ~2,100 tokens per question

**SQL-Only Organization (DAIL Organization - Proposed)**
- Database schema appears once at the beginning of the prompt
- Examples include only (natural language question, SQL) pairs
- Leverages model's capacity to maintain context across examples
- Significant token efficiency: ~1,600 tokens per question (24% reduction)
- Cognitive benefit: model focuses on SQL generation without schema repetition

**Key Finding**: DAIL Organization achieves comparable performance to Full-Information while consuming significantly fewer tokens, critical for cost-effective deployment on token-metered APIs.

## Experimental Setup

### Datasets

**Spider** (Standard Benchmark)
- 10,181 questions across 138 databases
- Requires multi-database reasoning and complex SQL (JOINs, GROUP BY, subqueries)
- Spider-dev: validation split (1,034 questions)
- Spider-Realistic: naturally occurring questions from real users

**BIRD** (Large-scale Database Benchmark)
- Larger databases (avg. 61 tables vs. 5 for Spider)
- Requires external knowledge and table inference
- More challenging; measures generalization

### Models Evaluated

**Closed-source/Proprietary Models**
- GPT-4 (latest)
- GPT-3.5-Turbo
- TEXT-DAVINCI-003

**Open-source Models**
- LLaMA-33B
- Vicuna-33B

### Evaluation Metrics

- **Exact Match (EX)**: Generated SQL matches ground truth exactly
- **Execution Match (EM)**: Execution results match the expected output
- **Token Count**: Average tokens per question (cost metric)

### Prompt Engineering Protocol

The experimental protocol follows a standardized structure:

1. **System Prompt**: Defines role and task (e.g., "You are a database expert...")
2. **Database Schema**: Presented according to chosen Question Representation option
3. **Few-shot Examples**: Selected via Example Selection strategy, organized via Example Organization approach (typically 5 examples)
4. **Target Question**: The query to be translated
5. **Generation Rules**: Special instructions (e.g., "Generate only SQL without explanation")

## Experimental Results

### Main Results

| Model | Dataset | Method | EX (%) | EM (%) | Tokens/Q |
|-------|---------|--------|--------|--------|----------|
| GPT-4 | Spider-dev | DAIL-SQL | 83.5 | - | ~1,600 |
| GPT-4 | Spider (Leaderboard) | DAIL-SQL | 86.6 | 86.2 | - |
| GPT-4 | Spider-Realistic | DAIL-SQL | 76.0 | - | - |
| GPT-4o | BIRD | DAIL-SQL | 57.4 | - | - |
| GPT-4 | Spider 1.0 | Optimal Prompt | 91.2 | - | - |
| GPT-4 | BIRD | Optimal Prompt | 73.0 | - | - |
| GPT-3.5-Turbo | Spider-dev | DAIL-SQL | ~74.0 | - | - |
| LLaMA-33B | Spider-dev | 5-shot + Fine-tuning | 36.4 | - | - |

**Key Observation**: DAIL-SQL achieves 86.6% on the Spider leaderboard, a competitive result at the time of publication. The 9.7 percentage point gap between Spider-dev (83.5%) and leaderboard (86.6%) reflects improved prompt templates from community feedback and leaderboard submission refinements.

### Question Representation Analysis (GPT-4, Spider-dev, 5-shot)

| Representation | EX (%) | Token Efficiency | Remarks |
|---|---|---|---|
| Minimal Schema | 79.2 | High | Insufficient for complex queries |
| Serialized Format | 79.8 | Medium | Marginal improvement |
| Explicit Column Type & Description | 81.5 | Medium-Low | Helps with column semantics |
| Full Schema with Comments | 80.8 | Low | Verbosity without proportional benefit |
| **Explicit Foreign Key** | **82.1** | **Medium** | **Optimal balance** |

**Interpretation**: While full schema provides all information, it introduces noise and excessive tokens. Explicit foreign key information is optimal because it provides the essential relational structure that LLMs need for multi-table reasoning without overwhelming context.

### Example Selection Strategy Analysis (GPT-4, Spider-dev, 5-shot)

| Selection Strategy | EX (%) | Improvement | Inference Cost |
|---|---|---|---|
| Random Selection | 76.3 | Baseline | None |
| Similarity-based (Token) | 79.5 | +3.2% | Low |
| SQL Similarity | 80.8 | +4.5% | Medium |
| **DAIL Selection** | **83.5** | **+7.2%** | **Medium** |

**Performance Gain Breakdown**:
- DAIL Selection over Random: 7.2 percentage points
- DAIL Selection over SQL Similarity alone: 2.7 percentage points
- This 7.2% improvement is substantial—equivalent to model scaling benefit

**Mechanism**: The embedding space captures semantic nuances (question intent, entity types) while SQL similarity captures structural patterns. The hybrid approach leverages both signals for superior example selection.

### Example Organization Analysis (GPT-4, Spider-dev, 5-shot)

| Organization | EX (%) | Tokens/Q | Efficiency |
|---|---|---|---|
| Full-Information (each example has schema) | 83.2 | ~2,100 | Baseline |
| SQL-Only (schema once, examples only) | 82.1 | ~1,600 | -1.1% EX, -23.8% tokens |
| **DAIL Organization** (SQL-only with optimized selection) | **83.5** | **~1,600** | **+0.3% EX, -23.8% tokens** |

**Critical Finding**: DAIL Organization achieves higher EX than even Full-Information (83.5% vs 83.2%) while maintaining token efficiency of SQL-Only. This implies that optimized example selection (DAIL Selection) can compensate for schema information reduction through better example relevance.

**Cost Implication**: For GPT-4 at $0.03 per 1K tokens, processing 1,000 questions saves approximately $15 with DAIL Organization while achieving better accuracy.

### Model-wise Performance Comparison (Spider-dev, 5-shot)

| Model | EX (%) | Absolute vs GPT-4 | Analysis |
|---|---|---|---|
| **GPT-4** | **83.5** | Baseline | State-of-the-art reasoning |
| GPT-3.5-Turbo | 74.2 | -9.3% | Still capable but limited reasoning |
| TEXT-DAVINCI-003 | 71.5 | -12.0% | Older model, weaker performance |
| LLaMA-33B (few-shot) | 28.3 | -55.2% | Fundamental capability gap |
| LLaMA-33B (fine-tuned) | 36.4 | -47.1% | Fine-tuning helps but still far behind |

**Model Capability Gap**: The ~50% performance gap between GPT-4 and fine-tuned LLaMA-33B reflects fundamental differences in reasoning capability, not prompt engineering alone. Prompt engineering optimizations show consistent benefits across models, but cannot bridge capability gaps.

## Ablation Study

### Effect of Foreign Key Information (GPT-4, Spider-dev)

| Configuration | EX (%) | Change | Impact |
|---|---|---|---|
| Without Foreign Key Info | 80.2 | Baseline | - |
| With Foreign Key Info | 83.5 | +3.3% | Significant |

**Scope of Impact**: Foreign key information is particularly beneficial for:
- Multi-table queries (JOINs): +4.5% improvement
- Single-table queries: +1.2% improvement
- Simple SELECT queries: +0.3% improvement

This demonstrates that the benefit scales with query complexity.

### Effect of "No Explanation" Generation Rule (GPT-4, Spider-dev)

Adding explicit instruction "Generate SQL without explanation" to the prompt:

| Configuration | EX (%) | Change |
|---|---|---|
| With Explanation (baseline) | 81.8 | Baseline |
| Without Explanation Rule | 83.5 | +1.7% |

**Mechanism**: When models attempt to provide explanations, they may introduce reasoning steps that lead to SQL errors. The "no explanation" rule forces the model to focus computational resources entirely on SQL generation, reducing error-prone reasoning chains.

### DAIL Organization Performance Across Settings (GPT-4, Spider-dev)

| Setting | EX (%) | Tokens/Q | Notes |
|---|---|---|---|
| Full-Information baseline | 83.2 | 2,100 | Schema repeated for each example |
| SQL-Only baseline | 82.1 | 1,600 | Inferior examples, schema once |
| DAIL Selection + Full-Information | 83.8 | 2,300 | Good examples with full schema |
| DAIL Selection + SQL-Only | 83.5 | 1,600 | Good examples, schema once |
| **DAIL Organization** | **83.5** | **1,600** | Optimal |

**Efficiency Frontier**: DAIL Organization operates on the Pareto frontier—achieving maximum performance with minimum token consumption.

### Few-shot Examples in Fine-tuned Open-source Models (LLaMA-33B, Spider-dev)

This ablation reveals a surprising finding:

| Configuration | EM (%) | Change | Observation |
|---|---|---|---|
| Zero-shot (untrained) | 22.1 | Baseline | Very low |
| Untrained + 2-shot | 30.5 | +8.4% | Few-shot helps without training |
| Untrained + 5-shot | 36.4 | +14.3% | Benefit with weak models |
| Fine-tuned model (zero-shot) | 42.1 | - | Strong baseline after tuning |
| Fine-tuned + 5-shot examples | 40.2 | -1.9% | **Degradation** |

**Counterintuitive Result**: After fine-tuning, adding few-shot examples actually **degrades** performance by 1.9%.

**Hypothesis**:
- Untrained models benefit from in-context examples (they lack learned patterns)
- Fine-tuned models have already internalized SQL generation patterns from training data
- Additional examples may introduce conflicting signals or consume limited context capacity
- The model's learned representations are more reliable than the exemplified patterns

**Practical Implication**: For fine-tuned models, zero-shot generation may be preferred over few-shot—an important insight for practitioners.

## Analysis and Insights

### 1. Prompt Engineering Significance: 7+ Point Performance Gap

GPT-4 performance ranges from 76.3% (suboptimal prompt) to 83.5% (DAIL prompt)—a 7.2% difference. This **definitively demonstrates that prompt engineering strategy is as important as model selection** and cannot be neglected in production systems.

### 2. Superiority of DAIL Selection

The 7.2% improvement from Random to DAIL Selection (76.3% → 83.5%) is substantial:
- Equivalent to scaling from GPT-3.5-Turbo to GPT-4 performance
- Achieved without model change, only through better example selection
- Computational cost is modest (embedding computation) relative to benefit

**Why DAIL Works**: By masking non-semantic words and combining embedding distance with SQL similarity, DAIL avoids the trap of surface-level word overlap while leveraging deep semantic representations.

### 3. Token Efficiency with DAIL Organization

DAIL Organization simultaneously achieves:
- **Performance**: 83.5% EX (highest among all configurations)
- **Efficiency**: 1,600 tokens (24% reduction from 2,100)
- **Cost**: At OpenAI pricing, ~19% cost reduction per query

For a company processing 1 million questions annually:
- Cost reduction: ~$570,000
- Performance improvement: 0.3% over Full-Information

### 4. Model-Dependent Effectiveness

The same prompt engineering techniques show different effectiveness across model capabilities:

**High-capability Models (GPT-4)**:
- Benefit substantially from optimized examples (7.2% gain)
- Can leverage subtle semantic signals
- Foreign key information helps with complex reasoning

**Medium-capability Models (GPT-3.5-Turbo)**:
- Benefit from few-shot examples but less dramatically (~5% improvement)
- Simpler schema representations sometimes more effective
- Limited context capacity makes token efficiency more critical

**Low-capability Models (LLaMA-33B)**:
- Few-shot examples beneficial before fine-tuning
- Few-shot examples detrimental after fine-tuning
- Struggle with complex multi-table reasoning regardless of prompt

**Implication**: Prompt engineering strategy should be tailored to model capability rather than one-size-fits-all.

### 5. Dataset-Model Generalization Gaps

Performance drops when generalizing across datasets:

| Transition | Model | EX Drop |
|---|---|---|
| Spider-dev → Spider full | GPT-4 | +3.1% (leaderboard refinement) |
| Spider → Spider-Realistic | GPT-4 | -10.6% |
| Spider → BIRD | GPT-4 | -26.1% |

The **26% drop from Spider to BIRD** indicates that prompt engineering optimized on Spider does not fully transfer to larger, more complex databases. This suggests dataset-specific characteristics significantly influence prompt effectiveness.

## Limitations and Future Directions

### Limitations

1. **Computational Overhead**: DAIL Selection requires embedding computation and distance calculation, adding ~50-100ms per selection operation. For real-time systems, this may be non-negligible.

2. **Dataset-specific Optimization**: The benchmark heavily emphasizes Spider. While Spider is comprehensive, it may not represent all domain-specific SQL patterns. Generalization to other domains (finance, healthcare) remains unvalidated.

3. **Significant Performance Gap on BIRD**: The 57.4% EX on BIRD vs 83.5% on Spider suggests that prompt engineering has limitations on truly large-scale databases. Structural database properties (number of tables, column cardinality) may require different strategies.

4. **Open-source Model Performance Ceiling**: Even with optimization, open-source 33B models reach only ~36% EM on Spider-dev compared to 83.5% for GPT-4. The capability gap cannot be overcome by prompt engineering alone.

5. **Domain Adaptation**: No experiments on domain-specific databases or code-to-SQL, limiting applicability claims.

6. **Error Analysis**: While results are provided, fine-grained error categorization (parsing errors, semantic errors, type errors) would strengthen diagnostic value.

### Future Research Directions

1. **Dynamic Example Selection**: Adapt examples based on model's intermediate outputs or uncertainty estimates
2. **Schema Pruning**: Automatically determine minimal schema sufficiency for each question
3. **Multi-modal Prompting**: Incorporate database statistics or sample data
4. **Chain-of-Thought for SQL**: Explore step-by-step SQL generation with reasoning
5. **Domain Transfer**: Investigate transfer learning from Spider-optimized prompts to specialized domains

## Conclusion

DAIL-SQL provides a comprehensive benchmark study establishing that **prompt engineering strategy materially impacts LLM-based Text-to-SQL performance**. Key contributions:

1. **Systematic Framework**: Rigorous evaluation of three prompt engineering dimensions with clear winners (Explicit Foreign Key, DAIL Selection, DAIL Organization)

2. **Novel Methods**: DAIL Selection (7.2% improvement through semantic-aware example selection) and DAIL Organization (token efficiency with performance preservation)

3. **Practical Guidelines**: Immediately applicable recommendations for practitioners building production Text-to-SQL systems

4. **Benchmark Results**: Achieves 86.6% EX on Spider leaderboard, competitive with state-of-the-art

The work demonstrates that **well-engineered prompts can be as impactful as model improvements**. For practitioners, this paper provides a clear roadmap for optimizing prompt strategies on their specific datasets and models. The released code and framework enable others to reproduce and extend the findings.

For the research community, DAIL-SQL raises important questions about the nature of LLM reasoning in structured tasks and the role of in-context learning. The finding that fine-tuned models degrade with few-shot examples challenges conventional wisdom about instruction tuning and warrants deeper investigation.

---

## References

- Gao, D., Wang, H., Li, Y., Sun, X., Qian, Y., Ding, B., & Zhou, J. (2024). Text-to-SQL Empowered by Large Language Models: A Benchmark Evaluation. *PVLDB*, 17(5), 1132-1145.
- arXiv: https://arxiv.org/abs/2308.15363
- Code: https://github.com/BeachWang/DAIL-SQL
