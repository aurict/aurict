const SAFE_LINK = /^(?:https?:|file:|mailto:)/i;
const CONTROL = /[\x00-\x1F\x7F]/g;

export function terminalHyperlink(label: string, target: string): string {
  const cleanTarget = target.replace(CONTROL, "").trim();
  if (!SAFE_LINK.test(cleanTarget)) return label;
  return `\x1b]8;;${cleanTarget}\x1b\\${label}\x1b]8;;\x1b\\`;
}
