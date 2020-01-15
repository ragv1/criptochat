import { BitArray } from "sjcl";

export interface SharebleKeys{
    id: string,
    publicKey: string,
    symetricKey: string,
}
export interface Card extends SharebleKeys{
    privateKey: string,
    otherPublicKey: string
}

export interface User extends Card {
    id: string;
    displayname: string;
    server: string;
}
export interface SaveKeys{
    sjcl_key:string,
    libs_key:string
}
export interface SjclParams{
    ks: number,
    salt: BitArray|string,
    iter: number,
    iv: string
}
export interface LibsParams{
    saltHexString:string
}
export interface LibsKey extends LibsParams{
    keyHexString:string
}
export interface LibsEncrypResult{
    CryptedHexString: string,
    rawCrypted: any,
    nonceHexString: string,
    rawNonce: any
}
export interface Armor extends LibsEncrypResult{
    status:boolean
}