---
title: "Next-Generation Database Interfaces: A Survey of LLM-based Text-to-SQL"
date: 2026-04-01
summary: "A comprehensive survey published in IEEE TKDE 2025 on LLM-based Text-to-SQL systems. This work provides an extensive taxonomy of approaches (ICL and Fine-tuning), technical challenges, benchmark analysis, and state-of-the-art results including GPT-4 achieving 85.3% EX on Spider."
tags: [LLM, Text-to-SQL, Survey, TKDE, ICL, Fine-tuning, Spider, BIRD, Research Notes]
category: Research Notes
language: en
---

## Overview

This post provides a comprehensive analysis of "Next-Generation Database Interfaces: A Survey of LLM-based Text-to-SQL," published in IEEE Transactions on Knowledge and Data Engineering (TKDE), Volume 37, Issue 12, December 2025. Authored by researchers from Hong Kong Polytechnic University, City University of Macau, and Jinan University, this survey systematically reviews the latest developments, technical challenges, and solutions in LLM-based Text-to-SQL systems.

**Paper Metadata:**
- Authors: Zijin Hong, Zheng Yuan, Qinggang Zhang, Hao Chen, Junnan Dong, Feiran Huang, Xiao Huang
- Journal: IEEE Transactions on Knowledge and Data Engineering (TKDE)
- Volume/Issue: Vol. 37, Issue 12, Pages 7328-7345, December 2025
- DOI: 10.1109/TKDE.2025.3609486
- arXiv: 2406.08426

---

## 1. Introduction

Text-to-SQL is the task of converting natural language queries into structured SQL statements. Traditionally, this required complex pipelines and domain expertise, but the emergence of Large Language Models (LLMs) has opened new possibilities and dramatically transformed the landscape.

### 1.1 Background and Significance

Databases are the backbone of modern information systems. However, writing SQL queries presents a high technical barrier that prevents non-expert users from directly accessing data. Text-to-SQL systems remove this barrier by enabling:

- **Improved Accessibility**: Non-technical users can query databases using natural language
- **Increased Productivity**: Data analysts and developers can work more efficiently
- **Accelerated Decision-Making**: Data-driven decisions can be made faster

The advancement of LLMs has dramatically improved these systems. State-of-the-art models like GPT-4 and Claude can generate complex SQL queries, and through In-Context Learning (ICL) approaches, they achieve impressive performance without additional training. Recent models like DeepSeek-R1 have reached even higher accuracy levels, demonstrating the rapid progress in this field.

### 1.2 Scope and Objectives of the Survey

This survey provides a comprehensive analysis of LLM-based Text-to-SQL systems:

- **Methodological Approaches**: Detailed taxonomy of In-Context Learning (ICL) and Fine-Tuning (FT) methods
- **Technical Challenges**: Linguistic complexity, schema understanding, complex SQL operations, cross-domain generalization
- **Benchmark Analysis**: Comprehensive review of Spider, WikiSQL, BIRD, and CoSQL datasets
- **State-of-the-Art Results**: Latest experimental results and performance comparisons across different methods
- **Future Directions**: Identification of open challenges and promising research directions

---

## 2. Technical Challenges

Text-to-SQL presents multiple technical challenges that significantly constrain LLM performance. Understanding these challenges is essential for developing robust solutions.

### 2.1 Linguistic Complexity

The diversity and ambiguity of natural language expressions significantly impact SQL generation:

- **Synonymous Expressions**: "number of employees in the company" and "employee count" express the same meaning differently
- **Implicit References**: Difficulty in resolving pronouns like "it" and "that"
- **Quantitative Expressions**: Translating qualitative terms like "many" and "few" into quantitative constraints
- **Temporal Expressions**: Interpreting relative time expressions such as "last year" and "the past three months"
- **Complex Linguistic Structures**: Handling negations and compound sentences like "neither A nor B"

### 2.2 Schema Understanding

Understanding database schemas is essential for accurate SQL generation:

