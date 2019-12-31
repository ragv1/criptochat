import { Component, OnInit } from "@angular/core";
import { DataItem, DataService } from "../shared/data.service";
import  { EncrypService }  from "../shared/encryp.service";
import { UserManager } from "../shared/user-management.service";


@Component({
    selector: "Home",
    templateUrl: "./home.component.html"
})
export class HomeComponent implements OnInit {
    items: Array<DataItem>;

    constructor(private _itemService: DataService, private userManager:UserManager) { }

    ngOnInit(): void {
        this.items = this._itemService.getItems();
    }
}
