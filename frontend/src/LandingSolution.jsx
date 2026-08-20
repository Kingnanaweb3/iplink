import { useEffect, useState } from "react";
import { Music, Gamepad2, PlaySquare, FileText } from "lucide-react";
import { getFactory, getCampaign, getVerifiedRevenueEvents } from "./lib/contracts";
import "./LandingSolution.css";

const CAPABILITIES = [
  { label: "Music royalties", note: "Streaming and sync income", Icon: Music },
  { label: "In-game revenue", note: "Item and cosmetic sales", Icon: Gamepad2 },
  { label: "Video & streaming", note: "Channel and platform payouts", Icon: PlaySquare },
  { label: "Licensed content", note: "Usage and licensing fees", Icon: FileText },
];

export default function LandingSolution() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const factory = getFactory();
        const addresses = await factory.getAllCampaigns();

        let eventCount = 0;
        for (const address of addresses) {
          const campaign = getCampaign(address);
          try {
            const logs = await getVerifiedRevenueEvents(campaign);
            eventCount += logs.length;
          } catch {
            // one campaign's log query failing shouldn't zero the whole count
          }
        }

        if (!cancelled) {
          setStats({ campaigns: addresses.length, events: eventCount, networks: 2 });
        }
      } catch {
        if (!cancelled) setStats(null);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return (
    <section className="solution" id="why">
      <div className="solution-inner">
        <div className="solution-copy">
          <h2>Any IP that earns can be financed</h2>
          <p>
            Traditional lenders can't underwrite a music catalog or a game's item sales — there's no
            way to prove the income is real. IPlink makes that income verifiable on-chain, so it
            becomes something a creator can actually raise against.
          </p>

          <div className="capability-grid">
            {CAPABILITIES.map(({ label, note, Icon }) => (
              <div className="capability" key={label}>
                <span className="capability-icon">
                  <Icon size={17} strokeWidth={1.9} />
                </span>
                <span className="capability-text">
                  <span className="capability-label">{label}</span>
                  <span className="capability-note">{note}</span>
                </span>
              </div>
            ))}
          </div>

          <div className="stat-row">
            <div className="stat">
              <div className="stat-value">{stats ? stats.campaigns : "—"}</div>
              <div className="stat-label">Campaigns live</div>
            </div>
            <div className="stat">
              <div className="stat-value">{stats ? stats.events : "—"}</div>
              <div className="stat-label">Verified revenue events</div>
            </div>
            <div className="stat">
              <div className="stat-value">{stats ? stats.networks : "—"}</div>
              <div className="stat-label">Networks connected</div>
            </div>
          </div>
        </div>

        <div className="solution-visual">
          <img src="/assets/hero-orbit.png" alt="Different kinds of earning IP connecting to a single verified hub" />
        </div>
      </div>
    </section>
  );
}
