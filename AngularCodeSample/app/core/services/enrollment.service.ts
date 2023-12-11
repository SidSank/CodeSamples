import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EnrollmentService {

  constructor(private _httpClient: HttpClient) { }

  // Submit prospect feedback
  submitFeedback(feedback: any) {
    const params = { quotationId: feedback?.quotationId, prospectFeedback: feedback?.prospectFeedback }
    return this._httpClient.put<any>(`${environment.apiUrl}EnrollmentProcess/Feedback`, null, { params: params });
  }

  // Accept Quotation
  acceptQuotation(quotationId: any) {
    const params = { quotationId: quotationId }
    return this._httpClient.put(`${environment.apiUrl}EnrollmentProcess/AcceptQuotation`, null, { params: params })
  }

  // Agree Contract
  agreeContract(contract: any) {
    return this._httpClient.put(`${environment.apiUrl}EnrollmentProcess/SignContract`, contract);
  }
}
