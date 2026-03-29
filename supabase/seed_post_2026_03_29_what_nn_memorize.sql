INSERT INTO posts (slug, title, date, summary, tags, category, content, published, language)
VALUES (
  '2026-03-29-what-neural-networks-memorize-and-why',
  'What Neural Networks Memorize and Why: Discovering the Long Tail via Influence Estimation 논문 분석',
  '2026-03-29',
  '딥러닝의 레이블 암기 현상이 long-tailed 분포에서 최적 일반화를 위해 필수적이라는 이론을 최초로 실증 검증. 서브샘플링 기반 memorization/influence 추정기로 MNIST, CIFAR-100, ImageNet에서 2,000–4,000개 모델 학습. 암기된 예제의 높은 한계 유용성과 시각적으로 유사한 high-influence train-test pair를 대량 발견. 암기가 deep representation에서 발생함을 입증.',
  ARRAY['Deep Learning', 'Memorization', 'Long Tail', 'Influence Estimation', 'Generalization', 'Privacy', 'ImageNet', 'CIFAR-100', '연구노트'],
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
  '2026-03-29-what-neural-networks-memorize-and-why-en',
  'What Neural Networks Memorize and Why: Discovering the Long Tail via Influence Estimation - Paper Analysis',
  '2026-03-29',
  'First empirical validation of the long tail theory: label memorization is necessary for optimal generalization on long-tailed distributions. Subsampled memorization/influence estimators with 2,000–4,000 models on MNIST, CIFAR-100, ImageNet. Memorized examples have higher marginal utility; substantial high-influence train-test pairs found. Memorization occurs in deep representations, not the last layer.',
  ARRAY['Deep Learning', 'Memorization', 'Long Tail', 'Influence Estimation', 'Generalization', 'Privacy', 'ImageNet', 'CIFAR-100', 'Research Note'],
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
