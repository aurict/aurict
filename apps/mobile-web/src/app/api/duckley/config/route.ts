import { NextResponse } from "next/server";

const BASE =
  process.env.DUCKLEY_API_BASE ?? "https://duckley.aurict.com/api/v1";

export async function GET() {
  try {
    const res = await fetch(`${BASE}/auth/config`, { cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { error: "upstream_unavailable" },
      { status: 503 },
    );
  }
}
