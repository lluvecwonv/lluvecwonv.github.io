---
title: "Large Language Model Enhanced Text-to-SQL Generation: A Survey — Paper Summary"
date: 2026-03-31
summary: "This survey systematically classifies LLM-based Text-to-SQL approaches into four categories — Prompt, Fine-Tuning, Task-Training, and LLM Agent — while comprehensively reviewing 20+ datasets and four evaluation metrics (EM, EX, VES, TS). It covers 20+ methods from DIN-SQL to MAC-SQL, providing a detailed taxonomy of backbone models, optimization strategies, and error handling mechanisms."
tags: [LLM, Text-to-SQL, NLP, Prompt Engineering, Fine-Tuning, Survey, 연구노트]
category: 연구노트
language: en
---

This research note summarizes the paper **Large Language Model Enhanced Text-to-SQL Generation: A Survey**.
The authors are Xiaohu Zhu, Qian Li, Lizhen Cui, and Yongkang Liu.

The central question is:

**"How have Text-to-SQL methodologies evolved since the emergence of LLMs, and what are the strengths and limitations of each approach?"**

This survey classifies LLM-based Text-to-SQL methods into four categories — **Prompt, Fine-Tuning, Task-Training, and LLM Agent** — and systematically compares representative models within each category.

## One-Line Summary

A comprehensive survey that classifies LLM-enhanced Text-to-SQL methods into four training strategies (Prompt / Fine-Tuning / Task-Training / LLM Agent), while reviewing 20+ datasets and key evaluation metrics.

## 1. Introduction — What is Text-to-SQL?

![Figure 1: Text-to-SQL Flowchart](/figures/text-to-sql/flowchart.png)
*Figure 1: Flowchart of the Text-to-SQL process. User questions and database schema are collected, processed through prompt engineering and fine-tuning, then passed to an LLM which generates the corresponding SQL query.*

### 1.1 Background

The threshold for learning database query languages such as SQL remains high for ordinary users. The Text-to-SQL task translates natural language queries into SQL commands, enabling users to interact with databases using natural language.

Example:
- **Natural Language Question Q**: "What is the name of the employee with the highest salary?"
- **Database Schema S**: Table: Employees (ID, Name, Salary)
- **Generated SQL**: `SELECT Name FROM Employees ORDER BY Salary DESC LIMIT 1;`

The history of Text-to-SQL dates back to 1973 with the LUNAR system, originally used for querying data about Moon rocks. Early approaches relied on rule-based methods suitable for simple or domain-specific scenarios. As data volumes grew, deep neural network methods based on LSTM and Transformer architectures emerged. Recently, LLMs such as GPT-4 have achieved top performance on the Spider dataset, ushering in a new paradigm.

### 1.2 Four Categories of LLM-based Text-to-SQL

![Figure 2: Text-to-SQL Overview Taxonomy](/figures/text-to-sql/Text-to-SQL.png)
*Figure 2: Overview taxonomy of Text-to-SQL metrics, datasets, and methods.*

1. **Prompt** (No training): Zero-shot, Few-shot, and Chain-of-Thought prompts guide LLMs to generate SQL directly
2. **Fine-Tuning** (Training from pretrained LLMs): Full-parameter or Parameter-Efficient Fine-Tuning (PEFT)
3. **Task-Training** (Training from scratch): Transformer, MoE architectures trained specifically for Text-to-SQL
4. **LLM Agent** (Multiple agents + external tools): Agents collaborate to generate, correct, and verify SQL queries

## 2. Evaluation Metrics

### 2.1 Exact Matching Accuracy (EM)

Requires the model-generated SQL to be **exactly identical** to the ground-truth SQL.

$$EM = \frac{1}{N} \sum_{i=1}^{N} \mathbb{I}(\hat{Y}_i = Y_i)$$

- Limitation: Different SQL queries producing identical results may be marked as incorrect due to syntactic diversity.

