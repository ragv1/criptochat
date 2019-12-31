import { Component, OnInit, AfterViewInit } from "@angular/core";
import { registerElement } from "nativescript-angular/element-registry";
import { BarcodeScanner } from "nativescript-barcodescanner";
registerElement("BarcodeScanner", () => require("nativescript-barcodescanner").BarcodeScannerView);
import { CommunicationService, Msg } from "../shared/communication.service";
import { UserManager } from "../shared/user-management.service";
import * as dialogs from "tns-core-modules/ui/dialogs";
import { User } from "../shared/Interfaces";


@Component({
    selector: "Search",
    templateUrl: "./search.component.html"
})
export class SearchComponent implements OnInit,AfterViewInit {
   
    pause: boolean = false;
    barcodescannerModule: any;
    users: User[] = [];


    constructor(
        private userManager: UserManager,
        private communication: CommunicationService) {
        this.barcodescannerModule = new BarcodeScanner();
    }

    ngAfterViewInit(): void {
        setTimeout(() => {
            this.userManager.initKeys();
        }, 3000);
    }

    ngOnInit(): void {
        this.communication.getMessage$()
        .subscribe((value:Msg) => {
            this.refresh(value)
        });
    }
    
    refresh(can: Msg) {
        if(this.userManager.noKeys()) return;
        if (can.update) {
            this.userManager.readUsers()
            .then(users=>{
                this.users = users
            })
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
            this.refresh({ update: true });
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
        if(this.userManager.noKeys()) return;
        this.userManager.setPasswordSchema('','').then(v=>console.log(v))
        // this.requestPermission()
        // .then(() => {
        //     return this.barcodescannerModule.scan(barcodeScannerOptions)
        // })
        // .then((result) => {
        //     return this.userManager.readQrCode(result.text)
        // })
        // .then(newUserCreated => {
        //     if (!newUserCreated) { return }
        //     setTimeout(() => {
        //         dialogs.confirm({
        //             title: "Sistema",
        //             message: "Nuevo usuario creado.",
        //             okButtonText: "Aceptar"
        //         }).then(() => {
        //             this.refresh({ update: true });
        //         })
        //     }, 3000);
        // })
        // .catch(error => {
        //     setTimeout(() => {
        //         dialogs.confirm({
        //             title: "Sistema",
        //             message: "Error: " + error,
        //             okButtonText: "Aceptar"
        //         })
        //     }, 3000);

        // });
    }
    onLongPress($event){
        console.log("loooooonnngDick")
    }






}




const barcodeScannerOptions = {
    formats: "QR_CODE, EAN_13",
    cancelLabel: "EXIT. Also, try the volume buttons!", // iOS only, default 'Close'
    cancelLabelBackgroundColor: "#333333", // iOS only, default '#000000' (black)
    message: "Usa el boton de volumen para mas luz", // Android only, default is 'Place a barcode inside the viewfinder rectangle to scan it.'
    beepOnScan: true,             // Play or Suppress beep on scan (default true)
    fullScreen: true,             // Currently only used on iOS; with iOS 13 modals are no longer shown fullScreen by default
    closeCallback: () => { console.log("Scanner Busted") }, // invoked when the scanner was closed (success or abort)
    resultDisplayDuration: 100,   // Android only, default 1500 (ms), set to 0 to disable echoing the scanned text
    orientation: "portrait",     // Android only, default undefined (sensor-driven orientation), other options: portrait|landscape
    openSettingsIfPermissionWasPreviouslyDenied: true, // On iOS you can send the user to the settings app if access was previously denied
    presentInRootViewController: true // iOS-only; If you're sure you're not presenting the (non embedded) scanner in a modal, or are experiencing issues with fi. the navigationbar, set this to 'true' and see if it works better for your app (default false).
}
