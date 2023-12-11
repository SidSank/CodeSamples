import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class QuestionariesService {

  constructor(private _httpClient: HttpClient) { }

  // Send questionaires
  sendQuestionaires(id:any){
    const params = {prospectId: id}
    return this._httpClient.post(`${environment.apiUrl}Questionnaire/SendQuestionnaire`,null,{params:params});
  }

  // Submit questionaires
  submitQuestionaires(questionairesPayload:any,isNew:boolean){
    const params = {
      MailingAddressSameAsOfficeAddress: questionairesPayload?.mailingAddressSameAsOfficeAddress,
      BillingAddressSameAsOfficeAddress: questionairesPayload?.billingAddressSameAsOfficeAddress,
      prospectId: questionairesPayload?.companyId,
      isNew: isNew
    }
    return this._httpClient.put(`${environment.apiUrl}Questionnaire/SubmitQuestionnaire`,questionairesPayload,{params:params});
  }

  // Get particular questionaires by prospect id
  getQuestionaire(prospectId:any,isNew:boolean,questionnaireId:any){
    const params = {prospectId: prospectId, isNew: isNew, questionnaireId: questionnaireId}
    return this._httpClient.get(`${environment.apiUrl}Questionnaire/Get`,{params:params});
  }

  // Get all questionaires by prospect id
  getAllQuestionaires(prospectId:any){
    const params = {prospectId: prospectId}
    return this._httpClient.get(`${environment.apiUrl}Questionnaire/GetAll`,{params:params});
  }

  // Get states
  getStates(){
    return this._httpClient.get(`${environment.apiUrl}Country/GetStateByCountryId`);
  }
}