### 2.2 Execution Accuracy (EX)

Evaluates whether the **execution result** of the generated SQL matches the ground truth.

$$EX = \frac{1}{N} \sum_{i=1}^{N} \mathbb{I}(f(Q_i, S_i) = A_i)$$

- More practical than EM, but incorrect SQL may coincidentally return correct results.

### 2.3 Valid Efficiency Score (VES)

Evaluates both correctness and **execution efficiency** of generated SQL.

$$VES = \frac{1}{N} \sum_{i=1}^{N} \left( \mathbb{I}(Q_i^{gen} = Q_i^{gold}) \cdot \frac{T_{gold}}{T_{gen}} \right)$$

- Considers the execution time ratio between ground-truth and generated SQL.

### 2.4 Test-suite Accuracy (TS)

Measures model performance across a **diverse test suite** of databases.

$$TS = \frac{1}{N} \sum_{i=1}^{N} \mathbb{I}(f(Q_i, D_i) = R_i)$$

- Measures the strict upper limit of semantic accuracy.

## 3. Datasets

| Dataset | Train | Valid | Test | Turn | Type | Language | Year |
|---|---|---|---|---|---|---|---|
| ATIS | 4,473 | 497 | 448 | Single | Single-Domain | English | 1990 |
| GeoQuery | 600 | - | 280 | Single | Single-Domain | English | 1996 |
| Scholar | 600 | - | 216 | Single | Single-Domain | English | 2017 |
| WikiSQL | 56,355 | 8,421 | 15,878 | Single | Cross-Domain | English | 2017 |
| Spider | - | - | - | Single | Cross-Domain | English | 2018 |
| BIRD | 8,659 | 1,034 | 2,147 | Single | Cross-Domain | English | 2023 |
| CoSQL | 2,164 | 292 | 551 | Multi | Cross-Domain | English | 2019 |
| SParC | 9,025 | 1,203 | 2,498 | Multi | Cross-Domain | English | 2018 |
| CSpider | 6,831 | 954 | 1,906 | Single | Cross-Domain | Chinese | 2019 |
| DuSQL | 18,602 | 2,039 | 3,156 | Single | Cross-Domain | Chinese | 2020 |
| CHASE | 3,949 | 755 | 755 | Multi | Cross-Domain | Chinese | 2021 |
| EHRSQL | 5,124 | 1,163 | 1,167 | Multi | Single-Domain | English | 2023 |
| BEAVER | 93 | - | - | Multi | Cross-Domain | English | 2024 |
| KaggleDBQA | 272 | - | - | Single | Cross-Domain | English | 2021 |

*Table 1: Key Text-to-SQL dataset statistics with attributes including size, interaction type, domain coverage, language, and year.*

### Key Dataset Characteristics

- **WikiSQL** (2017): 80,654 data points. Limited to single tables and simple SQL operations.
- **Spider** (2018): Currently the most complex benchmark. 200+ databases from 138 domains, supporting orderBy, union, except, groupBy, intersect, nested queries. Four difficulty levels (Easy to Extra Hard).
- **BIRD** (2023): Bridges the gap between academic research and real-world applications. Includes dirty database contents, external knowledge requirements, and SQL efficiency evaluation.
- **BEAVER** (2024): Models complex enterprise environments with intricate table joins and aggregations.

### Augmented Datasets

Spider-based variants introducing various challenges:

- **Spider-SYN**: Synonym substitution for robustness testing
- **Spider-DK**: Domain-specific knowledge requirements
- **Spider-Realistic**: More realistic question-SQL pairs
- **Spider-SS&CG**: Schema simplification and complexity generation for compositional generalization
- **CSpider**: Chinese Text-to-SQL addressing low-resource language challenges

## 4. Methodology

### 4.1 Traditional Methods

#### LSTM-based Methods
Early deep learning approaches using Bi-LSTM to learn semantic representations of question-SQL pairs. Representative models include TypeSQL, Seq2SQL, SQLNet, and SyntaxSQLNet. Limited in handling long-range dependencies for complex queries.

