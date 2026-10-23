"use client";

import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";

const EASE = [0.16, 0.8, 0.2, 1] as const;

type App = {
  name: string;
  taglineKey: string;
  art: string;
  color: string;
  soft: string;
  // Store page once the app is live; apps without one show "coming soon".
  href?: string;
};

const APPS: App[] = [
  { name: "Jelly Paradox", taglineKey: "apps.jelly.tagline", art: "/apps/jelly.webp", color: "var(--jelly)", soft: "var(--jelly-soft)" },
  {
    name: "Duckley",
    taglineKey: "apps.duckley.tagline",
    art: "/apps/duck.webp",
    color: "var(--duck)",
    soft: "var(--duck-soft)",
    href: "https://play.google.com/store/apps/details?id=com.aurict.duckley",
  },
  {
    name: "Mind Grid",
    taglineKey: "apps.mindgrid.tagline",
    art: "/apps/tiles.webp",
    color: "var(--grid)",
    soft: "var(--grid-soft)",
    href: "https://play.google.com/store/apps/details?id=com.mindgrid.mind_grid",
  },
  { name: "Dungeon Lord", taglineKey: "apps.dungeon.tagline", art: "/apps/dungeon-dragon.webp", color: "var(--dungeon)", soft: "var(--dungeon-soft)" },
  { name: "Drift Street", taglineKey: "apps.drift.tagline", art: "/apps/drift.webp", color: "var(--drift)", soft: "var(--drift-soft)" },
];

const ARROW = (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.4} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-6-6 6 6-6 6" />
  </svg>
);

export default function Apps() {
  const { t } = useLanguage();

  return (
    <section id="apps" className="relative z-10 pb-28" style={{ scrollMarginTop: 88 }}>
      <div className="section-shell">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: EASE }}
          className="font-extrabold tracking-tight mb-10"
          style={{ fontSize: "clamp(2.25rem, 4.5vw, 3.5rem)", letterSpacing: "-0.035em", color: "var(--text)" }}
        >
          {t("apps.title")}
        </motion.h2>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}
          className="grid gap-5 md:grid-cols-2"
        >
          {APPS.map((app) => {
            const body = (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element -- static transparent art from public/ */}
                <img src={app.art} alt="" className="w-24 h-24 xl:w-28 xl:h-28 object-contain shrink-0" draggable={false} />
                <div className="flex-1 min-w-0">
                  <h3 className="text-2xl font-extrabold tracking-tight mb-1.5 whitespace-nowrap" style={{ color: "var(--text)", letterSpacing: "-0.02em" }}>
                    {app.name}
                  </h3>
                  <p className="text-base leading-snug" style={{ color: "var(--text-dim)" }}>{t(app.taglineKey)}</p>
                  {!app.href && (
                    <span className="inline-block mt-3 text-xs font-bold uppercase tracking-wider" style={{ color: app.color }}>
                      {t("apps.comingSoon.title")}
                    </span>
                  )}
                </div>
                {app.href && (
                  <span className="app-card-action" style={{ background: "rgb(255 255 255 / 0.7)", color: app.color }}>
                    {ARROW}
                  </span>
                )}
              </>
            );

            return (
              <motion.div
                key={app.name}
                variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } } }}
              >
                {app.href ? (
                  <a
                    href={app.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="app-card h-full"
                    style={{ background: app.soft }}
                    aria-label={`${app.name} — ${t("apps.googlePlay")}`}
                  >
                    {body}
                  </a>
                ) : (
                  <div className="app-card h-full" style={{ background: app.soft }}>
                    {body}
                  </div>
                )}
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
