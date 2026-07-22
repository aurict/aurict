# Terminal design baseline (Phases 0–7)

Date: 2026-07-17

This document is the acceptance contract for Aurict's terminal UI. It records the baseline scenarios, the information hierarchy introduced in Phases 1–2, and the checks that prevent the interface from drifting back toward a dashboard-heavy layout.

## Product principles

- The transcript is the primary surface. Chrome must not compete with the work.
- One responsive cockpit answers: “what is Aurict doing, with which model, how full is context, and is completion proven?”
- The cockpit owns identity and location. One compact footer reports only current runtime state and exceptional conditions.
- The composer remains writable while Aurict works. Enter adds a priority steering message; Tab adds a normal queued message.
- Tool calls are summaries first, except successful `write`, `edit`, and `apply_patch` changes: their complete unified diffs render inline. Raw non-change output and reasoning stay available through `Ctrl+O`, which also provides a full-screen diff view.
- Color communicates semantics: identity tones distinguish people and Aurict, the activity tone marks current work, green is reserved for meaningful success, red for errors, warning for risk/attention, and neutral tones for routine tool history and metadata.
- Text labels, glyphs, and order carry meaning independently of color. Every status remains understandable under `NO_COLOR`, ANSI-only terminals, and color-vision deficiency.

## Reference terminal sizes

| Size | Density | Contract |
| --- | --- | --- |
| 60×18 | tiny | Two-line startup, one-line chrome, no optional metadata |
| 80×24 | compact | Centered welcome wordmark before the first turn; compact model/context header afterward |
| 100×30 | normal | A second cockpit tier may show session identity, workspace, mode, and proof state |
| 140×40 | wide | The same two-tier cockpit may add branch and task/agent telemetry |

The automated contract renders every scenario below at all four sizes and verifies bounded, uniquely keyed rows.

## Baseline scenarios

1. Normal conversation: user prompt, structured assistant Markdown, lists, inline emphasis.
2. Long streaming response: commentary owns the live area while text arrives; a compact activity line appears only between text/reasoning/tool bursts.
3. Shell output: command summary, bounded head/tail preview, hidden-line count, `Ctrl+O` affordance.
4. Multi-file diff: one summary per file with additions/deletions and direct diff inspection.
5. Permission/error: an actionable system notice followed by a visually distinct error.

Fixtures live in `packages/cli/test/fixtures/terminal-scenarios.ts`; the cross-size checks live in `packages/cli/test/terminal-layout-contract.test.ts`.

## Phase 1 architecture

Provider and runtime events normalize into `TranscriptMessage` and `TranscriptBlock`. `projectTranscript` is the only presentation projector and emits styled `TranscriptSegment` rows. `ConversationViewport` and the compatibility `Message` surface both use `TranscriptRows`; the former standalone streaming renderer and tool loader were removed. Tool strings are parsed once at the UI boundary into `ToolArtifact`, which is shared by transcript summaries and detail overlays. The root view has stable `TerminalAppShell`, `TranscriptPane`, `ComposerPane`, and `OverlayStack` boundaries. `AppView` composes that shell, while `AppScreen`, `AppHeader`, `AppOverlayContents`, and `AppBottomBar` own view composition and leaf JSX. `App.tsx` is a thin orchestrator: lifecycle, keyboard, commands, agent submit/stream/completion, remote control, focus, transcript details, suggestions, and viewport behavior live behind dedicated hooks or controller modules.

## Phase 2 interaction model

- Startup preflight text is printed only for non-interactive output. The full-screen TUI shows a centered AURICT wordmark on terminals at least 76×24 and a compact two/three-line identity on smaller terminals. The wordmark disappears after the first turn; MCP success chatter stays suppressed and failures remain visible.
- Header and footer use the same 60/90/120-column breakpoints. Tiny/compact terminals collapse the cockpit to one content row; normal/wide terminals use two.
- During a run, the composer switches to `STEER` mode without becoming disabled.
- Enter stores a priority steering item. With the installed AI SDK, safe mid-provider injection is unavailable, so it executes at the next turn boundary before normal queued items; the UI does not pretend the current tool call was interrupted.
- Tab stores a normal FIFO queue item. The queue preview shows its kind and remaining count.
- Streaming projection is capped at roughly 5–12 redraws per second, reducing flicker and CPU use on fast providers.

