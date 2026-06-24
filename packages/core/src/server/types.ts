export type SSEEvent =
  | { type: "text";         data: { delta: string; sessionId: string } }
  | { type: "tool_call";    data: { id: string; tool: string; args: unknown } }
  | { type: "tool_result";  data: { id: string; result: unknown; status: string } }
  | { type: "permission";   data: { id: string; tool: string; pattern: string } }
  | { type: "agent_spawn";  data: { id: string; agentType: string; sessionId: string } }
  | { type: "agent_status"; data: { id: string; status: "running" | "done" | "error"; progress?: string } }
  | { type: "agent_text";   data: { id: string; delta: string; agentType: string; sessionId: string } }
  | { type: "agent_done";   data: { id: string; result: string } }
  | { type: "agent_error";  data: { id: string; error: string } }
  | { type: "compaction";   data: { sessionId: string; tokensBefore: number; tokensAfter: number } }
  | { type: "error";        data: { message: string; code: string } }
  | { type: "done";         data: { sessionId: string } }
