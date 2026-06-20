import { z } from "zod"
import { taskManager } from "../../task/manager.js"
import type { ToolDef, ToolContext, ExecuteResult } from "../types.js"

export const taskCreateTool: ToolDef = {
  id: "task_create",
  description: "Create a new orchestrator task in the DAG. You can specify which tasks this new task is blocked by.",
  parameters: z.object({
    id: z.string().describe("Unique identifier for the task (e.g., 'setup_db')"),
    subject: z.string().describe("A short, clear description of the task"),
    blockedBy: z.array(z.string()).optional().describe("List of task IDs that must be completed before this task can start"),
  }),
  async execute(args, ctx: ToolContext): Promise<ExecuteResult> {
    const id = String(args["id"])
    const subject = String(args["subject"])
    const blockedBy = (args["blockedBy"] as string[] | undefined) ?? []

    try {
      const task = taskManager.createTask(id, subject, blockedBy)
      return { output: `Task [${task.id}] created successfully. Blocked by: ${blockedBy.length > 0 ? blockedBy.join(", ") : "none"}` }
    } catch (err) {
      return { output: "", error: String(err) }
    }
  }
}

export const taskUpdateTool: ToolDef = {
  id: "task_update",
  description: "Update the status or owner of an existing task.",
  parameters: z.object({
    id: z.string().describe("Task ID to update"),
    status: z.enum(["pending", "in_progress", "completed", "error"]).optional().describe("New status of the task. Use 'completed' to mark done (equivalent to task_complete)."),
    owner: z.string().optional().describe("Assign an agent role or ID to this task"),
    blockedBy: z.array(z.string()).optional().describe("Update the blocked by list"),
    errorMsg: z.string().optional().describe("Set error message if status is 'error'"),
  }),
  async execute(args, ctx: ToolContext): Promise<ExecuteResult> {
    const id = String(args["id"])
    
    try {
      if (args["status"] === "completed") {
        taskManager.completeTask(id, "")
        return { output: `Task [${id}] completed.` }
      }

      if (args["status"] === "error" && args["errorMsg"]) {
        taskManager.failTask(id, String(args["errorMsg"]))
        return { output: `Task [${id}] failed with error: ${args["errorMsg"]}` }
      }

      const updates: any = {}
      if (args["status"]) updates.status = args["status"]
      if (args["owner"]) updates.owner = args["owner"]
      if (args["blockedBy"]) updates.blockedBy = args["blockedBy"]

      const task = taskManager.updateTask(id, updates)
      return { output: `Task [${task.id}] updated successfully.` }
    } catch (err) {
      return { output: "", error: String(err) }
    }
  }
}

export const taskCompleteTool: ToolDef = {
  id: "task_complete",
  description: "Mark a task as done and pass its result context to any dependent blocked tasks.",
  parameters: z.object({
    id: z.string().describe("Task ID to complete"),
    result: z.string().describe("The outcome, data, or context to pass to the tasks waiting for this one"),
  }),
  async execute(args, ctx: ToolContext): Promise<ExecuteResult> {
    const id = String(args["id"])
    const result = String(args["result"])

    try {
      taskManager.completeTask(id, result)
      return { output: `Task [${id}] completed. Result context injected into dependent tasks.` }
    } catch (err) {
      return { output: "", error: String(err) }
    }
  }
}
