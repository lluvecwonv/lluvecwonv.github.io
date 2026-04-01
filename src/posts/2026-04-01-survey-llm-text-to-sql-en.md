---
title: A Survey on Employing Large Language Models for Text-to-SQL Tasks
date: 2026-04-01
summary: A comprehensive survey published in ACM Computing Surveys 2024 on leveraging Large Language Models for Text-to-SQL tasks. Detailed analysis of prompt engineering, fine-tuning techniques, and experimental results including state-of-the-art benchmarks.
tags: [LLM, Text-to-SQL, Survey, Prompt Engineering, Fine-tuning, Spider, BIRD, ACM, Research Notes]
category: Research Notes
language: en
---

## Overview

This research note surveys "A Survey on Employing Large Language Models for Text-to-SQL Tasks," a comprehensive paper authored by Liang Shi, Zhengju Tang, Nan Zhang, Xiaotong Zhang, and Zhi Yang from Peking University and SingData Cloud. The paper systematically reviews various approaches for applying Large Language Models (LLMs) to the Text-to-SQL task—converting natural language questions into SQL queries.

**Publication Information:**
- Journal: ACM Computing Surveys (CSUR), 2024
- Authors: Liang Shi, Zhengju Tang, Nan Zhang, Xiaotong Zhang, Zhi Yang
- arXiv ID: 2407.15186
- DOI: 10.1145/3737873

## 1. Introduction

### 1.1 Problem Definition and Significance

Text-to-SQL is the task of automatically translating natural language questions into SQL queries. This capability enables non-technical users to interact with databases using natural language, democratizing access to data analytics and decision-making.

The traditional problem formulation:
```
Input:  "What were the sales of each product in January 2024?"
Output: SELECT product_id, product_name, SUM(amount) as total_sales
        FROM sales s
        JOIN products p ON s.product_id = p.product_id
        WHERE s.sale_date >= '2024-01-01' AND s.sale_date < '2024-02-01'
        GROUP BY s.product_id, p.product_name
        ORDER BY total_sales DESC;
```

### 1.2 Evolution from Pre-LLM to LLM Era

**Pre-LLM Approaches (2015-2023)**:
Traditional methods relied on:
- Sequence-to-Sequence (Seq2Seq) models with attention mechanisms
- Graph Neural Networks (GNNs) to model schema relationships
- Pre-trained language models (BERT, RoBERTa, T5)
- Task-specific architectural designs

Limitations:
- Limited contextual understanding for complex natural language
- Difficulty handling large database schemas (500+ tables)
- Poor generalization to new domains
- Best Spider benchmark performance: 73% EM

**LLM Era (2023-Present)**:
The emergence of GPT-4, GPT-3.5, and open-source models like LLaMA has fundamentally changed the landscape:
- Superior zero-shot and few-shot capabilities
- Better handling of complex linguistic expressions
- Ability to perform multi-step reasoning
- State-of-the-art Spider performance: 91.2% EM (GPT-4)

### 1.3 Survey Contributions

This survey provides:
1. Comprehensive taxonomy of LLM-based Text-to-SQL approaches
2. Detailed analysis of prompt engineering techniques
3. In-depth examination of fine-tuning methodologies
4. Extensive performance benchmarking across multiple datasets
5. Identification of major challenges and limitations
6. Future research directions

## 2. Background and Related Work

### 2.1 Benchmark Datasets

#### Spider Dataset
- **Scale**: 10,181 questions spanning 200 databases
- **Coverage**: Diverse domains (restaurant, music, writing)
- **Characteristics**: Multi-turn interactions, complex queries
- **Evaluation Metrics**: Exact Match (EM), Execution Accuracy (EX)
- **Difficulty**: Moderate, serves as primary benchmark

#### BIRD Benchmark
- **Scale**: 12,751 questions across 95 databases
- **Schema Complexity**: Average 27.5 tables, up to 632 tables in largest case
- **Source**: Real-world business databases
- **Focus**: Complex domain knowledge and business logic
- **Evaluation Metrics**: Valid Efficiency Score (VES), Exact Match (EM)
- **Human Performance**: 92.96% - representing performance ceiling
- **Gap to LLM**: GPT-4 achieves 54.89%, indicating significant room for improvement

#### Dr.Spider (Diagnostic Spider)
- **Composition**: High-difficulty questions where most models fail on Spider
- **Purpose**: Stress-test model capabilities on challenging cases
- **Performance Impact**: GPT-4 shows 47.9% performance drop compared to Spider
- **Use Case**: Robustness evaluation

### 2.2 Evolution of Approaches

| Era | Methods | Best EM | Characteristics |
|-----|---------|---------|-----------------|
| Early (2015-2017) | Seq2Seq, Attention | ~40% | Template-based, simple schemas |
| Classical (2017-2021) | GNN, Graph2Seq, BRIDGE | ~65% | Structural awareness, pre-trained models |
| Modern (2021-2023) | LGESQL, Hybrid Architectures | 73% | Complex architectures, domain adaptation |
| LLM (2023-2024) | GPT-4, LLaMA 2 + Engineering | 91.2% | Prompt-based, few-shot learning |

## 3. Methodology: Two-Pronged Approach

The survey categorizes LLM-based Text-to-SQL approaches into two distinct paradigms:

### A. Prompt Engineering

Prompt engineering optimizes LLM performance without fine-tuning by designing and refining the input prompts.

#### A.1 Basic Prompt Structures

**Question-only Structure**:
```
Question: {natural language question}
SQL Query:
```
Simple but low performance due to lack of schema information.

**API Documentation Structure**:
```
Database Schema:
- users: stores user information
  - user_id: unique user identifier
  - username: user's name
  - email: user's email address
- orders: customer orders
  - order_id: unique order identifier
  - user_id: reference to users table
  - order_date: date of order placement

Question: {question}
SQL Query:
```

**CREATE TABLE DDL Structure**:
```
CREATE TABLE users (
    user_id INT PRIMARY KEY,
    username VARCHAR(100),
    email VARCHAR(100),
    created_at TIMESTAMP
);
CREATE TABLE orders (
    order_id INT PRIMARY KEY,
    user_id INT,
    order_date TIMESTAMP,
    amount DECIMAL(10,2),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

Question: {question}
SQL Query:
```

Advantages:
- Precise schema representation
- Clear relationships and constraints
- Data type information included
- Enables validation

