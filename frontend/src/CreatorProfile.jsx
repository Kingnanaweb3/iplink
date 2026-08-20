import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { formatEther } from "ethers";
import { getFactory, getCampaign, getToken, getVerifiedRevenueEvents } from "./lib/contracts";
import "./CampaignDetail.css";
import "./CreatorProfile.css";

export default function CreatorProfile() {
  const { address } = useParams();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const factory = getFactory();
        const allAddresses = await factory.getAllCampaigns();
        const owned = [];
        for (const campAddress of allAddresses) {
          const campaign = getCampaign(campAddress);
          const creator = await campaign.creator();
          if (creator.toLowerCase() === address.toLowerCase()) owned.push({ address: campAddress, campaign });
        }

        let totalRaised = 0n;
        let totalVerified = 0n;
        const timeline = [];
        const campaignSummaries = [];

        for (const { address: campAddress, campaign } of owned) {
          const [totalRaisedForCamp, tokenAddress] = await Promise.all([campaign.totalRaised(), campaign.shareToken()]);
          const token = getToken(tokenAddress);
          const name = await token.name();
          totalRaised += totalRaisedForCamp;

          let logs = [];
          try { logs = await getVerifiedRevenueEvents(campaign); } catch { logs = []; }

          for (const log of logs) {
            totalVerified += log.args.amount;
            timeline.push({ campaignAddress: campAddress, campaignName: name, amount: log.args.amount, blockNumber: log.blockNumber });
          }
          campaignSummaries.push({ address: campAddress, name });
        }

        timeline.sort((a, b) => b.blockNumber - a.blockNumber);
        if (!cancelled) setProfile({ campaignCount: owned.length, totalRaised, totalVerified, timeline, campaigns: campaignSummaries });
      } catch (err) {
        if (!cancelled) setError(err.message || String(err));
      }
    }
    load();
    return () => { cancelled = true; };
  }, [address]);

  if (error) return <div className="state-msg">Couldn't load this creator's record: {error}</div>;
  if (!profile) return <div className="state-msg">Loading attested record…</div>;

  const shortAddress = `${address.slice(0, 6)}…${address.slice(-4)}`;

  return (
    <div className="stage">
      <div className="card wide">
        <Link to="/" className="back-link">&larr; All campaigns</Link>

        <div className="profile-head">
          <div className="asset-icon-lg" />
          <div>
            <div className="profile-eyebrow">Attested credit record</div>
            <h2 title={address}>{shortAddress}</h2>
          </div>
        </div>
        <p className="muted profile-desc">
          Every row below is a real, independently verified on-chain event, not self-reported. No campaign owner can add an entry to this record themselves.
        </p>

        <div className="divider" />

        <div className="metric-grid">
          <div className="metric"><div className="metric-label">Campaigns</div><div className="metric-value">{profile.campaignCount}</div></div>
          <div className="metric"><div className="metric-label">Total raised</div><div className="metric-value">{formatEther(profile.totalRaised)}</div></div>
          <div className="metric"><div className="metric-label">Verified events</div><div className="metric-value">{profile.timeline.length}</div></div>
          <div className="metric"><div className="metric-label">Verified revenue</div><div className="metric-value">{formatEther(profile.totalVerified)}</div></div>
        </div>

        {profile.campaigns.length > 0 && (
          <>
            <div className="divider" />
            <div className="section-label">Campaigns</div>
            <div className="terms-row">
              {profile.campaigns.map((c) => (
                <Link to={`/campaign/${c.address}`} className="term-chip chip-link" key={c.address}>{c.name}</Link>
              ))}
            </div>
          </>
        )}

        <div className="divider" />
        <div className="section-label">Verification timeline</div>
        {profile.timeline.length === 0 ? (
          <p className="muted small">No verified revenue events yet for this creator.</p>
        ) : (
          profile.timeline.map((event, i) => (
            <div className="event-row" key={i}>
              <span className="left"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>{event.campaignName} — Block {event.blockNumber}</span>
              <span className="amt">{formatEther(event.amount)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
