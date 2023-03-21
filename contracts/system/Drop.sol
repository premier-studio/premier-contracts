// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity 0.8.14;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { ERC721 } from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import { ERC721Enumerable } from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import { IERC721 } from "@openzeppelin/contracts/interfaces/IERC721.sol";
import { Strings } from "@openzeppelin/contracts/utils/Strings.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import { IERC165 } from "@openzeppelin/contracts/utils/introspection/IERC165.sol";

import { ITokenInterface } from "../tokens/ITokenInterface.sol";

/**
 * @dev A struct representing the status of a Drip.
 */
enum DripStatus {
    DEFAULT,
    MUTATED
}

/**
 * @dev A struct representing a Drip mutation.
 */
struct DripMutation {
    address tokenContract;
    uint256 tokenId;
}

/**
 * @dev A struct representing a Drip.
 */
struct Drip {
    uint8 version;
    //
    DripStatus status;
    DripMutation mutation;
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
    string public CONTRACT_URI = "";

    // Drop's URI
    string public DROP_URI = "";

    // Drips's base URI
    string public BASE_DRIP_URI = "";

    // Immutables

    // The id of the DROP
    uint256 public immutable DROP_ID;

    // The maximum supply of the DROP
    uint256 public immutable MAX_SUPPLY;

    // The price to mint the Drip
    uint256 public immutable PRICE;

    // The number of versions
    uint256 public immutable VERSIONS; // starts at version 1, cannot be 0

    // Mappings

    // Mapping from drip id to Drip
    mapping(uint256 => Drip) public dripIdToDrip;

    // Mapping from a token contract address to ITokenInterface
    mapping(address => ITokenInterface) public tokenAddressToInterface;

    // Events

    // Event triggered when a Drip is minted
    event Minted(uint256 indexed dripId);

    // Event triggered when a Drip is mutated
    event Mutated(uint256 indexed dripId);

