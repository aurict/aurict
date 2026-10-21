"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import AmbientBackground from "@/components/AmbientBackground";
import SuccessScreen from "@/components/SuccessScreen";

// The game server runs the Google sign-in and sends the player back here with
// a one-time ticket in the URL fragment (#ticket=... or #error=...).
const API_URL = "https://dungeon.aurict.com";
const BRAND = "var(--dungeon)";
const CONTACT = "contact@aurict.com";

const STRINGS = {
  tr: {
    title: "Hesabı Sil",
    subtitle: "Dungeon Lord hesabını ve oyun verilerini kalıcı olarak sil.",
    cannotUndo: "Bu işlem geri alınamaz",
    willDelete: [
      "Google hesap bağlantın",
      "Zindanın, katların, canavarların, ejderhan ve ruh güçlerin",
      "Altınların, elmasların, sıralama kaydın ve satın alma geçmişin",
      "Tüm cihazlarındaki oturumların",
    ],
    kept: "Sunucu yedeklerindeki kopyalar 14 gün içinde kendiliğinden silinir.",
    step1Title: "1. Google ile giriş yap",
    step1Body:
      "Oyunda bağladığın Google hesabıyla giriş yap. Bu, hesabın sahibi olduğunu doğrular; giriş seni yeniden bu sayfaya getirir.",
    signIn: "Google ile devam et",
    guestTitle: "Google bağlamadın mı?",
    guestBody: `Misafir hesabını oyunun içinden sil: Ayarlar → Hesabı Sil (iki kez dokun). Oyuna erişemiyorsan Ayarlar'da görünen Kimlik'le ${CONTACT} adresine yaz.`,
    step2Title: "2. Silmeyi onayla",
    step2Body:
      "Devam etmek için aşağıdaki kutuya SİL yaz. Hesabın ve yukarıdaki verilerin tamamı silinecek.",
    confirmPlaceholder: "SİL yaz",
    cancel: "Vazgeç",
    deleting: "Siliniyor…",
    permanentlyDelete: "Hesabımı kalıcı olarak sil",
    confirmHint: "Onaylamak için SİL (veya DELETE) yazmalısın.",
    errors: {
      no_account: "Bu Google hesabına bağlı bir Dungeon Lord hesabı yok.",
      cancelled: "Google girişi iptal edildi.",
      failed: "Google ile giriş yapılamadı. Tekrar dene.",
      unavailable: "Web'den silme şu an kullanılamıyor. Oyunun içinden sil veya bize yaz.",
      expired: "Onay süresi doldu. Google ile yeniden giriş yap.",
      network: "Sunucuya ulaşılamadı. Bağlantını kontrol edip tekrar dene.",
    },
    successTitle: "Hesabın silindi",
    successMessage: "Dungeon Lord hesabın ve oyun verilerin silindi. Ana sayfaya yönlendiriliyorsun…",
    needHelp: "Yardıma mı ihtiyacın var?",
    needHelpBody: "Bize yaz: ",
    privacy: "Gizlilik Politikası",
    backButton: "Geri",
  },
  en: {
    title: "Delete Account",
    subtitle: "Permanently delete your Dungeon Lord account and game data.",
    cannotUndo: "This cannot be undone",
    willDelete: [
      "Your linked Google account",
      "Your dungeon, floors, monsters, dragon and soul perks",
      "Your gold, gems, leaderboard entry and purchase history",
      "Your sessions on all devices",
    ],
    kept: "Copies in server backups are deleted automatically within 14 days.",
    step1Title: "1. Sign in with Google",
    step1Body:
      "Sign in with the Google account you linked in the game. This verifies you own the account; you will come back to this page afterwards.",
    signIn: "Continue with Google",
    guestTitle: "Never linked Google?",
    guestBody: `Delete a guest account inside the game: Settings → Hesabı Sil (tap twice). If you can't open the game, write to ${CONTACT} with the ID (Kimlik) shown in Settings.`,
    step2Title: "2. Confirm deletion",
    step2Body: "Type DELETE in the box below to continue. Your account and all data above will be erased.",
    confirmPlaceholder: "Type DELETE",
    cancel: "Cancel",
    deleting: "Deleting…",
    permanentlyDelete: "Delete my account permanently",
    confirmHint: "Type DELETE (or SİL) to confirm.",
    errors: {
      no_account: "There is no Dungeon Lord account linked to this Google account.",
      cancelled: "Google sign-in was cancelled.",
      failed: "Google sign-in failed. Please try again.",
      unavailable: "Deleting on the web is unavailable right now. Delete in the game or write to us.",
      expired: "The confirmation expired. Sign in with Google again.",
      network: "Cannot reach the server. Check your connection and retry.",
    },
    successTitle: "Account deleted",
    successMessage: "Your Dungeon Lord account and game data have been deleted. Redirecting home…",
    needHelp: "Need help?",
    needHelpBody: "Write to us: ",
    privacy: "Privacy Policy",
    backButton: "Back",
  },
} as const;

type ErrorKey = keyof typeof STRINGS.en.errors;

