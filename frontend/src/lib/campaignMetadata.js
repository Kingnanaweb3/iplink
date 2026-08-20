export const CAMPAIGN_METADATA = {
  "0xf6f1a1b74c269db78f100af34ac36b96a7bb7b52": {
    title: "Mira's music catalog",
    tagline: "Independent artist — streaming royalties",
    description: "A catalog of released tracks earning recurring royalty income from streaming platforms and sync licensing deals.",
    revenueModel: "Mira's distributor pays out royalties monthly through a source-chain payout contract. Every payment is proven on-chain via the Attestcoin Protocol before it affects this campaign — nothing here is self-reported.",
    illustration: "music",
    usdGoal: 10000,
    usdCap: 15000,
  },
};

export const CAMPAIGN_METADATA_2 = {
  "0x8ad4bab556b519e35d8662edc791787f391fa62e": {
    title: "Nova Forge cosmetic sales",
    tagline: "Indie game studio — in-game item revenue",
    description: "A live-service game earning recurring revenue from cosmetic and item sales through its in-game marketplace.",
    revenueModel: "Nova Forge's marketplace contract settles item sales periodically through a source-chain payout contract. Every payment is proven on-chain via the Attestcoin Protocol before it affects this campaign.",
    illustration: "game",
    usdGoal: 6000,
    usdCap: 9000,
  },
};
Object.assign(CAMPAIGN_METADATA, CAMPAIGN_METADATA_2);

export function getCampaignMetadata(address) {
  return (
    CAMPAIGN_METADATA[address.toLowerCase()] || {
      title: "IP revenue campaign",
      tagline: "Verified royalty financing",
      description: "Details for this campaign haven't been added yet.",
      revenueModel: "Revenue events are verified on-chain via the Attestcoin Protocol before being recorded.",
      illustration: "generic",
      usdGoal: null,
      usdCap: null,
    }
  );
}
