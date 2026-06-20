---
name: network-security
description: "Network Security: VPC, firewall, zero-trust, segmentation, DDoS protection, WAF." 
triggers:
  extensions: [".tf", ".yaml", ".json"]
  directories: ["network/", "infrastructure/", "security/"]
  keywords: ["vpc", "firewall", "network", "security group", "acl", "waf", "ddos", "zero trust", "segmentation", "isolation"]
auto_load_when: "Designing network architecture or security controls"
agent: security-expert
tools: ["Read", "Write", "Bash"]
---

# Network Security Patterns

**Focus:** Segmentation, zero-trust, perimeter

## 1. Network Segmentation

```
Segmentation Strategy:
├── By Environment
│   ├── Production VPC
│   ├── Staging VPC
│   └── Development VPC
│   └── Isolated, no cross-environment access
│
├── By Tier
│   ├── Public subnet (ALB, NAT Gateway)
│   ├── Private subnet (app servers)
│   └── Database subnet (no internet)
│
├── By Service/Team
│   ├── Team A VPC / account
│   ├── Team B VPC / account
│   └── Cross-team via VPC peering or Transit Gateway
│
└── By Sensitivity
    ├── PII/financial data in isolated network
    └── Additional encryption in transit
```

---

## 2. Zero Trust Architecture

```
Zero Trust Principles:
├── Never trust, always verify
│   ├── Authenticate every request
│   ├── Not based on network location
│   └── Verify identity, not IP
│
├── Least privilege access
│   ├── Role-based access control
│   ├── Just-in-time access
│   └── Time-limited permissions
│
├── Assume breach
│   ├── Lateral movement limited
│   ├── Micro-segmentation
│   └── Monitor for anomalies
│
└── Verify explicitly
    ├── Strong authentication (MFA)
    └── Device compliance
    └── Session context
```

---

## 3. Firewall Configuration

```
Firewall Rules:
├── Security Groups (stateful)
│   ├── Inbound rules: Only allow what needed
│   ├── Outbound: Allow all or specific
│   └── Attach to instances, not subnets
│
├── Network ACLs (stateless)
│   ├── Subnet-level filtering
│   └── Ephemeral ports for established
│
└── WAF (Web Application Firewall)
    ├── OWASP Top 10 protection
    ├── Rate limiting
    └── Geo blocking
    └── SQL injection, XSS blocking
```

**Example security group:**
```
# Allow HTTPS only from ALB
Inbound: 443 from alb-sg (or specific IPs)
# Allow app to connect to DB
Outbound: 5432 to db-sg
# Default deny all inbound
```

---

## 4. DDoS Protection

```
DDoS Mitigation:
├── CDN + WAF (for HTTP/HTTPS)
│   ├── CloudFlare, CloudFront + WAF
│   └── Absorb layer 3-7 attacks
│
├── Edge protection
│   ├── Rate limiting at edge
│   └── Geo-blocking
│
├── Managed DDoS (AWS Shield, Cloud Armor)
│   ├── Always-on protection
│   └── L3-4 protection
│
└── Application-layer
    └── Request validation
    └── CAPTCHA for bots
```

---

## 5. Monitoring & Detection

```
Network Monitoring:
├── Flow Logs
│   ├── VPC Flow Logs → S3/CloudWatch
│   └── Analyze traffic patterns
│   └── Detect anomalies
│
├── IDS/IPS
│   ├── Network-based intrusion detection
│   └── AWS GuardDuty, Suricata
│
└── Traffic Analysis
    ├── Unusual destinations
    ├── Large data transfers
    └── After-hours activity
```

---

## Key Patterns

1. **Default deny** - Block all, allow explicitly
2. **Defense in depth** - Multiple layers
3. **Micro-segmentation** - Isolate workloads
4. **Encrypt in transit** - TLS everywhere
5. **Log everything** - For forensics

---

## Anti-Patterns

```
❌ 0.0.0.0/0 anywhere — wide open to internet
✅ Allow specific IPs/CIDRs only

❌ No segmentation — flat network
✅ Separate VPCs for environments, services

❌ No WAF on public APIs — OWASP attacks
✅ WAF with OWASP rules

❌ Not logging network traffic — no visibility
✅ VPC Flow Logs, all security groups

❌ Allowing SSH/RDP from anywhere — huge attack surface
✅ VPN + bastion only, or no direct access
```

---

## Quick Reference

| Layer | Protection | AWS | GCP |
|---|---|---|---|
| Edge | DDoS | Shield | Cloud Armor |
| Network | Firewall | SG, NACL | Firewall Rules |
| App | WAF | WAF | Cloud Armor |
| DNS | Protection | Route 53 | Cloud DNS |
| Log | Monitoring | VPC Flow | Flow Logs |
