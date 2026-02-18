import React from "react";
import ProposalCard from "./ProposalCard";

export default function ProposalList({
  proposals,
  account,
  onVote,
  onClose,
  checkHasVoted,
  loading,
}) {
  if (proposals.length === 0) {
    return (
      <div className="empty-state">
        <h2>No proposals yet</h2>
        <p>Be the first to create a proposal above!</p>
      </div>
    );
  }

  return (
    <div>
      <p className="section-heading">
        <strong>{proposals.length}</strong> proposal{proposals.length !== 1 ? "s" : ""}
      </p>
      {proposals.map((p) => (
        <ProposalCard
          key={p.id}
          proposal={p}
          account={account}
          onVote={onVote}
          onClose={onClose}
          checkHasVoted={checkHasVoted}
          loading={loading}
        />
      ))}
    </div>
  );
}
