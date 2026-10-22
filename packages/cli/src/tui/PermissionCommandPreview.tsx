import React, { useEffect, useState } from "react";
import { Box, Text, useInput } from "./design-system/renderer.js";
import { useTheme } from "../utils/theme.js";
import { useTerminalSize } from "./TerminalSizeContext.js";
import { wrapTranscriptText } from "./conversation/line-buffer.js";
import { glyph } from "./terminal-glyphs.js";

function clean(value: string): string {
  return value.replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, "").replace(/\r/g, "");
}

export function wrapPermissionText(value: string, width: number): string[] {
  return wrapTranscriptText(clean(value), width);
}

interface Props {
  command: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  label?: string;
  linePrefix?: string;
}

export function PermissionCommandPreview({
  command,
  open,
  onOpenChange,
  label = "command",
  linePrefix = "$ ",
}: Props) {
  const theme = useTheme();
  const { columns, rows } = useTerminalSize();
  const width = Math.max(20, Math.min(columns - 10, 74));
  const detailRows = Math.max(3, Math.min(12, rows - 14));
  const lines = wrapPermissionText(command, width);
  const [offset, setOffset] = useState(0);
  const maxOffset = Math.max(0, lines.length - detailRows);

  useEffect(() => {
    setOffset((current) => Math.min(current, maxOffset));
  }, [maxOffset]);
  useInput(
    (_input, key) => {
      if (!open) return;
      if (key.escape || _input === "d") {
        onOpenChange(false);
        return;
      }
      if (key.upArrow) setOffset((value) => Math.max(0, value - 1));
      if (key.downArrow) setOffset((value) => Math.min(maxOffset, value + 1));
      if (key.pageUp || (_input === "u" && key.ctrl))
        setOffset((value) => Math.max(0, value - detailRows));
      if (key.pageDown || (_input === "d" && key.ctrl))
        setOffset((value) => Math.min(maxOffset, value + detailRows));
    },
    { isActive: open },
  );

  const visible = lines.slice(offset, offset + detailRows);
  if (!open) {
    return (
      <Box>
        <Text wrap="truncate-end">
          {linePrefix}{lines[0] || " "}
          {lines.length > 1
            ? <Text color={theme.textDim}> {glyph("ellipsis")} +{lines.length - 1} lines (d to inspect)</Text>
            : null}
        </Text>
      </Box>
    );
  }

  return (
    <Box
      flexDirection="column"
      marginBottom={1}
      borderStyle="single"
      borderColor={theme.accent}
      paddingX={1}
    >
      <Text color={theme.textDim} dimColor>
        {label} · {command.length.toLocaleString()} chars · {lines.length}{" "}
        visual lines
        {" · d/Esc close · ↑↓ scroll"}
      </Text>
      {visible.map((line, index) => (
        <Text
          key={`${offset}-${index}`}
          color={theme.textPrimary}
          wrap="truncate-end"
        >
          {linePrefix}{line || " "}
        </Text>
      ))}
      {lines.length > detailRows && (
        <Text color={theme.textDim} dimColor>
          {offset + 1}-{Math.min(offset + detailRows, lines.length)} /{" "}
          {lines.length}
        </Text>
      )}
    </Box>
  );
}
