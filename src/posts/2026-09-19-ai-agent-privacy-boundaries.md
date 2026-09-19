---
title: "AI 에이전트의 프라이버시, 격리된 공간과 데이터 흐름을 함께 설계하기"
date: 2026-09-19
summary: "Medium의 에이전트 격리 화두를 간접 프롬프트 주입과 CaMeL 연구로 살펴보고, 실행 환경과 도구 권한을 구분해 점검한다."
tags: [AI, Agents, Privacy, Security, PromptInjection]
category: AI 소식
language: ko
---

![독립된 보호 공간 안의 AI 에이전트와 통제된 데이터 통로](/images/posts/2026-09-19-ai-agent-privacy-boundaries.png)

## 오늘의 Medium 소식: 에이전트마다 독립된 공간

2026년 9월 19일 확인한 Medium Artificial Intelligence 최신 목록에는 Dwinner의 [Privacy by Infrastructure: Keeping Each FastX Network AI Agent in Its Own Space](https://medium.com/@dwinner933/privacy-by-infrastructure-keeping-each-fastx-network-ai-agent-in-its-own-space-5d01497b61d6)가 `Just now`로 표시됐다. 본문은 사용자별 전용 실행 환경과 분리된 저장 공간을 통한 에이전트 프라이버시를 소개한다.

이 내용은 해당 프로젝트의 설명을 전달하는 글이며 독립적인 보안 감사 결과는 아니다. 절대 발행일도 확인되지 않아 오늘 출시된 제품으로 표현하지 않는다. 여기서는 이 화두를 출발점으로, 관련 원 논문 두 편을 통해 실행 환경의 격리와 데이터 사용 권한이 왜 함께 필요한지 살펴본다.

## 격리는 무엇을 분리하는가

에이전트가 문서를 읽고 외부 도구를 실행한다면, 대화창 뒤에는 파일과 저장소, 네트워크 연결, 접근 권한이 있다. 사용자별 작업 공간을 나누는 것은 이 자원이 뒤섞이지 않도록 설계하는 출발점이다. 다만 저장 공간이 분리됐다는 설명만으로 어떤 데이터도 외부에 전달되지 않는다고 결론 내릴 수는 없다.

예를 들어 개인 문서를 읽을 수 있는 에이전트가 외부 전송 도구도 사용할 수 있다면, 같은 실행 환경 안에서도 정보의 이동을 통제할 필요가 있다. 이 예시는 특정 제품에서 발견한 취약점이 아니라 권한 설계를 이해하기 위한 가정이다.

## 외부 문서가 지시처럼 작동하는 문제

Greshake 등의 2023년 연구는 검색하거나 불러온 데이터에 공격자의 지시가 들어가는 간접 프롬프트 주입을 다뤘다. 사용자가 직접 명령하지 않아도, 모델이 처리하는 외부 콘텐츠가 애플리케이션의 행동이나 API 사용을 바꾸는 공격 경로가 생길 수 있다는 것이다. [논문 1](https://arxiv.org/abs/2302.12173)

이 연구를 에이전트 설계에 적용하면, 외부 문서의 문장은 작업 자료로 취급해야 한다는 점이 중요해진다. 문서에 적힌 요청이 곧바로 사용자의 승인이나 새로운 권한이 되어서는 안 된다. 실행 공간을 나누는 문제와 읽어 온 문장을 어떤 권한으로 해석하는 문제는 서로 연결되지만 동일하지 않다.

## CaMeL: 도구 호출 시점에 데이터 흐름을 확인하기

2025년 CaMeL 연구는 모델 주변에 보호 계층을 두는 방식을 제안했다. 신뢰할 수 있는 요청에서 제어 흐름과 데이터 흐름을 분리하고, 도구를 호출할 때 capability와 보안 정책을 활용해 허용되지 않은 정보 이동을 막는 접근이다. [논문 2](https://arxiv.org/abs/2503.18813)

논문은 AgentDojo에서 방어가 없는 시스템의 작업 해결률 84%와 비교해, CaMeL이 보안 보장이 적용된 조건에서 77%의 작업을 해결했다고 보고했다. 이는 해당 평가 설정의 결과이며 모든 에이전트나 공격에 대한 일반적인 보증은 아니다. 이 비교는 작업 수행 능력과 보안 제약을 함께 평가해야 한다는 점을 보여준다.

## 서비스를 검토할 때 물어볼 질문

다음은 두 연구를 참고한 이 글의 설계 제안이며, FastX를 직접 시험한 결과가 아니다.

- **저장 경계:** 사용자별 파일뿐 아니라 검색 인덱스, 캐시, 로그에도 사용자 구분과 접근 통제가 적용되는가?
- **권한 경계:** 문서 읽기, 파일 수정, 외부 전송을 각각 제한할 수 있는가?
- **지시 경계:** 외부 콘텐츠가 사용자의 요청을 바꾸거나 도구 권한을 확대하지 못하도록 어떤 장치를 두었는가?
- **검증 방식:** 정상 작업의 성공률과 허용되지 않은 정보 이동의 차단 여부를 별도로 측정하는가?

에이전트 프라이버시는 보호 공간의 존재만으로 설명하기 어렵다. 어떤 데이터를 읽을 수 있고, 그 데이터가 어디로 이동할 수 있으며, 그 이동을 누가 승인하는지까지 확인해야 설계의 실제 범위를 이해할 수 있다.

## 출처

Medium 화두: Dwinner, [Privacy by Infrastructure: Keeping Each FastX Network AI Agent in Its Own Space](https://medium.com/@dwinner933/privacy-by-infrastructure-keeping-each-fastx-network-ai-agent-in-its-own-space-5d01497b61d6). 목록·본문 확인일 2026-09-19, 절대 발행일 미확인.

1. Greshake et al. (2023), [Not what you've signed up for: Compromising Real-World LLM-Integrated Applications with Indirect Prompt Injection](https://arxiv.org/abs/2302.12173).
2. Debenedetti et al. (2025), [Defeating Prompt Injections by Design](https://arxiv.org/abs/2503.18813).

이미지: AI 생성 개념 일러스트이며 실제 제품 구조나 보안 인증을 나타내지 않는다.
