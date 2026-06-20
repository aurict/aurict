---
name: clean-architecture
description: "Clean Architecture: Layered architecture, dependency rule, use cases, business logic isolation." 
triggers:
  keywords: ["architecture", "layer", "domain", "use case", "clean", "dependency inversion"]
auto_load_when: "Designing system architecture or layers"
agent: architect
tools: ["Read", "Write", "Bash"]
---

# Clean Architecture Patterns

**Focus:** Layer separation, dependency inversion, testable business logic

## 1. Layer Structure

```
Layers (outer to inner):
├── Frameworks/Drivers (DB, UI, API clients)
├── Interface Adapters (Controllers, Presenters, Gateways)
├── Application Layer (Use Cases, DTOs)
└── Enterprise Business Rules (Entities)

Dependency Rule:
├── Outer layers depend on inner
├── Inner = business logic, no dependencies
└── Dependencies point inward (arrows toward entities)
```

---

## 2. When to Use Clean Architecture

```
Use when:
├── Complex business logic (not CRUD)
├── Long-term project (6+ months)
├── Multiple delivery teams
├── Testability is critical
├── Need to swap DB/UI frameworks
└── Domain changes frequently

Skip when:
├── Simple CRUD app
├── Quick prototype/MVP
├── Tight deadline
└── Single developer
```

---

## 3. Use Case Structure

```
Use Case Pattern:
├── Input: Request DTO (what caller sends)
├── Output: Response DTO (what caller receives)
├── Interface: Input/Output ports
├── Logic: Orchestrate domain objects

Naming: CreateUser, UpdateOrderStatus, CalculateShipping
```

---

## 4. Dependency Injection

```
How to inject:
├── Constructor injection (preferred)
├── Method injection (for optional deps)
└── Factory injection (complex creation)

Pattern:
├── Interface in domain (port)
├── Implementation in infrastructure (adapter)
└── Wiring in composition root (main/app)
```

---

## 5. Entity vs DTO

```
Entity:
├── Has identity (ID)
├── Contains business logic
├── Can change over time
└── Lives in domain layer

DTO (Data Transfer Object):
├── No identity (just data)
├── No logic
├── For crossing boundaries
└── Lives in application layer
```

---

## 6. Layer Responsibilities

```
Domain Layer (innermost):
├── Entities (core business objects)
├── Value Objects (immutable, no identity)
├── Domain Services (complex logic)
└── Interfaces (ports)

Application Layer:
├── Use Cases (orchestration)
├── DTOs (data carriers)
└── Interfaces (output ports)

Infrastructure Layer:
├── Repositories (implementations)
├── External services (API clients)
└── Frameworks (DB, HTTP)
```

---

## Key Patterns

1. **Dependency Rule** - dependencies point inward
2. **Use Cases** - encapsulate business logic
3. **Entities** - domain core, framework-agnostic
4. **Ports & Adapters** - switch implementations
5. **Composition Root** - wire dependencies once

(End of file - 79 lines)

---

## Anti-Patterns

```
❌ Business logic in controllers/routes
✅ Logic lives in use cases and domain services

❌ Domain entities importing framework classes
✅ Domain layer has zero framework dependencies

❌ Repository implementations in domain layer
✅ Domain defines interfaces; infra implements them

❌ Anemic domain model (entities = just data bags)
✅ Rich domain model — entities enforce their own invariants

❌ Direct DB calls from UI/presentation layer
✅ Always go through use case → repository interface
```

---

## Quick Reference

| Concept | Where it lives | Rule |
|---|---|---|
| Business rules | Domain entities / services | No framework imports |
| Orchestration | Use cases (application layer) | Calls domain + repos |
| DB / HTTP | Infrastructure layer | Implements domain interfaces |
| DI wiring | Composition root | Once, at startup |
| Input validation | Application layer | Before reaching domain |
| Error types | Domain layer | No HTTP status codes inside |

---

## Decision Tree

```
Use clean architecture?
├── Complex business logic (not CRUD)       → yes
├── Multiple teams or long-lived project    → yes
├── Must swap DB or framework later         → yes
├── Simple CRUD / prototype / MVP           → no (over-engineering)
└── Single dev, tight deadline             → no

Which layer for this code?
├── Business rules, invariants, entities   → Domain layer (no imports from outer)
├── Orchestrate steps, call repos/services → Use Case (Application layer)
├── HTTP handler / tRPC router / Controller → Interface Adapter (maps to/from DTOs)
└── DB queries / API calls / email         → Infrastructure (implements domain interfaces)

Repository or Domain Service?
├── CRUD operations on an entity           → Repository interface in domain
├── Logic spanning multiple entities       → Domain Service
└── External system (email, payment)      → Port (interface) → Adapter (infra)
```

---

## Key Rules

1. Dependency rule: inner layers have zero imports from outer layers
2. Domain entities enforce their own invariants — not just data bags
3. Use Cases orchestrate; they never contain HTTP/DB code directly
4. Interfaces (ports) live in domain; implementations (adapters) in infrastructure
5. DTOs at every boundary — never pass domain entities to controllers
6. Wire dependencies once at startup (composition root) — not scattered across files
7. Domain errors have no HTTP status codes — map at the adapter layer

---

## Implementation

```typescript
// Domain layer — entity + port (no framework imports)
// domain/user.ts
export class User {
  private constructor(
    public readonly id: string,
    public readonly email: string,
    private _name: string
  ) {}

  static create(id: string, email: string, name: string): User {
    if (!email.includes('@')) throw new Error('Invalid email')
    if (name.length < 1) throw new Error('Name required')
    return new User(id, email, name)
  }

  get name() { return this._name }
  rename(name: string) {
    if (name.length < 1) throw new Error('Name required')
    this._name = name
  }
}

// domain/user.repository.ts — port (interface)
export interface UserRepository {
  findById(id: string): Promise<User | null>
  save(user: User): Promise<void>
}

// Application layer — use case
// application/rename-user.usecase.ts
export class RenameUserUseCase {
  constructor(private readonly users: UserRepository) {}

  async execute(userId: string, newName: string): Promise<void> {
    const user = await this.users.findById(userId)
    if (!user) throw new Error('USER_NOT_FOUND')
    user.rename(newName)
    await this.users.save(user)
  }
}

// Infrastructure layer — adapter implements port
// infrastructure/prisma-user.repository.ts
export class PrismaUserRepository implements UserRepository {
  async findById(id: string) {
    const row = await prisma.user.findUnique({ where: { id } })
    if (!row) return null
    return User.create(row.id, row.email, row.name)
  }
  async save(user: User) {
    await prisma.user.upsert({
      where: { id: user.id },
      create: { id: user.id, email: user.email, name: user.name },
      update: { name: user.name },
    })
  }
}

// Composition root (app startup)
const userRepo    = new PrismaUserRepository()
const renameUser  = new RenameUserUseCase(userRepo)
// Route handler — only maps HTTP, delegates to use case
app.patch('/users/:id', async (req, res) => {
  try {
    await renameUser.execute(req.params.id, req.body.name)
    res.json({ ok: true })
  } catch (e: any) {
    if (e.message === 'USER_NOT_FOUND') return res.status(404).json({ error: e.message })
    res.status(400).json({ error: e.message })
  }
})
```
