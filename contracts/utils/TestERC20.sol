// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity 0.8.19;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TestERC20 is ERC20 {
    constructor() ERC20("TEST_NAME", "TEST_SYMBOL") {}

    function mint() external payable {
        uint256 tokenId = totalSupply();
        _mint(msg.sender, tokenId);
    }
}
