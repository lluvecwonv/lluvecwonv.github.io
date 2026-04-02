---
title: "CHESS: Contextual Harnessing for Efficient SQL Synthesis"
date: 2026-04-02
summary: "CHESS is a multi-agent LLM-based framework that optimizes contextual utilization in automated SQL generation, achieving near-state-of-the-art accuracy while significantly reducing computational cost and token usage through adaptive schema pruning and selective information retrieval."
tags: [LLM, Text-to-SQL, CHESS, Multi-Agent, BIRD, Efficiency, Schema Pruning, ICML, Research Notes]
category: Research Notes
language: en
---

## Overview

This paper introduces **CHESS (Contextual Harnessing for Efficient SQL Synthesis)**, a multi-agent framework developed by researchers from Stanford University and University of Alberta for automatic SQL query generation from natural language. CHESS addresses a critical challenge in LLM-based Text-to-SQL tasks: optimizing the trade-off between accuracy and computational efficiency.

Traditional approaches provide entire database schemas to LLMs, resulting in excessive token consumption and degraded performance due to information overload. CHESS introduces four specialized agents—Information Retriever, Schema Selector, Candidate Generator, and Unit Tester—that collaborate to generate accurate SQL queries while reducing LLM calls by 83% and computational costs by 70%.

The paper was published on arXiv in May 2024 (arXiv:2405.16755) and accepted at the ICML 2025 Workshop on Multi-Agent Systems.

## Introduction and Motivation

### The Text-to-SQL Challenge

Text-to-SQL is the task of translating natural language questions into SQL queries. This bridges database systems and natural language processing, with significant real-world applications in business intelligence, data analytics, and automated database interactions.

**Key Challenges:**
- **Schema Complexity**: Large-scale databases contain tens to hundreds of tables and thousands of columns
- **Context Window Limitations**: LLM token constraints prevent including complete schema information
- **Information Overload Paradox**: Providing excessive information confuses models rather than helping them
- **Cost Constraints**: High-performance models like GPT-4 impose substantial API costs

### Limitations of Prior Work

- **Full Schema Provision**: Incurs high computational costs and performance degradation due to cognitive overload
- **Static Information Retrieval**: Uniform information amount regardless of question complexity
- **Single-Pass Generation**: Limited validation and refinement mechanisms for generated queries

## Methodology

### CHESS Framework Architecture

CHESS operates as a cooperative multi-agent system with four specialized agents working iteratively:

```
[Natural Language Question]
    ↓
[Information Retriever] → [Schema Selector] → [Candidate Generator] → [Unit Tester]
    ↓                        ↓                       ↓                    ↓
 Extract Relevant         Adaptive Schema      Generate & Refine      Validate Query
 Data & Values           Pruning (5x reduction)  SQL Candidates       via NL Tests
```

### 1. Information Retriever (IR) Agent

**Objective**: Efficiently extract relevant database columns and values corresponding to the natural language question

**Key Techniques**:
- **Keyword-Based Matching**: Maps critical terms from questions to database column names and values
- **Locality-Sensitive Hashing (LSH)**: Rapidly indexes and retrieves similar column names
- **Vector Database Integration**: Leverages semantic similarity through embeddings (e.g., FAISS)
- **Adaptive Retrieval**: Dynamically adjusts information quantity based on question complexity

**Implementation Details**:
- Column names and sample values are embedded using sentence transformers
- Similarity search returns top-K relevant columns and corresponding sample values
- Adaptation mechanism: simple questions retrieve 5-10 items; complex questions retrieve 15-20 items
- Fallback mechanism ensures coverage of all relevant information when primary retrieval fails

### 2. Schema Selector (SS) Agent

**Objective**: Adaptively prune large database schemas according to question complexity

**Core Innovation**: Not all information helps. Irrelevant schema information consumes tokens and induces context confusion.

**Pruning Strategy**:
1. Starts with columns identified by Information Retriever as relevant
2. Traces database relationships to include directly connected tables
3. Recursively includes tables necessary for join paths
4. Adapts inclusion depth based on question complexity metrics:
   - Entity count (number of tables referenced)
   - Condition complexity (WHERE clause predicates)
   - Aggregation depth (nested GROUP BY or HAVING clauses)

