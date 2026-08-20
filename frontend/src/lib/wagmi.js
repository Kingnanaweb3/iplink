import { http, createConfig } from "wagmi";
import { sepolia } from "wagmi/chains";
import { injected } from "wagmi/connectors";
import { defineChain } from "viem";

export const creditcoinTestnet = defineChain({
  id: 102031,
  name: "Creditcoin Testnet",
  nativeCurrency: { name: "Creditcoin", symbol: "CTC", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.cc3-testnet.creditcoin.network"] } },
  blockExplorers: { default: { name: "Blockscout", url: "https://creditcoin-testnet.blockscout.com" } },
});

export const config = createConfig({
  chains: [creditcoinTestnet, sepolia],
  connectors: [injected()],
  transports: {
    [creditcoinTestnet.id]: http(),
    [sepolia.id]: http(),
  },
});
