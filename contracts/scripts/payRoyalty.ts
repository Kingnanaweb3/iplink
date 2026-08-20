import { JsonRpcProvider, Wallet, Contract, parseEther } from "ethers";

const ROYALTY_PAYER_ADDRESS = "0x764C566eED1EFb674Fd42f2d1dfa7FF29FCba6b3";
const ROYALTY_PAYER_ABI = [
  "function payRoyalty(address creator, string period) external payable",
];

async function main() {
  const provider = new JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
  const distributor = new Wallet(process.env.ATTESTOR_PRIVATE_KEY!, provider);
  const creator = new Wallet(process.env.CREATOR_PRIVATE_KEY!, provider);

  const royaltyPayer = new Contract(ROYALTY_PAYER_ADDRESS, ROYALTY_PAYER_ABI, distributor);

  const tx = await royaltyPayer.payRoyalty(creator.address, "2026-08", {
    value: parseEther("0.001"),
  });
  const receipt = await tx.wait();
  console.log("Royalty payment tx hash:", receipt?.hash);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