## Application shell phases 3–4

- Presentation components consume Ink through `design-system/renderer.ts`. Direct Ink imports are restricted to the design-system implementation and explicit low-level renderer, measurement, input, transcript, and diff paths. The architecture test scans `src/tui` and fails when a presentation component bypasses this boundary.
- Composer-level overlays use a discriminated `PrimaryOverlay` state, so search, command palette, settings, design wizard, shortcut help, history search, and attachment input are mutually exclusive by construction. System requests and detail views retain their independent data lifecycles, while the focus selector chooses the single mounted modal.
- `OverlayStack` is a root-level, absolute Yoga layer rendered after the application surface. It no longer consumes a `FullscreenLayout` flex slot, so opening a modal does not resize the transcript or composer. Permission requests are not modals: they render inline immediately above the composer, resize the transcript naturally, and preserve the conversation around the decision.
- Overlay bounds adapt at 60-column and 18-row thresholds. Narrow terminals use the full safe area; larger terminals retain a small edge margin and vertically center the modal surface.
- The composer remains mounted below a modal but receives `disabled` input state. Command/file suggestions and passive agent input are inactive while another focus layer owns the keyboard. Passive attachment summaries remain in the bottom surface rather than entering the modal stack.
- Terminals provide opaque cell compositing rather than browser-style alpha, blur, or DOM portals. The absolute host therefore guarantees geometry and draw order; individual surfaces own their border and background treatment.
- The root shell paints the theme's deepest surface across the alternate screen. Transcript rows use a semantic timeline rail inside the same responsive horizontal inset as the cockpit and composer.

## Phase 3 live-run model

- A deterministic live-state resolver gives the live area one owner: paused state, commentary, a stable pending tool, reasoning, or generic activity. Commentary never competes with a spinner, and a pending tool is never repeated by a second “using tool” row.
- Preparation, provider wait, reasoning, response, and tool activity participate in viewport height and scroll anchoring instead of floating above the line buffer.
- `Ctrl+L` pauses visual stream updates without stopping the run. The transcript says that output is paused and restores every buffered text/reasoning fragment when resumed, including fragments produced after a tool call.
- Raw reasoning remains available for inspection but is represented during the run by a low-motion semantic status.

## Phase 4 tool and diff model

- Core classifies every tool result into a typed `ToolResultArtifact` (`diff`, `write`, `patch`, `shell`, `error`, or `output`) before it reaches CLI presentation. Persisted legacy events are the only values classified at the TUI boundary.
- Tool calls use concise action-first rows (`Read`, `Ran`, `Patched`, `Explored`) with command/path, meaningful durations, bounded shell previews, and a `Ctrl+O` detail affordance. Read/search result counts stay hidden because they duplicate the action row.
- Directly adjacent low-level calls are progressively disclosed: repeated reads, searches, and web research collapse into action-first summaries. File changes retain the shared `activity` summary but render every emitted diff hunk beneath it; prose is always a grouping boundary and `Ctrl+O` remains available for full-screen inspection.
- Unified diff parsing preserves file identity per hunk. Multi-file summaries show file count and names; the detail view labels every hunk with its owning file and keeps additions/deletions visible.

## Phase 5 recovery and permission model

- On startup, an inline Yes/No Project Auto prompt appears above the composer. Yes applies only to
  bounded typed file mutations in the active project for the current session; No preserves normal
  per-request approval. Workdir changes reopen the choice.
