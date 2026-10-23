"use client";

import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import SectionHeading from "./SectionHeading";

const EASE = [0.16, 0.8, 0.2, 1] as const;

type Spotlight = {
  key: "jelly" | "duckley" | "mindgrid" | "dungeon" | "drift" | "roomie";
  name: string;
  features: string[];
  color: string;
  soft: string;
  // Main art plus an optional companion piece tucked into the panel corner.
  art: { src: string; className: string };
  companion?: { src: string; className: string };
  href?: string;
};

const SPOTLIGHTS: Spotlight[] = [
  {
    key: "jelly",
    name: "Jelly Paradox",
    features: ["f1", "f2", "f3", "f4"],
    color: "var(--jelly)",
    soft: "var(--jelly-soft)",
    art: { src: "/apps/juki.webp", className: "w-[62%] left-[8%] bottom-[6%]" },
    companion: { src: "/apps/jelly-cubes.webp", className: "w-[40%] right-[6%] top-[10%]" },
  },
  {
    key: "duckley",
    name: "Duckley",
    features: ["f1", "f2", "f3", "f4"],
    color: "var(--duck)",
    soft: "var(--duck-soft)",
    art: { src: "/apps/duki.webp", className: "h-[86%] left-1/2 -translate-x-1/2 bottom-[4%]" },
    href: "https://play.google.com/store/apps/details?id=com.aurict.duckley",
  },
  {
    key: "mindgrid",
    name: "Mind Grid",
    features: ["f1", "f2", "f3"],
    color: "var(--grid)",
    soft: "var(--grid-soft)",
    art: { src: "/apps/tiles.webp", className: "w-[58%] right-[6%] bottom-[8%]" },
    companion: { src: "/apps/mindgrid-icon.webp", className: "w-[30%] left-[10%] top-[12%] rounded-[22%] shadow-xl" },
    href: "https://play.google.com/store/apps/details?id=com.mindgrid.mind_grid",
  },
  {
    key: "dungeon",
    name: "Dungeon Lord",
    features: ["f1", "f2", "f3", "f4"],
    color: "var(--dungeon)",
    soft: "var(--dungeon-soft)",
    art: { src: "/apps/dungeon-dragon.webp", className: "w-[64%] left-[6%] bottom-[6%]" },
    companion: { src: "/apps/dungeon-icon.webp", className: "w-[26%] right-[8%] top-[10%] rounded-[22%] shadow-xl" },
  },
  {
    key: "drift",
    name: "Drift Street",
    features: ["f1", "f2", "f3", "f4"],
    color: "var(--drift)",
    soft: "var(--drift-soft)",
    art: { src: "/apps/drift.webp", className: "h-[82%] right-[4%] bottom-[4%]" },
    companion: { src: "/apps/drift-icon.webp", className: "w-[24%] left-[6%] top-[8%] rounded-[22%] shadow-xl" },
  },
  {
    key: "roomie",
    name: "Roomie Puzzle",
    features: ["f1", "f2", "f3", "f4"],
    color: "var(--roomie)",
    soft: "var(--roomie-soft)",
    art: { src: "/apps/roomie.webp", className: "h-[84%] right-[6%] bottom-[4%]" },
    companion: { src: "/apps/roomie-icon.webp", className: "w-[24%] left-[6%] top-[8%] rounded-[22%] shadow-xl" },
  },
];

const CHECK = (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" />
  </svg>
);

export default function Spotlights() {
  const { t } = useLanguage();

  return (
    <section id="spotlights" className="relative z-10 pb-28">
      <div className="section-shell">
        <SectionHeading eyebrow={t("spotlight.eyebrow")} title={t("spotlight.title")} />

        <div className="flex flex-col gap-20 lg:gap-28">
          {SPOTLIGHTS.map((app, index) => (
            <motion.article
              key={app.key}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.7, ease: EASE }}
              className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16"
            >
              <div
                className={`relative overflow-hidden rounded-[36px] ${index % 2 === 1 ? "lg:order-2" : ""}`}
                style={{ background: app.soft, aspectRatio: "5 / 4" }}
                aria-hidden="true"
              >
                <div
                  className="absolute -right-16 -top-16 h-64 w-64 rounded-full opacity-40 blur-3xl"
                  style={{ background: app.color }}
                />
                {app.companion && (
                  /* eslint-disable-next-line @next/next/no-img-element -- static transparent art from public/ */
                  <img src={app.companion.src} alt="" className={`aur-float absolute ${app.companion.className}`} style={{ animationDelay: "-3s" }} draggable={false} />
                )}
                {/* eslint-disable-next-line @next/next/no-img-element -- static transparent art from public/ */}
                <img src={app.art.src} alt="" className={`absolute ${app.art.className}`} draggable={false} />
              </div>

              <div>
                <div className="text-sm font-bold uppercase tracking-[0.14em] mb-3" style={{ color: app.color }}>
                  {t(`spotlight.${app.key}.kicker`)}
                </div>
                <h3 className="font-extrabold tracking-tight mb-5" style={{ fontSize: "clamp(2.25rem, 4vw, 3.25rem)", letterSpacing: "-0.035em", lineHeight: 1.02, color: "var(--text)" }}>
                  {app.name}
                </h3>
                <p className="text-lg md:text-xl leading-relaxed mb-8" style={{ color: "var(--text-dim)" }}>
                  {t(`spotlight.${app.key}.body`)}
                </p>
                <ul className="space-y-3.5 mb-9">
                  {app.features.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-base md:text-lg" style={{ color: "var(--text)" }}>
                      <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white" style={{ background: app.color }}>
                        {CHECK}
                      </span>
                      <span>{t(`spotlight.${app.key}.${f}`)}</span>
                    </li>
                  ))}
                </ul>
                {app.href ? (
                  <a href={app.href} target="_blank" rel="noopener noreferrer" className="aur-btn-primary">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M3.18 23.76c.37.21.8.22 1.18.04l13.62-7.68-3.24-3.24-11.56 10.88zM.5 1.26C.19 1.64 0 2.17 0 2.86v18.28c0 .69.19 1.22.5 1.6l.09.08 10.24-10.24v-.24L.59 1.18.5 1.26zM20.65 10.4l-2.99-1.69-3.45 3.45 3.45 3.45 3-1.7c.86-.48.86-1.27 0-1.51zM4.36.2L17.98 7.88l-3.24 3.24L3.18.24C3.55.06 4 .07 4.36.2z" />
                    </svg>
                    {t("spotlight.getOnPlay")}
                  </a>
                ) : (
                  <span className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-bold uppercase tracking-wider" style={{ background: app.soft, color: app.color }}>
                    <span className="aur-status-dot aur-pulse" style={{ background: app.color }} />
                    {t("apps.comingSoon.title")}
                  </span>
                )}
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
