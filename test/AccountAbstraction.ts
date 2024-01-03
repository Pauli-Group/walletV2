import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";
import { BytesLike } from '@ethersproject/bytes'
import { ethers as ethers2 } from 'ethers'
import { ecsign, toRpcSig, keccak256 as keccak256_buffer } from 'ethereumjs-util'
import {
    arrayify,
    defaultAbiCoder,
    hexDataSlice,
    keccak256
} from 'ethers/lib/utils'

type address = string
type uint256 = ethers2.BigNumberish
type uint = ethers2.BigNumberish
type uint48 = ethers2.BigNumberish
type bytes = BytesLike
type bytes32 = BytesLike

interface UserOperation {
    sender: address
    nonce: uint256
    initCode: bytes
    callData: bytes
    callGasLimit: uint256
    verificationGasLimit: uint256
    preVerificationGas: uint256
    maxFeePerGas: uint256
    maxPriorityFeePerGas: uint256
    paymasterAndData: bytes
    signature: bytes
}

export const DefaultsForUserOp: UserOperation = {
    sender: ethers.constants.AddressZero,
    nonce: 0,
    initCode: '0x',
    callData: '0x',
    callGasLimit: 0,
    verificationGasLimit: 500_000, // default verification gas. will add create2 cost (3200+200*length) if initCode exists
    preVerificationGas: 21000, // should also cover calldata cost.
    maxFeePerGas: 0,
    maxPriorityFeePerGas: 1e9,
    paymasterAndData: '0x',
    signature: '0x'
}

class Monad<T> {
    private _value: T;

    constructor(value: T) {
        this._value = value;
    }

    bind<U>(transform: (value: T) => Monad<U>): Monad<U> {
        return transform(this._value);
    }

    unwrap(): T {
        return JSON.parse(JSON.stringify(this._value)) as T;
    }
}

const show = (value: any) => {
    console.log(`value: `, value)
    return new Monad(value)
}

function fillUserOpDefaults(op: Partial<UserOperation>): Monad<UserOperation> {
    const defaults = DefaultsForUserOp
    const partial: any = { ...op }
    // we want "item:undefined" to be used from defaults, and not override defaults, so we must explicitly
    // remove those so "merge" will succeed.
    for (const key in partial) {
        if (partial[key] == null) {
            // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
            delete partial[key]
        }
    }
    const filled = { ...defaults, ...partial }
    return new Monad(filled)
}

function packUserOp(op: UserOperation, forSignature = true): string {
    if (forSignature) {
        return defaultAbiCoder.encode(
            ['address', 'uint256', 'bytes32', 'bytes32',
                'uint256', 'uint256', 'uint256', 'uint256', 'uint256',
                'bytes32'],
            [op.sender, op.nonce, keccak256(op.initCode), keccak256(op.callData),
            op.callGasLimit, op.verificationGasLimit, op.preVerificationGas, op.maxFeePerGas, op.maxPriorityFeePerGas,
            keccak256(op.paymasterAndData)])
    } else {
        // for the purpose of calculating gas cost encode also signature (and no keccak of bytes)
        return defaultAbiCoder.encode(
            ['address', 'uint256', 'bytes', 'bytes',
                'uint256', 'uint256', 'uint256', 'uint256', 'uint256',
                'bytes', 'bytes'],
            [op.sender, op.nonce, op.initCode, op.callData,
            op.callGasLimit, op.verificationGasLimit, op.preVerificationGas, op.maxFeePerGas, op.maxPriorityFeePerGas,
            op.paymasterAndData, op.signature])
    }
}

function getUserOpHash(op: UserOperation, entryPoint: string, chainId: number): string {
    const userOpHash = keccak256(packUserOp(op, true))
    console.log(`\n\nLocal Hash A: `, userOpHash)
    const enc = defaultAbiCoder.encode(
        ['bytes32', 'address', 'uint256'],
        [userOpHash, entryPoint, chainId])
    const temp = keccak256(enc)
    console.log(`Local Hash B: `, temp, `\n\n`)
    return temp
}

function signUserOp(op: UserOperation, signer: ethers2.Wallet, entryPoint: string, chainId: number): Monad<UserOperation> {
    const message = getUserOpHash(op, entryPoint, chainId)
    const msg1 = Buffer.concat([
        Buffer.from('\x19Ethereum Signed Message:\n32', 'ascii'),
        Buffer.from(arrayify(message))
    ])

    const sig = ecsign(keccak256_buffer(msg1), Buffer.from(arrayify(signer.privateKey)))
    // that's equivalent of:  await signer.signMessage(message);
    // (but without "async"
    const signedMessage1 = toRpcSig(sig.v, sig.r, sig.s)
    return new Monad({
        ...op,
        signature: signedMessage1
    })
}

// export function getAccountInitCode (owner: string, factory: SimpleAccountFactory, salt = 0): BytesLike {
export function getAccountInitCode(owner: string, factory: ethers2.Contract, salt = 0): BytesLike {
    return ethers.utils.hexConcat([
        factory.address,
        factory.interface.encodeFunctionData('createAccount', [owner, salt])
    ])
}

