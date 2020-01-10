import { Component, OnInit, OnDestroy } from "@angular/core";
import { CommunicationService } from "./shared/communication.service";
import { AppmanagerService } from "./shared/appmanager.service";
import { on as applicationOn, suspendEvent, 
    resumeEvent, uncaughtErrorEvent, 
    ApplicationEventData } from "tns-core-modules/application";

@Component({
    selector: "ns-app",
    templateUrl: "app.component.html"
})
export class AppComponent implements OnInit, OnDestroy{
  
    constructor(private communication: CommunicationService, private appmanager:AppmanagerService) {
        
        applicationOn(suspendEvent, (args: ApplicationEventData) => {
            if (args.android) {
                this.appmanager.closeApp();
            } else if (args.ios) {
               
            }
        });
        
        applicationOn(resumeEvent, (args: ApplicationEventData) => {
            if (args.android) {
                this.appmanager.openApp();
            } else if (args.ios) {
                
            }
        });
        
        applicationOn(uncaughtErrorEvent, (args: ApplicationEventData) => {
            if (args.android) {
                console.log("NativeScriptError: " + args.eventName);
            } else if (args.ios) {
                console.log("NativeScriptError: " + args.ios);
            }
        });
    }

    ngOnInit(): void {
      console.log("App-started");
    }

    onTapitap(){
        this.communication.sendMessage({text:"true"});
    }

    ngOnDestroy(): void {
        clearTimeout(this.appmanager.token);
        console.log("App-Destroyed");
    }

}
