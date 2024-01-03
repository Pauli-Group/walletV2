// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.12;

contract ArbitraryDataStorage {
    address public owner;

    mapping(bytes32 => bytes) private data;

    constructor(address _owner) {
        owner = _owner;
    }

    function setData(bytes32 key, bytes memory value) public {
        require(msg.sender == owner, "only owner");
        data[key] = value;
    }

    function getData(bytes32 key) public view returns (bytes memory) {
        return data[key];
    }
}
