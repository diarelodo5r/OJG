import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { EnvironmentService } from '@/app/services/environment.service';

declare const google: any;

export interface GoogleAuthStatus {
  isSignedIn: boolean;
  accessToken: string | null;
  profile?: {
    email?: string;
    name?: string;
    avatarUrl?: string;
  };
}

@Injectable({ providedIn: 'root' })
export class GoogleAuthService {
  private initPromise?: Promise<void>;
  private tokenClient: any | null = null;
  private tokenInfo: { accessToken: string; expiresAt: number; scope: string } | null = null;
  private refreshPromise: Promise<string> | null = null;

  private readonly signedInSubject = new BehaviorSubject<boolean>(false);
  private readonly accessTokenSubject = new BehaviorSubject<string | null>(null);
  private readonly statusSubject = new BehaviorSubject<GoogleAuthStatus>({ isSignedIn: false, accessToken: null });

  constructor(
    private readonly zone: NgZone,
    private readonly environmentService: EnvironmentService,
  ) {
    this.environmentServiceInit = this.environmentService.loadConfig();
    this.initClient().catch(err => console.error('Failed to initialize Google client:', err));
  }

  private environmentServiceInit: Promise<void>;

  get isSignedIn$(): Observable<boolean> {
    return this.signedInSubject.asObservable();
  }

  get accessToken$(): Observable<string | null> {
    return this.accessTokenSubject.asObservable();
  }

  get status$(): Observable<GoogleAuthStatus> {
    return this.statusSubject.asObservable();
  }

