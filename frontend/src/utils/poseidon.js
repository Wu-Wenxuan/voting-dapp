/**
 * Thin wrapper around circomlibjs Poseidon.
 * Returns a BigInt so it's compatible with snarkjs and ethers BigInt inputs.
 *
 * Usage:
 *   const commitment    = await poseidon([secret, nullifier]);
 *   const nullifierHash = await poseidon([nullifier, proposalId]);
 */

import { buildPoseidon } from "circomlibjs";

let _poseidon = null;

async function getPoseidon() {
  if (!_poseidon) _poseidon = await buildPoseidon();
  return _poseidon;
}

/**
 * @param {(bigint|number|string)[]} inputs
 * @returns {Promise<bigint>}
 */
export async function poseidon(inputs) {
  const fn = await getPoseidon();
  const hash = fn(inputs);
  // circomlibjs returns an F1Field element; convert to BigInt via BN254 field
  return fn.F.toObject(hash);
}

/**
 * Generate a cryptographically random field element (< BN254 field order).
 * @returns {bigint}
 */
export function randomFieldElement() {
  const bytes = new Uint8Array(31); // 248-bit random, guaranteed < field order
  crypto.getRandomValues(bytes);
  return BigInt("0x" + [...bytes].map((b) => b.toString(16).padStart(2, "0")).join(""));
}
