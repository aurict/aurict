import React from "react";
import { AgentStatus } from "../AgentStatus.js";
import { CommandSuggest } from "../CommandSuggest.js";
import { FileMention } from "../FileMention.js";
import { StatusBar } from "../StatusBar.js";
import { ComposerPane } from "../app-shell/ComposerPane.js";
import { InlinePermissionPane } from "../app-shell/InlinePermissionPane.js";
import { CrashNotice } from "../app-shell/CrashNotice.js";
import { ProjectAutoPrompt } from "../ProjectAutoPrompt.js";
import { Box, Text } from "../design-system/renderer.js";
import { useTheme } from "../../utils/theme.js";

type ComponentConfig<T extends React.ElementType> = React.ComponentProps<T> | null;

export interface AppBottomBarProps {
  agentStatus: React.ComponentProps<typeof AgentStatus>;
  commandSuggest: React.ComponentProps<typeof CommandSuggest>;
  fileMention: ComponentConfig<typeof FileMention>;
  attachmentNames: string[];
  projectAuto: ComponentConfig<typeof ProjectAutoPrompt>;
  permission: ComponentConfig<typeof InlinePermissionPane>;
  composer: React.ComponentProps<typeof ComposerPane>;
  status: ComponentConfig<typeof StatusBar>;
}

export function AppBottomBar(props: AppBottomBarProps) {
  const theme = useTheme();
  return (
    <>
      <AgentStatus {...props.agentStatus} />
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
      {props.projectAuto && <ProjectAutoPrompt {...props.projectAuto} />}
      {props.permission && <InlinePermissionPane {...props.permission} />}
      <ComposerPane {...props.composer} />
      {props.status && <StatusBar {...props.status} />}
    </>
  );
}
