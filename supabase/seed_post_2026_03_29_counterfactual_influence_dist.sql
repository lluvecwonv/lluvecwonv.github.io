INSERT INTO posts (slug, title, date, summary, tags, category, content, published, language)
VALUES (
  '2026-03-29-counterfactual-influence-distributional',
  'Counterfactual Influence as a Distributional Quantity 논문 분석',
  '2026-03-29',
  'Self-influence만으로는 near-duplicate 존재 시 LLM 암기 리스크를 과소평가함을 보인 ICML 2025 논문. GPT-Neo 1.3B로 1,000개 모델 학습하여 전체 influence matrix 계산. Near-duplicate 레코드는 self-influence 3배 낮지만 extractability 5배 높음. Top-1 Influence Margin 지표 제안.',
  ARRAY['LLM', 'Memorization', 'Counterfactual Influence', 'Near-Duplicate', 'Extractability', 'Privacy', 'ICML 2025', '연구노트'],
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
  '2026-03-29-counterfactual-influence-distributional-en',
  'Counterfactual Influence as a Distributional Quantity - Paper Analysis',
  '2026-03-29',
  'ICML 2025 paper showing self-influence alone underestimates memorization risks with near-duplicates. Full influence matrix from 1,000 GPT-Neo 1.3B models: near-duplicate records have 3x lower self-influence but 5x higher extractability. Top-1 Influence Margin proposed as a more effective metric.',
  ARRAY['LLM', 'Memorization', 'Counterfactual Influence', 'Near-Duplicate', 'Extractability', 'Privacy', 'ICML 2025', 'Research Note'],
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
