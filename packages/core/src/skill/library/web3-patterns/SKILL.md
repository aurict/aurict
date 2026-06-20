---
name: web3-patterns
description: "Wallet connections, smart contract integration, IPFS storage, and blockchain patterns for Web3 applications." 
triggers:
  keywords: ["web3", "blockchain", "ethereum", "smart contract", "wallet", "NFT", "ethers", "wagmi", "viem"]
auto_load_when: "Building Web3 or blockchain integrations"
agent: architect
tools: ["Read", "Write", "Bash"]
---

# Web3 Patterns

## 1. Wallet Connection

```
Wallet selection:
├── MetaMask: Most popular, browser extension
├── WalletConnect: Mobile-friendly, QR code
├── Coinbase Wallet: Mainstream users
├── Rainbow: Mobile-native
└── Injected: Multiple injected providers

Connection flow:
1. Detect provider (window.ethereum)
2. Request accounts (eth_requestAccounts)
3. Check chain (eth_chainId)
4. Switch chains if needed
5. Store connection state
6. Listen for changes (accountsChanged, chainChanged)
```

## 2. When to Use What

```
Use EVM chains when:
├── Ethereum ecosystem tools
├── DeFi/AMM integration
├── Largest user base
└── Most documentation

Use Solana when:
├── High throughput needed
├── Lower transaction costs
├── Mobile-first users
└── Different tech stack

Use multi-chain when:
├── Cross-chain dApps
├── Different user bases
└── Bridge requirements
```

## 3. Smart Contract Integration

```
Contract interaction:
├── Read: view/pure functions (free)
├── Write: state-changing (gas needed)
├── Events: Historical data, logs
└── Multicall: Batch read calls

Library choice:
├── ethers.js: Lightweight, popular
├── viem: Modern, type-safe, lightweight
├── web3.js: Legacy, feature-rich
└── wagmi: React hooks, composable
```

## 4. Contract Patterns

```
Gas optimization:
├── Batch calls: Multicall pattern
├── Storage packing: Pack struct fields
├── Events: Index events for filtering
└── Lazy evaluation: Only compute on-chain

Security:
├── Never trust user input
├── Reentrancy guards when needed
├── Access control (Ownable, Roles)
└── Upgradeable pattern for logic
```

## 5. IPFS Patterns

```
When to use IPFS:
├── Immutable content (verified)
├── Large files (decentralized storage)
├── NFT metadata
└── Decentralized data sharing

Alternatives:
├── Arweave: Permanent storage
├── Filecoin: Incentivized storage
├── Pinata/Infura: Pinning service
└── Web3.storage: Simple API

Pattern:
├── Upload: IPFS -> get CID -> store CID
├── Retrieve: Use CID -> gateway or local node
└── Content addressing: Always verify hash
```

## 6. Token Patterns

```
Token standards:
├── ERC-20: Fungible tokens
├── ERC-721: NFTs (single)
├── ERC-1155: Multi-token (games,批量)
└── ERC-4626: Tokenized vaults

Token integration:
├── Read balance: token.balanceOf(address)
├── Transfer: token.transfer(to, amount)
├── Approve: token.approve(spender, amount)
└── Allowance: token.allowance(owner, spender)
```

## 7. Data Patterns

```
Reading blockchain data:
├── Direct RPC: Fast, but no history
├── The Graph: Indexed data (subgraphs)
├── Alchemy/Infura: APIs, history
└── Events: Past logs for history

Storage patterns:
├── On-chain: Immutable, expensive
├── IPFS: Content-addressed, mutable
├── Off-chain: Centralized, fast
└── Hybrid: IPFS CID on-chain
```

## 8. User Experience

```
UX patterns:
├── Auto-connect: Remember last wallet
├── Chain switching: Prompt to switch
├── Gas estimation: Show before confirm
├── Pending states: Transaction pending
└── Error handling: Clear error messages

Transaction patterns:
├── Nonce management: Track pending
├── Speed up: Replace with higher gas
└── Cancel: Replace with 0 value
```

## Key Patterns

1. **Detect wallet first** - Always check for provider
2. **Handle chain changes** - Listen and react to network switches
3. **Estimate gas** - Show cost before signing
4. **Optimize reads** - Cache, batch, use events
5. **Error gracefully** - Clear messages, recovery paths
6. **Test on testnet** - Always test on Sepolia/Goerli first

---

## Anti-Patterns

```
❌ Trusting client-side wallet data without on-chain verification
✅ Always verify signatures and ownership on-chain / server-side

❌ Sending transactions without estimating gas
✅ estimateGas() before every transaction; add 20% buffer

❌ Storing private keys in code or .env
✅ Hardware wallet / KMS for production; never commit keys

❌ No re-entrancy guard on contract functions
✅ nonReentrant modifier (OpenZeppelin) on all state-changing functions

❌ Contract with no upgrade path
✅ Proxy pattern or design for immutability intentionally
```

---

## Quick Reference

| Task | Library | Note |
|---|---|---|
| Wallet connect | wagmi + ConnectKit | React hooks |
| Read contract | ethers.js / viem | Static call |
| Write contract | wagmi writeContract | Gas estimate first |
| Sign message | signMessage (SIWE) | Auth pattern |
| IPFS storage | Pinata / web3.storage | Off-chain metadata |
| Contract testing | Hardhat / Foundry | Fork mainnet for integration |
