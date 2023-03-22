// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity 0.8.19;

/**
 * @author Maxime Aubanel - @sshmaxime
 *
 * @title ITokenInterface
 */
interface ITokenInterface {
    function ownerOf(uint256) external returns (address);
}
