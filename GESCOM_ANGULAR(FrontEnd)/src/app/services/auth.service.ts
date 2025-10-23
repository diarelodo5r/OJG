import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, finalize } from 'rxjs';
import { UserDto } from './user.service';
import { environment } from '@/environments/environment';

export interface LoginPayload {
  username: string;
  password: string;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  password_confirmation?: string;
}

export interface AuthResponse {
  token: string;
  user: UserDto;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly baseUrl = environment.apiBaseUrl;
  private readonly tokenKey = 'auth_token';
  private readonly userKey = 'auth_user';

  private currentUserSubject = new BehaviorSubject<UserDto | null>(this.readStoredUser());
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {}

  login(payload: LoginPayload): Observable<AuthResponse> {
    // Map to backend expected fields: { nom, mot_de_passe }
    const body = { nom: payload.username, mot_de_passe: payload.password } as any;
    return this.http.post<AuthResponse>(`${this.baseUrl}/auth/login`, body).pipe(
      tap((res) => this.persistAuth(res))
    );
  }

  register(payload: RegisterPayload): Observable<AuthResponse> {
    // Map to backend expected fields: { nom, email, mot_de_passe }
    const body = { nom: (payload as any).name ?? payload.username, email: payload.email, mot_de_passe: payload.password } as any;
    return this.http.post<AuthResponse>(`${this.baseUrl}/auth/register`, body).pipe(
      tap((res) => this.persistAuth(res))
    );
  }

  logout(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/auth/logout`, {}).pipe(
      tap(() => this.clearAuth()),
      finalize(() => this.clearAuth())
    );
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getCurrentUser(): UserDto | null {
    return this.currentUserSubject.value;
  }

  getCurrentUserId(): number | null {
    return this.currentUserSubject.value?.id ?? null;
  }

  private persistAuth(res: AuthResponse) {
    localStorage.setItem(this.tokenKey, res.token);
    localStorage.setItem(this.userKey, JSON.stringify(res.user));
    this.currentUserSubject.next(res.user);
  }

  private clearAuth() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.currentUserSubject.next(null);
  }

  updateStoredUser(user: UserDto) {
    localStorage.setItem(this.userKey, JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  private readStoredUser(): UserDto | null {
    try {
      const raw = localStorage.getItem(this.userKey);
      return raw ? (JSON.parse(raw) as UserDto) : null;
    } catch {
      return null;
    }
  }
}
