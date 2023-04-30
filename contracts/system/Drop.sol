// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity 0.8.18;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { ERC721 } from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import { ERC721Enumerable } from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import { IERC721 } from "@openzeppelin/contracts/interfaces/IERC721.sol";
import { Strings } from "@openzeppelin/contracts/utils/Strings.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import { IERC165 } from "@openzeppelin/contracts/utils/introspection/IERC165.sol";

/**
 * @dev A struct representing the status of a Drip.
 */
enum DripStatus {
    DEFAULT,
    MUTATED
}

/**
 * @dev A struct representing the mutation of a Drip.
 */
struct DripMutation {
    address tokenContract;
    uint256 tokenId;
}

/**
 * @dev A struct representing a Drip.
 */
struct Drip {
    // Drip Metadata
    uint8 version;
    // Drip Status
    DripStatus status;
    // Drip Mutation
    DripMutation mutation;
}

/**
 * @dev A struct representing the general information of a Drop.
 */
struct DropInfo {
    // Drop Identification
    address _contract;
    string symbol;
    string name;
    uint256 id;
    // Drop Info
    uint256 currentSupply;
    uint256 maxSupply;
    uint256 price;
    uint8 versions;
    // Drop URIs
    string contractURI;
    string dropURI;
    string baseURI;
}

/**
 * @dev A struct representing the general information of a Drip.
 */
struct DripInfo {
    // Drip Identification
    uint256 id;
    // Drip Info
    address owner;
    // Drip Metadata
    Drip drip;
}

/**
 * @author Maxime Aubanel - @sshmaxime
 *
 * @title Drop
 */
