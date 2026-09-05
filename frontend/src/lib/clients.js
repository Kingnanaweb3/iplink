import { createPublicClient, http } from "viem";
import { sepolia } from "wagmi/chains";
import { creditcoinTestnet } from "./wagmi";

export const sepoliaPublicClient = createPublicClient({
  chain: sepolia,
  transport: http("https://ethereum-sepolia-rpc.publicnode.com"),
});
export const creditcoinPublicClient = createPublicClient({ chain: creditcoinTestnet, transport: http() });
