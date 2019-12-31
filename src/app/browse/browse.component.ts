import { Component, OnInit, ElementRef, ViewChild, AfterViewInit, ChangeDetectorRef, OnDestroy } from "@angular/core";
const ZXing = require('nativescript-zxing');
import * as dialogs from "tns-core-modules/ui/dialogs";
import * as LZString from "lz-string";
import { UserManager } from "../shared/user-management.service";


@Component({
    selector: "Browse",
    templateUrl: "./browse.component.html"
})
export class BrowseComponent implements OnInit{
    usuario=null;
    clave=null;
    servidor=null;
    showBarcode:boolean=false;
    @ViewChild('qrCode',null) qrCodeHolder: ElementRef;
    isBusy: boolean=false;
    
    
    constructor (private userManager:UserManager) {}
    
    ngOnInit(): void {
        // this.userManager.saveSchema();
    }

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
    onLongPress($event){
        let oldPass;
        dialogs.prompt({
            title: "Sistema - Cambiar contraseña",
            message: "Contraseña anterior",
            inputType:dialogs.inputType.password,
            okButtonText: "Aceptar",
            cancelable:false
        }).then((value:dialogs.PromptResult) => {
            oldPass=value.text;
            return dialogs.prompt({
                title: "Sistema",
                message: "Contraseña nueva.",
                inputType:dialogs.inputType.password,
                okButtonText: "Aceptar",
                cancelable:false
            })
        }).then((value:dialogs.PromptResult) => {
            console.log(oldPass,value.text);
        })
    }


}