- Provider/runtime failures render once as a short diagnosis, original first-line detail, and concrete recovery action. Authentication, rate limit, context, connection, and cancellation failures have specific guidance.
- Permission requests use one compact inline decision surface immediately above the composer. Risk and execution scope are textual rather than decorative gauges, and dangerous actions still default to deny.
- Direct permission keys are `y` (allow once), `n` (deny), and for shell requests `e` (edit). Arrow/Enter selection and Escape denial remain available.
- The permission surface uses the same responsive horizontal inset and frame width as the composer. Routine requests expose a horizontal `Allow once` / `Always allow` / `Deny` decision strip; dangerous requests omit persistent approval. The specialized granular-patch flow retains file selection and is contract-tested on narrow terminals.

## Phase 6 production hardening

- Stable conversation rows and live stream rows are projected independently. Streaming ticks only rebuild the changing live section; historical Markdown and tool artifacts are reprojected only when messages or terminal width change.
- `projectTranscript` remains the compatibility boundary and composes the same stable/live rows, so commands and tests do not need parallel rendering paths.
- `AURICT_ASCII=1`, `TERM=dumb`, and explicitly non-UTF locales select an ASCII-safe glyph vocabulary. Transcript decorations, activity/error markers, startup chrome, status dots, branch/separator symbols, and composer affordances use that vocabulary without relying on color alone.
- Phase 6 tests lock the split-projection contract and ASCII decoration fallback, complementing the cross-size layout and real-PTY checks.

## Unicode layout contract

- Terminal geometry is measured in display cells, not JavaScript string length. Transcript wrapping, tool rows, cockpit shortening, mouse hit-testing, and vertical cursor movement share the `terminal-text` primitives backed by `string-width`.
- Composer offsets remain safe string-slice boundaries, while movement, deletion, word navigation, selection, and cursor painting advance by `Intl.Segmenter` grapheme clusters. Emoji ZWJ sequences, flags, combining marks, and CJK text must never be split into malformed output.
- Unicode regression tests cover both the pure layout model and real Ink keyboard input. Any new terminal truncation or alignment path must use the shared display-width helpers rather than `.length`, `slice`, or `padEnd` as a column calculation.

## Semantic themes and accessibility

All user-facing components consume semantic roles from `theme/semantic-theme.ts` rather than choosing literal colors. The contract covers foreground hierarchy, identity, activity, status, tools, surfaces, borders, Markdown, and diffs. Brand and accessibility palettes are checked against WCAG-style contrast thresholds in automated tests.

Built-in accessibility options are available through `/theme`:

- `system-ansi` uses the terminal's standard ANSI palette.
- `high-contrast` raises text, border, focus, and status contrast on dark terminals.
- `colorblind-dark` uses a blue/magenta/yellow/green set while retaining text and glyph distinctions.

Aurict loads custom themes from the user and project scopes in this order:

1. `$XDG_CONFIG_HOME/aurict/themes.json` (or `~/.config/aurict/themes.json`)
2. `<project>/.aurict/themes.json`

Project definitions may override an identically named user custom theme, but cannot replace a built-in palette. Unknown base themes, color roles, malformed values, and invalid IDs fail visibly during startup.

Theme and palette selections are user preferences. Every picker, slash-command, and Settings selection is synchronously persisted to the global config before the React state changes, then restored before the next TUI mount. Unknown persisted theme IDs fail visibly instead of silently reverting to the default palette.

```json
{
  "themes": {
    "studio-night": {
      "name": "Studio Night",
      "extends": "ink-sapphire",
      "colors": {
        "accent": "#73b7ff",
        "borderActive": "#73b7ff",
        "bgCard": "#0b1420"
      }
    }
  }
}
```

## Acceptance checks

- TypeScript CLI compilation succeeds.
- TUI unit/regression tests and the terminal layout contract pass.
- App architecture characterization tests lock focus precedence, mutually exclusive primary overlays, primary/detail closure, responsive overlay geometry, single active modal rendering, and the renderer import boundary.
- Phase 3–5 contracts cover live/paused status, grouped tool calls, multi-file hunk ownership, actionable errors, direct permission keys, and narrow permission rendering.
- Phase 6 contracts cover stable/live projection separation and degraded-terminal glyph behavior.
- Theme contracts cover all semantic roles, brand/accessibility contrast, custom-theme validation, ANSI/no-color capability detection, and theme-responsive component rendering.
- Every TypeScript/TSX file under `packages/cli/src/tui` is capped at 500 physical lines by the architecture characterization test. Controller and presentation growth must be split across stable modules rather than added back to `App.tsx`.
- The interactive path is exercised in a real PTY at 80×24 before release.

