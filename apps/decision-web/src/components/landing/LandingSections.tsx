"use client";

import {
  Activity,
  ArrowRight,
  BrainCircuit,
  Check,
  Database,
  Fingerprint,
  GitBranch,
  ScanSearch,
  ShieldCheck,
  Webhook,
} from "lucide-react";
import { useLocale } from "next-intl";
import Image from "next/image";
import { DecisionLab } from "./DecisionLab";
import styles from "./LandingSections.module.css";

const CONTENT = {
  en: {
    thesisLabel: "A different Decision Engine",
    thesis: "Decide in the moment,",
    thesisAccent: "not after the moment.",
    thesisBody: "Use the context they create right now. Make one relevant decision. Let the raw behavior stay where it belongs — on their device.",
    capabilitiesLabel: "Decision architecture",
    capabilitiesTitle: "A complete Decision Engine between signal and action.",
    capabilitiesBody: "A compact runtime built for the moment of intent — observable, explainable, and fast enough to sit inside the experience.",
    cards: [
      {
        title: "Live signal scoring",
        body: "Turn first-party behavior into intent, affinity, and propensity scores continuously.",
        tag: "01 / score",
      },
      {
        title: "Fluid segments",
        body: "Audiences update as behavior changes, instead of waiting for the next warehouse sync.",
        tag: "02 / segment",
      },
      {
        title: "One governed decision",
        body: "Policies, eligibility, frequency, and predicted value converge into a single next-best action.",
        tag: "03 / decide",
      },
      {
        title: "Explain every outcome",
        body: "Keep the confidence, feature contribution, policy path, and fallback reason behind every decision.",
        tag: "04 / explain",
      },
      {
        title: "Learn without collecting",
        body: "Improve models with privacy-preserving updates while keeping raw session data on-device.",
        tag: "05 / learn",
      },
      {
        title: "Hand off anywhere",
        body: "Send the selected action to Braze, Insider, Segment, your app, or a custom webhook.",
        tag: "06 / activate",
      },
    ],
    labLabel: "Live decision lab",
    labTitle: "See context become action.",
    labBody: "Switch scenarios to inspect how the same engine weighs signals, checks policy, and commits one explainable action.",
    privacyLabel: "Privacy by architecture",
    privacyTitle: "Personalization without building a shadow profile.",
    privacyBody: "The session is understood where it happens. Raw behavioral events are scored locally; only the governed outcome and privacy-safe measurement leave the device.",
    privacyPoints: ["On-device inference", "Consent-aware collection", "Auditable decision logs", "KVKK & GDPR ready"],
    integrationsLabel: "Activation layer",
    integrationsTitle: "Your stack stays. It just gets smarter.",
    integrationsBody: "The Aurict Decision Engine decides. The tools your team already trusts deliver.",
    faqLabel: "Questions / answers",
    faqTitle: "Built to fit, not replace.",
    faqs: [
      ["Does the Aurict Decision Engine replace our engagement platform?", "No. It is the decision layer between live context and execution. Braze, Insider, Segment, or your own stack still delivers the experience."],
      ["What data leaves the device?", "Raw session behavior does not need to. Governed decision events and privacy-safe aggregate measurement can be sent according to your consent policy."],
      ["How quickly can a decision run?", "The runtime is designed for sub-10ms inference on modern devices, so a decision can resolve before the next interface render."],
      ["Can we inspect why an action was selected?", "Yes. Each outcome can include confidence, contributing signals, policy checks, model version, and fallback reason."],
    ],
    finalLabel: "The next session is already happening.",
    finalTitle: "Make it count.",
    finalPrimary: "Start with Aurict Decision",
    finalSecondary: "Contact us",
  },
  tr: {
    thesisLabel: "Yeni nesil Decision Engine",
    thesis: "Kararı sonradan değil,",
    thesisAccent: "niyet anında verin.",
    thesisBody: "Şimdi oluşturduğu bağlamı kullanın. Tek ve anlamlı bir karar verin. Ham davranış verisi ait olduğu yerde — cihazında — kalsın.",
    capabilitiesLabel: "Karar mimarisi",
    capabilitiesTitle: "Sinyal ile eylem arasında eksiksiz bir Decision Engine.",
    capabilitiesBody: "Niyet anı için tasarlanmış kompakt bir çalışma zamanı — gözlemlenebilir, açıklanabilir ve deneyimin içinde çalışacak kadar hızlı.",
    cards: [
      {
        title: "Canlı sinyal skorlama",
        body: "Birinci taraf davranışlarını sürekli olarak niyet, ilgi ve eğilim skorlarına dönüştürün.",
        tag: "01 / skorla",
      },
      {
        title: "Akışkan segmentler",
        body: "Kitleler bir sonraki veri ambarı senkronunu beklemeden, davranış değiştikçe güncellenir.",
        tag: "02 / segmentle",
      },
      {
        title: "Tek ve kontrollü karar",
        body: "Politikalar, uygunluk, frekans ve tahmini değer tek bir sonraki en iyi eylemde birleşir.",
        tag: "03 / karar ver",
      },
      {
        title: "Her sonucu açıklayın",
        body: "Her kararın güvenini, sinyal katkısını, politika yolunu ve yedekleme nedenini kaydedin.",
        tag: "04 / açıkla",
      },
      {
        title: "Toplamadan öğrenin",
        body: "Ham oturum verisini cihazda tutarken gizlilik korumalı güncellemelerle modelleri iyileştirin.",
        tag: "05 / öğren",
      },
      {
        title: "Her yere aktarın",
        body: "Seçilen eylemi Braze, Insider, Segment, uygulamanız veya özel bir webhook'a gönderin.",
        tag: "06 / etkinleştir",
      },
    ],
    labLabel: "Canlı karar laboratuvarı",
    labTitle: "Bağlamın eyleme dönüşümünü görün.",
    labBody: "Aynı motorun sinyalleri nasıl tarttığını, politikayı nasıl kontrol ettiğini ve tek bir açıklanabilir eyleme nasıl vardığını inceleyin.",
    privacyLabel: "Mimari gereği gizlilik",
    privacyTitle: "Gölge profil oluşturmadan kişiselleştirme.",
    privacyBody: "Oturum, gerçekleştiği yerde anlaşılır. Ham davranış sinyalleri yerelde skorlanır; cihazdan yalnızca kontrollü sonuç ve gizlilik korumalı ölçüm çıkar.",
    privacyPoints: ["Cihaz içi çıkarım", "Rıza duyarlı toplama", "Denetlenebilir karar kayıtları", "KVKK & GDPR uyumu"],
    integrationsLabel: "Aktivasyon katmanı",
    integrationsTitle: "Stack'iniz aynı kalır. Sadece daha akıllı olur.",
    integrationsBody: "Aurict Decision Engine karar verir. Ekibinizin güvendiği araçlar uygular.",
    faqLabel: "Sorular / yanıtlar",
    faqTitle: "Yerine geçmek için değil, uyum sağlamak için.",
    faqs: [
      ["Aurict Decision Engine etkileşim platformumuzun yerini alır mı?", "Hayır. Canlı bağlam ile uygulama arasındaki karar katmanıdır. Deneyimi yine Braze, Insider, Segment veya kendi altyapınız sunar."],
      ["Cihazdan hangi veri çıkar?", "Ham oturum davranışlarının çıkması gerekmez. Kontrollü karar olayları ve gizlilik korumalı toplu ölçümler rıza politikanıza göre iletilebilir."],
      ["Bir karar ne kadar hızlı çalışır?", "Çalışma zamanı modern cihazlarda 10ms altı çıkarım için tasarlanmıştır; karar bir sonraki arayüz çiziminden önce sonuçlanabilir."],
      ["Bir eylemin neden seçildiğini görebilir miyiz?", "Evet. Her sonuç güven skoru, katkı sağlayan sinyaller, politika kontrolleri, model sürümü ve yedekleme nedeni içerebilir."],
    ],
    finalLabel: "Bir sonraki oturum çoktan başladı.",
    finalTitle: "Değerini artırın.",
    finalPrimary: "Aurict Decision'ı deneyin",
    finalSecondary: "Bize ulaşın",
  },
} as const;

