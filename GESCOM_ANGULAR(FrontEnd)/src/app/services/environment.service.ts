import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { environment } from '@/environments/environment';

interface BackendConfigResponse {
  googleClientId?: string;
  googleApiKey?: string;
  folders?: Record<string, string>;
}

export type EnvironmentLoadState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'loaded' }
  | { status: 'error'; error: unknown };

interface GoogleRuntimeConfig {
  apiKey?: string;
  clientId?: string;
  folders?: Record<string, string>;
}

@Injectable({ providedIn: 'root' })
export class EnvironmentService {
  private runtimeConfig: { google?: GoogleRuntimeConfig } = {};
  private loadPromise?: Promise<void>;
  private readonly loadStateSubject = new BehaviorSubject<EnvironmentLoadState>({ status: 'idle' });

  loadState$: Observable<EnvironmentLoadState> = this.loadStateSubject.asObservable();

  get lastError(): unknown | null {
    const current = this.loadStateSubject.value;
    return current.status === 'error' ? current.error : null;
  }

  constructor(private readonly http: HttpClient) {}

  async loadConfig(): Promise<void> {
    if (this.runtimeConfig.google && !this.loadPromise) {
      return;
    }
    if (this.loadPromise) {
      return this.loadPromise;
    }
    this.loadStateSubject.next({ status: 'loading' });
    const url = `${environment.apiBaseUrl}/config`;
    this.loadPromise = firstValueFrom(this.http.get<BackendConfigResponse>(url))
      .then(response => {
        this.runtimeConfig.google = {
          apiKey: response.googleApiKey,
          clientId: response.googleClientId,
          folders: response.folders ?? {},
        };
        this.loadStateSubject.next({ status: 'loaded' });
      })
      .catch(error => {
        console.warn('Failed to load runtime configuration from backend:', error);
        if (!this.runtimeConfig.google) {
          this.runtimeConfig.google = {};
        }
        this.loadStateSubject.next({ status: 'error', error });
      })
      .finally(() => {
        this.loadPromise = undefined;
      });
    return this.loadPromise;
  }

  getGoogleConfig(): {
    apiKey?: string;
    clientId?: string;
    scopes?: string | string[];
    discoveryDocs?: string[];
    driveApiUrl?: string;
  } {
    const base = environment.google ?? {};
    const runtime = this.runtimeConfig.google ?? {};
    return {
      apiKey: runtime.apiKey ?? base.apiKey,
      clientId: runtime.clientId ?? base.clientId,
      scopes: base.scopes,
      discoveryDocs: base.discoveryDocs,
      driveApiUrl: base.driveApiUrl ?? 'https://www.googleapis.com/drive/v3/files',
    };
  }

  getGoogleFolders(): Record<string, string> {
    const base = environment.google?.folders ?? {};
    const runtime = this.runtimeConfig.google?.folders ?? {};
    return { ...base, ...runtime };
  }
}
