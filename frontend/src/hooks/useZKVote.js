/**
 * useZKVote — generates a Groth16 proof for the vote circuit in the browser.
 *
 * The wasm and zkey are served as static assets from /zk/.
 */

import { useState, useCallback } from "react";
import { groth16 } from "snarkjs";
import { poseidon } from "../utils/poseidon";

const WASM_URL = "/zk/vote.wasm";
const ZKEY_URL = "/zk/vote_final.zkey";

/**
 * @returns {{ generating, generateProof }}
 *
 * generateProof({ secret, nullifier, vote, proposalId }) resolves to:
 *   { pA, pB, pC, pubSignals }
 * which can be passed directly to Voting.vote(...)
 */
export function useZKVote() {
  const [generating, setGenerating] = useState(false);

  const generateProof = useCallback(async ({ secret, nullifier, vote, proposalId }) => {
    setGenerating(true);
    try {
      const commitment    = await poseidon([secret, nullifier]);
      const nullifierHash = await poseidon([nullifier, BigInt(proposalId)]);

      const input = {
        // private
        secret:       secret.toString(),
        nullifier:    nullifier.toString(),
        vote:         vote ? "1" : "0",
        // public
        proposalId:   proposalId.toString(),
        commitment:   commitment.toString(),
        nullifierHash: nullifierHash.toString(),
      };

      const { proof, publicSignals } = await groth16.fullProve(input, WASM_URL, ZKEY_URL);

      // Format proof points for Solidity calldata
      const pA = [proof.pi_a[0], proof.pi_a[1]];
      const pB = [
        [proof.pi_b[0][1], proof.pi_b[0][0]],  // note: reversed for Solidity
        [proof.pi_b[1][1], proof.pi_b[1][0]],
      ];
      const pC = [proof.pi_c[0], proof.pi_c[1]];
      // publicSignals order matches circuit: [proposalId, commitment, nullifierHash]
      const pubSignals = publicSignals;

      return { pA, pB, pC, pubSignals, commitment, nullifierHash };
    } finally {
      setGenerating(false);
    }
  }, []);

  return { generating, generateProof };
}
