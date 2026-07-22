import React from "react";
import { Box, Text } from "./design-system/renderer.js";
import type { CompletionProof, TokenBreakdown } from "@aurict/core";
import { HStack, Surface, StatusDot } from "./design-system/index.js";
import { useTheme } from "../utils/theme.js";
import { useTerminalSize } from "./TerminalSizeContext.js";
import { activityLabel, type RunActivity } from "./run-status.js";
import { terminalDensity } from "./terminal-density.js";
import { glyph } from "./terminal-glyphs.js";
import { useSemanticTheme } from "./theme/semantic-theme.js";
import { CockpitSignal } from "./CockpitSignal.js";
import { shellHorizontalInset } from "./app-shell/layout-metrics.js";
import { displayWidth, truncateDisplayWidth } from "./terminal-text/display-width.js";

export interface SessionHeaderProps {
  provider: string; model: string; workdir: string; tokens: TokenBreakdown;
  contextTokens: number; contextWindow?: number | undefined; branch?: string | undefined; activeAgent?: string | undefined;
  activeAgentCount?: number | undefined; loading?: boolean | undefined; activeTool?: string | undefined; activity?: RunActivity | undefined;
  taskSummary?: { pending: number; inProgress: number; done: number; error: number } | undefined;
  bgTaskCount?: number | undefined; localServer?: { enabled: boolean; port?: number; started: boolean; reused: boolean; reason?: string } | undefined;
  sandboxBackend?: "none" | "policy" | "docker" | undefined; coordinatorMode?: boolean | undefined;
  autopilotMode?: boolean | undefined; cols?: number | undefined;
  title?: string | undefined; proof?: CompletionProof | undefined;
}

export interface SessionFooterProps {
  skills?: string[] | undefined; turnSkills?: string[] | undefined;
  bgTaskCount?: number | undefined;
  taskSummary?: { pending: number; inProgress: number; done: number; error: number } | undefined;
  sandboxBackend?: "none" | "policy" | "docker" | undefined; autopilotMode?: boolean | undefined;
  cols?: number | undefined;
  scrollLocked?: boolean | undefined; remoteConnected?: boolean | undefined;
  selectionHint?: boolean | undefined;
}

function short(value: string, max: number): string {
  return truncateDisplayWidth(value, max, glyph("ellipsis"));
}

function shortModel(model: string): string {
  return model.replace(/^claude-/, "").replace(/-\d{8}$/, "");
}

function shortDir(workdir: string, max: number): string {
  const dir = workdir.replace(process.env["HOME"] ?? "", "~");
  if (displayWidth(dir) <= max) return dir;
  const parts = dir.split("/").filter(Boolean);
  return truncateDisplayWidth(`${glyph("ellipsis")}/${parts.slice(-2).join("/")}`, max, glyph("ellipsis"));
}

function contextState(tokens: number, window = 200_000) {
  const ratio = tokens > 0 ? Math.min(1, tokens / window) : 0;
  return { ratio, label: tokens > 0 ? `${Math.round(ratio * 100)}%` : "—" };
}

function proofState(proof: CompletionProof | undefined, semantic: ReturnType<typeof useSemanticTheme>) {
  if (!proof || proof.status === "not_applicable") return null;
  if (proof.status === "passed") return { color: semantic.status.success, icon: glyph("done"), label: `proof ${proof.evidenceCount}` };
  if (proof.status === "failed") return { color: semantic.status.error, icon: glyph("error"), label: "proof failed" };
  return { color: semantic.status.warning, icon: glyph("todo"), label: "proof pending" };
}

