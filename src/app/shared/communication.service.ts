import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
	providedIn: 'root'
})
export class CommunicationService {
	
	public communication = new BehaviorSubject<Msg>({ update: false });

	getMessage$() {
		return this.communication.asObservable();
	}

	sendMessage(data: Msg) { this.communication.next(data); }

}

export interface Msg {
	update: boolean;
}
