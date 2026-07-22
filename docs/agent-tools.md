# Agent intelligence tools

Aurict's advanced tools are capability-routed. Only tools relevant to the current objective
are sent to the model, and the dynamic prompt describes only tools visible in that turn.

## Code intelligence

- `lsp`: TypeScript/JavaScript definitions, references, hover information, document symbols,
  call hierarchy, diagnostics, and previewed atomic rename.
- `dep_docs`: exact installed package version, declarations, local documentation, and examples.
- `semantic_search`: local hybrid BM25 search over identifiers, paths, and conservative code
  synonyms. The in-memory index invalidates when file mtimes or sizes change.
- `ast_edit`: structural TypeScript/JavaScript edits for call callees, property access, and
  import sources. Apply requires an unexpired preview from the same session and unchanged files.

## Visual and runtime verification

- `read_image`: sends a workspace PNG/JPEG/WebP/GIF to a vision-capable model without putting
  base64 in the transcript.
- `browser`: bounded Chromium session with navigation, accessibility snapshots, click/fill/key
  actions, screenshots, and deterministic assertions. Sessions expire after two minutes.
- `eval`: stateless Bun/Node/Python experiments with scrubbed environment, bounded output, and
  timeout. Temporary cwd is the default; workspace cwd is explicit.

## History and recall

- `git_context`: context summary plus pickaxe, regex history, line blame, historical file read,
  and ref comparison actions. All Git history actions are read-only.
- `memory`: project-scoped session search and excerpts. Sessions without an explicit workdir are
  excluded, and old results are marked stale.
- `critique`: can route to an explicit reviewer provider/model. Reviewer identity and fallback
  are visible; configured cost ceilings fail closed when pricing is unknown.

## Safety invariants

- Workspace paths are resolved and checked before reads or mutations.
- Structural and semantic multi-file mutations use preview/revision checks and transactions.
- Tool results preserve a short text representation for the terminal while allowing multipart
  model content for images.
- Optional tool instructions are generated from the actual selected tool set.
