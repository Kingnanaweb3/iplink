// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// Non-transferable by design. Payout accounting keys off a per-holder
// checkpoint, so a transfer would let a fresh address re-claim the entire
// cumulative history. Secondary trading needs checkpointed balances, which
// is out of scope for this version.
contract RevenueShareToken is ERC20, Ownable {
    error TransfersDisabled();

    constructor(string memory name_, string memory symbol_, address campaign)
        ERC20(name_, symbol_)
        Ownable(campaign)
    {}

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    function burn(address from, uint256 amount) external onlyOwner {
        _burn(from, amount);
    }

    function _update(address from, address to, uint256 value) internal override {
        // allow mint (from == 0) and burn (to == 0), block holder-to-holder
        if (from != address(0) && to != address(0)) revert TransfersDisabled();
        super._update(from, to, value);
    }
}
