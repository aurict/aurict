---
name: cryptography-patterns
description: "Cryptography: Encryption at rest, TLS, hashing, digital signatures, key management." 
triggers:
  extensions: [".py", ".ts", ".go"]
  directories: ["crypto/", "security/", "encryption/"]
  keywords: ["encryption", "crypto", "aes", "rsa", "tls", "ssl", "hash", "signature", "key", "hmac", "kms"]
auto_load_when: "Implementing encryption or cryptographic operations"
agent: security-expert
tools: ["Read", "Write", "Bash"]
---

# Cryptography Architecture Patterns

**Focus:** Encryption, hashing, key management, signatures

## 1. Encryption at Rest

```
Encryption at Rest:
├── Database
│   ├── Transparent encryption (AWS KMS, GCP KMS)
│   └── TDE (Transparent Data Encryption)
│   └── TLS to DB not enough (data still unencrypted on disk)
│
├── Object Storage (S3, GCS)
│   ├── Server-side encryption (default)
│   └── Customer-managed keys (CMK)
│   └── Client-side encryption (before upload)
│
├── File/Block Storage
│   ├── EBS, S3, Azure Disk Encryption
│   └── Encryption at host level
│
└── Application-level
    └── Encrypt specific fields (PII, secrets)
    └── Use envelope encryption
```

---

## 2. Encryption in Transit

```
TLS Implementation:
├── HTTPS everywhere
│   ├── SSL/TLS for all public endpoints
│   └── HTTP → redirect to HTTPS
│
├── Internal mTLS
│   ├── Service-to-service TLS
│   ├── Mutual authentication
│   └── SPIFFE/mTLS mesh
│
├── Certificate Management
│   ├── Short-lived certs (hours)
│   ├── Auto-rotation (Cert Manager)
│   └── ACM, Let's Encrypt
│
└── Protocol versions
    └── TLS 1.2 minimum, TLS 1.3 preferred
    └── Disable TLS 1.0, 1.1
```

---

## 3. Key Management

```
Key Management Patterns:
├── KMS (Key Management Service)
│   ├── AWS KMS, GCP Cloud KMS, Azure Key Vault
│   └── Keys never leave service
│   └── Key rotation supported
│
├── Envelope Encryption
│   ├── DEK (Data Encryption Key) encrypts data
│   ├── KEK (Key Encryption Key) encrypts DEK
│   └── Store encrypted DEK with data
│
├── Key Rotation
│   ├── Automatic (annual/monthly)
│   └── Manual for legacy systems
│   └── Re-encrypt with new key
│
└── HSM (Hardware Security Module)
    └── Highest security
    └── For root keys, signing keys
```

---

## 4. Hashing & Signatures

```
Cryptographic Hashing:
├── Password Storage
│   ├── bcrypt (cost factor 12+)
│   └── Argon2id (memory-hard)
│   └── Never plain text, never reversible
│
├── Data Integrity
│   ├── SHA-256 for checksums
│   └── HMAC for authenticated hashing
│   └── Store hash, compare
│
└── Digital Signatures
    ├── RSA (2048+ bits)
    ├── ECDSA (P-256, P-384)
    └── For API auth, JWT signing
```

---

## 5. Application Patterns

```
Application Cryptography:
├── Field-level encryption
│   └── Encrypt PII (SSN, email) in DB
│   └── Use envelope encryption
│   └── Key per field or per record
│
├── Tokenization
│   └── Replace sensitive with token
│   └── Token maps to real value (separate system)
│   └── Used for PCI compliance
│
├── Secrets management
│   └── HashiCorp Vault, AWS Secrets Manager
│   └── Inject at runtime, never in code
│   └── Audit log every access
│
└── Random values
    └── Use CSPRNG (cryptographically secure)
    └── crypto.getRandomValues() in JS
    └── secrets.token_hex() in Python
```

---

## Key Patterns

1. **Encryption at rest** - All sensitive data encrypted on disk
2. **TLS in transit** - All communication encrypted
3. **Never roll your own** - Use established libraries
4. **Key management** - Use KMS, rotate regularly
5. **Default deny** - Don't allow without encryption

---