Limitations:
- Context length issues with large schemas
- Parsing complexity

#### A.2 Supplementary Knowledge Integration

**Schema Augmentation with Annotations**:
```
CREATE TABLE products (
    product_id INT PRIMARY KEY COMMENT 'Unique product identifier',
    product_name VARCHAR(100) COMMENT 'Product name for display',
    category_id INT COMMENT 'Reference to product category',
    unit_price DECIMAL(10,2) COMMENT 'Current selling price per unit',
    stock_quantity INT COMMENT 'Available inventory units',
    FOREIGN KEY (category_id) REFERENCES categories(category_id)
) COMMENT 'Product catalog with inventory tracking';
```

**Relationship Specification**:
```
Key relationships:
- products.category_id → categories.category_id (Many-to-One)
- orders.product_id → products.product_id (Many-to-One)
- orders.customer_id → customers.customer_id (Many-to-One)
- order_items.order_id → orders.order_id (One-to-Many)
```

**Value Domain Information**:
```
Product Status: 'active', 'discontinued', 'pending_launch'
Order Status: 'pending', 'processing', 'shipped', 'delivered', 'cancelled'
Payment Method: 'credit_card', 'debit_card', 'paypal', 'bank_transfer'
Shipping Region: 'domestic', 'international'
```

**Sample Data Guidance**:
```
Example queries for common tasks:
1. Total sales by category:
   SELECT c.category_name, COUNT(DISTINCT p.product_id) as product_count,
          SUM(oi.quantity * oi.unit_price) as total_revenue
   FROM categories c
   JOIN products p ON c.category_id = p.category_id
   LEFT JOIN order_items oi ON p.product_id = oi.product_id
   GROUP BY c.category_id, c.category_name;

2. Top customers by lifetime value:
   SELECT c.customer_id, c.customer_name,
          SUM(o.order_total) as lifetime_value,
          COUNT(DISTINCT o.order_id) as order_count
   FROM customers c
   JOIN orders o ON c.customer_id = o.customer_id
   WHERE o.status IN ('completed', 'shipped')
   GROUP BY c.customer_id, c.customer_name
   ORDER BY lifetime_value DESC;
```

#### A.3 Example Selection Strategies

**Zero-shot Learning**:
```
Prompt: Database schema provided without examples.
Performance: 63.4% EM with GPT-4
Use Case: Rapid deployment on new domains
Trade-off: Lower accuracy for faster inference
```

**Few-shot Learning with Static Examples**:
```
Example 1:
Question: What is the total sales in January 2024?
Query: SELECT SUM(amount) FROM sales
       WHERE MONTH(sale_date) = 1 AND YEAR(sale_date) = 2024;

Example 2:
Question: Which products have above-average sales?
Query: WITH avg_sales AS (SELECT AVG(amount) as avg_amount FROM sales)
       SELECT DISTINCT p.product_id, p.product_name
       FROM products p
       JOIN sales s ON p.product_id = s.product_id
       WHERE s.amount > (SELECT avg_amount FROM avg_sales);

Example 3:
Question: Top 5 customers by order count?
Query: SELECT c.customer_id, c.customer_name, COUNT(o.order_id) as order_count
       FROM customers c
       LEFT JOIN orders o ON c.customer_id = o.customer_id
       GROUP BY c.customer_id, c.customer_name
       ORDER BY order_count DESC
       LIMIT 5;

Target Question: {question}
```

**Dynamic Example Selection (In-Context Learning)**:

Semantic similarity retrieval:
```
1. Compute embedding of user question
2. Compute embeddings for all example questions
3. Rank examples by cosine similarity
4. Select top-K examples (typically K=3-5)
5. Include in prompt in order of relevance

Impact: +5-10% EM improvement over static examples
```

Structural similarity matching:
```
Match by query complexity:
- Simple (SELECT, no JOIN): ~25% of examples
- Medium (1-2 JOINs, GROUP BY): ~50% of examples
- Complex (3+ JOINs, subqueries): ~25% of examples

Ensures selected examples match target query difficulty
```

Diversity-aware selection:
```
Maximize diversity:
1. Select most similar example
2. Select most dissimilar example from first selection
3. Select median-similarity example
4. Include different SQL operations (JOIN types, aggregations)

Results in balanced examples covering various patterns
```

#### A.4 Reasoning Methods

**Chain-of-Thought (CoT) Prompting**:

Standard CoT:
```
Question: "What is the average order value for customers
          who made purchases in at least two different quarters?"

Let me think step-by-step:

1. Identify the entities and requirements:
   - Entities: customers, orders
   - Requirement: purchases in at least two quarters

2. Define quarters:
   - Q1: months 1-3
   - Q2: months 4-6
   - Q3: months 7-9
   - Q4: months 10-12

3. Find customers with multi-quarter purchases:
   - Group orders by customer and quarter
   - Count distinct quarters per customer
   - Filter customers with count > 1

4. Calculate average order value:
   - For filtered customers, compute mean of order amounts

5. Construct the SQL:
   WITH customer_quarters AS (
     SELECT c.customer_id,
            CONCAT(YEAR(o.order_date), '_Q',
                   QUARTER(o.order_date)) as quarter
     FROM customers c
     JOIN orders o ON c.customer_id = o.customer_id
     GROUP BY c.customer_id, CONCAT(YEAR(o.order_date), '_Q', QUARTER(o.order_date))
   ),
   multi_quarter_customers AS (
     SELECT customer_id
     FROM customer_quarters
     GROUP BY customer_id
     HAVING COUNT(DISTINCT quarter) >= 2
   )
   SELECT AVG(o.amount) as avg_order_value
   FROM orders o
   WHERE o.customer_id IN (SELECT customer_id FROM multi_quarter_customers);
```

**Least-to-Most Decomposition**:
Breaking complex problems into simpler sub-problems:

