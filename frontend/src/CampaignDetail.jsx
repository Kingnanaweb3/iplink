import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { formatEther, parseEther } from "ethers";
import { useAccount, useWriteContract } from "wagmi";
import { getCampaign, getToken, campaignStatus, CAMPAIGN_ABI, getVerifiedRevenueEvents } from "./lib/contracts";
import { getCampaignMetadata } from "./lib/campaignMetadata";
import { creditcoinTestnet } from "./lib/wagmi";
import TriggerVerifyPanel from "./TriggerVerifyPanel";
import AssetHero from "./AssetHero";
import "./CampaignDetail.css";

function usd(n) {
  return n == null ? null : `$${n.toLocaleString()}`;
}

export default function CampaignDetail() {
  const { address } = useParams();
  const { address: connectedAddress, isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const meta = getCampaignMetadata(address);

  const [data, setData] = useState(null);
  const [events, setEvents] = useState([]);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [investAmount, setInvestAmount] = useState("0.01");
  const [depositAmount, setDepositAmount] = useState("");
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);
  const [actionPending, setActionPending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const campaign = getCampaign(address);
        const [raiseGoal, totalRaised, revenueShareBps, returnCapAmount, termDeadline, funded, totalRepaid, rightsReverted, tokenAddress, creator, fundingDeadline, reserveAmount, capitalReleased] =
          await Promise.all([
            campaign.raiseGoal(), campaign.totalRaised(), campaign.revenueShareBps(), campaign.returnCapAmount(),
            campaign.termDeadline(), campaign.funded(), campaign.totalRepaidToInvestors(), campaign.rightsReverted(),
            campaign.shareToken(), campaign.creator(), campaign.fundingDeadline(), campaign.reserveAmount(),
            campaign.capitalReleased(),
          ]);
        const token = getToken(tokenAddress);
        const name = await token.name();
        const pending = connectedAddress ? await campaign.pendingPayout(connectedAddress) : 0n;
        if (!cancelled) setData({ raiseGoal, totalRaised, revenueShareBps, returnCapAmount, termDeadline, funded, totalRepaid, rightsReverted, name, creator, pending, fundingDeadline, reserveAmount, capitalReleased });
        try {
          const logs = await getVerifiedRevenueEvents(campaign);
          if (!cancelled) setEvents(logs.reverse());
        } catch { if (!cancelled) setEvents([]); }
      } catch (err) {
        if (!cancelled) setError(err.message || String(err));
      }
    }
    load();
    return () => { cancelled = true; };
  }, [address, connectedAddress, refreshKey]);

  function refresh() { setRefreshKey((k) => k + 1); }

  async function runAction(fn, successMessage) {
    setActionError(null);
    setActionSuccess(null);
    setActionPending(true);
    try {
      await fn();
      await new Promise((r) => setTimeout(r, 3000));
      refresh();
      setActionSuccess(successMessage);
      setTimeout(() => setActionSuccess(null), 6000);
    } catch (err) {
      setActionError(err.shortMessage || err.message || String(err));
    } finally {
      setActionPending(false);
    }
  }

  if (error) return <div className="state-msg">Couldn't load this campaign: {error}</div>;
  if (!data) return <div className="state-msg">Loading campaign…</div>;

  const percent = data.raiseGoal > 0n ? Number((data.totalRaised * 10000n) / data.raiseGoal) / 100 : 0;
  const capMultiple = data.raiseGoal > 0n ? Number(formatEther(data.returnCapAmount)) / Number(formatEther(data.raiseGoal)) : 0;
  const deadline = new Date(Number(data.termDeadline) * 1000).toLocaleDateString();
  const status = campaignStatus(data);
  const isCreator = isConnected && connectedAddress?.toLowerCase() === data.creator.toLowerCase();
  const fundingClosed = Date.now() / 1000 >= Number(data.fundingDeadline);
  const fundingEnds = new Date(Number(data.fundingDeadline) * 1000).toLocaleDateString();
  const canRefund = !data.funded && fundingClosed;

  const remainingWei = data.raiseGoal - data.totalRaised;
  let investWei = null;
  try { investWei = investAmount ? parseEther(investAmount) : null; } catch { investWei = null; }
  const investExceeds = investWei !== null && investWei > remainingWei;
  const investInvalid = investWei === null || investWei <= 0n;

  return (
    <div className="stage">
      <div className="card wide">
        <Link to="/" className="back-link">&larr; All campaigns</Link>

        <AssetHero illustration={meta.illustration} />

        <div className="card-head">
          <div>
            <h2>{meta.title}</h2>
            <p className="muted">{meta.tagline}</p>
            <Link to={`/creator/${data.creator}`} className="creator-link">View attested credit record →</Link>
          </div>
          <span className={`badge ${status.tone === "verified" ? "verified" : "neutral"}`}>
            {status.tone === "verified" && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>}
            {status.label}
          </span>
        </div>

        <p className="asset-desc">{meta.description}</p>

        <div className="divider" />
        <div className="section-label">How revenue is generated</div>
        <p className="muted small">{meta.revenueModel}</p>

        <div className="divider" />
        <div className="section-label">Funding terms</div>
        <div className="terms-grid">
          <div className="terms-cell">
            <div className="terms-k">Creator wants</div>
            <div className="terms-v">{formatEther(data.raiseGoal)} CTC {usd(meta.usdGoal) && <span className="terms-usd">≈ {usd(meta.usdGoal)}</span>}</div>
          </div>
          <div className="terms-cell">
            <div className="terms-k">Investors receive</div>
            <div className="terms-v">{Number(data.revenueShareBps) / 100}% of verified revenue</div>
          </div>
          <div className="terms-cell">
            <div className="terms-k">Until total repaid reaches</div>
            <div className="terms-v">{capMultiple.toFixed(1)}x — {formatEther(data.returnCapAmount)} CTC {usd(meta.usdCap) && <span className="terms-usd">≈ {usd(meta.usdCap)}</span>}</div>
          </div>
          <div className="terms-cell">
            <div className="terms-k">Term ends</div>
            <div className="terms-v">{deadline}</div>
          </div>
        </div>

        <p className="muted small" style={{ marginTop: "12px" }}>
          {formatEther(data.reserveAmount)} CTC ({Number(data.reserveAmount * 10000n / data.raiseGoal) / 100}%) of the
          raise is held in the contract to cover investor payouts. The creator receives the remainder.
        </p>

        <div className="progress-row" style={{ marginTop: "20px" }}><span className="raised">{formatEther(data.totalRaised)} raised</span><span>Goal {formatEther(data.raiseGoal)}</span></div>
        <div className="progress-track"><div className="progress-fill" style={{ width: `${Math.min(percent, 100)}%` }} /></div>

        <div className="divider" />
        <div className="section-label">Attested revenue events</div>
        {events.length === 0 ? <p className="muted small">No verified revenue events yet.</p> : events.map((log, i) => (
          <div className="event-row" key={i}>
            <span className="left"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>Block {log.blockNumber}</span>
            <span className="amt">{formatEther(log.args.amount)}</span>
          </div>
        ))}

        <div className="divider" />
        {!isConnected && <p className="muted small">Connect a wallet to invest, trigger payments, or claim payouts.</p>}

        {isConnected && !data.funded && (
          <div className="action-block">
            <div className="section-label">Invest</div>
            <p className="muted small" style={{ marginBottom: "8px" }}>
              {formatEther(remainingWei)} CTC remaining · funding closes {fundingEnds}.
              If the goal isn't met, you can withdraw your full investment.
            </p>
            <div className="input-row">
              <input type="number" step="0.001" value={investAmount} onChange={(e) => setInvestAmount(e.target.value)} />
              <button className="cta small outline" type="button" onClick={() => setInvestAmount(formatEther(remainingWei))}>
                Max
              </button>
              <button className="cta small" disabled={actionPending || investExceeds || investInvalid} onClick={() => runAction(() =>
                writeContractAsync({ address, abi: CAMPAIGN_ABI, functionName: "invest", value: investWei, chainId: creditcoinTestnet.id }),
                "Investment confirmed."
              )}>{actionPending ? "Confirming…" : "Invest"}</button>
            </div>
            {investExceeds && (
              <p className="error-text" style={{ marginTop: "8px" }}>
                That's more than the {formatEther(remainingWei)} CTC remaining — reduce the amount or use Max.
              </p>
            )}
          </div>
        )}

        {isConnected && canRefund && (
          <div className="action-block">
            <div className="section-label">Funding goal not met</div>
            <p className="muted small" style={{ marginBottom: "10px" }}>
              This campaign closed without reaching its goal. Investors can withdraw their full
              contribution.
            </p>
            <button className="cta small" disabled={actionPending} onClick={() => runAction(() =>
              writeContractAsync({ address, abi: CAMPAIGN_ABI, functionName: "refund", chainId: creditcoinTestnet.id }),
              "Investment withdrawn."
            )}>{actionPending ? "Confirming…" : "Withdraw investment"}</button>
          </div>
        )}

        {isConnected && data.funded && !data.rightsReverted && (
          <div className="action-block">
            <div className="section-label">Verify a real royalty payment</div>
            <TriggerVerifyPanel campaignAddress={address} creatorAddress={data.creator} onVerified={refresh} />
          </div>
        )}

        {isConnected && data.pending > 0n && (
          <div className="payout-panel">
            <div><div className="label">Your pending payout</div><div className="value">{formatEther(data.pending)} CTC</div></div>
            <button className="claim-btn" disabled={actionPending} onClick={() => runAction(() =>
              writeContractAsync({ address, abi: CAMPAIGN_ABI, functionName: "claimPayout", chainId: creditcoinTestnet.id }),
              "Payout claimed — check your wallet balance."
            )}>{actionPending ? "Confirming…" : "Claim payout"}</button>
          </div>
        )}

        {isCreator && data.funded && (
          <div className="action-block">
            <div className="section-label">Creator actions</div>
            <button className="cta small outline" disabled={actionPending} onClick={() => runAction(() =>
              writeContractAsync({ address, abi: CAMPAIGN_ABI, functionName: "releaseCapital", chainId: creditcoinTestnet.id }),
              "Capital released to your wallet."
            )}>Release capital</button>
            <div className="input-row">
              <input type="number" step="0.0001" placeholder="Amount to deposit" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} />
              <button className="cta small outline" disabled={actionPending} onClick={() => runAction(() =>
                writeContractAsync({ address, abi: CAMPAIGN_ABI, functionName: "depositPayoutFunds", value: parseEther(depositAmount || "0"), chainId: creditcoinTestnet.id }),
                "Payout funds deposited."
              )}>Deposit payout funds</button>
            </div>
          </div>
        )}

        {actionSuccess && <p className="success-text">✓ {actionSuccess}</p>}
        {actionError && <p className="error-text">{actionError}</p>}
        <p className="muted small footnote">Contract: {address}</p>
      </div>
    </div>
  );
}
