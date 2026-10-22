import { ImageResponse } from "next/og";

export const alt = "Quaera: Models write. Code decides.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#faf6f1", padding: 40 }}>
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            borderRadius: 48,
            padding: 64,
            background: "linear-gradient(135deg, #6e5ff0 0%, #5b4bdb 55%, #4334c2 100%)",
            color: "#fff",
          }}
        >
          <div style={{ fontSize: 30, letterSpacing: 4, textTransform: "uppercase", color: "#e4e0ff" }}>QuaeraLabs · open source</div>
          <div style={{ display: "flex", flexDirection: "column", fontSize: 112, fontWeight: 800, lineHeight: 0.95, letterSpacing: -4 }}>
            <span>Models write.</span>
            <span>Code decides.</span>
          </div>
          <div style={{ fontSize: 32, color: "#e4e0ff" }}>AI research with Lean 4 proofs and reproducible experiments</div>
        </div>
      </div>
    ),
    size,
  );
}
