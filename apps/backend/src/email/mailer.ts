import type { BackendEnv } from "../env"

export type EmailMessage = {
  to: string
  subject: string
  text: string
}

export interface Mailer {
  /** Whether messages are actually delivered (a provider is configured). */
  readonly configured: boolean
  send(message: EmailMessage): Promise<void>
}

const RESEND_ENDPOINT = "https://api.resend.com/emails"
const SEND_TIMEOUT_MS = 10_000

/** Sends through Resend's HTTP API when RESEND_API_KEY is set; otherwise reports itself unconfigured. */
export function createMailer(env: BackendEnv): Mailer {
  const apiKey = env.RESEND_API_KEY
  if (!apiKey) {
    return {
      configured: false,
      async send() {
        throw new Error("Email delivery is not configured (RESEND_API_KEY is unset).")
      },
    }
  }
  return {
    configured: true,
    async send(message) {
      const res = await fetch(RESEND_ENDPOINT, {
        method: "POST",
        headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
        body: JSON.stringify({ from: env.EMAIL_FROM, to: [message.to], subject: message.subject, text: message.text }),
        signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
      })
      if (!res.ok) {
        // The response body can echo request details; keep only the status in the error.
        throw new Error(`Email provider rejected the message (HTTP ${res.status}).`)
      }
    },
  }
}

/** A mailer that records messages instead of sending them, for tests. */
export function createRecordingMailer(): Mailer & { sent: EmailMessage[] } {
  const sent: EmailMessage[] = []
  return {
    configured: true,
    sent,
    async send(message) {
      sent.push(message)
    },
  }
}
