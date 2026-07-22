import type { TranscriptMessage } from "./types.js";
import { parseToolArtifact } from "./tool-artifact.js";

export type TranscriptDetailKind = "tool" | "reasoning" | "diff" | "write";

export interface TranscriptDetail {
  id: string;
  kind: TranscriptDetailKind;
  title: string;
  content: string;
  toolName?: string;
  rawDiff?: string;
  filePath?: string;
  totalLines?: number;
  additions?: number;
  deletions?: number;
}

interface ToolDetailInput {
  id: string;
  tool: string;
  args: string;
  resultContent?: string;
  artifact?: import("@aurict/core").ToolResultArtifact;
}

export function createToolDetail({ id, tool, args, resultContent, artifact: normalized }: ToolDetailInput): TranscriptDetail {
  const artifact = parseToolArtifact(tool, args, resultContent, normalized);
  const content = resultContent ?? args;
  if (artifact.kind === "diff" && artifact.rawDiff) {
    const multiFile = (artifact.files?.length ?? 0) > 1;
    return {
      id,
      kind: "diff",
      title: multiFile ? `changed ${artifact.files!.length} files` : `changed ${artifact.filePath ?? "file"}`,
      content,
      toolName: tool,
      rawDiff: artifact.rawDiff,
      ...(!multiFile && artifact.filePath ? { filePath: artifact.filePath } : {}),
      additions: artifact.additions ?? 0,
      deletions: artifact.deletions ?? 0,
    };
  }

  if (artifact.kind === "write" && resultContent) {
    return {
      id,
      kind: "write",
      title: `created ${artifact.filePath ?? "file"}`,
      content: resultContent,
      toolName: tool,
      ...(artifact.filePath ? { filePath: artifact.filePath } : {}),
      totalLines: artifact.totalLines ?? 0,
    };
  }

  return {
    id,
    kind: "tool",
    title: tool,
    content,
    toolName: tool,
    ...(artifact.filePath ? { filePath: artifact.filePath } : {}),
  };
}

function addReasoningDetail(
  details: TranscriptDetail[],
  id: string,
  content: string,
): void {
  if (!content.trim()) return;
  details.push({ id, kind: "reasoning", title: "thinking", content });
}

export function collectTranscriptDetails(messages: TranscriptMessage[]): TranscriptDetail[] {
  const details: TranscriptDetail[] = [];
  for (const [messageIndex, message] of messages.entries()) {
    const messageId = message.id ?? `message-${messageIndex}`;
    if (message.reasoningContent)
      addReasoningDetail(details, `${messageId}:thinking`, message.reasoningContent);

    if (message.blocks?.length) {
      for (const [blockIndex, block] of message.blocks.entries()) {
        if (block.type === "text") {
          if (block.reasoningContent)
            addReasoningDetail(
              details,
              `${messageId}:text:${blockIndex}:thinking`,
              block.reasoningContent,
            );
          continue;
        }
        details.push(
          createToolDetail({
            id: `${messageId}:tool:${blockIndex}`,
            tool: block.tool,
            args: block.args,
            ...(block.resultContent !== undefined ? { resultContent: block.resultContent } : {}),
            ...(block.artifact !== undefined ? { artifact: block.artifact } : {}),
          }),
        );
      }
      continue;
    }

    if (message.role === "tool_call") {
      details.push(
        createToolDetail({
          id: `${messageId}:tool`,
          tool: message.tool ?? "tool",
          args: message.content,
          ...(message.resultContent !== undefined ? { resultContent: message.resultContent } : {}),
          ...(message.artifact !== undefined ? { artifact: message.artifact } : {}),
        }),
      );
    }
  }
  return details;
}

export function writePreview(content: string): string | undefined {
  return parseToolArtifact("write", "{}", content).preview;
}
