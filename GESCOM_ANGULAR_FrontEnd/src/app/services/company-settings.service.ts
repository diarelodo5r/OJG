import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap, catchError, shareReplay } from 'rxjs/operators';
import { CompanySettings, DEFAULT_COMPANY_SETTINGS } from '../interfaces/company-settings.model';
import { CompanySettingsApiService } from './gescom/company-settings-api.service';

@Injectable({
  providedIn: 'root'
})
export class CompanySettingsService {
  private readonly STORAGE_KEY = 'gescom_company_settings_cache';
  private settingsSubject: BehaviorSubject<CompanySettings>;
  public settings$: Observable<CompanySettings>;
  private isLoaded = false;

  constructor(private apiService: CompanySettingsApiService) {
    // Charger depuis le cache localStorage pour un démarrage rapide
    const cachedSettings = this.loadFromCache();
    this.settingsSubject = new BehaviorSubject<CompanySettings>(cachedSettings);
    this.settings$ = this.settingsSubject.asObservable();
    
    // Charger depuis l'API en arrière-plan
    this.loadFromApi();
  }

  /**
   * Charge les paramètres depuis l'API
   */
  private loadFromApi(): void {
    this.apiService.getSettings().pipe(
      tap(settings => {
        this.settingsSubject.next(settings);
        this.saveToCache(settings);
        this.isLoaded = true;
      }),
      catchError(error => {
        console.warn('Impossible de charger les paramètres depuis l\'API, utilisation du cache', error);
        this.isLoaded = true;
        return of(this.settingsSubject.value);
      })
    ).subscribe();
  }

  /**
   * Recharge les paramètres depuis l'API
   */
  refreshSettings(): Observable<CompanySettings> {
    return this.apiService.getSettings().pipe(
      tap(settings => {
        this.settingsSubject.next(settings);
        this.saveToCache(settings);
      }),
      catchError(error => {
        console.error('Erreur lors du rafraîchissement des paramètres', error);
        return of(this.settingsSubject.value);
      }),
      shareReplay(1)
    );
  }

  /**
   * Récupère les paramètres actuels de l'entreprise
   */
  getSettings(): CompanySettings {
    return this.settingsSubject.value;
  }

  /**
   * Met à jour les paramètres de l'entreprise via l'API
   */
  updateSettings(settings: CompanySettings): Observable<CompanySettings> {
    return this.apiService.saveSettings(settings).pipe(
      tap(updatedSettings => {
        this.settingsSubject.next(updatedSettings);
        this.saveToCache(updatedSettings);
      }),
      catchError(error => {
        console.error('Erreur lors de la sauvegarde des paramètres', error);
        // En cas d'erreur, sauvegarder quand même en cache local
        this.settingsSubject.next(settings);
        this.saveToCache(settings);
        throw error;
      })
    );
  }

  /**
   * Réinitialise les paramètres aux valeurs par défaut
   */
  resetSettings(): Observable<void> {
    return this.apiService.resetSettings().pipe(
      tap(() => {
        this.settingsSubject.next(DEFAULT_COMPANY_SETTINGS);
        this.saveToCache(DEFAULT_COMPANY_SETTINGS);
      }),
      catchError(error => {
        console.error('Erreur lors de la réinitialisation', error);
        // En cas d'erreur, réinitialiser quand même localement
        this.settingsSubject.next(DEFAULT_COMPANY_SETTINGS);
        this.saveToCache(DEFAULT_COMPANY_SETTINGS);
        throw error;
      })
    );
  }

  /**
   * Charge le logo sous forme de Base64 depuis un fichier
   */
  async uploadLogo(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  }

  /**
   * Sauvegarde les paramètres dans le cache localStorage
   */
  private saveToCache(settings: CompanySettings): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du cache:', error);
    }
  }

  /**
   * Charge les paramètres depuis le cache localStorage
   */
  private loadFromCache(): CompanySettings {
    try {
      const cached = localStorage.getItem(this.STORAGE_KEY);
      if (cached) {
        return { ...DEFAULT_COMPANY_SETTINGS, ...JSON.parse(cached) };
      }
    } catch (error) {
      console.error('Erreur lors du chargement du cache:', error);
    }
    return { ...DEFAULT_COMPANY_SETTINGS };
  }
}
