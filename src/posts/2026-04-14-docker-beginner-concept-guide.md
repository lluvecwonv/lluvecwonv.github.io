---
title: "Docker 완전 정복 - 개념부터 실무까지 한번에 이해하기"
date: 2026-04-14
summary: Docker를 처음 배우는 사람을 위한 개념 정리. Image와 Container의 차이, Dockerfile 작성법, 기본 명령어, 그리고 AI 모델 서빙 프로젝트에서의 실무 활용까지 쉽게 설명한다.
tags: [Docker, Container, DevOps, Dockerfile, 배포, AI 모델 서빙, 개발 환경]
category: AI/개발
language: ko
---

Docker를 처음 접하는 개발자를 위한 개념 정리 가이드. 왜 필요한지부터 실제 프로젝트 적용까지 정리한다.

---

## 1. Docker가 왜 필요한가?

개발할 때 가장 흔하게 겪는 문제가 있다.

- 내 컴퓨터에서는 잘 돌아감
- 서버에서는 안 돌아감
- 팀원 컴퓨터에서도 안 돌아감

원인은 대부분 **실행 환경이 다르기 때문**이다. Python 버전, PyTorch 버전, CUDA 버전, OS, 설치된 패키지가 모두 다를 수 있다. 즉, 문제는 코드 자체가 아니라 **환경**인 경우가 많다.

Docker는 이 문제를 해결한다. 한마디로:

> **내가 만든 실행 환경을 통째로 포장해서, 어디서든 똑같이 실행하게 해주는 도구**

비유하면, Docker 없이 개발하는 건 "각자 집에서 같은 요리 만들어라"와 같고, Docker를 쓰는 건 "완성된 도시락을 가져간다"와 같다. 어디서든 동일한 결과를 보장한다.

---

## 2. Docker 핵심 개념: Image와 Container

Docker에서 가장 중요한 두 가지 개념이 있다.

![Docker Architecture - Image와 Container 관계](/images/docker/docker-architecture.svg)

### 2.1 Image (이미지) = 설계도

이미지는 **실행 환경의 설계도**다. 안에는 이런 것들이 들어간다:

- 운영체제 일부
- Python 버전
- 필요한 라이브러리
- 내 코드
- 실행 명령

이미지를 만들어두면, 누가 어디서 실행하든 **똑같은 환경으로 컨테이너를 만들 수 있다**.

### 2.2 Container (컨테이너) = 실행 중인 결과물

컨테이너는 **이미지를 실제로 실행한 것**이다. 이미지가 설계도라면, 컨테이너는 지금 실제로 돌아가고 있는 프로그램이다.

예를 들면:
- FastAPI 서버가 돌아가는 컨테이너
- PyTorch 모델 추론이 돌아가는 컨테이너
- DB가 돌아가는 컨테이너

같은 이미지로 컨테이너를 **여러 개** 만들 수도 있다. 즉, 하나의 설계도에서 여러 실행 인스턴스를 띄울 수 있다.

### 2.3 초보자가 가장 헷갈리는 포인트

**Image와 Container를 같은 걸로 생각하는 것**이 가장 흔한 실수다.

| 구분 | Image | Container |
|------|-------|-----------|
| 역할 | 설계도 | 실행된 결과 |
| 상태 | 정적 (안 움직임) | 동적 (돌아가는 중) |
| 비유 | 요리 레시피 | 실제 만들어진 도시락 |

---

## 3. Docker vs 가상머신(VM)

Docker가 가상머신이랑 같다고 생각하기 쉬운데, 완전히 같지는 않다.

![Docker vs VM 비교](/images/docker/docker-vs-vm.svg)

| 구분 | 가상머신(VM) | Docker |
|------|-------------|--------|
| 구조 | 컴퓨터를 통째로 하나 더 띄움 | 필요한 실행 환경만 가볍게 묶음 |
| 무게 | 무거움 (GB 단위) | 가벼움 (MB 단위) |
| 시작 시간 | 분 단위 | 초 단위 |
| 비유 | 집 하나를 새로 지음 | 방 하나만 깔끔하게 분리해서 씀 |

