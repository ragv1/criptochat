import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { RouterExtensions } from "nativescript-angular/router";

import { ListView } from "tns-core-modules/ui/list-view/list-view";
import { TextField } from "tns-core-modules/ui/text-field/text-field";


@Component({
    selector: "ItemDetail",
    templateUrl: "./item-detail.component.html"
})
export class ItemDetailComponent implements OnInit, AfterViewInit {
    messages:any[]=[];
    message:string;
    public me: String;
    list: ListView;
    textfield: TextField;
    id:any;
    
    @ViewChild("list",null) lv: ElementRef;
    @ViewChild("textfield",null) tf: ElementRef;
    
    constructor(
        private _route: ActivatedRoute,
        private _routerExtensions: RouterExtensions
    ) { }

    public ngOnInit() {
        this.id = +this._route.snapshot.params.id;
    }

    onBackTap(): void {
        this._routerExtensions.back();
    }

    ngAfterViewInit() {
        this.list = <ListView>this.lv.nativeElement;
        this.textfield = this.tf.nativeElement;
    }

    scroll(count:number){
        setTimeout(() => {
            this.list.refresh();
            this.list.scrollToIndex(count);
        }, 0);
    }

    chat(message: string) {
        if (message=="") return;
        let newMessage:ChatMessage = {
            message : message,
            from : "them"
        };
        this.messages.push(newMessage);     
        let count = this.list.items.length;
        this.textfield.text = "";
        this.scroll(count);
    }

    filter(sender:string) {
        return sender;
    }

    align(sender) {
        return (sender=="me")? "right" : "left";
    }

    showImage(sender) {
        return "collapse";
    }
}


export interface ChatMessage{
    from:string,
    message:string
}