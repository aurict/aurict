---
name: internal-platforms
description: "Internal Platforms: Self-service infrastructure, golden paths, platform engineering." 
triggers:
  extensions: [".yaml", ".json", ".go"]
  directories: ["platform/", "internal/", "infrastructure/"]
  keywords: ["platform", "internal", "self-service", "golden path", "developer platform", "idp", "paved road"]
auto_load_when: "Building internal developer platforms or self-service infrastructure"
agent: platform-engineer
tools: ["Read", "Write", "Bash"]
---

# Internal Platform Architecture Patterns

**Focus:** Self-service, golden paths, platform engineering

## 1. Platform Components

```
Platform Building Blocks:
├── Compute
│   ├── Self-service Kubernetes clusters
│   ├── Serverless functions
│   └── Container registry
│
├── Data
│   ├── Database provisioning (managed)
│   ├── Cache (Redis) provisioning
│   └── Data pipeline templates
│
├── Networking
│   ├── VPC per team automatic
│   ├── DNS management
│   └── SSL/TLS certificates
│
├── Observability
│   ├── Pre-configured logging
│   ├── Metrics dashboards
│   └── Alerts (service-level)
│
└── CI/CD
    ├── Shared pipeline templates
    ├── Environment provisioning
    └── Deployment automation
```

---

## 2. Self-Service Patterns

```
Self-Service Design:
├── Portal/API-first
│   ├── Web UI for humans
│   └── CLI/API for automation
│   └── Terraform provider for tools
│
├── Approval workflows
│   ├── Auto-approve safe requests
│   ├── Escalation for risky changes
│   └── RBAC on requests
│
├── Guardrails
│   ├── Prevents misconfigurations
│   ├── Enforces security policies
│   └── Defaults to safe
│
└── Cost tracking
    └── Show cost per team/project
    └── Budget alerts
    └── Chargeback (optional)
```

---

## 3. Golden Paths

```
Golden Path Principles:
├── Pre-configured templates
│   ├── Docker images
│   └── Helm charts
│   └── Pipeline configs
│
├── Opinionated defaults
│   ├── Standardize choices
│   └── Reduce decision fatigue
│   └── Best practices built-in
│
├── Clear boundaries
│   ├── What teams can customize
│   └── What is fixed
│   └── Examples: "You can add env vars, not change language"
│
└── Documentation
    └── How-to guides
    └── Examples
    └── Do/don't
```

---

## 4. Platform Team Structure

```
Platform Team Responsibilities:
├── Build platform
│   ├── Infrastructure as code
│   └── Self-service tooling
│   └── Golden paths
│
├── Operate platform
│   ├── Reliability (SLOs)
│   └── Incident response
│   └── Capacity planning
│
├── Enable users
│   ├── Developer onboarding
│   └── Support (tickets)
│   └── Training
│
└── Gather feedback
    └── Regular user surveys
    └── Usage metrics
    └── Product backlog
```

---

## 5. Measuring Platform Success

```
Platform Metrics:
├── Adoption
│   ├── % of services on platform
│   └── % of deployments via self-service
│   └── Daily active users
│
├── Velocity
│   ├── Time to first deployment
│   ├── Time to provision resource
│   └── Lead time for changes
│
├── Reliability
│   ├── Platform uptime
│   └── Incident count
│   └── MTTR (mean time to recovery)
│
└── Developer experience
    ├── NPS (platform team)
    └── Ticket response time
    └── Documentation usage
```

---

## Key Patterns

1. **Start with pain** - Solve real problems first
2. **Self-service by default** - Reduce friction
3. **Guardrails, not gates** - Enable safely
4. **Measure adoption** - Don't build in vacuum
5. **Iterate with feedback** - Product mindset

---

## Anti-Patterns

```
❌ Platform for platform's sake — no real users
✅ Solve specific developer pain points

❌ Too many choices — analysis paralysis
✅ Opinionated defaults, limited options

❌ No onboarding — steep learning curve
✅ Templates, docs, support

❌ No SLAs — unreliable for users
✅ Define SLO, communicate when broken

❌ Build alone — ignore feedback
✅ Regular user feedback loops
```

---

## Quick Reference

| Component | Tool | Purpose |
|---|---|---|
| K8s platform | Rancher, Anthos | Self-service K8s |
| Provisioning | Terraform, Crossplane | Infrastructure |
| Service catalog | Backstage, Port | Discovery |
| CI/CD | Tekton, ArgoCD | Pipelines |
| Monitoring | Prometheus, Grafana | Observability |