**Complexity-Based Adaptation**:
- **Simple queries** (1-2 entities): Include directly relevant tables + 1-hop neighbors
- **Moderate queries** (3-4 entities): Include 2-hop neighbors
- **Complex queries** (5+ entities, nested conditions): Include full join paths up to 3 hops

**Efficiency Gains**:
- **Token Reduction**: 5x decrease in schema representation (from ~850 to ~170 tokens on average)
- **Performance Impact**: Only 2% accuracy loss while achieving 80% token reduction
- **Model Scalability**: Enables effective use of smaller, cheaper models (GPT-3.5-turbo performance increases by 5-8%)

### 3. Candidate Generator (CG) Agent

**Objective**: Generate multiple SQL candidates and iteratively refine them based on validation feedback

**Generation Pipeline**:
1. **Initial Generation**: Uses pruned schema from Schema Selector and information from Information Retriever
   - Prompt engineering includes task decomposition and explicit instruction following
   - Models instructed to provide intermediate reasoning before SQL generation

2. **Diversity Mechanism**: Generates multiple candidates per question (typically 3-5)
   - Temperature setting: 0.7 (encouraging diversity while maintaining coherence)
   - Sampling strategies: nucleus (top-p) sampling for diverse hypotheses

3. **Iterative Refinement**: Incorporates Unit Tester feedback
   - Failed queries presented with error messages or validation failures
   - Explicit instruction: "Previous attempt failed because..."
   - Encourages learning from failures through chain-of-thought prompting

4. **Termination Conditions**:
   - Query passes Unit Tester validation
   - Maximum 3 iterations reached
   - Computational budget exhausted

**Prompting Techniques**:
- Few-shot examples showing correct SQL generations with corresponding NL questions
- Explicit schema presentation in structured format (table descriptions, constraints)
- Intermediate reasoning: "The query needs to count distinct values in column X where condition Y holds"

### 4. Unit Tester (UT) Agent

**Objective**: Validate generated SQL queries through LLM-based natural language unit testing

**Validation Methodology**:
Rather than executing queries against actual databases (expensive and risky), Unit Tester employs semantic validation:

1. **Syntactic Verification**:
   - Grammar and SQL syntax correctness
   - Valid column references and table names
   - Proper function usage (aggregate functions, window functions, etc.)

2. **Semantic Validation**:
   - Does the generated SQL answer the original question?
   - Are conditions correctly translated from natural language?
   - Are joins specified appropriately?

3. **Constraint Checking**:
   - WHERE clause conditions match question constraints
   - GROUP BY/HAVING clauses reflect aggregation requirements
   - ORDER BY and LIMIT match question requirements

**Testing Protocol**:
```
Input: {original_question, generated_sql, database_schema}
LLM evaluation:
  1. Parse the question intent
  2. Analyze generated SQL structure
  3. Verify alignment between intent and SQL
  4. Identify potential issues
Output: {is_correct: bool, confidence: float, issues: [str], suggestions: [str]}
```

**Validation Confidence Thresholds**:
- High confidence (>0.9): Accept query
- Medium confidence (0.6-0.9): Request refinement
- Low confidence (<0.6): Regenerate from scratch

## Experimental Setup

### Dataset: BIRD (Big Bench for Large-Scale Database Grounded Text-to-SQL Parsing)

**Dataset Characteristics**:
- **Scale**: 128 databases with comprehensive domain coverage
- **Development Set**: 1,534 samples
- **Test Set**: 1,534 samples
- **Database Complexity**: Average 11 tables, ~100 columns per database
- **Query Complexity**: Includes complex joins, nested subqueries, aggregation functions, WHERE clause combinations

**Query Types**:
- Simple single-table selections: 18%
- Two-table joins: 25%
- Three-table joins: 28%
- Complex (4+ tables, nested queries): 29%

**Evaluation Metrics**:
- **Exact Match (EX)**: Generated query matches reference exactly (token-level)
- **Execution Match (EXE)**: Query execution produces identical results
- **Token Efficiency**: LLM calls count, total token usage
- **Cost**: API expenses for inference

### Experimental Configuration

**LLM Models Evaluated**:
- **GPT-4** (gpt-4-0613): Performance baseline, high cost
  - Context window: 8K tokens
  - Cost: $0.03/1K input, $0.06/1K output

- **GPT-3.5-turbo** (gpt-3.5-turbo-0613): Cost-efficient alternative
  - Context window: 4K tokens
  - Cost: $0.0015/1K input, $0.002/1K output

