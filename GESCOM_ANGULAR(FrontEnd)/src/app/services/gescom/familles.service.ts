import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environment';
import { Famille } from '../../interfaces/gescom/famille.model';
import { LaravelPaginatedResponse } from '../../interfaces/gescom/pagination.model';

@Injectable({ providedIn: 'root' })
export class FamillesService {
  private readonly api = `${environment.apiBaseUrl}`;

  constructor(private http: HttpClient) {}

  paginate(params?: { page?: number; per_page?: number; search?: string }): Observable<LaravelPaginatedResponse<Famille>> {
    const httpParams = new HttpParams({ fromObject: { ...params } as any });
    return this.http.get<LaravelPaginatedResponse<Famille>>(`${this.api}/familles`, { params: httpParams });
  }

  all(): Observable<Famille[]> {
    return this.http.get<{ data?: Famille[] } | Famille[]>(`${this.api}/familles`, { params: { per_page: 1000 } as any })
      .pipe(map((res: any) => (Array.isArray(res) ? res : res?.data ?? [])));
  }

  find(id: number): Observable<Famille> {
    return this.http.get<Famille>(`${this.api}/familles/${id}`);
  }

  create(payload: Partial<Famille>): Observable<Famille> {
    return this.http.post<Famille>(`${this.api}/familles`, payload);
  }

  update(id: number, payload: Partial<Famille>): Observable<Famille> {
    return this.http.put<Famille>(`${this.api}/familles/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/familles/${id}`);
  }
}
