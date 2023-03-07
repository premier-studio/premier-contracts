// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity 0.8.14;

import { ITokenInterface } from "../tokens/ITokenInterface.sol";

interface IUnusualNFT {
    function myFakeOwnerOf(uint256 tokenId) external returns (address);
}

contract UnusualNFT is IUnusualNFT {
    mapping(uint256 => address) tokenIdToOwner;

    constructor() {}

    function setOwner(uint256 tokenId, address newOwner) external {
        tokenIdToOwner[tokenId] = newOwner;
    }

    function myFakeOwnerOf(uint256 tokenId) external view returns (address) {
        return tokenIdToOwner[tokenId];
    }
}

contract TestTokenInterface is ITokenInterface {
    IUnusualNFT immutable TOKEN;

    constructor(IUnusualNFT token) {
        TOKEN = token;
    }

    function ownerOf(uint256 tokenId) public returns (address) {
        return TOKEN.myFakeOwnerOf(tokenId);
    }
}
