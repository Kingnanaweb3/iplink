import "dotenv/config";
import express from "express";
import cors from "cors";
import { proofProvider } from "@gluwa/usc-sdk";

const app = express();
app.use(cors());
app.use(express.json());

const SEPOLIA_CHAIN_KEY = 1;
const PROVER_API_URL = "https://proof-gen-api.cc3-testnet.creditcoin.network";

app.post("/generate-proof", async (req, res) => {
  const { txHash, blockNumber } = req.body;
  if (!txHash || !blockNumber) {
    return res.status(400).json({ success: false, error: "txHash and blockNumber are required" });
  }
  try {
    const proofBuilder = new proofProvider.service.ProofBuilder(SEPOLIA_CHAIN_KEY, PROVER_API_URL);
    await proofBuilder.waitUntilHeightAttested(SEPOLIA_CHAIN_KEY, Number(blockNumber));
    const result = await proofBuilder.getProof(txHash);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message || String(err) });
  }
});

app.get("/health", (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 8787;
app.listen(PORT, () => console.log(`Proof relay listening on port ${PORT}`));
