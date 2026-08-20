import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { formatEther } from "ethers";
import { getFactory, getCampaign, campaignStatus } from "./lib/contracts";
import { getCampaignMetadata } from "./lib/campaignMetadata";
import AssetIcon from "./AssetIcon";
import "./CampaignList.css";

export default function CampaignList() {
  const [campaigns, setCampaigns] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const factory = getFactory();
        const addresses = await factory.getAllCampaigns();

        const results = await Promise.all(
          addresses.map(async (address) => {
            const campaign = getCampaign(address);
            const [raiseGoal, totalRaised, revenueShareBps, funded, totalRepaid, rightsReverted] =
              await Promise.all([
                campaign.raiseGoal(),
                campaign.totalRaised(),
                campaign.revenueShareBps(),
                campaign.funded(),
                campaign.totalRepaidToInvestors(),
                campaign.rightsReverted(),
              ]);
            const meta = getCampaignMetadata(address);

            return {
              address,
              meta,
              raiseGoal,
              totalRaised,
              revenueShareBps,
              status: campaignStatus({ funded, totalRepaid, rightsReverted }),
            };
          })
        );

        if (!cancelled) setCampaigns(results);
      } catch (err) {
        if (!cancelled) setError(err.message || String(err));
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  if (error) return <div className="state-msg">Couldn't load campaigns: {error}</div>;
  if (!campaigns) return <div className="state-msg">Loading campaigns…</div>;
  if (campaigns.length === 0) return <div className="state-msg">No campaigns yet.</div>;

  return (
    <div className="list-grid">
      {campaigns.map((c) => {
        const percent = c.raiseGoal > 0n ? Number((c.totalRaised * 10000n) / c.raiseGoal) / 100 : 0;
        return (
          <Link to={`/campaign/${c.address}`} className="list-card" key={c.address}>
            <div className="list-card-head">
              <AssetIcon illustration={c.meta.illustration} />
              <span className={`badge ${c.status.tone === "verified" ? "verified" : "neutral"}`}>
                {c.status.tone === "verified" && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>
                )}
                {c.status.label}
              </span>
            </div>
            <h3>{c.meta.title}</h3>
            <p className="list-tagline">{c.meta.tagline}</p>
            <div className="list-progress-track">
              <div className="list-progress-fill" style={{ width: `${Math.min(percent, 100)}%` }} />
            </div>
            <div className="list-progress-row">
              <span>{formatEther(c.totalRaised)} raised</span>
              <span>{Number(c.revenueShareBps) / 100}% share</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
