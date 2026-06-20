import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Use Cases — AI-Powered Development Workflows",
  description: "Discover how Aurict's specialist agents handle refactoring, code review, testing, documentation, and more. See real-world examples of AI-assisted development.",
  alternates: { canonical: "https://aurict.dev/use-cases" },
  openGraph: {
    title: "Aurict Use Cases",
    description: "AI-powered refactoring, code review, testing, and documentation workflows.",
    url: "https://aurict.dev/use-cases",
  },
}

export default function UseCasesLayout({ children }: { children: React.ReactNode }) {
  return children
}
