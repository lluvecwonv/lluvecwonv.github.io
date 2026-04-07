---
title: "Paper Summary - Ragas: Automated Evaluation of Retrieval Augmented Generation"
date: 2026-04-07
summary: Summary of the EMNLP 2023 paper "Ragas," which proposes a reference-free framework for automatically evaluating RAG pipelines along three dimensions — Faithfulness, Answer Relevance, and Context Relevance — with detailed experimental results on the WikiEval benchmark.
tags: [RAG, Evaluation, LLM, Faithfulness, Hallucination, Research Note]
category: 연구노트
language: en
---

This research note summarizes the EMNLP 2023 paper **Ragas: Automated Evaluation of Retrieval Augmented Generation**.

**Authors**: Shahul Es, Jithin James, Luis Espinosa-Anke, Steven Schockaert
**Affiliations**: Exploding Gradients / CardiffNLP, Cardiff University / AMPLYFI
**Paper link**: https://arxiv.org/abs/2309.15217
**GitHub**: https://github.com/explodinggradients/ragas

## One-line Summary

The paper proposes three reference-free metrics (Faithfulness, Answer Relevance, Context Relevance) for automatically evaluating RAG system quality **without ground truth**, and demonstrates high agreement with human judgments on the WikiEval benchmark.

## 1. Introduction

LLMs capture a vast amount of world knowledge, but have two fundamental limitations. First, they cannot answer questions about events that occurred after training. Second, even the largest models struggle to memorize knowledge that is only rarely mentioned in the training corpus.

The standard solution is **Retrieval Augmented Generation (RAG)**: given a question, the system retrieves relevant passages from a corpus and feeds them along with the question to the LM. While initial approaches relied on specialized LMs for retrieval-augmented language modeling, recent work has shown that simply adding retrieved documents to the input of a standard LM also works well, making it possible to use retrieval-augmented strategies with API-only LLMs.

However, building a RAG system requires significant tuning — the retrieval model, corpus, LM, and prompt formulation all affect overall performance. **Automated evaluation** is thus paramount. Existing evaluation approaches have key problems:

- **Perplexity-based evaluation** is not always predictive of downstream performance and is inaccessible for closed models like ChatGPT and GPT-4.
- **QA dataset evaluation** usually only considers short extractive answers, which may not represent actual usage.

This paper introduces **Ragas (Retrieval Augmented Generation Assessment)**, a framework for reference-free evaluation of RAG systems, with integration into both llama-index and Langchain.

## 2. Related Work

### 2.1 Estimating Faithfulness Using LLMs

Detecting hallucinations in LLM-generated responses has been extensively studied:

- **Few-shot prompting** strategies for predicting factuality have been proposed, but existing models struggle with hallucination detection under standard prompting.
- **External KB linking** connects generated responses to facts from knowledge bases, but this is not always feasible.
- **Token probability-based methods**: BARTScore estimates factuality via the conditional probability of the generated text given the input. Other approaches convert answer validation into multiple-choice questions leveraging well-calibrated LLM probabilities, or train supervised classifiers on hidden layer weights — but the latter is unsuitable for API-only models.
- **SelfCheckGPT** addresses models without token probability access by sampling multiple answers, based on the intuition that factual answers are more stable across samples.

### 2.2 Automated Evaluation of Text Generation Systems

- **GPTScore** uses aspect-specific prompts to score passages based on average token probability.
- **Direct LLM scoring** asks ChatGPT to score on a 0-100 or 5-star scale — effective but sensitive to prompt design.
- **LLM comparison** selects the best answer among candidates, but presentation order can influence results.
- **Reference-based methods**: BERTScore and MoverScore use contextualized BERT embeddings to compare generated and reference answers. BARTScore computes precision and recall using reference answers.

The key distinction of this paper: evaluating RAG-specific quality dimensions **without reference answers**.

## 3. Evaluation Strategies

Consider a standard RAG setting where, given a question $q$, the system retrieves context $c(q)$ and generates an answer $a_s(q)$.

Ragas proposes **three core quality dimensions**.

### 3.1 Faithfulness

**Definition**: The answer $a_s(q)$ is faithful to the context $c(q)$ if the claims made in the answer can be inferred from the context.

**Measurement** (two-step process):

**Step 1 — Statement Extraction**: The LLM extracts individual statements from the answer.

> Prompt: *"Given a question and answer, create one or more statements from each sentence in the given answer."*

The goal is to decompose longer sentences into shorter, more focused assertions.

**Step 2 — Verification**: For each extracted statement $s_i$, the LLM determines whether it can be inferred from $c(q)$.

> Prompt: *"Consider the given context and following statements, then determine whether they are supported by the information present in the context. Provide a brief explanation for each statement before arriving at the verdict (Yes/No)."*

**Final score**:

$$F = \frac{|V|}{|S|}$$

where $|V|$ is the number of supported statements and $|S|$ is the total number of statements.

### 3.2 Answer Relevance

**Definition**: The answer $a_s(q)$ is relevant if it directly addresses the question in an appropriate way. This metric does not consider factuality but **penalizes incomplete answers or those containing redundant information**.

