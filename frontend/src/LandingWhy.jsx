import { X, Check } from "lucide-react";
import "./LandingWhy.css";

const OPTIONS = [
  {
    verdict: "Rejected",
    title: "A token bridge",
    body: "Bridges move assets between chains. IPlink doesn't need to move anything — it needs to prove a payment happened where it happened. Right tool, wrong problem.",
    chosen: false,
  },
  {
    verdict: "Rejected",
    title: "A centralized oracle",
    body: "An operator reporting \"this payment happened\" reintroduces exactly the single point of trust that verification is supposed to remove. The pitch would undercut itself.",
    chosen: false,
  },
  {
    verdict: "Chosen",
    title: "Attestcoin Protocol",
    body: "Proves transaction inclusion using Merkle and continuity proofs, verified natively on Creditcoin in roughly one block. No operator, no async wait, no trust assumption.",
    chosen: true,
  },
];

export default function LandingWhy() {
  return (
    <section className="why" id="why-creditcoin">
      <div className="why-head">
        <h2>
          Not a bridge. <span className="why-muted">Not an oracle.</span>
        </h2>
        <p>
          Three approaches could have connected off-chain revenue to on-chain financing. Only one of
          them avoids putting someone back in the middle.
        </p>
      </div>

      <div className="why-grid">
        {OPTIONS.map((option) => (
          <article className={`why-card${option.chosen ? " is-chosen" : ""}`} key={option.title}>
            <span className="why-verdict">
              {option.chosen ? <Check size={13} strokeWidth={3} /> : <X size={13} strokeWidth={2.5} />}
              {option.verdict}
            </span>
            <h3>{option.title}</h3>
            <p>{option.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
