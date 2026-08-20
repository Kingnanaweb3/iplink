import { useState } from "react";
import { CircleCheck } from "lucide-react";
import "./LandingAudience.css";

const AUDIENCES = {
  creators: {
    tag: "For creators",
    headline: "Raise against income you already earn",
    body: "You don't need a bank to understand your catalog, and you don't need to sell it. Put a slice of future revenue up, take capital now, keep ownership.",
    points: [
      "Keep full ownership of your IP — you're selling a share of revenue, not the asset",
      "No credit check, no collateral, no institution deciding whether your work counts",
      "Every verified payment builds a portable record you can reuse on your next raise",
      "Investors are repaid from revenue, capped at an agreed multiple, then rights revert",
    ],
  },
  investors: {
    tag: "For investors",
    headline: "Underwrite income you can actually check",
    body: "Every number on a campaign came from a transaction proven on-chain. Nothing is self-reported, and no operator sits between you and the truth.",
    points: [
      "Revenue history is cryptographically verified, not submitted by the creator",
      "Check a creator's full attested record before committing a single token",
      "Payouts are calculated on-chain the moment revenue is verified",
      "Unsecured revenue share — real risk, disclosed up front, not hidden in terms",
    ],
  },
};

export default function LandingAudience() {
  const [active, setActive] = useState("creators");
  const current = AUDIENCES[active];

  return (
    <section className="audience" id="audience">
      <div className="audience-head">
        <h2>
          Two sides. <span className="audience-muted">One verified record.</span>
        </h2>

        <div className="audience-toggle" role="tablist">
          {Object.entries(AUDIENCES).map(([key, value]) => (
            <button
              key={key}
              role="tab"
              aria-selected={active === key}
              className={`audience-tab${active === key ? " is-active" : ""}`}
              onClick={() => setActive(key)}
            >
              {value.tag}
            </button>
          ))}
        </div>
      </div>

      <div className="audience-panel">
        <div className="audience-copy">
          <h3>{current.headline}</h3>
          <p>{current.body}</p>
        </div>

        <ul className="audience-points">
          {current.points.map((point) => (
            <li key={point}>
              <CircleCheck className="audience-check" size={19} strokeWidth={2} />
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
