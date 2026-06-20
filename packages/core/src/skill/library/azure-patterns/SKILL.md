---
name: azure-patterns
description: "Azure Patterns: Functions, Container Apps, Cosmos DB, Azure SQL, AKS, serverless." 
triggers:
  extensions: [".py", ".ts", ".yaml"]
  directories: ["azure/", "infrastructure/"]
  keywords: ["azure", "functions", "container apps", "cosmos db", "azure sql", "aks", "app service", "bicep", "arm"]
auto_load_when: "Building on Microsoft Azure or designing enterprise architectures"
agent: cloud-architect
tools: ["Read", "Write", "Bash"]
---

# Azure Architecture Patterns

**Focus:** Enterprise integration, hybrid cloud, managed services

## 1. Compute Selection

```
When to use what:
├── Azure Functions
│   ├── Event-driven, HTTP, timers
│   ├── Premium: VNET, longer running
│   └── Consumption: pay per execution
│
├── Container Apps
│   ├── Microservices, event-driven
│   ├── KEDA-based autoscaling
│   └── Dapr integration for state
│
├── App Service
│   ├── Web apps (ASP.NET, Node, Python)
│   ├── PaaS for web apps
│   └── Managed, easy to use
│
├── AKS (Kubernetes)
│   ├── Full Kubernetes
│   ├── Enterprise features
│   └── Windows containers support
│
└── Azure VMs
│   ├── Legacy lift-and-shift
│   └── Specific requirements
```

---

## 2. Data Layer Patterns

```
Database selection:
├── Cosmos DB
│   ├── Global distributed NoSQL
│   ├── Multiple APIs (SQL, MongoDB, Cassandra, Gremlin)
│   ├── Multi-master, any region write
│   └── Serverless option
│
├── Azure SQL
│   ├── Managed SQL Server
│   ├── Intelligent database (auto-tuning)
│   └── Hyperscale for large DBs
│
├── PostgreSQL / MySQL
│   ├── Flexible Server (managed)
│   └── Serverless option
│
├── Azure Cache for Redis
│   ├── Caching, session store
│   └── Redis Enterprise for clustering
│
└── Blob Storage
    ├── Object storage
    ├── Hot/Cool/Archive tiers
    └── Azure Data Lake integration
```

---

## 3. Integration Patterns

```
Azure Integration Services:
├── Service Bus
│   ├── Enterprise messaging
│   ├── Topics for pub/sub
│   └── Reliable delivery
│
├── Logic Apps
│   ├── No-code workflow automation
│   ├── 400+ connectors
│   └── Visual workflow designer
│
├── API Management
│   ├── API gateway, developer portal
│   ├── Rate limiting, caching
│   └── Mock APIs for development
│
├── Event Grid
│   ├── Event routing
│   └── Push-based, near real-time
│
└── Functions + Service Bus
    └── Durable execution patterns
```

---

## 4. Enterprise Features

```
Azure Enterprise Patterns:
├── Identity
│   ├── Microsoft Entra ID (formerly AAD)
│   ├── SSO, MFA, Conditional Access
│   └── RBAC, managed identities
│
├── Hybrid Cloud
│   ├── Azure Arc (hybrid management)
│   ├── Azure Stack (on-prem Azure)
│   └── ExpressRoute (private connection)
│
├── Governance
│   ├── Azure Policy
│   ├── Management groups
│   └── Blueprints for compliance
│
└── Monitoring
│   ├── Application Insights
│   ├── Log Analytics
    └── Azure Monitor
```

---

## 5. Infrastructure as Code

```
IaC in Azure:
├── ARM Templates
│   ├── JSON-based, verbose
│   └── Native Azure
│
├── Bicep (recommended)
│   ├── Simplified, transpiles to ARM
│   └── Better syntax, modular
│
├── Terraform
    ├── Multi-cloud, popular
    └── Official Azure provider
│
└── Ansible
    ├── Configuration management
    └── Azure modules available
```

---

## Key Patterns

1. **Enterprise integration** - Best for Microsoft ecosystem
2. **Cosmos DB for global** - Multi-region, any API
3. **Logic Apps** - No-code for integrations
4. **Entra ID** - Identity and access management
5. **Bicep** - Simplified IaC (or Terraform)

---

## Anti-Patterns

