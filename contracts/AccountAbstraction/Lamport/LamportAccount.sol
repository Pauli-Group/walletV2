// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/utils/introspection/IERC1820Registry.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165.sol";

import "../core/BaseAccount.sol";
import "./LamportBaseA.sol";
import "./UpgradeablePullPayments.sol";
import "./TokenEnjoyer.sol";
import "./Endorsements.sol";
import "./Fallback.sol";
import "./ExtensionManager.sol";
import "./Execution.sol";

contract LamportAccount is
    ERC165,
    Initializable,
    UUPSUpgradeable,
    LamportBaseA,
    UpgradeablePullPayment,
    TokenEnjoyer,
    Execution,
    Endorsements,
    ExtensionManager,
    Fallback
{
    using ECDSA for bytes32;
    IERC1820Registry internal constant _ERC1820_REGISTRY = IERC1820Registry(0x1820a4B7618BdE71Dce8cdc73aAB6C95905faD24);
    IEntryPoint private immutable _entryPoint;

    address public owner;

    constructor(IEntryPoint anEntryPoint) {
        _entryPoint = anEntryPoint;
        _disableInitializers();
    }

    function initialize(
        address anOwner,
        bytes32[] memory firstLamportKeys,
        FeeBeacon _feeBeacon
    ) public virtual initializer {
        _addPublicKeyHashes(firstLamportKeys);
        owner = anOwner;
        feeBeacon = _feeBeacon;
    }

    function initializePullPaymentsAndERC777Support () public reinitializer(2) {
        _requireFromEntryPointOrSelf();
        _escrow = new Escrow(); // pull payment
 		_ERC1820_REGISTRY.setInterfaceImplementer(address(this), keccak256("ERC777TokensSender"), address(this));   // Register the contract as its own manager
		_ERC1820_REGISTRY.setInterfaceImplementer(address(this), keccak256("ERC777TokensRecipient"), address(this));
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override (TokenEnjoyer, ERC165) returns (bool) {
        return interfaceId == type(IERC1271).interfaceId
            || super.supportsInterface(interfaceId);
    }

    function _authorizeUpgrade(
        address newImplementation
    ) internal virtual override {
        // if pauli group want to only allow upgrading to contracts deployed by us, this is the place to do it
        _requireFromEntryPoint();
    }

    function _validateSignature(
        UserOperation calldata userop,
        bytes32 userOpHash
    ) internal virtual override returns (uint256) {
        (                                                                   //      decode signature into [lamport signature, lamport public key]
            bytes[256] memory sig,
            bytes32[2][256] memory publicKey
        ) = abi.decode(
                userop.signature,
                ( bytes[256], bytes32[2][256])
            );

        bytes32 hash = userOpHash.toEthSignedMessageHash();                 //      hash user op hash again to get eth signed message hash

		bytes32 publicKeyHash = keccak256(abi.encodePacked(publicKey));     //      hash selected lamport public key to get public key hash

        if  (publicKeyHashes[publicKeyHash] != PublicKeyHashUsageStatus.POSTED)       //      verify this key is endorsed by owner and has not yet been used (or retired using `removePublicKeyHashes`)
            return SIG_VALIDATION_FAILED;

        bool isValidSig = verify_u256(                                      //      lamport verification algorithm (ensure the signature matches the public key and the message)
            uint256(hash),
            sig,
            publicKey
        );

        if (!isValidSig)                                                    //      fail if the signature is invalid 
            return SIG_VALIDATION_FAILED;

        _removeSinglePublicKeyHash(publicKeyHash);                          //      mark the used key as REDEEMED
        return 0;
    }

    function entryPoint() public view virtual override returns (IEntryPoint) {
        return _entryPoint;
    }
 
    /**
     * pull payments 
     */
    function asyncTransfer (
        address dest,
        uint256 value
    ) external {
        _requireFromEntryPoint();
        _asyncTransfer(dest, value);
    }
}
