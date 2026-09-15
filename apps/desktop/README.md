# Hoprel by Aurict

Hoprel is Aurict's Electron desktop workspace. The renderer is
isolated from Node and talks to a Bun sidecar through a narrow JSON-lines IPC
bridge.

## Develop

From the repository root:

```sh
bun run --cwd apps/desktop start
```

Electron Forge packaging is pinned to Node.js 20 in CI. Use Node.js 20 for
local `package` and `make` commands as well.

Use the workspace path in the titlebar to select the project Aurict should
read and edit. The selection is persisted in Electron's user-data directory;
the active workspace is also the sidecar's current working directory.

## Package

```sh
bun run --cwd apps/desktop package
```

The package command first compiles `apps/desktop/src/sidecar-entry.ts` into a
native Bun sidecar and copies the design catalog into `apps/desktop/resources/`.
Electron Forge places both beside the packaged application. Generated resource
files are ignored by Git.

The desktop entry starts the JSON-lines server directly. It must not import the
terminal UI entry because the terminal input layer owns and patches stdin.

The repository uses Bun's isolated workspace installs. Its root `bunfig.toml`
publicly hoists `@tanstack/virtual-core` so Vite can bundle the renderer's
virtualized session list; keep that setting when updating dependencies.

Until `electron-installer-redhat` releases its RPM 4.20+ fix, Bun applies the
tracked upstream patch in `patches/electron-installer-redhat@3.4.0.patch`.

## Desktop beta release

Pushing a `desktop-beta-v*` tag creates a self-signed Windows x64 installer,
an unsigned Debian amd64 `.deb` package, and Developer ID-signed and notarized
macOS ZIPs for Intel and Apple Silicon. Each artifact includes a SHA-256
checksum in a GitHub prerelease. Windows may still show a SmartScreen warning
because its beta certificate is ephemeral. The macOS workflow fails closed if
signing or notarization is unavailable and validates the exact archived app
with `codesign`, `stapler`, and Gatekeeper before upload.

The macOS release job requires these GitHub Actions secrets:

- `MACOS_CERTIFICATE_BASE64`: a base64-encoded `.p12` containing one
  **Developer ID Application** certificate and its private key.
- `MACOS_CERTIFICATE_PASSWORD`: the `.p12` export password.
- `APPLE_ID`: the Apple Developer account used for notarization.
- `APPLE_APP_SPECIFIC_PASSWORD`: an app-specific password for that Apple ID.
- `APPLE_TEAM_ID`: the Developer Program team ID that owns the certificate.

The certificate is imported into a temporary keychain on the macOS runner and
deleted after the job. Secrets and signing files must never be committed. The
ephemeral Windows beta certificate is likewise generated only inside CI and
must not be added to a user's trusted root store.

`electron-winstaller` is a direct root development dependency because the
Windows release workflow needs its host-architecture 7-Zip selector. The
workflow runs that upstream selector explicitly before invoking the Squirrel
maker and verifies the generated `vendor/7z.exe` file.

## Local data

Desktop-owned settings live in Electron's user-data directory. The sidecar
receives a separate writable `core/` state directory there for sessions,
provider configuration, and design preferences; packaged design catalogs are
read from a separate read-only asset directory. On first launch with the new
state directory, the sidecar copies the legacy core DB/config/preferences from
`~/.aurict` without deleting the original files.

## Design Studio

Design Studio creates local-first artifacts. An artifact has a brief, selected
design system and workflow, workspace association, output HTML, and immutable
HTML revisions. The sidecar writes the current output and revision files under
the app's Electron user-data directory, not into the workspace. Use **promote**
from an artifact to hand its visual intent to Aurict's normal approved coding
flow.

Preview HTML runs in a sandboxed iframe with a restrictive CSP. It cannot use
the Electron bridge, local filesystem, arbitrary network connections, forms,
or nested frames; Google Fonts is the sole allowed external resource.

## Finance Desk

Finance is a separate, persistent conversation surface, not a hand-off to the
workspace chat. Each local Finance Desk conversation keeps its messages, tool
trail, latest audit, status, and timestamps. The left rail creates, resumes,
and removes local finance conversations; workspace sessions remain separate.
Finance Desk follows the desktop application's English interface language.

