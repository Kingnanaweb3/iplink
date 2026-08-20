import hre from "hardhat";

async function main() {
  const { ethers } = await hre.network.create("creditcoin");

  const factoryAddress = "0xF9923DF74FFA56cdcceAd8D4c2d16B32C61AB632";
  const factory = await ethers.getContractAt("CampaignFactory", factoryAddress);

  const [creator] = await ethers.getSigners();

  const raiseGoal = ethers.parseEther("0.01"); // testnet-scale amount
  const revenueShareBps = 2500n; // 25%
  const returnCap = ethers.parseEther("0.015"); // 1.5x
  const termLength = 60 * 60 * 24 * 30; // 30 days

  const tx = await factory.connect(creator).createCampaign(
    raiseGoal,
    revenueShareBps,
    returnCap,
    termLength,
    "IPLink Royalty Share",
    "IPLR",
  );
  const receipt = await tx.wait();

  const event = receipt!.logs
    .map((log) => {
      try {
        return factory.interface.parseLog(log);
      } catch {
        return null;
      }
    })
    .find((parsed) => parsed?.name === "CampaignCreated");

  console.log("Campaign created at:", event!.args.campaign);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
