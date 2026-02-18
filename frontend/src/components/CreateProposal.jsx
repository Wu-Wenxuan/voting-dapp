import React, { useState } from "react";

export default function CreateProposal({ onSubmit, loading, disabled }) {
  const [title, setTitle]       = useState("");
  const [description, setDesc]  = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) return;
    await onSubmit(title.trim(), description.trim());
    setTitle("");
    setDesc("");
  }

  return (
    <div className="card create-form">
      <h2>+ New Proposal</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Title *</label>
          <input
            id="title"
            type="text"
            placeholder="e.g. Fund community garden"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="desc">Description</label>
          <textarea
            id="desc"
            rows={3}
            placeholder="Optional: more details about the proposal…"
            value={description}
            onChange={(e) => setDesc(e.target.value)}
          />
        </div>
        <button
          type="submit"
          className="btn-primary"
          disabled={loading || disabled || !title.trim()}
        >
          {loading ? "Submitting…" : "Create Proposal"}
        </button>
        {disabled && (
          <span style={{ marginLeft: "1rem", fontSize: "0.8rem", color: "#94a3b8" }}>
            Connect wallet to create proposals
          </span>
        )}
      </form>
    </div>
  );
}
