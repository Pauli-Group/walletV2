import fs from 'fs';
import util from 'util';
import type AccountDetails from "./AccountDetails";
import { address } from './SolidityTypes';

// Converting callback-based methods to promise-based methods
const readdir = util.promisify(fs.readdir);
const readFile = util.promisify(fs.readFile);

export default async function loadAccountDetails(counterfactual: address): Promise<AccountDetails> {
    try {
        // 1. find the file with a name that contains the counterfactual address
        const files = await readdir('keys');
        const file = files.find(file => file.includes(counterfactual));

        if (!file) {
            throw new Error(`File not found for counterfactual address: ${counterfactual}`);
        }

        // 2. load the file
        const fileContent = await readFile(`keys/${file}`, 'utf-8');

        // 3. return the account details
        const accountDetails: AccountDetails = JSON.parse(fileContent);
        return accountDetails;
    } catch (error) {
        console.error(`Error loading account details: ${error}`);
        throw error;
    }
}
