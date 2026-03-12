INSERT INTO posts (slug, title, date, summary, tags, category, content, published, language)
VALUES (
  '2026-03-11-ngram-coverage-mia',
  'The Surprising Effectiveness of Membership Inference with Simple N-Gram Coverage 논문 분석',
  '2026-03-11',
  'COLM 2025 논문. 기존 MIA 벤치마크의 temporal distribution shift 문제를 지적하고, WikiMIA_2024 Hard와 TÜLU Mix라는 새 데이터셋을 제안한다. 모델 출력 텍스트만으로 n-gram 커버리지 기반 멤버십 추론 공격(N-Gram Coverage Attack)을 수행하여, white-box 공격에 필적하거나 능가하는 성능을 달성한다. GPT-3.5/4/4o, LLaMA, TÜLU, Pythia, OLMo 등 다양한 모델에 대한 종합 실험 포함.',
  ARRAY['MIA', 'Membership Inference', 'Privacy', 'LLM', 'N-Gram', 'Black-Box Attack', '연구노트'],
  '연구노트',
  'N-Gram Coverage Attack 논문 분석 — 텍스트 출력만으로 멤버십 추론 공격을 수행하는 black-box MIA 기법. 기존 데이터셋(WikiMIA) temporal distribution shift 문제 분석, 새 데이터셋(WikiMIA_2024 Hard, TÜLU Mix) 제안, 방법론 상세(Coverage/Creativity Index/LCS 메트릭), 실험 세팅(GPT-3.5/4/4o, LLaMA, TÜLU, Pythia, OLMo), 전체 결과 테이블 및 어블레이션 포함.',
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
