import { Command } from 'commander'
import fs from 'fs'
import "dotenv/config"

const program = new Command()

type Blockchain = {
    bundlerRPC: string,
    normalRPC: string,
}

type Blockchains = {
    [chainName: string]: Blockchain,
}

const blockchains : Blockchains = {
    'sepolia': {
        bundlerRPC: `http://0.0.0.0:14337/11155111/`,
        normalRPC:  `https://ethereum-sepolia.blockpi.network/v1/rpc/public`,
    },
}

function loadChain (chainName: string) : Blockchain {
    const chain = blockchains[chainName]
    if (!chain) {
        console.error(`Chain ${chainName} not found. Exiting.`)
        process.exit(1)
    }
    return chain
}

program
    .command('create-account')
    .description('Create a new account')
    .argument('<string>', 'Chain Name')
    .argument('<string>', 'Account Name')
    .action(async (chainName, accountName) => {
        // Create an account (counterfactual only) and report the name, address, and file loacation
        const blockchain = loadChain(chainName)
    })

program
    .command('add-keys')
    .description('Add keys to an account')
    .argument('<string>', 'Account Name')
    .action(async (accountName) => {

    })

program
    .command('send-eth')
    .description('Send ETH to an account')
    .argument('<string>', 'Account Name')
    .argument('<string>', 'To Address')
    .argument('<string>', 'Amount')
    .action(async (accountName, toAddress, amount) => {

    })

program.parse(process.argv)