## Phase 7 interaction and feedback contract

- Leaving the alternate screen prints a bounded plain-text copy of the last three conversation turns into normal terminal scrollback. `/export clipboard`, `Ctrl+Y`, and `Alt+Y` provide full-transcript, last-response, and last-code-block copy paths; clipboard writes include an OSC 52 path for SSH and terminal multiplexers.
- `Ctrl+F` searches within the current conversation and jumps using projected row offsets; `Ctrl+Shift+F` retains cross-session search. Composer undo/redo stores at most 30 complete input snapshots and never splits grapheme clusters.
- Terminal focus drives attention behavior. While unfocused, completed turns and permission requests emit BEL plus OSC 9 notifications; OSC 0 titles expose ready, running, and permission state and are sanitized before output.
- Stable transcript projection is cached by message identity and terminal width. App rendering does not synchronously enumerate subagent sessions unless its session dependencies change.
- Tool presentation metadata travels from core execution to the transcript artifact. Verification status, changed files, and failures therefore render without reparsing localized stdout; regex summarization remains only for legacy persisted events and tools without structured metadata.
- Paused output reports both unseen message count and semantic kind, such as `verify failed`, `response`, or `tool result`. Cancelling an active turn records `Turn cancelled — session state preserved.` so the user can distinguish cancellation from a stalled provider.

## Final polish contract

