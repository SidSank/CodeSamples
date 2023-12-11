import { Component, OnInit, ViewChild } from '@angular/core';
import { MatAccordion } from '@angular/material/expansion';
import { ActivatedRoute, Router } from '@angular/router';
import { ProspectsService } from 'src/app/core/services/prospects.service';
import { Location } from '@angular/common';
import { Address, companyStatus, quotation, Reset, setupTrainingFee, statusAction } from 'src/app/shared/enums/common';
import { FormBuilder, FormGroup } from '@angular/forms';
import * as moment from 'moment';
import { QuestionariesService } from 'src/app/core/services/questionaries.service';
import { NotificationService } from 'src/app/core/services/notification.service';
import { Error, Questionaries, Quotation } from 'src/app/shared/enums/messages';
import { QuotationService } from 'src/app/core/services/quotation.service';
import { HttpStatusCodes } from 'src/app/shared/enums/httpStatus';
import { MatDialog } from '@angular/material/dialog';
import { SendQuestionairesComponent } from 'src/app/shared/components/send-questionaires/send-questionaires.component';
import { actionRules } from 'src/app/shared/enums/status-action-rules';
import * as _ from 'lodash';
import { DynamicDialogComponent } from 'src/app/shared/dialog/dynamic-dialog/dynamic-dialog.component';
import { dialogActions } from 'src/app/shared/enums/dialogActions';
import { NoopScrollStrategy } from '@angular/cdk/overlay';
import { CompanyProfileService } from 'src/app/core/services/company-profile.service';
import { AuthService } from 'src/app/core/services/auth.service';

@Component({
  selector: 'app-prospect-details',
  templateUrl: './prospect-details.component.html',
  styleUrls: ['./prospect-details.component.css'],
})
export class ProspectDetailsComponent implements OnInit {
  companyInfo: any;
  isSubmitQuotation: boolean = false;
  quotationForm!: FormGroup;
  createCompanyForm!: FormGroup;
  sendQuestionairesAgain: boolean = false;
  questionairesAnswers: any;
  questionaireAnswer: any;
  statusActions: any = statusAction;
  allowUserEnterKeyExpireDate: boolean = false;
  deadlineDate: any;
  accessKeyExpiresIn: any;
  trainingOnlineFee: any = setupTrainingFee.onetimeSetupAndTrainingOnlineFee;
  trainingOnSiteFee: any = setupTrainingFee.onetimeSetupAndTrainingOnsiteFee;
  @ViewChild(MatAccordion) accordion!: MatAccordion;
  constructor(
    private route: ActivatedRoute,
    private _prospectService: ProspectsService,
    private _questionairesService: QuestionariesService,
    private _location: Location,
    private _router: Router,
    private fb: FormBuilder,
    private _ns: NotificationService,
    private _quotationService: QuotationService,
    public dialog: MatDialog,
    private _companyProfile: CompanyProfileService,
    private _authService: AuthService
  ) {
    this.accessKeyExpiresIn = moment(new Date(), "MM-DD-YYYY").add(quotation.Deadline_In_Days, 'days');
    let prospectId: any;
    this.route.params.subscribe((res: any) => {
      this.getProspectDetails(res?.id);
      prospectId = res?.id;
    });
    this.route?.data.subscribe((res) => {
      if (res?.['page'] === statusAction.Submit_Quotation || res?.['page'] === statusAction.Submit_Another_Quotation) {
        this.isSubmitQuotation = true;
        this.makeQuotationForm();
        this.getQuestionaireByProspectId(prospectId);
        if (res?.['page'] === statusAction.Submit_Another_Quotation) {
          this.getQuotationDetailsByProspectId(prospectId);
        }
        this.deadlineDate = moment(new Date(), "MM-DD-YYYY").add(quotation.Deadline_In_Days, 'days');
        this.quotationForm.patchValue({
          deadlineToAcceptInDays: quotation.Deadline_In_Days,
        });
      }
    });
  }

  ngOnInit(): void {
  }

  // Make quotation Form
  makeQuotationForm() {
    this.quotationForm = this.fb.group(
      {
        id: [0],
        prospectId: [0],
        providerModuleFee: [0],
        hcsGroupHomeModuleFee: [0],
        icfGroupHomeModuleFee: [0],
        dayHabModuleFee: [0],
        inHomeDayHabModuleFee: [0],
        medicalDayHabModuleFee: [0],
        hostHomeModuleFee: [0],
        cfcModuleFee: [0],
        multiModuleDiscount: [0],
        specialDiscountName: '',
        specialDiscount: [0],
        discountForSetupAndTraining: [0],
        encryptedEmailAnnualFee: [0],
        quotationCreationDate: [""],
        deadlineToAcceptInDays: [0],
        onlineSetupAndTrainingFee: [0],
        onsiteSetupAndTrainingFee: [0],
        quotationStatus: [0],
        prospectFeedback: [""],
        estimatedMonthlyTotal: [0],
        remoteOnline: false,
        onsiteLocation: false,
        onetimeSetupAndTrainingFee: ''
      }
    );
  }

