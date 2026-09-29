"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import AmbientBackground from "@/components/AmbientBackground";
import SuccessScreen from "@/components/SuccessScreen";
import Corners from "@/components/ui/Corners";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
          }) => void;
          renderButton: (
            element: HTMLElement,
            options: Record<string, unknown>,
          ) => void;
        };
      };
    };
  }
}

const BRAND = "#22b07d";

const STRINGS = {
  tr: {
    title: "Hesabı Sil",
    subtitle: "Duckley hesabını ve kişisel verilerini kalıcı olarak sil.",
    cannotUndo: "Bu işlem geri alınamaz",
    willDelete: [
      "Google hesap bağlantın",
      "Derslerin, rozetlerin ve XP bakiyen",
      "Duki'nin aksesuarları ve öğrenme geçmişin",
      "Tüm cihazlarındaki oturumların",
    ],
    kept: "Satın alma kayıtların yasal saklama yükümlülüğü için isimsiz olarak tutulur.",
    step1Title: "1. Google ile giriş yap",
    step1Body:
      "Silmek istediğin Duckley hesabına bağlı Google hesabınla giriş yap. Bu, hesabın sahibi olduğunu doğrular.",
    signInFailed: "Google ile giriş yapılamadı. Tekrar dene.",
    configFailed: "Sunucuya ulaşılamadı. Bağlantını kontrol edip tekrar dene.",
    step2Title: "2. Silmeyi onayla",
    step2Body:
      "Devam etmek için aşağıdaki kutuya SİL yaz. Hesabın ve yukarıdaki verilerin tamamı silinecek.",
    confirmPlaceholder: "SİL yaz",
    back: "Geri",
    deleting: "Siliniyor…",
    permanentlyDelete: "Hesabımı kalıcı olarak sil",
    confirmHint: "Onaylamak için SİL (veya DELETE) yazmalısın.",
    deleteFailed: "Hesap silinemedi. Tekrar dene.",
    successTitle: "Hesabın silindi",
    successMessage:
      "Duckley hesabın ve kişisel verilerin silindi. Ana sayfaya yönlendiriliyorsun…",
    needHelp: "Yardıma mı ihtiyacın var?",
    needHelpBody: "Bize yaz: ",
    backButton: "Geri",
  },
  en: {
    title: "Delete Account",
    subtitle: "Permanently delete your Duckley account and personal data.",
    cannotUndo: "This cannot be undone",
    willDelete: [
      "Your linked Google account",
      "Your lessons, badges and XP balance",
      "Duki's accessories and your learning history",
      "Your sessions on all devices",
    ],
    kept: "Purchase records are kept anonymously for legal retention.",
    step1Title: "1. Sign in with Google",
    step1Body:
      "Sign in with the Google account linked to the Duckley account you want to delete. This verifies account ownership.",
    signInFailed: "Google sign-in failed. Please try again.",
    configFailed: "Cannot reach the server. Check your connection and retry.",
    step2Title: "2. Confirm deletion",
    step2Body:
      "Type DELETE in the box below to continue. Your account and all data above will be erased.",
    confirmPlaceholder: "Type DELETE",
    back: "Back",
    deleting: "Deleting…",
    permanentlyDelete: "Delete my account permanently",
    confirmHint: "Type DELETE (or SİL) to confirm.",
    deleteFailed: "Account could not be deleted. Please try again.",
    successTitle: "Account deleted",
    successMessage:
      "Your Duckley account and personal data have been deleted. Redirecting home…",
    needHelp: "Need help?",
    needHelpBody: "Write to us: ",
    backButton: "Back",
  },
} as const;

