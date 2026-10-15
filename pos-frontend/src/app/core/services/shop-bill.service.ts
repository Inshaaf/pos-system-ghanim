import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ShopBill, ShopBillActivity } from '../models/shop-bill.model';

@Injectable({ providedIn: 'root' })
export class ShopBillService {
  private base = `${environment.apiUrl}/shop-bills`;
  constructor(private http: HttpClient) {}

  getAll(): Observable<ShopBill[]> { return this.http.get<any>(this.base).pipe(map(r => r.data)); }
  getPending(): Observable<ShopBill[]> { return this.http.get<any>(`${this.base}/pending`).pipe(map(r => r.data)); }
  getPendingPayments(): Observable<ShopBillActivity[]> { return this.http.get<any>(`${this.base}/payments/pending`).pipe(map(r => r.data)); }
  create(bill: Partial<ShopBill>): Observable<ShopBill> { return this.http.post<any>(this.base, bill).pipe(map(r => r.data)); }
  approve(id: number): Observable<ShopBill> { return this.http.patch<any>(`${this.base}/${id}/approve`, {}).pipe(map(r => r.data)); }
  reject(id: number): Observable<ShopBill> { return this.http.patch<any>(`${this.base}/${id}/reject`, {}).pipe(map(r => r.data)); }
  assign(id: number, salespersonId: number | null): Observable<ShopBill> { return this.http.patch<any>(`${this.base}/${id}/assign`, { salespersonId }).pipe(map(r => r.data)); }
  unassign(id: number, reason?: string, followUpAt?: string, amount?: number, paymentMethod?: 'CASH' | 'CHEQUE'): Observable<ShopBill> {
    return this.http.post<any>(`${this.base}/${id}/unassign`, { reason, followUpAt, amount, paymentMethod }).pipe(map(r => r.data));
  }
  payment(id: number, amount: number, paymentMethod: 'CASH' | 'CHEQUE'): Observable<ShopBillActivity> {
    return this.http.post<any>(`${this.base}/${id}/payments`, { amount, paymentMethod }).pipe(map(r => r.data));
  }
  approvePayment(id: number): Observable<ShopBillActivity> { return this.http.patch<any>(`${this.base}/payments/${id}/approve`, {}).pipe(map(r => r.data)); }
  rejectPayment(id: number, reviewNote?: string): Observable<ShopBillActivity> { return this.http.patch<any>(`${this.base}/payments/${id}/reject`, { reviewNote }).pipe(map(r => r.data)); }
  followUp(id: number, reason: string, followUpAt?: string): Observable<ShopBillActivity> {
    return this.http.post<any>(`${this.base}/${id}/follow-ups`, { reason, followUpAt }).pipe(map(r => r.data));
  }
  activities(id: number): Observable<ShopBillActivity[]> { return this.http.get<any>(`${this.base}/${id}/activities`).pipe(map(r => r.data)); }
  followUps(): Observable<ShopBillActivity[]> { return this.http.get<any>(`${this.base}/follow-ups`).pipe(map(r => r.data)); }
}
