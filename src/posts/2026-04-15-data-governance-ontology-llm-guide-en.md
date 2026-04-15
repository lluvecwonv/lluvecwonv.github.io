---
title: "Data Governance and Ontology - Essential Infrastructure for the LLM Era"
date: 2026-04-15
summary: A comprehensive guide explaining Data Governance and Ontology from both Library & Information Science and Computer Science perspectives, covering the evolution from RAG → GraphRAG → Ontology-RAG and Knowledge Graph integration in modern LLM systems.
tags: [Data Governance, Ontology, Knowledge Graph, RAG, GraphRAG, LLM, Hallucination, Memorization, Bias]
category: AI/개발
language: en
---

Data Governance and Ontology are not merely academic terms in the LLM era—they are the core infrastructure that determines model reliability and performance. This post explains both concepts from Library & Information Science (LIS) and Computer Science perspectives, then traces the evolution from RAG → Knowledge Graph → Ontology in recent research.

---

## 1. Data Governance

### 1.1 One-Line Definition

Data Governance = **The rules and frameworks that control the entire lifecycle of data—creation, management, and usage.**

### 1.2 Library & Information Science Perspective

In LIS, Data Governance addresses the question: "How do we classify, manage, and make information trustworthy?" The core components are threefold.

**Classification** — By what criteria do we organize information? Just as libraries use DDC (Dewey Decimal Classification) or LC (Library of Congress Classification), all data must be organized under consistent criteria.

**Metadata** — Information that describes the data itself. Just as books have authors, publication dates, subject headings, and ISBNs, data requires metadata such as provenance, creation date, format, and license information.

**Control** — Defining who can access data, how, and under what conditions. This mirrors the access restrictions placed on rare materials in a special collections room.

Information that simply accumulates without governance becomes noise, not data. A book without author or publication date is unsearchable. Documents stored under inconsistent naming conventions lead to retrieval failures. In essence, Data Governance creates the structure for **Findability + Reliability + Reusability**—closely aligned with the FAIR principles (Findable, Accessible, Interoperable, Reusable).

### 1.3 Computer Science / LLM Perspective

In the context of LLMs, Data Governance becomes even more critical because the model is a system that directly reflects its training data.

**Training Data Quality Management**: Erroneous data produces hallucination. Biased data produces bias. Duplicated data increases memorization. The FAIR principles must extend to training data as well.

**Data Control**: Data containing PII (Personally Identifiable Information) risks privacy leakage. Copyrighted data creates legal liability. PII filtering and license verification must be performed before training.

**Data Distribution Management**: Over-representation of a specific domain leads to overfitting in that area and degraded performance elsewhere. Balanced domain distribution is essential.

In short, **Data Governance = the hidden control system that determines model behavior.**

### 1.4 Concrete Example: Building a QA Dataset

| Aspect | Without Governance | With Governance |
|--------|-------------------|-----------------|
| Q-A Relationship | Same question, different answers | Consistency verified |
| Provenance | None | Source tagged |
| Freshness | Contains outdated info | Periodically updated |
| Result | Hallucination, inconsistency | Higher accuracy |

---

## 2. Ontology

### 2.1 One-Line Definition

Ontology = **A structure that explicitly defines concepts and their relationships.**

### 2.2 Library & Information Science Perspective

In LIS, ontology goes beyond mere classification—it defines semantic relationships between concepts.

Traditional classification offers a simple hierarchy: Computer Science > Artificial Intelligence > NLP. But an ontology forms a much richer semantic network:

```
NLP ⊂ AI ⊂ Computer Science
NLP → has_task → Translation, QA, Summarization
QA → requires → Context
QA → evaluated_by → F1, Exact Match
Translation → related_to → Multilingual NLP
```

This is not just classification—it is a **semantic network**. The significance is that it enables search by meaning rather than by keyword. When searching for "machine translation," an ontology can also surface documents stored under "Translation" or "Neural MT."

### 2.3 Computer Science / LLM Perspective

Ontology serves three key roles in LLMs:

**Providing Semantic Structure**: Explicitly representing relationships between terms strengthens context reasoning. Knowing that "cat is a feline" and "feline belongs to animal class" lets a model infer "cat is an animal" without having seen this exact statement in training data.

**Core Role in RAG**: Enables relationship-based retrieval across documents. Structural search provides more accurate context than simple embedding similarity. This is detailed in Section 4 below.

**Reducing Hallucination**: Enables consistency checking—"Is A part of B?", "Does X require Y?" These verification capabilities can validate model outputs against a formal knowledge structure.

In short, **Ontology = the structural map through which a model understands the world.**

### 2.4 Concrete Example: Processing "Apple"

