import { Component, OnInit, OnDestroy } from "@angular/core";
import { CommunicationService } from "./shared/communication.service";
import { AppmanagerService } from "./shared/appmanager.service";
import { on as applicationOn, suspendEvent, uncaughtErrorEvent, 
    ApplicationEventData, 
    resumeEvent} from "tns-core-modules/application";
import { SwipeGestureEventData } from "tns-core-modules";

@Component({
    selector: "ns-app",
    templateUrl: "app.component.html"
})
export class AppComponent {
    constructor(private communication: CommunicationService, 
        private appmanager:AppmanagerService) {
        
        applicationOn(suspendEvent, (args: ApplicationEventData) => {
            if (args.android) {
                this.appmanager.closeApp();
                console.log('suspend event');
            } else if (args.ios) {
               
            }
        });

        applicationOn(resumeEvent, (args: ApplicationEventData) => {
            if (args.android) {
                console.log("resuming event");
                this.communication.sendMessage({text:'REFRESH_USER_VIEW'})
            } else if (args.ios) {
               
            }
        });
        
        
        applicationOn(uncaughtErrorEvent, (args: ApplicationEventData) => {
            if (args.android) {
                console.log("mangerServiceError: " + args.eventName);
            } else if (args.ios) {
                console.log("mangerServiceError: " + args.ios);
            }
        });
    }

    onUserTab(){
        this.communication.sendMessage({text:"REFRESH_USER_VIEW"});
    }



}
