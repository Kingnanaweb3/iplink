// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// Sepolia-side stand-in for "the distributor/DSP paying Mira's royalties."
// Each call here is a real, verifiable Sepolia transaction that Attestcoin
// later proves actually happened, before Creditcoin releases a payout.
contract RoyaltyPayer {
    event RoyaltyPaid(address indexed payer, address indexed creator, uint256 amount, string period);

    function payRoyalty(address payable creator, string calldata period) external payable {
        require(msg.value > 0, "zero payment");
        (bool ok, ) = creator.call{value: msg.value}("");
        require(ok, "forward failed");
        emit RoyaltyPaid(msg.sender, creator, msg.value, period);
    }
}
