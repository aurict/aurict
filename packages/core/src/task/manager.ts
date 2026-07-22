import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import type { Task, TaskEvent, TaskScope } from "./types.js"

type Listener = (tasks: Task[], scope: TaskScope | null) => void

interface PersistedTaskState {
  version: 1
  sessionId: string
  sequence: number
  tasks: Task[]
  events: TaskEvent[]
}

interface ScopeState {
  scope: TaskScope | null
  tasks: Map<string, Task>
  events: TaskEvent[]
  sequence: number
  loaded: boolean
}

class TaskManagerImpl {
  private readonly states = new Map<string, ScopeState>()
  private readonly listeners = new Set<Listener>()
  private activeScope: TaskScope | null = null

  onUpdate(cb: Listener): () => void {
    this.listeners.add(cb)
    return () => this.listeners.delete(cb)
  }

  configureScope(workdir: string, sessionId: string): TaskScope {
    const scope = { workdir, sessionId }
    this.activeScope = scope
    this.state(scope)
    return scope
  }

  getTasks(scope: TaskScope | null = this.activeScope): Task[] {
    return [...this.state(scope).tasks.values()].map(cloneTask)
  }

  getTask(id: string, scope: TaskScope | null = this.activeScope): Task | undefined {
    const task = this.state(scope).tasks.get(id)
    return task ? cloneTask(task) : undefined
  }

  getEvents(scope: TaskScope | null = this.activeScope): TaskEvent[] {
    return this.state(scope).events.map(event => ({ ...event, task: cloneTask(event.task) }))
  }

  replaceTasks(tasks: Task[], scope: TaskScope | null = this.activeScope): Task[] {
    const state = this.state(scope)
    const normalized = tasks.map(task => normalizeTask(task))
    this.assertNoCycle(normalized)
    state.tasks = new Map(normalized.map(task => [task.id, task]))
    this.persist(state)
    this.emit(state)
    return this.getTasks(scope)
  }

  createTask(id: string, subject: string, blockedBy: string[] = [], scope: TaskScope | null = this.activeScope): Task {
    const state = this.state(scope)
    if (state.tasks.has(id)) throw new Error(`Task ID ${id} already exists.`)
    const now = Date.now()
    const task: Task = {
      id,
      subject: subject.trim(),
      status: blockedBy.length > 0 ? "pending" : "ready",
      blockedBy: [...blockedBy],
      dependencies: [...blockedBy],
      context: "",
      attempts: 0,
      evidence: [],
      createdAt: now,
      updatedAt: now,
    }
    this.assertNoCycle([...state.tasks.values(), task])
    state.tasks.set(id, task)
    this.record(state, "created", task)
    return cloneTask(task)
  }

  updateTask(id: string, updates: Partial<Task>, scope: TaskScope | null = this.activeScope): Task {
    const state = this.state(scope)
    const current = state.tasks.get(id)
    if (!current) throw new Error(`Task ${id} not found.`)
    const next = normalizeTask({ ...current, ...updates, id, updatedAt: Date.now() })
    if (updates.blockedBy) next.dependencies = [...updates.blockedBy]
    this.assertNoCycle([...state.tasks.values()].map(task => task.id === id ? next : task))
    if (next.status === "in_progress" && current.status !== "in_progress") {
      next.startedAt = Date.now()
      next.attempts = (current.attempts ?? 0) + 1
    }
    state.tasks.set(id, next)
    this.record(state, "updated", next)
    return cloneTask(next)
  }

  completeTask(id: string, result: string, scope: TaskScope | null = this.activeScope): Task {
    const state = this.state(scope)
    const task = state.tasks.get(id)
    if (!task) throw new Error(`Task ${id} not found.`)
    task.status = "done"
    task.result = result
    task.updatedAt = Date.now()
    for (const dependent of state.tasks.values()) {
      if (!dependent.blockedBy.includes(id)) continue
      if (result) {
        dependent.context = dependent.context
          ? `${dependent.context}\n[Context from ${id}]: ${result}`
          : `[Context from ${id}]: ${result}`
      }
      dependent.blockedBy = dependent.blockedBy.filter(blocker => blocker !== id)
      if (dependent.blockedBy.length === 0 && dependent.status === "pending") dependent.status = "ready"
      dependent.updatedAt = Date.now()
    }
    this.record(state, "completed", task)
    return cloneTask(task)
  }

