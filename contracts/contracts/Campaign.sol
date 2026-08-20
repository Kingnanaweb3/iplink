// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./RevenueShareToken.sol";
import {USCBase} from "./USCBase.sol";
import {INativeQueryVerifier} from "./VerifierInterface.sol";
import {EvmV1Decoder} from "@gluwa/usc-contracts/contracts/write-ability/common/EvmV1Decoder.sol";

// Funding + revenue-share logic for a single creator campaign.
// Revenue is recorded only after Attestcoin verifies, on-chain, that a real
// payment transaction occurred on the source chain (Sepolia) via RoyaltyPayer.
// No trusted "attestor" role: anyone can submit a valid proof through
// USCBase.execute(), because trust comes from the cryptographic proof itself,
// not from who calls the function.
contract Campaign is USCBase {
    // PLACEHOLDER: paste the real hash from the id(...) command above
    bytes32 public constant ROYALTY_PAID_EVENT_SIGNATURE = 0xec59f72b70cc2908259b48da7dddca5c6026badbdb330b1a557811f07e7366df;

    address public immutable creator;
    address public immutable royaltyPayer; // Sepolia RoyaltyPayer contract address
    uint256 public immutable raiseGoal;
    uint256 public immutable revenueShareBps;
    uint256 public immutable returnCapAmount;
    uint256 public immutable termDeadline;

    RevenueShareToken public immutable shareToken;

    uint256 public totalRaised;
    uint256 public totalRepaidToInvestors;
    bool public funded;
    bool public rightsReverted;

    uint256 private constant PRECISION = 1e18;
    uint256 public cumulativeRevenuePerShare;
    mapping(address => uint256) public lastClaimedCumulative;

    event Invested(address indexed investor, uint256 amount, uint256 tokensMinted);
    event CapitalReleased(address indexed creator, uint256 amount);
    event RevenueVerified(uint256 amount);
    event PayoutClaimed(address indexed investor, uint256 amount);
    event RightsReverted();
    event PayoutFundsDeposited(address indexed from, uint256 amount);

    constructor(
        address _creator,
        address _royaltyPayer,
        uint256 _raiseGoal,
        uint256 _revenueShareBps,
        uint256 _returnCapAmount,
        uint256 _termLengthSeconds,
        string memory tokenName,
        string memory tokenSymbol
    ) {
        creator = _creator;
        royaltyPayer = _royaltyPayer;
        raiseGoal = _raiseGoal;
        revenueShareBps = _revenueShareBps;
        returnCapAmount = _returnCapAmount;
        termDeadline = block.timestamp + _termLengthSeconds;
        shareToken = new RevenueShareToken(tokenName, tokenSymbol, address(this));
    }

    function invest() external payable {
        require(!funded, "already funded");
        require(msg.value > 0, "zero investment");
        require(totalRaised + msg.value <= raiseGoal, "exceeds goal");

        totalRaised += msg.value;
        uint256 tokensToMint = msg.value;
        shareToken.mint(msg.sender, tokensToMint);
        lastClaimedCumulative[msg.sender] = cumulativeRevenuePerShare;

        emit Invested(msg.sender, msg.value, tokensToMint);

        if (totalRaised == raiseGoal) {
            funded = true;
        }
    }

    function releaseCapital() external {
        require(funded, "not funded yet");
        require(msg.sender == creator, "not creator");
        uint256 amount = address(this).balance;
        require(amount > 0, "nothing to release");
        (bool ok, ) = creator.call{value: amount}("");
        require(ok, "transfer failed");
        emit CapitalReleased(creator, amount);
    }

    // Anyone can top up the pool the contract pays investors from. In practice
    // this is the creator, moving real funds onto Creditcoin to match revenue
    // that's already been proven to have happened on the source chain.
    function depositPayoutFunds() external payable {
        require(msg.value > 0, "zero deposit");
        emit PayoutFundsDeposited(msg.sender, msg.value);
    }

    // Called by USCBase.execute() only after the precompile has verified the
    // proof and replay-protection has passed. This is the trustless entry
    // point that replaces the old "attestor" shortcut entirely.
    function _processAndEmitEvent(uint8 /* action */, bytes32 /* queryId */, bytes memory encodedTransaction) internal override {
        uint8 txType = EvmV1Decoder.getTransactionType(encodedTransaction);
        require(EvmV1Decoder.isValidTransactionType(txType), "Unsupported transaction type");

        EvmV1Decoder.ReceiptFields memory receipt = EvmV1Decoder.decodeReceiptFields(encodedTransaction);
        require(receipt.receiptStatus == 1, "Source transaction did not succeed");

        EvmV1Decoder.LogEntry[] memory logs = EvmV1Decoder.getLogsByEventSignature(receipt, ROYALTY_PAID_EVENT_SIGNATURE);
        require(logs.length > 0, "No RoyaltyPaid event found");

        EvmV1Decoder.LogEntry memory log = logs[0];

        // Only accept events from our known RoyaltyPayer contract on the source chain
        require(log.address_ == royaltyPayer, "Event not from registered RoyaltyPayer");
        require(log.topics.length == 3, "Invalid RoyaltyPaid topics");
        require(log.topics[0] == ROYALTY_PAID_EVENT_SIGNATURE, "Not RoyaltyPaid event");

        // topics[1] = payer, topics[2] = creator (both indexed)
        address paidCreator = address(uint160(uint256(log.topics[2])));
        require(paidCreator == creator, "Payment was not for this campaign's creator");

        (uint256 amount, ) = abi.decode(log.data, (uint256, string));
        require(amount > 0, "zero revenue amount");

        _recordVerifiedRevenue(amount);
    }

    function _recordVerifiedRevenue(uint256 revenueAmount) internal {
        require(funded, "not funded");
        require(!rightsReverted, "rights already reverted");

        uint256 investorShare = (revenueAmount * revenueShareBps) / 10000;
        uint256 supply = shareToken.totalSupply();
        require(supply > 0, "no investors");

        cumulativeRevenuePerShare += (investorShare * PRECISION) / supply;
        totalRepaidToInvestors += investorShare;

        emit RevenueVerified(revenueAmount);

        if (totalRepaidToInvestors >= returnCapAmount || block.timestamp >= termDeadline) {
            rightsReverted = true;
            emit RightsReverted();
        }
    }

    function claimPayout() external {
        uint256 balance = shareToken.balanceOf(msg.sender);
        require(balance > 0, "no shares");

        uint256 owed = (balance * (cumulativeRevenuePerShare - lastClaimedCumulative[msg.sender])) / PRECISION;
        require(owed > 0, "nothing to claim");
        require(address(this).balance >= owed, "payout pool underfunded, deposit needed");

        lastClaimedCumulative[msg.sender] = cumulativeRevenuePerShare;
        (bool ok, ) = msg.sender.call{value: owed}("");
        require(ok, "transfer failed");

        emit PayoutClaimed(msg.sender, owed);
    }

    function pendingPayout(address investor) external view returns (uint256) {
        uint256 balance = shareToken.balanceOf(investor);
        return (balance * (cumulativeRevenuePerShare - lastClaimedCumulative[investor])) / PRECISION;
    }

    receive() external payable {}
}
