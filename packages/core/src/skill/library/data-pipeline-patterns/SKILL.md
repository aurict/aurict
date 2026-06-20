---
name: data-pipeline-patterns
description: "Data Pipeline Patterns: Data processing workflows, batch and stream processing, pipeline orchestration, pandas, dask, spark." 
triggers:
  extensions: [".py", ".scala", ".java", ".sql"]
  directories: ["pipeline/", "transform/", "data-engineering/", "spark/", "dask/"]
  keywords: ["pipeline", "data pipeline", "pandas", "dask", "spark", "hadoop", "processing", "batch", "transform"]
auto_load_when: "Building data pipelines or processing large datasets"
agent: data-engineer
tools: ["Read", "Write", "Bash"]
---

# Data Pipeline Patterns

**Focus:** Designing robust, scalable, and maintainable data processing pipelines.

## 1. Pipeline Architectures

```
Architecture Styles:
├── Batch Processing
│   ├── Periodic processing of data in large chunks
│   ├── Use for: daily reports, historical analysis
│   └── Tools: Spark Batch, dbt, Pandas
│
├── Stream Processing
│   ├── Continuous processing of data as it arrives
│   ├── Use for: real-time alerts, live dashboards
│   └── Tools: Spark Streaming, Flink, Kafka Streams
│
└── Lambda Architecture
    ├── Batch layer (historical accuracy) + Speed layer (real-time)
    ├── Complex to maintain but robust
    └── Merged in a serving layer
```

---

## 2. Processing Frameworks

```
Framework Selection:
├── Pandas (Small/Medium Data)
│   ├── Single-node, memory-bound
│   ├── Excellent for EDA and simple transforms
│   └── Use: data < 1/4 of system RAM
│
├── Dask (Medium/Large Data)
│   ├── Distributed Pandas/NumPy
│   ├── Scales from laptop to cluster
│   └── Use: data > RAM, but still Python-centric
│
└── Apache Spark (Large Data)
    ├── Industry standard for distributed processing
    ├── JVM-based (PySpark for Python)
    └── Use: multi-terabyte datasets, complex joins
```

---

## 3. Transformation Patterns

```
Transformation logic:
├── Map/Reduce
│   ├── Map: apply function to each element
│   └── Reduce: aggregate elements together
│
├── Join Patterns
│   ├── Broadcast Join (small table + large table)
│   ├── Shuffle Hash Join (large + large)
│   └── Handling skew (salting keys)
│
├── Windowing
│   ├── Fixed windows (every 5 mins)
│   ├── Sliding windows (last 10 mins, every 1 min)
│   └── Session windows (based on activity)
│
└── Partitioning
    ├── Hive-style (year=2024/month=05/day=04)
    ├── Bucketing (hash-based distribution)
    └── Coalesce vs Repartition
```

---

## 4. Pipeline Reliability

```
Ensuring Data Integrity:
├── Idempotency
│   └── Rerunning the pipeline produces the same result
│   └── Use: overwrite partitions, not append
│
├── Checkpointing
│   └── Save progress to resume after failure
│
├── Dead Letter Queues (DLQ)
│   └── Store malformed data for manual inspection
│
└── Data Lineage
    └── Track where data came from and how it changed
```

---

## 5. Storage Formats

```
Columnar vs Row-based:
├── Parquet (Columnar) - Standard for OLAP
│   ├── High compression, efficient column reads
│   └── Schema embedded in file
│
├── Avro (Row-based) - Standard for Streaming
│   ├── Fast writes, schema evolution
│   └── Compact binary format
│
└── Delta / Iceberg / Hudi
    ├── ACID transactions on data lakes
    ├── Time travel (query historical versions)
    └── Schema enforcement and evolution
```

---

## Key Patterns

1. **Schema Enforcement** - Validate data against a schema at the entry point.
2. **Stateless Transformations** - Aim for pure functions to make testing and scaling easier.
3. **Lazy Evaluation** - Understand when computation actually happens (Spark/Dask).
4. **Data Quality Checks** - Use `Great Expectations` or custom validators between stages.
5. **Backfill Strategy** - Have a plan for re-processing historical data when logic changes.

---

## Anti-Patterns

```
❌ Loading everything into memory — OOM (Out of Memory) errors
✅ Use streaming or chunked processing (Pandas chunksize, Dask, Spark)

❌ Hardcoding paths and credentials
✅ Use environment variables and configuration files

❌ Missing monitoring — pipeline "succeeds" but produces no data
✅ Alert on empty outputs or unexpected record counts

❌ Using row-based formats (CSV/JSON) for large analytics
✅ Use Parquet or ORC for faster queries and lower storage costs

❌ No separation between raw, silver, and gold zones
✅ Follow the Medallion Architecture (Raw → Cleansed → Aggregated)
```

---

## Quick Reference

| Tool | Type | Best For |
|---|---|---|
| Pandas | Batch | Small datasets, fast prototyping |
| Spark | Both | Large scale, enterprise pipelines |
| Dask | Both | Python-native scaling |
| Parquet | Storage | Analytical queries (OLAP) |
| Delta Lake | Storage | Reliable data lakes with ACID |
