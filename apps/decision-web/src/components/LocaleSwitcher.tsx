"use client";

import { useTransition } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export function LocaleSwitcher() {
  const t = useTranslations("LocaleSwitcher");
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function switchLocale(nextLocale: string) {
    document.cookie = `aurict_locale=${nextLocale}; Path=/; Max-Age=31536000; SameSite=Lax`;
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <select
      value={locale}
      onChange={(e) => switchLocale(e.target.value)}
      disabled={isPending}
      className="locale-select"
      aria-label={t("label")}
    >
      <option value="en">{t("en")}</option>
      <option value="tr">{t("tr")}</option>
    </select>
  );
}
