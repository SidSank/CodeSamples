import { NoopScrollStrategy } from '@angular/cdk/overlay';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { finalize } from 'rxjs';
import * as _ from  'lodash';
import { CompanyProfileService } from 'src/app/core/services/company-profile.service';
import { HubspotService } from 'src/app/core/services/hubspot.service';
import { NotificationService } from 'src/app/core/services/notification.service';
import { ProspectsService } from 'src/app/core/services/prospects.service';
import { QuestionariesService } from 'src/app/core/services/questionaries.service';
import { SendQuestionairesComponent } from 'src/app/shared/components/send-questionaires/send-questionaires.component';
import { companyStatus, defaultPagination, defaultSort, Reset, statusAction } from 'src/app/shared/enums/common';
import { HttpStatusCodes } from 'src/app/shared/enums/httpStatus';
import { Error, Questionaries } from 'src/app/shared/enums/messages';
import { actionRules } from 'src/app/shared/enums/status-action-rules';

@Component({
  selector: 'app-prospects',
  templateUrl: './prospects.component.html',
  styleUrls: ['./prospects.component.css']
})
export class ProspectsComponent implements OnInit {
  dataSource!: MatTableDataSource<any>;
  companies: any;
  totalData: number = 0;
  pageSize = 10;
  displayedColumns!: string[];
  FilterProspectsForm !: FormGroup;
  showMoreFilters: boolean = false;
  statusActions: any = statusAction;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  constructor(private _router: Router, private _prospectService: ProspectsService, private _spinner: NgxSpinnerService,
    private fb: FormBuilder, private _ns: NotificationService, private _hubspot: HubspotService, private _companyProfile: CompanyProfileService,
    private _questionairesService: QuestionariesService, public dialog: MatDialog) {
    this.makeFilterForm();
    this.dataSource = new MatTableDataSource<any>([]);
    this.dataSource.paginator = this.paginator;
  }

  ngOnInit(): void {
    this.displayedColumns = ['companyName', 'companyOwner', 'phoneNumber', 'createdDate', 'statusName', 'actions'];
    this.getCompanies();
  }

  //Filter form
  makeFilterForm() {
    this.FilterProspectsForm = this.fb.group({
      companyName: [''],
      contactName: [''],
      contactEmail: [''],
      contactPhoneNumber: [''],
      address1: [''],
      address2: [''],
      city: [''],
      state: [''],
      zipcode: ['']
    })
  }

  // Get all companies
  getCompanies(event?: any) {
    this._spinner.show();
    let tableFilters = this.filter(event);
    tableFilters = { ...tableFilters, ...this.FilterProspectsForm.value }
    this._prospectService.getAllProspects(tableFilters).pipe(finalize(() => {
      this._spinner.hide();
    })).subscribe((response: any) => {
      if (response) {
        this.companies = response?.data;
        this.dataSource = new MatTableDataSource<any>(response?.data);
        this.totalData = response?.totalItemsCount;
        this.dataSource.sort = this.sort;
        this.paginator.pageSize = this.pageSize;
      } else {
      }
    }, error => {
      if (error.status !== HttpStatusCodes.Unauthorized && error.status !== HttpStatusCodes.Ok) {
        this._ns.openErrorMessage(Error.message);
      }
    })
  }

  // Filter Table
  filter(event: any) {
    const tableFilters = {
      sortTypes: [
        {
          sortColumn: event?.active ? event?.active : '',
          sortDirection: event?.direction === 'asc' ? defaultSort.asc : defaultSort.desc,
        }
      ],
      pageNumber: event?.pageIndex ? event?.pageIndex + 1 : defaultPagination.pageNumber,
      pageSize: this.pageSize,
    }
    return tableFilters;
  }

  // Apply filters
  applyFilter() {
    this.getCompanies();
  }

  // Add new prospect
  addProspect() {
    this._router.navigate(['/dashboard/add-prospect']);
  }

  // Get prospect details
  prospectDetails(prospect: any) {
    this._router.navigate([`/dashboard/prospect-details/${prospect.id}`]);
  }

  // Show more filters
  showMoreFilter(event: any) {
    this.showMoreFilters = event;
  }

  // Set action rules
  getActions(status: any) {
    return this._prospectService.getActions(status);
  }