export function SessionHeader(props: SessionHeaderProps) {
  const theme = useTheme();
  const semantic = useSemanticTheme();
  const terminal = useTerminalSize();
  const columns = props.cols ?? terminal.columns ?? 120;
  const density = terminalDensity(columns);
  const tiny = density === "tiny";
  const compact = tiny || density === "compact";
  const wide = density === "wide";
  const context = contextState(props.contextTokens, props.contextWindow);
  const proof = proofState(props.proof, semantic);
  const contextColor = context.ratio >= 0.85
    ? semantic.status.error
    : context.ratio >= 0.6
      ? semantic.status.warning
      : semantic.foreground.muted;
  const state = props.activeTool ? `${activityLabel("using_tool")} ${glyph("statusTiny")} ${short(props.activeTool, compact ? 12 : 24)}`
    : props.loading ? activityLabel(props.activity) : "ready";
  const taskTotal = props.taskSummary
    ? props.taskSummary.pending + props.taskSummary.inProgress + props.taskSummary.done + props.taskSummary.error
    : 0;

  return (
    <Box flexDirection="row" width={Math.max(20, columns)} paddingX={shellHorizontalInset(columns)}>
      <Surface
        variant="raised"
        tone="muted"
        accentColor={props.loading ? theme.accent : theme.borderActive}
        {...(theme.bgCard !== undefined ? { backgroundColor: theme.bgCard } : {})}
        paddingX={compact ? "sm" : "md"}
        paddingY="none"
        flexGrow={1}
        flexShrink={1}
      >
        <HStack justify="space-between">
          <HStack gap="sm">
            <StatusDot tone={props.loading ? "accent" : "safe"} active={Boolean(props.loading)} />
            {!compact && <CockpitSignal active={Boolean(props.loading)} />}
            <Text color={theme.accent} bold>AURICT</Text>
            {compact && <Text color={theme.textDim}>{shortDir(props.workdir, tiny ? 10 : 18)}</Text>}
            {!tiny && <Text color={props.loading ? theme.textPrimary : theme.textDim}>{state}</Text>}
            {!compact && props.activeAgent && <Text color={theme.accentAlt}>@{short(props.activeAgent, 16)}</Text>}
          </HStack>
          <HStack>
            {wide && taskTotal > 0 && <Text color={semantic.foreground.muted}>tasks {props.taskSummary!.done}/{taskTotal} {glyph("statusTiny")} </Text>}
            {wide && (props.activeAgentCount ?? 0) > 0 && <Text color={semantic.status.info}>agents {props.activeAgentCount} {glyph("statusTiny")} </Text>}
            {wide && (props.bgTaskCount ?? 0) > 0 && <Text color={semantic.status.info}>bg {props.bgTaskCount} {glyph("statusTiny")} </Text>}
            <Text color={theme.accentAlt}>{tiny ? "" : `${short(props.provider, compact ? 8 : 10)}/`}{short(shortModel(props.model), tiny ? 10 : compact ? 12 : 22)} </Text>
            <Text color={theme.borderDim}>{glyph("separator")} </Text>
            <Text color={contextColor}>ctx {context.label}</Text>
          </HStack>
        </HStack>
        {!compact && (
          <HStack justify="space-between">
            <HStack gap="sm">
              <Text color={theme.borderBright}>{glyph("headingMinor")}</Text>
              <Text color={theme.textSecondary} bold>{short(props.title ?? "new session", wide ? 44 : 26)}</Text>
              <Text color={theme.textDim}>{glyph("separator")} {shortDir(props.workdir, wide ? 38 : 24)}</Text>
              {wide && props.branch && <Text color={theme.textDim}>{glyph("branch")} {short(props.branch, 16)}</Text>}
            </HStack>
            <HStack gap="sm">
              {proof && <Text color={proof.color}>{proof.icon} {proof.label}</Text>}
              <Text color={props.coordinatorMode ? semantic.status.info : theme.textDim}>
                {props.coordinatorMode ? "multi-agent" : "single-agent"}
              </Text>
              {props.autopilotMode && <Text color={semantic.status.warning}>auto</Text>}
            </HStack>
          </HStack>
        )}
      </Surface>
    </Box>
  );
}

export function SessionFooter(props: SessionFooterProps) {
  const theme = useTheme();
  const semantic = useSemanticTheme();
  const terminal = useTerminalSize();
  const columns = props.cols ?? terminal.columns ?? 120;
  const density = terminalDensity(columns);
  const compact = density === "tiny" || density === "compact";
  const taskErrors = props.taskSummary?.error ?? 0;
  const skills = (props.skills?.length ?? 0) + (props.turnSkills?.length ?? 0);
  const sandbox = props.sandboxBackend === "none" ? "no sandbox" : props.sandboxBackend === "docker" ? "docker" : "policy";
  const state = props.scrollLocked
    ? "output paused"
    : taskErrors > 0
      ? `${taskErrors} task${taskErrors === 1 ? "" : "s"} failed`
      : (props.bgTaskCount ?? 0) > 0
        ? `${props.bgTaskCount} background running`
        : "ready";

  return (
    <Surface variant="ghost" tone="muted" paddingX="md" paddingY="none">
      <HStack justify="space-between">
        <HStack gap="sm">
          <Text color={theme.borderBright}>{glyph("headingMinor")}</Text>
          <Text color={props.scrollLocked || taskErrors > 0 ? semantic.status.warning : theme.textSecondary}>{state}</Text>
        </HStack>
        <HStack gap="sm">
          {!compact && props.selectionHint && <Text color={theme.textDim}>Shift+drag selects</Text>}
          {!compact && skills > 0 && <Text color={theme.textDim}>{skills} skills</Text>}
          {!compact && props.remoteConnected && <Text color={semantic.status.success}>{glyph("statusTiny")} remote</Text>}
          {!compact && props.autopilotMode && <Text color={semantic.status.warning}>{glyph("statusTiny")} auto</Text>}
          <Text color={props.sandboxBackend === "none" ? semantic.status.warning : semantic.foreground.muted}>{glyph("statusTiny")} {sandbox}</Text>
          <Text color={theme.borderDim}>{glyph("separator")}</Text>
          <Text color={theme.textDim}>/help</Text>
        </HStack>
      </HStack>
    </Surface>
  );
}
