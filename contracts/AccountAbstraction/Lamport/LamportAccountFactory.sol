// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/utils/Create2.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "./LamportAccount.sol";
import "./FeeBeacon.sol";

/**
 * A sample factory contract for SimpleAccount
 * A UserOperations "initCode" holds the address of the factory, and a method call (to createAccount, in this sample factory).
 * The factory's createAccount returns the target account address even if it is already installed.
 * This way, the entryPoint.getSenderAddress() can be called either before or after the account is created.
 */
contract LamportAccountFactory {
    LamportAccount public immutable accountImplementation;
    IEntryPoint public immutable entryPoint;
    FeeBeacon public immutable feeBeacon;

    mapping(uint256 => address) public accounts;
    uint256 public accountCount;

    constructor(IEntryPoint _entryPoint) {
        entryPoint = _entryPoint;
        accountImplementation = new LamportAccount(_entryPoint);
        feeBeacon = new FeeBeacon(0.00001 ether, 0x4f171744973047296d90e7828676F4972faFB200 , 0x4f171744973047296d90e7828676F4972faFB200);
    }

    /**
     * create an account, and return its address.
     * returns the address even if the account is already deployed.
     * Note that during UserOperation execution, this method is called only if the account is not deployed.
     * This method returns an existing account address so that entryPoint.getSenderAddress() would work even after account creation
     */
    function createAccount(address owner,uint256 salt, bytes32[] memory firstLamportKeys) public returns (LamportAccount ret) {
        address addr = getAddress(owner, salt, firstLamportKeys);
        uint codeSize = addr.code.length;
        if (codeSize > 0) {
            return LamportAccount(payable(addr));
        }
        ERC1967Proxy proxy = new ERC1967Proxy{salt : bytes32(salt)}(
            address(accountImplementation),
            abi.encodeCall(LamportAccount.initialize, (owner, firstLamportKeys, feeBeacon))
        );
        ret = LamportAccount(payable(address(proxy)));

        accounts[accountCount] = address(ret);
        accountCount++;
    }

    /**
     * calculate the counterfactual address of this account as it would be returned by createAccount()
     */
    function getAddress(address owner,uint256 salt,  bytes32[] memory firstLamportKeys) public view returns (address) {
        return Create2.computeAddress(bytes32(salt), keccak256(abi.encodePacked(
                type(ERC1967Proxy).creationCode,
                abi.encode(
                    address(accountImplementation),
                    abi.encodeCall(LamportAccount.initialize, (owner, firstLamportKeys, feeBeacon))
                )
            )));
    }

    function addStake(uint32 unstakeDelaySec) external payable {
        entryPoint.addStake{value: msg.value}(unstakeDelaySec);
    }

    receive() external payable {
        this.addStake{value: msg.value}(52 weeks);
    }

}
