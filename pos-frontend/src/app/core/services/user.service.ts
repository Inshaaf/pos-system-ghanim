import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface AppUser {
  id: number;
  name: string;
  username: string;
  role: string;
  active: boolean;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private base = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<AppUser[]> {
    return this.http.get<{ data: AppUser[] }>(this.base).pipe(map(r => r.data));
  }

  changePassword(id: number, currentPassword: string | null, newPassword: string): Observable<void> {
    return this.http.patch<void>(`${this.base}/${id}/password`, { currentPassword, newPassword });
  }

  changeUsername(id: number, newUsername: string): Observable<AppUser> {
    return this.http.patch<{ data: AppUser }>(`${this.base}/${id}/username`, { newUsername })
      .pipe(map(r => r.data));
  }
}
