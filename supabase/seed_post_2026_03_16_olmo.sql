-- Korean version
INSERT INTO posts (slug, title, date, summary, tags, category, content, published, language)
VALUES (
  '2026-03-16-olmo-accelerating-science-language-models',
  'OLMo: Accelerating the Science of Language Models 논문 분석',
  '2026-03-16',
  'AI2(Allen Institute for AI)의 진정한 오픈 언어 모델 OLMo. 모델 가중치뿐 아니라 학습 데이터(Dolma, 3T 토큰), 학습 코드, 평가 코드, 500+ 중간 체크포인트까지 Apache 2.0으로 전면 공개. 7B 디코더 전용 트랜스포머(SwiGLU, RoPE, 비모수적 LayerNorm, 바이어스 제거). FSDP/ZeRO로 학습. 8개 코어 태스크 제로샷 평가 avg 69.3. SFT+DPO 후 MMLU 28.3→46.2 향상.',
  ARRAY['LLM', 'Open Source', 'OLMo', 'AI2', 'Pretraining', 'Dolma', 'Evaluation', '연구노트'],
  '연구노트',
  'AI2의 OLMo 논문 분석. 모델 가중치·학습 데이터(Dolma 3T토큰)·학습 코드·평가 프레임워크·500+ 중간 체크포인트 전면 공개. 아키텍처: 디코더 전용 트랜스포머(SwiGLU/RoPE/비모수적 LayerNorm/바이어스 제거). 학습: LUMI(AMD MI250X 256노드) + MosaicML(NVIDIA A100 27노드), PyTorch FSDP/ZeRO, AdamW, bfloat16. Dolma 데이터셋 구성(Common Crawl 2180B, GitHub 342B, Reddit 80B, Semantic Scholar 57B 등 총 2668B 토큰). 제로샷 8태스크 평가: OLMo-7B avg 69.3 (LLaMA 69.6, Llama2 70.5, MPT 69.8). 적응 평가: SFT+DPO 후 MMLU 28.3→46.2, ToxiGen 81.4%→1.7%. 탄소 배출량 69.78 tCO₂eq. Apache 2.0 라이선스.',
  true,
  'ko'
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

-- English version
INSERT INTO posts (slug, title, date, summary, tags, category, content, published, language)
VALUES (
  '2026-03-16-olmo-accelerating-science-language-models-en',
  'OLMo: Accelerating the Science of Language Models — Paper Analysis',
  '2026-03-16',
  'AI2''s truly open language model OLMo. Releases model weights, training data (Dolma, 3T tokens), training code, evaluation code, and 500+ intermediate checkpoints under Apache 2.0. 7B decoder-only transformer (SwiGLU, RoPE, non-parametric LayerNorm, no biases). Trained with FSDP/ZeRO. Zero-shot avg 69.3 on 8 core tasks. MMLU improves 28.3→46.2 after SFT+DPO.',
  ARRAY['LLM', 'Open Source', 'OLMo', 'AI2', 'Pretraining', 'Dolma', 'Evaluation', 'Research Notes'],
  '연구노트',
  'Analysis of AI2''s OLMo paper. Full release of model weights, training data (Dolma 3T tokens), training code, evaluation framework, and 500+ intermediate checkpoints. Architecture: decoder-only transformer (SwiGLU/RoPE/non-parametric LayerNorm/no biases). Training: LUMI (AMD MI250X 256 nodes) + MosaicML (NVIDIA A100 27 nodes), PyTorch FSDP/ZeRO, AdamW, bfloat16. Dolma dataset composition (Common Crawl 2180B, GitHub 342B, Reddit 80B, Semantic Scholar 57B, total 2668B tokens). Zero-shot 8-task evaluation: OLMo-7B avg 69.3 (LLaMA 69.6, Llama2 70.5, MPT 69.8). Adaptation: SFT+DPO boosts MMLU 28.3→46.2, ToxiGen 81.4%→1.7%. Carbon emissions 69.78 tCO₂eq. Apache 2.0 License.',
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
