const HERO_IMAGES = {
  music: "/assets/mira-hero.png",
  game: "/assets/nova-forge-hero.png",
};

export default function AssetHero({ illustration }) {
  const imageSrc = HERO_IMAGES[illustration];

  if (imageSrc) {
    return (
      <div className="asset-hero">
        <img src={imageSrc} alt="" className="hero-img" />
      </div>
    );
  }

  return (
    <div className="asset-hero">
      <svg viewBox="0 0 480 180" preserveAspectRatio="xMidYMid slice" className="hero-svg">
        <defs>
          <linearGradient id="heroGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--blue-1)" />
            <stop offset="100%" stopColor="var(--blue-2)" />
          </linearGradient>
        </defs>
        <rect width="480" height="180" fill="url(#heroGrad)" rx="18" />
        <g fill="rgba(255,255,255,0.5)">
          <rect x="200" y="60" width="80" height="60" rx="10" fill="rgba(255,255,255,0.18)" />
          <path d="M220 90h40M220 100h30" stroke="rgba(255,255,255,0.5)" strokeWidth="3" strokeLinecap="round" />
        </g>
      </svg>
    </div>
  );
}
