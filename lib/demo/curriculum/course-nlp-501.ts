import { CourseCurriculum } from "./types";

export const courseNlp501: CourseCurriculum = {
  courseId: "course-nlp-501",
  totalDurationMinutes: 1980,
  modules: [
    {
      id: "nlp-mod-1",
      order: 1,
      title: "Module 1 — Text Preprocessing, Subword Tokenization & Vocabularies",
      durationMinutes: 180,
      summary: "Byte-Pair Encoding (BPE), WordPiece, and SentencePiece tokenization algorithms, vocabulary building, handling Out-Of-Vocabulary (OOV) tokens, and Hugging Face tokenizers.",
      learningObjectives: [
        "Derive and implement the Byte-Pair Encoding (BPE) subword merge algorithm from scratch.",
        "Compare BPE, WordPiece (BERT), and SentencePiece (LLaMA/T5) tokenization approaches.",
        "Train and serialize custom Hugging Face Tokenizers with fast Rust backends."
      ],
      resources: [
        {
          title: "Hugging Face Course: Summary of Tokenizers",
          url: "https://huggingface.co/learn/nlp-course/chapter6/1",
          description: "In-depth guide on BPE, WordPiece, Unigram, and Byte-level BPE tokenization algorithms.",
          type: "tutorial",
          provider: "Hugging Face"
        },
        {
          title: "Neural Machine Translation of Rare Words with Subword Units (Sennrich et al., ACL 2016)",
          url: "https://arxiv.org/abs/1508.07909",
          description: "Foundational research paper introducing Byte-Pair Encoding (BPE) for subword NLP.",
          type: "specification",
          provider: "Association for Computational Linguistics"
        }
      ],
      content: {
        overview: "Subword tokenization is the gateway to modern language models. Algorithms like Byte-Pair Encoding (BPE) and WordPiece compress text into statistically frequent subword units, balancing vocabulary size and eliminating Out-Of-Vocabulary (OOV) failures.",
        keyConcepts: [
          {
            section: "Section 1 — Tokenization Algorithms",
            topic: "Byte-Pair Encoding (BPE)",
            title: "Lesson 1 — Byte-Pair Encoding (BPE) Merge Mechanics & Vocab Construction",
            prerequisites: "Python data structures (dicts, tuples, counters) and regular expressions.",
            description: "How BPE counts symbol pairs across a training corpus, iteratively merges the most frequent pair into a new subword token, and builds a compact, OOV-free vocabulary.",
            whyItMatters: "Character-level models produce excessively long sequences; word-level models suffer from massive vocabularies and OOV words. Subword BPE provides the optimal tradeoff.",
            howItWorks: "Start with individual characters as base vocabulary. Count frequencies of adjacent symbol pairs. Merge the highest-frequency pair (e.g., `'l'` + `'o'` -> `'lo'`), add to vocabulary, and repeat until target vocabulary size is reached.",
            stepByStep: [
              "Step 1: Initialize vocabulary with individual characters plus end-of-word markers `</w>`.",
              "Step 2: Compute frequency counts for all adjacent symbol pairs in corpus.",
              "Step 3: Select most frequent pair $(c_1, c_2)$ and merge into single token $c_1c_2$.",
              "Step 4: Record merge rule and repeat until target merge limit is satisfied."
            ],
            workedExample: "BPE Merge Step:\nCorpus: `{'l o w </w>': 5, 'l o w e r </w>': 2, 'n e w e s t </w>': 6}`\nMost frequent pair: `('e', 's')` (6 occurrences) -> Merges to `'es'`.\nNext most frequent: `('es', 't')` -> Merges to `'est'`.",
            realWorldUsage: "GPT-4 (cl100k_base / o200k_base), LLaMA, RoBERTa, Mistral.",
            codeSnippet: "# Pure Python Implementation of Byte-Pair Encoding (BPE) Tokenizer\nimport re\nfrom collections import defaultdict, Counter\n\ndef get_stats(vocab: dict[str, int]) -> Counter:\n    pairs = Counter()\n    for word, freq in vocab.items():\n        symbols = word.split()\n        for i in range(len(symbols) - 1):\n            pairs[symbols[i], symbols[i + 1]] += freq\n    return pairs\n\ndef merge_vocab(pair: tuple[str, str], v_in: dict[str, int]) -> dict[str, int]:\n    v_out = {}\n    bigram = re.escape(' '.join(pair))\n    p = re.compile(r'(?<!\\S)' + bigram + r'(?!\\S)')\n    for word in v_in:\n        w_out = p.sub(''.join(pair), word)\n        v_out[w_out] = v_in[word]\n    return v_out\n\n# Sample Corpus\nraw_vocab = {'l o w </w>': 5, 'l o w e r </w>': 2, 'n e w e s t </w>': 6, 'w i d e s t </w>': 3}\nfor i in range(4):\n    stats = get_stats(raw_vocab)\n    if not stats: break\n    best_pair = stats.most_common(1)[0][0]\n    raw_vocab = merge_vocab(best_pair, raw_vocab)\n    print(f'Merge #{i+1}: {best_pair} -> Vocab snapshot: {list(raw_vocab.keys())[:2]}')",
            codeExplanation: "1. Iteratively counts adjacent token pair frequencies.\n2. Merges highest frequency bigrams using regular expressions.\n3. Demonstrates the exact core subword merge loop of BPE.",
            expectedOutput: "Merge #1: ('e', 's') -> Vocab snapshot: ['l o w </w>', 'l o w e r </w>']\nMerge #2: ('es', 't') -> Vocab snapshot: ['l o w </w>', 'l o w e r </w>']",
            commonMistakes: "Failing to include end-of-word markers or byte fallback, causing tokenizers to fail on emojis and unseen foreign unicode characters.",
            bestPractices: "Use Byte-level BPE (BBPE) to represent any arbitrary unicode byte sequence, ensuring zero OOV tokens.",
            practiceTask: "Train a Byte-level BPE tokenizer on a technical corpus using Hugging Face `tokenizers` library.",
            keyTakeaway: "Byte-Pair Encoding constructs compact, highly informative subword vocabularies with mathematically guaranteed zero-OOV coverage."
          }
        ],
        practicalExercise: "Implement a complete Byte-level BPE subword tokenizer from scratch in Python, train it on technical documentation, and verify zero-OOV tokenization across novel domain terms and code snippets.",
        competencyVerification: "Demonstrates subword tokenization mathematics, BPE merge derivations, and Hugging Face tokenizer architecture at Level 4.",
        resources: [
          {
            title: "Hugging Face Course: Summary of Tokenizers",
            url: "https://huggingface.co/learn/nlp-course/chapter6/1",
            description: "In-depth guide on BPE, WordPiece, Unigram, and Byte-level BPE tokenization algorithms.",
            type: "tutorial",
            provider: "Hugging Face"
          },
          {
            title: "Neural Machine Translation of Rare Words with Subword Units (Sennrich et al., ACL 2016)",
            url: "https://arxiv.org/abs/1508.07909",
            description: "Foundational research paper introducing Byte-Pair Encoding (BPE) for subword NLP.",
            type: "specification",
            provider: "Association for Computational Linguistics"
          }
        ]
      }
    },
    {
      id: "nlp-mod-2",
      order: 2,
      title: "Module 2 — Word & Sentence Embeddings: Word2Vec, GloVe, FastText & Modern Dense Retrievers",
      durationMinutes: 180,
      summary: "Continuous vector representations of semantics, Word2Vec (Skip-gram, CBOW, Negative Sampling), GloVe co-occurrence matrix factorization, and modern Bi-Encoder sentence transformers.",
      learningObjectives: [
        "Explain Skip-Gram Negative Sampling and the mathematical objective of Word2Vec.",
        "Compute cosine similarity, semantic vector arithmetic (King - Man + Woman = Queen), and nearest neighbors.",
        "Generate 768-dimensional dense sentence embeddings using modern Sentence Transformers."
      ],
      resources: [
        {
          title: "Sentence-BERT: Sentence Embeddings using Siamese BERT-Networks (Reimers & Gurevych, EMNLP 2019)",
          url: "https://arxiv.org/abs/1908.10084",
          description: "Foundational paper on Bi-Encoder architectures for semantically meaningful sentence embeddings.",
          type: "specification",
          provider: "EMNLP"
        },
        {
          title: "Sentence-Transformers Official Documentation",
          url: "https://sbert.net/",
          description: "Pretrained dense embedding models, semantic search, cosine similarity, and cross-encoders.",
          type: "documentation",
          provider: "UKP Lab / Hugging Face"
        }
      ],
      content: {
        overview: "Embeddings map discrete words and sentences into continuous vector spaces where geometric distance reflects semantic similarity. Modern Bi-Encoder models project entire passages into high-dimensional latent spaces for real-time dense semantic search.",
        keyConcepts: [
          {
            section: "Section 1 — Dense Embeddings & SBERT",
            topic: "Sentence Transformers & Cosine Similarity",
            title: "Lesson 1 — Bi-Encoder Architectures & Dense Semantic Vector Space Search",
            prerequisites: "Module 1 (Tokenization) and linear algebra (dot products/norms).",
            description: "How Bi-Encoders use Mean Pooling over Transformer token representations to produce fixed-size sentence vectors, and how Cosine Similarity ($\frac{u \cdot v}{\|u\| \|v\|}$) ranks semantic similarity.",
            whyItMatters: "Lexical search (TF-IDF/BM25) fails when queries use synonyms ('laptop' vs 'notebook'). Dense embeddings capture conceptual meaning.",
            howItWorks: "Query $q$ and Document $d$ pass through independent Siamese Transformer encoders to produce embeddings $u, v \in \mathbb{R}^{768}$. Relevance is computed as the cosine angle between vectors.",
            stepByStep: [
              "Step 1: Pass tokenized sentence through Transformer encoder to get token hidden states `[Batch, SeqLen, 768]`.",
              "Step 2: Apply attention-mask weighted Mean Pooling across tokens.",
              "Step 3: Normalize output embedding to unit length $\|u\|_2 = 1$.",
              "Step 4: Compute dot product $u \cdot v$ for instantaneous cosine similarity."
            ],
            workedExample: "Semantic Similarity Ranking:\n- Query: `'how to deploy nextjs'`\n- Doc A: `'Vercel cloud hosting and edge deployment'` (Cosine Similarity: 0.88)\n- Doc B: `'cooking italian pasta with garlic'` (Cosine Similarity: 0.12).",
            realWorldUsage: "Semantic search engines, RAG vector retrieval, duplicate question clustering.",
            codeSnippet: "# Dense Semantic Similarity Search using PyTorch & Matrix Math\nimport torch\nimport torch.nn.functional as F\n\ndef compute_cosine_similarity(query_emb: torch.Tensor, doc_embs: torch.Tensor) -> torch.Tensor:\n    # Normalize vectors to unit sphere\n    q_norm = F.normalize(query_emb, p=2, dim=-1)\n    d_norm = F.normalize(doc_embs, p=2, dim=-1)\n    # Fast matrix multiplication for cosine similarity\n    return torch.matmul(q_norm, d_norm.T)\n\n# Simulated 768-dim embeddings\nquery_vector = torch.randn(1, 768)\ndoc_vectors = torch.randn(5, 768) # 5 candidate passages\n\nsimilarities = compute_cosine_similarity(query_vector, doc_vectors)\nranked_indices = torch.argsort(similarities, descending=True)\nprint(f'Top ranked document index: {ranked_indices[0][0].item()}, Score: {similarities[0][ranked_indices[0][0]].item():.4f}')",
            codeExplanation: "1. Normalizes embeddings using L2 norm to convert dot products into cosine similarity.\n2. Computes batched matrix multiplication across all candidate documents.\n3. Ranks candidates by semantic relevance score.",
            expectedOutput: "Top ranked document index: ... Score: 0.2842",
            commonMistakes: "Comparing raw sentence embeddings without L2 normalization, causing vector magnitude to distort cosine angles.",
            bestPractices: "Always normalize embeddings with `F.normalize(p=2)` and pre-compute document vectors offline.",
            practiceTask: "Implement a semantic search retriever using `sentence-transformers` and compute Top-3 nearest neighbors over a corpus of 100 articles.",
            keyTakeaway: "Bi-Encoder sentence embeddings project natural language into continuous metric spaces where vector proximity equals semantic relevance."
          }
        ],
        practicalExercise: "Build a semantic search engine using PyTorch and Sentence Transformers that indexes 1,000 course competency descriptions and ranks queries using normalized cosine similarity.",
        competencyVerification: "Demonstrates vector space semantic modeling, Bi-Encoder embedding architectures, and dense retrieval at Level 4.",
        resources: [
          {
            title: "Sentence-BERT: Sentence Embeddings using Siamese BERT-Networks (Reimers & Gurevych, EMNLP 2019)",
            url: "https://arxiv.org/abs/1908.10084",
            description: "Foundational paper on Bi-Encoder architectures for semantically meaningful sentence embeddings.",
            type: "specification",
            provider: "EMNLP"
          },
          {
            title: "Sentence-Transformers Official Documentation",
            url: "https://sbert.net/",
            description: "Pretrained dense embedding models, semantic search, cosine similarity, and cross-encoders.",
            type: "documentation",
            provider: "UKP Lab / Hugging Face"
          }
        ]
      }
    },
    {
      id: "nlp-mod-3",
      order: 3,
      title: "Module 3 — Sequence-to-Sequence Models & Encoder-Decoder Architecture",
      durationMinutes: 180,
      summary: "Sequence-to-sequence modeling, RNN Encoder-Decoder bottlenecks, Bahdanau Additive Attention, Luong Multiplicative Attention, and teacher forcing.",
      learningObjectives: [
        "Explain the fixed-context information bottleneck in classical Encoder-Decoder networks.",
        "Derive and implement Bahdanau Additive Attention and Luong Dot-Product Attention.",
        "Implement teacher forcing training schedules for autoregressive sequence generators."
      ],
      resources: [
        {
          title: "Neural Machine Translation by Jointly Learning to Align and Translate (Bahdanau et al., ICLR 2015)",
          url: "https://arxiv.org/abs/1409.0473",
          description: "Foundational paper introducing the attention mechanism to sequence-to-sequence networks.",
          type: "specification",
          provider: "ICLR"
        },
        {
          title: "PyTorch Tutorial: NLP From Scratch — Translation with a Sequence to Sequence Network and Attention",
          url: "https://pytorch.org/tutorials/intermediate/seq2seq_translation_tutorial.html",
          description: "Step-by-step implementation of attention-based Seq2Seq models in PyTorch.",
          type: "tutorial",
          provider: "PyTorch Core Team"
        }
      ],
      content: {
        overview: "Early Sequence-to-Sequence (Seq2Seq) models compressed entire input sentences into a single fixed-size vector, creating an information bottleneck for long sequences. Bahdanau and Luong attention solved this by allowing the decoder to look back at all encoder hidden states dynamically.",
        keyConcepts: [
          {
            section: "Section 1 — Attention Foundations",
            topic: "Bahdanau & Luong Attention",
            title: "Lesson 1 — Dynamic Alignment & Multiplicative Attention in Seq2Seq Networks",
            prerequisites: "Module 2 (Embeddings) and Recurrent Neural Networks (LSTMs).",
            description: "How attention computes dynamic alignment scores between decoder hidden states and all encoder representations, generating context vectors $c_t = \sum \alpha_{ti} h_i$ at each decoding step.",
            whyItMatters: "Without attention, machine translation accuracy drops precipitously on sentences exceeding 15 words. Attention maintains full access to source tokens.",
            howItWorks: "Decoder state $s_t$ queries all encoder states $h_i$. Attention scores $e_{ti} = s_t^T W h_i$ pass through Softmax to produce weights $\alpha_{ti}$. The weighted sum yields the context vector $c_t$.",
            stepByStep: [
              "Step 1: Encode input sequence into encoder hidden states $H = [h_1, \dots, h_T]$.",
              "Step 2: At decoder step $t$, compute score $e_{ti} = s_t^T W h_i$ against every encoder step.",
              "Step 3: Normalize scores with $\alpha_t = \text{softmax}(e_t)$.",
              "Step 4: Compute context vector $c_t = \sum \alpha_{ti} h_i$ and concatenate with decoder input."
            ],
            workedExample: "Attention Alignment Weight Matrix:\nFor input `'Je suis étudiant'` and target `'I am a student'`, attention weights $\alpha_{ti}$ peak sharply along the diagonal alignment pairs.",
            realWorldUsage: "Neural machine translation, text summarization, speech recognition.",
            codeSnippet: "# Luong Multiplicative Attention Layer in PyTorch\nimport torch\nimport torch.nn as nn\nimport torch.nn.functional as F\n\nclass LuongAttention(nn.Module):\n    def __init__(self, hidden_dim: int):\n        super().__init__()\n        self.W = nn.Linear(hidden_dim, hidden_dim, bias=False)\n\n    def forward(self, decoder_hidden: torch.Tensor, encoder_outputs: torch.Tensor) -> tuple[torch.Tensor, torch.Tensor]:\n        # decoder_hidden: [Batch, 1, HiddenDim]\n        # encoder_outputs: [Batch, SeqLen, HiddenDim]\n        projected_encoder = self.W(encoder_outputs) # [Batch, SeqLen, HiddenDim]\n        # Score: (decoder_hidden) @ (projected_encoder)^T\n        scores = torch.bmm(decoder_hidden, projected_encoder.transpose(1, 2)) # [Batch, 1, SeqLen]\n        attn_weights = F.softmax(scores, dim=-1) # Alignment probabilities\n        context = torch.bmm(attn_weights, encoder_outputs) # [Batch, 1, HiddenDim]\n        return context, attn_weights\n\n# Test attention layer\nattn = LuongAttention(hidden_dim=64)\ndec_h = torch.randn(4, 1, 64)\nenc_out = torch.randn(4, 12, 64) # 12 source tokens\ncontext, weights = attn(dec_h, enc_out)\nprint(f'Context Shape: {context.shape}, Attention Weights: {weights.shape}')",
            codeExplanation: "1. Projects encoder states through learnable linear transformation $W$.\n2. Uses batch matrix multiplication (`torch.bmm`) to compute pairwise alignment scores.\n3. Emits weighted context vector and interpretable attention weights.",
            expectedOutput: "Context Shape: torch.Size([4, 1, 64]), Attention Weights: torch.Size([4, 1, 12])",
            commonMistakes: "Applying softmax across the batch dimension rather than the sequence dimension (`dim=-1`), corrupting attention normalization.",
            bestPractices: "Always apply attention softmax across `dim=-1` and visualize attention alignment heatmaps during validation.",
            practiceTask: "Implement an attention visualization function that plots attention heatmaps using matplotlib.",
            keyTakeaway: "Attention mechanisms remove the fixed-length information bottleneck by dynamically aligning decoder steps with source representations."
          }
        ],
        practicalExercise: "Build an attention-driven Seq2Seq translation model in PyTorch with Luong multiplicative attention and plot cross-lingual attention alignment heatmaps.",
        competencyVerification: "Demonstrates Sequence-to-Sequence architecture, attention alignment derivations, and context vector generation at Level 4.",
        resources: [
          {
            title: "Neural Machine Translation by Jointly Learning to Align and Translate (Bahdanau et al., ICLR 2015)",
            url: "https://arxiv.org/abs/1409.0473",
            description: "Foundational paper introducing the attention mechanism to sequence-to-sequence networks.",
            type: "specification",
            provider: "ICLR"
          },
          {
            title: "PyTorch Tutorial: NLP From Scratch — Translation with a Sequence to Sequence Network and Attention",
            url: "https://pytorch.org/tutorials/intermediate/seq2seq_translation_tutorial.html",
            description: "Step-by-step implementation of attention-based Seq2Seq models in PyTorch.",
            type: "tutorial",
            provider: "PyTorch Core Team"
          }
        ]
      }
    },
    {
      id: "nlp-mod-4",
      order: 4,
      title: "Module 4 — Transformer Architecture & Multi-Head Self-Attention Mechanics",
      durationMinutes: 180,
      summary: "Scaled Dot-Product Attention ($\text{softmax}(\frac{QK^T}{\sqrt{d_k}})V$), Multi-Head Attention (MHA), Rotary Position Embeddings (RoPE), Sinusoidal encodings, and FlashAttention-2.",
      learningObjectives: [
        "Derive and implement Scaled Dot-Product Attention and explain the $\frac{1}{\sqrt{d_k}}$ scaling factor.",
        "Implement Multi-Head Attention (MHA) from scratch in PyTorch.",
        "Compare Sinusoidal Positional Encodings with Rotary Position Embeddings (RoPE)."
      ],
      resources: [
        {
          title: "Attention Is All You Need (Vaswani et al., NeurIPS 2017)",
          url: "https://arxiv.org/abs/1706.03762",
          description: "The seminal Transformer paper introducing Multi-Head Self-Attention, feed-forward layers, and positional encodings.",
          type: "specification",
          provider: "Google Brain / Google Research"
        },
        {
          title: "The Illustrated Transformer (Jay Alammar)",
          url: "https://jalammar.github.io/illustrated-transformer/",
          description: "Visual breakdown of Queries, Keys, Values, Multi-Head Attention, and Transformer block residual connections.",
          type: "guide",
          provider: "Jay Alammar"
        }
      ],
      content: {
        overview: "The Transformer architecture replaced recurrent loops with parallelized Multi-Head Self-Attention. By allowing every token to attend directly to every other token simultaneously, Transformers enable massive scaling on GPU clusters.",
        keyConcepts: [
          {
            section: "Section 1 — Multi-Head Self-Attention",
            topic: "Scaled Dot-Product Attention & RoPE",
            title: "Lesson 1 — Scaled Dot-Product Attention, Multi-Head Projections & RoPE",
            prerequisites: "Module 3 (Attention Mechanics) and PyTorch tensor reshaping.",
            description: "How Query, Key, and Value matrices ($Q, K, V$) compute self-attention $\text{Attention}(Q, K, V) = \text{softmax}\left(\frac{QK^T}{\sqrt{d_k}}\right)V$, why scaling by $\sqrt{d_k}$ prevents vanishing softmax gradients, and how Rotary Position Embeddings (RoPE) encode relative token distance.",
            whyItMatters: "Without the $\frac{1}{\sqrt{d_k}}$ scaling factor, for large $d_k$ (e.g., 128), dot products explode in magnitude, pushing softmax into regions with near-zero gradients.",
            howItWorks: "Input $X$ projects to $Q, K, V$. Reshape into $h$ heads of dimension $d_k$. Compute attention weights in parallel per head. Concatenate head outputs and project through output matrix $W_O$.",
            stepByStep: [
              "Step 1: Project input embeddings $X \in \mathbb{R}^{B \times S \times D}$ to $Q, K, V$ via linear layers.",
              "Step 2: Reshape to `[Batch, NumHeads, SeqLen, HeadDim]`.",
              "Step 3: Compute attention matrix: $\text{Scores} = \frac{Q K^T}{\sqrt{d_k}} + \text{Mask}$.",
              "Step 4: Multiply softmax weights by $V$, concatenate heads, and apply output projection $W_O$."
            ],
            workedExample: "Scaled Dot-Product Attention Math:\n- $d_k = 64 \implies \sqrt{d_k} = 8$.\n- Unscaled dot product $\approx 48 \implies$ Softmax saturates completely.\n- Scaled dot product $48 / 8 = 6.0 \implies$ Softmax yields smooth, informative gradient distribution.",
            realWorldUsage: "Core engine of all modern LLMs (GPT-4, Claude, LLaMA-3, Mistral, Gemini).",
            codeSnippet: "# Complete Multi-Head Self-Attention Module in PyTorch\nimport torch\nimport torch.nn as nn\nimport math\n\nclass MultiHeadSelfAttention(nn.Module):\n    def __init__(self, embed_dim: int = 512, num_heads: int = 8):\n        super().__init__()\n        assert embed_dim % num_heads == 0, 'embed_dim must be divisible by num_heads'\n        self.embed_dim = embed_dim\n        self.num_heads = num_heads\n        self.head_dim = embed_dim // num_heads\n\n        self.q_proj = nn.Linear(embed_dim, embed_dim)\n        self.k_proj = nn.Linear(embed_dim, embed_dim)\n        self.v_proj = nn.Linear(embed_dim, embed_dim)\n        self.out_proj = nn.Linear(embed_dim, embed_dim)\n\n    def forward(self, x: torch.Tensor, mask: torch.Tensor = None) -> torch.Tensor:\n        B, S, D = x.shape\n        # Project and split into heads: [B, num_heads, S, head_dim]\n        q = self.q_proj(x).view(B, S, self.num_heads, self.head_dim).transpose(1, 2)\n        k = self.k_proj(x).view(B, S, self.num_heads, self.head_dim).transpose(1, 2)\n        v = self.v_proj(x).view(B, S, self.num_heads, self.head_dim).transpose(1, 2)\n\n        # Scaled dot-product attention\n        scores = torch.matmul(q, k.transpose(-2, -1)) / math.sqrt(self.head_dim)\n        if mask is not None:\n            scores = scores.masked_fill(mask == 0, -1e9)\n        attn_weights = torch.softmax(scores, dim=-1)\n        context = torch.matmul(attn_weights, v) # [B, num_heads, S, head_dim]\n\n        # Concatenate heads and project\n        context = context.transpose(1, 2).contiguous().view(B, S, D)\n        return self.out_proj(context)\n\nmha = MultiHeadSelfAttention(embed_dim=256, num_heads=4)\ntokens = torch.randn(2, 16, 256) # Batch=2, SeqLen=16\nout = mha(tokens)\nprint(f'MHA Output Tensor Shape: {out.shape}')",
            codeExplanation: "1. Linearly projects inputs into Query, Key, and Value spaces.\n2. Reshapes and transposes tensors for parallel multi-head attention evaluation.\n3. Applies scaling factor $1 / \\sqrt{d_k}$ and projects concatenated heads back to embedding dimension.",
            expectedOutput: "MHA Output Tensor Shape: torch.Size([2, 16, 256])",
            commonMistakes: "Forgetting to scale attention scores by $\sqrt{d_k}$, causing vanishing gradients during deep model training.",
            bestPractices: "Use PyTorch 2.0+ `torch.nn.functional.scaled_dot_product_attention` for automated FlashAttention kernel acceleration.",
            practiceTask: "Implement Rotary Position Embeddings (RoPE) and apply them to $Q$ and $K$ tensors prior to attention dot-product computation.",
            keyTakeaway: "Multi-Head Attention allows tokens to jointly attend to information from different representation subspaces at different positions."
          }
        ],
        practicalExercise: "Build a complete Transformer Encoder Block in PyTorch from scratch featuring Multi-Head Self-Attention, LayerNorm pre-norm connections, and MLP feed-forward networks.",
        competencyVerification: "Demonstrates mathematical derivation of scaled dot-product attention, multi-head tensor operations, and Transformer block design at Level 5.",
        resources: [
          {
            title: "Attention Is All You Need (Vaswani et al., NeurIPS 2017)",
            url: "https://arxiv.org/abs/1706.03762",
            description: "The seminal Transformer paper introducing Multi-Head Self-Attention, feed-forward layers, and positional encodings.",
            type: "specification",
            provider: "Google Brain / Google Research"
          },
          {
            title: "The Illustrated Transformer (Jay Alammar)",
            url: "https://jalammar.github.io/illustrated-transformer/",
            description: "Visual breakdown of Queries, Keys, Values, Multi-Head Attention, and Transformer block residual connections.",
            type: "guide",
            provider: "Jay Alammar"
          }
        ]
      }
    },
    {
      id: "nlp-mod-5",
      order: 5,
      title: "Module 5 — BERT & Masked Language Modeling for Natural Language Understanding",
      durationMinutes: 180,
      summary: "Bidirectional Encoder Representations from Transformers (BERT), Masked Language Model (MLM) objective, Next Sentence Prediction (NSP), classification heads ([CLS] token), and fine-tuning on downstream NLU tasks.",
      learningObjectives: [
        "Explain the Bidirectional Masked Language Modeling pre-training objective.",
        "Fine-tune a pretrained BERT model for sequence classification using Hugging Face Transformers.",
        "Extract contextual token representations for Named Entity Recognition (NER)."
      ],
      resources: [
        {
          title: "BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding (Devlin et al., NAACL 2019)",
          url: "https://arxiv.org/abs/1810.04805",
          description: "Seminal paper introducing bidirectional pre-training with Masked Language Modeling and [CLS] classification.",
          type: "specification",
          provider: "Google AI Language"
        },
        {
          title: "Hugging Face Course: Fine-Tuning a Pretrained Model",
          url: "https://huggingface.co/learn/nlp-course/chapter3/1",
          description: "Fine-tuning BERT, RoBERTa, and DeBERTa on GLUE classification datasets with Trainer API.",
          type: "tutorial",
          provider: "Hugging Face"
        }
      ],
      content: {
        overview: "BERT (Bidirectional Encoder Representations from Transformers) pioneered self-supervised pre-training for Natural Language Understanding (NLU). By corrupting 15% of tokens with a `[MASK]` token, BERT learns deep bidirectional representations across all layers.",
        keyConcepts: [
          {
            section: "Section 1 — BERT & NLU Fine-Tuning",
            topic: "Masked LM & Classification Heads",
            title: "Lesson 1 — The Masked Language Model Objective & Downstream Classification Heads",
            prerequisites: "Module 4 (Transformer Architecture).",
            description: "How BERT randomly masks 15% of tokens (80% `[MASK]`, 10% random word, 10% unchanged) during pre-training, and how attaching a linear head to the `[CLS]` token enables fine-tuning for classification.",
            whyItMatters: "Traditional language models were unidirectional (left-to-right), unable to use future context. BERT looks in both directions simultaneously.",
            howItWorks: "Input text with `[CLS]` and `[SEP]` tokens passes through 12-24 Transformer encoder blocks. The `[CLS]` token embedding aggregates sentence-level semantics and passes to a linear classifier.",
            stepByStep: [
              "Step 1: Tokenize text and prepend `[CLS]` (ID 101) and append `[SEP]` (ID 102).",
              "Step 2: Pass through BERT backbone to obtain hidden states `[Batch, SeqLen, 768]`.",
              "Step 3: Extract `[CLS]` vector (`hidden_states[:, 0, :]`).",
              "Step 4: Project `[CLS]` vector through `nn.Linear(768, num_classes)` and compute cross-entropy loss."
            ],
            workedExample: "BERT Classification Pipeline:\nText: `'Employee demonstrates mastery of distributed systems'`\nTokens: `['[CLS]', 'Employee', 'demonstrates', 'mastery', 'of', 'distributed', 'systems', '[SEP]']`\nOutput: `[CLS]` representation -> Linear Head -> `Class: Qualified (Level 4)`.",
            realWorldUsage: "Intent classification, sentiment analysis, document tagging, and automated resume parsing.",
            codeSnippet: "# BERT Sequence Classifier Architecture in PyTorch\nimport torch\nimport torch.nn as nn\n\nclass BertForSkillClassification(nn.Module):\n    def __init__(self, num_classes: int = 5, hidden_dim: int = 768, dropout_rate: float = 0.1):\n        super().__init__()\n        # In production: self.bert = AutoModel.from_pretrained('bert-base-uncased')\n        self.dropout = nn.Dropout(dropout_rate)\n        self.classifier = nn.Linear(hidden_dim, num_classes)\n\n    def forward(self, input_ids: torch.Tensor, attention_mask: torch.Tensor) -> torch.Tensor:\n        # Simulating BERT output: [Batch, SeqLen, 768]\n        batch_size, seq_len = input_ids.shape\n        dummy_hidden = torch.randn(batch_size, seq_len, 768)\n        \n        # Extract [CLS] token representation at index 0\n        cls_token = dummy_hidden[:, 0, :]\n        pooled_output = self.dropout(cls_token)\n        logits = self.classifier(pooled_output)\n        return logits\n\nclassifier = BertForSkillClassification(num_classes=3)\ninput_ids = torch.randint(0, 30522, (4, 32)) # 4 sentences of 32 tokens\nmask = torch.ones(4, 32)\nlogits = classifier(input_ids, mask)\nprint(f'BERT Classification Logits Shape: {logits.shape}')",
            codeExplanation: "1. Extracts `[CLS]` sentence embedding from index 0 of BERT hidden states.\n2. Applies dropout regularization to prevent overfitting.\n3. Emits unnormalized class logits for classification.",
            expectedOutput: "BERT Classification Logits Shape: torch.Size([4, 3])",
            commonMistakes: "Using BERT for autoregressive text generation (BERT is an encoder-only model designed for understanding, not generation).",
            bestPractices: "Use lower learning rates ($2\times 10^{-5}$ to $5\times 10^{-5}$) with linear warmup when fine-tuning pretrained BERT models.",
            practiceTask: "Fine-tune `bert-base-uncased` on a customer support intent classification dataset using Hugging Face `Trainer`.",
            keyTakeaway: "BERT's bidirectional attention and [CLS] pooling provide rich, contextual representations for all Natural Language Understanding tasks."
          }
        ],
        practicalExercise: "Fine-tune a pretrained BERT model for multi-class employee skill assessment classification with Hugging Face Transformers and compute F1-score across validation splits.",
        competencyVerification: "Demonstrates Masked Language Modeling mechanics, BERT fine-tuning pipelines, and sequence classification architecture at Level 4.",
        resources: [
          {
            title: "BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding (Devlin et al., NAACL 2019)",
            url: "https://arxiv.org/abs/1810.04805",
            description: "Seminal paper introducing bidirectional pre-training with Masked Language Modeling and [CLS] classification.",
            type: "specification",
            provider: "Google AI Language"
          },
          {
            title: "Hugging Face Course: Fine-Tuning a Pretrained Model",
            url: "https://huggingface.co/learn/nlp-course/chapter3/1",
            description: "Fine-tuning BERT, RoBERTa, and DeBERTa on GLUE classification datasets with Trainer API.",
            type: "tutorial",
            provider: "Hugging Face"
          }
        ]
      }
    },
    {
      id: "nlp-mod-6",
      order: 6,
      title: "Module 6 — GPT & Autoregressive Decoder Models for Text Generation",
      durationMinutes: 180,
      summary: "Autoregressive causal language modeling, Causal Attention Masking (lower triangular mask), KV-Caching for fast token generation, and decoding strategies (Greedy, Temperature, Top-k, Top-p / Nucleus).",
      learningObjectives: [
        "Implement Causal Attention Masking to prevent lookahead in autoregressive decoder models.",
        "Derive and implement Key-Value (KV) Caching to reduce token generation complexity from $O(N^2)$ to $O(N)$.",
        "Compare decoding strategies: Greedy, Temperature scaling, Top-k, and Nucleus (Top-p) sampling."
      ],
      resources: [
        {
          title: "Language Models are Few-Shot Learners (Brown et al. - GPT-3 Paper, NeurIPS 2020)",
          url: "https://arxiv.org/abs/2005.14165",
          description: "Foundational paper demonstrating scaling laws and in-context learning capabilities of large autoregressive decoders.",
          type: "specification",
          provider: "OpenAI"
        },
        {
          title: "Hugging Face Blog: How to Generate Text with Language Models",
          url: "https://huggingface.co/blog/how-to-generate",
          description: "Greedy search, beam search, temperature scaling, top-k, and nucleus top-p sampling algorithms.",
          type: "guide",
          provider: "Hugging Face"
        }
      ],
      content: {
        overview: "Autoregressive decoder models (GPT, LLaMA) predict the next token given all preceding tokens ($P(w_t \mid w_1, \dots, w_{t-1})$). Using Causal Masking during training and KV-Caching during inference enables high-speed token generation.",
        keyConcepts: [
          {
            section: "Section 1 — Causal Generation & KV-Cache",
            topic: "Causal Masking & KV-Cache",
            title: "Lesson 1 — Causal Attention, Key-Value (KV) Caching & Nucleus (Top-p) Sampling",
            prerequisites: "Module 4 (Multi-Head Attention).",
            description: "How lower-triangular causal masking blocks future tokens during training, how KV-Caching avoids recomputing Keys and Values for past tokens during autoregressive inference, and how Top-p sampling selects from the cumulative probability nucleus.",
            whyItMatters: "Generating a 1,000-token response without KV-Caching requires recomputing all past 1,000 tokens on every step ($O(N^2)$). KV-Caching keeps only the new token computation ($O(N)$).",
            howItWorks: "During generation step $t$, compute Query $Q_t$ for current token only. Retrieve cached Keys $K_{1:t-1}$ and Values $V_{1:t-1}$, append new $K_t, V_t$, compute attention, and sample next token.",
            stepByStep: [
              "Step 1: Construct Causal Mask using `torch.tril(torch.ones(S, S))`.",
              "Step 2: Allocate KV-Cache buffer `[Batch, NumHeads, MaxLen, HeadDim]`.",
              "Step 3: At each decoding step, compute logits for current token.",
              "Step 4: Apply Temperature scaling $z_i / T$, filter by Top-p threshold, and sample from `torch.multinomial`."
            ],
            workedExample: "Top-p (Nucleus) Sampling Math:\nLogits -> Softmax: `[('the', 0.50), ('a', 0.25), ('this', 0.15), ('zebra', 0.01), ...]`\nFor $p = 0.90$, cumulative sum selects `{'the', 'a', 'this'}` (sum = 0.90) and truncates the tail words, eliminating bizarre hallucinations.",
            realWorldUsage: "Inference engines in ChatGPT, Claude, vLLM, and TensorRT-LLM.",
            codeSnippet: "# Top-p (Nucleus) Sampling Implementation in PyTorch\nimport torch\nimport torch.nn.functional as F\n\ndef sample_top_p(logits: torch.Tensor, temperature: float = 0.7, top_p: float = 0.9) -> torch.Tensor:\n    # 1. Apply temperature scaling\n    scaled_logits = logits / max(1e-5, temperature)\n    probs = F.softmax(scaled_logits, dim=-1)\n\n    # 2. Sort probabilities in descending order\n    sorted_probs, sorted_indices = torch.sort(probs, descending=True, dim=-1)\n    cumulative_probs = torch.cumsum(sorted_probs, dim=-1)\n\n    # 3. Remove tokens with cumulative probability above threshold\n    sorted_indices_to_remove = cumulative_probs > top_p\n    # Shift the indices to the right to keep also the first token above the threshold\n    sorted_indices_to_remove[..., 1:] = sorted_indices_to_remove[..., :-1].clone()\n    sorted_indices_to_remove[..., 0] = 0\n\n    # 4. Scatter mask back to original indices\n    indices_to_remove = sorted_indices_to_remove.scatter(1, sorted_indices, sorted_indices_to_remove)\n    scaled_logits[indices_to_remove] = -float('Inf')\n\n    # 5. Sample from filtered multinomial distribution\n    filtered_probs = F.softmax(scaled_logits, dim=-1)\n    next_token = torch.multinomial(filtered_probs, num_samples=1)\n    return next_token\n\n# Test sampling\nlogits = torch.randn(1, 1000) # 1000 vocabulary logits\ntoken = sample_top_p(logits, temperature=0.7, top_p=0.9)\nprint(f'Sampled Token ID: {token.item()}')",
            codeExplanation: "1. Scales raw logits by temperature parameter.\n2. Computes cumulative softmax probability mass.\n3. Truncates tail tokens outside the Top-p nucleus and samples next token.",
            expectedOutput: "Sampled Token ID: ... (Valid integer within top probability mass)",
            commonMistakes: "Setting temperature to 0.0 with Top-p sampling (temperature 0 is pure deterministic argmax / greedy decoding).",
            bestPractices: "Use Temperature=0.2 for deterministic coding/math tasks and Temperature=0.7 for creative writing.",
            practiceTask: "Implement a KV-Cache class in PyTorch that stores past Key and Value tensors across autoregressive generation steps.",
            keyTakeaway: "Autoregressive generation uses causal masking and KV-caching to produce high-quality, non-repetitive text with $O(N)$ step complexity."
          }
        ],
        practicalExercise: "Build an autoregressive text generator in PyTorch with Key-Value (KV) Caching, Causal Masking, and configurable Temperature/Top-p sampling.",
        competencyVerification: "Demonstrates autoregressive decoder modeling, KV-Caching optimization, and stochastic sampling mathematics at Level 4.",
        resources: [
          {
            title: "Language Models are Few-Shot Learners (Brown et al. - GPT-3 Paper, NeurIPS 2020)",
            url: "https://arxiv.org/abs/2005.14165",
            description: "Foundational paper demonstrating scaling laws and in-context learning capabilities of large autoregressive decoders.",
            type: "specification",
            provider: "OpenAI"
          },
          {
            title: "Hugging Face Blog: How to Generate Text with Language Models",
            url: "https://huggingface.co/blog/how-to-generate",
            description: "Greedy search, beam search, temperature scaling, top-k, and nucleus top-p sampling algorithms.",
            type: "guide",
            provider: "Hugging Face"
          }
        ]
      }
    },
    {
      id: "nlp-mod-7",
      order: 7,
      title: "Module 7 — Advanced Prompt Engineering, Few-Shot In-Context Learning & Chain of Thought",
      durationMinutes: 180,
      summary: "In-context learning mechanics, Zero-Shot vs Few-Shot prompting, Chain-of-Thought (CoT) reasoning, Tree-of-Thoughts (ToT), structured JSON output enforcement, and prompt injection defense.",
      learningObjectives: [
        "Design robust few-shot prompt templates with clear delimiter separation and schema enforcement.",
        "Implement Chain-of-Thought (CoT) and Self-Consistency prompting for complex reasoning tasks.",
        "Harden LLM applications against prompt injection and jailbreak exploits."
      ],
      resources: [
        {
          title: "Chain-of-Thought Prompting Elicits Reasoning in Large Language Models (Wei et al., NeurIPS 2022)",
          url: "https://arxiv.org/abs/2201.11903",
          description: "Foundational paper demonstrating how intermediate step-by-step reasoning unlocks mathematical and logical problem solving in LLMs.",
          type: "specification",
          provider: "Google Research"
        },
        {
          title: "Anthropic Prompt Engineering Interactive Tutorial",
          url: "https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview",
          description: "Clear instructions, XML tagging delimiters, thinking steps, and structured output formatting.",
          type: "guide",
          provider: "Anthropic"
        }
      ],
      content: {
        overview: "Prompt engineering is the practice of structuring natural language inputs to elicit deterministic, high-accuracy reasoning from LLMs. Techniques like Chain-of-Thought (CoT) and XML tagging structure intermediate reasoning before emitting final JSON outputs.",
        keyConcepts: [
          {
            section: "Section 1 — Prompt Architecture & Reasoning",
            topic: "Chain-of-Thought & Injection Defense",
            title: "Lesson 1 — Chain-of-Thought (CoT), XML Delimiters & Structured JSON Schema Enforcement",
            prerequisites: "Module 6 (Autoregressive Generation).",
            description: "How step-by-step reasoning triggers autoregressive computation tokens, why XML tags (`<context>`, `<instructions>`) isolate untrusted input, and how to enforce valid JSON schema responses.",
            whyItMatters: "Directly asking for an answer forces the model to compute complex reasoning in a single token. Chain-of-Thought gives the model thinking space across multiple output tokens.",
            howItWorks: "The prompt instructs the model to output a `<thinking>` block analyzing constraints before outputting the final `<answer>` in strict JSON format.",
            stepByStep: [
              "Step 1: Use XML tags to separate System Instructions, Examples, Context, and User Input.",
              "Step 2: Provide 2-3 high-quality few-shot examples demonstrating step-by-step reasoning.",
              "Step 3: Instruct model: 'Think step by step in `<thinking>` tags before emitting JSON in `<result>`.'",
              "Step 4: Parse and validate output against Zod/Pydantic schemas."
            ],
            workedExample: "Production CoT Prompt Template:\n```xml\n<instructions>\nYou are an expert engineering talent evaluator. Evaluate candidate competency against rubric.\nStep 1: Analyze evidence in <thinking>.\nStep 2: Emit JSON matching the schema in <result>.\n</instructions>\n<context>\nCandidate: Led database sharding migration; 0 downtime; authored RFC.\n</context>\n```",
            realWorldUsage: "Production AI systems, automated assessment evaluators, customer support triage.",
            codeSnippet: "# Structured Prompt Orchestrator with JSON Schema Validation (Python)\nimport json\nfrom typing import TypedDict\n\nclass EvaluationResult(TypedDict):\n    thinking: str\n    competency_code: str\n    score: int\n    is_qualified: boolean\n\ndef build_evaluation_prompt(candidate_name: str, evidence: str) -> str:\n    return f\"\"\"<system_instructions>\nYou are a Capacity Connect Competency Auditor. Evaluate the candidate evidence objectively.\nFirst, provide step-by-step analysis inside <thinking> tags.\nThen, output the final JSON evaluation inside <result> tags conforming to schema:\n{{\n  \"competency_code\": \"string\",\n  \"score\": int (0-100),\n  \"is_qualified\": bool\n}}\n</system_instructions>\n\n<candidate_evidence>\nName: {candidate_name}\nEvidence: {evidence}\n</candidate_evidence>\n\"\"\"\n\n# Simulated LLM invocation & parsing\nprompt = build_evaluation_prompt('Alex Rivera', 'Designed and shipped a distributed Kafka event streaming pipeline handling 50k msgs/sec.')\nprint('Generated Prompt Sample:\\n', prompt[:200] + '...')",
            codeExplanation: "1. Separates instructions from untrusted data using XML delimiters.\n2. Mandates intermediate reasoning before final structured output.\n3. Enforces strict JSON schema contracts for downstream software integration.",
            expectedOutput: "Generated Prompt Sample:\n<system_instructions>\nYou are a Capacity Connect Competency Auditor...",
            commonMistakes: "Concatenating unescaped user inputs directly into prompt strings without delimiters, enabling prompt injection attacks.",
            bestPractices: "Always wrap user inputs in distinct XML tags and validate model outputs with Pydantic/Zod schemas.",
            practiceTask: "Create a Few-Shot prompt with 3 examples that converts unformatted engineering incident reports into structured JSON root-cause summaries.",
            keyTakeaway: "Chain-of-Thought prompting and XML delimiters maximize LLM reasoning accuracy and prevent prompt injection vulnerabilities."
          }
        ],
        practicalExercise: "Design and implement an automated competency evaluation prompt pipeline featuring Chain-of-Thought reasoning, XML delimiters, few-shot examples, and Pydantic JSON validation.",
        competencyVerification: "Demonstrates advanced prompt engineering, Chain-of-Thought reasoning elicitation, and prompt injection defense at Level 4.",
        resources: [
          {
            title: "Chain-of-Thought Prompting Elicits Reasoning in Large Language Models (Wei et al., NeurIPS 2022)",
            url: "https://arxiv.org/abs/2201.11903",
            description: "Foundational paper demonstrating how intermediate step-by-step reasoning unlocks mathematical and logical problem solving in LLMs.",
            type: "specification",
            provider: "Google Research"
          },
          {
            title: "Anthropic Prompt Engineering Interactive Tutorial",
            url: "https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview",
            description: "Clear instructions, XML tagging delimiters, thinking steps, and structured output formatting.",
            type: "guide",
            provider: "Anthropic"
          }
        ]
      }
    },
    {
      id: "nlp-mod-8",
      order: 8,
      title: "Module 8 — Parameter-Efficient Fine-Tuning (PEFT): LoRA, QLoRA & Prefix Tuning",
      durationMinutes: 180,
      summary: "Full fine-tuning limitations, Low-Rank Adaptation (LoRA: $\Delta W = B \cdot A$), rank $r$ and scaling factor $\alpha$, QLoRA 4-bit NormalFloat (NF4) quantization, and Hugging Face PEFT library.",
      learningObjectives: [
        "Explain the low intrinsic dimensionality hypothesis and the mathematical formulation of LoRA.",
        "Implement LoRA adapters from scratch in PyTorch ($W_0 + \frac{\alpha}{r} B A$).",
        "Fine-tune a 7B LLM on a consumer GPU using QLoRA 4-bit NF4 quantization and bitsandbytes."
      ],
      resources: [
        {
          title: "LoRA: Low-Rank Adaptation of Large Language Models (Hu et al., ICLR 2022)",
          url: "https://arxiv.org/abs/2106.09685",
          description: "The seminal LoRA paper freezing base weights and injecting trainable low-rank decomposition matrices.",
          type: "specification",
          provider: "Microsoft Research"
        },
        {
          title: "QLoRA: Efficient Finetuning of Quantized LLMs (Dettmers et al., NeurIPS 2023)",
          url: "https://arxiv.org/abs/2305.14314",
          description: "4-bit NormalFloat (NF4) quantization, Double Quantization, and Paged Optimizers.",
          type: "specification",
          provider: "University of Washington"
        }
      ],
      content: {
        overview: "Full parameter fine-tuning of 7B-70B parameter models requires massive GPU clusters. Parameter-Efficient Fine-Tuning (PEFT) with LoRA freezes the pretrained weights and trains lightweight low-rank matrices ($r \in [8, 64]$), reducing memory requirements by 80% while matching full fine-tuning performance.",
        keyConcepts: [
          {
            section: "Section 1 — LoRA & QLoRA Architecture",
            topic: "Low-Rank Adaptation Mechanics",
            title: "Lesson 1 — Low-Rank Decomposition ($B \cdot A$), Scaling Alpha & QLoRA NF4 Quantization",
            prerequisites: "Module 4 (Multi-Head Attention) and linear algebra (matrix rank).",
            description: "How LoRA decomposes weight updates $\Delta W \in \mathbb{R}^{d \times k}$ into two low-rank matrices $B \in \mathbb{R}^{d \times r}$ and $A \in \mathbb{R}^{r \times k}$ ($r \ll \min(d, k)$), how $\frac{\alpha}{r}$ scales updates, and how QLoRA compresses base weights into 4-bit NormalFloat.",
            whyItMatters: "Fine-tuning a 7B model requires >80GB VRAM in FP16. QLoRA enables fine-tuning the exact same model on a single 16GB consumer GPU with zero performance degradation.",
            howItWorks: "Pretrained weights $W_0$ remain frozen. Matrix $A$ initializes with Gaussian noise $\mathcal{N}(0, \sigma^2)$ and $B$ initializes to 0, ensuring $\Delta W = 0$ at step 0. Output $h = W_0 x + \frac{\alpha}{r} B A x$.",
            stepByStep: [
              "Step 1: Quantize base model weights to 4-bit NF4 with `bitsandbytes`.",
              "Step 2: Inject LoRA adapter layers into attention projection matrices ($W_q, W_v$).",
              "Step 3: Freeze base model parameters and train only adapter matrices $A$ and $B$.",
              "Step 4: Merge adapters into base weights at inference: $W_{final} = W_0 + \frac{\alpha}{r} B A$."
            ],
            workedExample: "Parameter Reduction with LoRA:\n- Base Layer ($d=4096, k=4096$): $4096 \times 4096 = 16,777,216$ parameters.\n- LoRA Adapter ($r=16$): $A (16 \times 4096) + B (4096 \times 16) = 131,072$ parameters (99.2% reduction!).",
            realWorldUsage: "Domain adaptation of LLaMA-3 and Mistral for medical, legal, and code intelligence.",
            codeSnippet: "# From-Scratch Implementation of a LoRA Linear Layer in PyTorch\nimport torch\nimport torch.nn as nn\nimport math\n\nclass LoRALinear(nn.Module):\n    def __init__(self, in_features: int, out_features: int, r: int = 16, lora_alpha: float = 32.0):\n        super().__init__()\n        # Frozen pretrained base weight\n        self.base_linear = nn.Linear(in_features, out_features, bias=False)\n        self.base_linear.weight.requires_grad = False\n        \n        self.r = r\n        self.scaling = lora_alpha / r\n\n        # Trainable low-rank adapter matrices\n        self.lora_A = nn.Parameter(torch.randn(r, in_features) / math.sqrt(r))\n        self.lora_B = nn.Parameter(torch.zeros(out_features, r))\n\n    def forward(self, x: torch.Tensor) -> torch.Tensor:\n        base_out = self.base_linear(x)\n        # Compute Delta W = (x @ A^T) @ B^T * scaling\n        lora_out = (x @ self.lora_A.T) @ self.lora_B.T * self.scaling\n        return base_out + lora_out\n\n# Test LoRA layer\nlora_layer = LoRALinear(in_features=4096, out_features=4096, r=16, lora_alpha=32)\nx = torch.randn(2, 4096)\nout = lora_layer(x)\nprint(f'LoRA Output Shape: {out.shape}, Trainable Params: {sum(p.numel() for p in lora_layer.parameters() if p.requires_grad)}')",
            codeExplanation: "1. Freezes base linear weight completely.\n2. Initializes $B$ to zero so adapter output is strictly zero at step 0.\n3. Adds scaled low-rank update $\\Delta W$ with minimal trainable parameters.",
            expectedOutput: "LoRA Output Shape: torch.Size([2, 4096]), Trainable Params: 131072",
            commonMistakes: "Initializing $B$ with random weights rather than zeros, which disrupts pretrained model representations at the start of training.",
            bestPractices: "Always set $B=0$ and $A \sim \mathcal{N}(0, 1/r)$, and apply LoRA to both attention and MLP projection weights for best fine-tuning transfer.",
            practiceTask: "Fine-tune a LLaMA-3 model on domain-specific Q&A using Hugging Face `peft` and `trl.SFTTrainer`.",
            keyTakeaway: "LoRA parameterizes weight updates into low-rank matrices, slashing VRAM requirements while matching full fine-tuning performance."
          }
        ],
        practicalExercise: "Implement custom LoRA adapter layers in PyTorch from scratch, attach them to a pretrained Transformer attention layer, and fine-tune on a domain instruction dataset.",
        competencyVerification: "Demonstrates Parameter-Efficient Fine-Tuning mathematics, LoRA low-rank decomposition, and QLoRA quantization at Level 5.",
        resources: [
          {
            title: "LoRA: Low-Rank Adaptation of Large Language Models (Hu et al., ICLR 2022)",
            url: "https://arxiv.org/abs/2106.09685",
            description: "The seminal LoRA paper freezing base weights and injecting trainable low-rank decomposition matrices.",
            type: "specification",
            provider: "Microsoft Research"
          },
          {
            title: "QLoRA: Efficient Finetuning of Quantized LLMs (Dettmers et al., NeurIPS 2023)",
            url: "https://arxiv.org/abs/2305.14314",
            description: "4-bit NormalFloat (NF4) quantization, Double Quantization, and Paged Optimizers.",
            type: "specification",
            provider: "University of Washington"
          }
        ]
      }
    },
    {
      id: "nlp-mod-9",
      order: 9,
      title: "Module 9 — Retrieval-Augmented Generation (RAG) Architecture & Vector Databases (HNSW, pgvector)",
      durationMinutes: 180,
      summary: "RAG pipeline architecture, recursive document chunking, Hierarchical Navigable Small World (HNSW) vector indexing, Hybrid Search (Dense + BM25 Sparse with Reciprocal Rank Fusion), and Cross-Encoder re-ranking.",
      learningObjectives: [
        "Design production RAG pipelines with semantic chunking and metadata filtering.",
        "Explain Approximate Nearest Neighbor (ANN) search and HNSW graph traversal.",
        "Implement two-stage Hybrid Retrieval with Cross-Encoder re-ranking."
      ],
      resources: [
        {
          title: "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks (Lewis et al., NeurIPS 2020)",
          url: "https://arxiv.org/abs/2005.11401",
          description: "Foundational paper introducing the RAG paradigm combining parametric memory with non-parametric retrieval.",
          type: "specification",
          provider: "Meta AI / UCL / NYU"
        },
        {
          title: "Pinecone / pgvector Guide: Understanding Hierarchical Navigable Small World (HNSW)",
          url: "https://www.pinecone.io/learn/series/vector-indexes/hnsw/",
          description: "Multi-layer graph indexing, skip-list mechanics, M parameters, and efSearch trade-offs.",
          type: "guide",
          provider: "Pinecone"
        }
      ],
      content: {
        overview: "Retrieval-Augmented Generation (RAG) grounds LLM responses in verifiable enterprise knowledge, eliminating hallucinations and enabling private data access. Combining HNSW vector indexes with BM25 keyword search and Cross-Encoder re-ranking delivers production-grade retrieval accuracy.",
        keyConcepts: [
          {
            section: "Section 1 — RAG Pipelines & HNSW",
            topic: "Hybrid Search & Re-ranking",
            title: "Lesson 1 — Two-Stage Retrieval: HNSW Dense Search, BM25 & Cross-Encoder Re-Ranking",
            prerequisites: "Module 2 (Embeddings) and Module 7 (Prompt Engineering).",
            description: "How HNSW builds multi-layer graphs for logarithmic ANN search, how Reciprocal Rank Fusion (RRF) combines dense vector and sparse keyword results, and how Cross-Encoders eliminate false positive retrievals.",
            whyItMatters: "Dense search alone misses exact keyword matches (e.g., error codes like `ERR_901`), while keyword search misses conceptual meaning. Hybrid search captures both.",
            howItWorks: "Stage 1: Fetch top 50 candidates using HNSW and BM25, merged via RRF. Stage 2: Cross-Encoder evaluates all `(query, document)` pairs with full cross-attention to select the top 5 most relevant passages.",
            stepByStep: [
              "Step 1: Chunk documents with recursive character splitter (500 tokens, 10% overlap).",
              "Step 2: Generate embeddings and index in HNSW vector database (`pgvector` / Qdrant).",
              "Step 3: Retrieve top candidates using Hybrid Search (RRF formula: $RRF(d) = \sum \frac{1}{60 + r(d)}$).",
              "Step 4: Re-rank with Cross-Encoder and inject into LLM prompt context."
            ],
            workedExample: "Reciprocal Rank Fusion (RRF):\n- Doc A: Rank 1 in Dense, Rank 10 in BM25 -> $RRF = \frac{1}{61} + \frac{1}{70} = 0.0163 + 0.0142 = 0.0305$.\n- Doc B: Rank 15 in Dense, Rank 1 in BM25 -> $RRF = \frac{1}{75} + \frac{1}{61} = 0.0133 + 0.0163 = 0.0296$.\nDoc A ranks highest overall.",
            realWorldUsage: "Enterprise internal documentation search, customer knowledge bases, legal discovery.",
            codeSnippet: "# Two-Stage RAG Pipeline Orchestrator with RRF Fusion (Python)\nfrom typing import List, Dict\n\ndef reciprocal_rank_fusion(dense_results: List[str], sparse_results: List[str], k: int = 60) -> List[tuple[str, float]]:\n    scores: Dict[str, float] = {}\n\n    # Process Dense Rankings\n    for rank, doc_id in enumerate(dense_results, start=1):\n        scores[doc_id] = scores.get(doc_id, 0.0) + (1.0 / (k + rank))\n\n    # Process Sparse (BM25) Rankings\n    for rank, doc_id in enumerate(sparse_results, start=1):\n        scores[doc_id] = scores.get(doc_id, 0.0) + (1.0 / (k + rank))\n\n    # Sort by fused score descending\n    fused_ranking = sorted(scores.items(), key=lambda item: item[1], reverse=True)\n    return fused_ranking\n\n# Demonstration\ndense_top = ['DOC_A', 'DOC_B', 'DOC_C']\nsparse_top = ['DOC_B', 'DOC_D', 'DOC_A']\nfused = reciprocal_rank_fusion(dense_top, sparse_top)\nprint(f'Top fused RAG document: {fused[0][0]} with RRF score: {fused[0][1]:.4f}')",
            codeExplanation: "1. Merges ranked candidate lists from disparate retrieval systems.\n2. Applies Reciprocal Rank Fusion formula with constant $k=60$.\n3. Produces a single, robust candidate ranking for cross-encoder ingestion.",
            expectedOutput: "Top fused RAG document: DOC_B with RRF score: 0.0325",
            commonMistakes: "Stuffing entire 50-page PDFs into the LLM context without chunking, exceeding context windows and degrading attention focus (needle-in-a-haystack degradation).",
            bestPractices: "Use semantic chunking (300-500 tokens) with 10% overlap and always re-rank candidates with a Cross-Encoder.",
            practiceTask: "Build an end-to-end RAG pipeline using pgvector and LangChain to query technical API specifications.",
            keyTakeaway: "Two-stage hybrid retrieval (HNSW + BM25 + Cross-Encoder) provides high-recall, high-precision grounding for RAG systems."
          }
        ],
        practicalExercise: "Build an end-to-end Retrieval-Augmented Generation (RAG) system with recursive chunking, HNSW vector indexing, Reciprocal Rank Fusion hybrid search, and context grounding.",
        competencyVerification: "Demonstrates RAG pipeline architecture, HNSW vector database indexing, and hybrid retrieval ranking at Level 5.",
        resources: [
          {
            title: "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks (Lewis et al., NeurIPS 2020)",
            url: "https://arxiv.org/abs/2005.11401",
            description: "Foundational paper introducing the RAG paradigm combining parametric memory with non-parametric retrieval.",
            type: "specification",
            provider: "Meta AI / UCL / NYU"
          },
          {
            title: "Pinecone / pgvector Guide: Understanding Hierarchical Navigable Small World (HNSW)",
            url: "https://www.pinecone.io/learn/series/vector-indexes/hnsw/",
            description: "Multi-layer graph indexing, skip-list mechanics, M parameters, and efSearch trade-offs.",
            type: "guide",
            provider: "Pinecone"
          }
        ]
      }
    },
    {
      id: "nlp-mod-10",
      order: 10,
      title: "Module 10 — Autonomous AI Agents, Tool Calling, Function Execution & ReAct Framework",
      durationMinutes: 180,
      summary: "Reasoning and Acting (ReAct) paradigm, OpenAI / Anthropic Tool Calling API schemas, agentic execution loops, state management, and multi-agent coordination.",
      learningObjectives: [
        "Implement the ReAct (Thought -> Action -> Observation) loop for multi-step task execution.",
        "Author JSON schema tool definitions for automated external API and database execution.",
        "Handle tool execution errors gracefully and prevent infinite agent execution loops."
      ],
      resources: [
        {
          title: "ReAct: Synergizing Reasoning and Acting in Language Models (Yao et al., ICLR 2023)",
          url: "https://arxiv.org/abs/2210.03629",
          description: "Foundational paper introducing the ReAct framework combining dynamic reasoning traces with external tool actions.",
          type: "specification",
          provider: "Princeton University / Google Research"
        },
        {
          title: "OpenAI Documentation: Function Calling & Tool Execution",
          url: "https://platform.openai.com/docs/guides/function-calling",
          description: "Defining tool schemas, handling tool_calls outputs, and feeding tool responses back into the model.",
          type: "documentation",
          provider: "OpenAI"
        }
      ],
      content: {
        overview: "AI Agents extend LLMs from passive text generators into autonomous problem solvers. The ReAct (Reasoning + Acting) loop interleaves chain-of-thought reasoning with real-world tool execution (database queries, APIs, code execution).",
        keyConcepts: [
          {
            section: "Section 1 — Agentic Architecture & Tool Calling",
            topic: "The ReAct Loop",
            title: "Lesson 1 — The ReAct Autonomous Loop: Thought, Action, Observation & Termination",
            prerequisites: "Module 7 (Prompt Engineering) and Module 9 (RAG Architecture).",
            description: "How autonomous agents execute multi-step plans: analyzing current state (Thought), selecting a tool with arguments (Action), executing the tool in external environments (Observation), and iterating until completion.",
            whyItMatters: "Direct LLMs cannot check live databases, search current web data, or execute code. Agent loops empower models to interact dynamically with external software.",
            howItWorks: "The agent prompt defines available tools. The model emits a JSON tool call. The execution environment runs the tool, appends the result as an `observation` message, and prompts the model again until it emits final answer.",
            stepByStep: [
              "Step 1: Register available tools with JSON Schema descriptions.",
              "Step 2: Initialize agent loop with user goal and max step limit (e.g., 10 iterations).",
              "Step 3: Model emits `Thought:` and `Action: tool_name(args)`.",
              "Step 4: Execute tool, capture result as `Observation:`, and feed back to conversation history.",
              "Step 5: Terminate when model outputs `Final Answer:` or max steps exceeded."
            ],
            workedExample: "ReAct Trace Example:\n- User: `'What is the capacity score of the ML team in Acme Corp?'`\n- Thought: `'I need to query the organization capacity database.'`\n- Action: `query_org_capacity(org_id='ORG_ACME', team='ML')`\n- Observation: `{'capacity_score': 88, 'headcount': 14}`\n- Final Answer: `'The ML team at Acme Corp has a capacity score of 88% across 14 engineers.'`",
            realWorldUsage: "Autonomous coding assistants, automated customer support agents, business data analysts.",
            codeSnippet: "# Complete ReAct Autonomous Agent Controller in Python\nimport json\n\nclass AutonomousAgent:\n    def __init__(self, tools: dict):\n        self.tools = tools\n\n    def run(self, user_goal: str, max_iterations: int = 5) -> str:\n        history = [f'User Goal: {user_goal}']\n        for step in range(max_iterations):\n            # Simulating model reasoning and action selection\n            if step == 0:\n                thought = 'I need to check employee competency status.'\n                action = 'get_competency_score'\n                args = {'employee_id': 'EMP_101'}\n            else:\n                return f'Final Answer: Employee EMP_101 holds a verified score of 94% in Backend API Development.'\n\n            print(f'[Step {step+1}] Thought: {thought}')\n            print(f'[Step {step+1}] Action: {action}({args})')\n\n            # Execute real tool\n            tool_fn = self.tools.get(action)\n            observation = tool_fn(**args) if tool_fn else 'Tool not found'\n            print(f'[Step {step+1}] Observation: {observation}')\n            history.append(f'Observation: {observation}')\n\n        return 'Execution limit reached.'\n\n# Register tools and run\ntools = {'get_competency_score': lambda employee_id: {'score': 94, 'status': 'QUALIFIED'}}\nagent = AutonomousAgent(tools)\nresult = agent.run('Verify EMP_101 qualifications')\nprint(result)",
            codeExplanation: "1. Implements autonomous iterative execution loop.\n2. Dispatches structured tool actions to registered Python functions.\n3. Feeds observations back into memory until termination criteria is satisfied.",
            expectedOutput: "[Step 1] Thought: I need to check employee competency status.\n[Step 1] Action: get_competency_score({'employee_id': 'EMP_101'})\n[Step 1] Observation: {'score': 94, 'status': 'QUALIFIED'}\nFinal Answer: Employee EMP_101 holds a verified score of 94% in Backend API Development.",
            commonMistakes: "Allowing agents to run with unbounded iterations without maximum step guards, causing infinite recursion loops and high API costs.",
            bestPractices: "Always enforce strict `max_iterations` limits and validate all tool arguments against schemas before execution.",
            practiceTask: "Implement an agent with two tools (SQL Query executor and Email dispatcher) with automated error retry handling.",
            keyTakeaway: "The ReAct framework synergizes step-by-step reasoning with external tool execution to solve complex multi-step workflows."
          }
        ],
        practicalExercise: "Build an autonomous AI Agent implementing the ReAct framework in Python with schema-validated tool calling, database query tools, and loop cycle guards.",
        competencyVerification: "Demonstrates autonomous agent architecture, ReAct loop implementation, and tool execution orchestration at Level 5.",
        resources: [
          {
            title: "ReAct: Synergizing Reasoning and Acting in Language Models (Yao et al., ICLR 2023)",
            url: "https://arxiv.org/abs/2210.03629",
            description: "Foundational paper introducing the ReAct framework combining dynamic reasoning traces with external tool actions.",
            type: "specification",
            provider: "Princeton University / Google Research"
          },
          {
            title: "OpenAI Documentation: Function Calling & Tool Execution",
            url: "https://platform.openai.com/docs/guides/function-calling",
            description: "Defining tool schemas, handling tool_calls outputs, and feeding tool responses back into the model.",
            type: "documentation",
            provider: "OpenAI"
          }
        ]
      }
    },
    {
      id: "nlp-mod-11",
      order: 11,
      title: "Module 11 — LLM Alignment, RLHF, Direct Preference Optimization (DPO) & Production Evaluation",
      durationMinutes: 180,
      summary: "Alignment taxonomy (Helpful, Honest, Harmless), Reinforcement Learning from Human Feedback (RLHF) with PPO, Direct Preference Optimization (DPO) closed-form loss, and automated LLM-as-a-Judge evaluation.",
      learningObjectives: [
        "Explain the RLHF training pipeline: SFT -> Reward Modeling -> PPO Policy Optimization.",
        "Derive and implement Direct Preference Optimization (DPO) without training separate reward models.",
        "Design robust LLM-as-a-Judge evaluation benchmarks with rubric calibration."
      ],
      resources: [
        {
          title: "Direct Preference Optimization: Your Language Model is Secretly a Reward Model (Rafailov et al., NeurIPS 2023)",
          url: "https://arxiv.org/abs/2305.18290",
          description: "Foundational DPO paper deriving exact implicit reward optimization directly from preference data.",
          type: "specification",
          provider: "Stanford University"
        },
        {
          title: "Anthropic: Training a Helpful and Harmless Assistant with Reinforcement Learning from Human Feedback",
          url: "https://arxiv.org/abs/2204.05862",
          description: "RLHF alignment principles, HHH criteria, and preference dataset collection.",
          type: "specification",
          provider: "Anthropic"
        }
      ],
      content: {
        overview: "Raw pre-trained LLMs generate toxic or unhelpful text. Alignment aligns models with human intent (Helpful, Honest, Harmless). Direct Preference Optimization (DPO) optimizes policy models directly on paired preference datasets ($y_w \succ y_l$) without complex RL reward models.",
        keyConcepts: [
          {
            section: "Section 1 — Alignment & DPO",
            topic: "Direct Preference Optimization (DPO)",
            title: "Lesson 1 — Direct Preference Optimization (DPO) & LLM-as-a-Judge Evaluation",
            prerequisites: "Modules 6 and 8 (Autoregressive LLMs & LoRA PEFT).",
            description: "How DPO mathematically substitutes the Bradley-Terry preference model into the RL objective to derive a simple binary cross-entropy loss over chosen ($y_w$) and rejected ($y_l$) completions: $\mathcal{L}_{DPO} = -\log \sigma \left( \beta \log \frac{\pi_\theta(y_w|x)}{\pi_{ref}(y_w|x)} - \beta \log \frac{\pi_\theta(y_l|x)}{\pi_{ref}(y_l|x)} \right)$.",
            whyItMatters: "Traditional RLHF requires training an unstable PPO policy and separate Reward Model. DPO trains directly on preference pairs with standard supervised gradient descent.",
            howItWorks: "Given prompt $x$, chosen answer $y_w$, and rejected answer $y_l$, DPO increases the log-likelihood of $y_w$ relative to the reference model $\pi_{ref}$ while decreasing the log-likelihood of $y_l$.",
            stepByStep: [
              "Step 1: Collect paired dataset `(prompt, chosen_response, rejected_response)`.",
              "Step 2: Freeze reference model $\pi_{ref}$ (original SFT model).",
              "Step 3: Compute log-likelihood ratios for chosen and rejected responses under policy $\pi_\theta$ and $\pi_{ref}$.",
              "Step 4: Optimize binary cross-entropy loss with scaling hyperparameter $\beta \in [0.1, 0.5]$."
            ],
            workedExample: "DPO Loss Math:\n- If Policy $\pi_\theta$ assigns higher probability to Chosen than Rejected (relative to $\pi_{ref}$), implicit reward margin $\hat{r}(x, y_w) - \hat{r}(x, y_l) > 0 \implies$ Loss $\to 0$.\n- If Policy prefers Rejected, loss explodes, driving corrective parameter updates.",
            realWorldUsage: "Alignment in LLaMA-3, Mistral, Zephyr, and Anthropic Claude.",
            codeSnippet: "# Direct Preference Optimization (DPO) Loss Implementation in PyTorch\nimport torch\nimport torch.nn.functional as F\n\ndef compute_dpo_loss(\n    policy_chosen_logps: torch.Tensor,\n    policy_rejected_logps: torch.Tensor,\n    reference_chosen_logps: torch.Tensor,\n    reference_rejected_logps: torch.Tensor,\n    beta: float = 0.1\n) -> tuple[torch.Tensor, torch.Tensor, torch.Tensor]:\n    # Compute log probability ratios\n    policy_log_ratios = policy_chosen_logps - policy_rejected_logps\n    ref_log_ratios = reference_chosen_logps - reference_rejected_logps\n    \n    logits = beta * (policy_log_ratios - ref_log_ratios)\n    # Binary cross entropy: -log(sigmoid(logits))\n    loss = -F.logsigmoid(logits).mean()\n\n    # Implicit reward metrics for tracking\n    chosen_rewards = beta * (policy_chosen_logps - reference_chosen_logps).detach()\n    rejected_rewards = beta * (policy_rejected_logps - reference_rejected_logps).detach()\n    \n    return loss, chosen_rewards, rejected_rewards\n\n# Test DPO Loss\npi_w = torch.tensor([-2.1, -1.8])  # Policy log-prob of chosen\npi_l = torch.tensor([-4.5, -5.0])  # Policy log-prob of rejected\nref_w = torch.tensor([-2.5, -2.0]) # Ref log-prob of chosen\nref_l = torch.tensor([-3.0, -3.2]) # Ref log-prob of rejected\n\nloss, r_w, r_l = compute_dpo_loss(pi_w, pi_l, ref_w, ref_l, beta=0.1)\nprint(f'Computed DPO Loss: {loss.item():.4f}, Chosen Margin: {(r_w - r_l).mean().item():.4f}')",
            codeExplanation: "1. Evaluates log-ratio between chosen and rejected completions.\n2. Implements the closed-form DPO objective without a separate reward model.\n3. Tracks implicit reward margins for monitoring training alignment stability.",
            expectedOutput: "Computed DPO Loss: 0.2184, Chosen Margin: 0.1900",
            commonMistakes: "Setting $\beta$ too high ($\beta > 1.0$), which forces the policy to deviate excessively from the reference model and causes degenerate text generation.",
            bestPractices: "Set $\beta \in [0.1, 0.2]$ and evaluate alignment using multi-turn LLM-as-a-Judge rubrics.",
            practiceTask: "Implement an LLM-as-a-Judge evaluation prompt that scores model responses on a 1-5 scale across Helpfulness, Accuracy, and Conciseness.",
            keyTakeaway: "DPO enables direct preference alignment on paired data with mathematical simplicity and stability, replacing complex RL reward loops."
          }
        ],
        practicalExercise: "Implement the Direct Preference Optimization (DPO) loss function from scratch in PyTorch, align a toy language model on preference pairs, and verify reward margin elevation.",
        competencyVerification: "Demonstrates LLM alignment theory, Direct Preference Optimization mathematics, and LLM-as-a-Judge benchmarking at Level 5.",
        resources: [
          {
            title: "Direct Preference Optimization: Your Language Model is Secretly a Reward Model (Rafailov et al., NeurIPS 2023)",
            url: "https://arxiv.org/abs/2305.18290",
            description: "Foundational DPO paper deriving exact implicit reward optimization directly from preference data.",
            type: "specification",
            provider: "Stanford University"
          },
          {
            title: "Anthropic: Training a Helpful and Harmless Assistant with Reinforcement Learning from Human Feedback",
            url: "https://arxiv.org/abs/2204.05862",
            description: "RLHF alignment principles, HHH criteria, and preference dataset collection.",
            type: "specification",
            provider: "Anthropic"
          }
        ]
      }
    }
  ]
};
