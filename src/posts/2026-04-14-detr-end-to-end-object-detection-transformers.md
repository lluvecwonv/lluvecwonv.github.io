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

## 1. Introduction

기존 object detection 방법들은 대량의 proposal, anchor, 또는 window center에 대해 surrogate regression/classification 문제를 정의하는 간접적인 방식을 사용한다. 이 과정에서 near-duplicate prediction을 제거하기 위한 NMS(Non-Maximum Suppression), anchor set 설계, target box를 anchor에 할당하는 heuristic 등 다양한 hand-designed component가 필요하다.

DETR은 이러한 surrogate task들을 우회하여 **object detection을 direct set prediction 문제**로 바라본다. 핵심 구성요소는 두 가지이다:

1. **Bipartite matching을 통한 set-based global loss**: predicted와 ground-truth object 간 unique matching을 강제
2. **Transformer encoder-decoder architecture**: 모든 object를 한 번에 병렬로 예측

DETR은 conceptually simple하며 specialized library가 필요 없다. PyTorch에서 50줄 미만의 inference code로 구현 가능하다.

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
