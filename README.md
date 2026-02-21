# 🗳 ChainVote — On-Chain Voting DApp

A fully on-chain voting application built with **Solidity + Foundry** (smart contract) and **React + ethers.js + MetaMask** (frontend).

## Features

| Feature | Details |
|---|---|
| Create proposals | Any connected wallet can post a yes/no proposal |
| Vote on-chain | One vote per address per proposal, stored immutably |
| Public results | Live yes/no counts with a visual progress bar |
| Close proposals | Proposal creator can lock it when voting is done |
| MetaMask wallet | Connect / disconnect, handles chain / account changes |
| Custom errors | Solidity custom errors for gas-efficient reverts |
| Fuzz tests | Foundry fuzz tests for vote distribution |

---

## Project Structure

```
voting-dapp/
├── contracts/               # Foundry project
│   ├── foundry.toml
│   ├── src/
│   │   └── Voting.sol       # Main contract
│   ├── script/
│   │   └── Deploy.s.sol     # Deployment script
│   └── test/
│       └── Voting.t.sol     # Full test suite (unit + fuzz)
└── frontend/                # React + Vite
    ├── .env.example
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── App.jsx
        ├── index.css
        ├── main.jsx
        ├── abi/
        │   └── Voting.json  # Contract ABI
        ├── hooks/
        │   └── useVoting.js # All web3 logic
        └── components/
            ├── ConnectWallet.jsx
            ├── CreateProposal.jsx
            ├── ProposalList.jsx
            └── ProposalCard.jsx
```

---

## Quick Start

### 1 — Install Foundry

```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

### 2 — Build & test the contract

```bash
cd contracts
forge build
forge test -vv
```

### 3 — Run a local node and deploy

Open two terminals:

```bash
# Terminal 1 — local EVM node
anvil
```

```bash
# Terminal 2 — deploy
cd contracts
export PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80  # anvil account 0
forge script script/Deploy.s.sol --rpc-url http://127.0.0.1:8545 --broadcast
# Note the printed contract address
VITE_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
```

### 4 — Configure the frontend

```bash
cd frontend
cp .env.example .env
# Edit .env and set VITE_CONTRACT_ADDRESS=<address from step 3>
```

### 5 — Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in a browser with MetaMask installed.
Add the local Anvil network to MetaMask (RPC: `http://127.0.0.1:8545`, Chain ID: `31337`).
Import an Anvil test account using its private key.

### 6 — Deploy to a public testnet (Sepolia)

```bash
cd contracts
export PRIVATE_KEY=<your-wallet-private-key>
export SEPOLIA_RPC_URL=<your-rpc-url>          # e.g. Alchemy / Infura
export ETHERSCAN_API_KEY=<your-api-key>        # optional, for verification

forge script script/Deploy.s.sol \
  --rpc-url $SEPOLIA_RPC_URL \
  --broadcast \
  --verify
```

Then update `VITE_CONTRACT_ADDRESS` in `frontend/.env` and rebuild.

---

## Smart Contract API

### Write functions

| Function | Description |
|---|---|
| `createProposal(title, description)` | Creates a new proposal; emits `ProposalCreated` |
| `vote(proposalId, support)` | Casts a yes (`true`) or no (`false`) vote; emits `Voted` |
| `closeProposal(proposalId)` | Creator-only; locks proposal; emits `ProposalClosed` |

### Read functions

| Function | Returns |
|---|---|
| `getProposal(id)` | Single `Proposal` struct |
| `getAllProposals()` | Array of all `Proposal` structs |
| `getProposalCount()` | Total proposal count |
| `hasVoted(id, addr)` | `true` if the address has voted |

### Events

| Event | Indexed fields |
|---|---|
| `ProposalCreated(id, creator, title)` | `id`, `creator` |
| `Voted(id, voter, support)` | `id`, `voter` |
| `ProposalClosed(id, yesVotes, noVotes)` | `id` |

### Custom Errors

`EmptyTitle` · `ProposalNotFound(id)` · `ProposalClosed_Err(id)` · `AlreadyVoted(id, voter)` · `NotCreator(id, caller)`

---

## Running Tests

```bash
cd contracts

# Unit tests
forge test -vv

# With gas report
forge test --gas-report

# Fuzz runs (default 256)
forge test --fuzz-runs 1000
```