```
Complex Question: "For each product category with above-average total sales,
                   find the top 3 products by profit margin"

Decomposition:
Step 1: Calculate average total sales across all categories
  Query: SELECT AVG(category_sales) FROM (
           SELECT SUM(amount) as category_sales
           FROM sales s
           JOIN products p ON s.product_id = p.product_id
           GROUP BY p.category_id
         );

Step 2: Find categories exceeding average
  Query: SELECT p.category_id, SUM(s.amount) as total_sales
         FROM sales s
         JOIN products p ON s.product_id = p.product_id
         GROUP BY p.category_id
         HAVING SUM(s.amount) > (Step 1 result)

Step 3: Calculate profit margins for products in selected categories
  Query: SELECT p.product_id, p.product_name, p.category_id,
                (p.sell_price - p.cost) / p.sell_price as profit_margin
         FROM products p
         WHERE p.category_id IN (Step 2 categories)

Step 4: Rank products within each category
  Query: WITH ranked AS (
           SELECT p.product_id, p.product_name, p.category_id,
                  (p.sell_price - p.cost) / p.sell_price as profit_margin,
                  ROW_NUMBER() OVER (PARTITION BY p.category_id
                                    ORDER BY profit_margin DESC) as rn
           FROM products p
           WHERE p.category_id IN (Step 2)
         )
         SELECT product_id, product_name, category_id, profit_margin
         FROM ranked
         WHERE rn <= 3;

Final integration: Combine all steps into a single executable query
```

**Self-Consistency Decoding**:

Voting mechanism for robust answers:
```
Process:
1. Generate N responses (typically N=5) with temperature=0.7
   Response 1: SELECT * FROM users WHERE age > 30;
   Response 2: SELECT * FROM users WHERE age > 30;
   Response 3: SELECT * FROM users WHERE age >= 30;
   Response 4: SELECT * FROM users WHERE age > 30;
   Response 5: SELECT * FROM users WHERE age > 30;

2. Execute all queries on sample data
   Responses 1,2,4,5: Return 150 users (age > 30)
   Response 3: Return 151 users (age >= 30)

3. Aggregate results
   Majority result (150 users, age > 30): 4 votes
   Minority result (151 users, age >= 30): 1 vote

4. Select majority answer
   Final answer: SELECT * FROM users WHERE age > 30;
   Confidence: 80% (4/5)

Performance gain: 5-8% accuracy improvement
Cost: 5x inference cost
Trade-off: Higher accuracy vs. inference time/cost
```

**Self-Correction with Iterative Refinement**:

```
Iteration 1:
Generated SQL: SELECT user_id FROM users WHERE age > 30;
Validation: SQL is syntactically correct ✓
Schema check: Table 'users' exists ✓, Column 'age' exists ✓
Semantic check: Correct interpretation ✓
Result: Accepted

Iteration 2 (with error):
Generated SQL: SELECT * FROM user WHERE hire_date > '2024-01-01';
Validation: SQL is syntactically correct ✓
Schema check: Table 'user' does NOT exist ✗
Error: "Table 'user' not found. Did you mean 'users'?"

Correction Prompt:
"Previous query failed with error: Table 'user' not found.
 Available tables: users, orders, departments
 Correct the query and try again."

Corrected SQL: SELECT * FROM users WHERE hire_date > '2024-01-01';
Validation: ✓ All checks pass

Iteration 3 (logical error):
Generated SQL: SELECT * FROM users GROUP BY user_id;
Validation: Syntax correct ✓
Schema check: ✓
Logical check: ✗
Error: "SELECT clause contains non-grouped column(s).
        All columns must be in GROUP BY or aggregated."

Correction Prompt:
"Previous query violated SQL semantics. When using GROUP BY,
 all non-aggregated columns must be in the GROUP BY clause."

Corrected SQL: SELECT user_id, COUNT(*) as count FROM users GROUP BY user_id;
```

#### A.5 Retrieval-Augmented Generation (RAG)

**Schema Retrieval**:

Embedding-based schema selection:
```
User Question: "What is the product with the highest profit margin?"

Step 1: Generate question embedding
  q_embedding = encode("What is the product with the highest profit margin?")

Step 2: Compute similarity scores
  similarity(q_embedding, products_table) = 0.89
  similarity(q_embedding, sales_table) = 0.78
  similarity(q_embedding, inventory_table) = 0.62
  similarity(q_embedding, costs_table) = 0.84

Step 3: Select top-K tables
  K=3: [products (0.89), costs (0.84), sales (0.78)]

Step 4: Include only relevant schema in prompt
  CREATE TABLE products (
    product_id INT PRIMARY KEY,
    product_name VARCHAR(100),
    category_id INT,
    sell_price DECIMAL(10,2)
  );
  CREATE TABLE costs (
    product_id INT,
    cost_price DECIMAL(10,2)
  );
  CREATE TABLE sales (
    sale_id INT,
    product_id INT,
    quantity INT
  );

Benefit: Reduced context length, better focus
```

**Example Retrieval from Query Repository**:

```
Corporate example database:
Query 1: "Sales by product category"
  SELECT category, SUM(revenue) FROM sales GROUP BY category;
  [embedding: 0.75 similarity to current question]

Query 2: "Products with highest profit"
  SELECT p.product_id, p.product_name,
         SUM((s.price - c.cost) * s.quantity) as total_profit
  FROM products p
  JOIN sales s ON p.product_id = s.product_id
  JOIN costs c ON p.product_id = c.product_id
  GROUP BY p.product_id, p.product_name
  ORDER BY total_profit DESC
  LIMIT 1;
  [embedding: 0.92 similarity to current question] ← Selected

Selected example added to prompt with explanation:
"Similar query pattern found. Here's a reference example..."
```

**Execution Feedback Loop**:

```
Online Learning with Accumulated Corrections:

Interaction 1:
User Question: "Sales in January 2024"
Generated SQL: SELECT * FROM sales WHERE MONTH(date) = 1;
Error: Year not specified, includes January from all years
Feedback: "Add year condition: AND YEAR(date) = 2024"
Correction logged.

Interaction 2:
User Question: "Sales in February 2024"
System check: Similar to "January 2024" (pattern match)
Retrieve correction: "Remember to add year condition"
Pre-corrected prompt:
"Note: When asking about sales in a specific month/year,
 ensure to include both MONTH() and YEAR() conditions."
Generated SQL: SELECT * FROM sales WHERE MONTH(date) = 2 AND YEAR(date) = 2024;
Result: ✓ Correct

Error Pattern Repository:
- Missing YEAR in temporal filters: +50 examples
- Incorrect JOIN conditions: +45 examples
- Missing aggregate functions: +38 examples
Used to weight prompt engineering guidance.
```

### B. Fine-tuning Approaches

Fine-tuning adapts pre-trained LLMs to the Text-to-SQL task through training on task-specific data.

#### B.1 Data Preparation

