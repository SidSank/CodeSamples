import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UsersService {

  constructor(private _httpClient: HttpClient) { }

  // Get all users
  getUsers(){
    return this._httpClient.get(`${environment.apiUrl}Auth/GetAllUsers`);
  }

  // Get user by id
  getUserById(id:any){
    const params = {id: id}
    return this._httpClient.get(`${environment.apiUrl}Auth/GetUserDetail`,{params:params});
  }

  // Add user
  addUser(user:any){
    return this._httpClient.post(`${environment.apiUrl}Auth/RegisterUser`,user);
  }

  // Add user
  editUser(user:any){
    const params = {id: user?.id};
    delete user?.id;
    return this._httpClient.post(`${environment.apiUrl}Auth/UpdateUser`,user,{params:params});
  }

  // Update user activatiy
  updateUserActivation(user:any){
    const params = {id: user?.id};
    return this._httpClient.post(`${environment.apiUrl}Auth/UpdateUserActivation`,null,{params:params});
  }
}
