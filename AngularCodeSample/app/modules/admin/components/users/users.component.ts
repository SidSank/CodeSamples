import { NoopScrollStrategy } from '@angular/cdk/overlay';
import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { finalize } from 'rxjs';
import { NotificationService } from 'src/app/core/services/notification.service';
import { UsersService } from 'src/app/core/services/users.service';
import { HttpStatusCodes } from 'src/app/shared/enums/httpStatus';
import { Error, User, User_Active, User_Deactive } from 'src/app/shared/enums/messages';
import { EditUserComponent } from '../edit-user/edit-user.component';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent implements OnInit {
  dataSource!: MatTableDataSource<any>;
  users:any;
  displayedColumns!: string[];
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  constructor(private _userService: UsersService, private _router: Router, public dialog: MatDialog,
    private _ns: NotificationService, private _spinner: NgxSpinnerService) {
      this.dataSource = new MatTableDataSource<any>([]);
      this.dataSource.paginator = this.paginator;
    }

  ngOnInit(): void {
    this.displayedColumns = ['firstName', 'userName', 'createdTimeUtc', 'isActive','roles'];
    this.getUsers();
  }

  // Get all users
  getUsers() {
    this._spinner.show();
    this._userService.getUsers().subscribe((response: any) => {
      if(response){
        this.users = response;
        this.dataSource = new MatTableDataSource<any>(this.users);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this._spinner.hide();
      }else{
        this._spinner.hide();
      }
    },error=>{
      this._spinner.hide();
      console.log(error);
      this._ns.openErrorMessage(Error.message);
    })
  }

  // Pass user details to user-details
  userDetails(user:any){
    this._router.navigate([`/dashboard/user-details/${user.id}`]);
  }

  // Register new user
  registerUser(){
    const dialogRef = this.dialog.open(EditUserComponent,{
      width:'700px',
      scrollStrategy: new NoopScrollStrategy()
    });

    dialogRef?.afterClosed()?.subscribe(result => {
      if(result){
        this._spinner.show();
        this._userService.addUser(result).pipe(finalize(()=>{
          this._spinner.hide();
        })).subscribe((res:any)=>{
          if(res){
            this.getUsers();
            this._ns.openSuccessMessage(User.success);
          }else{
          }
        },error=>{
          if (error.status !== HttpStatusCodes.Unauthorized && error.status !== HttpStatusCodes.Ok) {
            let errMessage = typeof(error?.error) == 'string' ? error?.error : Error?.message;
            this._ns.openErrorMessage(errMessage);
          } else if (error.status === HttpStatusCodes.Ok) {
            this.getUsers();
            this._ns.openSuccessMessage(User.success);
          }
        })
      }
    },error=>{
      console.log(error);
      this._ns.openErrorMessage(Error.message);
    });
  }

  // Searching in user list
  applyFilter(event: string) {
    const filterValue = event;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  // Deactivate user
  deactiveUser(user:any,event:any){
    this._spinner.show();
    this._userService.updateUserActivation(user).subscribe((res:any)=>{
      if(res){
        this._ns.openSuccessMessage(User_Active.success);
      }
      else{
      }
    },error=>{
      if(error.status === HttpStatusCodes.Ok){
        if(user?.isActive && !event.target.checked){
          user.isActive = false;
          this.users = {...this.users,...user};
          this._ns.openSuccessMessage(User_Deactive.success);
        }else{
          user.isActive = true;
          this.users = {...this.users,...user};
          this._ns.openSuccessMessage(User_Active.success);
        }
      }else{
        this._ns.openErrorMessage(Error.message);
      }
    })
  }

}
