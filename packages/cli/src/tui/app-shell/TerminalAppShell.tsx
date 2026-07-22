import React from "react";
import { DesignBox as Box } from "../design-system/types.js";
import type { Theme } from "../../utils/theme.js";
import { ThemeContext } from "../../utils/theme.js";
import type { Context as KeybindingContext } from "../../keybindings/index.js";
import { KeybindingsProvider } from "../../keybindings/index.js";
import { AlternateScreen } from "../AlternateScreen.js";
import { FullscreenLayout } from "../FullscreenLayout.js";
import { TerminalSizeContext } from "../TerminalSizeContext.js";
import { OverlayStack } from "./OverlayStack.js";

interface Props {
  rows: number;
  columns: number;
  theme: Theme;
  keybindingContext: KeybindingContext;
  header: React.ReactNode;
  transcript: React.ReactNode;
  overlay: React.ReactNode;
  overlayOpen: boolean;
  overlayBackdrop?: boolean | undefined;
  bottom: React.ReactNode;
  sidePanel?: React.ReactNode;
  onTranscriptHeight: (rows: number) => void;
  exitTranscript?: string | undefined;
}

export function TerminalAppShell(props: Props) {
  return (
    <AlternateScreen exitTranscript={props.exitTranscript}>
      <TerminalSizeContext.Provider value={{ columns: props.columns, rows: props.rows }}>
        <ThemeContext.Provider value={props.theme}>
          <KeybindingsProvider initialContext={props.keybindingContext}>
            <Box
              position="relative"
              width="100%"
              height={props.rows}
              backgroundColor={props.theme.bgDeep ?? props.theme.bgHighlight}
            >
              <Box
                flexDirection="row"
                width="100%"
                height={props.rows}
                backgroundColor={props.theme.bgDeep ?? props.theme.bgHighlight}
              >
                <FullscreenLayout
                  rows={props.rows}
                  onScrollableHeight={props.onTranscriptHeight}
                  header={props.header}
                  scrollable={props.transcript}
                  bottom={props.bottom}
                />
                {props.sidePanel}
              </Box>
              <OverlayStack
                open={props.overlayOpen}
                columns={props.columns}
                rows={props.rows}
                backdrop={props.overlayBackdrop}
              >
                {props.overlay}
              </OverlayStack>
            </Box>
          </KeybindingsProvider>
        </ThemeContext.Provider>
      </TerminalSizeContext.Provider>
    </AlternateScreen>
  );
}
