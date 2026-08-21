// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";

// Source-chain stand-in for a distributor paying out royalties.
// Each payment names the campaign it belongs to, so a proof of this
// transaction can only ever be consumed by that one campaign.
contract RoyaltyPayer is Ownable {
    mapping(address => bool) public authorizedPayers;

    event RoyaltyPaid(
        address indexed campaign,
        address indexed creator,
        uint256 amount,
        string period
    );
    event PayerAuthorized(address indexed payer, bool allowed);

    error NotAuthorized();
    error ZeroPayment();
    error ForwardFailed();

    constructor() Ownable(msg.sender) {
        authorizedPayers[msg.sender] = true;
    }

    function setPayer(address payer, bool allowed) external onlyOwner {
        authorizedPayers[payer] = allowed;
        emit PayerAuthorized(payer, allowed);
    }

    function payRoyalty(address campaign, address payable creator, string calldata period)
        external
        payable
    {
        if (!authorizedPayers[msg.sender]) revert NotAuthorized();
        if (msg.value == 0) revert ZeroPayment();

        (bool ok, ) = creator.call{value: msg.value}("");
        if (!ok) revert ForwardFailed();

        emit RoyaltyPaid(campaign, creator, msg.value, period);
    }
}
