// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.1;

contract HashComparison {
    event LogKeccak256(bytes32 hash);
    event LogRipemd160(bytes20 hash);

    event VerifiedKeccak256Lamport();
    event VerifiedRipemd160Lamport();

    mapping(bytes32 => bool) public seenKeccak256;
    mapping(bytes20 => bool) public seenRipemd160;

    function test1Keccak256(bytes memory data) public {
        bytes32 hash = keccak256(data);
        seenKeccak256[hash] = true;
        emit LogKeccak256(hash);
    }

    function test2Ripemd160(bytes memory data) public {
        bytes20 hash = ripemd160(data);
        seenRipemd160[hash] = true;
        emit LogRipemd160(hash);
    }

    function verify_u256(
        uint256 bits,
        bytes[256] memory sig,
        bytes32[2][256] memory pub
    ) public pure returns (bool) {
        unchecked {
            for (uint256 i = 0; i < 256; i++) {
                if (pub[i][(bits >> (255 - i)) & 1] != keccak256(sig[i])) {
                    return false;
                }
            }

            return true;
        }
    }

    function test3Keccak256Lamport(
        bytes32 signedHash,
        bytes[256] calldata sig,
        bytes32[2][256] calldata publicKey
    ) public {
        bool isValidSig = verify_u256(uint256(signedHash), sig, publicKey);
        require(isValidSig, "invalid signature");
        emit VerifiedKeccak256Lamport();
    }

    function verify_u160(
        uint160 bits,
        bytes[160] memory sig,
        bytes20[2][160] memory pub
    ) public pure returns (bool) {
        unchecked {
            for (uint160 i = 0; i < 160; i++) {
                if (pub[i][(bits >> (159 - i)) & 1] != ripemd160(sig[i])) {
                    return false;
                }
            }

            return true;
        }
    }

    function test4Ripemd160Lamport(
        bytes20 signedHash,
        bytes[160] calldata sig,
        bytes20[2][160] calldata publicKey
    ) public {
        bool isValidSig = verify_u160(uint160(signedHash), sig, publicKey);
        require(isValidSig, "invalid signature");
        emit VerifiedRipemd160Lamport();
    }
}
