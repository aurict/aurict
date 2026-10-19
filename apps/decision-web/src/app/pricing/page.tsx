"use client";

import { TightPeriods } from "@/components/ui/TightPeriods";
import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { Footer } from "@/components/Footer";

type Price = {
  id: string;
  plan: string;
  billingInterval: string;
  currency: string;
  amountMinor: number;
  includedCredits: number;
};

const API_URL = process.env.NEXT_PUBLIC_DECISION_API_URL || "https://decision.aurict.com";

export default function PricingPage() {
  const tr = useLocale() === "tr";
  const [prices, setPrices] = useState<Price[]>([]);
  const [trialDays, setTrialDays] = useState(14);

  useEffect(() => {
    fetch(`${API_URL}/api/billing/plans`)
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((data) => {
        setPrices(data.prices || []);
        setTrialDays(data.trialDays || 14);
      })
      .catch(() => setPrices([]));
  }, []);

  const paid = prices.filter((price) => price.plan !== "DEVELOPER");
  return (
    <>
      <main className="inner-main-wide">
        <div className="page-intro">
          <div className="page-intro-eyebrow">{tr ? "şeffaf fiyatlandırma" : "transparent pricing"}</div>
          <h1 className="page-h1"><TightPeriods text={tr ? "Küçük başlayın, kullanımla büyüyün." : "Start small. Scale with usage."} /></h1>
          <p className="page-lead">{tr ? "Developer ve SaaS planları toplantı olmadan kullanılabilir. Self-host ve Enterprise mimari görüşme gerektirir." : "Developer and SaaS plans are self-service. Self-host and Enterprise include an architecture review."}</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: 16, marginBottom: 56 }}>
          <PlanCard
            title="Developer"
            price="$0"
            subtitle={tr ? "Kredi kartı gerekmez" : "No credit card required"}
            features={tr ? ["10.000 aylık kredi", "1 uygulama", "2 ekip üyesi", "Topluluk desteği"] : ["10,000 monthly credits", "1 application", "2 team members", "Community support"]}
            href="https://decision.aurict.com/register"
            cta={tr ? "Ücretsiz Başla" : "Start Free"}
          />
          {paid.map((price) => (
            <PlanCard
              key={price.id}
              title={price.plan}
              price={new Intl.NumberFormat(tr ? "tr-TR" : "en-US", { style: "currency", currency: price.currency, maximumFractionDigits: 0 }).format(price.amountMinor / 100)}
              subtitle={price.billingInterval === "ANNUAL" ? (tr ? "yıllık faturalama" : "billed annually") : (tr ? "aylık" : "per month")}
              features={[`${price.includedCredits.toLocaleString()} ${tr ? "aylık kredi" : "monthly credits"}`, tr ? "Otomatik kullanım takibi" : "Automated usage tracking", tr ? "Müşteri portalı ve faturalar" : "Customer portal and invoices"]}
              href={`https://decision.aurict.com/register?price=${encodeURIComponent(price.id)}`}
              cta={tr ? `${trialDays} Gün Ücretsiz Dene` : `Start ${trialDays}-Day Trial`}
            />
          ))}
          <PlanCard
            title="Self-host"
            price={tr ? "Özel" : "Custom"}
            subtitle={tr ? "Docker/Kubernetes veya air-gap" : "Docker/Kubernetes or air-gapped"}
            features={tr ? ["Müşteri altyapısında çalışma", "İmzalı offline lisans", "Kurulum ve yükseltme desteği", "Toplantı gerekli"] : ["Runs in your infrastructure", "Signed offline licensing", "Install and upgrade support", "Meeting required"]}
            href="/contact?type=SELF_HOST"
            cta={tr ? "Mimari Görüşme" : "Architecture Call"}
          />
          <PlanCard
            title="Enterprise"
            price={tr ? "Özel" : "Custom"}
            subtitle={tr ? "Hacim, SLA ve güvenliğe göre" : "Based on volume, SLA and security"}
            features={tr ? ["SAML/SCIM ve özel RBAC", "Güvenlik incelemesi", "Özel SLA ve destek", "Dedicated veya self-host"] : ["SAML/SCIM and custom RBAC", "Security review", "Custom SLA and support", "Dedicated or self-hosted"]}
            href="/contact?type=ENTERPRISE"
            cta={tr ? "Toplantı Planla" : "Book a Meeting"}
          />
        </div>

        <section
          aria-labelledby="pricing-contact-title"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 24,
            marginBottom: 64,
            padding: 24,
            border: "1px solid var(--border)",
            borderRadius: 8,
            background: "var(--bg-card)",
          }}
        >
          <div>
            <h2 id="pricing-contact-title" style={{ fontSize: 22, marginBottom: 8 }}>
              {tr ? "Hangi planın uygun olduğundan emin değil misiniz?" : "Not sure which plan fits?"}
            </h2>
            <p style={{ color: "var(--text-dim)" }}>
              {tr
                ? "İhtiyaçlarınızı birlikte değerlendirelim; doğru planı ve kurulum modelini seçmenize yardımcı olalım."
                : "Tell us what you need and we will help you choose the right plan and deployment model."}
            </p>
          </div>
          <a className="aur-button aur-button-secondary" href="/contact">
            {tr ? "Bize Ulaşın" : "Contact Us"}
          </a>
        </section>
      </main>
      <Footer />
    </>
  );
}

function PlanCard({ title, price, subtitle, features, href, cta }: { title: string; price: string; subtitle: string; features: string[]; href: string; cta: string }) {
  return (
    <article style={{ border: "1px solid var(--border)", background: "var(--bg-card)", padding: 24, borderRadius: 8, display: "flex", flexDirection: "column" }}>
      <div className="mono" style={{ color: "var(--accent)", fontSize: 12, textTransform: "uppercase" }}>{title}</div>
      <div style={{ fontSize: 40, marginTop: 16 }}>{price}</div>
      <p style={{ color: "var(--text-muted)", minHeight: 42 }}>{subtitle}</p>
      <ul style={{ listStyle: "none", display: "grid", gap: 10, margin: "24px 0", color: "var(--text-dim)" }}>{features.map((item) => <li key={item}>✓ {item}</li>)}</ul>
      <a className="aur-button aur-button-primary" style={{ marginTop: "auto" }} href={href}>{cta}</a>
    </article>
  );
}