**Training Data Curation**:

```json
[
  {
    "database_id": "sales_db",
    "question": "What was the total revenue in January 2024?",
    "query": "SELECT SUM(amount) FROM sales WHERE MONTH(sale_date) = 1 AND YEAR(sale_date) = 2024;",
    "difficulty": "easy",
    "complexity_metrics": {
      "joins": 0,
      "subqueries": 0,
      "aggregations": 1,
      "tokens": 25
    }
  },
  {
    "database_id": "sales_db",
    "question": "For each product category with above-average revenue, what is the profit margin?",
    "query": "WITH category_stats AS (SELECT category_id, SUM(amount) as revenue FROM sales JOIN products ON sales.product_id = products.product_id GROUP BY category_id HAVING SUM(amount) > (SELECT AVG(monthly_revenue) FROM (SELECT SUM(amount) as monthly_revenue FROM sales GROUP BY MONTH(sale_date)))), profit_data AS (SELECT p.product_id, p.product_name, p.category_id, (p.sell_price - p.cost) / p.sell_price as margin FROM products p WHERE p.category_id IN (SELECT category_id FROM category_stats)) SELECT category_id, product_id, product_name, margin FROM profit_data ORDER BY category_id, margin DESC;",
    "difficulty": "hard",
    "complexity_metrics": {
      "joins": 2,
      "subqueries": 3,
      "aggregations": 2,
      "tokens": 95
    }
  }
]
```

**Data Augmentation Techniques**:

Question paraphrasing:
```
Original: "What is the total sales in Q1 2024?"
Augmented variants:
1. "Show me the sum of sales from January to March 2024"
2. "Calculate total revenue for first quarter of 2024"
3. "What were sales in the first three months of 2024?"
4. "Total sales: January, February, March 2024"

All map to: SELECT SUM(amount) FROM sales
           WHERE QUARTER(sale_date) = 1 AND YEAR(sale_date) = 2024;
```

Backward question generation from SQL:
```
Given SQL:
SELECT c.customer_id, COUNT(DISTINCT o.order_id) as order_count
FROM customers c
JOIN orders o ON c.customer_id = o.customer_id
WHERE o.status IN ('completed', 'shipped')
GROUP BY c.customer_id
HAVING COUNT(DISTINCT o.order_id) > 5
ORDER BY order_count DESC;

Generated questions:
1. "Which customers have placed more than 5 orders?"
2. "List customers with 6+ completed or shipped orders, ranked by order count"
3. "Show high-frequency customers (5+ orders)"
4. "Who are our frequent buyers?"
```

Schema transformation:
```
Original Schema:
CREATE TABLE users (
  user_id INT PRIMARY KEY,
  username VARCHAR(100),
  signup_date TIMESTAMP
);

Variants:
1. Column renaming:
   CREATE TABLE customers (
     customer_id INT PRIMARY KEY,
     name VARCHAR(100),
     registration_date TIMESTAMP
   );

2. Table renaming:
   CREATE TABLE user_accounts (
     id INT PRIMARY KEY,
     username VARCHAR(100),
     created_at TIMESTAMP
   );

Augmented training samples with schema variants improve generalization.
```

**Difficulty-Based Sampling**:

```
Complexity score calculation:
score = w₁ * (query_tokens / 100) +
        w₂ * (join_count * 2 + subquery_count * 3) +
        w₃ * (semantic_difficulty)

where w₁ = 0.2, w₂ = 0.5, w₃ = 0.3

Dataset composition:
Easy (score 0-2): 40%
Medium (score 2-4): 35%
Hard (score 4-6): 20%
Very Hard (score 6+): 5%

Balanced difficulty distribution enables robust learning across query complexity ranges.
```

#### B.2 Model Selection

| Model | Parameters | Context Window | Inference Speed | Primary Use |
|-------|-----------|-----------------|-----------------|-------------|
| GPT-4 | Unknown | 128K | Moderate | SOTA, API-based |
| GPT-3.5 Turbo | Unknown | 128K | Fast | Cost-effective API |
| Claude 3 | Unknown | 200K | Moderate | Long context, safety-focused |
| LLaMA 2 | 7B/13B/70B | 4K | Fast | Open-source, local deployment |
| CodeLLaMA | 7B/13B/34B | 16K | Fast | Code-specialized, open-source |
| Mistral | 7B | 32K | Very Fast | Efficient, open-source |

**Model Selection Framework**:

```
Decision tree:
├─ Cost-critical?
│  ├─ Yes → GPT-3.5 Turbo (API) or CodeLLaMA (open-source)
│  └─ No  → GPT-4
├─ Private deployment required?
│  ├─ Yes → LLaMA 2 70B (fine-tuned)
│  └─ No  → API-based (GPT-4, Claude 3)
├─ Memory-constrained?
│  ├─ Yes → LLaMA 2 7B + LoRA
│  └─ No  → Full-size model
├─ Large schemas (>1000 columns)?
│  ├─ Yes → Claude 3 (200K context)
│  └─ No  → Any model
└─ Speed critical (<1s)?
   ├─ Yes → Mistral 7B + optimization
   └─ No  → Standard inference
```

#### B.3 Model Training

**Full Fine-tuning**:

```python
from transformers import AutoModelForCausalLM, AutoTokenizer, Trainer, TrainingArguments

# Load pretrained model
model = AutoModelForCausalLM.from_pretrained("meta-llama/Llama-2-7b-hf")
tokenizer = AutoTokenizer.from_pretrained("meta-llama/Llama-2-7b-hf")

# Prepare dataset
def preprocess_function(examples):
    prompts = [f"Question: {q}\nSQL:" for q in examples["question"]]
    targets = examples["query"]

    model_inputs = tokenizer(prompts, truncation=True, max_length=512)
    labels = tokenizer(targets, truncation=True, max_length=256)

    model_inputs["labels"] = labels["input_ids"]
    return model_inputs

train_dataset = dataset["train"].map(preprocess_function, batched=True)

# Configure training
training_args = TrainingArguments(
    output_dir="./results",
    num_train_epochs=3,
    per_device_train_batch_size=8,
    per_device_eval_batch_size=8,
    gradient_accumulation_steps=2,
    learning_rate=2e-5,
    weight_decay=0.01,
    warmup_steps=500,
    eval_steps=500,
    save_steps=1000,
    logging_steps=100,
    eval_strategy="steps",
    save_strategy="steps",
    load_best_model_at_end=True,
)

# Train
trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=train_dataset,
    eval_dataset=eval_dataset,
    tokenizer=tokenizer,
)
trainer.train()
```

