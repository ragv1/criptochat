import { Injectable } from '@angular/core';
import { EncrypService } from './encryp.service';
import { Card, SharebleKeys, User, SaveKeys, SjclParams, LibsParams, LibsKey } from './Interfaces';
import * as dialogs from "tns-core-modules/ui/dialogs";
import { PromptResult } from 'tns-core-modules/ui/dialogs';

@Injectable({
    providedIn: "root"
})

export class UserManager {
    // Card is use only for key exchange purposes via QRcode
    private card: Card=null;
    private user:User=null;
    private saveKeys:SaveKeys={
        libs_key:null,
        sjcl_key:null
    };

    constructor(private cryptograph:EncrypService){
    }
    /**
     * Returns true if a card is completed
     */
    private isCardComplete(): boolean {
        if (this.card) {
            if (
                this.card.id &&
                this.card.otherPublicKey &&
                this.card.privateKey &&
                this.card.publicKey &&
                this.card.symetricKey
            ) {
                return true;
            } else {
                return false;
            }
        } else {
            return false;
        }
    }
    /**
     * Returns true if the card is readed from scanner on the contrary returns false;
     */
    private isCardReaded() {
        return this.card ? 
            this.card.id &&
            this.card.otherPublicKey &&
            this.card.symetricKey &&
            !this.card.privateKey &&
            !this.card.publicKey
            : 
            false;
    }
    /**
     * Returns true if the card was generated with code on the contrary returns false;
     */
    private isCardWrited() {
        return this.card ? 
            this.card.id &&
            this.card.symetricKey &&
            !this.card.otherPublicKey &&
            this.card.privateKey &&
            this.card.publicKey
            : 
            false;
    }
    /**
     * Returns a stringify sharebleKeys object. 
     */
    private sharebleKeys():string{
        return JSON.stringify({
            publicKey:this.card.publicKey, 
            symetricKey:this.card.symetricKey, 
            id: this.card.id
        });
    }
    /**
     * Completes the readed Card via scanner
     * @param value SharableKeys object. See: SharableKeys Interface
     */
    private completeReadCard(value:SharebleKeys){
        this.card.id = value.id;
        this.card.symetricKey = value.symetricKey;
        this.card.otherPublicKey = value.publicKey;
    }
    /**
     * Completes the writed Card via code
     */
    private completeWriteCard(){
        let keys = this.cryptograph.createAsymetricKeyPair();
        this.card.privateKey = keys.privateKey;
		this.card.publicKey =  keys.publicKey;
    }
    /**
     * Creates a new Card to be writen to the Qr 
     */
    private createNewWriteCard(){
        let {publicKey, privateKey} = this.cryptograph.createAsymetricKeyPair();
        this.card =  {
            id: this.cryptograph.createCardId(),
            publicKey: publicKey,
            privateKey: privateKey,
            otherPublicKey: null,
            symetricKey: this.cryptograph.createRandomSjclKey()
        }
    }
    /**
     * Creates a new Card from the data readed via scanner
     * @param value  SharableKeys object. See: SharableKeys Interface
     */
    private createNewReadCard(value:SharebleKeys){
        this.card = {
            id: value.id,
			otherPublicKey: value.publicKey,
            symetricKey: value.symetricKey,
            privateKey:null,
            publicKey:null
        }
    }
    /**
     * Save user securely
     */
    private saveUser(){
        let users: User[];
        this.cryptograph.getSecureValue("users")
        .then(value=>{
            users = value;
            if(!this.user){
                return 
            }else{
                users= users? users:[];
                users.push(this.user);
            }
            this.cryptograph.setSecureValue("users", users);
        });
    }
    /**
     * Destroys the card
     */
    private destroyCard(){
        this.card=null;
    }
       /**
     * Creates a new user from a complete Card
     */
    private createUser():boolean{
        if(this.isCardComplete()){
            this.user = {
                server:"",
                displayname:this.card.id,
                ...this.card
            }
            return true;
        }
        return false;
    }
    /**
     * Entry or Endpoint of user creation
     * @param strSharebleKeys stringify object containing publicKey, symetricKey and id
     * Returns promise true if a user was created and false if not
     */
    readQrCode(strSharebleKeys: string):Promise<boolean>{
        let readedKeys = <SharebleKeys> JSON.parse(strSharebleKeys);
        // let readedKeys = {publicKey:"aaaaaaaaaaaaaa",symetricKey:"bbbbbbbb",id:"dacabadasb"};
        if(this.isCardWrited()){
            this.completeReadCard(readedKeys);
            return this.consolidateNewUser();      
        }else {
            this.createNewReadCard(readedKeys);
            return new Promise(resolve=>resolve(false));
        }
     }
    /**
     * Entry point of user creation
     * Returns promise stringify object containing publicKey, symetricKey and id
     */
    writeQrCode():Promise<string> {
        if(this.isCardReaded()){
            this.completeWriteCard();
        }else {
            this.createNewWriteCard()
        }
        return new Promise(resolve=>resolve(this.sharebleKeys()));
    }
    /**
     * End point for user creation, callable from inside and outside this class
     * Returns a boolean promise that if true a new user was created
     */
    consolidateNewUser():Promise<boolean>{
        let isUserCreated:boolean = this.createUser();
        if(isUserCreated){
            this.saveUser();
            this.destroyCard();
        }
        return Promise.resolve(isUserCreated);
    }
    /**
     * Returns a user from secure storage
     * @param id Id of the user to return
     */
    readUser(id: string):Promise<User> {
        return this.cryptograph.getSecureValue("users")
        .then(users=>{
            let usersArr: User[] = users;
            let user = usersArr.filter(user => user.id == id);
		    return <User>user[0];
        });
	}
    /**
     * Returns all currently available users
     */
    readUsers():Promise<User[]>{
        return  this.cryptograph.getSecureValue("users")
        .then(parsedUsersArray=>{
            //let result =  await this.unlock(parsedUsersArray)
            let result = <User[]>parsedUsersArray
            return result? result:[];
        })
    }
    /**
     * Updates a user from its ID
     * @param id Id of the user to be updated
     * @param displayname The name to show in the interface
     * @param server server uri
     */
    updateUser(id: string, displayname: string, server: string):Promise<User[]>{
        return this.cryptograph.getSecureValue("users")
        .then(users=>{
            let usersArr: User[] = users;
            if (id) {   
                let objIndex = usersArr.findIndex((obj => obj.id == id));
                usersArr[objIndex].displayname = displayname;
                usersArr[objIndex].server = server;
                this.cryptograph.setSecureValue("users", usersArr);
            }
            return usersArr;
        });
    }
    /**
     * Sobre escribe la lista de usuarios con la lista nueva
     * @param newUsers lista nueva de usuarios
     */
    deleteUser(newUsers:User[]){
        this.cryptograph.setSecureValue("users", newUsers);
    }
    private areKeysAvailable():Promise<boolean>{
        if(!this.saveKeys || !this.saveKeys.libs_key || !this.saveKeys.sjcl_key ){
            return Promise.resolve(false);
        }else{
            let bool = this.saveKeys.libs_key.length&&this.saveKeys.sjcl_key.length?true:false;
            return Promise.resolve(bool);
        }
    }
    private checkSjclParam(params:SjclParams):boolean{
        if(params){
            return (params.iter&&params.iv.length&&params.salt.length&&params.ks)? true : false;
        }
        return false;
    }
    private checkLibsParam(params:LibsParams):boolean{
        if(params){
            return (params.saltHexString)? true : false;
        }
        return false;
    }
    private async getParamsFor2saveKeys():Promise<{sjclParam:SjclParams, libsParam:LibsParams}>{
        let sjclParam = await this.cryptograph._getSecureValue("sjclParam")
        let libsParam = await this.cryptograph._getSecureValue("libsParam")
        return Promise.resolve({sjclParam, libsParam});
    }
    private async create2SaveKeys(password:string):Promise<boolean>{
        let {sjclParam, libsParam} = await this.getParamsFor2saveKeys();
        let sjclParamsReady =  this.checkSjclParam(sjclParam);
        let libsParamReady =  this.checkLibsParam(libsParam);
        if( sjclParamsReady && libsParamReady ){
            let keyAndSalt_sjcl = this.cryptograph.createSjclKey2save(password,100000,sjclParam);
            let keyAndSalt_Libs:LibsKey = this.cryptograph.createLibsKey2save(password,libsParam.saltHexString);
            this.saveKeys.libs_key=keyAndSalt_Libs.keyHexString;
            this.saveKeys.sjcl_key=keyAndSalt_sjcl.key;
            return true;    
        }else{
            this.saveKeys.libs_key=null;
            this.saveKeys.sjcl_key=null;
            return false;
        }
    }
    initKeys(){
        this.areKeysAvailable()
        .then((available:boolean)=>{
            if(!available){
                return dialogs.prompt({
                    title:"Sistema",
                    message:"Inserta tu clave para continuar...",
                    inputType:dialogs.inputType.password,
                    okButtonText:"Aceptar",
                    cancelable:false
                })
            }
        })
        .then((value:PromptResult)=>{
            return this.create2SaveKeys(value.text)
        })
        .then(sucess=>{
            if(sucess){ return}
            dialogs.alert({
                title:"Sistema",
                message:"Bloqueado - clave equivocada",
                okButtonText:"Aceptar"
            });
            
        })
        .catch(error=>{
            console.log(error);
        });
        
    }

 

    async setPasswordSchema(oldPasswod:string, newPassword:string){
        return this.cryptograph.unlock(null,{publicKey:"AAAAAA", privateKey:"babadejuanvosch+="})
        // TODO:
        // check if old parameters exist - if not ignore old password
        // create keys with old password
        // confirm that oldpassword can unlock content
        // 
        /**
         * 
         * if(this.create2saveKeys(oldPassword)){
         *      if(this.unlock(this.saveKeys,"content")){
         *              let newKeys = this.createNewkeysAndSavedparameters();
         *              this.lock(newKeys,this.content);
         *              this.saveKeys = newKeys
         *      }else{
         *          dialog(contrasena vieja Erronea, contenido no desbloqueado)
         *      }
         * }else{
         *      this.creatNewkeysANdSaveParams(newPassword);
         * }
         */
    }


}

