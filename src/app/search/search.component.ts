import { Component, OnInit } from "@angular/core";
import { registerElement } from "nativescript-angular/element-registry";
import { BarcodeScanner } from "nativescript-barcodescanner";
registerElement("BarcodeScanner", () => require("nativescript-barcodescanner").BarcodeScannerView);
import { CommunicationService, Msg } from "../shared/communication.service";
import { UserManager } from "../shared/user-management.service";
import * as dialogs from "tns-core-modules/ui/dialogs";
import { User } from "../shared/Interfaces";
import { PasswordService } from "../shared/password.service";
import { AppmanagerService } from "../shared/appmanager.service";


@Component({
    selector: "Search",
    templateUrl: "./search.component.html"
})
export class SearchComponent implements OnInit {
   
    pause: boolean = false;
    barcodescannerModule: any;
    users: User[] = [];


    constructor(
        private userManager: UserManager,
        private communication: CommunicationService,
        private password:PasswordService,
        private appmanager:AppmanagerService
        ) {
        this.barcodescannerModule = new BarcodeScanner();
    }

    ngOnInit(): void {
        this.communication.getMessage$()
        .subscribe((value:Msg) => {
            this.eraseUsers(value);
            this.refresh(value);
        });
    }
    
    refresh(can: Msg) {
        if(this.userManager.noKeys()) return;
        if (can.text=="REFRESH_USER_VIEW") {
            this.userManager.readUsers()
            .then(users=>{
                this.users = users;
            })
        }
    }

    eraseUsers(msg:Msg){
        if(msg.text=="DELETE_USER"){
            this.users=[];
        }
    }

    delete(event) {
        if(this.userManager.noKeys()) return;
        dialogs.confirm({
            title: "Sistema",
            message: "Borrar usuario?",
            okButtonText: "Aceptar"
        }).then((_value) => {
            console.log(_value)
            if( !_value ) return;
            let target = event.object;
            let id = target.id;
            this.users = this.users.filter(user => id != user.id);
            this.userManager.deleteUser(this.users);
            this.refresh({text:"REFRESH_USER_VIEW"});
        });
        
    }

    requestPermission() {
        return this.barcodescannerModule.available()
        .then((available) => {
            if (available) {
                return this.barcodescannerModule.hasCameraPermission()
            }
        })
        .then((granted) => {
            if (!granted) {
                return this.barcodescannerModule.requestCameraPermission()
            }
        });
    }

    scanBarcode() {
        // this.userManager.readQrCode(JSON.stringify({
        //     id: 'BABAC0',
		// 	   publicKey: '3F0084639FCAD6A1E5E501C888177DBB4C04B079BEBB34EE9F7C711D2E4AFD2A',
        //     symetricKey: '44a15c4c381d31135c6748da3c2417679706f441a2e8066e74193402ca75c9e1',
        //     privateKey:null,
        //     otherPublicKey:null
        // }))

        this.requestPermission()
        .then(() => {
            return this.barcodescannerModule.scan(barcodeScannerOptions)
        }) 
        .then((result) => {
            return this.userManager.readQrCode(result.text)
        })
        .then(newUserCreated => {
            if (!newUserCreated) { return }
            setTimeout(() => {
                dialogs.confirm({
                    title: "Sistema",
                    message: "Nuevo usuario creado.",
                    okButtonText: "Aceptar"
                }).then(() => {
                    console.log('Nuevo Usuario:',this.userManager.currentUser())
                    this.appmanager.createKeys()
                    .then(sucess=>{
                        console.log(sucess);
                        this.userManager.saveUser();
                        this.refresh({text:"REFRESH_USER_VIEW"});
                    }).catch(err=>{

                    });
                })
            }, 3000);
        })
        .catch(error => {
            setTimeout(() => {
                dialogs.confirm({
                    title: "Sistema",
                    message: "Error: " + error,
                    okButtonText: "Aceptar"
                })
            }, 3000);

        });
    }

    onLongPress(){
        this.password.setNewPassword();
    }






}




const barcodeScannerOptions = {
    formats: "QR_CODE, EAN_13",
    message: "Usa el boton de volumen para mas luz", // Android only, default is 'Place a barcode inside the viewfinder rectangle to scan it.'
    beepOnScan: true,             // Play or Suppress beep on scan (default true)
    fullScreen: true,             // Currently only used on iOS; with iOS 13 modals are no longer shown fullScreen by default
    closeCallback: () => { console.log("Scanner Closed") }, // invoked when the scanner was closed (success or abort)
    resultDisplayDuration: 100,   // Android only, default 1500 (ms), set to 0 to disable echoing the scanned text
    orientation: "portrait",     // Android only, default undefined (sensor-driven orientation), other options: portrait|landscape
    openSettingsIfPermissionWasPreviouslyDenied: true, // On iOS you can send the user to the settings app if access was previously denied
    presentInRootViewController: true // iOS-only; If you're sure you're not presenting the (non embedded) scanner in a modal, or are experiencing issues with fi. the navigationbar, set this to 'true' and see if it works better for your app (default false).
}
