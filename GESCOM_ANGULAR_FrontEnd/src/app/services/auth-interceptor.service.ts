import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private auth: AuthService, private router: Router) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.auth.getToken();
    if (token) {
      const authReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });
      return next.handle(authReq).pipe(
        catchError((err: HttpErrorResponse) => this.handleAuthError(err))
      );
    }
    return next.handle(req).pipe(
      catchError((err: HttpErrorResponse) => this.handleAuthError(err))
    );
  }

  private handleAuthError(err: HttpErrorResponse): Observable<never> {
    if (err.status === 401 || err.status === 403) {
      // Optional: clear session here if your AuthService exposes a method
      // this.auth.logout?.();
      this.router.navigate(['/authentication/login']);
    }
    return throwError(() => err);
  }
}
