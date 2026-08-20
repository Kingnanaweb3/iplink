import hre from "hardhat";

async function main() {
  const { ethers } = await hre.network.create("creditcoin");

  const campaignAddress = "0xF6F1A1B74C269DB78f100af34aC36B96a7bB7b52";
  const campaign = await ethers.getContractAt("Campaign", campaignAddress);

  const [creator, investor] = await ethers.getSigners();

  const investTx = await campaign.connect(investor).invest({ value: ethers.parseEther("0.01") });
  await investTx.wait();
  console.log("Invested. Funded:", await campaign.funded());

  const releaseTx = await campaign.connect(creator).releaseCapital();
  await releaseTx.wait();
  console.log("Capital released to creator.");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
