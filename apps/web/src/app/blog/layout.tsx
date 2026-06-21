import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Blog — AI Coding Insights & Tutorials",
  description: "Learn about AI coding assistants, terminal AI tools, multi-agent architecture, and how to supercharge your development workflow with Aurict.",
  alternates: { canonical: "https://aurict.com/blog" },
  openGraph: {
    title: "Aurict Blog — AI Coding Insights",
    description: "Tutorials, comparisons, and insights about AI coding assistants and developer tools.",
    url: "https://aurict.com/blog",
  },
}

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return children
}