The built-in `finance` agent reserves `market_data` and `calculator` on every
Finance Desk turn. It determines and explains the formula itself, then uses
`calculator` for every non-trivial numeric step; there is no financial-formula
tool. `market_data` supplies BIST/TLREF data when appropriate. This is
analytical output, not personalized financial advice.

Every response must finish with a structured audit record. Its HTTP(S) source
URLs, publication/access dates, data-as-of date, assumptions, and
uncertainties are retained locally and displayed in the Integrity panel.
Missing, malformed, or source-less audits are explicitly marked **needs
review** rather than treated as complete. Failed and cancelled turns remain
visible instead of staying in a pending state.

Finance responses render Markdown headings, lists, formulas, and tables as
readable desktop elements. Their trailing `finance-audit` record is presented
as an expandable methodology, assumptions, and uncertainty panel rather than
raw JSON.

The former manual Calculate tab is intentionally not presented. Historical
deterministic-calculation records remain readable through the compatibility
store, while legacy research records are imported into Finance Desk on first
open without deleting the old local data file.

## Browser sign-in fallback

Remote account sign-in keeps the device approval link and code visible in
Settings while approval is pending. If the system cannot open a browser, both
values remain selectable and have copy controls so approval can continue in
another browser or device.

Failed Design Studio artifacts retain their brief, selected system, error, and
immutable revisions. Open a failed artifact and use **retry generation** to
resume it without creating a duplicate artifact. The developer session rail
also shows persisted session status, provider/model, token totals, cost, last
update, and parent-session relationship when available.

## Verification

```sh
bun run --cwd apps/desktop lint
bun run typecheck
bun test apps/desktop/test
bun run --cwd apps/desktop package
bun test packages/core/test/design-artifacts.test.ts
```

## Desktop quality gate

Before a desktop release, verify the first-run, appearance, recovery, and
workspace flows in both light and dark modes. A release is blocked if a
sidecar request can remain pending without a visible timeout/retry path, a
stored profile cannot be recovered safely, or a keyboard-only user cannot
complete onboarding and change appearance settings.

The renderer uses application-owned confirmation, text-entry, and notification
surfaces for workspace mutations; browser `alert`, `confirm`, and `prompt`
must not be introduced. Dialogs must support Escape, a visible focus state,
and explicit labels. Verify file creation, rename, deletion, unsaved-tab
discard, session deletion, approval denial, and Design preview dismissal with
the keyboard before release. At the 960px minimum window width, also verify
that titlebar navigation remains usable, workspace details collapse without
overlap, Finance preserves its main work area, and the Artifact preview stays
readable.

For conversation quality, simulate a failed task and confirm the assistant
turn stops showing as active, the error exposes **retry last task**, and a
completed response can be copied. On Home, Workspace, Product Hub, and
Operations Desk, confirm the composer remains at the bottom, a response
follows the latest turn while the reader is at the bottom, and manually
scrolling upward stops that follow until **latest ↓** is chosen. For Design Studio, exercise workflow
matching, reference-image selection, refresh, a failed artifact retry, and
Escape dismissal of its sandboxed preview. For Finance Desk, create a
conversation, submit a sourced research question, ask a follow-up, verify the
tool trail and Integrity panel, reopen the local conversation, interrupt one
request, and confirm deletion. Confirm that none of these actions changes the
active workspace session.

**Auto-allow safe commands** is enabled by default for a new installation.
Confirm that low-risk Aurict data requests proceed without a modal while
writes, destructive commands, and warning-level requests still require an
explicit approval.

For the role and recovery pass, complete onboarding for every user type and
confirm that each type’s recommended layout, live theme, color mode, and font
preview update before saving. In Settings, change appearance, switch the
active workspace, exercise a provider/policy failure and retry path, then
return to the affected surface. Provider, model, policy, workspace, and
artifact-preview failures must remain visible to the user rather than only
being written to the developer console.

For a manual release pass, create each of the six user profiles and verify its
primary navigation surface: Home, Workspace, Product Hub, Design Studio,
Operations Desk, and Finance Desk. Repeat the pass in light and dark mode,
then interrupt the sidecar once and confirm that the visible retry path
recovers without leaving a request pending.
