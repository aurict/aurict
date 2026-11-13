import { NextResponse } from "next/server";

const BASE =
  process.env.DUCKLEY_API_BASE ?? "https://duckley.aurict.com/api/v1";
const UPSTREAM_TIMEOUT_MS = 10_000;
const MAX_BODY_BYTES = 4096;

// Deletes a Duckley account with a fresh Google ID token. Only this page may call it, and
// only the one field the upstream needs is forwarded.
export async function DELETE(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin || new URL(origin).host !== new URL(req.url).host) {
    return NextResponse.json({ error: "invalid_origin" }, { status: 403 });
  }
  const raw = await req.text();
  if (raw.length > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "payload_too_large" }, { status: 413 });
  }
  let idToken: unknown;
  try {
    idToken = (JSON.parse(raw) as { idToken?: unknown }).idToken;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (typeof idToken !== "string" || idToken.length < 100 || idToken.length > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "invalid_token" }, { status: 400 });
  }
  try {
    const res = await fetch(`${BASE}/auth/account`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
    // Only the outcome is passed on; upstream error bodies stay server-side.
    return NextResponse.json({ ok: res.ok }, { status: res.ok ? 200 : res.status >= 500 ? 502 : res.status });
  } catch {
    return NextResponse.json({ error: "upstream_unavailable" }, { status: 503 });
  }
}
