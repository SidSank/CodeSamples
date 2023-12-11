import { Component, Inject, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth.service';
import { UsersService } from 'src/app/core/services/users.service';
import { lowerCase, numberCharacters, specialCharacter, upperCase } from 'src/app/shared/utils/password-strength.validator';
import Validation from 'src/app/shared/utils/validation';

@Component({
  selector: 'app-edit-user',
  templateUrl: './edit-user.component.html',
  styleUrls: ['./edit-user.component.css']
})
export class EditUserComponent implements OnInit {
  roles: any;
  user: any;
  submitted: boolean = false;
  updateUserForm!: FormGroup;
  isEditUser: boolean = false;
  constructor(private route: ActivatedRoute, private _userService: UsersService,
    private fb: FormBuilder, public dialogRef: MatDialogRef<EditUserComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any, private _authService: AuthService) {
    this.getRoles();
    this.makeUpdateForm();
    if (data?.userInfo) {
      this.updateUserForm.removeControl('password');
      this.updateUserForm.removeControl('confirmPassword');
      this.isEditUser = true;
      this.updateUserForm.patchValue(data?.userInfo);
    }
  }

  ngOnInit(): void {
  }

  //Get roleId by role name
  getRoleId(roleName: any) {
    return this.roles?.find((role: any) => role?.name == roleName)
  }

  //Get all roles
  getRoles() {
    this._authService.getRoles().subscribe((roles: any) => {
      if (roles) {
        this.roles = roles;
        if (this.data?.userInfo?.roles) {
          let userRoleIds:any = []
          this.roles.filter((role:any)=>{
            if(this.data?.userInfo?.roles.includes(role?.name)){
              userRoleIds.push(role.id);
            }
          })
          this.updateUserForm.controls?.['rolesId'].setValue(userRoleIds)
        }
      }
    }, error => {
      console.log(error);
    })
  }

  // Make user update form
  makeUpdateForm() {
    this.updateUserForm = this.fb.group({
      id: [0],
      firstName: ['', [Validators.required, Validators.maxLength(20)]],
      lastName: ['', [Validators.required, Validators.maxLength(20)]],
      email: ['', [Validators.required, Validators.email, Validators.pattern("[a-zA-Z0-9][a-zA-Z0-9_.]+@[a-zA-Z0-9_]+\\.(com|[a-zA-Z]{2})$")]],
      password: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(20),
      upperCase,lowerCase,numberCharacters,specialCharacter]],
      confirmPassword: ['', [Validators.required]],
      rolesId: [[], [Validators.required]],
    },
      {
        validators: [Validation.match('password', 'confirmPassword')]
      })
  }

  // Get form controls
  get f(): { [key: string]: AbstractControl } {
    return this.updateUserForm.controls;
  }

  // Update user info
  updateUserInfo() {
    this.submitted = true;
    if (this.updateUserForm.valid) {
      if (!this.isEditUser) {
        let fistName = this.updateUserForm.value.firstName;
        let roleId = this.updateUserForm.value.rolesId;
        let userEmail = this.updateUserForm.value.email;
        delete this.updateUserForm.value.firstName;
        delete this.updateUserForm.value.rolesId;
        delete this.updateUserForm.value.id;
        delete this.updateUserForm.value.email;
        this.updateUserForm.value['userEmail'] = userEmail;
        this.updateUserForm.value['fistName'] = fistName;
        this.updateUserForm.value['roleId'] = roleId;
      }else{
        delete this.updateUserForm.value?.password;
        delete this.updateUserForm.value?.confirmPassword;
      }
      this.dialogRef.close(this.updateUserForm.value);
    }
  }

}
