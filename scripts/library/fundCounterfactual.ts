import { ethers } from "hardhat"
import { address } from "./SolidityTypes"

export default async function fundCounterfactual(counterfactual: address) {
    const ecdsaSigner = new ethers.Wallet(process.env.PRIVATE_KEY!).connect(ethers.provider)
    console.log(`Funding ${counterfactual}`)
    const tx = await ecdsaSigner.sendTransaction({
        to: counterfactual,
        value: ethers.utils.parseEther('0.05'),
        gasPrice: ethers.utils.parseUnits('35', 'gwei')
    })
    await tx.wait()
    console.log(`Funded ${counterfactual}`)
}