const CARD_ICONS = [Activity, GitBranch, BrainCircuit, ScanSearch, Fingerprint, Webhook] as const;
const INTEGRATIONS = ["Braze", "Insider", "Segment", "mParticle", "Firebase", "Mixpanel", "Amplitude", "Webhook API"] as const;

export function LandingSections() {
  const locale = useLocale();
  const copy = locale === "tr" ? CONTENT.tr : CONTENT.en;

  return (
    <>
      <section className={styles.thesis}>
        <div className={styles.shell}>
          <div className={styles.thesisIndex}>01 — 06</div>
          <div>
            <p className={styles.kicker}>{copy.thesisLabel}</p>
            <h2>
              {copy.thesis}
              <em>{copy.thesisAccent}</em>
            </h2>
          </div>
          <p className={styles.thesisBody}>{copy.thesisBody}</p>
        </div>
      </section>

      <section className={styles.capabilities} id="capabilities">
        <div className={styles.shell}>
          <SectionHeading
            body={copy.capabilitiesBody}
            label={copy.capabilitiesLabel}
            title={copy.capabilitiesTitle}
          />

          <div className={styles.capabilityGrid}>
            {copy.cards.map((card, index) => {
              const Icon = CARD_ICONS[index];
              return (
                <article
                  className={`${styles.capabilityCard} ${styles[`card${index + 1}`]}`}
                  key={card.title}
                >
                  <div className={styles.cardTop}>
                    <span>{card.tag}</span>
                    <Icon aria-hidden="true" size={18} strokeWidth={1.35} />
                  </div>
                  {index === 0 && <ScoreGlyph />}
                  {index === 1 && <SegmentGlyph />}
                  {index === 2 && <DecisionGlyph />}
                  <div className={styles.cardCopy}>
                    <h3>{card.title}</h3>
                    <p>{card.body}</p>
                  </div>
                  <span className={styles.cardArrow} aria-hidden="true">↗</span>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className={styles.labSection} id="decision-lab">
        <div className={styles.shell}>
          <SectionHeading
            body={copy.labBody}
            label={copy.labLabel}
            title={copy.labTitle}
          />
          <DecisionLab />
        </div>
      </section>

      <section className={styles.privacy} id="security">
        <div className={styles.shell}>
          <div className={styles.privacyCopy}>
            <p className={styles.kicker}>{copy.privacyLabel}</p>
            <h2>{copy.privacyTitle}</h2>
            <p>{copy.privacyBody}</p>
            <div className={styles.privacyPoints}>
              {copy.privacyPoints.map((point) => (
                <span key={point}>
                  <Check aria-hidden="true" size={13} />
                  {point}
                </span>
              ))}
            </div>
          </div>

          <div className={styles.deviceVisual} aria-hidden="true">
            <div className={styles.device}>
              <div className={styles.deviceTop}>
                <span />
                <i />
              </div>
              <div className={styles.deviceCore}>
                <Fingerprint size={40} strokeWidth={1} />
                <span>local inference</span>
                <strong>raw_data = retained</strong>
              </div>
              <div className={styles.deviceEvents}>
                <span>view</span>
                <span>intent</span>
                <span>context</span>
              </div>
            </div>
            <div className={styles.boundary}>
              <ShieldCheck size={17} strokeWidth={1.4} />
              <span>privacy boundary</span>
            </div>
            <div className={styles.safeOutput}>
              <Database size={18} strokeWidth={1.3} />
              <span>decision_event</span>
              <strong>anonymous</strong>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.integrations} id="integrations">
        <div className={styles.shell}>
          <div className={styles.integrationHeading}>
            <p className={styles.kicker}>{copy.integrationsLabel}</p>
            <h2>{copy.integrationsTitle}</h2>
            <p>{copy.integrationsBody}</p>
          </div>
          <div className={styles.integrationGrid}>
            {INTEGRATIONS.map((integration, index) => (
              <div key={integration}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{integration}</strong>
                <ArrowRight aria-hidden="true" size={14} strokeWidth={1.4} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.faq} id="faq">
        <div className={styles.shell}>
          <div className={styles.faqHeading}>
            <p className={styles.kicker}>{copy.faqLabel}</p>
            <h2>{copy.faqTitle}</h2>
          </div>
          <div className={styles.faqList}>
            {copy.faqs.map(([question, answer], index) => (
              <details key={question}>
                <summary>
                  <span>0{index + 1}</span>
                  <strong>{question}</strong>
                  <i aria-hidden="true">+</i>
                </summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.finalCta}>
        <div className={styles.finalGlow} aria-hidden="true" />
        <div className={styles.finalMark} aria-hidden="true">
          <Image src="/brand-mark.svg" alt="" width={42} height={42} />
        </div>
        <p>{copy.finalLabel}</p>
        <h2>{copy.finalTitle}</h2>
        <div>
          <a href="https://decision.aurict.com/register">
            {copy.finalPrimary}
            <ArrowRight aria-hidden="true" size={15} />
          </a>
          <a href="/contact">{copy.finalSecondary}</a>
        </div>
      </section>
    </>
  );
}

function SectionHeading({ label, title, body }: { label: string; title: string; body: string }) {
  return (
    <div className={styles.sectionHeading}>
      <p className={styles.kicker}>{label}</p>
      <h2>{title}</h2>
      <p>{body}</p>
    </div>
  );
}

function ScoreGlyph() {
  return (
    <div className={styles.scoreGlyph} aria-hidden="true">
      <span style={{ "--score": "82%" } as React.CSSProperties}><i>intent</i><b>0.82</b></span>
      <span style={{ "--score": "67%" } as React.CSSProperties}><i>affinity</i><b>0.67</b></span>
      <span style={{ "--score": "91%" } as React.CSSProperties}><i>propensity</i><b>0.91</b></span>
    </div>
  );
}

function SegmentGlyph() {
  return (
    <div className={styles.segmentGlyph} aria-hidden="true">
      <span /><span /><span /><span /><span /><span />
      <i>dynamic / 24</i>
    </div>
  );
}

function DecisionGlyph() {
  return (
    <div className={styles.decisionGlyph} aria-hidden="true">
      <span>signals</span>
      <i />
      <strong>01</strong>
      <i />
      <span>action</span>
    </div>
  );
}
