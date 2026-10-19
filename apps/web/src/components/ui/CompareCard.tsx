"use client"
import { useLocale } from "next-intl"
import { Link } from "@/i18n/navigation"

interface CompareCardProps {
  slug: string
  competitor: string
  tagline: string
  description: string
  differentiator: string
}

export function CompareCard({ slug, competitor, tagline, description, differentiator }: CompareCardProps) {
  const tr = useLocale() === "tr"

  return (
    <Link href={`/compare/${slug}`} style={{ textDecoration: "none" }}>
      <div
        className="marketing-card"
        style={{
          padding: "28px 30px",
          cursor: "pointer",
          position: "relative",
        }}
      >
        <span className="mono aur-corner" style={{ position: "absolute", top: 8, left: 8, color: "rgb(23 17 15 / .18)" }}>┌</span>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
              <h2 style={{ fontFamily: "var(--font-sans)", fontSize: 22, fontWeight: 600, color: "var(--text)", margin: 0 }}>
                Aurict {tr ? "ve" : "vs"} {competitor}
              </h2>
              <span
                className="marketing-tag"
                style={{
                  whiteSpace: "nowrap",
                }}
              >
                {differentiator}
              </span>
            </div>
            <p className="mono" style={{ fontSize: 12.5, color: "var(--text-muted)", margin: 0, marginBottom: 8 }}>
              {tagline}
            </p>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: 15.5, color: "var(--text-dim)", lineHeight: 1.62, margin: 0 }}>
              {description}
            </p>
          </div>
          <span className="mono" style={{ fontSize: 20, color: "var(--accent)", alignSelf: "center", flexShrink: 0 }}>
            →
          </span>
        </div>
      </div>
    </Link>
  )
}
