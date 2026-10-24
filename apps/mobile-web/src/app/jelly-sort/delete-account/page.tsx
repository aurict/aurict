"use client";

import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import AmbientBackground from "@/components/AmbientBackground";
import PageHeader from "@/components/PageHeader";

const BRAND = "var(--jellysort)";
const APP_NAME = "Jelly Sort";
const CONTACT = "contact@aurict.com";
const SUBJECT = "Jelly Sort account deletion";

// Deleting happens in the game (Settings → Delete account) or by email; the game server has no
// web sign-in, so this page explains both ways and links the email request.
const STRINGS = {
  tr: {
    title: "Hesabı Sil",
    subtitle: "Jelly Sort hesabını ve eşitlenmiş oyun verilerini kalıcı olarak sil.",
    cannotUndo: "Bu işlem geri alınamaz",
    willDelete: [
      "Google hesap bağlantın",
      "Sunucudaki ilerlemen, yıldızların ve en iyi skorların",
      "Coin'lerin, booster'ların, temaların ve günlük sıralama sonuçların",
      "Tüm cihazlarındaki oturumların",
    ],
    kept: "Satın alma ve ödüllü reklam kayıtları muhasebe yükümlülüğü nedeniyle hesabından ayrılarak (anonim) saklanır. Sunucu yedeklerindeki kopyalar 14 gün içinde kendiliğinden silinir.",
    inAppTitle: "1. Oyunun içinden (hemen)",
    inAppSteps: ["Jelly Sort'u aç ve sağ üstteki Ayarlar'a dokun.", "Hesabı sil'e dokun.", "Onay penceresinde yeniden Hesabı sil'i seç."],
    inAppNote: "Hesap ve sunucudaki veriler o anda silinir. Telefonundaki misafir kaydı silinmez; uygulamayı kaldırınca o da silinir.",
    emailTitle: "2. Oyuna erişemiyorsan (e-postayla)",
    emailBody: `Oyunda bağladığın Google hesabının e-posta adresinden ${CONTACT} adresine "${SUBJECT}" konulu bir e-posta gönder. Hesabın 7 gün içinde silinir ve sana bildiririz.`,
    emailButton: "E-posta gönder",
    guestTitle: "Google ile giriş yapmadın mı?",
    guestBody: "Misafir olarak oynadıysan sunucumuzda hiçbir verin yoktur. Oyun kaydın yalnızca telefonunda durur; uygulamayı kaldırdığında silinir.",
    privacy: "Gizlilik Politikası",
    backButton: "Geri",
  },
  en: {
    title: "Delete Account",
    subtitle: "Permanently delete your Jelly Sort account and synced game data.",
    cannotUndo: "This cannot be undone",
    willDelete: [
      "Your linked Google account",
      "Your progress, stars and best scores on our server",
      "Your coins, boosters, themes and daily leaderboard results",
      "Your sessions on all devices",
    ],
    kept: "Purchase and rewarded-ad records are kept separated from your account (anonymized) because of our accounting obligations. Copies in server backups are deleted automatically within 14 days.",
    inAppTitle: "1. In the game (instant)",
    inAppSteps: ["Open Jelly Sort and tap Settings in the top right.", "Tap Delete account.", "Choose Delete account again in the confirmation."],
    inAppNote: "Your account and server data are deleted right away. The guest save on your phone stays until you uninstall the app.",
    emailTitle: "2. Can't open the game? (by email)",
    emailBody: `Email ${CONTACT} from the address of the Google account you linked in the game, with the subject "${SUBJECT}". We delete the account within 7 days and confirm by email.`,
    emailButton: "Send email",
    guestTitle: "Never signed in with Google?",
    guestBody: "If you only played as a guest, we hold no data about you on our server. Your save lives only on your phone and is deleted when you uninstall the app.",
    privacy: "Privacy Policy",
    backButton: "Back",
  },
} as const;

export default function JellySortDeleteAccountPage() {
  const { language } = useLanguage();
  const s = language === "tr" ? STRINGS.tr : STRINGS.en;
  const mailto = `mailto:${CONTACT}?subject=${encodeURIComponent(SUBJECT)}`;

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <AmbientBackground />
      <PageHeader backLabel={s.backButton} brand={`${APP_NAME} · Aurict`} />

      <main className="relative z-10 py-10 px-6">
        <div className="max-w-xl mx-auto space-y-6">
          <div className="text-center mb-10">
            <h1 className="text-4xl sm:text-5xl hyphens-auto font-extrabold tracking-tight mb-3" style={{ color: BRAND }}>
              {s.title}
            </h1>
            <p className="text-sm" style={{ color: "var(--text-dim)" }}>{s.subtitle}</p>
          </div>

          <section className="aur-card p-6" style={{ borderLeft: "2px solid var(--error)" }}>
            <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--error)" }}>{s.cannotUndo}</h2>
            <ul className="text-sm space-y-1" style={{ color: "var(--text-dim)" }}>
              {s.willDelete.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
            <p className="text-sm mt-3" style={{ color: "var(--text-dim)" }}>{s.kept}</p>
          </section>

          <section className="aur-card p-8">
            <h2 className="text-lg font-semibold mb-3" style={{ color: BRAND }}>{s.inAppTitle}</h2>
            <ol className="text-sm space-y-1 ml-5 list-decimal" style={{ color: "var(--text-dim)" }}>
              {s.inAppSteps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
            <p className="text-sm mt-3" style={{ color: "var(--text-dim)" }}>{s.inAppNote}</p>
          </section>

          <section className="aur-card p-8">
            <h2 className="text-lg font-semibold mb-3" style={{ color: BRAND }}>{s.emailTitle}</h2>
            <p className="text-sm mb-6" style={{ color: "var(--text-dim)" }}>{s.emailBody}</p>
            <div className="flex justify-center">
              <a href={mailto} className="aur-btn-secondary" style={{ borderColor: BRAND, color: BRAND }}>
                {s.emailButton}
              </a>
            </div>
          </section>

          <section className="aur-card p-6">
            <h3 className="font-semibold mb-2" style={{ color: BRAND }}>{s.guestTitle}</h3>
            <p className="text-sm" style={{ color: "var(--text-dim)" }}>{s.guestBody}</p>
          </section>

          <p className="text-center text-sm">
            <Link href="/jelly-sort/privacy-policy" style={{ color: BRAND }}>{s.privacy}</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
