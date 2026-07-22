import { AGENT_EVENT_SCHEMA_VERSION, type AgentEvent } from "./contracts.js"

type EventPayload = AgentEvent extends infer Event
  ? Event extends AgentEvent
    ? Omit<Event, "schemaVersion" | "runId" | "sequence" | "timestamp">
    : never
  : never

export class AgentEventStream {
  private sequence = 0
  private readonly events: AgentEvent[] = []

  constructor(
    private readonly runId: string,
    private readonly listener?: (event: AgentEvent) => void,
    private readonly now: () => number = Date.now,
  ) {}

  emit(payload: EventPayload): AgentEvent {
    const event = {
      ...payload,
      schemaVersion: AGENT_EVENT_SCHEMA_VERSION,
      runId: this.runId,
      sequence: ++this.sequence,
      timestamp: this.now(),
    } as AgentEvent
    this.events.push(event)
    this.listener?.(event)
    return event
  }

  snapshot(): AgentEvent[] {
    return this.events.map(event => structuredClone(event))
  }

  get count(): number { return this.events.length }
}
