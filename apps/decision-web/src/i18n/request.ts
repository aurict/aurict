import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import { routing } from "./routing";

export const LOCALE_COOKIE = "aurict_locale";

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  let locale = cookieStore.get(LOCALE_COOKIE)?.value;
  if (!locale || !routing.locales.includes(locale as "en" | "tr")) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
    timeZone: locale === "tr" ? "Europe/Istanbul" : "UTC",
  };
});
