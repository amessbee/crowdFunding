---
title: CrowdFunding DApp on Ethereum
layout: default
---

# CrowdFunding DApp on Ethereum

A fully decentralized crowdfunding platform built on Ethereum smart contracts with a React frontend.

## What it does

Community members can:

- **Submit project proposals** for others to review and vote on
- **Vote** on proposals — only sufficiently supported projects move forward
- **Execute approved projects** — triggered autonomously once a vote threshold is met
- **Contribute ETH** — donated funds are held and distributed by the contract, never a central authority
- **Modify contract settings** — governance parameters can be adjusted on-chain

Everything runs on Solidity smart contracts managed by [Hardhat](https://hardhat.org), with a React UI in `ui/`.

## Tech stack

| Layer | Technology |
|-------|------------|
| Smart contracts | Solidity |
| Development / testing | Hardhat |
| Frontend | React |
| Networks supported | Localhost, any Ethereum testnet |

## Quick start

```bash
# Install dependencies
npm install

# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Start a local Ethereum node
npx hardhat node

# Deploy to localhost
npx hardhat run scripts/deploy.js --network localhost

# Start the React UI (from the ui/ directory)
cd ui && npm install && npm start
```

## Repository layout

```
crowdFunding/
├── contracts/          # Solidity smart contracts
├── scripts/            # Deployment scripts
├── test/               # Contract test suite
├── ui/                 # React frontend
└── hardhat.config.js   # Hardhat configuration
```

---

[View on GitHub](https://github.com/amessbee/crowdFunding)
