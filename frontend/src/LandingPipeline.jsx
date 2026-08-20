import "./LandingPipeline.css";

const STEPS = [
  {
    num: "01",
    title: "Payment lands",
    body: "Revenue arrives on the source chain. A distributor pays out, a marketplace settles — a real transaction, somewhere else entirely.",
    footnote: "Ethereum Sepolia · chainKey 1",
  },
  {
    num: "02",
    title: "Proof generated",
    body: "Attestcoin produces a Merkle inclusion proof showing that exact transaction really occurred, in a real block, on that chain.",
    footnote: "Merkle + continuity proof",
  },
  {
    num: "03",
    title: "Verified on Creditcoin",
    body: "The Block Prover precompile checks the proof on-chain, in about one block. No operator decides what's true. Anyone can submit it.",
    footnote: "BlockProver · 0x0FD2",
    highlight: true,
  },
  {
    num: "04",
    title: "Revenue recorded",
    body: "Only then does the campaign update. The investor share is calculated and the payout becomes claimable — never before.",
    footnote: "RevenueVerified event",
  },
];

export default function LandingPipeline() {
  return (
    <section className="pipeline" id="how">
      <div className="pipeline-head">
        <h2>
          Every payout starts with <span className="pipeline-muted">a proof.</span>
        </h2>
        <p>
          Nothing in a campaign moves on a claim. Each step below has to actually happen, on-chain,
          before the next one can.
        </p>
      </div>

      <div className="pipeline-grid">
        {STEPS.map((step) => (
          <article
            className={`pipeline-card${step.highlight ? " is-highlight" : ""}`}
            key={step.num}
          >
            <span className="pipeline-num">{step.num}</span>
            <h3>{step.title}</h3>
            <p className="pipeline-body">{step.body}</p>
            <p className="pipeline-footnote">{step.footnote}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
