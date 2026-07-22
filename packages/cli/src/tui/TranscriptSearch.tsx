import React, { useEffect, useMemo, useState } from "react";
import { Box, Text, useInput } from "./design-system/renderer.js";
import { Surface, Typo, VStack } from "./design-system/index.js";
import { useTheme } from "../utils/theme.js";
import { findTranscriptMatches } from "./conversation/search-model.js";
import type { TranscriptMessage } from "./conversation/types.js";

interface Props {
  messages: TranscriptMessage[];
  onSelect: (messageId: string) => void;
  onClose: () => void;
}

export function TranscriptSearch({ messages, onSelect, onClose }: Props) {
  const theme = useTheme();
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const matches = useMemo(() => findTranscriptMatches(messages, query, 10), [messages, query]);
  const selected = Math.min(cursor, Math.max(0, matches.length - 1));

  useEffect(() => setCursor((value) => Math.min(value, Math.max(0, matches.length - 1))), [matches.length]);
  useInput((input, key) => {
    if (key.escape || (key.ctrl && input === "c")) { onClose(); return; }
    if (key.upArrow) { setCursor((value) => Math.max(0, value - 1)); return; }
    if (key.downArrow || (key.ctrl && input === "f")) {
      setCursor((value) => Math.min(Math.max(0, matches.length - 1), value + 1));
      return;
    }
    if (key.return) {
      const match = matches[selected];
      if (match) onSelect(match.messageId);
      return;
    }
    if (key.backspace || key.delete) { setQuery((value) => value.slice(0, -1)); setCursor(0); return; }
    if (input && !key.ctrl && !key.meta && !key.tab) { setQuery((value) => value + input); setCursor(0); }
  });

  return (
    <Surface variant="raised" tone="accent" paddingX="sm" paddingY="sm" marginX="md">
      <VStack gap="sm">
        <Box justifyContent="space-between">
          <Typo variant="bodyEmphasis" tone="accent">Find in conversation</Typo>
          <Typo variant="caption" tone="muted">Enter jump · Ctrl+F next · Esc close</Typo>
        </Box>
        <Box><Text color={theme.accent}>⌕ </Text><Text>{query || "type to search…"}</Text><Text color={theme.accent}>▋</Text></Box>
        {query && matches.length === 0 && <Typo variant="body" tone="muted">No matches</Typo>}
        {matches.map((match, index) => (
          <Box key={`${match.messageId}:${index}`}>
            <Text color={index === selected ? theme.accent : theme.borderDim}>{index === selected ? "▶ " : "  "}</Text>
            <Text color={theme.textDim}>{match.role.padEnd(7)} </Text>
            <Text color={index === selected ? theme.textPrimary : theme.textSecondary}>{match.snippet}</Text>
          </Box>
        ))}
      </VStack>
    </Surface>
  );
}
