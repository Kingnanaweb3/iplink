import hre from "hardhat";

const ROYALTY_PAYER = "0xC8DA25fCd256Cd1642F83c78a0ccbD1bC65e52A5";

async function main() {
  const { ethers } = await hre.network.create("sepolia");
  const [creator, investor] = await ethers.getSigners();

  const payer = await ethers.getContractAt("RoyaltyPayer", ROYALTY_PAYER);
  const tx = await payer.connect(creator).setPayer(investor.address, true);
  await tx.wait();

  console.log("Authorized:", investor.address);
  console.log("Confirmed:", await payer.authorizedPayers(investor.address));
}

main().catch((err) => { console.error(err); process.exitCode = 1; });
