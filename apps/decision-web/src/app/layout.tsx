import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { ScrollProgress } from "@/components/ui/ScrollProgress";
import { Nav } from "@/components/Nav";
import { ServiceWorkerRetirement } from "@/components/ServiceWorkerRetirement";
import { SITE_URL } from "@/content/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default: "Aurict Decision — On-Device Decision Engine",
    template: "%s | Aurict Decision",
  },

  description:
    "A privacy-first, on-device decision runtime that selects a single next-best-action every session. On-device ML for e-commerce personalization. An Aurict sub-product.",

  icons: {
    icon: [{ url: "/brand-mark.svg", type: "image/svg+xml" }],
  },

  keywords: [
    "decision engine",
    "e-commerce personalization",
    "on-device ML",
    "federated learning",
    "next-best-action",
    "privacy-first",
    "scoring engine",
    "segmentation",
    "Aurict",
    "Aurict Decision",
    "KVKK",
    "GDPR",
  ],

  authors: [{ name: "Aurict", url: "https://aurict.com" }],
  creator: "Aurict",
  publisher: "Aurict",

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "Aurict Decision",
    title: "Aurict Decision — On-Device Decision Engine",
    description:
      "Privacy-first, on-device decision runtime. One decision per session. An Aurict sub-product.",
  },

  twitter: {
    card: "summary_large_image",
    site: "@aurictdev",
    creator: "@aurictdev",
    title: "Aurict Decision — On-Device Decision Engine",
    description:
      "Privacy-first, on-device decision runtime. One decision per session.",
  },

  category: "technology",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f6faf9",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [locale, messages] = await Promise.all([getLocale(), getMessages()]);

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font -- runtime link keeps offline builds stable */}
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        <ServiceWorkerRetirement />
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ScrollProgress />
          <div className="site-grain" aria-hidden="true" />
          <Nav />
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
