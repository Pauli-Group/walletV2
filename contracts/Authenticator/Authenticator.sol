// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./KeyFeeBeacon.sol";

abstract contract LamportBase {
    using Address for address payable;

    enum PublicKeyHashUsageStatus {
        UNUSED,
        POSTED,
        REDEEMED
    }

    event AddedPublicKeyHashes(uint256 indexed countLive);
    event RemovedPublicKeyHashes(uint256 indexed countLive);

    IKeyFeeBeacon internal _keyFeeBeacon;

    mapping(address => bool) internal approvedCallers;
    mapping(bytes32 => PublicKeyHashUsageStatus) publicKeyHashes;
    uint256 public liveKeyCount;

    /*
		@name isApprovedCaller
		@description checks if an address is approved to make calls to this contract 
		@date Febuary 17th 2023
		@author William Doyle
	*/
    function isApprovedCaller(address caller) public view returns (bool) {
        return approvedCallers[caller];
    }

    /*
		@name _approveCaller
		@description approves an address to make calls to this contract 
		@date Febuary 17th 2023
		@author William Doyle
	*/
    function _approveCaller(address caller) internal {
        approvedCallers[caller] = true;
    }

    /*
		@name approveCallers
		@description approves an array of addresses to make calls to this contract
		@date Febuary 17th 2023
		@author William Doyle
	*/
    function approveCallers(
        address[] calldata callers,
        bytes32[2][256] calldata publicKey,
        bytes[256] calldata signature
    )
        public
        redeemLamport(
            publicKey,
            signature,
            abi.encodePacked(callers, hex"fb895820")
        )
    {
        unchecked {
            for (uint256 i = 0; i < callers.length; i++) {
                _approveCaller(callers[i]);
            }
        }
    }

    /*
		@name unapproveCallers
		@description unapproves an array of addresses to make calls to this contract
		@date Febuary 17th 2023
		@author William Doyle
	*/
    function unapproveCallers(
        address[] calldata callers,
        bytes32[2][256] calldata publicKey,
        bytes[256] calldata signature
    )
        public
        redeemLamport(
            publicKey,
            signature,
            abi.encodePacked(callers, hex"11e25162")
        )
    {
        unchecked {
            for (uint256 i = 0; i < callers.length; i++) {
                _unapproveCaller(callers[i]);
            }
        }
    }

    /*
		@name _unapproveCaller
		@description unapproves an address to make calls to this contract
		@date Febuary 17th 2023
		@author William Doyle
	*/
    function _unapproveCaller(address caller) internal {
        require(caller != msg.sender, "LB:E3"); // LamportBaseA: Cannot unapprove self
        approvedCallers[caller] = false;
    }

    /*
        @name isRedeemable
        @description checks if a public key hash is redeemable
        @date December 5th 2022
        @author William Doyle
    */
    function isRedeemable(bytes32 publicKeyHash) public view returns (bool) {
        return
            publicKeyHashes[publicKeyHash] == PublicKeyHashUsageStatus.POSTED;
    }

    // lamport 'verify' logic
    function verify_u256(
        uint256 bits,
        bytes[256] calldata sig,
        bytes32[2][256] calldata pub
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

    /*
        @name redeemLamport
        @description a modifier that checks the sender has provided a valid lamport signature and marks the relevent public key hash as redeemed
        @date December 5th 2022
        @author William Doyle
		@todo consider adding a value to be included in the signed hash to signed message can only be used to call intended function
     */
    modifier redeemLamport(
        bytes32[2][256] calldata publicKey,
        bytes[256] calldata signature,
        bytes memory prepackedMessageData
    ) {
        require(isApprovedCaller(msg.sender), "LB:E6"); // LamportBaseA: caller not approved
        require(liveKeyCount > 0, "LB:E7"); //  LamportBaseA: not initialized or no remaining public key hashes
        bytes32 publicKeyHash = keccak256(abi.encodePacked(publicKey));

        require(isRedeemable(publicKeyHash), "LB:E8"); // LamportBaseA: currentpub does not have a redeemable public key hash
        require(
            verify_u256(
                uint256(keccak256(prepackedMessageData)),
                signature,
                publicKey
            ),
            "LB:E9"
        ); // LamportBaseA: Signature not valid

        _removeSinglePublicKeyHash(publicKeyHash);
        emit RemovedPublicKeyHashes(liveKeyCount);

        _;
    }

    /*
        @name _addSinglePublicKeyHash
        @description adds a single public key hash to the mapping
        @date December 5th 2022
        @author William Doyle
    */
    function _addSinglePublicKeyHash(bytes32 publicKeyHashToAdd) internal {
        require(
            publicKeyHashes[publicKeyHashToAdd] ==
                PublicKeyHashUsageStatus.UNUSED,
            "LB:E10"
        ); // LamportBaseA: Public Key Hash Already Exists

        publicKeyHashes[publicKeyHashToAdd] = PublicKeyHashUsageStatus.POSTED;
        liveKeyCount++;
    }

    /*
        @name _addPublicKeyHashes
        @description adds a list of public key hashes to the contract
        @date December 5th 2022
        @author William Doyle
    */
    function _addPublicKeyHashes(
        bytes32[] memory publicKeyHashesToAdd
    ) internal {
        unchecked {
            for (uint256 i = 0; i < publicKeyHashesToAdd.length; i++) {
                _addSinglePublicKeyHash(publicKeyHashesToAdd[i]);
            }

            emit AddedPublicKeyHashes(liveKeyCount);
        }
    }

    /*
		@name getKeyAdditionFee
		@description gets the current key addition fee'
		@date March 10th 2023
		@author William Doyle
	*/
    function getKeyAdditionFee() public view returns (uint256) {
        if (address(_keyFeeBeacon) == address(0)) {
            return 0;
        }
        return _keyFeeBeacon.getKeyAdditionFee();
    }

    /*
		@name getProfitAddress
		@description gets the current profit address
		@date March 10th 2023
		@author William Doyle
	*/
    function getProfitAddress() public view returns (address) {
        if (address(_keyFeeBeacon) == address(0)) {
            return address(0);
        }
        return _keyFeeBeacon.getProfitAddress();
    }

    function getKeyFeeBeacon() public view returns (address) {
        return address(_keyFeeBeacon);
    }

    /*
	    @name addPublicKeyHashes
	    @description adds a list of public key hashes to the contract
	    @date December 5th 2022
	    @author William Doyle
	*/
    function addPublicKeyHashes(
        bytes32[] memory publicKeyHashesToAdd,
        bytes32[2][256] calldata publicKey,
        bytes[256] calldata signature
    )
        public
        payable
        redeemLamport(
            publicKey,
            signature,
            abi.encodePacked(publicKeyHashesToAdd, hex"341a3860")
        )
    {
        uint256 keyAdditionFee = getKeyAdditionFee();
        require(msg.value == keyAdditionFee, "LB:E11"); //  "LamportBaseA: Must Include Key Addition Fee"

        if (keyAdditionFee == 0) {
            // No Fee --> Skip Additional Logic
            _addPublicKeyHashes(publicKeyHashesToAdd);
            return;
        }

        _addPublicKeyHashes(publicKeyHashesToAdd);

        address profitAddress = getProfitAddress();
        payable(profitAddress).sendValue(keyAdditionFee);
        // don't revert if the transfer fails
    }

    /*
        @name _removeSinglePublicKeyHash
        @description removes a single public key hash from the mapping
        @date December 5th 2022
        @author William Doyle
    */
    function _removeSinglePublicKeyHash(
        bytes32 publicKeyHashToRemove
    ) internal {
        require(
            publicKeyHashes[publicKeyHashToRemove] ==
                PublicKeyHashUsageStatus.POSTED,
            "LB:E12"
        ); // LamportBaseA: Public Key Hash Not Posted Or Already Redeemed

        publicKeyHashes[publicKeyHashToRemove] = PublicKeyHashUsageStatus
            .REDEEMED;
        liveKeyCount--;
    }

    /*
        @name _removePublicKeyHashes
        @description removes a list of public key hashes from the contract
        @date December 5th 2022
        @author William Doyle
    */
    function _removePublicKeyHashes(
        bytes32[] memory publicKeyHashesToRemove
    ) internal {
        unchecked {
            for (uint256 i = 0; i < publicKeyHashesToRemove.length; i++) {
                _removeSinglePublicKeyHash(publicKeyHashesToRemove[i]);
            }

            emit RemovedPublicKeyHashes(liveKeyCount);
        }
    }

    /*
        @name removePublicKeyHashes
        @description removes a list of public key hashes from the contract
        @date December 5th 2022
        @author William Doyle
    */
    function removePublicKeyHashes(
        bytes32[] memory publicKeyHashesToRemove,
        bytes32[2][256] calldata publicKey,
        bytes[256] calldata signature
    )
        public
        redeemLamport(
            publicKey,
            signature,
            abi.encodePacked(publicKeyHashesToRemove, hex"46f5b4ad")
        )
    {
        _removePublicKeyHashes(publicKeyHashesToRemove);
    }
}

contract LambBedrockAuthentication is LamportBase, Initializable {
    mapping(bytes32 => bool) public endorsedMessages;

    constructor(bool isMain) {
        if (isMain) {
            _disableInitializers();
        }
    }

    function initialize(
        bytes32[] memory firstLamportKeys,
        address[] calldata callers,
        IKeyFeeBeacon keyFeeBeacon
    ) public virtual initializer {
        _addPublicKeyHashes(firstLamportKeys);

        for (uint256 i = 0; i < callers.length; i++) {
            approvedCallers[callers[i]] = true;
        }

        _keyFeeBeacon = keyFeeBeacon;
    }

    /*
        @name endorseMessage
        @description takes message hash and signature details, checks signature details, and if valid, marks message as signed
        @date January 2nd 2023
        @author William Doyle
     */
    function endorseMessage(
        bytes32 message,
        bytes32[2][256] calldata publicKey,
        bytes[256] calldata signature
    )
        public
        redeemLamport(
            publicKey,
            signature,
            abi.encodePacked(message, hex"227ca88d")
        )
    {
        endorsedMessages[message] = true;
    }

    /*
        @name isValidSignature
        @description fits the ERC1271 standard as closely as possible while remaining quantum secure
        @date Febuary 15th 2023
        @author William Doyle
     */
    // solhint-disable-next-line unused-arguments
    function isValidSignature(
        bytes32 hash,
        bytes memory missing
    ) public view returns (bytes4) {
        if (endorsedMessages[hash]) {
            return 0x1626ba7e;
        }
        return 0xffffffff;
    }
}

// TODO:
// 2. Stop using Constants library

contract LambBedrockAuthenticationFactory {
    IKeyFeeBeacon keyFeeBeacon;
    address logic;
    event AccountCreated(address indexed account);

    constructor(address operator, uint256 keyAdditionFee) {
        logic = address(new LambBedrockAuthentication(true));
        keyFeeBeacon = new KeyFeeBeacon(operator, keyAdditionFee);
    }

    function createAccount(
        bytes32[] memory firstLamportKeys,
        address[] calldata callersToApprove
    ) public {
        bytes32 salt = keccak256(
            abi.encodePacked(block.chainid, firstLamportKeys, callersToApprove)
        );

        address proxy = Clones.cloneDeterministic(logic, salt);
        LambBedrockAuthentication(payable(proxy)).initialize(
            firstLamportKeys,
            callersToApprove,
            keyFeeBeacon
        );

        emit AccountCreated(proxy);
        return;
    }

    function getAddress(
        bytes32[] memory firstLamportKeys,
        address[] calldata callersToApprove
    ) public view returns (address) {
        bytes32 salt = keccak256(
            abi.encodePacked(block.chainid, firstLamportKeys, callersToApprove)
        );

        return Clones.predictDeterministicAddress(logic, salt);
    }
}
