"use client";

import {
  Activity,
  ArrowRight,
  BrainCircuit,
  Check,
  Fingerprint,
  GitBranch,
  ScanSearch,
  Webhook,
} from "lucide-react";
import { useLocale } from "next-intl";
import Image from "next/image";
import { DecisionLab } from "./DecisionLab";
import { TightPeriods } from "@/components/ui/TightPeriods";
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
const STEPS = [
  { en: ["capture", "Live first-party signals: browse, intent, cart, scroll and time on page."], tr: ["yakala", "Canlı birinci taraf sinyaller: gezinme, niyet, sepet, kaydırma ve sayfada kalma."] },
  { en: ["score", "Intent, affinity and propensity are scored locally in milliseconds."], tr: ["skorla", "Niyet, ilgi ve eğilim milisaniyeler içinde yerelde skorlanır."] },
  { en: ["govern", "Consent, budget, frequency and safety gates run before anything is shown."], tr: ["yönet", "Rıza, bütçe, frekans ve güvenlik kapıları hiçbir şey gösterilmeden önce çalışır."] },
  { en: ["decide", "One explainable next-best action is committed for the session."], tr: ["karar ver", "Oturum için tek ve açıklanabilir bir sonraki en iyi eylem seçilir."] },
] as const;

export function LandingSections() {
  const locale = useLocale();
  const tr = locale === "tr";
  const copy = tr ? CONTENT.tr : CONTENT.en;

  return (
    <>
      <section className={styles.thesis}>
        <div className={styles.shell}>
          <p className={styles.kicker}>{copy.thesisLabel}</p>
          <h2>
            <TightPeriods text={copy.thesis} /> <em><TightPeriods text={copy.thesisAccent} /></em>
          </h2>
          <p className={styles.thesisBody}>{copy.thesisBody}</p>
        </div>
      </section>

      <section className={styles.section} id="how-it-works">
        <div className={styles.shell}>
          <SectionHeading
            body={tr ? "Her karar aynı dört adımlık yoldan geçer; hepsi kullanıcının cihazında çalışır." : "Every decision takes the same four-step path, and all of it runs on the user's device."}
            label={tr ? "Nasıl çalışır" : "How it works"}
            title={tr ? "Sinyalden eyleme, tek bir yol." : "From signal to action, one path."}
          />
          <ol className={styles.steps}>
            {STEPS.map((step, index) => {
              const [name, text] = tr ? step.tr : step.en;
              return (
                <li key={step.en[0]}>
                  <span className={styles.stepIndex}>{String(index + 1).padStart(2, "0")}</span>
                  <h3>{name}</h3>
                  <p>{text}</p>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      <section className={`${styles.section} ${styles.tinted}`} id="capabilities">
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
                <article className={styles.card} key={card.title}>
                  <span className={styles.cardIcon}>
                    <Icon aria-hidden="true" size={22} strokeWidth={2} />
                  </span>
                  <span className={styles.cardTag}>{card.tag}</span>
                  <h3>{card.title}</h3>
                  <p>{card.body}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className={styles.section} id="decision-lab">
        <div className={styles.shell}>
          <SectionHeading
            body={copy.labBody}
            label={copy.labLabel}
            title={copy.labTitle}
          />
          <DecisionLab />
        </div>
      </section>

      <section className={`${styles.section} ${styles.tinted}`} id="security">
        <div className={`${styles.shell} ${styles.privacyLayout}`}>
          <div>
            <p className={styles.kicker}>{copy.privacyLabel}</p>
            <h2 className={styles.title}><TightPeriods text={copy.privacyTitle} /></h2>
            <p className={styles.body}>{copy.privacyBody}</p>
            <ul className={styles.privacyPoints}>
              {copy.privacyPoints.map((point) => (
                <li key={point}>
                  <Check aria-hidden="true" size={16} strokeWidth={3} />
                  {point}
                </li>
              ))}
            </ul>
          </div>
          <div className={styles.privacyVisual} aria-hidden="true">
            <Image alt="" height={760} src="/bento/shield.webp" width={635} />
            <div className={styles.privacyChip}>
              <span>raw_data</span>
              <strong>{tr ? "cihazda kalır" : "stays on device"}</strong>
            </div>
            <div className={`${styles.privacyChip} ${styles.privacyChipOut}`}>
              <span>decision_event</span>
              <strong>{tr ? "anonim" : "anonymous"}</strong>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.section} id="integrations">
        <div className={styles.shell}>
          <SectionHeading
            body={copy.integrationsBody}
            label={copy.integrationsLabel}
            title={copy.integrationsTitle}
          />
          <ul className={styles.integrationList}>
            {INTEGRATIONS.map((integration) => (
              <li key={integration}>
                {integration}
                <ArrowRight aria-hidden="true" size={16} strokeWidth={2.2} />
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className={`${styles.section} ${styles.tinted}`} id="faq">
        <div className={`${styles.shell} ${styles.faqShell}`}>
          <div className={styles.faqHeading}>
            <p className={styles.kicker}>{copy.faqLabel}</p>
            <h2 className={styles.title}><TightPeriods text={copy.faqTitle} /></h2>
          </div>
          <div className={styles.faqList}>
            {copy.faqs.map(([question, answer]) => (
              <details key={question}>
                <summary>
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
        <Image alt="" aria-hidden="true" className={styles.finalArt} height={607} src="/bento/arrow.webp" width={897} />
        <p>{copy.finalLabel}</p>
        <h2><TightPeriods text={copy.finalTitle} /></h2>
        <div>
          <a className={styles.finalPrimary} href="https://decision.aurict.com/register">
            {copy.finalPrimary}
            <ArrowRight aria-hidden="true" size={18} strokeWidth={2.4} />
          </a>
          <a className={styles.finalSecondary} href="/contact">{copy.finalSecondary}</a>
        </div>
      </section>
    </>
  );
}

function SectionHeading({ label, title, body }: { label: string; title: string; body: string }) {
  return (
    <div className={styles.sectionHeading}>
      <p className={styles.kicker}>{label}</p>
      <h2 className={styles.title}><TightPeriods text={title} /></h2>
      <p className={styles.body}>{body}</p>
    </div>
  );
}
