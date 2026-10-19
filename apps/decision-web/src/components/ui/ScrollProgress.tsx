"use client";

import { useState, useEffect, useCallback } from "react";

export function ScrollProgress() {
  const [progress, setProgress] = useState(0);

  const handleScroll = useCallback(() => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (docHeight > 0) {
      setProgress(Math.min(scrollTop / docHeight, 1));
    }
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    const initialFrame = window.requestAnimationFrame(handleScroll);

    return () => {
      window.cancelAnimationFrame(initialFrame);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [handleScroll]);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: `${progress * 100}%`,
        height: 2,
        zIndex: 90,
        pointerEvents: "none",
        background: `linear-gradient(90deg, transparent 0%, var(--accent) 30%, var(--accent-alt) 70%, transparent 100%)`,
        transition: "width 0.15s ease-out",
      }}
      aria-hidden="true"
    />
  );
}
