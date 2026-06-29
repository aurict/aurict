FROM debian:bookworm-slim

ARG TARGETARCH
ARG NUCLEI_VERSION=latest
ARG FFUF_VERSION=latest
ARG GOBUSTER_VERSION=latest

LABEL org.opencontainers.image.title="Aurict Security Lite"
LABEL org.opencontainers.image.description="Optional controlled security tooling image for Aurict active-lite profile"
LABEL org.opencontainers.image.source="https://github.com/aurict/aurict"

ENV DEBIAN_FRONTEND=noninteractive
ENV GOBIN=/usr/local/bin
ENV PATH="/usr/local/bin:${PATH}"

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    wget \
    jq \
    openssl \
    dnsutils \
    whois \
    iputils-ping \
    traceroute \
    netcat-openbsd \
    nmap \
    python3 \
    python3-pip \
    git \
    nikto \
    sqlmap \
    testssl.sh \
    gobuster \
    golang-go \
  && rm -rf /var/lib/apt/lists/*

# Debian packages cover most tools. Go installs fill gaps or provide fresher CLI binaries.
# These are scanner/enumeration tools only; brute-force/cracking/MITM frameworks are intentionally excluded.
RUN go install github.com/projectdiscovery/nuclei/v3/cmd/nuclei@${NUCLEI_VERSION} \
  && go install github.com/ffuf/ffuf/v2@${FFUF_VERSION} \
  && if ! command -v gobuster >/dev/null 2>&1; then go install github.com/OJ/gobuster/v3@${GOBUSTER_VERSION}; fi \
  && rm -rf /root/go/pkg /root/.cache/go-build

RUN groupadd --system aurict \
  && useradd --system --create-home --gid aurict --shell /usr/sbin/nologin aurict \
  && mkdir -p /workspace /outputs \
  && chown -R aurict:aurict /workspace /outputs

COPY tools.json /opt/aurict/security-lite/tools.json
COPY entrypoint.sh /usr/local/bin/aurict-security-entrypoint
RUN chmod 0755 /usr/local/bin/aurict-security-entrypoint

WORKDIR /workspace
USER aurict

ENTRYPOINT ["/usr/local/bin/aurict-security-entrypoint"]
CMD ["tool-list"]