#### Transformer-based Methods
Self-attention mechanisms enable effective handling of long-range dependencies. Key models:
- **GraPPa**: Grammar-augmented pretraining enriching schema understanding
- **TaBERT**: Joint understanding of tabular and textual data through internal pretraining
- **TAPEX**: Table pretraining via logic procedures
- **S²SQL**: Injecting syntax into question-schema interactions
- **ShadowGNN / LGESQL**: Graph neural network-based schema linking

### 4.2 Prompt-based Methods

![Figure 3: Prompt Engineering Methods](/figures/text-to-sql/prompt_examples.png)
*Figure 3: Three key prompt engineering approaches for Text-to-SQL: (a) Zero-shot — generating SQL without prior examples; (b) Few-shot — providing a few examples to guide generation; (c) Reasoning (CoT) — step-by-step reasoning for complex queries.*

#### Zero-shot Prompt
The model receives only a task description, test problem, and database schema without examples.
- **Advantage**: Rapidly applicable to new tasks and domains without additional training
- **Disadvantage**: Accuracy may suffer on complex queries

#### Few-shot Prompt
A small number of demonstration examples are provided alongside the question.
- **SC-prompt**: Divide-and-conquer approach — structure stage (SQL skeleton generation) → content stage (concrete value substitution)
- **MCS-SQL**: Schema linking → parallel SQL generation → optimal query selection via multiple prompts exploring a wider parameter space
- **SQL-PaLM**: Few-shot example selection strategy balancing similarity and diversity

#### Chain of Thought (CoT)
Activates complex reasoning through intermediate steps.
- **Chat2Query**: Zero-shot SQL generation with CoT prompts for step-by-step generation. Built on TiDB Serverless.
- **ACT-SQL**: Hybrid method combining static and dynamic examples

### 4.3 Fine-Tuning Methods

#### Full-Parameter Fine-Tuning
All model parameters are trained.
- **DIN-SQL**: Decomposes complex tasks into manageable sub-tasks → query classification (Easy/Non-nested Complex/Nested Complex) → NatSQL intermediate representation → self-correction module. **Achieved 85.3% on Spider, 55.9% on BIRD (EX).**
- **MAC-SQL**: Multi-agent collaboration (Decomposer + Selector + Refiner). Released open-source SQL-Llama based on Code Llama.
- **Knowledge-to-SQL**: Enhances knowledge generation via DPO algorithm. LLaMA-2-13b backbone.
- **SGU-SQL**: Graph-based structures and grammar trees for decomposing complex structures.

#### Parameter-Efficient Fine-Tuning (PEFT)
Only selected parameters are trained.
- **DAIL-SQL**: Explores Supervised Fine-Tuning strategies with GPT-4 backbone on Spider and Spider-Realistic.
- **StructLM**: Instruction Fine-Tuning combining structured data with generic instruction-tuning data. Code pretraining shows significant enhancement.
- **CLLMs**: Combines consistency loss and autoregressive loss for faster convergence, generating multiple tokens in a single iteration.
- **LoRA / QLoRA**: Reduces memory requirements by freezing pretrained weights and injecting trainable layers into each Transformer block.

### 4.4 Task-Training (From Scratch)

#### Mixture of Experts (MoE) Models
- **SQL-GEN**: Extends SQL templates + combines dialect-specific models (BigQuery, PostgreSQL) via MoE.

#### Transformer-based Models
- **CodeS**: Open-source alternative (1B–15B parameters). Uses BM25 for filtering relevant tables/columns/values. Bidirectional data augmentation for new domain adaptation.
- **MIGA**: T5-based with three sub-tasks (RSP, TWP, FUP) + four SQL perturbations to minimize error propagation.
- **RESDSQL**: Decouples schema linking from skeleton parsing.
- **SQLova**: BERT embeddings + multi-layer LSTM for SQL generation with Execution-Guided decoding (EG).

