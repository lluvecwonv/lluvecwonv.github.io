---
title: "ReViSQL: Achieving Human-Level Text-to-SQL"
date: 2026-04-02
summary: "ReViSQL achieves human-level Text-to-SQL performance on BIRD through a streamlined framework emphasizing data quality and reinforcement learning. The framework introduces BIRD-Verified dataset, RLVR (Reinforcement Learning with Verifiable Rewards), and inference-time scaling without requiring complex architectures."
tags: [LLM, Text-to-SQL, ReViSQL, RLVR, BIRD, Human-Level, Reinforcement Learning, Research Notes]
category: Research Notes
language: en
---

## Overview

This paper presents **ReViSQL: Achieving Human-Level Text-to-SQL**, which demonstrates that Large Language Models (LLMs) can achieve human-level performance on Text-to-SQL tasks through careful attention to **data quality and effective reinforcement learning strategies**, rather than relying on increasingly complex architectures.

The ReViSQL framework is built on three core pillars:
1. **BIRD-Verified Dataset**: A cleaned dataset derived from the original BIRD benchmark through systematic multi-turn verification, identifying and correcting errors (52.1% SQL errors, 26.2% NL errors, 18.2% knowledge errors in the original BIRD)
2. **RLVR (Reinforcement Learning with Verifiable Rewards)**: A reinforcement learning approach that uses database execution results as verifiable reward signals
3. **Inference-time Scaling**: Leveraging execution-based reconciliation and majority voting to improve performance without additional training

## Background

Text-to-SQL is the task of converting natural language questions into executable SQL queries, a critical capability for enabling natural language interfaces to databases. While recent LLM advances have shown impressive progress on this task, existing approaches face several challenges:

- **Data Quality Issues**: Widespread annotation errors in training datasets reduce the reliability of models trained on large-scale benchmarks
- **Architectural Complexity**: Many approaches require multiple auxiliary modules and complex pipelines that are difficult to maintain and deploy
- **Scalability Constraints**: The computational cost of deploying large, complex models limits practical applicability

BIRD (Big Benchmark for Large-Scale Database Grounded Text-to-SQL) is a comprehensive benchmark covering diverse databases and complex real-world scenarios. However, careful analysis reveals substantial quality issues in the original dataset. This work systematically addresses these challenges through a more principled approach.

## Methodology

### 1. BIRD-Verified Dataset Construction

BIRD-Verified is constructed through a rigorous multi-turn verification process applied to the original BIRD dataset. The verification aims to identify and correct errors that may degrade model training.

**Verification Process:**

- **Phase 1 - Error Identification**: Expert reviewers systematically examine each data instance in the original BIRD dataset for correctness, identifying instances with potential issues
- **Phase 2 - Error Classification**: All identified errors are categorized into three primary types:
  - **SQL Errors** (52.1%): Syntactic or semantic errors in the SQL query (incorrect joins, wrong aggregation functions, malformed WHERE clauses, etc.)
  - **Natural Language (NL) Errors** (26.2%): Ambiguous or inaccurate phrasing in the natural language question
  - **Knowledge Errors** (18.2%): Missing schema understanding, lack of domain context, or misalignment between question and database schema

- **Phase 3 - Correction and Refinement**: Verified instances are corrected according to error classifications, creating a high-quality subset

**Result**: The process yields 2,500+ verified high-quality instances from the original BIRD dataset, validating the principle that data quality matters more than raw dataset size.

### 2. RLVR (Reinforcement Learning with Verifiable Rewards)

RLVR is a reinforcement learning approach that leverages database execution results as ground truth reward signals, enabling the model to optimize for semantic correctness rather than syntactic exactness.

**Core Concept:**

```
Reward Function Definition:
- Execution Match: Generated SQL produces results
  identical to ground truth execution → Reward +1
- Execution Mismatch: Results differ from ground truth → Reward 0
- Syntax Error: Invalid SQL syntax → Reward 0 (no execution possible)
```

**Key Advantages:**
- **Direct Feedback Signal**: Models receive immediate feedback based on whether generated SQL executes correctly on actual databases
- **Automatic Evaluation**: Verification requires no human annotation; execution results serve as automatic ground truth
- **Semantic Focus**: Rewards semantic correctness (correct data retrieval) over syntactic exactness (matching the original query)

**Training Process:**
1. The initialized model generates SQL query candidates from natural language inputs
2. Each candidate SQL is executed against the database
3. Rewards are computed based on execution results
4. Policy gradient methods update the model to increase the probability of generating high-reward SQL queries
5. The model learns to prioritize syntactically valid, semantically correct SQL generation

### 3. Inference-time Scaling

Performance is further enhanced at inference time through two complementary techniques that do not require additional training:

