import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environment';
import { CompanySettings } from '../../interfaces/company-settings.model';

interface ApiResponse<T> {
  message: string;
  data: T;
}

@Injectable({
  providedIn: 'root'
})
export class CompanySettingsApiService {
  private apiUrl = `${environment.apiBaseUrl}/company-settings`;

  constructor(private http: HttpClient) {}

  /**
   * Récupère les paramètres de l'entreprise depuis l'API
   */
  getSettings(): Observable<CompanySettings> {
    return this.http.get<ApiResponse<CompanySettings>>(this.apiUrl).pipe(
      map(response => response.data)
    );
  }

  /**
   * Crée ou met à jour les paramètres de l'entreprise
   */
  saveSettings(settings: CompanySettings): Observable<CompanySettings> {
    return this.http.post<ApiResponse<CompanySettings>>(this.apiUrl, settings).pipe(
      map(response => response.data)
    );
  }

  /**
   * Met à jour un paramètre spécifique par ID
   */
  updateSettings(id: number, settings: Partial<CompanySettings>): Observable<CompanySettings> {
    return this.http.put<ApiResponse<CompanySettings>>(`${this.apiUrl}/${id}`, settings).pipe(
      map(response => response.data)
    );
  }

  /**
   * Supprime les paramètres
   */
  deleteSettings(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Réinitialise les paramètres aux valeurs par défaut
   */
  resetSettings(): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/reset`, {});
  }
}
