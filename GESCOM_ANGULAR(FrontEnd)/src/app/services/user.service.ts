import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { environment } from '../environment';
import { AuthService } from './auth.service';

export interface RoleDto {
  id: number;
  name: string;
}

export interface UserDto {
  id: number;
  username: string;
  email: string;
  balance: number | string;
  photo?: string | null;
  roles?: RoleDto[];
}

export interface ChangePasswordPayload {
  current_password: string;
  password: string;
  password_confirmation: string;
}

// Payload expected by global /change-password route (per backend snippet)
export interface ChangePasswordGlobalPayload {
  current_password: string;
  new_password: string;
  new_password_confirmation?: string;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  // TODO: externalize this baseUrl to environment if available
  private readonly baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient, private auth: AuthService) {}

  getUser(id: number): Observable<UserDto> {
    return this.http.get<UserDto>(`${this.baseUrl}/utilisateurs/${id}`);
  }

  updateUser(id: number, payload: Partial<UserDto>): Observable<UserDto> {
    return this.http.put<UserDto>(`${this.baseUrl}/utilisateurs/${id}`, payload);
  }

  uploadUserPhoto(id: number, file: File): Observable<UserDto> {
    const formData = new FormData();
    formData.append('image', file);
    // Upload temporaire d'abord, puis enregistrement du chemin
    return this.http.post<{ message: string; path: string; filename: string }>(
      `${this.baseUrl}/upload/temp/utilisateur`,
      formData
    ).pipe(
      switchMap((tempResult) => {
        // Enregistrer le chemin en base de données
        return this.http.post<{ message: string; path: string }>(
          `${this.baseUrl}/utilisateurs/${id}/photo`,
          { path: tempResult.path }
        ).pipe(
          switchMap(() => this.getUser(id))
        );
      })
    );
  }

  changePassword(id: number, payload: ChangePasswordPayload): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/utilisateurs/${id}/password`, payload);
  }

  /**
   * Change password using the global endpoint with Bearer token
   * Route: POST /change-password
   */
  changePasswordGlobal(payload: ChangePasswordGlobalPayload): Observable<{ message: string }> {
    const headers = this.buildAuthHeaders();
    return this.http.post<{ message: string }>(`${this.baseUrl}/change-password`, payload, { headers });
  }

  getUserPhotoBlob(id: number) {
    return this.http.get(`${this.baseUrl}/utilisateurs/${id}/photo`, { responseType: 'blob' });
  }

  private buildAuthHeaders(): HttpHeaders {
    let headers = new HttpHeaders({ 'Accept': 'application/json' });
    const token = this.auth.getToken();
    if (token) headers = headers.set('Authorization', `Bearer ${token}`);
    return headers;
  }
}
