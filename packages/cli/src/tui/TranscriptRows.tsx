import React from "react";
import { Box, Text } from "ink";
import type { TranscriptRow, TranscriptTone } from "./conversation/projector.js";
import { useSemanticTheme, type SemanticTheme } from "./theme/semantic-theme.js";
import { useTheme, type Theme } from "../utils/theme.js";
import { C } from "../utils/highlight.js";
import { glyph } from "./terminal-glyphs.js";
import type { SyntaxKind } from "./conversation/row-model.js";
import { getDiffPalette, type DiffPalette } from "./DiffRenderer/palette.js";

function toneColor(tone: TranscriptTone | undefined, theme: SemanticTheme): string {
  if (tone === "user") return theme.identity.user;
  if (tone === "thinking") return theme.activity.running;
  if (tone === "tool") return theme.tool.default;
  if (tone === "error") return theme.status.error;
  if (tone === "success") return theme.status.success;
  if (tone === "bullet") return theme.markdown.bullet;
  if (tone === "heading") return theme.markdown.heading;
  if (tone === "code") return theme.markdown.code;
  if (tone === "quote") return theme.markdown.quote;
  if (tone === "muted") return theme.foreground.muted;
  if (tone === "diff-add") return theme.diff.added;
  if (tone === "diff-remove") return theme.diff.removed;
  if (tone === "diff-context") return theme.diff.context;
  if (tone === "diff-hunk") return theme.diff.hunk;
  return theme.foreground.secondary;
}

/**
 * Syntax colours follow the code-block palette, but only on dark brand
 * themes: accessibility themes and light backgrounds keep semantic tones so
 * contrast guarantees hold.
 */
export function syntaxPalette(theme: Theme): Readonly<Record<SyntaxKind, string>> | null {
  if (ACCESSIBILITY_THEMES.has(theme.name)) return null;
  const background = /^#([0-9a-f]{6})$/i.exec(theme.bgDeep ?? theme.bgHighlight)?.[1];
  if (!background) return null;
  const [r, g, b] = [0, 2, 4].map((offset) => parseInt(background.slice(offset, offset + 2), 16) / 255);
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b! < 0.5 ? C : null;
}

const ACCESSIBILITY_THEMES = new Set(["System ANSI", "High Contrast", "Colorblind Dark"]);

export function TranscriptRows({ rows, rail = false }: { rows: TranscriptRow[]; rail?: boolean }) {
  const theme = useSemanticTheme();
  const baseTheme = useTheme();
  const diffPalette = getDiffPalette(baseTheme);
  const syntax = syntaxPalette(baseTheme);
  return <>
    {rows.map((row) => {
      const backgroundColor = rowBackground(row, theme, diffPalette);
      return (
        <Box key={row.id} width="100%" {...(backgroundColor ? { backgroundColor } : {})}>
          <Text wrap="truncate-end">
            {rail && rowHasContent(row) && <Text color={railColor(row, theme)}>{glyph("separator")} </Text>}
            {row.segments.map((segment, index) => (
              <Text
                key={`${row.id}:${index}`}
                color={(segment.syntax && syntax?.[segment.syntax]) || toneColor(segment.tone, theme)}
                {...(segment.bold ? { bold: true } : {})}
                {...(segment.italic ? { italic: true } : {})}
                {...(segment.underline ? { underline: true } : {})}
                {...(segment.strikethrough ? { strikethrough: true } : {})}
                {...(segment.dim ? { dimColor: true } : {})}
              >{segment.text || " "}</Text>
            ))}
          </Text>
        </Box>
      );
    })}
  </>;
}

function rowBackground(row: TranscriptRow, theme: SemanticTheme, diff: DiffPalette): string | undefined {
  if (row.surface === "user") return theme.surface.selected;
  if (row.surface === "diff-add") return diff.addBg;
  if (row.surface === "diff-remove") return diff.removeBg;
  if (row.surface === "diff-hunk") return diff.hunkBg;
  return undefined;
}

function rowHasContent(row: TranscriptRow): boolean {
  return row.segments.some((segment) => segment.text.length > 0);
}

function railColor(row: TranscriptRow, theme: SemanticTheme): string {
  const tone = row.segments.find((segment) => segment.text.trim())?.tone;
  if (row.id.endsWith(":header") && tone === "user") return theme.identity.user;
  if (row.id.endsWith(":header") && tone === "assistant") return theme.identity.assistant;
  if (tone === "error") return theme.status.error;
  if (tone === "thinking") return theme.activity.running;
  return theme.border.subtle;
}
