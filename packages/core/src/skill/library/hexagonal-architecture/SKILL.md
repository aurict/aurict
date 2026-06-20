---
name: hexagonal-architecture
description: "Hexagonal Architecture: Ports and adapters, domain-driven design, external dependencies isolation." 
triggers:
  keywords: ["hexagonal", "ports", "adapters", "domain isolation", "infrastructure", "application service"]
auto_load_when: "Designing hexagonal/ports-adapters architecture"
agent: architect
tools: ["Read", "Write", "Bash"]
---

# Hexagonal Architecture Patterns

**Focus:** Port/adapter separation, dependency inversion, domain isolation

## 1. Architecture Overview

```
Hexagon (ports on outside, domain inside):

    ┌─────────────┐
    │   Driving  │  ← API/Controllers
    │   Adapters │
    └──────┬──────┘
           │
    ┌──────▼──────┐
    │    Ports    │  ← Interfaces
    │ (Input/Out) │
    ├─────────────┤
    │   Domain    │  ← Core business logic
    │   (Core)    │  ← No external deps
    ├─────────────┤
    │    Ports    │  ← Interfaces
    │(Secondary)  │
    └──────┬──────┘
           │
    ┌──────▼──────┐
    │   Driven    │  ← DB, External APIs
    │   Adapters  │
    └─────────────┘
```

---

## 2. Port Types

```
Driving Ports (Primary):
├── Input interfaces for use cases
├── Called by adapters (API, CLI)
└── Define what the app can do

Driven Ports (Secondary):
├── Output interfaces for external deps
├── Implemented by adapters (DB, cache)
└── Define what the app needs
```

---

## 3. When to Use

```
Use hexagonal when:
├── Multiple external dependencies
├── Need to mock external services
├── Domain logic needs to be reusable
├── Different delivery mechanisms (API, CLI, queue)
└── Complex integration scenarios

Not for:
├── Simple apps with one UI
├── Tightly coupled legacy systems
└── Rapid prototyping
```

---

## 4. Adapter Implementation

```
Driving Adapter:
├── REST Controller → calls Use Case (port)
├── GraphQL Resolver → calls Use Case
└── CLI Command → calls Use Case

Driven Adapter:
├── RepositoryImpl → implements IRepository
├── CacheAdapter → implements ICachePort
└── ExternalApiClient → implements IApiPort
```

---

## 5. Domain Isolation

```
Domain must have:
├── No imports from adapters
├── No framework annotations
├── Pure business logic
├── Explicit dependencies (via ports)

Domain should contain:
├── Entities
├── Value Objects
├── Domain Services
├── Domain Events
└── Port Interfaces
```

---

## 6. Testing Strategy

```
Testing pyramid for hexagonal:
├── Unit: Domain logic (no mocks)
├── Integration: Use case + port (mock adapter)
├── E2E: Full adapter (real deps)

Mocking pattern:
├── Mock driven adapters for unit tests
├── Use test doubles for ports
└── Never mock the domain itself
```

---

## Key Patterns

1. **Ports** - interfaces in domain
2. **Adapters** - implementations outside domain
3. **Driving** - triggers domain (API)
4. **Driven** - called by domain (DB)
5. **Domain first** - build core, add adapters

(End of file - 80 lines)

---

## Anti-Patterns

```
❌ Port (interface) defined in infrastructure layer
✅ Ports belong to the application/domain core

❌ Adapter directly instantiated inside business logic
✅ Inject adapters via constructor/DI container

❌ HTTP concerns (status codes, headers) leaking into use cases
✅ HTTP is an adapter detail — use cases return plain results

❌ Testing with real DB instead of fake adapter
✅ Swap adapters with in-memory fakes in tests

❌ One giant port that does everything
✅ Small, focused ports per capability
```

---

## Quick Reference

| Concept | Hexagonal term | Lives where |
|---|---|---|
| Business logic | Application core | Center |
| Interface definition | Port | Core (defines shape) |
| Framework integration | Adapter | Outside |
| DB implementation | Driven adapter | Outside |
| HTTP handler | Driving adapter | Outside |
| DI wiring | Composition root | App startup |
