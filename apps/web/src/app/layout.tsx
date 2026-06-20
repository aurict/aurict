import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] })
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] })

const BASE_URL = "https://aurict.dev"

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),

  title: {
    default: "Aurict — Terminal AI Coding Assistant",
    template: "%s | Aurict",
  },

  description:
    "Open-source terminal AI coding assistant with 9 specialist agents, 218+ auto-injected skills, and support for Anthropic, OpenAI, Google, and 6 more providers. No IDE required. Works in macOS, Linux, and Windows.",

  keywords: [
    "terminal AI coding assistant",
    "AI coding tool",
    "AI terminal assistant",
    "Claude Code alternative",
    "OpenCode alternative",
    "open source AI coding assistant",
    "multi-agent coding assistant",
    "terminal LLM",
    "AI developer tools",
    "bash AI assistant",
    "Anthropic Claude terminal",
    "aurict",
  ],

  authors:   [{ name: "aurict-dev", url: "https://github.com/aurict-dev" }],
  creator:   "aurict-dev",
  publisher: "aurict-dev",

  robots: {
    index:  true,
    follow: true,
    googleBot: {
      index:               true,
      follow:              true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet":       -1,
    },
  },

  openGraph: {
    type:        "website",
    locale:      "en_US",
    url:         BASE_URL,
    siteName:    "Aurict",
    title:       "Aurict — Terminal AI Coding Assistant",
    description: "Open-source terminal AI coding assistant with 9 specialist agents, 218+ auto-injected skills, and multi-provider support. One command to rule your codebase.",
    images: [
      {
        url:    "/opengraph-image",
        width:  1200,
        height: 630,
        alt:    "Aurict — Terminal AI Coding Assistant",
      },
    ],
  },

  twitter: {
    card:        "summary_large_image",
    site:        "@aurictdev",
    creator:     "@aurictdev",
    title:       "Aurict — Terminal AI Coding Assistant",
    description: "Open-source terminal AI assistant — 9 agents, 218+ skills, 9 providers. No IDE required.",
    images:      ["/opengraph-image"],
  },

  alternates: {
    canonical: BASE_URL,
  },

  // Add verification tokens here when setting up Google/Bing Search Console:
  // verification: { google: "...", yandex: "...", bing: "..." },

  category: "technology",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        {/* Preconnect — reduce latency for external origins */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://github.com" />
        <link rel="dns-prefetch" href="https://registry.npmjs.org" />
        {/* Web App Manifest */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#818cf8" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body style={{ background: "var(--bg)", color: "var(--text)", minHeight: "100vh" }}>
        <div className="noise" aria-hidden="true" />
        {children}
      </body>
    </html>
  )
}
