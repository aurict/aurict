"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import AmbientBackground from "@/components/AmbientBackground";
import SuccessScreen from "@/components/SuccessScreen";

const API_URL = "https://mind.fexiolabs.com/api/v1";
const MG1 = "#7C4DFF";
const WILL_DELETE_KEYS = ["willDelete1", "willDelete2", "willDelete3", "willDelete4", "willDelete5"] as const;

export default function MindGridDeleteAccountPage() {
  const { t } = useLanguage();

  const [step, setStep] = useState<"email" | "code" | "success">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleRequestCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/auth/delete-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || t("delete.emailNotFound"));
      }
      setStep("code");
    } catch (err) {
      setError((err as Error).message || t("delete.connectionError"));
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteAccount(e: React.FormEvent) {
    e.preventDefault();
    if (confirmText !== "DELETE") {
      setError(t("delete.confirmDelete"));
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/auth/account`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || t("delete.invalidCode"));
      }
      setStep("success");
      setTimeout(() => { window.location.href = "/"; }, 4000);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  if (step === "success") {
    return (
      <SuccessScreen
        color={MG1}
        title={t("delete.successTitle")}
        message={t("delete.successMessage")}
      />
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <AmbientBackground />

      <motion.header initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="relative z-10 py-8 px-6">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-lg font-semibold" style={{ color: MG1 }}>🧠 Mind Grid</span>
          </Link>
          <button onClick={() => window.history.back()} className="aur-btn-secondary text-xs py-2 px-4" style={{ borderColor: MG1, color: MG1 }}>
            {t("delete.backButton")}
          </button>
        </div>
      </motion.header>

      <motion.main initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }} className="relative z-10 py-10 px-6">
        <div className="max-w-xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl hyphens-auto font-extrabold tracking-tight mb-3" style={{ color: MG1 }}>{t("delete.title")}</h1>
            <div className="flex items-center justify-center gap-2">
              <span className="aur-status-dot" style={{ background: "var(--accent)" }} />
              <span className="text-[11px] uppercase tracking-wider" style={{ color: "var(--accent)" }}>
                {t("delete.developedWithAurict")}
              </span>
            </div>
          </div>

          <div className="aur-card p-6 mb-6" style={{ borderLeft: "2px solid var(--error)" }}>
            <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--error)" }}>{t("delete.cannotUndo")}</h2>
            <ul className="text-sm space-y-1" style={{ color: "var(--text-dim)" }}>
              {WILL_DELETE_KEYS.map((k) => <li key={k}>• {t(`delete.${k}`)}</li>)}
            </ul>
          </div>

          {step === "email" && (
            <div className="aur-card p-8">
              <h3 className="text-lg font-semibold mb-2" style={{ color: MG1 }}>{t("delete.step1Title")}</h3>
              <p className="text-sm mb-6" style={{ color: "var(--text-dim)" }}>
                {t("delete.step1Body")}
              </p>
              <form onSubmit={handleRequestCode} className="space-y-5">
                <div>
                  <label className="eyebrow block mb-2">{t("delete.googleEmail")}</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="aur-input" placeholder={t("delete.emailPlaceholder")} />
                </div>
                {error && <div className="p-3 text-sm" style={{ border: "1px solid var(--error)", color: "var(--error)" }}>{error}</div>}
                <button type="submit" disabled={loading} className="aur-btn-primary w-full" style={{ background: MG1, color: "#fff" }}>
                  {loading ? t("delete.sending") : t("delete.sendCode")}
                </button>
              </form>
            </div>
          )}

          {step === "code" && (
            <div className="aur-card p-8">
              <h3 className="text-lg font-semibold mb-2" style={{ color: MG1 }}>{t("delete.step2Title")}</h3>
              <p className="text-sm mb-6" style={{ color: "var(--text-dim)" }}>{t("delete.step2Body").replace("{email}", email)}</p>
              <form onSubmit={handleDeleteAccount} className="space-y-5">
                <div>
                  <label className="eyebrow block mb-2">{t("delete.verifyCode")}</label>
                  <input type="text" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} required maxLength={6} className="aur-input text-center text-2xl tracking-widest" placeholder="● ● ● ● ● ●" />
                </div>
                <div>
                  <label className="eyebrow block mb-2">{t("delete.confirmLabel")}</label>
                  <input type="text" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} className="aur-input" placeholder={t("delete.confirmPlaceholder")} />
                </div>
                {error && <div className="p-3 text-sm" style={{ border: "1px solid var(--error)", color: "var(--error)" }}>{error}</div>}
                <div className="flex gap-3">
                  <button type="button" onClick={() => { setStep("email"); setError(""); setCode(""); setConfirmText(""); }} className="aur-btn-secondary flex-1">{t("delete.back")}</button>
                  <button type="submit" disabled={loading || confirmText !== "DELETE" || code.length !== 6} className="aur-btn-danger flex-1">
                    {loading ? t("delete.deleting") : t("delete.permanentlyDelete")}
                  </button>
                </div>
                <p className="text-center text-[11px]" style={{ color: "var(--text-muted)" }}>
                  {t("delete.noCode")}
                </p>
              </form>
            </div>
          )}

          <div className="aur-card p-6 mt-6">
            <h3 className="font-semibold mb-2" style={{ color: MG1 }}>{t("delete.needHelp")}</h3>
            <p className="text-sm" style={{ color: "var(--text-dim)" }}>
              {t("delete.needHelpBody")}
              <a href="mailto:contact@aurict.com" style={{ color: MG1 }}>contact@aurict.com</a>
            </p>
          </div>
        </div>
      </motion.main>
    </div>
  );
}
