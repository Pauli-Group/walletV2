// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.12;

/*
	@name Constants
	@description if it doesn't have state, it goes here
	@date March 13th 2023
	@author William Doyle
*/
// library Constants {
// 	// TYPE HASHES
// 	bytes32 public constant PAUSE_COMMAND = keccak256("pause.commands.namespace.pauligroup.eth");
// 	bytes32 public constant UNPAUSE_COMMAND = keccak256("unpause.commands.namespace.pauligroup.eth");
// 	bytes32 public constant ALLOW_ANY_CALLER_COMMAND = keccak256("allowanycaller.commands.namespace.pauligroup.eth");
// 	bytes32 public constant DISALLOW_ANY_CALLER_COMMAND = keccak256("disallowanycaller.commands.namespace.pauligroup.eth");
// 	bytes32 public constant TOGGLE_PAUSE_COMMAND = keccak256("togglepause.commands.namespace.pauligroup.eth");

// 	string public constant LAMPORTWALLETA_TYPEPATH = "lamportwalleta.security.registry.namespace.pauligroup.eth";
// 	bytes32 public constant LAMPORTWALLETA_TYPEHASH = keccak256(abi.encodePacked(LAMPORTWALLETA_TYPEPATH));

// 	string public constant MULTISIG_TYPEPATH = "multisig.security.registry.namespace.pauligroup.eth";
// 	bytes32 public constant MULTISIG_TYPEHASH = keccak256(abi.encodePacked(MULTISIG_TYPEPATH));

// 	// OTHER CONSTANTS
// 	uint256 public constant DEFAULT_MINIMAL_LIVE_KEYS = 10;

// 	bytes32 public constant REGISTRAR_ROLE = keccak256("REGISTRAR_ROLE"); // allowed to register addresses

// 	bytes32 public constant REDEEMER_ROLE = keccak256("REDEEMER_ROLE");

// 	// ENUMS
// 	enum PublicKeyHashUsageStatus {
// 		UNUSED,
// 		POSTED,
// 		REDEEMED
// 	}

// 	enum WalletType {
// 		Static,
// 		AutoUpgradeable
// 	}

// 	// EVENTS
// 	event AddedPublicKeyHashes(uint256 indexed countLive);
// 	event RemovedPublicKeyHashes(uint256 indexed countLive);
	
// 	event ProposalCreated(bytes32 proposalId);
// 	event ProposalCreatedFat(bytes32 proposalId, address target, uint256 minimalGas);
// 	event StubShowTarget(address target, bytes data);

// 	event Executed(bool indexed success, bytes result);

// 	event RegisteredSecurityType(string typepath, bytes32 indexed typehash);
// 	event RetiredSecurityType(string typepath, bytes32 indexed typehash);
// 	event RegisteredAddressWithSecurityType(address indexed registrant, bytes32 indexed typehash);
// 	event RevokedAddressRegistration(address indexed registrant);
// 	event UnRevokedAddressRegistration(address indexed registrant);


// 	// STRUCTS
// 	struct Proposal {
// 		address target;
// 		uint256 value;
// 		bytes data;
// 		uint256 minimalGas; // executor must provide at least this much gas
// 	}

// 	// PURE FUNCTIONS

// 	// lamport 'verify' logic
// 	function verify_u256(uint256 bits, bytes[256] calldata sig, bytes32[2][256] calldata pub) public pure returns (bool) {
// 		unchecked {
// 			for (uint256 i = 0; i < 256; i++) {
// 				if (pub[i][(bits >> (255 - i)) & 1] != keccak256(sig[i])) {
// 					return false;
// 				}
// 			}

// 			return true;
// 		}
// 	}
// }
