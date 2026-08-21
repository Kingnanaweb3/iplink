import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("CampaignFactoryV3Module", (m) => {
  const royaltyPayer = "0xC8DA25fCd256Cd1642F83c78a0ccbD1bC65e52A5";
  const factory = m.contract("CampaignFactory", [royaltyPayer]);
  return { factory };
});