Resource requirements:
- 7B model: 16GB GPU memory minimum
- 13B model: 24GB GPU memory
- 70B model: 8× A100 80GB GPUs
- Training time: 7-10 days for 70B model on standard setup

**Parameter-Efficient Fine-tuning with LoRA**:

```python
from peft import get_peft_model, LoraConfig, TaskType

# LoRA configuration
lora_config = LoraConfig(
    task_type=TaskType.CAUSAL_LM,
    r=8,              # LoRA rank
    lora_alpha=32,    # LoRA scaling factor
    lora_dropout=0.1,
    bias="none",
    target_modules=["q_proj", "v_proj", "k_proj", "out_proj"],
    modules_to_save=["lm_head"],
)

# Apply LoRA to model
model = get_peft_model(model, lora_config)

# Training proceeds identically to full fine-tuning
trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=train_dataset,
)
trainer.train()

# Save only LoRA weights (~50MB for 7B model)
model.save_pretrained("./lora_adapter")

# Load for inference
from peft import AutoPeftModelForCausalLM
model = AutoPeftModelForCausalLM.from_pretrained("./lora_adapter")
```

LoRA efficiency gains:

| Aspect | Full Fine-tuning | LoRA |
|--------|-----------------|------|
| Memory Usage | 100% | 10-15% |
| Storage | 14GB (7B model) | 50MB |
| Training Speed | 1x | 3-4x faster |
| Performance | 100% | 95-98% |
| Multi-task Adaptation | Requires retraining | Simple adapter swapping |
| Inference Speed | Same | Same |

#### B.4 Evaluation Metrics

**Exact Match (EM)**:

```
Metric: Percentage of generated SQL exactly matching reference SQL (after normalization)

Normalization process:
1. Lowercase all keywords
2. Remove extra whitespace
3. Reformat to canonical form
4. Parse and reconstruct to handle equivalencies

Example:
Generated: SELECT * FROM users WHERE age>30;
Reference: SELECT * FROM users WHERE age > 30;
After normalization: Both become identical
EM = 1 (Match)

Strictness: Very strict, often underestimates true correctness
Challenge: Equivalent queries with different syntax don't match
```

**Execution Accuracy (EX)**:

```
Metric: Percentage of queries producing identical results when executed

Process:
1. Execute generated query on test database
2. Execute reference query on same database
3. Compare result sets (ignoring row order)
4. Mark as match if identical

Example:
Generated: SELECT * FROM users WHERE age >= 30;
Reference: SELECT * FROM users WHERE age > 30;
Generated results: [USER_30, USER_31, ..., USER_100]
Reference results: [USER_31, USER_32, ..., USER_100]
EX = 0 (No match)

Advantage: Tests semantic correctness rather than syntactic
Reality: Often 2-5% higher than EM due to alternative valid queries
```

**Valid Efficiency Score (VES, BIRD-specific)**:

```
VES = (Correctness_Score + Efficiency_Score) / 2

Correctness_Score:
- Result matches exactly: 1.0
- Partial match (subset of correct results): 0.5
- No match: 0.0

Efficiency_Score = min(T_reference / T_generated, 1.0)

Example:
Reference query execution time: 100ms
Generated query execution time: 80ms
Efficiency = min(100/80, 1.0) = 1.0 (Better)

Generated query execution time: 150ms
Efficiency = min(100/150, 1.0) = 0.67 (Slower)

VES Calculation:
Scenario A: Correct, faster
VES = (1.0 + 1.0) / 2 = 1.0 (Perfect)

Scenario B: Correct, slower
VES = (1.0 + 0.67) / 2 = 0.835 (Good but inefficient)

Scenario C: Incorrect
VES = (0.0 + efficiency) / 2 ≤ 0.5
```

## 4. Experimental Results

### 4.1 Spider Benchmark Results

**Progressive Improvement with LLMs**:

| Model | Approach | EM (%) | EX (%) | Year |
|-------|----------|--------|--------|------|
| IRNet | Graph-based | 65.3 | - | 2019 |
| BRIDGE | Seq2Seq | 68.5 | - | 2020 |
| LGESQL | Graph NN | 71.1 | - | 2021 |
| SOTA Ensemble | Various | 73.0 | 72.5 | 2023 |
| GPT-3.5 Zero-shot | Prompt | 60.2 | 59.1 | 2023 |
| GPT-3.5 Few-shot (3) | Prompt | 70.5 | 69.3 | 2023 |
| Claude 2 Few-shot | Prompt | 72.1 | 70.8 | 2023 |
| **GPT-4 Few-shot** | **Prompt** | **91.2** | **89.3** | **2024** |
| GPT-4 Few-shot + CoT | Prompt | 89.5 | 87.8 | 2024 |

Key observations:
1. GPT-4 single-handedly exceeds all previous SOTA approaches
2. Few-shot prompting critical for LLM success
3. Chain-of-Thought surprisingly shows slight regression when combined with few-shot on Spider

**Cumulative Effect of Prompt Engineering Techniques**:

| Technique | Incremental Gain | Cumulative | Total Improvement |
|-----------|-----------------|-----------|------------------|
| Zero-shot baseline | - | 63.4% | - |
| Few-shot (top-3) | +11.8% | 75.2% | +11.8% |
| Dynamic example selection | +2.6% | 77.8% | +14.4% |
| CoT reasoning | +1.7% | 79.5% | +16.1% |
| Self-Consistency (N=5) | +3.6% | 83.1% | +19.7% |
| Self-Correction | +4.3% | 87.4% | +24.0% |
| Schema RAG | +1.7% | 89.1% | +25.7% |
| Query Template RAG | +2.1% | 91.2% | +27.8% |

Analysis:
- Few-shot is dominant factor (+11.8%)
- Diminishing returns beyond Self-Consistency
- Each additional technique yields 1-4% improvement
- Total 27.8% improvement demonstrates power of systematic engineering

### 4.2 BIRD Benchmark Results

BIRD represents real-world complexity with larger schemas and domain-specific knowledge requirements.

**Model Performance on BIRD-dev**:

