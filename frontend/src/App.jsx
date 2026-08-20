import { BrowserRouter, Routes, Route, NavLink, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { getCtcUsdPrice } from "./lib/priceFeed";
import Landing from "./Landing";
import CampaignList from "./CampaignList";
import CampaignDetail from "./CampaignDetail";
import CreatorProfile from "./CreatorProfile";

function LivePrice() {
  const [price, setPrice] = useState(null);
  useEffect(() => { getCtcUsdPrice().then(setPrice); }, []);
  if (!price) return null;
  return (
    <span className="live-price">
      1 CTC ≈ ${price.toFixed(4)}
      <span className="live-price-tag">live</span>
    </span>
  );
}

function WalletButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected) {
    return (
      <button className="wallet-btn connected" onClick={() => disconnect()}>
        {address.slice(0, 6)}…{address.slice(-4)}
      </button>
    );
  }
  return (
    <button className="wallet-btn" onClick={() => connect({ connector: connectors[0] })} disabled={isPending}>
      {isPending ? "Connecting…" : "Connect wallet"}
    </button>
  );
}

function AppShell() {
  const location = useLocation();
  const isLanding = location.pathname === "/";

  return (
    <>
      {!isLanding && (
        <div className="topbar">
          <div className="topbar-left">
            <a href="/" className="logo"><img src="/assets/iplink-logo.png" alt="" className="mark" />IPlink</a>
            <nav className="topnav">
              <NavLink to="/app" end className={({ isActive }) => (isActive ? "active" : "")}>Campaigns</NavLink>
            </nav>
          </div>
          <div className="topbar-right">
            <LivePrice />
            <WalletButton />
          </div>
        </div>
      )}

      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/app" element={<CampaignList />} />
        <Route path="/campaign/:address" element={<CampaignDetail />} />
        <Route path="/creator/:address" element={<CreatorProfile />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}