- **Table Linking**: Determining which tables contain the required information
- **Column Linking**: Mapping natural language phrases to corresponding database columns
- **Semantic Understanding**: Understanding the relationship between column/table names and actual data semantics
- **Token Length Limitations**: Large schemas cannot be fully included in prompts due to token limits
- **Domain-Specific Terminology**: Understanding domain-specific terms in medicine, finance, science, etc.

### 2.3 Complex SQL Operations

SQL supports diverse operations whose combinations increase task complexity:

- **Aggregation Functions**: Correct usage of COUNT, SUM, AVG, MAX, MIN, etc.
- **JOIN Operations**: Complex multi-table JOINs (INNER, LEFT, RIGHT, FULL OUTER)
- **GROUP BY and HAVING**: Proper application of grouping and filtering conditions
- **Nested Subqueries**: Correct structuring of deeply nested queries
- **Window Functions**: Advanced functions like ROW_NUMBER, RANK, LEAD, LAG
- **Set Operations**: Combining queries using UNION, INTERSECT, EXCEPT
- **Conditional Logic**: Complex CASE statements for conditional expressions

### 2.4 Cross-Domain Generalization

Maintaining performance when transferring models to unseen domains remains a significant challenge:

- **Domain Bias**: Models trained on specific domains experience performance degradation on others
- **Vocabulary Diversity**: Domain-specific terminology and concepts vary widely
- **Schema Diversity**: Different domains use different database structures
- **Task Specificity**: Domain-specific query patterns and execution patterns differ

---

## 3. Methodology Taxonomy

The survey classifies LLM-based Text-to-SQL approaches into two primary categories:

### 3.1 In-Context Learning (ICL) Based Methods

In-Context Learning guides model behavior through prompting without additional training. This approach has become dominant due to the availability of powerful foundation models.

#### 3.1.1 Vanilla Prompting

The simplest form of prompting, combining user queries with database schema information:

```
You are a SQL expert.

Database Schema:
- employees table: id, name, department, salary
- departments table: id, name, location

Convert the following query to SQL:
"What is the average salary of all employees in the Engineering department?"

SQL:
```

**Advantages:**
- Simple and fast implementation
- No additional training required
- High interpretability

**Disadvantages:**
- Poor performance on complex queries
- Inconsistent output quality
- Token inefficiency

#### 3.1.2 Decomposition Strategies

Breaking complex problems into multiple smaller tasks enables more accurate solutions:

**Chain-of-Thought (CoT) Decomposition:**
Instead of directly converting natural language to SQL, the model first performs intermediate reasoning:

```
Query: "Who is the customer who made the most orders in 2024,
        and what is their total order amount?"

Step 1: What information is needed?
- Customer information (customers table)
- Order information (orders table)
- Order dates and amounts needed
- Filter for 2024

Step 2: What JOINs and operations are needed?
- JOIN customers and orders on customer_id
- Filter for 2024
- Aggregate by customer (order count and total amount)
- Sort by order count

Step 3: Generated SQL
SELECT c.name, COUNT(o.id) as order_count, SUM(o.amount) as total_amount
FROM customers c
JOIN orders o ON c.id = o.customer_id
WHERE YEAR(o.order_date) = 2024
GROUP BY c.id, c.name
ORDER BY order_count DESC
LIMIT 1;
```

**Example-Based Decomposition:**
Providing similar examples allows the model to learn patterns implicitly through few-shot learning.

#### 3.1.3 Prompt Optimization

Optimizing prompt structure and content improves model performance:

- **In-Context Example Selection**: Selecting and including high-relevance examples
- **Schema Description Optimization**: Making descriptions clear, concise, and well-structured
- **Example Ordering**: Progressively increasing difficulty from simple to complex examples
- **Format Specification**: Explicitly specifying output format requirements
- **Domain-Adapted Prompts**: Including domain-specific terminology and concepts

#### 3.1.4 Reasoning Enhancement

Enhancing reasoning capabilities to guide more accurate SQL generation:

