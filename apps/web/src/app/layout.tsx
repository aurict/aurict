import type { Metadata, Viewport } from "next"
import { IBM_Plex_Mono, Source_Serif_4 } from "next/font/google"
import { NextIntlClientProvider } from "next-intl"
import { getLocale, getMessages } from "next-intl/server"
import { ScrollProgress } from "@/components/ui/ScrollProgress"
import { BackToTop } from "@/components/ui/BackToTop"
import { CommandPalette } from "@/components/ui/CommandPalette"
import { RuntimeSignal } from "@/components/ui/RuntimeSignal"
import { AnalyticsConsent } from "@/components/analytics/AnalyticsConsent"
import "./globals.css"

const BASE_URL = "https://aurict.com"

const sourceSerif = Source_Serif_4({
  display: "swap",
  subsets: ["latin", "latin-ext"],
  variable: "--font-serif",
})

const ibmPlexMono = IBM_Plex_Mono({
  display: "swap",
  subsets: ["latin", "latin-ext"],
  variable: "--font-mono",
  weight: ["400", "500", "600", "700"],
})

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),

  title: {
    default: "Aurict — Agentic Workspaces Across Desktop, Mobile, and Terminal",
    template: "%s | Aurict",
  },

  description:
    "Open-source AI workspaces across Hoprel desktop, Aurict Mobile, the terminal, and Bondley.one fixed-income intelligence. Bring your own provider, keep local context, and work with explicit control.",

  keywords: [
    "open source terminal agent",
    "open-source terminal agent",
    "terminal AI coding assistant",
    "terminal agent",
    "AI terminal agent",
    "AI coding tool",
    "AI terminal assistant",
    "local-first AI workspace",
    "Hoprel desktop app",
    "Bondley.one",
    "fixed-income intelligence",
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

  authors:   [{ name: "aurict", url: "https://github.com/aurict" }],
  creator:   "aurict",
  publisher: "aurict",

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
    title:       "Aurict — Agentic Workspaces",
    description: "Hoprel desktop, Aurict Mobile, an open-source terminal runtime, and Bondley.one fixed-income intelligence.",
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
    title:       "Aurict — Agentic Workspaces",
    description: "Hoprel desktop, Aurict Mobile, a terminal runtime, and Bondley.one fixed-income intelligence.",
    images:      ["/opengraph-image"],
  },

  alternates: {
    canonical: BASE_URL,
  },

  icons: {
    icon: [
      { url: "/aurict-logo-v5.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    shortcut: "/aurict-logo-v5.svg",
    apple: "/aurict-logo-v5.svg",
  },

  // Add verification tokens here when setting up Google/Bing Search Console:
  // verification: { google: "...", yandex: "...", bing: "..." },

  category: "technology",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#171110",
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [locale, messages] = await Promise.all([getLocale(), getMessages()])

  return (
    <html className={`${sourceSerif.variable} ${ibmPlexMono.variable}`} lang={locale}>
      <head>
        <link rel="dns-prefetch" href="https://github.com" />
        <link rel="dns-prefetch" href="https://registry.npmjs.org" />
        <link rel="icon" href="/aurict-logo-v5.svg" type="image/svg+xml" />
        <link rel="shortcut icon" href="/aurict-logo-v5.svg" />
        {/* Web App Manifest */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#171110" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body style={{ background: "var(--bg)", color: "var(--text)", minHeight: "100vh" }}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ScrollProgress />
          <CommandPalette />
          <RuntimeSignal />
          <AnalyticsConsent />
          <div className="site-grain" aria-hidden="true" />
          <div className="top-accent" aria-hidden="true" />
          {children}
          <BackToTop />
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
