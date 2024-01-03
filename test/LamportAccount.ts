import { expect } from "chai";
import { ethers } from "hardhat";
import { ethers as ethers2 } from 'ethers'
import KeyTrackerC from 'lamportwalletmanager/src/KeyTrackerC'
import { sign_hash, startTimer } from "lamportwalletmanager/src";
import Monad from "../scripts/library/Monad";
import { UserOperation, ecdsaSign, fillUserOpDefaults, getUserOpHash, lamportSignUserOp, packUserOp } from "../scripts/library/UserOperation";
import getAccountInitCode from "../scripts/library/getAccountInitCode";
import KeyTrackerB from "lamportwalletmanager/src/KeyTrackerB";
import { StandardMerkleTree } from "@openzeppelin/merkle-tree";
import { loremIpsum } from "lorem-ipsum";
import {
    defaultAbiCoder,
} from 'ethers/lib/utils'

const show = (value: any) => {
    console.log(`value: `, value)
    return Monad.of(value)
}

const lamportSignUserOp_BAD1 = (op: UserOperation, signer: ethers2.Wallet, entryPoint: string, chainId: number, keys: KeyTrackerC): Monad<UserOperation> => {
    // const ecdsaSig = ecdsaSign(op, signer, entryPoint, chainId)

    const message = getUserOpHash(op, entryPoint, chainId)
    const message2 = ethers.utils.hashMessage(ethers.utils.arrayify(message))
    const signingKeys = keys.getOne()
    const signature = sign_hash(message2, signingKeys.pri)

    signature[0] = signature[0].replace('1', '2').replace('3', '4')

    // const packedSignature = ethers.utils.defaultAbiCoder.encode(['bytes[256]', 'bytes32[2][256]', 'bytes'], [signature, signingKeys.pub, ecdsaSig])
    const packedSignature = ethers.utils.defaultAbiCoder.encode(['bytes[256]', 'bytes32[2][256]'], [signature, signingKeys.pub])

    return Monad.of({
        ...op,
        signature: packedSignature
    } as UserOperation)
}

const lamportSignUserOp_BAD2 = (op: UserOperation, signer: ethers2.Wallet, entryPoint: string, chainId: number, keys: KeyTrackerC): Monad<UserOperation> => {
    const ecdsaSig = ecdsaSign(op, signer, entryPoint, chainId)

    // if last char is a 0 replace it with a 1, otherwise replace it with a 0
    const badEcdsaSig = ecdsaSig.slice(0, -1) + (ecdsaSig.slice(-1) === '0' ? '1' : '0')

    console.log(ecdsaSig)
    console.log(badEcdsaSig)

    const message = getUserOpHash(op, entryPoint, chainId)
    const message2 = ethers.utils.hashMessage(ethers.utils.arrayify(message))
    const signingKeys = keys.getOne()
    const signature = sign_hash(message2, signingKeys.pri)

    const packedSignature = ethers.utils.defaultAbiCoder.encode(['bytes[256]', 'bytes32[2][256]', 'bytes'], [signature, signingKeys.pub, badEcdsaSig])

    return Monad.of({
        ...op,
        signature: packedSignature
    } as UserOperation)
}

const mnumonic = 'test test test test test test test test test test test junk'
const path = (index: number | string) => `m/44'/60'/0'/0/${index}`

const checkError = (e: any) => {
    const preOpGas = e.errorArgs[0][0]
    const prefund = e.errorArgs[0][1]
    const sigFailed = e.errorArgs[0][2]
    const validAfter = e.errorArgs[0][3]
    const validUntil = e.errorArgs[0][4]
    const paymasterContext = e.errorArgs[0][5]

    console.log(`\n`)
    console.log(`${'preOpGas '.padEnd(20, '.')} ${preOpGas}`)
    console.log(`${'prefund '.padEnd(20, '.')} ${prefund}`)
    console.log(`${'sigFailed '.padEnd(20, '.')} ${sigFailed}`)

    expect(sigFailed).to.equal(false)

    console.log(`${'validAfter '.padEnd(20, '.')} ${validAfter}`)
    console.log(`${'validUntil '.padEnd(20, '.')} ${validUntil}`)
    console.log(`${'paymasterContext '.padEnd(20, '.')} ${paymasterContext}`)
}

