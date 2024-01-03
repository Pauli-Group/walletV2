import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";
import { loremIpsum } from "lorem-ipsum";
import { StandardMerkleTree } from "@openzeppelin/merkle-tree";
import Monad from "../scripts/library/Monad";
import { show } from "../scripts/library/UserOperation";

describe("Merkle Test", function () {
    it("Use OpenZeppelin library", async () => {
        const values = [
            ["0x1111111111111111111111111111111111111111", "5000000000000000000"],
            ["0x2222222222222222222222222222222222222222", "2500000000000000000"]
        ];

        const tree = StandardMerkleTree.of(values, ["address", "uint256"]);
        console.log('Merkle Root:', tree.root);

        const proof = tree.getProof(1)
        console.log('Proof:', proof);

        const isValidProof = tree.verify(values[1], proof);
        console.log('Is valid proof:', isValidProof);

        const MerkleTest = await ethers.getContractFactory("MerkleTest");
        const contract = await MerkleTest.deploy(tree.root);
        await contract.deployed();

        const tx = await contract.verify(proof, values[1][0], values[1][1]);
        const result = await tx.wait();
        console.log(result);
    })

    const randomInRange = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

    it("Leaf Type Of Bytes from sentence", async () => {
        const records : any = {}
        records.t1 = new Date().getTime();

        const abiCoder = new ethers.utils.AbiCoder();
        const sentence = Monad.of(loremIpsum({
            count: randomInRange(4, 512),
            units: 'words',
        }))
            .bind((s: string) => Monad.of(s.split(" ")))
            .bind((sarr: string[]) => Monad.of(sarr.map((s: string) => ethers.utils.toUtf8Bytes(s))))
            .bind((barr: Uint8Array[]) => Monad.of(barr.map((b: Uint8Array) => [abiCoder.encode(["bytes"], [b])])))

        const values = sentence.unwrap();

        records.leafCount = values.length;

        const tree = StandardMerkleTree.of(values as any, ["bytes"]);

        console.log('Merkle Root:', tree.root);

        // random position in array
        const elementIndex = randomInRange(0, values.length - 1);
        records.elementIndex = elementIndex;

        const proof = tree.getProof(elementIndex)
        records.proofLength = proof.length;

        console.log('Proof:', proof);

        const isValidProof = tree.verify(values[elementIndex] as any, proof);
        records.passLocalCheck = isValidProof;

        console.log('Is valid proof:', isValidProof);

        const MerkleTest = await ethers.getContractFactory("MerkleTest");
        const contract = await MerkleTest.deploy(tree.root);
        await contract.deployed();

        const tx = await contract.verifyBytes(proof, values[elementIndex][0]);
        const result = await tx.wait();
        console.log(result);

        records.t2 = new Date().getTime();
        records.tdelta = records.t2 - records.t1;

        console.table(records);
    })
})