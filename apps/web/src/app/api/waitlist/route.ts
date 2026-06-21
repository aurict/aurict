import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"

const MAX_EMAIL_LENGTH = 254
const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX = 5
const buckets = new Map<string, { count: number; resetAt: number }>()

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
}

function validateEmail(input: unknown): string | null {
  if (typeof input !== "string") return null
  const email = input.trim().toLowerCase()
  if (email.length === 0 || email.length > MAX_EMAIL_LENGTH) return null
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null
  return email
}

function clientKey(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
  return forwarded || req.headers.get("x-real-ip") || "unknown"
}

function checkRateLimit(key: string): { allowed: boolean; retryAfterMs?: number } {
  const now = Date.now()
  const current = buckets.get(key)
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return { allowed: true }
  }
  if (current.count >= RATE_LIMIT_MAX) {
    return { allowed: false, retryAfterMs: current.resetAt - now }
  }
  current.count++
  return { allowed: true }
}

export async function POST(req: NextRequest) {
  const rate = checkRateLimit(clientKey(req))
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil((rate.retryAfterMs ?? RATE_LIMIT_WINDOW_MS) / 1000)) },
      },
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const email = validateEmail((body as { email?: unknown })?.email)
  if (!email) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 })
  }

  const notify = process.env.NOTIFY_EMAIL
  const apiKey = process.env.RESEND_API_KEY
  if (!notify || !apiKey) {
    return NextResponse.json({ error: "Waitlist email is not configured" }, { status: 500 })
  }

  const resend = new Resend(apiKey)
  const safeEmail = escapeHtml(email)

  try {
    await resend.emails.send({
      from: "Aurict Waitlist <onboarding@resend.dev>",
      to: notify,
      subject: `New waitlist signup: ${email}`,
      html: `
        <div style="font-family:monospace;background:#0a0a0a;color:#f5f5f5;padding:32px;border-radius:8px">
          <p style="color:#818cf8;font-size:12px;letter-spacing:0.1em;text-transform:uppercase">Aurict Waitlist</p>
          <h2 style="margin:12px 0;font-size:20px">New signup</h2>
          <p style="color:#a1a1aa;font-size:14px">Email:</p>
          <p style="font-size:16px;color:#f5f5f5">${safeEmail}</p>
          <hr style="border:none;border-top:1px solid #262626;margin:24px 0"/>
          <p style="color:#52525b;font-size:12px">Sent from aurict.dev waitlist form</p>
        </div>
      `,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("Resend error:", err)
    return NextResponse.json({ error: "Failed to send" }, { status: 500 })
  }
}
