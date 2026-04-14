---
title: "Docker Mastery - Understanding Concepts to Practical Use in One Go"
date: 2026-04-14
summary: A complete Docker guide for beginners. Covers the difference between Image and Container, Dockerfile basics, essential commands, and practical applications including AI model serving projects.
tags: [Docker, Container, DevOps, Dockerfile, Deployment, AI Model Serving, Development Environment]
category: AI/개발
language: en
---

A concept guide for developers new to Docker. From why it's needed to real project applications.

---

## 1. Why Do We Need Docker?

The most common problem in development:

- Works on my machine
- Doesn't work on the server
- Doesn't work on teammate's machine either

The cause is almost always **different execution environments**. Python version, PyTorch version, CUDA version, OS, installed packages — all can differ. The problem isn't the code itself, but the **environment**.

Docker solves this problem. In one sentence:

> **A tool that packages your entire execution environment so it runs identically anywhere.**

Without Docker, development is like telling everyone to cook the same dish at their own homes — results vary. With Docker, it's like distributing pre-made lunch boxes — identical everywhere.

---

## 2. Core Docker Concepts: Image and Container

The two most important concepts in Docker:

![Docker Architecture - Image and Container relationship](/images/docker/docker-architecture.svg)

### 2.1 Image = Blueprint

An image is the **blueprint of an execution environment**. It contains:

- Part of an operating system
- Python version
- Required libraries
- Your code
- Execution commands

Once an image is created, anyone can create **an identical container** from it, anywhere.

### 2.2 Container = Running Instance

A container is the **actual running result of an image**. If an image is a blueprint, a container is the currently running program.

Examples:
- A container running a FastAPI server
- A container running PyTorch model inference
- A container running a database

You can create **multiple containers** from the same image — one blueprint, many running instances.

### 2.3 Most Common Beginner Confusion

The most frequent mistake is **thinking Image and Container are the same thing**.

