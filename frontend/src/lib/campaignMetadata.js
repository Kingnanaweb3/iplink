export const CAMPAIGN_METADATA = {
  "0x52ee0b89ed2255850de9e8b75c2808b84ab9c82c": {
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
  "0xef3e6889c4a4d3c8ebd85e4148da596ae5f4c815": {
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


export const CAMPAIGN_METADATA_3 = {
  "0x59652174bdd9a48e19f4896365595bd7783fdcb4": {
    title: "Halcyon Docs licensing",
    tagline: "Technical writing studio — licensing fees",
    description: "A documentation studio earning recurring licensing revenue from developer tooling companies that embed its reference material.",
    revenueModel: "Licensing fees settle quarterly through a source-chain payout contract. Each payment is proven on-chain via the Attestcoin Protocol before it affects this campaign.",
    illustration: "generic",
    usdGoal: 7200,
    usdCap: 10800,
  },
  "0xa2ae6715f2f97d6f3bc53dafa257c492b1285d64": {
    title: "Riverbed channel revenue",
    tagline: "Independent video channel — ad and sponsor income",
    description: "A long-running documentary channel with steady monthly ad revenue and recurring sponsorship placements.",
    revenueModel: "Platform payouts settle monthly through a source-chain payout contract, proven on-chain before any payout is recorded.",
    illustration: "generic",
    usdGoal: 4800,
    usdCap: 6720,
  },
  "0x69dc801340f9817d8a21ffe47d0d1268b5c75214": {
    title: "Atlas sound library",
    tagline: "Sample library — sync and usage royalties",
    description: "A production sound library earning per-use royalties from film, advertising and game studios licensing its catalog.",
    revenueModel: "Usage royalties are settled by the distributor through a source-chain payout contract and verified via Attestcoin before recording.",
    illustration: "music",
    usdGoal: 9000,
    usdCap: 12600,
  },
  "0x408374f67b28482d209cb2f72acb029e871aba57": {
    title: "Kettle illustration rights",
    tagline: "Illustrator — commercial licensing",
    description: "An illustrator licensing an existing body of work for commercial use across publishing, packaging and editorial.",
    revenueModel: "Licensing payments settle through a source-chain payout contract. Every payment is proven on-chain before it affects this campaign.",
    illustration: "generic",
    usdGoal: 3600,
    usdCap: 5400,
  },
  "0x953055d72e674d2aeacb13eb829abf2c1e89f18a": {
    title: "Northwind dataset access",
    tagline: "Data provider — subscription revenue",
    description: "A curated geospatial dataset earning recurring subscription revenue from research and logistics customers.",
    revenueModel: "Subscription revenue settles periodically through a source-chain payout contract, verified on-chain via the Attestcoin Protocol.",
    illustration: "generic",
    usdGoal: 12000,
    usdCap: 16200,
  },
};
Object.assign(CAMPAIGN_METADATA, CAMPAIGN_METADATA_3);

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
