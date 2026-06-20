---
name: defi-patterns
description: "DeFi Patterns: AMM, lending, staking, tokenomics, yield farming, DAOs." 
triggers:
  extensions: [".sol"]
  directories: ["defi/", "protocols/", "token/"]
  keywords: ["defi", "amm", "uniswap", "lending", "aave", "compound", "yield", "staking", "dao", "governance", "swap"]
auto_load_when: "Building DeFi protocols or integrating DeFi"
agent: blockchain-developer
tools: ["Read", "Write", "Bash"]
---

# DeFi Architecture Patterns

**Focus:** AMMs, lending, staking, governance, tokenomics

## 1. AMM (Automated Market Maker)

```
AMM Patterns:
├── Constant Product (x * y = k)
│   ├── Uniswap V2 style
│   └── Arbitrage keeps price aligned
│
├── Stable Swap (Curve)
│   ├── Stable asset swaps (USDC/USDT)
│   └── Concentrated liquidity (Uniswap V3)
│
├── Hybrid (Balancer)
│   ├── Multiple tokens, weighted
│   └── Smart order routing
│
└── Reading price from AMM
    ├── getAmountOut(tokenIn, amountIn)
    └── Price impact = slippage
```

**Key formulas:**
```
Output amount = (amountIn * reservesOut * 997) / (reservesIn * 1000 + amountIn * 997)
k = tokenA * tokenB (constant)
```

---

## 2. Lending Protocols

```
Lending Patterns (Aave/Compound):
├── Lending Pool
│   ├── Deposit collateral (approve → deposit)
│   ├── Borrow against collateral (overcollateralized)
│   └── Interest earned by suppliers
│
├── Liquidation
│   ├── When health factor < 1
│   ├── Liquidators pay debt + get collateral
│   └── Bot arbitrage on liquidations
│
├── Interest Rates
│   ├── Supply APY = utilization * borrow APY
│   └── Variable (flexible) vs stable (fixed)
│
└── Flash Loans
    ├── Borrow without collateral (same block)
    └── Must return + fee by end of tx
    └── No state change if not repaid
```

---

## 3. Staking & Rewards

```
Staking Patterns:
├── Direct Staking
│   ├── Lock tokens for rewards
│   └── Linear/unlocking vesting
│
├── Liquid Staking (LSD)
│   ├── Stake → get receipt token (stETH, rETH)
│   └── Receipt token = fungible, tradeable
│   └── Underlying stake accrues value
│
├── Governance Staking
│   ├── Stake → voting power
│   └── Delegate to others
│   └── Quadratic voting
│
├── Reward Distribution
│   ├── Merkle tree (airdrop claims)
│   └── Linear vesting contracts
│   └── Batch distribution
```

---

## 4. Tokenomics

```
Token Design Patterns:
├── Utility Tokens
│   ├── Fee discount (like BNB)
│   ├── Governance voting
│   └── Staking rewards
│
├── Governance Tokens
│   ├── Voting power = token balance
│   └── Timelock on proposals
│   └── Quorum requirements
│
├── Revenue Share
│   ├── Protocol revenue → token buyback
│   └── Or distribution to stakers
│
└── Vesting
    ├── Team/investor unlock schedule
    ├── Linear or cliff
    └── TGE (token generation event) % first
```

---

## 5. DAO Governance

```
DAO Patterns:
├── Governance Structure
│   ├── Token holder voting
│   ├── Executive (execute passed proposals)
│   └── Timelock (delay before execution)
│
├── Proposal Lifecycle
│   ├── Submit → Discussion → Vote → Queue → Execute
│   └── Minimum quorum required
│
├── Voting Mechanisms
│   ├── Direct (one token = one vote)
│   ├── Quadratic (sqrt reduces whale power)
│   └── Conviction voting (time-based)
│
└── Execution
    └── Gnosis Safe + Zodiac modules
    └── Teller (automatic execution)
```

---

## Key Patterns

1. **Permissionless** - Anyone can interact, no KYC
2. **Non-custodial** - Users keep custody of assets
3. **Transparent** - All on-chain, verifiable
4. **Composability** - Protocols build on each other
5. **Incentive-aligned** - Economic incentives for participation

---

## Anti-Patterns

```
❌ No slippage protection — MEV extracts value
✅ Set max slippage, use TWAP for large trades

❌ No access control on critical functions
✅ OnlyOwner or role-based, timelock

❌ Reentrancy in lending — can drain pool
✅ Follow CEI pattern, ReentrancyGuard

❌ No oracle for price — easy to manipulate
✅ Use Chainlink, TWAP, multiple sources

❌ No upgrade path — contract immutable forever
✅ Proxy pattern for upgradability, or plan for immutability
```

---

## Quick Reference

| Pattern | Protocol | Key Feature |
|---|---|---|
| AMM | Uniswap V2/V3 | Constant product |
| Stable Swap | Curve | Low slippage |
| Lending | Aave/Compound | Overcollateralized |
| Flash Loan | Aave | No collateral |
| Staking | Lido, Rocket Pool | Liquid staking |
| Governance | Compound, Uniswap | Token voting |
| Oracle | Chainlink | Decentralized |
| Aggregator | 1inch | Best price |
