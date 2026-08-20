import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import "./LandingFaq.css";

const FAQS = [
  {
    q: "Is this a loan?",
    a: "No. There's no interest rate and no fixed repayment schedule. A creator sells a share of future revenue for capital now, and investors are repaid from that revenue until an agreed multiple is reached — then rights revert to the creator. If revenue never arrives, there's nothing to repay.",
  },
  {
    q: "What happens if the creator never earns anything?",
    a: "Investors are not repaid. This is unsecured revenue-share financing — there's no collateral backing it and no penalty mechanism. That risk is real, and we'd rather state it here than bury it. It's the same risk profile as revenue-based financing in traditional markets.",
  },
  {
    q: "How do you know the revenue is real?",
    a: "Every payment has to exist as a transaction on a supported source chain. The Attestcoin Protocol produces a Merkle inclusion proof for that exact transaction, and Creditcoin's Block Prover precompile verifies it on-chain before any campaign state changes. Nothing is self-reported.",
  },
  {
    q: "Who can trigger a verification?",
    a: "Anyone. The verification entry point has no access control, because trust comes from the proof itself rather than from who submits it. A creator can't fake a payment, and an investor doesn't need permission to check one.",
  },
  {
    q: "What happens when the return cap is reached?",
    a: "The campaign closes. Rights revert to the creator, and future revenue is entirely theirs again. The cap is set when the campaign is created and can't be changed afterward.",
  },
  {
    q: "Is this live on mainnet?",
    a: "No — it's deployed on public testnets, which is what this build was made for. Every contract address and transaction shown on this page is real and independently checkable on a block explorer, but the tokens involved are testnet tokens with no market value.",
  },
];

export default function LandingFaq() {
  const [open, setOpen] = useState(0);

  return (
    <section className="faq" id="faq">
      <div className="faq-head">
        <h2>
          Questions worth <span className="faq-muted">asking.</span>
        </h2>
      </div>

      <div className="faq-list">
        {FAQS.map((item, i) => {
          const isOpen = open === i;
          return (
            <div className={`faq-item${isOpen ? " is-open" : ""}`} key={item.q}>
              <button
                className="faq-question"
                onClick={() => setOpen(isOpen ? -1 : i)}
                aria-expanded={isOpen}
              >
                <span>{item.q}</span>
                {isOpen ? <Minus size={17} strokeWidth={2} /> : <Plus size={17} strokeWidth={2} />}
              </button>
              {isOpen && <p className="faq-answer">{item.a}</p>}
            </div>
          );
        })}
      </div>
    </section>
  );
}
