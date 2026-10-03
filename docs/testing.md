# Testing and quality gates

Aurict runs Core, CLI, and Desktop tests as separate processes with isolated state directories.
The runner never changes `HOME`; it supplies Aurict's supported state-path environment variables
and removes the temporary state after each suite. Set `AURICT_KEEP_TEST_STATE=1` to preserve a
failed suite's state for diagnosis.

## Local commands

| Command | Scope |
|---|---|
| `bun run test` | Core, CLI, and Desktop suites |
| `bun run test:core` | Core suite |
| `bun run test:cli` | CLI and terminal suite, including both `.test.ts` and `.test.tsx` |
| `bun run test:desktop` | Desktop suite |
| `bun run test:integration` | Opt-in real WebRTC test; requires the documented environment variables |
| `bun run test:pty` | Real-PTY terminal matrix: drives the TUI in a pseudo-terminal against a scripted provider and checks the emulated screen and scrollback (`--only <name>`, `--keep`, `--binary <path>`) |
| `bun run test:coverage` | Core and CLI coverage thresholds |
| `bun run test:stability` | Fixed-seed randomized order, with every test file run twice |
| `bun run check:quality` | Test-script, error-handler, and pinned-runtime contracts |
| `bun run quality` | Quality contracts, typecheck, version consistency, and all local tests |

`test:pty` runs entirely in temporary directories, including `HOME`. MCP servers are pre-disabled and
the local server is off, so it needs no network and installs nothing. Scenarios cover inline mode at
60×18, 80×24, and 140×40, resize reprints, the status line and Esc interrupt, the transcript pager,
rewind with file restore, fullscreen mode, `NO_COLOR`, `AURICT_ASCII`, and `TERM=dumb`.

Coverage excludes test files. The initial repository-wide floor is 45% lines and 30% functions;
critical review modules remain substantially above that floor. Raise thresholds only with tests,
never by excluding production paths.

CI uses Bun 1.3.12, uploads JUnit and LCOV artifacts, and requires coverage before binary build and
smoke jobs. A scheduled stability workflow reruns Core, CLI, and Desktop with deterministic random
ordering. Real WebRTC remains a controlled manual integration workflow rather than a silent skip in
the explicit integration command.
