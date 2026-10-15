import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface ProductEditRequest {
  id: number;
  productId: number;
  productName: string;
  currentData: string;
  proposedData: string;
  requestedBy: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewedBy?: string;
  reviewNote?: string;
  requestedAt: string;
  reviewedAt?: string;
}

@Injectable({ providedIn: 'root' })
export class ProductEditRequestService {
  private readonly base = `${environment.apiUrl}/product-edit-requests`;

  constructor(private http: HttpClient) {}

  submit(productId: number, data: Record<string, unknown>): Observable<ProductEditRequest> {
    return this.http.post<any>(`${this.base}/${productId}`, data).pipe(map(response => response.data));
  }

  getPending(): Observable<ProductEditRequest[]> {
    return this.http.get<any>(this.base).pipe(map(response => response.data));
  }

  approve(id: number): Observable<ProductEditRequest> {
    return this.http.patch<any>(`${this.base}/${id}/approve`, {}).pipe(map(response => response.data));
  }

  reject(id: number, reviewNote?: string): Observable<ProductEditRequest> {
    return this.http.patch<any>(`${this.base}/${id}/reject`, { reviewNote }).pipe(map(response => response.data));
  }
}