    // Event triggered when funds are withdrawn
    event Withdrawn(uint256 indexed funds);

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
        uint256 _versions,
        address _owner
    ) ERC721(string.concat(NAME_PREFIX, Strings.toString(id)), string.concat(SYMBOL_PREFIX, Strings.toString(id))) {
        if (_maxSupply == 0) {
            revert InvalidMaxSupply();
        }

        if (_versions == 0) {
            revert InvalidVersions();
        }

        DROP_ID = id;
        MAX_SUPPLY = _maxSupply;
        PRICE = _price;
        VERSIONS = _versions;

        transferOwnership(_owner);
    }

    /**
     * @dev Returns the id of the DROP.
     */
    function dropId() public view returns (uint256) {
        return DROP_ID;
    }

    /**
     * @dev Returns the maximum supply of the DROP.
     */
    function maxSupply() public view returns (uint256) {
        return MAX_SUPPLY;
    }

    /**
     * @dev Returns the price of the mint.
     */
    function price() public view returns (uint256) {
        return PRICE;
    }

    /**
     * @dev Returns the versions of the mint.
     */
    function versions() public view returns (uint256) {
        return VERSIONS;
    }

    /**
     * @dev Returns the Drip matching the drip id.
     */
    function drip(uint256 dripId) public view returns (Drip memory) {
        if (dripId >= totalSupply()) {
            revert InvalidDripId();
        }

        return dripIdToDrip[dripId];
    }

    /**
     * @dev Load token interface.
     */
    function setTokenContractInterface(address tokenContract, ITokenInterface _ITokenInterface) public onlyOwner {
        tokenAddressToInterface[tokenContract] = _ITokenInterface;
    }

    /**
     * @dev Get token interface.
     */
    function getTokenContractInterface(address tokenContract) public view returns (ITokenInterface) {
        return tokenAddressToInterface[tokenContract];
    }

    /**
     * @dev Returns the URI of the metadata of the DROP.
     */
    function dropURI() public view returns (string memory) {
        return DROP_URI;
    }

    /**
     * @dev Load the baseURI of the metadata of the DROP.
     */
    function setDropURI(string memory newURI) public onlyOwner {
        DROP_URI = newURI;
    }

    /**
     * @dev Load the contract URI.
     */
    function setContractURI(string memory newURI) public onlyOwner {
        CONTRACT_URI = newURI;
    }

    /**
     * @dev Returns the contract URI.
     */
    function contractURI() public view returns (string memory) {
        return CONTRACT_URI;
    }

    /**
     * @dev Load the baseURI of the Drips.
     */
    function setBaseURI(string memory newURI) public onlyOwner {
        BASE_DRIP_URI = newURI;
    }

    /**
     * @dev Returns the baseURI of the Drips.
     */
    function baseURI() public view returns (string memory) {
        return BASE_DRIP_URI;
    }

    /**
     * @dev Returns the baseURI of the Drips.
     */
    function _baseURI() internal view override returns (string memory) {
        return BASE_DRIP_URI;
    }

    /**
     * @dev Withdraw funds.
     */
    function withdraw() public onlyOwner {
        uint256 balance = address(this).balance;
        payable(owner()).transfer(balance);

        emit Withdrawn(balance);
    }

    /**
     * @dev Mint a Drip.
     */
    function mint(uint8 versionId) external payable nonReentrant {
        uint256 dripId = totalSupply();

        // Token id to be minted needs to be below the max supply limit
        if (dripId >= maxSupply()) {
            revert MaxSupplyReached();
        }

        // Minter needs to mint a correct version of the DROP
        if (versionId >= VERSIONS) {
            revert InvalidVersionId();
        }

        // Minter needs to provide the correct amount
        if (msg.value != PRICE) {
            revert InvalidPrice();
        }

        _safeMint(msg.sender, dripId);
        dripIdToDrip[dripId] = Drip({
            version: versionId,
            status: DripStatus.DEFAULT,
            mutation: DripMutation({ tokenContract: address(0), tokenId: 0 })
        });

        emit Minted(dripId);
    }

    /**
     * @dev Mutate a Drip.
     */
    function mutate(uint256 dripId, IERC721 tokenContract, uint256 tokenId) external nonReentrant {
        Drip storage _drip = dripIdToDrip[dripId];

        // Drip to be mutated should exist
        if (dripId >= totalSupply()) {
            revert InvalidDripId();
        }

        // Drip owner should be the msg.sender
        if (_ownerOf(dripId) != msg.sender) {
            revert InvalidDripOwner();
        }

        // Drip status should be Default
        if (_drip.status != DripStatus.DEFAULT) {
            revert AlreadyMutated();
        }

        // check if tokenContract support IERC721 interface
        try IERC165(address(tokenContract)).supportsInterface(type(IERC721).interfaceId) returns (bool doesSupport) {
            if (doesSupport) {
                // if it does support it, let's call ownerOf like any regular ERC721 contract
                try tokenContract.ownerOf(tokenId) returns (address tokenOwner) {
                    // if owner of tokenId is not msg.sender, reverts
                    if (tokenOwner != msg.sender) {
                        revert InvalidTokenOwner();
                    }
                    // else, all good, it's the owner
                } catch {
                    // if this code is reached it means that ownerOf threw (most likely "ERC721: invalid token ID" but it could technically be something else)
                    revert InvalidTokenOwner();
                }
            } else {
                // if this code is reached it means that the contract implement the supportsInterface
                // function but doesn't support ERC721, so most likely an ERC20 contract or such
                revert UnsupportedTokenContract();
            }
        } catch {
            // if this code is reached it means that tokenContract is a custom contract,
            // so let's check if we have it stored in our contract interface system
            ITokenInterface tokenInterface = getTokenContractInterface(address(tokenContract));

            // there is no support for this contract yet
            if (address(tokenInterface) == address(0)) {
                revert UnsupportedTokenContract();
            }

            if (tokenInterface.ownerOf(tokenId) != msg.sender) {
                revert InvalidTokenOwner();
            }

            // all good
        }

        _drip.status = DripStatus.MUTATED;
        _drip.mutation.tokenContract = address(tokenContract);
        _drip.mutation.tokenId = tokenId;

        emit Mutated(dripId);
    }
}
