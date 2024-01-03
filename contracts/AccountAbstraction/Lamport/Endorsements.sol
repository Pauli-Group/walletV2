// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/interfaces/IERC1271.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

import "../core/BaseAccount.sol";
import "./VerifyLamport.sol";
import "./LamportBaseA.sol";

abstract contract Endorsements is IERC1271, BaseAccount, VerifyLamport, LamportBaseA {
    mapping(bytes32 => bool) public endorsedMessages;
    mapping(bytes32 => bool) endorsedUserOps;
    mapping(bytes32 => bool) endorsedMerkleRoots; // allow some way of signing messages off-chain

    /*
        @name isValidSignature
        @descriptionfits the ERC1271 standard as closely as possible while remaining quantum secure
        @date Febuary 15th 2023
        @majorRevision June 28th 2023
        @author William Doyle
     */
    // solhint-disable-next-line unused-arguments
    function isValidSignature(
        bytes32 hash,
        bytes memory merkleProofAndSignatureOrNothing
    ) public view override returns (bytes4) {
        if (endorsedMessages[hash] || endorsedUserOps[hash]) {
            return 0x1626ba7e;
        }

        if (merkleProofAndSignatureOrNothing.length == 0) {
            return 0xffffffff; 
        }

        (
            bytes32[] memory merkleProof,
            bytes32 root,
            bytes[256] memory sig,
            bytes32[2][256] memory publicKey
        ) = abi.decode(
            merkleProofAndSignatureOrNothing,
            (bytes32[], bytes32, bytes[256], bytes32[2][256])
        );
		
        bytes32 publicKeyHash = keccak256(abi.encodePacked(publicKey));   // the leaf

        if (endorsedMerkleRoots[root] == false) {       // root must be endorsed
            return 0xffffffff;
        }

        bytes32 leaf = keccak256(bytes.concat(keccak256(abi.encode(publicKeyHash))));

        if (MerkleProof.verify(merkleProof, root, leaf) == false) { // leaf must be in the tree
            return 0xffffffff;
        }

        if (verify_u256(uint256(hash), sig, publicKey)) { // finally, verify the signature 
            return 0x1626ba7e;
        }

        return 0xffffffff;
    }

    function endorseMessage(bytes32 message) public {
        _requireFromEntryPointOrSelf();
        endorsedMessages[message] = true;
    }

    function endorseMerkleRoot(bytes32 merkleRoot) public {
        _requireFromEntryPointOrSelf();
        endorsedMerkleRoots[merkleRoot] = true;
    }
}
