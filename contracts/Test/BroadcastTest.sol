// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.12;

contract BroadcastTest {
    event Broadcast(address sender, string message);
    string public top;

    function broadcast(string memory message) public {
        top = message;
        emit Broadcast(msg.sender, message);
    }
}

// deployments
// mumbai 0xDa265D3c33f2210D73D07D7E0DC4Bfd1dE407C63