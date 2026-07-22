export type BlogPost = {
  slug: string
  title: string
  description: string
  date: string
  updatedAt: string
  readTime: string
  category: string
  content: {
    type: "paragraph" | "heading" | "code" | "list"
    text?: string
    language?: string
    items?: string[]
  }[]
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "how-to-use-ai-coding-assistant",
    title: "How to Use an AI Coding Assistant in 2026",
    description:
      "A practical guide to getting started with AI coding assistants. Learn best practices, common pitfalls, and how to maximize productivity with terminal-based AI tools.",
    date: "2026-06-15",
    updatedAt: "2026-06-15",
    readTime: "8 min read",
    category: "Tutorial",
    content: [
      { type: "heading", text: "Getting Started with AI Coding Assistants" },
      { type: "paragraph", text: "AI coding assistants have evolved from simple autocomplete tools into sophisticated development partners. In 2026, terminal-based AI assistants like Aurict offer multi-agent orchestration, contextual skills, and deep codebase understanding." },
      { type: "heading", text: "Choosing the Right Tool" },
      { type: "paragraph", text: "When selecting an AI coding assistant, consider these factors:" },
      { type: "list", items: [
        "Provider flexibility — Can you switch between Anthropic, OpenAI, Google, and others?",
        "Agent architecture — Does it use specialist agents or a single model?",
        "Context awareness — Does it understand your codebase automatically?",
        "Platform support — Does it work on macOS, Linux, and Windows natively?",
      ] },
      { type: "heading", text: "Installation and Setup" },
      { type: "paragraph", text: "Installing Aurict takes less than a minute:" },
      { type: "code", language: "bash", text: "npm install -g aurict\naurict" },
      { type: "paragraph", text: "The first-run flow guides you through provider selection, API key configuration, model choice, and the optional Project Auto decision for bounded file changes in the current project session." },
      { type: "heading", text: "Best Practices" },
      { type: "paragraph", text: "To get the most out of your AI coding assistant:" },
      { type: "list", items: [
        "Be specific in your requests — vague prompts get vague results",
        "Use the right agent for the task — explore, code, review, test, etc.",
        "Leverage persistent memory — the AI remembers your preferences",
        "Review AI suggestions — trust but verify",
      ] },
      { type: "heading", text: "Conclusion" },
      { type: "paragraph", text: "AI coding assistants are no longer experimental — they're essential tools for modern development. Aurict's multi-agent approach and contextual skills make it a powerful choice for developers who want terminal-native workflows." },
    ],
  },
  {
    slug: "claude-code-vs-aurict",
    title: "Claude Code vs Aurict: Which Terminal AI is Right for You?",
    description:
      "A detailed comparison of Claude Code and Aurict. We cover provider support, agent architecture, pricing, and which tool fits different workflows.",
    date: "2026-06-12",
    updatedAt: "2026-06-12",
    readTime: "10 min read",
    category: "Comparison",
    content: [
      { type: "heading", text: "Overview" },
      { type: "paragraph", text: "Claude Code and Aurict are both terminal-based AI coding assistants, but they take different approaches. This comparison helps clarify where each tool fits." },
      { type: "heading", text: "Provider Support" },
      { type: "paragraph", text: "Claude Code is centered on Anthropic's Claude models. Aurict is designed around provider flexibility:" },
      { type: "list", items: [
        "Anthropic",
        "OpenAI",
        "Google",
        "OpenRouter",
        "xAI",
        "Azure OpenAI",
        "AWS Bedrock",
        "Ollama",
        "OpenCode",
        "NVIDIA NIM",
        "Z.AI (GLM)",
        "Alibaba (Qwen)",
      ] },
      { type: "heading", text: "Architecture" },
      { type: "paragraph", text: "Aurict uses specialist agents for explore, code, review, test, docs, security, debug, performance, and analytics workflows. That makes it better suited to multi-step engineering tasks than a single generic assistant loop." },
      { type: "heading", text: "Pricing" },
      { type: "paragraph", text: "Aurict is open source and follows a bring-your-own-key model. Your actual model cost depends on the provider and model you choose." },
      { type: "heading", text: "Which Should You Choose?" },
      { type: "paragraph", text: "Choose Claude Code if you want an official Anthropic-first workflow. Choose Aurict if you want provider flexibility, terminal-native execution, and a more extensible agent runtime." },
    ],
  },
  {
    slug: "terminal-ai-tools-2026",
    title: "The Best Terminal AI Tools in 2026",
    description:
      "An overview of the terminal AI landscape in 2026. Compare Aurict, Claude Code, Aider, OpenCode, and other tools to find the right fit for your workflow.",
    date: "2026-06-10",
    updatedAt: "2026-06-10",
    readTime: "12 min read",
    category: "Overview",
    content: [
      { type: "heading", text: "The Terminal AI Renaissance" },
      { type: "paragraph", text: "Terminal-based AI coding tools are growing because they fit existing developer workflows, remote servers, CI-adjacent tasks, and repository-scale work without requiring an IDE switch." },
      { type: "heading", text: "Top Contenders" },
      { type: "paragraph", text: "Common tools in this category include:" },
      { type: "list", items: [
        "Aurict — terminal-native, multi-provider, multi-agent",
        "Claude Code — Anthropic's terminal coding workflow",
        "Aider — Git-focused AI pair programming",
        "OpenCode — open-source terminal AI",
        "GitHub Copilot CLI — command-line suggestions",
      ] },
      { type: "heading", text: "Key Differentiators" },
      { type: "list", items: [
        "Multi-agent vs single-agent architecture",
        "Provider flexibility and vendor lock-in",
        "Context awareness and codebase discovery",
        "Native binaries vs runtime dependencies",
        "Extensibility through custom tools, skills, and MCP",
      ] },
      { type: "heading", text: "Conclusion" },
      { type: "paragraph", text: "The terminal AI space is maturing quickly. Aurict's position is strongest for developers who value provider choice, terminal-native execution, and extensible workflows." },
    ],
  },
  {
    slug: "multi-agent-ai-coding",
    title: "Why Multi-Agent AI is the Future of Coding",
    description:
      "Explore how multi-agent architecture is changing AI coding assistants and why specialist agents can help with complex tasks.",
    date: "2026-06-08",
    updatedAt: "2026-06-08",
    readTime: "7 min read",
    category: "Architecture",
    content: [
      { type: "heading", text: "The Problem with Single-Model AI" },
      { type: "paragraph", text: "A single model loop can work for small requests, but complex software work often needs exploration, planning, implementation, review, testing, and documentation as separate modes of attention." },
      { type: "heading", text: "The Multi-Agent Solution" },
      { type: "paragraph", text: "Multi-agent systems split work into specialized roles. Aurict ships with agents for exploration, coding, review, testing, docs, security, debugging, performance, and analytics." },
      { type: "list", items: [
        "Explore — codebase analysis and navigation",
        "Code — implementation and refactoring",
        "Review — code review and best practices",
        "Test — test generation and coverage",
        "Docs — documentation generation",
        "Security — vulnerability-oriented review",
        "Debug — root cause analysis",
        "Performance — profiling and optimization",
        "Analytics — data analysis and insights",
      ] },
      { type: "heading", text: "Context Specialization" },
      { type: "paragraph", text: "Specialized agents reduce context noise because each worker focuses on a narrower job. That helps preserve attention for the artifacts that matter." },
    ],
  },
  {
    slug: "mcp-model-context-protocol",
    title: "What is MCP (Model Context Protocol) and Why It Matters",
    description:
      "A practical guide to the Model Context Protocol and how it helps AI assistants connect with existing tools and data sources.",
    date: "2026-06-05",
    updatedAt: "2026-06-05",
    readTime: "9 min read",
    category: "Technical",
    content: [
      { type: "heading", text: "Introduction to MCP" },
      { type: "paragraph", text: "The Model Context Protocol is an interface for connecting AI assistants to external tools and data sources. It creates a common integration layer rather than one-off custom connectors." },
      { type: "heading", text: "How MCP Works" },
      { type: "paragraph", text: "MCP servers expose tools and resources. Assistants can discover them and call them under the permission model of the host application." },
      { type: "heading", text: "Common MCP Use Cases" },
      { type: "list", items: [
        "Database queries",
        "Filesystem access with permissions",
        "GitHub, Slack, Jira, and API integrations",
        "Browser automation for testing and scraping",
      ] },
      { type: "heading", text: "Aurict's MCP Support" },
      { type: "paragraph", text: "Aurict can import compatible MCP-style configuration so developers can bring existing tools into the terminal runtime. Connection state and available tools should be confirmed with /mcp before they are relied on." },
      { type: "code", language: "json", text: "{\n  \"mcpServers\": {\n    \"postgres\": {\n      \"command\": \"npx\",\n      \"args\": [\"-y\", \"@modelcontextprotocol/server-postgres\"]\n    }\n  }\n}" },
      { type: "heading", text: "The Future of AI Integration" },
      { type: "paragraph", text: "As more developer tools expose structured interfaces, AI assistants can become safer and more useful by calling tools explicitly instead of guessing from pasted context." },
    ],
  },
]

export function getBlogPost(slug: string) {
  return BLOG_POSTS.find((post) => post.slug === slug)
}
