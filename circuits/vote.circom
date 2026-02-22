pragma circom 2.0.0;

include "node_modules/circomlib/circuits/poseidon.circom";

/*
 * ZK Private Voting Circuit
 *
 * Proves (without revealing):
 *   1. The voter knows (secret, nullifier) such that
 *      Poseidon(secret, nullifier) == commitment  (they registered)
 *   2. nullifierHash == Poseidon(nullifier, proposalId)  (prevents double-voting)
 *   3. vote is binary: 0 (NO) or 1 (YES)
 *
 * Public inputs  : proposalId, commitment, nullifierHash
 * Private inputs : secret, nullifier, vote
 */
template Vote() {
    // -------------------------------------------------------------------------
    // Private inputs (known only to the voter, never revealed)
    // -------------------------------------------------------------------------
    signal input secret;       // random secret chosen by voter at registration
    signal input nullifier;    // random nullifier chosen by voter at registration
    signal input vote;         // 0 = NO, 1 = YES

    // -------------------------------------------------------------------------
    // Public inputs (verified by the smart contract)
    // -------------------------------------------------------------------------
    signal input proposalId;    // ID of the proposal being voted on
    signal input commitment;    // Poseidon(secret, nullifier) — stored on-chain at registration
    signal input nullifierHash; // Poseidon(nullifier, proposalId) — marks vote as used on-chain

    // -------------------------------------------------------------------------
    // 1. Verify the commitment
    //    commitment (public) must equal Poseidon(secret, nullifier)
    // -------------------------------------------------------------------------
    component commitHasher = Poseidon(2);
    commitHasher.inputs[0] <== secret;
    commitHasher.inputs[1] <== nullifier;
    commitment === commitHasher.out;

    // -------------------------------------------------------------------------
    // 2. Verify the nullifier hash
    //    Ties the nullifier to this specific proposal so the same nullifier
    //    cannot be reused across different proposals.
    // -------------------------------------------------------------------------
    component nullHasher = Poseidon(2);
    nullHasher.inputs[0] <== nullifier;
    nullHasher.inputs[1] <== proposalId;
    nullifierHash === nullHasher.out;

    // -------------------------------------------------------------------------
    // 3. Enforce vote is binary (0 or 1)
    //    vote * (1 - vote) == 0  is satisfied only when vote ∈ {0, 1}
    // -------------------------------------------------------------------------
    vote * (1 - vote) === 0;
}

component main {public [proposalId, commitment, nullifierHash]} = Vote();
