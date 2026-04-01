---
title: "Awesome LLM-based Text2SQL: A Comprehensive Resource Collection"
date: 2026-04-01
summary: "A comprehensive compilation of resources for LLM-based Text-to-SQL task. Includes 9 survey papers, 5 benchmarks, 14 datasets, 40+ In-Context Learning methods, 15+ Fine-tuning approaches, and various tools for natural language-to-SQL conversion research and applications."
tags: [LLM, Text-to-SQL, Awesome List, GitHub, Survey, Benchmark, Spider, BIRD, Research]
category: Research Notes
language: en
---

## Introduction

The **Awesome-LLM-based-Text2SQL** repository, launched on September 14, 2025, by the DEEP research lab at Hong Kong Polytechnic University, represents the most comprehensive collection of resources in the LLM-based Text-to-SQL field. This repository systematically organizes cutting-edge academic papers, benchmark datasets, public datasets, and diverse methodologies for natural language-to-SQL conversion using large language models.

This comprehensive guide explores the repository structure, major resources, and practical applications of these materials.

## 1. Survey Papers (9 Papers)

### Core Survey Paper

**Next-Generation Database Interfaces: A Survey of LLM-based Text-to-SQL** (TKDE 2025)
- The foundational survey that motivated the creation of this repository
- Comprehensively covers the latest developments in LLM-based Text-to-SQL
- Encompasses models, methodologies, evaluation metrics, and future directions

### Complete Survey Collection

| Paper Title | Venue | Year | Key Coverage |
|-------------|-------|------|--------------|
| Next-Generation Database Interfaces Survey | TKDE | 2025 | Complete overview of LLM-based Text-to-SQL |
| Text-to-SQL Methodology Survey | ACM Computing Surveys | 2025 | Classification and analysis of Text-to-SQL approaches |
| Database Interface Evolution | IEEE TKDE | 2025 | Historical development of database interfaces |
| SQL Generation Challenges | VLDB Journal | 2023 | Analysis of fundamental challenges in SQL generation |
| Natural Language-DB Interaction | COLING | 2022 | Research on human-database interaction through NL |

These survey papers collectively provide essential understanding of the field's evolution, core challenges, and state-of-the-art techniques in Text-to-SQL research.

## 2. Benchmark Datasets (5 Benchmarks)

### BIRD (Big-Bench Instruct-tuning on Real-world and Diverse SQL)
- **Source**: NeurIPS 2023
- **Characteristics**: Benchmark based on real-world databases for Text-to-SQL evaluation
- **Scale**: Comprehensive coverage of diverse domains
- **Difficulty**: High difficulty reflecting real-world application scenarios
- **Evaluation Metrics**: Execution Accuracy, Valid Efficiency Score (VES)
- **Notable Feature**: Focuses on complex database interactions and realistic queries

### Spider 1.0
- **Source**: EMNLP 2018
- **Dataset Size**: 10,181 question-SQL pairs
- **Coverage**: Over 200 database schemas across diverse domains
- **Difficulty Levels**: Ranging from easy to extremely difficult
- **Impact**: Most influential benchmark in Text-to-SQL research community
- **Components**: Both single-domain and cross-domain evaluation splits

### Spider 2.0
- **Source**: ICLR 2025
- **Improvements**: Enhanced version building on Spider 1.0
- **New Elements**: More complex JOINs, sophisticated subqueries, advanced aggregate functions
- **Evaluation**: Refined metrics for more nuanced performance assessment
- **Focus**: Handling of complex SQL constructs and edge cases

### BIRD-CRITIC
- **Source**: NeurIPS 2025
- **Innovation**: Critical analysis extension to BIRD benchmark
- **Purpose**: In-depth error analysis and improvement pathways
- **Contents**: Error type classification, difficult case analysis, debugging guidance
- **Application**: Understanding and diagnosing model failures

