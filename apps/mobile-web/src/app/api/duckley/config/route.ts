import { NextResponse } from "next/server";

const BASE =
  process.env.DUCKLEY_API_BASE ?? "https://duckley.aurict.com/api/v1";

export async function GET() {
  try {
    const res = await fetch(`${BASE}/auth/config`, { cache: "no-store", signal: AbortSignal.timeout(10_000) });
    const data = (await res.json().catch(() => ({}))) as { googleClientId?: unknown };
    // The page only needs the public Google client id; do not relay anything else.
    const googleClientId = typeof data.googleClientId === "string" ? data.googleClientId : undefined;
    return NextResponse.json({ googleClientId }, { status: res.ok ? 200 : 502 });
  } catch {
    return NextResponse.json(
      { error: "upstream_unavailable" },
      { status: 503 },
    );
  }
}
