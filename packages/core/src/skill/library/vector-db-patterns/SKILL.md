---
name: vector-db-patterns
description: "Vector Database: Embedding storage, semantic search, similarity metrics, RAG architectures." 
triggers:
  extensions: [".py", ".ts"]
  directories: ["vector/", "embeddings/", "rag/"]
  keywords: ["vector", "embedding", "pinecone", "chroma", "weaviate", "milvus", "qdrant", "pgvector", "faiss", "semantic search"]
auto_load_when: "Building RAG systems or semantic search features"
agent: ai-engineer
tools: ["Read", "Write", "Bash"]
---

# Vector Database Patterns

**Focus:** Embedding storage, semantic search, similarity, RAG

## 1. Vector Database Selection

```
Which vector DB to use?
├── Scale: Small (<100K vectors) → Chroma, in-memory
├── Scale: Medium (100K-10M) → Pinecone, Weaviate, Qdrant
├── Scale: Large (10M+) → Milvus, Elasticsearch
│
├── Infrastructure:
│   ├── Cloud-native → Pinecone, Elasticsearch
│   ├── Self-hosted → Weaviate, Qdrant, Milvus
│   └── PostgreSQL extension → pgvector (if already using PG)
│
├── Features needed:
│   ├── Hybrid search (vector + keyword) → Weaviate, Elasticsearch
│   ├── Multi-tenancy → Pinecone, Milvus
│   └── Time-based filtering → Most support
│
└── Cost: Open source (Weaviate, Qdrant, pgvector) vs Managed (Pinecone)
```

---

## 2. Embedding Strategy

```
Embedding Pipeline:
├── Text preprocessing
│   ├── Chunking strategy (fixed size, sentence, recursive)
│   ├── Chunk size: 256-512 tokens for semantic search
│   └── Overlap: 10-20% to preserve context
│
├── Embedding model selection
│   ├── General purpose → text-embedding-3-small, bge-small
│   ├── Code → codellama, codex
│   └── Multilingual → bge-m3, multilingual-e5
│
├── Batch processing
│   ├── Batch size: 100-1000 for efficiency
│   ├── Async processing for large datasets
│   └── Progress tracking for long jobs
│
└── Storage
    ├── Store raw text + embeddings
    ├── Metadata for filtering
    └── Original source for citation
```

---

## 3. Search Implementation

```
Semantic Search Flow:
├── Query preprocessing
│   ├── Same embedding model as indexing
│   ├── Clean, truncate if needed
│   └── (Optional) Query expansion
│
├── Vector search
│   ├── Top-K retrieval (k=3-10 for RAG)
│   ├── Similarity metric: Cosine (default), Dot, Euclidean
│   └── (Optional) Filtering by metadata
│
├── Reranking (optional but recommended)
│   ├── Cross-encoder reranking for accuracy
│   └── Re-rank top 20 to top 5
│
└── Post-processing
    ├── Extract source documents
    └── Format for LLM context
```

---

## 4. RAG Architecture Patterns

```
RAG Variants:
├── Naive RAG
│   └── Retrieve → Pass directly to LLM
│   └── Simple but can retrieve irrelevant docs
│
├── Advanced RAG
│   ├── Query preprocessing (rewriting, expansion)
│   ├── Chunking optimization
│   ├── Hybrid search (vector + keyword)
│   └── Reranking
│
├── Modular RAG
│   ├── Routing (choose data source based on query)
│   ├── Fusion (combine multiple retrievers)
│   └── Memory (store conversation context)
│
└── Agentic RAG (LangChain/LlamaIndex agents)
    ├── Multi-step retrieval
    ├── Tool use (web search + DB)
    └── Iteration until answer found
```

---

## Key Patterns

1. **Chunk strategically** - Fixed size with overlap, optimize for semantic units
2. **Hybrid search** - Vector + keyword (BM25) for better recall
3. **Rerank** - Cross-encoder for top results
4. **Metadata filtering** - Filter by date, source, category
5. **Cache embeddings** - Don't re-embed same text

---

## Anti-Patterns

```
❌ Using wrong chunk size — too small loses context, too large adds noise
✅ Experiment with 256-1024 tokens, measure recall

❌ No metadata filtering — searching everything for every query
✅ Add filters (date, source, category) to reduce search space

❌ Same embedding model for all — code needs code model, text needs text model
✅ Choose model based on content type

❌ Storing only vectors — losing original text for citations
✅ Store original text + metadata alongside vector

❌ No fallback — search fails silently
✅ Fallback to keyword search or cached results
```

---

## Quick Reference

| Task | Solution | Note |
|---|---|---|
| Semantic search | Vector similarity (cosine) | Top-K retrieval |
| Hybrid search | Vector + BM25 | Weaviate, Elasticsearch |
| Reranking | Cross-encoder | Re-rank top-20 to top-5 |
| Filtering | Metadata + vector | Combine in query |
| Scaling | Sharding + replication | DB-specific |
| Cost optimization | Quantization | FP16 → INT8 → binary |
