---
name: etl-patterns
description: "ETL Patterns: Extract, Transform, Load, data quality, schema evolution, incremental loads." 
triggers:
  extensions: [".py", ".sql"]
  directories: ["etl/", "pipeline/", "transform/"]
  keywords: ["etl", "extract", "transform", "load", "data pipeline", "airflow", "dbt", "elt", "dag"]
auto_load_when: "Building data pipelines or ETL workflows"
agent: data-engineer
tools: ["Read", "Write", "Bash"]
---

# ETL Architecture Patterns

**Focus:** Data movement, transformation, quality

## 1. ETL vs ELT

```
When to use what:
├── ETL (Extract → Transform → Load)
│   ├── Source data is small
│   ├── Transformation is complex
│   ├── Target is different system
│   └── Data privacy (transform before store)
│
├── ELT (Extract → Load → Transform)
│   ├── Target is data warehouse (Snowflake/BigQuery)
│   ├── Transform in warehouse is faster
│   └── Source is large (no point extracting)
│
└── CDC (Change Data Capture)
    ├── Ongoing sync from DB
    ├── Debezium, Fivetran, Airbyte
    └── Incremental, not full refresh
```

---

## 2. Data Extraction Patterns

```
Extraction Strategies:
├── Full Extraction
│   └── Load entire table
│   └── Use for: small tables, initial load
│
├── Incremental Extraction
│   ├── Only new/modified records
│   ├── Use: watermark column (created_at, updated_at)
│   └── Use: Change Data Capture (CDC)
│
├── Log-based CDC
│   ├── Read database redo/wal logs
│   └── Debezium for PostgreSQL/MySQL
│   └── No impact on source DB
│
└── API-based
    ├── Pagination for large APIs
    └── Rate limit handling
    └── Backoff on errors
```

---

## 3. Transformation Patterns

```
Transformation Patterns:
├── Schema Transformation
│   ├── Map source schema → target schema
│   ├── Rename columns
│   └── Type conversion
│
├── Data Cleansing
│   ├── Handle nulls (coalesce, default)
│   ├── Deduplicate (primary key)
│   └── Validate (regex, ranges)
│
├── Aggregation
│   ├── Daily/hourly rollups
│   ├── Window functions for running totals
│   └── Group by for summaries
│
├── Enrichment
│   ├── Join with lookup tables
│   ├── Geo lookup (lat/lon → country)
│   └── Business logic
│
└── Advanced
    ├── PII masking (hash, redact)
    └── Slowly changing dimensions (SCD Type 2)
```

---

## 4. Data Quality Patterns

```
Quality Checks:
├── Schema Validation
│   ├── Column types match expected
│   └── Required fields present
│
├── Range Checks
│   ├── Values within valid ranges
│   └── Outlier detection
│
├── Uniqueness
│   ├── Primary key uniqueness
│   └── No duplicate records
│
├── Referential Integrity
│   ├── Foreign keys valid
│   └── Lookup table consistency
│
└── Distribution Checks
    ├── Compare to historical
    └── Detect data drift

Handling bad data:
├── Quarantine in separate table
├── Alert on quality issues
└── Block pipeline on critical failures
```

---

## 5. Orchestration Patterns

```
Orchestration Patterns:
├── DAG-based (Airflow, Dagster)
│   ├── Directed acyclic graph
│   ├── Dependencies explicit
│   └── Retries on failure
│
├── Task-based (Prefect)
│   ├── Flow-based, less rigid
│   └── Dynamic task graph
│
├── dbt for transformations
│   ├── SQL-based transforms
│   ├── Testing built-in
│   └── Documentation generation
│
└── Event-triggered
    ├── Pipeline triggered on data arrival
    └── Cloud Functions + Cloud Storage
```

---

## Key Patterns

1. **Incremental over full** - Process only changes, not all data
2. **Idempotent** - Rerun doesn't cause duplicates
3. **Schema on read** - Keep raw, transform later
4. **Data quality gates** - Fail fast on bad data
5. **Observability** - Track lineage, quality metrics

---

## Anti-Patterns

```
❌ No data quality checks — bad data in warehouse
✅ Add assertions, alert on failures

❌ Full table reload — expensive, slow
✅ Incremental loads with watermarks

❌ No error handling — pipeline fails silently
✅ Retry logic, dead letter queue, alerting

❌ Tight coupling — pipeline depends on source API
✅ Abstract source, handle changes gracefully

❌ No schema evolution handling — breaks on new columns
✅ Schema compatibility checks, backward compatibility
```

---

## Quick Reference

| Pattern | Tool | Use Case |
|---|---|---|
| ETL | Airflow, Prefect | Complex transforms |
| ELT | dbt | Warehouse transforms |
| CDC | Debezium, Fivetran | DB sync |
| Testing | Great Expectations | Data quality |
| Scheduling | Cron, Cloud Scheduler | Periodic runs |
