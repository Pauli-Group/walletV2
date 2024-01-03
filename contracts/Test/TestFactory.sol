// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.12;

import "./PositionTest.sol";
import "./BroadcastTest.sol";

contract TestFactory {

    function newPositionTest() public returns (address) {
        return address(new PositionTest());
    }

    function newBroadcastTest() public returns (address) {
        return address(new BroadcastTest());
    }
}