import React from "react";
import { AgentStatus } from "../AgentStatus.js";
import { CommandSuggest } from "../CommandSuggest.js";
import { FileMention } from "../FileMention.js";
import { StatusBar } from "../StatusBar.js";
import { ComposerPane } from "../app-shell/ComposerPane.js";
import { InlinePermissionPane } from "../app-shell/InlinePermissionPane.js";
import { CrashNotice } from "../app-shell/CrashNotice.js";
import { ProjectAutoPrompt } from "../ProjectAutoPrompt.js";
import { RunStatusLine } from "../RunStatusLine.js";
import { KeyboardShortcuts } from "../KeyboardShortcuts.js";
import { Picker } from "../Picker.js";
import { Box, Text } from "../design-system/renderer.js";
import { useTheme } from "../../utils/theme.js";

type ComponentConfig<T extends React.ElementType> = React.ComponentProps<T> | null;

export interface AppBottomBarProps {
  /** Fullscreen only: Codex shows subagents as transcript cells, not a panel. */
  agentStatus: ComponentConfig<typeof AgentStatus>;
  commandSuggest: React.ComponentProps<typeof CommandSuggest>;
  fileMention: ComponentConfig<typeof FileMention>;
  attachmentNames: string[];
  /** Inline mode's working row; fullscreen shows run state in the cockpit. */
  runStatus?: ComponentConfig<typeof RunStatusLine> | undefined;
  projectAuto: ComponentConfig<typeof ProjectAutoPrompt>;
  permission: ComponentConfig<typeof InlinePermissionPane>;
  composer: React.ComponentProps<typeof ComposerPane>;
  status: ComponentConfig<typeof StatusBar>;
  /** Inline "?" overlay; it takes the footer's place, as in Codex. */
  shortcuts?: ComponentConfig<typeof KeyboardShortcuts> | undefined;
  /** Codex selection list; it replaces the composer and footer while open. */
  picker: ComponentConfig<typeof Picker>;
}

export function AppBottomBar(props: AppBottomBarProps) {
  const theme = useTheme();
  return (
    <>
      {props.agentStatus && <AgentStatus {...props.agentStatus} />}
      <CommandSuggest {...props.commandSuggest} />
      {props.fileMention && <FileMention {...props.fileMention} />}
      {props.attachmentNames.length > 0 && (
        <Box>
          <Text color={theme.accentAlt}>
            📎 {props.attachmentNames.length} dosya: {props.attachmentNames.join(", ")}
          </Text>
        </Box>
      )}
      <CrashNotice />
      {props.runStatus && <RunStatusLine {...props.runStatus} />}
      {props.projectAuto && <ProjectAutoPrompt {...props.projectAuto} />}
      {props.permission && <InlinePermissionPane {...props.permission} />}
      {props.picker ? <Picker {...props.picker} /> : (
        <>
          <ComposerPane {...props.composer} />
          {props.shortcuts ? <KeyboardShortcuts {...props.shortcuts} /> : props.status && <StatusBar {...props.status} />}
        </>
      )}
    </>
  );
}
