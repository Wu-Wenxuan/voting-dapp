import { useState, useCallback } from "react";
import { ethers } from "ethers";
import VotingArtifact from "../abi/Voting.json";

// After deploying with Foundry, paste the deployed address here.
// For local anvil: forge script script/Deploy.s.sol --rpc-url localhost --broadcast
export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || "";

function getContract(signerOrProvider) {
  return new ethers.Contract(CONTRACT_ADDRESS, VotingArtifact.abi, signerOrProvider);
}

/**
 * Central hook that owns all wallet + contract state.
 * Returns everything the UI needs.
 */
export function useVoting() {
  const [provider, setProvider]   = useState(null);
  const [signer, setSigner]       = useState(null);
  const [account, setAccount]     = useState(null);
  const [chainId, setChainId]     = useState(null);
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading]     = useState(false);
  const [toasts, setToasts]       = useState([]);

  // ── Toast helpers ──────────────────────────────────────────────────────────
  const addToast = useCallback((msg, type = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  // ── Connect MetaMask ───────────────────────────────────────────────────────
  const connect = useCallback(async () => {
    if (!window.ethereum) {
      addToast("MetaMask not detected. Please install it.", "error");
      return;
    }
    try {
      const _provider = new ethers.BrowserProvider(window.ethereum);
      const _signer = await _provider.getSigner();
      const _account = await _signer.getAddress();
      const { chainId: _chainId } = await _provider.getNetwork();

      setProvider(_provider);
      setSigner(_signer);
      setAccount(_account);
      setChainId(Number(_chainId));

      // Re-connect on account/chain change
      window.ethereum.on("accountsChanged", () => window.location.reload());
      window.ethereum.on("chainChanged",    () => window.location.reload());

      addToast("Wallet connected!", "success");
    } catch (err) {
      addToast(err.reason ?? err.message, "error");
    }
  }, [addToast]);

  // ── Load proposals ─────────────────────────────────────────────────────────
  const loadProposals = useCallback(async (p = provider) => {
    if (!p || !CONTRACT_ADDRESS) return;
    try {
      const contract = getContract(p);
      const raw = await contract.getAllProposals();
      // Convert BigInt fields to plain numbers / strings for React state
      const normalized = raw.map((p) => ({
        id:          Number(p.id),
        title:       p.title,
        description: p.description,
        creator:     p.creator,
        yesVotes:    Number(p.yesVotes),
        noVotes:     Number(p.noVotes),
        active:      p.active,
        createdAt:   Number(p.createdAt),
      }));
      setProposals(normalized.reverse()); // newest first
    } catch (err) {
      addToast("Failed to load proposals: " + (err.reason ?? err.message), "error");
    }
  }, [provider, addToast]);

  // ── Create proposal ────────────────────────────────────────────────────────
  const createProposal = useCallback(async (title, description) => {
    if (!signer || !CONTRACT_ADDRESS) {
      addToast("Connect your wallet first.", "error");
      return;
    }
    setLoading(true);
    try {
      const contract = getContract(signer);
      const tx = await contract.createProposal(title, description);
      addToast("Transaction sent. Waiting for confirmation…");
      await tx.wait();
      addToast("Proposal created!", "success");
      await loadProposals();
    } catch (err) {
      addToast(parseError(err), "error");
    } finally {
      setLoading(false);
    }
  }, [signer, addToast, loadProposals]);

  // ── Vote ───────────────────────────────────────────────────────────────────
  const castVote = useCallback(async (proposalId, support) => {
    if (!signer || !CONTRACT_ADDRESS) {
      addToast("Connect your wallet first.", "error");
      return;
    }
    setLoading(true);
    try {
      const contract = getContract(signer);
      const tx = await contract.vote(proposalId, support);
      addToast("Vote submitted. Waiting for confirmation…");
      await tx.wait();
      addToast(`Voted ${support ? "YES ✅" : "NO ❌"} successfully!`, "success");
      await loadProposals();
    } catch (err) {
      addToast(parseError(err), "error");
    } finally {
      setLoading(false);
    }
  }, [signer, addToast, loadProposals]);

  // ── Close proposal ─────────────────────────────────────────────────────────
  const closeProposal = useCallback(async (proposalId) => {
    if (!signer || !CONTRACT_ADDRESS) {
      addToast("Connect your wallet first.", "error");
      return;
    }
    setLoading(true);
    try {
      const contract = getContract(signer);
      const tx = await contract.closeProposal(proposalId);
      addToast("Closing proposal…");
      await tx.wait();
      addToast("Proposal closed.", "success");
      await loadProposals();
    } catch (err) {
      addToast(parseError(err), "error");
    } finally {
      setLoading(false);
    }
  }, [signer, addToast, loadProposals]);

  // ── Check if current user has voted ───────────────────────────────────────
  const checkHasVoted = useCallback(async (proposalId) => {
    if (!provider || !account || !CONTRACT_ADDRESS) return false;
    try {
      const contract = getContract(provider);
      return await contract.hasVoted(proposalId, account);
    } catch {
      return false;
    }
  }, [provider, account]);

  return {
    account, chainId, proposals, loading, toasts,
    connect, loadProposals, createProposal, castVote, closeProposal, checkHasVoted,
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function parseError(err) {
  const reason = err.reason ?? err.data?.message ?? err.message ?? "Unknown error";
  if (reason.includes("AlreadyVoted")) return "You have already voted on this proposal.";
  if (reason.includes("ProposalClosed_Err")) return "This proposal is already closed.";
  if (reason.includes("NotCreator")) return "Only the proposal creator can close it.";
  if (reason.includes("EmptyTitle")) return "Title cannot be empty.";
  if (reason.includes("user rejected")) return "Transaction rejected by user.";
  return reason;
}
