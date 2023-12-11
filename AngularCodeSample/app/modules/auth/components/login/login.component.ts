import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { finalize } from 'rxjs';
import { AuthService } from 'src/app/core/services/auth.service';
import { NotificationService } from 'src/app/core/services/notification.service';
import { Error, Login } from 'src/app/shared/enums/messages';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm !: FormGroup;
  submitted: boolean = false;
  constructor(private fb: FormBuilder, private _authService: AuthService, private _router: Router,
    private _ns: NotificationService, private _spinner: NgxSpinnerService) { }

  ngOnInit(): void {
    this.makeLoginForm()
  }

  // Make login form
  makeLoginForm(){
    this.loginForm = this.fb.group({
      userName: ['',[Validators.required,Validators.email]],
      password: ['',[Validators.required]],
      rememberMe: ['true']
    })
  }

  // Get form controls
  get f(): { [key: string]: AbstractControl } {
    return this.loginForm.controls;
  }

  //Validate user
  validateUser(){
    this.submitted = true;
    if(this.loginForm.valid){
      this._spinner.show();
      this._authService.validate(this.loginForm.value).pipe(finalize(()=>{
        this._spinner.hide();
      })).subscribe((response:any)=>{
        if(response){
          localStorage.setItem('token', response.token);
          localStorage.setItem('currentUser', JSON.stringify(response));
          this._authService.currentUserSubject.next(response)
          this._authService.isLoggedInSubject.next(true);
          this._router.navigate(['/dashboard']);
          this._ns.openSuccessMessage(Login.success);
        }else{
        }
      },error=>{
        this._ns.openErrorMessage(Error.message);
        console.log(error);
      })
    }
  }

}
