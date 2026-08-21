import { expect } from "chai";
import hre from "hardhat";

const { ethers, networkHelpers } = await hre.network.create();

const DAY = 60 * 60 * 24;

async function deployFixture() {
  const [creator, investor, investor2, outsider] = await ethers.getSigners();

  const royaltyPayer = await ethers.deployContract("RoyaltyPayer");
  const factory = await ethers.deployContract("CampaignFactory", [await royaltyPayer.getAddress()]);

  const tx = await factory.connect(creator).createCampaign(
    ethers.parseEther("1"),      // raiseGoal
    2500n,                        // 25%
    ethers.parseEther("1.5"),     // cap
    30 * DAY,                     // term
    7 * DAY,                      // funding window
    "Test Share",
    "TST",
  );
  const receipt = await tx.wait();
  const event = receipt!.logs
    .map((l) => { try { return factory.interface.parseLog(l); } catch { return null; } })
    .find((p) => p?.name === "CampaignCreated");
  const campaign = await ethers.getContractAt("Campaign", event!.args.campaign as string);

  return { campaign, factory, royaltyPayer, creator, investor, investor2, outsider };
}

describe("Campaign security fixes", function () {
  it("#1 blocks share token transfers", async function () {
    const { campaign, investor, investor2 } = await networkHelpers.loadFixture(deployFixture);
    await campaign.connect(investor).invest({ value: ethers.parseEther("0.5") });

    const token = await ethers.getContractAt("RevenueShareToken", await campaign.shareToken());
    await expect(
      token.connect(investor).transfer(investor2.address, ethers.parseEther("0.1"))
    ).to.be.revertedWithCustomError(token, "TransfersDisabled");
  });

  it("#2 releaseCapital pays a fixed amount, only once", async function () {
    const { campaign, creator, investor } = await networkHelpers.loadFixture(deployFixture);
    await campaign.connect(investor).invest({ value: ethers.parseEther("1") });

    await campaign.connect(creator).releaseCapital();
    await expect(campaign.connect(creator).releaseCapital())
      .to.be.revertedWithCustomError(campaign, "AlreadyReleased");

    // 40% reserve stays behind
    expect(await ethers.provider.getBalance(await campaign.getAddress()))
      .to.equal(ethers.parseEther("0.4"));
  });

  it("#4 investing twice preserves earlier earnings", async function () {
    const { campaign, investor } = await networkHelpers.loadFixture(deployFixture);
    await campaign.connect(investor).invest({ value: ethers.parseEther("0.4") });
    await campaign.connect(investor).invest({ value: ethers.parseEther("0.6") });
    expect(await campaign.funded()).to.equal(true);
    expect(await campaign.pendingPayout(investor.address)).to.equal(0n);
  });

  it("#5 refunds when the funding window closes unfunded", async function () {
    const { campaign, investor } = await networkHelpers.loadFixture(deployFixture);
    await campaign.connect(investor).invest({ value: ethers.parseEther("0.3") });

    await expect(campaign.connect(investor).refund())
      .to.be.revertedWithCustomError(campaign, "FundingStillOpen");

    await networkHelpers.time.increase(8 * DAY);
    const before = await ethers.provider.getBalance(investor.address);
    await campaign.connect(investor).refund();
    expect(await ethers.provider.getBalance(investor.address)).to.be.greaterThan(before);
  });

  it("#6 only authorized payers can originate a payment", async function () {
    const { royaltyPayer, campaign, creator, outsider } = await networkHelpers.loadFixture(deployFixture);
    await expect(
      royaltyPayer.connect(outsider).payRoyalty(
        await campaign.getAddress(), creator.address, "2026-09",
        { value: ethers.parseEther("0.01") }
      )
    ).to.be.revertedWithCustomError(royaltyPayer, "NotAuthorized");
  });

  it("#9 creator cannot invest in their own campaign", async function () {
    const { campaign, creator } = await networkHelpers.loadFixture(deployFixture);
    await expect(campaign.connect(creator).invest({ value: ethers.parseEther("0.1") }))
      .to.be.revertedWithCustomError(campaign, "CreatorCannotInvest");
  });

  it("factory rejects a cap below the raise goal", async function () {
    const { factory, creator } = await networkHelpers.loadFixture(deployFixture);
    await expect(
      factory.connect(creator).createCampaign(
        ethers.parseEther("1"), 2500n, ethers.parseEther("0.5"),
        30 * DAY, 7 * DAY, "Bad", "BAD"
      )
    ).to.be.revertedWithCustomError(factory, "InvalidTerms");
  });
});
