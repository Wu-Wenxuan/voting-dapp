import React, { useEffect, useState } from "react";
import ConnectWallet from "./components/ConnectWallet";
import CreateProposal from "./components/CreateProposal";
import ProposalList from "./components/ProposalList";
import { useVoting, CONTRACT_ADDRESS } from "./hooks/useVoting";

export default function App() {
  const {
    account, proposals, loading, toasts,
    connect, loadProposals, createProposal, castVote, closeProposal, checkHasVoted,
  } = useVoting();

  // Load proposals once wallet is ready (or on mount if read-only)
  const [initialized, setInitialized] = useState(false);
  useEffect(() => {
    if (!initialized && CONTRACT_ADDRESS) {
      // We can still read proposals without a wallet via a read-only provider
      // but for simplicity we wait until the user connects.
      setInitialized(true);
    }
  }, [initialized]);

  useEffect(() => {
    if (account) loadProposals();
  }, [account]); // eslint-disable-line

  return (
    <div className="app">
      {/* ── Header ─────────────────────────────────────── */}
      <header className="header">
        <h1>🗳 <span>Chain</span>Vote</h1>
        <ConnectWallet account={account} onConnect={connect} />
      </header>

      {/* ── Contract address warning ─────────────────── */}
      {!CONTRACT_ADDRESS && (
        <div className="card" style={{ borderColor: "#7c3aed", marginBottom: "1.5rem" }}>
          <p style={{ fontSize: "0.875rem", color: "#a78bfa" }}>
            ⚠️ <strong>No contract address set.</strong> Deploy the contract with Foundry, then set{" "}
            <code>VITE_CONTRACT_ADDRESS</code> in <code>frontend/.env</code>.
          </p>
        </div>
      )}

      {/* ── Create proposal ──────────────────────────── */}
      <CreateProposal
        onSubmit={createProposal}
        loading={loading}
        disabled={!account}
      />

      {/* ── Proposal list ─────────────────────────────── */}
      <ProposalList
        proposals={proposals}
        account={account}
        onVote={castVote}
        onClose={closeProposal}
        checkHasVoted={checkHasVoted}
        loading={loading}
      />

      {/* ── Refresh button ─────────────────────────────── */}
      {account && (
        <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
          <button className="btn-close" onClick={loadProposals} disabled={loading}>
            {loading ? "Loading…" : "↻ Refresh"}
          </button>
        </div>
      )}

      {/* ── Toasts ─────────────────────────────────────── */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type}`}>
            {t.msg}
          </div>
        ))}
      </div>
    </div>
  );
}
