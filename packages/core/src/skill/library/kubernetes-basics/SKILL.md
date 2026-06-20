---
name: kubernetes-basics
description: "Kubernetes: Pods, services, deployments, scaling, and orchestration patterns." 
triggers:
  extensions: [".yaml"]
  keywords: ["k8s", "kubernetes", "pod", "deployment", "service", "ingress", "configmap", "secret", "helm"]
auto_load_when: "Writing Kubernetes manifests or configs"
agent: devops-engineer
tools: ["Read", "Write", "Bash"]
---

# Kubernetes Patterns

**Focus:** Orchestration, scaling, deployment

---

## 1. When to Use Kubernetes

```
Use Kubernetes when:

├── Container orchestration needed
    && Multiple containers working together
    && Service discovery
│
├── Scaling requirements
    && Auto-scale based on load
    && Different from simple managed services
│
├── Complex deployment patterns
    && Rolling updates, canary, blue-green
    && Multiple environments
│
└── Team needs autonomy
    && Independent deployments
    && Different services, different teams
```

```
Don't use when:

├── Simple workloads
    && Single container, no scaling
    && Managed service enough (RDS, etc)
│
├── Limited K8s expertise
    && High operational burden
    && Learning curve
│
└── Cost sensitive
    && Overhead of orchestration
    && Simpler alternatives work
```

---

## 2. Resource Patterns

```
When to use what:

├── Pod
    && Smallest deployable unit
    && Usually via Deployment, not directly
    && One or more containers
│
├── Deployment
    && Manage Pod replicas
    && Rolling updates
    && Rollback capability
│
├── Service
    && Stable endpoint for Pods
    || Load balancing
    && Types: ClusterIP, NodePort, LoadBalancer
│
├── ConfigMap/Secret
    && Configuration data
    || Sensitive data (secrets)
    && Mounted as files or env vars
│
└── Ingress
    && HTTP routing
    && Host/path-based routing
    && TLS termination
```

---

## 3. Scaling Patterns

```
How to scale:

├── Horizontal Pod Autoscaler (HPA)
    && Scale replicas based on metrics
    && CPU, memory, custom metrics
    && Min/max replicas
│
├── Vertical Pod Autoscaler (VPA)
    && Adjust resource requests
    && Warning: restarts Pods
│
├── Cluster Autoscaler
    && Scale nodes in/out
    && For node-level scaling
│
└── Horizontal scaling preferred
    && More resilient than vertical
    && Better for most workloads
```

---

## 4. Deployment Strategies

```
When to use each:

├── Rolling update (default)
    && Gradually replace old Pods
    && No downtime
    && Easy to monitor
│
├── Blue-green
    && Two identical environments
    && Switch traffic at once
    && Fast rollback
│
├── Canary
    && Small % to new version
    && Monitor, then increase
    && Good for risky changes
│
└── Recreate
    && All at once
    && Downtime but simple
    && For dev/test
```

---

## 5. Service Mesh Considerations

```
When to add service mesh:

├── Need observability
    && Distributed tracing
    && Service-to-service metrics
│
├── Complex traffic management
    && A/B testing
    && Circuit breaking
    && Retries, timeouts
│
└── Security
    && mTLS between services
    && Fine-grained policies
```

```
Service mesh options:

├── Istio - full-featured, complex
├── Linkerd - simpler, lighter
├── Consul - also service discovery
└── Not needed when: simple, no traffic complexity
```

---

## Key Patterns

1. **Deployments, not naked Pods** — Manage with ReplicaSets
2. **Services for stable endpoints** — Don't expose Pods directly
3. **Horizontal scaling first** — More resilient than vertical
4. **Rolling updates by default** — Safe, easy
5. **Liveness/readiness probes** — Don't skip

---

## Anti-Patterns

```
❌ Running containers as root in pods
✅ securityContext: runAsNonRoot: true; runAsUser: 1000

❌ No resource limits on containers (noisy neighbor)
✅ Always set requests and limits for CPU and memory

❌ kubectl apply -f with no review
✅ GitOps: ArgoCD / Flux sync from git; no manual kubectl in prod

❌ All pods in default namespace
✅ Namespaces per team/environment with RBAC policies

❌ No liveness/readiness probes
✅ Readiness: ready to serve traffic; liveness: restart if stuck
```

---

## Quick Reference

| Resource | Purpose | Key fields |
|---|---|---|
| Deployment | Manage pod replicas | replicas, selector, template |
| Service | Network endpoint | ClusterIP, LoadBalancer, NodePort |
| Ingress | HTTP routing | rules, TLS, annotations |
| ConfigMap | Non-secret config | data key-value |
| Secret | Sensitive config | data base64-encoded |
| HPA | Auto-scale pods | minReplicas, maxReplicas, metrics |
