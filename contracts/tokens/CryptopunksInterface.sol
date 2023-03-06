// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity 0.8.14;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { ERC721 } from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import { ERC721Enumerable } from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import { IERC721 } from "@openzeppelin/contracts/interfaces/IERC721.sol";
import { Strings } from "@openzeppelin/contracts/utils/Strings.sol";

import { ITokenInterface } from "./ITokenInterface.sol";

/**
 * @author Maxime Aubanel - @sshmaxime
 *
 * @title ICryptopunks
 */
interface ICryptopunks {
    function punkIndexToAddress(uint256 tokenId) external returns (address);

    function name() external view returns (string memory);

    function symbol() external view returns (string memory);
}

/**
 * @author Maxime Aubanel - @sshmaxime
 *
 * @title CryptopunksInterface
 */
contract CryptopunksInterface is ITokenInterface {
    ICryptopunks immutable TOKEN;

    constructor(ICryptopunks token) {
        TOKEN = token;
    }

    function ownerOf(uint256 tokenId) public returns (address) {
        return TOKEN.punkIndexToAddress(tokenId);
    }

    function name() public view returns (string memory) {
        return TOKEN.name();
    }

    function symbol() public view returns (string memory) {
        return TOKEN.symbol();
    }
}
