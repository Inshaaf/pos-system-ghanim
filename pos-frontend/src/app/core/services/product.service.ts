import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Category, Product, Salesperson, Supplier, type TempWorker } from '../models/product.model';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private base = `${environment.apiUrl}/products`;

  constructor(private http: HttpClient) {}

  getAll(search?: string, categoryId?: number): Observable<Product[]> {
    let params = new HttpParams();
    if (search) params = params.set('search', search);
    if (categoryId) params = params.set('categoryId', categoryId);
    return this.http.get<any>(this.base, { params }).pipe(map(r => r.data));
  }

  getById(id: number): Observable<Product> {
    return this.http.get<any>(`${this.base}/${id}`).pipe(map(r => r.data));
  }

  getByBarcode(barcode: string): Observable<Product> {
    return this.http.get<any>(`${this.base}/barcode/${barcode}`).pipe(map(r => r.data));
  }

  create(product: any): Observable<Product> {
    return this.http.post<any>(this.base, product).pipe(map(r => r.data));
  }

  update(id: number, product: any): Observable<Product> {
    return this.http.put<any>(`${this.base}/${id}`, product).pipe(map(r => r.data));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<any>(`${this.base}/${id}`);
  }

  uploadImage(file: File): Observable<string> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<any>(`${environment.apiUrl}/upload`, form).pipe(map(r => r.data.url));
  }
}

@Injectable({ providedIn: 'root' })
export class CategoryService {
  constructor(private http: HttpClient) {}

  getAll(): Observable<Category[]> {
    return this.http.get<any>(`${environment.apiUrl}/categories`).pipe(map(r => r.data));
  }

  create(name: string): Observable<Category> {
    return this.http.post<any>(`${environment.apiUrl}/categories`, { name }).pipe(map(r => r.data));
  }
}

@Injectable({ providedIn: 'root' })
export class SupplierService {
  constructor(private http: HttpClient) {}

  getAll(): Observable<Supplier[]> {
    return this.http.get<any>(`${environment.apiUrl}/suppliers`).pipe(map(r => r.data));
  }

  create(supplier: Partial<Supplier>): Observable<Supplier> {
    return this.http.post<any>(`${environment.apiUrl}/suppliers`, supplier).pipe(map(r => r.data));
  }

  update(id: number, supplier: Partial<Supplier>): Observable<Supplier> {
    return this.http.put<any>(`${environment.apiUrl}/suppliers/${id}`, supplier).pipe(map(r => r.data));
  }

  getProducts(supplierId: number): Observable<Product[]> {
    return this.http.get<any>(`${environment.apiUrl}/suppliers/${supplierId}/products`).pipe(map(r => r.data));
  }

  receiveGoods(supplierId: number, items: { productId: number; quantity: number; unitCost: number }[]): Observable<Supplier> {
    return this.http.post<any>(`${environment.apiUrl}/suppliers/${supplierId}/receive`, { items }).pipe(map(r => r.data));
  }
}

@Injectable({ providedIn: 'root' })
export class SalespersonService {
  constructor(private http: HttpClient) {}

  getAll(): Observable<Salesperson[]> {
    return this.http.get<any>(`${environment.apiUrl}/salespersons`).pipe(map(r => r.data));
  }

  create(name: string): Observable<Salesperson> {
    return this.http.post<any>(`${environment.apiUrl}/salespersons`, { name }).pipe(map(r => r.data));
  }

  update(id: number, name: string, active: boolean): Observable<Salesperson> {
    return this.http.put<any>(`${environment.apiUrl}/salespersons/${id}`, { name, active }).pipe(map(r => r.data));
  }
}

@Injectable({ providedIn: 'root' })
export class TempWorkerService {
  constructor(private http: HttpClient) {}

  getAll(): Observable<TempWorker[]> {
    return this.http.get<any>(`${environment.apiUrl}/temp-workers`).pipe(map(r => r.data));
  }

  create(name: string): Observable<TempWorker> {
    return this.http.post<any>(`${environment.apiUrl}/temp-workers`, { name }).pipe(map(r => r.data));
  }

  update(id: number, name: string, active: boolean): Observable<TempWorker> {
    return this.http.put<any>(`${environment.apiUrl}/temp-workers/${id}`, { name, active }).pipe(map(r => r.data));
  }
}