export default function DungeonLordDeleteAccountPage() {
  const { language } = useLanguage();
  const s = language === "tr" ? STRINGS.tr : STRINGS.en;

  const [step, setStep] = useState<"signin" | "confirm" | "success">("signin");
  const [ticket, setTicket] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorKey, setErrorKey] = useState<ErrorKey | "">("");
  const [hint, setHint] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.slice(1));
    if (!window.location.hash) return;
    // keep the ticket out of the address bar and history
    window.history.replaceState(null, "", window.location.pathname);
    const t = params.get("ticket");
    const e = params.get("error");
    // the fragment only exists in the browser, so it can't seed the server render
    /* eslint-disable react-hooks/set-state-in-effect */
    if (t) {
      setTicket(t);
      setStep("confirm");
    } else if (e) {
      setErrorKey(e in STRINGS.en.errors ? (e as ErrorKey) : "failed");
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  function reset(key: ErrorKey | "" = "") {
    setStep("signin");
    setTicket("");
    setConfirmText("");
    setHint(false);
    setErrorKey(key);
  }

  async function handleDeleteAccount(e: React.FormEvent) {
    e.preventDefault();
    if (!["SİL", "SIL", "DELETE"].includes(confirmText.trim().toLocaleUpperCase("tr"))) {
      setHint(true);
      return;
    }
    setLoading(true);
    setHint(false);
    try {
      const res = await fetch(`${API_URL}/v1/web/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticket, confirm: "DELETE" }),
      });
      if (res.status === 403) return reset("expired");
      if (!res.ok) throw new Error("delete failed");
      setStep("success");
      setTimeout(() => {
        window.location.href = "/";
      }, 4000);
    } catch {
      setErrorKey("network");
    } finally {
      setLoading(false);
    }
  }

  if (step === "success") {
    return <SuccessScreen color={BRAND} title={s.successTitle} message={s.successMessage} />;
  }

  const errorBox = (text: string) => (
    <div role="alert" className="p-3 text-sm mt-5" style={{ border: "1px solid var(--error)", color: "var(--error)" }}>
      {text}
    </div>
  );

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <AmbientBackground />

      <motion.header
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 py-8 px-6"
      >
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-lg font-semibold" style={{ color: BRAND }}>
              Dungeon Lord
            </span>
          </Link>
          <button
            onClick={() => window.history.back()}
            className="aur-btn-secondary text-xs py-2 px-4"
            style={{ borderColor: BRAND, color: BRAND }}
          >
            {s.backButton}
          </button>
        </div>
      </motion.header>

      <motion.main
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="relative z-10 py-10 px-6"
      >
        <div className="max-w-xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl hyphens-auto font-extrabold tracking-tight mb-3" style={{ color: BRAND }}>
              {s.title}
            </h1>
            <p className="text-sm" style={{ color: "var(--text-dim)" }}>
              {s.subtitle}
            </p>
          </div>

          <div className="aur-card p-6 mb-6" style={{ borderLeft: "2px solid var(--error)" }}>
            <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--error)" }}>
              {s.cannotUndo}
            </h2>
            <ul className="text-sm space-y-1" style={{ color: "var(--text-dim)" }}>
              {s.willDelete.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
            <p className="text-sm mt-3" style={{ color: "var(--text-dim)" }}>
              {s.kept}
            </p>
          </div>

          {step === "signin" && (
            <>
              <div className="aur-card p-8">
                <h3 className="text-lg font-semibold mb-2" style={{ color: BRAND }}>
                  {s.step1Title}
                </h3>
                <p className="text-sm mb-6" style={{ color: "var(--text-dim)" }}>
                  {s.step1Body}
                </p>
                <div className="flex justify-center">
                  <a href={`${API_URL}/v1/web/delete/start`} className="aur-btn-secondary" style={{ borderColor: BRAND, color: BRAND }}>
                    {s.signIn}
                  </a>
                </div>
                {errorKey && errorBox(s.errors[errorKey])}
              </div>
              <div className="aur-card p-6 mt-6">
                <h3 className="font-semibold mb-2" style={{ color: BRAND }}>
                  {s.guestTitle}
                </h3>
                <p className="text-sm" style={{ color: "var(--text-dim)" }}>
                  {s.guestBody}
                </p>
              </div>
            </>
          )}

          {step === "confirm" && (
            <div className="aur-card p-8">
              <h3 className="text-lg font-semibold mb-2" style={{ color: BRAND }}>
                {s.step2Title}
              </h3>
              <p className="text-sm mb-6" style={{ color: "var(--text-dim)" }}>
                {s.step2Body}
              </p>
              <form onSubmit={handleDeleteAccount} className="space-y-5">
                <div>
                  <input
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    className="aur-input text-center text-2xl tracking-widest"
                    placeholder={s.confirmPlaceholder}
                    aria-label={s.confirmPlaceholder}
                    autoComplete="off"
                  />
                </div>
                {hint && errorBox(s.confirmHint)}
                {errorKey && errorBox(s.errors[errorKey])}
                <div className="flex gap-3">
                  <button type="button" onClick={() => reset()} className="aur-btn-secondary flex-1">
                    {s.cancel}
                  </button>
                  <button type="submit" disabled={loading} className="aur-btn-danger flex-1">
                    {loading ? s.deleting : s.permanentlyDelete}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="aur-card p-6 mt-6">
            <h3 className="font-semibold mb-2" style={{ color: BRAND }}>
              {s.needHelp}
            </h3>
            <p className="text-sm" style={{ color: "var(--text-dim)" }}>
              {s.needHelpBody}
              <a href={`mailto:${CONTACT}`} style={{ color: BRAND }}>
                {CONTACT}
              </a>
            </p>
          </div>

          <div className="text-center mt-6">
            <Link href="/dungeon-lord/privacy-policy" className="text-sm underline" style={{ color: BRAND }}>
              {s.privacy}
            </Link>
          </div>
        </div>
      </motion.main>
    </div>
  );
}
