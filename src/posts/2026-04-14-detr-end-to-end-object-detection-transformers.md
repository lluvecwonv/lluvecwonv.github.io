---
title: "논문 리뷰 - End-to-End Object Detection with Transformers (DETR)"
date: 2026-04-14
summary: ECCV 2020 논문 "End-to-End Object Detection with Transformers"(DETR) 리뷰. Transformer 기반 encoder-decoder 구조와 bipartite matching loss를 결합하여 NMS, anchor 등 hand-designed component 없이 object detection을 직접 set prediction 문제로 해결하는 방법을 제안한다. COCO 데이터셋에서 Faster R-CNN과 동등한 성능을 달성하며, panoptic segmentation으로의 확장도 가능함을 보인다.
tags: [Object Detection, Transformer, Computer Vision, COCO, Bipartite Matching, Panoptic Segmentation, ECCV 2020, 연구노트]
category: 연구노트
language: ko
---

본 연구노트는 ECCV 2020 논문 **"End-to-End Object Detection with Transformers"** (DETR)을 정리한 것이다.

**저자**: Nicolas Carion*, Francisco Massa*, Gabriel Synnaeve, Nicolas Usunier, Alexander Kirillov, Sergey Zagoruyko (*Equal contribution)
**소속**: Facebook AI
**논문 링크**: [https://arxiv.org/abs/2005.12872](https://arxiv.org/abs/2005.12872)
**코드**: [https://github.com/facebookresearch/detr](https://github.com/facebookresearch/detr)

## 한 줄 요약

Transformer encoder-decoder 구조와 bipartite matching 기반 set prediction loss를 결합하여, NMS나 anchor generation 같은 hand-designed component 없이도 object detection을 end-to-end로 수행하는 DEtection TRansformer(DETR)를 제안한다.

---

## 1. DETR의 문제의식: Object Detection은 왜 Set Prediction인가?

### 1.1 Object Detection이 진짜 풀고 싶은 문제

Object detection에서 정말 하고 싶은 일은 단순하다.

- **입력**: 이미지 1장
- **출력**: 그 이미지 안에 있는 모든 객체들의 목록

예를 들어 이미지에 사람 1명, 강아지 1마리, 자동차 1대가 있으면, 출력은 이런 형태다:

$$\{(\text{사람}, b_1), (\text{강아지}, b_2), (\text{자동차}, b_3)\}$$

각 원소는 **(class label, bounding box)**로 이루어진다. 즉, detection의 출력은 **객체 여러 개의 집합(set)**이다.

### 1.2 왜 "Set"이라고 부르는가?

출력이 단순한 리스트가 아니라 **set**에 가깝다. 왜냐하면 object detection의 정답은 **순서가 중요하지 않기 때문**이다.

정답이 {사람, 강아지, 자동차}일 때, 이걸 {자동차, 사람, 강아지} 순서로 예측해도 정답은 똑같다. "첫 번째가 사람이어야 한다", "두 번째가 강아지여야 한다" 같은 규칙이 없다. 그래서 detection의 출력은 순서가 있는 sequence가 아니라, **순서가 없는 객체들의 모음, 즉 set으로 보는 게 자연스럽다.**

### 1.3 왜 이게 어려운 문제인가?

Detection이 일반적인 classification보다 근본적으로 어려운 이유는 세 가지다.

**(1) 객체 개수가 매번 다르다**

Classification은 입력 이미지에 대해 고정된 클래스 1개를 출력하면 된다. 하지만 detection은 객체가 0개일 수도, 3개일 수도, 15개일 수도 있다. **출력 길이가 고정되어 있지 않다.**

**(2) 출력 순서가 없다**

모델이 {개 박스, 사람 박스} 순서로 예측했는데, 정답은 {사람 박스, 개 박스}라면? 사실 맞는 예측이다. 하지만 컴퓨터는 기본적으로 "첫 번째 예측은 첫 번째 정답과 비교"하려 한다. **예측과 정답을 어떻게 대응시킬지 matching이 필요하다.**

**(3) 각 객체마다 위치와 클래스 둘 다 맞춰야 한다**

단순히 "강아지가 있다"만 맞추면 되는 게 아니라, 클래스도 맞아야 하고 위치도 정확해야 한다. 출력 하나하나가 단순 label이 아니라 **구조화된 정보(class + box)**다.

### 1.4 Detection의 본질은 "Set Prediction"이다

정리하면, detection은 그냥 박스를 찍는 문제가 아니라:

- **개수가 가변적**이고
- **순서가 없고**
- 각 원소가 **class와 box로 이루어진**

**구조화된 set을 예측하는 문제**다. 논문에서 이를 **set prediction task**라고 부른다.

### 1.5 그런데 기존 Detector는 이 문제를 직접 풀지 않았다

기존 detector들은 이 set prediction 문제를 직접 풀지 않고, 더 쉬운 형태의 **surrogate problem(대리 문제)**으로 바꿔서 풀었다. 원래 문제는 "이미지 → 객체들의 집합"인데, 이걸 바로 다루기 어려우니까:

1. **미리 후보 위치(anchor/proposal)를 수천 개 만들어 놓고**
2. 각 후보에 대해 "이 후보에 객체가 있는가?" (classification)
3. "있다면 박스를 얼마나 수정할까?" (regression)

를 예측하게 한다. 즉, 원래의 set prediction을 **classification + regression 문제로 쪼개서** 푸는 것이다. 이것이 **surrogate problem**이고 **indirect approach**다.

### 1.6 Anchor/Proposal 방식이 만드는 문제들

anchor를 많이 깔아두면 **하나의 객체를 여러 anchor가 동시에 덮게** 된다. 이미지에 강아지 1마리가 있으면 anchor A, B, C가 모두 "강아지다"라고 예측할 수 있다. **실제 객체는 1개인데 예측 박스는 여러 개가 나오는 중복 예측(duplicate prediction) 문제가 발생한다.**

이 중복을 정리하기 위해 **NMS(Non-Maximum Suppression)**가 필요하다. 가장 점수가 높은 박스 하나를 남기고, 그와 많이 겹치는 다른 박스들을 제거하는 후처리 과정이다. NMS는 원래 문제의 본질이 아니라, **anchor 기반 간접 접근 때문에 생긴 부작용을 정리하는 단계**다.

결과적으로 기존 detector의 성능은 모델의 능력뿐만 아니라 다음 요소들에 크게 좌우된다:

| Hand-designed Component | 역할 |
|------------------------|------|
| **Anchor design** | 어떤 크기와 비율의 anchor를 둘 것인가 |
| **Heuristic matching** | 어떤 anchor를 positive/negative로 볼 것인가 (예: IoU > 0.5이면 positive) |
| **NMS post-processing** | 중복 박스를 어떻게 제거할 것인가 |

즉 원래 detection 문제 외에도 **사람이 정한 규칙과 설계가 엄청 많이 들어간다.**

### 1.7 DETR의 핵심 주장

DETR은 이렇게 말한다:

> **"그렇게 복잡하게 우회하지 말고, 원래 문제를 원래 형태대로 직접 풀자."**

"이미지 → 객체들의 집합"을 직접 예측하자는 것이다. 그래서 DETR은 **anchor도 없애고, NMS도 없애고, heuristic matching도 없애고**, Transformer와 bipartite matching을 이용해서 **set prediction 자체를 직접 학습**한다. 핵심 구성요소는 두 가지다:

1. **Bipartite matching을 통한 set-based global loss**: predicted와 ground-truth object 간 unique matching을 강제
2. **Transformer encoder-decoder architecture**: 모든 object를 한 번에 병렬로 예측

DETR은 conceptually simple하며 specialized library가 필요 없다. PyTorch에서 50줄 미만의 inference code로 구현 가능하다.

### 전체 흐름 요약

| 단계 | 설명 |
|------|------|
| **Detection의 본질** | 이미지에서 객체 여러 개를 찾는 것. 출력은 순서 없는 객체들의 집합 → **set prediction** |
| **기존 Detector** | Set prediction을 직접 풀기 어려워서, anchor/proposal 기반 classification + regression으로 변환 → **surrogate problem, indirect approach** |
| **그 결과** | 하나의 객체를 여러 anchor가 동시에 예측 → 중복 박스 → NMS 필요. anchor 설계와 heuristic rule에 성능 좌우 |
| **DETR** | 이런 우회 방식을 버리고, 객체 집합 자체를 직접 예측 → **direct set prediction** |

![DETR overview - CNN backbone + Transformer로 최종 detection set을 직접 병렬 예측](/images/detr/DETR_fig1_seagulls.png)
*Figure 1: DETR은 CNN과 Transformer architecture를 결합하여 최종 detection set을 직접 병렬로 예측한다. 학습 시 bipartite matching이 prediction과 ground truth box를 고유하게 매칭한다.*

---

## 2. Method

### 2.1 Object Detection Set Prediction Loss

DETR은 decoder를 한 번 통과하여 고정 크기 N개의 prediction을 추론한다 (N은 이미지 내 일반적인 object 수보다 훨씬 크게 설정). 학습의 핵심은 predicted object와 ground truth 간의 최적 bipartite matching을 찾는 것이다.

**Step 1 - Hungarian Matching**: Ground truth set y와 N개 prediction set ŷ 사이에서 최소 cost를 갖는 permutation σ̂을 찾는다:

$$\hat{\sigma} = \argmin_{\sigma \in \Sigma_N} \sum_{i}^{N} \mathcal{L}_{match}(y_i, \hat{y}_{\sigma(i)})$$

이 최적 할당은 **Hungarian algorithm**으로 효율적으로 계산된다. Matching cost는 class prediction probability와 predicted/ground truth box 간 similarity를 모두 고려한다.

**Step 2 - Hungarian Loss**: 매칭된 모든 쌍에 대해 loss를 계산한다:

$$\mathcal{L}_{Hungarian}(y, \hat{y}) = \sum_{i=1}^{N} \left[-\log \hat{p}_{\hat{\sigma}(i)}(c_i) + \mathbb{1}_{c_i \neq \varnothing} \mathcal{L}_{box}(b_i, \hat{b}_{\hat{\sigma}(i)})\right]$$

class imbalance를 고려하여 ∅(no object) class에 대한 log-probability term은 factor 10으로 down-weight한다.

**Bounding Box Loss**: 직접적인 box prediction 방식을 사용하며, small/large box 간 relative scaling 문제를 해결하기 위해 **ℓ₁ loss와 generalized IoU(GIoU) loss의 linear combination**을 사용한다:

$$\mathcal{L}_{box}(b_i, \hat{b}_{\sigma(i)}) = \lambda_{iou} \mathcal{L}_{GIoU}(b_i, \hat{b}_{\sigma(i)}) + \lambda_{L1} \|b_i - \hat{b}_{\sigma(i)}\|_1$$

### 2.2 DETR Architecture

전체 구조는 세 가지 주요 component로 구성된다: CNN backbone, transformer encoder-decoder, prediction FFN.

![DETR 상세 아키텍처](/images/detr/DETR_detail_seagulls.png)
*Figure 2: DETR 아키텍처. CNN backbone으로 2D representation을 추출하고, flatten 후 positional encoding을 더해 transformer encoder에 전달한다. Transformer decoder는 고정된 수의 learned positional embedding(object queries)을 입력으로 받아 encoder output에 attend한다.*

**Backbone**: 입력 이미지 x_img ∈ ℝ^{3×H₀×W₀}에서 conventional CNN backbone (ResNet-50/101)이 lower-resolution activation map f ∈ ℝ^{C×H×W}를 생성한다 (C=2048, H,W = H₀/32, W₀/32).

**Transformer Encoder**: 1×1 convolution으로 channel dimension을 C에서 d_model로 축소한다. Spatial dimension을 flatten하여 d_model × HW feature map으로 변환하고, 각 attention layer 입력에 fixed positional encoding을 추가한다. Encoder의 global self-attention은 instance를 분리하는 역할을 한다.

**Transformer Decoder**: 원래 transformer와의 차이점은 N개 object를 **각 decoder layer에서 병렬로** decode한다는 것이다 (원래 transformer는 autoregressive). N개의 input embedding은 학습된 positional encoding으로, **object queries**라 부른다. Self-attention과 encoder-decoder attention을 통해 모든 object 간의 pair-wise relation을 globally reason한다.

**Prediction FFN**: ReLU activation과 hidden dimension d를 가진 3-layer perceptron이 normalized center coordinates, height, width를 예측하고, linear projection layer가 softmax로 class label을 예측한다. 실제 object 수보다 N이 훨씬 크므로, 특별한 ∅(no object) class label을 사용한다.

**Auxiliary Decoding Losses**: 각 decoder layer 후에 prediction FFN과 Hungarian loss를 추가한다. 모든 prediction FFN은 parameter를 공유한다.

![Transformer 상세 구조](/images/detr/transformer.png)
*Figure 3: DETR Transformer의 상세 구조. Positional encoding이 매 attention layer마다 전달된다.*

---

## 3. Experiments

### 3.1 실험 설정

**데이터셋**: COCO 2017 detection and panoptic segmentation dataset (118k training images, 5k validation images). 이미지당 평균 7개 instance, 최대 63개 instance.

**학습 세부사항**:

- **Optimizer**: AdamW (weight decay 10⁻⁴)
- **Learning rate**: Transformer 10⁻⁴, backbone 10⁻⁵ (backbone LR이 ~10배 작은 것이 학습 안정화에 중요)
- **Backbone**: ImageNet-pretrained ResNet-50/101 (frozen batchnorm)
- **초기화**: Xavier initialization for transformer weights
- **Data augmentation**: Scale augmentation (shortest side 480-800, longest 1333), random crop (probability 0.5)
- **Dropout**: 0.1
- **Schedule**: Ablation은 300 epochs (200 epoch에서 LR drop), Faster R-CNN 비교는 500 epochs (400 epoch에서 LR drop)
- **학습 환경**: 16 V100 GPU, 4 images/GPU (total batch size 64), 300 epochs에 약 3일
- **Loss weights**: λ_L1 = 5, λ_iou = 2, N = 100 decoder query slots
- **Gradient clipping**: maximal gradient norm 0.1

### 3.2 Faster R-CNN과의 비교

공정한 비교를 위해 Faster R-CNN baseline을 강화하였다: GIoU loss 추가, 동일한 random crop augmentation, 9x schedule (109 epochs) 적용.

| Model | GFLOPS/FPS | #params | AP | AP₅₀ | AP₇₅ | AP_S | AP_M | AP_L |
|-------|-----------|---------|-----|------|------|------|------|------|
| Faster RCNN-DC5 | 320/16 | 166M | 39.0 | 60.5 | 42.3 | 21.4 | 43.5 | 52.5 |
| Faster RCNN-FPN | 180/26 | 42M | 40.2 | 61.0 | 43.8 | 24.2 | 43.5 | 52.0 |
| Faster RCNN-R101-FPN | 246/20 | 60M | 42.0 | 62.5 | 45.9 | 25.2 | 45.6 | 54.6 |
| Faster RCNN-DC5+ | 320/16 | 166M | 41.1 | 61.4 | 44.3 | 22.9 | 45.9 | 55.0 |
| Faster RCNN-FPN+ | 180/26 | 42M | 42.0 | 62.1 | 45.5 | 26.6 | 45.4 | 53.4 |
| Faster RCNN-R101-FPN+ | 246/20 | 60M | 44.0 | 63.9 | **47.8** | **27.2** | 48.1 | 56.0 |
| **DETR** | 86/28 | 41M | 42.0 | 62.4 | 44.2 | 20.5 | 45.8 | 61.1 |
| **DETR-DC5** | 187/12 | 41M | 43.3 | 63.1 | 45.9 | 22.5 | 47.3 | 61.1 |
| **DETR-R101** | 152/20 | 60M | 43.5 | 63.8 | 46.4 | 21.9 | 48.0 | 61.8 |
| **DETR-DC5-R101** | 253/10 | 60M | **44.9** | **64.7** | 47.7 | 23.7 | **49.5** | **62.3** |

**핵심 관찰**:
- DETR은 동일한 parameter 수에서 Faster R-CNN과 competitive한 42 AP 달성
- **AP_L (large objects)에서 크게 우수** (+7.8): transformer의 non-local computation 덕분
- **AP_S (small objects)에서 열세** (-5.5): 향후 FPN과 같은 개선이 필요
- DETR-DC5: feature resolution을 2배로 높여 small object 성능 개선 (self-attention 비용 16배 증가, 전체 비용 약 2배 증가)

### 3.3 Ablation Studies

#### Encoder Layer 수의 영향

| #layers | GFLOPS/FPS | #params | AP | AP₅₀ | AP_S | AP_M | AP_L |
|---------|-----------|---------|-----|------|------|------|------|
| 0 | 76/28 | 33.4M | 36.7 | 57.4 | 16.8 | 39.6 | 54.2 |
| 3 | 81/25 | 37.4M | 40.1 | 60.6 | 18.5 | 43.8 | 58.6 |
| 6 | 86/23 | 41.3M | 40.6 | 61.6 | 19.9 | 44.3 | 60.2 |
| 12 | 95/20 | 49.2M | 41.6 | 62.1 | 19.8 | 44.9 | 61.9 |

Encoder layer 없이는 AP가 3.9 하락하며, 특히 large object에서 6.0 AP 하락. Global scene reasoning을 통해 encoder가 instance를 분리하는 것이 중요하다.

![Encoder self-attention visualization](/images/detr/cows_attn.png)
*Figure 4: Encoder self-attention 시각화. 참조점별로 encoder가 이미 개별 instance를 분리하고 있음을 보여준다.*

#### Decoder Layer 수의 영향

각 decoder layer마다 auxiliary loss를 적용하여 중간 단계에서도 예측이 가능하다. 첫 번째 layer에서 마지막 layer까지 **+8.2 AP의 상당한 성능 향상**이 있다.

![NMS 분석](/images/detr/nms_fig4.png)
*Figure 5: 각 decoder layer 후 AP 성능. DETR은 설계상 NMS가 불필요하며, 마지막 layer에서 NMS 적용 시 오히려 true positive를 제거하여 AP가 하락한다.*

첫 번째 decoder layer에서는 NMS가 성능을 개선하는데, 이는 단일 layer만으로는 output element 간 cross-correlation을 계산할 수 없어 동일 object에 대한 중복 prediction이 발생하기 때문이다. 후속 layer에서는 self-attention이 중복 prediction을 억제한다.

#### FFN의 중요성

Transformer 내부 FFN을 완전히 제거하면 parameter가 41.3M → 28.7M으로 줄지만, 성능이 2.3 AP 하락한다.

#### Positional Encoding의 중요성

| Encoder | Decoder | Output pos. enc. | AP | Δ |
|---------|---------|-------------------|-----|---|
| none | none | learned at input | 32.8 | -7.8 |
| sine at input | sine at input | learned at input | 39.2 | -1.4 |
| learned at attn. | learned at attn. | learned at attn. | 39.6 | -1.0 |
| none | sine at attn. | learned at attn. | 39.3 | -1.3 |
| sine at attn. | sine at attn. | learned at attn. | **40.6** | - |

Spatial positional encoding을 완전히 제거해도 32.8 AP를 달성하지만, baseline 대비 7.8 AP 하락. Encoding을 attention에 직접 전달하는 것이 input에 한 번만 더하는 것보다 좋다.

#### Loss Ablation

| class | ℓ₁ | GIoU | AP | Δ |
|-------|-----|------|-----|---|
| ✓ | ✓ | | 35.8 | -4.8 |
| ✓ | | ✓ | 39.9 | -0.7 |
| ✓ | ✓ | ✓ | **40.6** | - |

GIoU loss만으로도 대부분의 성능을 달성하며 (baseline 대비 -0.7 AP), ℓ₁ loss를 결합하면 AP_M과 AP_L이 개선된다.

### 3.4 Analysis

#### Decoder Output Slot Analysis

![Object query 시각화](/images/detr/query_distr.png)
*Figure 6: COCO 2017 val set 전체에서 100개 prediction slot 중 20개의 box prediction 시각화. 각 slot은 특정 area와 box size에 특화되는 것을 학습한다. 녹색=작은 box, 빨간색=큰 수평 box, 파란색=큰 수직 box.*

각 query slot은 서로 다른 specialization을 학습하며, 여러 operating mode를 가진다. 거의 모든 slot이 image-wide box를 예측하는 mode를 가지고 있다.

#### Out-of-Distribution Generalization

학습 데이터에 기린이 13마리 이상인 이미지가 없음에도, DETR은 합성 이미지에서 24마리의 기린을 모두 찾아냈다. 이는 object query에 strong class-specialization이 없음을 확인해준다.

![Out-of-distribution generalization](/images/detr/giraffe_collage2.jpg)
*Figure 7: 희귀 클래스에 대한 분포 외 일반화. 학습 세트에 13마리 이상의 기린 이미지가 없지만, DETR은 24마리 이상의 기린도 어려움 없이 검출한다.*

### 3.5 DETR for Panoptic Segmentation

DETR은 decoder output 위에 mask head를 추가하여 panoptic segmentation으로 자연스럽게 확장된다. Stuff와 thing class를 통합된 방식으로 처리한다.

![Panoptic head 구조](/images/detr/panoptic2.png)
*Figure 8: Panoptic head. 각 검출 object에 대해 binary mask를 병렬로 생성한 후, pixel-wise argmax로 mask를 병합한다.*

Mask head는 각 object에 대해 transformer decoder output으로부터 encoder output에 대한 multi-head attention score를 계산하여 M개의 attention heatmap을 생성하고, FPN-like architecture로 resolution을 높인다. DICE/F-1 loss와 Focal loss로 감독된다.

| Model | Backbone | PQ | SQ | RQ | PQ^th | PQ^st | AP |
|-------|----------|-----|-----|-----|-------|-------|-----|
| PanopticFPN++ | R50 | 42.4 | 79.3 | 51.6 | 49.2 | 32.3 | 37.7 |
| UPSnet | R50 | 42.5 | 78.0 | 52.5 | 48.6 | 33.4 | 34.3 |
| PanopticFPN++ | R101 | 44.1 | 79.5 | 53.3 | **51.0** | 33.6 | **39.7** |
| **DETR** | R50 | 43.4 | 79.3 | 53.8 | 48.2 | 36.3 | 31.1 |
| **DETR-DC5** | R50 | 44.6 | 79.8 | 55.0 | 49.4 | **37.3** | 31.9 |
| **DETR-R101** | R101 | **45.1** | **79.9** | **55.5** | 50.5 | 37.0 | 33.0 |

DETR은 COCO val에서 기존 방법들을 outperform하며, 특히 **stuff class (PQ^st)**에서 큰 우위를 보인다. 이는 encoder attention의 global reasoning이 핵심 요인으로 추정된다.

---

## 4. Supplementary: PyTorch Inference Code

DETR의 간결함을 보여주는 PyTorch 추론 코드 (약 40줄):

```python
import torch
from torch import nn
from torchvision.models import resnet50

class DETR(nn.Module):
    def __init__(self, num_classes, hidden_dim, nheads,
                 num_encoder_layers, num_decoder_layers):
        super().__init__()
        self.backbone = nn.Sequential(
            *list(resnet50(pretrained=True).children())[:-2])
        self.conv = nn.Conv2d(2048, hidden_dim, 1)
        self.transformer = nn.Transformer(
            hidden_dim, nheads,
            num_encoder_layers, num_decoder_layers)
        self.linear_class = nn.Linear(hidden_dim, num_classes + 1)
        self.linear_bbox = nn.Linear(hidden_dim, 4)
        self.query_pos = nn.Parameter(torch.rand(100, hidden_dim))
        self.row_embed = nn.Parameter(torch.rand(50, hidden_dim // 2))
        self.col_embed = nn.Parameter(torch.rand(50, hidden_dim // 2))

    def forward(self, inputs):
        x = self.backbone(inputs)
        h = self.conv(x)
        H, W = h.shape[-2:]
        pos = torch.cat([
            self.col_embed[:W].unsqueeze(0).repeat(H, 1, 1),
            self.row_embed[:H].unsqueeze(1).repeat(1, W, 1),
        ], dim=-1).flatten(0, 1).unsqueeze(1)
        h = self.transformer(pos + h.flatten(2).permute(2, 0, 1),
                             self.query_pos.unsqueeze(1))
        return self.linear_class(h), self.linear_bbox(h).sigmoid()

detr = DETR(num_classes=91, hidden_dim=256, nheads=8,
            num_encoder_layers=6, num_decoder_layers=6)
detr.eval()
inputs = torch.randn(1, 3, 800, 1200)
logits, bboxes = detr(inputs)
```

---

## 5. Conclusion 및 개인 의견

### 논문의 기여
1. **Object detection을 direct set prediction 문제로 재정의**: NMS, anchor generation 등 hand-designed component를 제거
2. **Bipartite matching loss + Transformer**: 간결하면서도 강력한 end-to-end detection framework
3. **범용성**: Panoptic segmentation으로 쉽게 확장 가능
4. **구현 단순성**: 50줄 미만의 코드로 구현 가능, specialized library 불필요

### 한계점
1. **Small object detection 성능 열세** (AP_S에서 Faster R-CNN 대비 -5.5)
2. **긴 학습 시간**: 300-500 epochs 필요 (Faster R-CNN은 ~36 epochs)
3. **Encoder self-attention의 계산 비용**: 해상도가 높아지면 quadratic하게 증가
4. **N=100 query slot 제한**: 100개 이상의 object가 있는 경우 감지 불가

### 후속 연구에 미친 영향
DETR은 이후 Deformable DETR, Conditional DETR, DAB-DETR, DN-DETR, DINO 등 수많은 후속 연구의 기반이 되었으며, Transformer 기반 detection 패러다임을 확립한 seminal work이다.
