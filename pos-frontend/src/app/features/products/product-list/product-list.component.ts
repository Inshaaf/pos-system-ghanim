import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { ProductService, CategoryService } from '../../../core/services/product.service';
import { Product, Category } from '../../../core/models/product.model';
import { ProductFormComponent } from '../product-form/product-form.component';
import { StockAdjustComponent } from '../stock-adjust/stock-adjust.component';
import { LabelPrintDialogComponent } from '../../pos/components/label-print-dialog/label-print-dialog.component';
import { AuthService } from '../../../core/services/auth.service';
import { StockRequestService, StockRequest } from '../../../core/services/stock.service';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatButtonModule, MatIconModule,
    MatTableModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatDialogModule, MatSnackBarModule, MatTooltipModule, MatChipsModule,
    LabelPrintDialogComponent
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">Products</h1>
          <p class="page-sub">Manage shop inventory</p>
        </div>
        <button mat-flat-button class="primary-btn" (click)="openForm()">
          <mat-icon>add</mat-icon> Add Product
        </button>
      </div>

      <mat-card class="filter-card">
        <div class="filter-row">
          <mat-form-field appearance="outline" class="search-field">
            <mat-label>Search</mat-label>
            <mat-icon matPrefix>search</mat-icon>
            <input matInput [(ngModel)]="search" (ngModelChange)="onSearchChange()" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Category</mat-label>
            <mat-select [(ngModel)]="categoryFilter" (ngModelChange)="applyFilter()">
              <mat-option [value]="null">All</mat-option>
              @for (c of categories; track c.id) {
                <mat-option [value]="c.id">{{ c.name }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
          @if (isOwner) {
            <button class="inactive-toggle" [class.active]="showInactive" (click)="toggleInactive()">
              <mat-icon>{{ showInactive ? 'visibility' : 'visibility_off' }}</mat-icon>
              {{ showInactive ? 'Showing All' : 'Show Inactive' }}
            </button>
          }
        </div>
      </mat-card>

      <!-- Pending stock requests — owner only -->
      @if (isOwner && pendingRequests.length > 0) {
        <mat-card class="requests-card">
          <div class="req-header">
            <div class="req-title"><mat-icon>pending_actions</mat-icon> Pending Stock Requests ({{ pendingRequests.length }})</div>
          </div>
          @for (r of pendingRequests; track r.id) {
            <div class="req-row">
              <div class="req-info">
                <div class="req-product">{{ r.productName }}</div>
                <div class="req-detail">
                  <span>By <strong>{{ r.requestedBy }}</strong></span>
                  <span class="req-sep">·</span>
                  <span>{{ r.currentQty }} → <strong>{{ r.requestedQty }}</strong></span>
                  <span class="req-sep">·</span>
                  <span>{{ r.reason }}</span>
                  @if (r.notes) { <span class="req-sep">·</span><span class="req-notes">{{ r.notes }}</span> }
                </div>
              </div>
              <div class="req-actions">
                <button mat-flat-button class="approve-btn" (click)="approveRequest(r)">
                  <mat-icon>check</mat-icon> Approve
                </button>
                <button mat-stroked-button class="reject-btn" (click)="rejectRequest(r)">
                  <mat-icon>close</mat-icon> Reject
                </button>
              </div>
            </div>
          }
        </mat-card>
      }

      <mat-card>
        <table mat-table [dataSource]="products" [trackBy]="trackById" class="product-table">
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>Product</th>
            <td mat-cell *matCellDef="let p">
              <div class="product-cell">
                @if (p.imageUrl) {
                  <img [src]="p.imageUrl" class="thumb" [alt]="p.name" />
                } @else {
                  <div class="thumb-placeholder"><mat-icon>inventory_2</mat-icon></div>
                }
                <div>
                  <div class="p-name">{{ p.name }}</div>
                  <div class="p-barcode">{{ p.barcode || '' }}</div>
                </div>
              </div>
            </td>
          </ng-container>
          <ng-container matColumnDef="code">
            <th mat-header-cell *matHeaderCellDef>Code</th>
            <td mat-cell *matCellDef="let p">
              @if (p.shopCode) {
                <span class="shop-code-badge">{{ p.shopCode }}</span>
              } @else {
                <span class="no-code">—</span>
              }
            </td>
          </ng-container>
          <ng-container matColumnDef="category">
            <th mat-header-cell *matHeaderCellDef>Category</th>
            <td mat-cell *matCellDef="let p">{{ p.categoryName || '' }}</td>
          </ng-container>
          <ng-container matColumnDef="retail">
            <th mat-header-cell *matHeaderCellDef>Retail</th>
            <td mat-cell *matCellDef="let p">LKR {{ p.retailPrice | number:'1.2-2' }}</td>
          </ng-container>
          <ng-container matColumnDef="wholesale">
            <th mat-header-cell *matHeaderCellDef>Wholesale</th>
            <td mat-cell *matCellDef="let p">LKR {{ p.wholesalePrice | number:'1.2-2' }}</td>
          </ng-container>
          <ng-container matColumnDef="stock">
            <th mat-header-cell *matHeaderCellDef>SHOP Stock</th>
            <td mat-cell *matCellDef="let p">
              <span [class.low]="p.stockQuantity <= p.minStockAlert">
                {{ p.stockQuantity }} {{ p.unit }}
              </span>
            </td>
          </ng-container>
          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Status</th>
            <td mat-cell *matCellDef="let p">
              <span class="status-chip" [class.active]="p.active" [class.inactive]="!p.active">
                {{ p.active ? 'Active' : 'Inactive' }}
              </span>
            </td>
          </ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let p">
              @if (isOwner && p.active) {
                <button mat-icon-button (click)="openForm(p)" matTooltip="Edit">
                  <mat-icon>edit</mat-icon>
                </button>
              }
              @if (p.active) {
                <button mat-icon-button (click)="openStockAdjust(p)" [matTooltip]="isOwner ? 'Adjust Stock' : 'Request Stock Change'">
                  <mat-icon>tune</mat-icon>
                </button>
                <button mat-icon-button (click)="printLabel(p)" matTooltip="Print Label" [disabled]="!p.barcode">
                  <mat-icon>label</mat-icon>
                </button>
              }
              @if (isOwner) {
                @if (p.active) {
                  <button mat-icon-button (click)="confirmDeactivate(p)" matTooltip="Deactivate" class="deactivate-btn">
                    <mat-icon>block</mat-icon>
                  </button>
                } @else {
                  <button mat-icon-button (click)="reactivate(p)" matTooltip="Reactivate" class="reactivate-btn">
                    <mat-icon>check_circle</mat-icon>
                  </button>
                  <button mat-icon-button (click)="confirmDelete(p)" matTooltip="Delete permanently" class="delete-btn">
                    <mat-icon>delete_forever</mat-icon>
                  </button>
                }
              }
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="cols"></tr>
          <tr mat-row *matRowDef="let row; columns: cols;" [class.inactive-row]="!row.active"></tr>
        </table>
        @if (products.length === 0) {
          <div class="empty-state">No products found</div>
        }
      </mat-card>
    </div>
  `,
  styles: [`
    .page-container { padding: 24px; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
    .page-title { font-size: 22px; font-weight: 700; color: #1b3050; }
    .page-sub { color: #6b7280; font-size: 13px; }
    .primary-btn { background: #1b3050 !important; color: #fff !important; }
    .filter-card { margin-bottom: 16px; padding: 16px !important; }
    .filter-row { display: flex; gap: 16px; }
    .search-field { flex: 1; }
    .product-table { width: 100%; }
    .product-cell { display: flex; align-items: center; gap: 12px; }
    .thumb { width: 40px; height: 40px; border-radius: 6px; object-fit: cover; }
    .thumb-placeholder {
      width: 40px; height: 40px; border-radius: 6px; background: #f4f6f9;
      display: flex; align-items: center; justify-content: center; color: #d1d5db;
    }
    .p-name { font-weight: 600; font-size: 14px; color: #1b3050; }
    .p-barcode { font-size: 11px; color: #6b7280; }
    .shop-code-badge { background: #1b3050; color: #fff; font-size: 12px; font-weight: 700; border-radius: 5px; padding: 2px 8px; letter-spacing: 1px; }
    .no-code { color: #ccc; }
    .low { color: #c62828; font-weight: 600; }
    .status-chip {
      padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: 600;
    }
    .active { background: #e8f5e9; color: #2e7d32; }
    .inactive { background: #fdecea; color: #c62828; }
    .empty-state { padding: 40px; text-align: center; color: #6b7280; }
    .inactive-row { opacity: 0.55; background: #fafafa; }
    .inactive-toggle {
      display: flex; align-items: center; gap: 6px; align-self: center;
      padding: 8px 16px; border: 1.5px solid #e2e6ec; border-radius: 8px;
      background: #fff; color: #6b7280; font-size: 13px; font-weight: 600;
      cursor: pointer; font-family: inherit; white-space: nowrap;
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
      &:hover { border-color: #9ca3af; color: #1b3050; }
      &.active { background: #1b3050; color: #fff; border-color: #1b3050; }
    }
    .deactivate-btn { color: #b45309 !important; }
    .reactivate-btn { color: #2e7d32 !important; }
    .delete-btn { color: #c62828 !important; }
    .requests-card { margin-bottom: 16px; padding: 0 !important; overflow: hidden; }
    .req-header { display: flex; align-items: center; padding: 12px 16px; border-bottom: 1px solid #eef0f4; }
    .req-title { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 700; color: #1b3050; }
    .req-title mat-icon { color: #f59e0b; }
    .req-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 10px 16px; border-bottom: 1px solid #f4f6f9; }
    .req-row:last-child { border-bottom: none; }
    .req-product { font-size: 14px; font-weight: 600; color: #1b3050; }
    .req-detail { font-size: 12px; color: #6b7280; display: flex; flex-wrap: wrap; gap: 4px; margin-top: 2px; }
    .req-sep { color: #d1d5db; }
    .req-notes { font-style: italic; }
    .req-actions { display: flex; gap: 8px; flex-shrink: 0; }
    .approve-btn { background: #2e7d32 !important; color: #fff !important; font-size: 12px !important; height: 32px !important; }
    .reject-btn { color: #c62828 !important; border-color: #c62828 !important; font-size: 12px !important; height: 32px !important; }

    @media (max-width: 767px) {
      .page-container { padding: 12px; }
      .page-header { flex-direction: column; gap: 8px; }
      .filter-card { padding: 12px !important; }
      .filter-row { flex-wrap: wrap; gap: 8px; }
      .search-field { min-width: 0; flex: 1 1 100%; }
      .inactive-toggle { align-self: auto; }
      .product-table { font-size: 12px; }
      .thumb { width: 32px; height: 32px; }
      .thumb-placeholder { width: 32px; height: 32px; }
      .p-name { font-size: 12px; }

      /* Hide less critical columns — keep product name, retail price, stock, actions */
      .cdk-column-code,
      .cdk-column-category,
      .cdk-column-wholesale,
      .cdk-column-status { display: none !important; }
    }
  `]
})
export class ProductListComponent implements OnInit {
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private dialog = inject(MatDialog);
  private snack = inject(MatSnackBar);
  private authService = inject(AuthService);
  private stockRequestService = inject(StockRequestService);

  isOwner = this.authService.isOwner();
  allProducts: Product[] = [];
  products: Product[] = [];
  categories: Category[] = [];
  pendingRequests: StockRequest[] = [];
  search = '';
  categoryFilter: number | null = null;
  showInactive = false;
  cols = ['name', 'code', 'category', 'retail', 'wholesale', 'stock', 'status', 'actions'];

  ngOnInit() {
    this.loadProducts();
    this.categoryService.getAll().subscribe(c => this.categories = c);
    if (this.isOwner) this.loadPendingRequests();
  }

  loadPendingRequests() {
    this.stockRequestService.getPending().subscribe(r => this.pendingRequests = r);
  }

  approveRequest(r: StockRequest) {
    this.stockRequestService.approve(r.id).subscribe(() => {
      this.snack.open(`Stock updated for ${r.productName}`, '', { duration: 2500 });
      this.loadPendingRequests();
      this.loadProducts();
    });
  }

  rejectRequest(r: StockRequest) {
    this.stockRequestService.reject(r.id).subscribe(() => {
      this.snack.open(`Request from ${r.requestedBy} rejected`, '', { duration: 2500 });
      this.loadPendingRequests();
    });
  }

  trackById(_: number, p: Product) { return p.id; }

  onSearchChange() { this.applyFilter(); }

  applyFilter() {
    const q = this.search.trim().toLowerCase();
    this.products = this.allProducts.filter(p => {
      const matchCat = !this.categoryFilter || p.categoryId === this.categoryFilter;
      const matchSearch = !q || (
        p.name.toLowerCase().includes(q) ||
        (p.barcode?.toLowerCase().includes(q)) ||
        (p.categoryName?.toLowerCase().includes(q))
      );
      return matchCat && matchSearch;
    });
  }

  loadProducts() {
    this.productService.getAll(undefined, undefined, this.showInactive).subscribe(p => { this.allProducts = p; this.applyFilter(); });
  }

  toggleInactive() {
    this.showInactive = !this.showInactive;
    this.loadProducts();
  }

  openForm(product?: Product) {
    const ref = this.dialog.open(ProductFormComponent, {
      width: '560px',
      data: { product, categories: this.categories }
    });
    ref.afterClosed().subscribe(saved => { if (saved) this.loadProducts(); });
  }

  openStockAdjust(product: Product) {
    const ref = this.dialog.open(StockAdjustComponent, {
      width: '400px',
      data: { product }
    });
    ref.afterClosed().subscribe(done => { if (done) this.loadProducts(); });
  }

  printLabel(product: Product) {
    this.dialog.open(LabelPrintDialogComponent, {
      width: '380px',
      data: {
        productName: product.name,
        labelName: product.labelName,
        barcode: product.barcode,
        shopCode: product.shopCode,
        retailPrice: product.retailPrice
      }
    });
  }

  confirmDeactivate(product: Product) {
    const ref = this.snack.open(`Deactivate "${product.name}"? It will be hidden from POS and sales.`, 'Deactivate', { duration: 5000 });
    ref.onAction().subscribe(() => {
      this.productService.delete(product.id).subscribe(() => {
        this.snack.open('Product deactivated', '', { duration: 2000 });
        this.loadProducts();
      });
    });
  }

  reactivate(product: Product) {
    this.productService.reactivate(product.id).subscribe(() => {
      this.snack.open(`"${product.name}" reactivated`, '', { duration: 2000 });
      this.loadProducts();
    });
  }

  confirmDelete(product: Product) {
    const ref = this.snack.open(`Permanently delete "${product.name}"? This cannot be undone.`, 'Delete', { duration: 6000, panelClass: ['snack-danger'] });
    ref.onAction().subscribe(() => {
      this.productService.hardDelete(product.id).subscribe(() => {
        this.snack.open('Product permanently deleted', '', { duration: 2000 });
        this.loadProducts();
      });
    });
  }
}


