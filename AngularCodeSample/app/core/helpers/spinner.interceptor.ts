import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpResponse
} from '@angular/common/http';
import { defer, finalize, NEVER, Observable, share, Subscription, tap } from 'rxjs';
import { NgxSpinnerService } from 'ngx-spinner';

@Injectable()
export class SpinnerInterceptor implements HttpInterceptor {

  private renderer: Renderer2;
  constructor(private spinner: NgxSpinnerService, private rendererFactory: RendererFactory2) {
    this.renderer = rendererFactory.createRenderer(null, null);
  }
  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    const spinnerSubscription: Subscription = this.spinner$.subscribe();
    return next.handle(req).pipe(finalize(() => spinnerSubscription.unsubscribe()));
  }
  private onEnd(): void {
    this.hideLoader();
  }

  private showLoader(): void {
    this.spinner.show();
  }

  private hideLoader(): void {
    this.spinner.hide();
  }

  private readonly spinner$ = defer(() => {
    this.showLoader();
    return NEVER.pipe(
      finalize(() => {
        this.onEnd();
      })
    );
  }).pipe(share());
}
