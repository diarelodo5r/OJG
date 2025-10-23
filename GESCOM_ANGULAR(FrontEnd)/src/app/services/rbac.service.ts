import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environment';
import { AuthService } from './auth.service';

export interface PermissionDto {
  id: number;
  name: string;
  description?: string | null;
}

export interface RoleDto {
  id: number;
  name: string;
  permissions?: PermissionDto[];
}

export interface CreatePermissionPayload {
  name: string;
  description?: string | null;
}

export interface CreateRolePayload {
  name: string;
  permission_ids?: number[];
}

@Injectable({ providedIn: 'root' })
export class RbacService {
  private readonly baseUrl = environment.apiBaseUrl;
  constructor(private http: HttpClient, private auth: AuthService) {}

  // Permissions
  listPermissions(): Observable<PermissionDto[]> {
    return this.http.get<PermissionDto[]>(`${this.baseUrl}/permissions`, { headers: this.authHeaders() });
  }
  createPermission(payload: CreatePermissionPayload): Observable<PermissionDto> {
    return this.http.post<PermissionDto>(`${this.baseUrl}/permissions`, payload, { headers: this.authHeaders() });
  }
  updatePermission(id: number, payload: Partial<CreatePermissionPayload>): Observable<PermissionDto> {
    return this.http.put<PermissionDto>(`${this.baseUrl}/permissions/${id}`, payload, { headers: this.authHeaders() });
  }
  deletePermission(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/permissions/${id}`, { headers: this.authHeaders() });
  }

  // Roles
  listRoles(): Observable<RoleDto[]> {
    return this.http.get<RoleDto[]>(`${this.baseUrl}/roles`, { headers: this.authHeaders() });
  }
  createRole(payload: CreateRolePayload): Observable<RoleDto> {
    return this.http.post<RoleDto>(`${this.baseUrl}/roles`, payload, { headers: this.authHeaders() });
  }
  updateRole(id: number, payload: Partial<CreateRolePayload>): Observable<RoleDto> {
    return this.http.put<RoleDto>(`${this.baseUrl}/roles/${id}`, payload, { headers: this.authHeaders() });
  }
  deleteRole(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/roles/${id}`, { headers: this.authHeaders() });
  }

  private authHeaders(): HttpHeaders {
    let headers = new HttpHeaders({ 'Accept': 'application/json' });
    const token = this.auth.getToken();
    if (token) headers = headers.set('Authorization', `Bearer ${token}`);
    return headers;
  }
}
