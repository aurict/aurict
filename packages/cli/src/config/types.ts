export interface AurictConfig {
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
  agents?: Record<string, {
    provider?: string
    model?:    string
    tools?:    string[]
  }>
  multiAgent?: {
    maxWorkers?: number
  }
}
