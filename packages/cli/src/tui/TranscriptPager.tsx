/**
 * TranscriptPager — full transcript view for inline mode (Ctrl+T).
 *
 * Scrollback holds rows exactly as they were printed. The pager re-projects
 * the whole conversation at the current width, includes the still-running
 * turn, and lists tracked tasks, so nothing depends on terminal scrolling.
 */
import React, { useMemo, useState } from "react";
import { SessionManager, type Task } from "@aurict/core";
import { Box, Text, useInput } from "./design-system/renderer.js";
import { Surface } from "./design-system/index.js";
import { useTheme } from "../utils/theme.js";
import { TranscriptRows } from "./TranscriptRows.js";
import { projectTranscript, type TranscriptRow } from "./conversation/projector.js";
import type { TranscriptMessage } from "./conversation/types.js";
import { glyph } from "./terminal-glyphs.js";

export interface TranscriptPagerProps {
  messages: TranscriptMessage[];
  streamingText: string | null;
  width: number;
  /** Rows available for transcript content. */
  height: number;
  tasks: Task[];
  /** Message to scroll into view on open; the bottom otherwise. */
  anchorMessageId?: string | null | undefined;
  /** Main session id; its subagent sessions become extra tabs. */
  parentSessionId?: string | undefined;
  onClose: () => void;
}

interface PagerTab {
  id: string;
  title: string;
}

/** Persisted user/assistant turns of a subagent session. */
function sessionMessages(sessionId: string): TranscriptMessage[] {
  return SessionManager.getParts(sessionId)
    .filter((part) => part.role === "user" || part.role === "assistant")
    .map((part) => ({ id: part.id, role: part.role as "user" | "assistant", content: part.content }));
}

function subagentTabs(parentSessionId: string | undefined): PagerTab[] {
  if (!parentSessionId) return [];
  return SessionManager.list()
    .filter((session) => session.parentId === parentSessionId)
    .sort((left, right) => left.createdAt - right.createdAt)
    .map((session, index) => ({ id: session.id, title: session.title ?? `agent ${index + 1}` }));
}

function taskRows(tasks: Task[]): TranscriptRow[] {
  if (tasks.length === 0) return [];
  const done = tasks.filter((task) => task.status === "done" || task.status === "cancelled").length;
  return [
    { id: "pager:tasks:gap", segments: [{ text: "", tone: "muted" }] },
    { id: "pager:tasks", segments: [{ text: `Tasks ${done}/${tasks.length}`, tone: "heading", bold: true }] },
    ...tasks.map((task): TranscriptRow => {
      const finished = task.status === "done" || task.status === "cancelled";
      const failed = task.status === "error";
      const marker = finished ? glyph("done") : failed ? glyph("error") : glyph("todo");
      return {
        id: `pager:task:${task.id}`,
        segments: [
          { text: `${marker} `, tone: finished ? "success" : failed ? "error" : "muted" },
          { text: task.subject, tone: finished ? "muted" : "assistant" },
          { text: `  ${task.status.replace("_", " ")}`, tone: "muted" },
        ],
      };
    }),
  ];
}

/** Offset from the bottom that puts the anchored message at the top of the view. */
export function pagerOffsetForAnchor(rows: TranscriptRow[], height: number, anchorMessageId: string | null | undefined): number {
  const maxOffset = Math.max(0, rows.length - height);
  if (!anchorMessageId) return 0;
  const index = rows.findIndex((row) => row.id.startsWith(`${anchorMessageId}:`));
  if (index === -1) return 0;
  return Math.max(0, Math.min(maxOffset, rows.length - height - index));
}

export function TranscriptPager(props: TranscriptPagerProps) {
  const theme = useTheme();
  const viewRows = Math.max(1, props.height);
  const tabs = useMemo<PagerTab[]>(
    () => [{ id: "main", title: "Main" }, ...subagentTabs(props.parentSessionId)],
    [props.parentSessionId],
  );
  const [tab, setTab] = useState(0);
  const rows = useMemo(() => tab === 0
    ? [
        ...projectTranscript({
          messages: props.messages,
          width: props.width,
          streamingText: props.streamingText,
          streamingReason: null,
          streamingError: null,
        }),
        ...taskRows(props.tasks),
      ]
    : projectTranscript({
        messages: sessionMessages(tabs[tab]!.id),
        width: props.width,
        streamingText: null,
        streamingReason: null,
        streamingError: null,
      }), [props.messages, props.streamingText, props.tasks, props.width, tab, tabs]);
  const maxOffset = Math.max(0, rows.length - viewRows);
  const [offset, setOffset] = useState(() => pagerOffsetForAnchor(rows, viewRows, props.anchorMessageId));
  const clamped = Math.min(offset, maxOffset);
  const scroll = (delta: number) => setOffset(Math.max(0, Math.min(maxOffset, clamped + delta)));
  const page = Math.max(1, viewRows - 2);

  useInput((input, key) => {
    if (key.tab && tabs.length > 1) {
      setTab((current) => (current + (key.shift ? tabs.length - 1 : 1)) % tabs.length);
      setOffset(0);
    }
    else if (key.escape || input === "q" || (key.ctrl && input === "t")) props.onClose();
    else if (key.upArrow || input === "k") scroll(1);
    else if (key.downArrow || input === "j") scroll(-1);
    else if ((key as typeof key & { pageUp?: boolean }).pageUp || input === "b") scroll(page);
    else if ((key as typeof key & { pageDown?: boolean }).pageDown || input === " ") scroll(-page);
    else if (input === "g") setOffset(maxOffset);
    else if (input === "G") setOffset(0);
  });

  const start = Math.max(0, rows.length - viewRows - clamped);
  const position = rows.length <= viewRows
    ? "all"
    : `${Math.round(((rows.length - clamped) / rows.length) * 100)}%`;
  return (
    <Surface variant="raised" tone="default" paddingX="sm" paddingY="none" flexGrow={1}>
      <Box justifyContent="space-between">
        <Text wrap="truncate-end">
          <Text color={theme.accent} bold>Transcript</Text>
          {tabs.length > 1 && tabs.map((entry, index) => (
            <Text key={entry.id} color={index === tab ? theme.textPrimary : theme.textDim} bold={index === tab}>
              {index === 0 ? "  " : ` ${glyph("statusTiny")} `}{entry.title.slice(0, 18)}
            </Text>
          ))}
        </Text>
        <Text color={theme.textDim}>{tabs.length > 1 ? `Tab agent ${glyph("statusTiny")} ` : ""}↑↓ scroll {glyph("statusTiny")} space/b page {glyph("statusTiny")} g/G ends {glyph("statusTiny")} Esc close {glyph("statusTiny")} {position}</Text>
      </Box>
      <Box flexDirection="column" height={viewRows} overflow="hidden">
        <TranscriptRows rows={rows.slice(start, start + viewRows)} rail />
      </Box>
    </Surface>
  );
}
