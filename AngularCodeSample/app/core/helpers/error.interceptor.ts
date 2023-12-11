import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';
import { HttpStatusCodes } from 'src/app/shared/enums/httpStatus';
import { MatDialog } from '@angular/material/dialog';
import { DynamicDialogComponent } from 'src/app/shared/dialog/dynamic-dialog/dynamic-dialog.component';
import { dialogActions } from 'src/app/shared/enums/dialogActions';
import { NoopScrollStrategy } from '@angular/cdk/overlay';
import { Error, Token } from 'src/app/shared/enums/messages';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  constructor(private _router: Router, private _authenticateService: AuthService, private _ns: NotificationService,
    public dialog: MatDialog, private _authService: AuthService) { }

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const url = window.location.href;
    const isAdmin = url.split('/')?.includes('dashboard');
    return next.handle(request)
      .pipe(
        catchError((err: HttpErrorResponse) => {
          if ([HttpStatusCodes.Unauthorized].indexOf(err?.status) !== -1) {
            // Modal opens for login again if 401 Unauthorized response returned from api
            if (isAdmin) {
              return this.handle401Error(request, next);
            } else {
              this._ns.openErrorMessage(Token.expire)
            }
          }
          // throwError
          return throwError(err);
        })
      )
  }

  // Login after token expired
  openLoginModal() {
    const dialogRef = this.dialog.open(DynamicDialogComponent, {
      width: '700px',
      data: {
        headerText: dialogActions.logIn.headerText,
        buttonText: dialogActions.logIn.buttonText,
        action: dialogActions.logIn.action
      },
      scrollStrategy: new NoopScrollStrategy()
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this._authenticateService.validate(result).subscribe((response: any) => {
          if (response) {
            this._authService.logOut();
            localStorage.setItem('token', response.token);
            localStorage.setItem('currentUser', JSON.stringify(response));
            this._authService.currentUserSubject.next(response)
            this._authService.isLoggedInSubject.next(true);
            this._ns.openSuccessMessage(Token.update);
          } else {
          }
        }, error => {
          if (error.status !== HttpStatusCodes.Unauthorized && error.status !== HttpStatusCodes.Ok) {
            this._ns.openErrorSnackBar(Error.message);
          }
        })
      }
    });
  }

  private handle401Error(request: HttpRequest<any>, next: HttpHandler) {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      const url = window.location.href;
      const isAdmin = url.split('/')?.includes('dashboard');
      if (this._authenticateService.getToken()) {
        return this._authenticateService.refreshToken().pipe(
          switchMap(() => {
            this.isRefreshing = false;
            return next.handle(request);
          }),
          catchError((error) => {
            this.isRefreshing = false;
            if (isAdmin) {
              this.openLoginModal();
              this._ns.openErrorMessage(Token.expire);
            } else {
              this._ns.openErrorMessage(Token.expire)
            }
            return throwError(() => error);
          })
        );
      }
    }

    return next.handle(request);
  }

}
