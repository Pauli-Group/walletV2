// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.12;

abstract contract Fallback {

    fallback() external payable { }

    receive() external payable { }
}