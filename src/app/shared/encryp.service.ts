import { Injectable } from '@angular/core';
import { SecureStorage } from "nativescript-secure-storage";
import * as sjcl from "sjcl";
import { LibsodiumService } from "./libsodium.service";
import { LibsKey, SaveKeys, LibsParams, LibsEncrypResult, Armor, SjclParams } from './Interfaces';

@Injectable({
	providedIn: 'root'
})
export class EncrypService {
	private secureStorage = new SecureStorage();
	public saveKeys:SaveKeys={ libs_key:null, sjcl_key:null };

	constructor(private libsodium: LibsodiumService) {
		let buffs = this.libsodium.random(128);
		sjcl.random.addEntropy(+buffs, 1024, "crypto.randomBytes");
	}
	removeSecure(key: string) {
		this.secureStorage.removeSync({ key: key });
	}

	async removeAll(){
		return this.secureStorage.removeAll()
	}
	
	setSecureValue(key: string, value: any):boolean {
		if(!value) return false;
		let valueString = JSON.stringify(value);
		return this.secureStorage.setSync({
			key: key,
			value: valueString
		});
	}
	
	getSecureValue(key: string):Promise<any> {
		return this.secureStorage.get({key: key})
		.then(value=>{
			return Promise.resolve(JSON.parse(value));
		});
	}

	randomize(WORDS: number = 4, PARANOIA: number = 10) {
		return sjcl.random.randomWords(WORDS, PARANOIA);
	}
	createRandomSjclKey(): string {
		let rndSalt = sjcl.codec.hex.fromBits(this.randomize(10, 10));
		let keyAndSalt = sjcl.misc.cachedPbkdf2(rndSalt);
		let key = sjcl.codec.hex.fromBits(keyAndSalt.key);
		return key;
	}
	createSjclKey2save(pass: string, iter?: number, savedParameters?: SjclParams): { salt: string, key: string } {
		let defaults:SjclParams;
		if (!savedParameters) {
			let salt = this.randomize(10, 10);
			let iv = this.randomize(4, 10);
			defaults = {
				ks: 256,
				salt: salt,
				iter: 100000 | iter,
				iv: sjcl.codec.hex.fromBits(iv)
			};
			this.setSecureValue('sjclParam', defaults);
			console.log('sjcl parametros guardados- default',defaults);
			savedParameters=defaults;
		}
		console.log('sjcl parametros guardados- noDefaults',savedParameters);
		let keyAndSalt = sjcl.misc.cachedPbkdf2(pass, savedParameters);
		return {key:sjcl.codec.hex.fromBits(keyAndSalt.key) , salt: sjcl.codec.hex.fromBits(keyAndSalt.salt)}
	}
	createCardId() {
		return sjcl.codec.hex.fromBits(this.randomize(1, 10));
	}
	createLibsKey2save(pass:string, salt?:string):LibsKey{
		let {hexString:keyHexString, saltHexString} = this.libsodium.keyFromPassword(pass,salt);
		this.setSecureValue('libsParam', saltHexString);
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
	sjclSymetricEncryp(key:string,data:string):string{
		let defaults:any ={
			adata:'',
			iter:100000,
			mode:'ccm',
			ts:64,
			ks:256 
		}
		let bitArrayKey = sjcl.codec.hex.toBits(key);
		let cipherObj:sjcl.SjclCipherEncrypted = sjcl.encrypt(bitArrayKey,data,defaults);
		let strCipherObj = JSON.stringify(cipherObj);
		return strCipherObj;
	}
	sjclSymetricDecryp(key:string,ciphertext:string):string{
		let bitArrayKey = sjcl.codec.hex.toBits(key);
		let cipher = JSON.parse(ciphertext);
		let plaintext = sjcl.decrypt(bitArrayKey,cipher);
		return plaintext;
	}
	libsSymetricEncryp(key:string, data:string):LibsEncrypResult{
		let cipherObj:LibsEncrypResult = this.libsodium.symetricEncryption(key,data);
		return cipherObj;
	}
	libsSymetricDecryp(key:string, cipherObj:Armor):string{
		let plaintextObj =  this.libsodium.symetricDecryption(cipherObj, key);
		let plaintext = plaintextObj.string;
		return plaintext;
	}

	/**
	 * This function decrypts a given set of data TODO: SHOULD THROW WHEN NOT SUCCESS
	 * @param name name of the parameter you want to decrypt
	 */
	async unlock(name:string):Promise<any[]>{
		let finalStep = [];
		try {
			let content = await this.getSecureValue(name);
			if (content!=null){ 
				let step0 = this.beautyfy(content);
				let step1 = this.libsSymetricDecryp(this.saveKeys.libs_key,step0);
				let step2 = this.sjclSymetricDecryp(this.saveKeys.sjcl_key,step1);
				finalStep = JSON.parse(step2)
			}
		} catch (error) {
			console.log('Error: unlock error <r002>',error);
		}
		
		return finalStep
    }

	/**
	 * Functions encrypts content with aes and salsa algorithm encryption TODO: SHOULD THROW IF NOT SUCCESSS
	 * @param saveKeys keys objects containing two keys one for sjcl and other for libsodium
	 * @param content thas the Object that will be stringify and encrypted
	 */
    async lock(name:string, content:any):Promise<void>{
		let finalStep = null;
		try {
			let cont = JSON.stringify(content);
			let step1 = this.sjclSymetricEncryp(this.saveKeys.sjcl_key, cont);
			let step2 = this.libsSymetricEncryp(this.saveKeys.libs_key, step1);
			finalStep = this.uglyfy(step2);
			this.setSecureValue(name,finalStep);	
		} catch (error) {
			console.log('Error: lock error <r001>',error);
		}
	}
	
	uglyfy(content:LibsEncrypResult):string{
		let armor:LibsEncrypResult = content;
		return  armor.CryptedHexString + '.' +armor.nonceHexString
	}

	beautyfy(str:string):Armor{
		let arr = str.split('.');
		let CryptedHexString = arr[0];
		let  nonceHexString = arr[1];
		let armor:Armor = {
			status:true,
			CryptedHexString : CryptedHexString,
			nonceHexString : nonceHexString,
			rawCrypted : null,
			rawNonce : null
		}
		return armor;
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



