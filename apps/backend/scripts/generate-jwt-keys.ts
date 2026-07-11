// Generates an Ed25519 keypair for access-token signing.
// Usage: bun run scripts/generate-jwt-keys.ts
// Paste the printed lines into the backend .env; distribute only JWT_PUBLIC_KEY to modules
// (or let them fetch it from /.well-known/jwks.json).
import { generateKeyPairSync } from "node:crypto"

const { privateKey, publicKey } = generateKeyPairSync("ed25519")

const privateDer = privateKey.export({ type: "pkcs8", format: "der" })
const publicDer = publicKey.export({ type: "spki", format: "der" })

console.log(`JWT_PRIVATE_KEY=${Buffer.from(privateDer).toString("base64")}`)
console.log(`JWT_PUBLIC_KEY=${Buffer.from(publicDer).toString("base64")}`)
