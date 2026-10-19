"use client";

import { TightPeriods } from "@/components/ui/TightPeriods";
import { useState } from "react";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Footer } from "@/components/Footer";
import { Mail } from "lucide-react";
import { POSTS } from "@/content/blog-posts";

const TAG_COLORS: Record<string, string> = {
  Engineering: "var(--accent)",
  Product:     "#1f8a5f",
  Research:    "#5b4fc4",
};

export default function BlogPage() {
  const locale = useLocale();
  const tr = locale === "tr";
  const [selectedTag, setSelectedTag] = useState<string>("All");

  const tags = ["All", "Engineering", "Product", "Research"];
  const featuredPost = POSTS.find((p) => p.featured) || POSTS[0];
  const filteredPosts = POSTS.filter(
    (p) => selectedTag === "All" || p.tag === selectedTag
  );

  return (
    <>
      <main>
        <div className="inner-main-wide">
          {/* Header */}
          <div className="page-intro">
            <div className="page-intro-eyebrow">blog & insights</div>
            <div>
              <h1 className="page-h1">
                <TightPeriods text={tr ? "Mühendislik ve Ürün Blogu" : "Engineering & Product Blog"} />
              </h1>
              <p className="page-lead">
                {tr
                  ? "Cihaz üstü ML, karar teorisi ve gizlilik önce kişiselleştirmenin geleceğine derin dalışlar."
                  : "Deep dives into on-device ML, decision theory, privacy architecture, and the future of edge targeting."}
              </p>
            </div>
          </div>

          {/* Featured Post Card */}
          <div
            style={{
              background: "color-mix(in srgb, var(--accent) 6%, var(--bg-card))",
              border: "1px solid var(--border-bright)",
              padding: "40px clamp(24px, 4vw, 48px)",
              marginBottom: 64,
              display: "grid",
              gap: 20,
              position: "relative",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <span
                style={{
                  background: "var(--accent)",
                  color: "var(--accent-ink)",
                  font: "700 12.5px var(--font-sans)",
                  padding: "3px 8px",
                  borderRadius: 3,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                {tr ? "ÖNE ÇIKAN YAZI" : "FEATURED POST"}
              </span>
              <span style={{ color: "var(--text-muted)", font: "700 12.5px var(--font-sans)" }}>
                {featuredPost.date}
              </span>
              <span style={{ color: "var(--text-muted)", font: "700 12.5px var(--font-sans)" }}>
                • {featuredPost.readTime}
              </span>
            </div>

            <Link
              href={`/blog/${featuredPost.slug}`}
              style={{
                color: "var(--text)",
                font: "800 clamp(28px, 4vw, 40px) / 1.1 var(--font-sans)",
                textDecoration: "none",
                letterSpacing: "-0.02em",
              }}
            >
              {tr ? featuredPost.title_tr : featuredPost.title}
            </Link>

            <p style={{ color: "var(--text-dim)", font: "17px / 1.6 var(--font-sans)", maxWidth: 840 }}>
              {tr ? featuredPost.summary_tr : featuredPost.summary}
            </p>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12 }}>
              <span style={{ color: "var(--text-muted)", font: "12px var(--font-mono)" }}>
                By {featuredPost.author}
              </span>
              <Link
                href={`/blog/${featuredPost.slug}`}
                className="aur-button aur-button-primary"
                style={{ fontSize: 11, minHeight: 38 }}
              >
                {tr ? "Makaleyi Oku →" : "Read Article →"}
              </Link>
            </div>
          </div>

          {/* Filter Bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 32,
              borderBottom: "1px solid var(--border)",
              paddingBottom: 16,
              flexWrap: "wrap",
            }}
          >
            <span style={{ color: "var(--text-muted)", font: "700 12.5px var(--font-sans)", marginRight: 8, textTransform: "uppercase" }}>
              {tr ? "Kategoriler:" : "Filter:"}
            </span>
            {tags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setSelectedTag(tag)}
                style={{
                  background:
                    selectedTag === tag
                      ? "color-mix(in srgb, var(--accent) 15%, transparent)"
                      : "transparent",
                  border: `1px solid ${selectedTag === tag ? "var(--accent)" : "var(--border)"}`,
                  color: selectedTag === tag ? "var(--accent)" : "var(--text-dim)",
                  padding: "5px 14px",
                  borderRadius: 4,
                  font: "700 12.5px var(--font-sans)",
                  cursor: "pointer",
                  transition: "all 0.16s ease",
                }}
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Blog Grid */}
          <div className="blog-grid" style={{ marginBottom: 96 }}>
            {filteredPosts.map((post) => (
              <div key={post.slug} className="blog-card">
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span className="blog-date">{post.date}</span>
                    <span style={{ color: "var(--text-muted)", font: "700 12.5px var(--font-sans)" }}>•</span>
                    <span className="blog-date">{post.readTime}</span>
                  </div>
                  <span
                    className="tag"
                    style={{
                      background: `color-mix(in srgb, ${TAG_COLORS[post.tag] ?? "var(--accent)"} 12%, transparent)`,
                      borderColor: `color-mix(in srgb, ${TAG_COLORS[post.tag] ?? "var(--accent)"} 30%, transparent)`,
                      color: TAG_COLORS[post.tag] ?? "var(--accent)",
                    }}
                  >
                    {post.tag}
                  </span>
                </div>
                <Link href={`/blog/${post.slug}`} className="blog-title">
                  {tr ? post.title_tr : post.title}
                </Link>
                <p className="blog-summary">
                  {tr ? post.summary_tr : post.summary}
                </p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
                  <span style={{ color: "var(--text-muted)", font: "700 12.5px var(--font-sans)" }}>
                    {post.author}
                  </span>
                  <Link
                    href={`/blog/${post.slug}`}
                    style={{
                      color: "var(--accent)",
                      font: "700 12.5px var(--font-sans)",
                      textDecoration: "none",
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                    }}
                  >
                    {tr ? "Devamını Oku →" : "Read More →"}
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Newsletter Box */}
          <div
            className="cta-box"
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--accent)", marginBottom: 6 }}>
                <Mail size={18} />
                <span style={{ font: "700 12.5px var(--font-sans)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  {tr ? "Mühendislik Bülteni" : "Engineering Newsletter"}
                </span>
              </div>
              <h3 style={{ color: "var(--text)", font: "800 22px var(--font-sans)", marginBottom: 4 }}>
                {tr ? "Cihaz üstü ML gelişmelerini takip edin." : "Stay updated on edge ML & decision systems."}
              </h3>
              <p style={{ color: "var(--text-dim)", font: "14px var(--font-sans)" }}>
                {tr ? "Spam yok. Yalnızca teknik derinlikte makaleler ve mimari incelemeler." : "No marketing fluff. Only deep technical articles and architecture breakdowns."}
              </p>
            </div>
            <a href="mailto:blog@aurict.com?subject=Subscribe" className="aur-button aur-button-primary">
              {tr ? "Abone Ol" : "Subscribe via Email"}
            </a>
          </div>
        </div>

        {/* Final CTA */}
        <section className="section-final">
          <p>{tr ? "mühendislik kültürümüz" : "our engineering culture"}</p>
          <h2>{tr ? "Karar motoru ile geliştirmeye başlayın." : "Start building with the decision engine."}</h2>
          <div>
            <a href="https://console.aurict.com" className="aur-button aur-button-primary">
              {tr ? "Ücretsiz Başla" : "Get Started Free"}
            </a>
            <a href="/docs" className="aur-button aur-button-secondary">
              {tr ? "Dokümantasyon" : "Documentation"}
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
