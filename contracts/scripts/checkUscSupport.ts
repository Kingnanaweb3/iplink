import { JsonRpcProvider } from "ethers";
import { chainInfo } from "@gluwa/usc-sdk";

async function main() {
  const creditcoinProvider = new JsonRpcProvider(process.env.CREDITCOIN_RPC_URL);
  const chainInfoProvider = new chainInfo.PrecompileChainInfoProvider(creditcoinProvider);

  const supportedChains = await chainInfoProvider.getSupportedChains();
  console.log("Supported source chains:", supportedChains);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