export default function DuckleyDeleteAccountPage() {
  const { language } = useLanguage();
  const s = language === "tr" ? STRINGS.tr : STRINGS.en;

  const [step, setStep] = useState<"signin" | "confirm" | "success">("signin");
  const [idToken, setIdToken] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const buttonRef = useRef<HTMLDivElement>(null);

  const handleCredential = useCallback((credential?: string) => {
    if (!credential) {
      setError(STRINGS.en.signInFailed);
      return;
    }
    setIdToken(credential);
    setError("");
    setStep("confirm");
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function setup() {
      try {
        const res = await fetch("/api/duckley/config", { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        const clientId = data.googleClientId as string | undefined;
        if (!clientId) throw new Error("no-client-id");
        await new Promise<void>((resolve, reject) => {
          if (window.google?.accounts?.id) return resolve();
          const script = document.createElement("script");
          script.src = "https://accounts.google.com/gsi/client";
          script.async = true;
          script.defer = true;
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("gsi-load"));
          document.head.appendChild(script);
        });
        if (cancelled) return;
        window.google!.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => handleCredential(response.credential),
        });
        if (buttonRef.current) {
          window.google!.accounts.id.renderButton(buttonRef.current, {
            theme: "outline",
            size: "large",
            width: 280,
          });
        }
      } catch {
        if (!cancelled) setError(s.configFailed);
      }
    }
    setup();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleDeleteAccount(e: React.FormEvent) {
    e.preventDefault();
    if (!["SİL", "SIL", "DELETE"].includes(confirmText.trim().toUpperCase())) {
      setError(s.confirmHint);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/duckley/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      if (!res.ok) throw new Error(s.deleteFailed);
      setStep("success");
      setTimeout(() => {
        window.location.href = "/";
      }, 4000);
    } catch (err) {
      setError((err as Error).message || s.deleteFailed);
    } finally {
      setLoading(false);
    }
  }

  if (step === "success") {
    return (
      <SuccessScreen
        color={BRAND}
        title={s.successTitle}
        message={s.successMessage}
      />
    );
  }

  return (
    <div
      className="min-h-screen overflow-x-hidden"
      style={{ background: "var(--bg)", color: "var(--text)" }}
    >
      <AmbientBackground />

      <motion.header
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 py-8 px-6"
      >
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-serif text-lg font-semibold" style={{ color: BRAND }}>
              🦆 Duckley
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
            <h1 className="font-serif text-5xl font-semibold mb-3" style={{ color: BRAND }}>
              {s.title}
            </h1>
            <p className="text-sm" style={{ color: "var(--text-dim)" }}>
              {s.subtitle}
            </p>
          </div>

          <div className="aur-card p-6 mb-6" style={{ borderLeft: "2px solid var(--error)" }}>
            <Corners />
            <h2 className="font-serif text-lg font-semibold mb-3" style={{ color: "var(--error)" }}>
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
            <div className="aur-card p-8">
              <Corners />
              <h3 className="font-serif text-lg font-semibold mb-2" style={{ color: BRAND }}>
                {s.step1Title}
              </h3>
              <p className="text-sm mb-6" style={{ color: "var(--text-dim)" }}>
                {s.step1Body}
              </p>
              <div className="flex justify-center">
                <div ref={buttonRef} />
              </div>
              {error && (
                <div
                  className="p-3 text-sm mt-5"
                  style={{ border: "1px solid var(--error)", color: "var(--error)" }}
                >
                  {error}
                </div>
              )}
            </div>
          )}

          {step === "confirm" && (
            <div className="aur-card p-8">
              <Corners />
              <h3 className="font-serif text-lg font-semibold mb-2" style={{ color: BRAND }}>
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
                  />
                </div>
                {error && (
                  <div
                    className="p-3 text-sm"
                    style={{ border: "1px solid var(--error)", color: "var(--error)" }}
                  >
                    {error}
                  </div>
                )}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setStep("signin");
                      setError("");
                      setConfirmText("");
                      setIdToken("");
                    }}
                    className="aur-btn-secondary flex-1"
                  >
                    {s.back}
                  </button>
                  <button type="submit" disabled={loading} className="aur-btn-danger flex-1">
                    {loading ? s.deleting : s.permanentlyDelete}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="aur-card p-6 mt-6">
            <Corners />
            <h3 className="font-serif font-semibold mb-2" style={{ color: BRAND }}>
              {s.needHelp}
            </h3>
            <p className="text-sm" style={{ color: "var(--text-dim)" }}>
              {s.needHelpBody}
              <a href="mailto:contact@aurict.com" style={{ color: BRAND }}>
                contact@aurict.com
              </a>
            </p>
          </div>
        </div>
      </motion.main>
    </div>
  );
}
