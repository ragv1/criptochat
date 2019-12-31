import { Injectable } from '@angular/core';
import { SecureStorage } from "nativescript-secure-storage";
import * as sjcl from "sjcl";
import { LibsodiumService } from "./libsodium.service";
import { LibsParams, SjclParams, LibsKey, SaveKeys } from './Interfaces';

@Injectable({
	providedIn: 'root'
})
export class EncrypService {
	private secureStorage = new SecureStorage();

	constructor(private libsodium: LibsodiumService) {
		let buffs = this.libsodium.random(128);
		sjcl.random.addEntropy(+buffs, 1024, "crypto.randomBytes");
	}
	removeSecure(key: string) {
		this.secureStorage.removeSync({ key: key });
	}
	// TODO: CHANGE THE NAME AND INCLUDE LOCK FUNCTION
	setSecureValue(key: string, value: any):boolean {
		if(!value) return false;
		let valueString = JSON.stringify(value);
		return this.secureStorage.setSync({
			key: key,
			value: valueString
		});
	}
	// TODO: CHANGE THE NAME AND INCLUDE UNLOCK FUNCTION
	getSecureValue(key: string):Promise<any> {
		return this.secureStorage.get({key: key})
		.then(value=>{
			return Promise.resolve(JSON.parse(value));
		});
	}
	_getSecureValue(key: string):Promise<any> {
		return this.secureStorage.get({key: key})
		.then(value=>{
			return Promise.resolve(JSON.parse(value));
		});
	}
	_setSecureValue(key: string, value: any):boolean {
		if(!value) return false;
		let valueString = JSON.stringify(value);
		return this.secureStorage.setSync({
			key: key,
			value: valueString
		});
	}
	randomize(WORDS: number = 4, PARANOIA: number = 10) {
		return sjcl.random.randomWords(WORDS, PARANOIA);
	}
	createRandomSjclKey(): string {
		let rndSalt = sjcl.codec.hex.fromBits(this.randomize(10, 10))
		let keyPlusSalt = this.createSjclKey2save(rndSalt, 100000);
		return keyPlusSalt.key;
	}
	createSjclKey2save(pass: string, iter?: number, savedParameters?: any): { salt: string, key: string } {
		let defaults;
		if (!savedParameters) {
			let salt = this.randomize(10, 10);
			let iv = this.randomize(4, 10);
			defaults = {
				ks: 256,
				salt: salt,
				iter: 100000 | iter,
				iv: sjcl.codec.hex.fromBits(iv)
			};

			this._setSecureValue('sjclParam', defaults);
		}
		let keyAndSalt = sjcl.misc.cachedPbkdf2(pass, savedParameters);
		return {key:sjcl.codec.hex.fromBits(keyAndSalt.key) , salt: sjcl.codec.hex.fromBits(keyAndSalt.salt)}
	}
	createCardId() {
		return sjcl.codec.hex.fromBits(this.randomize(1, 10));
	}
	createLibsKey2save(pass:string, salt?:string):LibsKey{
		let {hexString:keyHexString, saltHexString} = this.libsodium.keyFromPassword(pass,salt);
		this._setSecureValue('libsParam', saltHexString);
		return { saltHexString, keyHexString}
	}
	createAsymetricKeyPair() {
		return this.libsodium.keyPaired()
	}
	AsymetricEncrypt(message: string, key: string): string {
		return "";
	}
	Asymetricdecrypt() {
		return "";
	}
	sjclSymetricEncryp(key:string,message:string):string{
		
		return "";
	}

	unlock(saveKeys?:any,content?:any){
		let strContent = JSON.stringify(content);
		let bits = sjcl.codec.utf8String.toBits(strContent);
		let encoded64 = sjcl.codec.base64.fromBits(bits);
		return encoded64;
    }

	
    lock(saveKeys:SaveKeys, content:any){

    }





	/**
	 * ENVIAR MENSAJE
	 * 
	 * ------------PUBLIC ECC KEY-----------------
	 * ----------SYMETRIC RANDOM KEY--------------
	 * --------SHA512-FOR-INTEGRITY-CHECK-ONLY----
	 * ------MSG-ENCRYP-PRIVATE-ECC-KEY-----------
	 * ----SYMETICKEY-SJCL------------------------
	 * --MENSAJE----------------------------------
	 * -------------------------------------------
	 * 
	 * 
	 * GUARDADO DE LAS LLAVES
	 * 
	 * -------------SALTED ITERATED ??PASSPHRASE??--aesKeyParams + password = masterK2save_sjcl
	 * -------------SALTED ITERATED ??PASSPHRASE??--libsParams + password = masterK2save_libs
	 * -----------USERS---------------------
	 * ---SYMETRICkEY SJCL NOT SHARED--------
	 * ---PRIVATE ECC KEY --------------------
	 * ---PUBLIC ECC KEY---SELF----------------
	 * ---PUBLIC ECC OTHER KEY-------------------
	 * ---SYMETRIC MY KEY--------------------------
	 * ---SYMETRIC OTHER KEY-------------------------
	 * --SAVE IN NATIVESCRIPT STORAGE----------------
	 *-----------------------------------------------
	 */


}

export interface Keys {
	publicEcc: string,
	privateEcc: string,
	otherPublicEcc: string,
	symetricMyKey: string,
	symetricOtherKey: string,
	ctHolder: string,
	decrypted: boolean,
}