```
❌ Using VMs for new workloads
✅ App Service / Container Apps / Functions

❌ Single region for production
✅ Multi-region with Traffic Manager

❌ Not using managed identities
✅ System/user assigned MI for RBAC

❌ No Azure Policy enforcement
✅ Governance from day one

❌ Ignoring Azure Cost Management
✅ Budget alerts, cost analysis
```

---

## Quick Reference

| Service | Use Case | Key Feature |
|---|---|---|
| Functions | Serverless | Event-driven |
| Container Apps | Microservices | KEDA scaling |
| App Service | Web apps | Managed |
| Cosmos DB | Global NoSQL | Multi-API |
| Azure SQL | Managed SQL | Intelligent |
| Service Bus | Messaging | Enterprise |
| AKS | Kubernetes | Enterprise |
| Blob Storage | Object storage | Tiers |

---

## Decision Tree

```
Compute: which Azure service?
├── Event-driven, HTTP trigger, timer  → Azure Functions (Consumption — pay per exec)
├── Containerized microservices, KEDA  → Container Apps (managed Kubernetes-light)
├── Managed web app, .NET / Node       → App Service (PaaS, no container ops)
├── Full Kubernetes, enterprise        → AKS
└── Legacy lift-and-shift              → Azure VMs

Database?
├── Global distribution, multi-region write → Cosmos DB (any API: SQL/Mongo/Cassandra)
├── Managed SQL Server                     → Azure SQL (Intelligent tuning, auto-backup)
├── PostgreSQL / MySQL cloud               → Flexible Server (serverless option available)
└── Caching / sessions                     → Azure Cache for Redis

IaC tool?
├── Azure-only team                        → Bicep (simpler than ARM, native Azure)
├── Multi-cloud or existing Terraform      → Terraform (azurerm provider)
└── Configuration management layer        → Ansible (works with either)

Messaging?
├── Enterprise reliability, ordering       → Service Bus (topics + sessions)
├── No-code workflow automation            → Logic Apps (400+ connectors)
└── Push-based event routing               → Event Grid
```

---

## Key Rules

1. Never use VMs for new workloads — Functions / Container Apps / App Service first
2. Use Managed Identities for Azure service-to-service auth — never embed credentials
3. Multi-region deployment for production: Traffic Manager for DNS failover
4. All infra via Bicep or Terraform — no manual portal changes in production
5. Cosmos DB: define partition key based on access patterns at design time, not after
6. Enable Azure Policy from day one — enforce tags, SKU limits, allowed locations
7. Set up Cost Management budget alerts before deploying prod workloads

---

## Implementation

```typescript
// Azure Functions v4 (Node.js) — HTTP trigger
import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions'
import { z } from 'zod'

const createUserSchema = z.object({ email: z.string().email(), name: z.string().min(1) })

app.http('createUser', {
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    try {
      const body = createUserSchema.parse(await req.json())
      const user = await db.createUser(body)
      return { status: 201, jsonBody: { data: user } }
    } catch (e: any) {
      ctx.error('createUser failed', { error: e.message })
      if (e.name === 'ZodError')
        return { status: 400, jsonBody: { error: { code: 'VALIDATION_ERROR', details: e.issues } } }
      return { status: 500, jsonBody: { error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } } }
    }
  },
})
```

```bicep
// main.bicep — Function App + Storage + App Insights
param location string = resourceGroup().location
param appName string

resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: '${appName}storage'
  location: location
  sku: { name: 'Standard_LRS' }
  kind: 'StorageV2'
}

resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: '${appName}-ai'
  location: location
  kind: 'web'
  properties: { Application_Type: 'web' }
}

resource functionApp 'Microsoft.Web/sites@2023-01-01' = {
  name: appName
  location: location
  kind: 'functionapp'
  identity: { type: 'SystemAssigned' }   // Managed Identity
  properties: {
    siteConfig: {
      appSettings: [
        { name: 'AzureWebJobsStorage', value: storageAccount.properties.primaryEndpoints.blob }
        { name: 'APPINSIGHTS_INSTRUMENTATIONKEY', value: appInsights.properties.InstrumentationKey }
        { name: 'FUNCTIONS_WORKER_RUNTIME', value: 'node' }
      ]
    }
  }
}
```
