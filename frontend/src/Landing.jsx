import { Link } from "react-router-dom";
import LandingSolution from "./LandingSolution";
import LandingPipeline from "./LandingPipeline";
import LandingProof from "./LandingProof";
import LandingWhy from "./LandingWhy";
import LandingAudience from "./LandingAudience";
import LandingFaq from "./LandingFaq";
import LandingFooter from "./LandingFooter";
import "./Landing.css";

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 17L17 7M17 7H8M17 7v9" />
    </svg>
  );
}

export default function Landing() {
  return (
    <>
      <div className="hero">
      <div className="sweep" aria-hidden="true" />
      <div className="sweep-arc" aria-hidden="true" />
      <div className="sweep-glow" aria-hidden="true" />

      <nav className="landing-nav">
        <div className="nav-links">
          <a href="#how">How it works</a>
          <a href="#why">Why Attestcoin</a>
          <a href="/docs/iplink-technical-integration.html">Docs</a>
        </div>

        <Link to="/" className="brand">
          <img src="/assets/iplink-logo.png" alt="" className="brand-mark" />
          <span className="brand-name">IPlink</span>
        </Link>

        <div className="nav-cta">
          <Link to="/app" className="pill ghost small">Launch app</Link>
        </div>
      </nav>

      <div className="hero-body">
        <h1>
          <span className="line">Fund creators on proof.</span>
          <span className="line muted-line">Not promises.</span>
        </h1>

        <p className="hero-copy">
          IPlink turns a creator's future revenue into capital they can raise against today.
          Every payment is verified on-chain by the Attestcoin Protocol before a single payout
          moves — no oracle operator, no self-reported numbers, nothing anyone has to take on trust.
        </p>

        <div className="cta-row">
          <Link to="/app" className="pill solid">
            Launch app
            <ArrowIcon />
          </Link>
          <a href="/docs/iplink-technical-integration.html" className="pill ghost">
            Read the docs
            <ArrowIcon />
          </a>
        </div>
      </div>
      </div>

      <LandingSolution />
      <LandingWhy />
      <LandingPipeline />
      <LandingProof />
      <LandingAudience />
      <LandingFaq />
      <LandingFooter />
    </>
  );
}
