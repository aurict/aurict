---
name: docker-patterns
description: "Docker: Multi-stage strategy, Security hardening approach, Volume strategy, When to use what." 
triggers:
  filenames: ["Dockerfile", "docker-compose.yml", "docker-compose.yaml", ".dockerignore"]
  keywords: ["docker", "container", "image", "compose", "build", "layer"]
auto_load_when: "Editing Dockerfile or docker-compose files"
agent: devops-engineer
tools: ["Read", "Write", "Bash"]
---

# Docker Architecture Patterns

**Focus:** Security, optimization, patterns

## 1. Multi-stage Build Strategy

```
When to use multi-stage:
├── Compilation needed (Node, Go, Python)
├── Different build and runtime environments
└── Want to minimize final image size

Stage pattern:
├── Build stage: dependencies, compile
├── Dependencies: only package.json
├── Source: full code
├── Output: compiled artifacts
└── Final: minimal runtime, copy artifacts only
```

**Key principles:**
- Copy package files first (before code - cache layers)
- Build in one stage, copy to next
- Final image only needs to run, not build

---

## 2. Security Hardening

```
Security layers:
├── Base image: specific version, not latest
├── User: non-root, created in Dockerfile
├── Filesystem: read-only where possible
├── Capabilities: drop all, add only needed
└── Secrets: never in image, use runtime

What to avoid:
├── Running as root
├── Latest tag (non-deterministic)
├── Secrets in ENV (exposed in layers)
└── Unnecessary packages in image
```

---

## 3. Volume Strategy

```
When to use volumes:
├── Database data (persist across restarts)
├── Build artifacts (share between stages)
└── Development (hot reload)

When NOT to use volumes:
├── Configuration (use env vars)
├── Secrets (use runtime injection)
└── Temporary data (tmpfs)

Type selection:
├── Named volumes: persistent data
├── Bind mounts: development, files
└── tmpfs: sensitive data in memory
```

---

## 4. Compose Strategy

```
When to use Compose:
├── Local development
├── Integration testing
├── Multiple services together

When to use directly:
├── Production deployment
├── Single service
└── Cloud deployment (Docker Swarm, K8s)

Compose patterns:
├── Override: base + local overrides
├── Profiles: enable/disable services
└── Depends on: startup order
```

---

## 5. Image Optimization

```
How to minimize image:
├── Multi-stage builds
├── Minimal base image (alpine, slim)
├── Fewer layers (combine RUN)
├── .dockerignore (exclude build artifacts)
└── Build arguments for dynamic values

Layer caching:
├── Order: least frequent first, most frequent last
├── COPY package.json → RUN install → COPY code
└── Change at bottom = rebuild all below
```

---

## 6. Healthcheck Strategy

```
When to add healthcheck:
├── Long-running services
├── Services that might hang
└── Services dependent by others

What to check:
├── HTTP endpoint: GET /health
├── Database: pg_isready
├── Custom: script that checks dependencies
└── TCP: port open

Frequency:
├── Start period: time to start up
├── Interval: how often to check
├── Timeout: how long to wait
└── Retries: how many failures to declare unhealthy
```

---

## Key Patterns

1. **Multi-stage** - Build in one stage, run in another
2. **Non-root** - Never run as root user
3. **Minimal base** - Use alpine/slim, not default
4. **Layer caching** - Order for cache efficiency
5. **Healthchecks** - For orchestration readiness

---

## Anti-Patterns

```
❌ RUN apt-get + app copy in one fat layer
✅ Multi-stage: builder stage installs deps, final stage copies artifact only

❌ Running as root inside containers
✅ USER node (or non-root) in Dockerfile

❌ Hardcoding secrets in ENV or ARG
✅ Inject secrets at runtime via --env-file or secrets manager

❌ :latest tag in production
✅ Pin exact image digest or semver tag

❌ No .dockerignore — sending node_modules to daemon
✅ .dockerignore: node_modules, .git, .env, dist
```

---

## Quick Reference

| Task | Pattern | Instruction |
|---|---|---|
| Small image | Alpine/distroless base | FROM node:20-alpine |
| Layer cache | Copy package.json first | COPY package*.json ./ |
| Build artifact | Multi-stage | FROM builder AS final |
| Non-root | USER directive | USER node |
| Health | HEALTHCHECK CMD | curl -f /health |
| Secrets | Runtime env | --env-file .env.prod |
| Image size check | docker build + inspect | docker image ls |
