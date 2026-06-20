---
name: terraform-basics
description: "Terraform: Infrastructure as code, state management, module patterns, CI/CD integration." 
triggers:
  extensions: [".tf", ".tfvars"]
  keywords: ["Terraform", "IaC", "infrastructure", "AWS", "resource", "provider", "module", "state"]
auto_load_when: "Writing Terraform infrastructure code"
agent: devops-engineer
tools: ["Read", "Write", "Bash"]
---

# Terraform Patterns

**Focus:** IaC, state, modules, deployment

---

## 1. When to Use Terraform

```
Terraform makes sense when:

├── Multi-cloud or hybrid
    && Same config for AWS/GCP/Azure
    && Migrate between providers
│
├── Complex infrastructure
    && Many resources with dependencies
    && Need to reproduce environments
│
├── Version control needed
    && Track infrastructure changes
    && Code review for infra
│
└── Automation required
    && CI/CD pipelines
    && Ephemeral environments
```

```
Don't use when:

├── Single cloud, simple setup
    && Console is faster
    && Low complexity
│
├── Dynamic/ephemeral only
    && Serverless-heavy
    && Too much drift
│
└── Team unfamiliar
    && Learning curve
    && Operational overhead
```

---

## 2. State Strategy

```
State management options:

├── Local (development only)
    && Simple, default
    && Don't share, don't version control
│
├── Remote (production)
    && S3, GCS, Terraform Cloud
    && Locking for concurrency
    && Encryption at rest
│
└── Backend config
    && Define in backend block
    && Use workspaces for environments
```

```
State best practices:

├── Never commit state to git
├── Use remote state in production
├── Enable state locking
├── Backup remote state
└── Handle sensitive data: use var, not in state
```

---

## 3. Module Patterns

```
When to create modules:

├──重复使用资源
    && Same config in multiple places
    && Standard components
│
├──抽象复杂性
    && Hide implementation details
    && Expose simple interface
│
└──组织代码
    └── Group related resources
    └── Teams can own modules
```

```
Module structure:

├── Input variables: what configures
├── Outputs: what returns to parent
├── Resources: what creates
└── Variables: what references internally
```

---

## 4. CI/CD Integration

```
CI/CD pipeline flow:

├── Lint: terraform fmt, validate
├── Plan: terraform plan, save output
├── Review: approve plan (manual/auto)
├── Apply: terraform apply
└── Destroy: for ephemeral environments
```

```
What to check in CI:

├── Formatting: terraform fmt
├── Validation: terraform validate
├── Security: tfsec, checkov
├── Cost: infracost (optional)
└── Plan review: don't just auto-approve
```

---

## 5. Environment Strategy

```
How to organize environments:

├── Workspace-based
    && dev, staging, prod workspaces
    && Same code, different state
    && Use workspace variable
│
├── Directory-based
    && environments/dev/, environments/prod/
    && Separate state files
    && More explicit, less magic
│
└── Git-branch-based
    && Feature branches = preview envs
    && Ephemeral, auto-destroy
    && Good for PR previews
```

---

## Key Patterns

1. **Remote state** — Not local, not committed
2. **Modules for reuse** — Don't repeat config
3. **Plan before apply** — Always review plan
4. **Lock state** — Prevent concurrent changes
5. **Don't hardcode** — Use variables everywhere

---

## Anti-Patterns

```
❌ Storing tfstate locally — lost on laptop change, blocks team
✅ Remote state: S3 + DynamoDB lock, or Terraform Cloud

❌ Hardcoding secrets in .tf files
✅ Secrets via AWS Secrets Manager, Vault, or env vars

❌ Running terraform apply directly without plan review
✅ Always terraform plan → review → apply; automate in CI with approval gate

❌ One giant module for everything
✅ Split into reusable modules: networking, compute, database

❌ No lifecycle rules on resources that shouldn't be destroyed
✅ prevent_destroy = true on databases, S3 buckets with data
```

---

## Quick Reference

| Command | What it does | When |
|---|---|---|
| terraform init | Download providers | Before first apply |
| terraform plan | Show changes | Before every apply |
| terraform apply | Apply changes | After reviewing plan |
| terraform destroy | Remove all | Only in dev/staging |
| terraform import | Adopt existing resource | Brownfield migration |
| terraform state | Manipulate state | Advanced / emergency |
