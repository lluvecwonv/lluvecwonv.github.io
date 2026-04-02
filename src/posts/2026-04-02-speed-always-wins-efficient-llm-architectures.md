---
title: "Speed Always Wins: 효율적 LLM 아키텍처 서베이"
date: 2026-04-02
summary: "Transformer의 고유한 한계(이차 복잡도, 메모리 병목)를 극복하기 위한 효율적 LLM 아키텍처를 체계적으로 분석한 서베이. 선형 시퀀스 모델링(Mamba, RWKV 등), 희소 시퀀스 모델링, 효율적 풀 어텐션 변형, 그리고 희소 Mixture-of-Experts(MoE)까지 포괄한다."
tags: [LLM, Efficient Architecture, Transformer, Mamba, MoE, Linear Attention, Survey, 연구노트]
category: 연구노트
language: ko
---

# Speed Always Wins: 효율적 LLM 아키텍처 서베이

**논문:** Speed Always Wins: A Survey on Efficient Architectures for Large Language Models
**저자:** Weigao Sun 외 14인
**arXiv:** [2508.09834](https://arxiv.org/abs/2508.09834)
**학회:** arXiv preprint (2025년 8월)
**GitHub:** [weigao266/Awesome-Efficient-Arch](https://github.com/weigao266/Awesome-Efficient-Arch)

---

## 한 줄 요약

Transformer의 **이차 시간 복잡도** 문제를 해결하는 효율적 아키텍처들을 4가지 계열로 분류·분석.

---

## 1. Transformer의 한계

Transformer의 self-attention은 시퀀스 길이 $n$에 대해 **$O(n^2)$ 시간·메모리** 복잡도를 가진다. 이는:
- 긴 문맥(long context) 처리의 병목
- 추론 시 KV 캐시 메모리 폭발
- 학습 비용의 급격한 증가

---

## 2. 4가지 효율적 아키텍처 계열

### 2.1 선형 시퀀스 모델링 (Linear Sequence Modeling)
- **State Space Models (SSM):** Mamba, S4 — $O(n)$ 복잡도로 시퀀스 처리
- **RWKV:** RNN과 Transformer의 장점 결합, 선형 복잡도로 학습·추론
- **Linear Attention:** 어텐션 메커니즘을 커널 트릭으로 선형화 (Performers, Linear Transformers)

핵심: 어텐션 행렬의 명시적 계산을 피하면서 장거리 의존성 포착

### 2.2 희소 시퀀스 모델링 (Sparse Sequence Modeling)
- **Local Attention:** 고정 윈도우 내에서만 어텐션 (Longformer, BigBird)
- **Dilated Attention:** 일정 간격으로 토큰 선택
- **Hash-based Attention:** LSH로 유사 토큰만 어텐션 (Reformer)

### 2.3 효율적 풀 어텐션 (Efficient Full Attention)
- **Flash Attention:** 메모리 계층을 고려한 IO-aware 어텐션 구현. 정확도 유지하면서 2-4배 속도 향상
- **Multi-Query Attention (MQA):** Key/Value 헤드를 공유하여 KV 캐시 감소
- **Grouped-Query Attention (GQA):** MQA와 MHA의 중간. LLaMA 2, Mistral 등 사용

### 2.4 희소 Mixture-of-Experts (Sparse MoE)
- **MoE:** 파라미터 수를 늘리되, 각 토큰에 대해 일부 전문가만 활성화
- **Switch Transformer, GLaM, Mixtral:** 총 파라미터는 크지만 활성 파라미터는 적어 효율적
- **라우팅 메커니즘:** Top-k, Expert Choice, Hash-based 라우팅

---

## 3. 시사점

- "속도가 항상 이긴다"는 제목처럼, 실용적 배포에서는 **효율성이 정확도만큼 중요**
- Mamba/RWKV 등 비-Transformer 아키텍처가 부상하지만, 아직 Transformer를 완전히 대체하지는 못함
- **하이브리드 아키텍처**(Transformer + SSM, Attention + MoE)가 현실적 해법

---

## 참고 문헌

- Speed Always Wins: [arXiv:2508.09834](https://arxiv.org/abs/2508.09834)
- Awesome List: [GitHub](https://github.com/weigao266/Awesome-Efficient-Arch)
