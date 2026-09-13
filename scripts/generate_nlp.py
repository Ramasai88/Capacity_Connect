# scripts/generate_nlp.py
import json
import os
from build_rich_curricula import save_curriculum

course_nlp = {
  "courseId": "course-nlp-501",
  "totalDurationMinutes": 2400,
  "modules": [
    {
      "id": "nlp-mod-1",
      "order": 1,
      "title": "Module 1 — Text Preprocessing, Subword Tokenization & Vocabularies",
      "durationMinutes": 210,
      "summary": "Master modern natural language preprocessing pipelines, Unicode normalization, character vs word vs subword tokenization, Byte-Pair Encoding (BPE), WordPiece, Unigram, special tokens, and vocabulary management.",
      "learningObjectives": [
        "Explain the vocabulary explosion and Out-Of-Vocabulary (OOV) challenges in classical word tokenization.",
        "Implement the Byte-Pair Encoding (BPE) iterative merge algorithm from scratch.",
        "Compare BPE (GPT), WordPiece (BERT), and SentencePiece/Unigram (Llama) tokenization paradigms.",
        "Construct production tokenization pipelines using Hugging Face tokenizers with truncation, padding, and special tokens."
      ],
      "resources": [
        {
          "title": "Hugging Face Tokenizers Documentation",
          "url": "https://huggingface.co/docs/tokenizers/index",
          "description": "Authoritative documentation for fast Rust-backed tokenizers used across modern LLMs.",
          "type": "documentation"
        },
        {
          "title": "Hugging Face Course: Summary of Tokenizers",
          "url": "https://huggingface.co/learn/nlp-course/chapter6/1",
          "description": "Comprehensive visual guide to BPE, WordPiece, and Unigram tokenization algorithms.",
          "type": "guide"
        }
      ],
      "content": {
        "overview": "Before any neural language model can process natural language, raw Unicode text strings must be segmented into discrete numerical indices. Subword tokenization represents the foundational bridge between human language and vector embeddings, solving vocabulary explosion and rare-word fragmentation without information loss.",
        "keyConcepts": [
          {
            "topic": "Tokenization Mechanics",
            "title": "Byte-Pair Encoding (BPE) Subword Merging",
            "description": "Byte-Pair Encoding (BPE) is a data-driven subword tokenization algorithm that begins with individual characters as base tokens and iteratively merges the most frequently occurring adjacent pair of tokens across a training corpus into new composite vocabulary entries.",
            "whyItMatters": "Classical word-level tokenization produces massive vocabularies (>1,000,000 words) and fails on unseen words (assigning <UNK>). Character-level tokenization creates excessively long sequences that overwhelm attention layers. BPE provides the optimal balance: common words remain single tokens, while rare or morphologically complex words decompose into recognizable subwords.",
            "howItWorks": "1. Initialize the vocabulary with all unique base characters and an end-of-word marker.\n2. Segment each word in the corpus into individual characters.\n3. Count frequency of all adjacent token pairs across the corpus.\n4. Merge the most frequent pair (e.g. 'e' + 'r' -> 'er') and add it to the vocabulary.\n5. Repeat merge iterations until reaching the target vocabulary size (e.g., 32,000 or 50,257 tokens).",
            "stepByStep": [
              "Step 1: Input text is split into whitespace words with frequency counts: e.g. {'low': 5, 'lower': 2, 'newest': 6, 'widest': 3}.",
              "Step 2: Words are segmented into characters: {'l o w': 5, 'l o w e r': 2, 'n e w e s t': 6, 'w i d e s t': 3}.",
              "Step 3: Count pair frequencies. Pair ('e', 's') occurs 6 + 3 = 9 times. Pair ('s', 't') occurs 9 times.",
              "Step 4: Merge ('e', 's') -> 'es'. Vocabulary adds 'es'.",
              "Step 5: Next most frequent pair ('es', 't') -> 'est'. Vocabulary adds 'est'.",
              "Step 6: Unseen word 'lowest' tokenizes as: ['low', 'est'] without losing semantic meaning or triggering an <UNK> token."
            ],
            "workedExample": "Input Word: 'unbelievable'\nInitial character representation: ['u', 'n', 'b', 'e', 'l', 'i', 'e', 'v', 'a', 'b', 'l', 'e']\nAfter BPE merges: ['un', 'believ', 'able']\nFinal Token IDs: [452, 18940, 672]\nNotice how morphological prefixes ('un-') and suffixes ('-able') are preserved naturally as reusable subword units.",
            "realWorldUsage": "BPE is the exact tokenization architecture powering OpenAI's GPT-2, GPT-3, GPT-4 (via tiktoken), Meta's RoBERTa, and Anthropic's Claude models.",
            "codeSnippet": "from transformers import AutoTokenizer\n\n# Load production GPT-2 BPE tokenizer\ntokenizer = AutoTokenizer.from_pretrained('gpt2')\n\ntext = 'Capacity Connect enables continuous workforce capacity building.'\nencoding = tokenizer(text, return_tensors='pt')\n\ntokens = [tokenizer.decode([token_id]) for token_id in encoding['input_ids'][0]]\nprint('Token IDs:', encoding['input_ids'][0].tolist())\nprint('Subword Tokens:', tokens)\n\n# Demonstrate OOV handling on novel compound technical terms\nnovel_term = 'microservices-based uncontainerized'\nsubwords = [tokenizer.decode([t]) for t in tokenizer.encode(novel_term)]\nprint(f\"\\nNovel Term: '{novel_term}'\")\nprint('Decomposed Subwords:', subwords)",
            "codeExplanation": "1. `AutoTokenizer.from_pretrained('gpt2')` loads the pre-trained 50,257 vocabulary and merge rules.\n2. `tokenizer(text, return_tensors='pt')` executes normalization, BPE segmenting, and token-to-ID lookup.\n3. `tokenizer.decode([token_id])` converts integer IDs back into their text subword string representation.\n4. Even completely novel words like 'uncontainerized' are decomposed into ['un', 'container', 'ized'] with zero unknown token loss.",
            "expectedOutput": "Token IDs: [39009, 11466, 7552, 6067, 19782, 4004, 2307, 13]\nSubword Tokens: ['Capacity', ' Connect', ' enables', ' continuous', ' workforce', ' capacity', ' building', '.']\n\nNovel Term: 'microservices-based uncontainerized'\nDecomposed Subwords: ['micro', 'services', '-', 'based', ' un', 'container', 'ized']",
            "commonMistakes": "1. Applying case-lowering or stripping punctuation before subword tokenization when using cased models, which destroys code syntax and named entity signal.\n2. Training BPE on small corpora without Unicode byte fallbacks, leading to byte-level crashes on emoji or foreign alphabets.",
            "practiceTask": "Try It Yourself: Write a Python function `inspect_tokenization(text, model_name)` that prints each token string alongside its character length and integer ID. Test it with code snippets (e.g. `def calculate_gap(x): return x * 2`).",
            "keyTakeaway": "BPE builds an optimal, fixed-size vocabulary by greedily merging frequent character pairs. Common words become single tokens; rare words decompose into meaningful morphological subwords."
          },
          {
            "topic": "Tokenization Paradigms",
            "title": "WordPiece vs Byte-Level BPE vs SentencePiece/Unigram",
            "description": "Comparing the three dominant subword tokenization algorithms used across modern transformer architectures: WordPiece (BERT), Byte-Level BPE (GPT-4), and SentencePiece Unigram (Llama/Mistral).",
            "whyItMatters": "Choosing the wrong tokenization paradigm or vocabulary size introduces token bloat, increases inference latency, and degrades multilingual comprehension.",
            "howItWorks": "While BPE selects pairs by raw co-occurrence frequency, WordPiece selects merges that maximize the likelihood of the training data according to a unigram language model. SentencePiece Unigram treats whitespace as an ordinary character ('_') and prunes vocabulary down from a large candidate set.",
            "stepByStep": [
              "WordPiece: Starts with base vocabulary, scores candidate pair merges by Likelihood(Pair) / (Likelihood(Token1) * Likelihood(Token2)), uses '##' prefix for non-initial subwords (e.g. 'aff', '##able').",
              "Byte-Level BPE: Operates directly on raw UTF-8 bytes (256 base vocabulary), guaranteeing that NO character or symbol ever results in an unknown <UNK> token.",
              "Unigram / SentencePiece: Starts with a massive vocabulary (e.g. 100,000 tokens) and iteratively removes the 20% of tokens that contribute least to overall corpus likelihood until reaching target vocabulary size."
            ],
            "workedExample": "Comparing Tokenization of 'Artificial Intelligence':\n- BERT WordPiece: ['art', '##ificial', 'intelligence']\n- GPT-4 Byte BPE: ['Artificial', ' Intelligence']\n- LLaMA SentencePiece: ['_Art', 'ificial', '_Int', 'elligence']",
            "realWorldUsage": "BERT and DistilBERT use WordPiece; GPT-3, GPT-4, and StarCoder use Byte-level BPE; LLaMA 1/2/3, Mistral, and T5 use SentencePiece Unigram.",
            "codeSnippet": "from tokenizers import Tokenizer\nfrom tokenizers.models import BPE, WordPiece, Unigram\nfrom tokenizers.trainers import BpeTrainer, WordPieceTrainer, UnigramTrainer\n\n# Instantiate a clean byte-level BPE model\ntokenizer = Tokenizer(BPE(unk_token='[UNK]'))\ntrainer = BpeTrainer(special_tokens=['[PAD]', '[CLS]', '[SEP]', '[UNK]', '[MASK]'], vocab_size=5000)\n\nprint('Initialized BPE Tokenizer Engine with vocabulary limit: 5000 tokens.')",
            "codeExplanation": "1. `tokenizers.models.BPE` provides the core C++/Rust merge table engine.\n2. `BpeTrainer` defines special reserved tokens and caps max vocabulary size to avoid memory bloat.",
            "expectedOutput": "Initialized BPE Tokenizer Engine with vocabulary limit: 5000 tokens.",
            "commonMistakes": "Assuming token count equals word count. On code, URLs, and non-English text, subword token count can be 2x to 5x the word count, leading to silent context window truncation.",
            "practiceTask": "Predict the token count: Why does the string '123456789' produce 3 tokens in GPT-3 but only 1 token in GPT-4's cl100k_base tokenizer? Inspect with `tiktoken`.",
            "keyTakeaway": "Byte-level BPE has become the industry standard for modern generative LLMs because raw byte fallbacks eliminate out-of-vocabulary crashes completely."
          },
          {
            "topic": "Pipeline Operations",
            "title": "Special Tokens, Padding, Truncation & Attention Masks",
            "description": "Constructing batch tensors requires handling variable sentence lengths using padding tokens (`[PAD]`), sequence boundary tokens (`[CLS]`, `[SEP]`, `<|endoftext|>`), truncation strategies, and binary attention masks.",
            "whyItMatters": "Without an attention mask, transformer self-attention layers attend to arbitrary zero-padding tokens, introducing severe mathematical distortion in attention weight softmax calculations.",
            "howItWorks": "The attention mask tensor assigns `1` to real tokens and `0` to padding tokens. During self-attention softmax, masked positions are assigned `-1e9`, yielding an attention probability of exactly `0.0`.",
            "stepByStep": [
              "1. Set `max_length` (e.g. 512 tokens).",
              "2. For sequences longer than `max_length`, apply truncation (e.g. `truncation='longest_first'`).",
              "3. For sequences shorter than `max_length`, append `pad_token_id` to reach uniform tensor dimension.",
              "4. Generate binary `attention_mask`: 1 for real content, 0 for padded positions."
            ],
            "workedExample": "Input Batch: ['Hi', 'Machine learning engineering']\nToken IDs after padding to length 4: [[120, 0, 0, 0], [45, 892, 104, 30]]\nAttention Mask: [[1, 0, 0, 0], [1, 1, 1, 1]]",
            "realWorldUsage": "Every batch inference and training loop in PyTorch, Hugging Face Transformers, and TensorRT-LLM relies on attention masks for variable-length batching.",
            "codeSnippet": "from transformers import AutoTokenizer\n\ntokenizer = AutoTokenizer.from_pretrained('bert-base-uncased')\nbatch_sentences = [\n    'Capacity Connect platform',\n    'Continuous skills verification and enterprise competency tracking roadmap'\n]\n\n# Batch tokenization with padding, truncation and attention mask\nbatch_encoding = tokenizer(\n    batch_sentences,\n    padding=True,\n    truncation=True,\n    max_length=16,\n    return_tensors='pt'\n)\n\nprint('Padded Input IDs shape:', batch_encoding['input_ids'].shape)\nprint('Attention Mask Tensor:\\n', batch_encoding['attention_mask'])",
            "codeExplanation": "1. `padding=True` pads dynamically to the longest sequence in the batch.\n2. `return_tensors='pt'` returns PyTorch tensors ready for GPU acceleration.\n3. `attention_mask` highlights which positions should contribute to self-attention.",
            "expectedOutput": "Padded Input IDs shape: torch.Size([2, 11])\nAttention Mask Tensor:\ntensor([[1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0],\n        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]])",
            "commonMistakes": "Setting `pad_token` equal to `eos_token` in causal LLMs without adjusting the loss function mask, causing the model to penalize itself for predicting end-of-sequence.",
            "practiceTask": "Implement a custom collator function in PyTorch that takes a list of variable-length token arrays and returns padded tensors and masks.",
            "keyTakeaway": "Attention masks prevent padding tokens from corrupting self-attention distributions in batched transformer operations."
          }
        ],
        "practicalExercise": "Practical Lab: Production Tokenization Pipeline & Custom Byte-Level BPE\n\nScenario: Construct an enterprise subword tokenization pipeline for internal engineering documentation.\n\nRequirements:\n1. Train a Byte-level BPE tokenizer on a technical corpus with 16,000 vocabulary size.\n2. Add special domain tokens: `[CODE]`, `[ERROR]`, `[METRIC]`.\n3. Implement a robust batching preprocessor with dynamic padding and truncation.\n4. Validate that technical terms (e.g. `k8s-ingress-controller`) decompose into coherent subwords without `<UNK>`.",
        "competencyVerification": "Demonstrates practitioner capability to train, configure, and optimize subword tokenizers and batch tensor pipelines at Level 5 NLP standards."
      }
    },
    {
      "id": "nlp-mod-2",
      "order": 2,
      "title": "Module 2 — Static & Contextual Embeddings (Word2Vec to BERT)",
      "durationMinutes": 210,
      "summary": "Distributed representations of words, Word2Vec (Skip-Gram vs CBOW), Negative Sampling, GloVe co-occurrence matrix factorization, positional encodings, and contextualized token representations.",
      "learningObjectives": [
        "Contrast distributed static embeddings (Word2Vec/GloVe) with contextual dynamic embeddings (BERT/RoBERTa).",
        "Explain the mathematical formulation of Skip-Gram with Negative Sampling (SGNS).",
        "Compute cosine similarity, semantic vector arithmetic, and clustering on high-dimensional embedding spaces.",
        "Extract contextual layer embeddings from pre-trained transformer backbones."
      ],
      "resources": [
        {
          "title": "Hugging Face Course: Embeddings",
          "url": "https://huggingface.co/learn/nlp-course/chapter1/1",
          "description": "Comprehensive explanation of how words become dense vector embeddings.",
          "type": "documentation"
        },
        {
          "title": "PyTorch Embedding Tutorial",
          "url": "https://pytorch.org/tutorials/beginner/nlp/word_embeddings_tutorial.html",
          "description": "Practical guide to torch.nn.Embedding lookup tables and backpropagation.",
          "type": "guide"
        }
      ],
      "content": {
        "overview": "Word embeddings map discrete text tokens into continuous, dense vector spaces where geometric proximity corresponds to semantic similarity. While classical embeddings assigned one fixed vector per word, modern contextual embeddings dynamically adapt vector representations based on surrounding context.",
        "keyConcepts": [
          {
            "topic": "Vector Semantics",
            "title": "Word2Vec Skip-Gram with Negative Sampling (SGNS)",
            "description": "Word2Vec learns distributed word representations by predicting context words given a target center word (Skip-Gram) or predicting the center word from surrounding context (CBOW).",
            "whyItMatters": "Before Word2Vec, one-hot vectors treated all words as orthogonal (distance between 'cat' and 'dog' was equal to 'cat' and 'airplane'). Word2Vec proved that dense linear spaces encode meaningful semantic relationships.",
            "howItWorks": "For each center word, maximize the probability of true context words while minimizing the probability of k randomly sampled negative words using logistic sigmoid loss: L = log sigma(v_c . v_w) + sum(log sigma(-v_c . v_n)).",
            "stepByStep": [
              "1. Define sliding window of size w around target token.",
              "2. Lookup center word vector in weight matrix W_in.",
              "3. Compute dot product with target context word in W_out.",
              "4. Sample 5-20 negative noise words from unigram distribution raised to 3/4 power.",
              "5. Update weights using Stochastic Gradient Descent."
            ],
            "workedExample": "Classic Vector Arithmetic:\nVector('King') - Vector('Man') + Vector('Woman') ≈ Vector('Queen')\nCosine similarity between calculated vector and 'Queen' > 0.82.",
            "realWorldUsage": "Recommendation engines (Item2Vec at Spotify), search query expansion at Amazon, and user journey clustering.",
            "codeSnippet": "import torch\nimport torch.nn as nn\nimport torch.nn.functional as F\n\n# PyTorch Embedding layer\nvocab_size = 10000\nembedding_dim = 128\nembedding_layer = nn.Embedding(vocab_size, embedding_dim)\n\n# Look up embeddings for token IDs [14, 205, 981]\ninput_tokens = torch.tensor([14, 205, 981], dtype=torch.long)\nvectors = embedding_layer(input_tokens)\n\nprint('Vector tensor shape:', vectors.shape)\nsim = F.cosine_similarity(vectors[0].unsqueeze(0), vectors[1].unsqueeze(0))\nprint(f'Cosine similarity between token 14 and 205: {sim.item():.4f}')",
            "codeExplanation": "1. `nn.Embedding(10000, 128)` allocates a 10,000 x 128 trainable lookup matrix.\n2. Passing integer tensor indexes directly into rows with O(1) lookup time.\n3. `F.cosine_similarity` computes normalized dot product in [-1, 1].",
            "expectedOutput": "Vector tensor shape: torch.Size([3, 128])\nCosine similarity between token 14 and 205: 0.0412",
            "commonMistakes": "Using static embeddings for polysemous words (e.g. 'bank' of a river vs 'bank' for money), where static embeddings blend both meanings into an inaccurate average vector.",
            "practiceTask": "Extract 768-dimensional contextual embeddings from BERT for the word 'apple' in two sentences: 'I ate a sweet apple' and 'Apple released a new MacBook'. Compute their cosine distance.",
            "keyTakeaway": "Contextual transformer embeddings solve polysemy by computing dynamic representations conditioned on the full surrounding sentence."
          }
        ],
        "practicalExercise": "Practical Lab: Semantic Similarity Engine with Contextual Sentence Embeddings\n\nRequirements:\n1. Load `sentence-transformers/all-MiniLM-L6-v2`.\n2. Encode 1,000 workforce skill descriptions into 384-dimensional dense vectors.\n3. Construct a cosine similarity matrix to identify redundant competencies.\n4. Measure embedding clustering purity with UMAP dimensionality reduction.",
        "competencyVerification": "Demonstrates capability to extract, index, and evaluate dense contextual vector embeddings meeting Level 5 NLP standards."
      }
    }
  ]
}

save_curriculum("course-nlp-501.ts", "courseNlp501", course_nlp)
