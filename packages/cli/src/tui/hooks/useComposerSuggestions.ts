import type { CommandDef } from "../../commands/types.js";
import { getCommandMatches } from "../CommandSuggest.js";
import { listFileMentionMatches, useFileIndexVersion } from "../FileMention.js";
import type { FocusLayer } from "../app/app-types.js";

export function useComposerSuggestions(
  input: string,
  focusLayer: FocusLayer,
  workdir: string,
  commandDefs: CommandDef[],
) {
  useFileIndexVersion(workdir);
  const slashBody = input.startsWith("/") ? input.slice(1) : null;
  const cmdFilter = focusLayer === "ready" && slashBody !== null && !/\s/.test(slashBody)
    ? slashBody
    : null;
  const mentionFilter = focusLayer === "ready" && cmdFilter === null
    ? (input.match(/@([\w./~-]*)$/)?.[1] ?? null)
    : null;
  const commandSuggestionOpen = cmdFilter !== null &&
    getCommandMatches(cmdFilter, commandDefs).length > 0;
  const mentionSuggestionOpen = mentionFilter !== null &&
    listFileMentionMatches(workdir, mentionFilter).length > 0;
  return {
    cmdFilter,
    mentionFilter,
    inlineSuggestionActive: commandSuggestionOpen || mentionSuggestionOpen,
  };
}