### BIRD-INTERACT
- **Source**: ICLR 2026
- **Novelty**: Interactive benchmark for dialogue-based Text-to-SQL
- **Components**: Multi-turn conversations, clarification requests, iterative refinement
- **Challenge**: Realistic user-system interaction scenarios
- **Evaluation Focus**: Ability to handle ambiguous and context-dependent queries

## 3. Original Datasets (7 Datasets)

This section covers the foundational public benchmarks that established the field of Text-to-SQL research.

### WikiSQL
- **Size**: 80,654 question-SQL pairs
- **Foundation**: Wikipedia tables
- **Complexity**: Primarily simple SELECT queries
- **Use Case**: Foundation for initial models, basic research tasks
- **Characteristics**: Relatively straightforward mapping from NL to SQL
- **Significance**: First large-scale dataset for the field

### Spider
- **Size**: 10,181 question-SQL pairs
- **Richness**: Over 200 realistic database schemas
- **Complexity**: Intermediate to advanced (includes JOINs, subqueries, aggregations)
- **Adoption**: Most widely-used benchmark in the research community
- **Splits**: Both single-domain and cross-domain evaluation settings
- **Influence**: Established standard evaluation practices in the field

### CoSQL
- **Size**: 15,598 interaction records
- **Foundation**: Built upon Spider dataset
- **Innovation**: First conversational Text-to-SQL dataset
- **Components**: Multi-turn user-system interactions with context dependency
- **Use Case**: Dialogue-based SQL generation research
- **Characteristics**: Requires maintaining conversation context and handling clarifications

### DuSQL
- **Size**: 23,797 question-SQL pairs
- **Language**: Chinese-centric dataset
- **Innovation**: Enabling multilingual Text-to-SQL research
- **Domains**: Diverse industrial and commercial databases
- **Significance**: Foundation for non-English Text-to-SQL development
- **Challenge**: Language-specific characteristics and cultural context

### SQUALL
- **Size**: 11,468 question-SQL pairs
- **Dual Representation**: Includes both natural language and logical forms
- **Innovation**: Semantic parsing perspective on Text-to-SQL
- **Use Case**: Structured semantic understanding research
- **Characteristics**: Provides intermediate logical representations
- **Application**: Bridge between NL understanding and SQL generation

### KaggleDBQA
- **Size**: 272 question-SQL pairs
- **Foundation**: Kaggle datasets
- **Realism**: Real data analysis scenarios from data science competitions
- **Use Case**: Practical data exploration and analysis tasks
- **Characteristics**: Focuses on analytical queries over real datasets
- **Limitation**: Smaller scale but high practical relevance

### FinSQL/BULL
- **Size**: 4,966 question-SQL pairs
- **Domain**: Financial databases and queries
- **Specialization**: Financial terminology and domain-specific concepts
- **Use Case**: Domain-adapted Text-to-SQL research
- **Characteristics**: Requires financial knowledge for accurate interpretation
- **Challenge**: High domain expertise required for evaluation

## 4. Post-Annotated Datasets (7 Enhanced Datasets)

These datasets represent re-annotated versions of existing datasets, enhanced for specific research purposes.

### Spider-Realistic
- **Purpose**: More natural language expressions reflecting actual user queries
- **Innovation**: Improvement over original Spider's sometimes artificial expressions
- **Use Case**: Training models on realistic user language patterns
- **Enhancement**: Linguistic naturalness and diversity of phrasings
- **Application**: Better generalization to real-world query patterns

### Spider-SYN (Syntactic Variations)
- **Innovation**: Multiple natural language expressions for identical SQL queries
- **Purpose**: Evaluating model robustness to linguistic variation
- **Use Case**: Data augmentation and diverse query understanding
- **Application**: Testing model generalization and linguistic invariance
- **Benefit**: Comprehensive assessment of semantic comprehension

