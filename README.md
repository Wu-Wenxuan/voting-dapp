# ZK Voting DApp

A privacy-preserving on-chain voting application built with **Circom + SnarkJS** (ZK circuits), **Solidity + Foundry** (smart contracts), and **React + ethers.js + MetaMask** (frontend).

Votes are cast anonymously using **Groth16 zero-knowledge proofs** — the contract proves you are a registered voter and have not voted before, without ever learning *who* you are.

## How It Works

1. **Register** — generate a random `secret` and `nullifier` in your browser. Compute `commitment = Poseidon(secret, nullifier)` and submit it on-chain. This is your anonymous identity.
2. **Vote** — upload your saved credentials, choose Yes or No, and the browser generates a Groth16 ZK proof that:
   - You know a `(secret, nullifier)` whose hash equals a registered commitment.
   - `nullifierHash = Poseidon(nullifier, proposalId)` has not been spent before.
   - The vote bit is binary (0 or 1).
3. **Verify** — the `Groth16Verifier` contract checks the proof on-chain. If valid, the vote is tallied and the nullifier is marked spent. Your wallet address is never recorded.

---

## Features

| Feature | Details |
|---|---|
| Anonymous voting | Groth16 ZK proof — no link between your wallet and your vote |
| Double-vote prevention | Nullifier hash stored on-chain; reuse reverts with `NullifierAlreadyUsed` |
| Credential management | Browser-generated `secret`/`nullifier`; downloadable JSON backup |
| Create proposals | Any connected wallet can post a yes/no proposal |
| Public results | Live yes/no counts with a visual progress bar |
| Close proposals | Proposal creator can lock it when voting is done |
| MetaMask auto-switch | Automatically prompts to switch to the correct chain |
| Custom errors | Solidity custom errors for gas-efficient reverts |
| 22 passing tests | Unit tests with `MockVerifier` + real verifier for invalid-proof test |

---

## Project Structure

```
zk-voting-dapp/
 circuits/                    # Circom ZK circuit
   ├── vote.circom              # Circuit definition (Poseidon hashing, constraints)
   ├── package.json
   ├── node_modules/circomlib/  # Poseidon hash component
   ├── scripts/
   │   ├── compile.sh           # Compiles vote.circom → .r1cs + .wasm
   │   └── setup.sh             # Trusted setup → vote_final.zkey + Verifier.sol
   └── build/
       ├── vote_js/vote.wasm    # Witness generator (used by browser)
       ├── vote.r1cs
       ├── pot12_final.ptau     # Powers of Tau (phase 1)
       ├── vote_final.zkey      # Proving key (phase 2)
       └── verification_key.json
 contracts/                   # Foundry project
   ├── foundry.toml
   ├── src/
   │   ├── Voting.sol           # Main contract (register + ZK vote)
   │   └── Verifier.sol         # Auto-generated Groth16 verifier
   ├── script/
   │   └── Deploy.s.sol         # Deploys Groth16Verifier then Voting
   └── test/
       └── Voting.t.sol         # 22 tests (unit + invalid-proof)
 frontend/                    # React + Vite
    ├── .env                     # VITE_CONTRACT_ADDRESS
    ├── package.json
    ├── vite.config.js           # vite-plugin-node-polyfills for snarkjs
    ├── public/
    │   └── zk/
    │       ├── vote.wasm        # Circuit witness generator
    │       └── vote_final.zkey  # Proving key
    └── src/
        ├── App.jsx
        ├── abi/
        │   └── Voting.json      # Contract ABI
        ├── hooks/
        │   ├── useVoting.js     # Wallet connection, contract calls, error decoding
        │   └── useZKVote.js     # Browser-side Groth16 proof generation
        ├── utils/
        │   └── poseidon.js      # circomlibjs Poseidon wrapper + random field element
        └── components/
            ├── ConnectWallet.jsx
            ├── CreateProposal.jsx
            ├── RegisterModal.jsx  # Credential generation + on-chain registration
            ├── VoteModal.jsx      # Credential upload + proof generation + vote
            ├── ProposalList.jsx
            └── ProposalCard.jsx
```