| Aspect | Image | Container |
|--------|-------|-----------|
| Role | Blueprint | Running result |
| State | Static (doesn't move) | Dynamic (running) |
| Analogy | Recipe | Actual prepared meal |

---

## 3. Docker vs Virtual Machine (VM)

Docker might seem like a virtual machine, but they're not the same.

![Docker vs VM Comparison](/images/docker/docker-vs-vm.svg)

| Aspect | Virtual Machine (VM) | Docker |
|--------|---------------------|--------|
| Architecture | Spins up an entire computer | Lightly bundles only the needed execution environment |
| Weight | Heavy (GB scale) | Light (MB scale) |
| Startup time | Minutes | Seconds |
| Analogy | Building an entirely new house | Cleanly partitioning just one room |

---

## 4. Dockerfile: The Recipe for Building Images

To automatically build a Docker image, you need a description file specifying how the environment should be set up. This is the **Dockerfile**.

![Dockerfile Layer Structure](/images/docker/dockerfile-layers.svg)

### FastAPI Server Dockerfile Example

```dockerfile
FROM python:3.10
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Line-by-line Explanation

| Command | Meaning | When to Use |
|---------|---------|-------------|
| `FROM python:3.10` | Use a base image with Python 3.10 installed | Setting the base environment |
| `WORKDIR /app` | Set /app as the working directory inside the container | Setting where code will reside |
| `COPY requirements.txt .` | Copy requirements.txt from host into the container | Putting package install file first |
| `RUN pip install ...` | Install required Python packages | Setting up libraries |
| `COPY . .` | Copy all files from current folder into the container | Adding your actual code |
| `CMD [...]` | Run FastAPI server when container starts | Specifying default startup command |

Think of `FROM` as saying "Start with a box that already has Python installed, not an empty box."

---

## 5. Essential Docker Commands

### 5.1 docker build - Create an Image

```bash
docker build -t my-api .
```

Reads the Dockerfile in the current folder and creates an image named `my-api`. `-t` tags the image with a name, `.` means build from the current directory.

### 5.2 docker run - Run a Container

```bash
docker run -p 8000:8000 my-api
```

Runs the `my-api` image and creates a container. `-p 8000:8000` maps port 8000 on your machine to port 8000 in the container.

### 5.3 docker ps - Check Running Containers

```bash
docker ps
```

Shows a list of currently running containers.

### 5.4 docker stop - Stop a Container

```bash
docker stop <container_id>
```

Stops a running container.

### 5.5 docker images - List Images

```bash
docker images
```

Shows all images you have locally.

---

## 6. Practical Example: Dockerizing a FastAPI Server

### Project Structure

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

### Execution Steps

```bash
# 1) Build the image
docker build -t my-fastapi .

# 2) Run the container
docker run -p 8000:8000 my-fastapi

# 3) Open browser
# http://localhost:8000
```

Result:
```json
{"message": "hello docker"}
```

---

## 7. Docker for AI Model Serving Projects

Docker is especially useful when serving AI models on servers.

![Docker Workflow - AI Model Serving Project](/images/docker/docker-workflow.svg)

### Why Is It Needed?

To run a model like DETR on a server, the environment must match exactly:
- Python 3.10
- torch 2.1
- CUDA 11.8
- Compatible torchvision version
- Model weights must load properly

If any of these are off, you get `ModuleNotFoundError`, CUDA mismatch, torch/torchvision conflicts, or model load failures.

### What Goes Inside a Docker Image

```dockerfile
# Example: AI model serving Dockerfile
FROM nvidia/cuda:11.8.0-runtime-ubuntu22.04

RUN apt-get update && apt-get install -y python3.10 python3-pip
WORKDIR /app

COPY requirements.txt .
RUN pip install torch torchvision fastapi uvicorn

COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

This image becomes the "complete execution environment blueprint for your inference server."

### Actual Workflow

1. Flutter app sends an image transfer request
2. FastAPI inside the Docker container receives the image
3. DETR model performs inference
4. Result JSON is returned to Flutter

---

## 8. Real Problems Docker Solves

### 8.1 Identical Execution Across Different Servers

Your local might be Mac, the server Linux, another server has different GPU settings. Docker unifies **at least the application-level environment**.

### 8.2 Simplified Deployment

Without Docker, you'd need to SSH into the server, install Python, install libraries, copy code, set environment variables, and start the server. With Docker: **build image → run on server**. That simple.

### 8.3 Easier Team Collaboration

When a new teammate joins, instead of "install this, install that, match CUDA versions...", they just **run the image** and get the same environment instantly.

---

## 9. Caution with GPU Usage

Docker is great for environment unification, but for GPU usage, **the host server's NVIDIA driver and Docker GPU settings must also be correctly configured**. Docker alone isn't enough.

A solid interview answer:

> "Docker fixes application dependencies, but for GPU usage, host driver and runtime configurations must also be aligned."

---

## 10. Real-world Use Cases

| Use Case | Description |
|----------|-------------|
| Backend API deployment | Package FastAPI, Flask, Spring servers with Docker |
| AI model serving | Run PyTorch, TensorFlow inference servers in Docker |
| Running databases alongside | Run PostgreSQL, Redis, MongoDB as containers |
| Unified team dev environment | Everyone develops in the same environment |

---

## 11. Interview-Ready Summary

**One-liner:**

> Docker is a container-based tool that packages applications with their execution environment to ensure identical execution anywhere.

**With practical experience:**

> I primarily use Docker for deployment environment unification. AI model servers frequently face issues with PyTorch and CUDA version differences, so I use Docker images to fix the environment and ensure identical execution across local and server environments.

---

## Key Takeaways

| Concept | Description |
|---------|-------------|
| Docker | Tool that bundles the entire execution environment |
| Image | Blueprint (static) |
| Container | Running instance (dynamic) |
| Dockerfile | Recipe file for building images |
| docker build | Create an image |
| docker run | Run a container |
| Core value | Reduces problems caused by environment differences |
