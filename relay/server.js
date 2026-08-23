import "dotenv/config";
import express from "express";
import cors from "cors";
import { randomUUID } from "crypto";
import { proofProvider } from "@gluwa/usc-sdk";

const app = express();
app.use(cors({
  origin: true,
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
}));
app.options(/.*/, cors());
app.use(express.json());

const SEPOLIA_CHAIN_KEY = 1;
const PROVER_API_URL = "https://proof-gen-api.cc3-testnet.creditcoin.network";

// In-memory job store. Single instance, jobs are short-lived, so this is
// sufficient. A multi-instance deployment would need shared storage.
const jobs = new Map();
const JOB_TTL_MS = 30 * 60 * 1000;

setInterval(() => {
  const now = Date.now();
  for (const [id, job] of jobs) {
    if (now - job.createdAt > JOB_TTL_MS) jobs.delete(id);
  }
}, 5 * 60 * 1000);

async function runProofJob(jobId, txHash, blockNumber) {
  const job = jobs.get(jobId);
  try {
    const builder = new proofProvider.service.ProofBuilder(SEPOLIA_CHAIN_KEY, PROVER_API_URL);

    job.stage = "awaiting-attestation";
    await builder.waitUntilHeightAttested(SEPOLIA_CHAIN_KEY, Number(blockNumber));

    job.stage = "generating";
    const result = await builder.getProof(txHash);

    if (!result.success || !result.data) {
      job.status = "failed";
      job.error = result.error || "Proof generation failed";
      return;
    }

    job.status = "complete";
    job.data = result.data;
  } catch (err) {
    job.status = "failed";
    job.error = err.message || String(err);
  }
}

app.post("/generate-proof", (req, res) => {
  const { txHash, blockNumber } = req.body;
  if (!txHash || !blockNumber) {
    return res.status(400).json({ success: false, error: "txHash and blockNumber are required" });
  }

  const jobId = randomUUID();
  jobs.set(jobId, { status: "pending", stage: "queued", createdAt: Date.now() });

  // fire and forget - the client polls for the result
  runProofJob(jobId, txHash, blockNumber);

  res.json({ success: true, jobId });
});

app.get("/proof-status/:jobId", (req, res) => {
  const job = jobs.get(req.params.jobId);
  if (!job) return res.status(404).json({ success: false, error: "Job not found or expired" });

  if (job.status === "complete") return res.json({ success: true, status: "complete", data: job.data });
  if (job.status === "failed") return res.json({ success: false, status: "failed", error: job.error });
  return res.json({ success: true, status: "pending", stage: job.stage });
});

app.get("/health", (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 8787;
app.listen(PORT, () => console.log(`Proof relay listening on port ${PORT}`));
