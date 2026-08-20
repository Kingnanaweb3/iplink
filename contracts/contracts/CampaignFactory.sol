// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./Campaign.sol";

contract CampaignFactory {
    address public immutable royaltyPayer;
    address[] public allCampaigns;

    event CampaignCreated(address indexed campaign, address indexed creator, uint256 raiseGoal);

    constructor(address _royaltyPayer) {
        royaltyPayer = _royaltyPayer;
    }

    function createCampaign(
        uint256 raiseGoal,
        uint256 revenueShareBps,
        uint256 returnCapAmount,
        uint256 termLengthSeconds,
        string calldata tokenName,
        string calldata tokenSymbol
    ) external returns (address) {
        Campaign campaign = new Campaign(
            msg.sender,
            royaltyPayer,
            raiseGoal,
            revenueShareBps,
            returnCapAmount,
            termLengthSeconds,
            tokenName,
            tokenSymbol
        );
        allCampaigns.push(address(campaign));
        emit CampaignCreated(address(campaign), msg.sender, raiseGoal);
        return address(campaign);
    }

    function getAllCampaigns() external view returns (address[] memory) {
        return allCampaigns;
    }
}
