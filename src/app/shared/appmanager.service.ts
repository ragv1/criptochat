import { Injectable } from '@angular/core';
import { EncrypService } from './encryp.service';
import * as dialogs from "tns-core-modules/ui/dialogs";
import { PromptResult } from 'tns-core-modules/ui/dialogs';
import { SaveKeys, SjclParams, LibsParams, LibsKey } from './Interfaces';
import { CommunicationService } from './communication.service';

@Injectable({
	providedIn: 'root'
})
export class AppmanagerService {
	private count: number = 0;
	public token:number=null;
	constructor(private cryptograph: EncrypService, private com:CommunicationService) {}

	closeApp(): void {
		console.log("Clear data and Deleting Keys");
		this.cryptograph.saveKeys.libs_key = null;
		this.cryptograph.saveKeys.sjcl_key = null;
		this.com.sendMessage({text:"user"});
		this.count++;
	}
	
	openApp(): number {
		console.log(`asking user to set passwords to set keys and show data ${this.count}`);
		this.com.sendMessage({text:"true"});
		return setTimeout(() => {
		    this.checkForKeys();
		}, 3000);
	}

	checkForKeys() {
		this.areKeysAvailable()
			.then((available: boolean) => {
				if (!available) {
					return dialogs.prompt({
						title: "Sistema",
						message: "Inserta tu clave para continuar...",
						inputType: dialogs.inputType.password,
						okButtonText: "Aceptar",
						cancelable: false
					})
				}else{
					return Promise.reject("keys are availables");
				}
			})
			.then((value: PromptResult) => {
				return this.create2SaveKeys(value.text)
			})
			.then(sucess => {
				if (!sucess) { 
					dialogs.alert({
						title: "Sistema",
						message: "Bloqueado - clave equivocada",
						okButtonText: "Aceptar"
					});
				}
			})
			.catch(error => {
				console.log(error);
			});

	}

	private areKeysAvailable(): Promise<boolean> {
		if (!this.cryptograph.saveKeys || !this.cryptograph.saveKeys.libs_key || !this.cryptograph.saveKeys.sjcl_key) {
			return Promise.resolve(false);
		} else {
			let bool = this.cryptograph.saveKeys.libs_key.length && this.cryptograph.saveKeys.sjcl_key.length ? true : false;
			console.log(`availables keys\nsjcl key: ${this.cryptograph.saveKeys.sjcl_key}\nlibs_key: ${this.cryptograph.saveKeys.libs_key}`)
			return Promise.resolve(bool);
		}
	}

	private checkSjclParam(params: SjclParams): boolean {
		if (params) {
			return (params.iter && params.iv.length && params.salt.length && params.ks) ? true : false;
		}
		return false;
	}

	private checkLibsParam(params: LibsParams): boolean {
		if (params) {
			return (params.saltHexString) ? true : false;
		}
		return false;
	}

	private async getParamsFor2saveKeys(): Promise<{ sjclParam: SjclParams, libsParam: LibsParams }> {
		let sjclParam = await this.cryptograph.getSecureValue("sjclParam");
		let saltHexString = await this.cryptograph.getSecureValue("libsParam");
		let libsParam:LibsParams = {saltHexString:saltHexString }
		return Promise.resolve({ sjclParam, libsParam });
	}

	private async create2SaveKeys(password: string): Promise<boolean> {
		let { sjclParam, libsParam } = await this.getParamsFor2saveKeys();
		let sjclParamsReady = this.checkSjclParam(sjclParam);
		let libsParamReady = this.checkLibsParam(libsParam);
		if (sjclParamsReady && libsParamReady) {
			let keyAndSalt_sjcl = this.cryptograph.createSjclKey2save(password, 100000, sjclParam);
			let keyAndSalt_Libs: LibsKey = this.cryptograph.createLibsKey2save(password, libsParam.saltHexString);
			this.cryptograph.saveKeys.libs_key = keyAndSalt_Libs.keyHexString;
			this.cryptograph.saveKeys.sjcl_key = keyAndSalt_sjcl.key;
			console.log("Llaves REcreadas :");
			console.log("Llave sjcl: "+ this.cryptograph.saveKeys.sjcl_key);
			console.log("Llave libs: "+this.cryptograph.saveKeys.libs_key );
			return true;
		} else {
			this.cryptograph.saveKeys.libs_key = null;
			this.cryptograph.saveKeys.sjcl_key = null;
			return false;
		}
	}



}
