---
title: SQL-of-Thought: Multi-agentic Text-to-SQL with Guided Error Correction
date: 2026-04-01
summary: This paper presents SQL-of-Thought, a multi-agentic framework leveraging six LLM-based agents for text-to-SQL conversion with guided error correction. The framework incorporates a systematic error taxonomy of 9 categories with 31 sub-categories and achieves 91.59% execution accuracy on the Spider dataset, surpassing existing methods.
tags: [LLM, Text-to-SQL, Multi-Agent, Error Correction, SQL-of-Thought, Spider, NeurIPS, Research]
category: Research Notes
language: en
---

## 1. Introduction

Text-to-SQL, the task of converting natural language (NL) questions into SQL queries, is a fundamental problem in enabling seamless human-database interaction. While recent large language models (LLMs) have shown remarkable capabilities, existing approaches suffer from limitations: single-pass generation methods lack robustness, and naive error correction loops provide insufficient guidance for systematic improvement.

This paper, "SQL-of-Thought: Multi-agentic Text-to-SQL with Guided Error Correction," is authored by Saumya Chaturvedi (Max Planck Institute), Aman Chadha (AWS GenAI), and Laurent Bindschaedler (Max Planck Institute), presented at NeurIPS 2025 Deep Learning for Code Workshop (arXiv: 2509.00581).

The core contributions of this work are:

1. **Multi-agent Framework**: A systematic composition of six LLM-based agents that decompose and address the text-to-SQL task step-by-step.
2. **Systematic Error Taxonomy**: A comprehensive classification of 31 sub-categories across 9 major error types.
3. **Guided Error Correction**: Structured feedback mechanisms leveraging the error taxonomy for iterative refinement.
4. **State-of-the-art Performance**: Achieves 91.59% execution accuracy on Spider, surpassing previous best methods by 3.99 percentage points.

## 2. Related Work

The field of text-to-SQL has evolved through multiple paradigms:

### 2.1 Basic LLM Approaches
- ChatGPT: 74.4% (Spider)
- GPT-4: 72.3% (Spider)
- Limitations of single-pass generation approaches evident

### 2.2 Multi-step Methods
- **ACT-SQL** (ChatGPT): 80.4% (Spider), 75.8% (Spider-Realistic)
- **DIN-SQL** (GPT-4): 82.8% (Spider), 78.1% (Spider-Realistic)
- **DAIL-SQL** (GPT-4): 83.1% (Spider), 75.6% (Spider-Realistic)
- **MAC-SQL** (GPT-4): 86.8% (Spider)
- **Tool-SQL** (GPT-4): 86.9% (Spider), 82.9% (Spider-Realistic)
- **ChaseSQL**: 87.6% (Spider)

SQL-of-Thought advances the state-of-the-art by surpassing all previous methods.

## 3. Methodology

### 3.1 System Overview

SQL-of-Thought comprises six specialized LLM agents, each optimized for specific tasks within the text-to-SQL pipeline. These agents operate sequentially with structured feedback mechanisms.

The overall pipeline is as follows:

```
Natural Language Question + DB Schema
        ↓
1. Schema Linking Agent
        ↓
2. Subproblem Agent
        ↓
3. Query Plan Agent
        ↓
4. SQL Agent
        ↓
SQL Generation & Execution
        ↓
[If Failed]
5. Correction Plan Agent
        ↓
6. Correction SQL Agent
        ↓
Corrected SQL Generation & Execution
```

### 3.2 The Six Core Agents

#### 3.2.1 Schema Linking Agent

**Purpose**: Identifies relevant database schema elements that correspond to the natural language question.

**Input**:
- Natural language question
- Complete database schema (tables, columns, foreign keys)

**Output**:
- Relevant table list
- Relevant column list
- Required join conditions
- Potential filtering conditions

**Operational Details**:
1. Parse NL question for noun phrases and verb structures
2. Perform semantic matching between question terms and schema elements
3. Identify foreign key relationships for join operations
4. Validate type compatibility (e.g., DATE columns for temporal filters)

