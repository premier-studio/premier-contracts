// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity 0.8.19;

import { ITokenInterface } from "../tokens/ITokenInterface.sol";

interface ICustomNFT {
    function myFakeOwnerOf(uint256 tokenId) external returns (address);
}

contract CustomNFT is ICustomNFT {
    mapping(uint256 => address) tokenIdToOwner;

    constructor() {}

    function setOwner(uint256 tokenId, address newOwner) external {
        tokenIdToOwner[tokenId] = newOwner;
    }

    function myFakeOwnerOf(uint256 tokenId) external view returns (address) {
        return tokenIdToOwner[tokenId];
    }
}

contract CustomTokenInterface is ITokenInterface {
    CustomNFT immutable TOKEN;

    constructor(CustomNFT token) {
        TOKEN = token;
    }

    function ownerOf(uint256 tokenId) public view returns (address) {
        return TOKEN.myFakeOwnerOf(tokenId);
    }
}
