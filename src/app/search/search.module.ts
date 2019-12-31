import { NgModule, NO_ERRORS_SCHEMA } from "@angular/core";
import { NativeScriptCommonModule } from "nativescript-angular/common";

import { SearchRoutingModule } from "./search-routing.module";
import { SearchComponent } from "./search.component";
import { UserdetailsComponent } from './userdetails/userdetails.component';
import { NativeScriptFormsModule } from "nativescript-angular";
import { EncrypService } from "../shared/encryp.service";
import { LibsodiumService } from "../shared/libsodium.service";
import { UserManager } from "../shared/user-management.service";
import { CommunicationService } from "../shared/communication.service";


@NgModule({
    imports: [
        NativeScriptCommonModule,
        NativeScriptFormsModule,
        SearchRoutingModule
    ],
    declarations: [
        SearchComponent,
        UserdetailsComponent
    ],
    schemas: [
        NO_ERRORS_SCHEMA
    ]
})
export class SearchModule { }
