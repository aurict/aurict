"use client"
import Link from "next/link"

interface BreadcrumbItem {
  label: string
  href: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        fontSize: 13,
        fontFamily: "var(--font-geist-mono)",
        color: "var(--text-muted)",
        marginBottom: 24,
      }}
    >
      {items.map((item, i) => (
        <span key={item.href} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {i > 0 && (
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{ color: "var(--border-bright)" }}
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          )}
          {i === items.length - 1 ? (
            <span style={{ color: "var(--text-dim)" }}>{item.label}</span>
          ) : (
            <Link
              href={item.href}
              style={{
                color: "var(--text-muted)",
                textDecoration: "none",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
            >
              {item.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  )
}
