// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity 0.8.19;

import { ERC721 } from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import { ERC721Enumerable } from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";

contract TestERC721 is ERC721Enumerable {
    constructor() ERC721("NAME", "SYMBOL") {}

    function mint() external payable {
        uint256 tokenId = totalSupply();
        _safeMint(msg.sender, tokenId);
    }
}
