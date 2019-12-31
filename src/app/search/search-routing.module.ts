import { NgModule } from "@angular/core";
import { Routes } from "@angular/router";
import { NativeScriptRouterModule } from "nativescript-angular/router";
import { UserdetailsComponent } from "./userdetails/userdetails.component";

import { SearchComponent } from "./search.component";

const routes: Routes = [
    { path: "default", component: SearchComponent },
    { path: "user/:id", component: UserdetailsComponent }
];

@NgModule({
    imports: [NativeScriptRouterModule.forChild(routes)],
    exports: [NativeScriptRouterModule]
})
export class SearchRoutingModule { }