### 4.5 LLM Agent-based Methods

Multi-agent collaboration for SQL generation, correction, and verification.

- **MAC-SQL**: Decomposer (task decomposition) + Selector (database filtering) + Refiner (SQL correction)
- **Tool-SQL**: Retriever + Detector tools for diagnosing and correcting database mismatch issues
- **SQLFixAgent**: SQLRefiner (final SQL generation) + SQLReviewer (syntactic/semantic error detection) + SQLTool (candidate SQL generation)
- **MAG-SQL**: Soft column selection → problem decomposition → iterative sub-SQL generation → optimization via external tools
- **MAGIC**: Automatically creates self-correcting guides mimicking the correction process of human experts
- **SuperSQL**: RESDSQL schema linking + BRIDGE v2 database content + DAIL-SQL few-shot prompting + self-consistency

## 5. Taxonomy of Text-to-SQL Methods

| Method | Backbone | Optimization | Query Strategy | Error Handling | Dataset | Metrics | Schema Linking |
|---|---|---|---|---|---|---|---|
| SC-prompt | T5 | Task Decomposition | Guided Decoding | - | Spider, CoSQL | EM, EX | ✗ |
| MCS-SQL | GPT-4 | Prompt Tuning | Guided Decoding | Self-Consistency | Spider, BIRD | EX, VES | ✓ |
| SQL-PaLM | PaLM-2 | Prompt Tuning | Consistency Decoding | Self-Correction | Spider, BIRD-SYN | EX, TS | ✓ |
| ACT-SQL | - | CoT | Greedy Search | Self-Correction | Spider, SParC, CoSQL | EM, EX, TS | ✓ |
| DIN-SQL | GPT-4 | Task Decomposition | Greedy Search | Self-Correction | Spider, BIRD | EX, EM | ✓ |
| MAC-SQL | GPT-4 | Task Decomposition | Greedy Search | Refiner | BIRD | EX, EM, VES | ✓ |
| DAIL-SQL | GPT-4 | SFT | Greedy Search | Self-Consistency | Spider, Spider-Realistic | EX, EM | ✗ |
| CodeS | StarCoder | - | Beam Search | Execution-Guided | Spider, BIRD | EX, TS | ✓ |
| RESDSQL | T5 | Skeleton Parsing | Beam Search | Execution-Guided | Spider-DK, Spider-Syn | EM, EX | ✓ |
| Tool-SQL | GPT-4 | Query Error Handling | Python Interpreter | - | Spider, Spider-Realistic | EX, EM | ✓ |
| SQLFixAgent | GPT-3.5-turbo | Query Error Handling | Perturbation-Based | Refiner | Spider, BIRD | EX, EM, VES | ✓ |
| MAG-SQL | - | Query Error Handling | - | Refiner | Spider, BIRD | EX, VES | ✓ |
| SuperSQL | GPT-4 | - | Greedy Search | Self-Consistency | Spider, BIRD | EX, EM | ✓ |

*Table 2: Taxonomy of Text-to-SQL methods comparing backbone models, optimization strategies, query generation strategies, error handling mechanisms, datasets, evaluation metrics, and schema linking capabilities.*

## 6. Conclusion and Future Directions

This survey systematically classifies and analyzes LLM-based Text-to-SQL methodologies.

**Key Findings:**
1. **Prompt-based methods**: Rapidly applicable without additional training, but limited on complex queries
2. **Fine-Tuning**: Achieves high accuracy for specific tasks, but incurs significant training costs
3. **Task-Training**: Fully customized models requiring large-scale data and compute resources
4. **LLM Agent**: Most flexible and adaptive, enabling dynamic correction and external tool utilization

**Future Directions:**
- Improving generalization across cross-domain and cross-language settings
- Developing more efficient and cost-effective SQL generation methods
- Enhancing adaptability to complex schemas in real enterprise environments
