import hre from "hardhat";

async function main() {
  const { ethers } = await hre.network.create("creditcoin");
  const campaign = await ethers.getContractAt("Campaign", "0xF6F1A1B74C269DB78f100af34aC36B96a7bB7b52");
  const [creator, investor] = await ethers.getSigners();

  const pending = await campaign.pendingPayout(investor.address);
  console.log("Investor pending payout:", ethers.formatEther(pending), "CTC");

  const depositTx = await campaign.connect(creator).depositPayoutFunds({ value: pending });
  await depositTx.wait();
  console.log("Payout funds deposited.");

  const claimTx = await campaign.connect(investor).claimPayout();
  await claimTx.wait();
  console.log("Investor claimed payout.");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
