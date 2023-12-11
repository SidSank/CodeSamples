import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from 'src/app/core/gaurd/auth.guard';
import { AdminComponent } from './admin.component';
import { UserDetailsComponent } from './components/user-details/user-details.component';
import { UsersComponent } from './components/users/users.component';
import { ProspectsComponent } from './components/prospects/prospects.component';
import { AddProspectComponent } from './components/add-prospect/add-prospect.component';
import { ProspectDetailsComponent } from './components/prospect-details/prospect-details.component';

const routes: Routes = [
  {
    path:'', redirectTo:'/dashboard/prospects', pathMatch:'full',
  },
  {
    path: '',
    component: AdminComponent,
    children: [
      { path: 'users', component: UsersComponent,canActivate: [AuthGuard] },
      { path: 'user-details/:id', component: UserDetailsComponent,canActivate: [AuthGuard]},
      { path: 'prospects', component: ProspectsComponent,canActivate: [AuthGuard] },
      { path: 'add-prospect', component: AddProspectComponent,canActivate: [AuthGuard] },
      { path: 'prospect-details/:id', component: ProspectDetailsComponent,canActivate: [AuthGuard]},
      { path: 'submit-quotation/:id', component: ProspectDetailsComponent,data: {page: 'Submit Quotation'},
      canActivate: [AuthGuard]},
      { path: 'update-quotation/:id', component: ProspectDetailsComponent,data: {page: 'Submit Another Quotation'},
      canActivate: [AuthGuard]},
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