### Spider-DK (Domain Knowledge)
- **Enhancement**: Domain knowledge-based annotations
- **Components**: Semantic information about database schemas
- **Purpose**: Testing semantic understanding beyond syntactic parsing
- **Use Case**: Knowledge-aware SQL generation research
- **Application**: Incorporating external knowledge into models

### Spider-SS/CG (Schema Simplification/Column Generation)
- **Innovation**: Simplified schema representations with auto-generated descriptions
- **Purpose**: Evaluating schema comprehension and description quality
- **Components**: Automatically generated column explanations
- **Use Case**: Testing ability to work with imperfect schema information
- **Application**: Practical scenarios with incomplete documentation

### ADVETA (Adversarial)
- **Innovation**: Adversarially crafted test cases
- **Purpose**: Identifying and stress-testing model weaknesses
- **Components**: Subtle query patterns that induce errors
- **Application**: Robustness evaluation and failure mode analysis
- **Benefit**: Understanding model limitations and edge cases

### Dr.Spider (Medical Domain)
- **Specialization**: Healthcare and medical domain
- **Foundation**: Spider adapted for medical queries
- **Purpose**: Domain-specific Text-to-SQL research
- **Characteristics**: Medical terminology and healthcare database concepts
- **Application**: Medical information system query generation

### Spider-Vietnamese
- **Language**: Vietnamese translation of Spider
- **Purpose**: Supporting non-English multilingual research
- **Innovation**: Vietnamese language Text-to-SQL research
- **Use Case**: Multilingual model evaluation
- **Benefit**: Extending research beyond English-centric approaches

## 5. In-Context Learning Methods (40+ Methods)

These prompting-based approaches leverage LLMs' in-context learning capability to achieve high performance without model fine-tuning.

### Top Performance on BIRD Benchmark

**AskData + GPT-4o**
- **Development Set Accuracy**: 77.64%
- **Test Set Accuracy**: 81.95%
- **Innovation**: Systematic prompt engineering combined with state-of-the-art model
- **Approach**: Multi-stage prompting for database schema understanding
- **Strength**: Superior performance on complex real-world databases
- **Method**: Hierarchical schema exploration and iterative query construction

**Agentar-Scale-SQL**
- **Development Set Accuracy**: 74.90%
- **Innovation**: Agent-based scalable approach
- **Strength**: Extensibility to various database scales
- **Method**: Autonomous agent for multi-step SQL reasoning
- **Scalability**: Handles databases of varying complexity
- **Application**: Production-ready deployment scenarios

### Top Performance on Spider Benchmark

**MiniSeek**
- **Test Set Accuracy**: 91.2%
- **Innovation**: Efficiency without sacrificing accuracy
- **Strength**: Lightweight model achieving near state-of-the-art performance
- **Advantage**: Balance between inference speed and precision
- **Application**: Resource-constrained deployment scenarios
- **Efficiency**: Reduced computational requirements while maintaining quality

**DAIL-SQL + GPT-4**
- **Test Set Accuracy**: 86.6%
- **Method**: Dynamic In-Context Learning (DAIL)
- **Innovation**: Adaptive context selection and optimization
- **Strength**: Efficient context utilization with large models
- **Focus**: Balancing context length and performance
- **Technique**: Dynamic selection of relevant examples for in-context learning

### Notable Representative Methods

**DIN-SQL (Decoupled In-Context Numbering)**
- **Innovation**: Decoupling schema and query processing
- **Strength**: Improved handling of complex JOINs and relationships
- **Method**: Separate reasoning paths for structure and semantics
- **Application**: Complex multi-table query generation

**C3 (Chain-of-thought Cross-consistency)**
- **Innovation**: Multiple reasoning paths with consistency validation
- **Strength**: Error detection and self-correction mechanisms
- **Method**: Cross-validating reasoning across different approaches
- **Benefit**: Improved accuracy through ensemble-like reasoning

**LinkAlign (Linking and Alignment)**
- **Innovation**: Semantic alignment between natural language and schema elements
- **Strength**: Better entity-attribute matching
- **Method**: Explicit linking mechanisms for column and table identification
- **Application**: Schema understanding and relevance filtering