- **GPT-4-turbo** (gpt-4-turbo-2024-04-09): Extended context window
  - Context window: 128K tokens
  - Cost: $0.01/1K input, $0.03/1K output

- **Llama-3-70B**: Open-source large model (via replicate API)
  - Context window: 8K tokens
  - Cost: $0.00135/1K input, $0.00135/1K output

- **Fine-tuned DeepSeek Coder-6.7B**: Code-specialized model
  - Context window: 4K tokens
  - Fine-tuning data: 100K SQL-NL pairs from Spider dataset

**Hyperparameters**:
- **Information Retriever**:
  - Top-K retrieval: adaptive (5-20 based on complexity)
  - Embedding model: sentence-transformers/all-mpnet-base-v2
  - Similarity threshold: 0.5 cosine similarity

- **Schema Selector**:
  - Hop distance: 1-3 (adaptive)
  - Inclusion criteria: direct relevance or join connectivity

- **Candidate Generator**:
  - Temperature: 0.7 (diversity)
  - Max tokens: 500 per query
  - Candidates per question: 3-5
  - Max iterations: 3

- **Unit Tester**:
  - Same model as Candidate Generator (consistency)
  - Confidence threshold: 0.7

**Computational Budgets**:
- **Standard Budget**: Maximum 10 LLM API calls per question
- **High Computational Budget**: Maximum 20 LLM API calls per question

## Experimental Results

### Main Results on BIRD Benchmark

| Configuration | BIRD Dev EX | BIRD Test EX | Improvement vs Baseline |
|---------------|------------|-------------|------------------------|
| CHESS (GPT-4, Standard) | 65.0% | 66.69% | +1.49% |
| CHESS (GPT-4, High Budget) | 66.2% | 71.10% | +5.90% |
| CHESS (GPT-3.5, Standard) | 58.5% | 59.15% | +9.2%* |
| Previous SOTA (Text2SQL-LLM) | 62% | 65.2% | — |
| Random Baseline | 8% | 7.5% | — |

*Improvement is relative to non-CHESS GPT-3.5-turbo baseline (52%), showing CHESS enables smaller models to approach GPT-4 performance

### Performance Across Different Models

| Model | BIRD Dev | BIRD Test | Avg Cost/Query | Tokens/Query | Calls/Query |
|-------|---------|----------|-----------------|--------------|------------|
| GPT-4 | 65.0% | 66.69% | $0.145 | 2,480 | 7.2 |
| GPT-4-turbo | 63.5% | 64.80% | $0.082 | 2,180 | 6.8 |
| GPT-3.5-turbo | 58.5% | 59.15% | $0.018 | 1,820 | 5.5 |
| Llama-3-70B | 52.0% | 53.20% | $0.001 | 1,540 | 5.0 |
| DeepSeek Coder (FT) | 61.0% | 62.30% | $0.005 | 1,390 | 4.8 |

### Efficiency Comparison: CHESS vs. Baseline (Full Schema)

| Metric | CHESS (Standard) | Baseline (Full Schema) | Reduction |
|--------|-----------------|---------------------|-----------|
| Avg LLM calls/query | 5.2 | 31.0 | 83.2% fewer |
| Avg tokens/query | 2,480 | 12,500 | 80.2% fewer |
| Avg cost/query | $0.145 | $0.515 | 71.8% cheaper |
| Avg generation time | 12.3s | 35.7s | 3.0x faster |
| Cost per 1000 queries | $145 | $515 | $370 savings |

### Performance by Question Complexity

| Complexity Level | Num. Questions | CHESS EX | Baseline EX | CHESS Improvement |
|-----------------|---------------|---------|-----------|------------------|
| Simple (1 table) | 285 | 82.1% | 78.2% | +3.9% |
| Moderate (2-3 tables) | 612 | 71.4% | 65.8% | +5.6% |
| Complex (4+ tables) | 637 | 48.2% | 39.1% | +9.1% |

**Key Observation**: CHESS particularly benefits complex queries where selective context is most valuable. Performance gap widens as complexity increases.

### Cost Analysis

**Total Cost for Processing 1,534 Test Samples (GPT-4)**:
- CHESS approach: $223 (average $0.145/query)
- Baseline approach: $790 (average $0.515/query)
- **Savings: $567 (71.8% reduction)**

