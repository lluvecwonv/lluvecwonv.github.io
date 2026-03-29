INSERT INTO posts (slug, title, date, summary, tags, category, content, published, language)
VALUES (
  '2026-03-29-mosaic-memory-llm',
  'The Mosaic Memory of Large Language Models 논문 분석',
  '2026-03-29',
  'LLM이 정확한 중복(exact duplicate)뿐 아니라 유사 중복(fuzzy duplicate)으로부터도 정보를 조합하여 암기하는 모자이크 메모리(mosaic memory) 현상을 밝힌 논문. Llama-3.2, Phi-2, Gemma-2, GPT-Neo 4개 모델에서 10% 토큰 교체 시 ρ=0.50–0.60, 50% 교체 시 ρ=0.15–0.19의 암기 기여를 보임. 암기가 의미론적보다 구문론적임을 입증하고, SlimPajama에서 fuzzy duplicate의 광범위한 존재를 확인.',
  ARRAY['LLM', 'Memorization', 'Fuzzy Duplicate', 'Mosaic Memory', 'Privacy', 'MIA', 'Deduplication', 'SlimPajama', '연구노트'],
  '연구노트',
  '',
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
  '2026-03-29-mosaic-memory-llm-en',
  'The Mosaic Memory of Large Language Models - Paper Analysis',
  '2026-03-29',
  'Analysis of a paper demonstrating that LLMs memorize by assembling information from similar sequences (fuzzy duplicates), a phenomenon called mosaic memory. Across Llama-3.2, Phi-2, Gemma-2, and GPT-Neo, fuzzy duplicates with 10% token replacement contribute ρ=0.50–0.60, and even 50% replacement yields ρ=0.15–0.19. The mosaic memory is shown to be predominantly syntactic rather than semantic.',
  ARRAY['LLM', 'Memorization', 'Fuzzy Duplicate', 'Mosaic Memory', 'Privacy', 'MIA', 'Deduplication', 'SlimPajama', 'Research Note'],
  'Research Note',
  '',
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
