---
name: mlops-patterns
description: "MLOps: Model deployment, monitoring, drift detection, CI/CD for ML." 
triggers:
  extensions: [".py"]
  directories: ["ml/", "models/", "training/"]
  keywords: ["mlops", "model serving", "inference", "drift", "monitoring", "kubeflow", "mlflow", "weights biases"]
auto_load_when: "Deploying ML models or setting up ML pipelines"
agent: ai-engineer
tools: ["Read", "Write", "Bash"]
---

# MLOps Patterns

**Focus:** Model deployment, monitoring, lifecycle management

## 1. Model Serving Patterns

```
When to use what:
├── Simple inference → Model as API (FastAPI/Flask)
│   └── Quick to deploy, good for low traffic
│
├── High scale → Model server (TorchServe, TensorFlow Serving)
│   └── Batching, GPU support, multi-model
│
├── Cloud-native → Managed services
│   └── SageMaker, Vertex AI, Azure ML
│
├── Edge/Embedded → ONNX + lightweight runtime
│   └── Mobile, IoT, low latency
│
└── Serverless → Lambda/Cloud Functions
    └── Pay per request, auto-scale
```

---

## 2. Model Deployment Strategies

```
Deployment patterns:
├── Blue-green deployment
│   ├── Deploy new model alongside old
│   ├── Test new in staging
│   └── Switch traffic atomically
│   └── Fast rollback if issues
│
├── Canary deployment
│   ├── Gradual traffic shift (1% → 10% → 100%)
│   └── Monitor metrics at each stage
│   └── Automatic rollback on degradation
│
├── Shadow mode
│   ├── New model runs in parallel, no traffic
│   └── Compare outputs to current model
│   └── Zero risk, full evaluation before switch
│
└── A/B testing
    └── Split traffic by user segment
    └── Measure business metrics per variant
```

---

## 3. Monitoring & Observability

```
What to monitor:
├── Model metrics
│   ├── Prediction accuracy (if ground truth available)
│   ├── Latency (p50, p95, p99)
│   └── Throughput (requests/second)
│
├── Data metrics
│   ├── Input distribution (detect drift)
│   ├── Missing values, outliers
│   └── Feature statistics over time
│
├── Business metrics
│   ├── Click-through rate on recommendations
│   ├── Conversion rate on predictions
│   └── User satisfaction scores
│
└── System metrics
    ├── CPU, GPU utilization
    └── Memory, disk usage
```

---

## 4. Drift Detection

```
Drift types:
├── Concept drift
│   └── Target variable changes (spam detection: new patterns)
│   └── Monitor: prediction distribution change
│
├── Data drift
│   └── Input features change (user behavior shifts)
│   └── Monitor: feature distribution (KL divergence, PSI)
│
└── Model drift
    └── Combination of above
    └── Monitor: accuracy drops over time

Detection approach:
├── Statistical tests (chi-square, KS test)
├── Distance metrics (KL, Wasserstein)
├── Custom thresholds per feature
└── Alert when drift > threshold
```

---

## 5. CI/CD for ML

```
ML Pipeline stages:
├── Data validation
│   ├── Schema checks (types, ranges)
│   ├── Data quality (missing, outliers)
│   └── Fail pipeline if checks fail
│
├── Model training
│   ├── Version control data + code
│   ├── Log metrics (MLflow, Weights & Biases)
│   └── Artifacts stored in registry
│
├── Model evaluation
│   ├── Compare to baseline (current model)
│   ├── Business metrics, not just accuracy
│   └── Threshold for promotion
│
├── Model registry
│   ├── Versioned model storage
│   ├── Metadata (training data, metrics, hyperparameters)
│   └── Staging → Production promotion
│
└── Deployment
    ├── Automated (GitOps, ArgoCD)
    └── Rollback capability
```

---

## Key Patterns

1. **Model versioning** - Every model versioned, stored in registry
2. **Automated pipeline** - CI/CD for data → training → deploy
3. **Monitoring from day one** - Don't add observability later
4. **Rollback capability** - Always be able to revert
5. **Shadow deployment** - Test in production without risk

---

## Anti-Patterns

```
❌ Manual model deployment — no audit trail, not reproducible
✅ Automated CI/CD pipeline for all model changes

❌ No monitoring in production — issues found by users
✅ Instrument from day one, alert on anomalies

❌ Retraining on fixed schedule regardless of data changes
✅ Trigger retraining on drift detection or performance drop

❌ Storing models in random locations — no versioning, no lineage
✅ Use model registry (MLflow, SageMaker, etc.)

❌ Ignoring data drift — model degrades silently
✅ Monitor input distribution, alert on significant drift
```

---

## Quick Reference

| Task | Tool/Pattern | Note |
|---|---|---|
| Model serving | FastAPI, TorchServe, Triton | Simple to complex |
| Monitoring | Prometheus, Grafana | Custom dashboards |
| Drift detection | Evidently, Great Expectations | Statistical tests |
| Model registry | MLflow, SageMaker | Version + metadata |
| Pipeline | Airflow, Kubeflow, Dagster | Orchestration |