**Example**:
```
Question: "What is the revenue of companies founded after 2020 with more than 100 employees?"

Output:
- Tables: company, employee
- Columns: company.name, company.revenue, company.founded_year,
           employee.id, employee.company_id
- Join: company.id = employee.company_id (if needed)
- Filters: company.founded_year >= 2020, COUNT(employee.id) >= 100
```

#### 3.2.2 Subproblem Agent

**Purpose**: Decomposes the SQL query into clause-level sub-problems.

**Input**:
- Natural language question
- Output from Schema Linking Agent

**Output**:
- WHERE clause requirements
- GROUP BY clause requirements
- HAVING clause requirements
- JOIN clause requirements
- ORDER BY specifications
- DISTINCT necessity
- LIMIT requirements

**Operational Details**:
The agent systematically decomposes SQL into constituent clauses:

1. **SELECT**: Columns to retrieve and aggregate functions
2. **FROM**: Base table(s)
3. **JOIN**: Join conditions and types (INNER, LEFT, RIGHT, FULL)
4. **WHERE**: Filter conditions at row level
5. **GROUP BY**: Columns for aggregation grouping
6. **HAVING**: Conditions on aggregated values
7. **ORDER BY**: Sorting criteria and direction (ASC/DESC)
8. **LIMIT**: Limiting result cardinality

**Example**:
```
Question: "List each department's average salary, showing only those
           with average salary exceeding $50,000, ordered by highest salary"

Decomposition:
1. SELECT: department.name, AVG(employee.salary)
2. FROM: employee, department
3. JOIN: employee.department_id = department.id
4. WHERE: (none)
5. GROUP BY: department.id
6. HAVING: AVG(employee.salary) >= 50000
7. ORDER BY: AVG(employee.salary) DESC
8. LIMIT: (none)
```

#### 3.2.3 Query Plan Agent

**Purpose**: Generates a step-by-step execution plan with Chain-of-Thought (CoT) reasoning.

**Input**:
- Natural language question
- Clause-level decomposition from Subproblem Agent
- Schema information from Schema Linking Agent

**Output**:
- Step-by-step execution plan
- Detailed reasoning for each step (CoT)
- Potential pitfalls and considerations

**Operational Details**:
```
Step 1: Identify Required Tables
  - employee table needed for salary information
  - department table needed for department information
  - Join field: employee.department_id = department.id

Step 2: Analyze Conditions
  - WHERE conditions: no basic filtering
  - GROUP BY: aggregation needed by department.id
  - Average salary calculation needed per group

Step 3: Apply Filtering
  - HAVING: filter groups with AVG(salary) >= 50000
  - This is a group-level filter, applied after GROUP BY

Step 4: Sorting
  - Order by average salary in descending order (highest first)
  - ORDER BY AVG(salary) DESC

Step 5: Potential Pitfalls
  - Handle NULL salary values appropriately
  - All non-aggregated columns must be in GROUP BY clause
```

**CoT Reasoning Example**:
```
"The question asks for department-level salary statistics. First, join
employee and department to link salary information with departments.
Then use GROUP BY department.id to aggregate by department. Calculate
the average salary within each group using AVG(salary). The HAVING clause
filters to only departments with average salary >= $50,000. Finally,
order by highest average salary using ORDER BY AVG(salary) DESC."
```

#### 3.2.4 SQL Agent

**Purpose**: Synthesizes all information to generate executable SQL.

**Input**:
- Natural language question
- Execution plan from Query Plan Agent
- Clause decomposition from Subproblem Agent
- Schema information from Schema Linking Agent

**Output**:
- Complete, executable SQL query
- Reasoning for query generation

**Operational Details**:
1. Construct each SQL clause sequentially following the query plan
2. Reference schema information for accurate table and column names
3. Adhere to SQL syntax conventions
4. Consider edge cases (NULL handling, duplicate removal, etc.)

**Generated SQL Example**:
```sql
SELECT
  d.name AS department_name,
  AVG(e.salary) AS avg_salary
FROM employee e
INNER JOIN department d ON e.department_id = d.id
GROUP BY d.id, d.name
HAVING AVG(e.salary) >= 50000
ORDER BY avg_salary DESC;
```