**ReFoRCE (Retrieval-Free Reasoning for Complex Entities)**
- **Innovation**: Complex entity handling without external retrieval
- **Strength**: Self-contained reasoning without knowledge bases
- **Method**: Internal reasoning about complex domain concepts
- **Benefit**: Reduced latency and dependency on external resources

## 6. Fine-Tuning Methods (15+ Approaches)

These supervised learning approaches train models directly on Text-to-SQL datasets, achieving high accuracy through specialized architectures and training procedures.

### Top Fine-Tuning Approaches

**RESDSQL-3B + NatSQL**
- **Model Size**: 3 billion parameters (lightweight)
- **Spider Test Accuracy**: 79.9%
- **Innovation**: Natural SQL representation learning
- **Advantage**: High performance with small model size
- **Efficiency**: Achieves competitive results with minimal computational overhead
- **Approach**: Intermediate representation using Natural SQL

**OmniSQL**
- **Innovation**: Unified multi-purpose SQL generation model
- **Coverage**: Multiple domains and languages in single model
- **Strength**: General-purpose Text-to-SQL system
- **Application**: Production systems requiring broad coverage
- **Flexibility**: Handles diverse database schemas and query types

**MARS-SQL (Multi-Agent Reasoning for SQL)**
- **Innovation**: Multi-agent system for collaborative reasoning
- **Components**: Separate agents for schema analysis, entity linking, query generation
- **Strength**: Decomposed reasoning improves complex query handling
- **Method**: Agent cooperation and information passing
- **Advantage**: Handling of complex queries through specialization

**ROUTE (Routing-based Task-specific Execution)**
- **Innovation**: Dynamic routing to task-specific models
- **Method**: Different models specialized for different difficulty levels
- **Advantage**: Optimal model selection per query type
- **Flexibility**: Combination of specialized and general models
- **Strength**: Query-dependent model selection for improved performance

**CodeS (Code-based SQL Generation)**
- **Innovation**: Generation through intermediate code representations
- **Method**: Multi-stage process with intermediate format
- **Strength**: Logical correctness improved through intermediate steps
- **Advantage**: Verifiable intermediate representations
- **Application**: Safety-critical database query systems

### Fine-Tuning Method Taxonomy

| Method Category | Example | Key Innovation | Primary Advantage |
|-----------------|---------|-----------------|------------------|
| Sequence-to-Sequence | Basic Encoder-Decoder | End-to-end learning | Simplicity and interpretability |
| Graph-based | Graph Neural Networks | Schema as graph structure | Relationship encoding |
| Syntax-aware | Grammar-constrained decoding | Syntactic validity enforcement | Grammar correctness |
| Semantic Parsing | Structured semantic representation | Intermediate logical forms | Semantic precision |
| Reinforcement Learning | Policy-based optimization | Execution accuracy reward | End-task optimization |
| Pre-trained Models | BERT-to-SQL, T5-based | Transfer learning from NL | Leveraging pre-trained representations |

## 7. Tools and Libraries

### SQLGlot
- **Purpose**: SQL dialect translation and manipulation
- **Capabilities**: Query normalization, validation, optimization
- **Use Case**: Validating and standardizing generated SQL queries
- **Features**: Supports multiple SQL dialects (MySQL, PostgreSQL, T-SQL, etc.)
- **Application**: Ensuring portability and correctness of generated queries
- **Benefit**: Single API for multi-dialect support

### DB-GPT
- **Purpose**: Specialized GPT system for database interaction
- **Components**: Natural language-to-database interaction interface
- **Capabilities**: Data analysis, report generation, data management
- **Integration**: Works with various database systems
- **Application**: End-to-end natural language interface for databases
- **Strength**: Comprehensive database management through natural language

