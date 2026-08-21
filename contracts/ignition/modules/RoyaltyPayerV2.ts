import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("RoyaltyPayerV2Module", (m) => {
  const royaltyPayer = m.contract("RoyaltyPayer");
  return { royaltyPayer };
});
