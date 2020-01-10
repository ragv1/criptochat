import { Component, OnInit, ElementRef, ViewChild, AfterViewInit, ChangeDetectorRef, OnDestroy } from "@angular/core";
const ZXing = require('nativescript-zxing');
import * as dialogs from "tns-core-modules/ui/dialogs";
import * as LZString from "lz-string";
import { UserManager } from "../shared/user-management.service";
import { AppmanagerService } from "../shared/appmanager.service";
import { PasswordService } from "../shared/password.service";


@Component({
    selector: "Browse",
    templateUrl: "./browse.component.html"
})
export class BrowseComponent {
    usuario=null;
    clave=null;
    servidor=null;
    showBarcode:boolean=false;
    @ViewChild('qrCode',null) qrCodeHolder: ElementRef;
    isBusy: boolean=false;
    
    
    constructor (private userManager:UserManager, private passwordService:PasswordService, private manager:AppmanagerService) {}

    generateBarcode() {
        this.isBusy = true;
        let zx = new ZXing();
        setTimeout(() => {
            this.userManager.writeQrCode()
            .then(qrcode=>{
                let img = zx.createBarcode({encode: qrcode, height: 1000, width: 1000, format: ZXing.QR_CODE})
                this.qrCodeHolder.nativeElement.src=img;
                this.isBusy=false;
                this.showBarcode=true;
            });
        }, 3000);
    }
    
    clearBarcode(){
        this.userManager.consolidateNewUser()
        .then(value=>{
            if(value){
                dialogs.confirm({
                    title: "Sistema",
                    message: "Usuario Creado",
                    okButtonText: "Aceptar"
                });
            }
            this.showBarcode=false;
        });
    }

    onLongPress(e){
        this.passwordService.changePassword();
    }


}
