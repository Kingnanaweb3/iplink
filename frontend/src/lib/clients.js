import { createPublicClient, http } from "viem";
import { sepolia } from "wagmi/chains";
import { creditcoinTestnet } from "./wagmi";

export const sepoliaPublicClient = createPublicClient({ chain: sepolia, transport: http() });
export const creditcoinPublicClient = createPublicClient({ chain: creditcoinTestnet, transport: http() });
