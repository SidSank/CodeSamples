import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class HubspotService {

  constructor(private _httpClient: HttpClient) { }

  // Get all companies
  getAllCompanies(tableFilters:any){
    return this._httpClient.post(`${environment.apiUrl}Hubspot/GetAll`,tableFilters);
  }

  // Get companies by id
  getCompanyById(event:any){
    return this._httpClient.get(`${environment.apiUrl}Hubspot/GetById`,{params: {Id:event}});
  }

  // Get prospect details
  getProspectDetails(event:any){
    return this._httpClient.get(`${environment.apiUrl}Hubspot/GetById`,{params: {Id:event}});
  }

  // Get list of companies according to search parameter
  getCompaniesFromHubSpot(search:any){
    return this._httpClient.get(`${environment.apiUrl}Hubspot/SearchCompanyByName`,{params:search})
  }

  // Get company details by hubspot id
  getCompanyDetails(hubspotId:any){
    return this._httpClient.get(`${environment.apiUrl}Hubspot/GetCompanyDetails`,{params:{companyId: hubspotId}})
  }

  // Create prospect from hubspot company
  createProspect(companyDetails:any){
    return this._httpClient.post(`${environment.apiUrl}Hubspot/Create`,companyDetails);
  }

  // Get prospect details from hubspot
  getProspectDetail(){
    return this._httpClient.post(`${environment.apiUrl}Hubspot/GetProspectDetail`,null);
  }
}
