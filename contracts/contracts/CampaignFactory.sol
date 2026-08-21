// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./Campaign.sol";

contract CampaignFactory {
    address public immutable royaltyPayer;
    address[] public allCampaigns;

    event CampaignCreated(address indexed campaign, address indexed creator, uint256 raiseGoal);

    error InvalidTerms();

    constructor(address _royaltyPayer) {
        royaltyPayer = _royaltyPayer;
    }

    function createCampaign(
        uint256 raiseGoal,
        uint256 revenueShareBps,
        uint256 returnCapAmount,
        uint256 termLengthSeconds,
        uint256 fundingWindowSeconds,
        string calldata tokenName,
        string calldata tokenSymbol
    ) external returns (address) {
        if (raiseGoal == 0) revert InvalidTerms();
        if (revenueShareBps == 0 || revenueShareBps > 10000) revert InvalidTerms();
        if (returnCapAmount < raiseGoal) revert InvalidTerms();
        if (termLengthSeconds == 0 || fundingWindowSeconds == 0) revert InvalidTerms();
        if (fundingWindowSeconds > termLengthSeconds) revert InvalidTerms();

        Campaign campaign = new Campaign(
            msg.sender,
            royaltyPayer,
            raiseGoal,
            revenueShareBps,
            returnCapAmount,
            termLengthSeconds,
            fundingWindowSeconds,
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