**Measurement**:

For the given answer $a_s(q)$, the LLM generates $n$ potential reverse-engineered questions $q_i$.

> Prompt: *"Generate a question for the given answer."*

Embeddings for all questions are obtained using the `text-embedding-ada-002` model, and cosine similarity $\text{sim}(q, q_i)$ is computed between the original question and each generated question.

**Final score**:

$$AR = \frac{1}{n} \sum_{i=1}^{n} \text{sim}(q, q_i)$$

Intuitively, if the answer is closely related to the original question, the reverse-engineered questions should also be similar to the original question.

### 3.3 Context Relevance

**Definition**: The retrieved context $c(q)$ is relevant to the extent that it exclusively contains information needed to answer the question. This metric penalizes inclusion of redundant information. This matters due to the cost of feeding long context passages to LLMs and the "lost in the middle" phenomenon.

**Measurement**:

The LLM extracts a subset of sentences $S_{ext}$ from $c(q)$ that are crucial to answer $q$.

> Prompt: *"Please extract relevant sentences from the provided context that can potentially help answer the following question. If no relevant sentences are found, or if you believe the question cannot be answered from the given context, return the phrase 'Insufficient Information'."*

**Final score**:

$$CR = \frac{\text{number of extracted sentences}}{\text{total number of sentences in } c(q)}$$

**All prompts and experiments used the `gpt-3.5-turbo-16k` model.**

## 4. The WikiEval Dataset

To evaluate the framework, human-annotated question-context-answer triples with quality judgments are needed. Since no suitable public dataset existed, the authors created **WikiEval**.

**Construction process**:

1. Selected 50 Wikipedia pages covering events since early 2022 (beyond the model's training cutoff), prioritizing pages with recent edits
2. Used ChatGPT to generate a question from each page's introductory section
3. Used ChatGPT to answer the generated question given the corresponding context
4. Two annotators labeled all instances along the three quality dimensions

**Inter-annotator agreement**:
- Faithfulness, Context Relevance: ~95% agreement
- Answer Relevance: ~90% agreement
- Disagreements resolved through discussion

**Evaluation data generation per dimension**:

- **Faithfulness**: ChatGPT generated answers without context to produce low-faithfulness answers; annotators chose the more faithful one
- **Answer Relevance**: ChatGPT was prompted to answer incompletely to produce low-relevance answers; annotators compared the two
- **Context Relevance**: Additional less-relevant sentences were added by scraping Wikipedia backlinks to create low-relevance contexts

## 5. Experimental Results

### Experimental Setup

Each WikiEval instance involves pairwise comparison of two answers or two contexts. The metric is accuracy: how often the metric's preferred answer/context matches the human annotators' choice.

### Baselines

Two baselines are compared:

**GPT Score**: ChatGPT assigns a 0-10 score for each quality dimension. For example, the faithfulness evaluation prompt states: *"Faithfulness measures the information consistency of the answer against the given context. Any claims that are made in the answer that cannot be deduced from context should be penalized. Given an answer and context, assign a score for faithfulness in the range 0-10."* Ties are broken randomly.

**GPT Ranking**: ChatGPT directly selects the preferred answer/context from two candidates, given a definition of the quality dimension.

### Results Table

| Metric | Faithfulness | Answer Rel. | Context Rel. |
|--------|:---:|:---:|:---:|
| **Ragas** | **0.95** | **0.78** | **0.70** |
| GPT Score | 0.72 | 0.52 | 0.63 |
| GPT Ranking | 0.54 | 0.40 | 0.52 |

*Agreement with human annotators in pairwise comparisons on the WikiEval dataset (accuracy)*

### Analysis

- **Faithfulness**: Ragas achieved **0.95** accuracy — the statement decomposition + individual verification strategy is far more effective than naive scoring.
- **Answer Relevance**: **0.78** — lower, largely because differences between candidate answers are often very subtle.
- **Context Relevance**: **0.70** — the hardest dimension. ChatGPT often struggles with selecting crucial sentences from the context, especially for longer contexts.

Ragas significantly outperformed both GPT Score and GPT Ranking across all dimensions.

## 6. Conclusions and Implications

This paper highlights the need for automated, reference-free evaluation of RAG systems and proposes the Ragas framework addressing three core dimensions.

**Key contributions**:

1. Three automated evaluation metrics — **Faithfulness, Answer Relevance, and Context Relevance** — all operating without reference answers.
2. **WikiEval**, a benchmark with human judgment labels for evaluating RAG metrics.
3. Empirical validation showing Ragas predictions closely align with human judgments, achieving 0.95 accuracy on Faithfulness.

**Practical implications**: Ragas integrates with llama-index and Langchain, enabling RAG developers to quickly iterate on evaluation cycles without ground truth annotations.

**Limitations**: The observed difficulty in Context Relevance evaluation for long contexts, and the overall dependence of all metrics on the LLM's own capabilities (gpt-3.5-turbo-16k), are notable limitations.
