import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CompanyProfileService {

  constructor(private _httpClient: HttpClient) { }

  // Create company profile
  createCompanyProfile(prospectId: any){
    const params = { prospectId: prospectId }
    return this._httpClient.post(`${environment.apiUrl}CompanyProfile/CreateCompanyProfile`,null,{params:params});
  }

  // Send Email with Access Key for Importing Profile Data
  sendEmailWithAccessKey(companyId:any,prospectId:any,email:any){
    const params = { prospectId: prospectId }
    return this._httpClient.get(`${environment.apiUrl}CompanyProfile/GetAccessKey`,{params:params});
  }

  // Send import profile data reminder
  sendReminder(companyId:any,prospectId:any,email:any) {
    const params = { prospectId: prospectId }
    return this._httpClient.post(`${environment.apiUrl}CompanyProfile/SendImportProfileDataReminder`,{params:params});
  }
}
