import { ethers } from "hardhat";
import { PubPair, RandPair, Sig } from "lamportwalletmanager/src";
import { AdvancedKeyPair, CompressedKeyPair } from "lamportwalletmanager/src/KeyTrackerB";
import BigNumber from "bignumber.js"

const GENERATE_INITIAL_SECRET = () => {
    const entropy = ethers.utils.randomBytes(20)
    return ethers.utils.ripemd160(ethers.utils.toUtf8Bytes(ethers.BigNumber.from(entropy).toHexString()))
}

const COMBINE = (a: string, b: string) => ethers.utils.solidityPack(['uint160', 'uint160'], [a, b])
const HASH = (a: string) => ethers.utils.ripemd160(a)

function pkhFromPublicKey(pub: PubPair[]): string {
    return ethers.utils.ripemd160(ethers.utils.solidityPack(['bytes20[2][160]'], [pub]))
}


const pubFromPri = (pri: [string, string][]) => pri.map(p => ([ethers.utils.ripemd160(p[0]), ethers.utils.ripemd160(p[1])])) as PubPair[]

export function mk_compressed_key_pair(): AdvancedKeyPair {
    // generate single 32 bytes secret
    const secret: string = GENERATE_INITIAL_SECRET()
    // derive 512 intermediate secrets
    const intermediate_secrets: string[] = Array.from({ length: (160 * 2) }).map((_, index: number) => HASH(COMBINE(secret, index.toString())))
    // const intermediate_secrets: string[] = Array.from({ length: 512 }).map((_, index: number) => dropFirstTwoChars(HASH(COMBINE(secret, index.toString()))))
    // pair them up
    const leftIntermediateSecrets: string[] = intermediate_secrets.filter((_, i) => i % 2 === 0)
    const rightIntermediateSecrets: string[] = intermediate_secrets.filter((_, i) => i % 2 === 1)
    // zip them up
    const pri: RandPair[] = leftIntermediateSecrets.map((l, i) => [l, rightIntermediateSecrets[i]]) as RandPair[]
    // derive public key
    const pub: PubPair[] = pubFromPri(pri.map(p => [p[0], p[1]]))
    // derive hash of public key
    const pkh = pkhFromPublicKey(pub)
    return {
        pri,
        pub,
        secret,
        pkh
    } as AdvancedKeyPair
}

export function uncompressLamport(compressed: CompressedKeyPair): AdvancedKeyPair {
    // 1. generate 512 intermediate secrets
    const intermediate_secrets: string[] = Array.from({ length: 160 * 2 }).map((_, index: number) => HASH(COMBINE(compressed.secret, index.toString())))
    // const intermediate_secrets: string[] = Array.from({ length: 512 }).map((_, index: number) => dropFirstTwoChars(HASH(COMBINE(compressed.secret, index.toString()))))
    // 2. pair them up
    const leftIntermediateSecrets: string[] = intermediate_secrets.filter((_, i) => i % 2 === 0)
    const rightIntermediateSecrets: string[] = intermediate_secrets.filter((_, i) => i % 2 === 1)
    const pri: RandPair[] = leftIntermediateSecrets.map((l, i) => [l, rightIntermediateSecrets[i]]) as RandPair[]
    // 3. derive public key
    const pub: PubPair[] = pubFromPri(pri.map(p => [p[0], p[1]]))
    // 4. derive hash of public key
    const pkh = pkhFromPublicKey(pub)
    // 5. verify hash matches
    if (pkh !== compressed.pkh)
        throw new Error('Public Key Hash Does Not Match Secret')

    // 6. return key pair  
    return {
        ...compressed,
        pri,
        pub
    } as AdvancedKeyPair
}

export function compressLamport(keyPair: AdvancedKeyPair): CompressedKeyPair {
    return {
        secret: keyPair.secret,
        pkh: keyPair.pkh
    } as CompressedKeyPair
}


export class KeyTrackerRipemd160 {
    keys: CompressedKeyPair[] = []

    more(amount: number = 2): AdvancedKeyPair[] {
        const keys = Array.from({ length: amount }, () => mk_compressed_key_pair())
        const asCompressed = keys.map(k => compressLamport(k))
        this.keys.push(...asCompressed) // save as compressed
        return keys // return as uncompressed
    }

    getOne(): AdvancedKeyPair {
        const returnValue = this.keys.shift()
        if (returnValue === undefined)
            throw new Error('No keys left')
        return uncompressLamport(returnValue)
    }
}

function is_private_key(key: RandPair[]): boolean {
    if (key.length !== 160)
        return false
    return true
}


export function sign_hashRipemd160(hmsg: string, pri: RandPair[]): Sig {
    if (!is_private_key(pri))
        throw new Error('invalid private key')

    const msg_hash_bin = new BigNumber(hmsg, 16).toString(2).padStart(160, '0')

    if (msg_hash_bin.length !== 160)
        throw new Error(`invalid message hash length: ${msg_hash_bin.length} --> ${msg_hash_bin}`)

    const sig: Sig = ([...msg_hash_bin] as ('0' | '1')[]).map((el: '0' | '1', i: number) => pri[i][el])
    return sig
}
