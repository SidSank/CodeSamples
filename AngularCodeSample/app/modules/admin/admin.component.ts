import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class AdminComponent implements OnInit {
  loading!: boolean;
  constructor(private _spinner: NgxSpinnerService) {
    //Check loading
    this._spinner.spinnerObservable.subscribe(res=>{
      this.loading = res?.show;
    })
  }

  ngOnInit(): void {
  }

}
