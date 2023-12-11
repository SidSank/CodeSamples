import { Component, OnInit } from '@angular/core';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent implements OnInit{
  title = 'Prospect';
  isLoggedIn:any = false;
  constructor(private _authenticationService: AuthService) {
    this._authenticationService.isLoggedInSubject.subscribe((res:any)=>{
      this.isLoggedIn = res;
    });
  }

  ngOnInit(): void{

  }
}
