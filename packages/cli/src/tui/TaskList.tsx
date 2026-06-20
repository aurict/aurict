import React from "react"
import { Box, Text } from "ink"
import type { Task } from "@aurict/core"

interface Props {
  tasks: Task[]
}

export function TaskList({ tasks }: Props) {
  if (tasks.length === 0) return null

  const doneCount    = tasks.filter(t => t.status === "done").length
  const runningCount = tasks.filter(t => t.status === "in_progress").length
  const errorCount   = tasks.filter(t => t.status === "error").length

  return (
    <Box flexDirection="column" width={35} paddingLeft={2} borderStyle="single" borderColor="#52525b" borderTop={false} borderBottom={false} borderRight={false}>
      <Box width="100%" marginBottom={1}>
        <Text color="#a1a1aa">
          <Text bold color="white">{tasks.length}</Text>
          {" tasks ("}
          <Text bold color="white">{doneCount}</Text>
          {" done, "}
          {runningCount > 0 && <><Text bold color="white">{runningCount}</Text>{" in progress, "}</>}
          <Text bold color="white">{errorCount}</Text>
          {" error)"}
        </Text>
      </Box>
      {tasks.map((task) => {
        const isCompleted  = task.status === "done"
        const isInProgress = task.status === "in_progress"
        const isError      = task.status === "error"
        const isPending    = task.status === "pending"

        const icon  = isCompleted ? "✔" : isError ? "✗" : isPending ? "▫" : "▪"
        const color = isCompleted ? "#4eba65" : isError ? "#ff4d4d" : isPending ? "#a1a1aa" : "#d77757"

        const desc = task.subject.length > 20 ? task.subject.slice(0, 20) + "..." : task.subject

        return (
          <Box key={task.id} flexDirection="column" marginBottom={1}>
            <Box flexDirection="row" width="100%">
              <Text color={color}>{icon} </Text>
              <Text bold={isInProgress} strikethrough={isCompleted} color={isCompleted ? "#a1a1aa" : "white"}>
                {desc}
              </Text>
              {task.owner && (
                <Text color="#a1a1aa">
                  {" (@"}<Text color={color}>{task.owner}</Text>{")"}
                </Text>
              )}
            </Box>
            
            {/* Blocker'lar (beklenen görevler) */}
            {task.blockedBy && task.blockedBy.length > 0 && (
               <Box paddingLeft={2}>
                 <Text color="#52525b">blocked by: {task.blockedBy.join(", ")}</Text>
               </Box>
            )}

            {/* Durum metni */}
            {isInProgress && (
              <Box paddingLeft={2}>
                <Text color="#a1a1aa">Working...</Text>
              </Box>
            )}
            
            {/* Hata metni */}
            {isError && task.error && (
               <Box paddingLeft={2}>
                 <Text color="#ff4d4d">{task.error.slice(0, 25)}</Text>
               </Box>
            )}
          </Box>
        )
      })}
    </Box>
  )
}