- **Logical Chaining**: Providing logical justification for each reasoning step
- **Back-tracing**: Tracing backward from the final answer to identify necessary information
- **Multi-Path Exploration**: Presenting multiple possible SQL interpretations and selecting the correct one
- **External Knowledge Integration**: Incorporating common sense and domain knowledge

#### 3.1.5 Execution Refinement and Self-Correction

Verifying generated SQL, identifying errors, and automatically correcting them:

```
Initial Generated SQL:
SELECT name, AVG(salary) FROM employees GROUP BY name;

Execution Error: "salary is not in GROUP BY clause"

Self-Corrected SQL:
SELECT name, AVG(salary) as avg_salary FROM employees
GROUP BY name;
```

**Execution-Based Learning:**
- Execute generated SQL against actual databases
- Use error messages as feedback
- Learn correction patterns from failures
- Iteratively improve through multiple interactions

**Virtual Execution:**
- Validate SQL structure without actual database access
- Verify table/column existence
- Check type compatibility

### 3.2 Fine-Tuning (FT) Based Methods

Fine-tuning adapts models to the Text-to-SQL task through additional training on task-specific data.

#### 3.2.1 Enhanced Architectures

Improving the Transformer architecture specifically for Text-to-SQL:

**Schema Encoders:**
- Encode database schemas in structured formats
- Explicitly model relationships between tables and columns
- Utilize graph neural networks (GNN) to capture schema structure

**Column-Binding Mechanisms:**
- Precisely determine which columns to bind for each natural language phrase
- Apply attention mechanisms with pointer networks
- Address ambiguity in multi-column selection scenarios

**SQL Grammar-Guided Decoding:**
- Enforce SQL grammar rules during generation
- Prevent invalid SQL generation
- Apply constrained beam search

#### 3.2.2 Pre-training Approaches

Task-specific pre-training for Text-to-SQL:

**Dynamic SQL Generation:**
- Automatically generate (natural language, SQL) pairs from arbitrary database schemas
- Acquire training data for diverse query patterns

**Schema Linking Pre-training:**
- Pre-train on relationships between natural language and schema elements
- Use as foundation for downstream SQL generation

**Auxiliary Task Learning:**
- Semantic similarity learning
- Schema classification
- These auxiliary tasks improve main task performance

#### 3.2.3 Data Augmentation

Expanding limited training data:

**Query Augmentation:**
- Generate diverse natural language expressions with identical meaning
- Synonym replacement
- Paraphrasing

**SQL Equivalent Transformation:**
- Generate multiple SQL structures with identical results
- Example: `SELECT * FROM employees WHERE salary > 50000` →
  `SELECT * FROM employees WHERE NOT salary <= 50000`
- Join reordering, subquery optimization

**Schema Generalization:**
- Map learning data schemas to different domains
- Generalize table/column names
- Enhance transfer learning across domains

**Synthetic Data Generation:**
- Template-based data generation
- Programmatic (natural language, SQL) pair creation
- Concentrated generation for specific query types or difficulty levels

#### 3.2.4 Multi-task Training

Learning multiple related tasks simultaneously improves generalization:

**Key Multi-task Combinations:**

| Main Task | Auxiliary Task | Expected Benefit |
|-----------|----------------|------------------|
| Text-to-SQL | Schema Linking | Improved table/column selection accuracy |
| Text-to-SQL | SQL Validation | Reduced grammatical errors |
| Text-to-SQL | NL Generation (SQL→NL) | Deeper semantic understanding |
| Text-to-SQL | Semantic Similarity | Learning semantically equivalent SQL |
| Text-to-SQL | Cross-lingual Translation | Enhanced multilingual understanding |

**Training Strategies:**
- Hard Parameter Sharing: All tasks use identical encoder/decoder
- Soft Parameter Sharing: Task-specific layers combined with shared components
- Task-Weighted Optimization: Higher weights for main tasks, lower for auxiliary tasks

---

