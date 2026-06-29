import type { OmniConfig } from "@aurict/core"

export interface AurictConfig extends Omit<OmniConfig, "agents"> {
  provider?: string
  model?:    string
  system?:   string
  undercover?: boolean
  stream?:   boolean
  server?: {
    port?:     number
    disabled?: boolean
  }
  skills?: {
    autoDetect?: boolean
    disabled?:   string[]
  }
  agents?: OmniConfig["agents"] & Record<string, unknown>
  multiAgent?: {
    maxWorkers?: number
  }
}
