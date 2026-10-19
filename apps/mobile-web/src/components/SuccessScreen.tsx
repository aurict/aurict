"use client";

import { motion } from "framer-motion";
import AmbientBackground from "./AmbientBackground";

interface SuccessScreenProps {
  title: string;
  message: string;
  color?: string;
}

// Shared "account deleted" confirmation used by every app's delete-account flow.
export default function SuccessScreen({ title, message, color = "var(--accent)" }: SuccessScreenProps) {
  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <AmbientBackground />
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 min-h-screen flex items-center justify-center px-6"
      >
        <div className="max-w-md mx-auto text-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ backgroundColor: `color-mix(in oklch, ${color} 18%, transparent)`, border: `1px solid ${color}` }}
          >
            <svg className="w-8 h-8" fill="none" stroke={color} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-4" style={{ color }}>
            {title}
          </h1>
          <p style={{ color: "var(--text-dim)" }} className="leading-relaxed">
            {message}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
