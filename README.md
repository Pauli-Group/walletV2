# ERC4337 Account Abstraction With Lamport Signatures

[Sign Up To Test On Sepolia](https://anchorwallet.ca/waitlist/)

[Read About Our Solution](https://anchorwallet.ca/whitepaper/)

## First User Operation
    Responsable for deploying the contract but also for depositing the initial prefund into the EntryPoint contract. 

## _requireFromEntryPoint vs _requireFromEntryPointOrSelf
    _requireFromEntryPoint is used to prevent unauthorized calls.

    _requireFromEntryPointOrSelf does the same but with less restrictions. It allows the contract to call itself. We need to think deeply about this to make sure it is safe.

## TODO
    - enable Proxy upgrading

## Verifying Contracts
### Flatten the contract
    npx hardhat flat contracts/AccountAbstraction/Lamport/LamportAccountFactory.sol > flat/flat_laf.sol

This will create a flat file with all the imports inlined. This makes verifying the contract easier.

### Go to the relevent block explorer and verify the contract
For example, https://sepolia.etherscan.io

### Make sure to verify the following contracts
1. LamportAccountFactory
2. FeeBeacon
3. LamportAccount (implementation contract)
4. ERC1967Proxy

### Use Tool to build ABI calldata
https://abi.hashex.org/

### Off Chain Endorsment Keys
To allow for off chain message endorsments which are still quantum secure we induce a new type of key for use within the EIP 1271 standard. These keys are lamport keys very similar to the ones used for authorizing user operations. However the state of these keys is not stored on chain. 

These Off Chain Endorsment Keys (oce keys) are commited to using a merkle tree. The merkle root is endorsed by submitting a user operation signed with the normal lamport keys. Many merkle roots can be endorsed. Later, when a user wants to sign a message without engaging with the network, they can use one of the oce keys to sign the message. The signer must also produce a root which was previously endorsed and a proof that the signing key used is a member of the endorsed tree. Anyone intrested in verifying this message would need to pass the message hash as the first parameter to isValidSignature and a binary package (type bytes) containing the merkle proof, the root, signature, and public key as the second parameter.