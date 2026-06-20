---
name: gcp-patterns
description: "GCP Patterns: Cloud Functions, Cloud Run, BigQuery, Pub/Sub, GKE, serverless data." 
triggers:
  extensions: [".py", ".ts", ".yaml"]
  directories: ["gcp/", "infrastructure/"]
  keywords: ["gcp", "google cloud", "cloud functions", "cloud run", "bigquery", "pubsub", "gke", "dataflow", "cloud build"]
auto_load_when: "Building on Google Cloud or designing serverless architectures"
agent: cloud-architect
tools: ["Read", "Write", "Bash"]
---

# GCP Architecture Patterns

**Focus:** Serverless, data analytics, managed services

## 1. Compute Selection

```
When to use what:
├── Cloud Functions (2nd gen)
│   ├── Event-driven, HTTP, scheduled
│   ├── V2: longer timeout (60→9h), more memory (4GB→32GB)
│   └── Pay per invocation + compute time
│
├── Cloud Run
│   ├── Container-based, HTTP services
│   ├── Any language, any framework
│   ├── Auto-scales to 0, scales to 1000+ replicas
│   └── Pay per request (100ms minimum)
│
├── GKE (Kubernetes)
│   ├── Complex orchestration
│   ├── Multi-service architecture
│   └── Full Kubernetes ecosystem
│
└── Compute Engine
│   ├── Legacy, specific hardware
│   └── VMs with full control
```

---

## 2. Serverless Data Patterns

```
GCP Data Services:
├── BigQuery
│   ├── Serverless data warehouse
│   ├── Petabyte scale, pay per query
│   └── ML with BigQuery ML
│
├── Dataflow
│   ├── Unified batch/streaming
│   ├── Apache Beam-based
│   └── Auto-scaling, no cluster management
│
├── Pub/Sub
│   ├── Real-time messaging
│   ├── Global (publish once, subscribe regionally)
│   └── At-least-once delivery
│
├── Dataproc
│   ├── Spark/Hadoop clusters
│   ├── On-demand, auto-scales
│   └── Batch processing
│
└── Cloud Storage
    ├── Object storage, multiple classes
    └── Lifecycle policies, uniform buckets
```

---

## 3. Serverless ML

```
GCP AI/ML:
├── Vertex AI
│   ├── End-to-end ML platform
│   ├── AutoML for quick start
│   └── Custom training with distributed
│
├── Prediction endpoints
│   ├── Real-time prediction (online)
│   ├── Batch prediction (offline)
│   └── Vertex AI endpoints (managed)
│
├── Feature Store
│   ├── Centralized feature registry
│   ├── Online/offline serving
│   └── Feature sharing across models
│
└── Model Registry
    ├── Version control for models
    ├── A/B testing, canary deployment
    └── Audit trail
```

---

## 4. Networking & API

```
GCP Networking:
├── API Gateway
│   ├── Serverless API management
│   ├── Rate limiting, authentication
│   └── Integrates with Cloud Functions/Run
│
├── Cloud Load Balancing
│   ├── Global HTTP(S) load balancer
│   ├── SSL termination, CDN
│   └── Traffic management (routing rules)
│
├── VPC
│   ├── Shared VPC for organization
│   ├── Private Google Access
│   └── VPC flow logs
│
└── Cloud CDN
    ├── Global CDN
    └── Signed URLs/cookies for private content
```

---

## 5. Infrastructure as Code

```
IaC in GCP:
├── Deployment Manager
│   ├── GCP native, YAML-based
│   └── Good for simple stacks
│
├── Terraform (recommended)
│   ├── Multi-cloud, large ecosystem
│   └── Official Google provider
│
└── Config Connector
    ├── Kubernetes-style for GKE
    └── Manage GCP resources via K8s API
```

---

## Key Patterns

1. **Serverless by default** - Cloud Functions → Cloud Run → GKE
2. **Data-first** - BigQuery as data platform
3. **Managed services** - Prefer managed over self-hosted
4. **Multi-region** - Global services, regional deployment
5. **Cloud Armor** - Security at edge

---

## Anti-Patterns

```
❌ Using Compute Engine for everything
✅ Serverless (Functions/Run) for most workloads

❌ No VPC for serverless services
✅ Serverless VPC Access Connector for private networking

❌ Not using Cloud CDN
✅ Enable for all static assets

❌ No API management
✅ API Gateway or Apigee for production APIs

❌ Ignoring BigQuery
✅ It's serverless, cheap, use for analytics unless specific reason not to
```

---

## Quick Reference

| Service | Use Case | Key Feature |
|---|---|---|
| Cloud Functions | Event-driven | Pay per invoke |
| Cloud Run | Container services | Any language |
| BigQuery | Data warehouse | Serverless SQL |
| Pub/Sub | Messaging | Global |
| GKE | Kubernetes | Managed K8s |
| Cloud Storage | Object storage | Classes |
| Vertex AI | ML platform | AutoML |
| Cloud CDN | CDN | Global |
