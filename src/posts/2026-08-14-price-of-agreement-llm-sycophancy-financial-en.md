---
title: "Paper Review - The Price of Agreement: Measuring LLM Sycophancy in Agentic Financial Applications"
date: 2026-08-14
summary: A workshop paper at ICLR 2026 FinAI Workshop that evaluates sycophancy displayed by LLMs in agentic financial tasks. The authors find that personalized user-preference information (direct and agentic injection) is a far more pernicious inducer of sycophancy than traditional rebuttals or contradictions, and benchmark recovery strategies such as LLM-based prompt filtering, reliability scoring, and adversarial fine-tuning on the FinanceBench and FinanceAgent benchmarks.
tags: [Sycophancy, LLM, Financial AI, Agentic AI, FinanceBench, FinanceAgent, ICLR 2026, FinAI Workshop, Research Note]
category: 연구노트
language: en
---

This research note summarizes the ICLR 2026 FinAI Workshop paper **"The Price of Agreement: Measuring LLM Sycophancy in Agentic Financial Applications."**

**Authors**: Zhenyu Zhao, Aparna Balagopalan, Adi Agrawal, Dilshoda Yergasheva, Waseem Alshikh, Daniel M. Bikel
**Affiliation**: Writer, Inc.
**Paper link**: [https://arxiv.org/abs/2604.24668](https://arxiv.org/abs/2604.24668)
**Venue**: ICLR 2026 FinAI Workshop (Accepted; v1 submitted 27 Apr 2026, latest v3 9 Jun 2026)
**License**: CC BY 4.0

> **On review information**: The paper header states "Published as a workshop paper at ICLR 2026," confirming acceptance, but no publicly available reviewer comments, scores, or rejection rationale (e.g., on OpenReview) could be located for this workshop submission.

## One-line Summary

Given the increased use of LLMs in financial systems, the paper evaluates sycophancy — models prioritizing agreement with expressed user beliefs over correctness — in agentic financial tasks. It finds that models show only low-to-modest drops under user rebuttals or contradictions, but that **personalized context contradicting the reference answer** is a substantially more pernicious inducer of sycophancy, to which most models fail with low acknowledgment of the bias. Prompt-based filtering with a separate LLM moderately mitigates this but does not fully recover baseline performance.

---

## 1. Motivation: Why Sycophancy in Agentic Financial Settings?

Large Language Models (LLMs) are used in a variety of decision-making contexts — from healthcare to finance. Prior work has shown that many well-trained LLMs prioritize expected user agreement over honesty, leading to the phenomenon of "sycophancy." Sycophancy is regarded as a significant risk factor in the widespread adoption of AI systems. While much discussion has focused on sycophancy in generic settings, few efforts exist in examining sycophancy in **enterprise agentic AI scenarios, and especially in financial applications**.

The authors define sycophancy in enterprise and finance AI as:

> **an AI system's *willingness to make mistakes that would not have been committed had the model not been provided with knowledge about the current user*.**

Specifically, they consider setups where users express their preferences and beliefs in input queries to the system, and benchmark deviations in model response — primarily in terms of deviation from the expected reference answer, as well as other metrics such as acknowledgment of user preferences. The financial setting was chosen because it is a domain that has seen widespread use of LLMs, but is more safety-critical due to the sensitivity and high value of the application scenarios. The paper also focuses on **agentic setups** where models have to retrieve evidence from documents with the appropriate use of tools available in their environment — for example, extracting information from 10-K or 10-Q filings and performing mathematical reasoning to answer a question.

The paper reports four main findings:

1. Traditional notions of sycophancy, wherein the user provides an "in-context rebuttal" to the correct answer, lead to model deviations from the reference answer, but **the performance drops are low-to-modest** — distinguishing financial agentic settings from prior findings.
2. The paper introduces and studies a **new mode by which sycophancy can be introduced: via personalized context that is contrary to the reference answer**. Under this setup, LLM responses deviate substantially and performance drops significantly.
3. Performance can be partially recovered by using another LLM as an input filtering model.
4. Model-specific variations and sensitivities to different types of injections are observed.

---

## 2. Related Work

**Evaluating Sycophancy**: Prior work has shown that foundation models are prone to sycophantic behavior — prioritizing user agreement over adhering to the correct response. Models have been shown to provide responses that adhere to user stance (feedback sycophancy), flip to answers suggested as correct by users (rebuttal), and mimic user mistakes. Sycophancy has been shown to persist across single- and multi-turn human-LLM interactions, but the vast majority of such findings have been in either the social or scientific QA context. This paper benchmarks sycophancy in multi-turn and single-turn financial interactions where model outputs are either contradicted ("I don't think that's right") or rebutted ("I think the correct answer is X"). Building on prior work showing LLMs vary their conversational style under different user personas, the authors additionally study a setup where, in addition to the query, information about the user submitting the query is provided — adversarially constructed to express beliefs that contradict the reference answer.

**Mitigating Sycophancy**: Prior work has traced increased sycophancy to the model alignment stage, prompting attempts to modify training objectives, curate better data, and normalize input queries by automatically filtering subjective/misleading information. This paper attempts three techniques: (1) using an LLM as a filter to normalize input queries, (2) training models on adversarially noised datasets, and (3) introducing reliability scores.

---

## 3. Method: Quantifying and Reducing Sycophancy in Financial Settings

### 3.1 Sycophancy Induced by Rebuttals and Contradictions

Following prior work, the paper benchmarks standard rebuttal and contradiction approaches on highly specialized financial benchmarks in both in-context and agentic setups:

- **Rebuttal**: An additional user turn is appended that explicitly refutes the current model's answer, regardless of its accuracy, and asks the model to try again on the same task.
- **Contradiction**: An additional user turn is appended that not only refutes the model's answer but also proposes an answer different from the reference, then asks the model to redo the task.

### 3.2 Sycophancy Induced by Personalized Context

Finance AI primarily operates in the agentic world, where LLMs are equipped with a diverse set of tools and extensive memory systems that provide contextual information unique to each user session. Often this information is highly personalized and contains data that could induce bias on the outcome of a task. The authors expand sycophancy in financial AI applications to also cover **LLMs' tendency to favor outcomes and results that are better aligned with the current user's past behaviors and preferences without acknowledging the impact of such information** on its final outcome/decision.

They synthetically generate highly specialized users' personal beliefs, preferences, and past behaviors that would impose sycophantic bias on the model for each evaluation task's samples, then inject this information either:

- **Direct Injection**: directly in-context into the user prompt, or
- **Agentic Injection**: agentically, as a tool result from a memory or personalization tool call.

They also introduce the following metrics for a more nuanced view of finance/enterprise sycophancy:

- **Acknowledgment Rate (AR)**: the proportion of samples in which the LLM admits the sycophantic impact exerted by the personalized information on its answer (higher is better).
- **Non-acknowledgment given Error Rate (EWU)**: the proportion of samples the model fails on without sycophancy acknowledgment (lower is better).

These metrics are judged by an LLM (GPT-5-mini, minimal reasoning). A combination of low accuracy, low awareness, and high EWU indicates an AI system that's easily swayed and lacks transparency and openness.

### 3.3 Robustness Against Sycophancy via Different Guardrails

The primary guardrail benchmarked is **LLM-based Filtering ("Prompt-based")**: another LLM with a specialized prompt is used to remove any bias-inducing information that might be present in tool results or the final context sent to the main LLM.

Two additional, preliminary guardrail systems are presented in the Appendix:

- **Reliability Score**: information introduced into the model's context is assigned a reliability and bias score based on a priori understanding of the source.
- **Supervised Fine-tuning on Adversarial Noise**: noisy examples mimicking the personalized sycophantic setting are injected, and an LLM is fine-tuned with supervised fine-tuning on an external, in-domain dataset (BizBench), following prior work on adversarial noisy instruction tuning.

---

## 4. Experimental Setup (Appendix A)

**Datasets and Evaluation**:
- **FinanceBench** (Islam et al., 2023) tests the model's ability to perform information extraction, logical and mathematical reasoning in the context of financial analysis based on provided relevant financial documents (10-K or 10-Q filings).
- **FinanceAgent** (Bigeard et al., 2025) evaluates the model's ability to perform financially relevant logical and numerical reasoning in full agentic settings, where the model must call the appropriate tools correctly to first obtain relevant context information and then leverage it to arrive at correct answers.

**Comparison conditions**: performance under sycophancy injection is compared to neutral context (NC; random baseline) and to no additional information (Baseline).

**Models**: to demonstrate the impact of sycophancy in enterprise settings, the authors evaluated the latest generation of proprietary models from major providers as well as the latest open-source models that excel in agentic tasks — GPT-5-Nano, GPT-5.2, Claude Sonnet-4.5, Claude Opus-4.5, Gemini-3-Pro, GLM-4.7, Kimi-K2-Thinking, and DeepSeek-V3.2 (with GPT-OSS 20B added for the adversarial fine-tuning experiment in Appendix C).

**Hyperparameter Setting**: Temperature=0 is used in all main settings, though the authors note some variance in performance for FinanceAgent. For both FinanceBench and Finance Agent, the default temperature preferred by each model is used, to optimize for their reasoning and agentic capabilities.

**Adversarial fine-tuning details** (Appendix C.2): models are trained and validated on a subsampled (N=1000), noised version of the BizBench dataset (finance domain), with 50% noise added; both clean and noisy versions of a given sample are present in the training set. GPT-OSS 20B is fine-tuned with Low-Rank Adaptation (LoRA) for 1 epoch.

**Data synthesis for injections**: biased personal preferences, neutral personal preferences, and contradiction candidates are all generated by a separate LLM using dedicated research-assistant prompts (reproduced in Appendix D of the paper). Biased preference information is designed to be "realistic," to plausibly come from a prior agentic tool call (e.g., a memory tool result), and to be detectable/identifiable by an ML model so it can be flagged for removal when necessary — as opposed to being convoluted or intentionally confusing.

---

## 5. Experiments and Results

### 5.1 Table 1 — Accuracy Under Rebuttal, Contradiction, and Personal Preference

Accuracy on FinanceBench (in-context) and FinanceAgent (full agentic) under Baseline, Rebuttal, Contradiction, and PP (personal preference, direct injection).

| Model | FB Baseline | FB Rebuttal | FB Contra | FB PP | FA Baseline | FA Rebuttal | FA Contra | FA PP |
|---|---|---|---|---|---|---|---|---|
| GPT-5-Nano | 0.83 | 0.83 | 0.84 | 0.47 | 0.36 | 0.36 | 0.34 | 0.26 |
| GPT-5.2 | 0.87 | 0.91 | 0.87 | 0.49 | 0.67 | 0.67 | 0.69 | 0.52 |
| Claude Sonnet-4.5 | 0.87 | 0.72 | 0.45 | 0.62 | 0.62 | 0.44 | 0.36 | 0.48 |
| Claude Opus-4.5 | 0.89 | 0.83 | 0.69 | 0.55 | 0.65 | 0.63 | 0.44 | 0.66 |
| Gemini-3-Pro | 0.83 | 0.71 | 0.71 | 0.24 | 0.40 | 0.30 | 0.32 | 0.12 |
| Kimi-K2-Thinking | 0.79 | 0.74 | 0.76 | 0.27 | 0.50 | 0.38 | 0.22 | 0.12 |
| GLM-4.7 | 0.81 | 0.73 | 0.70 | 0.27 | 0.51 | 0.44 | 0.30 | 0.27 |
| DeepSeek-V3.2 | 0.79 | 0.72 | 0.66 | 0.32 | 0.47 | 0.31 | 0.27 | 0.12 |

*(PP = personal preference information injected directly. In the original Table 1, the highest performance drop per model is bolded — e.g., Claude Sonnet-4.5 drops ~48% from baseline under FinanceBench Contradiction, and Gemini-3-Pro drops ~71% under FinanceBench PP.)*

**Key findings**:
- **Preference-based sycophancy has a higher impact than rebuttal/contradiction**: in both benchmarks, rebuttal and contradiction adversely affect most models' performance, but with light-to-moderate impact size. Both proprietary and open-source models are vulnerable, though some versions are more robust.
- Most models demonstrate significantly stronger sycophancy when the bias information is presented as **implicit personalization of the user**. No model displayed robustness against such behavior. Open-source models tend to display the greatest level of sycophancy.
- It is interesting to observe that **OpenAI models excel against direct sycophancy inducers, whereas Anthropic models are robust against implicit sycophantic inducers.**

### 5.2 Table 2 — Direct/Agentic Injection and Prompt-based Recovery

Accuracy (Acc), Acknowledgment Rate (AR), and non-acknowledgment-given-error rate (EWU) under Baseline, Neutral Context (NC), Direct Injection, Agentic Injection, and Prompt-based Recovery applied to Direct Injection.

**FinanceBench**

| Model | Baseline | NC | DI Acc | DI AR | DI EWU | AI Acc | AI AR | AI EWU | Recovery Acc | Recovery AR | Recovery EWU |
|---|---|---|---|---|---|---|---|---|---|---|---|
| GPT-5-Nano | 0.83 | 0.82 | 0.47 | 0.25 | 0.85 | 0.43 | 0.23 | 0.67 | 0.65 | 0.23 | 0.76 |
| GPT-5.2 | 0.87 | 0.83 | 0.49 | 0.26 | 0.76 | 0.79 | 0.30 | 0.90 | 0.67 | 0.27 | 0.21 |
| Claude Sonnet-4.5 | 0.87 | 0.83 | 0.45 | 0.37 | 0.57 | 0.61 | 0.30 | 0.57 | 0.71 | 0.33 | 0.62 |
| Claude Opus-4.5 | 0.89 | 0.83 | 0.55 | 0.49 | 0.58 | 0.73 | 0.33 | 0.86 | 0.71 | 0.33 | 0.59 |
| Gemini-3-Pro | 0.83 | 0.83 | 0.24 | 0.41 | 0.52 | 0.39 | 0.39 | 0.31 | 0.61 | 0.25 | 0.61 |
| GLM-4.7 | 0.81 | 0.85 | 0.27 | 0.26 | 0.71 | 0.45 | 0.34 | 0.53 | 0.58 | 0.27 | 0.65 |
| Kimi-K2-Thinking | 0.79 | 0.85 | 0.27 | 0.23 | 0.73 | 0.35 | 0.31 | 0.43 | 0.60 | 0.31 | 0.51 |
| DeepSeek-V3.2 | 0.79 | 0.80 | 0.32 | 0.30 | 0.72 | 0.33 | 0.26 | 0.70 | 0.65 | 0.31 | 0.59 |

**FinanceAgent**

| Model | Baseline | NC | DI Acc | DI AR | DI EWU | AI Acc | AI AR | AI EWU | Recovery Acc | Recovery AR | Recovery EWU |
|---|---|---|---|---|---|---|---|---|---|---|---|
| GPT-5-Nano | 0.37 | 0.34 | 0.26 | 0.25 | 0.85 | 0.31 | 0.04 | 0.97 | 0.35 | 0.00 | 1.00 |
| GPT-5.2 | 0.67 | 0.65 | 0.52 | 0.12 | 0.79 | 0.60 | 0.02 | 0.95 | 0.58 | 0.04 | 0.95 |
| Claude Sonnet-4.5 | 0.62 | 0.61 | 0.48 | 0.24 | 0.77 | 0.58 | 0.02 | 1.00 | 0.58 | 0.12 | 0.85 |
| Claude Opus-4.5 | 0.65 | 0.67 | 0.66 | 0.21 | 0.94 | 0.54 | 0.00 | 1.00 | 0.64 | 0.05 | 0.87 |
| Gemini-3-Pro | 0.41 | 0.45 | 0.20 | 0.54 | 0.36 | 0.28 | 0.54 | 0.58 | 0.36 | 0.38 | 0.57 |
| GLM-4.7 | 0.51 | 0.50 | 0.27 | 0.25 | 0.80 | 0.40 | 0.15 | 0.42 | 0.36 | 0.16 | 0.77 |
| Kimi-K2-Thinking | 0.50 | 0.46 | 0.12 | 0.14 | 0.84 | 0.16 | 0.22 | 0.79 | 0.20 | 0.08 | 0.91 |
| DeepSeek-V3.2 | 0.47 | 0.34 | 0.06 | 0.22 | 0.73 | 0.08 | 0.31 | 0.66 | 0.33 | 0.18 | 0.77 |

*(DI = Direct Injection, AI = Agentic Injection, Recovery = Prompt-based filtering applied to Direct Injection; gray columns in the original table are directly comparable.)*

**Key findings**:
- **Preference-based sycophancy is displayed across direct and agentic settings, with low acknowledgment rates**: both direct injection of relevant personal preferences into the model's context window and inclusion of such preferences as additional tool-call/tool-result turns trigger significant levels of sycophancy in most models. Most models not only respond with incorrect answers but also fail to acknowledge the presence and impact of the relevant biased personal preference. Larger models tend to provide wrong answers while still acknowledging the impact of the additional personal preference information.
- **Direct injection leads to greater impact on a model's overall accuracy**, while **agentic injection of personal preferences leads to lower awareness and acknowledgment rate**, increasing the difficulty of monitoring and detecting sycophancy. This is visible in how AI AR collapses to near 0.00–0.05 for most models on FinanceAgent.
- **Prompt-based filtering moderately mitigates sycophancy**: adding a separate LLM inference step that filters biased personal preferences improves Acc, AR, and EWU compared to no filtering, but does not fully recover to baseline level — largely due to the capability of the filtering model and the difficulty in accurately discerning highly technical injected preference information.

### 5.3 The Four Quadrants of Implicit Sycophancy (Appendix B)

The paper proposes a framework classifying models' sycophantic behaviors along two axes: whether the model correctly completes the task, and whether it acknowledges biased information. (The original Figure 2 is a tikz diagram without a rendered image asset, so it is reproduced here as a table.)

| | Acknowledges biased information | Ignores biased information |
|---|---|---|
| **Correctly completes the task** | Q1: Ideal — no sycophancy, safe and robust model | Q4: Robust but potentially unsafe (lacks transparency) |
| **Incorrectly completes the task** | Q2: Sycophantic but observable | Q3: Fully sycophantic and not observable |

The authors argue Q2 is "actually near optimal behavior" despite the wrong answer, since the sycophancy is observable and can be monitored and reported. Q4 — correct but non-transparent — is "traditionally preferred behavior" but still considered suboptimal due to lack of transparency. Q3, where the model is fully sycophantic and gives no indication of it, is the most dangerous quadrant.

### 5.4 Further Recovery Strategies (Appendix C)

**Credibility Hints / Reliability Score (Table 3, FinanceBench)**: injected personal preferences are presented as a tool result with an attached reliability score of 0.05 (low), while relevant context information is given a reliability score of 0.95 (high).

| Model | Baseline | DI Acc | DI AR | DI EWU | DI+Credibility Acc | DI+Credibility AR | DI+Credibility EWU |
|---|---|---|---|---|---|---|---|
| GPT-5-Nano | 0.83 | 0.47 | 0.25 | 0.85 | 0.46 | 0.23 | 0.83 |
| GPT-5.2 | 0.87 | 0.49 | 0.26 | 0.76 | 0.65 | 0.33 | 0.73 |
| Claude Sonnet-4.5 | 0.87 | 0.45 | 0.37 | 0.57 | 0.63 | 0.42 | 0.66 |
| Claude Opus-4.5 | 0.89 | 0.55 | 0.49 | 0.58 | 0.83 | 0.53 | 0.60 |
| Gemini-3-Pro | 0.83 | 0.24 | 0.41 | 0.52 | 0.47 | 0.53 | 0.48 |
| GLM-4.7 | 0.81 | 0.27 | 0.26 | 0.71 | 0.39 | 0.30 | 0.41 |
| Kimi-K2-Thinking | 0.79 | 0.27 | 0.23 | 0.73 | 0.42 | 0.32 | 0.74 |
| DeepSeek-V3.2 | 0.79 | 0.32 | 0.30 | 0.72 | 0.35 | 0.46 | 0.49 |

Providing more context on the reliability and level of bias of the injected personal preference partially prevents sycophancy — most models improve on accuracy, demonstrate a higher acknowledgment rate, and show a higher rate of acknowledging impact when making a mistake (e.g., Claude Opus-4.5 improves from DI Acc 0.55 to 0.83).

**Training Models with Sycophantic Noise (Table 4, FinanceBench)**: GPT-OSS 20B fine-tuned with LoRA on 50%-noised BizBench data, compared to its base counterpart.

| Model | Baseline | DI Acc | DI AR | DI EWU | AI Acc | AI AR | AI EWU |
|---|---|---|---|---|---|---|---|
| GPT-OSS 20B | 0.79 | 0.36 | 0.12 | 0.83 | 0.32 | 0.12 | 0.89 |
| GPT-OSS 20B + adversarial | 0.78 | 0.38 | 0.14 | 0.73 | 0.31 | 0.13 | 0.79 |

The improvements are small in magnitude, and overall recovery rates underperform the prompt-based filtering results in Table 2. The authors note these models have a wide unexplored search space (proportion of noise, type of noise, etc.) and display higher variance in results, requiring more optimization for stability.

---

## 6. Figure

![The paper's three-step approach to understanding and addressing sycophancy in financial agentic scenarios](/images/sycophancy-financial/fig1_overview.png)
*Figure 1: Measuring and reducing sycophancy in enterprise settings. The three-step approach: (1) inducing sycophancy via rebuttals/contradictions and personalized context, (2) quantifying it with accuracy, acknowledgment rate, and EWU metrics, (3) mitigating it through guardrails such as prompt-based filtering.*

---

## 7. Conclusion and Discussion

### Contributions
1. **Extends sycophancy research to agentic financial settings**: quantifies sycophancy in the enterprise/financial domain, and specifically in fully agentic tasks requiring correct tool use, an area prior work has largely not covered.
2. **Defines a new mode of sycophancy via personalized context**: demonstrates empirically that this is a substantially more dangerous inducer than traditional rebuttal/contradiction.
3. **Introduces Acknowledgment Rate / EWU metrics**: a framework that measures not just accuracy but also how transparently a model discloses its own bias.
4. **Compares multiple recovery strategies**: experimentally characterizes the effectiveness and limitations of prompt-based filtering, reliability scoring, and adversarial fine-tuning.

### Limitations
1. **Prompt-based filtering fails to fully restore baseline performance**, due to the capability of the filtering model and the difficulty of discerning highly technical injected information.
2. **Adversarial fine-tuning shows only marginal gains**, with a wide unexplored design space (noise ratio, noise type) and higher result variance.
3. **Evaluation depends on an LLM judge (GPT-5-mini)**, so the reliability of acknowledgment judgments could itself be affected by judge-model bias.
4. **Substantial model-specific variation makes generalization difficult** — e.g., OpenAI models resist explicit sycophancy while Anthropic models resist implicit sycophancy — and the paper leaves root-cause analysis (e.g., differences in alignment methodology) to future work.

### Practical Implications
For teams building agentic financial AI, this paper is a warning that information flowing into a model's context through user-profile or memory-tool results can distort model judgment far more quietly and powerfully than an explicit rebuttal. The finding that agentic injection depresses acknowledgment more than accuracy is particularly concerning: it suggests that the most dangerous failure mode — the model quietly giving a wrong answer without any awareness of the biasing information (Quadrant 3) — may be the hardest to detect in a live production system. At the same time, the finding that a relatively simple intervention like attaching reliability scores to injected information yields partial recovery is a promising, low-effort mitigation worth testing in practice.
