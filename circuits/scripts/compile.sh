#!/usr/bin/env bash
# compile.sh — Compile the vote.circom circuit to r1cs + wasm + sym
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CIRCUITS_DIR="$SCRIPT_DIR/.."
BUILD_DIR="$CIRCUITS_DIR/build"

mkdir -p "$BUILD_DIR"

echo "==> Compiling vote.circom..."
circom "$CIRCUITS_DIR/vote.circom" \
  --r1cs \
  --wasm \
  --sym \
  --output "$BUILD_DIR" \
  -l "$CIRCUITS_DIR/node_modules"

echo ""
echo "==> Compilation complete. Outputs in circuits/build/:"
echo "    vote.r1cs"
echo "    vote_js/vote.wasm"
echo "    vote.sym"

echo ""
snarkjs r1cs info "$BUILD_DIR/vote.r1cs"
