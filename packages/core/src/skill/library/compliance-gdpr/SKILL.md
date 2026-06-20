---
name: compliance-gdpr
description: "Compliance: GDPR, SOC2, HIPAA, data privacy, retention policies, audit trails." 
triggers:
  extensions: [".md", ".yaml", ".json"]
  directories: ["compliance/", "security/", "audit/"]
  keywords: ["gdpr", "compliance", "soc2", "hipaa", "privacy", "data protection", "audit", "sox", "pci-dss", "retention"]
auto_load_when: "Implementing compliance controls or designing for regulatory requirements"
agent: security-expert
tools: ["Read", "Write", "Bash"]
---

# Compliance Architecture Patterns

**Focus:** GDPR, SOC2, HIPAA, audit, data privacy

## 1. GDPR Requirements

```
GDPR Core Principles:
├── Lawful basis for processing
│   ├── Consent (opt-in)
│   ├── Contract performance
│   └── Legitimate interest
│   └── Each has different requirements
│
├── Data minimization
│   ├── Only collect what's needed
│   └── Don't over-collect
│   └── Document why each field
│
├── Purpose limitation
│   ├── Use data only for stated purpose
│   └── Don't repurpose without consent
│   └── Anonymize for analytics
│
├── Storage limitation
│   ├── Delete when no longer needed
│   └── Define retention periods
│   └── Right to erasure
│
└── Integrity & confidentiality
    └── Security measures (encryption, access)
    └── Pseudonymization where possible
```

---

## 2. Data Subject Rights

```
Rights Implementation:
├── Right to access (Article 15)
│   └── User can request their data
│   └── Export in machine-readable format
│   └── Free within 30 days
│
├── Right to rectification (Article 16)
│   └── User can correct their data
│   └── Easy update mechanism
│
├── Right to erasure (Article 17)
│   └── "Right to be forgotten"
│   └── Delete all copies, backups
│   └── Exception: legal hold
│
├── Right to portability (Article 20)
│   └── Export in JSON/CSV format
│   └── Transfer to another provider
│
└── Consent management
    └── Granular consent options
    └── Easy withdrawal
    └── Audit trail of consent
```

---

## 3. SOC 2 Controls

```
SOC 2 Trust Service Criteria:
├── Security
│   ├── Access controls
│   ├── Encryption
│   └── Logging & monitoring
│
├── Availability
│   ├── Uptime SLA
│   └── DR plan
│   └── Incident response
│
├── Processing Integrity
│   ├── Data accuracy
│   └── Processing controls
│   └── Error handling
│
├── Confidentiality
│   ├── Data classification
│   └── Encryption at rest
│   └── Access restrictions
│
└── Privacy
    ├── PII protection
    └── Notice & choice
    └── Data retention
```

---

## 4. Data Retention & Disposal

```
Retention Patterns:
├── Define retention periods
│   ├── Transaction data: 7 years (financial)
│   ├── Logs: 90 days (operational)
│   ├── Backups: 30 days
│   └── PII: until consent withdrawn + 30 days
│
├── Automated deletion
│   ├── Scheduled jobs
│   ├── TTL in storage
│   └── Soft delete + hard delete
│
├── Legal hold
│   ├── Preserve data for litigation
│   └── Override retention
│   └── Document hold reason
│
└── Disposal verification
    └── Certificate of destruction
    └── Cryptographic erasure
    └── Physical destruction for hardware
```

---

## 5. Audit & Documentation

```
Audit Trail Requirements:
├── What to log
│   ├── Who accessed what data
│   └── What changes made
│   └── When, from where
│
├── Log retention
│   ├── 1+ year for compliance
│   └── Tamper-proof storage
│   └── Immutable
│
├── Documentation
│   ├── Data processing agreement (DPA)
│   ├── Privacy policy
│   └── Security policies
│
└── Evidence collection
    ├── Screenshots, configs
    └── SOC 2 audit reports
    └── Penetration test results
```

---

## Key Patterns

1. **Privacy by design** - Build, don't bolt on
2. **Data inventory** - Know what you have
3. **Consent management** - Track opt-ins
4. **Retention automation** - Don't rely on manual
5. **Audit everything** - For compliance evidence

---

## Anti-Patterns

```
❌ No data inventory — don't know what PII you have
✅ Map all data, classify by sensitivity

❌ Storing everything forever — unnecessary liability
✅ Define retention, auto-delete

❌ No consent tracking — can't prove compliance
✅ Store consent with timestamp, version

❌ Manual deletion process — fails, forgotten
✅ Automate with TTL, scheduled jobs

❌ One consent for everything — not GDPR-compliant
✅ Granular consent per purpose
```

---

## Quick Reference

| Framework | Focus | Key Controls |
|---|---|---|
| GDPR | EU privacy | Consent, erasure, portability |
| SOC 2 | Trust services | Security, availability, privacy |
| HIPAA | US health | PHI protection, access controls |
| PCI DSS | Payment cards | Card data protection |
| ISO 27001 | Info security | ISMS framework |