## Anti-Patterns

```
❌ Storing encryption keys in code — keys leaked
✅ Use KMS (AWS KMS, Cloud KMS), never in code

❌ Using deprecated algorithms (MD5, SHA1) — broken
✅ SHA-256+, bcrypt, Argon2

❌ Not encrypting backups — data at risk
✅ Encrypt backups with separate key

❌ TLS 1.0/1.1 — vulnerable to attacks
✅ Enforce TLS 1.2+, prefer 1.3

❌ Using ECB mode — patterns visible in ciphertext
✅ Use GCM, CBC with HMAC
```

---

## Quick Reference

| Task | Algorithm | Key Size |
|---|---|---|
| Password | bcrypt, Argon2id | Cost 12+ |
| Hash | SHA-256 | 256 bits |
| HMAC | HMAC-SHA256 | 256 bits |
| Symmetric | AES-256-GCM | 256 bits |
| RSA signing | RSA-PSS | 2048+ bits |
| ECDSA | P-256, P-384 | 256, 384 bits |

---

## Decision Tree

```
What to protect?
├── User password                      → hash with Argon2id (Bun) or bcrypt cost≥12 (Node)
├── Data integrity check               → HMAC-SHA256 (signed hash, verify sender)
├── Sensitive field in DB (PII)        → AES-256-GCM (envelope encryption via KMS)
├── JWT / API token signing            → RS256 (asymmetric) or HS256 (symmetric, server-only)
└── File/blob at rest                  → S3 SSE-KMS or envelope encryption with KMS DEK

Key management?
├── Any cloud environment              → use cloud KMS (AWS KMS / GCP KMS / Azure Key Vault)
├── Self-hosted                        → HashiCorp Vault
└── Simple secret env var              → at least put in secret manager — never in code

HMAC or signature?
├── Verify a message came from you (same secret)       → HMAC-SHA256
├── Verify message origin (anyone can verify)          → digital signature (RSA-PSS or ECDSA)
└── Webhook payload integrity (e.g. Stripe)            → HMAC-SHA256 timing-safe compare
```

---

## Key Rules

1. Never store or transmit plaintext passwords — hash with Argon2id or bcrypt (cost ≥ 12)
2. Never implement your own crypto algorithm — use vetted libraries (jose, Web Crypto API, noble-*)
3. Use authenticated encryption: AES-256-GCM, not AES-CBC (GCM detects tampering)
4. HMAC comparisons must be timing-safe: `crypto.timingSafeEqual()` — never string equality
5. Keys never in code or `.env` checked into git — always in KMS or secrets manager
6. TLS 1.2 minimum everywhere; disable TLS 1.0/1.1; prefer TLS 1.3
7. Rotate secrets and keys on a schedule; support rotation without downtime

---

## Implementation

```typescript
// Password hashing — Bun built-in (Argon2id)
import { password } from 'bun'
const hash  = await password.hash('userPassword')       // Argon2id by default
const valid = await password.verify('userPassword', hash)

// Or Node.js: bcrypt
import bcrypt from 'bcryptjs'
const hash  = await bcrypt.hash('userPassword', 12)
const valid = await bcrypt.compare('userPassword', hash)

// AES-256-GCM encryption / decryption (Web Crypto API)
async function encrypt(plaintext: string, key: CryptoKey): Promise<{ iv: string; ciphertext: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encoded = new TextEncoder().encode(plaintext)
  const cipherBuffer = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded)
  return {
    iv:         Buffer.from(iv).toString('base64'),
    ciphertext: Buffer.from(cipherBuffer).toString('base64'),
  }
}

async function decrypt(data: { iv: string; ciphertext: string }, key: CryptoKey): Promise<string> {
  const iv    = Buffer.from(data.iv, 'base64')
  const ct    = Buffer.from(data.ciphertext, 'base64')
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct)
  return new TextDecoder().decode(plain)
}

// HMAC-SHA256 webhook signature (timing-safe)
import { createHmac, timingSafeEqual } from 'crypto'

function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const expected = createHmac('sha256', secret).update(payload).digest('hex')
  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  } catch {
    return false  // different length — still safe
  }
}
```