contract Drop is ERC721Enumerable, Ownable, ReentrancyGuard {
    string public constant NAME_PREFIX = "DROP#";
    string public constant SYMBOL_PREFIX = "DROP#";

    // Contract's URI
    string private CONTRACT_URI = "";

    // Drop's URI
    string private DROP_URI = "";

    // Drips's base URI
    string private BASE_URI = "";

    // Immutables

    // The id of the Drop
    uint256 private immutable DROP_ID;

    // The maximum supply of the Drop
    uint256 private immutable MAX_SUPPLY;

    // The price to mint the Drip
    uint256 private immutable PRICE;

    // The number of versions
    uint8 private immutable VERSIONS; // starts at version 1, cannot be 0

    // Mappings

    // Mapping from drip id to Drip
    mapping(uint256 => Drip) private dripIdToDrip;

    // Errors

    error AlreadyMutated();

    error InvalidMaxSupply();
    error InvalidVersions();
    error InvalidVersionId();
    error InvalidDripId();
    error InvalidPrice();
    error InvalidDripOwner();
    error InvalidTokenOwner();

    error MaxSupplyReached();

    error UnsupportedTokenContract();

    constructor(
        uint256 id,
        uint256 _maxSupply,
        uint256 _price,
        uint8 _versions
    ) ERC721(string.concat(NAME_PREFIX, Strings.toString(id)), string.concat(SYMBOL_PREFIX, Strings.toString(id))) {
        // Drop should have at least one Drip
        if (_maxSupply == 0) {
            revert InvalidMaxSupply();
        }

        // Drop should have at least one version
        if (_versions == 0) {
            revert InvalidVersions();
        }

        DROP_ID = id;
        MAX_SUPPLY = _maxSupply;
        PRICE = _price;
        VERSIONS = _versions;
    }

    /**
     * @dev Returns the general information of the Drop.
     */
    function dropInfo() public view returns (DropInfo memory) {
        return
            DropInfo({
                _contract: address(this),
                symbol: symbol(),
                name: name(),
                id: dropId(),
                maxSupply: maxSupply(),
                versions: versions(),
                price: price(),
                currentSupply: totalSupply(),
                contractURI: contractURI(),
                dropURI: dropURI(),
                baseURI: baseURI()
            });
    }

    /**
     * @dev Returns the Drip matching the Drip id.
     */
    function dripInfo(uint256 dripId) public view returns (DripInfo memory) {
        Drip memory _drip = dripIdToDrip[dripId];

        if (dripId >= totalSupply()) {
            revert InvalidDripId();
        }

        return DripInfo({ id: dripId, owner: this.ownerOf(dripId), drip: _drip });
    }

    /**
     * @dev Returns the id of the Drop.
     */
    function dropId() public view returns (uint256) {
        return DROP_ID;
    }

    /**
     * @dev Returns the maximum supply of the Drop.
     */
    function maxSupply() public view returns (uint256) {
        return MAX_SUPPLY;
    }

    /**
     * @dev Returns the price to mint a Drip from this Drop.
     */
    function price() public view returns (uint256) {
        return PRICE;
    }

    /**
     * @dev Returns the versions of the mint.
     */
    function versions() public view returns (uint8) {
        return VERSIONS;
    }

    /**
     * @dev Returns the contract URI.
     */
    function contractURI() public view returns (string memory) {
        return CONTRACT_URI;
    }

    /**
     * @dev Set the contract URI.
     */
    function setContractURI(string memory newURI) public onlyOwner {
        CONTRACT_URI = newURI;
    }

    /**
     * @dev Returns the URI of the metadata of the Drop.
     */
    function dropURI() public view returns (string memory) {
        return DROP_URI;
    }

    /**
     * @dev Set the URI of the metadata of the Drop.
     */
    function setDropURI(string memory newURI) public onlyOwner {
        DROP_URI = newURI;
    }

    /**
     * @dev Returns the baseURI.
     */
    function baseURI() public view returns (string memory) {
        return BASE_URI;
    }

    /**
     * @dev Returns the baseURI.
     */
    function _baseURI() internal view override returns (string memory) {
        return baseURI();
    }

    /**
     * @dev Set the baseURI.
     */
    function setBaseURI(string memory newURI) public onlyOwner {
        BASE_URI = newURI;
    }

    /**
     * @dev Mint a Drip.
     */
    function mint(uint8 versionId, address caller) external payable nonReentrant onlyOwner returns (uint256 dripId) {
        dripId = totalSupply();

        // Drip id to be minted needs to be below the max supply limit
        if (dripId >= MAX_SUPPLY) {
            revert MaxSupplyReached();
        }

        // Caller needs to mint a valid Drip version
        if (versionId >= VERSIONS) {
            revert InvalidVersionId();
        }

        // Caller needs to provide a valid price
        if (msg.value != PRICE) {
            revert InvalidPrice();
        }

        _safeMint(caller, dripId);
        dripIdToDrip[dripId] = Drip({
            version: versionId,
            status: DripStatus.DEFAULT,
            mutation: DripMutation({ tokenContract: address(0), tokenId: 0 })
        });
    }

    /**
     * @dev Mutate a Drip.
     */
    function mutate(
        uint256 dripId,
        IERC721 tokenContract,
        uint256 tokenId,
        address caller
    ) external nonReentrant onlyOwner {
        Drip storage _drip = dripIdToDrip[dripId];

        // Caller should own the Drip
        if (_ownerOf(dripId) != caller) {
            revert InvalidDripOwner();
        }

        // Drip status should be Default
        if (_drip.status != DripStatus.DEFAULT) {
            revert AlreadyMutated();
        }

        // Owner of tokenId should be the caller
        if (tokenContract.ownerOf(tokenId) != caller) {
            revert InvalidTokenOwner();
        }

        _drip.status = DripStatus.MUTATED;
        _drip.mutation.tokenContract = address(tokenContract);
        _drip.mutation.tokenId = tokenId;
    }

    /**
     * @dev Withdraw funds.
     */
    function withdraw(address to) public onlyOwner returns (uint256 balance) {
        balance = address(this).balance;
        payable(to).transfer(balance);
    }
}
