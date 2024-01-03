import { ethers } from "hardhat";

async function main() {
  // const EntryPoint = await ethers.getContractFactory("EntryPoint");
  // const entryPoint = await EntryPoint.deploy();
  // console.log(`EntryPoint Deployed to ${entryPoint.address}`)

  const LamportAccountFactory = await ethers.getContractFactory("LamportAccountFactory");
  const lamportAccountFactory = await LamportAccountFactory.deploy("0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789");
  // const lamportAccountFactory = await LamportAccountFactory.deploy(entryPoint.address);

  await lamportAccountFactory.deployed();

  console.log(
    `LamportWalletFactory Deployed to ${lamportAccountFactory.address}`
  );

  console.log(`Verify LamportAccountFactory at ${`https://sepolia.etherscan.io/address/${lamportAccountFactory.address}#code`} `)
  console.log(`Deployed with arguments ${['0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789']}`)
  console.log(`Encoded: ${ethers.utils.defaultAbiCoder.encode(['address'], ['0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789'])}\n`)


  const accountImplementationAddress = await lamportAccountFactory.accountImplementation()
  const accountImplementation = await ethers.getContractAt("LamportAccount", accountImplementationAddress)
  console.log(`Verify LamportAccount (implementation) at ${`https://sepolia.etherscan.io/address/${accountImplementation.address}#code`}`)
  console.log(`Deployed with arguments ${['0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789']}`)
  console.log(`Encoded: ${ethers.utils.defaultAbiCoder.encode(['address'], ['0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789'])}\n`)

  const feeBeaconAddress = await lamportAccountFactory.feeBeacon()
  const feeBeacon = await ethers.getContractAt("FeeBeacon", feeBeaconAddress)
  console.log(`Verify FeeBeacon at ${`https://sepolia.etherscan.io/address/${feeBeacon.address}#code`}`)
  console.log(`Deployed with arguments ${[ethers.utils.parseEther('0.00001'), '0x4f171744973047296d90e7828676F4972faFB200', '0x4f171744973047296d90e7828676F4972faFB200']}`)
  console.log(`Encoded: ${ethers.utils.defaultAbiCoder.encode(['uint256', 'address', 'address'], [ethers.utils.parseEther('0.00001'), '0x4f171744973047296d90e7828676F4972faFB200', '0x4f171744973047296d90e7828676F4972faFB200'])}\n`)
  // 000000000000000000000000000000000000000000000000000009184e72a0000000000000000000000000004f171744973047296d90e7828676f4972fafb2000000000000000000000000004f171744973047296d90e7828676f4972fafb200
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
