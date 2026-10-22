import React, { useRef, useState } from "react";
import wrapAnsi from "wrap-ansi";
import { Box, Text, useInput } from "./design-system/renderer.js";
import { useTheme } from "../utils/theme.js";
import { glyph } from "./terminal-glyphs.js";
import { trustTarget } from "./project-trust.js";
import { useTerminalSize } from "./TerminalSizeContext.js";
import { tildePath } from "../commands/command-helpers.js";

interface Props {
  workdir: string;
  /** true: trust and continue; false: quit. */
  onDecide: (trusted: boolean) => void;
}

const OPTIONS = ["Trust and continue", "Quit"] as const;
const TRUST_TEXT = "Trust this folder? Aurict can read, edit, and run files here, subject to your permission settings. "
  + "Folder settings can run code automatically, even without a model request. Continue only if you trust these files. "
  + "Your trust decision will be saved.";

/**
 * The Codex folder-trust prompt, shown once per folder:
 *
 *   Folder access
 *   ~/projects/aurict
 *
 *   Trust this folder? Aurict can read, edit, and run files here, …
 *
 * › 1. Trust and continue
 *   2. Quit
 *
 *   enter continue · esc quit
 */
export function ProjectAutoPrompt({ workdir, onDecide }: Props) {
  const theme = useTheme();
  const { columns } = useTerminalSize();
  const [selected, setSelected] = useState(0);
  const selectedRef = useRef(0);
  const paragraph = (text: string) => wrapAnsi(text, Math.max(20, columns - 4), { hard: true, trim: true }).split("\n");
  const root = trustTarget(workdir);

  useInput((input, key) => {
    if (key.escape) { onDecide(false); return; }
    if (key.upArrow || key.downArrow) {
      selectedRef.current = selectedRef.current === 0 ? 1 : 0;
      setSelected(selectedRef.current);
      return;
    }
    if (input === "1" || input === "2") { onDecide(input === "1"); return; }
    if (key.return) onDecide(selectedRef.current === 0);
  });

  return (
    <Box flexDirection="column">
      <Text> </Text>
      <Text bold>  Folder access</Text>
      <Text color={theme.textDim} wrap="truncate-middle">  {tildePath(workdir)}</Text>
      {root !== workdir && (
        <Box flexDirection="column" marginTop={1} paddingLeft={2}>
          {paragraph("Note: You’re in a subdirectory of a Git project. Trusting will apply to the repository root:").map((line, index) => (
            <Text key={index} color={theme.warning}>{line}</Text>
          ))}
          <Text color={theme.textDim} wrap="truncate-middle">{tildePath(root)}</Text>
        </Box>
      )}
      <Box marginTop={1} paddingLeft={2} flexDirection="column">
        {/* Pre-wrapped: Ink keeps the leading space of a soft-wrapped line. */}
        {paragraph(TRUST_TEXT).map((line, index) => (
          <Text key={index}>{line}</Text>
        ))}
      </Box>
      <Box flexDirection="column" marginTop={1}>
        {OPTIONS.map((label, index) => {
          const active = index === selected;
          return (
            <Text key={label} {...(active ? { color: theme.accent, bold: true } : {})}>
              {active ? `${glyph("prompt")} ` : "  "}{index + 1}. {label}
            </Text>
          );
        })}
      </Box>
      <Box marginTop={1}>
        <Text>  enter<Text color={theme.textDim}> continue · </Text>esc<Text color={theme.textDim}> quit</Text></Text>
      </Box>
    </Box>
  );
}
