"use client";

import { Suspense, useState } from "react";
import { useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Footer } from "@/components/Footer";

const API_URL = process.env.NEXT_PUBLIC_DECISION_API_URL || "https://decision.aurict.com";

function ContactForm() {
  const tr = useLocale() === "tr";
  const params = useSearchParams();
  const initialType = params.get("type") === "SELF_HOST" ? "SELF_HOST" : "ENTERPRISE";
  const [type, setType] = useState(initialType);
  const [form, setForm] = useState({ companyName: "", contactName: "", email: "", estimatedVolume: "", deploymentPreference: "", requirements: "" });
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setState("sending");
    const response = await fetch(`${API_URL}/api/sales/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type,
        ...form,
        requirements: { notes: form.requirements },
        website: "",
      }),
    });
    setState(response.ok ? "sent" : "error");
  };

  return (
    <>
      <main className="inner-main">
        <div className="page-intro">
          <div className="page-intro-eyebrow">{type === "SELF_HOST" ? "self-host" : "enterprise"}</div>
          <h1 className="page-h1">{tr ? "Teknik görüşme planlayın" : "Plan a technical conversation"}</h1>
          <p className="page-lead">{tr ? "Mimari, veri yerleşimi, trafik ve güvenlik ihtiyaçlarını birlikte netleştirelim." : "We will align architecture, data residency, traffic and security requirements."}</p>
          <p className="mono" style={{ marginTop: 16, color: "var(--text-muted)", fontSize: 12 }}>
            {tr ? "Doğrudan e-posta: " : "Email us directly: "}
            <a href="mailto:contact@aurict.com" style={{ color: "var(--accent)" }}>
              contact@aurict.com
            </a>
          </p>
        </div>
        {state === "sent" ? <div style={{ border: "1px solid var(--success)", padding: 24 }}>{tr ? "Talebiniz alındı. Ekibimiz sizinle iletişime geçecek." : "Request received. Our team will contact you."}</div> : (
          <form onSubmit={submit} style={{ display: "grid", gap: 16, maxWidth: 720, marginBottom: 64 }}>
            <select value={type} onChange={(event) => setType(event.target.value as "SELF_HOST" | "ENTERPRISE")}><option value="SELF_HOST">Self-host</option><option value="ENTERPRISE">Enterprise</option></select>
            <input required placeholder={tr ? "Şirket adı" : "Company name"} value={form.companyName} onChange={(event) => setForm({ ...form, companyName: event.target.value })} />
            <input required placeholder={tr ? "Adınız" : "Your name"} value={form.contactName} onChange={(event) => setForm({ ...form, contactName: event.target.value })} />
            <input required type="email" placeholder="work@company.com" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
            <input placeholder={tr ? "Aylık tahmini event/decision hacmi" : "Estimated monthly event/decision volume"} value={form.estimatedVolume} onChange={(event) => setForm({ ...form, estimatedVolume: event.target.value })} />
            <input placeholder={tr ? "Docker, Kubernetes, air-gap veya dedicated" : "Docker, Kubernetes, air-gap or dedicated"} value={form.deploymentPreference} onChange={(event) => setForm({ ...form, deploymentPreference: event.target.value })} />
            <textarea rows={6} placeholder={tr ? "SSO, region, SLA ve connector ihtiyaçları" : "SSO, region, SLA and connector requirements"} value={form.requirements} onChange={(event) => setForm({ ...form, requirements: event.target.value })} />
            {state === "error" && <p style={{ color: "var(--error)" }}>{tr ? "Talep gönderilemedi. Lütfen tekrar deneyin." : "Request could not be submitted. Please retry."}</p>}
            <button disabled={state === "sending"} className="aur-button aur-button-primary">{state === "sending" ? "…" : (tr ? "Görüşme Talebi Gönder" : "Request a Meeting")}</button>
          </form>
        )}
      </main>
      <Footer />
    </>
  );
}

export default function ContactPage() {
  return <Suspense><ContactForm /></Suspense>;
}
