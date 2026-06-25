import type { Metadata } from "next"
import { Nav } from "@/components/Nav"
import { MotionProvider } from "@/components/MotionProvider"
import { Hero } from "@/components/sections/Hero"
import { WhyAurict } from "@/components/sections/WhyAurict"
import { Features } from "@/components/sections/Features"
import { ProviderGrid } from "@/components/ui/ProviderGrid"
import { IntegrationGrid } from "@/components/ui/IntegrationGrid"
import { Install } from "@/components/sections/Install"
import { SocialProof } from "@/components/sections/SocialProof"
import { FAQ } from "@/components/sections/FAQ"
import { Footer } from "@/components/sections/Footer"

export const metadata: Metadata = {
  alternates: { canonical: "https://aurict.com" },
}

const faqJsonLd = {
  "@context":  "https://schema.org",
  "@type":     "FAQPage",
  "mainEntity": [
    {
      "@type":          "Question",
      "name":           "Is Aurict free?",
      "acceptedAnswer": { "@type": "Answer", "text": "Yes — Aurict is fully open source under the MIT license. You bring your own API key for whichever AI provider you choose. There are no subscription fees for the core tool." },
    },
    {
      "@type":          "Question",
      "name":           "How is Aurict different from Claude Code?",
      "acceptedAnswer": { "@type": "Answer", "text": "Claude Code is tied to Anthropic only. Aurict supports 9 providers, ships with 9 specialist agents, 218+ auto-injected skills, a bash command classifier, and runs as a native binary — no Node.js runtime required." },
    },
    {
      "@type":          "Question",
      "name":           "Does Aurict work on Windows?",
      "acceptedAnswer": { "@type": "Answer", "text": "Yes. Aurict ships a native compiled binary for Windows x64 — no WSL, no extra runtime required. Shell detection auto-picks Git Bash, MSYS2, or PowerShell." },
    },
    {
      "@type":          "Question",
      "name":           "Which AI providers does Aurict support?",
      "acceptedAnswer": { "@type": "Answer", "text": "Anthropic (Claude), OpenAI (GPT-4o, o1), Google (Gemini), OpenRouter, xAI (Grok), Azure OpenAI, AWS Bedrock, Ollama (local models), and OpenCode — switchable at any time with /providers." },
    },
    {
      "@type":          "Question",
      "name":           "Do I need Node.js installed to run Aurict?",
      "acceptedAnswer": { "@type": "Answer", "text": "No. Aurict installs via npm install -g aurict but runs as a self-contained native binary. Node.js is only needed for the install step itself." },
    },
    {
      "@type":          "Question",
      "name":           "Can I use my existing MCP servers with Aurict?",
      "acceptedAnswer": { "@type": "Answer", "text": "Yes — Aurict reads your claude_desktop_config.json automatically. Any MCP server you have configured for Claude Desktop works immediately." },
    },
  ],
}

const howToJsonLd = {
  "@context": "https://schema.org",
  "@type":    "HowTo",
  "name":     "How to install and run Aurict",
  "description": "Install the open-source terminal AI coding assistant in three steps.",
  "totalTime": "PT1M",
  "step": [
    {
      "@type":    "HowToStep",
      "position": 1,
      "name":     "Install",
      "text":     "Run npm install -g aurict in your terminal. Works on macOS, Linux, and Windows.",
      "url":      "https://aurict.com/#install",
    },
    {
      "@type":    "HowToStep",
      "position": 2,
      "name":     "Run",
      "text":     "Navigate to your project directory and run aurict to launch the terminal UI.",
      "url":      "https://aurict.com/#install",
    },
    {
      "@type":    "HowToStep",
      "position": 3,
      "name":     "Configure",
      "text":     "On first launch, an interactive wizard guides you through selecting a provider, entering your API key, and choosing a model.",
      "url":      "https://aurict.com/docs",
    },
  ],
}

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type":               "SoftwareApplication",
      "name":                "Aurict",
      "applicationCategory": "DeveloperApplication",
      "operatingSystem":     "macOS, Linux, Windows",
      "description":         "Open-source terminal AI coding assistant with 9 specialist agents, 218+ auto-injected contextual skills, bash classifier, MCP client, and support for 9 AI providers. Install with one npm command.",
      "url":                 "https://aurict.com",
      "downloadUrl":         "https://www.npmjs.com/package/aurict",
      "installUrl":          "https://www.npmjs.com/package/aurict",
      "softwareVersion":     "1.1.3",
      "releaseNotes":        "https://aurict.com/changelog",
      "license":             "https://opensource.org/licenses/MIT",
      "author": {
        "@type": "Organization",
        "name":  "aurict",
        "url":   "https://github.com/aurict",
      },
      "offers": {
        "@type":         "Offer",
        "price":         "0",
        "priceCurrency": "USD",
      },
      "screenshot":  "https://aurict.com/opengraph-image",
      "featureList": [
        "9 specialist AI agents (Explore, Code, Review, Test, Docs, Security, Debug, Performance, Analytics)",
        "218+ auto-injected contextual skills",
        "Bash command classifier — dangerous commands require confirmation",
        "MCP client — reads claude_desktop_config.json",
        "Multi-provider: Anthropic, OpenAI, OpenRouter, Google, xAI, Azure, AWS Bedrock, Ollama",
        "Design agent wizard with 150+ design systems",
        "Persistent memory across sessions",
        "Custom tool and skill loader",
        "Session checkpoint and branching",
      ],
    },
    {
      "@type":       "WebSite",
      "url":         "https://aurict.com",
      "name":        "Aurict",
      "description": "Open-source terminal AI coding assistant",
    },
    {
      "@type":  "Organization",
      "name":   "aurict",
      "url":    "https://aurict.com",
      "sameAs": [
        "https://github.com/aurict/aurict",
        "https://www.npmjs.com/package/aurict",
      ],
    },
  ],
}

export default function Home() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }} />
      <Nav />
      <MotionProvider>
        <main>
          <Hero />
          <WhyAurict />
          <Features />
          <ProviderGrid />
          <IntegrationGrid />
          <SocialProof />
          <Install />
          <FAQ />
        </main>
      </MotionProvider>
      <Footer />
    </>
  )
}
