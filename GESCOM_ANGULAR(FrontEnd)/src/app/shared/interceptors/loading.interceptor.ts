import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable, defer } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { LoadingService } from '../../shared/services/loading.service';

// Intercepts mutating requests (POST/PUT/PATCH/DELETE)
// to show a global loader while the request is in-flight.
@Injectable()
export class LoadingInterceptor implements HttpInterceptor {
  constructor(private loading: LoadingService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const method = (req.method || '').toUpperCase();
    const noLoader = req.headers.get('x-no-loader') === 'true';
    const customMessage = req.headers.get('x-loader-message') || undefined;

    // Only show loader for GET requests to keep mutations snappy
    const isGet = method === 'GET';
    const shouldShow = !noLoader && isGet;

    if (!shouldShow) {
      return next.handle(req);
    }

    // Provide sensible default message per method
    const message = customMessage ?? 'Chargement...';

    // Debounce: show only if request lasts more than threshold to avoid flicker
    const debounceMs = 75; // time to wait before showing
    const minVisibleMs = 200; // once shown, keep at least this long

    let shown = false;
    let showTimer: any;
    let hideTimer: any;

    const show = () => {
      shown = true;
      this.loading.show(message);
    };
    const hide = () => {
      if (hideTimer) clearTimeout(hideTimer);
      if (shown) {
        // ensure minimum visible time
        hideTimer = setTimeout(() => this.loading.hide(), minVisibleMs);
      }
    };

    // schedule show after debounce
    showTimer = setTimeout(show, debounceMs);

    return defer(() => next.handle(req)).pipe(
      finalize(() => {
        // If never shown yet, cancel show timer; else schedule hide respecting min time
        if (!shown) {
          clearTimeout(showTimer);
        }
        hide();
      })
    );
  }
}
