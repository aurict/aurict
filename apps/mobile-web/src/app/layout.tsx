import type { Metadata, Viewport } from "next";
import { cookies, headers } from "next/headers";
import Providers from "./providers";
import { Nav } from "@/components/Nav";
import "./globals.css";
import { negotiateLocale, LOCALE_COOKIE, type Locale } from "@/i18n/locales";

const BASE_URL = "https://mobile.aurict.com";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Aurict Mobile — Jelly Paradox, Duckley, Mind Grid & Dungeon Lord",
    template: "%s | Aurict Mobile",
  },
  description:
    "Aurict Mobile — the home of Aurict's mobile apps and games: Jelly Paradox, Duckley, Mind Grid and Dungeon Lord. Account management, support and legal pages.",
  applicationName: "Aurict Mobile",
  authors: [{ name: "Aurict" }],
  robots: { index: true, follow: true },
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [{ url: "/aurict-logo.svg", type: "image/svg+xml" }],
    shortcut: "/aurict-logo.svg",
  },
  openGraph: {
    type: "website",
    url: BASE_URL,
    siteName: "Aurict Mobile",
    title: "Aurict Mobile — Jelly Paradox, Duckley, Mind Grid & Dungeon Lord",
    description:
      "Aurict Mobile — the home of Aurict's mobile apps and games: Jelly Paradox, Duckley, Mind Grid and Dungeon Lord. Account management, support and legal pages.",
    locale: "en_US",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Aurict Mobile — Tiny apps. Big joy." }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og.png"],
    title: "Aurict Mobile — Jelly Paradox, Duckley, Mind Grid & Dungeon Lord",
    description:
      "Aurict Mobile — the home of Aurict's mobile apps and games: Jelly Paradox, Duckley, Mind Grid and Dungeon Lord. Account management, support and legal pages.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#fff8f0",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const headerStore = await headers();

  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value ?? null;
  const acceptLanguage = headerStore.get("accept-language") ?? null;
  const locale: Locale = negotiateLocale(acceptLanguage, cookieLocale);

  return (
    <html lang={locale}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font -- next/font fetches Google Fonts during build; runtime link keeps offline builds stable. */}
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ background: "var(--bg)", color: "var(--text)", minHeight: "100vh" }}>
        <Providers initialLocale={locale}>
          <Nav />
          {children}
        </Providers>
      </body>
    </html>
  );
}
