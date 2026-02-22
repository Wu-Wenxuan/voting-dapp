import { useState, useCallback } from "react";
import { ethers } from "ethers";
import VotingArtifact from "../abi/Voting.json";

export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || "";
const TARGET_CHAIN_ID = 31337; // Anvil local
const TARGET_CHAIN_HEX = "0x7a69";

function getContract(signerOrProvider) {
  return new ethers.Contract(CONTRACT_ADDRESS, VotingArtifact.abi, signerOrProvider);
}

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
      // Request accounts first
      await window.ethereum.request({ method: "eth_requestAccounts" });

      // Switch to Anvil local network automatically
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: TARGET_CHAIN_HEX }],
        });
      } catch (switchErr) {
        // Chain not added yet — add it
        if (switchErr.code === 4902) {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [{
              chainId: TARGET_CHAIN_HEX,
              chainName: "Anvil Local",
              nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
              rpcUrls: ["http://localhost:8545"],
            }],
          });
        } else {
          throw switchErr;
        }
      }

      const _provider = new ethers.BrowserProvider(window.ethereum);
      const _signer   = await _provider.getSigner();
      const _account  = await _signer.getAddress();
      const { chainId: _chainId } = await _provider.getNetwork();

      if (Number(_chainId) !== TARGET_CHAIN_ID) {
        addToast(`Wrong network. Please switch to Anvil Local (chain 31337).`, "error");
        return;
      }

      setProvider(_provider);
      setSigner(_signer);
      setAccount(_account);
      setChainId(Number(_chainId));

      window.ethereum.on("accountsChanged", () => window.location.reload());
      window.ethereum.on("chainChanged",    () => window.location.reload());

      addToast("Wallet connected!", "success");

      // Load proposals immediately using the fresh provider (avoids stale closure)
      await loadProposals(_provider);
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
      setProposals(normalized.reverse());
    } catch (err) {
      addToast("Failed to load proposals: " + (err.reason ?? err.message), "error");
    }
  }, [provider, addToast]);

  // ── Register voter commitment ──────────────────────────────────────────────
  const registerVoter = useCallback(async (commitment) => {
    if (!signer || !CONTRACT_ADDRESS) {
      addToast("Connect your wallet first.", "error");
      return;
    }
    setLoading(true);
    try {
      const contract = getContract(signer);
      const tx = await contract.register(commitment);
      addToast("Registering… waiting for confirmation.");
      await tx.wait();
      addToast("Registered as voter! 🎉", "success");
    } catch (err) {
      addToast(parseError(err), "error");
    } finally {
      setLoading(false);
    }
  }, [signer, addToast]);

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

  // ── Cast ZK vote ───────────────────────────────────────────────────────────
  const castVote = useCallback(async (proposalId, support, pA, pB, pC, pubSignals) => {
    if (!signer || !CONTRACT_ADDRESS) {
      addToast("Connect your wallet first.", "error");
      return;
    }
    setLoading(true);
    try {
      const contract = getContract(signer);
      const tx = await contract.vote(proposalId, support, pA, pB, pC, pubSignals);
      addToast("Vote submitted. Waiting for confirmation…");
      await tx.wait();
      addToast(`Voted ${support ? "YES ✅" : "NO ❌"} anonymously!`, "success");
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

  return {
    account, chainId, proposals, loading, toasts,
    connect, loadProposals, createProposal, castVote, closeProposal, registerVoter,
  };
}

function parseError(err) {
  // Extract the 4-byte selector from raw revert data (CALL_EXCEPTION path)
  const data = err.data ?? err.error?.data ?? "";
  const selector = typeof data === "string" ? data.slice(0, 10).toLowerCase() : "";

  // Custom error selectors (cast sig "ErrorName(types)")
  if (selector === "0xdc215c0a") return "You have already voted on this proposal — your nullifier was already spent.";
  if (selector === "0xdd928d46") return "Your commitment is not registered. Click '🔑 Register to Vote' in the header first.";
  if (selector === "0x758b5539") return "This commitment is already registered.";
  if (selector === "0x09bde339") return "ZK proof verification failed. Make sure you're using the correct credentials file.";
  if (selector === "0x229329c7") return "Proof was generated for a different proposal — please regenerate.";

  // Fallback: try reason string matching
  const reason = err.reason ?? err.data?.message ?? err.message ?? "Unknown error";
  if (reason.includes("NullifierAlreadyUsed"))        return "You have already voted on this proposal — your nullifier was already spent.";
  if (reason.includes("CommitmentNotRegistered"))     return "Your commitment is not registered. Click '🔑 Register to Vote' in the header first.";
  if (reason.includes("CommitmentAlreadyRegistered")) return "This commitment is already registered.";
  if (reason.includes("InvalidProof"))                return "ZK proof verification failed. Make sure you're using the correct credentials file.";
  if (reason.includes("ProposalIdMismatch"))          return "Proof was generated for a different proposal — please regenerate.";
  if (reason.includes("ProposalClosed_Err"))          return "This proposal is already closed.";
  if (reason.includes("NotCreator"))                  return "Only the proposal creator can close it.";
  if (reason.includes("EmptyTitle"))                  return "Title cannot be empty.";
  if (reason.includes("user rejected"))               return "Transaction rejected.";
  return reason;
}