### DB-GPT-Hub
- **Purpose**: Ecosystem and marketplace for DB-GPT extensions
- **Contents**: Community plugins, pre-trained models, templates
- **Use Case**: Production-ready deployment with ecosystem support
- **Community**: Active community contributions and shared resources
- **Extensibility**: Plugin architecture for customization
- **Application**: Enterprise-scale Text-to-SQL deployment

### PremSQL (Premium SQL Service)
- **Purpose**: Commercial Text-to-SQL service platform
- **Delivery**: Cloud-based API with managed infrastructure
- **Strength**: Automatic scaling and managed operations
- **Features**: High availability, monitoring, and support
- **Application**: Enterprise applications requiring SLA guarantees
- **Benefit**: Outsourced infrastructure and operational management

### AI-for-Database
- **Purpose**: AI-based database optimization
- **Capabilities**: Index optimization, query plan optimization, workload analysis
- **Innovation**: Machine learning for database performance tuning
- **Application**: Database performance enhancement beyond SQL generation
- **Strength**: Holistic database optimization rather than query generation alone
- **Benefit**: Improved end-to-end system performance

## 8. Repository Utilization Guide

### 8.1 Starting Research in Text-to-SQL

When beginning Text-to-SQL research, follow this recommended sequence:

**Phase 1: Foundation Building**
1. Read the TKDE 2025 Survey paper for comprehensive field overview
2. Study Spider 1.0 and BIRD benchmarks to understand evaluation standards
3. Review representative papers (DIN-SQL, C3, RESDSQL) to learn core concepts
4. Understand the problem formulation and common challenges

**Phase 2: Practical Implementation**
1. Implement baseline methods using provided codebases
2. Evaluate on Spider benchmark to establish baseline performance
3. Reproduce published results to validate understanding
4. Analyze error patterns and failure modes

**Phase 3: Method Development**
1. Identify underperforming aspects from error analysis
2. Propose targeted improvements based on analysis
3. Implement and validate enhancements
4. Compare results with published methods

### 8.2 Model Evaluation Strategy

For comprehensive model evaluation:

**Tier 1: Basic Evaluation**
1. Start with Spider 1.0 for standard performance measurement
2. Calculate Exact Match and Execution Accuracy metrics
3. Compare against published baselines
4. Analyze error distribution

**Tier 2: Comprehensive Evaluation**
1. Evaluate on Spider 2.0 for complex query handling
2. Test on BIRD for realistic database scenarios
3. Use BIRD-CRITIC for detailed error analysis
4. Identify specific failure patterns

**Tier 3: Domain and Language Diversity**
1. Test on domain-specific datasets (FinSQL, Dr.Spider)
2. Evaluate multilingual performance (DuSQL, Spider-Vietnamese)
3. Assess robustness on adversarial examples (ADVETA)
4. Measure cross-domain generalization

### 8.3 Performance Improvement Strategy

**For Rapid Performance Gains (Quick Wins)**
- **Approach**: Apply In-Context Learning methods
- **Effort**: Minimal implementation required
- **Timeline**: Days to weeks
- **Tools**: Use GPT-4o, Claude with optimized prompts
- **Methods**: DIN-SQL, C3, LinkAlign
- **Limitation**: Limited to LLM capabilities

**For Maximum Accuracy (Production Ready)**
- **Approach**: Implement Fine-tuning methods
- **Effort**: Substantial engineering and compute required
- **Timeline**: Weeks to months
- **Models**: RESDSQL, OmniSQL, MARS-SQL
- **Requirement**: Significant computational resources
- **Benefit**: Highest achievable accuracy and control

**For Production Deployment (Enterprise Scale)**
- **Approach**: Utilize existing tools and platforms
- **Resources**: DB-GPT, DB-GPT-Hub, PremSQL
- **Effort**: Integration and customization
- **Timeline**: Days to weeks depending on integration scope
- **Benefit**: Proven reliability and support
- **Scalability**: Built-in scaling and monitoring

## 9. Recent Advances and Trends (2025-2026)

