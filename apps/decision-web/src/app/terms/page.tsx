"use client";

import { TightPeriods } from "@/components/ui/TightPeriods";
import { useLocale } from "next-intl";
import { Footer } from "@/components/Footer";

export default function TermsPage() {
  const locale = useLocale();
  const tr = locale === "tr";

  return (
    <>
      <main>
        <div className="inner-main-narrow">
          {/* Header */}
          <div className="page-intro" style={{ display: "block", marginBottom: 48 }}>
            <p
              style={{
                color: "var(--accent)",
                font: "700 12.5px var(--font-sans)",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                marginBottom: 16,
              }}
            >
              {tr ? "yasal dokümanlar" : "legal documentation"}
            </p>
            <h1 className="page-h1">
              <TightPeriods text={tr ? "Kullanım Koşulları" : "Terms of Service"} />
            </h1>
            <p className="page-lead" style={{ marginTop: 12 }}>
              {tr
                ? "Aurict Decision Karar Motoru hizmet şartları ve lisans koşulları."
                : "Terms and conditions governing the use of the Aurict Decision Engine."}
            </p>
            <p
              style={{
                font: "700 12.5px var(--font-sans)",
                color: "var(--text-muted)",
                marginTop: 16,
              }}
            >
              {tr ? "Yürürlük tarihi: Temmuz 2026" : "Effective date: July 2026"}
            </p>
          </div>

          <div
            className="inner-copy"
            style={{
              display: "grid",
              gap: 40,
              borderTop: "1px solid var(--border)",
              paddingTop: 40,
            }}
          >
            <section>
              <h2>{tr ? "1. Şartların Kabulü" : "1. Acceptance"}</h2>
              <p>
                {tr
                  ? "Aurict Decision Karar Motorunu kullanarak bu şartları kabul etmiş olursunuz. Bir kurum adına kullanıyorsanız, o kurumu temsil etme ve bağlama yetkisine sahip olduğunuzu beyan edersiniz."
                  : "By accessing or using the Aurict Decision Engine, you agree to be bound by these terms. If using on behalf of an organization, you represent authority to bind that entity."}
              </p>
            </section>

            <section>
              <h2>{tr ? "2. Lisans" : "2. License"}</h2>
              <p>
                {tr
                  ? "Aurict Decision Karar Motoru SDK'ları ve temel çalışma zamanı Aurict'e ait tescilli yazılımlardır ve ticari lisans kapsamında sunulur. Yazılımı yalnızca lisans sözleşmenizde belirtilen şartlar dahilinde kullanabilirsiniz; izinsiz kopyalama, değiştirme ve dağıtım yasaktır. Kurumsal lisans seçenekleri için bizimle iletişime geçin."
                  : "The Aurict Decision Engine SDKs and core runtime are proprietary software owned by Aurict and are provided under a commercial license. You may use the software only as permitted by your license agreement; unauthorized copying, modification, and distribution are prohibited. Contact us for enterprise licensing options."}
              </p>
            </section>

            <section>
              <h2>{tr ? "3. Hizmet Tanımı" : "3. Service Description"}</h2>
              <p>
                {tr
                  ? "Aurict Decision; (a) istemci tarafı puanlama SDK'ları, (b) kampanya yönetimi ve analitik sunan bulut panosu ve (c) isteğe bağlı federe öğrenme servislerinden oluşan bir karar motorudur."
                  : "Aurict Decision provides an on-device decision engine consisting of: client scoring SDKs, cloud dashboard for analytics and management, and optional federated learning services."}
              </p>
            </section>

            <section>
              <h2>{tr ? "4. Krediler ve Faturalandırma" : "4. Credits & Billing"}</h2>
              <p>
                {tr
                  ? "Fiyatlandırma aylık karar kredilerine dayanır. Karar çalışma zamanına yapılan her evaluation çağrısı 1 karar kredisi tüketir. Kullanılmayan krediler sonraki aya devretmez."
                  : "Pricing is structured around monthly decision credits. Each evaluation execution consumes one credit. Unused credits reset at the end of each billing cycle."}
              </p>
            </section>

            <section>
              <h2>{tr ? "5. Kabul Edilebilir Kullanım" : "5. Acceptable Use"}</h2>
              <p>
                {tr
                  ? "Hizmet; yasa dışı faaliyetler, korunan özelliklere dayalı ayrımcılık içeren kararlar veya yüksek riskli (tıbbi, finansal, kritik güvenlik) uygulamalar için yetkisiz kullanılamaz."
                  : "You may not use Aurict Decision for illegal purposes, discriminatory automated decisions, or safety-critical high-risk deployments without explicit prior authorization."}
              </p>
            </section>

            <section>
              <h2>{tr ? "6. Sorumluluk Sınırı & İletişim" : "6. Limitation & Contact"}</h2>
              <p>
                {tr
                  ? "Aurict Decision olduğu gibi sunulmaktadır. Yasal sorularınız için: legal@aurict.com."
                  : "Aurict Decision is provided as-is without warranty. For legal inquiries: legal@aurict.com."}
              </p>
            </section>
          </div>
        </div>

        {/* Final CTA */}
        <section className="section-final" style={{ marginTop: 80 }}>
          <p>{tr ? "aurict yasal şartlar" : "aurict legal terms"}</p>
          <h2>
            {tr ? "Hemen entegrasyona başlayın." : "Start integrating today."}
          </h2>
          <div>
            <a href="https://console.aurict.com" className="aur-button aur-button-primary">
              {tr ? "Ücretsiz Başla" : "Get Started Free"}
            </a>
            <a href="mailto:legal@aurict.com" className="aur-button aur-button-secondary">
              {tr ? "Hukuk Ekibiyle İletişim" : "Contact Legal"}
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