  failTask(id: string, error: string, scope: TaskScope | null = this.activeScope): Task {
    const state = this.state(scope)
    const task = state.tasks.get(id)
    if (!task) throw new Error(`Task ${id} not found.`)
    task.status = "error"
    task.error = error
    task.updatedAt = Date.now()
    this.record(state, "failed", task)
    return cloneTask(task)
  }

  private state(scope: TaskScope | null): ScopeState {
    const key = scope ? `${scope.workdir}\0${scope.sessionId}` : "memory:default"
    let state = this.states.get(key)
    if (!state) {
      state = { scope, tasks: new Map(), events: [], sequence: 0, loaded: false }
      this.states.set(key, state)
    }
    if (!state.loaded) this.load(state)
    return state
  }

  private load(state: ScopeState): void {
    state.loaded = true
    if (!state.scope) return
    const path = storePath(state.scope)
    if (!existsSync(path)) return
    const parsed = JSON.parse(readFileSync(path, "utf8")) as PersistedTaskState
    if (parsed.version !== 1 || parsed.sessionId !== state.scope.sessionId || !Array.isArray(parsed.tasks)) {
      throw new Error(`Invalid task state: ${path}`)
    }
    const tasks = parsed.tasks.map(normalizeTask)
    this.assertNoCycle(tasks)
    state.tasks = new Map(tasks.map(task => [task.id, task]))
    state.events = Array.isArray(parsed.events) ? parsed.events.slice(-500) : []
    state.sequence = Number.isInteger(parsed.sequence) ? parsed.sequence : state.events.length
  }

  private persist(state: ScopeState): void {
    if (!state.scope) return
    const path = storePath(state.scope)
    mkdirSync(dirname(path), { recursive: true })
    const temporary = `${path}.${process.pid}.tmp`
    const payload: PersistedTaskState = {
      version: 1,
      sessionId: state.scope.sessionId,
      sequence: state.sequence,
      tasks: [...state.tasks.values()].map(cloneTask),
      events: state.events.slice(-500),
    }
    writeFileSync(temporary, JSON.stringify(payload, null, 2), "utf8")
    renameSync(temporary, path)
  }

  private record(state: ScopeState, type: TaskEvent["type"], task: Task): void {
    state.events.push({ sequence: ++state.sequence, type, taskId: task.id, task: cloneTask(task), at: Date.now() })
    state.events = state.events.slice(-500)
    this.persist(state)
    this.emit(state)
  }

  private emit(state: ScopeState): void {
    const tasks = [...state.tasks.values()].map(cloneTask)
    for (const listener of this.listeners) listener(tasks, state.scope)
  }

  private assertNoCycle(tasks: Task[]): void {
    const dependencies = new Map(tasks.map(task => [task.id, task.dependencies ?? task.blockedBy]))
    const visiting = new Set<string>()
    const visited = new Set<string>()
    const visit = (id: string): void => {
      if (visiting.has(id)) throw new Error(`Circular dependency detected at task ${id}.`)
      if (visited.has(id)) return
      visiting.add(id)
      for (const dependency of dependencies.get(id) ?? []) if (dependencies.has(dependency)) visit(dependency)
      visiting.delete(id)
      visited.add(id)
    }
    for (const id of dependencies.keys()) visit(id)
  }
}

function normalizeTask(task: Task): Task {
  if (!task.id || !task.subject) throw new Error("Task id and subject are required")
  return {
    ...task,
    subject: task.subject.trim(),
    blockedBy: [...(task.blockedBy ?? [])],
    dependencies: [...(task.dependencies ?? task.blockedBy ?? [])],
    evidence: [...(task.evidence ?? [])],
  }
}

function cloneTask(task: Task): Task {
  return {
    ...task,
    blockedBy: [...task.blockedBy],
    ...(task.dependencies ? { dependencies: [...task.dependencies] } : {}),
    ...(task.evidence ? { evidence: [...task.evidence] } : {}),
  }
}

function storePath(scope: TaskScope): string {
  const safeSessionId = scope.sessionId.replace(/[^a-zA-Z0-9_.:-]/g, "_")
  return join(scope.workdir, ".aurict", "session-state", `${safeSessionId}.tasks.json`)
}

export const taskManager = new TaskManagerImpl()
