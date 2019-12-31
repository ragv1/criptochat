import { Injectable } from '@angular/core';
import { SimpleLibsodium, AEDMethod, AEDValues, Base64Variant, Keybytes, Noncebytes } from 'nativescript-simple-libsodium';

@Injectable({
  providedIn: 'root'
})
export class LibsodiumService {
  simpleLibsodium = new SimpleLibsodium();
  crypto_pwhash_OPSLIMIT_MIN=1;
  crypto_pwhash_MEMLIMIT_MIN=8192;

  constructor(){}
  
    keyPaired(){
      let keyBinary = this.simpleLibsodium.boxKeyPaired();
      return {
        publicKey:this.simpleLibsodium.binTohex(keyBinary.public_key),
        privateKey:this.simpleLibsodium.binTohex(keyBinary.private_key)
      }
    }

    publicEncryption(message:string, pulicKey:string, privateKey:string){
      let puk = this.simpleLibsodium.hexTobin(pulicKey);
      let prik = this.simpleLibsodium.hexTobin(privateKey);
      return this.simpleLibsodium.boxEasy(message,puk,prik);
    }

    publicDecryption(encObject:any, pulicKey:string, privateKey:string){
      let puk = this.simpleLibsodium.hexTobin(pulicKey);
      let prik = this.simpleLibsodium.hexTobin(privateKey);
      return this.simpleLibsodium.boxOpenEasy(encObject.rawCrypted, encObject.rawNonce, puk, prik);
    }

    keyFromPassword(password:string,saltHexString:string){
      if (!saltHexString){saltHexString=this.simpleLibsodium.generateRandomData(Keybytes.PWHASH_SALTBYTES).hexString}
      let salt = this.simpleLibsodium.hexTobin(saltHexString)
      return this.simpleLibsodium.generateKeyWithSuppliedString(password, 32, salt);
    }

    symetricEncryptionRandomKey(message:string){
      if(!message || typeof(message)!=="string" ){return {error:"No mensaje que encryptar"}}
      let { raw : key, hexString:keystring } =  this.keyFromPassword(message,null);
      return { cypherObj:this.simpleLibsodium.secretBoxEncrypt(message,key), key : keystring } 
    }

    symetricDecryption(cypherObj:any, key:string){
      return this.simpleLibsodium.secretBoxOpen(cypherObj.rawCrypted,this.simpleLibsodium.hexTobin(key),cypherObj.rawNonce);
    }

    KeyfromString(keyHexString:string){
      return this.simpleLibsodium.hexTobin(keyHexString);
    }

    random(howManyBits:number){
      return this.simpleLibsodium.generateRandomData(howManyBits| 128).raw;
    }
    
    bytesToBase64(data:any){
      return this.simpleLibsodium.bytesToBase64(data)
    }
    
    base64Tobytes(data:string){
      return this.simpleLibsodium.base64Tobytes(data);
    }

    sha512(key:string){
      return this.simpleLibsodium.SHA2Hash(key,512)
    }


}