**Execution-based Reconciliation:**
- Generate multiple SQL candidate outputs from the input question
- Execute each candidate against the database to obtain actual results
- Select the candidate whose execution results best match the ground truth
- Filters out syntactically correct but semantically incorrect SQL

**Majority Voting:**
- Perform multiple independent inference passes
- Aggregate the outputs to find the most frequently generated SQL
- Select the most confident result as the final answer
- Reduces model uncertainty and improves consistency

## Experimental Setup

### Model Configurations

ReViSQL is evaluated in two model size configurations:

1. **ReViSQL-235B-A22B** (Large):
   - Model size: 235 billion parameters
   - Activated parameters: approximately 22 billion
   - Training data: BIRD-Verified (2,500 high-quality instances)
   - Enhancement: RLVR applied

2. **ReViSQL-30B-A3B** (Lightweight):
   - Model size: 30 billion parameters
   - Activated parameters: approximately 3 billion
   - Training data: Same BIRD-Verified dataset
   - Enhancement: RLVR applied
   - Advantage: 7.5x cost reduction for inference while maintaining strong performance

### Benchmarks and Datasets

**BIRD Benchmark:**
- BIRD Mini-Dev: Primary evaluation benchmark with largest scale
- Arcwise-Plat-Full: Full schema information available
- Arcwise-Plat-SQL: SQL schema only (no documentation)

**Spider 2 Benchmark:**
- Spider 2-SQLite: SQLite database backend
- Spider 2-Snow: Snowflake data warehouse backend (tests cross-system generalization)

### Evaluation Metrics

- **Execution Accuracy (EX)**: Percentage of instances where generated SQL produces results identical to ground truth (primary metric)
- **Exact Match (EM)**: Percentage of instances where generated SQL syntactically matches original query
- **Baseline**: Human performance (92.96% on BIRD Mini-Dev)

### Training Configuration

- **Optimizer**: AdamW
- **Learning Rate**: 1e-5 (initial), 5e-6 (fine-tuning phase)
- **Batch Size**: 32
- **Epochs**: 3-5 (adapted to dataset size)
- **Training Schedule**:
  - Phase 1: Supervised Fine-Tuning (SFT) on BIRD-Verified
  - Phase 2: RLVR application with database execution feedback

- **Inference Configuration**:
  - Temperature: 0.7 (balanced diversity and accuracy)
  - Top-p: 0.95
  - Max new tokens: 512
  - Number of samples for majority voting: 5

## Experimental Results

### Primary Benchmark Performance

**BIRD Benchmark Results:**

| Model | BIRD Mini-Dev | Arcwise-Plat-Full | Arcwise-Plat-SQL |
|-------|---------------|-------------------|------------------|
| ReViSQL-235B-A22B | 93.2% | 93.78% | 93.17% |
| Human-level (baseline) | 92.96% | - | - |
| Best prior model | 85.1% | 84.2% | 83.5% |

**Spider 2 Benchmark Results:**

| Model | Spider 2-SQLite | Spider 2-Snow |
|-------|-----------------|---------------|
| ReViSQL-235B-A22B | 46.7% | 55.6% |
| Best prior BIRD agent | 34.8% | - |
| Improvement | +11.9% | SOTA (open-source) |

**Model Size Comparison:**

| Configuration | ReViSQL-235B | ReViSQL-30B | vs. 32B-class baselines |
|----------------|--------------|-----------|--------------------------|
| BIRD Mini-Dev | 93.2% | 88.5% | +12.3-18.7% |
| Arcwise-Plat-Full | 93.78% | 87.2% | Significantly better |
| Inference Cost | Baseline | 7.5x cheaper | Strong efficiency advantage |

### Detailed Performance Analysis

**ReViSQL-235B-A22B Strengths:**
- Achieves 93.2% on BIRD Mini-Dev, **exceeding human-level performance (92.96%)**
- Reaches 93.78% on Arcwise-Plat-Full, representing +9.5% improvement over prior state-of-the-art
- Maintains 9.3-15.6% margin over the largest baseline models
- Demonstrates that quality over quantity enables superior performance

**ReViSQL-30B-A3B Efficiency:**
- Achieves 88.5% on BIRD Mini-Dev with only 30 billion parameters
- Outperforms all 32-billion-parameter class models by 12.3-18.7%
- Enables 7.5x cost reduction for inference while maintaining competitive performance
- Practical alternative for cost-sensitive deployments

**Spider 2 Generalization:**
- SQLite variant: 46.7% (+11.9% improvement over prior art)
- Snowflake variant: 55.6% (state-of-the-art among open-source models)
- Strong transfer capability to new database systems not seen during training

## Ablation Study

Systematic ablation studies validate the contribution of each component:

**BIRD-Verified Dataset Impact:**

| Condition | Improvement |
|-----------|------------|
| Original BIRD (baseline) | 0% |
| + BIRD-Verified | +8.2% (Arcwise-Plat-Full) |
| + BIRD-Verified | +9.0% (Arcwise-Plat-SQL) |
| + BIRD-Verified | +13.9% (Spider 2-Snow) |

