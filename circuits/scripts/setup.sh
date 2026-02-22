#!/usr/bin/env bash
# setup.sh — Trusted setup (dev/local) + export Solidity verifier
#
# For production use a real Powers of Tau ceremony file from:
#   https://github.com/iden3/snarkjs#7-prepare-phase-2
# and skip the ptau generation steps.
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CIRCUITS_DIR="$SCRIPT_DIR/.."
BUILD_DIR="$CIRCUITS_DIR/build"
CONTRACTS_DIR="$CIRCUITS_DIR/../contracts/src"

# ── Step 0: make sure the circuit is compiled ─────────────────────────────────
if [ ! -f "$BUILD_DIR/vote.r1cs" ]; then
  echo "==> vote.r1cs not found — running compile.sh first..."
  bash "$SCRIPT_DIR/compile.sh"
fi

cd "$BUILD_DIR"

# ── Step 1: Powers of Tau (dev ceremony, power 12 supports up to 4096 gates) ──
echo ""
echo "==> [1/6] Starting Powers of Tau ceremony (power 12)..."
snarkjs powersoftau new bn128 12 pot12_0000.ptau -v

echo ""
echo "==> [2/6] Adding a contribution..."
snarkjs powersoftau contribute pot12_0000.ptau pot12_0001.ptau \
  --name="voting-dapp dev" -v -e="some random entropy for dev"

echo ""
echo "==> [3/6] Preparing Phase 2..."
snarkjs powersoftau prepare phase2 pot12_0001.ptau pot12_final.ptau -v

# ── Step 2: Groth16 circuit-specific setup ────────────────────────────────────
echo ""
echo "==> [4/6] Groth16 setup..."
snarkjs groth16 setup vote.r1cs pot12_final.ptau vote_0000.zkey

echo ""
echo "==> [5/6] Contributing to zkey..."
snarkjs zkey contribute vote_0000.zkey vote_final.zkey \
  --name="voting-dapp dev" -v -e="more random entropy for dev"

# ── Step 3: Export artifacts ──────────────────────────────────────────────────
echo ""
echo "==> [6/6] Exporting verification key..."
snarkjs zkey export verificationkey vote_final.zkey verification_key.json

echo ""
echo "==> Exporting Solidity verifier to contracts/src/Verifier.sol..."
mkdir -p "$CONTRACTS_DIR"
snarkjs zkey export solidityverifier vote_final.zkey "$CONTRACTS_DIR/Verifier.sol"

echo ""
echo "✓ Setup complete! Artifacts in circuits/build/:"
echo "    vote_final.zkey       — proving key (keep secure)"
echo "    verification_key.json — for off-chain verification"
echo "    contracts/src/Verifier.sol — paste into your Foundry project"