**Cost-Benefit Trade-offs**:
| Approach | Cost | Accuracy | Cost/% Accuracy |
|----------|------|----------|-----------------|
| Random | $0 | 7.5% | — |
| GPT-3.5 only | $27.60 | 59.15% | $0.47 per % accuracy |
| CHESS (GPT-3.5) | $27.60 | 59.15% | $0.47 per % accuracy |
| GPT-4 only | $790 | 66.69% | $11.83 per % accuracy |
| CHESS (GPT-4) | $223 | 66.69% | $3.34 per % accuracy |

## Ablation Study: Component Contributions

### Overall Ablation Results

| Configuration | BIRD Dev | BIRD Test | Avg Tokens | Cost/Query |
|---------------|---------|----------|------------|-----------|
| Full CHESS | 65.0% | 66.69% | 2,480 | $0.145 |
| w/o Information Retriever | 60.2% | 61.50% | 2,450 | $0.142 |
| w/o Schema Selector | 63.0% | 64.80% | 12,400 | $0.380 |
| w/o Candidate Generator (single gen) | 62.1% | 63.20% | 1,620 | $0.095 |
| w/o Unit Tester (no validation) | 64.1% | 65.50% | 2,480 | $0.145 |

**Conclusion from Ablation**:
- **Information Retriever impact**: -4.8% accuracy without selective retrieval
- **Schema Selector impact**: -2.0% accuracy but 5x token increase without pruning (most critical for efficiency)
- **Candidate Generator impact**: -3.5% accuracy without iterative refinement
- **Unit Tester impact**: -1.2% accuracy without validation loop

### Deep Dive: Schema Selector Effectiveness

**Token Usage Across Pruning Strategies**:
- No pruning (full schema): 850 tokens (baseline 100%)
- Conservative pruning (3 tables): 120 tokens (14%)
- Moderate pruning (7 tables): 170 tokens (20%)
- Aggressive pruning (5 tables): 140 tokens (16%)
- Adaptive CHESS (dynamic): 160 tokens (19% on average)

**Accuracy vs. Schema Size Trade-off**:
| Avg Tables Included | Schema Tokens | BIRD Test EX | Gap vs Full |
|-------------------|--------------|------------|-----------|
| All (28 avg) | 850 | 65.2% | 0% (baseline) |
| Pruned to 15 | 450 | 65.1% | -0.1% |
| Pruned to 10 | 280 | 65.0% | -0.2% |
| Pruned to 7 | 170 | 64.8% | -0.4% |
| Pruned to 5 | 120 | 63.5% | -1.7% |
| Adaptive CHESS | 160 | 66.69% | +1.5% |

**Surprising Finding**: Adaptive CHESS actually outperforms full schema by 1.5%, suggesting that targeted information helps models avoid confusion better than comprehensive information.

### Information Retrieval Selectivity Paradox

**Experiment**: Varying information provision while holding schema constant

| Condition | Information Items | Total Tokens | BIRD Test EX |
|-----------|-----------------|-------------|-----------|
| No retrieval | 0 | 850 | 54.2% |
| Top-5 items | 5 | 920 | 60.8% |
| Top-10 items | 10 | 1,080 | 65.0% |
| Top-15 items | 15 | 1,240 | 65.8% |
| Top-20 items | 20 | 1,450 | 65.3% |
| All relevant items | ~30 | 2,150 | 63.9% |

**Critical Insight**: Performance peaks at 15-20 relevant items, then degrades. Excessive information induces what we term "context confusion"—the model loses focus on critical details when presented with abundant marginally relevant information.

**Hypothesis**: This relates to attention distribution in transformer architectures. With constrained attention budget, models may distribute focus too widely when information abundance is high.

## Analysis and Insights

### Why Adaptive Schema Pruning Works

1. **Cognitive Load Reduction**: Models concentrate on relevant information, reducing working memory pressure
2. **Token Economy**: Freed tokens enable more sophisticated prompting, better few-shot examples, or intermediate reasoning
3. **Relationship Clarity**: Pruned schemas present clearer join paths and foreign key relationships
4. **Reduced Noise**: Irrelevant tables that share names with relevant ones no longer confuse the model

### The Context Confusion Phenomenon

A key finding is the paradoxical degradation when providing comprehensive information:
- **Peak performance**: 15-20 carefully selected items
- **Degradation threshold**: Beyond 20 items
- **Explanation**: Transformer attention mechanisms distribute weight across all present information. Excessive irrelevant information dilutes attention to critical tokens

