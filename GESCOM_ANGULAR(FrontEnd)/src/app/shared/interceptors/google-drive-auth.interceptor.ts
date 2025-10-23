import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, switchMap, filter, take } from 'rxjs/operators';
import { GoogleAuthService } from '../../services/gescom/google-auth.service';

@Injectable()
export class GoogleDriveAuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);

  constructor(private readonly googleAuthService: GoogleAuthService) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Only intercept Google Drive API requests
    if (!this.isGoogleDriveRequest(request)) {
      return next.handle(request);
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          return this.handle401Error(request, next);
        }
        return throwError(() => error);
      })
    );
  }

  private isGoogleDriveRequest(request: HttpRequest<any>): boolean {
    return request.url.includes('googleapis.com/drive') || 
           request.url.includes('googleapis.com/upload/drive');
  }

  private handle401Error(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      return this.refreshToken().pipe(
        switchMap((token: string) => {
          this.isRefreshing = false;
          this.refreshTokenSubject.next(token);
          return next.handle(this.addTokenToRequest(request, token));
        }),
        catchError((err) => {
          this.isRefreshing = false;
          // Token refresh failed, user needs to sign in again
          console.error('Token refresh failed, please sign in again', err);
          return throwError(() => new Error('Session expirée. Veuillez vous reconnecter.'));
        })
      );
    } else {
      // Wait for token refresh to complete
      return this.refreshTokenSubject.pipe(
        filter(token => token !== null),
        take(1),
        switchMap(token => next.handle(this.addTokenToRequest(request, token!)))
      );
    }
  }

  private refreshToken(): Observable<string> {
    return new Observable<string>((observer) => {
      this.googleAuthService.getAccessToken(true)
        .then(token => {
          if (token) {
            observer.next(token);
            observer.complete();
          } else {
            observer.error(new Error('Failed to refresh token'));
          }
        })
        .catch(err => observer.error(err));
    });
  }

  private addTokenToRequest(request: HttpRequest<any>, token: string): HttpRequest<any> {
    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }
}
