-- Seed: Template-Based Financial Report Generation paper blog post
-- Date: 2026-03-09

INSERT INTO public.posts (slug, title, date, summary, tags, category, content, published, language)
VALUES (
  '2026-03-09-template-financial-report-agentic-decomposed-ir',
  'Template-Based Financial Report Generation in Agentic and Decomposed Information Retrieval — 논문 정리',
  '2026-03-09',
  'SIGIR 2025 논문. LLM 기반 템플릿 재무 보고서 생성을 위한 두 가지 접근법—AgenticIR(멀티 에이전트 프레임워크)과 DecomposedIR(프롬프트 체이닝 기반 분해 방식)—을 체계적으로 비교 분석하고, DecomposedIR이 4가지 핵심 특성 모두에서 통계적으로 유의미하게 우수한 성능을 보임을 실증한 연구입니다.',
  ARRAY['LLM', 'Financial Report', 'Agentic Framework', 'Decomposed Prompting', 'RAG', 'SIGIR', '연구노트'],
  '연구노트',
  '
이번 연구노트는 SIGIR 2025 논문 **Template-Based Financial Report Generation in Agentic and Decomposed Information Retrieval**을 정리한 글이다.
저자는 National Yang Ming Chiao Tung University의 Yong-En Tian, Yu-Chien Tang, Kuang-Da Wang, An-Zi Yen, Wen-Chih Peng이다.

핵심 질문은 이렇다.

**"LLM으로 정형화된 템플릿 기반 재무 보고서를 생성할 때, 멀티 에이전트 방식(AgenticIR)과 프롬프트 분해 방식(DecomposedIR) 중 어느 것이 더 효과적인가?"**

기존의 earnings call 요약 방법론들이 넓고 얕은 요약을 생성하는 한계를 지적하고, 실제 산업 현장에서 널리 쓰이는 **템플릿 기반 보고서 생성** 태스크를 정형화하여, 두 가지 주요 접근법을 체계적으로 비교한 최초의 연구다.

논문 링크: https://doi.org/10.1145/3726302.3730253
프로젝트: https://github.com/bryant-nn/Template-Based-Financial-Report-Generation

## 한 줄 요약

멀티 에이전트 프레임워크(AgenticIR)는 유연하지만, 프롬프트 체이닝으로 템플릿을 서브쿼리로 분해하는 방식(DecomposedIR)이 4가지 핵심 평가 특성 모두에서 **평균 27% 높은 성능**을 보였다 — 에이전트의 자율성이 항상 최선은 아니라는 산업적 시사점을 제공한다.

## 1. 서론 — 왜 템플릿 기반 재무 보고서 생성이 중요한가

재무 분석가들에게 실적 발표(earnings call) 기반의 종합 재무 보고서를 작성하는 것은 핵심 업무다. 이 보고서는 기업간 재무 성과 비교, 주식 움직임 예측, 리스크 평가, 감성 분석 등 폭넓은 분야에 활용된다. 그러나 긴 earnings call 트랜스크립트에서 핵심 재무 근거를 선별하고, 정형화된 보고서로 구성하는 것은 시간이 많이 소요되는 어려운 작업이다.

기존 접근법들은 이를 **earnings call transcript 요약** 태스크로 프레이밍해왔지만, 이런 방법들은 넓고 포괄적인 요약을 생성할 뿐, 재무 분석가가 실제로 필요로 하는 **특정 섹션별 상세한 정보**를 제공하지 못한다. 저자들은 이 문제를 **템플릿 기반 질의응답(template-based question-answering)** 태스크로 재정의하여, 각 주제에 맞는 정보를 간결하게 추출하는 것을 목표로 한다.

이 논문의 기여는 세 가지다:

1. 템플릿 기반 재무 보고서 생성 태스크를 정형화하고, 산업계에서 주로 사용되는 두 가지 접근법(AgenticIR, DecomposedIR)을 체계적으로 비교
2. 금융 도메인 데이터셋뿐 아니라 기상 도메인(SumIPCC) 데이터셋에서도 실험하여 교차 도메인 일반화 가능성을 확인
3. 실무자들을 위한 에이전트 프레임워크 배포 관련 인사이트 제공

## 2. Related Work

LLM을 자율 에이전트로 활용하는 연구가 활발하다. CAMEL은 에이전트 간 자율 협력을 가능하게 하는 역할극 프레임워크를 도입했고, AutoGen은 멀티 에이전트 대화 프레임워크를 제공한다. LLMCompiler는 병렬 함수 실행 최적화로 에이전트 능력을 강화한다.

Goldsack et al.은 earnings call 트랜스크립트 요약에 대한 멀티 에이전트 프레임워크의 영향을 탐구한 연구로, 본 논문과 밀접한 관련이 있다. 그러나 Goldsack et al.의 초점은 에이전트가 생성하는 텍스트 콘텐츠 자체에 있었던 반면, 본 논문은 **AgenticIR과 decomposed prompting을 활용한 RAG의 효과와 차이**를 템플릿 기반 보고서 생성 관점에서 비교한다.

요약 전략 개선 연구도 활발하다. Gamage et al.은 다수의 LLM이 자율적으로 지식을 검색하여 의사결정 지원 응답을 생성하는 프레임워크를 제안했고, Suresh et al.은 요약 태스크를 프롬프트 기반 서브쿼리로 분해하여 RAG와 통합하는 모듈화 접근법을 제시했다.

## 3. Method

### 3.1 데이터 수집 및 전처리

파일럿 탐색으로 **5개 주요 반도체 제조사**(TSMC, Intel, Samsung, GlobalFoundries, UMC)를 선정하고, Discounting Cash Flows API를 통해 2021~2024년 earnings call 문서를 수집하여 **총 74개 재무 문서** 데이터셋을 구축했다.

이 문서들은 두 종류로 구성된다:

- **Earnings call 트랜스크립트**: 실적 발표 음성 기록. 1,000자 단위 청크로 분할하되, 연속 청크 간 200자 오버랩을 두어 문맥 일관성을 유지
- **Financial statements**: 대차대조표, 현금흐름표, 손익계산서 등을 JSON 형식으로 구조화. 트랜스크립트에서 검색된 정보에 수치 데이터를 보완하는 역할

또한 재무 분석가로부터 **재무 보고서 템플릿**을 수집하여 실험 전체에 적용했다.

![Figure 1: 재무 보고서 템플릿 예시 — P&L 하이라이트, 웨이퍼 판매, 세그먼트/플랫폼 하이라이트 등 정형화된 섹션 구조](/images/papers/template-financial-report/figure1_report_template.png)
*Figure 1: 재무 보고서 템플릿의 예시. Section 1은 P&L 하이라이트, Sub Section 1.1은 매출 결과와 QoQ/YoY 변화, Sub Section 1.2는 웨이퍼 판매량과 ASP 분석, Section 2는 세그먼트/플랫폼 하이라이트로 구성된다.*

### 3.2 AgenticIR

AgenticIR은 **6개 에이전트와 2개 핵심 함수**로 구성된 멀티 에이전트 프레임워크다. AutoGen을 기반으로 구현되었으며, 에이전트들이 협력하여 구조화된 재무 보고서를 생성한다.

![Figure 2: AgenticIR 프레임워크 아키텍처 — User Proxy Agent, Assistant Agent, Financial Retrieval Agent, Financial Manager Agent, User Agent, Task Decompose Agent의 협력 구조](/images/papers/template-financial-report/figure2_agenticIR_framework.png)
*Figure 2: AgenticIR 프레임워크의 전체 구조. 왼쪽의 Retrieve_Generate() 함수는 Financial Retrieval Agent와 Financial Manager Agent가 earnings call 트랜스크립트에서 관련 청크를 검색하고 재무 정보를 처리한다. 오른쪽의 Task_Decompose() 함수는 User Agent와 Task Decompose Agent가 복잡한 태스크를 서브태스크로 분해한다.*

**6개 에이전트의 역할:**

- **User Proxy Agent**: 사용자의 보고서 생성 프롬프트와 사전 정의된 템플릿을 받아 Assistant Agent에 전달
- **Assistant Agent**: 입력을 분석하고 적절한 함수 호출을 선택하여 User Proxy에 반환
- **Financial Retrieval Agent**: 쿼리 q와 검색 수 n을 받아, 임베딩 모델로 의미적 유사도 기반 top-n 트랜스크립트 청크를 검색
- **Financial Manager Agent**: 검색된 청크와 재무 제표를 종합하여 최종 출력을 생성
- **User Agent**: 복잡한 태스크를 Task Decomposition Agent에 제출
- **Task Decomposition Agent**: 태스크를 관리 가능한 서브태스크로 분해

**2개 핵심 함수:**

- **task_decompose**: 복잡한 태스크를 서브태스크로 분해
- **retrieve_generate**: 서브태스크 기반 쿼리로 관련 청크를 검색하고 답변을 생성

**워크플로우**: User Proxy Agent가 보고서 프롬프트와 템플릿을 받으면, Assistant Agent가 이를 분석하여 적절한 함수 호출을 수행한다. 모든 서브태스크가 완료될 때까지 이 반복적 교환이 계속되고, 최종적으로 Assistant Agent가 요약된 보고서를 컴파일한다.

### 3.3 DecomposedIR

DecomposedIR은 **프롬프트 체이닝 워크플로우**를 따라 보고서 템플릿을 섹션별 서브쿼리(SQ)로 분해하는 방식이다.

![Figure 3: DecomposedIR에서 파생된 분해 질문 예시 — 각 섹션과 서브섹션이 구체적인 서브쿼리(SQ)로 변환됨](/images/papers/template-financial-report/figure3_decomposed_questions.png)
*Figure 3: 분해된 질문의 예시. Section 1의 P&L 하이라이트가 Sub Section 1.1(매출 결과)의 SQ1~SQ3, Sub Section 1.2(웨이퍼 판매)의 SQ4~SQ6으로 세분화된다. 각 SQ는 "#TIME#" 같은 플레이스홀더를 포함하여 특정 분기의 정보를 질의한다.*

**동작 방식:**

1. LLM이 보고서 템플릿을 섹션별 서브쿼리(SQ)로 분해
2. 각 SQ에 대해 AgenticIR과 동일한 임베딩 모델을 사용하여 top-n 관련 청크를 검색
3. 임베딩 모델이 각 청크와 서브쿼리를 768차원 벡터로 인코딩하고, 코사인 유사도로 관련성을 판단
4. 검색된 n개 청크와 재무 제표를 LLM 생성기에 전달
5. LLM이 트랜스크립트 청크의 텍스트 컨텍스트와 재무 제표의 정밀한 수치 데이터를 결합하여 각 SQ에 대한 답변 생성
6. 모든 SQ가 처리되면, 보고서 템플릿 구조에 맞춰 섹션별로 집계 및 요약

핵심 차이점: AgenticIR이 에이전트에게 전체 템플릿을 주고 자율적으로 분해하게 하는 반면, DecomposedIR은 **명시적인 구조적 가이드**를 통해 단계별로 분해한다.

## 4. 실험 (Experiments)

### 4.1 실험 설정

- **LLM**: AgenticIR과 DecomposedIR 모두 **GPT-4o-mini** 사용
- **임베딩 모델**: 금융 데이터셋은 `fin-mpnet-base`, SumIPCC 데이터셋은 `stella_en_1.5B_v5`
- **검색 수**: 일관성을 위해 n=3으로 통일

### 4.2 Dataset: Finance

**평가 메트릭**: 전문가가 작성한 템플릿 기반 재무 보고서를 수집하는 비용이 높아, reference-free 평가 메트릭 두 가지를 채택했다:

- **DecompEval (DE)**: LLM에 프롬프트하여 각 문장이 특정 특성에 부합하는지 개별적으로 평가한 뒤 집계
- **G-Eval (GE)**: LLM에 1~5 점수를 부여하게 하여 각 특성별 점수를 생성

Goldsack et al.의 방법론을 참고하여 **4가지 핵심 특성**으로 평가한다:

1. **Financial Takeaways**: 해당 분기의 핵심 재무 수치 및 통계
2. **Financial Context**: 이전 분기 대비 현재 재무 성과에 대한 인사이트
3. **Reasoning Correctness**: 해당 분기 재무 성과에 대한 추론과 설명의 정확성
4. **Management Expectation**: 다음 분기에 대한 경영진의 전망과 기대

**Self-reflection 메커니즘**: 두 프레임워크 모두에 self-reflection(w/ sr) 변형을 도입했다. 이 메커니즘은 에이전트가 생성된 콘텐츠를 분석하고, 각 특성과의 정렬도를 확인하며, 답변 전략을 조정하게 한다.

### 4.3 정량적 결과 (Quantitative Results)

![Table 1: 금융 데이터셋 결과 — DecomposedIR이 모든 메트릭에서 AgenticIR을 상회](/images/papers/template-financial-report/table1_financial_results.png)
*Table 1: 금융 데이터셋에서의 결과. DE는 DecompEval, GE는 G-Eval을 의미한다. 최고 점수는 굵은 글씨, 차점자는 밑줄로 표시.*

**핵심 발견:**

- **DecomposedIR이 모든 메트릭에서 AgenticIR을 일관되게 능가한다.** 정량적으로, DecomposedIR은 4가지 특성 모두에서 평균 27% 높은 성능을 보였다 (Pearson의 χ² 검정에서 p < 0.05).
- **Self-reflection은 DecompEval과 G-Eval을 평균 9.8% 향상시킨다.** AgenticIR도 약간의 성능 향상을 보였다.
- 이는 프롬프트 체이닝으로 보고서 템플릿을 상세한 서브쿼리로 분해하는 것의 가치를 입증한다.

### 4.4 가독성 분석 (Readability)

![Table 2: 양 방법론의 가독성 비교 — DecomposedIR이 더 복잡하고 긴 보고서를 생성](/images/papers/template-financial-report/table2_readability.png)
*Table 2: 금융 데이터셋에서 양 방법론의 가독성. #Sents는 평균 문장 수, FKGL은 Flesch-Kincaid Grade Level, CLI는 Coleman-Liau Index, ARI는 Automated Readability Index.*

세 가지 가독성 메트릭(FKGL, CLI, ARI)을 사용하여 평가했다. 이 메트릭들은 문자 수, 음절 수, 단어 수, 문장 수 같은 언어적 특성을 기반으로 계산되며, 점수가 높을수록 더 복잡한 텍스트를 의미한다.

주요 관찰:

- **DE/GE 점수가 높을수록 보고서의 복잡도도 증가한다.** 즉, 성능이 좋은 프레임워크가 더 복잡한 보고서를 생성한다.
- **Self-reflection은 복잡도뿐 아니라 보고서 길이도 증가시킨다.** 더 상세하고 맥락적으로 풍부한 콘텐츠가 전문 독자에게 더 적합하다는 가설을 세울 수 있다.
- 다만, 음절 수 같은 통계치가 재무 보고서의 가독성 측정에 최적인지에 대해서는 의문이 있으며, 이는 선행 연구에서도 지적된 바 있다.

### 4.5 Dataset: SumIPCC

교차 도메인 일반화 가능성을 확인하기 위해 **SumIPCC 데이터셋**에서도 실험했다. SumIPCC는 IPCC(Intergovernmental Panel on Climate Change)의 장문 보고서에서 파생된 140개 요약문으로 구성되며, 7개 보고서로 재편성했다.

![Table 3: SumIPCC 데이터셋 결과 — DecomposedIR이 ROUGE와 BERTScore 모두에서 최고 성능](/images/papers/template-financial-report/table3_sumipcc.png)
*Table 3: SumIPCC 데이터셋 결과. Ground truth가 있으므로 ROUGE와 BERTScore(deberta-v3-large 기반)를 평가 메트릭으로 사용.*

**핵심 발견:**

- **DecomposedIR이 ROUGE와 BERTScore 모두에서 최고 성능을 달성**, ROUGE-1에서 AgenticIR 대비 33%, BERTScore에서 6.3% 우위
- 이는 DecomposedIR이 다른 도메인에서도 더 정확한 콘텐츠 검색 및 요약을 가능하게 함을 시사
- **AgenticIR의 자율적 쿼리 분해 전략은 명시적인 구조적 가이드가 부족하여**, 비일관성이 발생하고 성능이 저하될 가능성이 있다

**Self-reflection의 효과**: SumIPCC에서는 self-reflection을 적용한 DecomposedIR이 ROUGE-1에서 AgenticIR 대비 45%, BERTScore에서 8.3% 우위를 보였다. 그러나 이 데이터셋에서는 각 보고서가 서로 다른 초점과 문체를 가진 섹션/서브섹션으로 구성되어 있어, self-reflection이 일반화된 가이드와 개별 섹션의 특정 요구 사이에 불일치를 초래할 수 있다는 점도 관찰되었다.

## 5. Conclusion

두 가지 LLM 기반 워크플로우(AgenticIR, DecomposedIR)를 비교한 이 연구의 주요 발견은 두 가지다:

**첫째, decomposed prompt chaining이 멀티 에이전트 방식을 능가한다.** 두 가지 평가 시나리오 모두에서 DecomposedIR이 우수했으며, 이는 AgenticIR이 비정형 맥락과 정형화된 보고서 템플릿 사이의 간극을 메우는 데 한계가 있음을 보여준다.

**둘째, self-reflection은 보고서 품질을 향상시키지만 가독성은 저하시킨다.** 핵심 특성에 대한 보고서 품질은 개선되나, 보고서의 복잡도가 증가하여 가독성에는 부정적 영향을 미친다.

향후 연구 방향으로는 Query-Focused Summarization을 활용한 멀티 에이전트 강화, Aspect-based Summarization의 템플릿 기반 보고서 생성 적용 등이 제시되었다.

## 개인 코멘트

이 논문은 **에이전트의 자율성 vs. 명시적 구조화**라는 근본적인 트레이드오프를 잘 보여준다.

AgenticIR은 AutoGen 기반으로 6개 에이전트가 자율적으로 협력하는 유연한 구조지만, 바로 그 유연성 때문에 템플릿의 정형화된 구조를 정확하게 따르지 못한다. 반면 DecomposedIR은 프롬프트 체이닝이라는 비교적 단순한 방법론으로도 명시적인 쿼리 분해를 통해 일관되게 우수한 결과를 얻는다.

이는 실무적으로 중요한 시사점이다. 현재 산업계에서 "에이전트"가 만능 해결책처럼 여겨지는 경향이 있지만, **태스크의 특성에 따라 더 단순하고 구조화된 접근이 오히려 효과적**일 수 있다. 특히 재무 보고서처럼 정형화된 출력이 요구되는 태스크에서는, 에이전트의 자율적 분해보다 사전 정의된 구조를 따르는 것이 더 신뢰할 수 있다.

다만 몇 가지 한계점도 있다. 첫째, GPT-4o-mini만을 사용했으므로 다른 LLM에서의 일반화는 추가 검증이 필요하다. 둘째, 평가가 자동 메트릭(DecompEval, G-Eval)에 의존하고 있어 실제 재무 분석가의 판단과의 상관관계는 불확실하다. 셋째, n=3이라는 고정된 검색 수가 최적인지에 대한 분석이 부족하다.

그럼에도 **템플릿 기반 보고서 생성이라는 실용적 태스크**를 정형화하고, 두 가지 주류 접근법을 공정하게 비교했다는 점에서 가치 있는 연구다. 특히 SumIPCC 데이터셋에서의 교차 도메인 실험은 이 발견이 금융 도메인에 국한되지 않음을 보여준다.
',
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
