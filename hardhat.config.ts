import { HardhatUserConfig, task, types } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-contract-sizer"
import 'dotenv/config'

task("flat", "Flattens and prints contracts and their dependencies (Resolves licenses)")
  .addOptionalVariadicPositionalParam("files", "The files to flatten", undefined, types.inputFile)
  .setAction(async ({ files }, hre) => {
    let flattened = await hre.run("flatten:get-flattened-sources", { files });

    // Remove every line started with "// SPDX-License-Identifier:"
    flattened = flattened.replace(/SPDX-License-Identifier:/gm, "License-Identifier:");
    flattened = `// SPDX-License-Identifier: MIXED\n\n${flattened}`;

    // Remove every line started with "pragma experimental ABIEncoderV2;" except the first one
    flattened = flattened.replace(/pragma experimental ABIEncoderV2;\n/gm, ((i) => (m) => (!i++ ? m : ""))(0));
    console.log(flattened);
  });

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.18",
    settings: {
      optimizer: {
        enabled: true,
        runs: 8000
      }
    }
  },
  networks: {
    mumbai: {
      // url: `https://polygon-mumbai.infura.io/v3/${process.env.INFURA_KEY!}`,
      url: `https://polygon-mumbai-bor.publicnode.com`,
      // url: `https://endpoints.omniatech.io/v1/matic/mumbai/public`,
      accounts: [
        process.env.PRIVATE_KEY!
      ],
      gasPrice: 35000000000,
    },
    sepolia: {
      // url: `https://sepolia.infura.io/v3/${process.env.INFURA_KEY!}`,
      // url: `https://ethereum-sepolia.blockpi.network/v1/rpc/public`,
      url: `http://localhost:8545`,
      accounts: [
        process.env.PRIVATE_KEY!
      ],
    },
    moonbase: {
      url: 'https://moonbase.unitedbloc.com:1000',
      // url: 'https://rpc.api.moonbase.moonbeam.network',
      accounts: [
        process.env.PRIVATE_KEY!
      ],
    },
    milkomeda: {
      url: `https://rpc-mainnet-cardano-evm.c1.milkomeda.com`,
      accounts: [
        process.env.PRIVATE_KEY!
      ],
    },
    polygon: {
      url: `https://polygon-mainnet.infura.io/v3/${process.env.INFURA_API_KEY!}`,
      accounts: [
        process.env.PRIVATE_KEY!
      ],
    },
    gnosis: {
      url: `https://gnosis.blockpi.network/v1/rpc/public`,
      accounts: [
        process.env.PRIVATE_KEY!
      ],
    }

  },

  contractSizer: { // No contract may exceed 24 KiB
    alphaSort: true,
    disambiguatePaths: false,
    runOnCompile: false, // disabled because it's "hard" to scroll up to see the message
    strict: true,
    only: [],
  }

};

export default config;
