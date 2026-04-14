---
title: "Paper Review - End-to-End Object Detection with Transformers (DETR)"
date: 2026-04-14
summary: Review of the ECCV 2020 paper "End-to-End Object Detection with Transformers" (DETR). The paper proposes a Transformer-based encoder-decoder architecture combined with bipartite matching loss to solve object detection as a direct set prediction problem, eliminating hand-designed components like NMS and anchor generation. DETR achieves performance on par with Faster R-CNN on COCO and extends naturally to panoptic segmentation.
tags: [Object Detection, Transformer, Computer Vision, COCO, Bipartite Matching, Panoptic Segmentation, ECCV 2020, Research Note]
category: 연구노트
language: en
---

This research note summarizes the ECCV 2020 paper **"End-to-End Object Detection with Transformers"** (DETR).

**Authors**: Nicolas Carion*, Francisco Massa*, Gabriel Synnaeve, Nicolas Usunier, Alexander Kirillov, Sergey Zagoruyko (*Equal contribution)
**Affiliation**: Facebook AI
**Paper link**: [https://arxiv.org/abs/2005.12872](https://arxiv.org/abs/2005.12872)
**Code**: [https://github.com/facebookresearch/detr](https://github.com/facebookresearch/detr)

## One-line Summary

The paper proposes DEtection TRansformer (DETR), which combines a Transformer encoder-decoder architecture with a bipartite matching-based set prediction loss to perform end-to-end object detection without hand-designed components such as NMS or anchor generation.

---

## 1. Introduction

Existing object detection methods address the set prediction task indirectly by defining surrogate regression and classification problems on a large set of proposals, anchors, or window centers. Their performance is significantly influenced by postprocessing steps to collapse near-duplicate predictions, by the design of anchor sets, and by the heuristics that assign target boxes to anchors.

DETR bypasses these surrogate tasks by viewing **object detection as a direct set prediction problem**. The two key ingredients are:

1. **A set-based global loss via bipartite matching**: forces unique matching between predicted and ground-truth objects
2. **A transformer encoder-decoder architecture**: predicts all objects at once in parallel

DETR is conceptually simple and does not require a specialized library. Inference code can be implemented in less than 50 lines in PyTorch.

![DETR overview - directly predicts final detection set in parallel using CNN backbone + Transformer](/images/detr/DETR_fig1_seagulls.png)
*Figure 1: DETR directly predicts (in parallel) the final set of detections by combining a common CNN with a transformer architecture. During training, bipartite matching uniquely assigns predictions with ground truth boxes.*

---

## 2. Method

### 2.1 Object Detection Set Prediction Loss

DETR infers a fixed-size set of N predictions in a single pass through the decoder, where N is set to be significantly larger than the typical number of objects in an image. The core of training is finding an optimal bipartite matching between predicted objects and ground truth.

**Step 1 - Hungarian Matching**: Find the permutation σ̂ with the lowest cost between ground truth set y and N predictions ŷ:

$$\hat{\sigma} = \argmin_{\sigma \in \Sigma_N} \sum_{i}^{N} \mathcal{L}_{match}(y_i, \hat{y}_{\sigma(i)})$$

This optimal assignment is computed efficiently with the **Hungarian algorithm**. The matching cost takes into account both the class prediction probability and the similarity of predicted and ground truth boxes.

**Step 2 - Hungarian Loss**: Compute the loss for all matched pairs:

$$\mathcal{L}_{Hungarian}(y, \hat{y}) = \sum_{i=1}^{N} \left[-\log \hat{p}_{\hat{\sigma}(i)}(c_i) + \mathbb{1}_{c_i \neq \varnothing} \mathcal{L}_{box}(b_i, \hat{b}_{\hat{\sigma}(i)})\right]$$

The log-probability term for the ∅ (no object) class is down-weighted by a factor of 10 to account for class imbalance.

**Bounding Box Loss**: Since DETR makes direct box predictions (rather than deltas from initial guesses), a **linear combination of ℓ₁ loss and generalized IoU (GIoU) loss** is used to mitigate relative scaling issues between small and large boxes:

$$\mathcal{L}_{box}(b_i, \hat{b}_{\sigma(i)}) = \lambda_{iou} \mathcal{L}_{GIoU}(b_i, \hat{b}_{\sigma(i)}) + \lambda_{L1} \|b_i - \hat{b}_{\sigma(i)}\|_1$$

### 2.2 DETR Architecture

The overall architecture consists of three main components: a CNN backbone, a transformer encoder-decoder, and prediction FFNs.

![DETR detailed architecture](/images/detr/DETR_detail_seagulls.png)
*Figure 2: DETR architecture. A CNN backbone extracts a 2D representation, which is flattened and supplemented with positional encoding before passing to the transformer encoder. The transformer decoder takes a fixed number of learned positional embeddings (object queries) as input and attends to the encoder output.*

**Backbone**: Starting from the input image x_img ∈ ℝ^{3×H₀×W₀}, a conventional CNN backbone (ResNet-50/101) generates a lower-resolution activation map f ∈ ℝ^{C×H×W} (C=2048, H,W = H₀/32, W₀/32).

**Transformer Encoder**: A 1×1 convolution reduces the channel dimension from C to d_model. The spatial dimensions are collapsed into one dimension, resulting in a d_model × HW feature map. Fixed positional encodings are added to the input of each attention layer. The encoder's global self-attention separates instances already at this stage.

**Transformer Decoder**: Unlike the original transformer which uses autoregressive decoding, DETR's decoder decodes the N objects **in parallel** at each decoder layer. The N input embeddings are learnt positional encodings called **object queries**. Through self- and encoder-decoder attention, the model globally reasons about all objects together using pair-wise relations while using the whole image as context.

**Prediction FFNs**: A 3-layer perceptron with ReLU activation and hidden dimension d predicts normalized center coordinates, height, and width. A linear projection layer predicts the class label using softmax. A special ∅ (no object) class represents empty slots.

**Auxiliary Decoding Losses**: Prediction FFNs and Hungarian loss are added after each decoder layer. All prediction FFNs share their parameters.

![Detailed Transformer structure](/images/detr/transformer.png)
*Figure 3: Architecture of DETR's transformer, with positional encodings passed at every attention layer.*

---

## 3. Experiments

### 3.1 Experimental Setup

**Dataset**: COCO 2017 detection and panoptic segmentation (118k training images, 5k validation images). On average 7 instances per image, up to 63 in a single training image.

**Training Details**:

- **Optimizer**: AdamW (weight decay 10⁻⁴)
- **Learning rate**: Transformer 10⁻⁴, backbone 10⁻⁵ (backbone LR ~10x smaller is important for training stability)
- **Backbone**: ImageNet-pretrained ResNet-50/101 (frozen batchnorm layers)
- **Initialization**: Xavier initialization for transformer weights
- **Data augmentation**: Scale augmentation (shortest side 480-800, longest 1333), random crop (probability 0.5)
- **Dropout**: 0.1
- **Schedule**: 300 epochs for ablations (LR drop at 200), 500 epochs for Faster R-CNN comparison (LR drop at 400)
- **Hardware**: 16 V100 GPUs, 4 images/GPU (total batch size 64), ~3 days for 300 epochs
- **Loss weights**: λ_L1 = 5, λ_iou = 2, N = 100 decoder query slots
- **Gradient clipping**: maximal gradient norm 0.1

### 3.2 Comparison with Faster R-CNN

For a fair comparison, the Faster R-CNN baseline was strengthened with GIoU loss, the same random crop augmentation, and a long 9x training schedule (109 epochs).

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

**Key Observations**:
- DETR achieves a competitive 42 AP with the same number of parameters as Faster R-CNN
- **Significantly better on large objects** (AP_L +7.8): enabled by the transformer's non-local computations
- **Lower performance on small objects** (AP_S -5.5): expected to improve with future developments similar to how FPN improved Faster R-CNN
- DETR-DC5 increases feature resolution by 2x to improve small object performance (at 16x higher self-attention cost, ~2x overall)

### 3.3 Ablation Studies

#### Number of Encoder Layers

| #layers | GFLOPS/FPS | #params | AP | AP₅₀ | AP_S | AP_M | AP_L |
|---------|-----------|---------|-----|------|------|------|------|
| 0 | 76/28 | 33.4M | 36.7 | 57.4 | 16.8 | 39.6 | 54.2 |
| 3 | 81/25 | 37.4M | 40.1 | 60.6 | 18.5 | 43.8 | 58.6 |
| 6 | 86/23 | 41.3M | 40.6 | 61.6 | 19.9 | 44.3 | 60.2 |
| 12 | 95/20 | 49.2M | 41.6 | 62.1 | 19.8 | 44.9 | 61.9 |

Without encoder layers, overall AP drops by 3.9, with a more significant drop of 6.0 AP on large objects. The encoder is important for disentangling objects through global scene reasoning.

![Encoder self-attention visualization](/images/detr/cows_attn.png)
*Figure 4: Encoder self-attention for a set of reference points. The encoder is able to separate individual instances already.*

#### Number of Decoder Layers

Auxiliary losses are applied after each decoding layer. AP improves after every layer, with a **+8.2 AP improvement** from the first to the last layer.

![NMS analysis](/images/detr/nms_fig4.png)
*Figure 5: AP performance after each decoder layer. DETR does not need NMS by design. NMS lowers AP in the final layers by removing true positive predictions, but improves AP in the first decoder layers by removing duplicate predictions.*

In the first decoder layer, NMS helps because a single decoding layer cannot compute cross-correlations between output elements, making it prone to duplicate predictions. In subsequent layers, the self-attention mechanism inhibits duplicate predictions.

#### Importance of FFN

Removing FFN entirely reduces parameters from 41.3M to 28.7M but drops performance by 2.3 AP, confirming that FFNs are important for achieving good results.

#### Importance of Positional Encodings

| Encoder | Decoder | Output pos. enc. | AP | Δ |
|---------|---------|-------------------|-----|---|
| none | none | learned at input | 32.8 | -7.8 |
| sine at input | sine at input | learned at input | 39.2 | -1.4 |
| learned at attn. | learned at attn. | learned at attn. | 39.6 | -1.0 |
| none | sine at attn. | learned at attn. | 39.3 | -1.3 |
| sine at attn. | sine at attn. | learned at attn. | **40.6** | - |

Completely removing spatial positional encodings still yields 32.8 AP but loses 7.8 AP from baseline. Passing encodings directly in attention is better than adding them once at input.

#### Loss Ablations

| class | ℓ₁ | GIoU | AP | Δ |
|-------|-----|------|-----|---|
| ✓ | ✓ | | 35.8 | -4.8 |
| ✓ | | ✓ | 39.9 | -0.7 |
| ✓ | ✓ | ✓ | **40.6** | - |

GIoU loss on its own accounts for most of the model performance (losing only 0.7 AP to the baseline with combined losses). Using ℓ₁ without GIoU shows poor results. Combining both losses improves AP_M and AP_L.

### 3.4 Analysis

#### Decoder Output Slot Analysis

![Object query visualization](/images/detr/query_distr.png)
*Figure 6: Visualization of box predictions on all COCO 2017 val images for 20 out of 100 prediction slots. Each slot learns to specialize on certain areas and box sizes. Green=small boxes, red=large horizontal boxes, blue=large vertical boxes.*

Each query slot learns different specialization with several operating modes focusing on different areas and box sizes. Nearly all slots have a mode for predicting image-wide boxes.

#### Out-of-Distribution Generalization

Even though no training image has more than 13 giraffes, DETR successfully detects all 24 giraffes in a synthetic image. This confirms that there is no strong class-specialization in each object query.

![Out-of-distribution generalization](/images/detr/giraffe_collage2.jpg)
*Figure 7: Out of distribution generalization for rare classes. Even though no image in the training set has more than 13 giraffes, DETR has no difficulty generalizing to 24 and more instances of the same class.*

### 3.5 DETR for Panoptic Segmentation

DETR can be naturally extended by adding a mask head on top of the decoder outputs for panoptic segmentation, treating stuff and thing classes in a unified way.

![Panoptic head architecture](/images/detr/panoptic2.png)
*Figure 8: Illustration of the panoptic head. A binary mask is generated in parallel for each detected object, then the masks are merged using pixel-wise argmax.*

The mask head takes the output of transformer decoder for each object and computes multi-head attention scores over the encoder output, generating M attention heatmaps per object. An FPN-like architecture increases the resolution. Masks are supervised with DICE/F-1 loss and Focal loss.

| Model | Backbone | PQ | SQ | RQ | PQ^th | PQ^st | AP |
|-------|----------|-----|-----|-----|-------|-------|-----|
| PanopticFPN++ | R50 | 42.4 | 79.3 | 51.6 | 49.2 | 32.3 | 37.7 |
| UPSnet | R50 | 42.5 | 78.0 | 52.5 | 48.6 | 33.4 | 34.3 |
| PanopticFPN++ | R101 | 44.1 | 79.5 | 53.3 | **51.0** | 33.6 | **39.7** |
| **DETR** | R50 | 43.4 | 79.3 | 53.8 | 48.2 | 36.3 | 31.1 |
| **DETR-DC5** | R50 | 44.6 | 79.8 | 55.0 | 49.4 | **37.3** | 31.9 |
| **DETR-R101** | R101 | **45.1** | **79.9** | **55.5** | 50.5 | 37.0 | 33.0 |

DETR outperforms published results on COCO val 2017, and is **especially dominant on stuff classes** (PQ^st). The global reasoning allowed by encoder attention is hypothesized to be the key element for this result.

---

## 4. Supplementary: PyTorch Inference Code

Demonstrating the simplicity of the approach, the full DETR inference code in PyTorch is approximately 40 lines:

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

## 5. Conclusion and Personal Thoughts

### Contributions
1. **Reformulates object detection as a direct set prediction problem**: eliminates hand-designed components such as NMS and anchor generation
2. **Bipartite matching loss + Transformer**: a simple yet powerful end-to-end detection framework
3. **Versatility**: easily extensible to panoptic segmentation with competitive results
4. **Implementation simplicity**: implementable in fewer than 50 lines of code with no specialized libraries

### Limitations
1. **Weaker small object detection** (AP_S -5.5 compared to Faster R-CNN)
2. **Long training schedule**: requires 300-500 epochs (Faster R-CNN needs ~36 epochs)
3. **Computational cost of encoder self-attention**: grows quadratically with resolution
4. **N=100 query slot limit**: cannot detect more than 100 objects per image

### Impact on Follow-up Research
DETR has become the foundation for numerous follow-up works including Deformable DETR, Conditional DETR, DAB-DETR, DN-DETR, and DINO, establishing the Transformer-based detection paradigm as a dominant approach in object detection research.
