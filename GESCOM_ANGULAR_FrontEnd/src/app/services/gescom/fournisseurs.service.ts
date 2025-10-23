import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environment';
import { Fournisseur } from '../../interfaces/gescom/fournisseur.model';
import { LaravelPaginatedResponse } from '../../interfaces/gescom/pagination.model';

@Injectable({ providedIn: 'root' })
export class FournisseursService {
  private readonly api = `${environment.apiBaseUrl}`;

  constructor(private http: HttpClient) {}

  paginate(params?: { page?: number; per_page?: number; search?: string }): Observable<LaravelPaginatedResponse<Fournisseur>> {
    const httpParams = new HttpParams({ fromObject: { ...params } as any });
    return this.http.get<LaravelPaginatedResponse<Fournisseur>>(`${this.api}/fournisseurs`, { params: httpParams });
  }

  all(): Observable<Fournisseur[]> {
    return this.http.get<{ data?: Fournisseur[] } | Fournisseur[]>(`${this.api}/fournisseurs`, { params: { per_page: 1000 } as any })
      .pipe(map((res: any) => (Array.isArray(res) ? res : res?.data ?? [])));
  }

  find(id: number): Observable<Fournisseur> {
    return this.http.get<Fournisseur>(`${this.api}/fournisseurs/${id}`);
  }

  create(payload: Partial<Fournisseur>): Observable<Fournisseur> {
    return this.http.post<any>(`${this.api}/fournisseurs`, payload).pipe(
      map((res: any) => {
        if (res && typeof res === 'object' && 'data' in res && res.data) {
          return res.data as Fournisseur;
        }
        return res as Fournisseur;
      })
    );
  }

  update(id: number, payload: Partial<Fournisseur>): Observable<Fournisseur> {
    return this.http.put<Fournisseur>(`${this.api}/fournisseurs/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/fournisseurs/${id}`);
  }
}
