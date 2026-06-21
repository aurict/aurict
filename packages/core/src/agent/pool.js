// Shim to re-export the TypeScript implementation so imports that reference
// "pool.js" resolve correctly in test/runtime environments that load .js paths.
// This ensures tests that import "../src/agent/pool.js" find the actual implementation
// in pool.ts and receive the expected named export `agentPool`.

import { agentPool } from "./pool.ts"
export { agentPool }
export default agentPool
