import React, { useEffect, useState } from "react";

const SECONDS_DAY = 86400;

function timeAgo(ts) {
  const diff = Math.floor(Date.now() / 1000) - ts;
  if (diff < 60)  return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < SECONDS_DAY) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / SECONDS_DAY)}d ago`;
}

function shortAddr(addr = "") {
  return addr.slice(0, 6) + "…" + addr.slice(-4);
}

export default function ProposalCard({
  proposal,
  account,
  onVote,
  onClose,
  checkHasVoted,
  loading,
}) {
  const { id, title, description, creator, yesVotes, noVotes, active, createdAt } = proposal;
  const total = yesVotes + noVotes;
  const yesPct = total === 0 ? 0 : Math.round((yesVotes / total) * 100);

  const [voted, setVoted] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function check() {
      if (account) {
        const v = await checkHasVoted(id);
        if (!cancelled) setVoted(v);
      }
    }
    check();
    return () => { cancelled = true; };
  }, [id, account, checkHasVoted]);

  const isCreator = account?.toLowerCase() === creator.toLowerCase();

  return (
    <div className="card">
      {/* Header */}
      <div className="proposal-header">
        <div>
          <span className="proposal-title">{title}</span>
          {description && <p className="proposal-desc">{description}</p>}
          <p className="proposal-meta">
            By {shortAddr(creator)} · {timeAgo(createdAt)} · Proposal #{id}
          </p>
        </div>
        <span className={`badge ${active ? "badge-active" : "badge-closed"}`}>
          {active ? "Active" : "Closed"}
        </span>
      </div>

      {/* Vote bar */}
      <div className="vote-stats">
        <div className="vote-counts">
          <span className="yes-count">✅ {yesVotes} YES</span>
          <span className="no-count">❌ {noVotes} NO</span>
          <span style={{ color: "#475569", marginLeft: "auto" }}>
            {total} vote{total !== 1 ? "s" : ""} · {yesPct}% yes
          </span>
        </div>
        <div className="vote-bar-bg">
          <div
            className="vote-bar-fill"
            style={{ width: `${yesPct}%` }}
          />
        </div>
      </div>

      {/* Actions */}
      {active && account && (
        <div className="vote-actions">
          {voted ? (
            <span className="voted-badge">You have already voted.</span>
          ) : (
            <>
              <button
                className="btn-yes"
                disabled={loading}
                onClick={() => onVote(id, true)}
              >
                Vote YES
              </button>
              <button
                className="btn-no"
                disabled={loading}
                onClick={() => onVote(id, false)}
              >
                Vote NO
              </button>
            </>
          )}
          {isCreator && (
            <button
              className="btn-close"
              disabled={loading}
              onClick={() => onClose(id)}
              style={{ marginLeft: "auto" }}
            >
              Close Proposal
            </button>
          )}
        </div>
      )}
    </div>
  );
}
