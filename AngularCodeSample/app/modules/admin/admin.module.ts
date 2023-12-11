import { NgModule } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { AdminRoutingModule } from './admin-routing.module';
import { UsersComponent } from './components/users/users.component';
import { MaterialModule } from '../material/material.module';
import { UserDetailsComponent } from './components/user-details/user-details.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { EditUserComponent } from './components/edit-user/edit-user.component';
import { AdminComponent } from './admin.component';
import { ProspectsComponent } from './components/prospects/prospects.component';
import { AddProspectComponent } from './components/add-prospect/add-prospect.component';
import { ProspectDetailsComponent } from './components/prospect-details/prospect-details.component';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@NgModule({
  declarations: [
    UsersComponent,
    UserDetailsComponent,
    EditUserComponent,
    AdminComponent,
    ProspectsComponent,
    AddProspectComponent,
    ProspectDetailsComponent,
  ],
  imports: [
    MaterialModule,
    CommonModule,
    AdminRoutingModule,
    SharedModule,
  ],
  providers:[CurrencyPipe,
    { provide: MAT_DIALOG_DATA, useValue: {} },
    { provide: MatDialogRef, useValue: {} }
  ]
})
export class AdminModule { }