---

## Quick Start

### Prerequisites

| Tool | Version | Install |
|---|---|---|
| Foundry (forge/anvil) | latest | `curl -L https://foundry.paradigm.xyz \| bash && foundryup` |
| Circom | 2.2.3 | [circom docs](https://docs.circom.io/getting-started/installation/) |
| SnarkJS | 0.7.x | `npm install -g snarkjs` |
| Node.js | 18+ | — |

---

### 1 — Compile the circuit

```bash
cd circuits
npm install          # installs circomlib
bash scripts/compile.sh
```

This produces `build/vote_js/vote.wasm` and `build/vote.r1cs`.

### 2 — Run the trusted setup

```bash
bash scripts/setup.sh
```

This runs a Groth16 phase-2 ceremony and exports:
- `build/vote_final.zkey` — proving key
- `build/verification_key.json` — verifying key
- `contracts/src/Verifier.sol` — on-chain Groth16 verifier

> **Note:** The included `.ptau` and `.zkey` files are for local development only. For production, use a real multi-party trusted setup.

### 3 — Build & test the contracts

```bash
cd contracts
forge build
forge test -vv
```

All 22 tests should pass.

### 4 — Run a local node and deploy

```bash
# Terminal 1
anvil --host 0.0.0.0
```

```bash
# Terminal 2
cd contracts
export PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
forge script script/Deploy.s.sol --rpc-url http://127.0.0.1:8545 --broadcast
```

Note the **Voting** contract address printed in the output.

### 5 — Configure the frontend

```bash
cd frontend
# Copy the ZK artifacts
cp ../circuits/build/vote_js/vote.wasm public/zk/vote.wasm
cp ../circuits/build/vote_final.zkey   public/zk/vote_final.zkey

# Set the contract address
echo "VITE_CONTRACT_ADDRESS=<Voting address from step 4>" > .env
```

### 6 — Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in a browser with MetaMask installed.
The app will automatically prompt MetaMask to switch to the local Anvil network (Chain ID `31337`).
Import an Anvil test account using its private key.

### 7 — Deploy to a public testnet (Sepolia)

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
| `register(commitment)` | Register `Poseidon(secret, nullifier)` as your anonymous identity |
| `createProposal(title, description)` | Creates a new proposal; emits `ProposalCreated` |
| `vote(proposalId, support, pA, pB, pC, pubSignals)` | Cast an anonymous ZK-proven vote; emits `Voted` |
| `closeProposal(proposalId)` | Creator-only; locks proposal; emits `ProposalClosed` |

### Read functions

| Function | Returns |
|---|---|
| `getProposal(id)` | Single `Proposal` struct |
| `getAllProposals()` | Array of all `Proposal` structs |
| `getProposalCount()` | Total proposal count |
| `commitments(hash)` | `true` if commitment is registered |
| `usedNullifiers(hash)` | `true` if nullifier has been spent |

### Events

| Event | Indexed fields |
|---|---|
| `ProposalCreated(id, creator, title)` | `id`, `creator` |
| `Voted(id, support)` | `id` — voter address intentionally omitted |
| `ProposalClosed(id, yesVotes, noVotes)` | `id` |

### Custom Errors

| Error | Meaning |
|---|---|
| `CommitmentAlreadyRegistered` | Commitment already registered |
| `CommitmentNotRegistered` | Commitment not found on-chain |
| `NullifierAlreadyUsed` | Vote already cast for this proposal |
| `ProposalIdMismatch` | Proof was generated for a different proposal |
| `InvalidProof` | Groth16 verification failed |
| `EmptyTitle` | Proposal title is empty |
| `ProposalNotFound(id)` | No proposal with that ID |
| `ProposalClosed_Err(id)` | Proposal is already closed |
| `NotCreator(id, caller)` | Only the proposal creator can close it |

---

## Running Tests

```bash
cd contracts

# All 22 tests
forge test -vv

# With gas report
forge test --gas-report

# Specific test
forge test --match-test test_Vote_InvalidProof_Reverts -vvvv
```
