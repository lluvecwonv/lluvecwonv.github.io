---
title: "MAC-SQL: A Multi-Agent Collaborative Framework for Text-to-SQL"
date: 2026-04-02
summary: "MAC-SQL is a multi-agent collaborative framework composed of three specialized agents—Selector, Decomposer, and Refiner—that progressively addresses key challenges in Text-to-SQL: schema filtering for large databases, complex question decomposition with Chain-of-Thought reasoning, and SQL error detection and correction. Achieving 59.39% exact match and 59.59% test accuracy on BIRD benchmark with GPT-4, MAC-SQL demonstrates a 13.24% improvement over GPT-4 zero-shot baseline."
tags: [LLM, Text-to-SQL, MAC-SQL, Multi-Agent, BIRD, Spider, COLING, Research Notes]
category: Research Notes
language: en
---

## Overview

Text-to-SQL, the task of translating natural language questions into SQL queries, presents significant challenges in semantic understanding and database schema comprehension. Large-scale databases introduce particularly acute problems: schema linking becomes computationally prohibitive, and generating complex multi-condition queries requires nuanced reasoning.

This paper presents **MAC-SQL** (Multi-Agent Collaborative SQL), a framework developed by researchers at Beihang University and Tencent Youtu Lab. The framework orchestrates three specialized agents that collaborate to substantially advance Text-to-SQL performance. Each agent addresses distinct bottlenecks in the translation pipeline, achieving state-of-the-art results on major benchmarks.

## Background

### Core Challenges in Text-to-SQL

1. **Schema Filtering Problem**: Real-world databases contain hundreds or thousands of tables and columns. LLMs cannot efficiently process entire database schemas within token limits, requiring intelligent filtering mechanisms.

2. **Complex Semantic Understanding**: Questions often demand comprehension of multiple conditions, nested subqueries, and various join patterns. Simple sequence-to-sequence approaches fail to capture this complexity.

3. **SQL Error Detection and Correction**: Generated SQL may be grammatically valid but semantically incorrect—producing results inconsistent with the question's intent. Automatic error detection and refinement mechanisms are essential.

### Limitations of Existing Approaches

Previous methods exhibit critical shortcomings:
- **Token Limitation Bottleneck**: Sequence-to-sequence models and single-stage LLM approaches cannot efficiently handle schemas with 100+ tables
- **Lack of Error Rectification**: Most approaches perform single-pass generation without mechanisms to detect and correct execution errors
- **No Difficulty-Aware Strategy**: No differentiated treatment based on question complexity

## Methodology

### Three-Agent Collaborative Framework

MAC-SQL comprises three agents that form a processing pipeline, each addressing specific challenges:

#### 1. Selector Agent

**Objective**: Extract relevant schema elements from large databases, reducing input size while preserving task-critical information.

**Operational Mechanism**:
- Receives the natural language question
- Searches the entire database schema to identify relevant tables and columns
- Constructs a "sub-database" containing only related schema elements
- Dramatically reduces contextual noise while maintaining necessary information

**Technical Approach**:
- Embedding-based similarity computation between question and schema elements
- Multi-level filtering: table identification → column selection
- Achieves approximately 70% reduction in token usage on average
- Enables processing of databases with 100+ tables within practical token limits

**Example Application**:
- Question: "What is the average salary by department where headcount exceeds 10?"
- Selector output: Department table {name, budget}, Employee table {salary, department_id}
- Unused tables filtered: Product, Order, Customer, etc.

#### 2. Decomposer Agent

**Objective**: Decompose complex natural language questions into simpler sub-questions using Chain-of-Thought (CoT) reasoning, with automatic difficulty assessment.

**Operational Mechanism**:
- Analyzes questions using explicit CoT reasoning
- Automatically classifies difficulty levels: Simple, Moderate, Challenging
- Adapts the number of reasoning steps based on assessed difficulty
- Routes questions through appropriate inference paths

**Difficulty-Based Processing Strategy**:

| Difficulty | Characteristics | CoT Steps | Example |
|------------|-----------------|-----------|---------|
| **Simple** | Basic SELECT, single WHERE condition, direct aggregation | 0-1 | "Find all employees in the Sales department" |
| **Moderate** | Multiple conditions, JOINs, GROUP BY, basic subqueries | 1-2 | "Find departments where average salary > 50k and headcount > 5" |
| **Challenging** | Nested subqueries, complex aggregations, HAVING clauses, multiple JOINs | 2-3+ | "Find companies with average salary > 50k and count employees, ordered by count descending" |

