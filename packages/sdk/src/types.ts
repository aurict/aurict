export interface Session {
  id: string
  title: string | null
  status: string
  createdAt: number
  updatedAt: number
}

export interface CreateSessionOptions {
  provider?: string
  model?: string
  system?: string
  title?: string
}

export interface SendMessageOptions {
  content: string
  onText?: (delta: string) => void
  onDone?: (tokens: { input: number; output: number }) => void
}

export interface AurictClientOptions {
  baseUrl?: string
  token?: string
}
