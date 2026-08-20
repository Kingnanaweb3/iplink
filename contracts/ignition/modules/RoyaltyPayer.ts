import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("RoyaltyPayerModule", (m) => {
  const royaltyPayer = m.contract("RoyaltyPayer");
  return { royaltyPayer };
});
