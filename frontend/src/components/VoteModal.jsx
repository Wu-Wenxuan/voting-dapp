import React, { useState } from "react";
import { useZKVote } from "../hooks/useZKVote";

/**
 * VoteModal
 * Prompts voter for their secret & nullifier, generates a ZK proof, then calls
 * onVote(proposalId, support, pA, pB, pC, pubSignals).
 */
export default function VoteModal({ proposalId, proposalTitle, onVote, onClose, loading }) {
  const [support, setSupport]   = useState(null); // true=YES, false=NO
  const [secret, setSecret]     = useState("");
  const [nullifier, setNullifier] = useState("");
  const [fileError, setFileError] = useState("");
  const { generating, generateProof } = useZKVote();

  function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const creds = JSON.parse(ev.target.result);
        if (!creds.secret || !creds.nullifier) throw new Error("Invalid file format");
        setSecret(creds.secret);
        setNullifier(creds.nullifier);
        setFileError("");
      } catch {
        setFileError("Invalid credentials file.");
      }
    };
    reader.readAsText(file);
  }

  async function handleSubmit() {
    if (support === null || !secret || !nullifier) return;
    try {
      const result = await generateProof({
        secret:     BigInt(secret),
        nullifier:  BigInt(nullifier),
        vote:       support,
        proposalId,
      });
      await onVote(proposalId, support, result.pA, result.pB, result.pC, result.pubSignals);
      onClose();
    } catch (err) {
      console.error("Proof generation failed:", err);
      alert("Failed to generate proof: " + (err.message ?? err));
    }
  }

  const busy = generating || loading;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Cast Your Vote</h2>
        <p className="modal-info" style={{ fontWeight: 600 }}>{proposalTitle}</p>

        {/* Vote choice */}
        <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem" }}>
          <button
            className={support === true ? "btn-yes active-choice" : "btn-yes"}
            style={{ flex: 1, opacity: support === false ? 0.4 : 1 }}
            onClick={() => setSupport(true)}
            disabled={busy}
          >
            ✅ YES
          </button>
          <button
            className={support === false ? "btn-no active-choice" : "btn-no"}
            style={{ flex: 1, opacity: support === true ? 0.4 : 1 }}
            onClick={() => setSupport(false)}
            disabled={busy}
          >
            ❌ NO
          </button>
        </div>

        {/* Credentials upload */}
        <div className="credential-box">
          <label>Load credentials file</label>
          <input type="file" accept=".json" onChange={handleFileUpload} disabled={busy} />
          {fileError && <p style={{ color: "#ef4444", fontSize: "0.8rem" }}>{fileError}</p>}

          <label style={{ marginTop: "0.5rem" }}>Or paste Secret</label>
          <input
            className="text-input"
            type="password"
            placeholder="Your secret (big number)"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            disabled={busy}
          />
          <label>Nullifier</label>
          <input
            className="text-input"
            type="password"
            placeholder="Your nullifier (big number)"
            value={nullifier}
            onChange={(e) => setNullifier(e.target.value)}
            disabled={busy}
          />
        </div>

        <p className="modal-info" style={{ color: "#94a3b8", fontSize: "0.78rem" }}>
          🔒 Your secret stays in your browser. Only the ZK proof is sent on-chain.
        </p>

        <button
          className="btn-yes"
          style={{ width: "100%" }}
          onClick={handleSubmit}
          disabled={busy || support === null || !secret || !nullifier}
        >
          {generating ? "Generating proof…" : loading ? "Sending tx…" : "Submit Anonymous Vote"}
        </button>

        <button className="btn-no" onClick={onClose} style={{ width: "100%", marginTop: "0.5rem" }} disabled={busy}>
          Cancel
        </button>
      </div>
    </div>
  );
}
