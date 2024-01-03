// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.12;

// a simple ERC1363 receiver

import "erc-payable-token/contracts/token/ERC1363/IERC1363Receiver.sol";

import "hardhat/console.sol";

contract Merchant is IERC1363Receiver {
    bytes4 internal constant _INTERFACE_ID_ERC1363_RECEIVER = 0x88a7ca5c;

    event Received(address sender, uint256 amount);

    function onTransferReceived(
        address operator,
        address sender,
        uint256 amount,
        bytes memory data
    ) public virtual override returns (bytes4) {
        emit Received(sender, amount);
        console.log("IERC1363::Merchant::onTransferReceived %s from %s", amount, sender);
        return _INTERFACE_ID_ERC1363_RECEIVER;
    }

    fallback() external payable {
    }

    receive() external payable {
    }

}