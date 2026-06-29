# Aurict Kali Full Security Image

Optional Kali-based image for `securitySandbox.profile = "kali-full"`.

This profile is intentionally separate from `active-lite`: it is larger, slower
to build, and defaults to stricter runtime limits. Aurict still runs tools only
through fixed command builders with target allowlist checks, permission prompts,
rate limits, and concurrency limits.

Public releases are published to GHCR:

```bash
docker pull ghcr.io/aurict/aurict-kali-full:latest
```

Build manually when needed:

```bash
docker build -t aurict-kali-full:local docker/security-kali-full
aurict /config security image aurict-kali-full:local
```

Excluded by design:

- metasploit
- aircrack-ng
- bettercap
- responder
- hydra
- medusa
- john
- hashcat

Those categories are not part of the default Aurict security capability model.