**Interpretation**: Data quality alone accounts for 8-14% absolute performance gain, with the largest gains observed on the most challenging benchmark (Spider 2-Snow). This validates the core hypothesis that data quality is more impactful than architectural complexity.

### RLVR Contribution

| Configuration | BIRD Mini-Dev Performance |
|---------------|--------------------------|
| SFT (supervised only) | 85.3% |
| SFT + RLVR | 93.2% |
| **RLVR contribution** | **+7.9%** |

The substantial contribution from RLVR (+7.9%) demonstrates that reinforcement learning with verifiable rewards is critical for achieving semantic correctness in SQL generation.

### Inference-time Scaling Impact

| Configuration | BIRD Mini-Dev |
|---------------|--------------|
| Single sample | 90.1% |
| + Majority voting (5 samples) | 92.1% |
| + Execution reconciliation | 93.2% |
| **Total scaling benefit** | **+3.1%** |

Inference-time techniques provide meaningful improvements without retraining, demonstrating the value of post-hoc optimization.

## Analysis

### 1. Error Distribution Analysis

**Original BIRD Dataset Error Breakdown:**
- SQL Errors (52.1%) - Most prevalent category
  - Incorrect aggregation function application
  - Imprecise join conditions
  - Logic errors in WHERE clauses
  - Missing or redundant conditions

- Natural Language Errors (26.2%)
  - Ambiguous phrasing leading to multiple interpretations
  - Missing contextual information
  - Conflicting conditions in the question
  - Temporal or logical ambiguities

- Knowledge Errors (18.2%)
  - Incorrect schema understanding or column selection
  - Missing domain knowledge
  - Inconsistency between question and schema semantics

**ReViSQL Error Reduction:**
Training on BIRD-Verified substantially reduces generated SQL errors:
- Syntax errors: -45%
- Semantic errors: -38%
- Type/join errors: -52%

### 2. Model Size vs. Performance Trade-off

- **235B model**: Achieves optimal performance, exceeds human-level accuracy
- **30B model**: ~4.7% performance reduction but remains superior to comparable baselines
- **Recommendation**: For resource-constrained environments, the 30B model provides an excellent balance between performance and efficiency

### 3. Data Quality as the Primary Factor (Key Insight)

The most important finding of this work is that **verified, high-quality training data** has more impact than model size or architectural complexity:

- 2,500 verified instances account for 8-14% performance improvement
- Data quality improvements exceed the benefits of increased model capacity
- "Smaller, cleaner data > Larger, noisy data" is empirically validated
- Quality assurance in dataset curation is more cost-effective than scaling model parameters

## Limitations and Future Work

### Limitations

1. **Verification Cost**: Manual verification of BIRD-Verified required significant human effort and computational resources. This approach may not scale to massive datasets without automation
2. **Domain Specificity**: Evaluation is limited to general-purpose databases. Performance on specialized domains (healthcare, finance) remains unexplored
3. **Query Complexity**: Performance on queries involving highly complex operations (nested subqueries, window functions, advanced SQL features) is not thoroughly analyzed
4. **Language Diversity**: Evaluation covers only English natural language inputs; non-English language support is not addressed

### Future Research Directions

1. **Automated Error Detection**: Develop automated methods to identify and flag dataset errors, reducing manual verification overhead
2. **Multilingual Support**: Extend the framework to handle non-English natural language questions and database schemas
3. **Adaptive RLVR**: Develop dynamic reinforcement learning strategies that automatically adapt to model-specific error patterns
4. **Explainability**: Integrate mechanisms to explain model reasoning and SQL generation decisions to users

## Conclusion

ReViSQL demonstrates that achieving human-level Text-to-SQL performance does not require architectural complexity or enormous model scale. Instead, the framework emphasizes two fundamental principles: **data quality** and **effective reinforcement learning**.

Key Contributions:
1. **BIRD-Verified Dataset**: A systematically verified, high-quality subset of BIRD with errors identified and corrected across three error categories
2. **RLVR Framework**: An effective reinforcement learning approach using execution-based rewards to optimize for semantic correctness
3. **Empirical Validation**: Comprehensive experiments demonstrating that data quality is the primary driver of performance, more influential than model size

This work has broader implications beyond Text-to-SQL. The findings validate the principle that **data quality fundamentally matters more than model complexity** in structured prediction tasks. The lightweight ReViSQL-30B model provides a practical, cost-efficient solution for deployment in real-world applications while maintaining competitive performance.

The research suggests that future work in semantic parsing and structured prediction should prioritize dataset quality assurance and strategic training procedures over architectural innovations, potentially achieving better results with fewer computational resources.

---

**Paper Link:** https://arxiv.org/abs/2603.20004
