import { useEffect, useState } from "react";

/** True for the first `durationMs` after mount, then false. */
export function useTransientFlag(durationMs: number): boolean {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), durationMs);
    return () => clearTimeout(timer);
  }, [durationMs]);
  return visible;
}
