"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Footer } from "@/components/Footer";

export default function NotFound() {
  const t = useTranslations("NotFound");

  return (
    <>
      <div className="lost-route-wrapper">
        <div className="lost-wings" aria-hidden="true">
          <svg width="40" height="2" viewBox="0 0 40 2">
            <line x1="0" y1="1" x2="40" y2="1" stroke="currentColor" strokeWidth="1" opacity="0.4" />
          </svg>
        </div>
        <div className="lost-code">404</div>
        <div className="lost-label">
          {t("label")}
        </div>
        <Link href="/" className="lost-link">
          {t("goHome")}
        </Link>
      </div>
      <Footer />
    </>
  );
}
