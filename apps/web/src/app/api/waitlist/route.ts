import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"

const NOTIFY = process.env.NOTIFY_EMAIL ?? "fakesmileux@gmail.com"

export async function POST(req: NextRequest) {
  const { email } = await req.json()

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 })
  }

  const resend = new Resend(process.env.RESEND_API_KEY)

  try {
    await resend.emails.send({
      from: "OmniCod Waitlist <onboarding@resend.dev>",
      to: NOTIFY,
      subject: `New waitlist signup: ${email}`,
      html: `
        <div style="font-family:monospace;background:#0a0a0a;color:#f5f5f5;padding:32px;border-radius:8px">
          <p style="color:#818cf8;font-size:12px;letter-spacing:0.1em;text-transform:uppercase">OmniCod Waitlist</p>
          <h2 style="margin:12px 0;font-size:20px">New signup</h2>
          <p style="color:#a1a1aa;font-size:14px">Email:</p>
          <p style="font-size:16px;color:#f5f5f5">${email}</p>
          <hr style="border:none;border-top:1px solid #262626;margin:24px 0"/>
          <p style="color:#52525b;font-size:12px">Sent from omnicod.dev waitlist form</p>
        </div>
      `,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("Resend error:", err)
    return NextResponse.json({ error: "Failed to send" }, { status: 500 })
  }
}