#### 3.2.5 Correction Plan Agent

**Purpose**: Analyzes execution failures and formulates systematic correction strategies using the error taxonomy.

**Input**:
- Original natural language question
- Generated SQL query that failed
- Error message from database
- Database execution result (error type)
- Error taxonomy (guidance)

**Output**:
- Error classification (major + specific categories)
- Root cause analysis
- Correction strategy and step-by-step actions

**Operational Details**:
Upon execution failure, the Correction Plan Agent:
1. Identifies error type from 31 specific categories
2. Performs root cause analysis
3. Formulates correction strategy
4. Documents specific adjustments needed

**Example**:
```
Original SQL: SELECT * FROM employee WHERE department = "Sales"
Error: Column "department" not found
Classification: Schema Linking Errors > col_missing

Analysis:
- Column "department" does not exist in the schema
- Actual structure: department_id in employee, name in department table

Correction Plan:
1. Re-execute Schema Linking: identify correct columns and tables
2. Update Subproblem: add join with department table
3. Regenerate SQL: incorporate correct join and filter conditions
```

#### 3.2.6 Correction SQL Agent

**Purpose**: Generates corrected SQL based on the Correction Plan.

**Input**:
- Correction plan from Correction Plan Agent
- Original natural language question
- Original SQL and error information
- Database schema

**Output**:
- Corrected SQL query
- Explanation of corrections

**Operational Details**:
1. Follow Correction Plan directives for SQL modification
2. Address identified root causes
3. Validate syntax
4. Verify database compatibility

**Example**:
```sql
-- Before correction
SELECT * FROM employee WHERE department = "Sales"

-- After correction
SELECT e.*
FROM employee e
INNER JOIN department d ON e.department_id = d.id
WHERE d.name = "Sales"
```

### 3.3 Error Taxonomy

A cornerstone innovation of SQL-of-Thought is the systematic error taxonomy, enabling precise error diagnosis and structured correction guidance.

#### 3.3.1 Taxonomy Structure

Nine major categories encompassing 31 specific sub-categories:

##### 1. **Syntax Errors** (2 sub-categories)

| Sub-category | Description | Example |
|---|---|---|
| `sql_syntax_error` | Violation of SQL syntax rules | SELECT * FROM table WHRE condition (typo: WHERE) |
| `invalid_alias` | Improper alias usage | SELECT name AS n FROM employee GROUP BY name (alias in GROUP BY) |

##### 2. **Filter Errors** (3 sub-categories)

| Sub-category | Description | Example |
|---|---|---|
| `where_missing` | Required WHERE clause absent | "Sales after 2020" query missing year filter |
| `condition_wrong_col` | Incorrect column in filter | "Age over 25" query using birth_year instead of age column |
| `condition_type_mismatch` | Condition type incompatible with column | Numeric comparison on text column, numeric value for DATE filter |

##### 3. **Value Errors** (2 sub-categories)

| Sub-category | Description | Example |
|---|---|---|
| `hardcoded_value` | Hard-coded literal values in query | "Employees of Company X" query using company_id=123 instead of company_name='X' |
| `value_format_wrong` | Incorrect value format | Date filter using "01/01/2020" instead of "2020-01-01" format |

##### 4. **Aggregation Errors** (4 sub-categories)

| Sub-category | Description | Example |
|---|---|---|
| `agg_no_groupby` | Aggregate function without GROUP BY | SELECT name, COUNT(*) FROM employee (name not in GROUP BY) |
| `groupby_missing_col` | Missing columns in GROUP BY | "Average salary per department" without department in GROUP BY |
| `having_without_groupby` | HAVING without GROUP BY | HAVING AVG(salary) > 50000 without GROUP BY clause |
| `having_incorrect` | Inaccurate HAVING condition | "Average > 50000" expressed as HAVING MAX(salary) > 50000 |

##### 5. **Schema Linking Errors** (4 sub-categories)

