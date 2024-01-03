
import { ethers } from "hardhat";

async function main() {
    const HashComparison = await ethers.getContractFactory("HashComparison");
    const hashComparison = await HashComparison.deploy();

    await hashComparison.deployed();
    console.log("HashComparison deployed to:", hashComparison.address);


}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
