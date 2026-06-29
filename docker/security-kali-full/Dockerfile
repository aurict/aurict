FROM kalilinux/kali-rolling

LABEL org.opencontainers.image.title="Aurict Kali Full"
LABEL org.opencontainers.image.description="Optional larger Kali-based security tooling image for Aurict kali-full profile"
LABEL org.opencontainers.image.source="https://github.com/aurict/aurict"

ENV DEBIAN_FRONTEND=noninteractive

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
    nuclei \
    ffuf \
    gobuster \
    whatweb \
    wafw00f \
    sslscan \
    amass \
  && rm -rf /var/lib/apt/lists/*

RUN groupadd --system aurict \
  && useradd --system --create-home --gid aurict --shell /usr/sbin/nologin aurict \
  && mkdir -p /workspace /outputs \
  && chown -R aurict:aurict /workspace /outputs

COPY tools.json /opt/aurict/security-kali-full/tools.json
COPY entrypoint.sh /usr/local/bin/aurict-security-entrypoint
RUN chmod 0755 /usr/local/bin/aurict-security-entrypoint

WORKDIR /workspace
USER aurict

ENTRYPOINT ["/usr/local/bin/aurict-security-entrypoint"]
CMD ["tool-list"]
