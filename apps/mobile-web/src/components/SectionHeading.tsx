"use client";

import { motion } from "framer-motion";
import TightPeriod from "./TightPeriod";

const EASE = [0.16, 0.8, 0.2, 1] as const;

export default function SectionHeading({
  eyebrow,
  title,
  subtitle,
  center = false,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  center?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, ease: EASE }}
      className={center ? "text-center mx-auto max-w-3xl mb-12" : "max-w-3xl mb-12"}
    >
      <div className="eyebrow mb-3">{eyebrow}</div>
      <h2
        className="font-extrabold tracking-tight [text-wrap:balance]"
        style={{ fontSize: "clamp(2.1rem, 4.4vw, 3.4rem)", letterSpacing: "-0.035em", lineHeight: 1.05, color: "var(--text)" }}
      >
        <TightPeriod text={title} />
      </h2>
      {subtitle && (
        <p className="mt-4 text-lg md:text-xl leading-relaxed" style={{ color: "var(--text-dim)" }}>
          {subtitle}
        </p>
      )}
    </motion.div>
  );
}
