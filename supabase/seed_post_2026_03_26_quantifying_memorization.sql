INSERT INTO posts (slug, title, date, summary, tags, category, content, published, language)
VALUES (
  '2026-03-26-quantifying-memorization-neural-lm',
  'Quantifying Memorization Across Neural Language Models 논문 분석',
  '2026-03-26',
  'LLM의 암기(memorization)를 대규모로 정량 분석한 최초의 종합 연구. GPT-Neo, T5, OPT 세 모델 패밀리에 걸쳐 모델 크기, 데이터 중복, 컨텍스트 길이가 암기에 미치는 영향을 log-linear 관계로 정립. GPT-J 6B 모델이 학습 데이터의 최소 1%를 추출 가능하게 암기하고 있음을 실증.',
  ARRAY['LLM', 'Memorization', 'Privacy', 'Scaling Laws', 'Data Duplication', 'GPT-Neo', 'T5', 'OPT', '연구노트'],
  '연구노트',
  'Carlini et al. (ICLR 2023). LLM 암기의 최초 대규모 정량 분석. 세 가지 log-linear 관계: (1) 모델 크기 10배 → 암기율 19pp 증가 (R²=99.8%), (2) 데이터 중복 횟수 증가 → 추출 확률 log-linear 증가, (3) 컨텍스트 길이 증가 → 발견 가능한 암기 log-linear 증가. GPT-J 6B가 The Pile의 최소 1% extractable. T5(masked LM)는 causal LM 대비 한 자릿수 낮은 암기. Deduplication은 효과적이나 고빈도 중복에는 한계. OPT는 동일 트렌드이나 효과 크기 수 자릿수 작음.',
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

INSERT INTO posts (slug, title, date, summary, tags, category, content, published, language)
VALUES (
  '2026-03-26-quantifying-memorization-neural-lm-en',
  'Quantifying Memorization Across Neural Language Models',
  '2026-03-26',
  'The first comprehensive quantitative analysis of memorization in LLMs. Identifies three log-linear relationships across GPT-Neo, T5, and OPT: memorization scales with model capacity, data duplication count, and prompt context length. GPT-J 6B memorizes at least 1% of The Pile extractably.',
  ARRAY['LLM', 'Memorization', 'Privacy', 'Scaling Laws', 'Data Duplication', 'GPT-Neo', 'T5', 'OPT', 'Research Notes'],
  '연구노트',
  'Carlini et al. (ICLR 2023). First large-scale quantitative analysis of LLM memorization. Three log-linear relationships: (1) 10x model size → 19pp memorization increase (R²=99.8%), (2) data duplication → log-linear extractability increase, (3) context length → log-linear discoverability increase. GPT-J 6B extractably memorizes at least 1% of The Pile. T5 (masked LM) shows order-of-magnitude lower memorization than causal LMs. Deduplication effective but limited for high-frequency duplicates. OPT shows same trends but orders-of-magnitude smaller effect sizes.',
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