describe("Lamport Account Abstraction", function () {
    const contracts: any = {};
    const signers: any[] = [];
    const bundlerWallet = ethers.Wallet.fromMnemonic(mnumonic, path(4)).connect(ethers.provider)
    const friendlyWallet = ethers.Wallet.fromMnemonic(mnumonic, path(7)).connect(ethers.provider)
    const signer1 = ethers.Wallet.fromMnemonic(mnumonic, path(0)).connect(ethers.provider)
    let chainId: number = 0
    let counterfactual: string = ''
    let bundlersEntryPoint: ethers2.Contract | null = null
    let bundlersSecondEntryPoint: ethers2.Contract | null = null

    // Setup initial keys
    const keys = new KeyTrackerC()
    const initialKeys = keys.more(20)
    const initialKeyHashes = initialKeys.map(k => k.pkh)

    const accountInterface: ethers2.utils.Interface = new ethers2.utils.Interface([
        "function execute(address dest, uint256 value, bytes calldata func)",
        "function addPublicKeyHashes(bytes32[] memory publicKeyHashesToAdd)",
        "function removePublicKeyHashes(bytes32[] memory publicKeyHashesToRemove)",
        "function togglePause()",
        "function asyncTransfer(address dest, uint256 value)",
        "function setExtensionContract(bytes32 extensionId, address extensionAddress)",
        "function endorseMessage(bytes32 message)",
        "function isValidSignature(bytes32 hash, bytes memory missing)",
        "function executeBatch(address[] calldata dest, bytes[] calldata func)",
        "function endorseMerkleRoot(bytes32 merkleRoot) public",
        "function upgradeTo(address newImplementation)",
        "function initializePullPaymentsAndERC777Support()",
        "function executeBatchWithValue(address[] calldata dest, uint256[] calldata value,  bytes[] calldata func)"
    ])

    before(async function () {
        chainId = await ethers.provider.getNetwork().then(n => n.chainId)

        // Set Signers
        signers.push(...(await ethers.getSigners()));

        {   // Deploy 1820 Registry 
            const presignedTransaction = `0xf90a388085174876e800830c35008080b909e5608060405234801561001057600080fd5b506109c5806100206000396000f3fe608060405234801561001057600080fd5b50600436106100a5576000357c010000000000000000000000000000000000000000000000000000000090048063a41e7d5111610078578063a41e7d51146101d4578063aabbb8ca1461020a578063b705676514610236578063f712f3e814610280576100a5565b806329965a1d146100aa5780633d584063146100e25780635df8122f1461012457806365ba36c114610152575b600080fd5b6100e0600480360360608110156100c057600080fd5b50600160a060020a038135811691602081013591604090910135166102b6565b005b610108600480360360208110156100f857600080fd5b5035600160a060020a0316610570565b60408051600160a060020a039092168252519081900360200190f35b6100e06004803603604081101561013a57600080fd5b50600160a060020a03813581169160200135166105bc565b6101c26004803603602081101561016857600080fd5b81019060208101813564010000000081111561018357600080fd5b82018360208201111561019557600080fd5b803590602001918460018302840111640100000000831117156101b757600080fd5b5090925090506106b3565b60408051918252519081900360200190f35b6100e0600480360360408110156101ea57600080fd5b508035600160a060020a03169060200135600160e060020a0319166106ee565b6101086004803603604081101561022057600080fd5b50600160a060020a038135169060200135610778565b61026c6004803603604081101561024c57600080fd5b508035600160a060020a03169060200135600160e060020a0319166107ef565b604080519115158252519081900360200190f35b61026c6004803603604081101561029657600080fd5b508035600160a060020a03169060200135600160e060020a0319166108aa565b6000600160a060020a038416156102cd57836102cf565b335b9050336102db82610570565b600160a060020a031614610339576040805160e560020a62461bcd02815260206004820152600f60248201527f4e6f7420746865206d616e616765720000000000000000000000000000000000604482015290519081900360640190fd5b6103428361092a565b15610397576040805160e560020a62461bcd02815260206004820152601a60248201527f4d757374206e6f7420626520616e204552433136352068617368000000000000604482015290519081900360640190fd5b600160a060020a038216158015906103b85750600160a060020a0382163314155b156104ff5760405160200180807f455243313832305f4143434550545f4d4147494300000000000000000000000081525060140190506040516020818303038152906040528051906020012082600160a060020a031663249cb3fa85846040518363ffffffff167c01000000000000000000000000000000000000000000000000000000000281526004018083815260200182600160a060020a0316600160a060020a031681526020019250505060206040518083038186803b15801561047e57600080fd5b505afa158015610492573d6000803e3d6000fd5b505050506040513d60208110156104a857600080fd5b5051146104ff576040805160e560020a62461bcd02815260206004820181905260248201527f446f6573206e6f7420696d706c656d656e742074686520696e74657266616365604482015290519081900360640190fd5b600160a060020a03818116600081815260208181526040808320888452909152808220805473ffffffffffffffffffffffffffffffffffffffff19169487169485179055518692917f93baa6efbd2244243bfee6ce4cfdd1d04fc4c0e9a786abd3a41313bd352db15391a450505050565b600160a060020a03818116600090815260016020526040812054909116151561059a5750806105b7565b50600160a060020a03808216600090815260016020526040902054165b919050565b336105c683610570565b600160a060020a031614610624576040805160e560020a62461bcd02815260206004820152600f60248201527f4e6f7420746865206d616e616765720000000000000000000000000000000000604482015290519081900360640190fd5b81600160a060020a031681600160a060020a0316146106435780610646565b60005b600160a060020a03838116600081815260016020526040808220805473ffffffffffffffffffffffffffffffffffffffff19169585169590951790945592519184169290917f605c2dbf762e5f7d60a546d42e7205dcb1b011ebc62a61736a57c9089d3a43509190a35050565b600082826040516020018083838082843780830192505050925050506040516020818303038152906040528051906020012090505b92915050565b6106f882826107ef565b610703576000610705565b815b600160a060020a03928316600081815260208181526040808320600160e060020a031996909616808452958252808320805473ffffffffffffffffffffffffffffffffffffffff19169590971694909417909555908152600284528181209281529190925220805460ff19166001179055565b600080600160a060020a038416156107905783610792565b335b905061079d8361092a565b156107c357826107ad82826108aa565b6107b85760006107ba565b815b925050506106e8565b600160a060020a0390811660009081526020818152604080832086845290915290205416905092915050565b6000808061081d857f01ffc9a70000000000000000000000000000000000000000000000000000000061094c565b909250905081158061082d575080155b1561083d576000925050506106e8565b61084f85600160e060020a031961094c565b909250905081158061086057508015155b15610870576000925050506106e8565b61087a858561094c565b909250905060018214801561088f5750806001145b1561089f576001925050506106e8565b506000949350505050565b600160a060020a0382166000908152600260209081526040808320600160e060020a03198516845290915281205460ff1615156108f2576108eb83836107ef565b90506106e8565b50600160a060020a03808316600081815260208181526040808320600160e060020a0319871684529091529020549091161492915050565b7bffffffffffffffffffffffffffffffffffffffffffffffffffffffff161590565b6040517f01ffc9a7000000000000000000000000000000000000000000000000000000008082526004820183905260009182919060208160248189617530fa90519096909550935050505056fea165627a7a72305820377f4a2d4301ede9949f163f319021a6e9c687c292a5e2b2c4734c126b524e6c00291ba01820182018201820182018201820182018201820182018201820182018201820a01820182018201820182018201820182018201820182018201820182018201820`

            // fund deployer
            await signers[0].sendTransaction({
                to: '0xa990077c3205cbDf861e17Fa532eeB069cE9fF96', // specified in EIP1820
                value: ethers.utils.parseEther('0.8')
            })

            await ethers.provider.sendTransaction(presignedTransaction)
        }

        // Deploy EntryPoint
        const EntryPoint = await ethers.getContractFactory("EntryPoint");
        contracts.entryPoint = await EntryPoint.deploy();
        console.log("EntryPoint deployed to:", contracts.entryPoint.address);
        bundlersEntryPoint = await contracts.entryPoint.connect(bundlerWallet)

        // Deploy Factory
        const LamportAccountFactory = await ethers.getContractFactory("LamportAccountFactory");
        contracts.lamportAccountFactory = await LamportAccountFactory.deploy(contracts.entryPoint.address);

        // const temp = await LamportAccountFactory.deploy(contracts.entryPoint.address);
        // contracts.lamportAccountFactory = (new ethers2.Contract(temp.address, [
        //     'function createAccount(address owner,uint256 salt, bytes32[] memory firstLamportKeys)',
        //     'function getAddress(address owner,uint256 salt,  bytes32[] memory firstLamportKeys)'
        // ],)).connect(signers[0])
        console.log("LamportAccountFactory deployed to:", contracts.lamportAccountFactory.address);

        // Find counterfactual address
        counterfactual = await contracts.lamportAccountFactory.getAddress(signers[0].address, 0, initialKeyHashes);
        console.log("Counterfactual Address:", counterfactual);
    })

    it("Create a new Lamport Account", async function () {
        const initCode = getAccountInitCode(signer1.address, contracts.lamportAccountFactory, 0, initialKeyHashes)

        const target = ethers2.Wallet.createRandom()
        expect((await ethers.provider.getBalance(target.address)).toString()).to.equal('0')

        // Fund counterfactual address
        await signers[0].sendTransaction({
            to: counterfactual,
            value: ethers.utils.parseEther('1.0')
        })

        const ep = await contracts.entryPoint.connect(signers[0])
        // deposit to the counterfactual address
        await ep.depositTo(counterfactual, {
            // value: ethers.utils.parseEther('1.0')
            value: ethers.utils.parseEther('0.1')
        })

        const deposit = await ep.balanceOf(counterfactual)
        console.log('deposit', deposit.toString())
        // expect(deposit).to.equal(ethers.utils.parseEther('1.0'))
        expect(deposit).to.equal(ethers.utils.parseEther('0.1'))

        // const callData = accountInterface.encodeFunctionData('execute', [target.address, ethers.utils.parseEther('0.11'), '0x'])
        const callData = accountInterface.encodeFunctionData('executeBatchWithValue', [
            [
                target.address,
                counterfactual,
            ],
            [
                ethers.utils.parseEther('0.11'),
                0,
            ],
            [
                '0x',
                accountInterface.encodeFunctionData('initializePullPaymentsAndERC777Support', []),
            ],
        ])

        const userOp = Monad.of({
            sender: counterfactual,
            initCode: initCode,
            callData: callData,
            callGasLimit: 10_000_000,
        })
            .bind(fillUserOpDefaults)
            .bind((uo: any) => lamportSignUserOp(uo, signer1, contracts.entryPoint.address, chainId, keys))
            .bind(show)

        await contracts.entryPoint.callStatic.simulateValidation(userOp.unwrap(), {
            gasLimit: 4e6
        })
            .catch((e: any) => {
                // THIS IS NOT AN ERROR... THIS IS RETURN DATA GIVEN VIA REVERT
                checkError(e)
            })

        const codeAtT1 = await ethers.provider.getCode(counterfactual)
        expect(codeAtT1).to.equal('0x')

        await bundlersEntryPoint?.handleOps([userOp.unwrap()], bundlerWallet.address, {
            gasLimit: 30_000_000,
        })

        const codeAtT2 = await ethers.provider.getCode(counterfactual)
        console.log(`codeAtT2 is ${codeAtT2}`)
        expect(codeAtT2.length > 2).to.equal(true)

        expect((await ethers.provider.getBalance(target.address)).toString()).to.equal(ethers.utils.parseEther('0.11').toString())


        const contract = await ethers.getContractAt('LamportAccount', counterfactual)
        const liveKeyCount = await contract.liveKeyCount()

        console.log(`liveKeyCount is ${liveKeyCount}`)
        expect(liveKeyCount.toNumber()).to.equal(initialKeys.length - 1)

        const entryPointAccordingToContract = await contract.entryPoint()
        expect(entryPointAccordingToContract).to.equal(contracts.entryPoint.address)
        expect(entryPointAccordingToContract).to.not.equal(ethers.constants.AddressZero)
        console.log(`entryPointAccordingToContract is ${entryPointAccordingToContract}`)
    })

    it("Send UserOperations", async function () {
        const target = ethers2.Wallet.createRandom()
        expect((await ethers.provider.getBalance(target.address)).toString()).to.equal('0')

        const callData = accountInterface.encodeFunctionData('execute', [target.address, ethers.utils.parseEther('0.1'), '0x'])

        console.log(`keys.count is ${keys.count}`)

        const userOp = Monad.of({
            sender: counterfactual,
            callData: callData,
            callGasLimit: 100_000,
            nonce: 1,
        })
            .bind(fillUserOpDefaults)
            .bind((uo: any) => lamportSignUserOp(uo, signer1, contracts.entryPoint.address, chainId, keys))

        await contracts.entryPoint.callStatic.simulateValidation(userOp.unwrap(), {
            gasLimit: 2e6
        })
            .catch((e: any) => {
                // THIS IS NOT AN ERROR... THIS IS RETURN DATA GIVEN VIA REVERT
                const openBracketIndex = e.message.indexOf('(')
                const closeBracketIndex = e.message.indexOf(')')
                const contents = e.message.substring(openBracketIndex + 1, closeBracketIndex)
                // console.log(contents)
                console.log(e.message)

                // checkError(e)
            })

        await bundlersEntryPoint?.handleOps([userOp.unwrap()], bundlerWallet.address, {
            gasLimit: 30_000_000,
        })

        expect((await ethers.provider.getBalance(target.address)).toString()).to.equal(ethers.utils.parseEther('0.1').toString())
    })

    it("Send Another UserOperations - must update nonce", async function () {
        const target = ethers2.Wallet.createRandom()
        expect((await ethers.provider.getBalance(target.address)).toString()).to.equal('0')

        const callData = accountInterface.encodeFunctionData('execute', [target.address, ethers.utils.parseEther('0.1'), '0x'])

        console.log(`keys.count is ${keys.count}`)

        const userOp = Monad.of({
            sender: counterfactual,
            callData: callData,
            callGasLimit: 100_000,
            nonce: 2,
        })
            .bind(fillUserOpDefaults)
            .bind((uo: any) => lamportSignUserOp(uo, signer1, contracts.entryPoint.address, chainId, keys))

        {   // Before we call simulateValidation lets deconstruct our signature and make sure it makes sense
            const sig = userOp.unwrap().signature
            const unpackedSignature = ethers.utils.defaultAbiCoder.decode(['bytes[256]', 'bytes32[2][256]', 'bytes'], sig)
            console.log(unpackedSignature)

            // const [
            //     lamportSignature,
            //     lamportPubKey,
            //     ecdsaSignature
            // ] = unpackedSignature

            // console.log(`Selected Key Hash:  ${selectedKeyHash}`)
            // console.log(`Initial Key Hashes:`, initialKeyHashes)
            // const index = initialKeyHashes.indexOf(selectedKeyHash)
            // console.log(`Index of selected key hash: ${index}`)

            // expect(index).to.not.equal(-1)
        }
        await contracts.entryPoint.callStatic.simulateValidation(userOp.unwrap(), {
            gasLimit: 2e6
        })
            .catch((e: any) => {
                // THIS IS NOT AN ERROR... THIS IS RETURN DATA GIVEN VIA REVERT
                // const openBracketIndex = e.message.indexOf('(')
                // const closeBracketIndex = e.message.indexOf(')')
                // const contents = e.message.substring(openBracketIndex + 1, closeBracketIndex)
                // console.log(contents)
                checkError(e)
            })

        await bundlersEntryPoint?.handleOps([userOp.unwrap()], bundlerWallet.address, {
            gasLimit: 30_000_000,
        })

        expect((await ethers.provider.getBalance(target.address)).toString()).to.equal(ethers.utils.parseEther('0.1').toString())
    })

    it("Ruin Signature [Lamport Part]", async function () {
        const target = ethers2.Wallet.createRandom()
        expect((await ethers.provider.getBalance(target.address)).toString()).to.equal('0')

        const callData = accountInterface.encodeFunctionData('execute', [target.address, ethers.utils.parseEther('0.1'), '0x'])

        console.log(`keys.count is ${keys.count}`)

        const userOp = Monad.of({
            sender: counterfactual,
            callData: callData,
            callGasLimit: 100_000,
            nonce: 3,
        })
            .bind(fillUserOpDefaults)
            .bind((uo: any) => lamportSignUserOp_BAD1(uo, signer1, contracts.entryPoint.address, chainId, keys))

        let failed = false
        await bundlersEntryPoint?.handleOps([userOp.unwrap()], bundlerWallet.address, {
            gasLimit: 30_000_000,
        })
            .catch((e: any) => {
                failed = true
            })

        expect(failed).to.equal(true)
    })

    it.skip("Ruin Signature [ECDSA Part]", async function () {
        const target = ethers2.Wallet.createRandom()
        expect((await ethers.provider.getBalance(target.address)).toString()).to.equal('0')

        const callData = accountInterface.encodeFunctionData('execute', [target.address, ethers.utils.parseEther('0.1'), '0x'])

        console.log(`keys.count is ${keys.count}`)

        const userOp = Monad.of({
            sender: counterfactual,
            callData: callData,
            callGasLimit: 100_000,
            nonce: 3,
        })
            .bind(fillUserOpDefaults)
            .bind((uo: any) => lamportSignUserOp_BAD2(uo, signer1, contracts.entryPoint.address, chainId, keys))

        let failed = false
        await bundlersEntryPoint?.handleOps([userOp.unwrap()], bundlerWallet.address, {
            gasLimit: 30_000_000,
        })
            .catch((e: any) => {
                failed = true
            })

        expect(failed).to.equal(true)
    })

    it("Try Signing with a key that doesn't exist", async function () {
        const target = ethers2.Wallet.createRandom()
        expect((await ethers.provider.getBalance(target.address)).toString()).to.equal('0')

        const callData = accountInterface.encodeFunctionData('execute', [target.address, ethers.utils.parseEther('0.1'), '0x'])

        const badKeys = new KeyTrackerC()
        badKeys.more(20)

        const userOp = Monad.of({
            sender: counterfactual,
            callData: callData,
            callGasLimit: 100_000,
            nonce: 3
        })
            .bind(fillUserOpDefaults)
            .bind((uo: any) => lamportSignUserOp(uo, signer1, contracts.entryPoint.address, chainId, badKeys))

        let failed = false
        await bundlersEntryPoint?.handleOps([userOp.unwrap()], bundlerWallet.address, {
            gasLimit: 30_000_000,
        })
            .catch((e: any) => {
                failed = true
            })

        expect(failed).to.equal(true)

    })

    it("Add more lamport keys", async function () {
        const contract = await ethers.getContractAt('LamportAccount', counterfactual)
        const liveKeyCountA = await contract.liveKeyCount()
        console.log(`liveKeyCount is ${liveKeyCountA}`)

        const additionalKeys = keys.more(50)
        const additionalKeyHashes = additionalKeys.map(k => k.pkh)

        const callData = accountInterface.encodeFunctionData(
            'addPublicKeyHashes',
            [additionalKeyHashes]
        )

        const userOp = Monad.of({
            sender: counterfactual,
            callData: callData,
            callGasLimit: 10_000_000,
            nonce: 3
        })
            .bind(fillUserOpDefaults)
            .bind((uo: any) => lamportSignUserOp(uo, signer1, contracts.entryPoint.address, chainId, keys))

        await bundlersEntryPoint?.handleOps([userOp.unwrap()], bundlerWallet.address, {
            gasLimit: 30_000_000,
        })

        const liveKeyCountB = await contract.liveKeyCount()
        console.log(`liveKeyCount is ${liveKeyCountB}`)
        expect(liveKeyCountB.toNumber()).to.be.greaterThan(liveKeyCountA.toNumber())
    })

    it("Remove some lamport keys", async function () {
        const contract = await ethers.getContractAt('LamportAccount', counterfactual)
        const liveKeyCountA = await contract.liveKeyCount()

        const keysToRemove = keys.getN(10)
        const keysToRemoveHashes = keysToRemove.map(k => k.pkh)

        const callData = accountInterface.encodeFunctionData(
            'removePublicKeyHashes',
            [keysToRemoveHashes]
        )

        const userOp = Monad.of({
            sender: counterfactual,
            callData: callData,
            callGasLimit: 10_000_000,
            nonce: 4
        })
            .bind(fillUserOpDefaults)
            .bind((uo: any) => lamportSignUserOp(uo, signer1, contracts.entryPoint.address, chainId, keys))

        await bundlersEntryPoint?.handleOps([userOp.unwrap()], bundlerWallet.address, {
            gasLimit: 30_000_000,
        })

        const liveKeyCountB = await contract.liveKeyCount()
        expect(liveKeyCountB.toNumber()).to.equal(liveKeyCountA.toNumber() - 11) // 11 because we removed 10 keys but also spent one key to sign the transaction 
    })

    it("Pause and Unpause", async function () {
        const contract = await ethers.getContractAt('LamportAccount', counterfactual)
        const isPausedA = await contract.paused()
        expect(isPausedA).to.equal(false)

        const callData = accountInterface.encodeFunctionData(
            'togglePause',
            []
        )
        const userOp = Monad.of({
            sender: counterfactual,
            callData: callData,
            callGasLimit: 10_000_000,
            nonce: 5
        })
            .bind(fillUserOpDefaults)
            .bind((uo: any) => lamportSignUserOp(uo, signer1, contracts.entryPoint.address, chainId, keys))

        await bundlersEntryPoint?.handleOps([userOp.unwrap()], bundlerWallet.address, {
            gasLimit: 30_000_000,
        })

        const isPausedB = await contract.paused()
        expect(isPausedB).to.equal(true)

        const userOp2 = userOp
            .bind((uo: any) => Monad.of({
                ...uo,
                nonce: 6,
            }))
            .bind((uo: any) => lamportSignUserOp(uo, signer1, contracts.entryPoint.address, chainId, keys))

        await bundlersEntryPoint?.handleOps([userOp2.unwrap()], bundlerWallet.address, {
            gasLimit: 30_000_000,
        })

        const isPausedC = await contract.paused()
        expect(isPausedC).to.equal(false)
    })

    // ETHER METHODS
    it("Send Ether Via Pull Payment", async function () {
        const target = ethers2.Wallet.createRandom()
        expect((await ethers.provider.getBalance(target.address)).toString()).to.equal('0')

        const callData = accountInterface.encodeFunctionData('asyncTransfer', [target.address, ethers.utils.parseEther('0.1')])

        const userOp = Monad.of({
            sender: counterfactual,
            callData: callData,
            callGasLimit: 100_000,
            nonce: 7
        })
            .bind(fillUserOpDefaults)
            .bind((uo: any) => lamportSignUserOp(uo, signer1, contracts.entryPoint.address, chainId, keys))

        await bundlersEntryPoint?.handleOps([userOp.unwrap()], bundlerWallet.address, {
            gasLimit: 30_000_000,
        })

        expect((await ethers.provider.getBalance(target.address)).toString()).to.equal('0')

        const contract = (await ethers.getContractAt('LamportAccount', counterfactual)).connect(friendlyWallet)
        await contract.withdrawPayments(target.address)

        expect((await ethers.provider.getBalance(target.address)).toString()).to.equal(ethers.utils.parseEther('0.1').toString())
    })

    // ERC20 METHODS
    it("Send And Receive ERC20", async function () {
        const TestToken = await ethers.getContractFactory("TestToken")
        const testToken = (await TestToken.deploy()).connect(friendlyWallet)

        await testToken.mint(friendlyWallet.address, ethers.utils.parseEther('1000'))

        expect(await testToken.balanceOf(counterfactual)).to.equal('0')
        // send to account
        await testToken.transfer(counterfactual, ethers.utils.parseEther('100'))

        expect(await testToken.balanceOf(counterfactual)).to.equal(ethers.utils.parseEther('100'))

        const target = ethers2.Wallet.createRandom()

        expect(await testToken.balanceOf(target.address)).to.equal('0')

        const callData = accountInterface.encodeFunctionData('execute', [
            testToken.address,
            0,
            testToken.interface.encodeFunctionData('transfer', [target.address, ethers.utils.parseEther('10')])
        ])

        const userOp = Monad.of({
            sender: counterfactual,
            callData: callData,
            callGasLimit: 100_000,
            nonce: 8
        })
            .bind(fillUserOpDefaults)
            .bind((uo: any) => lamportSignUserOp(uo, signer1, contracts.entryPoint.address, chainId, keys))

        await bundlersEntryPoint?.handleOps([userOp.unwrap()], bundlerWallet.address, {
            gasLimit: 30_000_000,
        })

        expect(await testToken.balanceOf(target.address)).to.equal(ethers.utils.parseEther('10'))
    })

    it("Send And Receive ERC777", async function () {
        const Example777 = await ethers.getContractFactory("Example777")
        const example777 = (await Example777.deploy({
            gasLimit: 10_000_000
        })).connect(friendlyWallet)

        await example777.mint(friendlyWallet.address, ethers.utils.parseEther('1000'))
        expect(await example777.balanceOf(counterfactual)).to.equal('0')

        await example777.send(counterfactual, ethers.utils.parseEther('100'), '0x')
        expect(await example777.balanceOf(counterfactual)).to.equal(ethers.utils.parseEther('100'))

        const target = ethers2.Wallet.createRandom()
        expect(await example777.balanceOf(target.address)).to.equal('0')

        const callData = accountInterface.encodeFunctionData('execute', [
            example777.address,
            0,
            example777.interface.encodeFunctionData('send', [target.address, ethers.utils.parseEther('10'), '0x'])
        ])

        const userOp = Monad.of({
            sender: counterfactual,
            callData: callData,
            callGasLimit: 100_000,
            nonce: 9
        })
            .bind(fillUserOpDefaults)
            .bind((uo: any) => lamportSignUserOp(uo, signer1, contracts.entryPoint.address, chainId, keys))

        await bundlersEntryPoint?.handleOps([userOp.unwrap()], bundlerWallet.address, {
            gasLimit: 30_000_000,
        })

        expect(await example777.balanceOf(target.address)).to.equal(ethers.utils.parseEther('10'))
    })

    it("Send And Receive ERC4626", async function () {
        const TestToken = await ethers.getContractFactory("TestToken")
        const testToken = (await TestToken.deploy()).connect(friendlyWallet)
        await testToken.mint(friendlyWallet.address, ethers.utils.parseEther('1000'))

        const Example4626 = await ethers.getContractFactory("Example4626")
        const example4626 = (await Example4626.deploy(testToken.address, {
            gasLimit: 10_000_000
        })).connect(friendlyWallet)

        await testToken.approve(example4626.address, ethers.utils.parseEther('1000'))
        await example4626.deposit(ethers.utils.parseEther('1000'), friendlyWallet.address)

        expect(await example4626.balanceOf(counterfactual)).to.equal('0')
        await example4626.transfer(counterfactual, ethers.utils.parseEther('100'))

        expect(await example4626.balanceOf(counterfactual)).to.equal(ethers.utils.parseEther('100'))

        const target = ethers2.Wallet.createRandom()
        expect(await example4626.balanceOf(target.address)).to.equal('0')

        const callData = accountInterface.encodeFunctionData('execute', [
            example4626.address,
            0,
            example4626.interface.encodeFunctionData('transfer', [target.address, ethers.utils.parseEther('10')])
        ])

        const userOp = Monad.of({
            sender: counterfactual,
            callData: callData,
            callGasLimit: 100_000,
            nonce: 10
        })
            .bind(fillUserOpDefaults)
            .bind((uo: any) => lamportSignUserOp(uo, signer1, contracts.entryPoint.address, chainId, keys))

        await bundlersEntryPoint?.handleOps([userOp.unwrap()], bundlerWallet.address, {
            gasLimit: 30_000_000,
        })

        expect(await example4626.balanceOf(target.address)).to.equal(ethers.utils.parseEther('10'))
    })


    it("Send and Receive ERC721", async function () {
        const Example721 = await ethers.getContractFactory("Example721")
        const example721 = (await Example721.deploy({
            gasLimit: 10_000_000
        })).connect(friendlyWallet)

        await example721.mint(friendlyWallet.address, 1)
        expect(await example721.balanceOf(counterfactual)).to.equal('0')

        await example721.transferFrom(friendlyWallet.address, counterfactual, 1)
        expect(await example721.balanceOf(counterfactual)).to.equal(1)

        const target = ethers2.Wallet.createRandom()
        expect(await example721.balanceOf(target.address)).to.equal('0')

        const callData = accountInterface.encodeFunctionData('execute', [
            example721.address,
            0,
            example721.interface.encodeFunctionData('safeTransferFrom(address from, address to, uint256 tokenId, bytes memory data)', [counterfactual, target.address, 1, '0x'])
        ])

        const userOp = Monad.of({
            sender: counterfactual,
            callData: callData,
            callGasLimit: 100_000,
            nonce: 11
        })
            .bind(fillUserOpDefaults)
            .bind((uo: any) => lamportSignUserOp(uo, signer1, contracts.entryPoint.address, chainId, keys))

        await bundlersEntryPoint?.handleOps([userOp.unwrap()], bundlerWallet.address, {
            gasLimit: 30_000_000,
        })

        expect(await example721.balanceOf(target.address)).to.equal(1)
    })

    it("Send and Receive ERC1155", async function () {
        const Example1155 = await ethers.getContractFactory("Example1155")
        const example1155 = (await Example1155.deploy({
            gasLimit: 10_000_000
        }))

        expect((await example1155.balanceOf(counterfactual, 1)).toString()).to.equal('0')
        // transfer from signer 0 to counterfactual
        await example1155.safeTransferFrom(signers[0].address, counterfactual, 1, 1, '0x')

        expect((await example1155.balanceOf(counterfactual, 1)).toString()).to.equal('1')

        const target = ethers2.Wallet.createRandom()
        expect((await example1155.balanceOf(target.address, 1)).toString()).to.equal('0')

        const callData = accountInterface.encodeFunctionData('execute', [
            example1155.address,
            0,
            example1155.interface.encodeFunctionData('safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes memory data)', [counterfactual, target.address, 1, 1, '0x'])
        ])

        const userOp = Monad.of({
            sender: counterfactual,
            callData: callData,
            callGasLimit: 100_000,
            nonce: 12
        })
            .bind(fillUserOpDefaults)
            .bind((uo: any) => lamportSignUserOp(uo, signer1, contracts.entryPoint.address, chainId, keys))

        await bundlersEntryPoint?.handleOps([userOp.unwrap()], bundlerWallet.address, {
            gasLimit: 30_000_000,
        })

        expect((await example1155.balanceOf(target.address, 1)).toString()).to.equal('1')
    })

    it("Use additional lamb features - store arbitratry data", async function () {
        const extensionId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('arbitrarydata.lamb.namespace.pauligroup.eth'))

        const ArbitraryDataStorage = await ethers.getContractFactory("ArbitraryDataStorage")
        const arbitraryDataStorage = (await ArbitraryDataStorage.deploy(counterfactual, {
            gasLimit: 10_000_000
        }))

        const callData = accountInterface.encodeFunctionData('setExtensionContract', [
            extensionId,
            arbitraryDataStorage.address
        ])

        const userOp = Monad.of({
            sender: counterfactual,
            callData: callData,
            callGasLimit: 100_000,
            nonce: 13
        })
            .bind(fillUserOpDefaults)
            .bind((uo: any) => lamportSignUserOp(uo, signer1, contracts.entryPoint.address, chainId, keys))

        await bundlersEntryPoint?.handleOps([userOp.unwrap()], bundlerWallet.address, {
            gasLimit: 30_000_000,
        })

        const callData2 = accountInterface.encodeFunctionData('execute', [
            arbitraryDataStorage.address,
            0,
            arbitraryDataStorage.interface.encodeFunctionData('setData(bytes32, bytes memory)', [
                ethers.utils.keccak256(ethers.utils.toUtf8Bytes('twitter')),
                ethers.utils.toUtf8Bytes('https://twitter.com/william00000010')
            ])
        ])

        const userOp2 = Monad.of({
            sender: counterfactual,
            callData: callData2,
            callGasLimit: 100_000,
            nonce: 14
        })
            .bind(fillUserOpDefaults)
            .bind((uo: any) => lamportSignUserOp(uo, signer1, contracts.entryPoint.address, chainId, keys))

        await bundlersEntryPoint?.handleOps([userOp2.unwrap()], bundlerWallet.address, {
            gasLimit: 30_000_000,
        })

        // READ THE DATA -- assume you don't know the address of the extension
        const accountContract = await ethers.getContractAt('LamportAccount', counterfactual)
        const extensionAddress = await accountContract.getExtensionContract(extensionId)

        expect(extensionAddress).to.equal(arbitraryDataStorage.address)

        const arbitraryDataStorage2 = await ethers.getContractAt('ArbitraryDataStorage', extensionAddress)
        const twitter = await arbitraryDataStorage2.getData(ethers.utils.keccak256(ethers.utils.toUtf8Bytes('twitter')))

        expect(ethers.utils.toUtf8String(twitter)).to.equal('https://twitter.com/william00000010')
        console.log(ethers.utils.toUtf8String(twitter))
    })

    it("Endorse human messages", async function () {
        const humanMessage = 'Meet me by the by the docks at 3am with the package. be there or be square.'
        const humanMessageHash = ethers.utils.id(humanMessage)

        const callData = accountInterface.encodeFunctionData('endorseMessage(bytes32)', [
            humanMessageHash
        ])

        const userOp = Monad.of({
            sender: counterfactual,
            callData: callData,
            callGasLimit: 100_000,
            nonce: 15
        })
            .bind(fillUserOpDefaults)
            .bind((uo: any) => lamportSignUserOp(uo, signer1, contracts.entryPoint.address, chainId, keys))

        await bundlersEntryPoint?.handleOps([userOp.unwrap()], bundlerWallet.address, {
            gasLimit: 30_000_000,
        })

        // check message was endorsed
        const accountContract = await ethers.getContractAt('LamportAccount', counterfactual)
        const didSayThing = await accountContract.isValidSignature(humanMessageHash, '0x')

        console.log(didSayThing)
        expect(didSayThing).to.equal('0x1626ba7e')

        const thingIDidntSay = ethers.utils.id('I did a crime down by the docks')
        const didSayThing2 = await accountContract.isValidSignature(thingIDidntSay, '0x')
        console.log(didSayThing2)
        expect(didSayThing2).to.equal('0xffffffff')
    })

    it("Execute Batch", async function () {
        const PositionTest = await ethers.getContractFactory("PositionTest")
        const positionTest = await PositionTest.deploy({
            gasLimit: 10_000_000
        })

        const report0 = await positionTest.report()
        expect(report0[0].toString()).to.equal('0')
        expect(report0[1].toString()).to.equal('0')

        const BroadcastTest = await ethers.getContractFactory("BroadcastTest")
        const broadcastTest = await BroadcastTest.deploy({
            gasLimit: 10_000_000
        })

        const callData = accountInterface.encodeFunctionData('executeBatch', [
            [
                positionTest.address,
                broadcastTest.address,
                positionTest.address,
                positionTest.address,
                positionTest.address,
            ],
            [
                positionTest.interface.encodeFunctionData('Up()'),
                broadcastTest.interface.encodeFunctionData('broadcast(string memory)', ['hello world']),
                positionTest.interface.encodeFunctionData('Up()'),
                positionTest.interface.encodeFunctionData('Up()'),
                positionTest.interface.encodeFunctionData('Right()'),
            ]
        ])

        const userOp = Monad.of({
            sender: counterfactual,
            callData: callData,
            callGasLimit: 100_000,
            nonce: 16
        })
            .bind(fillUserOpDefaults)
            .bind((uo: any) => lamportSignUserOp(uo, signer1, contracts.entryPoint.address, chainId, keys))

        await bundlersEntryPoint?.handleOps([userOp.unwrap()], bundlerWallet.address, {
            gasLimit: 30_000_000,
        })

        const report1 = await positionTest.report()
        console.log(report1)
        expect(report1[0].toString()).to.equal('1')
        expect(report1[1].toString()).to.equal('3')

        const topMessage = await broadcastTest.top()
        console.log(topMessage)
        expect(topMessage).to.equal('hello world')

    })

    it("Send And Receive ERC1363", async function () {

        const MyExample1363 = await ethers.getContractFactory("MyExample1363")
        const example1363 = await MyExample1363.deploy("TheExample1363", "EX1363", {
            gasLimit: 10_000_000
        })

        await example1363.mint(signers[0].address, ethers.utils.parseEther('1000'))

        expect(await example1363.balanceOf(counterfactual)).to.equal('0')
        await example1363['transferAndCall(address,uint256)'](counterfactual, ethers.utils.parseEther('100'))

        expect(await example1363.balanceOf(counterfactual)).to.equal(ethers.utils.parseEther('100'))

        const Merchant = await ethers.getContractFactory("Merchant")
        const target = await Merchant.deploy({
            gasLimit: 10_000_000
        })

        const callData = accountInterface.encodeFunctionData('execute', [
            example1363.address,
            0,
            example1363.interface.encodeFunctionData('transferAndCall(address,uint256)', [target.address, ethers.utils.parseEther('50')])
        ])

        const userOp = Monad.of({
            sender: counterfactual,
            callData: callData,
            callGasLimit: 100_000,
            nonce: 17
        })
            .bind(fillUserOpDefaults)
            .bind((uo: any) => lamportSignUserOp(uo, signer1, contracts.entryPoint.address, chainId, keys))

        await bundlersEntryPoint?.handleOps([userOp.unwrap()], bundlerWallet.address, {
            gasLimit: 30_000_000,
        })

        expect((await example1363.balanceOf(target.address)).toString()).to.equal(ethers.utils.parseEther('50').toString())
    })

    it("off-chain endorsments", async function () {
        // step 1. commit to merkle tree of lamport keys. These keys cannot be used to validate user ops. only to endorse messages via isValidSignature. this step involves a tx
        // OCE = Off Chain Endorsement
        const timer = startTimer()
        console.log(`[${timer()} s] timer started`)
        const oceKeyTracker = new KeyTrackerB()
        const oceKeyCount = 32
        console.log(`Estimating tree depth to be ~${Math.log2(oceKeyCount)} layers`)
        const oceKeys = oceKeyTracker.more(oceKeyCount)
        console.log(`[${timer()} s] generated ${oceKeyCount} oce keys`)

        const ocePKHs = oceKeys
            .map(k => k.pkh)
            .map((pkh: string) => [pkh]) // StandardMerkleTree expects an array of arrays

        console.log(`[${timer()} s] generated converted to public key hashes`)

        const tree = StandardMerkleTree.of(ocePKHs, ["bytes32"])

        console.log(`[${timer()} s] generated merkle tree`)

        // commit to root
        {
            const calldata = accountInterface.encodeFunctionData('endorseMerkleRoot', [tree.root])
            const userOp = Monad.of({
                sender: counterfactual,
                callData: calldata,
                callGasLimit: 100_000,
                nonce: 18,
            })
                .bind(fillUserOpDefaults)
                .bind((uo: any) => lamportSignUserOp(uo, signer1, contracts.entryPoint.address, chainId, keys))

            await bundlersEntryPoint?.handleOps([userOp.unwrap()], bundlerWallet.address, {
                gasLimit: 30_000_000,
            })
            console.log(`[${timer()} s] committed to merkle root`)
        }

        // step 2. create a human message, sign it with lamport keys, and pass it to a friend who can validate it with isValidSignature. this step does not involve a tx. only a view call
        const step2 = async () => {
            const message = loremIpsum()
            console.log(`${'-'[0].repeat(100)}\nMessage: ${message}\n${'-'[0].repeat(100)}`)

            const message2 = ethers.utils.hashMessage(defaultAbiCoder.encode(['string'], [message]))
            console.log(`Message 2: ${message2}`)
            const signingKeys = oceKeyTracker.getOne()
            console.log(`Selected Public Key Hash For Off Chain Endorsement: ${signingKeys.pkh}`)
            const signature = sign_hash(message2, signingKeys.pri)

            const proof = tree.getProof([signingKeys.pkh]) // slower than going by index
            console.log("proof -> ", proof)

            const localProofCheck = tree.verify([signingKeys.pkh as any], proof)
            console.log("proof is good -> ", localProofCheck)

            const merkleProofAndSignature = ethers.utils.defaultAbiCoder.encode(['bytes32[]', 'bytes32', 'bytes[256]', 'bytes32[2][256]'], [
                proof,
                tree.root,
                signature,
                signingKeys.pub
            ])

            const accountContract = await ethers.getContractAt('LamportAccount', counterfactual)

            {
                // fails if not connected to proof
                const isValidSig = await accountContract.isValidSignature(message2, '0x')
                console.log("isValidSig (expected to fail) -> ", isValidSig)
                expect(isValidSig).to.equal('0xffffffff')
            }

            const isValidSig = await accountContract.isValidSignature(message2, merkleProofAndSignature)
            console.log("isValidSig -> ", isValidSig)
            expect(isValidSig).to.equal('0x1626ba7e')

            console.log(ocePKHs.length)
        }
        await step2()
        await step2()
    })

    it("Add keys and deposit using executeBatchWithValue", async function () {
        const additionalKeys = keys.more(50)
        const additionalKeyHashes = additionalKeys.map(k => k.pkh)

        const accountContract = await ethers.getContractAt('LamportAccount', counterfactual)
        const keyCountT1 = await accountContract.liveKeyCount()
        console.log("keyCountT1 -> ", keyCountT1.toString())

        {// compair fee to balance
            const accountContract = await ethers.getContractAt('LamportAccount', counterfactual)
            const balance = await ethers.provider.getBalance(counterfactual)

            const feeBeaconAddess = await accountContract.feeBeacon()
            const feeBeacon = await ethers.getContractAt('FeeBeacon', feeBeaconAddess)

            const feeDetails = await feeBeacon.getFeeDetails()
            const fee = feeDetails[0]

            console.log("balance -> ", ethers.utils.formatEther(balance))
            console.log("fee     -> ", ethers.utils.formatEther(fee))

            expect(balance).to.be.gt(fee)
            console.log("balance is greater than fee\n")
        }

        const depositT1 = await contracts.entryPoint.balanceOf(counterfactual)
        console.log(`EntryPoint Deposit T1: ${ethers.utils.formatEther(depositT1)}`)
        const depositAmount: string = '0.000000000000000001'
        console.log(`Depositing ${depositAmount} ETH`)
        const callData = accountInterface.encodeFunctionData('executeBatchWithValue', [
            [
                contracts.entryPoint.address,
                counterfactual,
            ],
            [
                ethers.utils.parseEther(depositAmount),
                0,
            ],
            [
                '0x',
                accountInterface.encodeFunctionData(
                    'addPublicKeyHashes',
                    [additionalKeyHashes]
                ),
            ],
        ])

        const userOp = Monad.of({
            sender: counterfactual,
            callData: callData,
            callGasLimit: 5_000_000,
            nonce: 19,
        })
            .bind(fillUserOpDefaults)
            .bind((uo: any) => lamportSignUserOp(uo, signer1, contracts.entryPoint.address, chainId, keys))

        await bundlersEntryPoint?.handleOps([userOp.unwrap()], bundlerWallet.address, {
            gasLimit: 30_000_000,
        })

        const keyCountT2 = await accountContract.liveKeyCount()
        console.log("keyCountT2 -> ", keyCountT2.toString())
        expect(keyCountT2).to.equal(keyCountT1.sub(1).add(additionalKeyHashes.length))

        const depositT2Estimate = depositT1.add(ethers.utils.parseEther(depositAmount))
        console.log(`depositT2Estimate -> ${ethers.utils.formatEther(depositT2Estimate)}`)

        const depositT2 = await contracts.entryPoint.balanceOf(counterfactual)
        console.log(`EntryPoint Deposit T2: ${ethers.utils.formatEther(depositT2)}`)
        console.log(``)
        console.log(`T1: ${depositT1}`)
        console.log(`T2: ${depositT2}`) // why is this so much bigger?  
        console.log(``)
    })

    it("User can upgrade to a new implementation contract", async function () {
        /*

            note: for this to work the new entry point would need to somehow maintain the same nonce mapping as the old entry point. I think its fair to consider that outside the scope of these tests 

        */

        // lets pretend there is a new entry point we want to use 
        const accountContract = await ethers.getContractAt('LamportAccount', counterfactual)
        const currentEntryPoint = await accountContract.entryPoint()
        console.log("currentEntryPoint -> ", currentEntryPoint)
        expect(currentEntryPoint).to.equal(contracts.entryPoint.address)

        const EntryPoint = await ethers.getContractFactory("EntryPoint");
        const newEntryPoint = await EntryPoint.deploy();
        contracts.newEntryPoint = newEntryPoint
        console.log("newEntryPoint -> ", newEntryPoint.address)

        // 1. Deploy a new implementation contract
        const LamportAccount = await ethers.getContractFactory("LamportAccount");
        const newImplementation = await LamportAccount.deploy(newEntryPoint.address);
        console.log("newImplementation -> ", newImplementation.address)

        // const result = await accountContract.upgradeTo(newImplementation.address)
        const calldata = accountInterface.encodeFunctionData('upgradeTo', [newImplementation.address])
        const userOp = Monad.of({
            sender: counterfactual,
            callData: calldata,
            callGasLimit: 100_000,
            nonce: 20,
        })
            .bind(fillUserOpDefaults)
            .bind((uo: any) => lamportSignUserOp(uo, signer1, contracts.entryPoint.address, chainId, keys))

        await bundlersEntryPoint?.handleOps([userOp.unwrap()], bundlerWallet.address, {
            gasLimit: 30_000_000,
        })

        bundlersSecondEntryPoint = await contracts.newEntryPoint.connect(bundlerWallet)

        const currentEntryPointT2 = await accountContract.entryPoint()
        console.log("currentEntryPointT2 -> ", currentEntryPointT2)
        expect(currentEntryPointT2).to.equal(newEntryPoint.address)
    })



    it("LamportAccount correctly reports its features via ERC-165 ", async function () {
        const expected = [
            "0x01ffc9a7",   // IERC165
            "0x0023de29",   // IERC777Recipient
            "0x75ab9782",   // IERC777Sender
            "0x1626ba7e",   // IERC1271 (Standard Signature Validation)
            "0x150B7A02",   // ERC721Receiver (https://github.com/CR3Labs/erc-165-id-list/)
            "0x4E2312E0",   // ERC1155TokenReceiver (https://github.com/CR3Labs/erc-165-id-list/)
            "0x88a7ca5c",   // IERC1363Receiver
            "0x7b04a2d0",   // IERC1363Spender
        ]

        const accountContract = await ethers.getContractAt('LamportAccount', counterfactual)

        for (const feature of expected) {
            const supports = await accountContract.supportsInterface(feature)
            expect(supports).to.equal(true)
            console.log(`Feature ${feature} is supported`)
        }

    })
})