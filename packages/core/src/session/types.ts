export interface Session {
  id: string
  title: string | null
  createdAt: number
  updatedAt: number
  parentId: string | null
  config: string | null
  status: string
}

export interface Part {
  id: string
  sessionId: string
  sequence: number
  role: string
  type: string
  content: string
  tokens: number | null
  createdAt: number
}

export interface SessionConfig {
  provider: string
  model: string
  system?: string
  workdir?: string
}
