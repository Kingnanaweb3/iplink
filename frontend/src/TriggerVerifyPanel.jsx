import { useState } from "react";
import { useSwitchChain, useWriteContract } from "wagmi";
import { sepolia } from "wagmi/chains";
import { parseEther } from "ethers";
import { creditcoinTestnet } from "./lib/wagmi";
import { sepoliaPublicClient, creditcoinPublicClient } from "./lib/clients";
import { ROYALTY_PAYER_ADDRESS, ROYALTY_PAYER_ABI, CAMPAIGN_ABI } from "./lib/contracts";

const RELAY_URL = import.meta.env.VITE_RELAY_URL || "https://iplink-production.up.railway.app/generate-proof";
const STEPS = ["Payment sent on Sepolia", "Generating inclusion proof", "Verified on Creditcoin"];

export default function TriggerVerifyPanel({ campaignAddress, creatorAddress, onVerified }) {
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const [stepIndex, setStepIndex] = useState(-1);
  const [error, setError] = useState(null);
  const [running, setRunning] = useState(false);

  async function run() {
    setRunning(true);
    setError(null);
    setStepIndex(0);
    try {
      await switchChainAsync({ chainId: sepolia.id });
      const payTxHash = await writeContractAsync({
        address: ROYALTY_PAYER_ADDRESS,
        abi: ROYALTY_PAYER_ABI,
        functionName: "payRoyalty",
        args: [campaignAddress, creatorAddress, new Date().toISOString().slice(0, 7)],
        value: parseEther("0.001"),
        chainId: sepolia.id,
      });
      const receipt = await sepoliaPublicClient.waitForTransactionReceipt({
        hash: payTxHash,
        timeout: 180_000,
        pollingInterval: 4_000,
      });

      setStepIndex(1);
      const startRes = await fetch(RELAY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ txHash: payTxHash, blockNumber: receipt.blockNumber.toString() }),
      });
      const startJson = await startRes.json();
      if (!startJson.success || !startJson.jobId) {
        throw new Error(startJson.error || "Could not start proof generation");
      }

      // Attestation can take several minutes, so we poll short requests
      // instead of holding one long connection open through the proxy.
      const statusUrl = RELAY_URL.replace("/generate-proof", "/proof-status/");
      const deadline = Date.now() + 15 * 60 * 1000;
      let proof = null;

      while (Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, 5000));
        const pollRes = await fetch(statusUrl + startJson.jobId);
        const poll = await pollRes.json();

        if (poll.status === "complete") { proof = poll.data; break; }
        if (poll.status === "failed") throw new Error(poll.error || "Proof generation failed");
      }

      if (!proof) throw new Error("Proof generation timed out after 15 minutes");

      setStepIndex(2);
      await switchChainAsync({ chainId: creditcoinTestnet.id });
      const execTxHash = await writeContractAsync({
        address: campaignAddress,
        abi: CAMPAIGN_ABI,
        functionName: "execute",
        args: [0, proof.chainKey, proof.headerNumber, proof.txBytes, proof.merkleProof.root, proof.merkleProof.siblings, proof.continuityProof.lowerEndpointDigest, proof.continuityProof.roots],
        chainId: creditcoinTestnet.id,
      });
      await creditcoinPublicClient.waitForTransactionReceipt({
        hash: execTxHash,
        timeout: 180_000,
        pollingInterval: 3_000,
      });

      setStepIndex(3);
      onVerified?.();
    } catch (err) {
      setError(err.shortMessage || err.message || String(err));
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="trigger-panel">
      <button className="cta" onClick={run} disabled={running}>{running ? "Running…" : "Trigger royalty payment"}</button>
      {stepIndex >= 0 && (
        <div className="stepper">
          {STEPS.map((label, i) => (
            <div className="step" key={label}>
              <div className={`step-dot ${i < stepIndex ? "done" : i === stepIndex ? "active" : "pending"}`}>
                {i < stepIndex && <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>}
                {i === stepIndex && <span className="pulse" />}
              </div>
              <span className={`step-text ${i < stepIndex ? "done" : i === stepIndex ? "active" : "pending"}`}>{label}</span>
            </div>
          ))}
        </div>
      )}
      {error && <p className="error-text">{error}</p>}
    </div>
  );
}
