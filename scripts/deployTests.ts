import { ethers } from "hardhat";

async function main() {
    const BroadcastTest = await ethers.getContractFactory("BroadcastTest");
    const broadcastTest = await BroadcastTest.deploy();
    await broadcastTest.deployed();
    console.log(`BroadcastTest Deployed to ${broadcastTest.address}`)

    const PositionTest = await ethers.getContractFactory("PositionTest");
    const positionTest = await PositionTest.deploy();
    await positionTest.deployed();
    console.log(`PositionTest Deployed to ${positionTest.address}`)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
