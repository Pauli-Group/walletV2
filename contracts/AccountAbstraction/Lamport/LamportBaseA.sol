// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "../core/BaseAccount.sol";
import "./FeeBeacon.sol";
import "./VerifyLamport.sol";

// abstract contract abstractExample {
//     function foo() public view virtual returns (uint256);
// }

// abstract contract Base is abstractExample {
// 	function useFoo() public returns (uint256) {
// 		return foo();
// 	}
// }

// contract A is Base {
// 	function foo() public view override returns (uint256) {
// 		return 1;
// 	}
// }

abstract contract LamportBaseA is BaseAccount, VerifyLamport, Pausable  {
	using Address for address payable;

	enum PublicKeyHashUsageStatus {
		UNUSED,
		POSTED,
		REDEEMED
	}

	event AddedPublicKeyHashes(uint256 indexed countLive);
	event RemovedPublicKeyHashes(uint256 indexed countLive);

	mapping(bytes32 => PublicKeyHashUsageStatus) publicKeyHashes;
	uint256 public liveKeyCount;
	FeeBeacon public feeBeacon;

    function _requireFromEntryPointOrSelf() internal view {
        require((msg.sender == address(entryPoint())) || (msg.sender == address(this)), "account: not from EntryPoint or self");
    }

	/*
        @name isRedeemable
        @description checks if a public key hash is redeemable
        @date December 5th 2022
        @author William Doyle
    */
	function isRedeemable(bytes32 publicKeyHash) public view returns (bool) {
		return publicKeyHashes[publicKeyHash] == PublicKeyHashUsageStatus.POSTED;
	}

	/*
        @name _addSinglePublicKeyHash
        @description adds a single public key hash to the mapping
        @date December 5th 2022
        @author William Doyle
    */
	function _addSinglePublicKeyHash(bytes32 publicKeyHashToAdd) internal {
		require(publicKeyHashes[publicKeyHashToAdd] == PublicKeyHashUsageStatus.UNUSED, "LB:E10"); // LamportBaseA: Public Key Hash Already Exists

		publicKeyHashes[publicKeyHashToAdd] = PublicKeyHashUsageStatus.POSTED;
		liveKeyCount++;
	}

	/*
        @name _addPublicKeyHashes
        @description adds a list of public key hashes to the contract
        @date December 5th 2022
        @author William Doyle
    */
	function _addPublicKeyHashes(bytes32[] memory publicKeyHashesToAdd) internal {
		unchecked {
			for (uint256 i = 0; i < publicKeyHashesToAdd.length; i++) {
				_addSinglePublicKeyHash(publicKeyHashesToAdd[i]);
			}

			emit AddedPublicKeyHashes(liveKeyCount);
		}
	}

	/*
	    @name addPublicKeyHashes
	    @description adds a list of public key hashes to the contract
	    @date December 5th 2022
	    @author William Doyle
	*/
	function addPublicKeyHashes(bytes32[] memory publicKeyHashesToAdd) public {
        // _requireFromEntryPoint();
		_requireFromEntryPointOrSelf();
		(uint256 fee, address recipient) = feeBeacon.getFeeDetails();
		require(address(this).balance >= fee, "LB: insufficient balance to pay key addition fee");
		_addPublicKeyHashes(publicKeyHashesToAdd);
		payable(recipient).sendValue(fee);
		return;
	}

	/*
        @name _removeSinglePublicKeyHash
        @description removes a single public key hash from the mapping
        @date December 5th 2022
        @author William Doyle
    */
	function _removeSinglePublicKeyHash(bytes32 publicKeyHashToRemove) internal {
		require(publicKeyHashes[publicKeyHashToRemove] == PublicKeyHashUsageStatus.POSTED, "LB:E12"); // LamportBaseA: Public Key Hash Not Posted Or Already Redeemed

		publicKeyHashes[publicKeyHashToRemove] = PublicKeyHashUsageStatus.REDEEMED;
		liveKeyCount--;
	}

	/*
        @name _removePublicKeyHashes
        @description removes a list of public key hashes from the contract
        @date December 5th 2022
        @author William Doyle
    */
	function _removePublicKeyHashes(bytes32[] memory publicKeyHashesToRemove) internal {
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
	function removePublicKeyHashes(bytes32[] memory publicKeyHashesToRemove) public whenNotPaused  {
        _requireFromEntryPoint();
		_removePublicKeyHashes(publicKeyHashesToRemove);
	}

	function togglePause() public  {
		if (paused()) {
			_unpause();
			return;
		}
		_pause();
	}
}
