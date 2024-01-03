// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/access/Ownable.sol";

contract FeeBeacon is Ownable {

    uint256 private fee;
    address private recipient;
    event FeeChanged(uint256 newFee, address newRecipient);

    constructor(uint256 _fee, address _recipient, address operator) {
        fee = _fee;
        recipient = _recipient;
        _transferOwnership(operator);
    }

    function getFeeDetails() public view returns (uint256, address) {
        return (fee, recipient);
    }

    function setFeeDetails(uint256 _fee, address _recipient) public onlyOwner {
        fee = _fee;
        recipient = _recipient;
        emit FeeChanged(_fee, _recipient);
    }
}