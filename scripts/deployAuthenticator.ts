import { ethers } from "hardhat";

async function main() {
  const LambBedrockAuthenticationFactory = await ethers.getContractFactory("LambBedrockAuthenticationFactory");

  const keyAdditionFee = (await ethers.provider.getGasPrice()).mul(100_00_000); // fee is set based on gas price
  console.log(`keyAdditionFee will be ${ethers.utils.formatEther(keyAdditionFee)} ETH`)
  const lbaf = await LambBedrockAuthenticationFactory.deploy("0x4f171744973047296d90e7828676F4972faFB200", keyAdditionFee); // TODO: at a later date we can transfer ownership to a post quantum account 

  await lbaf.deployed();

  console.log(
    `LamportWalletFactory Deployed to ${lbaf.address}`
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
