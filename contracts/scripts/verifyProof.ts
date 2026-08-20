import { blockProver, proofProvider } from "@gluwa/usc-sdk";
import { JsonRpcProvider } from "ethers";

const SEPOLIA_CHAIN_KEY = 1;
const PROVER_API_URL = process.env.PROVER_API_URL || "https://proof-gen-api.cc3-testnet.creditcoin.network";

async function main() {
  const txHash = process.env.TX_HASH;
  if (!txHash) {
    throw new Error("Set TX_HASH env var to the Sepolia tx hash you want to prove and verify");
  }

  const creditcoinProvider = new JsonRpcProvider(process.env.CREDITCOIN_RPC_URL);
  const prover = new blockProver.PrecompileBlockProver(creditcoinProvider);

  const proofBuilder = new proofProvider.service.ProofBuilder(SEPOLIA_CHAIN_KEY, PROVER_API_URL);
  const proofResult = await proofBuilder.getProof(txHash);

  if (!proofResult.success || !proofResult.data) {
    throw new Error(`Proof generation failed: ${proofResult.error}`);
  }

  const proofData = proofResult.data;

  const verificationResult = await prover.verifySingle(
    proofData.chainKey,
    proofData.headerNumber,
    proofData.txBytes,
    proofData.merkleProof,
    proofData.continuityProof,
  );

  console.log("Proof verification:", verificationResult ? "SUCCESS" : "FAILED");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
