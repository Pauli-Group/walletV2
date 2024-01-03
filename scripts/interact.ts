import { ethers } from "hardhat";
import { ethers as ethers2, BytesLike } from "ethers";
import waitForEnterOrExit from "./library/waitForEnterOrExit";
import loadAccountDetails from "./library/loadAccountDetails";
import { address } from "./library/SolidityTypes";
import statusReport from "./library/statusReport";
import fundCounterfactual from "./library/fundCounterfactual";
import Monad from "./library/Monad";
import getAccountInitCode from "./library/getAccountInitCode";
import accountInterface from "./library/accountInterface";
import 'dotenv/config'
import { fillUserOpDefaults, lamportSignUserOp, show } from "./library/UserOperation";
import generateNewCounterfactual from "./library/generateNewCounterfactual";
import EntryPointJson from "../artifacts/contracts/AccountAbstraction/core/EntryPoint.sol/EntryPoint.json";
import saveCounterfactualOrigin from "./library/saveCounterfactualOrigin";
import KeyTrackerB from "lamportwalletmanager/src/KeyTrackerB";
import PositionTestJson from "../artifacts/contracts/Test/PositionTest.sol/PositionTest.json";
import BroadcastTestJson from "../artifacts/contracts/Test/BroadcastTest.sol/BroadcastTest.json";

const ENTRYPOINT = '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789'
const signer = new ethers2.Wallet(process.env.PRIVATE_KEY!, ethers.provider)

const factories = [
    '0x1D62940722b93D303d3779B38A56792Bd37C3462',
    '0x16cC114384De28abbE29D7571C0E47D24bf253Fd',
    '0x2E66e43A1A0D47fa929ee390e05A540e3Fb55743', // key addition fee
    '0x7EBC12542B9A60b8F442Ec72655F8157F39a69bD',
    '0xC71cABfe1F58fb119a606122981C6Dd1ac1E3de1', // sepolia
]

const erc20Contract = new ethers.Contract('0xfe4F5145f6e09952a5ba9e956ED0C25e3Fa4c7F1', [
    'function transfer(address, uint256) returns (bool)'
], signer)

const erc1155Contract = new ethers.Contract('', [
    'function safeTransferFrom(address, address, uint256, uint256, bytes) returns (bool)'
], signer)

const positionTest = new ethers.utils.Interface(PositionTestJson.abi)

const broadcastTest = new ethers.utils.Interface(BroadcastTestJson.abi)