**Exemplary Decomposition**:
- Original Question: "For each department, retrieve the department name and average salary where the average salary exceeds 50,000 and department has at least 10 employees"
- Decomposition Chain:
  1. "Identify all departments with at least 10 employees"
  2. "Calculate average salary for each identified department"
  3. "Filter departments where average salary > 50,000"
  4. "Construct final SELECT with department name and average salary"

#### 3. Refiner Agent

**Objective**: Detect and correct SQL errors through execution and contextual analysis.

**Error Detection and Correction Workflow**:

1. **SQL Execution Phase**:
   - Executes generated SQL against the target database
   - Captures execution results or error messages

2. **Error Classification**:
   - **Syntax Errors**: Database parser failures (e.g., "Unknown column 'salarys'")
   - **Semantic Errors**: SQL executes but produces incorrect results (logical errors)
   - **Constraint Violations**: Foreign key, data type mismatches

3. **Correction Strategy**:
   - **For Syntax Errors**: Directly incorporate database error messages into the correction prompt
   - **For Semantic Errors**: Compare original question intent with generated SQL structure, identifying divergence
   - **Iterative Refinement**: Up to 3 correction attempts, providing previous attempts as context
   - **Execution Context**: Pass complete table schemas and sample data for informed corrections

**Correction Example**:
- Original Question: "Find average salary by department"
- Generated SQL (Incorrect): `SELECT department, AVG(salary) FROM employees GROUP BY department ORDER BY salary DESC;`
- Database Error: "Unknown column 'salary' in ORDER BY"
- Refiner Output: `SELECT department, AVG(salary) as avg_salary FROM employees GROUP BY department ORDER BY avg_salary DESC;`

### Additional Contribution: SQL-Llama

To enable practical deployment without dependency on proprietary LLMs, the authors developed **SQL-Llama**, a specialized model derived from Code Llama 7B through instruction fine-tuning.

