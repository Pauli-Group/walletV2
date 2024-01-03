import { ethers } from "ethers";

const accountInterface: ethers.utils.Interface = new ethers.utils.Interface([
    "function execute(address dest, uint256 value, bytes calldata func)",
    "function addPublicKeyHashes(bytes32[] memory publicKeyHashesToAdd)",
    "function removePublicKeyHashes(bytes32[] memory publicKeyHashesToRemove)",
    "function togglePause()",
    "function asyncTransfer(address dest, uint256 value)",
    "function setExtensionContract(bytes32 extensionId, address extensionAddress)",
    "function endorseMessage(bytes32 message)",
    "function isValidSignature(bytes32 hash, bytes memory missing)",
    "function executeBatch(address[] calldata dest, bytes[] calldata func)",
    "function nonce() returns (uint256)"
])

export default accountInterface