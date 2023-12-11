import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { ProspectsService } from 'src/app/core/services/prospects.service';
import { HubspotService } from 'src/app/core/services/hubspot.service';
import { defaultPagination, defaultSort, Reset } from 'src/app/shared/enums/common';
import { FormBuilder, FormGroup } from '@angular/forms';
import { debounceTime, finalize } from 'rxjs';
import { NotificationService } from 'src/app/core/services/notification.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { Add_Prospect,Error } from 'src/app/shared/enums/messages';
import { HttpStatusCodes } from 'src/app/shared/enums/httpStatus';
import { NoopScrollStrategy } from '@angular/cdk/overlay';
import { DynamicDialogComponent } from 'src/app/shared/dialog/dynamic-dialog/dynamic-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { dialogActions } from 'src/app/shared/enums/dialogActions';

@Component({
  selector: 'app-add-prospect',
  templateUrl: './add-prospect.component.html',
  styleUrls: ['./add-prospect.component.css']
})
export class AddProspectComponent implements OnInit {
  dataSource!: MatTableDataSource<any>;
  companies: any;
  prospectPayload: any;
  addProspectForm!: FormGroup;
  searchFilterForm!: FormGroup;
  primaryHubspotContactId:any;
  companyInfo: any;
  displayedColumns!: string[];
  totalRecords = 0;
  nextPageAfter = 0;
  pageSize:number = 10;
  @ViewChild(MatPaginator, {static: false}) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  constructor(private _router: Router, private _prospectService: ProspectsService, private _location: Location,
    private _hubSpotService: HubspotService, private fb: FormBuilder,private _spinner: NgxSpinnerService,
    private _ns: NotificationService, public dialog: MatDialog) {
    this.dataSource = new MatTableDataSource<any>([]);
  }

  ngOnInit(): void {
    this.displayedColumns = ['companyName', 'domain', 'phoneNumber', 'createdDate', 'owner'];
    this.makeSearchFilterForm();
    this.makeProspectForm();
    this.searchFilterForm.valueChanges.subscribe(res=>{
      this.nextPageAfter = Reset.value;
      if(this.companyInfo){
        delete this.companyInfo;
      }
    })
  }

  // Make search filter form
  makeSearchFilterForm(){
    this.searchFilterForm = this.fb.group({
      name: [''],
      after: [0]
    })
  }

  //Make prospect form
  makeProspectForm() {
    this.addProspectForm = this.fb.group({
      id: [0],
      hubspotId: [""],
      companyName: [""],
      companyOwner: [""],
      timeZoneId: [""],
      description: [""],
      website: [""],
      address1: [""],
      address2: [""],
      city: [""],
      state: [""],
      zip: [""],
      numberOfEmployee: [0],
      statusId: [0],
      paidInitialSetupFee: true,
      initialSetupFeeType: [0],
      initialSetupFee: [0],
      paidInitialSetupFeeDate: [""],
      active: [true]
    })
  }

  // Get campanies by search
  searchFromHubSpot(event: any) {
    const searchPayload = {
      name: this.searchFilterForm.value.name,
      limit: this.pageSize,
      after: this.nextPageAfter || Reset.value
    }
    this._spinner.show();
    this._hubSpotService.getCompaniesFromHubSpot(searchPayload).pipe(finalize(()=>{
      this._spinner.hide();
    })).subscribe((response: any) => {
      if (response?.results) {
        this.companies = response?.results || [];
        this.dataSource = new MatTableDataSource<any>(this.companies);
        this.totalRecords = response?.total;
        this.nextPageAfter = response?.nextPageAfter;
        this.dataSource.sort = this.sort;
      } else {
        this.companies = [];
        this.dataSource = new MatTableDataSource<any>(this.companies);
        this.totalRecords = Reset.value;
        this.nextPageAfter = Reset.value;
        this.paginator.firstPage();
        this.dataSource.sort = this.sort;
      }
    }, error => {
      error?.error?.errors?.name?.[0] && this._ns.openErrorMessage(error?.error?.errors?.name?.[0]);
      console.log(error)
    })
  }

  // Change primary contact
  changePrimaryContact(event:any,hubspotContactId:any){
    this.primaryHubspotContactId = hubspotContactId;
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
      pageNumber: event?.pageIndex ? event?.pageIndex : defaultPagination.pageNumber,
      pageSize: event?.pageSize ? event?.pageSize : defaultPagination.pageSize,
      searchData: event?.searchData ? event?.searchData : '',
    }
    return tableFilters;
  }

  //Back to perevious route
  back() {
    this._location.back()
  }

  // Validate prospect
  validateProspect() {
    this.companyInfo?.contacts?.map((contact:any) => {
      if(contact.hubspotContactId == this.primaryHubspotContactId){
        contact.isPrimary = true;
      }
    })
    let isPrimaryContact = false;
    this.companyInfo?.contacts?.map((contact:any)=>{
      if(contact?.isPrimary){
        isPrimaryContact = true;
      }
    });
    if(!isPrimaryContact){
      this._ns.openErrorMessage(Add_Prospect.primaryContact);
      return
    }
    let selectedContact;
    this.companyInfo?.contacts?.map((contact:any)=>{
      if(contact?.isPrimary){
        selectedContact = contact;
      }
    });
    let isEmail = false;
    if(selectedContact){
      isEmail = selectedContact?.['email'] ? true : false;
    }
    if(!isEmail){
      this._ns.openErrorMessage(Add_Prospect.email);
      return
    }
    if(this.companyInfo?.address1 || this.companyInfo?.city || this.companyInfo?.state){
      this.openWarning();
    }else{
      this.createProspect();
    }
  }

  // Open warning if Address1, state or coty is missing from prospect
  openWarning(){
    const dialogRef = this.dialog.open(DynamicDialogComponent, {
      width: '700px',
      data: {
        headerText: dialogActions.addProspectWarning.headerText,
        buttonText: dialogActions.addProspectWarning.buttonText,
        action: dialogActions.addProspectWarning.action,
      },
      scrollStrategy: new NoopScrollStrategy()
    });

    dialogRef.afterClosed().subscribe((result:any) => {
      if(result){
        this.createProspect();
      }
    });
  }

  // Create prospect
  createProspect(){
    this._prospectService.createProspect(this.companyInfo).subscribe((res: any) => {
      if(res?.data){
        this._ns.openSuccessMessage(res?.message || Add_Prospect.success);
        res?.data?.id && this._router.navigate([`/dashboard/prospect-details/${res?.data?.id}`]);
      }else{
        this._ns.openErrorMessage(res?.message || Add_Prospect.error);
      }
    },error=>{
      if (error.status !== HttpStatusCodes.Unauthorized && error.status !== HttpStatusCodes.Ok) {
        this._ns.openErrorMessage(Error.message);
      }
    })
  }

  //Get company hubspot details
  companyDetails(companyInfo: any) {
    this._spinner.show();
    this._hubSpotService.getCompanyDetails(companyInfo?.hubspotCompanyId).pipe(finalize(()=>{
      this._spinner.hide()
    })).subscribe(res => {
      if (res) {
        this.companyInfo = res;
        document.getElementById('company-details')?.scrollIntoView({ behavior: 'smooth' });
        this.addProspectForm.patchValue(res);
        this.addProspectForm.value.id = Reset.value;
      }else{
      }
    },error=>{
      if (error.status !== HttpStatusCodes.Unauthorized && error.status !== HttpStatusCodes.Ok) {
        this._ns.openErrorMessage(Error.message);
      }
    })
  }

}
