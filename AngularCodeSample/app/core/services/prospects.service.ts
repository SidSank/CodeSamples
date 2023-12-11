import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { actionRules } from 'src/app/shared/enums/status-action-rules';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProspectsService {

  constructor(private _httpClient: HttpClient) { }

  // Get all users
  getAllProspects(filters:any){
    return this._httpClient.post(`${environment.apiUrl}Prospect/GetAll`,filters);
  }

  // Get all companies
  getAllCompanies(){
    return this._httpClient.get(`${environment.apiUrl}Company/GetAll`);
  }

  // Get company by id
  getCompanyById(id:any){
    const params = {id: id}
    return this._httpClient.get(`${environment.apiUrl}Company/GetById`,{params:params});
  }

  // Add new prospect
  createProspect(prospectPayload:any){
    return this._httpClient.post(`${environment.apiUrl}Prospect/Create`,prospectPayload);
  }

  // Get prospect details by id
  getProspectDetailsById(id:any){
    const params = {id: id}
    return this._httpClient.post(`${environment.apiUrl}Prospect/GetWithContactsAndActivityLog`,null,{params:params});
  }

  // Send Reminder
  sendReminder(prospectId:any){
    const params = {prospectId: prospectId}
    return this._httpClient.post(`${environment.apiUrl}Prospect/SendReminder`,null,{params:params});
  }

  // Get actions status link
  getActions(status:any){
    let action;
    switch(status){
      case actionRules.Rule_1.status:
        action = actionRules.Rule_1.action;
        break;
      case actionRules.Rule_2.status:
        action = actionRules.Rule_2.action;
        break;
      case actionRules.Rule_3.status:
        action = actionRules.Rule_3.action;
        break;
      case actionRules.Rule_4.status:
        action = actionRules.Rule_4.action;
        break;
      case actionRules.Rule_5.status:
        action = actionRules.Rule_5.action;
        break;
      case actionRules.Rule_6.status:
        action = actionRules.Rule_6.action;
        break;
        case actionRules.Rule_7.status:
        action = actionRules.Rule_7.action;
        break;
        case actionRules.Rule_8.status:
        action = actionRules.Rule_8.action;
        break;
        case actionRules.Rule_9.status:
        action = actionRules.Rule_9.action;
        break;
        case actionRules.Rule_10.status:
        action = actionRules.Rule_10.action;
        break;
        case actionRules.Rule_11.status:
        action = actionRules.Rule_11.action;
        break;
        case actionRules.Rule_12.status:
        action = actionRules.Rule_12.action;
        break;
        case actionRules.Rule_13.status:
        action = actionRules.Rule_13.action;
        break;
        case actionRules.Rule_4.status:
        action = actionRules.Rule_14.action;
        break;
    }
    return action;
  }
}
