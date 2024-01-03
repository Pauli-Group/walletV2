import { ethers } from "hardhat"
import { address } from "./SolidityTypes"
import 'dotenv/config'
import KeyTrackerC from "lamportwalletmanager/src/KeyTrackerC"
import saveCounterfactualOrigin from "./saveCounterfactualOrigin"
import KeyTrackerB from "lamportwalletmanager/src/KeyTrackerB"

export default async function generateNewCounterfactual(factoryAddress : string) : Promise<address> {
    const ecdsaSigner = new ethers.Wallet(process.env.PRIVATE_KEY!).connect(ethers.provider)

    const keys = new KeyTrackerB()
    const initialKeys = keys.more(20)
    const initialKeyHashes = initialKeys.map(k => k.pkh)

    const factory = await ethers.getContractAt('LamportAccountFactory', factoryAddress)
    const counterfactual = await factory.getAddress(ecdsaSigner.address, 0, initialKeyHashes)

    console.log(`Counterfactual address: ${counterfactual}`)

    saveCounterfactualOrigin(
        counterfactual,
        factoryAddress,
        keys,
        initialKeyHashes,
        ecdsaSigner,
        (await ethers.provider.getNetwork()).chainId
    )

    return counterfactual
}
