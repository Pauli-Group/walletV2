import { ethers } from "hardhat";
import { BigNumber } from "ethers";
import KeyTrackerB, { AdvancedKeyPair, CompressedKeyPair } from "lamportwalletmanager/src/KeyTrackerB";
import { sign_hash } from "lamportwalletmanager/src";
import { KeyTrackerRipemd160, sign_hashRipemd160 } from "./KeyTrackerRipemd160";
import { startTimer } from "lamportwalletmanager/src";

const addressHashTestContract = '0x030Af67f0432731e9D627584a4fc707d9feBfD57'

const ratio = (a: BigNumber, b: BigNumber): [BigNumber, BigNumber, BigNumber] => {
    const first = a.gt(b) ? a : b
    const second = a.gt(b) ? b : a
    const ratio = second.div(first).mul(100)
    return [first, second, ratio]
}

async function main() {
    const timer = startTimer()
    console.log(`[${timer()}] Starting...`)
    const contract = await ethers.getContractAt("HashComparison", addressHashTestContract);

    const input = ethers.utils.defaultAbiCoder.encode(['string'], ['Hello World!'])

    console.log(`Input bytes: ${input}`)

    // test tx 1 keccak256
    const tx1 = await contract.test1Keccak256(input)
    console.log(`Tx1: ${tx1.hash}`)
    const receipt1 = await tx1.wait()
    console.log(`Tx1: ${receipt1.status}`)
    console.log(`[${timer()}] Tx1 complete`)

    // test tx 2 ripemd160
    const tx2 = await contract.test2Ripemd160(input)
    console.log(`Tx2: ${tx2.hash}`)
    const receipt2 = await tx2.wait()
    console.log(`Tx2: ${receipt2.status}`)
    console.log(`[${timer()}] Tx2 complete`)

    const showGas = (receipt: any) => {
        const gasUsed = receipt.gasUsed.toString()
        const txFee = ethers.BigNumber.from(gasUsed).mul(receipt.effectiveGasPrice)

        console.log(`\tGas used: ${gasUsed}`)
        console.log(`\tTx fee: ${txFee.toString()}`)
    }

    console.log(`Tx1:`)
    showGas(receipt1)
    console.log(`Tx2:`)
    showGas(receipt2)

    function compareBigNumbers(a: BigNumber, b: BigNumber): string {
        // const ratio: BigNumber = a.gt(b) ? a.mul(100).div(b) : b.mul(100).div(a);
        // const percentage: number = ratio.toNumber() - 100;

        // if (a.gt(b)) {
        //     return `Tx 1 is ${percentage}% larger than Tx 2 -- keccak256 is more expensive than ripemd160`;
        // } else if (a.lt(b)) {
        //     return `Tx 2 is ${percentage}% larger than Tx 1 -- ripemd160 is more expensive than keccak256`;
        // } else {
        //     return "Both values are equal.";
        // }
        const _ratio = ratio(a, b)

        if (_ratio[0].eq(a)) 
            return `Tx 1 is ${_ratio[2].toString()}% larger than Tx 2 -- keccak256 is more expensive than ripemd160`;
        
        if (_ratio[0].eq(b))
            return `Tx 2 is ${_ratio[2].toString()}% larger than Tx 1 -- ripemd160 is more expensive than keccak256`;

        return "Both values are equal.";
    }

    console.log(`\n${compareBigNumbers(receipt1.gasUsed, receipt2.gasUsed)}\n`)

    console.log(`[${timer()}] Starting Lamport Tests...\n`)

    // now try lamport -- keccak256
    const msgHash1 = ethers.utils.keccak256(input)
    const kt = new KeyTrackerB()
    kt.more(1)
    const signingKeys = kt.getOne()
    const signature = sign_hash(msgHash1, signingKeys.pri)

    const tx3 = await contract.test3Keccak256Lamport(msgHash1, signature, signingKeys.pub)
    console.log(`Tx3: ${tx3.hash}`)
    const receipt3 = await tx3.wait()
    showGas(receipt3)

    console.log(`[${timer()}] Tx3 complete`)


    // now try lamport -- ripemd160
    const msgHash2 = ethers.utils.ripemd160(input)

    console.log(`[${timer()}] Hashed input with ripemd160: [${msgHash2}]`)

    const ripemd160Kt = new KeyTrackerRipemd160()
    console.log(`[${timer()}] have ripemd160 kt`)
    ripemd160Kt.more(1)
    const ripemd160SigningKeys = ripemd160Kt.getOne()
    console.log(`[${timer()}] got ripemd160 signing keys`)

    const ripemd160Signature = sign_hashRipemd160(msgHash2, ripemd160SigningKeys.pri)
    console.log(`[${timer()}] Have ripemd160 lamport signature`)

    const tx4 = await contract.test4Ripemd160Lamport(msgHash2, ripemd160Signature, ripemd160SigningKeys.pub)
    console.log(`\nTx4: ${tx4.hash}`)

    const receipt4 = await tx4.wait()
    showGas(receipt4)



    function compareLamportData(a: BigNumber, b: BigNumber): string {
        // const ratio: BigNumber = a.gt(b) ? a.mul(100).div(b) : b.mul(100).div(a);
        // const percentage: number = ratio.toNumber() - 100;

        // if (a.gt(b)) {
        //     return `Tx 3 is ${percentage}% larger than Tx 4 -- keccak256 is more expensive than ripemd160 (for lamport)`;
        // } else if (a.lt(b)) {
        //     return `Tx 4 is ${percentage}% larger than Tx 3 -- ripemd160 is more expensive than keccak256 (for lamport)`;
        // } else {
        //     return "Both values are equal.";
        // }
        const _ratio = ratio(a, b)

        if (_ratio[0].eq(a))
            return `Tx 3 is ${_ratio[2].toString()}% larger than Tx 4 -- keccak256 is more expensive than ripemd160 (for lamport)`;

        if (_ratio[0].eq(b))
            return `Tx 4 is ${_ratio[2].toString()}% larger than Tx 3 -- ripemd160 is more expensive than keccak256 (for lamport)`;

        return "Both values are equal.";
    }

    console.log(`\n${compareLamportData(receipt3.gasUsed, receipt4.gasUsed)}\n`)

}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
