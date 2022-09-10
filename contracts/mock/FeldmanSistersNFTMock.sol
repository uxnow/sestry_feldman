// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "../FeldmanSistersNFT.sol";

contract FeldmanSistersNFTMock is FeldmanSistersNFT {
    constructor(
        string memory name_,
        string memory symbol_,
        uint256 supply_
    ) FeldmanSistersNFT(name_, symbol_) {
        maxTotalSupply = supply_;
    }
}
