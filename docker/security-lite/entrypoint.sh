#!/usr/bin/env sh
set -eu

case "${1:-tool-list}" in
  tool-list)
    cat /opt/aurict/security-lite/tools.json
    ;;
  version-report)
    printf 'aurict-security-lite\n'
    for tool in curl wget jq openssl dig whois ping traceroute nc nmap python3 pip3 git nikto sqlmap testssl.sh nuclei ffuf gobuster; do
      if command -v "$tool" >/dev/null 2>&1; then
        printf '%s: ' "$tool"
        case "$tool" in
          dig) dig -v 2>&1 | head -n 1 ;;
          nc) nc -h 2>&1 | head -n 1 ;;
          ping) ping -V 2>&1 | head -n 1 ;;
          *) "$tool" --version 2>&1 | head -n 1 || true ;;
        esac
      fi
    done
    ;;
  *)
    exec "$@"
    ;;
esac