| Model | BIRD-dev EM (%) | BIRD-test EM (%) | VES (%) | Human (%) |
|-------|-----------------|------------------|---------|-----------|
| Pre-trained SOTA (2023) | 35.7 | 34.2 | 32.1 | - |
| GPT-3.5 Few-shot | 41.2 | 39.8 | 38.5 | - |
| Claude 2 Few-shot | 44.5 | 42.3 | 40.2 | - |
| **GPT-4 Few-shot + CoT** | **54.89** | **52.14** | **48.3** | **92.96** |
| GPT-4 + Self-Correction | 56.2 | 53.8 | 50.1 | - |

**Gap Analysis**:
- Spider: GPT-4 (91.2%) vs Human (~95%): 4% gap
- BIRD: GPT-4 (54.89%) vs Human (92.96%): 38% gap
- Spider-to-BIRD performance drop: 36% relative decrease

This substantial gap indicates that:
1. Domain knowledge is critical but underdeveloped in LLMs
2. Complex real-world schemas pose significant challenges
3. Business logic reasoning remains a major limitation

**Error Breakdown on BIRD**:

| Error Type | Frequency | Root Cause | Mitigation |
|------------|-----------|-----------|-----------|
| Complex JOINs | 22% | Multi-table relationships | Schema understanding, examples |
| Domain Knowledge | 28% | Missing business logic | Domain glossaries, rules |
| Large Schemas | 18% | Context overload | Schema selection, hierarchical info |
| Ambiguous Language | 15% | Natural language interpretation | Question normalization, clarification |
| Operation Composition | 17% | Complex SQL patterns | CoT, decomposition |

### 4.3 Dr.Spider: Stress Testing on Hard Cases

Dr.Spider tests model robustness on cases where standard models fail.

**Performance Degradation Analysis**:

| Model | Spider EM (%) | Dr.Spider EM (%) | Drop (%) |
|-------|--------------|------------------|----------|
| Pre-trained | 73.0 | 60.5 | -12.5 |
| GPT-3.5 Few-shot | 70.5 | 45.3 | -25.2 |
| Claude 2 Few-shot | 72.1 | 48.6 | -23.5 |
| **GPT-4 Few-shot + CoT** | **91.2** | **43.2** | **-47.9** |

Counter-intuitive finding: GPT-4's larger absolute performance advantage translates to larger absolute drop on hard cases.

Worst 10% difficulty cases:
- GPT-4: 50.7% drop (91.2% → 40.5%)
- GPT-3.5: 35.2% drop (70.5% → 45.3%)

**Failure Patterns on Dr.Spider**:

```
Category 1: Deep Nesting (10% of Dr.Spider)
SELECT * FROM (
  SELECT * FROM (
    SELECT * FROM orders WHERE year = 2024
  ) WHERE amount > 1000
) WHERE customer_segment = 'premium'

Failure rate: 52%
Reason: Multi-level context tracking failure
Fix: Explicit step-by-step decomposition

Category 2: Complex Grouping (15%)
SELECT dept, job_title, skill,
       COUNT(*) as emp_count,
       AVG(salary) as avg_salary,
       (SELECT AVG(...) FROM ...) as benchmark
FROM employees
GROUP BY dept, job_title, skill
HAVING COUNT(*) > 3

Failure rate: 48%
Reason: Clause ordering complexity
Fix: CoT with explicit step-by-step grouping logic

Category 3: Multi-way JOINs (12%)
SELECT ... FROM t1
JOIN t2 ON t1.a=t2.a AND t1.b=t2.b
LEFT JOIN t3 ON ...
RIGHT JOIN t4 ON ...
CROSS JOIN t5

Failure rate: 61%
Reason: JOIN condition accumulation
Fix: Explicit join condition clarification in prompt

Category 4: Implicit Domain Rules (13%)
Question: "Percentage of VIP orders shipped on-time?"
Implicit definitions needed:
- VIP: Total spend > $100K
- On-time: Shipped <= promised date

Failure rate: 58%
Reason: No explicit domain definitions
Fix: Mandatory domain glossary inclusion
```

### 4.4 Fine-tuning Results: XiYan-SQL

XiYan-SQL represents a fine-tuned open-source approach using LLaMA 2 70B.

**Training Configuration**:

```
Base Model: LLaMA 2 70B
Training Data:
- Spider training set: 8,659 examples
- Synthetic augmented data: 50,000 examples
- Internal proprietary data: 10,000 examples
- Total: 68,659 training examples

Hyperparameters:
- Optimizer: AdamW
- Learning rate: 5e-5
- Batch size: 128 (8 A100 GPUs, per-device: 16)
- Epochs: 3
- Warmup steps: 500
- Weight decay: 0.01
- Max sequence length: 2048

Training Compute:
- Hardware: 8× NVIDIA A100 80GB
- Training time: 7-8 days
- Total GPU hours: ~1,500
```

**Performance Results**:

| Dataset | Metric | Score (%) |
|---------|--------|-----------|
| **Spider** | EM | 89.65 |
| | EX | 87.32 |
| **BIRD-dev** | EM | 72.23 |
| | VES | 69.47 |
| **SQL-Eval** | EM | 69.86 |
| | EX | 67.54 |

**Complexity-based Performance**:

| Difficulty | EM (%) | EX (%) | Example |
|------------|--------|--------|---------|
| Easy | 95.2 | 94.1 | Simple SELECT from single table |
| Medium | 87.4 | 85.8 | 1-2 JOINs, simple GROUP BY |
| Hard | 72.8 | 70.2 | 3+ JOINs, nested queries |
| Extra Hard | 48.3 | 45.1 | Complex combinations, domain rules |

**Key Insights**:
1. Spider performance (89.65%) competitive with GPT-4 (91.2%) while maintaining full local control
2. Significant performance drop on BIRD (72.23%) indicates domain-specific challenges
3. Fine-tuning achieves ~17% improvement over zero-shot on Spider
4. Extra-hard cases remain problematic across all approaches

### 4.5 Prompt Engineering vs Fine-tuning Comparison

Trade-off analysis for practitioners:

| Dimension | GPT-4 Prompting | LLaMA 2 Fine-tuning |
|-----------|-----------------|-------------------|
| Best achievable EM | 91.2% | 89.65% |
| Latency | 5 seconds | 2 seconds |
| API cost per query | $0.01-0.05 | $0 (amortized) |
| Deployment | Cloud only | On-premise possible |
| Privacy | Data sent to OpenAI | Local processing |
| Development time | Days | Weeks |
| Adaptation time | Minutes (retune prompt) | Days (retrain) |
| Multi-domain adaptation | Cheap (different prompts) | Expensive (different adapters) |