  // Get particular questionaires details
  getQuestionaireByProspectId(prospectId: any) {
    const questionnaireId = Reset.value;
    const isNew = this.companyInfo?.status?.id < companyStatus.questionaireId ? true : false;
    this._questionairesService.getQuestionaire(prospectId, isNew, questionnaireId).subscribe((res: any) => {
      if (res?.questionnaireId) {
        this.questionaireAnswer = res;
        if (!this.isSubmitQuotation) {
          this.reviseQuestiopnnaire(res);
        }
      }
    }, error => {
      console.log(error);
    })
  }

  // Get all questionaries details
  getAllQuestionaires(prospectId: any) {
    this._questionairesService.getAllQuestionaires(prospectId).subscribe((res: any) => {
      if (res) {
        this.questionairesAnswers = res;
      }
    }, error => {
      console.log(error);
    })
  }

  // Change deadline to accept quotation
  chnageDeadline(days: any) {
    this.deadlineDate = moment(new Date(), "MM-DD-YYYY").add(days, 'days');
    this.quotationForm.patchValue({
      deadlineToAcceptInDays: +days,
    });
  }

  // Calculate training fee
  calculateTrainingFee() {
    this.trainingOnSiteFee = _.subtract(setupTrainingFee.onetimeSetupAndTrainingOnsiteFee, +this.quotationForm.value?.discountForSetupAndTraining);
    this.trainingOnlineFee = _.subtract(setupTrainingFee.onetimeSetupAndTrainingOnlineFee, +this.quotationForm.value?.discountForSetupAndTraining);
  }

  // calculate monthly total
  calculateMonthlyTotal() {
    let monthlyTotal = 0;
    monthlyTotal = _.sum([+this.quotationForm.value.providerModuleFee || 0, +this.quotationForm.value.dayHabModuleFee || 0,
    +this.quotationForm.value.hcsGroupHomeModuleFee || 0, +this.quotationForm.value.icfGroupHomeModuleFee || 0,
    +this.quotationForm.value.inHomeDayHabModuleFee || 0, +this.quotationForm.value.cfcModuleFee || 0,
    +this.quotationForm.value.medicalDayHabModuleFee || 0, +this.quotationForm.value.hostHomeModuleFee || 0,
    - +this.quotationForm.value.multiModuleDiscount || 0, - +this.quotationForm.value.specialDiscount || 0]) || 0;
    this.quotationForm.patchValue({ estimatedMonthlyTotal: monthlyTotal?.toFixed(2) });
  }

  // Submit Quotation
  submitQuotation() {
    this.quotationForm.value?.onetimeSetupAndTrainingFee &&
      this.setupTrainingFee(this.quotationForm.value?.onetimeSetupAndTrainingFee);
    this.quotationForm.value.prospectId = this.companyInfo?.id;
    this.quotationForm.value.quotationStatus = this.companyInfo?.status?.id;
    this.quotationForm.value.quotationCreationDate = moment().toDate();
    let result = this.convertIntObj(this.quotationForm.value);
    delete result?.onetimeSetupAndTrainingFee;
    // Create new quotation
    if (!this.quotationForm.value.id) {
      this._quotationService.submitQuotation(result).subscribe(res => {
        if (res) {
          this._ns.openSuccessMessage(Quotation.success);
          this._router.navigate([`/dashboard/prospect-details/${this.companyInfo?.id}`]);
        }
      }, error => {
        if (error.status !== HttpStatusCodes.Unauthorized && error.status !== HttpStatusCodes.Ok) {
          this._ns.openErrorMessage(Error.message);
        } else if (error.status === HttpStatusCodes.Ok) {
          this._ns.openSuccessMessage(Quotation.success);
        }
      })
    } else {
      this._quotationService.updateQuotation(result).subscribe(res => {
        if (res) {
          this._ns.openSuccessMessage(Quotation.update_success);
          this._router.navigate([`/dashboard/prospect-details/${this.companyInfo?.id}`]);
        }
      }, error => {
        if (error.status !== HttpStatusCodes.Unauthorized && error.status !== HttpStatusCodes.Ok) {
          this._ns.openErrorMessage(Error.message);
        } else if (error.status === HttpStatusCodes.Ok) {
          this._ns.openSuccessMessage(Quotation.update_success);
          this._router.navigate([`/dashboard/prospect-details/${this.companyInfo?.id}`]);
        }
      })
    }
  }

