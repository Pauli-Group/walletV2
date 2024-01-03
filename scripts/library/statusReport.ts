import { ethers } from "hardhat"
import { ethers as ethers2 } from "ethers"
import { address } from "./SolidityTypes"
import EntryPointJson from "../../artifacts/contracts/AccountAbstraction/core/EntryPoint.sol/EntryPoint.json";


export default async function statusReport(counterfactual: address, factory: address = ethers.constants.AddressZero) {
    console.log(`\nStatus report for ${counterfactual}`)
    const ecdsaSigner = new ethers.Wallet(process.env.PRIVATE_KEY!).connect(ethers.provider)
    console.log(`ecdsa signer address ${ecdsaSigner.address}`)
    console.log(`rpc is ${ethers.provider.connection.url}`)
    const padding = 30

    const ecdsaBalance = await ecdsaSigner.getBalance()
    console.log(`${'ecdsa balance '.padEnd(padding, '.')} ${ethers.utils.formatEther(ecdsaBalance.toString())}`)

    console.log(`${'ecdsa address'.padEnd(padding, '.')} ${ecdsaSigner.address}`)

    const counterfactualBalance = await ethers.provider.getBalance(counterfactual)
    console.log(`${'counterfactual balance '.padEnd(padding, '.')} ${ethers.utils.formatEther(counterfactualBalance.toString())}`)

    const accountCode = await ethers.provider.getCode(counterfactual)
    console.log(`${'account code '.padEnd(padding, '.')} ${accountCode === '0x' ? 'No' : 'Yes'}`)

    const ENTRYPOINT = '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789'
    const entryPointContract = new ethers2.Contract(ENTRYPOINT, EntryPointJson.abi, ethers.provider)

    const accountDeposit = await entryPointContract.balanceOf(counterfactual);
    console.log(`${'account deposit '.padEnd(padding, '.')} ${ethers.utils.formatEther(accountDeposit.toString())}`)

    // const accountDeposits = await entryPointContract.deposits(counterfactual);
    // console.log(accountDeposits)

    const depositInfo = await entryPointContract.getDepositInfo(counterfactual);
    // console.log(depositInfo)
    const isStaked = depositInfo[1]
    console.log(`${'is account staked '.padEnd(padding, '.')} ${isStaked ? 'Yes' : 'No'}`)
    console.log('\n')

    // factory info

    if (factory !== ethers.constants.AddressZero) {

        // struct DepositInfo {
        //   uint112 deposit;
        //   bool staked;
        //   uint112 stake;
        //   uint32 unstakeDelaySec;
        //   uint48 withdrawTime;
        // }

        const factoryDepositInfo = await entryPointContract.getDepositInfo(factory);
        const pad = 30
        console.log(`\nStatus report for ${factory}`)
        console.log(`${'factory deposit '.padEnd(pad, '.')} ${ethers.utils.formatEther(factoryDepositInfo[0].toString())}`)
        console.log(`${'is factory staked '.padEnd(pad, '.')} ${factoryDepositInfo[1] ? 'Yes' : 'No'}`)
        console.log(`${'factory stake '.padEnd(pad, '.')} ${ethers.utils.formatEther(factoryDepositInfo[2].toString())}`)
        console.log(`${'factory unstake delay '.padEnd(pad, '.')} ${factoryDepositInfo[3]}`)
        console.log(`${'factory withdraw time '.padEnd(pad, '.')} ${factoryDepositInfo[4]}`)
    
        console.log('\n')
    }
}