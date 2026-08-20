import hre from "hardhat";
import { proofProvider } from "@gluwa/usc-sdk";
import { Contract, Wallet, JsonRpcProvider, parseEther } from "ethers";

const ROYALTY_PAYER_ADDRESS = "0x764C566eED1EFb674Fd42f2d1dfa7FF29FCba6b3";
const ROYALTY_PAYER_ABI = [
  "function payRoyalty(address creator, string period) external payable",
];
const SEPOLIA_CHAIN_KEY = 1;
const PROVER_API_URL = "https://proof-gen-api.cc3-testnet.creditcoin.network";
const CAMPAIGN_ADDRESS = "0xF6F1A1B74C269DB78f100af34aC36B96a7bB7b52";

async function main() {
  // 1. Trigger a real royalty payment on Sepolia
  const sepoliaProvider = new JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
  const distributor = new Wallet(process.env.ATTESTOR_PRIVATE_KEY!, sepoliaProvider);
  const creatorWallet = new Wallet(process.env.CREATOR_PRIVATE_KEY!, sepoliaProvider);

  const royaltyPayer = new Contract(ROYALTY_PAYER_ADDRESS, ROYALTY_PAYER_ABI, distributor);
  const payTx = await royaltyPayer.payRoyalty(creatorWallet.address, "2026-09", {
    value: parseEther("0.001"),
  });
  const payReceipt = await payTx.wait();
  console.log("Royalty payment tx:", payReceipt?.hash);

  // 2. Generate the inclusion proof
  const proofBuilder = new proofProvider.service.ProofBuilder(SEPOLIA_CHAIN_KEY, PROVER_API_URL);
  await proofBuilder.waitUntilHeightAttested(SEPOLIA_CHAIN_KEY, payReceipt!.blockNumber);
  const proofResult = await proofBuilder.getProof(payReceipt!.hash);

  if (!proofResult.success || !proofResult.data) {
    throw new Error(`Proof generation failed: ${proofResult.error}`);
  }
  const proof = proofResult.data;
  console.log("Proof generated for header:", proof.headerNumber);

  // 3. Call Campaign.execute() directly on Creditcoin - no attestor, no trust
  const { ethers } = await hre.network.create("creditcoin");
  const [creatorSigner] = await ethers.getSigners();
  const campaign = await ethers.getContractAt("Campaign", CAMPAIGN_ADDRESS);

  const tx = await campaign.connect(creatorSigner).execute(
    0, // action - unused by Campaign, kept for USCBase interface compatibility
    proof.chainKey,
    proof.headerNumber,
    proof.txBytes,
    proof.merkleProof.root,
    proof.merkleProof.siblings,
    proof.continuityProof.lowerEndpointDigest,
    proof.continuityProof.roots,
  );
  const receipt = await tx.wait();
  console.log("execute() tx:", receipt?.hash);
  console.log("Total repaid to investors so far:", (await campaign.totalRepaidToInvestors()).toString());
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