## 4. Benchmarks and Evaluation Datasets

Multiple large-scale benchmarks have been developed to evaluate Text-to-SQL systems.

### 4.1 Spider

**Composition:**
- **Total Queries**: 10,181 natural language questions
- **SQL Patterns**: 5,693 unique SQL queries
- **Databases**: 200 databases
- **Domains**: 138 different domains

**Key Characteristics:**
- Extensive domain coverage (restaurants, airlines, healthcare, finance, etc.)
- Complex SQL including JOINs, GROUP BY, HAVING, subqueries
- Enables evaluation of domain generalization ("zero-shot on unseen domains")
- Most widely used benchmark in the research community

**Primary Evaluation Metrics:**
- **Exact Match (EM)**: Percentage of exactly matching generated vs. gold-standard SQL
- **Component Match (CM)**: Percentage of correctly generated SQL components (SELECT, FROM, WHERE, etc.)
- **Execution Match (EX)**: Percentage of generated SQL returning identical results to gold-standard

### 4.2 WikiSQL

**Composition:**
- **Total Pairs**: 80,654 (natural language, SQL) pairs
- **Tables**: 24,241 tables
- **Domain**: Primarily Wikipedia tables

**Key Characteristics:**
- Larger scale dataset than Spider
- Relatively simple SQL (primarily single-table queries)
- Extensively used in early Text-to-SQL research
- Valuable for large-scale data requirements

**Primary Evaluation Metrics:**
- **EM**: Percentage of exactly matching SQL
- **SQL Accuracy**: Accuracy in generating SELECT, WHERE, AGG clauses

### 4.3 BIRD (Beyond In-Domain Reasoning Database Question Answering)

**Composition:**
- **Total Examples**: 12,751 examples
- **Databases**: 95 databases
- **Special Characteristics**: Requires external knowledge beyond database information
- **Challenge Level**: Very difficult benchmark for cross-domain evaluation

**Key Characteristics:**
- Requires external domain knowledge (e.g., medical terminology, drug interactions)
- Evaluates cross-domain generalization and knowledge integration
- Includes realistic foreign key and primary key constraints
- Significantly more challenging than Spider

**Primary Evaluation Metrics:**
- EM and EX metrics plus additional execution-based evaluation

### 4.4 CoSQL (Conversational SQL)

**Composition:**
- Conversational SQL generation benchmark
- Multi-turn question-answer interactions
- SQL generation in conversational context

**Key Characteristics:**
- Reflects real conversational complexity
- Considers dialogue history and context
- Requires adaptive query generation across dialogue turns

---

## 5. Experimental Results and Analysis

### 5.1 In-Context Learning Results

#### Table 1: Spider Benchmark Performance for GPT-4 and Latest LLMs

| Model | Approach | EM (%) | EX (%) | Key Characteristics |
|-------|----------|--------|--------|-------------------|
| GPT-4 | Vanilla Prompting | 72.1 | 78.5 | Basic prompting only |
| GPT-4 | Few-shot (5-shot) | 78.9 | 84.2 | 5 examples included |
| GPT-4 | CoT (Chain-of-Thought) | 81.5 | 85.3 | Step-by-step reasoning |
| GPT-4 | CoT + Decomposition | 85.3 | 88.1 | Problem decomposition + reasoning |
| Claude-3 | Few-shot (5-shot) | 79.2 | 85.1 | - |
| Claude-3 | CoT + Schema Optimization | 83.7 | 87.2 | Optimized schema descriptions |
| DeepSeek-R1 | Zero-shot | 88.40 | 91.2 | Reasoning-specialized model |
| DeepSeek-R1 | Few-shot | 89.50 | 92.1 | - |

**Analysis:**

1. **Reasoning Enhancement Effectiveness**: CoT approach shows 9.4 percentage point improvement over vanilla prompting
2. **Problem Decomposition Impact**: Further 4 percentage point improvement when decomposing problems systematically
3. **Model Performance Gap**: DeepSeek-R1's 88.40% zero-shot performance is comparable to GPT-4 with CoT
4. **Schema Optimization Effect**: Clear schema descriptions provide 2-3 percentage point improvement

