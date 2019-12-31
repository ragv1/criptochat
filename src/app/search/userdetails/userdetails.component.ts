import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { RouterExtensions } from "nativescript-angular/router";
import { EncrypService } from '~/app/shared/encryp.service';
import { CommunicationService } from '~/app/shared/communication.service';
import { UserManager } from '~/app/shared/user-management.service';

@Component({
  selector: 'ns-userdetails',
  templateUrl: './userdetails.component.html'
})
export class UserdetailsComponent implements OnInit {
  server:string="";
  displayname:string=""
  id:any;

  constructor(
    private _route: ActivatedRoute,
    private userManager: UserManager,
    private _routerExtensions:RouterExtensions,
    private communication:CommunicationService
  ) { }

  ngOnInit() {
    this.id = this._route.snapshot.params.id;
    this.userManager.readUser(this.id)
    .then(user=>{
      this.server = user? user.server : "";
      this.displayname= user? user.displayname: "";
    })
  }
  
  onBackTap(): void {
    this.communication.sendMessage({update:true});
    this._routerExtensions.back();
  }

  save(){
    
    this.userManager.updateUser(this.id,this.displayname,this.server)
    
  }

}
