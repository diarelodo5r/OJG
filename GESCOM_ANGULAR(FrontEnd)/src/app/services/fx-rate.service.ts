import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, timeout, retry, catchError, throwError } from 'rxjs';

interface ConvertResponse {
  success: boolean;
  result: number;
  info?: { rate: number };
}

@Injectable({ providedIn: 'root' })
export class FxRateService {
  private baseUrl = 'https://api.exchangerate.host';

  constructor(private http: HttpClient) {}

  // Convert a given amount from -> to, server returns the converted result
  convert(from: string, to: string, amount: number): Observable<{ amount: number; rate: number }> {
    const url = `${this.baseUrl}/convert?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&amount=${encodeURIComponent(amount)}`;
    return this.http.get<ConvertResponse>(url).pipe(
      timeout(6000), // 6s timeout
      retry(1),      // retry once on transient errors
      map((res) => {
        if (!res || res.success === false || typeof res.result !== 'number') {
          throw new Error('Conversion API error');
        }
        const rate = res.info?.rate ?? (amount !== 0 ? res.result / amount : 0);
        return { amount: res.result, rate };
      }),
      catchError((err) => {
        return throwError(() => new Error('Service de conversion indisponible pour le moment.'));
      })
    );
  }
}