#### Table 2: Impact of Prompt Optimization Techniques (GPT-4 Baseline)

| Optimization Technique | EM (%) | EX (%) | Improvement |
|------------------------|--------|--------|-------------|
| Baseline Prompt | 72.1 | 78.5 | - |
| Add Examples (1-shot) | 74.3 | 80.2 | +2.2pp |
| Add Examples (3-shot) | 76.5 | 82.8 | +4.4pp |
| Add Examples (5-shot) | 78.9 | 84.2 | +6.8pp |
| Domain-Related Example Selection | 81.2 | 86.1 | +9.1pp |
| Schema Description Optimization | 77.5 | 83.5 | +5.4pp |
| Format Specification (Few-shot + Format) | 80.2 | 85.7 | +8.1pp |
| All Techniques Combined | 85.3 | 88.1 | +13.2pp |

**Key Findings:**

1. **In-Context Examples Importance**: Performance improves with more examples up to saturation point (5-shot)
2. **Relevant Example Selection**: Domain-related examples are 9.1pp more effective than random selection
3. **Schema Description Optimization**: Clear, concise schema descriptions significantly improve performance
4. **Technique Combination**: Multiple techniques combined are far more effective than single techniques

### 5.2 Fine-Tuning Based Results

#### Table 3: Spider Performance with Various Fine-tuning Strategies

| Method | Base Model | EM (%) | EX (%) | Training Data Size |
|--------|-----------|--------|--------|------------------|
| Basic Fine-tuning | BERT-Large | 62.3 | 70.1 | 10,181 |
| Schema Encoder | BERT-Large | 68.5 | 76.2 | 10,181 |
| Column-Binding Mechanism | BERT-Large | 70.1 | 78.5 | 10,181 |
| SQL Grammar Guiding | BERT-Large | 71.2 | 79.8 | 10,181 |
| All Techniques Combined | BERT-Large | 75.3 | 84.1 | 10,181 |
| Data Augmentation (2x) | BERT-Large | 72.8 | 81.5 | 20,362 |
| Data Augmentation (3x) + Multi-task | BERT-Large | 78.9 | 86.3 | 30,543 |
| T5-3B | - | 73.2 | 82.1 | 10,181 |
| T5-3B + Multi-task | - | 79.4 | 87.6 | 10,181 |

**Analysis:**

1. **Architecture Improvement Impact**: Individual techniques (schema encoder, column-binding) each provide 6-8pp improvement
2. **Grammar Guiding Effect**: SQL grammar constraints provide 1-2pp improvement by reducing errors
3. **Data Augmentation Effect**: 2x data increase yields 10-15% performance improvement
4. **Multi-task Learning**: 5-7pp improvement compared to single-task training

#### Table 4: Fine-tuning Performance Across Training Data Sizes (T5-3B)

| Training Data Size | EM (%) | EX (%) | Performance Saturation |
|------------------|--------|--------|----------------------|
| 500 | 45.2 | 55.8 | - |
| 1,000 | 52.3 | 63.4 | - |
| 2,000 | 58.7 | 70.1 | - |
| 5,000 | 68.3 | 78.2 | - |
| 10,000 | 73.2 | 82.1 | Beginning |
| 20,000 | 76.1 | 84.9 | Mid-point |
| 30,000 | 78.5 | 86.7 | Progressing |
| 50,000 | 79.8 | 87.5 | Near saturation |

**Key Observations:**

1. **Data Dependency**: Rapid performance improvement begins with 5,000+ examples
2. **Saturation Point**: Performance improvement plateaus around 50,000 examples (≈80% EM)
3. **Low-Resource Performance**: Even 500 examples achieve >45% accuracy

### 5.3 Lightweight Model Performance

#### Table 5: Lightweight Model Performance on LLMSQL Benchmark