**Selection Matrix**:

```
Highest performance needed
→ GPT-4 Few-shot (91.2% EM)

Cost efficiency critical
→ CodeLLaMA 34B LoRA (~87% EM, low cost)

Private deployment required
→ LLaMA 2 70B fine-tuning (89.65% EM)

Rapid prototyping
→ GPT-3.5 API (70.5% EM, instant)

Edge deployment, real-time response
→ Quantized Mistral 7B LoRA (~82% EM)

Multi-tenant SaaS
→ GPT-4 API with prompt caching
```

## 5. Major Challenges and Open Problems

### 5.1 Privacy and Data Security

**Privacy Risks with API-based LLMs**:

```
Scenario: Healthcare Database Query
User: "Show patients with diagnosis 'Type 2 Diabetes'
       prescribed medication 'Metformin'"

Risk Analysis:
1. Question + Schema sent to LLM provider
2. Logs capture sensitive information
3. Potential HIPAA/GDPR violations
4. Data retention policies unclear
5. Third-party subpoena risk

Sensitive data examples:
- Medical: Patient IDs, diagnoses, prescriptions
- Financial: Account numbers, transaction amounts
- Personal: SSN, dates of birth, addresses
```

**Mitigation Strategies**:

Data masking approach:
```
Original query: "Patient with SSN 123-45-6789 test results?"
Masked prompt: "Patient with SSN [MASKED] test results?"

Processing:
1. LLM generates: SELECT * FROM patients WHERE ssn = '[MASKED]'
2. Restore before execution: ssn = '123-45-6789'
3. LLM never sees actual sensitive data

Limitation: Requires careful handling of all sensitive references
```

On-premises deployment:
```
Architecture:
User → Internal LLM Server → Internal Database

Benefits:
- No external data transmission
- Complete organizational control
- Regulatory compliance easier
- No API dependency

Drawbacks:
- Higher infrastructure cost
- Model maintenance burden
- Limited to available open-source models
- Operational complexity
```

### 5.2 Complex Schema Handling

**Scale of the Problem**:

| Aspect | Spider | BIRD | Max BIRD |
|--------|--------|------|----------|
| Tables | 5.3 avg | 27.5 avg | 632 |
| Columns | 26 avg | Unknown | 20,000+ |
| DDL tokens | ~200 | ~2,000 | 100,000+ |
| Context used | ~10% | ~50-60% | >80% |

The largest BIRD database's DDL consumes majority of GPT-4's context window before questions and examples.

**Adaptive Schema Selection**:

```
Problem: Cannot include all 632 tables in prompt

Solution: Content-based filtering

1. Parse question for keywords
   "What is the revenue distribution by region and quarter?"
   Keywords: [revenue, region, quarter, distribution]

2. Semantic similarity search
   Compute embeddings for:
   - All tables and columns
   - Question keywords

3. Rank by relevance
   revenue table: 0.92 similarity
   region table: 0.88 similarity
   quarter/date tables: 0.85 similarity

4. Include top-K tables in prompt (K=10)
   Reduces context from 100K→5K tokens

5. Alternative: Iterative refinement
   First attempt with selected schema
   If tables not found error, expand schema
```

**Hierarchical Schema Representation**:

```
Level 0 (Summary):
Database "ecommerce" has 4 business domains:
- Customers (3 tables)
- Products (4 tables)
- Orders (5 tables)
- Shipping (2 tables)

Level 1 (Domain-specific):
Orders domain:
- orders_header (order metadata)
- order_items (individual items)
- order_payments (payment info)

Level 2 (Table detail):
orders_header table:
- order_id (PK)
- customer_id (FK → customers)
- order_date (temporal)
- total_amount (monetary)

Prompt construction:
"Question: {q}
Relevant domain: Orders
Schema:
{table definitions for Orders domain}
Foreign key relationships:
{join hints for Orders}"
```

### 5.3 Domain Knowledge Gaps

**Challenge: Business Logic Understanding**:

Example 1: "VIP Customer" Definition
```
Question: "How many VIP customers made purchases last month?"

Model interpretation 1 (wrong):
"VIP" = Any customer
SELECT COUNT(DISTINCT customer_id) FROM orders
WHERE order_date >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH);

Correct interpretation (requires domain knowledge):
"VIP" = Customers with total spend >= $10,000 in past year
WITH eligible_customers AS (
  SELECT customer_id
  FROM orders
  WHERE order_date >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR)
  GROUP BY customer_id
  HAVING SUM(amount) >= 10000
)
SELECT COUNT(*) FROM eligible_customers
WHERE customer_id IN (
  SELECT DISTINCT customer_id FROM orders
  WHERE order_date >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH)
);
```

**Solution: Business Rules Encoding**:

```yaml
business_rules:
  - rule_id: BR_VIP_CUSTOMER
    name: "VIP Customer Classification"
    definition: "Customers with cumulative purchases >= $10,000 in past 12 months"
    implementation: "See eligible_customers CTE"
    applies_to_tables:
      - customers
      - orders
    related_queries:
      - "VIP customer counts"
      - "VIP customer preferences"
      - "VIP customer lifetime value"

  - rule_id: BR_VALID_ORDER
    name: "Valid Order Status"
    definition: "Orders with status in ('completed', 'shipped') only"
    sql_expression: "status IN ('completed', 'shipped')"
    note: "Exclude pending, cancelled, returned"

  - rule_id: BR_QUARTER_DEFINITION
    name: "Business Quarter Definition"
    Q1: "Jan-Mar"
    Q2: "Apr-Jun"
    Q3: "Jul-Sep"
    Q4: "Oct-Dec"
    sql_mapping: "CONCAT(YEAR(date), '_Q', QUARTER(date))"
```

Prompt integration:
```
Schema: {standard DDL}

Business Rules:
- {BR_VIP_CUSTOMER definition}
- {BR_VALID_ORDER definition}
- {BR_QUARTER_DEFINITION}

Domain Glossary:
- GMV: Gross Merchandise Value (all sales including returns)
- AOV: Average Order Value
- Churn: Customer inactive for 3+ months
```

### 5.4 Autonomous Agents and Iterative Refinement