async function main() {
    // OPTION 1

    const factoryAddress = factories[factories.length - 1]
    // const _counterfactual = await generateNewCounterfactual(factoryAddress)  
    // console.log(_counterfactual)
    // return

    // OPTION 2
    // const accountDetails = await loadAccountDetails('0xee25527bea6731656D0f021d615Fc40D4758a6d3')
    // const accountDetails = await loadAccountDetails('0xFcBcDDaD8f1e3DAb0d36761fEa8c32E9CD0d8D34')
    // const accountDetails = await loadAccountDetails('0x8009D4092dE986a8aCf9cDB067F47C8f754dB13E')
    // const accountDetails = await loadAccountDetails('0x0F72B3f1C65335FDa14a32CbE9e751356314bEC9')
    // const accountDetails = await loadAccountDetails('')
    // const accountDetails = await loadAccountDetails('0xFF3112D593E2C5Db70971eC455e22f01069f9A5e')
    const accountDetails = await loadAccountDetails('0x8FaB51Eaa1c11d7EFeeE9e9646f4979fE50a38D5')
    console.log(accountDetails)
    const counterfactual = accountDetails.counterfactual

    // check that the details we've read produce the address we expect
    {   // 1. Factory matches
        const check = accountDetails.factory === factoryAddress
        if (!check)
            throw new Error(`Factory address mismatch. Expected ${factoryAddress} but got ${accountDetails.factory}`)
    }
    {   // counterfactual addresses match
        const factory = await ethers.getContractAt('LamportAccountFactory', factoryAddress)

        const kt = Object.assign(new KeyTrackerB(), JSON.parse(JSON.stringify(accountDetails.keys))) as KeyTrackerB
        const initialKeys = kt.getN(20)
        const initialKeyHashes = accountDetails.initialKeyHashes
        const counterfactual2 = await factory.getAddress(accountDetails.signerAddress, accountDetails.salt, initialKeyHashes)

        console.log(`Counterfactual:  ${counterfactual}`)
        console.log(`Counterfactual2: ${counterfactual2}`)

        console.log(`Initial Key Hashes `, initialKeyHashes)
        const check = counterfactual === counterfactual2
        if (!check)
            throw new Error(`Counterfactual address mismatch. Expected ${counterfactual} but got ${counterfactual2}`)
    }

    console.log('checks passed')

    await waitForEnterOrExit()

    await statusReport(counterfactual, accountDetails.factory)

    await waitForEnterOrExit()

    const depositToCounterfactualIfNeeded = async () => {
        // if the entrypoint says the counterfactual has no balance, we need to deposit some
        const entrypoint = await ethers.getContractAt('EntryPoint', ENTRYPOINT)
        const balance = await entrypoint.balanceOf(counterfactual)
        const signerBalance = await ethers.provider.getBalance(accountDetails.signerAddress)
        console.log(`Signer balance is ${ethers.utils.formatEther(signerBalance)}`)
        if (balance.lt(ethers.utils.parseEther('0.1'))) {
            console.log('Depositing 0.1 ETH')
            const entryPointWithSigner = entrypoint.connect(signer)

            const tx = await entryPointWithSigner.depositTo(counterfactual, {
                value: ethers.utils.parseEther('0.1'),
                gasPrice: ethers.utils.parseUnits('32', 'gwei')
            })
            await tx.wait()
            await waitForEnterOrExit()
        }
    }

    const fundCounterfactualIfNeeded = async () => {
        const balance = await ethers.provider.getBalance(counterfactual)
        // if (balance.lt(ethers.utils.parseEther('0.000001'))) {
        if (balance.lt(ethers.utils.parseEther('0.00001'))) {
            console.log('Funding counterfactual')
            const tx = await signer.sendTransaction({
                to: counterfactual,
                value: ethers.utils.parseEther('0.00001'),
                gasPrice: ethers.utils.parseUnits('85', 'gwei'),
                gasLimit: 100_000,
            })
            await tx.wait()
            await waitForEnterOrExit()
        }
    }

    await depositToCounterfactualIfNeeded()
    await fundCounterfactualIfNeeded()

    const factory = await ethers.getContractAt('LamportAccountFactory', factoryAddress)

    const keys2 = Object.assign(new KeyTrackerB(), accountDetails.keys)
    const initialKeyHashes = accountDetails.initialKeyHashes

    const initCode = getAccountInitCode(
        signer.address,
        factory,
        0,
        initialKeyHashes
    )

    const target = '0x4f171744973047296d90e7828676F4972faFB200' // when testing its best to send to an address we control.. this way we can reuse our testnet funds

    // const callData = accountInterface.encodeFunctionData('execute', [
    //     '0x000008755776feD4623bC77d00f3d53c5B16D860',
    //     32,
    //     '0x'
    // ])

    const additionalKeys = keys2.more(30)
    const additionalKeyHashes = additionalKeys.map(k => k.pkh)
    console.log('New PKHs', additionalKeyHashes)
    const callData = accountInterface.encodeFunctionData('addPublicKeyHashes', [
        additionalKeyHashes
    ])

// rpcEndpoint": "https://ethereum-sepolia.blockpi.network/v1/rpc/public",
    // const callData = accountInterface.encodeFunctionData('executeBatch', [
    //     [
    //         // '0xfe4F5145f6e09952a5ba9e956ED0C25e3Fa4c7F1',
    //         // // '0xA07e45A987F19E25176c877d98388878622623FA', // dummy ERC1155
    //         // '0x326c977e6efc84e512bb9c30f76e30c160ed06fb', // 'LINK'
    //         // '0x326c977e6efc84e512bb9c30f76e30c160ed06fb', // 'LINK'
    //         '0xDa265D3c33f2210D73D07D7E0DC4Bfd1dE407C63', // broadcast
    //         '0x96c87926600328a0A3c9abe3c1b8c1dda302Eb3E', // position test
    //         '0x96c87926600328a0A3c9abe3c1b8c1dda302Eb3E',
    //         '0x2d7882bedcbfddce29ba99965dd3cdf7fcb10a1e', // Test Token
    //         '0xfe4F5145f6e09952a5ba9e956ED0C25e3Fa4c7F1', // dummy ERC20
    //     ],
    //     [
    //         broadcastTest.encodeFunctionData('broadcast', [
    //             'Jake, please send 50 Ada to $hipsterdoofus if you are serious about the coffeetable book about coffee tables.',
    //         ]),
    //         positionTest.encodeFunctionData('Up', []),
    //         positionTest.encodeFunctionData('Right', []),
    //         erc20Contract.interface.encodeFunctionData('transfer', [
    //             target,
    //             ethers.utils.parseEther('0.00000001'),
    //         ]),
    //         erc20Contract.interface.encodeFunctionData('transfer', [
    //             target,
    //             ethers.utils.parseEther('0.00000001'),
    //         ]),

    //     ],
    // ])

    // const callData = accountInterface.encodeFunctionData('asyncTransfer', [
    //     '0xd90f7Fb941829CFE7Fc50eD235d1Efac05c58190',
    //     ethers.utils.parseEther('0.00000001'),
    // ])

    //  const callData = accountInterface.encodeFunctionData('execute', [
    //     ENTRYPOINT,
    //     ethers.utils.parseEther('0.1'),
    //     '0x'
    // ])

    console.log(`About to request nonce`)

    const code = await ethers.provider.getCode(counterfactual)

    const thisNonce = await (async () => {
        if (code === '0x') {
            console.log(`Counterfactual address ${counterfactual} has no code. Assuming nonce is 0`)
            return ethers.BigNumber.from(0)
        }

        // ask the enty point for our nonce
        const entrypoint = new ethers.Contract(ENTRYPOINT, [
            'function getNonce(address, uint192) view returns (uint256)'
        ], signer)
        const nonce = await entrypoint.getNonce(counterfactual, 0)
        return nonce
    })()

    console.log(`Nonce is ${thisNonce}`)
    // return
    const userOp = Monad.of({
        sender: counterfactual,
        initCode: code === '0x' ? initCode : '0x',
        callData: callData,
        nonce: thisNonce.toNumber(),
        // callGasLimit: 100_000,
        callGasLimit: 1_000_000,
    })
        .bind(fillUserOpDefaults)
        .bind((uo: any) => lamportSignUserOp(uo, signer, ENTRYPOINT, accountDetails.network, keys2))
    // .bind(show)

    console.log(`${signer.address} will call simulateValidation`)

    const entryPointContract = new ethers2.Contract(ENTRYPOINT, EntryPointJson.abi, signer)

    // {   // Before we call simulateValidation lets deconstruct our signature and make sure it makes sense
    //     const sig = userOp.unwrap().signature
    //     const unpackedSignature = ethers.utils.defaultAbiCoder.decode(['bytes[256]', 'bytes32[2][256]', 'bytes'], sig)
    //     const [selectedKeyHash,] = unpackedSignature
    //     const index = initialKeyHashes.indexOf(selectedKeyHash)
    //     console.log(`Index of selected key hash: ${index}`)
    //     if ( code === '0x' && index === -1)
    //         throw new Error(`Selected key hash ${selectedKeyHash} not found in initial key hashes`)
    // }

    await entryPointContract.callStatic.simulateValidation(userOp.unwrap(), {
        gasLimit: 30_000_000,
    })
        .catch((e: any) => {
            // THIS IS NOT AN ERROR... THIS IS RETURN DATA GIVEN VIA REVERT
            const openBracketIndex = e.message.indexOf('(')
            const closeBracketIndex = e.message.indexOf(')')
            const contents = e.message.substring(openBracketIndex + 1, closeBracketIndex)
            console.log('-'.repeat(10))
            console.log(contents)
            console.log('-'.repeat(10))
            console.log(e.message)

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
            console.log(`${'validAfter '.padEnd(20, '.')} ${validAfter}`)
            console.log(`${'validUntil '.padEnd(20, '.')} ${validUntil}`)
            console.log(`${'paymasterContext '.padEnd(20, '.')} ${paymasterContext}`)

            // contents is in the form [a,b,c,d,e,f], [a,b], [a, b], [a, b]
            // [preOpGas, prefund, sigFailed, validAfter, validUntil, paymasterContext] -- "ReturnInfo"
            // [stake, unstakeDelaySec] -- "StakeInfo" - Sender info
            // [stake, unstakeDelaySec] -- "StakeInfo" - Factory info
            // [stake, unstakeDelaySec] -- "StakeInfo" - Paymaster info
        })

    // return
    await waitForEnterOrExit()

    const submitUserOperationViaBundler = async () => {
        // May need to better fund relayer before this will work
        // const bundlerRpc = `http://0.0.0.0:14337/80001/`
        const bundlerRpc = `http://0.0.0.0:14337/11155111/`
        // const bundlerRpc = `https://api.stackup.sh/v1/node/e9b394ee43e6df1fb608d6f321a726ddcf46096145ad4afabc5c8716dba9bea0`
        const bundlerProvider = new ethers.providers.JsonRpcProvider(bundlerRpc)

        const entryPoints = await bundlerProvider.send("eth_supportedEntryPoints", [])
        console.log(`entryPoints: `, entryPoints)

        // send the userOp to the bundler
        const response = await bundlerProvider.send("eth_sendUserOperation", [
            userOp.unwrap(),
            ENTRYPOINT
        ])

        console.log(`response: `, response)
    }

    const submitUserOperationManually = async () => {
        const tx = await entryPointContract.handleOps([userOp.unwrap()], '0xd90f7Fb941829CFE7Fc50eD235d1Efac05c58190',
            {
                gasLimit: 15_000_000,
                gasPrice: ethers.utils.parseUnits('35', 'gwei')
            }
        )
        console.log(`tx: `, tx.hash)
    }

    await submitUserOperationViaBundler()
    // await submitUserOperationManually()

    // save file but use keys2
    saveCounterfactualOrigin(
        counterfactual,
        factoryAddress,
        keys2,
        initialKeyHashes,
        signer,
        (await ethers.provider.getNetwork()).chainId
    )
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
