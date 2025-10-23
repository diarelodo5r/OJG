import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environment';
import { Client } from '../../interfaces/gescom/client.model';
import { LaravelPaginatedResponse } from '../../interfaces/gescom/pagination.model';

@Injectable({ providedIn: 'root' })
export class ClientsService {
  private readonly api = `${environment.apiBaseUrl}`;

  constructor(private http: HttpClient) {}

  paginate(params?: { page?: number; per_page?: number; search?: string }): Observable<LaravelPaginatedResponse<Client>> {
    const httpParams = new HttpParams({ fromObject: { ...params } as any });
    return this.http.get<LaravelPaginatedResponse<Client>>(`${this.api}/clients`, { params: httpParams });
  }

  all(): Observable<Client[]> {
    return this.http.get<{ data?: Client[] } | Client[]>(`${this.api}/clients`, { params: { per_page: 1000 } as any })
      .pipe(map((res: any) => (Array.isArray(res) ? res : res?.data ?? [])));
  }

  find(id: number): Observable<Client> {
    return this.http.get<Client>(`${this.api}/clients/${id}`);
  }

  create(payload: Partial<Client>): Observable<Client> {
    return this.http.post<Client>(`${this.api}/clients`, payload);
  }

  update(id: number, payload: Partial<Client>): Observable<Client> {
    return this.http.put<Client>(`${this.api}/clients/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/clients/${id}`);
  }
}
