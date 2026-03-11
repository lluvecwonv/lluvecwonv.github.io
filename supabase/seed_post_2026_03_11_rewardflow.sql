INSERT INTO posts (slug, title, date, summary, tags, category, content, published, language)
VALUES (
  '2026-03-11-rewardflow-propagating-reward-state-graphs',
  'RewardFlow: Propagating Reward in the State Graphs of Agentic Learning with LLMs 논문 분석',
  '2026-03-11',
  'ICLR 2026 제출(Rejected) 논문. LLM 에이전트의 멀티턴 RL에서 희소 보상 문제를 해결하기 위해 상태 그래프 기반 보상 전파 프레임워크 RewardFlow를 제안한다. GRPO의 궤적 수준 보상을 상태 수준으로 확장하여, BFS 기반 역전파로 dense reward를 생성한다. Sokoban +28%, ALFWorld +12.5% 성능 향상. OpenReview 3명 리뷰어(Rating 0/4/6) 코멘트 포함 종합 분석.',
  ARRAY['LLM', 'Reinforcement Learning', 'GRPO', 'Reward Shaping', 'Credit Assignment', 'Agentic AI', '연구노트'],
  '연구노트',
  'RewardFlow 논문 분석 — 상태 그래프 기반 보상 전파로 LLM 에이전트의 멀티턴 RL 학습을 개선하는 프레임워크. GRPO 개념 설명, 방법론 상세, 실험 결과(Sokoban/ALFWorld/WebShop/DeepResearch), OpenReview 리뷰어 3명의 코멘트 종합 분석 포함.',
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