---

## 4. Dockerfile: 이미지를 만드는 레시피

Docker 이미지를 자동으로 만들려면 "어떤 환경으로 만들지" 적어놓은 설명서가 필요하다. 이것이 바로 **Dockerfile**이다.

![Dockerfile Layer 구조](/images/docker/dockerfile-layers.svg)

### FastAPI 서버 Dockerfile 예시

```dockerfile
FROM python:3.10
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 한 줄씩 의미 설명

| 명령어 | 의미 | 언제 쓰는지 |
|--------|------|-------------|
| `FROM python:3.10` | Python 3.10이 설치된 기본 이미지를 사용 | 베이스 환경을 정할 때 |
| `WORKDIR /app` | 컨테이너 안에서 작업 폴더를 /app으로 설정 | 코드가 놓일 기본 위치를 만들 때 |
| `COPY requirements.txt .` | 내 컴퓨터의 requirements.txt를 컨테이너로 복사 | 패키지 설치 파일을 먼저 넣을 때 |
| `RUN pip install ...` | 필요한 Python 패키지를 설치 | 라이브러리 세팅할 때 |
| `COPY . .` | 현재 폴더의 모든 파일을 컨테이너 안으로 복사 | 실제 코드 전체를 넣을 때 |
| `CMD [...]` | 컨테이너 시작 시 FastAPI 서버를 실행 | 기본 실행 명령을 지정할 때 |

`FROM`은 쉽게 말하면 "빈 상자가 아니라, Python이 이미 깔린 상자부터 시작할게요"라는 뜻이다.

---

## 5. Docker 기본 명령어

### 5.1 docker build - 이미지 만들기

```bash
docker build -t my-api .
```

현재 폴더의 Dockerfile을 보고 `my-api`라는 이름의 이미지를 만든다. `-t`는 이미지에 이름(태그)을 붙이는 옵션이고, `.`은 현재 폴더를 기준으로 빌드하라는 뜻이다.

### 5.2 docker run - 컨테이너 실행

```bash
docker run -p 8000:8000 my-api
```

`my-api` 이미지를 실행해서 컨테이너를 만든다. `-p 8000:8000`은 내 컴퓨터 8000번 포트와 컨테이너 8000번 포트를 연결하는 옵션이다.

### 5.3 docker ps - 실행 중인 컨테이너 확인

```bash
docker ps
```

현재 실행 중인 컨테이너 목록을 보여준다.

### 5.4 docker stop - 컨테이너 멈추기

```bash
docker stop <container_id>
```

실행 중인 컨테이너를 멈춘다. 서버를 내리거나 테스트가 끝났을 때 사용한다.

### 5.5 docker images - 이미지 목록 확인

```bash
docker images
```

내가 가지고 있는 이미지 목록을 보여준다.

---

## 6. 실제 개발 예시: FastAPI 서버 Docker로 띄우기

### 프로젝트 구조

```
project/
├── main.py
├── requirements.txt
└── Dockerfile
```

### main.py

```python
from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "hello docker"}
```

### requirements.txt

```
fastapi
uvicorn
```

### 실행 순서

```bash
# 1) 이미지 만들기
docker build -t my-fastapi .

# 2) 컨테이너 실행
docker run -p 8000:8000 my-fastapi

# 3) 브라우저 접속
# http://localhost:8000
```

결과:
```json
{"message": "hello docker"}
```

---

## 7. AI 모델 서빙 프로젝트에서의 Docker 활용

AI 모델을 서버에서 서빙할 때 Docker가 특히 유용하다.

![Docker Workflow - AI 모델 서빙 프로젝트](/images/docker/docker-workflow.svg)

### 왜 필요한가?

서버에서 DETR 같은 모델을 돌리려면 다음 환경이 정확히 맞아야 한다:
- Python 3.10
- torch 2.1
- CUDA 11.8
- torchvision 버전 호환
- 모델 가중치 로드 가능

이 중 하나라도 어긋나면 `ModuleNotFoundError`, CUDA mismatch, torch/torchvision 충돌, 모델 로드 실패 등의 문제가 발생한다.

### Docker Image에 들어가는 것

```dockerfile
# 예시: AI 모델 서빙 Dockerfile
FROM nvidia/cuda:11.8.0-runtime-ubuntu22.04

