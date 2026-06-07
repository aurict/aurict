import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] })
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] })

export const metadata: Metadata = {
  title: "OmniCod — Terminal AI Coding Assistant",
  description: "Multi-agent AI coding assistant that lives in your terminal. 218+ skills, bash classifier, LSP integration, and a design agent wizard.",
  keywords: ["AI", "coding assistant", "terminal", "Claude", "multi-agent", "developer tools"],
  openGraph: {
    title: "OmniCod — Terminal AI Coding Assistant",
    description: "Multi-agent AI coding assistant that lives in your terminal.",
    type: "website",
    url: "https://omnicod.dev",
  },
  twitter: {
    card: "summary_large_image",
    title: "OmniCod — Terminal AI Coding Assistant",
    description: "Multi-agent AI coding assistant that lives in your terminal.",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body style={{ background: "var(--bg)", color: "var(--text)", minHeight: "100vh" }}>
        {/* Film grain overlay */}
        <div className="noise" aria-hidden="true" />
        {children}
      </body>
    </html>
  )
}
