import { NextResponse } from "next/server";

const BASE =
  process.env.DUCKLEY_API_BASE ?? "https://duckley.aurict.com/api/v1";

export async function DELETE(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const res = await fetch(`${BASE}/auth/account`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { error: "upstream_unavailable" },
      { status: 503 },
    );
  }
}
