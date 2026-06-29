# Aurict Security Lite Image

Optional active-security tooling image for Aurict. This image is not used unless
the user enables `securitySandbox` and allowlists a target.

## Included Tools

The image includes HTTP/TLS/DNS diagnostics, controlled scanners, and web
enumeration tools:

- `curl`, `wget`, `jq`, `openssl`, `dnsutils`, `whois`
- `iputils-ping`, `traceroute`, `netcat-openbsd`
- `nmap`, `nikto`, `testssl.sh`
- `sqlmap`, `nuclei`, `ffuf`, `gobuster`
- `python3`, `python3-pip`, `git`, `ca-certificates`

Intentionally excluded:

- `metasploit`, `aircrack-ng`, `bettercap`, `responder`
- `hydra`, `medusa`, `john`, `hashcat`

## Install

Public releases are published to GHCR:

```bash
docker pull ghcr.io/aurict/aurict-security-lite:latest
```

For local development builds:

```bash
docker build -t aurict-security-lite:local docker/security-lite
aurict /config security image aurict-security-lite:local
```

## Runtime Contract

Aurict should run this image only through the security sandbox runner:

- require `securitySandbox.enabled=true`
- require `profile=active-lite` or `profile=kali-full`
- require `targetAllowlist`
- require explicit approval for active recon/scan operations
- apply container isolation flags such as `--cap-drop=ALL`,
  `--security-opt=no-new-privileges`, resource limits, and scoped output mounts