  // Conver object  values to integer
  convertIntObj(obj: any) {
    Object.keys(obj).forEach((key, index) => {
      if (!['prospectFeedback', 'quotationCreationDate',
        'deadlineToAccept', 'remoteOnline',
        'onsiteLocation', 'specialDiscountName'].includes(key))
        obj[key] = +obj[key];
    });
    return obj;
  }

  // Set up training fee
  setupTrainingFee(value: any) {
    if (setupTrainingFee.remoteOnline == value) {
      this.quotationForm.value.onlineSetupAndTrainingFee = +this.trainingOnlineFee;
      this.quotationForm.value.remoteOnline = true;
      this.quotationForm.value.onsiteLocation = false;
      this.quotationForm.value.onsiteSetupAndTrainingFee = Reset.value;
    } else {
      this.quotationForm.value.onlineSetupAndTrainingFee = Reset.value;
      this.quotationForm.value.remoteOnline = false;
      this.quotationForm.value.onsiteLocation = true;
      this.quotationForm.value.onsiteSetupAndTrainingFee = +this.trainingOnSiteFee;
    }
  }

  // Get quotation details by prospect id
  getQuotationDetailsByProspectId(prospectId: any) {
    this._quotationService.getQuotationByProspect(prospectId).subscribe((res: any) => {
      if (res) {
        this.quotationForm.patchValue(res);
        this.trainingOnlineFee -= this.quotationForm.value.discountForSetupAndTraining;
        this.trainingOnSiteFee -= this.quotationForm.value.discountForSetupAndTraining;
        if (res?.remoteOnline) {
          this.quotationForm.patchValue({ onetimeSetupAndTrainingFee: setupTrainingFee.remoteOnline });
        } else if (res?.onsiteLocation) {
          this.quotationForm.patchValue({ onetimeSetupAndTrainingFee: setupTrainingFee.onsiteLocation });
        }
      }
    }, error => {
      if (error.status !== HttpStatusCodes.Unauthorized && error.status !== HttpStatusCodes.Ok) {
        this._ns.openErrorMessage(_.capitalize(error?.error) || Error.message);
      }
    })
  }

  // Get prospect deatais
  getProspectDetails(id: any) {
    this._prospectService
      .getProspectDetailsById(id)
      .subscribe(
        (response: any) => {
          if (response) {
            this.companyInfo = response;
            this.companyInfo.prospectActivityLog = this.sortActivityLog();
            if (this.companyInfo?.statusId >= companyStatus.questionaireId) {
              this.getAllQuestionaires(this.companyInfo?.id);
            }
            if (this.companyInfo?.status?.description === actionRules.Rule_3.status) {
              this.getLatestCreatedQuestionaires();
            }
          }
        },
        (error) => {
          this._ns.openErrorMessage(Error.message);
        }
      );
  }

  // Get latest created questionaires
  getLatestCreatedQuestionaires() {
    let questionairesActicity: any = [];
    this.companyInfo?.prospectActivityLog?.filter((activity: any) => {
      if (activity?.activity === actionRules?.Rule_3?.status) {
        questionairesActicity.push(activity);
      }
    });
    var mostRecentDate = new Date(Math.max.apply(null, questionairesActicity?.map((e: any) => {
      return new Date(e.activityTimeUtc);
    })));
    var mostRecentObject = questionairesActicity?.filter((e: any) => {
      var d = new Date(e.activityTimeUtc);
      return d.getTime() == mostRecentDate?.getTime();
    })[0];
    const pastTime = new Date(mostRecentObject?.activityTimeUtc);
    const now = new Date();
    const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
    const timeDiffInMs = now.getTime() - pastTime.getTime();
    if (timeDiffInMs > thirtyDaysInMs) {
      this.sendQuestionairesAgain = true;
    }
  }

  // Get action rules
  getActionStatusRules(status: any) {
    return this._prospectService.getActions(status);
  }

  // Status Action
  statusAction(action: any) {
    if (action === statusAction.Enter_Quotation) {
      this._router.navigate([
        `/dashboard/submit-quotation/${this.companyInfo?.id}`,
      ]);
    } else if (action === statusAction.Send_Questionaires || action === statusAction.Send_Questionaires_Again) {
      this.sendQuestionaires(this.companyInfo?.id);
    } else if (action === statusAction.Submit_Another_Quotation) {
      this._router.navigate([
        `/dashboard/update-quotation/${this.companyInfo?.id}`,
      ]);
    } else if (action === statusAction.Revise_Questionnaire_Answers) {
      this.getQuestionaireByProspectId(this.companyInfo?.id);
    } else if (action === statusAction.Send_Reminder) {
      if (this.companyInfo?.status?.description === actionRules.Rule_9.status) {
        this.sendImportProfileDataReminder();
      } else {
        this.sendReminder();
      }
    } else if (action === statusAction.Create_Company_Profile) {
      this.createCompanyProfile();
    } else if (action === statusAction.Send_Access_Key) {
      this.sendAccessKey();
    } else if (action === statusAction.Send_Email_With_New_Access_Key) {
      this.sendEmailWithNewAccessKey();
    }
  }

