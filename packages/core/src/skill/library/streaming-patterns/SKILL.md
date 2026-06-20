---
name: streaming-patterns
description: "Streaming Patterns: Real-time pipelines, Kafka, Apache Flink, windowing, exactly-once." 
triggers:
  extensions: [".py", ".java", ".sql"]
  directories: ["streaming/", "kafka/", "flink/"]
  keywords: ["kafka", "streaming", "flink", "kinesis", "pubsub", "stream", "real-time", "kstreams", "ksql"]
auto_load_when: "Building real-time data pipelines or streaming systems"
agent: data-engineer
tools: ["Read", "Write", "Bash"]
---

# Streaming Architecture Patterns

**Focus:** Real-time processing, event streaming, windowing

## 1. Message Broker Selection

```
When to use what:
├── Kafka (Confluent, AWS MSK)
│   ├── High throughput, durable
│   ├── Exact ordering within partition
│   └── Large scale (>10K events/sec)
│
├── AWS Kinesis
│   ├── Managed, no ops
│   ├── Simpler than Kafka
│   └── Good for AWS-native
│
├── Google Pub/Sub
│   ├── GCP-native, global
│   └── Managed, auto-scaling
│   └── At-least-once delivery
│
├── RabbitMQ
│   ├── Complex routing (topics, exchanges)
│   └── Lower throughput OK
│   └── Not for high-scale streaming
│
└── Redis Streams
    └── Low latency, small scale
    └── Consumer groups supported
```

---

## 2. Kafka Patterns

```
Kafka Patterns:
├── Topic Design
│   ├── By entity (orders, users)
│   ├── By purpose (raw, processed)
│   └── Partition by customer_id or user_id
│
├── Consumer Groups
│   ├── Multiple consumers share partitions
│   └── Scale horizontally
│   └── Same group = coordinated consumption
│
├── Exactly-once Semantics
│   ├── Idempotent producer (enable.idempotence)
│   ├── Transactional producer + consumer
│   └── Use for critical data
│
├── Partition Strategy
│   ├── Key-based for ordering
│   └── Round-robin for distribution
│
└── Retention
    └── 7 days default, adjust by use case
    └── Compact for key-value data
```

---

## 3. Stream Processing Patterns

```
Processing Patterns:
├── Stateless
│   ├── Map/filter each event
│   ├── No state between events
│   └── Example: filter, enrich, transform
│
├── Stateful
│   ├── Aggregations over windows
│   └── Example: count, sum, running total
│   └── Need state store
│
├── Windowing
│   ├── Tumbling (fixed, non-overlapping)
│   ├── Sliding (overlapping)
│   └── Session (activity-based)
│
├── Joins
│   ├── Stream-stream (time-bounded)
│   ├── Stream-table (lookup)
│   └── Table-table (maintain materialized view)
│
└── Exactly-once end-to-end
    └── Source (CDC) → Kafka → Sink (DB)
    └── Transactional producers/consumers
```

---

## 4. Event Time vs Processing Time

```
Time Handling:
├── Event Time (when it happened)
│   └── Timestamp in the event itself
│   └── Watermark for late data
│
├── Processing Time (when processed)
│   └── Simpler, no late data
│   └── But loses temporal context
│
└── Handling Late Data
    ├── Allow lateness (within window)
    └── Watermark: "no more events after X"
    └── Drop or side-output late events

Example:
```sql
SELECT window_start, count(*)
FROM TUMBLE(event_time, INTERVAL '1' MINUTE)
GROUP BY window_start
```
```

---

## 5. Streaming Integrations

```
Common Integrations:
├── CDC to Kafka
│   ├── Debezium for PostgreSQL, MySQL, MongoDB
│   └── Change stream → Kafka topic
│
├── Kafka to Data Lake
│   ├── Kafka Connect to S3/GCS (CSV, Parquet)
│   └── Schema registry for compatibility
│
├── Kafka to Database
│   ├── Kafka Connect for JDBC sinks
│   └── ksqlDB for materialized views
│
└── Kafka to Real-time
    └── Kafka Streams for stream processing
    └── Flink for complex analytics
```

---

## Key Patterns

1. **Partition by key** - For ordering guarantee
2. **Exactly-once** - Only when needed (costly)
3. **Watermarks** - Handle late data gracefully
4. **Idempotent consumers** - Handle duplicate messages
5. **Backpressure** - Handle slow consumers with scaling

---

## Anti-Patterns

```
❌ No partitioning strategy — random distribution
✅ Partition by business key (user_id, order_id)

❌ Too many topics — too many consumers to manage
✅ Few broad topics > many narrow topics

❌ No schema evolution — breaking changes in producers
✅ Schema registry, backward compatibility

❌ Consumer lag not monitored — falling behind silently
✅ Monitor consumer lag, alert on backlog

❌ Synchronous processing — blocks entire stream
✅ Async processing, handle backpressure
```

---

## Quick Reference

| Pattern | Implementation | Tool |
|---|---|---|
| Pub/Sub | Event streaming | Kafka, Kinesis, Pub/Sub |
| Exactly-once | Idempotent + transaction | Kafka |
| Windowing | Time-based aggregation | Flink, ksqlDB |
| CDC | Change data capture | Debezium |
| Stream-table | Lookup materialized view | ksqlDB |
| Enrichment | Join stream with database | Kafka Streams |
