import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import "./LandingFooter.css";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "Launch app", to: "/app" },
      { label: "Browse campaigns", to: "/app" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Technical write-up", href: "/docs/iplink-technical-integration.html" },
      { label: "User guide", href: "/docs/iplink-user-guide.html" },
      { label: "Attestcoin Protocol", href: "https://docs.creditcoin.org/attestcoin-protocol" },
    ],
  },
  {
    title: "Project",
    links: [
      { label: "Creditcoin", href: "https://creditcoin.org" },
      { label: "BUIDL CTC 2026", href: "https://dorahacks.io" },
    ],
  },
];

function FooterLink({ link }) {
  if (link.to) {
    return <Link to={link.to}>{link.label}</Link>;
  }
  const external = link.href.startsWith("http");
  return (
    <a href={link.href} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined}>
      {link.label}
    </a>
  );
}

export default function LandingFooter() {
  return (
    <section className="closing">
      <div className="closing-cta">
        <h2>
          Turn verified revenue <span className="closing-muted">into capital.</span>
        </h2>
        <p>
          Browse live campaigns, check a creator's attested record, or read exactly how the
          verification works.
        </p>
        <div className="closing-actions">
          <Link to="/app" className="closing-pill solid">
            Launch app
            <ArrowUpRight size={13} strokeWidth={2.5} />
          </Link>
          <a href="/docs/iplink-technical-integration.html" className="closing-pill ghost">
            Read the docs
            <ArrowUpRight size={13} strokeWidth={2.5} />
          </a>
        </div>
      </div>

      <footer className="site-footer">
        <div className="footer-top">
          <div className="footer-brand">
            <img src="/assets/iplink-logo.png" alt="" className="footer-mark" />
            <span className="footer-name">IPlink</span>
            <p className="footer-tagline">
              Verified royalty financing, built on the Attestcoin Protocol.
            </p>
          </div>

          <div className="footer-columns">
            {COLUMNS.map((col) => (
              <div className="footer-col" key={col.title}>
                <span className="footer-col-title">{col.title}</span>
                {col.links.map((link) => (
                  <FooterLink link={link} key={link.label} />
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="footer-bottom">
          <span>Built for BUIDL CTC 2026 Fall. Deployed on public testnets.</span>
        </div>
      </footer>
    </section>
  );
}
