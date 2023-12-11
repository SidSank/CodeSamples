import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Roles } from 'src/app/shared/enums/roles';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  public isLoggedInSubject: BehaviorSubject<boolean>;
  public currentUserSubject: BehaviorSubject<any>;
  public currentUser: Observable<any>;
  constructor(private _http: HttpClient) {
    const currentUserJson:any = localStorage.getItem('currentUser');
    this.currentUserSubject = new BehaviorSubject<any>(JSON.parse(currentUserJson));
    this.currentUser = this.currentUserSubject.asObservable();
    this.isLoggedInSubject = new BehaviorSubject<any>(this.getToken() ? true : false);
  }

  // getter: currentUserValue
  public get currentUserValue(): any {
    return this.currentUserSubject.value;
  }

  /**
   *  Confirms if user is Admin
  */
  get isAdmin() {
    let isAdmin =  false;
    if(this.currentUser && this.currentUserSubject.value?.roles?.includes(Roles.Admin)){
      isAdmin = true;
    }
    return isAdmin;
  }

  /**
   *  Confirms if user is Sales Manager
   */
  get isSalesManager() {
    let isSalesManager =  false;
    if(this.currentUser && this.currentUserSubject.value?.roles?.includes(Roles.Sales_Manager)){
      isSalesManager = true;
    }
    return isSalesManager;
  }

  /**
   *  Confirms if user is Sales Staff
   */
  get isSalesStaff() {
    let isSalesStaff =  false;
    if(this.currentUser && this.currentUserSubject.value?.roles?.includes(Roles.Sales_Staff)){
      isSalesStaff = true;
    }
    return isSalesStaff;
  }

  // Validate
  validate(userData: any) {
    return this._http.post(`${environment.apiUrl}Auth/Login`, userData);
  }

  // Send reset password email
  sendResetPasswordEmail(email:any){
    return this._http.post(`${environment.apiUrl}Auth/ResetPasswordEmail`, email);
  }

  // Reset password
  resetPassword(newPassword:any){
    return this._http.post(`${environment.apiUrl}Auth/ResetPassword`, newPassword);
  }

  // Change password
  changePassword(password:any){
    return this._http.post(`${environment.apiUrl}Auth/ChangePassword`, password);
  }

  // Refresh token
  refreshToken() {
    const refreshTokenPayload = {
      token: this.currentUserValue?.token,
      refreshToken: this.currentUserValue?.refreshToken
    }
    return this._http.post(`${environment.apiUrl}Auth/RefreshTokenAysnc`,refreshTokenPayload);
  }

  // Remove user from local storage to log user out
  logOut() {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    this.isLoggedInSubject.next(false);
    this.currentUserSubject.next(null);
  }

  // Get roles
  getRoles(){
    return this._http.get(`${environment.apiUrl}Auth/GetAllRoles`);
  }

  // Get token
  getToken() {
    const token = localStorage.getItem('token') ? localStorage.getItem('token') : sessionStorage.getItem('token');
    return token;
  }
}