**Motivation for Agentic Approaches**:

```
Single-shot success rate: 89.65% (XiYan-SQL best)
Remaining failures: 10.35%

These errors often correctable if:
1. Error identified (syntax, schema, logic)
2. Feedback provided
3. Query regenerated with context

Agentic approach: Automated correction loop
Success rate potential: 92-95%
```

**Plan-Execute-Check Architecture**:

```
PLAN PHASE:
Input: "Show sales by product category for Q1 2024,
        including profit margins and customer count"

Analysis:
- Identify key concepts: sales, category, Q1, 2024, profit margin, customers
- Determine required tables: sales, products, customers, categories
- Identify operations needed:
  * Time filtering: sale_date in Q1 2024
  * Grouping: by category, product
  * Calculations: profit margin = (price - cost)/price
  * Aggregations: SUM for sales, COUNT for customers
- Expected complexity: Medium (3 JOINs, GROUP BY 2)

EXECUTE PHASE:
Generate SQL based on plan:
SELECT
  pc.category_name,
  p.product_id,
  p.product_name,
  SUM(s.amount) as total_sales,
  (p.sell_price - p.cost) / p.sell_price as profit_margin,
  COUNT(DISTINCT s.customer_id) as customer_count
FROM sales s
JOIN products p ON s.product_id = p.product_id
JOIN product_categories pc ON p.category_id = pc.category_id
JOIN customers c ON s.customer_id = c.customer_id
WHERE QUARTER(s.sale_date) = 1
  AND YEAR(s.sale_date) = 2024
GROUP BY pc.category_name, p.product_id, p.product_name, p.sell_price, p.cost
ORDER BY pc.category_name, total_sales DESC;

CHECK PHASE:
1. Syntax validation: ✓ Valid SQL
2. Schema validation:
   - Tables exist: ✓
   - Columns exist: ✓
   - JOINs valid: ✓
3. Logical validation:
   - GROUP BY clause includes all non-aggregated columns: ✓
   - Date filtering correct: ✓
   - Calculation logic sound: ✓
4. Test execution (small sample):
   - No errors: ✓
   - Results reasonable: ✓
5. Final verdict: PASS

Additional refinements possible:
- Add ORDER BY profit_margin DESC
- Add row number for ranking
- Check for alternative query plan
```

**Self-Correction in Action**:

```
Attempt 1:
Generated: SELECT user_id, COUNT(*) FROM users GROUP BY user_id;
Check: Syntax valid ✓, but SELECT has non-grouped column issue
Error: Column 'user_id' in SELECT must be in GROUP BY (caught by linter)
Fix hint: Actually, user_id IS in GROUP BY...
          Issue must be other non-grouped column

Attempt 2:
Generated: SELECT u.user_id, u.name, COUNT(o.order_id) as order_count
          FROM users u LEFT JOIN orders o ON u.user_id = o.user_id
          GROUP BY u.user_id;
Check: SELECT has non-grouped column: u.name
Feedback: "u.name is not grouped. Include in GROUP BY or aggregate."

Attempt 3:
Generated: SELECT u.user_id, u.name, COUNT(o.order_id) as order_count
          FROM users u LEFT JOIN orders o ON u.user_id = o.user_id
          GROUP BY u.user_id, u.name;
Check: All validations pass ✓
Result: Query ready for execution
```

## 6. Conclusions and Future Directions

### 6.1 Key Findings

This survey reveals several critical insights:

1. **LLMs Represent Paradigm Shift**: GPT-4 achieves 91.2% on Spider, surpassing all previous methods by 18.2 percentage points and breaking through the 90% barrier previously thought unattainable.

2. **Prompt Engineering Effectiveness**: Systematic application of prompt engineering techniques—Few-shot learning, Chain-of-Thought, Self-Consistency, Self-Correction, and RAG—cumulatively improves performance by 27.8 percentage points.

3. **Open-Source Competitiveness**: Fine-tuned open-source models (LLaMA 2 70B achieving 89.65% EM) are commercially viable alternatives, offering superior privacy and cost profiles.

4. **Persistent Real-World Challenges**: BIRD benchmark (54.89% vs 92.96% human) and Dr.Spider stress tests reveal that complex real-world scenarios remain fundamentally difficult.

5. **Domain Knowledge Criticality**: The 38-point gap between GPT-4 and human performance on BIRD underscores that natural language processing alone is insufficient without domain expertise.

### 6.2 Practical Implementation Guidance

**Decision Framework by Scenario**:

1. **Maximum Performance (Research/Publishing)**
   - Method: GPT-4 + All engineering techniques
   - Performance: 91.2% Spider EM
   - Suitable for: Academic papers, benchmark leaderboards

2. **Production Deployment (Cost-Sensitive)**
   - Method: CodeLLaMA 34B + LoRA
   - Performance: ~87% Spider EM
   - Cost: 1/100th of GPT-4 API calls
   - Suitable for: Enterprise applications with volume

3. **Privacy-Critical (Healthcare, Finance)**
   - Method: LLaMA 2 70B fine-tuned, on-premise deployment
   - Performance: 89.65% Spider EM
   - Data Flow: Internal only
   - Suitable for: Regulated industries

4. **Rapid Prototyping (Proof-of-Concept)**
   - Method: GPT-3.5 API with few examples
   - Performance: 70.5% Spider EM
   - Time-to-market: < 1 day
   - Suitable for: Feasibility validation

### 6.3 Future Research Directions

**Short-term (1-2 years)**:
- Models efficient for edge deployment (4B-13B parameters)
- Multi-modal schema understanding (images + text)
- Domain-specialized LLM families
- Automatic error detection and correction systems

**Medium-term (2-5 years)**:
- Interactive agents with clarification dialogue
- Multilingual and cross-lingual transfer learning
- Adaptive schema management for evolving databases
- Explainability and user trust mechanisms

**Long-term (5+ years)**:
- Unified database interface across SQL and NoSQL
- End-to-end insight generation (from question to visualization)
- Personalized organizational models
- Few-shot adaptation to new domains without retraining

---

**Citation Information**:

Shi, L., Tang, Z., Zhang, N., Zhang, X., & Yang, Z. (2024). A Survey on Employing Large Language Models for Text-to-SQL Tasks. *ACM Computing Surveys*, 56(13), 1-38. https://doi.org/10.1145/3737873

arXiv: https://arxiv.org/abs/2407.15186

