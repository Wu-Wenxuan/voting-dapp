import React, { useState } from "react";
import { poseidon, randomFieldElement } from "../utils/poseidon";

/**
 * RegisterModal
 * Generates a secret + nullifier, computes commitment = Poseidon(secret, nullifier),
 * and calls onRegister(commitment) to submit the on-chain tx.
 *
 * The user MUST save their secret and nullifier — without them they cannot vote.
 */
export default function RegisterModal({ onRegister, onClose, loading }) {
  const [secret, setSecret]     = useState("");
  const [nullifier, setNullifier] = useState("");
  const [commitment, setCommitment] = useState("");
  const [computing, setComputing] = useState(false);
  const [saved, setSaved]       = useState(false);

  async function handleGenerate() {
    setComputing(true);
    try {
      const s = randomFieldElement();
      const n = randomFieldElement();
      const c = await poseidon([s, n]);
      setSecret(s.toString());
      setNullifier(n.toString());
      setCommitment(c.toString());
      setSaved(false);
    } finally {
      setComputing(false);
    }
  }

  function handleSave() {
    const data = JSON.stringify({ secret, nullifier, commitment }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = "voting-credentials.json";
    a.click();
    URL.revokeObjectURL(url);
    setSaved(true);
  }

  function handleSubmit() {
    if (!commitment) return;
    onRegister(BigInt(commitment));
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Register to Vote</h2>
        <p className="modal-info">
          Generate your secret credentials. <strong>Save them — you need them to vote.</strong>
          Without your secret and nullifier, you cannot cast a vote.
        </p>

        <button className="btn-yes" onClick={handleGenerate} disabled={computing || loading}>
          {computing ? "Generating…" : "🎲 Generate Credentials"}
        </button>

        {commitment && (
          <>
            <div className="credential-box">
              <label>Secret (keep private!)</label>
              <code className="credential-value">{secret.slice(0, 20)}…</code>
              <label>Nullifier (keep private!)</label>
              <code className="credential-value">{nullifier.slice(0, 20)}…</code>
              <label>Commitment (public, stored on-chain)</label>
              <code className="credential-value">{commitment.slice(0, 30)}…</code>
            </div>

            <button className="btn-close" onClick={handleSave} style={{ marginBottom: "0.75rem" }}>
              💾 Download credentials.json
            </button>

            <button
              className="btn-yes"
              onClick={handleSubmit}
              disabled={!saved || loading}
              style={{ width: "100%" }}
            >
              {loading ? "Sending tx…" : "Register on-chain"}
            </button>
            {!saved && (
              <p style={{ color: "#f59e0b", fontSize: "0.8rem", marginTop: "0.5rem" }}>
                ⚠️ Please download your credentials before registering.
              </p>
            )}
          </>
        )}

        <button className="btn-no" onClick={onClose} style={{ width: "100%", marginTop: "0.5rem" }}>
          Cancel
        </button>
      </div>
    </div>
  );
}