This finding challenges the intuition that "more information is always better" and suggests that information **curation**, not just retrieval, is crucial for LLM reasoning.

### Model Efficiency Scaling

**Relative Performance (baseline = GPT-4 alone)**:
- GPT-4 alone: 100% (baseline)
- GPT-3.5 alone: 88.6% (11.4% gap)
- CHESS + GPT-3.5: 95.7% (4.3% gap)
- **Gap reduction**: 62% (from 11.4% to 4.3%)

This enables **cost-effectiveness ratios** where smaller models with CHESS approach larger models without it, opening practical deployment options.

### Iterative Refinement Value

**Contribution of Multi-Turn Generation**:
- Single generation: 63.2% accuracy
- With 2 refinement attempts: 65.8% accuracy
- With 3 refinement attempts: 66.69% accuracy

**Diminishing returns**: Third iteration adds only 0.89%, suggesting optimal computational budget allocates 60-70% to initial generation and 30-40% to refinement.

## Limitations and Future Work

### Current Limitations

1. **Database Specificity**: CHESS assumes well-documented schemas with meaningful column names. Real-world databases often have cryptic naming conventions that degrade retriever performance

2. **Semantic Database Testing**: Unit Tester relies on LLM judgment without actual database access, missing type mismatches, constraint violations, or data-specific errors

3. **Non-English Schemas**: Evaluation focuses on English language databases. Multilingual extension requires separate embedding models and retriever training

4. **Extreme Complexity**: Queries requiring 10+ table joins or deep nesting (3+ levels) show performance degradation

5. **Execution Uncertainty**: No execution-based validation means queries may fail at runtime despite passing semantic tests

### Future Research Directions

1. **Execution Validation Integration**: Safely execute generated queries on test databases with constraints (e.g., LIMIT clauses, query timeouts)

2. **Neural Policy Learning**: Replace rule-based schema pruning with learned policies optimized for accuracy-efficiency trade-offs

3. **Multimodal Schema Representation**: Incorporate table statistics, usage patterns, and historical query logs alongside structural information

4. **Cross-Lingual Extension**: Develop multilingual schema understanding and retrieval mechanisms

5. **Reinforcement Learning Optimization**: Train agents through reward signals based on query execution results

6. **Domain-Specific Fine-tuning**: Adapt components for specialized domains (medical, financial, legal databases)

## Conclusion

CHESS demonstrates that **efficient SQL synthesis does not require sacrificing accuracy**. By decomposing the Text-to-SQL task into specialized agents and implementing adaptive context selection, the framework achieves near state-of-the-art performance while reducing computational requirements by orders of magnitude.

### Key Contributions

1. **Adaptive Schema Pruning**: Achieves 5x token reduction without accuracy loss, enabling practical deployment on constrained infrastructure

2. **Selective Information Retrieval**: Demonstrates that curated information outperforms comprehensive information, resolving the context confusion paradox

3. **Multi-Agent Collaboration**: Four specialized agents operating iteratively prove more effective than monolithic approaches

4. **Practical Efficiency**: 83% reduction in LLM calls and 71% cost savings make enterprise-scale SQL synthesis economically viable

### Impact and Significance

- **Practical Deployment**: Enables organizations to use cost-effective models instead of expensive APIs
- **Environmental Consideration**: 70% fewer tokens reduces computational overhead and carbon footprint
- **Accessibility**: Opens Text-to-SQL technology to resource-constrained environments
- **Reproducibility**: Open-source implementation facilitates community adoption and extension

On the BIRD benchmark, CHESS achieves 66.69% Exact Match accuracy on the test set (71.10% with high computational budget), placing it within 2% of leading proprietary methods while requiring substantially fewer resources. This represents a significant step toward practical, efficient, and scalable automated database querying systems.

---

**Paper Information**
- **arXiv**: https://arxiv.org/abs/2405.16755
- **GitHub**: https://github.com/ShayanTalaei/CHESS
- **Venue**: ICML 2025 Workshop on Multi-Agent Systems
- **Authors**: Shayan Talaei, Mohammadreza Pourreza, Yu-Chen Chang, Azalia Mirhoseini, Amin Saberi
- **Affiliations**: Stanford University, University of Alberta
- **Publication Date**: May 2024
