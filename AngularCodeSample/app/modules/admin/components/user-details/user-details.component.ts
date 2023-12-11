import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { NotificationService } from 'src/app/core/services/notification.service';
import { UsersService } from 'src/app/core/services/users.service';
import { Location } from '@angular/common';
import { EditUserComponent } from '../edit-user/edit-user.component';
import { NgxSpinnerService } from 'ngx-spinner';
import { Error, User_Update } from 'src/app/shared/enums/messages';
import { HttpStatusCodes } from 'src/app/shared/enums/httpStatus';
import { NoopScrollStrategy } from '@angular/cdk/overlay';

@Component({
  selector: 'app-user-details',
  templateUrl: './user-details.component.html',
  styleUrls: ['./user-details.component.css']
})
export class UserDetailsComponent implements OnInit {
  user: any;
  changePasswordForm !: FormGroup;
  submitted: boolean = false;
  constructor(private route: ActivatedRoute, private _userService: UsersService, private _location: Location,
    private fb: FormBuilder, private router: Router, public dialog: MatDialog, private _ns: NotificationService,
    private _spinner: NgxSpinnerService) {
    this.route.params.subscribe((res: any) => {
      this.getUserDetails(res.id)
    })
  }

  ngOnInit(): void {
  }

  //Back to perevious route
  back() {
    this._location.back()
  }

  // Get user by id
  getUserDetails(id: any) {
    this._userService.getUserById(id).subscribe((res: any) => {
      if (res) {
        this.user = res;
      } else {
      }
    }, error => {
      console.log(error);
      this._ns.openErrorMessage(Error.message);
    })
  }

  // Update user info
  updateUser() {
    const dialogRef = this.dialog.open(EditUserComponent, {
      width: '700px',
      data: { 'userInfo': this.user },
      scrollStrategy: new NoopScrollStrategy()
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this._userService.editUser(result).subscribe((res: any) => {
          if (res) {
            this.getUserDetails(this.user?.id);
            this._ns.openErrorMessage(User_Update.success);
          } else {
          }
        }, error => {
          if (error.status === HttpStatusCodes.Ok) {
            this.getUserDetails(this.user?.id);
            this._ns.openSuccessMessage(User_Update.success);
          } else {
            this._ns.openErrorMessage(Error.message);
          }
          console.log(error)
        })
      }
    }, error => {
      console.log(error);
    });
  }
}
