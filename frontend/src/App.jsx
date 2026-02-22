import React, { useEffect, useState } from "react";
import ConnectWallet from "./components/ConnectWallet";
import CreateProposal from "./components/CreateProposal";
import ProposalList from "./components/ProposalList";
import RegisterModal from "./components/RegisterModal";
import { useVoting, CONTRACT_ADDRESS } from "./hooks/useVoting";

export default function App() {
  const {
    account, proposals, loading, toasts,
    connect, loadProposals, createProposal, castVote, closeProposal, registerVoter,
  } = useVoting();

  const [showRegister, setShowRegister] = useState(false);

  useEffect(() => {
    if (account) loadProposals();
  }, [account]); // eslint-disable-line

  async function handleRegister(commitment) {
    await registerVoter(commitment);
    setShowRegister(false);
  }

  return (
    <div className="app">
      {/* ── Header ─────────────────────────────────────── */}
      <header className="header">
        <h1>🗳 <span>Chain</span>Vote</h1>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          {account && (
            <button className="btn-register" onClick={() => setShowRegister(true)}>
              🔑 Register to Vote
            </button>
          )}
          <ConnectWallet account={account} onConnect={connect} />
        </div>
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

      {/* ── ZK info banner ───────────────────────────── */}
      {account && (
        <div className="card zk-banner" style={{ marginBottom: "1.5rem" }}>
          <p style={{ fontSize: "0.875rem", color: "#a78bfa", margin: 0 }}>
            🔒 <strong>ZK Private Voting enabled.</strong> Register once with a secret commitment,
            then vote anonymously — the contract only learns that an eligible voter voted, not who.
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

      {/* ── Register Modal ─────────────────────────────── */}
      {showRegister && (
        <RegisterModal
          onRegister={handleRegister}
          onClose={() => setShowRegister(false)}
          loading={loading}
        />
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
