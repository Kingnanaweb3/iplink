import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("CampaignFactoryV2Module", (m) => {
  const royaltyPayer = "0x764C566eED1EFb674Fd42f2d1dfa7FF29FCba6b3";
  const factory = m.contract("CampaignFactory", [royaltyPayer]);
  return { factory };
});
