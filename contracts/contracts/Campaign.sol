// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./RevenueShareToken.sol";
import {USCBase} from "./USCBase.sol";
import {EvmV1Decoder} from "@gluwa/usc-contracts/contracts/write-ability/common/EvmV1Decoder.sol";

contract Campaign is USCBase {
    bytes32 public constant ROYALTY_PAID_EVENT_SIGNATURE =
        0xec59f72b70cc2908259b48da7dddca5c6026badbdb330b1a557811f07e7366df;

    uint256 private constant PRECISION = 1e18;
    uint256 public constant RESERVE_BPS = 4000; // 40% held back to cover payouts

    address public immutable creator;
    address public immutable royaltyPayer;
    uint256 public immutable raiseGoal;
    uint256 public immutable revenueShareBps;
    uint256 public immutable returnCapAmount;
    uint256 public immutable termDeadline;
    uint256 public immutable fundingDeadline;
    uint256 public immutable reserveAmount;

    RevenueShareToken public immutable shareToken;

    uint256 public totalRaised;
    uint256 public totalRepaidToInvestors;
    uint256 public cumulativeRevenuePerShare;
    uint256 public dustRemainder;
    bool public funded;
    bool public rightsReverted;
    bool public capitalReleased;

    mapping(address => uint256) public lastClaimedCumulative;
    mapping(address => uint256) public owedBalance;

    event Invested(address indexed investor, uint256 amount);
    event CapitalReleased(address indexed creator, uint256 amount);
    event RevenueVerified(uint256 amount);
    event PayoutClaimed(address indexed investor, uint256 amount);
    event Refunded(address indexed investor, uint256 amount);
    event RightsReverted();
    event PayoutFundsDeposited(address indexed from, uint256 amount);

    error NotCreator();
    error AlreadyFunded();
    error NotFunded();
    error CreatorCannotInvest();
    error FundingClosed();
    error FundingStillOpen();
    error ZeroAmount();
    error ExceedsGoal();
    error AlreadyReleased();
    error NothingOwed();
    error InsufficientBalance();
    error RightsAlreadyReverted();
    error TransferFailed();
    error WrongCampaign();
    error WrongCreator();
    error WrongSource();
    error BadTransaction();

    constructor(
        address _creator,
        address _royaltyPayer,
        uint256 _raiseGoal,
        uint256 _revenueShareBps,
        uint256 _returnCapAmount,
        uint256 _termLengthSeconds,
        uint256 _fundingWindowSeconds,
        string memory tokenName,
        string memory tokenSymbol
    ) {
        creator = _creator;
        royaltyPayer = _royaltyPayer;
        raiseGoal = _raiseGoal;
        revenueShareBps = _revenueShareBps;
        returnCapAmount = _returnCapAmount;
        termDeadline = block.timestamp + _termLengthSeconds;
        fundingDeadline = block.timestamp + _fundingWindowSeconds;
        reserveAmount = (_raiseGoal * RESERVE_BPS) / 10000;
        shareToken = new RevenueShareToken(tokenName, tokenSymbol, address(this));
    }

    // Moves anything the holder has accrued into owedBalance, then advances
    // their checkpoint. Called before any balance change so earnings can never
    // be wiped by a later invest().
    function _settle(address account) internal {
        uint256 balance = shareToken.balanceOf(account);
        uint256 checkpoint = lastClaimedCumulative[account];
        if (balance > 0 && cumulativeRevenuePerShare > checkpoint) {
            owedBalance[account] += (balance * (cumulativeRevenuePerShare - checkpoint)) / PRECISION;
        }
        lastClaimedCumulative[account] = cumulativeRevenuePerShare;
    }

    function invest() external payable {
        if (funded) revert AlreadyFunded();
        if (msg.sender == creator) revert CreatorCannotInvest();
        if (block.timestamp >= fundingDeadline) revert FundingClosed();
        if (msg.value == 0) revert ZeroAmount();
        if (totalRaised + msg.value > raiseGoal) revert ExceedsGoal();

        _settle(msg.sender);

        totalRaised += msg.value;
        shareToken.mint(msg.sender, msg.value);

        emit Invested(msg.sender, msg.value);

        if (totalRaised == raiseGoal) funded = true;
    }

    function refund() external {
        if (funded) revert AlreadyFunded();
        if (block.timestamp < fundingDeadline) revert FundingStillOpen();

        uint256 balance = shareToken.balanceOf(msg.sender);
        if (balance == 0) revert NothingOwed();
        if (address(this).balance < balance) revert InsufficientBalance();

        shareToken.burn(msg.sender, balance);
        totalRaised -= balance;

        (bool ok, ) = msg.sender.call{value: balance}("");
        if (!ok) revert TransferFailed();

        emit Refunded(msg.sender, balance);
    }

    function releaseCapital() external {
        if (msg.sender != creator) revert NotCreator();
        if (!funded) revert NotFunded();
        if (capitalReleased) revert AlreadyReleased();

        capitalReleased = true;
        uint256 amount = raiseGoal - reserveAmount;
        if (address(this).balance < amount) revert InsufficientBalance();

        (bool ok, ) = creator.call{value: amount}("");
        if (!ok) revert TransferFailed();

        emit CapitalReleased(creator, amount);
    }

    function depositPayoutFunds() external payable {
        if (msg.value == 0) revert ZeroAmount();
        emit PayoutFundsDeposited(msg.sender, msg.value);
    }

    function _processAndEmitEvent(uint8, bytes32, bytes memory encodedTransaction) internal override {
        uint8 txType = EvmV1Decoder.getTransactionType(encodedTransaction);
        if (!EvmV1Decoder.isValidTransactionType(txType)) revert BadTransaction();

        EvmV1Decoder.ReceiptFields memory receipt = EvmV1Decoder.decodeReceiptFields(encodedTransaction);
        if (receipt.receiptStatus != 1) revert BadTransaction();

        EvmV1Decoder.LogEntry[] memory logs =
            EvmV1Decoder.getLogsByEventSignature(receipt, ROYALTY_PAID_EVENT_SIGNATURE);
        if (logs.length == 0) revert BadTransaction();

        EvmV1Decoder.LogEntry memory log = logs[0];

        if (log.address_ != royaltyPayer) revert WrongSource();
        if (log.topics.length != 3) revert BadTransaction();

        // topics[1] is the campaign the payment was made for. Binding to it
        // stops one real payment being proven into several campaigns.
        if (address(uint160(uint256(log.topics[1]))) != address(this)) revert WrongCampaign();
        if (address(uint160(uint256(log.topics[2]))) != creator) revert WrongCreator();

        (uint256 amount, ) = abi.decode(log.data, (uint256, string));
        if (amount == 0) revert ZeroAmount();

        _recordVerifiedRevenue(amount);
    }

    function _recordVerifiedRevenue(uint256 revenueAmount) internal {
        if (!funded) revert NotFunded();
        if (rightsReverted) revert RightsAlreadyReverted();

        uint256 supply = shareToken.totalSupply();
        if (supply == 0) revert NotFunded();

        uint256 investorShare = (revenueAmount * revenueShareBps) / 10000;

        // Never credit past the cap. Capping instead of reverting means an
        // oversized payment can't permanently block the campaign.
        uint256 remaining = returnCapAmount - totalRepaidToInvestors;
        if (investorShare > remaining) investorShare = remaining;

        if (investorShare > 0) {
            uint256 numerator = investorShare * PRECISION + dustRemainder;
            cumulativeRevenuePerShare += numerator / supply;
            dustRemainder = numerator % supply;
            totalRepaidToInvestors += investorShare;
        }

        emit RevenueVerified(revenueAmount);

        if (totalRepaidToInvestors >= returnCapAmount || block.timestamp >= termDeadline) {
            rightsReverted = true;
            emit RightsReverted();
        }
    }

    function claimPayout() external {
        _settle(msg.sender);

        uint256 owed = owedBalance[msg.sender];
        if (owed == 0) revert NothingOwed();
        if (address(this).balance < owed) revert InsufficientBalance();

        owedBalance[msg.sender] = 0;

        (bool ok, ) = msg.sender.call{value: owed}("");
        if (!ok) revert TransferFailed();

        emit PayoutClaimed(msg.sender, owed);
    }

    function pendingPayout(address investor) external view returns (uint256) {
        uint256 balance = shareToken.balanceOf(investor);
        uint256 accrued;
        if (balance > 0 && cumulativeRevenuePerShare > lastClaimedCumulative[investor]) {
            accrued = (balance * (cumulativeRevenuePerShare - lastClaimedCumulative[investor])) / PRECISION;
        }
        return owedBalance[investor] + accrued;
    }

    // True only when the contract actually holds enough to settle what it owes.
    // Lets the interface distinguish "recorded as repaid" from "really payable".
    function isFullyBacked() external view returns (bool) {
        return address(this).balance >= (totalRepaidToInvestors - _totalClaimed());
    }

    function _totalClaimed() internal view returns (uint256) {
        uint256 deposited = totalRepaidToInvestors;
        return deposited > address(this).balance ? deposited - address(this).balance : 0;
    }

    receive() external payable {}
}
