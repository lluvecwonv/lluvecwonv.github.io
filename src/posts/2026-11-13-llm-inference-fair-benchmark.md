---
title: "Rust와 Python, LLM 추론 속도 비교에서 먼저 고정할 것들"
date: 2026-11-13
summary: "Medium의 Rust·Python 추론 벤치마크 화두를 바탕으로, 언어 효과와 서빙 엔진 효과를 구분하는 실험 조건을 정리한다."
tags: [AI, Inference, Benchmark, Performance]
category: AI/개발
language: ko
---

![같은 GPU로 연결된 두 추론 경로와 타이머, 메모리 블록](/images/posts/2026-11-13-llm-inference-fair-benchmark.png)

## 오늘의 Medium 화두

2026년 11월 13일 확인한 Medium Artificial Intelligence 최신 목록에는 Rothy Yorn의 [I Want to Benchmark Rust vs Python LLM Inference. Which Is Actually Faster?](https://medium.com/@rothyyorn9/i-want-to-benchmark-rust-vs-python-llm-inference-which-is-actually-faster-05bc6cec4934)가 `Just now`로 표시됐다. 제목이 던지는 질문은 명료하다. LLM 추론 프로그램의 언어를 바꾸면 얼마나 빨라질까?

원문 전체와 절대 발행일은 확인하지 못했다. 이 글은 원문의 실험 결과를 옮긴 요약이 아니라, 공개 논문 두 편을 연결한 독립적인 해설이다. 상대 시간 표시는 최신 목록에서 관찰한 정보이며 실제 발행 날짜의 검증을 대신하지 않는다.

## 무엇을 바꿨는지 먼저 구분하자

추론 서비스의 응답 시간에는 입력 처리, 요청 대기, 모델 계산, 출력 전달이 함께 들어간다. 따라서 두 프로그램의 총시간이 다르다는 사실만으로 그 차이를 프로그래밍 언어 하나에 돌리기는 어렵다. 서로 다른 엔진과 양자화 설정을 사용했다면 비교 대상은 언어뿐 아니라 전체 구성이다.

여기서는 두 질문을 분리할 것을 제안한다. 첫째는 같은 추론 백엔드를 호출하는 두 구현의 주변 처리 비용이 얼마나 다른가이다. 둘째는 각 언어 생태계에서 선택한 전체 시스템 중 어느 쪽이 목표 업무를 더 잘 처리하는가이다. 두 실험 모두 유용하지만 결론의 범위가 다르다.

## 메모리 관리도 처리량을 바꾼다

PagedAttention 논문은 요청마다 크기가 달라지는 KV 캐시를 비효율적으로 관리하면 메모리가 낭비되고 배치 크기가 제한되는 문제를 다룬다. 가상 메모리의 페이징에서 착안한 방식으로 이를 관리하며, 해당 방법을 사용하는 vLLM 서빙 시스템을 제시했다. 이는 언어 선택 외에도 캐시 관리가 추론 성능을 바꾸는 변수라는 근거다. [논문 1](https://arxiv.org/abs/2309.06180)

논문에 보고된 개선을 오늘의 모든 모델과 GPU에서 그대로 기대할 수는 없다. 비교할 때는 모델뿐 아니라 입력 길이, 동시 요청 수, 캐시 재사용 조건까지 기록해야 한다. 이 문단의 비교 절차는 논문에서 착안한 제안이며 직접 측정한 결과가 아니다.

## 지연 시간과 처리량은 별개의 목표다

DeepSpeed Inference는 여러 GPU를 사용하는 추론과 GPU·CPU·NVMe 메모리를 함께 활용하는 추론을 다룬다. 논문은 지연 시간 중심과 처리량 중심의 사용 환경을 구분한다. 같은 모델이라도 하드웨어와 메모리 배치에 따라 설계 선택이 달라질 수 있다는 점이 핵심이다. [논문 2](https://arxiv.org/abs/2207.00032)

채팅 사용자가 첫 응답을 기다리는 시간과 서버가 초당 처리하는 총량은 서로 다른 지표다. 총 생성 토큰 수를 전체 시간으로 나눈 숫자 하나만 공개하면 첫 토큰이 늦는 문제나 일부 요청의 긴 대기를 놓칠 수 있다.

## 재현 가능한 비교를 위한 작은 실험표

다음은 실제 결과표가 아니라 벤치마크를 설계하기 위한 제안이다.

| 구분 | 고정하거나 기록할 조건 | 관찰할 값 |
| --- | --- | --- |
| 모델과 입력 | 가중치 버전, 정밀도·양자화, 토크나이저, 입력 묶음 | 출력 품질과 생성 토큰 수 |
| 실행 환경 | GPU, 드라이버, 엔진 버전, 전력 설정 | 메모리 사용량과 오류 |
| 요청 부하 | 동시성, 도착 간격, 입력·출력 길이 | 요청별 지연 분포와 처리량 |
| 시간 측정 | 준비 실행 여부, 모델 로딩 포함 여부, 측정 경계 | 첫 토큰 지연과 전체 완료 시간 |

언어 자체의 영향을 보려면 가능한 한 같은 백엔드와 설정을 사용하고 주변 코드만 바꾼다. 전체 제품 구성을 비교하려면 엔진 차이를 허용하되 어떤 설정을 바꿨는지 명시한다. 각 조건을 여러 번 실행하고 중앙값과 느린 요청 구간을 함께 살펴보면 단발성 측정의 영향을 줄일 수 있다.

예를 들어 한 구현은 모델을 미리 로딩하고 다른 구현은 매번 로딩한다면, 측정 결과는 주로 실행 수명주기의 차이를 보여줄 수 있다. 또 출력 길이가 다르면 전체 시간만으로 우열을 말하기 어렵다. 먼저 동일한 작업 완료 조건을 정해야 한다.

이 화두에서 가져갈 실용적인 질문은 ‘어느 언어가 항상 빠른가’보다 ‘내 서비스에서 어떤 단계가 시간을 쓰고, 어떤 변경이 그 단계를 줄였는가’다. 구현을 바꾸기 전에 측정 범위를 정하면 개선의 원인을 설명할 수 있다.

## 출처

Medium 화두: Rothy Yorn, [I Want to Benchmark Rust vs Python LLM Inference. Which Is Actually Faster?](https://medium.com/@rothyyorn9/i-want-to-benchmark-rust-vs-python-llm-inference-which-is-actually-faster-05bc6cec4934). 최신 목록 확인일 2026-11-13. 전체 본문·절대 발행일 미확인.

1. Kwon et al. (2023), [Efficient Memory Management for Large Language Model Serving with PagedAttention](https://arxiv.org/abs/2309.06180), SOSP 2023.
2. Aminabadi et al. (2022), [DeepSpeed Inference: Enabling Efficient Inference of Transformer Models at Unprecedented Scale](https://arxiv.org/abs/2207.00032).

이미지: 내장 imagegen으로 생성한 개념 일러스트이며 실측 데이터나 논문의 구조도가 아니다.

생성 프롬프트: Use case: stylized-concept. Asset type: wide blog hero illustration. Primary request: illustrate fair benchmarking of LLM inference, two parallel pipelines feeding the same GPU chip, a stopwatch and neatly arranged memory blocks beside it. Style/medium: polished tactile 3D editorial illustration, cream background, teal and amber accents, soft studio lighting. Composition: wide landscape, clean spacious composition. Constraints: no text, no logos, no watermark. Conceptual illustration, not measured data.