  // Send Questionaires
  sendQuestionaires(id: any) {
    this._questionairesService.sendQuestionaires(id).subscribe((res: any) => {
      if (res?.prospectStatus || res?.prospectActivityLogs) {
        _.merge(this.companyInfo.prospectActivityLog, res?.prospectActivityLogs);
        _.merge(this.companyInfo.status, res?.prospectStatus);
        this._ns.openSuccessMessage(res?.message);
      } else {
        this._ns.openErrorMessage(res?.message);
      }
    }, error => {
      if (error.status !== HttpStatusCodes.Unauthorized && error.status !== HttpStatusCodes.Ok) {
        this._ns.openErrorMessage(Error.message);
      }
    })
  }

  // Revise Questionnaire
  reviseQuestiopnnaire(questionairesAnswers: any) {
    const dialogRef = this.dialog.open(SendQuestionairesComponent, {
      width: '900px',
      data: { 'questionairesAnswers': questionairesAnswers },
      maxHeight: '75vh',
      scrollStrategy: new NoopScrollStrategy()
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        result.companyId = this.companyInfo?.id;
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
  sendReminder() {
    this._prospectService.sendReminder(this.companyInfo?.id).subscribe(res => {
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
  createCompanyProfile() {
    this._companyProfile.createCompanyProfile(this.companyInfo?.id).subscribe((res: any) => {
      if (res?.prospectStatus || res?.prospectActivityLogs) {
        _.merge(this.companyInfo.prospectActivityLog, res?.prospectActivityLogs);
        _.merge(this.companyInfo.status, res?.prospectStatus);
        this.companyInfo.prospectActivityLog = this.sortActivityLog();
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

  // Send Access Key for Importing Profile Data
  sendAccessKey() {
    this._companyProfile.sendEmailWithAccessKey(
      this.companyInfo?.companyId, this.companyInfo?.id, this._authService.currentUserValue?.userEmail
    ).subscribe(res => {
      console.log(res);
    }, error => {
      console.log(error);
    })
  }

  // Send Email With New Access Key
  sendEmailWithNewAccessKey() {
    this._companyProfile.sendEmailWithAccessKey(
      this.companyInfo?.companyId, this.companyInfo?.id, this._authService.currentUserValue?.userEmail
    ).subscribe(res => {
      console.log(res);
    }, error => {
      console.log(error);
    })
  }

  // Send import profile data reminder
  sendImportProfileDataReminder() {
    this._companyProfile.sendReminder(
      this.companyInfo?.companyId, this.companyInfo?.id, this._authService.currentUserValue?.userEmail
    ).subscribe(res => {
      console.log(res);
    }, error => {
      console.log(error);
    })
  }

  // View content
  viewContent(activity: any) {
    const dialogRef = this.dialog.open(DynamicDialogComponent, {
      width: '600px',
      data: {
        headerText: activity?.contentSubject,
        ...(activity?.fileNames && { buttonIcon: dialogActions.contentView.buttonIcon }),
        action: dialogActions.contentView.action,
        activity: activity
      },
      scrollStrategy: new NoopScrollStrategy()
    });
  }

  // Get office address of comapny
  getOfficeAddress() {
    let officeAddress = this.companyInfo?.address?.find(function (element: any): any {
      if (element?.addressTypeId === Address.Office_Address_Id) {
        return element;
      }
    });
    this.companyInfo['officeAddress'] = officeAddress;
    officeAddress = [officeAddress?.address1, officeAddress?.address2,
    officeAddress?.city, officeAddress?.state, officeAddress?.zip].filter(Boolean).join(", ");
    return officeAddress;
  }

  // Sort prospect activity log
  sortActivityLog() {
    return this.companyInfo?.prospectActivityLog.sort((a: any, b: any) => {
      return <any>new Date(b?.activityTimeUtc) - <any>new Date(a?.activityTimeUtc);
    });
  }

  // Capitalize string
  capitalizeString(string: string) {
    return _.capitalize(string);
  }

  // Back to perevious route
  back() {
    this._location.back();
  }
}
