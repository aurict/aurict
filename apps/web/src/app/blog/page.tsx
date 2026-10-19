import { getLocale } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import { localizeBlogPost } from "@/content/blog-translations"
import type { AppLocale } from "@/i18n/routing"
import { Nav } from "@/components/Nav"
import { Footer } from "@/components/sections/Footer"
import { Breadcrumb } from "@/components/ui/Breadcrumb"
import { BLOG_POSTS } from "@/content/blog"
import { breadcrumbJsonLd, collectionJsonLd } from "@/lib/seo"

const breadcrumb = breadcrumbJsonLd([
  { name: "Home", path: "/" },
  { name: "Blog", path: "/blog" },
])

const collection = collectionJsonLd({
  name: "Aurict Blog",
  description: "AI coding insights, tutorials, and terminal AI comparisons.",
  path: "/blog",
  items: BLOG_POSTS.map((post) => ({
    name: post.title,
    path: `/blog/${post.slug}`,
    description: post.description,
  })),
})

export default async function BlogPage() {
  const locale = await getLocale() as AppLocale
  const tr = locale === "tr"
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collection) }} />
      <Nav />
      <main className="marketing-main marketing-main-narrow">
        <Breadcrumb
          items={[
            { label: tr ? "Ana sayfa" : "Home", href: "/" },
            { label: "Blog", href: "/blog" },
          ]}
        />

        <div className="marketing-hero">
          <p className="marketing-eyebrow">Blog</p>
          <h1 className="marketing-title marketing-title-sm">{tr ? "Yapay zekâ ile kodlama içgörüleri" : "AI coding insights"}</h1>
          <p className="marketing-lede">
            {tr ? "Terminal yapay zekâ kodlama asistanları, BYOK iş akışları ve ajan tabanlı geliştirme için rehberler, karşılaştırmalar ve derinlemesine incelemeler." : "Tutorials, comparisons, and deep dives into terminal AI coding assistants, BYOK workflows, and agentic development."}
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {BLOG_POSTS.map((sourcePost) => {
            const post = localizeBlogPost(sourcePost, locale)
            return (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="marketing-card"
              style={{ display: "block", padding: "28px 30px", position: "relative", textDecoration: "none" }}
            >
              <span className="mono aur-corner" style={{ color: "rgb(23 17 15 / .18)", left: 8, position: "absolute", top: 8 }}>┌</span>
              <div style={{ alignItems: "center", display: "flex", gap: 12, marginBottom: 12 }}>
                <span className="marketing-tag">{post.category}</span>
                <span className="marketing-meta">{post.date} · {post.readTime}</span>
              </div>
              <h2 style={{ color: "var(--text)", fontFamily: "var(--font-sans)", fontSize: 24, fontWeight: 600, letterSpacing: "-0.01em", marginBottom: 8 }}>
                {post.title}
              </h2>
              <p className="marketing-copy" style={{ fontSize: 15.5 }}>
                {post.description}
              </p>
            </Link>
            )
          })}
        </div>
      </main>
      <Footer />
    </>
  )
}