**Development Details**:
- **Base Model**: Code Llama 7B (Meta's code-specialized 7B model)
- **Training Data**: 10,000 Agent-Instruct samples generated through the MAC-SQL pipeline
- **Fine-tuning Approach**: Instruction-following optimization to match MAC-SQL behavior
- **Performance Tier**: Achieves 43.94% EX on BIRD dev (vs. 59.39% GPT-4)

**Advantages**:
- Eliminates proprietary LLM dependency
- Enables on-premise deployment
- Suitable for low-latency, privacy-sensitive applications
- Provides transparent, controllable generation process

## Experimental Setup

### Benchmark Datasets

#### BIRD (Big Bench for Industrial and Research-oriented Database)
**Dataset Characteristics**:
- **Scale**: 95 real-world US databases, 14,047 questions total
  - Development set: 1,534 questions
  - Test set: 1,540 questions
- **Schema Complexity**: Large-scale (avg. 130 tables per database, range 5-500 tables)
- **Query Complexity**: Complex SQL patterns including:
  - Nested subqueries
  - Multiple JOINs (up to 6+ tables)
  - Advanced GROUP BY and HAVING clauses
  - SET operations (UNION, EXCEPT, INTERSECT)
- **Domain Diversity**: Financial, medical, sports, educational, government databases
- **Linguistic Challenges**: Domain-specific vocabulary, ambiguous references, complex phrasing

#### Spider
**Dataset Characteristics**:
- **Scale**: 200 databases, 11,237 SQL queries
  - Development set: 1,034 questions
  - Test set: 2,000 questions
- **Schema Complexity**: Medium-scale (avg. 5-25 tables per database)
- **Query Complexity**: Moderate SQL patterns, primarily 1-2 JOINs, basic aggregations
- **Evaluation Focus**: Fundamental Text-to-SQL capability assessment

### Evaluation Metrics

1. **Exact Match (EX)**: Binary metric indicating whether generated SQL tokens exactly match the gold standard SQL (token-level comparison). Stringent but clear evaluation criterion.

2. **Valid Execution Similarity (VES)**: Evaluates whether generated SQL executes successfully and produces results identical to gold standard execution results. Captures functional correctness beyond syntactic matching.

### Experimental Configuration

**Infrastructure**:
- **LLM Backends**:
  - OpenAI API (GPT-4 with model ID gpt-4-0613, GPT-3.5-turbo)
  - Hugging Face (SQL-Llama 7B)
- **Database Systems**:
  - SQLite (development and evaluation)
  - MySQL 8.0 (production testing)
- **Generation Parameters**:
  - Temperature: 0.0 (deterministic generation for reproducibility)
  - Max tokens: 2048 (sufficient for most SQL queries)
  - Batch size: Varies by dataset size

**Computational Resources**:
- GPU: NVIDIA A100 (for SQL-Llama fine-tuning and inference)
- Inference latency: GPT-4 (2-5 sec/query), SQL-Llama (0.5-1 sec/query)

## Experimental Results

### Primary Results: BIRD Benchmark

#### Overall Performance Comparison

| Model | Dataset | Exact Match (%) | Valid Execution Similarity (%) |
|-------|---------|-----------------|-------------------------------|
| **MAC-SQL + GPT-4** | **Development** | **59.39** | **66.39** |
| **MAC-SQL + GPT-4** | **Test** | **59.59** | **67.68** |
| MAC-SQL + GPT-3.5-turbo | Development | 50.56 | 61.25 |
| MAC-SQL + SQL-Llama 7B | Development | 43.94 | 57.36 |
| GPT-4 Zero-shot Baseline | Test | 46.35 | 54.00 |
| **Absolute Improvement** | **Test** | **+13.24%** | **+13.68%** |

**Key Observations**:
- MAC-SQL + GPT-4 achieves new state-of-the-art on BIRD
- Consistent performance between development and test sets (59.39% vs 59.59%), indicating strong generalization
- 13.24% absolute improvement over GPT-4 zero-shot represents substantial advance
- Open-source SQL-Llama provides viable lower-cost alternative (43.94% EX)

### Spider Benchmark Results

| Model | Dataset | Exact Match (%) | Valid Execution Similarity (%) |
|-------|---------|-----------------|-------------------------------|
| **MAC-SQL + GPT-4** | **Development** | **86.75** | **82.80** |
| MAC-SQL + GPT-3.5-turbo | Development | 78.42 | 75.65 |
| MAC-SQL + SQL-Llama 7B | Development | 71.20 | 68.94 |

**Analysis**:
- Higher overall performance compared to BIRD (86.75% vs 59.39%) reflects Spider's medium complexity
- Ranking consistency across models (GPT-4 > GPT-3.5 > SQL-Llama)
- Demonstrates framework effectiveness across dataset difficulty ranges

### Difficulty-Stratified Performance Analysis (BIRD Dev, GPT-4)

| Difficulty Level | Sample Count | Exact Match (%) | Valid Execution Similarity (%) | Notes |
|------------------|--------------|-----------------|-------------------------------|-------|
| **Simple** | 281 | 65.73 | 72.95 | Basic queries, direct schema mapping |
| **Moderate** | 654 | 52.69 | 59.43 | JOINs, GROUP BY, intermediate complexity |
| **Challenging** | 599 | 40.28 | 49.08 | Nested subqueries, complex logic |

**Performance Trend Analysis**:
- Inverse correlation between difficulty and accuracy
- Simple: 65.73% accuracy—manageable with basic reasoning
- Challenging: 40.28% accuracy—substantial room for improvement
- Performance degradation: 25.45 percentage points from Simple to Challenging
- Suggests architectural enhancements particularly beneficial for complex queries

### Ablation Study (BIRD Development Set, GPT-4)

#### Agent-Level Ablation

| Model Configuration | Exact Match (%) | Performance Change | Valid Execution Similarity (%) |
|---------------------|-----------------|-------------------|-------------------------------|
| **Full MAC-SQL** | **59.39** | **Baseline** | **66.39** |
| w/o Selector Agent | 57.28 | -2.11% | 64.15 |
| w/o Decomposer Agent | 55.54 | -3.85% | 62.08 |
| w/o Refiner Agent | 54.76 | -4.63% | 60.31 |

**Interpretation**:

1. **Selector Agent Impact** (-2.11%):
   - Moderate contribution to overall performance
   - Schema filtering helps but not critical for medium-complexity databases
   - Becomes more essential for 100+ table databases

2. **Decomposer Agent Impact** (-3.85%):
   - Significant contribution through structured question analysis
   - CoT decomposition enables complex query generation
   - Enables difficulty-adaptive processing

3. **Refiner Agent Impact** (-4.63%):
   - **Largest individual contribution**
   - Error correction accounts for 7.8% of total performance (4.63% out of 59.39%)
   - Demonstrates critical importance of iterative refinement
   - Single-pass generation fundamentally limited without error correction

**Overall Analysis**: Refiner Agent contributes most significant performance gain, followed by Decomposer, then Selector. Each agent addresses distinct failure modes.

### Few-Shot Learning Analysis (BIRD Dev, GPT-4)

| Few-Shot Examples | Exact Match (%) | Valid Execution Similarity (%) | Notes |
|------------------|-----------------|-------------------------------|-------|
| 0-shot (Zero-shot baseline) | 55.54 | 62.15 | No examples provided |
| 1-shot | 57.26 | 63.98 | +1.72% improvement |
| 2-shot | **59.39** | **66.39** | **+3.85% improvement, optimal** |
| 3-shot | 58.91 | 65.87 | -0.48% degradation |
| 4-shot | 58.15 | 65.21 | Further degradation |

**Key Findings**:

1. **Optimal Point at 2-shot**: Performance peaks with 2 examples, then declines
2. **Context Window Saturation**: Additional examples increase context size without improving reasoning
3. **Quality over Quantity**: Well-selected examples matter more than raw quantity
4. **Practical Implication**: Recommend 2-shot setting for production deployment

**Explanation**: While in-context examples help calibrate model behavior, excessive examples dilute the signal and consume tokens needed for database schema context.

## Error Analysis

### BIRD Development Set Error Classification (Full Pipeline Errors: 41%)

| Error Category | Count | Percentage | Description |
|---|---|---|---|
| **Gold Error** | 460 | 30.0% | Dataset labeling error or question-answer mismatch |
| **Semantic Correct** | 214 | 14.0% | Different SQL formulation but semantically equivalent results |
| **Schema Linking Error** | 30 | 2.0% | Incorrect table/column selection |
| **Execution Errors** | 241 | 15.7% | SQL syntax or runtime errors |
| **Other/Unknown** | 555 | 36.3% | Uncategorized errors requiring manual inspection |

### Spider Development Set Error Classification (Full Pipeline Errors: 13.25%)

| Error Category | Count | Percentage | Description |
|---|---|---|---|
| **Gold Error** | 142 | 22.0% | Dataset annotation issues or ambiguous intent |
| **Semantic Correct** | 141 | 22.0% | Alternative SQL formulations producing identical results |
| **Schema Linking Error** | 51 | 8.0% | Table/column misidentification |
| **Execution Errors** | 143 | 22.0% | Syntax or runtime failures |
| **Other/Unknown** | 271 | 42.0% | Requires further investigation |

### Detailed Error Type Analysis

#### 1. Gold Error (30% BIRD, 22% Spider)
**Nature**: Questions whose gold-standard answers are misaligned with question intent

**Root Causes**:
- Ambiguous natural language phrasing ("revenue" could mean gross or net)
- Annotator interpretation differences across datasets
- Complex domain knowledge requirements
- Implicit temporal constraints not explicitly stated

**Example**:
- Question: "What is the highest salary?"
- Gold Answer: `SELECT MAX(salary) FROM employees;`
- Alternative Interpretation: `SELECT name, MAX(salary) FROM employees GROUP BY department;` (highest per department)

**Implications**:
- Model not at fault; dataset quality issue
- Represents ceiling on possible improvement for this subset
- Suggests need for stricter annotation guidelines

#### 2. Semantic Correct (14% BIRD, 22% Spider)
**Nature**: Generated SQL formulations that produce identical results but diverge in structure from gold standard

**Manifestations**:
- Different JOIN order producing equivalent results: `A JOIN B JOIN C` vs `A JOIN C JOIN B`
- Algebraically equivalent aggregations: `SUM(amount) * 0.9` vs `SUM(amount * 0.9)`
- Subquery vs JOIN formulations achieving same result
- UNION vs UNION ALL in specific contexts

**Example**:
- Gold: `SELECT dept, COUNT(*) FROM emp GROUP BY dept HAVING COUNT(*) > 5;`
- Generated: `SELECT dept, cnt FROM (SELECT dept, COUNT(*) as cnt FROM emp GROUP BY dept) t WHERE cnt > 5;` (subquery instead of HAVING)

**Implications**:
- Current EX metric penalizes valid alternatives
- Suggests VES metric more appropriate for evaluation
- Points to need for semantic equivalence checking

#### 3. Schema Linking Error (2% BIRD, 8% Spider)
**Nature**: Incorrect table or column identification in schema

**Manifestations**:
- Using wrong table: `user_id` from `orders` instead of `users`
- Column ambiguity: Same column name in multiple tables
- Foreign key relationships misunderstood
- Type mismatches (string vs integer)

**Contributing Factors**:
- Large schema complexity (100+ tables)
- Similar naming conventions across tables
- Missing or incomplete schema documentation
- Insufficient context about relationships

**Mitigation**: Selector Agent directly addresses this error type through intelligent filtering

## Limitations and Future Directions

### Current Limitations

1. **Challenging Query Performance**: 40.28% accuracy on challenging questions represents fundamental limitation for complex applications

2. **Single-Turn Conversation Only**: Framework designed for isolated query generation; multi-turn dialogue with clarifications not supported

3. **Database Execution Requirement**: Refiner Agent necessitates direct database access, limiting applicability to secure/production environments where query execution is restricted

4. **Multilingual Gap**: Evaluation conducted primarily on English datasets; cross-lingual performance unexplored

5. **Inference Latency**: GPT-4 inference requires 2-5 seconds per query; real-time applications demanding <500ms latency remain infeasible

### Future Enhancement Directions

1. **Progressive Refinement Strategy**: Develop intermediate representations between NL question and SQL to capture intent more explicitly before generation

2. **Multi-Turn Dialogue Support**: Extend framework to handle clarifying questions, ambiguity resolution, and iterative query refinement

3. **Execution-Free Error Detection**: Train supervised models for error detection without requiring database access

4. **Multilingual Generalization**: Extend to non-English databases and questions, potentially using multilingual LLMs

5. **Temporal Query Support**: Enable reasoning about time-series data, temporal constraints, and date-range queries

6. **Explainability Enhancement**: Generate natural language explanations of generated SQL for user validation

## Conclusion

MAC-SQL represents a significant advance in Text-to-SQL by decomposing the problem into specialized agent roles. Through empirical evaluation and ablation studies:

**Demonstrated Benefits**:
1. **Scalability**: Selector Agent enables processing of 100+ table databases within practical token limits
2. **Reasoning Capability**: Decomposer Agent with CoT reasoning handles complex multi-step SQL generation
3. **Error Recovery**: Refiner Agent provides iterative error detection and correction, yielding largest performance gains

**Empirical Performance**:
- BIRD benchmark: 59.39% EX / 66.39% VES on development, 59.59% EX / 67.68% VES on test
- 13.24% absolute improvement over GPT-4 zero-shot
- Effective performance across multiple LLM backends (GPT-4, GPT-3.5, SQL-Llama 7B)

**Practical Contributions**:
- SQL-Llama provides open-source alternative (43.94% EX) enabling broader adoption
- Agent framework structure modular, enabling individual component improvements
- Ablation studies provide clear guidance on optimization priorities

**Broader Impact**: This work advances the state-of-practice for automated SQL generation with applications to:
- Business Intelligence systems requiring natural language database queries
- Data science platforms supporting exploratory analysis
- Accessibility tools for non-technical database users
- Enterprise search and reporting automation

The multi-agent collaborative paradigm, demonstrated here for SQL generation, provides a blueprint for addressing other complex code generation and structured output tasks requiring multiple reasoning steps and external validation.

---

**Paper Information**
- **Title**: MAC-SQL: A Multi-Agent Collaborative Framework for Text-to-SQL
- **Authors**: Bing Wang, Changyu Ren, Jian Yang, Xinnian Liang, Jiaqi Bai, Linzheng Chai, Zhao Yan, Qian-Wen Zhang, Di Yin, Xing Sun, Zhoujun Li
- **Affiliations**: Beihang University, Tencent Youtu Lab
- **Venue**: COLING 2025 (January 19-24, 2025, Abu Dhabi, UAE)
- **arXiv**: https://arxiv.org/abs/2312.11242
- **GitHub**: https://github.com/wbbeyourself/MAC-SQL
