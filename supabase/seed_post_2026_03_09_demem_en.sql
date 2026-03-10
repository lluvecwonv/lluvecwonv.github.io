-- DeMem Research Note (EN) seed SQL
-- Generated: 2026-03-09

INSERT INTO public.posts (slug, title, date, summary, tags, category, content, published, language)
VALUES (
  '2026-03-09-preserving-privacy-through-dememorization-en',
  'Preserving Privacy Through DeMemorization — Paper Summary',
  '2026-03-09',
  'A summary of the EMNLP 2023 paper ''Preserving Privacy Through DeMemorization,'' covering DeMem''s motivation, related work, methodology (RL-based unlearning with negative BERTScore reward + PPO), and key experimental results.',
  ARRAY['LLM', 'Privacy', 'Memorization', 'Unlearning', 'Reinforcement Learning', 'Research Note'],
  '연구노트',
  $body$This research note summarizes the EMNLP 2023 paper **Preserving Privacy Through DeMemorization: An Unlearning Technique For Mitigating Memorization Risks In Language Models**.
The question is simple:

**"Even without completely erasing what a model has memorized from its training data, can we at least make it difficult to extract?"**

The authors propose **DeMem**, an RL-based unlearning method.
The key idea is that instead of deleting specific samples entirely, they train a **dissimilarity policy** so that, given a prefix, the model no longer reproduces the original suffix verbatim.

Paper link: https://aclanthology.org/2023.emnlp-main.265/

## TL;DR

This paper frames memorization as **"how closely the model can reconstruct the original training suffix given a prefix"** and demonstrates that using **negative BERTScore reward + PPO** can reduce that reproducibility while maintaining near-intact general model performance — striking a practical privacy-utility trade-off.

## 1. Introduction

The question the authors raise sits at the heart of today's LLM privacy discourse.
As models grow larger, performance improves — but so does the risk of reproducing parts of the training data verbatim or near-verbatim.
As the Carlini line of research has shown, given sufficient prefix, models can extract sensitive information such as emails, code, and copyrighted text.

Existing defenses fall into roughly four categories:

- Pre-training data sanitization or cleaning of sensitive data
- Deduplication to reduce redundant samples
- Differential privacy to limit the influence of individual samples from the start
- Knowledge unlearning to make an already-trained model "forget" specific data

The problem is that each has clear limitations:

- Data sanitization requires knowing what is sensitive in advance
- Deduplication reduces duplicated memorization but leaves non-duplicated memorization intact
- Differential privacy imposes significant costs on performance and computation
- Knowledge unlearning provides strong privacy but is limited in the number of samples it can protect at once, and can cause notable performance degradation

The proposal emerges from this gap.
Instead of complete deletion, the goal is to **weaken the model's tendency to continue writing the original suffix verbatim** when given a prefix.
In the authors' terms, this amounts to learning a **paraphrasing policy** rather than exact reconstruction.

The paper's three core claims are:

- RL feedback can reduce memorization while keeping LM performance degradation very small
- The privacy-performance trade-off is far more practical than unlearning (UL)
- Even when applied to models already trained on deduplicated data, adding DeMem further improves privacy

## 2. Related Work

Section 3 of the paper categorizes memorization mitigation research into three groups.

### 2.1 Data Pre/Post-Processing

The first axis involves preprocessing or postprocessing the training data or generated output.

- **Deduplication**: Reduces memorization by removing duplicate data
- **MemFREE decoding**: Monitors for memorized output at generation time using n-gram criteria

This family of approaches is practical to implement and already integrates easily into large-scale model training pipelines.
However, deduplication alone is not sufficient.
As the paper demonstrates with OPT, **deduplicated models still exhibit high memorization**.

### 2.2 Differential Privacy

DP provides the strongest theoretical privacy guarantees, but the paper identifies significant practical constraints:

- High training cost
- Slow convergence
- Utility tends to be lower than non-private training
- Defining "what constitutes a private unit" in language data is challenging

In short, privacy guarantees are strong, but DP remains an expensive and inconvenient option for large generative model training.

### 2.3 Knowledge Unlearning

UL essentially reverses the minimization of negative log-likelihood for specific samples in an already-trained model.
It is powerful from a privacy perspective, but the paper identifies two limitations:

- Attempting to unlearn too many samples at once causes rapid performance degradation
- Post-forgetting generation fluency and coherence can deteriorate

This is precisely where the paper draws the line against UL.
The emphasis is on **"making extraction difficult"** rather than **"exact deletion."**

### 2.4 The Perspective This Paper Brings

DeMem treats privacy not as a formal guarantee but as **extractability reduction**.
The goal is to weaken the model's ability to produce similar continuations of training suffixes when given specific prefixes.

This perspective has clear trade-offs:

- Advantage: More practical, with smaller performance loss
- Limitation: Does not guarantee "complete erasure" like DP or exact unlearning

## 3. Methodology

### 3.1 Data Setup and Problem Formulation

Training and evaluation use Google's **LM Extraction Benchmark Pile subset** of 15,000 samples:

- Train: 13,500
- Test: 1,500
- Each sample: 200 tokens total

Token splitting is structured as follows:

![Figure 2. sequence split](https://xspdvydnpreiccnpzunm.supabase.co/storage/v1/object/public/blog-images/papers/demem-figure2-sequence-split.png)
*Figure 2. Each sample is divided into pre-prefix (100), prefix (50), and suffix (50) tokens. Training focuses on prefix-suffix pairs, while evaluation also includes a longer context setting with the pre-prefix appended. Image source: Kassem et al., EMNLP 2023.*

Two evaluation settings are used:

- **Standard setting**: Generate suffix given only the prefix
- **Longer context setting**: Generate suffix given pre-prefix + prefix

The latter tests whether longer context makes memorization easier to surface.

### 3.2 DeMem Overall Architecture

DeMem's pipeline can be summarized in a single figure:

![Figure 1. DeMem overview](https://xspdvydnpreiccnpzunm.supabase.co/storage/v1/object/public/blog-images/papers/demem-figure1-overview.png)
*Figure 1. After pretraining, RL fine-tuning is performed using a subset of the training corpus, learning the DeMem policy via a negative similarity reward. Image source: Kassem et al., EMNLP 2023.*

The intuition is straightforward:

1. Feed prefix `P` to the model to generate suffix `S_G`
2. Measure how similar it is to the original suffix `S_T`
3. If too similar, assign a low reward to steer the model toward less similar outputs

The key equations are:

```text
S_G = f_theta(P)
DisScore = -BERTScore(S_G, S_T)
```

That is, **the higher the BERTScore, the worse the reward.**
The model is penalized for faithfully reconstructing the original suffix.

### 3.3 Reward Design: Negative BERTScore + KL Penalty

The reward design aims to satisfy two objectives simultaneously:

- The output should differ from the original suffix
- The model should not be completely destroyed in the process

The authors use two components:

- **Negative BERTScore**: Reward for reducing similarity to the original suffix
- **KL penalty**: Constraint preventing the updated policy from drifting too far from the original pretrained policy

The default value is `beta = 0.2`.
This KL term is important because pushing privacy too aggressively can cause the model to produce incoherent, ungrammatical outputs.
DeMem is designed to make the model memorize suffixes less while **maintaining coherence as a language model**.

### 3.4 PPO / NLPO Optimization

Optimization uses the PPO family, with **NLPO (top-p 0.95)** for language generation stabilization.
Batch size is 32, and a value head is added.

The implication is straightforward:
DeMem operates via **reward-maximizing policy learning** rather than supervised fine-tuning.
It is not "learning to match the correct suffix" but rather **"learning to produce suffixes that appear less memorized."**

### 3.5 Memorization Measurement

This paper adopts **approximate memorization** rather than exact memorization.
That is, memorization is not defined as requiring character-perfect replication.

**SacreBLEU** is used for measurement:

- High `SacreBLEU`: Generated suffix is similar to the original suffix
- High `Negative SacreBLEU`: Less similar to the original suffix — forgetting was more successful

This is crucial when reading the results tables:

**In this paper, higher `N-SacreBLEU` means better privacy.**

## 4. Experimental Results

### 4.1 Experimental Setup

Two model families are compared:

- **GPT-Neo 125M / 1.3B / 2.7B**
- **OPT 125M / 1.3B / 2.7B**

OPT uses deduplicated pretraining data, effectively serving as a **deduplication baseline**.

Evaluation spans three axes:

- Forgetting: `N-SacreBLEU`
- General performance: Average accuracy across 8 classification benchmarks
- Language quality: WikiText perplexity, generated suffix perplexity

The paper examines not only privacy but also **how much capability is sacrificed to achieve that privacy**.

### 4.2 Main Results: Good Trade-offs Across Both GPT-Neo and OPT

First, the GPT-Neo results:

![Table 1. GPT-Neo main results](https://xspdvydnpreiccnpzunm.supabase.co/storage/v1/object/public/blog-images/papers/demem-table1-gptneo-results.png)
*Table 1. GPT-Neo family main results. Image source: Kassem et al., EMNLP 2023.*

The key takeaways are clear:

- UL pushes `N-SacreBLEU` to nearly `99`, but at significant cost to accuracy and perplexity
- DeMem shows weaker forgetting numbers than UL, but with very minimal general performance loss
- For example, `NEO 2.7B`: baseline `26.26 → 49.24`, `LM ACC 52.67 → 52.48` — privacy improves substantially while performance is nearly preserved

The OPT results follow the same pattern:

![Table 2. OPT main results](https://xspdvydnpreiccnpzunm.supabase.co/storage/v1/object/public/blog-images/papers/demem-table2-opt-results.png)
*Table 2. OPT family main results. Image source: Kassem et al., EMNLP 2023.*

Key interpretation:

- OPT has lower baseline memorization than GPT-Neo thanks to deduplication
- Yet applying DeMem still raises the forgetting score further
- For example, `OPT 2.7B`: baseline `71.80 → 94.53`, `LM ACC 53.74 → 52.20`

The paper's core claim: **deduplication alone is not sufficient; the deduplication + DeMem combination is stronger**.

The message the authors summarize directly:

- UL provides the strongest privacy but with ~`11%` average capability loss
- DeMem achieves memorization mitigation close to UL but with only ~`0.5%` capability loss

This is the paper's most compelling result.

### 4.3 DeMem Remains Relatively Stable as Sample Count Increases

A chronic problem with UL is that performance collapses as the number of samples to forget grows.
Figure 3 illustrates this difference intuitively:

![Figure 3. stability vs forgotten sample count](https://xspdvydnpreiccnpzunm.supabase.co/storage/v1/object/public/blog-images/papers/demem-figure3-sample-stability.png)
*Figure 3. When increasing forgotten sample counts to 32, 128, and 256 on GPT-Neo, UL shows steadily declining average performance while DeMem remains nearly flat. Image source: Kassem et al., EMNLP 2023.*

The interpretation is simple:

- **UL**: Performance degradation accumulates as sample count grows
- **DeMem**: Once the policy is learned, it is insensitive to sample count changes

The authors call this a **universal policy**.
DeMem is not "a task of forgetting these specific 32 samples" but rather learns a more general forgetting behavior.

An additional interesting observation is the DeMem step count.
Smaller models require more steps while larger models converge with fewer steps.
The authors' observation that **larger models forget faster** connects directly to this point.

### 4.4 Effects Persist Under Longer Context Attacks

LLM memorization often remains hidden with short prefixes but suddenly surfaces when sufficiently long context is provided.
The paper connects this to the **discoverability phenomenon**.

Table 3 shows before/after DeMem changes under longer context:

| Model | Params | Before N-SacreBLEU | Before PPL | After N-SacreBLEU | After PPL |
| --- | --- | ---: | ---: | ---: | ---: |
| NEO | 125M | 45.74 | 4.12 | 55.04 | 4.15 |
| NEO | 1.3B | 59.58 | 6.64 | 88.91 | 7.68 |
| NEO | 2.7B | 10.55 | 1.41 | 32.66 | 1.54 |
| OPT | 125M | 89.35 | 11.99 | 94.47 | 12.38 |
| OPT | 1.3B | 59.58 | 6.64 | 88.91 | 7.68 |
| OPT | 2.7B | 56.35 | 5.95 | 89.37 | 6.76 |

Two key observations from this table:

- Longer context makes memorization easier to surface
- After DeMem, `N-SacreBLEU` increases substantially across the board

Notably, `NEO 2.7B` was highly vulnerable in longer context with a baseline of `10.55`, but rose to `32.66` after DeMem.
Not perfect defense, but **extractability under longer context attacks is noticeably reduced**.

Figure 4 shows this more intuitively from a threshold perspective:

![Figure 4. 75% threshold before and after DeMem](https://xspdvydnpreiccnpzunm.supabase.co/storage/v1/object/public/blog-images/papers/demem-figure4-longer-context-threshold.png)
*Figure 4. In the Neo 2.7B longer context setting, looking at the approximate memorization region (red upper section) at the 75% SacreBLEU threshold, the distribution spreads more broadly below the threshold after DeMem. Image source: Kassem et al., EMNLP 2023.*

After DeMem, the pattern of high-scoring memorized samples clustering together weakens.

Note: The original Table 3 shows identical numbers for `NEO 1.3B` and `OPT 1.3B` rows. This note preserves the original notation, but the **possibility of a reporting duplication in the paper itself** should be kept in mind.

### 4.5 Qualitative Results: Less Verbatim Reproduction of Emails and Strings

Figure 5 shows qualitative examples before and after DeMem:

![Figure 5. qualitative examples](https://xspdvydnpreiccnpzunm.supabase.co/storage/v1/object/public/blog-images/papers/demem-figure5-qualitative-examples.png)
*Figure 5. Before DeMem, strings, emails, and license text closely matching the original suffix are reconstructed. After DeMem, more diverse continuations appear. Image source: Kassem et al., EMNLP 2023.*

The meaning is quite direct:

- Before: The model continues with near-verbatim portions of the original suffix
- After: Different continuations emerge from the same prefix

Changes are particularly noticeable for **types where verbatim leakage is dangerous**, such as email addresses and specific license text.

## 5. My Interpretation

The most important point from reading this paper is the redefinition of privacy from **"deletion"** to **"increasing the difficulty of reproduction."**
This differs from rigorous privacy guarantees, but may actually be a more realistic goal in practical LLM operations.

The advantages are clear:

- Small performance loss
- Composable with deduplication
- Once learned, the policy generalizes to more samples

But limitations are equally clear:

- This is **not certified deletion**
- Fully preventing semantic leakage is difficult to claim
- The evaluation models are public 125M–2.7B scale, making it hard to assert the same trade-off holds for ultra-large frontier models

From a privacy perspective, DeMem is strong at **"preventing verbatim reproduction"** but distinct from **"making the model completely unaware of the fact itself."**
It is more accurate to view it as a practical middle ground rather than a replacement for DP or stronger unlearning.

## 6. Summary

This paper is impressive for treating memorization mitigation not as a simple deletion problem but as a problem of **changing the generation policy itself**.
DeMem demonstrated a far more practical trade-off than UL and showed that privacy gaps left by deduplication alone can be addressed through subsequent RL fine-tuning.

In one sentence:

**"Rather than completely erasing sensitive suffixes, making it difficult for the model to extract them verbatim may be the more realistic approach for practical LLM privacy engineering."**$body$,
  true,
  'en'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  date = EXCLUDED.date,
  summary = EXCLUDED.summary,
  tags = EXCLUDED.tags,
  category = EXCLUDED.category,
  content = EXCLUDED.content,
  published = EXCLUDED.published,
  language = EXCLUDED.language;
