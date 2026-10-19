"use client";

import { useLocale } from "next-intl";
import { Footer } from "@/components/Footer";

export default function PrivacyPage() {
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
                font: "10px var(--font-mono)",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                marginBottom: 16,
              }}
            >
              {tr ? "yasal dokümanlar" : "legal documentation"}
            </p>
            <h1 className="page-h1">
              {tr ? "Gizlilik Politikası" : "Privacy Policy"}
            </h1>
            <p className="page-lead" style={{ marginTop: 12 }}>
              {tr
                ? "Aurict Decision'ın veriyi cihaz üstünde tutma prensibi ve yasal haklarınız hakkında bilgilendirme."
                : "How Aurict Decision enforces on-device data processing and safeguards user privacy."}
            </p>
            <p
              style={{
                font: "11px var(--font-mono)",
                color: "var(--text-muted)",
                marginTop: 16,
              }}
            >
              {tr ? "Son güncelleme: Temmuz 2026" : "Last updated: July 2026"}
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
              <h2>{tr ? "1. Gizlilik Yaklaşımımız" : "1. Our Approach to Privacy"}</h2>
              <p>
                {tr
                  ? "Aurict Decision, kullanıcı verilerinin cihazı asla terk etmemesi gerektiği ilkesi üzerine kurulmuştur. Karar Motoru SDK'sı tüm oturum puanlamalarını, niyet tespitlerini ve aksiyon seçimlerini cihaz üstünde (on-device) gerçekleştirir. Sunucularımıza hiçbir ham davranışsal veri iletilmez."
                  : "Aurict Decision is built on the principle that user data should never leave the device. The Decision Engine SDK performs all session scoring, intent detection, and decision selection on-device. No raw behavioral data is transmitted to our servers."}
              </p>
            </section>

            <section>
              <h2>{tr ? "2. İşlenen Veri Kategori̇leri" : "2. Data We Process"}</h2>
              <div
                style={{
                  background: "color-mix(in oklch, var(--bg-card) 80%, var(--bg))",
                  border: "1px solid var(--border)",
                  padding: 24,
                  marginBottom: 16,
                  display: "grid",
                  gap: 16,
                }}
              >
                <div>
                  <strong style={{ color: "var(--accent)", font: "12px var(--font-mono)", display: "block", marginBottom: 6 }}>
                    {tr ? "CİHAZ ÜSTÜNDEKİ VERİLER (Asla aktarılmaz):" : "ON-DEVICE DATA (Never transmitted):"}
                  </strong>
                  <p style={{ margin: 0, fontSize: 14 }}>
                    {tr
                      ? "Oturum sinyalleri, sayfa görüntüleme süreleri, kaydırma derinliği, tıklama olayları, sepet hareketleri ve puanlama için kullanılan yerel davranışsal kalıplar."
                      : "Session signals, page duration, scroll depth, click events, cart updates, and local behavioral vectors used for scoring."}
                  </p>
                </div>
                <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16 }}>
                  <strong style={{ color: "var(--success)", font: "12px var(--font-mono)", display: "block", marginBottom: 6 }}>
                    {tr ? "BULUT ALTYAPISINA İLETİLEN VERİLER (Anonimleşti̇ri̇lmi̇ş):" : "TRANSMITTED TO CLOUD (Anonymized):"}
                  </strong>
                  <p style={{ margin: 0, fontSize: 14 }}>
                    {tr
                      ? "Toplu karar sayıları, kampanya performans metrikleri, A/B test sonuçları ve şifrelenmiş federe model güncellemeleri. Bu verilerin hiçbiri kişisel olarak tanımlanabilir bilgi içermez."
                      : "Aggregated decision counters, campaign conversion metrics, A/B test results, and encrypted federated model delta updates. None contains PII."}
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2>{tr ? "3. Hukuki Sebepler (KVKK & GDPR)" : "3. Legal Basis"}</h2>
              <p>
                {tr
                  ? "Verileri şu hukuki sebeplere dayanarak işliyoruz: SDK analitiği için açık rıza, dolandırıcılık önleme ve hizmet iyileştirmesi için meşru menfaat, müşterilerimize karar motoru sunmak için sözleşmenin ifası."
                  : "We process data under valid legal bases: explicit consent for client analytics, legitimate interest for fraud prevention and performance tuning, and contractual necessity for providing the decision engine."}
              </p>
            </section>

            <section>
              <h2>{tr ? "4. Kullanıcı Hakları" : "4. Your Rights"}</h2>
              <p>
                {tr
                  ? "KVKK ve GDPR kapsamında verilerinize erişme, düzeltme, silme ve taşıma hakkına sahipsiniz. Mimarimiz verileri cihazda tuttuğu için haklarınızı doğrudan cihazınızdaki entegre uygulama üzerinden kullanabilirsiniz."
                  : "Under KVKK, GDPR, and CCPA, users maintain rights to access, rectify, erase, and port their data. Because data remains localized, users exercise control directly on device."}
              </p>
            </section>

            <section>
              <h2>{tr ? "5. Veri Saklama Süreleri" : "5. Data Retention"}</h2>
              <p>
                {tr
                  ? "Cihaz içi oturum sinyalleri geçicidir ve oturum sona erdiğinde bellekten silinir. Buluttaki anonimleştirilmiş performans metrikleri ise plan paketine göre (Starter: 7 gün, Growth: 30 gün, Scale: 90 gün) saklanır."
                  : "On-device session signals are ephemeral and cleared when no longer needed. Aggregated cloud performance metrics are retained based on plan tiers (7, 30, or 90 days)."}
              </p>
            </section>

            <section>
              <h2>{tr ? "6. Üçüncü Taraflarla Paylaşım" : "6. Third Parties"}</h2>
              <p>
                {tr
                  ? "Aurict Decision kişisel verileri satmaz. Sağlayıcı devri (Braze, Insider vb.) yapılandırıldığında harici platformlara yalnızca aksiyon kimliği ve kampanya metadata'sı aktarılır; ham ham veri iletilmez."
                  : "Aurict Decision never sells data. When decision handoffs are enabled for providers (Braze, Insider, etc.), only the action identifier and campaign metadata are dispatched."}
              </p>
            </section>

            <section>
              <h2>{tr ? "7. İletişim & DPO" : "7. Contact Information"}</h2>
              <p>
                {tr
                  ? "Gizlilikle ilgili tüm sorularınız için DPO ekibimize ulaşabilirsiniz: privacy@aurict.com veya dpo@aurict.com."
                  : "For privacy inquiries or compliance requests, reach our Data Protection Officer at privacy@aurict.com or dpo@aurict.com."}
              </p>
            </section>
          </div>
        </div>

        {/* Final CTA */}
        <section className="section-final" style={{ marginTop: 80 }}>
          <p>{tr ? "gizlilik garantisi" : "privacy guaranteed"}</p>
          <h2>
            {tr ? "Sorularınız var mı?" : "Have questions about our privacy policies?"}
          </h2>
          <div>
            <a href="mailto:privacy@aurict.com" className="aur-button aur-button-primary">
              {tr ? "Gizlilik Ekibine Yazın" : "Contact Privacy Team"}
            </a>
            <a href="/security" className="aur-button aur-button-secondary">
              {tr ? "Güvenlik Sayfası" : "Security Architecture"}
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
