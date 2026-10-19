"use client";

import { use } from "react";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Footer } from "@/components/Footer";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { POSTS } from "@/content/blog-posts";

export default function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const locale = useLocale();
  const tr = locale === "tr";

  const post = POSTS.find((p) => p.slug === slug) || {
    slug,
    date: "2026-07-20",
    readTime: "6 min read",
    author: "Aurict Decision Engineering",
    title: slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
    title_tr: slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
    summary: "Technical deep-dive into on-device ML evaluation, latency optimization, and zero-latency decision pipelines.",
    summary_tr: "Cihaz üstü ML değerlendirmesi, gecikme optimizasyonu ve sıfır gecikmeli karar boru hatlarına teknik derinlemesine bakış.",
    tag: "Engineering",
    featured: false,
  };

  return (
    <>
      <main>
        <div className="inner-main-narrow">
          {/* Back link */}
          <Link
            href="/blog"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              color: "var(--accent)",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 32,
            }}
          >
            <ArrowLeft size={14} />
            {tr ? "Tüm Yazılara Dön" : "Back to All Articles"}
          </Link>

          {/* Article Header */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16 }}>
              <span className="tag" style={{ background: "color-mix(in oklch, var(--accent) 15%, transparent)", color: "var(--accent)" }}>
                {post.tag}
              </span>
              <span style={{ color: "var(--text-muted)", font: "11px var(--font-mono)" }}>
                {post.date}
              </span>
              <span style={{ color: "var(--text-muted)", font: "11px var(--font-mono)" }}>•</span>
              <span style={{ color: "var(--text-muted)", font: "11px var(--font-mono)" }}>
                {post.readTime}
              </span>
            </div>

            <h1
              style={{
                fontFamily: "var(--font-serif), 'Source Serif 4', Georgia, serif",
                fontSize: "clamp(32px, 5vw, 52px)",
                fontWeight: 600,
                color: "var(--text)",
                lineHeight: 1.08,
                marginBottom: 20,
                letterSpacing: "-0.03em",
              }}
            >
              {tr ? post.title_tr : post.title}
            </h1>

            <p
              style={{
                fontFamily: "var(--font-serif), 'Source Serif 4', Georgia, serif",
                fontSize: 20,
                lineHeight: 1.55,
                color: "var(--text-dim)",
                borderLeft: "2px solid var(--accent)",
                paddingLeft: 20,
              }}
            >
              {tr ? post.summary_tr : post.summary}
            </p>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginTop: 28,
                paddingTop: 20,
                borderTop: "1px solid var(--border)",
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: "color-mix(in oklch, var(--accent) 20%, var(--bg-card))",
                  border: "1px solid var(--accent)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--accent)",
                  font: "600 13px var(--font-mono)",
                }}
              >
                MT
              </div>
              <div>
                <div style={{ color: "var(--text)", font: "600 13px var(--font-mono)" }}>
                  {post.author}
                </div>
                <div style={{ color: "var(--text-muted)", font: "11px var(--font-mono)" }}>
                  Aurict Decision Core Team
                </div>
              </div>
            </div>
          </div>

          {/* Article Body */}
          <div
            className="inner-copy"
            style={{
              borderTop: "1px solid var(--border)",
              paddingTop: 36,
              display: "grid",
              gap: 28,
            }}
          >
            <h2>{tr ? "1. Sunucu Taraflı Yaklaşımların Çıkmazı" : "1. The Server-Side Bottleneck"}</h2>
            <p>
              {tr
                ? "Geleneksel pazarlama otomasyon platformları (Braze, Insider, Dynamic Yield) kararlarını merkezi bulut sunucularında alır. Kullanıcı bir sayfaya girdiğinde veya bir düğmeye bastığında istemci sunucuya HTTP isteği gönderir, karar kuralları değerlendirilir ve yanıt beklenir."
                : "Traditional marketing automation platforms evaluate targeting rules on central cloud servers. Every user gesture requires an asynchronous HTTP call across public networks to compute the next best offer."}
            </p>
            <p>
              {tr
                ? "Bu mimari iki büyük zafiyete yol açar: 50-500ms ağ gecikmesi ve kullanıcı kişisel verilerinin zorunlu olarak sunucuya aktarılması. Aurict Decision bu iki zafiyeti sıfırlamak üzere kuruldu."
                : "This creates two critical flaws: 50-500ms network roundtrip latency and mandatory transmission of sensitive raw user telemetry to third-party servers. Aurict Decision was engineered to eliminate both."}
            </p>

            {/* Key Takeaways Box */}
            <div
              style={{
                background: "color-mix(in oklch, var(--accent) 8%, var(--bg-card))",
                border: "1px solid color-mix(in oklch, var(--accent) 30%, transparent)",
                padding: "24px 28px",
                borderRadius: 4,
                margin: "12px 0",
              }}
            >
              <div
                style={{
                  color: "var(--accent)",
                  font: "600 12px var(--font-mono)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: 12,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <CheckCircle2 size={16} />
                {tr ? "ÖNEMLİ ÇIKARIMLAR" : "KEY TAKEAWAYS"}
              </div>
              <ul style={{ margin: 0, paddingLeft: 20, color: "var(--text)", font: "15px / 1.6 var(--font-serif)" }}>
                <li>{tr ? "Cihaz üstünde çıkarım (on-device inference) gecikmeyi 10ms altına indirir." : "On-device inference lowers evaluation latency to under 10ms."}</li>
                <li>{tr ? "Ham davranış verisi istemciden ayrılmaz; KVKK ve GDPR uyumu %100 doğaldır." : "Zero raw behavioral data leaves the device, guaranteeing native GDPR/KVKK compliance."}</li>
                <li>{tr ? "SHAP özellikleri ile her karar anında açıklanabilir ve denetlenebilirdir." : "SHAP explainability vector log ensures every decision is fully deterministic."}</li>
              </ul>
            </div>

            <h2>{tr ? "2. Cihaz Üstü Karar Çalışma Zamanı" : "2. On-Device Decision Runtime"}</h2>
            <p>
              {tr
                ? "WebAssembly ve WebCrypto ile güçlendirilen Aurict Decision SDK'sı, küçük boyutlu nicellenmiş (quantized) modelleri doğrudan istemci hafızasında çalıştırır. Örnek bir entegrasyon kodu:"
                : "Powered by WebAssembly and WebCrypto, Aurict Decision SDK runs quantized TFLite & ONNX decision models directly in browser and mobile RAM:"}
            </p>

            <pre
              style={{
                background: "var(--bg-deep)",
                border: "1px solid var(--border)",
                padding: "20px 24px",
                borderRadius: 4,
                color: "var(--text)",
                font: "12px / 1.65 var(--font-mono)",
                overflowX: "auto",
              }}
            >
              {`import { MicroTarget } from '@aurict/sdk';

// Initialize lightweight on-device runtime
const mt = new MicroTarget({ projectId: 'proj_live_992' });

// Evaluate intent score in <5ms without network calls
const decision = await mt.session.evaluate({
  context: 'cart_checkout_page',
  cartValue: 145.50,
  idleTimeMs: 1400
});

console.log(decision);
// Output: { action: "offer_free_shipping", confidence: 0.94, latencyMs: 3.2 }`}
            </pre>

            <h2>{tr ? "3. Sonuç ve Gelecek" : "3. Conclusion & Outlook"}</h2>
            <p>
              {tr
                ? "Gizlilik yasaları sıkılaştıkça ve istemci donanımları güçlendikçe, uçta ML çalıştırmak bir lüks değil e-ticaret siteleri için zorunluluk haline gelmektedir."
                : "As privacy regulations tighten globally and client hardware accelerates, edge-first decisioning is evolving from a competitive edge into an industry imperative."}
            </p>
          </div>

          {/* Share & Back */}
          <div
            style={{
              marginTop: 48,
              paddingTop: 24,
              borderTop: "1px solid var(--border)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Link
              href="/blog"
              className="aur-button aur-button-secondary"
              style={{ fontSize: 12 }}
            >
              ← {tr ? "Tüm Makaleler" : "All Articles"}
            </Link>
            <a
              href="https://console.aurict.com"
              className="aur-button aur-button-primary"
              style={{ fontSize: 12 }}
            >
              {tr ? "Dene / Başla" : "Try Decision Engine"}
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
