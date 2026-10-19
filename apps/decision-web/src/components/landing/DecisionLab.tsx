"use client";

import { Check, ChevronRight } from "lucide-react";
import { useLocale } from "next-intl";
import { useState } from "react";
import styles from "./DecisionLab.module.css";

const SCENARIOS = {
  en: [
    {
      id: "cart-risk",
      label: "Cart risk",
      context: "E-commerce · checkout",
      title: "Recover the cart",
      variant: "Free delivery · 20 min",
      confidence: "94.2",
      reason: "High exit intent + returning customer + shipping sensitivity",
      signals: [
        ["Exit intent", 86],
        ["Purchase propensity", 72],
        ["Offer affinity", 91],
      ],
    },
    {
      id: "high-value",
      label: "High-value intent",
      context: "Retail · product detail",
      title: "Open priority showcase",
      variant: "Premium collection · editorial",
      confidence: "88.7",
      reason: "Repeat premium views + high dwell time + low price sensitivity",
      signals: [
        ["Premium affinity", 93],
        ["Engagement depth", 81],
        ["Purchase propensity", 77],
      ],
    },
    {
      id: "content",
      label: "Content affinity",
      context: "Media · article",
      title: "Continue the journey",
      variant: "Next story · climate desk",
      confidence: "91.3",
      reason: "Topic sequence + scroll depth + recency window",
      signals: [
        ["Topic affinity", 95],
        ["Completion rate", 84],
        ["Return likelihood", 79],
      ],
    },
  ],
  tr: [
    {
      id: "cart-risk",
      label: "Sepet riski",
      context: "E-ticaret · ödeme",
      title: "Sepeti kurtar",
      variant: "Ücretsiz teslimat · 20 dk",
      confidence: "94.2",
      reason: "Yüksek çıkış niyeti + geri dönen müşteri + teslimat hassasiyeti",
      signals: [
        ["Çıkış niyeti", 86],
        ["Satın alma eğilimi", 72],
        ["Teklif ilgisi", 91],
      ],
    },
    {
      id: "high-value",
      label: "Yüksek değer niyeti",
      context: "Perakende · ürün detayı",
      title: "Öncelikli vitrini aç",
      variant: "Premium koleksiyon · editoryal",
      confidence: "88.7",
      reason: "Tekrarlanan premium görüntüleme + uzun inceleme + düşük fiyat hassasiyeti",
      signals: [
        ["Premium ilgisi", 93],
        ["Etkileşim derinliği", 81],
        ["Satın alma eğilimi", 77],
      ],
    },
    {
      id: "content",
      label: "İçerik ilgisi",
      context: "Medya · makale",
      title: "Yolculuğu sürdür",
      variant: "Sıradaki içerik · iklim",
      confidence: "91.3",
      reason: "Konu dizisi + kaydırma derinliği + güncellik aralığı",
      signals: [
        ["Konu ilgisi", 95],
        ["Tamamlama oranı", 84],
        ["Geri dönüş olasılığı", 79],
      ],
    },
  ],
} as const;

export function DecisionLab() {
  const locale = useLocale();
  const tr = locale === "tr";
  const scenarios = tr ? SCENARIOS.tr : SCENARIOS.en;
  const [activeIndex, setActiveIndex] = useState(0);
  const active = scenarios[activeIndex];

  return (
    <div className={`${styles.lab} surface-dark`}>
      <div className={styles.scenarioList}>
        <div className={styles.panelLabel}>
          <span>{tr ? "Bağlam seç" : "Select context"}</span>
          <span>03 {tr ? "senaryo" : "scenarios"}</span>
        </div>
        {scenarios.map((scenario, index) => (
          <button
            aria-pressed={activeIndex === index}
            className={activeIndex === index ? styles.activeScenario : ""}
            key={scenario.id}
            onClick={() => setActiveIndex(index)}
            type="button"
          >
            <span className={styles.scenarioIndex}>0{index + 1}</span>
            <span>
              <strong>{scenario.label}</strong>
              <small>{scenario.context}</small>
            </span>
            <ChevronRight aria-hidden="true" size={15} strokeWidth={1.5} />
          </button>
        ))}
      </div>

      <div className={styles.signalPanel}>
        <div className={styles.panelLabel}>
          <span>{tr ? "Canlı skorlar" : "Live scores"}</span>
          <span className={styles.processing}>
            <i />
            {tr ? "işleniyor" : "processing"}
          </span>
        </div>

        <div className={styles.signalBars} key={active.id}>
          {active.signals.map(([label, value]) => (
            <div className={styles.signal} key={label}>
              <div>
                <span>{label}</span>
                <strong>{value / 100}</strong>
              </div>
              <div className={styles.track}>
                <span style={{ width: `${value}%` }} />
              </div>
            </div>
          ))}
        </div>

        <div className={styles.policy}>
          <span>{tr ? "Politika kontrolü" : "Policy check"}</span>
          <strong>
            <Check aria-hidden="true" size={13} />
            {tr ? "uygun" : "eligible"}
          </strong>
        </div>
      </div>

      <div className={styles.outcome} key={`${active.id}-outcome`}>
        <div className={styles.outcomeTop}>
          <span>{tr ? "Seçilen eylem" : "Selected action"}</span>
          <span>7.4ms</span>
        </div>

        <div className={styles.outcomeMark} aria-hidden="true">
          <span />
          <i>01</i>
        </div>

        <p>{tr ? "SONRAKİ EN İYİ EYLEM" : "NEXT BEST ACTION"}</p>
        <h3>{active.title}</h3>
        <small>{active.variant}</small>

        <div className={styles.confidence}>
          <div>
            <span>{tr ? "Güven" : "Confidence"}</span>
            <strong>{active.confidence}%</strong>
          </div>
          <div className={styles.confidenceTrack}>
            <span style={{ width: `${active.confidence}%` }} />
          </div>
        </div>

        <div className={styles.reason}>
          <span>{tr ? "neden" : "why"}</span>
          <p>{active.reason}</p>
        </div>
      </div>
    </div>
  );
}