const mnumonic = 'test test test test test test test test test test test junk'
const path = (index: number | string) => `m/44'/60'/0'/0/${index}`

describe("Account Abstraction", function () {

    const contracts: any = {};
    const signers: any[] = [];
    const bundlerWallet = ethers.Wallet.fromMnemonic(mnumonic, path(4)).connect(ethers.provider)


    const accountInterface: ethers2.utils.Interface = new ethers2.utils.Interface([
        "function execute(address dest, uint256 value, bytes calldata func)"
    ])

    it("Deploy Entry Point", async function () {
        const EntryPoint = await ethers.getContractFactory("EntryPoint");
        contracts.entryPoint = await EntryPoint.deploy();
        console.log("EntryPoint deployed to:", contracts.entryPoint.address);
    })

    it("Deploy Account Factory", async function () {
        const SimpleAccountFactory = await ethers.getContractFactory("SimpleAccountFactory");
        contracts.simpleAccountFactory = await SimpleAccountFactory.deploy(contracts.entryPoint.address);
        console.log("SimpleAccountFactory deployed to:", contracts.simpleAccountFactory.address);

        // set implementation
        contracts.accountImplementation = await ethers.getContractAt("SimpleAccount", await contracts.simpleAccountFactory.accountImplementation());
        console.log("AccountImplementation deployed to:", contracts.accountImplementation.address);
    })

    it('Create Account With Bundler', async function () {
        signers.push(...(await ethers.getSigners()));
        const accountOwner = signers[1];
        const ownerWallet = ethers.Wallet.fromMnemonic(mnumonic, path(1))
        const bundler = signers[4];

        const accountAddress = await contracts.simpleAccountFactory.getAddress(accountOwner.address, 0);
        console.log(`Account address is ${accountAddress}`);
        console.log(`Account Balance is ${await ethers.provider.getBalance(accountAddress)}`)

        const chainId: number = await ethers.provider.getNetwork().then(n => n.chainId)
        const initCode = getAccountInitCode(accountOwner.address, contracts.simpleAccountFactory, 0)

        // 1. Create the user operation
        const userOp = new Monad({
            sender: accountAddress,
            initCode: initCode,
        })
            .bind(fillUserOpDefaults)
            .bind((uo: any) => signUserOp(uo, ownerWallet, contracts.entryPoint.address, chainId))
            .bind(show)

        // 2. Simulate validation
        await contracts.entryPoint.simulateValidation(userOp.unwrap(), {
            gasLimit: 2e6
        })
            .catch((e: any) => {
                // THIS IS NOT AN ERROR... THIS IS RETURN DATA GIVEN VIA REVERT
                const openBracketIndex = e.message.indexOf('(')
                const closeBracketIndex = e.message.indexOf(')')
                const contents = e.message.substring(openBracketIndex + 1, closeBracketIndex)
                console.log(contents)

                // contents is in the form [a,b,c,d,e,f], [a,b], [a, b], [a, b]
                // [preOpGas, prefund, sigFailed, validAfter, validUntil, paymasterContext] -- "ReturnInfo"
                // [stake, unstakeDelaySec] -- "StakeInfo" - Sender info
                // [stake, unstakeDelaySec] -- "StakeInfo" - Factory info
                // [stake, unstakeDelaySec] -- "StakeInfo" - Paymaster info
            })

        const codeAtT1 = await ethers.provider.getCode(accountAddress)
        expect(codeAtT1).to.equal('0x')

        // 3. Submit the user operation to the EntryPoint via the bundler
        const bundlersEntryPoint = await contracts.entryPoint.connect(bundlerWallet)
        console.log(`EntryPoint caller is now ${await bundlersEntryPoint.signer.getAddress()}`)
        await bundlersEntryPoint.handleOps([userOp.unwrap()], bundler.address, {
            gasLimit: 30_000_000,
        })

        console.log(`EntryPoint caller is ${contracts.entryPoint.signer.address}`)
        console.table(await Promise.all(signers.map(async s => ({
            address: s.address,
            balance: await ethers.provider.getBalance(s.address)
        }))))

        const codeAtT2 = await ethers.provider.getCode(accountAddress)
        console.log(`codeAtT2 is ${codeAtT2}`)
        expect(codeAtT2.length > 2).to.equal(true)
    })

    it('Create Account With Bundler While Doing Something else', async function () {
        const accountOwner = signers[3];
        const ownerWallet = ethers.Wallet.fromMnemonic(mnumonic, path(3))
        const bundler = signers[2];
        const target = '0x4f171744973047296d90e7828676F4972faFB200';

        const accountAddress = await contracts.simpleAccountFactory.getAddress(accountOwner.address, 0);
        console.log(`Account address is ${accountAddress}`);
        // fund account
        await signers[0].sendTransaction({
            to: accountAddress,
            value: ethers.utils.parseEther('1.0')
        })

        const chainId: number = await ethers.provider.getNetwork().then(n => n.chainId)
        const initCode = getAccountInitCode(accountOwner.address, contracts.simpleAccountFactory, 0)

        const callData = accountInterface.encodeFunctionData('execute', [target, ethers.utils.parseEther('1'), '0x'])
        console.log(`Call Data is ${callData}`)
        // 1. Create the user operation
        const userOp = new Monad({
            sender: accountAddress,
            initCode: initCode,
            callData: callData,
            callGasLimit: 100_000
        })
            .bind(fillUserOpDefaults)
            .bind((uo: any) => signUserOp(uo, ownerWallet, contracts.entryPoint.address, chainId))
            .bind(show)

        // 2. Simulate validation
        await contracts.entryPoint.simulateValidation(userOp.unwrap(), {
            gasLimit: 2e6
        })
            .catch((e: any) => {
                // THIS IS NOT AN ERROR... THIS IS RETURN DATA GIVEN VIA REVERT
                const openBracketIndex = e.message.indexOf('(')
                const closeBracketIndex = e.message.indexOf(')')
                const contents = e.message.substring(openBracketIndex + 1, closeBracketIndex)
                console.log(contents)

                // contents is in the form [a,b,c,d,e,f], [a,b], [a, b], [a, b]
                // [preOpGas, prefund, sigFailed, validAfter, validUntil, paymasterContext] -- "ReturnInfo"
                // [stake, unstakeDelaySec] -- "StakeInfo" - Sender info
                // [stake, unstakeDelaySec] -- "StakeInfo" - Factory info
                // [stake, unstakeDelaySec] -- "StakeInfo" - Paymaster info
            })

        const codeAtT1 = await ethers.provider.getCode(accountAddress)
        expect(codeAtT1).to.equal('0x')

        const targetBalanceBefore = await ethers.provider.getBalance(target)
        expect(targetBalanceBefore).to.equal(ethers.utils.parseEther('0.0'))

        // 3. Submit the user operation to the EntryPoint via the bundler
        const bundlersEntryPoint = await contracts.entryPoint.connect(bundlerWallet)
        await bundlersEntryPoint.handleOps([userOp.unwrap()], bundler.address, {
            gasLimit: 30_000_000,
        })

        const codeAtT2 = await ethers.provider.getCode(accountAddress)
        console.log(`codeAtT2 is ${codeAtT2}`)
        expect(codeAtT2.length > 2).to.equal(true)

        const targetBalanceAfter = await ethers.provider.getBalance(target)
        expect(targetBalanceAfter).to.equal(ethers.utils.parseEther('1.0'))
    })

    it('Do an operation with an existing account', async function () {
        const accountOwner = signers[3];
        const ownerWallet = ethers.Wallet.fromMnemonic(mnumonic, path(3))
        const bundler = signers[2];
        const target = '0xd90f7Fb941829CFE7Fc50eD235d1Efac05c58190';

        const accountAddress = await contracts.simpleAccountFactory.getAddress(accountOwner.address, 0);
        console.log(`Account address is ${accountAddress}`);
        // fund account
        await signers[0].sendTransaction({
            to: accountAddress,
            value: ethers.utils.parseEther('1.0')
        })

        const chainId: number = await ethers.provider.getNetwork().then(n => n.chainId)

        const callData = accountInterface.encodeFunctionData('execute', [target, ethers.utils.parseEther('1'), '0x'])
        console.log(`Call Data is ${callData}`)
        // 1. Create the user operation
        const userOp = new Monad({
            sender: accountAddress,
            callData: callData,
            callGasLimit: 100_000
        })
            .bind(fillUserOpDefaults)
            .bind((uo: any) => signUserOp(uo, ownerWallet, contracts.entryPoint.address, chainId))
            .bind(show)

        // 2. Simulate validation
        await contracts.entryPoint.simulateValidation(userOp.unwrap(), {
            gasLimit: 2e6
        })
            .catch((e: any) => {
                // THIS IS NOT AN ERROR... THIS IS RETURN DATA GIVEN VIA REVERT
                const openBracketIndex = e.message.indexOf('(')
                const closeBracketIndex = e.message.indexOf(')')
                const contents = e.message.substring(openBracketIndex + 1, closeBracketIndex)
                console.log(contents)

                // contents is in the form [a,b,c,d,e,f], [a,b], [a, b], [a, b]
                // [preOpGas, prefund, sigFailed, validAfter, validUntil, paymasterContext] -- "ReturnInfo"
                // [stake, unstakeDelaySec] -- "StakeInfo" - Sender info
                // [stake, unstakeDelaySec] -- "StakeInfo" - Factory info
                // [stake, unstakeDelaySec] -- "StakeInfo" - Paymaster info
            })



        const targetBalanceBefore = await ethers.provider.getBalance(target)
        expect(targetBalanceBefore).to.equal(ethers.utils.parseEther('0.0'))

        // 3. Submit the user operation to the EntryPoint via the bundler
        const bundlersEntryPoint = await contracts.entryPoint.connect(bundlerWallet)
        await bundlersEntryPoint.handleOps([userOp.unwrap()], bundler.address, {
            gasLimit: 30_000_000,
        })

        const targetBalanceAfter = await ethers.provider.getBalance(target)
        expect(targetBalanceAfter).to.equal(ethers.utils.parseEther('1.0'))
    })
});
