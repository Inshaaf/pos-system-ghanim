import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { CashMovement, Session } from '../models/session.model';

@Injectable({ providedIn: 'root' })
export class SessionService {
  private base = `${environment.apiUrl}/sessions`;
  currentSession = signal<Session | null>(null);

  constructor(private http: HttpClient) {}

  loadCurrent(): Observable<Session | null> {
    return this.http.get<any>(`${this.base}/current`).pipe(
      map(r => r.data),
      tap(s => this.currentSession.set(s))
    );
  }

  open(cashierName: string, openingFloat: number): Observable<Session> {
    return this.http.post<any>(`${this.base}/open`, { cashierName, openingFloat }).pipe(
      map(r => r.data),
      tap(s => this.currentSession.set(s))
    );
  }

  close(id: number, closingCash: number, notes?: string): Observable<any> {
    return this.http.post<any>(`${this.base}/${id}/close`, { closingCash, notes }).pipe(
      map(r => r.data),
      tap(() => this.currentSession.set(null))
    );
  }

  // Cashier blind submit — server returns no financial details
  submitCount(id: number, closingCash: number, notes?: string): Observable<string> {
    return this.http.post<any>(`${this.base}/${id}/submit-count`, { closingCash, notes }).pipe(
      map(r => r.message),
      tap(() => this.currentSession.set(null))
    );
  }

  // Owner only
  getAllSessions(): Observable<any[]> {
    return this.http.get<any>(this.base).pipe(map(r => r.data));
  }

  getReconciliation(id: number): Observable<any> {
    return this.http.get<any>(`${this.base}/${id}/reconciliation`).pipe(map(r => r.data));
  }
}

@Injectable({ providedIn: 'root' })
export class CashService {
  private base = `${environment.apiUrl}/cash`;

  constructor(private http: HttpClient) {}

  cashIn(sessionId: number, amount: number, reason: string, notes?: string): Observable<CashMovement> {
    return this.http.post<any>(`${this.base}/in`, { sessionId, amount, reason, notes }).pipe(map(r => r.data));
  }

  cashOut(sessionId: number, amount: number, reason: string, notes?: string): Observable<CashMovement> {
    return this.http.post<any>(`${this.base}/out`, { sessionId, amount, reason, notes }).pipe(map(r => r.data));
  }

  getMovements(sessionId: number): Observable<CashMovement[]> {
    return this.http.get<any>(`${this.base}/movements`, { params: { sessionId } }).pipe(map(r => r.data));
  }
}
