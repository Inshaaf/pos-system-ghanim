import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ShopSupply, SupplierDelivery, SupplierDeliveryRequest, PriceComparison } from '../models/shop-supply.model';

@Injectable({ providedIn: 'root' })
export class ShopSupplyService {
  private url = `${environment.apiUrl}/shop-supplies`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<ShopSupply[]> {
    return this.http.get<any>(this.url).pipe(map(r => r.data));
  }

  create(item: Partial<ShopSupply>): Observable<ShopSupply> {
    return this.http.post<any>(this.url, item).pipe(map(r => r.data));
  }

  update(id: number, item: Partial<ShopSupply>): Observable<ShopSupply> {
    return this.http.put<any>(`${this.url}/${id}`, item).pipe(map(r => r.data));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<any>(`${this.url}/${id}`).pipe(map(r => r.data));
  }
}

@Injectable({ providedIn: 'root' })
export class SupplierDeliveryService {
  private url = `${environment.apiUrl}/supplier-deliveries`;

  constructor(private http: HttpClient) {}

  create(req: SupplierDeliveryRequest): Observable<SupplierDelivery> {
    return this.http.post<any>(this.url, req).pipe(map(r => r.data));
  }

  getBySupplier(supplierId: number): Observable<SupplierDelivery[]> {
    return this.http.get<any>(this.url, { params: { supplierId } }).pipe(map(r => r.data));
  }

  getPriceComparison(): Observable<PriceComparison[]> {
    return this.http.get<any>(`${this.url}/price-comparison`).pipe(map(r => r.data));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<any>(`${this.url}/${id}`).pipe(map(r => r.data));
  }
}
