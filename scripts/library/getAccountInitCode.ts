import { ethers } from "hardhat";
import { ethers as ethers2, BytesLike } from "ethers";

export default function getAccountInitCode(owner: string, factory: ethers2.Contract, salt = 0, initialKeyHashes: string[]): BytesLike {
    return ethers.utils.hexConcat([
        factory.address,
        factory.interface.encodeFunctionData('createAccount', [owner, salt, initialKeyHashes])
    ])
}

export function getAccountInitCodeTestText(owner: string, factory: ethers2.Contract, salt = 0, initialKeyHashes: string[], testText: string): BytesLike {
    return ethers.utils.hexConcat([
        factory.address,
        factory.interface.encodeFunctionData('createAccount', [owner, salt, initialKeyHashes, testText])
    ])
}