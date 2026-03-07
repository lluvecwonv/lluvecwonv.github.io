export interface TimelineItem {
  number: number
  title: string
  period: string
  description: string
}

export const timelineData: TimelineItem[] = [
  {
    number: 1,
    title: 'AI 연구 시작',
    period: '',
    description: '자연어 처리와 대화형 AI에 관심을 갖고 연구를 시작했습니다.',
  },
  {
    number: 2,
    title: 'LLM & Agent 개발',
    period: '',
    description: 'LLM 기반 다중 에이전트 시스템과 윤리적 AI 연구를 진행했습니다.',
  },
  {
    number: 3,
    title: 'AI 프로젝트 확장',
    period: '',
    description: '다양한 도메인에서 AI 솔루션을 설계하고 구현하고 있습니다.',
  },
  {
    number: 4,
    title: '현재 & 미래',
    period: '',
    description: 'AI 기술의 사회적 영향과 책임 있는 AI 개발에 집중하고 있습니다.',
  },
]
