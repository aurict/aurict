"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { locales, localeEndonyms, type Locale } from "@/i18n/locales";

const FLAGS: Record<Locale, string> = {
  en: "🇬🇧",
  tr: "🇹🇷",
  fr: "🇫🇷",
  de: "🇩🇪",
  zh: "🇨🇳",
};

const GLOBE_ICON = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18" />
    <path d="M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18" />
  </svg>
);

export function LanguageMenu() {
  const { language, setLanguage, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        className="dim-link"
        style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 15, minHeight: 44, background: "none", border: 0, cursor: "pointer" }}
        aria-label={t("nav.language")}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {GLOBE_ICON}
        <span>{localeEndonyms[language].native}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            style={{
              position: "absolute",
              top: "calc(100% + 10px)",
              right: 0,
              minWidth: 180,
              padding: "6px",
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: 18,
              boxShadow: "var(--shadow-soft)",
              zIndex: 60,
            }}
          >
            {locales.map((loc) => {
              const active = loc === language;
              return (
                <button
                  key={loc}
                  role="menuitemradio"
                  aria-checked={active}
                  type="button"
                  onClick={() => {
                    setLanguage(loc);
                    setOpen(false);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: "none",
                    background: active ? "var(--accent-soft)" : "transparent",
                    color: active ? "var(--accent)" : "var(--text)",
                    cursor: "pointer",
                    fontSize: 14,
                    fontWeight: 600,
                    textAlign: "left",
                  }}
                >
                  <span style={{ fontSize: 16, lineHeight: 1 }}>{FLAGS[loc]}</span>
                  <span style={{ flex: 1 }}>{localeEndonyms[loc].native}</span>
                  {active && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.4">
                      <path d="m5 13 4 4L19 7" />
                    </svg>
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
