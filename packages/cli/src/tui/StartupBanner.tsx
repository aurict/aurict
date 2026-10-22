import React from "react";
import { Box, Text } from "./design-system/renderer.js";
import { useTheme } from "../utils/theme.js";
import { glyph } from "./terminal-glyphs.js";
import { tildePath } from "../commands/command-helpers.js";

interface Props {
  version: string;
  provider: string;
  model: string;
  workdir: string;
  cols?: number;
  rows?: number;
  /** Full access (Codex "YOLO mode") adds a permissions line to the header. */
  fullAccess?: boolean;
  /** Kept for callers that still pass a quip; the Codex header has none. */
  quip?: string;
}

function shortenMiddle(value: string, max: number): string {
  if (value.length <= max) return value;
  const separator = glyph("ellipsis");
  const side = Math.max(3, Math.floor((max - separator.length) / 2));
  return `${value.slice(0, side)}${separator}${value.slice(-side)}`;
}

const COMMANDS: Array<[string, string]> = [
  ["/init", "create an AGENTS.md file with instructions for Aurict"],
  ["/status", "show current session configuration"],
  ["/permissions", "choose what Aurict is allowed to do"],
  ["/model", "choose what model to use"],
  ["/review", "review any changes and find issues"],
];

/**
 * The session header, printed once into scrollback: Codex's layout with the
 * aurict.com wordmark (lowercase name, brand-red block cursor).
 *
 *   aurict█ v1.2.25
 *   ~/projects/aurict
 *   permissions: YOLO mode            (full access only)
 *
 *   To get started, describe a task or try one of these commands:
 *
 *   /init          create an AGENTS.md file with instructions for Aurict
 *   /status        show current session configuration
 */
export function StartupBanner({ version, workdir, cols = 120, rows = 30, fullAccess = false }: Props) {
  const theme = useTheme();
  const dim = { color: theme.textDim };
  const compact = rows < 18;
  const nameWidth = Math.max(...COMMANDS.map(([name]) => name.length)) + 2;

  return (
    <Box flexDirection="column" paddingTop={1}>
      <Text>  <Text bold>aurict</Text><Text color={theme.borderActive}>{glyph("cursor")}</Text><Text {...dim}> {version}</Text></Text>
      <Text {...dim}>  {shortenMiddle(tildePath(workdir), Math.max(16, cols - 4))}</Text>
      {fullAccess && <Text>  <Text {...dim}>permissions: </Text><Text color={theme.error} bold>YOLO mode</Text></Text>}
      {!compact && <Box flexDirection="column" marginTop={1}>
        <Text {...dim}>  To get started, describe a task or try one of these commands:</Text>
        <Text> </Text>
        {COMMANDS.map(([name, description]) => (
          <Text key={name} wrap="truncate-end">  <Text color={theme.accent}>{name.padEnd(nameWidth)}</Text><Text {...dim}>{description}</Text></Text>
        ))}
      </Box>}
    </Box>
  );
}
