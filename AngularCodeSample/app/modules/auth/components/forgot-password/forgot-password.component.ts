import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from 'src/app/core/services/auth.service';
import { HttpStatusCodes } from 'src/app/shared/enums/httpStatus';
import { NotificationService } from 'src/app/core/services/notification.service';
import { Error } from 'src/app/shared/enums/messages';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent implements OnInit {
  forgotPasswordForm!: FormGroup;
  submitted: boolean = false;
  constructor(private _location: Location, private fb: FormBuilder,private _authService: AuthService,
    private _ns: NotificationService) {
    this.makeForgotPasswordForm();
   }

  ngOnInit(): void {
  }

  // Make forgot password form
  makeForgotPasswordForm(){
    this.forgotPasswordForm = this.fb.group({
      userEmail: ['',[Validators.required,Validators.email]]
    })
  }

  // Get form controls
  get f(): { [key: string]: AbstractControl } {
    return this.forgotPasswordForm.controls;
  }

  // Send reset link to email
  sendEmail(){
    this.submitted = true;
    if(this.forgotPasswordForm.valid){
      this._authService.sendResetPasswordEmail(this.forgotPasswordForm.value).subscribe(res=>{
        if(res){

        }
      },error=>{
        if (error.status !== HttpStatusCodes.Unauthorized && error.status !== HttpStatusCodes.Ok) {
          this._ns.openErrorSnackBar(Error.message);
        }else if (error.status === HttpStatusCodes.Ok){
          error?.error?.text && this._ns.openSuccessSnackBar(error?.error?.text);
        }
      })
    }
  }

  // Back to perevious route
  back() {
    this._location.back()
  }

}
