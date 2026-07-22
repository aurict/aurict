import React, { useState } from "react";
import { Box, Text, useInput } from "./design-system/renderer.js";
import { PermissionDialog } from "./PermissionDialog.js";
import { useTheme } from "../utils/theme.js";

interface Props {
  workdir: string;
  onDecide: (enabled: boolean) => void;
}

export function ProjectAutoPrompt({ workdir, onDecide }: Props) {
  const theme = useTheme();
  const [selected, setSelected] = useState<"yes" | "no">("no");

  useInput((input, key) => {
    const shortcut = input.toLowerCase();
    if (shortcut === "y" || shortcut === "e") {
      onDecide(true);
      return;
    }
    if (shortcut === "n" || shortcut === "h" || key.escape) {
      onDecide(false);
      return;
    }
    if (key.leftArrow || key.rightArrow || key.upArrow || key.downArrow) {
      setSelected((current) => current === "yes" ? "no" : "yes");
      return;
    }
    if (key.return) onDecide(selected === "yes");
  });

  return (
    <Box flexDirection="column" marginBottom={1}>
      <PermissionDialog
        title="Project Auto"
        subtitle="startup access"
        color={theme.accent}
        tone="accent"
      >
        <Text color={theme.textPrimary}>
          Allow Aurict to edit files in this project without asking each time?
        </Text>
        <Text color={theme.textDim} wrap="truncate-middle">{workdir}</Text>
        <Box marginTop={1} gap={2}>
          <Text
            color={selected === "yes" ? theme.success : theme.textDim}
            bold={selected === "yes"}
          >
            {selected === "yes" ? "❯ " : "  "}Yes · enable Auto
          </Text>
          <Text
            color={selected === "no" ? theme.accent : theme.textDim}
            bold={selected === "no"}
          >
            {selected === "no" ? "❯ " : "  "}No · ask each time
          </Text>
        </Box>
        <Text color={theme.textDim} dimColor>
          Auto never approves shell, secrets, .git/.aurict, outside paths, or large deletes.
        </Text>
        <Text color={theme.textDim} dimColor>
          y/e yes · n/h no · ←/→ choose · Enter confirm
        </Text>
      </PermissionDialog>
    </Box>
  );
}
