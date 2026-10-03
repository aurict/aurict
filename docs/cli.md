# CLI Reference

Aurict keeps the existing Bun, TypeScript, and Ink stack. The root CLI parses
commands before loading the interactive terminal, so help, version, completion,
diagnostics, recipes, and piped runs can execute without mounting the TUI.

## Commands

| Command | Purpose |
|---|---|
| `aurict` | Start the Ink TUI when stdin is a terminal; otherwise process one piped instruction |
| `aurict doctor` | Run local installation diagnostics; use `--json` or `--format json` for machine output |
| `aurict run <recipe>` | Run a YAML or JSON recipe without TUI bootstrap |
| `aurict run-agent [instruction]` | Run the versioned automation/benchmark contract |
| `aurict version` | Print the package version and build provenance; `--json` includes commit, build date, runtime, platform, and architecture |
| `aurict completion <shell>` | Generate completion for `bash`, `zsh`, `fish`, or `powershell` |

Use `aurict --help` or `aurict <command> --help` for generated usage. Command,
option, choice, positional-count, and conflict validation is strict. Unknown
commands and options exit `1`, and close misspellings include a suggestion.

## Shared headless options

Pipe mode and `aurict run` accept:

| Option | Behavior |
|---|---|
| `--format text\|json` | Select human-readable streams or one machine-readable JSON document |
| `--audience human\|agent` | Include human progress or retain only the agent-facing result |
| `-q, --quiet` | Suppress non-essential diagnostics while preserving the final result |

Interactive provider, model, system-prompt, streaming, and undercover flags keep
their existing behavior. `--stream` and `--no-stream` are mutually exclusive.

## Interactive terminal options

| Option | Behavior |
|---|---|
| `--inline` | Default. Finished transcript rows go to the terminal's native scrollback; only the live area (stream tail, status line, composer, footer) is redrawn |
| `--fullscreen` | The alternate-screen cockpit with an in-app scrollable viewport |
| `-r, --resume <session>` | Continue a saved session by id (the id is printed when Aurict exits) |
| `-c, --continue` | Continue the most recent session |

The render mode resolves in this order: flag, `AURICT_TUI_MODE=inline|fullscreen`,
`defaults.tuiMode` in the global config, then `inline`. An invalid value is a usage
error. `AURICT_SYNC_OUTPUT=0` disables synchronized terminal updates (DEC mode 2026).

## Output and exit contracts

Stdout is reserved for the requested result. Human progress and text errors use
stderr. JSON mode writes failures to stdout as a single versioned document so a
caller can always parse the result.

| Path | JSON schema | Exit codes |
|---|---|---|
| Piped instruction | `aurict.pipe/v1` | `0` completed, `2` blocked, `1` infrastructure/input failure |
| Recipe | `aurict.recipe/v1` | `0` completed, `1` failed/infrastructure error |
| Root parsing | `aurict.cli.error/v1` | `1` usage error |
| Headless agent | Existing versioned run result | `0` completed, `2` blocked, `130` cancelled, `1` infrastructure/contract failure |

Examples:

```bash
printf 'Review this diff' | aurict --format json --audience agent
aurict run release.json --format json --quiet
aurict version --json
aurict completion zsh > ~/.zfunc/_aurict
```

## Version provenance

`packages/cli/package.json` is the CLI version source. Build scripts inject that
version, the Git commit, and an ISO build date into native binaries. CI compares
all published wrapper package versions and then checks the built binary with
`aurict version --json` to prevent source/binary drift.
