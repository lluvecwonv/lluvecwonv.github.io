insert into public.posts (slug, title, date, summary, tags, category, content, published, language)
values (
  '2026-03-09-medium-ai-course-manus',
  'Deterministic Enterprise Governance: Medium 최신 AI 거버넌스 글 정리',
  '2026-03-09',
  '2026-03-09 Medium AI 최신 글을 바탕으로, 에이전트 운영에서 결정론적 거버넌스와 프로세스 인텔리전스 아키텍처의 실무 포인트를 정리했습니다.',
  array['AI','Medium','거버넌스','Agent','Enterprise'],
  'AI/개발',
  $$오늘은 Medium AI 태그의 최신 피드(2026-03-09 UTC 기준)에서 확인된 글,
**"Deterministic Enterprise Governance: The Process Intelligence Architecture Explained"**를 바탕으로
엔터프라이즈 AI 운영 관점의 핵심을 정리했다.

원문: https://timhourigan.medium.com/deterministic-enterprise-governance-the-process-intelligence-architecture-explained-92794d30a816

![Process Intelligence Architecture](https://cdn-images-1.medium.com/max/1770/1*adt29LCtkK0o95ADWQknbg.png)
*이미지 출처: Medium 원문 대표 이미지*

## 핵심 요약

- 에이전트 운영은 "좋은 모델"만으로 끝나지 않고, 실행 과정 전체를 통제하는 거버넌스 레이어가 필요하다.
- 결정론적(deterministic) 규칙과 로그 기반 검증이 있어야 감사 가능성과 재현성이 확보된다.
- 프로세스 인텔리전스는 단순 자동화가 아니라, 의사결정 흐름을 측정 가능한 운영 데이터로 바꾸는 접근이다.

## 왜 중요한가

현업에서 AI 도입 실패의 많은 원인은 모델 정확도보다 운영 통제 부재다.
누가 어떤 프롬프트로 어떤 도구를 호출했고, 어떤 정책을 통과해 어떤 결과가 배포됐는지 남지 않으면
사고가 났을 때 원인 추적과 재발 방지가 어렵다.

이 글의 메시지는 명확하다.
"에이전트 성능"과 "운영 통제"를 분리하지 말고,
정책-실행-감사 로그를 한 구조에서 설계해야 한다.

## 실무 적용 체크리스트

1. 정책 선적용
- 고위험 액션(삭제/외부 전송/권한 변경)은 실행 전 정책 엔진으로 먼저 평가한다.

2. 실행 추적 표준화
- 프롬프트, 툴 호출, 응답, 승인 여부를 동일 트레이스 ID로 연결해 저장한다.

3. 재현성 확보
- 모델 버전, 시스템 프롬프트 버전, 툴 버전을 실행 시점별로 함께 기록한다.

4. 운영 KPI 도입
- 성공률뿐 아니라 차단률, 우회 시도, 수동 승인 비율을 함께 본다.

## 관련 논문/기사 (2~3개)

- Constitutional AI: Harmlessness from AI Feedback (Anthropic, 2022)
  https://arxiv.org/abs/2212.08073

- LLM Guardrails Survey (2024)
  https://arxiv.org/abs/2402.10853

- NIST AI Risk Management Framework (AI RMF 1.0)
  https://www.nist.gov/itl/ai-risk-management-framework

## 한 줄 결론

엔터프라이즈 AI의 경쟁력은 모델 성능 단독이 아니라,
**결정론적 통제 + 감사 가능한 실행 로그**를 운영 기본값으로 갖췄는지에서 갈린다.$$,
  true,
  'ko'
)
on conflict (slug)
do update set
  title = excluded.title,
  date = excluded.date,
  summary = excluded.summary,
  tags = excluded.tags,
  category = excluded.category,
  content = excluded.content,
  published = excluded.published,
  updated_at = now();
