---
name: solidity-patterns
description: "Solidity: Gas optimization, security patterns, upgradeable contracts, EVM internals." 
triggers:
  extensions: [".sol"]
  directories: ["contracts/", "smart-contracts/", "blockchain/"]
  keywords: ["solidity", "etherium", "evm", "smart contract", "gas", "contract", "ERC", "token"]
auto_load_when: "Writing Solidity smart contracts or EVM development"
agent: blockchain-developer
tools: ["Read", "Write", "Bash"]
---

# Solidity Architecture Patterns

**Focus:** Gas optimization, security, upgradeability, EVM

## 1. Contract Structure

```
Best Practice Contract Layout:
├── License + Version
│   └── // SPDX-License-Identifier: MIT
│   └── pragma solidity ^0.8.24;
│
├── Imports (from contracts, not abstract)
│   └── Import interfaces you USE, not implement
│
├── Interfaces (if needed)
│   └── External implementations you call
│
├── Errors (custom errors save gas)
│   └── error InsufficientBalance(uint256 available, uint256 required);
│
├── Constants (immutable for gas)
│   └── uint256 constant MAX_SUPPLY = 1e8 ether;
│
├── State Variables
│   └── Order: base → inherited → public → private
│
├── Events (for indexing)
│   └── event Transfer(address indexed from, address indexed to, uint256 value);
│
├── Modifiers (checks before function)
│   └── modifier onlyOwner() { require(msg.sender == owner); _; }
│
└── Functions
    ├── external → public → internal → private
    ├── View/Pure → Public → External
    └── ReentrancyGuard on state-changing
```

---

## 2. Gas Optimization Patterns

```
Gas Saving Techniques:
├── Storage (most expensive)
│   ├── Use calldata over memory for external functions
│   └── Use bytes32 over string/bytes for known size
│   └── Batch SSTORE with assembly (yul)
│
├── Loops
│   ├── Uncheck arithmetic in loops (Solidity 0.8+)
│   └── Avoid unbounded loops
│   └── Use mapping instead of array when possible
│
├── Functions
│   ├── external vs public (external can read calldata)
│   └── external call optimization
│   └── Custom errors (40 gas per require vs 60+ for string)
│
├── Events
│   ├── Use indexed for frequently filtered fields (max 3)
│   └── Avoid logging dynamic types in indexed
│
└── Packing
    └── Pack variables in struct (order by size)
    └── Multiple uint256 in one slot
```

---

## 3. Security Patterns

```
Security Checklist:
├── Reentrancy
│   ├── Use ReentrancyGuard modifier
│   ├── Checks-Effects-Interactions pattern
│   └── Pull over Push (withdraw pattern)
│
├── Access Control
│   ├── Role-based (OpenZeppelin AccessControl)
│   └── Ownable for simple cases
│   └── Zero address checks
│
├── Overflow/Underflow
│   ├── Use Solidity 0.8+ (built-in check)
│   └── Or SafeMath for older versions
│
├── Front-Running
│   ├── Commit-reveal schemes
│   └── Volume-based slippage
│
└── Oracle Manipulation
    ├── Chainlink for price feeds
    └── TWAP for time-weighted prices
    └── Multiple oracle sources
```

---

## 4. Upgradeable Contracts

```
Upgradeability Patterns:
├── Proxy Pattern (recommended)
│   ├── Storage contract (diamond)
│   ├── Implementation contract
│   └── Proxy contract (delegatecall)
│
├── Diamond Standard (EIP-2535)
│   ├── Multiple facets
│   └── Upgradability + Diamond storage
│
├── Transparent Proxy
│   ├── Admin separated from user calls
│   └── No confusion about msg.sender
│
└── UUPS (Universal Upgradeable Proxy)
    └── Upgrade logic in implementation
    └── Simpler than transparent
```

---

## 5. ERC Standards

```
Common ERC Patterns:
├── ERC-20 (Fungible Token)
│   └── transfer, transferFrom, approve, allowance
│
├── ERC-721 (NFT)
│   └── safeTransferFrom, tokenURI, ownerOf
│
├── ERC-1155 (Multi-Token)
│   └── batchTransfer, balanceOfBatch
│
├── ERC-4626 (Vault)
│   └── deposit, withdraw, totalAssets
│
└── ERC-6551 (NFT-bound Accounts)
    └── Token-bound accounts for NFTs
```

---

## Key Patterns

1. **Checks-Effects-Interactions** - Prevent reentrancy
2. **Pull over Push** - Withdraw pattern for payments
3. **Custom Errors** - Save gas over require strings
4. **Upgradeable Proxies** - For production, upgrade later
5. **Use Libraries** - OpenZeppelin, not re-invent

---

## Anti-Patterns

```
❌ tx.origin for authorization — vulnerable to phishing
✅ Use msg.sender (or OpenZeppelin’s ECDSA)

❌ address(this).balance without checks — can fail on empty
✅ Use Ownable + require for zero-balance calls

❌ Loop over unbounded array — can exceed gas limit
✅ Use mapping or index off-chain

❌ Hardcoded gas in calls — may not work across upgrades
✅ Use .call() without specifying gas

❌ No contract verification — users can’t audit
✅ Publish source on Etherscan, verify
```

---

## Quick Reference

| Pattern | Implementation | Gas |
|---|---|---|
| Custom error | error Name(...) | Low |
| Unchecked | unchecked { i++ } | Low |
| Calldata | func(bytes calldata) | Low |
| External | function f() external | Low |
| Mapping | mapping(addr => uint) | Low |
| Array | uint[] array | High |
| String | string name | High |
| Memory | bytes memory | Medium |
