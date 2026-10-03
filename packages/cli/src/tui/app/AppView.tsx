import React from "react";
import type { Theme } from "../../utils/theme.js";
import type { Context as KeybindingContext } from "../../keybindings/index.js";
import { TerminalAppShell } from "../app-shell/TerminalAppShell.js";
import { InlineAppShell, type InlineTranscriptProps } from "../app-shell/InlineAppShell.js";

export interface InlineViewProps {
  intro: React.ReactNode;
  transcript: InlineTranscriptProps;
  header: React.ReactNode;
  transcriptVisible: boolean;
  exiting: boolean;
}

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
  /** Present in inline mode: history goes to native scrollback instead of a viewport. */
  inline?: InlineViewProps | undefined;
}

export function AppView(props: AppViewProps) {
  if (props.inline) {
    return (
      <InlineAppShell
        rows={props.rows}
        columns={props.columns}
        theme={props.theme}
        keybindingContext={props.keybindingContext}
        {...props.inline}
        overlay={props.overlay}
        overlayOpen={props.overlayOpen}
        overlayBackdrop={props.overlayBackdrop}
        bottom={props.bottom}
      />
    );
  }
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
