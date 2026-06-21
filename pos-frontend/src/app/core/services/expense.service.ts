import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Expense, ExpenseRequest } from '../models/expense.model';

@Injectable({ providedIn: 'root' })
export class ExpenseService {
  private url = `${environment.apiUrl}/expenses`;

  constructor(private http: HttpClient) {}

  create(req: ExpenseRequest): Observable<Expense> {
    return this.http.post<any>(this.url, req).pipe(map(r => r.data));
  }

  getByDate(date: string): Observable<Expense[]> {
    return this.http.get<any>(this.url, { params: { date } }).pipe(map(r => r.data));
  }

  getByRange(from: string, to: string): Observable<Expense[]> {
    return this.http.get<any>(`${this.url}/range`, { params: { from, to } }).pipe(map(r => r.data));
  }

  getDailySummary(date: string): Observable<Record<string, number>> {
    return this.http.get<any>(`${this.url}/summary/daily`, { params: { date } }).pipe(map(r => r.data));
  }

  getMonthlySummary(from: string, to: string): Observable<Record<string, number>> {
    return this.http.get<any>(`${this.url}/summary/monthly`, { params: { from, to } }).pipe(map(r => r.data));
  }

  addSupplierBalance(supplierId: number, amount: number): Observable<void> {
    return this.http.post<any>(`${this.url}/supplier-balance/${supplierId}`, { amount }).pipe(map(r => r.data));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<any>(`${this.url}/${id}`).pipe(map(r => r.data));
  }
}
