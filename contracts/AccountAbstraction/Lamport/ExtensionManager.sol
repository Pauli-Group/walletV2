// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.12;

import "../core/BaseAccount.sol";

abstract contract ExtensionManager is BaseAccount {

    mapping(bytes32 => address) lambExtensionContracts; // contract controlled by this account  

    function setExtensionContract(bytes32 extensionId, address extensionAddress) external {
        _requireFromEntryPoint();
        lambExtensionContracts[extensionId] = extensionAddress;
    }

    function getExtensionContract(bytes32 extensionId) external view returns (address) {
        return lambExtensionContracts[extensionId];
    } 
}