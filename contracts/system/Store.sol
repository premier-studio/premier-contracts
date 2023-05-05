// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity 0.8.18;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { IERC721 } from "@openzeppelin/contracts/interfaces/IERC721.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/security/ReentrancyGuard.sol";

import { Drop, Drip, DripInfo, DropInfo, DripStatus } from "./Drop.sol";

/**
 * @author premierstudio.xyz
 *
 * @title Store
 */
contract Store is ReentrancyGuard, Ownable {
    // Total supply of Drops
    uint256 private DROP_SUPPLY = 0;

    // Mappings

    // Mapping from drop id to drop contract
    mapping(uint256 => Drop) private dropIdToDrop;

    // Events

    // Event emitted when a Drop is created
    event DropCreated(uint256 indexed dropId);

    // Event triggered when a Drip is minted
    event Minted(uint256 indexed dropId, uint256 indexed dripId);

    // Event triggered when a Drip is mutated
    event Mutated(uint256 indexed dropId, uint256 indexed dripId);

    // Event triggered when funds are withdrawn
    event Withdrawn(uint256 indexed dropId, uint256 fundsWithdrawn);

    // Errors

    error InvalidDropId();

    /**
     * @dev Returns the drop supply.
     */
    function dropSupply() public view returns (uint256) {
        return DROP_SUPPLY;
    }

    /**
     * @dev Returns the Drop contract matching the drop id.
     */
    function drop(uint256 dropId) public view returns (Drop) {
        if (dropId >= dropSupply()) {
            revert InvalidDropId();
        }

        return dropIdToDrop[dropId];
    }

    /**
     * @dev Returns the Drop info matching the drop id.
     */
    function dropInfo(uint256 dropId) external view returns (DropInfo memory) {
        return drop(dropId).dropInfo();
    }

    /**
     * @dev Returns the Drip info matching the drop id and drip id.
     */
    function dripInfo(uint256 dropId, uint256 dripId) external view returns (DripInfo memory) {
        return drop(dropId).dripInfo(dripId);
    }

    /**
     * @dev Set the contractURI of a Drop.
     */
    function setContractURI(uint256 dropId, string memory newURI) external onlyOwner {
        drop(dropId).setContractURI(newURI);
    }

    /**
     * @dev Set the dropURI of a DROP.
     */
    function setDropURI(uint256 dropId, string memory newURI) external onlyOwner {
        drop(dropId).setDropURI(newURI);
    }

    /**
     * @dev Set the baseURI of a Drop.
     */
    function setBaseURI(uint256 dropId, string memory newURI) external onlyOwner {
        drop(dropId).setBaseURI(newURI);
    }

    /**
     * @dev Create a Drop.
     */
    function createDrop(uint256 maxSupply, uint256 mintPrice, uint8 versions) external onlyOwner {
        uint256 dropId = dropSupply();
        dropIdToDrop[dropId] = new Drop(dropId, maxSupply, mintPrice, versions);

        DROP_SUPPLY++;

        emit DropCreated(dropId);
    }

    /**
     * @dev Mint a Drip.
     */
    function mint(uint256 dropId, uint8 versionId) external payable nonReentrant {
        uint256 dripId = drop(dropId).mint{ value: msg.value }(versionId, msg.sender);

        emit Minted(dropId, dripId);
    }

    /**
     * @dev Mutate a Drip.
     */
    function mutate(uint256 dropId, uint256 dripId, IERC721 tokenContract, uint256 tokenId) external nonReentrant {
        drop(dropId).mutate(dripId, tokenContract, tokenId, msg.sender);

        emit Mutated(dropId, dripId);
    }

    /**
     * @dev Withdraw funds from Drop.
     */
    function withdraw(uint256 dropId) external onlyOwner {
        uint256 balance = drop(dropId).withdraw(msg.sender);

        emit Withdrawn(dropId, balance);
    }
}
