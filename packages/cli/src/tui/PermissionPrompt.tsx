import React from "react"
import { useInput } from "./design-system/renderer.js"
import type { PermissionDecision, PermissionRequest, PermissionResponse } from "@aurict/core"
import { BashPermissionRequest } from "./BashPermissionRequest.js"
import { FallbackPermissionRequest } from "./FallbackPermissionRequest.js"
import { GranularPatchRequest } from "./GranularPatchRequest.js"

type Decision = PermissionDecision | "deny_abort" | "edit"
export type PermissionPromptDecision = Decision | PermissionResponse

interface Props {
  request:  PermissionRequest
  onDecide: (d: PermissionPromptDecision) => void
}

// ── Route ─────────────────────────────────────────────────────────────────────

export function PermissionPrompt({ request, onDecide }: Props) {
  useInput((char, key) => {
    if (key.ctrl || key.meta) return
    const shortcut = char.toLowerCase()
    if (shortcut === "y") onDecide("allow_once")
    else if (shortcut === "n") onDecide("deny")
    else if (shortcut === "e" && (request.tool === "bash" || request.tool === "shell")) onDecide("edit")
  })

  const isGranularPatch = request.tool === "apply_patch"
    && request.patch?.granular === true
    && (request.files ?? []).length > 0

  if (isGranularPatch) {
    return <GranularPatchRequest request={request} onDecide={onDecide} />
  }

  if (request.tool === "bash" || request.tool === "shell") {
    return <BashPermissionRequest request={request} onDecide={onDecide} />
  }

  return <FallbackPermissionRequest request={request} onDecide={onDecide} />
}
