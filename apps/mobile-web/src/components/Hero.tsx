"use client";

import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import TightPeriod from "./TightPeriod";

const EASE = [0.16, 0.8, 0.2, 1] as const;

// The three app mascots, placed as percentages of the art box so the
// composition scales with the viewport. Colored glows sit under each one.
const ART = [
  { src: "/apps/jelly.webp", style: { left: "0%", top: "14%", width: "40%" }, delay: "0s", glow: "rgb(255 92 170 / 0.45)" },
  { src: "/apps/duck.webp", style: { left: "30%", top: "0%", width: "42%" }, delay: "-2s", glow: "rgb(255 205 60 / 0.5)" },
  { src: "/apps/tiles.webp", style: { left: "64%", top: "8%", width: "36%" }, delay: "-4s", glow: "rgb(255 110 80 / 0.4)" },
];

export default function Hero() {
  const { t } = useLanguage();

  return (
    <section className="relative z-10 overflow-hidden">
      <div className="section-shell grid items-center gap-10 pt-10 pb-20 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:pt-16 lg:pb-28">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: EASE }}>
          <h1
            className="font-extrabold tracking-tight leading-[0.98] mb-7"
            style={{ fontSize: "clamp(3.25rem, 7.5vw, 6.25rem)", letterSpacing: "-0.045em" }}
          >
            <span className="block" style={{ color: "var(--text)" }}><TightPeriod text={t("hero.title")} /></span>
            <span className="block" style={{ color: "var(--accent)" }}><TightPeriod text={t("hero.titleAccent")} /></span>
          </h1>
          <p className="max-w-md text-xl md:text-2xl leading-snug mb-10" style={{ color: "var(--text-dim)" }}>
            {t("hero.slogan")}
          </p>
          <a href="#apps" className="aur-btn-primary group" style={{ minHeight: 60, padding: "1rem 2.25rem", fontSize: "1.1rem" }}>
            {t("hero.exploreApps")}
            <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.4} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-6-6 6 6-6 6" />
            </svg>
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.1, ease: EASE }}
          className="relative mx-auto w-full max-w-[720px]"
          style={{ aspectRatio: "1.45 / 1" }}
          aria-hidden="true"
        >
          {ART.map((item) => (
            <div key={item.src} className="absolute" style={item.style}>
              <div
                className="absolute left-[10%] right-[10%] -bottom-[6%] h-[14%] rounded-[50%] blur-2xl"
                style={{ background: item.glow }}
              />
              {/* eslint-disable-next-line @next/next/no-img-element -- static transparent art from public/, sized by its box */}
              <img src={item.src} alt="" className="aur-float relative w-full h-auto" style={{ animationDelay: item.delay }} draggable={false} />
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