### Key Developments in 2025

**Emergence of Large Model Dominance**
- GPT-4o's superior performance elevated In-Context Learning approaches
- Prompt engineering became primary optimization strategy
- Cost-performance trade-offs became central consideration

**Benchmark Evolution**
- Spider 2.0 introduced more sophisticated query requirements
- BIRD-INTERACT brought conversational aspects into evaluation
- BIRD-CRITIC enabled deeper error analysis and understanding

**Shift Towards User-Centric Design**
- Conversational interfaces gained prominence
- Multi-turn interaction became standard expectation
- User feedback incorporation in model refinement

**Multilingual and Domain Expansion**
- Non-English datasets received increased attention
- Domain-specific benchmarks (medical, financial) proliferated
- Cross-lingual transfer learning explored

**Efficiency-Performance Trade-offs**
- MiniSeek demonstrated 91.2% accuracy with small models
- Edge deployment became viable
- Resource-constrained scenarios became competitive

### Future Research Directions (2026+)

**Efficiency Research**
- Achieving high accuracy with minimal computational overhead
- On-device inference and edge deployment
- Latency-critical real-time applications

**Interpretability and Explainability**
- Understanding model decision processes
- Generating explanations for generated queries
- Trust and safety in automated systems

**Robustness and Safety**
- Resilience against adversarial inputs (ADVETA focus)
- Handling schema evolution and database changes
- Security against SQL injection and misuse

**Real-time Interactive Systems**
- Sub-second latency requirements
- Dynamic context understanding
- Conversational refinement mechanisms

**Multilingual and Cross-cultural**
- Supporting low-resource languages
- Cultural context sensitivity
- Code-mixing and multilingual edge cases

## 10. Conclusion

The **Awesome-LLM-based-Text2SQL** repository represents the state-of-the-art compendium of resources in the Text-to-SQL field. Spanning from 9 comprehensive survey papers through 5 major benchmarks, 14 specialized datasets, 40+ In-Context Learning approaches, and 15+ Fine-tuning methodologies, it provides complete coverage of the field's landscape.

### Key Capabilities Enabled by This Repository

**For Academic Research**
- Comprehensive understanding through latest survey papers
- Standardized evaluation on established benchmarks
- Reproducible comparison with published methods
- Identification of research gaps and opportunities

**For Practitioners and Engineers**
- Complete methodology toolkit for production systems
- Proven approaches with documented performance
- Tools for rapid prototyping and deployment
- Best practices from research community

**For Industry Applications**
- Ready-to-use solutions via DB-GPT and related tools
- Scalable infrastructure recommendations
- Cost-performance optimization strategies
- Risk assessment frameworks

### Strategic Value

Text-to-SQL technology bridges the gap between natural human language and structured database queries, representing a critical capability in the era of AI-assisted data access. This repository encapsulates the collective knowledge of the global research community, making advanced Text-to-SQL techniques accessible to researchers, developers, and organizations worldwide.

Whether your goal is advancing the scientific frontier of natural language understanding, building practical applications for data access, or deploying enterprise-scale systems, this repository provides the comprehensive foundation necessary for success.

## References and Resources

- **GitHub Repository**: https://github.com/DEEP-PolyU/Awesome-LLM-based-Text2SQL
- **Organization**: DEEP Lab, Hong Kong Polytechnic University
- **Launch Date**: September 14, 2025
- **Foundational Survey**: "Next-Generation Database Interfaces: A Survey of LLM-based Text-to-SQL" (TKDE 2025)

### Key Papers to Start With

1. TKDE 2025 Survey - Complete field overview
2. Spider (EMNLP 2018) - Foundational benchmark
3. BIRD (NeurIPS 2023) - Real-world focus
4. DIN-SQL - Influential ICL method
5. RESDSQL - Top fine-tuning approach

---

**Last Updated**: April 1, 2026
**Content Type**: Research Notes
**Language**: English

