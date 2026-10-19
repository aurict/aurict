"use client";

import { TightPeriods } from "@/components/ui/TightPeriods";
import { useState } from "react";
import { useLocale } from "next-intl";
import { Footer } from "@/components/Footer";
import { Rss } from "lucide-react";
import { ENTRIES } from "@/content/changelog-entries";

const TAG_LABELS: Record<string, { label_en: string; label_tr: string; cls: string }> = {
  new:   { label_en: "new",   label_tr: "yeni",     cls: "tag tag-new"   },
  fix:   { label_en: "fix",   label_tr: "düzeltme", cls: "tag tag-fix"   },
  break: { label_en: "break", label_tr: "kırıcı",   cls: "tag tag-break" },
  perf:  { label_en: "perf",  label_tr: "performans", cls: "tag tag-perf" },
};

export default function ChangelogPage() {
  const locale = useLocale();
  const tr = locale === "tr";
  const [selectedTag, setSelectedTag] = useState<string>("all");

  const filterTags = ["all", "new", "fix", "perf", "break"];
  const filteredEntries = ENTRIES.filter(
    (e) => selectedTag === "all" || e.tag === selectedTag
  );

  return (
    <>
      <main>
        <div className="inner-main-wide">
          {/* Header */}
          <div className="page-intro">
            <div className="page-intro-eyebrow">
              {tr ? "değişiklik günlüğü" : "changelog & releases"}
            </div>
            <div>
              <h1 className="page-h1">
                <TightPeriods text={tr ? "Değişiklik Günlüğü" : "Changelog"} />
              </h1>
              <p className="page-lead">
                {tr
                  ? "Aurict Decision Karar Motoru için tüm güncellemeler, yeni özellikler, performans kazanımları ve kırıcı değişiklikler."
                  : "All changes, feature additions, performance optimizations, and API breaking changes across releases."}
              </p>
            </div>
          </div>

          {/* Filter Bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 40,
              borderBottom: "1px solid var(--border)",
              paddingBottom: 16,
              flexWrap: "wrap",
            }}
          >
            <span style={{ color: "var(--text-muted)", font: "700 12.5px var(--font-sans)", marginRight: 8, textTransform: "uppercase" }}>
              {tr ? "Filtrele:" : "Filter:"}
            </span>
            {filterTags.map((tag) => (
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
                  textTransform: "uppercase",
                  transition: "all 0.16s ease",
                }}
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Timeline List */}
          <div className="changelog-list" style={{ marginBottom: 96, maxWidth: 840 }}>
            {filteredEntries.map((entry, i) => {
              const tagInfo = TAG_LABELS[entry.tag];
              return (
                <div key={i} className="changelog-entry">
                  <div className="changelog-meta">
                    <span className="changelog-version">{entry.version}</span>
                    <span className="changelog-date">{entry.date}</span>
                    <span className={tagInfo.cls}>
                      {tr ? tagInfo.label_tr : tagInfo.label_en}
                    </span>
                  </div>

                  <div className="content-card">
                    <div className="content-card-title">
                      {tr ? entry.title_tr : entry.title}
                    </div>
                    <p className="content-card-body" style={{ marginTop: 8, marginBottom: 16 }}>
                      {tr ? entry.body_tr : entry.body}
                    </p>

                    {/* Highlights bullet points */}
                    <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12, display: "grid", gap: 6 }}>
                      {entry.highlights.map((h, idx) => (
                        <div key={idx} style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-dim)", font: "12px var(--font-mono)" }}>
                          <span style={{ color: "var(--accent)" }}>•</span>
                          <span>{h}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* RSS Card */}
          <div
            style={{
              background: "color-mix(in srgb, var(--bg-card) 85%, var(--bg))",
              border: "1px solid var(--border)",
              padding: "32px 28px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 20,
              flexWrap: "wrap",
              marginBottom: 80,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Rss size={20} style={{ color: "var(--accent)" }} />
              <div>
                <div style={{ color: "var(--text)", font: "800 16px var(--font-sans)" }}>
                  {tr ? "Değişiklik Günlüğünü Takip Edin" : "Subscribe to Release Updates"}
                </div>
                <div style={{ color: "var(--text-muted)", font: "12px var(--font-mono)" }}>
                  {tr ? "Yeni sürümler yayınlandığında bildirim alın." : "Get notified when new SDK versions and patches are released."}
                </div>
              </div>
            </div>
            <a href="mailto:releases@aurict.com?subject=Subscribe" className="aur-button aur-button-secondary">
              {tr ? "E-posta Bildirimi" : "Email Notifications"}
            </a>
          </div>
        </div>

        {/* Final CTA */}
        <section className="section-final">
          <p>{tr ? "en son sürüm" : "latest release"}</p>
          <h2>{tr ? "Aurict Decision v1.0.2 sürümünü hemen deneyin." : "Deploy Aurict Decision v1.0.2 today."}</h2>
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