| Model | Parameters | Fine-tuning | Spider EM (%) | BIRD EX (%) | WikiSQL EM (%) |
|-------|-----------|------------|---------------|------------|-----------------|
| CodeLLaMA-7B | 7B | No | 38.2 | 18.5 | 72.1 |
| CodeLLaMA-7B | 7B | Yes | 68.5 | 42.3 | 89.2 |
| LLaMA-2-13B | 13B | No | 42.1 | 22.1 | 74.5 |
| LLaMA-2-13B | 13B | Yes | 71.8 | 45.6 | 91.3 |
| Mistral-7B | 7B | No | 41.5 | 21.2 | 73.8 |
| Mistral-7B | 7B | Yes | 70.2 | 44.1 | 90.1 |
| Qwen-7B | 7B | No | 43.8 | 23.4 | 75.2 |
| Qwen-7B | 7B | Yes | 72.1 | 46.2 | 91.8 |
| GPT-3.5-Turbo | 175B (est.) | No | 60.2 | 35.2 | 85.6 |

**Key Findings:**

1. **Lightweight Model Improvement**: Fine-tuning achieves 30pp+ improvement for 7B models
2. **90% Milestone**: WikiSQL achieves 90%+ accuracy with lightweight models after fine-tuning
3. **Spider Challenge**: Lightweight models remain at 70-72% on more complex Spider dataset
4. **Model Convergence**: After fine-tuning, diverse lightweight models show similar performance

### 5.4 Spider 2.0 and BIRD Results

#### Table 6: Latest Results on Spider 2.0 and BIRD

| Benchmark | Evaluation Item | Agent Framework | EM (%) | EX (%) |
|-----------|----------------|-----------------|--------|--------|
| Spider 2.0 | Overall | Self-correcting Agent | 68.3 | 75.2 |
| Spider 2.0 | With JOINs | Self-correcting Agent | 55.2 | 62.1 |
| Spider 2.0 | Aggregation Functions | Self-correcting Agent | 71.4 | 78.5 |
| BIRD | Overall | Iterative Refinement | 52.3 | 58.1 |
| BIRD | Requires External Knowledge | Iterative Refinement | 38.5 | 44.2 |
| BIRD | In-Domain | Iterative Refinement | 68.2 | 74.5 |

**Analysis:**

1. **Spider 2.0 Challenge**: 10-15pp performance drop compared to original Spider
2. **Complex Operations Difficulty**: JOIN queries show lowest performance (55-62%)
3. **External Knowledge Impact**: 20-30pp performance degradation when external knowledge required
4. **Agent-Based Improvement**: Iterative refinement provides 5-10pp performance boost

### 5.5 VES (Verified Execution Similarity) Metric

Recent approaches introduce semantic accuracy metrics beyond exact match:

#### Table 7: VES Metric Analysis

| Method | Model | EM (%) | EX (%) | VES (%) | EX-EM Gap |
|--------|-------|--------|--------|---------|-----------|
| Basic Fine-tuning | T5 | 73.2 | 82.1 | 80.5 | 8.9pp |
| CoT + Execution Refinement | GPT-4 | 85.3 | 88.1 | 87.3 | 2.8pp |
| Schema Optimization | GPT-4 | 81.2 | 86.1 | 85.8 | 4.9pp |
| Self-correcting Agent | GPT-4 | 87.5 | 89.2 | 88.9 | 1.7pp |

**Significance:**

- **EX-EM Gap**: Represents cases where generated SQL is imperfect but returns correct results
- **VES Importance**: In practice, correctness of results matters more than SQL syntax
- **Self-Correction Effectiveness**: Smallest gap (1.7pp) achieved with self-correcting agents

---

## 6. Solutions for Technical Challenges

### 6.1 Schema Linking Bottleneck

**Problem:**
- Cannot include all tables/columns in prompts for large databases
- Token length limits (typically 4K-32K) force information loss

**Solutions:**