RUN apt-get update && apt-get install -y python3.10 python3-pip
WORKDIR /app

COPY requirements.txt .
RUN pip install torch torchvision fastapi uvicorn

COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

이 이미지 자체가 "내 추론 서버의 완성된 실행 환경 설계도"가 된다.

### 실제 동작 흐름

1. Flutter 앱이 이미지 전송 요청을 보냄
2. Docker 컨테이너 안의 FastAPI가 이미지를 받음
3. DETR 모델로 추론 수행
4. 결과 JSON을 Flutter에 반환

---

## 8. Docker가 실제로 해결하는 문제들

### 8.1 서버마다 환경이 달라도 동일하게 실행

로컬은 Mac, 서버는 Linux, 또 다른 서버는 GPU 세팅이 다를 수 있다. Docker를 쓰면 최소한 **애플리케이션 레벨 환경은 통일**할 수 있다.

### 8.2 배포가 쉬워짐

Docker 없이는 서버에 직접 들어가서 Python 설치, 라이브러리 설치, 코드 복사, 환경변수 설정, 서버 실행을 모두 해야 한다. Docker를 쓰면 **이미지 만들고 → 서버에서 실행**으로 단순해진다.

### 8.3 팀 협업이 쉬워짐

팀원이 새로 들어와도 "이거 설치하고 저거 설치하고 CUDA 맞추고..." 대신 **이미지 실행만 하면 같은 환경**을 바로 쓸 수 있다.

---

## 9. GPU 사용 시 주의사항

Docker가 환경 통일에 정말 좋지만, GPU를 쓰려면 **호스트 서버의 NVIDIA 드라이버나 Docker GPU 설정도 맞아야 한다**. Docker만 있다고 끝이 아니다.

면접에서 이렇게 말하면 깊이 있어 보인다:

> "Docker는 애플리케이션 의존성을 고정해주지만, GPU 사용 시에는 호스트 드라이버 및 런타임 설정까지 함께 맞춰야 합니다."

---

## 10. 실무에서의 활용 사례

| 활용 분야 | 설명 |
|-----------|------|
| 백엔드 API 배포 | FastAPI, Flask, Spring 서버를 Docker로 묶어서 배포 |
| AI 모델 서빙 | PyTorch, TensorFlow 모델 추론 서버를 Docker로 실행 |
| DB 같이 띄우기 | PostgreSQL, Redis, MongoDB도 컨테이너로 같이 실행 |
| 팀 개발 환경 통일 | 팀원 모두 같은 환경으로 개발 가능 |

---

## 11. 면접용 핵심 정리

**한 줄 답변이 필요할 때:**

> Docker는 애플리케이션과 실행 환경을 함께 묶어서 어디서든 동일하게 실행되도록 해주는 컨테이너 기반 도구입니다.

**실무 경험을 포함할 때:**

> 저는 Docker를 주로 배포 환경 통일에 사용합니다. 특히 AI 모델 서버는 PyTorch나 CUDA 버전 차이로 문제가 자주 생기기 때문에, Docker 이미지로 환경을 고정해서 로컬과 서버에서 동일하게 실행되도록 했습니다.

---

## 핵심 요약

| 개념 | 설명 |
|------|------|
| Docker | 실행 환경을 통째로 묶는 도구 |
| Image | 설계도 (정적) |
| Container | 실제 실행 중인 것 (동적) |
| Dockerfile | 이미지를 만드는 레시피 파일 |
| docker build | 이미지 만들기 |
| docker run | 컨테이너 실행하기 |
| 핵심 가치 | 환경 차이로 생기는 문제를 줄여줌 |
