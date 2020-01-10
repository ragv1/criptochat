import { Injectable } from '@angular/core';
import * as dialogs from "tns-core-modules/ui/dialogs";
import { PromptResult } from 'tns-core-modules/ui/dialogs';
import { SaveKeys, SjclParams, LibsParams, LibsKey } from './Interfaces';
import { EncrypService } from './encryp.service';
import { CommunicationService } from './communication.service';

@Injectable({
	providedIn: 'root'
})
export class PasswordService {
	constructor(private cryptograph: EncrypService, private com:CommunicationService) { }
	finalStep:any;
	encrypt(){
		this.cryptograph.lock('user',['user1','user2'])
		.then(value=>{console.log(value)})
		.catch(err=>{console.log(err)})
	}

	decrypt(){
		this.cryptograph.unlock('user')
		.then(value=>{console.log(value)})
		.catch(err=>{console.log(err)})
	}

	setNewPassword() {
		dialogs.prompt({
			title: "Sistema",
			message: "Insertar nueva clave.\nATENCION!!! se borrara todo el contenido",
			inputType: dialogs.inputType.password,
			okButtonText: "Aceptar",
			cancelable: false
		})
		.then((value: PromptResult) => {
			console.log("Clave insertada: "+value.text);
			return this.removeAll().then((val)=>{
				console.log("Datos antiguos borrados? "+val);
				return this.createSaveKeys(value.text);
			});
		})
		.then(() => {
			dialogs.alert({
				title: "Sistema",
				message: "Operacion exitosa",
				okButtonText: "Aceptar"
			});
		})
		.catch(error => {
			console.log(error);
		});
	}

	changePassword() {
		// let oldPassword='';
		// let newPassword='';
		// dialogs.prompt({
		// 	title: "Sistema - Cambiar contraseña",
		// 	message: "Insertar clave anterior.",
		// 	inputType: dialogs.inputType.password,
		// 	okButtonText: "Aceptar",
		// 	cancelable: false
		// })
		// .then((value:PromptResult) => {
		// 	oldPassword=value.text;
		// 	return dialogs.prompt({
		// 		title: "Sistema - Cambiar contraseña",
		// 		message: "Insertar nueva clave",
		// 		inputType: dialogs.inputType.password,
		// 		okButtonText: "Aceptar",
		// 		cancelable: false
		// 	})
		// })
		// .then((value:PromptResult) => {
		// 	newPassword=value.text;
		// 	return this.createOldKeys(oldPassword)
		// })
		// .then(() => {
		// 	return Promise.all(
		// 		[
		// 			this.cryptograph.unlock("users"),
		// 			this.cryptograph.unlock("chats")
		// 		]
		// 	);
			
		// }).then((data:any[]) => {
		// 	return this.createSaveKeys(newPassword).then(() => {
		// 		return Promise.all(
		// 			[
		// 				this.cryptograph.lock("users",data[0]),
		// 				this.cryptograph.lock("chats",data[1]) 
		// 			]);
		// 	})
		// })
		// .then(() => {
		// 	dialogs.alert({
		// 		title: "Sistema",
		// 		message: "Operacion exitosa",
		// 		okButtonText: "Aceptar"
		// 	});
		// })
		// .catch(error => {
		// 	console.log(error);
		// 	dialogs.alert({
		// 		title: "Sistema",
		// 		message: `Operacion Fallida ${error}`,
		// 		okButtonText: "Aceptar"
		// 	});
		// });
	}

	private async removeAll(){
		this.com.sendMessage({text:"user"});
		return this.cryptograph.removeAll()
	}

	private async getParamsForsaveKeys(): Promise<{ sjclParam: SjclParams, libsParam: LibsParams }> {
		let sjclParam = await this.cryptograph.getSecureValue("sjclParam");
		let saltHextring = await this.cryptograph.getSecureValue("libsParam");
		let libsParam:LibsParams = {saltHexString:saltHextring} 
		return Promise.resolve({ sjclParam, libsParam });
	}

	private async createSaveKeys(password: string){
		let keyAndSalt_sjcl = this.cryptograph.createSjclKey2save(password, 100000);
		let keyAndSalt_Libs: LibsKey = this.cryptograph.createLibsKey2save(password);
		this.cryptograph.saveKeys.libs_key = keyAndSalt_Libs.keyHexString;
		this.cryptograph.saveKeys.sjcl_key = keyAndSalt_sjcl.key;
		console.log("Llaves creadas :");
		console.log("Llave sjcl: "+this.cryptograph.saveKeys.sjcl_key);
		console.log("Llave libs: "+this.cryptograph.saveKeys.libs_key);
	}

	private async createOldKeys(password: string){
		let { sjclParam, libsParam } = await this.getParamsForsaveKeys();
		if (!libsParam) {
			libsParam = {saltHexString:null}
		}
		let keyAndSalt_sjcl = this.cryptograph.createSjclKey2save(password, 100000, sjclParam);
		let keyAndSalt_Libs: LibsKey = this.cryptograph.createLibsKey2save(password, libsParam.saltHexString);
		this.cryptograph.saveKeys.libs_key = keyAndSalt_Libs.keyHexString;
		this.cryptograph.saveKeys.sjcl_key = keyAndSalt_sjcl.key;
	}



}
