import { expect } from "chai";
import hre from "hardhat";

const { ethers, networkHelpers } = await hre.network.create();

describe("Campaign", function () {
  async function deployFactoryFixture() {
    const [creator, investor, attestor] = await ethers.getSigners();
    const factory = await ethers.deployContract("CampaignFactory", [attestor.address]);
    return { factory, creator, investor, attestor };
  }

  it("runs the full funding -> revenue -> payout flow", async function () {
    const { factory, creator, investor, attestor } = await networkHelpers.loadFixture(deployFactoryFixture);

    const raiseGoal = ethers.parseEther("10");
    const revenueShareBps = 2500n; // 25%
    const returnCap = ethers.parseEther("15");
    const termLength = 60 * 60 * 24 * 30; // 30 days, for test purposes

    const tx = await factory.connect(creator).createCampaign(
      raiseGoal,
      revenueShareBps,
      returnCap,
      termLength,
      "Mira Royalty Share",
      "MIRA",
    );
    const receipt = await tx.wait();
    const parsedEvent = receipt!.logs
      .map((log) => {
        try {
          return factory.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find((parsed) => parsed?.name === "CampaignCreated");
    const campaignAddress = parsedEvent!.args.campaign as string;

    const campaign = await ethers.getContractAt("Campaign", campaignAddress);

    // Investor funds the full goal in one shot
    await campaign.connect(investor).invest({ value: raiseGoal });
    expect(await campaign.funded()).to.equal(true);

    // Creator releases capital
    const creatorBefore = await ethers.provider.getBalance(creator.address);
    await campaign.connect(creator).releaseCapital();
    const creatorAfter = await ethers.provider.getBalance(creator.address);
    expect(creatorAfter).to.be.greaterThan(creatorBefore);

    // Attestor records a verified revenue event - stands in for the USC proof
    // check until the real precompile call is wired in
    const revenueAmount = ethers.parseEther("2");
    await campaign.connect(attestor).recordVerifiedRevenue(revenueAmount, { value: revenueAmount });

    // Investor's share should be exactly 25% of that revenue
    const pending = await campaign.pendingPayout(investor.address);
    expect(pending).to.equal((revenueAmount * revenueShareBps) / 10000n);

    // Investor claims payout and their balance increases (net of gas)
    const investorBefore = await ethers.provider.getBalance(investor.address);
    const claimTx = await campaign.connect(investor).claimPayout();
    const claimReceipt = await claimTx.wait();
    const gasCost = claimReceipt!.gasUsed * claimReceipt!.gasPrice;
    const investorAfter = await ethers.provider.getBalance(investor.address);

    expect(investorAfter + gasCost).to.be.greaterThan(investorBefore);
  });
});
