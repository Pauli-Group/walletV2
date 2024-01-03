import KeyTrackerC from "lamportwalletmanager/src/KeyTrackerC";
import { address } from "./SolidityTypes";
import fs from 'fs'
import KeyTrackerB from "lamportwalletmanager/src/KeyTrackerB";

export default function saveCounterfactualOrigin(counterfactual : address, factoryAddress : address, keys : KeyTrackerB, initialKeyHashes : string[],  ecdsaSigner : any , chainId : number ) {
    // const originFile = `keys/initObj_${new Date().getTime()}_${counterfactual}.json` // date first so its easier to sort.. counterfactual ddress for searching
    const originFile = `keys/initObj_${counterfactual}.json` // date first so its easier to sort.. counterfactual ddress for searching
    const originObject = {
        counterfactual: counterfactual,
        factory: factoryAddress,
        keys: keys,
        initialKeyHashes: initialKeyHashes,
        signerAddress: ecdsaSigner.address,
        salt: 0,
        network: chainId,
    }

    if (!fs.existsSync('keys')) {
        fs.mkdirSync('keys');
    }

    fs.writeFileSync(originFile, JSON.stringify(originObject, null, 2))
    console.log(`Keys saved to ${originFile}`)
}
