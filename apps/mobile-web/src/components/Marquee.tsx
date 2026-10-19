"use client";

import { useLanguage } from "@/contexts/LanguageContext";

const DOTS = ["var(--jelly)", "var(--accent-alt)", "var(--duck)", "var(--grid)"];

// A slow, decorative ribbon of the studio's verbs. The list is rendered twice so
// the CSS loop is seamless; the copy is hidden from assistive tech.
export default function Marquee() {
  const { t } = useLanguage();
  const words = [t("marquee.play"), t("marquee.learn"), t("marquee.focus"), t("marquee.madeBy")];
  const row = [...words, ...words];

  return (
    <div className="relative z-10 overflow-hidden py-6 mb-24" style={{ background: "var(--ink)" }} aria-hidden="true">
      <div className="aur-marquee flex w-max items-center">
        {[0, 1].map((copy) => (
          <div key={copy} className="flex items-center">
            {row.map((word, i) => (
              <span key={`${copy}-${i}`} className="flex items-center text-2xl md:text-3xl font-extrabold tracking-tight text-white whitespace-nowrap">
                <span className="mx-8 inline-block h-3.5 w-3.5 rounded-[5px] rotate-12" style={{ background: DOTS[i % DOTS.length] }} />
                {word}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
