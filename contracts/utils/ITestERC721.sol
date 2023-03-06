// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity 0.8.14;

import { IERC721 } from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import { IERC721Enumerable } from "@openzeppelin/contracts/token/ERC721/extensions/IERC721Enumerable.sol";

/**
 * @author Maxime Aubanel - @sshmaxime
 *
 * @title ITestERC721
 */
interface ITestERC721 is IERC721, IERC721Enumerable {
    function mint() external payable;

    function mintTest() external payable;
}
