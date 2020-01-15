import { Injectable } from '@angular/core';
import { EncrypService } from './encryp.service';
import { Card, SharebleKeys, User} from './Interfaces';


@Injectable({
    providedIn: "root"
})

export class UserManager {
    // Card is use only for key exchange purposes via QRcode
    private card: Card=null;
    private user:User=null;
    

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
    saveUser(){
        let users: User[];
        this.cryptograph.unlock("users")
        .then(value=>{
            users = value;
            if(!this.user){
                return 
            }else{
                users= users? users:[]; //TODO: REDUNDANT LINE???
                users.push(this.user);
            }
            this.cryptograph.lock("users", users);
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

    noKeys():boolean{
        return (this.cryptograph.saveKeys.libs_key && this.cryptograph.saveKeys.sjcl_key) ? false : true;
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
            this.destroyCard();
        }
        return Promise.resolve(isUserCreated);
    }
    /**
     * Returns a user from secure storage
     * @param id Id of the user to return
     */
    async readUser(id: string):Promise<User> {
        let users = <User[]> await this.cryptograph.unlock('users');
        let user = users.filter(user => user.id == id);
		return <User>user[0];
	}
    /**
     * Returns all currently available users if user were decrypted sucessfully
     */
    async readUsers():Promise<User[]>{
        let users = <User[]> await this.cryptograph.unlock('users');
        return users? users:[];
    }
    /**
     * Updates a user from its ID
     * @param id Id of the user to be updated
     * @param displayname The name to show in the interface
     * @param server server uri
     */
    updateUser(id: string, displayname: string, server: string):Promise<User[]>{
        return this.cryptograph.unlock("users")
        .then(users=>{
            let usersArr: User[] = users;
            if (id) {   
                let objIndex = usersArr.findIndex((obj => obj.id == id));
                usersArr[objIndex].displayname = displayname;
                usersArr[objIndex].server = server;
                this.cryptograph.lock("users", usersArr);
            }
            return usersArr;
        });
    }
    /**
     * Sobre escribe la lista de usuarios con la lista nueva
     * @param newUsers lista nueva de usuarios
     */
    deleteUser(newUsers:User[]){
        this.cryptograph.lock("users", newUsers);
    }

   //TESTING ONLY
   currentUser(){
       return this.user;
   }
 


}

