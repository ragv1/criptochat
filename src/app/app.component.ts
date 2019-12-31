import { Component } from "@angular/core";
import { CommunicationService } from "./shared/communication.service";

@Component({
    selector: "ns-app",
    templateUrl: "app.component.html"
})
export class AppComponent {
   

    constructor(private communication: CommunicationService) {
    }

    onTapitap(){
        this.communication.sendMessage({update:true});
    }
   
   
}
