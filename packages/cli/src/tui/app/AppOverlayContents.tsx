import React from "react";
import { Box, Text } from "../design-system/renderer.js";
import type { Theme } from "../../utils/theme.js";
import type { FocusLayer } from "./app-types.js";
import { BtwPanel } from "../BtwPanel.js";
import { CommandPalette } from "../CommandPalette.js";
import { DesignWizard } from "../DesignWizard.js";
import { ExpandableOutput } from "../ExpandableOutput.js";
import { HistorySearch } from "../HistorySearch.js";
import { KeyboardShortcuts } from "../KeyboardShortcuts.js";
import { MessageEditPanel } from "../MessageEditPanel.js";
import { Picker } from "../Picker.js";
import { PlanApprovalModal } from "../PlanApprovalModal.js";
import { PromptInput } from "../PromptInput.js";
import { QuestionPrompt } from "../QuestionPrompt.js";
import { QuickSearch } from "../QuickSearch.js";
import { SettingsPanel } from "../SettingsPanel.js";
import { TranscriptSearch } from "../TranscriptSearch.js";

type ComponentConfig<T extends React.ElementType> = React.ComponentProps<T> | null;

export interface AppOverlayContentsProps {
  activeLayer: FocusLayer;
  theme: Theme;
  keyboardShortcuts: ComponentConfig<typeof KeyboardShortcuts>;
  historySearch: ComponentConfig<typeof HistorySearch>;
  transcriptSearch: ComponentConfig<typeof TranscriptSearch>;
  quickSearch: ComponentConfig<typeof QuickSearch>;
  commandPalette: ComponentConfig<typeof CommandPalette>;
  settings: ComponentConfig<typeof SettingsPanel>;
  designWizard: ComponentConfig<typeof DesignWizard>;
  planApproval: ComponentConfig<typeof PlanApprovalModal>;
  messageEdit: ComponentConfig<typeof MessageEditPanel>;
  picker: ComponentConfig<typeof Picker>;
  prompt: ComponentConfig<typeof PromptInput>;
  question: ComponentConfig<typeof QuestionPrompt>;
  attachmentInput: { path: string } | null;
  expandedOutput: ComponentConfig<typeof ExpandableOutput>;
  btw: ComponentConfig<typeof BtwPanel>;
}

function requireConfig<T>(layer: FocusLayer, config: T | null): T {
  if (config !== null) return config;
  throw new Error(`Focus layer "${layer}" is active without overlay content`);
}

export function AppOverlayContents(props: AppOverlayContentsProps) {
  switch (props.activeLayer) {
    case "keyboardShortcuts":
      return <KeyboardShortcuts {...requireConfig(props.activeLayer, props.keyboardShortcuts)} />;
    case "historySearch":
      return <HistorySearch {...requireConfig(props.activeLayer, props.historySearch)} />;
    case "transcriptSearch":
      return <TranscriptSearch {...requireConfig(props.activeLayer, props.transcriptSearch)} />;
    case "quickSearch":
      return <QuickSearch {...requireConfig(props.activeLayer, props.quickSearch)} />;
    case "commandPalette":
      return <CommandPalette {...requireConfig(props.activeLayer, props.commandPalette)} />;
    case "settings":
      return <SettingsPanel {...requireConfig(props.activeLayer, props.settings)} />;
    case "designWizard":
      return <DesignWizard {...requireConfig(props.activeLayer, props.designWizard)} />;
    case "plan":
      return <PlanApprovalModal {...requireConfig(props.activeLayer, props.planApproval)} />;
    case "editing":
      return <MessageEditPanel {...requireConfig(props.activeLayer, props.messageEdit)} />;
    case "picker":
      return <Picker {...requireConfig(props.activeLayer, props.picker)} />;
    case "prompt":
      return <PromptInput {...requireConfig(props.activeLayer, props.prompt)} />;
    case "question":
      return <QuestionPrompt {...requireConfig(props.activeLayer, props.question)} />;
    case "permission":
    case "projectAuto":
      return null;
    case "attach": {
      const attachmentInput = requireConfig(props.activeLayer, props.attachmentInput);
      return (
        <Box borderStyle="round" borderColor={props.theme.warning} paddingX={1}>
          <Text color={props.theme.warning}>📎 File path: </Text>
          <Text>{attachmentInput.path}</Text>
          <Text color={props.theme.textDim}> (Enter: attach Esc: cancel)</Text>
        </Box>
      );
    }
    case "expanded":
      return <ExpandableOutput {...requireConfig(props.activeLayer, props.expandedOutput)} />;
    case "btw":
      return <BtwPanel {...requireConfig(props.activeLayer, props.btw)} />;
    case "ready":
    case "streaming":
    case "subagent":
    case "taskPanel":
      return null;
  }
}
