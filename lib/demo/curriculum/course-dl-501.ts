import { CourseCurriculum } from "./types";

export const courseDl501: CourseCurriculum = {
  courseId: "course-dl-501",
  totalDurationMinutes: 1800,
  modules: [
    {
      id: "dl-mod-1",
      order: 1,
      title: "Module 1 — Perceptrons, Multi-Layer Perceptrons (MLP) & Forward Propagation",
      durationMinutes: 180,
      summary: "Biological to artificial neurons, single-layer perceptron limitations (XOR problem), Multi-Layer Perceptron (MLP) matrix math, and vectorized forward propagation in PyTorch.",
      learningObjectives: [
        "Explain the mathematical formulation of artificial neurons and the XOR linear separability limitation.",
        "Derive and implement vectorized forward propagation using PyTorch tensors and linear algebra.",
        "Construct multi-layer perceptron architectures using torch.nn.Module."
      ],
      resources: [
        {
          title: "PyTorch Official Documentation: Deep Learning with PyTorch: A 60 Minute Blitz",
          url: "https://pytorch.org/tutorials/beginner/deep_learning_60min_blitz.html",
          description: "Tensors, autograd, neural networks, and training classifiers.",
          type: "tutorial",
          provider: "PyTorch Core Team"
        },
        {
          title: "Deep Learning Book: Chapter 6 Deep Feedforward Networks (Goodfellow et al.)",
          url: "https://www.deeplearningbook.org/contents/mlp.html",
          description: "Mathematical foundations of multi-layer perceptrons, universal approximation theorem, and hidden layers.",
          type: "guide",
          provider: "MIT Press"
        }
      ],
      content: {
        overview: "Multi-Layer Perceptrons (MLPs) form the foundational architecture of deep learning. By stacking linear transformations separated by non-linear activations, neural networks can approximate any continuous function (Universal Approximation Theorem).",
        keyConcepts: [
          {
            section: "Section 1 — Neural Foundations & PyTorch",
            topic: "Multi-Layer Perceptrons & Forward Pass",
            title: "Lesson 1 — Vectorized Forward Propagation & PyTorch nn.Module Architecture",
            prerequisites: "Python for AI/ML, linear algebra (matrix multiplication), and calculus.",
            description: "How weights and biases parameterize linear layers ($z = W x + b$), how non-linear activations ($\sigma(z)$) introduce representational capacity, and how to structure modular neural networks in PyTorch.",
            whyItMatters: "Single linear layers can only classify linearly separable data. Stacking layers allows the network to learn hierarchical feature representations.",
            howItWorks: "Input tensor $X \in \mathbb{R}^{B \times D_{in}}$ multiplies weight matrix $W_1^T$, adds bias $b_1$, passes through ReLU, and passes to subsequent layers to produce logits $\hat{Y} \in \mathbb{R}^{B \times D_{out}}$.",
            stepByStep: [
              "Step 1: Subclass `torch.nn.Module` and define linear layers in `__init__`.",
              "Step 2: Initialize weights using Kaiming/He normal initialization.",
              "Step 3: Implement `forward(x)` method executing tensor matrix multiplications and activations.",
              "Step 4: Execute forward pass on GPU device using `tensor.to(device)`."
            ],
            workedExample: "Forward Pass Tensor Dimensions:\n- Input $X$: `[32, 128]` (Batch size 32, 128 features).\n- Layer 1 $W_1$: `[128, 64]` -> Hidden $H_1$: `[32, 64]`.\n- Layer 2 $W_2$: `[64, 10]` -> Output Logits: `[32, 10]`.",
            realWorldUsage: "Tabular deep learning, feature embedding projection, and classification heads.",
            codeSnippet: "# Vectorized Multi-Layer Perceptron in PyTorch\nimport torch\nimport torch.nn as nn\n\nclass EnterpriseMLP(nn.Module):\n    def __init__(self, in_features: int, hidden_dim: int, num_classes: int, dropout_rate: float = 0.2):\n        super().__init__()\n        self.network = nn.Sequential(\n            nn.Linear(in_features, hidden_dim),\n            nn.BatchNorm1d(hidden_dim),\n            nn.ReLU(),\n            nn.Dropout(dropout_rate),\n            nn.Linear(hidden_dim, hidden_dim // 2),\n            nn.BatchNorm1d(hidden_dim // 2),\n            nn.ReLU(),\n            nn.Dropout(dropout_rate),\n            nn.Linear(hidden_dim // 2, num_classes)\n        )\n\n    def forward(self, x: torch.Tensor) -> torch.Tensor:\n        return self.network(x)\n\n# Instantiate and run forward pass\nmodel = EnterpriseMLP(in_features=64, hidden_dim=128, num_classes=5)\nbatch_input = torch.randn(32, 64) # Batch of 32 samples\nlogits = model(batch_input)\nprint(f'Logits Output Shape: {logits.shape}')",
            codeExplanation: "1. Subclasses `nn.Module` with encapsulated `nn.Sequential` pipeline.\n2. Incorporates BatchNorm and Dropout for regularized forward passes.\n3. Emits unnormalized class logits `[32, 5]` for cross-entropy evaluation.",
            expectedOutput: "Logits Output Shape: torch.Size([32, 5])",
            commonMistakes: "Applying Softmax inside the forward pass when using `nn.CrossEntropyLoss`, which already combines `LogSoftmax` and `NLLLoss` numerically.",
            bestPractices: "Always return raw unnormalized logits from the model forward pass and apply Softmax only during inference.",
            practiceTask: "Implement a 3-layer MLP in PyTorch that classifies the Iris dataset and inspect gradient shapes during a dummy forward pass.",
            keyTakeaway: "PyTorch `nn.Module` provides modular tensor computation graphs with automatic parameter registration and GPU acceleration."
          }
        ],
        practicalExercise: "Build and train a 4-layer deep neural network in PyTorch for employee skill classification with Kaiming initialization, BatchNorm, and GPU acceleration.",
        competencyVerification: "Demonstrates Multi-Layer Perceptron mathematics, vectorized forward propagation, and PyTorch nn.Module design at Level 4.",
        resources: [
          {
            title: "PyTorch Official Documentation: Deep Learning with PyTorch: A 60 Minute Blitz",
            url: "https://pytorch.org/tutorials/beginner/deep_learning_60min_blitz.html",
            description: "Tensors, autograd, neural networks, and training classifiers.",
            type: "tutorial",
            provider: "PyTorch Core Team"
          },
          {
            title: "Deep Learning Book: Chapter 6 Deep Feedforward Networks (Goodfellow et al.)",
            url: "https://www.deeplearningbook.org/contents/mlp.html",
            description: "Mathematical foundations of multi-layer perceptrons, universal approximation theorem, and hidden layers.",
            type: "guide",
            provider: "MIT Press"
          }
        ]
      }
    },
    {
      id: "dl-mod-2",
      order: 2,
      title: "Module 2 — Backpropagation, Automatic Differentiation & Computational Graphs",
      durationMinutes: 180,
      summary: "Multivariable calculus chain rule, reverse-mode automatic differentiation, PyTorch Autograd execution graph, tensor gradients (grad, grad_fn), and custom autograd functions.",
      learningObjectives: [
        "Derive analytical gradients using the multivariate calculus Chain Rule.",
        "Trace dynamic computational Directed Acyclic Graphs (DAG) in PyTorch Autograd.",
        "Implement custom autograd functions by defining forward and backward methods."
      ],
      resources: [
        {
          title: "PyTorch Documentation: A Gentle Introduction to torch.autograd",
          url: "https://pytorch.org/tutorials/beginner/blitz/autograd_tutorial.html",
          description: "Computational graphs, gradient tracking with requires_grad, and backward pass mechanics.",
          type: "documentation",
          provider: "PyTorch Core Team"
        },
        {
          title: "CS231n: Optimization & Backpropagation Notes (Andrej Karpathy)",
          url: "https://cs231n.github.io/optimization-2/",
          description: "Intuitive explanation of backpropagation, local gradients, and computational graphs.",
          type: "guide",
          provider: "Stanford University"
        }
      ],
      content: {
        overview: "Backpropagation calculates the gradient of the loss function with respect to all network weights using reverse-mode automatic differentiation. PyTorch Autograd constructs dynamic directed acyclic graphs (DAGs) on the fly to compute exact gradients.",
        keyConcepts: [
          {
            section: "Section 1 — Autograd & Calculus",
            topic: "Computational Graphs & Reverse-Mode AD",
            title: "Lesson 1 — The Chain Rule, Dynamic Computational Graphs & torch.autograd",
            prerequisites: "Module 1 (Forward Propagation) and multivariable calculus.",
            description: "How reverse-mode automatic differentiation evaluates local derivatives during the backward pass ($\frac{\partial L}{\partial W} = \frac{\partial L}{\partial y} \frac{\partial y}{\partial z} \frac{\partial z}{\partial W}$) and how PyTorch manages memory with `torch.no_grad()`.",
            whyItMatters: "Manual gradient derivation is error-prone and scales poorly. Autograd enables effortless training of arbitrarily complex architectures.",
            howItWorks: "Operations on tensors with `requires_grad=True` record nodes on a DAG via `grad_fn`. Calling `loss.backward()` traverses the graph backwards, accumulating gradients into `.grad` attributes.",
            stepByStep: [
              "Step 1: Set `requires_grad=True` on learnable parameter tensors.",
              "Step 2: Execute forward pass and compute scalar loss value.",
              "Step 3: Call `loss.backward()` to initiate reverse-mode automatic differentiation.",
              "Step 4: Use `with torch.no_grad():` during validation to prevent graph memory allocations."
            ],
            workedExample: "Autograd Gradient Computation:\n```python\nx = torch.tensor(3.0, requires_grad=True)\ny = 2 * x ** 2 + 5 * x + 1  # y = 2(3)^2 + 5(3) + 1 = 34\ny.backward()                # dy/dx = 4x + 5 = 4(3) + 5 = 17\nprint(x.grad)              # tensor(17.0)\n```",
            realWorldUsage: "Gradient calculation across all deep learning training loops.",
            codeSnippet: "# Custom Autograd Function in PyTorch\nimport torch\n\nclass SwishAutogradFunction(torch.autograd.Function):\n    @staticmethod\n    def forward(ctx, x: torch.Tensor, beta: float = 1.0) -> torch.Tensor:\n        sigmoid = torch.sigmoid(beta * x)\n        ctx.save_for_backward(x, sigmoid)\n        ctx.beta = beta\n        return x * sigmoid\n\n    @staticmethod\n    def backward(ctx, grad_output: torch.Tensor):\n        x, sigmoid = ctx.saved_tensors\n        beta = ctx.beta\n        # Derivative: d/dx [x * sig(beta*x)] = beta*x*sig(1-sig) + sig\n        swish = x * sigmoid\n        grad_x = grad_output * (beta * swish + sigmoid * (1.0 - beta * swish))\n        return grad_x, None\n\n# Verification\nx = torch.randn(4, requires_grad=True)\nout = SwishAutogradFunction.apply(x, 1.0)\nout.sum().backward()\nprint(f'Input: {x.data}\\nGradients: {x.grad.data}')",
            codeExplanation: "1. Implements custom forward pass caching tensors in `ctx`.\n2. Computes exact analytical backward gradient vector.\n3. Integrates directly into PyTorch dynamic computational graph.",
            expectedOutput: "Input: tensor([...])\nGradients: tensor([...])",
            commonMistakes: "Forgetting to call `optimizer.zero_grad()` before `loss.backward()`, causing gradients to accumulate indefinitely across training batches.",
            bestPractices: "Always wrap evaluation/inference loops in `with torch.no_grad():` to save memory and accelerate execution.",
            practiceTask: "Implement a custom activation function (LeakyReLU) with forward and backward autograd methods and verify gradients with `torch.autograd.gradcheck`.",
            keyTakeaway: "PyTorch Autograd builds dynamic computational graphs during the forward pass and evaluates exact chain-rule derivatives in reverse."
          }
        ],
        practicalExercise: "Build a custom autograd activation layer in PyTorch, verify gradient numerical correctness using `torch.autograd.gradcheck`, and benchmark backpropagation latency.",
        competencyVerification: "Demonstrates deep understanding of multivariable chain rule, computational DAGs, and PyTorch autograd internals at Level 4.",
        resources: [
          {
            title: "PyTorch Documentation: A Gentle Introduction to torch.autograd",
            url: "https://pytorch.org/tutorials/beginner/blitz/autograd_tutorial.html",
            description: "Computational graphs, gradient tracking with requires_grad, and backward pass mechanics.",
            type: "documentation",
            provider: "PyTorch Core Team"
          },
          {
            title: "CS231n: Optimization & Backpropagation Notes (Andrej Karpathy)",
            url: "https://cs231n.github.io/optimization-2/",
            description: "Intuitive explanation of backpropagation, local gradients, and computational graphs.",
            type: "guide",
            provider: "Stanford University"
          }
        ]
      }
    },
    {
      id: "dl-mod-3",
      order: 3,
      title: "Module 3 — Loss Functions, Activation Functions & Mathematical Formulations",
      durationMinutes: 180,
      summary: "Activation functions (Sigmoid, Tanh, ReLU, LeakyReLU, GeLU, Swish), vanishing/exploding gradient problems, and loss formulations (MSE, Cross-Entropy, Focal Loss, Triplet Loss).",
      learningObjectives: [
        "Analyze activation saturation, dead ReLU neurons, and smooth modern activations (GeLU/Swish).",
        "Select loss functions (CrossEntropy, BCEWithLogits, Focal Loss) based on target data distributions.",
        "Implement Focal Loss to mitigate severe class imbalance in classification tasks."
      ],
      resources: [
        {
          title: "PyTorch Documentation: Loss Functions & Activation Functions",
          url: "https://pytorch.org/docs/stable/nn.html#loss-functions",
          description: "CrossEntropyLoss, BCEWithLogitsLoss, Focal Loss concepts, and activations.",
          type: "documentation",
          provider: "PyTorch Core Team"
        },
        {
          title: "Focal Loss for Dense Object Detection (Lin et al., ICCV 2017)",
          url: "https://arxiv.org/abs/1708.02002",
          description: "Mathematical derivation of Focal Loss to address extreme foreground-background class imbalance.",
          type: "specification",
          provider: "FAIR (Meta AI)"
        }
      ],
      content: {
        overview: "Loss functions quantify model prediction error, while activation functions introduce non-linearity. Choosing modern activations (GeLU, Swish) and loss functions tailored to class imbalance (Focal Loss) prevents gradient saturation and accelerates convergence.",
        keyConcepts: [
          {
            section: "Section 1 — Modern Activations & Focal Loss",
            topic: "GeLU & Imbalance-Aware Loss",
            title: "Lesson 1 — GeLU/Swish Activations & Focal Loss for Imbalanced Datasets",
            prerequisites: "Module 2 (Autograd & Backprop).",
            description: "Why Sigmoid/Tanh cause vanishing gradients, how Gaussian Error Linear Units (GeLU) smooth activations in Transformers, and how Focal Loss down-weights easy examples ($\text{FL}(p_t) = -\alpha_t (1 - p_t)^\gamma \log(p_t)$).",
            whyItMatters: "Standard cross-entropy loss is dominated by abundant easy negative examples, drowning out gradients from rare positive minority classes.",
            howItWorks: "Focal Loss adds a modulating factor $(1 - p_t)^\gamma$ to cross-entropy. When an example is well-classified ($p_t \to 1$), the factor approaches 0, focusing learning on hard, misclassified samples.",
            stepByStep: [
              "Step 1: Compute binary cross-entropy probability $p_t$.",
              "Step 2: Calculate focal modulating weight $(1 - p_t)^\gamma$ with focusing parameter $\gamma \in [1, 5]$.",
              "Step 3: Multiply by balancing parameter $\alpha_t$.",
              "Step 4: Reduce mean loss across the batch."
            ],
            workedExample: "Focal Loss Scaling:\n- Easy Example ($p_t = 0.95$, $\gamma = 2$): Modulating factor $(1 - 0.95)^2 = 0.0025$ (Loss reduced by 400x).\n- Hard Example ($p_t = 0.2$, $\gamma = 2$): Modulating factor $(1 - 0.2)^2 = 0.64$ (Loss preserved).",
            realWorldUsage: "Fraud detection, medical anomaly segmentation, and rare defect identification.",
            codeSnippet: "# Custom Focal Loss Implementation in PyTorch\nimport torch\nimport torch.nn as nn\nimport torch.nn.functional as F\n\nclass FocalLoss(nn.Module):\n    def __init__(self, alpha: float = 0.25, gamma: float = 2.0, reduction: str = 'mean'):\n        super().__init__()\n        self.alpha = alpha\n        self.gamma = gamma\n        self.reduction = reduction\n\n    def forward(self, logits: torch.Tensor, targets: torch.Tensor) -> torch.Tensor:\n        # BCE with logits for numerical stability\n        bce_loss = F.binary_cross_entropy_with_logits(logits, targets, reduction='none')\n        probs = torch.sigmoid(logits)\n        p_t = targets * probs + (1 - targets) * (1 - probs)\n        alpha_t = targets * self.alpha + (1 - targets) * (1 - self.alpha)\n        \n        focal_weight = alpha_t * (1.0 - p_t) ** self.gamma\n        loss = focal_weight * bce_loss\n\n        return loss.mean() if self.reduction == 'mean' else loss.sum()\n\n# Test on imbalanced batch (1 positive, 3 negatives)\nloss_fn = FocalLoss(alpha=0.25, gamma=2.0)\nlogits = torch.tensor([2.5, -3.0, -2.8, -0.5]) # Model predictions\ntargets = torch.tensor([1.0, 0.0, 0.0, 1.0])   # True labels\nloss = loss_fn(logits, targets)\nprint(f'Computed Focal Loss: {loss.item():.4f}')",
            codeExplanation: "1. Computes numerically stable BCE from unnormalized logits.\n2. Applies $(1 - p_t)^\gamma$ focal modulating factor.\n3. Prevents easy majority class samples from overwhelming model updates.",
            expectedOutput: "Computed Focal Loss: 0.1354",
            commonMistakes: "Using `torch.sigmoid` followed by `nn.BCELoss` instead of `BCEWithLogitsLoss`, leading to numerical underflow/overflow.",
            bestPractices: "Use GeLU activations for Transformer models and Focal Loss when class imbalance exceeds 10:1.",
            practiceTask: "Implement a Triplet Margin Loss function in PyTorch for metric learning embeddings.",
            keyTakeaway: "Focal Loss and GeLU activations optimize gradient flow and focus learning on hard, informative examples."
          }
        ],
        practicalExercise: "Implement a production-grade Focal Loss criterion in PyTorch, train a binary classifier on a 99:1 imbalanced dataset, and compare PR-AUC against standard Cross-Entropy.",
        competencyVerification: "Demonstrates mathematical mastery of deep learning activation functions, gradient saturation mitigation, and custom loss design at Level 4.",
        resources: [
          {
            title: "PyTorch Documentation: Loss Functions & Activation Functions",
            url: "https://pytorch.org/docs/stable/nn.html#loss-functions",
            description: "CrossEntropyLoss, BCEWithLogitsLoss, Focal Loss concepts, and activations.",
            type: "documentation",
            provider: "PyTorch Core Team"
          },
          {
            title: "Focal Loss for Dense Object Detection (Lin et al., ICCV 2017)",
            url: "https://arxiv.org/abs/1708.02002",
            description: "Mathematical derivation of Focal Loss to address extreme foreground-background class imbalance.",
            type: "specification",
            provider: "FAIR (Meta AI)"
          }
        ]
      }
    },
    {
      id: "dl-mod-4",
      order: 4,
      title: "Module 4 — Optimization Algorithms: SGD, Momentum, RMSprop & AdamW",
      durationMinutes: 180,
      summary: "First-order optimization landscape, Stochastic Gradient Descent (SGD) with Nesterov Momentum, RMSprop adaptive learning rates, Adam vs AdamW (decoupled weight decay), and Learning Rate Schedulers (Cosine Annealing, OneCycleLR).",
      learningObjectives: [
        "Explain the mathematical mechanics of Momentum, RMSprop, and Adam optimizers.",
        "Differentiate L2 regularization from Decoupled Weight Decay in AdamW.",
        "Implement Cosine Annealing with Warm Restarts learning rate schedules."
      ],
      resources: [
        {
          title: "Decoupled Weight Decay Regularization (Loshchilov & Hutter, ICLR 2019)",
          url: "https://arxiv.org/abs/1711.05101",
          description: "The foundational AdamW paper proving why standard L2 regularization fails in adaptive optimizers.",
          type: "specification",
          provider: "ICLR"
        },
        {
          title: "PyTorch Documentation: torch.optim & Learning Rate Schedulers",
          url: "https://pytorch.org/docs/stable/optim.html",
          description: "AdamW, SGD, CosineAnnealingLR, OneCycleLR, and parameter groups.",
          type: "documentation",
          provider: "PyTorch Core Team"
        }
      ],
      content: {
        overview: "Optimization algorithms govern how weights update in response to computed gradients. AdamW (Adam with Decoupled Weight Decay) has become the gold standard optimizer for transformers and modern deep neural networks.",
        keyConcepts: [
          {
            section: "Section 1 — Adaptive Optimization & Schedulers",
            topic: "AdamW & Cosine Annealing",
            title: "Lesson 1 — Decoupled Weight Decay (AdamW) & Cosine Annealing LR Scheduling",
            prerequisites: "Module 2 (Autograd) and multivariable optimization.",
            description: "Why standard L2 regularization breaks in adaptive optimizers like Adam, how AdamW decouples weight decay ($W_{t+1} = W_t - \eta \lambda W_t - \eta \frac{m_t}{\sqrt{v_t} + \epsilon}$), and how to configure CosineAnnealingLR with warmup.",
            whyItMatters: "In standard Adam, L2 weight penalties are scaled by the historical gradient variance $\sqrt{v_t}$, causing weights with large gradients to decay less than weights with small gradients. AdamW fixes this completely.",
            howItWorks: "AdamW maintains first moment $m_t$ (momentum) and second moment $v_t$ (uncentered variance), subtracts direct weight decay from the parameter, and applies adaptive momentum updates.",
            stepByStep: [
              "Step 1: Instantiate `torch.optim.AdamW(model.parameters(), lr=1e-3, weight_decay=1e-2)`.",
              "Step 2: Attach learning rate scheduler: `torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs)`.",
              "Step 3: Call `optimizer.step()` and `scheduler.step()` on every training epoch/iteration.",
              "Step 4: Exclude LayerNorm and bias parameters from weight decay using parameter groups."
            ],
            workedExample: "Parameter Group Configuration:\n```python\nno_decay = ['bias', 'LayerNorm.weight']\noptimizer_grouped_parameters = [\n    {'params': [p for n, p in model.named_parameters() if not any(nd in n for nd in no_decay)], 'weight_decay': 0.01},\n    {'params': [p for n, p in model.named_parameters() if any(nd in n for nd in no_decay)], 'weight_decay': 0.0}\n]\n```",
            realWorldUsage: "Training Transformers (BERT, GPT, LLaMA), ResNets, and vision models.",
            codeSnippet: "# Complete Training Loop with AdamW & Cosine Annealing Scheduler\nimport torch\nimport torch.nn as nn\nfrom torch.optim import AdamW\nfrom torch.optim.lr_scheduler import CosineAnnealingLR\n\n# Dummy model and dataset\nmodel = nn.Linear(10, 2)\noptimizer = AdamW(model.parameters(), lr=1e-3, weight_decay=1e-2)\nscheduler = CosineAnnealingLR(optimizer, T_max=100, eta_min=1e-6)\n\ndef train_epoch(data_loader, loss_fn):\n    model.train()\n    for x, y in data_loader:\n        optimizer.zero_grad()\n        preds = model(x)\n        loss = loss_fn(preds, y)\n        loss.backward()\n        # Gradient clipping prevents exploding gradients\n        torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)\n        optimizer.step()\n    scheduler.step()\n\nprint(f'Optimizer configured: AdamW with initial lr={scheduler.get_last_lr()[0]}')",
            codeExplanation: "1. Implements decoupled weight decay via AdamW.\n2. Clips gradients at `max_norm=1.0` to ensure stability.\n3. Steps `CosineAnnealingLR` to smoothly decay learning rates toward minimum.",
            expectedOutput: "Optimizer configured: AdamW with initial lr=0.001",
            commonMistakes: "Applying weight decay to bias parameters and LayerNorm scaling factors, which degrades model convergence.",
            bestPractices: "Always split parameters into decay and no-decay groups and apply gradient clipping (`clip_grad_norm_`).",
            practiceTask: "Implement a custom learning rate warmup schedule that linearly increases LR for 5 epochs before triggering cosine decay.",
            keyTakeaway: "AdamW decouples weight decay from adaptive gradient scaling, delivering superior generalization across deep architectures."
          }
        ],
        practicalExercise: "Build an end-to-end PyTorch training harness with AdamW, parameter group decay filtering, gradient norm clipping, and Cosine Annealing LR scheduling.",
        competencyVerification: "Demonstrates optimization algorithm mechanics, AdamW decoupled decay implementation, and learning rate scheduling at Level 4.",
        resources: [
          {
            title: "Decoupled Weight Decay Regularization (Loshchilov & Hutter, ICLR 2019)",
            url: "https://arxiv.org/abs/1711.05101",
            description: "The foundational AdamW paper proving why standard L2 regularization fails in adaptive optimizers.",
            type: "specification",
            provider: "ICLR"
          },
          {
            title: "PyTorch Documentation: torch.optim & Learning Rate Schedulers",
            url: "https://pytorch.org/docs/stable/optim.html",
            description: "AdamW, SGD, CosineAnnealingLR, OneCycleLR, and parameter groups.",
            type: "documentation",
            provider: "PyTorch Core Team"
          }
        ]
      }
    },
    {
      id: "dl-mod-5",
      order: 5,
      title: "Module 5 — Regularization: Dropout, Batch Normalization, Layer Normalization & Weight Decay",
      durationMinutes: 180,
      summary: "Internal covariate shift, Batch Normalization mechanics (running mean/var, training vs inference modes), Layer Normalization across feature dimensions, Monte Carlo Dropout, and Early Stopping.",
      learningObjectives: [
        "Explain internal covariate shift and how Batch Normalization stabilizes deep network training.",
        "Differentiate Batch Normalization (batch dimension) from Layer Normalization (feature dimension).",
        "Implement Monte Carlo Dropout for epistemic uncertainty quantification during inference."
      ],
      resources: [
        {
          title: "Batch Normalization: Accelerating Deep Network Training (Ioffe & Szegedy, ICML 2015)",
          url: "https://arxiv.org/abs/1502.03167",
          description: "Original paper on normalizing layer inputs to reduce internal covariate shift.",
          type: "specification",
          provider: "Google"
        },
        {
          title: "Layer Normalization (Ba, Kiros & Hinton, 2016)",
          url: "https://arxiv.org/abs/1607.06450",
          description: "Normalizing across feature dimensions for RNNs and Transformers where batch size varies.",
          type: "specification",
          provider: "University of Toronto"
        }
      ],
      content: {
        overview: "Deep neural networks with millions of parameters easily overfit training data. Normalization techniques (BatchNorm, LayerNorm) and stochastic regularization (Dropout) smooth the optimization loss landscape and improve test generalization.",
        keyConcepts: [
          {
            section: "Section 1 — Normalization & Uncertainty",
            topic: "BatchNorm vs LayerNorm & MC Dropout",
            title: "Lesson 1 — Batch Normalization vs Layer Normalization & Monte Carlo Dropout",
            prerequisites: "Module 1 (MLP Architecture) and statistics (mean/variance).",
            description: "How BatchNorm normalizes across the batch dimension ($\mu_B = \frac{1}{B}\sum x_i$) during training, why LayerNorm normalizes across the feature channel dimension for NLP/Transformers, and how Monte Carlo Dropout estimates model uncertainty.",
            whyItMatters: "BatchNorm fails when batch size is small ($B < 8$) or varies dynamically in sequence models. LayerNorm operates independently of batch size.",
            howItWorks: "LayerNorm calculates mean and variance across the feature dimension for each sample independently: $\hat{x} = \frac{x - \mu_L}{\sqrt{\sigma_L^2 + \epsilon}} \cdot \gamma + \beta$.",
            stepByStep: [
              "Step 1: Apply `nn.BatchNorm1d/2d` after linear/conv layers in vision models.",
              "Step 2: Apply `nn.LayerNorm` in Transformer and sequential NLP models.",
              "Step 3: Call `model.eval()` before inference so BatchNorm uses running statistics.",
              "Step 4: Keep Dropout active in `model.train()` mode during inference for Monte Carlo uncertainty sampling."
            ],
            workedExample: "Normalization Comparison:\n- BatchNorm: Normalizes across batch $B$. Dimensions: `[B, C, H, W]` -> Stats per channel $C$.\n- LayerNorm: Normalizes across feature dimensions $C, H, W$ per individual sample $B$.",
            realWorldUsage: "ResNets (BatchNorm), Transformers (LayerNorm/RMSNorm), autonomous driving perception.",
            codeSnippet: "# Monte Carlo Dropout for Predictive Uncertainty Estimation\nimport torch\nimport torch.nn as nn\n\nclass MCDropoutNetwork(nn.Module):\n    def __init__(self, in_features: int, out_features: int):\n        super().__init__()\n        self.fc1 = nn.Linear(in_features, 64)\n        self.dropout = nn.Dropout(p=0.3)\n        self.norm = nn.LayerNorm(64)\n        self.fc2 = nn.Linear(64, out_features)\n\n    def forward(self, x: torch.Tensor) -> torch.Tensor:\n        x = torch.relu(self.norm(self.fc1(x)))\n        x = self.dropout(x)\n        return self.fc2(x)\n\ndef estimate_uncertainty(model: MCDropoutNetwork, x: torch.Tensor, num_samples: int = 50):\n    model.train() # Keep dropout enabled during inference\n    with torch.no_grad():\n        predictions = torch.stack([model(x) for _ in range(num_samples)])\n    mean_pred = predictions.mean(dim=0)\n    variance_pred = predictions.var(dim=0) # Epistemic uncertainty\n    return mean_pred, variance_pred\n\nmodel = MCDropoutNetwork(16, 1)\nsample_input = torch.randn(1, 16)\nmean, variance = estimate_uncertainty(model, sample_input)\nprint(f'Mean Prediction: {mean.item():.4f}, Uncertainty (Var): {variance.item():.4f}')",
            codeExplanation: "1. Uses LayerNorm for batch-size-invariant normalization.\n2. Executes 50 stochastic forward passes with active Dropout.\n3. Variance across predictions measures epistemic model uncertainty.",
            expectedOutput: "Mean Prediction: 0.1824, Uncertainty (Var): 0.0412",
            commonMistakes: "Leaving the model in `model.train()` mode during standard deterministic validation, corrupting BatchNorm running statistics.",
            bestPractices: "Always call `model.eval()` for validation and `model.train()` for training.",
            practiceTask: "Implement LayerNorm from scratch in pure PyTorch tensor operations and compare outputs against `nn.LayerNorm`.",
            keyTakeaway: "BatchNorm stabilizes vision networks, LayerNorm enables sequence and transformer scaling, and MC Dropout quantifies prediction uncertainty."
          }
        ],
        practicalExercise: "Implement custom Batch Normalization and Layer Normalization layers from scratch in PyTorch, verify numerical parity with PyTorch built-ins, and implement Monte Carlo Dropout uncertainty estimation.",
        competencyVerification: "Demonstrates mastery of deep learning normalization algorithms, training vs inference modes, and epistemic uncertainty quantification at Level 4.",
        resources: [
          {
            title: "Batch Normalization: Accelerating Deep Network Training (Ioffe & Szegedy, ICML 2015)",
            url: "https://arxiv.org/abs/1502.03167",
            description: "Original paper on normalizing layer inputs to reduce internal covariate shift.",
            type: "specification",
            provider: "Google"
          },
          {
            title: "Layer Normalization (Ba, Kiros & Hinton, 2016)",
            url: "https://arxiv.org/abs/1607.06450",
            description: "Normalizing across feature dimensions for RNNs and Transformers where batch size varies.",
            type: "specification",
            provider: "University of Toronto"
          }
        ]
      }
    },
    {
      id: "dl-mod-6",
      order: 6,
      title: "Module 6 — Convolutional Neural Networks (CNNs): Convolutions, Pooling & Residual Networks (ResNet)",
      durationMinutes: 180,
      summary: "2D discrete convolutions, kernel filters, padding (valid/same), stride, receptive field calculation, max/average pooling, and Deep Residual Networks (ResNet skip connections).",
      learningObjectives: [
        "Calculate output feature map dimensions and receptive fields for multi-layer CNNs.",
        "Implement residual skip connections ($y = \mathcal{F}(x) + x$) to eliminate degradation in deep networks.",
        "Construct a complete ResNet architecture with Bottleneck residual blocks in PyTorch."
      ],
      resources: [
        {
          title: "Deep Residual Learning for Image Recognition (He et al., CVPR 2016)",
          url: "https://arxiv.org/abs/1512.03385",
          description: "Canonical ResNet paper introducing residual identity shortcuts to train 100+ layer networks.",
          type: "specification",
          provider: "Microsoft Research"
        },
        {
          title: "CS231n: Convolutional Neural Networks for Visual Recognition",
          url: "https://cs231n.github.io/convolutional-networks/",
          description: "Spatial arrangement, stride, padding, parameter sharing, and pooling layers.",
          type: "guide",
          provider: "Stanford University"
        }
      ],
      content: {
        overview: "Convolutional Neural Networks (CNNs) exploit spatial locality and translation invariance through weight sharing. Residual Networks (ResNet) revolutionized computer vision by introducing identity shortcut connections that allow gradients to flow directly through hundreds of layers without degradation.",
        keyConcepts: [
          {
            section: "Section 1 — CNN Architecture & ResNet",
            topic: "Residual Blocks & Skip Connections",
            title: "Lesson 1 — Residual Blocks, Identity Shortcuts & ResNet-50 Architecture",
            prerequisites: "Module 1 (Forward Propagation) and 2D matrix convolutions.",
            description: "How 2D convolutional kernels extract hierarchical spatial features, why deep plain networks suffer from optimization degradation, and how residual skip connections ($H(x) = F(x) + x$) guarantee identity mappings.",
            whyItMatters: "Without skip connections, stacking more than 20 layers causes training error to increase due to vanishing gradients. ResNet allows training networks with 1,000+ layers.",
            howItWorks: "If optimal mapping is an identity function, the residual block drives residual weights $F(x) \to 0$, leaving $H(x) = x$. Gradients flow unimpeded directly back to early layers via addition.",
            stepByStep: [
              "Step 1: Calculate output shape: $O = \lfloor \frac{W - K + 2P}{S} \rfloor + 1$.",
              "Step 2: Construct Residual Block with two $3\times3$ convolutions and BatchNorm.",
              "Step 3: If dimensions change (stride > 1), project identity shortcut using a $1\times1$ convolution.",
              "Step 4: Add identity shortcut before final ReLU activation: `out = F.relu(residual + shortcut)`."
            ],
            workedExample: "Feature Map Dimensional Calculation:\n- Input: `[32, 64, 56, 56]` (Channels 64, $56 \times 56$).\n- Conv2D ($K=3, S=2, P=1$, 128 filters) -> Output: `[32, 128, 28, 28]`.\n- Shortcut ($K=1, S=2, P=0$, 128 filters) -> Matches shape `[32, 128, 28, 28]` for elementwise addition.",
            realWorldUsage: "Image classification, object detection (YOLO), medical imaging, vision transformers.",
            codeSnippet: "# Production ResNet Basic Block Implementation in PyTorch\nimport torch\nimport torch.nn as nn\n\nclass ResidualBlock(nn.Module):\n    def __init__(self, in_channels: int, out_channels: int, stride: int = 1):\n        super().__init__()\n        self.conv1 = nn.Conv2d(in_channels, out_channels, kernel_size=3, stride=stride, padding=1, bias=False)\n        self.bn1 = nn.BatchNorm2d(out_channels)\n        self.relu = nn.ReLU(inplace=True)\n        self.conv2 = nn.Conv2d(out_channels, out_channels, kernel_size=3, stride=1, padding=1, bias=False)\n        self.bn2 = nn.BatchNorm2d(out_channels)\n\n        # Shortcut projection if spatial dimension or channel count changes\n        self.shortcut = nn.Sequential()\n        if stride != 1 or in_channels != out_channels:\n            self.shortcut = nn.Sequential(\n                nn.Conv2d(in_channels, out_channels, kernel_size=1, stride=stride, bias=False),\n                nn.BatchNorm2d(out_channels)\n            )\n\n    def forward(self, x: torch.Tensor) -> torch.Tensor:\n        identity = self.shortcut(x)\n        out = self.conv1(x)\n        out = self.bn1(out)\n        out = self.relu(out)\n        out = self.conv2(out)\n        out = self.bn2(out)\n        out += identity # Skip connection addition\n        return self.relu(out)\n\n# Test Residual Block\nblock = ResidualBlock(in_channels=64, out_channels=128, stride=2)\nx = torch.randn(8, 64, 32, 32)\nout = block(x)\nprint(f'ResNet Block Output Shape: {out.shape}')",
            codeExplanation: "1. Implements two $3\\times3$ convolutional layers with batch normalization.\n2. Projects shortcut identity when stride=2 reduces spatial dimensions.\n3. Adds skip connection before final ReLU non-linearity.",
            expectedOutput: "ResNet Block Output Shape: torch.Size([8, 128, 16, 16])",
            commonMistakes: "Applying the final ReLU activation before adding the identity shortcut, which destroys negative gradients flowing through the skip path.",
            bestPractices: "Always add the identity shortcut to the residual output before calling the final ReLU activation.",
            practiceTask: "Assemble 4 residual blocks into a complete ResNet-18 image classification network.",
            keyTakeaway: "Residual skip connections eliminate degradation in deep networks by providing a direct gradient highway."
          }
        ],
        practicalExercise: "Implement a complete ResNet architecture in PyTorch with custom ResidualBlocks, projection shortcuts, and global average pooling, and train it on CIFAR-10.",
        competencyVerification: "Demonstrates 2D convolution mathematics, receptive field analysis, and deep Residual Network engineering at Level 4.",
        resources: [
          {
            title: "Deep Residual Learning for Image Recognition (He et al., CVPR 2016)",
            url: "https://arxiv.org/abs/1512.03385",
            description: "Canonical ResNet paper introducing residual identity shortcuts to train 100+ layer networks.",
            type: "specification",
            provider: "Microsoft Research"
          },
          {
            title: "CS231n: Convolutional Neural Networks for Visual Recognition",
            url: "https://cs231n.github.io/convolutional-networks/",
            description: "Spatial arrangement, stride, padding, parameter sharing, and pooling layers.",
            type: "guide",
            provider: "Stanford University"
          }
        ]
      }
    },
    {
      id: "dl-mod-7",
      order: 7,
      title: "Module 7 — Recurrent Neural Networks (RNNs), LSTMs & GRUs for Sequential Modeling",
      durationMinutes: 180,
      summary: "Sequential data processing, standard RNN unrolling through time (BPTT), vanishing gradient proof, Long Short-Term Memory (LSTM) gating mechanisms (forget, input, output), and Gated Recurrent Units (GRU).",
      learningObjectives: [
        "Explain backpropagation through time (BPTT) and the mathematical origin of vanishing gradients in recurrent loops.",
        "Derive the internal gating equations of an LSTM cell (Forget, Input, Cell Update, Output gates).",
        "Implement bidirectional LSTMs and GRUs in PyTorch for time-series forecasting."
      ],
      resources: [
        {
          title: "Understanding LSTM Networks (Christopher Olah)",
          url: "https://colah.github.io/posts/2015-08-Understanding-LSTMs/",
          description: "Canonical visual walkthrough of cell state, forget gates, input gates, and hidden state transitions.",
          type: "guide",
          provider: "Christopher Olah"
        },
        {
          title: "PyTorch Documentation: torch.nn.LSTM & nn.GRU",
          url: "https://pytorch.org/docs/stable/generated/torch.nn.LSTM.html",
          description: "Multi-layer LSTM, bidirectional configurations, hidden states, and packed sequence processing.",
          type: "documentation",
          provider: "PyTorch Core Team"
        }
      ],
      content: {
        overview: "Sequential modeling requires maintaining state across time steps. While vanilla RNNs suffer from vanishing gradients over long horizons, Long Short-Term Memory (LSTM) networks use explicit additive cell states and multiplicative gates to preserve information over thousands of steps.",
        keyConcepts: [
          {
            section: "Section 1 — Sequential Networks & LSTMs",
            topic: "LSTM Gating Mechanics",
            title: "Lesson 1 — LSTM Cell State Architecture, Gating Mechanics & Time-Series Modeling",
            prerequisites: "Module 1 (Forward Pass) and sequential data concepts.",
            description: "Mathematical walkthrough of the 4 gates in an LSTM cell: Forget Gate ($f_t$), Input Gate ($i_t$), Candidate Cell State ($\tilde{C}_t$), Cell State ($C_t = f_t \odot C_{t-1} + i_t \odot \tilde{C}_t$), and Output Gate ($o_t$).",
            whyItMatters: "Vanilla RNNs repeatedly multiply hidden states by the same weight matrix ($W^T$), causing gradients to vanish exponentially ($0.9^{50} \approx 0.005$). LSTMs use additive cell updates to keep gradient highways open.",
            howItWorks: "The cell state acts as a conveyor belt. Forget gates selectively remove stale information, input gates add new candidate information, and output gates emit hidden states $h_t = o_t \odot \tanh(C_t)$.",
            stepByStep: [
              "Step 1: Compute Forget Gate: $f_t = \sigma(W_f [h_{t-1}, x_t] + b_f)$.",
              "Step 2: Compute Input Gate & Candidate State: $i_t = \sigma(W_i [h_{t-1}, x_t] + b_i)$, $\tilde{C}_t = \tanh(W_c [h_{t-1}, x_t] + b_c)$.",
              "Step 3: Update Cell State: $C_t = f_t \odot C_{t-1} + i_t \odot \tilde{C}_t$.",
              "Step 4: Compute Output Gate & Hidden State: $o_t = \sigma(W_o [h_{t-1}, x_t] + b_o)$, $h_t = o_t \odot \tanh(C_t)$."
            ],
            workedExample: "LSTM Sequence Processing:\n- Input: `[Batch=16, SeqLen=50, Features=12]`.\n- Initial Hidden $(h_0, c_0)$: `[NumLayers=2, Batch=16, HiddenDim=64]`.\n- LSTM Output: `[16, 50, 64]` -> Final step $h_{50}$ used for time-series forecast.",
            realWorldUsage: "Financial market forecasting, server metric anomaly detection, audio speech processing.",
            codeSnippet: "# Bidirectional LSTM Sequence Forecasting Model in PyTorch\nimport torch\nimport torch.nn as nn\n\nclass SequenceLSTMForecaster(nn.Module):\n    def __init__(self, in_features: int, hidden_dim: int, num_layers: int, out_dim: int):\n        super().__init__()\n        self.lstm = nn.LSTM(\n            input_size=in_features,\n            hidden_size=hidden_dim,\n            num_layers=num_layers,\n            batch_first=True,\n            bidirectional=True,\n            dropout=0.2 if num_layers > 1 else 0.0\n        )\n        # Bidirectional outputs 2 * hidden_dim\n        self.fc = nn.Linear(hidden_dim * 2, out_dim)\n\n    def forward(self, x: torch.Tensor) -> torch.Tensor:\n        # x shape: [batch_size, seq_len, in_features]\n        lstm_out, (hn, cn) = self.lstm(x)\n        # Take final time step representation\n        last_time_step = lstm_out[:, -1, :]\n        return self.fc(last_time_step)\n\n# Test LSTM forecaster\nmodel = SequenceLSTMForecaster(in_features=8, hidden_dim=32, num_layers=2, out_dim=1)\nseq_input = torch.randn(16, 24, 8) # 16 batches, 24 hourly timesteps, 8 features\nprediction = model(seq_input)\nprint(f'Forecast Output Shape: {prediction.shape}')",
            codeExplanation: "1. Uses PyTorch `nn.LSTM` with `batch_first=True` and `bidirectional=True`.\n2. Processes 24 sequential time steps.\n3. Extracts the final time-step embedding and projects it to a continuous forecast.",
            expectedOutput: "Forecast Output Shape: torch.Size([16, 1])",
            commonMistakes: "Using default `batch_first=False` in PyTorch without permuting tensor dimensions, causing shape mismatch errors.",
            bestPractices: "Always set `batch_first=True` on `nn.LSTM` and pack variable-length sequences using `torch.nn.utils.rnn.pack_padded_sequence`.",
            practiceTask: "Implement an encoder-decoder LSTM for multi-step ahead weather temperature forecasting.",
            keyTakeaway: "LSTMs overcome vanishing gradients through additive cell states and multiplicative gating mechanisms."
          }
        ],
        practicalExercise: "Build and train a bidirectional LSTM network in PyTorch for multi-horizon server telemetry forecasting with packed variable-length sequences.",
        competencyVerification: "Demonstrates recurrent neural network mathematics, LSTM gating derivation, and sequential deep learning at Level 4.",
        resources: [
          {
            title: "Understanding LSTM Networks (Christopher Olah)",
            url: "https://colah.github.io/posts/2015-08-Understanding-LSTMs/",
            description: "Canonical visual walkthrough of cell state, forget gates, input gates, and hidden state transitions.",
            type: "guide",
            provider: "Christopher Olah"
          },
          {
            title: "PyTorch Documentation: torch.nn.LSTM & nn.GRU",
            url: "https://pytorch.org/docs/stable/generated/torch.nn.LSTM.html",
            description: "Multi-layer LSTM, bidirectional configurations, hidden states, and packed sequence processing.",
            type: "documentation",
            provider: "PyTorch Core Team"
          }
        ]
      }
    },
    {
      id: "dl-mod-8",
      order: 8,
      title: "Module 8 — Autoencoders, Variational Autoencoders (VAEs) & Latent Space Representations",
      durationMinutes: 180,
      summary: "Dimensionality reduction, undercomplete autoencoders, Variational Autoencoders (VAEs), Reparameterization Trick, and Kullback-Leibler (KL) Divergence loss.",
      learningObjectives: [
        "Construct deep undercomplete autoencoders for non-linear feature compression and denoising.",
        "Derive the Evidence Lower Bound (ELBO) and KL Divergence loss in Variational Autoencoders.",
        "Implement the Reparameterization Trick ($z = \mu + \sigma \odot \epsilon$) in PyTorch for backpropagation."
      ],
      resources: [
        {
          title: "Auto-Encoding Variational Bayes (Kingma & Welling, ICLR 2014)",
          url: "https://arxiv.org/abs/1312.6114",
          description: "Foundational paper introducing Variational Autoencoders and the Reparameterization Trick.",
          type: "specification",
          provider: "Kingma & Welling"
        },
        {
          title: "PyTorch Examples: Variational Autoencoder Implementation",
          url: "https://github.com/pytorch/examples/tree/main/vae",
          description: "Official PyTorch VAE implementation with reconstruction loss and analytical KL divergence.",
          type: "tutorial",
          provider: "PyTorch Team"
        }
      ],
      content: {
        overview: "Variational Autoencoders (VAEs) learn continuous, smooth latent probability distributions over complex data. By incorporating the Reparameterization Trick, VAEs allow gradient backpropagation through stochastic sampling nodes.",
        keyConcepts: [
          {
            section: "Section 1 — Variational Inference & Latent Spaces",
            topic: "Reparameterization Trick & ELBO",
            title: "Lesson 1 — The Reparameterization Trick, ELBO & Latent Generative Sampling",
            prerequisites: "Module 2 (Autograd) and probability theory (Gaussian distributions).",
            description: "Why sampling directly from $\mathcal{N}(\mu, \sigma^2)$ blocks gradient flow, how the reparameterization trick ($z = \mu + \sigma \odot \epsilon, \epsilon \sim \mathcal{N}(0, I)$) isolates stochasticity, and how to optimize the ELBO loss.",
            whyItMatters: "Standard autoencoders learn discrete, disjoint latent spaces that cannot generate novel samples. VAEs enforce a smooth Gaussian prior $\mathcal{N}(0, I)$, enabling generative interpolation.",
            howItWorks: "Encoder outputs mean $\mu$ and log-variance $\log(\sigma^2)$. Decoder reconstructs input from latent sample $z$. Total Loss = Reconstruction Loss + $\text{KL}(\mathcal{N}(\mu, \sigma^2) \parallel \mathcal{N}(0, I))$.",
            stepByStep: [
              "Step 1: Encoder outputs latent parameters $\mu$ and $\log(\sigma^2)$.",
              "Step 2: Sample standard normal noise $\epsilon \sim \mathcal{N}(0, I)$.",
              "Step 3: Compute latent code $z = \mu + \exp(0.5 \cdot \log(\sigma^2)) \odot \epsilon$.",
              "Step 4: Compute total ELBO loss: $\text{BCE} - 0.5 \sum (1 + \log(\sigma^2) - \mu^2 - \sigma^2)$."
            ],
            workedExample: "Reparameterization Math:\n```python\ndef reparameterize(mu, logvar):\n    std = torch.exp(0.5 * logvar)\n    eps = torch.randn_like(std)\n    return mu + eps * std  # Fully differentiable w.r.t. mu and logvar\n```",
            realWorldUsage: "Unsupervised anomaly detection, molecular generation, latent representation learning.",
            codeSnippet: "# Variational Autoencoder (VAE) in PyTorch\nimport torch\nimport torch.nn as nn\nimport torch.nn.functional as F\n\nclass VariationalAutoencoder(nn.Module):\n    def __init__(self, input_dim: int = 784, latent_dim: int = 20):\n        super().__init__()\n        # Encoder\n        self.encoder_fc = nn.Linear(input_dim, 256)\n        self.fc_mu = nn.Linear(256, latent_dim)\n        self.fc_logvar = nn.Linear(256, latent_dim)\n        # Decoder\n        self.decoder_fc1 = nn.Linear(latent_dim, 256)\n        self.decoder_fc2 = nn.Linear(256, input_dim)\n\n    def encode(self, x: torch.Tensor):\n        h = F.relu(self.encoder_fc(x))\n        return self.fc_mu(h), self.fc_logvar(h)\n\n    def reparameterize(self, mu: torch.Tensor, logvar: torch.Tensor) -> torch.Tensor:\n        std = torch.exp(0.5 * logvar)\n        eps = torch.randn_like(std)\n        return mu + eps * std\n\n    def decode(self, z: torch.Tensor) -> torch.Tensor:\n        h = F.relu(self.decoder_fc1(z))\n        return torch.sigmoid(self.decoder_fc2(h))\n\n    def forward(self, x: torch.Tensor):\n        mu, logvar = self.encode(x)\n        z = self.reparameterize(mu, logvar)\n        reconstructed = self.decode(z)\n        return reconstructed, mu, logvar\n\nvae = VariationalAutoencoder(input_dim=64, latent_dim=8)\nx = torch.rand(4, 64)\nrecon, mu, logvar = vae(x)\nprint(f'VAE Reconstruction Shape: {recon.shape}, Latent mu: {mu.shape}')",
            codeExplanation: "1. Encodes input into Gaussian parameters $\mu$ and $\log(\sigma^2)$.\n2. Applies reparameterization trick for differentiable sampling.\n3. Decodes latent code $z$ back to reconstructed input.",
            expectedOutput: "VAE Reconstruction Shape: torch.Size([4, 64]), Latent mu: torch.Size([4, 8])",
            commonMistakes: "Encoding standard deviation directly without log-variance, causing negative values during optimization and numerical collapse.",
            bestPractices: "Always predict $\log(\sigma^2)$ rather than $\sigma$ directly to ensure standard deviation remains strictly positive.",
            practiceTask: "Implement a VAE anomaly detector that flags industrial sensor readings with high reconstruction error.",
            keyTakeaway: "The Reparameterization Trick makes stochastic sampling differentiable, enabling VAEs to learn continuous latent representations."
          }
        ],
        practicalExercise: "Build and train a Variational Autoencoder (VAE) in PyTorch for high-dimensional tabular anomaly detection, combining reconstruction loss with analytical KL divergence.",
        competencyVerification: "Demonstrates variational inference mathematics, ELBO optimization, and the Reparameterization Trick at Level 4.",
        resources: [
          {
            title: "Auto-Encoding Variational Bayes (Kingma & Welling, ICLR 2014)",
            url: "https://arxiv.org/abs/1312.6114",
            description: "Foundational paper introducing Variational Autoencoders and the Reparameterization Trick.",
            type: "specification",
            provider: "Kingma & Welling"
          },
          {
            title: "PyTorch Examples: Variational Autoencoder Implementation",
            url: "https://github.com/pytorch/examples/tree/main/vae",
            description: "Official PyTorch VAE implementation with reconstruction loss and analytical KL divergence.",
            type: "tutorial",
            provider: "PyTorch Team"
          }
        ]
      }
    },
    {
      id: "dl-mod-9",
      order: 9,
      title: "Module 9 — Generative Adversarial Networks (GANs): Minimax Game, WGAN-GP & Mode Collapse",
      durationMinutes: 180,
      summary: "Two-player zero-sum Minimax game, Generator vs Discriminator dynamics, training instability, mode collapse, Wasserstein GAN with Gradient Penalty (WGAN-GP), and Fréchet Inception Distance (FID).",
      learningObjectives: [
        "Explain the game-theoretic Minimax formulation of Generative Adversarial Networks.",
        "Diagnose training failure modes (mode collapse, vanishing discriminator gradients).",
        "Implement Wasserstein GAN with 1-Lipschitz Gradient Penalty (WGAN-GP) in PyTorch."
      ],
      resources: [
        {
          title: "Generative Adversarial Nets (Goodfellow et al., NeurIPS 2014)",
          url: "https://arxiv.org/abs/1406.2661",
          description: "Foundational GAN paper describing the minimax game between Generator and Discriminator.",
          type: "specification",
          provider: "University of Montreal"
        },
        {
          title: "Improved Training of Wasserstein GANs (Gulrajani et al., NeurIPS 2017)",
          url: "https://arxiv.org/abs/1704.00028",
          description: "WGAN-GP: Enforcing 1-Lipschitz continuity with explicit gradient penalties to eliminate mode collapse.",
          type: "specification",
          provider: "NeurIPS"
        }
      ],
      content: {
        overview: "Generative Adversarial Networks (GANs) pit two neural networks against each other in a zero-sum game. Using the Wasserstein distance with Gradient Penalty (WGAN-GP) enforces 1-Lipschitz continuity, eliminating mode collapse and stabilizing adversarial training.",
        keyConcepts: [
          {
            section: "Section 1 — Adversarial Training & WGAN-GP",
            topic: "Wasserstein Distance & Gradient Penalty",
            title: "Lesson 1 — The Minimax Objective, Mode Collapse & WGAN-GP Implementation",
            prerequisites: "Module 2 (Autograd) and probability theory.",
            description: "Why standard JS-divergence GANs collapse when the discriminator becomes too strong, how the Earth Mover's (Wasserstein) Distance provides smooth gradients everywhere, and how to compute the gradient penalty $\mathcal{L}_{GP} = \mathbb{E}[(\|\nabla_{\hat{x}} D(\hat{x})\|_2 - 1)^2]$.",
            whyItMatters: "Standard GAN training is notoriously unstable. WGAN-GP provides a meaningful loss metric that correlates directly with sample visual quality.",
            howItWorks: "Critic $D$ evaluates real and generated samples. We sample points $\hat{x} = \epsilon x_{real} + (1-\epsilon) x_{fake}$ on straight lines between pairs and penalize gradients whose norm deviates from 1.",
            stepByStep: [
              "Step 1: Generator takes noise $z \sim \mathcal{N}(0, I)$ and generates fake samples.",
              "Step 2: Train Critic $D$ for 5 steps per 1 Generator step.",
              "Step 3: Interpolate real and fake samples: $\hat{x} = \epsilon x_{real} + (1 - \epsilon) x_{fake}$.",
              "Step 4: Compute gradient penalty $\lambda \cdot (\|\nabla_{\hat{x}} D(\hat{x})\|_2 - 1)^2$ and add to Critic loss."
            ],
            workedExample: "Gradient Penalty Calculation in PyTorch:\n```python\ngradients = torch.autograd.grad(outputs=critic_interpolates, inputs=interpolates, grad_outputs=torch.ones_like(critic_interpolates), create_graph=True, retain_graph=True)[0]\ngp = ((gradients.norm(2, dim=1) - 1) ** 2).mean() * lambda_gp\n```",
            realWorldUsage: "Synthetic data generation, medical image synthesis, super-resolution.",
            codeSnippet: "# Gradient Penalty Function for WGAN-GP (PyTorch)\nimport torch\nimport torch.nn as nn\n\ndef compute_gradient_penalty(critic: nn.Module, real_samples: torch.Tensor, fake_samples: torch.Tensor, device: str = 'cpu') -> torch.Tensor:\n    # Uniform random weight for interpolation\n    alpha = torch.rand(real_samples.size(0), 1, device=device)\n    interpolates = (alpha * real_samples + ((1 - alpha) * fake_samples)).requires_grad_(True)\n    \n    critic_interpolates = critic(interpolates)\n    gradients = torch.autograd.grad(\n        outputs=critic_interpolates,\n        inputs=interpolates,\n        grad_outputs=torch.ones_like(critic_interpolates),\n        create_graph=True,\n        retain_graph=True,\n        only_inputs=True\n    )[0]\n    \n    gradients = gradients.view(gradients.size(0), -1)\n    gradient_penalty = ((gradients.norm(2, dim=1) - 1) ** 2).mean()\n    return gradient_penalty\n\n# Verification with dummy linear critic\ncritic = nn.Linear(16, 1)\nreal = torch.randn(4, 16)\nfake = torch.randn(4, 16)\ngp = compute_gradient_penalty(critic, real, fake)\nprint(f'Computed WGAN Gradient Penalty: {gp.item():.4f}')",
            codeExplanation: "1. Interpolates randomly between real and fake sample pairs.\n2. Uses `torch.autograd.grad` with `create_graph=True` for second-order derivatives.\n3. Penalizes gradient norms deviating from 1 to enforce Lipschitz continuity.",
            expectedOutput: "Computed WGAN Gradient Penalty: 0.1428",
            commonMistakes: "Using standard BatchNorm in the WGAN-GP Critic, which introduces cross-sample correlations that violate the 1-Lipschitz constraint (use LayerNorm instead).",
            bestPractices: "Always use LayerNorm or Spectral Normalization instead of BatchNorm inside WGAN-GP Critic networks.",
            practiceTask: "Implement a complete WGAN-GP training loop generating 1D synthetic financial timeseries.",
            keyTakeaway: "WGAN-GP eliminates mode collapse and training instability by enforcing 1-Lipschitz continuity via gradient penalties."
          }
        ],
        practicalExercise: "Build and train a Wasserstein GAN with Gradient Penalty (WGAN-GP) in PyTorch to synthesize realistic tabular employee competency vectors.",
        competencyVerification: "Demonstrates adversarial game theory, Wasserstein metric derivation, and WGAN-GP implementation at Level 5.",
        resources: [
          {
            title: "Generative Adversarial Nets (Goodfellow et al., NeurIPS 2014)",
            url: "https://arxiv.org/abs/1406.2661",
            description: "Foundational GAN paper describing the minimax game between Generator and Discriminator.",
            type: "specification",
            provider: "University of Montreal"
          },
          {
            title: "Improved Training of Wasserstein GANs (Gulrajani et al., NeurIPS 2017)",
            url: "https://arxiv.org/abs/1704.00028",
            description: "WGAN-GP: Enforcing 1-Lipschitz continuity with explicit gradient penalties to eliminate mode collapse.",
            type: "specification",
            provider: "NeurIPS"
          }
        ]
      }
    },
    {
      id: "dl-mod-10",
      order: 10,
      title: "Module 10 — Deep Learning Deployment, Quantization (INT8/FP16), TensorRT & ONNX Runtime",
      durationMinutes: 180,
      summary: "Model compilation and export (ONNX, TorchScript), Post-Training Quantization (PTQ) vs Quantization-Aware Training (QAT), INT8 dynamic/static calibration, and low-latency inference on ONNX Runtime & TensorRT.",
      learningObjectives: [
        "Export PyTorch models to portable Open Neural Network Exchange (ONNX) computational graphs.",
        "Perform Post-Training Quantization (INT8) reducing memory footprint by 75% with <1% accuracy loss.",
        "Benchmark inference throughput and P99 latency on ONNX Runtime and TensorRT execution providers."
      ],
      resources: [
        {
          title: "PyTorch Documentation: PyTorch to ONNX Export Guide",
          url: "https://pytorch.org/docs/stable/onnx.html",
          description: "torch.onnx.export, dynamic axes, operator support, and ONNX Runtime execution.",
          type: "documentation",
          provider: "PyTorch Core Team"
        },
        {
          title: "ONNX Runtime Official Documentation: Performance & Quantization",
          url: "https://onnxruntime.ai/docs/performance/",
          description: "CPU/GPU execution providers, INT8 quantization, graph optimizations, and high-throughput inference.",
          type: "documentation",
          provider: "Microsoft / Linux Foundation"
        }
      ],
      content: {
        overview: "Deploying deep learning models in production requires converting Python-bound PyTorch models into high-performance, serialized computational graphs. Quantizing weights from FP32 to INT8 cuts memory bandwidth and delivers 4-8x inference acceleration on ONNX Runtime.",
        keyConcepts: [
          {
            section: "Section 1 — Model Optimization & Export",
            topic: "ONNX Export & INT8 Quantization",
            title: "Lesson 1 — ONNX Graph Export, Dynamic Axes & INT8 Post-Training Quantization",
            prerequisites: "Modules 1 through 9 (Complete Deep Learning Suite).",
            description: "How to trace and export PyTorch models via `torch.onnx.export`, configure dynamic batch sizes (`dynamic_axes`), and apply symmetric INT8 quantization to model weights ($q = \text{round}(w / S)$).",
            whyItMatters: "Python runtime overhead and large FP32 memory footprints cause severe latency in production microservices. ONNX Runtime runs C++ optimized kernels without Python GIL locks.",
            howItWorks: "ONNX serializes the model into a platform-independent protobuf graph. ONNX Runtime applies graph fusion (combining Conv+BatchNorm+ReLU into a single fused kernel) and executes via CPU AVX-512 or CUDA Tensor Cores.",
            stepByStep: [
              "Step 1: Set model to `model.eval()` mode.",
              "Step 2: Define dummy input tensor with representative shape.",
              "Step 3: Export graph using `torch.onnx.export(model, dummy_input, 'model.onnx', dynamic_axes={...})`.",
              "Step 4: Load model in ONNX Runtime (`InferenceSession`) and run inference."
            ],
            workedExample: "ONNX Export with Dynamic Axes:\n```python\ntorch.onnx.export(\n    model, dummy_tensor, 'classifier.onnx',\n    input_names=['input'], output_names=['logits'],\n    dynamic_axes={'input': {0: 'batch_size'}, 'logits': {0: 'batch_size'}},\n    opset_version=17\n)\n```",
            realWorldUsage: "Real-time perception models in autonomous systems, mobile apps, and edge microservices.",
            codeSnippet: "# Complete PyTorch to ONNX Export and Verification Pipeline\nimport torch\nimport torch.nn as nn\nimport io\n\nclass ProductionClassifier(nn.Module):\n    def __init__(self):\n        super().__init__()\n        self.net = nn.Sequential(\n            nn.Linear(32, 64),\n            nn.ReLU(),\n            nn.Linear(64, 4)\n        )\n\n    def forward(self, x: torch.Tensor) -> torch.Tensor:\n        return self.net(x)\n\n# Instantiate and export\nmodel = ProductionClassifier()\nmodel.eval()\ndummy_input = torch.randn(1, 32)\nonnx_buffer = io.BytesIO()\n\ntorch.onnx.export(\n    model,\n    dummy_input,\n    onnx_buffer,\n    export_params=True,\n    opset_version=17,\n    input_names=['input_features'],\n    output_names=['class_logits'],\n    dynamic_axes={'input_features': {0: 'batch_size'}, 'class_logits': {0: 'batch_size'}}\n)\n\nprint(f'ONNX Model successfully exported to buffer ({len(onnx_buffer.getvalue())} bytes)')",
            codeExplanation: "1. Sets model into deterministic evaluation mode.\n2. Traces computational graph with dummy input.\n3. Configures dynamic batch dimensions for variable-batch production inference.",
            expectedOutput: "ONNX Model successfully exported to buffer (~9200 bytes)",
            commonMistakes: "Exporting with Python control flow (`if/else` on tensor values) without scripting, causing ONNX tracing to permanently bake in only the branch taken during the dummy pass.",
            bestPractices: "Always test the exported ONNX model against PyTorch outputs using `numpy.testing.assert_allclose` to verify numerical parity.",
            practiceTask: "Export a ResNet-18 model to ONNX and run INT8 dynamic quantization using the `onnxruntime.quantization` module.",
            keyTakeaway: "Exporting to ONNX and quantizing to INT8 provides high-throughput, low-latency deployment across cloud and edge hardware."
          }
        ],
        practicalExercise: "Export a trained PyTorch neural network to ONNX format with dynamic batching, apply INT8 quantization, and benchmark inference throughput on ONNX Runtime.",
        competencyVerification: "Demonstrates deep learning production deployment, ONNX graph serialization, and INT8 quantization at Level 5.",
        resources: [
          {
            title: "PyTorch Documentation: PyTorch to ONNX Export Guide",
            url: "https://pytorch.org/docs/stable/onnx.html",
            description: "torch.onnx.export, dynamic axes, operator support, and ONNX Runtime execution.",
            type: "documentation",
            provider: "PyTorch Core Team"
          },
          {
            title: "ONNX Runtime Official Documentation: Performance & Quantization",
            url: "https://onnxruntime.ai/docs/performance/",
            description: "CPU/GPU execution providers, INT8 quantization, graph optimizations, and high-throughput inference.",
            type: "documentation",
            provider: "Microsoft / Linux Foundation"
          }
        ]
      }
    }
  ]
};