1. **Schema Search**
   - Select only schema elements relevant to natural language query
   - Dense retrieval or BM25-based search
   - Accuracy: 85-90% for relevant table retrieval

2. **Hierarchical Schema Representation**
   - Present tables first, add column information on demand
   - 30-40% improvement in token efficiency

3. **Schema Embedding**
   - Represent tables/columns as vectors
   - Calculate similarity to natural language, prioritize relevant elements

### 6.2 Cross-Domain Generalization

**Problem:**
- Spider test set contains both seen and unseen domains
- Performance drops 10-20pp on truly novel domains

**Solutions:**

1. **Domain-Adaptive Data Augmentation**
   - Generate synthetic data reflecting new domain characteristics
   - Acquire domain-specific training data (medical, finance, etc.)

2. **Transfer Learning**
   - Fine-tune with small numbers of new domain examples
   - 3-shot, 5-shot learning achieves 5-10pp improvement

3. **Meta Learning**
   - Train models to adapt quickly to new domains
   - Improve convergence speed in novel domains

### 6.3 Complex SQL Operations

**Problem:**
- Multi-table JOINs, nested queries, window functions remain difficult
- 3+ table JOINs show 10-20pp performance degradation

**Solutions:**

1. **Plan-Based Generation**
   ```
   Step 1: What tables are needed?
   Step 2: What are the JOIN conditions?
   Step 3: What filtering conditions apply?
   Step 4: What grouping and aggregation?
   ```

2. **SQL Templates**
   - Define common query patterns as templates
   - Select appropriate template then fill in specific tables/columns
   - Dramatically reduces structural errors

3. **Compositional Loss Function**
   - Separate loss for each SQL component (SELECT, FROM, WHERE, etc.)
   - Focused learning on weak components

### 6.4 Integration with External Knowledge

**Problem:**
- As shown in BIRD, database information alone is insufficient
- Example: Mapping "heart disease" to database code "CVD"

**Solutions:**

1. **Knowledge Base Integration**
   - Utilize Wikipedia, DBpedia and external knowledge
   - Map natural language expressions to database values

2. **Retrieval Augmented Generation (RAG)**
   - Retrieve external information relevant to query
   - Include retrieved information in prompts
   - 5-10pp improvement on BIRD benchmark

3. **Multi-hop Reasoning**
   - Query intent requires multiple reasoning steps
   - Integrate external knowledge with database information across multiple levels

---

## 7. Model Comparison and Selection Guide

### 7.1 ICL vs Fine-Tuning: When to Use Each

#### Table 8: Comparison of ICL and Fine-tuning Approaches

| Criterion | ICL (GPT-4 CoT) | Fine-tuning (T5-3B) | Superior Method |
|-----------|-----------------|-------------------|-----------------|
| Additional Training Required | No | Yes | ICL |
| Best Performance (Spider) | 85.3% | 79.4% | ICL |
| API Call Cost | High | Low | Fine-tuning |
| Deployment Flexibility | Low | High | Fine-tuning |
| Domain Adaptation Speed | Fast | Slow | ICL |
| Interpretability | High | Low | ICL |
| Token Efficiency | Low | High | Fine-tuning |
| Zero-shot on New Domains | Excellent | Poor | ICL |
| Stability | Moderate | High | Fine-tuning |

**Selection Guide:**

- **Choose ICL when:**
  - Maximum performance is critical
  - Domains change frequently
  - Schema structures are highly diverse
  - Rapid deployment is needed

- **Choose Fine-tuning when:**
  - Cost reduction is important
  - Stable performance is required
  - Working with fixed domain sets
  - Local deployment is needed

### 7.2 Model Size and Recommended Approaches

#### Table 9: Size-Based Model Recommendations

| Model Size | Optimal Approach | Spider EM | Deployment | Cost | Recommended Use |
|-----------|-----------------|----------|-----------|------|-----------------|
| 7B | Fine-tuning | 68-72% | Local Server | Low | Internal Systems |
| 13B | Fine-tuning | 71-75% | Local Server | Low | Small Organizations |
| 70B | Fine-tuning | 75-79% | GPU Cluster | Medium | Mid-scale Services |
| 175B+ (GPT-4, etc.) | ICL | 85%+ | API | High | Maximum Accuracy Needed |

