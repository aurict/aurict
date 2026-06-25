# Recipes

Recipes are YAML or JSON files that define multi-step automated workflows. Run them with:

```bash
aurict run recipe.yaml
aurict run recipe.json
```

Recipes are useful for repeatable tasks: CI pipelines, release checklists, automated audits, or any multi-step operation you run regularly.

---

## Structure

```yaml
name: My Recipe
description: Optional description
provider: anthropic      # optional — overrides default provider
model: claude-sonnet-4-6 # optional — overrides default model
system: |               # optional — system prompt override for all prompt steps
  You are a strict code reviewer. Be concise.

steps:
  - name: Step 1
    prompt: Summarize the recent changes in this repository
  - name: Step 2
    bash: bun run test
  - name: Step 3
    agent: security
    prompt: Audit the auth module for vulnerabilities
```

---

## Step types

### `prompt` — AI step

Sends a message to the AI and waits for a response. Prompt steps share a conversation context — each step sees the outputs of previous prompt steps.

```yaml
steps:
  - prompt: Read the failing test output and identify the root cause
  - prompt: Fix the issue and explain what you changed
```

### `bash` — shell step

Runs a shell command directly. Output is captured and injected into the conversation history for subsequent prompt steps.

```yaml
steps:
  - bash: bun run test 2>&1
  - prompt: The test output is above. Fix any failures.
```

### `agent` — subagent step

Dispatches the step to a typed specialist worker agent (runs in its own thread with restricted tools). Requires a `prompt` field.

```yaml
steps:
  - agent: security
    prompt: Scan src/auth/ for injection vulnerabilities
    name: Security audit
  - agent: review
    prompt: Review the changes made in the previous step
```

Available agent types: `code`, `review`, `test`, `docs`, `debug`, `security`, `performance`, `analytics`, `explore`.

### `parallel` — concurrent steps

Runs a group of steps in parallel. All steps in the group must complete before the recipe advances.

```yaml
steps:
  - name: Parallel audits
    parallel:
      - agent: security
        prompt: Audit src/auth/ for security issues
      - agent: performance
        prompt: Profile the database query layer
      - bash: bun run test
```

---

## Full example

```yaml
name: Pre-release checklist
description: Run tests, audit security, and generate a release summary
provider: anthropic
model: claude-sonnet-4-6

steps:
  - name: Run tests
    bash: bun run test 2>&1

  - name: Check test results
    prompt: |
      The test output is above.
      If any tests failed, list them and explain the likely cause.
      If all tests passed, say "All tests passed."

  - name: Security and performance audit
    parallel:
      - agent: security
        prompt: Scan the codebase for common vulnerabilities. Focus on auth, input validation, and file access.
      - agent: performance
        prompt: Identify any obvious performance bottlenecks in the hot paths.

  - name: Generate release notes
    prompt: |
      Based on the test results and audit findings above,
      write a concise release summary suitable for a CHANGELOG entry.
      Format: bullet points, past tense, no technical jargon.
```

Run it:

```bash
aurict run pre-release.yaml
```

---

## Tips

- Bash steps capture both stdout and stderr — pipe stderr with `2>&1` if you want the AI to see error output.
- Prompt steps are cumulative — each prompt step sees the full conversation so far, including bash output.
- Use `name:` fields to make terminal output readable.
- Provider and model overrides in the recipe file are per-recipe; they don't affect your global config.
- Recipes run in the current directory (`process.cwd()`), the same as launching `aurict` normally.
