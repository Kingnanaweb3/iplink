import { proofProvider } from "@gluwa/usc-sdk";

const SEPOLIA_CHAIN_KEY = 1;
const PROVER_API_URL = process.env.PROVER_API_URL || "https://prover.usc-testnet.creditcoin.network";

async function main() {
  const txHash = process.env.TX_HASH;
  if (!txHash) {
    throw new Error("Set TX_HASH env var to the Sepolia tx hash you want to prove");
  }

  const proofBuilder = new proofProvider.service.ProofBuilder(SEPOLIA_CHAIN_KEY, PROVER_API_URL);
  const result = await proofBuilder.getProof(txHash);
  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
