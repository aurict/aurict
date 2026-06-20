import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core"

export const sessions = sqliteTable("sessions", {
  id:                  text("id").primaryKey(),
  title:               text("title"),
  createdAt:           integer("created_at").notNull(),
  updatedAt:           integer("updated_at").notNull(),
  parentId:            text("parent_id"),
  config:              text("config"),
  status:              text("status").notNull().default("active"),
  // ── Maliyet takibi (Faz 1) ─────────────────────────────────────────────────
  totalInputTokens:    integer("total_input_tokens").default(0),
  totalOutputTokens:   integer("total_output_tokens").default(0),
  totalCacheTokens:    integer("total_cache_tokens").default(0),
  accumulatedCostUsd:  real("accumulated_cost_usd").default(0),
  turnCount:           integer("turn_count").default(0),
  lastModel:           text("last_model"),
})

export const parts = sqliteTable("parts", {
  id: text("id").primaryKey(),
  sessionId: text("session_id").notNull().references(() => sessions.id, { onDelete: "cascade" }),
  sequence: integer("sequence").notNull(),
  role: text("role").notNull(),
  type: text("type").notNull(),
  content: text("content").notNull(),
  tokens: integer("tokens"),
  createdAt: integer("created_at").notNull(),
})

export const toolCalls = sqliteTable("tool_calls", {
  id: text("id").primaryKey(),
  partId: text("part_id").notNull().references(() => parts.id, { onDelete: "cascade" }),
  toolName: text("tool_name").notNull(),
  args: text("args"),
  result: text("result"),
  durationMs: integer("duration_ms"),
  status: text("status").notNull().default("pending"),
  createdAt: integer("created_at").notNull(),
})

export const config = sqliteTable("config", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
})

export const memories = sqliteTable("memories", {
  id:        text("id").primaryKey(),
  content:   text("content").notNull(),
  category:  text("category").notNull(),  // preference | project | fact | decision | pattern
  scope:     text("scope").notNull(),     // global | project
  project:   text("project"),             // workdir — null ise global
  timestamp: integer("timestamp").notNull(),
  source:    text("source").notNull(),    // auto | manual | tool
  tags:      text("tags"),                // JSON string[]
})

export const mcpServers = sqliteTable("mcp_servers", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  command: text("command").notNull(),
  args: text("args"),
  env: text("env"),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
})
