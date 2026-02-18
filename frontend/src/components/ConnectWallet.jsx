import React from "react";

function shortAddr(addr) {
  if (!addr) return "";
  return addr.slice(0, 6) + "…" + addr.slice(-4);
}

export default function ConnectWallet({ account, onConnect }) {
  if (account) {
    return (
      <div className="wallet-badge">
        ◉ Connected: <span>{shortAddr(account)}</span>
      </div>
    );
  }
  return (
    <button className="btn-connect" onClick={onConnect}>
      Connect MetaMask
    </button>
  );
}
