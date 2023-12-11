import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path:'',
    loadChildren:() => import('./modules/auth/auth.module').then(m => m.AuthModule)
  },
  {
    path:'dashboard',
    loadChildren:() => import('./modules/admin/admin.module').then(m => m.AdminModule)
  },
  {
    path:'common',
    loadChildren:() => import('./shared/shared.module').then(m => m.SharedModule)
  },
  { path: '**', redirectTo: '/login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
