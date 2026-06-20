---
name: search-patterns
description: "Search: Full-text search, Elasticsearch patterns, filters, and relevance tuning." 
triggers:
  keywords: ["search", "Elasticsearch", "Algolia", "full-text", "indexing", "relevance", "facets", "fuzzy"]
auto_load_when: "Implementing search functionality"
agent: architect
tools: ["Read", "Write", "Bash"]
---

# Search Patterns

**Focus:** Search implementation, query optimization, relevance

---

## 1. When to Use Search Engine

```
Use dedicated search engine when:

├── Full-text search needed
│   └── Fuzzy matching, synonyms
│   └── Partial matches, prefix search
│   └── Relevance ranking required
│
├── Complex filtering
│   └── Multiple faceted filters
│   └── Range queries, geo queries
│   └── Complex boolean logic
│
├── High-volume queries
│   && Many concurrent searches
│   && Sub-second response required
│   && Don't want to overload DB
│
└── Analytics on search
    └── Search suggestions
    && Popular queries
    └── Zero-result analysis
```

```
Stick with database when:
├── Exact matches only
├── Simple filters
├── Results fit in one query
└── Already have database infrastructure
```

---

## 2. Index Design

```
Index design patterns:

├── One index per entity type
    && Products, users, articles
    && Separate mappings
    && Different analyzers
│
├── Time-based indices
    && Logs, events, time-series
    && Delete old data by dropping index
    && Performance: smaller indices
│
└── Parent-child (rarely)
    && When updates to parent rare
    && When child queries independent
    └── Avoid: high join cost
```

---

## 3. Query Patterns

```
When to use query type:

├── Match query
    └── Full-text search
    && Fuzziness, slop
    && Use for: search box
│
├── Term query
    └── Exact value
    && No analysis
    && Use for: filters, exact match
│
├── Bool query
    && Multiple conditions
    && Must, should, must_not, filter
    && Use for: complex searches
│
├── Range query
    └── Numeric/date ranges
    && gte, lte, gt, lt
    && Use for: filters, faceted search
│
└── Prefix/wildcard
    && Prefix matching
    && Performance: slower than term
    && Use for: autocomplete
```

---

## 4. Filters vs Queries

```
When to use filters:

├── Filters (cached)
    && Boolean conditions
    && No scoring needed
    && Fast, cached automatically
    && Examples: category, status, date range
│
└── Queries (not cached)
    && Full-text relevance
    && Scoring matters
    && Examples: search text, title match
```

---

## 5. Performance Optimization

```
How to optimize search:

├── Limit returned fields
    && _source: include/exclude
    && Reduces network transfer
    && Use when: don't need all fields
│
├── Pagination
    && Use: from/size (shallow)
    && Deep pagination: search_after
    && Avoid: offset > 10k
│
├── Aggregations
    && Faceted search
    && Pre-computed at query time
    && Group by filters
│
└── Optimize text fields
    && norms: false (if no relevance needed)
    && index: false (if not searchable)
    && use keyword for sorting
```

---

## Key Patterns

1. **Index design first** — Think about query patterns upfront
2. **Filters for boolean, queries for relevance** — Separate concerns
3. **Denormalize** — Store related data together, avoid joins
4. **Reindex strategy** — Plan for reindexing (new index, alias swap)
5. **Relevance tuning** — Use function_score, boost specific fields

---

## Anti-Patterns

```
❌ LIKE '%query%' on large tables (full scan)
✅ Full-text search index: PostgreSQL tsvector or Elasticsearch

❌ Re-indexing entire dataset on every document update
✅ Incremental indexing — queue updates to search index

❌ Returning raw search scores without relevance tuning
✅ Boost by recency, popularity, and field weight

❌ No search analytics — unknown what users can't find
✅ Log zero-result queries and click-through rate

❌ Typos breaking search entirely
✅ Fuzzy matching with configurable edit distance
```

---

## Quick Reference

| Scale | Solution | Note |
|---|---|---|
| Small (<100k docs) | PostgreSQL FTS | Built-in, no extra infra |
| Medium | Typesense / Meilisearch | Self-hosted, fast |
| Large | Elasticsearch / OpenSearch | Complex, powerful |
| Hosted | Algolia | SaaS, fast setup |
| Vector search | pgvector / Pinecone | Semantic / AI search |
