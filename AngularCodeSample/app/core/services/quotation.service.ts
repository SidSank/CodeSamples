import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class QuotationService {

  constructor(private _httpClient: HttpClient) { }

  // Submit quotation to client
  submitQuotation(quotationForm:any){
    return this._httpClient.post(`${environment.apiUrl}Quotation/SubmitQuotationToClient`,quotationForm);
  }

  // Get quotation details by quotationId
  getQuotationById(quotationId:any){
    const params = {id: quotationId}
    return this._httpClient.get(`${environment.apiUrl}Quotation/GetById`,{params:params});
  }

  // Update quotation
  updateQuotation(quotationForm:any){
    return this._httpClient.put(`${environment.apiUrl}Quotation/UpdateQuotation`,quotationForm);
  }

  // Get quotation by prospect id
  getQuotationByProspect(prospectId:any){
    const params = {prospectId: prospectId}
    return this._httpClient.get(`${environment.apiUrl}Quotation/GetQuotationByProspectId`,{params:params});
  }

}
