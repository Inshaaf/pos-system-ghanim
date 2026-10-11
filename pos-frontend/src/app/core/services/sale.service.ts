import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { CheckoutRequest, HeldSale } from '../models/sale.model';

export interface ManualQuickProduct { id: number; name: string; unitPrice: number; active?: boolean; }

@Injectable({ providedIn: 'root' })
export class SaleCancellationRequestService {
  private base = `${environment.apiUrl}/cancellation-requests`;
  constructor(private http: HttpClient) {}

  request(saleType: 'SALE' | 'QUICK_SALE', saleId: number, reason: string): Observable<any> {
    return this.http.post<any>(this.base, { saleType, saleId, reason }).pipe(map(r => r.data));
  }

  getPending(): Observable<any[]> {
    return this.http.get<any>(this.base).pipe(map(r => r.data));
  }

  approve(id: number): Observable<any> {
    return this.http.patch<any>(`${this.base}/${id}/approve`, {}).pipe(map(r => r.data));
  }

  reject(id: number): Observable<any> {
    return this.http.patch<any>(`${this.base}/${id}/reject`, {}).pipe(map(r => r.data));
  }
}

@Injectable({ providedIn: 'root' })
export class SaleService {
  private base = `${environment.apiUrl}/sales`;

  constructor(private http: HttpClient) {}

  checkout(request: CheckoutRequest): Observable<any> {
    return this.http.post<any>(`${this.base}/checkout`, request).pipe(map(r => r.data));
  }

  getByDate(date: string, salespersonId?: number | null): Observable<any[]> {
    const params: Record<string, string> = { date };
    if (salespersonId != null) params['salespersonId'] = String(salespersonId);
    return this.http.get<any>(this.base, { params }).pipe(map(r => r.data));
  }

  getById(id: number): Observable<any> {
    return this.http.get<any>(`${this.base}/${id}`).pipe(map(r => r.data));
  }

  getCredits(): Observable<any[]> {
    return this.http.get<any>(`${this.base}/credits`).pipe(map(r => r.data));
  }

  recordPayment(id: number, amount: number): Observable<void> {
    return this.http.post<any>(`${this.base}/${id}/pay`, { amount }).pipe(map(() => undefined));
  }

  cancel(id: number, pin: string, reason: string): Observable<void> {
    return this.http.post<any>(`${this.base}/${id}/cancel`, { pin, reason }).pipe(map(() => undefined));
  }
}

@Injectable({ providedIn: 'root' })
export class QuickSaleService {
  private base = `${environment.apiUrl}/quick-sales`;
  constructor(private http: HttpClient) {}

  create(payload: any): Observable<any> {
    return this.http.post<any>(this.base, payload).pipe(map(r => r.data));
  }

  getManualProducts(): Observable<ManualQuickProduct[]> {
    return this.http.get<any>(`${environment.apiUrl}/manual-products`).pipe(map(r => r.data));
  }

  saveManualProduct(product: { name: string; unitPrice: number }): Observable<ManualQuickProduct> {
    return this.http.post<any>(`${environment.apiUrl}/manual-products`, product).pipe(map(r => r.data));
  }

  deleteManualProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/manual-products/${id}`);
  }

  getByDate(date: string, salespersonId?: number | null): Observable<any[]> {
    const params: Record<string, string> = { date };
    if (salespersonId != null) params['salespersonId'] = String(salespersonId);
    return this.http.get<any>(this.base, { params }).pipe(map(r => r.data));
  }

  getById(id: number): Observable<any> {
    return this.http.get<any>(`${this.base}/${id}`).pipe(map(r => r.data));
  }

  recordPayment(id: number, amount: number): Observable<void> {
    return this.http.post<any>(`${this.base}/${id}/pay`, { amount }).pipe(map(() => undefined));
  }

  cancel(id: number, pin: string, reason: string): Observable<void> {
    return this.http.post<any>(`${this.base}/${id}/cancel`, { pin, reason }).pipe(map(() => undefined));
  }
}

@Injectable({ providedIn: 'root' })
export class ReturnService {
  private base = `${environment.apiUrl}/returns`;

  constructor(private http: HttpClient) {}

  processReturn(data: {
    originalSaleId?: number;
    sessionId: number;
    salespersonId?: number;
    returnType: 'CASH_REFUND' | 'EXCHANGE';
    items: { productId: number; quantity: number; unitPrice: number }[];
    reason?: string;
  }): Observable<any> {
    return this.http.post<any>(this.base, data).pipe(map(r => r.data));
  }

  getByDate(date: string): Observable<any[]> {
    return this.http.get<any>(this.base, { params: { date } }).pipe(map(r => r.data));
  }
}

@Injectable({ providedIn: 'root' })
export class HeldSaleService {
  private base = `${environment.apiUrl}/held-sales`;

  constructor(private http: HttpClient) {}

  hold(data: any): Observable<HeldSale> {
    return this.http.post<any>(this.base, data).pipe(map(r => r.data));
  }

  getBySession(sessionId: number): Observable<HeldSale[]> {
    return this.http.get<any>(this.base, { params: { sessionId } }).pipe(map(r => r.data));
  }

  getById(id: number): Observable<HeldSale> {
    return this.http.get<any>(`${this.base}/${id}`).pipe(map(r => r.data));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<any>(`${this.base}/${id}`);
  }
}
