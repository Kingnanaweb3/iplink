import hre from "hardhat";

const FACTORY = "0x5748fAf08a3e543841b2b2c6E677d4fb5F7EC6F1";
const DAY = 60 * 60 * 24;

const CAMPAIGNS = [
  { goal: "0.012", shareBps: 3000n, cap: "0.018",  term: 120 * DAY, window: 45 * DAY, name: "Halcyon Docs Licensing",   symbol: "HALC" },
  { goal: "0.008", shareBps: 1800n, cap: "0.0112", term: 90  * DAY, window: 30 * DAY, name: "Riverbed Channel Share",   symbol: "RVBD" },
  { goal: "0.015", shareBps: 2200n, cap: "0.021",  term: 150 * DAY, window: 60 * DAY, name: "Atlas Sound Library",      symbol: "ATLS" },
  { goal: "0.006", shareBps: 2800n, cap: "0.009",  term: 90  * DAY, window: 30 * DAY, name: "Kettle Illustration Share",symbol: "KTTL" },
  { goal: "0.02",  shareBps: 1500n, cap: "0.027",  term: 180 * DAY, window: 60 * DAY, name: "Northwind Dataset Share",  symbol: "NWND" },
];

async function main() {
  const { ethers } = await hre.network.create("creditcoin");
  const factory = await ethers.getContractAt("CampaignFactory", FACTORY);
  const [creator] = await ethers.getSigners();

  for (const c of CAMPAIGNS) {
    const tx = await factory.connect(creator).createCampaign(
      ethers.parseEther(c.goal),
      c.shareBps,
      ethers.parseEther(c.cap),
      c.term,
      c.window,
      c.name,
      c.symbol,
    );
    const receipt = await tx.wait();
    const event = receipt!.logs
      .map((l) => { try { return factory.interface.parseLog(l); } catch { return null; } })
      .find((p) => p?.name === "CampaignCreated");
    console.log(`${event!.args.campaign}  // ${c.name}`);
  }
}

main().catch((err) => { console.error(err); process.exitCode = 1; });
