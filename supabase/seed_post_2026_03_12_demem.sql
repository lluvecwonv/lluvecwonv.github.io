INSERT INTO posts (slug, title, date, summary, tags, category, content, published, language)
VALUES (
  '2026-03-12-demem-privacy-unlearning',
  'Preserving Privacy Through DeMemorization: An Unlearning Technique For Mitigating Memorization Risks In Language Models 논문 분석',
  '2026-03-12',
  'EMNLP 2023 논문. PPO 기반 강화학습으로 LLM의 메모리제이션을 완화하는 DeMem 프레임워크 제안. 음수 BERTScore를 보상 신호로 사용해 패러프레이징 정책을 학습하여, Knowledge Unlearning 대비 ~0.5% 성능 손실만으로 ~94% N-SacreBLEU 달성. GPT-Neo/OPT (125M~2.7B) 6개 모델, 9개 벤치마크 종합 실험.',
  ARRAY['LLM', 'Memorization', 'Privacy', 'Unlearning', 'Reinforcement Learning', 'PPO', 'EMNLP', '연구노트'],
  '연구노트',
  'DeMem (EMNLP 2023) 논문 분석. PPO 기반 RL로 음수 BERTScore 보상 신호를 사용한 패러프레이징 정책 학습. 방법론(Dissimilarity Policy/KL Penalty/NLPO), 실험 설정(Pile 부분집합 15K 샘플, GPT-Neo/OPT 125M~2.7B), 주요 결과(Table 1&2: N-SacreBLEU ~94%, LM ACC ~0.5% 손실), 샘플 수 안정성/Universal Policy, Deduplication+DeMem 조합, Discoverability 공격 방어(Table 3), 임계값 분석, 정성적 결과 포함.',
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