| Sub-category | Description | Example |
|---|---|---|
| `table_missing` | Required table omitted | Department information needed but only employee table used |
| `col_missing` | Required column omitted | "Employee name" field needed but only employee_id selected |
| `ambiguous_col` | Unqualified column appearing in multiple tables | SELECT id FROM employee, department (both have id column) |
| `incorrect_foreign_key` | Wrong foreign key relationship | employee.dept_id = department.department_id (incorrect field name) |

##### 6. **Join Errors** (4 sub-categories)

| Sub-category | Description | Example |
|---|---|---|
| `join_missing` | Required join not performed | Department name needed but employee table used alone |
| `join_wrong_type` | Incorrect join type | INNER JOIN used instead of LEFT JOIN |
| `extra_table` | Unnecessary table included | Unneeded table in FROM clause |
| `incorrect_col` | Inaccurate join column | employee.dept = department.id (type mismatch) |

##### 7. **Subquery Errors** (3 sub-categories)

| Sub-category | Description | Example |
|---|---|---|
| `unused_subquery` | Subquery not utilized | SELECT * FROM employee WHERE (SELECT MAX(salary) ...) (subquery result unused) |
| `subquery_missing` | Required subquery absent | "Highest-paid employee per department" query missing subquery |
| `subquery_correlation_error` | Correlated subquery reference error | Subquery incorrectly references outer query tables |

##### 8. **Set Operations Errors** (3 sub-categories)

| Sub-category | Description | Example |
|---|---|---|
| `union_missing` | UNION needed but unused | Multiple conditions requiring UNION instead of OR |
| `intersect_missing` | INTERSECT needed but unused | "Satisfies both conditions" needing INTERSECT |
| `except_missing` | EXCEPT needed but unused | "A but not B" condition requiring EXCEPT |

##### 9. **Other Issues** (3+ sub-categories)

| Sub-category | Description | Example |
|---|---|---|
| `order_by_missing` | ORDER BY needed but absent | "Ranked results" missing sorting |
| `limit_missing` | LIMIT needed but absent | "Top 10 results" missing LIMIT |
| `duplicate_select` | Duplicate selected columns | SELECT name, name, salary FROM employee |
| (Additional) | Other unclassified errors | — |

#### 3.3.2 Taxonomy Application

The Correction Plan Agent leverages this taxonomy as follows:

1. **Error Diagnosis**: Classify execution error into one of 31 specific categories
2. **Root Cause Identification**: Derive fundamental issues from error classification
3. **Correction Guidance**: Provide category-specific remediation strategies
4. **Error Pattern Tracking**: Monitor recurring error types to enhance learning

## 4. Experimental Setup

### 4.1 Datasets

SQL-of-Thought is evaluated on multiple text-to-SQL benchmarks:

#### 4.1.1 Spider

**Overview**: Spider is the most widely-used text-to-SQL benchmark.
- **Composition**:
  - 143 databases
  - 10,181 question-SQL pairs
  - Development set (Dev): 1,034 samples
- **Characteristics**:
  - Diverse database structures (schemas)
  - Complex queries requiring multiple techniques
  - Joins, subqueries, aggregations, etc.
  - Realistic database complexity

#### 4.1.2 Spider-Realistic

**Overview**: Extended version of Spider reflecting more realistic database environments.
- **Composition**: 508 samples
- **Characteristics**:
  - Larger database schemas
  - Complex business logic
  - Real-world database query patterns
  - Higher difficulty level

#### 4.1.3 Spider-SYN

**Overview**: Syntactic variants reflecting diverse SQL expressions.
- **Composition**: Hundreds of syntactic variations
- **Characteristics**:
  - Multiple SQL expressions for identical semantics
  - Generalization capability assessment

### 4.2 Baseline Models

The evaluation includes the following LLMs:

1. **Claude 3 Opus** - Primary model (Anthropic)
2. **GPT-5** - Latest generation (OpenAI)
3. **GPT-4o-mini** - Lightweight high-performance (OpenAI)
4. **GPT-3.5** - Legacy model (OpenAI)
5. **Llama-3.1-8B** - Open-source model (Meta)
6. **Qwen2.5-1.5B** - Lightweight open-source (Alibaba)

