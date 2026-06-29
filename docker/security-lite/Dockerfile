FROM debian:bookworm-slim

ARG TARGETARCH
ARG NUCLEI_VERSION=3.4.10
ARG FFUF_VERSION=2.1.0
ARG NIKTO_REF=2.6.0

LABEL org.opencontainers.image.title="Aurict Security Lite"
LABEL org.opencontainers.image.description="Optional controlled security tooling image for Aurict active-lite profile"
LABEL org.opencontainers.image.source="https://github.com/aurict/aurict"

ENV DEBIAN_FRONTEND=noninteractive
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
    perl \
    libjson-perl \
    libnet-ssleay-perl \
    unzip \
    git \
    sqlmap \
    testssl.sh \
    gobuster \
  && rm -rf /var/lib/apt/lists/*

# Nikto is not available in Debian bookworm's default repositories.
# Install the upstream Perl distribution without pulling a Kali base into the lite image.
RUN git clone --depth 1 --branch "${NIKTO_REF}" https://github.com/sullo/nikto.git /opt/nikto \
  && printf '%s\n' '#!/usr/bin/env sh' 'exec perl /opt/nikto/program/nikto.pl "$@"' > /usr/local/bin/nikto \
  && chmod 0755 /usr/local/bin/nikto

# Debian packages cover most tools. Release binaries fill gaps without relying on a moving Go toolchain.
# These are scanner/enumeration tools only; brute-force/cracking/MITM frameworks are intentionally excluded.
RUN set -eux; \
  case "${TARGETARCH}" in \
    amd64) release_arch="amd64" ;; \
    arm64) release_arch="arm64" ;; \
    *) echo "unsupported TARGETARCH=${TARGETARCH}" >&2; exit 1 ;; \
  esac; \
  curl -fsSL -o /tmp/nuclei.zip "https://github.com/projectdiscovery/nuclei/releases/download/v${NUCLEI_VERSION}/nuclei_${NUCLEI_VERSION}_linux_${release_arch}.zip"; \
  unzip -q /tmp/nuclei.zip -d /tmp/nuclei; \
  install -m 0755 /tmp/nuclei/nuclei /usr/local/bin/nuclei; \
  curl -fsSL -o /tmp/ffuf.tar.gz "https://github.com/ffuf/ffuf/releases/download/v${FFUF_VERSION}/ffuf_${FFUF_VERSION}_linux_${release_arch}.tar.gz"; \
  mkdir -p /tmp/ffuf; \
  tar -xzf /tmp/ffuf.tar.gz -C /tmp/ffuf; \
  install -m 0755 /tmp/ffuf/ffuf /usr/local/bin/ffuf; \
  rm -rf /tmp/nuclei /tmp/nuclei.zip /tmp/ffuf /tmp/ffuf.tar.gz

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
