"use client";

import { useState } from "react";
import styles from "./CodeBlock.module.css";

export function CodeBlock({ code, label }: { code: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className={styles.block}>
      {label ? <span className={styles.label}>{label}</span> : null}
      <pre tabIndex={0}>
        <code>{code}</code>
      </pre>
      <button type="button" className={styles.copy} onClick={copy}>
        {copied ? "Copied" : "Copy"}
        <span className="visually-hidden" aria-live="polite">{copied ? " to clipboard" : ""}</span>
      </button>
    </div>
  );
}
