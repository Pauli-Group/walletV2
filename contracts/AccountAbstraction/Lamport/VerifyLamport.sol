// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.12;

contract VerifyLamport {

    /**
        Relevent solidity language change:  https://github.com/ethereum/solidity/issues/13518
        This change should allow us to replace `memory` with `calldata` here and in _validateSignature 
        by allowing us to abi.decode directly to calldata.
    */
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
}
