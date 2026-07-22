import React from "react";
import type { Theme } from "../../utils/theme.js";
import type { Context as KeybindingContext } from "../../keybindings/index.js";
import { TerminalAppShell } from "../app-shell/TerminalAppShell.js";

export interface AppViewProps {
  rows: number;
  columns: number;
  theme: Theme;
  keybindingContext: KeybindingContext;
  onTranscriptHeight: (rows: number) => void;
  header: React.ReactNode;
  transcript: React.ReactNode;
  overlay: React.ReactNode;
  overlayOpen: boolean;
  overlayBackdrop?: boolean | undefined;
  bottom: React.ReactNode;
  sidePanel?: React.ReactNode;
  exitTranscript?: string | undefined;
}

export function AppView(props: AppViewProps) {
  return (
    <TerminalAppShell
      rows={props.rows}
      columns={props.columns}
      theme={props.theme}
      keybindingContext={props.keybindingContext}
      onTranscriptHeight={props.onTranscriptHeight}
      header={props.header}
      transcript={props.transcript}
      overlay={props.overlay}
      overlayOpen={props.overlayOpen}
      overlayBackdrop={props.overlayBackdrop}
      bottom={props.bottom}
      exitTranscript={props.exitTranscript}
      {...(props.sidePanel !== undefined ? { sidePanel: props.sidePanel } : {})}
    />
  );
}
