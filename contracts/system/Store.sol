// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity 0.8.19;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { ERC721Enumerable } from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";

import { Drop, DripData } from "./Drop.sol";

/**
 * @author Maxime Aubanel - @sshmaxime
 *
 * @title Store
 */
contract Store is Ownable {
    // Total supply of DROPs
    uint256 private TOTAL_SUPPLY = 0;

    // Mappings

    // Mapping from drop id to drop contract
    mapping(uint256 => Drop) private dropIdToDrop;

    // Events

    // Event emitted when a DROP is created
    event DropCreated(uint256 indexed dropId);

    /**
     * @dev Returns the current supply.
     */
    function totalSupply() public view returns (uint256) {
        return TOTAL_SUPPLY;
    }

    /**
     * @dev Returns the DROP item matching the drop id.
     */
    function drop(uint256 dropId) public view returns (Drop) {
        return dropIdToDrop[dropId];
    }

    /**
     * @dev Create a DROP.
     */
    function createDrop(uint256 maxSupply, uint256 mintPrice, uint8 versions) public onlyOwner {
        uint256 dropId = totalSupply();
        dropIdToDrop[dropId] = new Drop(dropId, maxSupply, mintPrice, versions, msg.sender);
        TOTAL_SUPPLY++;

        emit DropCreated(dropId);
    }
}
