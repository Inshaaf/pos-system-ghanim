import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export type UserRole = 'OWNER' | 'CASHIER' | 'SALESPERSON' | 'STORE_PERSON';

export interface AuthUser {
  token: string;
  role: UserRole;
  name: string;
  userId?: number;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'pos_token';
  private readonly USER_KEY = 'pos_user';

  currentUser = signal<AuthUser | null>(this.loadUser());

  constructor(private http: HttpClient, private router: Router) {}

  login(username: string, password: string) {
    return this.http.post<{ success: boolean; data: AuthUser }>(
      `${environment.apiUrl}/auth/login`, { username, password }
    ).pipe(
      tap(res => {
        if (res.success) {
          localStorage.setItem(this.TOKEN_KEY, res.data.token);
          localStorage.setItem(this.USER_KEY, JSON.stringify(res.data));
          this.currentUser.set(res.data);
        }
      })
    );
  }

  logout() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    if (!this.getToken()) return false;
    if (this.isTokenExpired()) {
      this.logout();
      return false;
    }
    return true;
  }

  private isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return Date.now() >= payload.exp * 1000;
    } catch {
      return true;
    }
  }

  isOwner(): boolean     { return this.currentUser()?.role === 'OWNER'; }
  isCashier(): boolean   { return this.currentUser()?.role === 'CASHIER'; }
  isSalesperson(): boolean { return this.currentUser()?.role === 'SALESPERSON'; }
  isStorePerson(): boolean { return this.currentUser()?.role === 'STORE_PERSON'; }

  canAddNeeds(): boolean {
    const r = this.currentUser()?.role;
    return r === 'OWNER' || r === 'SALESPERSON';
  }

  defaultRoute(): string {
    switch (this.currentUser()?.role) {
      case 'SALESPERSON':  return '/needs';
      case 'STORE_PERSON': return '/store-needs';
      default:             return '/pos';
    }
  }

  private loadUser(): AuthUser | null {
    const raw = localStorage.getItem(this.USER_KEY);
    return raw ? JSON.parse(raw) : null;
  }
}