Without ontology, the word "Apple" creates ambiguity—fruit or company? With ontology:

```
Apple (Company) → produces → iPhone, MacBook
Apple (Company) → founded_by → Steve Jobs
Apple (Fruit) → category → Food
Apple (Fruit) → grows_on → Tree
```

Context-based disambiguation becomes straightforward. The query "Apple's new product" automatically routes to the Company ontology.

---

## 3. Data Governance vs. Ontology

### 3.1 Key Differences

Governance is about "management rules"; Ontology is about "semantic structure."

| Aspect | Data Governance | Ontology |
|--------|----------------|----------|
| Role | Controls data quality/distribution | Provides reasoning structure |
| Core Question | "What data goes in?" | "What are the relationships?" |
| On Failure | Garbage in, garbage out | Semantic confusion |
| Analogy | Library operating policy | Library classification system |

### 3.2 Interdependence

Ontology serves as a component within governance. In a RAG system, governance decides which documents to include and filters for quality. Ontology defines inter-document relationships and improves retrieval structure. Both are necessary for the system to function properly.

---

## 4. How RAG, Knowledge Graph, and Ontology Connect in LLMs

This section traces the evolution of retrieval paradigms in LLMs and explains how RAG, Knowledge Graphs, and Ontology form a layered architecture.

### 4.1 First Generation: Vanilla RAG (Vector Search)

The most basic RAG architecture. Documents are chunked, embedded into vectors, and stored in a vector database. Given a query, the system retrieves top-k chunks by embedding similarity and feeds them as context to the LLM.

```
[Query] → embedding → vector DB search → top-k chunks → LLM → [Answer]
```

**Strengths**: Simple to implement. Quickly applicable to any domain.

**Limitations**: Using only vector similarity, it **ignores relationships**. For "Who is Company A's CEO?", chunks about Company A and chunks about the CEO may be retrieved separately, making accurate connection difficult. Particularly weak on multi-hop reasoning queries.

### 4.2 Second Generation: GraphRAG (Knowledge Graph-Based Retrieval)

GraphRAG extracts entities and relations from documents to build a Knowledge Graph (KG), then leverages this graph for retrieval.

```
[Documents] → entity/relation extraction → Knowledge Graph
[Query] → KG traversal + vector search → structured context → LLM → [Answer]
```

**What is a Knowledge Graph?** A graph structure composed of entities and relations. For example:

```
(Elon Musk) --[CEO_of]--> (Tesla)
(Tesla) --[produces]--> (Model 3)
(Model 3) --[category]--> (Electric Vehicle)
```

This structure enables answering multi-hop questions like "What electric car did Tesla's CEO create?" by following the path: Elon Musk → Tesla → Model 3.

**Strengths**: Multi-hop reasoning via entity relationships. More structural and accurate context than pure vector search.

**Limitations**: KG defines only instance-level relationships between individual entities, lacking a higher-level **conceptual schema**. The relationship between "Electric Vehicle" and "Automobile," or the subsumption between "CEO" and "Executive," is difficult to express with KG alone.

### 4.3 Third Generation: Ontology-RAG (Ontology-Based Retrieval)

Ontology-RAG layers an ontology on top of the KG, leveraging concept-level semantic structure for retrieval.

```
[Domain Knowledge] → Ontology definition (concepts + relations + constraints)
[Documents] → Ontology-based entity classification + KG construction
[Query] → Ontology-based semantic search + KG traversal + vector search → LLM → [Answer]
```

**What Ontology adds to KG**:

```
# Knowledge Graph (instance level)
(Tesla) --[produces]--> (Model 3)

# Ontology (concept level)
Company ⊃ {Tesla, Toyota, BMW}
Product ⊃ {Model 3, Camry, i4}
Company --[produces]--> Product  (class-level relation)
ElectricVehicle ⊂ Vehicle ⊂ Product  (concept hierarchy)
```

With ontology, a query about "electric vehicle manufacturers" can traverse the concept hierarchy "ElectricVehicle ⊂ Vehicle" to find not just Tesla but all relevant EV manufacturers.

### 4.4 Generational Comparison

| Aspect | Vanilla RAG | GraphRAG | Ontology-RAG |
|--------|------------|----------|-------------|
| Retrieval Unit | Text chunk | Entity + relation | Concept + relation + instance |
| Relation Use | None | Instance-level | Instance + concept-level |
| Multi-hop | Weak | Capable | Enhanced |
| Disambiguation | Difficult | Partial | Concept-based, complete |
| Hallucination | High | Reduced | Greatly reduced |
| Build Complexity | Low | Medium | High |

### 4.5 Full Pipeline Architecture

The three technologies form a layered hierarchy:

