import KeyTrackerC from "lamportwalletmanager/src/KeyTrackerC";
import { address } from "./SolidityTypes";

type AccountDetails = {
    counterfactual: address,
    factory: address,
    keys: KeyTrackerC,
    initialKeyHashes: string[],
    signerAddress: address,
    salt: number,
    network: number,
}

export default AccountDetails;