### 4.3 Hardware and Computational Resources

- **GPUs**: 2 NVIDIA H100 (80GB HBM each)
- **Purpose**:
  - Local model execution (Llama, Qwen)
  - Parallel processing capabilities
  - Potential for concurrent agent execution

### 4.4 Hyperparameters and Settings

- **Temperature**: 0 (deterministic generation, optimal quality)
- **Max tokens**: Configured per model
- **Evaluation Metric**: Execution Accuracy (EA)
  - Evaluates whether generated SQL produces correct results when executed
  - Emphasizes execution correctness over syntactic correctness

## 5. Experimental Results

### 5.1 Main Results (Table 1)

Execution accuracy comparison on Spider and Spider-Realistic:

| Method | Model | Spider | Spider-Realistic |
|---|---|---|---|
| ChatGPT | ChatGPT | 74.4% | — |
| GPT-4 | GPT-4 | 72.3% | — |
| ACT-SQL | ChatGPT | 80.4% | 75.8% |
| DIN-SQL | GPT-4 | 82.8% | 78.1% |
| DAIL-SQL | GPT-4 | 83.1% | 75.6% |
| MAC-SQL | GPT-4 | 86.8% | — |
| Tool-SQL | GPT-4 | 86.9% | 82.9% |
| ChaseSQL | — | 87.6% | — |
| **SQL-of-Thought** | **Claude 3 Opus** | **91.59%** | **90.16%** |
| SQL-of-Thought | — | **82.01%** | — |
|  | | (Spider-SYN) |  |

#### 5.1.1 Results Analysis

1. **Absolute Performance Superiority**
   - Spider: 91.59% (previous best: 87.6%, +3.99%p)
   - Spider-Realistic: 90.16% (previous best: 82.9%, +7.26%p)
   - Spider-SYN: 82.01%

2. **Per-Dataset Strengths**
   - Particularly pronounced improvement on Spider-Realistic
   - Demonstrates multi-agent approach advantages in complex environments
   - Robust handling of intricate schemas

3. **Inter-Model Comparison**
   - Claude 3 Opus superiority demonstrated
   - GPT series models achieve competitive performance (see ablation)
   - Open-source models achieve substantial performance (near GPT-3.5 levels)

### 5.2 Ablation Study

Results on 100-sample subset (Table 2):

| Model | Full System | w/o Error Correction | w/o Query Plan |
|---|---|---|---|
| Claude 3 Opus | 95% | 85% | 90% |
| GPT-5 | 89% | 85% | 88% |
| GPT-4o-Mini | 87% | 72% | 79% |
| GPT-3.5 | 67% | 59% | 73% |

#### 5.2.1 Ablation Analysis

**1. Importance of Error Correction**

- **Claude 3 Opus**: 85% → 95% (+10%p)
- **GPT-5**: 85% → 89% (+4%p)
- **GPT-4o-Mini**: 72% → 87% (+15%p)
- **GPT-3.5**: 59% → 67% (+8%p)

Key Findings:
- Error correction mechanism particularly valuable for lightweight models (GPT-4o-Mini)
- Substantial improvement even for high-capacity models (Claude 3 Opus)
- Systematic error taxonomy effectiveness demonstrated

**2. Importance of Query Plan**

- **Claude 3 Opus**: 90% → 95% (+5%p)
- **GPT-5**: 88% → 89% (+1%p)
- **GPT-4o-Mini**: 79% → 87% (+8%p)
- **GPT-3.5**: 73% → 67% (-6%p)

Interesting Observations:
- Query planning provides structured reasoning valuable for complex queries
- Particularly effective for mid-tier models (GPT-4o-Mini)
- Negative effect for GPT-3.5 suggests possible over-decomposition errors

**3. Combined Effects**

- Error Correction + Query Plan synergy exceeds individual effects
- Components mutually reinforce each other
- 95% (Claude) - 59% (GPT-3.5) = 36%p cumulative improvement

### 5.3 Error Distribution

Error type frequency distribution:

