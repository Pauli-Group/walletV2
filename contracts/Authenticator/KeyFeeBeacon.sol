// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/access/Ownable.sol";

interface IKeyFeeBeacon {
	function setKeyAdditionFee(uint256 _keyAdditionFee) external;

	function getKeyAdditionFee() external view returns (uint256);

	function setProfitAddress(address _profitAddress) external;

	function getProfitAddress() external view returns (address);
}

/*
    @name KeyFeeBeacon
    @description stores the key addition fee and the profit address
    @date March 9th 2023
    @author William Doyle
 */
contract KeyFeeBeacon is Ownable, IKeyFeeBeacon{
	event FeeChanged(uint256 indexed oldFee, uint256 indexed newFee);
	event ProfitAddressChanged(address indexed oldAddress, address indexed newAddress);

	uint256 keyAdditionFee;
	address profitAddress;

	constructor (address operator, uint256 _keyAdditionFee) {
		_transferOwnership(operator);
		profitAddress = 0x4f171744973047296d90e7828676F4972faFB200;
		keyAdditionFee = _keyAdditionFee;
	}

	function setKeyAdditionFee(uint256 _keyAdditionFee) public onlyOwner {
		uint256 old = keyAdditionFee;
		keyAdditionFee = _keyAdditionFee;
		emit FeeChanged(old, keyAdditionFee);
	}

	function getKeyAdditionFee() public view returns (uint256) {
		return keyAdditionFee;
	}

	function setProfitAddress(address _profitAddress) public onlyOwner {
		address old = profitAddress;
		profitAddress = _profitAddress;
		emit ProfitAddressChanged(old, profitAddress);
	}

	function getProfitAddress() public view returns (address) {
		return profitAddress;
	}
}
