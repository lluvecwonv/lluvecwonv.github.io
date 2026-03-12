INSERT INTO posts (slug, title, date, summary, tags, category, content, published, language)
VALUES (
  '2026-03-12-sok-memorization-llms',
  'SoK: The Landscape of Memorization in LLMs — Mechanisms, Measurement, and Mitigation 논문 분석',
  '2026-03-12',
  'UC Berkeley & Google DeepMind의 LLM 메모리제이션 서베이(SoK). 메모리제이션의 정의 분류 체계(Outcome/Elicitation/Causal/Probabilistic), 영향 요인, 학습 단계별 동역학, 탐지 기법, 완화 전략, 프라이버시/법적 리스크까지 종합 정리. 각 섹션별 Open Questions 포함.',
  ARRAY['LLM', 'Memorization', 'Privacy', 'Survey', 'SoK', 'MIA', 'Differential Privacy', 'Unlearning', '연구노트'],
  '연구노트',
  'UC Berkeley/Google DeepMind SoK 논문. LLM 메모리제이션을 정의 체계화(10가지 정의를 5카테고리로), 영향 요인(모델 크기/데이터 중복/시퀀스 길이/토크나이제이션/샘플링의 비선형 상호작용), 학습 단계별 동역학(Pre-training/SFT/RLHF/Distillation), 탐지 기법(Divergence Attack/Prefix Extraction/MIA/Soft Prompting), 완화(Data Cleaning/DP/Unlearning/ParaPO/Activation Steering), 법적 리스크(PII 유출/저작권/NYT v. OpenAI)까지 종합 분석.',
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