| Error Type | Frequency (%) | Key Characteristics |
|---|---|---|
| Schema Linking Errors | ~25% | Most frequent; requires accurate column/table identification |
| Aggregation Errors | ~20% | GROUP BY-related; complex aggregation logic |
| Join Errors | ~18% | Table relationship understanding challenges |
| Filter Errors | ~15% | WHERE condition precision |
| Subquery Errors | ~12% | Complex nested query handling |
| Other | ~10% | Remaining error types |

## 6. Cost Analysis

### 6.1 Execution Costs

Cost for full Spider dataset (1,034 samples):

| Model | Cost | Notes |
|---|---|---|
| Claude 3 Opus (full system) | ~$42.58 | All 6 agents executed |
| Claude 3 Opus (hybrid) | ~$30 | Selective agent execution |

Cost Calculation:
- **Claude 3 Opus input price**: ~$3/1M tokens
- **Claude 3 Opus output price**: ~$15/1M tokens
- **Efficiency**: 91.59% accuracy represents cost-effective performance

### 6.2 Execution Speed

Sequential agent execution timing:
- Average per-query execution: ~5-10 seconds (without error correction)
- With error correction: ~10-20 seconds additional
- Parallelization potential for further optimization

## 7. Conclusions and Discussion

### 7.1 Key Contributions

1. **Multi-agent Framework Effectiveness**
   - Six specialized agents enable systematic decomposition
   - Each agent's specialized role reduces errors
   - Sequential validation enhances quality

2. **Systematic Error Taxonomy**
   - Comprehensive 31-category classification
   - Structured error diagnosis and remediation
   - Transfer learning potential

3. **State-of-the-art Performance**
   - Spider: 91.59% (best performing)
   - Spider-Realistic: 90.16% (particularly strong in realistic settings)
   - 3-7%p improvement over existing methods

4. **Generalization Capability**
   - Applicable to diverse model architectures
   - Effective for open-source models
   - Consistent performance across datasets

### 7.2 Limitations and Future Work

1. **Computational Cost**
   - Sequential execution of six agents increases cost
   - Parallelization optimization needed
   - Lightweight agent configurations to be explored

2. **Model Dependency**
   - Optimal performance with Claude 3 Opus
   - Performance variance across models
   - Model-agnostic optimization directions needed

3. **Scalability**
   - Evaluation on more complex queries (window functions, CTEs) needed
   - Multiple SQL dialect support assessment required
   - Multilingual query support exploration

4. **Error Taxonomy Refinement**
   - Verification that 31 categories comprehensively cover all errors
   - Potential category overlaps
   - More refined hierarchical structure needed

### 7.3 Practical Applications

1. **Database Interfaces**
   - Natural language database query chatbots
   - Enabling non-experts to formulate complex queries

2. **Code Generation Support**
   - Developer productivity enhancement
   - SQL query validation and optimization tools

3. **Data Analytics**
   - Data analyst workflow automation
   - Rapid exploratory analysis capabilities

4. **Education and Learning**
   - SQL learning support systems
   - Query writing error diagnosis and feedback

### 7.4 Impact and Significance

This research represents important progress in several dimensions:

1. **LLM Application Paradigm Evolution**
   - Advancement from simple prompting to multi-agent systems
   - Structured error handling importance demonstrated

2. **Code Generation Frontier**
   - Natural language to code generation advances
   - Improved accuracy and reliability

3. **Human-AI Collaboration**
   - Systematic approaches enhance trustworthiness
   - Complex task automation possibilities

## 8. References

- **Paper**: SQL-of-Thought: Multi-agentic Text-to-SQL with Guided Error Correction
- **Authors**: Saumya Chaturvedi, Aman Chadha, Laurent Bindschaedler
- **Venue**: NeurIPS 2025, Deep Learning for Code Workshop
- **arXiv**: 2509.00581
- **Benchmarks**: Spider, Spider-Realistic, Spider-SYN
- **Related Works**: ACT-SQL, DIN-SQL, DAIL-SQL, MAC-SQL, Tool-SQL, ChaseSQL

---

**Date**: April 1, 2026
**Category**: Research Notes - Text-to-SQL, LLM, Multi-Agent Systems
