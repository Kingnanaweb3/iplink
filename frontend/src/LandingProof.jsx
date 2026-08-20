import { useEffect, useState } from "react";
import { Check, ArrowUpRight, Wallet, FileCheck2, ShieldCheck, Coins } from "lucide-react";
import "./LandingProof.css";

const SEQUENCE = [
  { label: "Payment sent on Sepolia", Icon: Wallet },
  { label: "Inclusion proof generated", Icon: FileCheck2 },
  { label: "Verified on Creditcoin", Icon: ShieldCheck },
  { label: "Revenue recorded", Icon: Coins },
];

const RECEIPTS = [
  {
    label: "Royalty payment",
    network: "Sepolia",
    value: "0x3c08c62c032c064e51c4db1e3cec0de76b7f198305a18ae3caa86f8a6d8d4044",
    href: "https://sepolia.etherscan.io/tx/0x3c08c62c032c064e51c4db1e3cec0de76b7f198305a18ae3caa86f8a6d8d4044",
  },
  {
    label: "On-chain verification",
    network: "Creditcoin",
    value: "0x0fc20bba6470cea7bd6c3e7e38943c68d0b4e4acc279c27de15a03f2cf55cfc6",
    href: "https://creditcoin-testnet.blockscout.com/tx/0x0fc20bba6470cea7bd6c3e7e38943c68d0b4e4acc279c27de15a03f2cf55cfc6",
  },
  {
    label: "CampaignFactory",
    network: "Creditcoin",
    value: "0xF9923DF74FFA56cdcceAd8D4c2d16B32C61AB632",
    href: "https://creditcoin-testnet.blockscout.com/address/0xF9923DF74FFA56cdcceAd8D4c2d16B32C61AB632",
  },
];

function short(value) {
  return `${value.slice(0, 10)}…${value.slice(-8)}`;
}

export default function LandingProof() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setActive((prev) => (prev + 1) % (SEQUENCE.length + 1));
    }, 1700);
    return () => clearInterval(id);
  }, []);

  const complete = active >= SEQUENCE.length;
  const payout = complete ? "0.00025" : "0.00000";

  return (
    <section className="proof" id="proof">
      <div className="proof-head">
        <h2>
          Not a demo. <span className="proof-muted">Live on testnet.</span>
        </h2>
        <p>
          The sequence on the left runs on every verified payment. The transactions on the right are
          real ones it already produced — open them and check for yourself.
        </p>
      </div>

      <div className="proof-grid">
        <div className="proof-panel proof-sequence">
          <span className="proof-panel-label">Verification sequence</span>

          <ol className="seq-list">
            {SEQUENCE.map((step, i) => {
              const state = i < active ? "done" : i === active ? "active" : "pending";
              const { Icon } = step;
              return (
                <li className={`seq-step is-${state}`} key={step.label}>
                  <span className="seq-marker">
                    {state === "done" ? <Check size={13} strokeWidth={3} /> : <Icon size={14} strokeWidth={2} />}
                  </span>
                  <span className="seq-label">{step.label}</span>
                </li>
              );
            })}
          </ol>

          <div className={`seq-payout${complete ? " is-complete" : ""}`}>
            <div>
              <span className="seq-payout-label">Investor payout</span>
              <span className="seq-payout-value">{payout} CTC</span>
            </div>
            <span className="seq-payout-state">{complete ? "Claimable" : "Pending"}</span>
          </div>
        </div>

        <div className="proof-panel proof-receipts">
          <span className="proof-panel-label">On-chain receipts</span>

          <ul className="receipt-list">
            {RECEIPTS.map((item) => (
              <li key={item.value}>
                <a href={item.href} target="_blank" rel="noopener noreferrer">
                  <span className="receipt-top">
                    <span className="receipt-label">{item.label}</span>
                    <span className="receipt-network">{item.network}</span>
                  </span>
                  <span className="receipt-value">
                    {short(item.value)}
                    <ArrowUpRight size={13} strokeWidth={2} />
                  </span>
                </a>
              </li>
            ))}
          </ul>

          <a className="receipt-docs" href="/docs/iplink-technical-integration.html">
            Read the full technical write-up
            <ArrowUpRight size={13} strokeWidth={2} />
          </a>
        </div>
      </div>
    </section>
  );
}