  async initClient(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise;
    }
    this.initPromise = this.loadAndInitGis();
    return this.initPromise;
  }

  /**
   * Check if the Google client is ready for user interaction
   * Use this to enable/disable sign-in buttons
   */
  isClientReady(): boolean {
    return this.tokenClient !== null;
  }

  private async loadAndInitGis(): Promise<void> {
    await this.environmentServiceInit;
    await this.loadGisScript();
    const config = this.environmentService.getGoogleConfig();
    const clientId = config?.clientId;
    const scopes = config?.scopes;
    if (!clientId) {
      throw new Error('Google Client ID is missing in environment configuration');
    }
    const scope = Array.isArray(scopes) ? scopes.join(' ') : (scopes ?? '');
    this.tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope,
      callback: () => {},
    });
  }

  async ensureSignedIn(forcePrompt = false): Promise<void> {
    // Client MUST be ready - initialized in constructor
    if (!this.tokenClient) {
      throw new Error('Google client not initialized yet. Please wait a moment and try again.');
    }
    
    const hasToken = this.hasValidToken();
    if (hasToken && !forcePrompt) {
      this.updateSigninStatus(true);
      return;
    }
    
    // Call synchronously to preserve user gesture
    await this.requestAccessToken(forcePrompt);
  }

  signIn(): Promise<void> {
    // Client MUST be ready before user clicks - initialized in constructor
    if (!this.tokenClient) {
      throw new Error('Google client not initialized yet. Please wait a moment and try again.');
    }
    
    // Call requestAccessToken SYNCHRONOUSLY to preserve user gesture
    // Do NOT await here - return the promise directly, converting string to void
    return this.requestAccessToken(true).then(() => {});
  }

  async signOut(): Promise<void> {
    await this.initClient();
    const token = this.tokenInfo?.accessToken;
    if (token) {
      try {
        google.accounts.oauth2.revoke(token, () => {});
      } catch {}
    }
    this.zone.run(() => {
      this.tokenInfo = null;
      this.refreshPromise = null;
      this.updateSigninStatus(false);
    });
  }

  async getAccessToken(forceRefresh = false): Promise<string | null> {
    // Ensure client is initialized
    if (!this.tokenClient) {
      await this.initClient();
    }
    
    // If already refreshing, wait for that to complete
    if (this.refreshPromise && !forceRefresh) {
      try {
        return await this.refreshPromise;
      } catch {
        this.refreshPromise = null;
      }
    }
    
    // Check if token is valid with a 5-minute buffer
    if (!forceRefresh && this.hasValidToken(300)) {
      const token = this.tokenInfo!.accessToken;
      if (token !== this.accessTokenSubject.value) {
        this.zone.run(() => this.accessTokenSubject.next(token));
      }
      return token;
    }
    
    // Token is expired or will expire soon, refresh it
    try {
      this.refreshPromise = this.requestAccessToken(false);
      const token = await this.refreshPromise;
      this.refreshPromise = null;
      return token;
    } catch (error) {
      this.refreshPromise = null;
      console.error('Failed to refresh token:', error);
      return null;
    }
  }

  private hasValidToken(bufferSeconds = 60): boolean {
    const now = Date.now();
    const buffer = bufferSeconds * 1000;
    return !!(this.tokenInfo && this.tokenInfo.accessToken && this.tokenInfo.expiresAt > (now + buffer));
  }

  private requestAccessToken(forcePrompt: boolean): Promise<string> {
    if (!this.tokenClient) return Promise.reject(new Error('Token client not initialized'));
    return new Promise<string>((resolve, reject) => {
      this.tokenClient.callback = async (response: any) => {
        if (response?.error) {
          this.zone.run(() => this.updateSigninStatus(false));
          reject(new Error(response.error));
          return;
        }
        const accessToken = response.access_token as string;
        const expiresIn = Number(response.expires_in ?? 3600);
        const scope = String(response.scope ?? '');
        this.zone.run(async () => {
          // Store token with 60-second buffer before actual expiration
          this.tokenInfo = {
            accessToken,
            expiresAt: Date.now() + Math.max(0, expiresIn - 60) * 1000,
            scope,
          };
          this.updateSigninStatus(true);
          if (this.needsProfile(scope)) {
            const profile = await this.fetchUserInfo(accessToken).catch(() => undefined);
            const status = this.statusSubject.value;
            this.statusSubject.next({ ...status, profile });
          }
          resolve(accessToken);
        });
      };
      try {
        this.tokenClient.requestAccessToken({ prompt: forcePrompt ? 'consent' : '' });
      } catch (e) {
        reject(e);
      }
    });
  }

  private needsProfile(scope: string): boolean {
    if (scope) {
      return scope.includes('userinfo.profile') || scope.includes('userinfo.email') || scope.includes('openid');
    }
    const config = this.environmentService.getGoogleConfig();
    const configuredScopes = config?.scopes;
    const scopeString = Array.isArray(configuredScopes)
      ? configuredScopes.join(' ')
      : configuredScopes ?? '';
    return scopeString.includes('userinfo.profile') || scopeString.includes('userinfo.email') || scopeString.includes('openid');
  }

  private async fetchUserInfo(token: string): Promise<GoogleAuthStatus['profile']> {
    const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      return undefined;
    }
    const data = await res.json();
    const profile: GoogleAuthStatus['profile'] = {
      email: data.email,
      name: data.name || data.given_name || data.family_name,
      avatarUrl: data.picture,
    };
    return profile;
  }

  private async loadGisScript(): Promise<void> {
    if ((window as any).google?.accounts?.oauth2) {
      return;
    }
    if (document.getElementById('gsi-client')) {
      await this.waitForScriptLoad('gsi-client');
      return;
    }
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.id = 'gsi-client';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        script.dataset['loaded'] = 'true';
        resolve();
      };
      script.onerror = (error) => reject(error);
      document.body.appendChild(script);
    });
  }

  private waitForScriptLoad(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const existing = document.getElementById(id) as HTMLScriptElement | null;
      if (!existing) {
        reject(new Error(`Script with id ${id} not found`));
        return;
      }
      const readyState = (existing as any).readyState as string | undefined;
      const isLoaded = readyState === 'complete' || existing.dataset['loaded'] === 'true';
      if (isLoaded) {
        resolve();
        return;
      }
      existing.addEventListener('load', () => {
        existing.dataset['loaded'] = 'true';
        resolve();
      }, { once: true });
      existing.addEventListener('error', (err) => reject(err), { once: true });
    });
  }

  private updateSigninStatus(isSignedIn: boolean): void {
    const token = isSignedIn ? this.tokenInfo?.accessToken ?? null : null;
    const profile = isSignedIn ? this.statusSubject.value.profile : undefined;
    this.signedInSubject.next(isSignedIn);
    this.accessTokenSubject.next(token);
    this.statusSubject.next({ isSignedIn, accessToken: token, profile });
  }
}