- Short transcripts are bottom-anchored so the latest answer rests one natural gap above the composer. Scrolled history remains top-aligned, and every one-row header/composer resize updates the scroll boundary.
- The composer uses one rounded focus surface, one restrained shortcut row, and no persistent `INSERT`/dashboard labels. At normal/wide density its internal command strip exposes `PROMPT`/`STEER`, readiness, queue depth, and character count; compact terminals remove the strip. Working state changes the placeholder and exposes Enter steering plus Tab queue semantics.
- Tool-only assistant turns omit redundant assistant headers. Tool actions are semantic text first and decoration second, matching the scan rhythm of modern coding terminals.
- Markdown list bullets use the active theme's secondary accent while the list text keeps its normal reading color.
- Markdown headings and short bold-only section labels receive exactly one blank transcript row above and below. Inline bold emphasis, list-item emphasis, and complete bold sentences retain normal line flow so compact terminals do not become vertically sparse.
- Prose remains fluid on compact terminals and is capped at 110 columns with a two-column left inset on wide terminals. Code, diffs, and tool artifacts retain the available width.
- Lists receive one surrounding blank row while their items remain contiguous. Repeated tool activity follows the same outside-space/inside-density rhythm.
- Heading levels step down deliberately: levels 1–2 use primary bold hierarchy, level 3 uses secondary bold hierarchy, and deeper headings use secondary regular weight.
- Semantic muted text uses the theme's contrast-checked muted token without an additional ANSI dim modifier; metadata therefore remains readable across terminal palettes.
- When a provider starts a tool call mid-sentence, only the unfinished trailing paragraph is deferred and rejoined with post-tool prose. Completed commentary and tool chronology remain in place, avoiding split phrases such as `...var mı / tool / diye...`.
- The startup wordmark is centered and brand-led without remaining in the working transcript after the first prompt.
- Spacious startup banners select one original, developer-focused science-fiction quip per launch. The selection stays fixed for that mounted banner, uses no borrowed character dialogue, and disappears with the wordmark after the first prompt.
- The working header is a responsive cockpit rather than a second dashboard. Its first tier is the stable run/model/context bar; the optional second tier carries session title, workspace, branch, execution mode, and durable proof state. Its fixed-width signal animates at low frequency only while Aurict is active; idle, `AURICT_NO_MOTION`, `NO_COLOR`, and `TERM=dumb` modes remain still.
- Wide terminals may add branch, completed/total tasks, active-agent count, and running-background-task count to the cockpit. Compact terminals remove this optional telemetry before it can compete with provider/model and context state.
- The working cockpit uses the same responsive horizontal inset, rounded frame width, card background, and border language as the composer. Its outer frame is three rows at tiny/compact density and four rows at normal/wide density, making session continuity distinct from transcript content without becoming a dashboard.
- The transcript timeline rail changes color only for identity, active work, and errors; routine body/tool rows remain on the subtle border token. This preserves scan rhythm without turning every line into a card.
- Transcript rhythm is semantic: prose-to-tool and tool-to-prose transitions receive exactly one truly blank row, while adjacent tool calls remain a tight activity cluster. Consecutive tool failures stay compact as one error run, with one blank row separating that run from successful activity or prose on either side. Code fences receive the same single-row breathing space, and gap rows intentionally interrupt the timeline rail to expose block boundaries.
- Successful permission approvals are transient interaction state and never create transcript rows. Denials, aborts, and edit handoffs remain visible because they change or interrupt execution.
- Permission prompts use a compact action strip: risk, sandbox, executable, and command preview are summary-first; only the selected action exposes its hint. Long commands and patches retain a scrollable `d` detail view.
- Horizontal permission action strips use `←/→`; vertical granular-patch actions use `↑/↓`, leaving `←/→` exclusively for patch-file navigation in that specialized view.
- A single tool call uses a stable marker, responsive semantic-action column, guaranteed two-cell subject separator, primary target, and right-aligned muted metadata. At 51 columns and below, subject data moves to an indented continuation row instead of colliding with or over-truncating the action. A completed standalone call and its short outcome are separated by exactly one blank row; the outcome keeps a right-aligned `details ^O` hint. Two or more adjacent successful calls render as one dense `activity` tree: one aggregate row per semantic family (`read`, `search`, `change`, `verify`, `git`, `web`, `environment`, or `run`) and one right-aligned total-duration footer. Multi-line stdout never spills into the transcript; the sole exception is a typed `change` artifact, whose complete diff renders inline with file headers, hunk headers, line numbers, semantic add/remove surfaces, and lossless wrapping. `Ctrl+O` remains available on every artifact.
- Shell commands are named by intent instead of transport, so `cat` appears as `read`, test/build/lint commands as `verify`, and Git commands as `git`. Colon, flattened, and provider-safe MCP identifiers (`mcp:git:git_status`, `mcp_git_git_status`, `mcp__git__git_status`) normalize to one `git / status` identity; repeated family prefixes never enter the action column. Unknown tools retain one humanized label and an aligned singular/plural call count. Shell file readers still require explicit approval because they bypass the dedicated read tool boundary, but they are warning-level review requests rather than destructive red alerts.
- Routine environment detection never enters the conversation. Public-repository detection silently enables undercover behavior; pending crash diagnostics appear only as a transient composer-adjacent snackbar with `/crashes` as the recovery path.
- User turns use a quiet raised transcript surface, while assistant prose stays borderless. Activity trees have no card around every event and follow the compact `┌ activity` / `│ family` / `└ completed` visual grammar.
- Tool status owns the strongest color: failed calls keep a red marker/action while the explanatory outcome returns to normal reading contrast; verified outcomes may use success color. Structured metadata is preferred over stdout parsing, and environment/search/Git summaries expose useful counts without leaking raw output.
- Inline Markdown has one projection contract across stable transcripts and full Markdown views: emphasis, strike-through, code, and links never leak raw delimiter syntax. Safe `http`, `https`, `file`, and `mailto` targets use OSC 8 links; control characters and unsafe schemes are never emitted.
- The cockpit is the sole owner of provider, model, context, session identity, workspace, and branch. The footer is the sole owner of runtime exceptions, background activity, remote/autopilot state, sandbox scope, and transient selection guidance.
