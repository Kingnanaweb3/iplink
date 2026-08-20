export default function AssetIcon({ illustration }) {
  return (
    <div className="asset-icon">
      {illustration === "game" ? (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="8" width="20" height="10" rx="4"/><circle cx="7" cy="13" r="1"/><circle cx="17" cy="13" r="1"/>
        </svg>
      ) : illustration === "music" ? (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="4" width="16" height="16" rx="3"/>
        </svg>
      )}
    </div>
  );
}