  // Get latest created questionaires
  getLatestCreatedQuestionaires(company: any) {
    let sendQuestionairesAgain = false;
    const pastTime = new Date(company?.questionnaireAnswerSubmittedTimeUtc);
    const now = new Date();
    const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
    const timeDiffInMs = now.getTime() - pastTime.getTime();
    if (timeDiffInMs > thirtyDaysInMs) {
      sendQuestionairesAgain = true;
    }
    return sendQuestionairesAgain;
  }

  // Status Action
  statusAction(action: any, prospect: any) {
    if (action === statusAction.Enter_Quotation) {
      this._router.navigate([
        `/dashboard/submit-quotation/${prospect?.id}`,
      ]);
    } else if (action === statusAction.Send_Questionaires || action === statusAction.Send_Questionaires_Again) {
      this.sendQuestionaires(prospect);
    } else if (action === statusAction.Send_Reminder) {
      this.sendReminder(prospect);
    } else if (action === statusAction.Submit_Another_Quotation) {
      this._router.navigate([
        `/dashboard/update-quotation/${prospect?.id}`,
      ]);
    } else if (action === statusAction.Revise_Questionnaire_Answers) {
      this.getQuestionaires(prospect);
    } else if (action === statusAction.Create_Company_Profile) {
      this.createCompanyProfile(prospect?.id);
    }
  }

  // Send Questionaires
  sendQuestionaires(prospect: any) {
    this._questionairesService.sendQuestionaires(prospect?.id).subscribe((res: any) => {
      if (res) {

      }
    }, error => {
      if (error.status !== HttpStatusCodes.Unauthorized && error.status !== HttpStatusCodes.Ok) {
        this._ns.openErrorMessage(Error.message);
      } else if (error.status === HttpStatusCodes.Ok) {
        error?.error?.text && this._ns.openSuccessMessage(error?.error?.text);
      }
    })
  }

  // Get particular questionaire details
  getQuestionaires(prospect: any) {
    const questionnaireId = Reset.value;
    const isNew = prospect.status?.id < companyStatus.questionaireId ? true : false;
    this._questionairesService.getQuestionaire(prospect?.id, isNew, questionnaireId).subscribe((res: any) => {
      if (res?.questionnaireId) {
        this.reviseQuestiopnnaire(prospect?.id, res);
      }
    }, error => {
      this._ns.openErrorMessage(Error.message)
    })
  }

  // Revise Questionnaire
  reviseQuestiopnnaire(prospectId: any, questionairesAnswers: any) {
    const dialogRef = this.dialog.open(SendQuestionairesComponent, {
      width: '900px',
      data: { 'questionairesAnswers': questionairesAnswers },
      maxHeight: '70vh',
      scrollStrategy: new NoopScrollStrategy()
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        result.companyId = prospectId;
        this._questionairesService.submitQuestionaires(result, false).subscribe((res: any) => {
          if (res) {
            this._ns.openSuccessMessage(Questionaries.success);
          }
        }, error => {
          if (error.status !== HttpStatusCodes.Unauthorized && error.status !== HttpStatusCodes.Ok) {
            this._ns.openErrorMessage(Error.message);
          } else if (error.status === HttpStatusCodes.Ok) {
            this._ns.openSuccessMessage(Questionaries.success);
          }
        })
      }
    }, error => {
      console.error(error);
    });
  }

  // Send Reminder
  sendReminder(prospect: any) {
    this._prospectService.sendReminder(prospect?.id).subscribe(res => {
      if (res) {

      }
    }, error => {
      if (error.status !== HttpStatusCodes.Unauthorized && error.status !== HttpStatusCodes.Ok) {
        this._ns.openErrorMessage(Error.message);
      } else if (error.status === HttpStatusCodes.Ok) {
        error?.error?.text && this._ns.openSuccessMessage(error?.error?.text);
      }
    })
  }

  // Create company profile
  createCompanyProfile(prospectId: any) {
    this._companyProfile.createCompanyProfile(prospectId).subscribe((res: any) => {
      if (res?.prospectStatus || res?.prospectActivityLogs) {
        this._ns.openSuccessMessage(res?.message);
      } else {
        this._ns.openErrorMessage(res?.message);
      }
    }, error => {
      if (error.status === HttpStatusCodes.Bad_Request && _.isString(error?.error)) {
        this._ns.openErrorMessage(error?.error);
      }
      else if (error.status !== HttpStatusCodes.Unauthorized && error.status !== HttpStatusCodes.Ok) {
        this._ns.openErrorMessage(Error.message);
      }
    })
  }

}