---

## 8. Conclusions and Future Directions

### 8.1 Key Findings

1. **ICL vs Fine-tuning Trade-offs**
   - ICL provides highest performance but high cost
   - Fine-tuning is stable and efficient but slower domain adaptation
   - Hybrid approaches needed for practical applications

2. **Schema Understanding Criticality**
   - Schema-related optimizations account for >20% of performance gains
   - Token-efficient schema representations crucial for future work

3. **Cross-Domain Generalization Challenge**
   - New domain performance degradation remains unsolved
   - 20-30pp performance gap in cross-domain benchmarks persists

4. **Lightweight Model Potential**
   - With proper fine-tuning, 7B models achieve practical performance levels
   - Edge device deployment becomes possible

### 8.2 Technical Progress Directions

1. **Multi-Modal Information Integration**
   - Utilize schema metadata, table statistics, data distribution
   - Include sample data for improved contextual understanding

2. **Agent-Based Approaches**
   - Generate-verify-refine iterative processes
   - Integration with external tools (SQL validators, execution engines)

3. **Human-AI Collaboration Systems**
   - Allow human intervention in uncertain cases
   - Confidence scoring and result explanation

### 8.3 Remaining Open Challenges

1. **Reasoning Complexity**
   - 5+ table JOINs: 40-50% accuracy
   - 3+ level nested queries: 35-45% accuracy

2. **Privacy and Security**
   - Secure access to sensitive databases
   - Metadata exposure prevention

3. **Interpretability**
   - Explaining SQL generation rationale
   - Decision tracing capabilities

4. **Efficiency**
   - Execution latency: 2-5 seconds average (needs improvement)
   - Token consumption: 1-2K tokens per prompt (cost increase)

### 8.4 Industry Application Prospects

Text-to-SQL technology is rapidly being adopted in:

- **Business Intelligence (BI)**: Natural language query features in Tableau, Power BI
- **Data Analytics**: Non-expert exploration of large datasets
- **Enterprise Search**: Natural language search over structured data
- **Conversational Systems**: Database access through chatbots

---

## 9. References and Further Reading

### Paper Information
- **DOI**: 10.1109/TKDE.2025.3609486
- **arXiv**: 2406.08426
- **Full Citation**: Hong, Z., Yuan, Z., Zhang, Q., Chen, H., Dong, J., Huang, F., & Huang, X. (2025). Next-Generation Database Interfaces: A Survey of LLM-based Text-to-SQL. IEEE Transactions on Knowledge and Data Engineering, 37(12), 7328-7345.

### Benchmark Resources
- Spider: https://yale-lily.github.io/spider
- WikiSQL: https://github.com/salesforce/WikiSQL
- BIRD: https://bird-bench.github.io
- CoSQL: https://yale-lily.github.io/cosql

### Recommended Papers
1. "Exploring Compositional Uncertainties of Language Models on Semantic Parsing" - Analyzes few-shot learning uncertainties
2. "In-Context Learning for Text-to-SQL with Schema Linking" - Schema linking optimization techniques
3. "Self-Correcting Language Models for Code Generation" - Self-correction mechanisms

---

## 10. Concluding Remarks

The Text-to-SQL field is rapidly advancing with LLM emergence. GPT-4's 85% performance level demonstrates that practical applications are now feasible. The achievement of 70%+ accuracy through fine-tuning lightweight 7B models enables diverse organizations to deploy this technology.

However, domain generalization, complex query generation, and external knowledge integration remain open challenges. Future research will address these challenges while simultaneously improving efficiency and deployability.

Agent-based approaches and human-AI collaboration systems show particular promise for making Text-to-SQL systems more practical, trustworthy, and widely deployable across diverse organizational contexts.
