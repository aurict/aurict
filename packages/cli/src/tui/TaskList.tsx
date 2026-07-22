import React from "react"
import { Box, Text } from "./design-system/renderer.js"
import type { Task } from "@aurict/core"
import { useSemanticTheme } from "./theme/semantic-theme.js"

interface Props {
  tasks: Task[]
}

export function TaskList({ tasks }: Props) {
  const semantic = useSemanticTheme()
  if (tasks.length === 0) return null

  const doneCount    = tasks.filter(t => t.status === "done" || t.status === "cancelled").length
  const runningCount = tasks.filter(t => t.status === "in_progress" || t.status === "verifying").length
  const errorCount   = tasks.filter(t => t.status === "error").length

  return (
    <Box flexDirection="column" width={35} paddingLeft={2} borderStyle="single" borderColor={semantic.border.subtle} borderTop={false} borderBottom={false} borderRight={false}>
      <Box width="100%" marginBottom={1}>
        <Text color={semantic.foreground.muted}>
          <Text bold color={semantic.foreground.primary}>{tasks.length}</Text>
          {" tasks ("}
          <Text bold color={semantic.foreground.primary}>{doneCount}</Text>
          {" done, "}
          {runningCount > 0 && <><Text bold color={semantic.foreground.primary}>{runningCount}</Text>{" in progress, "}</>}
          <Text bold color={semantic.foreground.primary}>{errorCount}</Text>
          {" error)"}
        </Text>
      </Box>
      {tasks.map((task) => {
        const isCompleted  = task.status === "done" || task.status === "cancelled"
        const isInProgress = task.status === "in_progress" || task.status === "verifying"
        const isError      = task.status === "error"
        const isPending    = task.status === "pending" || task.status === "ready" || task.status === "blocked"

        const icon  = isCompleted ? "✔" : isError ? "✗" : isPending ? "▫" : "▪"
        const color = isCompleted
          ? semantic.status.success
          : isError
            ? semantic.status.error
            : isPending
              ? semantic.activity.idle
              : semantic.activity.running

        const desc = task.subject.length > 20 ? task.subject.slice(0, 20) + "..." : task.subject

        return (
          <Box key={task.id} flexDirection="column" marginBottom={1}>
            <Box flexDirection="row" width="100%">
              <Text color={color}>{icon} </Text>
              <Text bold={isInProgress} strikethrough={isCompleted} color={isCompleted ? semantic.foreground.muted : semantic.foreground.primary}>
                {desc}
              </Text>
              {task.owner && (
                <Text color={semantic.foreground.muted}>
                  {" (@"}<Text color={color}>{task.owner}</Text>{")"}
                </Text>
              )}
            </Box>
            
            {/* Blockers (tasks being waited on) */}
            {task.blockedBy && task.blockedBy.length > 0 && (
               <Box paddingLeft={2}>
                 <Text color={semantic.foreground.muted}>blocked by: {task.blockedBy.join(", ")}</Text>
               </Box>
            )}

            {/* Status text */}
            {isInProgress && (
              <Box paddingLeft={2}>
                <Text color={semantic.activity.running}>Working...</Text>
              </Box>
            )}
            
            {/* Error text */}
            {isError && task.error && (
               <Box paddingLeft={2}>
                 <Text color={semantic.status.error}>{task.error.slice(0, 25)}</Text>
               </Box>
            )}
          </Box>
        )
      })}
    </Box>
  )
}
