import { JsonRpcProvider, Contract } from "ethers";
import { parseAbi } from "viem";

export const CREDITCOIN_RPC_URL = "https://rpc.cc3-testnet.creditcoin.network";
export const FACTORY_ADDRESS = "0x5748fAf08a3e543841b2b2c6E677d4fb5F7EC6F1";
export const ROYALTY_PAYER_ADDRESS = "0xC8DA25fCd256Cd1642F83c78a0ccbD1bC65e52A5";

const FACTORY_ABI_STR = ["function getAllCampaigns() view returns (address[])"];

const CAMPAIGN_ABI_STR = [
  "function creator() view returns (address)",
  "function raiseGoal() view returns (uint256)",
  "function revenueShareBps() view returns (uint256)",
  "function returnCapAmount() view returns (uint256)",
  "function termDeadline() view returns (uint256)",
  "function shareToken() view returns (address)",
  "function totalRaised() view returns (uint256)",
  "function totalRepaidToInvestors() view returns (uint256)",
  "function funded() view returns (bool)",
  "function rightsReverted() view returns (bool)",
  "function pendingPayout(address investor) view returns (uint256)",
  "function fundingDeadline() view returns (uint256)",
  "function capitalReleased() view returns (bool)",
  "function reserveAmount() view returns (uint256)",
  "function isFullyBacked() view returns (bool)",
  "function refund()",
  "function invest() payable",
  "function releaseCapital()",
  "function depositPayoutFunds() payable",
  "function claimPayout()",
  "function execute(uint8 action, uint64 chainKey, uint64 blockHeight, bytes encodedTransaction, bytes32 merkleRoot, (bytes32 hash, bool isLeft)[] siblings, bytes32 lowerEndpointDigest, bytes32[] continuityRoots) returns (bool)",
  "event RevenueVerified(uint256 amount)",
];

const TOKEN_ABI_STR = ["function name() view returns (string)", "function symbol() view returns (string)"];
const ROYALTY_PAYER_ABI_STR = ["function payRoyalty(address campaign, address creator, string period) payable"];

export const CAMPAIGN_ABI = parseAbi(CAMPAIGN_ABI_STR);
export const ROYALTY_PAYER_ABI = parseAbi(ROYALTY_PAYER_ABI_STR);

let providerInstance = null;
export function getProvider() {
  if (!providerInstance) providerInstance = new JsonRpcProvider(CREDITCOIN_RPC_URL);
  return providerInstance;
}
export function getFactory() { return new Contract(FACTORY_ADDRESS, FACTORY_ABI_STR, getProvider()); }
export function getCampaign(address) { return new Contract(address, CAMPAIGN_ABI_STR, getProvider()); }
export function getToken(address) { return new Contract(address, TOKEN_ABI_STR, getProvider()); }

export function campaignStatus({ funded, totalRepaid, rightsReverted }) {
  if (rightsReverted) return { label: "Completed", tone: "neutral" };
  if (totalRepaid > 0n) return { label: "Revenue verified", tone: "verified" };
  if (funded) return { label: "Funded", tone: "neutral" };
  return { label: "Raising", tone: "neutral" };
}

async function queryLogsChunked(contract, filter, fromBlock, toBlock) {
  try {
    return await contract.queryFilter(filter, fromBlock, toBlock);
  } catch {
    if (toBlock - fromBlock <= 1) return [];
    const mid = fromBlock + Math.floor((toBlock - fromBlock) / 2);
    const [left, right] = await Promise.all([
      queryLogsChunked(contract, filter, fromBlock, mid),
      queryLogsChunked(contract, filter, mid + 1, toBlock),
    ]);
    return [...left, ...right];
  }
}

export async function getVerifiedRevenueEvents(campaign) {
  const provider = getProvider();
  const latest = await provider.getBlockNumber();
  const fromBlock = latest > 50000 ? latest - 50000 : 0;
  return queryLogsChunked(campaign, campaign.filters.RevenueVerified(), fromBlock, latest);
}
