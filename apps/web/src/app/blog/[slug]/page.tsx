import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getLocale } from "next-intl/server"
import { Nav } from "@/components/Nav"
import { Footer } from "@/components/sections/Footer"
import { Breadcrumb } from "@/components/ui/Breadcrumb"
import { CodeBlock } from "@/components/ui/CodeBlock"
import { JsonLd } from "@/components/seo/JsonLd"
import { localizeBlogPost } from "@/content/blog-translations"
import { BLOG_POSTS } from "@/content/blog"
import type { AppLocale } from "@/i18n/routing"
import { localizedMetadata, localizedUrl } from "@/i18n/metadata"
import { Link } from "@/i18n/navigation"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const source = BLOG_POSTS.find((entry) => entry.slug === slug)
  if (!source) return {}
  const locale = await getLocale() as AppLocale
  const post = localizeBlogPost(source, locale)

  return localizedMetadata(locale, `/blog/${slug}`, post.title, post.description, {
    type: "article",
    publishedTime: post.date,
    modifiedTime: post.updatedAt,
  })
}

export function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }))
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const locale = await getLocale() as AppLocale
  const source = BLOG_POSTS.find((post) => post.slug === slug)
  if (!source) notFound()
  const post = localizeBlogPost(source, locale)
  const contentLocale = locale === "tr" ? "tr" : "en"
  const tr = locale === "tr"
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.updatedAt,
    author: { "@type": "Organization", name: "Aurict" },
    publisher: { "@type": "Organization", name: "Aurict", url: "https://aurict.com" },
    inLanguage: contentLocale,
    url: localizedUrl(`/blog/${slug}`, contentLocale),
  }

  return (
    <>
      <JsonLd data={articleJsonLd} />
      <Nav />
      <main className="marketing-main marketing-main-narrow">
        <Breadcrumb items={[{ label: tr ? "Ana sayfa" : "Home", href: "/" }, { label: "Blog", href: "/blog" }, { label: post.title, href: `/blog/${slug}` }]} />
        <article>
          <header className="marketing-hero">
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}><span className="marketing-tag">{post.category}</span><span className="marketing-meta">{post.date} · {post.readTime}</span></div>
            <h1 className="marketing-title marketing-title-sm">{post.title}</h1>
            <p className="marketing-lede">{post.description}</p>
          </header>
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {post.content.map((block, index) => {
              if (block.type === "heading") return <h2 key={index} style={{ fontFamily: "var(--font-serif)", fontSize: 28, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.01em", marginTop: 20 }}>{block.text}</h2>
              if (block.type === "paragraph") return <p key={index} className="marketing-copy">{block.text}</p>
              if (block.type === "code") return <CodeBlock key={index} code={block.text ?? ""} language={block.language} />
              return <ul key={index} className="marketing-list">{block.items?.map((item) => <li key={item}>{item}</li>)}</ul>
            })}
          </div>
          {!tr && (
            <aside className="marketing-card" style={{ marginTop: 48, padding: "26px 28px" }}>
              <p className="marketing-eyebrow" style={{ marginBottom: 10 }}>open-source terminal agent</p>
              <h2 style={{ color: "var(--text)", fontFamily: "var(--font-serif)", fontSize: 25, marginBottom: 10 }}>Run the workflow in your own terminal.</h2>
              <p className="marketing-copy" style={{ marginBottom: 18 }}>Explore how Aurict combines repository context, specialist agents, model-provider choice, explicit approvals, and verification in an inspectable terminal runtime.</p>
              <Link href="/terminal-agent" style={{ color: "var(--accent)", fontFamily: "var(--font-mono)", fontSize: 13, textDecoration: "none" }}>Explore the open-source terminal agent →</Link>
            </aside>
          )}
          <div style={{ marginTop: 64, paddingTop: 32, borderTop: "1px solid var(--border)" }}><Link href="/blog" style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 14, fontFamily: "var(--font-mono)", color: "var(--accent)", textDecoration: "none" }}>← {tr ? "Blog'a dön" : "Back to Blog"}</Link></div>
        </article>
      </main>
      <Footer />
    </>
  )
}
