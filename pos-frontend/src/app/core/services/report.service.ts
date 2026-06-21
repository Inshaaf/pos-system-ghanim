import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { DailyReport, RangeReport, ProductStat, SlowStockItem, CashFlowDay } from '../models/report.model';

@Injectable({ providedIn: 'root' })
export class ReportService {
  private base = `${environment.apiUrl}/reports`;

  constructor(private http: HttpClient) {}

  getDaily(date?: string): Observable<DailyReport> {
    const params: Record<string, string> = date ? { date } : {};
    return this.http.get<any>(`${this.base}/daily`, { params }).pipe(map(r => r.data));
  }

  getRange(from: string, to: string): Observable<RangeReport> {
    return this.http.get<any>(`${this.base}/range`, { params: { from, to } }).pipe(map(r => r.data));
  }

  getProducts(from: string, to: string): Observable<ProductStat[]> {
    return this.http.get<any>(`${this.base}/products`, { params: { from, to } }).pipe(map(r => r.data));
  }

  getSlowStock(days: number = 30): Observable<SlowStockItem[]> {
    return this.http.get<any>(`${this.base}/slow-stock`, { params: { days: days.toString() } }).pipe(map(r => r.data));
  }

  getCashFlow(from: string, to: string): Observable<CashFlowDay[]> {
    return this.http.get<any>(`${this.base}/cash-flow`, { params: { from, to } }).pipe(map(r => r.data));
  }
}
