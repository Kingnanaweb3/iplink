import hre from "hardhat";

const FACTORY = "0x5748fAf08a3e543841b2b2c6E677d4fb5F7EC6F1";
const DAY = 60 * 60 * 24;

const CAMPAIGNS = [
  {
    goal: "0.01",
    shareBps: 2500n,
    cap: "0.015",
    term: 90 * DAY,
    window: 30 * DAY,
    name: "Mira Royalty Share",
    symbol: "MIRA",
  },
  {
    goal: "0.01",
    shareBps: 2000n,
    cap: "0.014",
    term: 90 * DAY,
    window: 30 * DAY,
    name: "Nova Forge Share",
    symbol: "NOVA",
  },
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
    console.log(c.name, "->", event!.args.campaign);
  }
}

main().catch((err) => { console.error(err); process.exitCode = 1; });
