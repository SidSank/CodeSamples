import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthComponent } from './auth.component';
import { ChangePasswordComponent } from './components/change-password/change-password.component';
import { ForgotPasswordComponent } from './components/forgot-password/forgot-password.component';
import { LoginComponent } from './components/login/login.component';

const routes: Routes = [
  { path: '',  redirectTo: '/login',  pathMatch: 'full'},
  {
    path: '',
    component: AuthComponent,
    children: [
      { path: 'login', component: LoginComponent},
      { path: 'forgot-password', component: ForgotPasswordComponent},
      { path: 'change-password', component: ChangePasswordComponent},
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AuthRoutingModule { }