```
┌──────────────────────────────────────────────────┐
│            Ontology (Conceptual Schema)           │
│  - Class hierarchy, property definitions,         │
│    constraints                                    │
│  - "ElectricVehicle ⊂ Vehicle ⊂ Product"         │
├──────────────────────────────────────────────────┤
│         Knowledge Graph (Knowledge Base)          │
│  - Entity + relation instances                    │
│  - "(Tesla) --produces--> (Model 3)"             │
├──────────────────────────────────────────────────┤
│        RAG (Retrieval-Augmented Generation)       │
│  - Vector search + structural search combined     │
│  - Provides context to LLM                        │
├──────────────────────────────────────────────────┤
│              LLM (Language Model)                 │
│  - Final answer generation                        │
└──────────────────────────────────────────────────┘
```

Ontology sits at the top providing the conceptual schema. Knowledge Graph stores concrete entities and relations within that schema. RAG performs retrieval using these structures. The LLM generates the final answer.

---

## 5. Recent Research Trends (2024–2026)

### 5.1 Ontology + RAG Research

**OG-RAG (EMNLP 2025)** — Ontology-Grounded Retrieval-Augmented Generation. Overcomes vanilla RAG's vector search limitations through ontology-based retrieval. Achieved +55% improvement in factual recall and +40% in correctness.

**OntoRAG (2025)** — Automated Ontology Derivation for QA. Automatically generates ontologies from unstructured data (PDFs, web) for RAG. Outperformed both vector RAG and GraphRAG in comprehensiveness.

**Ontology-based RAG (2024–2025)** — Triple-based (subject-predicate-object) retrieval method that reduces hallucination and enables semantic search.

### 5.2 Ontology + Reasoning Research

**Ontology-Guided Reverse Thinking (ACL 2025)** — Directly uses ontology in the reasoning process, performing structure-based rather than text-based reasoning. Marks LLM's evolution from "text generator" to "knowledge reasoner."

### 5.3 Ontology Auto-Generation Research

**RIGOR (2025)** — Retrieval-Augmented Ontology Generation. Combines database schema + LLM + RAG to automatically generate ontologies. Represents the beginning of automated data governance.

**OntoEKG (2026)** — LLM-driven Ontology Construction for Enterprise. Automatically generates ontologies from enterprise data, marking the entry into automated data governance.

### 5.4 Knowledge Graph + LLM Integration

**Ontology-grounded KG for LLM Reliability (2026)** — Combines ontology and KG to build LLM output verification systems. Achieved hallucination reduction and reliability improvement in clinical QA.

**LLM and Knowledge Graph Integration Survey (2026)** — Presents the unified direction of LLM + KG + Ontology integration, covering both KG-enhanced LLM and LLM-generated KG research streams.

---

## 6. Connection to Core LLM Problems

### 6.1 Bias

Root cause: governance failure (data bias). Training data skewed toward specific demographics directly manifests as bias in model outputs. The solution combines data distribution control (governance) with ontology-based balanced structure design.

### 6.2 Hallucination

Dual origin: erroneous data (governance problem) and insufficient relationship understanding (ontology problem). Ontology-RAG addresses both simultaneously—verifying factual relationships through concept structure while ensuring data quality through governance.

### 6.3 Memorization

Primarily caused by governance failure. Excessive duplicate data causes the model to memorize specific sentences verbatim. The solution involves deduplication and data tracking.

An intriguing connection exists between memorization and ontology. Memorization is bound to surface-level patterns, while ontology is bound to semantic structure. Memorization depends on "sentences"; ontology depends on "concepts."

```
Memorization: "A cat is an animal" → memorizes this exact sentence
Ontology:     Cat ⊂ Mammal ⊂ Animal → understands conceptual relations
```

This distinction is the key to separating memorization from genuine understanding.

---

## 7. Research Trend Summary

### 7.1 RAG Evolution

```
Vanilla RAG → GraphRAG → Ontology-RAG
(simple search)  (relational search)  (semantic search)
```

### 7.2 Data Structure Evolution

```
Raw Data → Knowledge Graph → Ontology
(unstructured)  (structured)    (semantic)
```

### 7.3 LLM Role Transformation

```
Text Generator → Knowledge Reasoner
```

---

## 8. Key Takeaways

**Data Governance** determines *what* the model learns. **Ontology** determines *how* the model understands it.

Combined: **LLM behavior is the product of Data Governance and Ontology design.**

The direction of recent research is clear: **LLM + Ontology + Knowledge Graph = Trustworthy AI**. RAG is evolving from vector search to relational search to semantic search, with ontology as the central axis of this evolution.

Governance without ontology leads to garbage in, garbage out. Ontology without governance leads to semantic confusion. Both are needed for LLMs to become truly reliable systems.
