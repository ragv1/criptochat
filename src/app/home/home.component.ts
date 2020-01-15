import { Component, OnInit } from "@angular/core";
import { DataItem, DataService } from "../shared/data.service";
import { AppmanagerService } from "../shared/appmanager.service";


@Component({
    selector: "Home",
    templateUrl: "./home.component.html"
})
export class HomeComponent implements OnInit {
    items: Array<DataItem>;

    constructor(private _itemService: DataService, private appmanager:AppmanagerService) { }

    ngOnInit(): void {
        this.items = this._itemService.getItems();
    }
    onLongPress(){
        this.appmanager.openApp();
    }
}
