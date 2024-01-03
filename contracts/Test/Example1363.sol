// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.12;

import "erc-payable-token/contracts/token/ERC1363/ERC1363.sol";

contract MyExample1363 is ERC1363 {
	constructor(string memory name, string memory symbol) ERC20(name, symbol) {
		// your stuff
	}

	// your stuff
    function mint (address account, uint256 amount) public {
        _mint(account, amount);
    }
}
