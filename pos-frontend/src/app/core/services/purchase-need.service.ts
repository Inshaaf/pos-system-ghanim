import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PurchaseNeed, CreateNeedRequest, NeedStatus } from '../models/purchase-need.model';

@Injectable({ providedIn: 'root' })
export class PurchaseNeedService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/purchase-needs`;

  getAll(search?: string, status?: NeedStatus): Observable<PurchaseNeed[]> {
    let params = new HttpParams();
    if (search) params = params.set('search', search);
    if (status) params = params.set('status', status);
    return this.http.get<PurchaseNeed[]>(this.base, { params });
  }

  create(req: CreateNeedRequest): Observable<PurchaseNeed> {
    return this.http.post<PurchaseNeed>(this.base, req);
  }

  markPurchased(id: number, resolvedBy: string): Observable<PurchaseNeed> {
    return this.http.patch<PurchaseNeed>(`${this.base}/${id}/status`, { status: 'PURCHASED', resolvedBy });
  }

  dismiss(id: number, resolvedBy: string): Observable<PurchaseNeed> {
    return this.http.patch<PurchaseNeed>(`${this.base}/${id}/status`, { status: 'DISMISSED', resolvedBy });
  }

  reRequest(id: number, requestedBy: string): Observable<PurchaseNeed> {
    return this.http.patch<PurchaseNeed>(`${this.base}/${id}/re-request`, { requestedBy });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
