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
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ProductService, CategoryService, SupplierService } from '../../../core/services/product.service';
import { Product, Category } from '../../../core/models/product.model';
import { ProductFormComponent } from '../product-form/product-form.component';
import { StockAdjustComponent } from '../stock-adjust/stock-adjust.component';
import { LabelPrintDialogComponent } from '../../pos/components/label-print-dialog/label-print-dialog.component';
import { AuthService } from '../../../core/services/auth.service';
import { StockRequestService, StockRequest } from '../../../core/services/stock.service';
import { QuickSaleService, ManualQuickProduct } from '../../../core/services/sale.service';
import { ProductEditRequestService, ProductEditRequest } from '../../../core/services/product-edit-request.service';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatButtonModule, MatIconModule,
    MatTableModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatDialogModule, MatSnackBarModule, MatTooltipModule, MatChipsModule, MatProgressSpinnerModule,
    LabelPrintDialogComponent
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">Products</h1>
          <p class="page-sub">Manage shop inventory <span class="catalog-count">{{ allProducts.length }} product types entered</span></p>
        </div>
        @if (!isOwner || selectedProductsTab === 'stock') {
          <button mat-flat-button class="primary-btn" (click)="openForm()">
            <mat-icon>add</mat-icon> Add Product
          </button>
        }
      </div>

      @if (isOwner) {
        <nav class="products-tabs" aria-label="Product views">
          <button type="button" [class.selected]="selectedProductsTab === 'stock'" [attr.aria-pressed]="selectedProductsTab === 'stock'" (click)="selectedProductsTab = 'stock'">
            <mat-icon>inventory_2</mat-icon> Stock Products <span>{{ allProducts.length }}</span>
          </button>
          <button type="button" [class.selected]="selectedProductsTab === 'quick'" [attr.aria-pressed]="selectedProductsTab === 'quick'" (click)="selectedProductsTab = 'quick'">
            <mat-icon>flash_on</mat-icon> Quick Sale Products <span>{{ manualProducts.length }}</span>
          </button>
        </nav>
      }

      @if (!isOwner || selectedProductsTab === 'stock') {
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
      }

      <!-- Pending stock requests — owner only -->
      @if (isOwner && selectedProductsTab === 'stock' && pendingRequests.length > 0) {
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

      @if (isOwner && selectedProductsTab === 'stock' && pendingProductEdits.length > 0) {
        <mat-card class="requests-card product-edits-card">
          <div class="req-header">
            <div class="req-title"><mat-icon>edit_note</mat-icon> Pending Product Edit Requests ({{ pendingProductEdits.length }})</div>
          </div>
          @for (r of pendingProductEdits; track r.id) {
            <div class="product-edit-request">
              <div class="req-product">{{ r.productName }} <span class="request-product-id">#{{ r.productId }}</span></div>
              <div class="req-detail">Requested by <strong>{{ r.requestedBy }}</strong> · {{ r.requestedAt | date:'dd MMM yyyy, hh:mm a' }}</div>
              <div class="product-edit-diff">
                @for (change of productEditChanges(r); track change.key) {
                  <div class="product-edit-diff-row">
                    <strong>{{ change.label }}</strong><span>{{ change.current }}</span><mat-icon>arrow_forward</mat-icon><span class="proposed-value">{{ change.proposed }}</span>
                  </div>
                }
                @if (productEditChanges(r).length === 0) { <span class="no-product-changes">No differences found in editable fields.</span> }
              </div>
              <div class="req-actions">
                <button mat-flat-button class="approve-btn" (click)="reviewProductEdit(r, true)" [disabled]="reviewingProductEditId === r.id">
                  <mat-icon>check</mat-icon> Approve &amp; Apply
                </button>
                <button mat-stroked-button class="reject-btn" (click)="reviewProductEdit(r, false)" [disabled]="reviewingProductEditId === r.id">
                  <mat-icon>close</mat-icon> Reject
                </button>
              </div>
            </div>
          }
        </mat-card>
      }

      @if (isOwner && selectedProductsTab === 'quick') {
        <mat-card class="quick-products-card">
          <div class="quick-products-header">
            <div class="quick-products-title">
              <span class="quick-products-icon"><mat-icon>flash_on</mat-icon></span>
              <div>
                <h2>Quick Sale products</h2>
                <p>Manage saved items used when selling products outside your stock list.</p>
              </div>
              <span class="quick-products-count">{{ manualProducts.length }}</span>
            </div>
            <button mat-stroked-button type="button" class="add-quick-product" (click)="showManualProductForm = !showManualProductForm">
              <mat-icon>{{ showManualProductForm ? 'close' : 'add' }}</mat-icon>
              {{ showManualProductForm ? 'Close' : 'Add quick product' }}
            </button>
          </div>

          @if (showManualProductForm) {
            <form class="quick-product-form" (ngSubmit)="saveManualProduct()">
              <mat-form-field appearance="outline">
                <mat-label>Product name</mat-label>
                <input matInput name="manualProductName" [(ngModel)]="manualProductName" maxlength="255" required />
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Single item price (LKR)</mat-label>
                <input matInput name="manualProductPrice" type="number" [(ngModel)]="manualProductPrice" min="0.01" step="0.01" required />
              </mat-form-field>
              <button mat-flat-button type="submit" class="primary-btn" [disabled]="savingManualProduct || !manualProductName.trim() || !manualProductPrice || manualProductPrice <= 0">
                @if (savingManualProduct) { <mat-spinner diameter="18"></mat-spinner> } @else { <mat-icon>save</mat-icon> }
                Save product
              </button>
            </form>
          }

          @if (manualProductsLoading) {
            <div class="quick-products-loading"><mat-spinner diameter="22"></mat-spinner> Loading quick sale products…</div>
          } @else if (manualProductsError) {
            <div class="quick-products-empty">Couldn’t load saved quick sale products. <button mat-button type="button" (click)="loadManualProducts()">Try again</button></div>
          } @else if (manualProducts.length === 0) {
            <div class="quick-products-empty">No saved quick sale products yet. Add one here or enter one in Quick Sale.</div>
          } @else {
            <div class="quick-product-list">
              @for (product of manualProducts; track product.id) {
                <div class="quick-product-row">
                  <div class="quick-product-name"><mat-icon>inventory_2</mat-icon><span>{{ product.name }}</span></div>
                  <strong>LKR {{ product.unitPrice | number:'1.2-2' }} <small>each</small></strong>
                  <button mat-icon-button type="button" class="remove-quick-product" [attr.aria-label]="'Remove ' + product.name" matTooltip="Remove from Quick Sale" (click)="confirmRemoveManualProduct(product)">
                    <mat-icon>delete_outline</mat-icon>
                  </button>
                </div>
              }
            </div>
          }
        </mat-card>
      }

      @if (!isOwner || selectedProductsTab === 'stock') {
      <mat-card>
        @if (loadingProducts) {
          <div class="products-loading" role="status" aria-live="polite">
            <div class="loading-message">
              <mat-spinner diameter="28"></mat-spinner>
              <div><strong>Loading products</strong><span>Getting your inventory ready…</span></div>
            </div>
            <div class="skeleton-list" aria-hidden="true">
              @for (row of skeletonRows; track row) {
                <div class="skeleton-row"><i></i><i></i><i></i></div>
              }
            </div>
          </div>
        } @else if (productsLoadError) {
          <div class="products-error" role="alert">
            <mat-icon>cloud_off</mat-icon>
            <strong>Products couldn’t be loaded</strong>
            <span>Check your connection and try again.</span>
            <button mat-stroked-button type="button" (click)="loadProducts()">Try again</button>
          </div>
        } @else {
        <table mat-table [dataSource]="paginatedProducts" [trackBy]="trackById" class="product-table">
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
          @if (isOwner) {
            <ng-container matColumnDef="cost">
              <th mat-header-cell *matHeaderCellDef>Cost price</th>
              <td mat-cell *matCellDef="let p">
                @if (p.costPrice !== null && p.costPrice !== undefined) {
                  LKR {{ p.costPrice | number:'1.2-2' }}
                } @else {
                  <span class="no-code">—</span>
                }
              </td>
            </ng-container>
          }
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
              @if ((isOwner || isCashier) && p.active) {
                <button mat-icon-button (click)="openForm(p)" [matTooltip]="isOwner ? 'Edit' : 'Request product changes'">
                  <mat-icon>{{ isOwner ? 'edit' : 'edit_note' }}</mat-icon>
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

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;" [class.inactive-row]="!row.active"></tr>
        </table>
        @if (products.length === 0) {
          <div class="empty-state">
            <mat-icon>inventory_2</mat-icon>
            <strong>{{ allProducts.length ? 'No matching products' : 'No products yet' }}</strong>
            <span>{{ allProducts.length ? 'Try another search or category.' : 'Add a product to start building your inventory.' }}</span>
            @if (allProducts.length && (search || categoryFilter !== null)) {
              <button mat-stroked-button type="button" (click)="clearFilters()">Clear filters</button>
            }
          </div>
        }
        @if (products.length > 0) {
          <div class="pagination-bar">
            <span class="pagination-range">Showing {{ firstVisibleProduct }}–{{ lastVisibleProduct }} of {{ products.length }} products</span>
            <div class="pagination-controls">
              <label class="page-size-label">Rows
                <select [(ngModel)]="pageSize" (ngModelChange)="pageIndex = 0" aria-label="Products per page">
                  <option [ngValue]="10">10</option>
                  <option [ngValue]="25">25</option>
                  <option [ngValue]="50">50</option>
                  <option [ngValue]="100">100</option>
                </select>
              </label>
              <button type="button" class="page-btn" (click)="previousPage()" [disabled]="pageIndex === 0" aria-label="Previous page">
                <mat-icon>chevron_left</mat-icon>
              </button>
              <span class="page-number">Page {{ pageIndex + 1 }} of {{ pageCount }}</span>
              <button type="button" class="page-btn" (click)="nextPage()" [disabled]="pageIndex + 1 >= pageCount" aria-label="Next page">
                <mat-icon>chevron_right</mat-icon>
              </button>
            </div>
          </div>
        }
        }
      </mat-card>
      }
    </div>
  `,
  styles: [`
    .page-container { padding: 24px; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
    .page-title { font-size: 22px; font-weight: 700; color: #1b3050; }
    .page-sub { color: #6b7280; font-size: 13px; }
    .catalog-count { display:inline-flex; align-items:center; margin-left:8px; padding:3px 8px; border-radius:12px; background:#eef4fb; color:#385976; font-size:11px; font-weight:650; white-space:nowrap; }
    .products-tabs { display:flex; gap:6px; margin:0 0 16px; padding:0 4px; border-bottom:1px solid #dfe6ee; }
    .products-tabs button { display:flex; align-items:center; gap:8px; padding:11px 15px; border:0; border-bottom:3px solid transparent; margin-bottom:-1px; background:transparent; color:#748195; font:inherit; font-size:13px; font-weight:650; cursor:pointer; transition:color .15s,border-color .15s; }
    .products-tabs button:hover { color:#1b3050; }
    .products-tabs button.selected { border-bottom-color:#1b4c7e; color:#1b3050; }
    .products-tabs mat-icon { width:18px; height:18px; font-size:18px; }
    .products-tabs span { min-width:20px; padding:2px 6px; border-radius:10px; background:#eef2f7; color:#65758a; font-size:10px; text-align:center; }
    .products-tabs button.selected span { background:#e4eef8; color:#1b4c7e; }
    .primary-btn { background: #1b3050 !important; color: #fff !important; }
    .filter-card { margin-bottom: 16px; padding: 16px !important; }
    .filter-row { display: flex; gap: 16px; }
    .search-field { flex: 1; }
    .product-table { width: 100%; }
    .quick-products-card { margin-bottom:16px; padding:0 !important; overflow:hidden; }
    .quick-products-header { display:flex; align-items:center; justify-content:space-between; gap:16px; padding:16px 18px; border-bottom:1px solid #edf0f4; }
    .quick-products-title { display:flex; align-items:center; gap:12px; min-width:0; }
    .quick-products-icon { display:grid; place-items:center; width:40px; height:40px; border-radius:11px; background:#eef5fc; color:#1b4c7e; flex:none; }
    .quick-products-icon mat-icon { font-size:21px; width:21px; height:21px; }
    .quick-products-title h2 { margin:0; color:#1b3050; font-size:15px; font-weight:700; }
    .quick-products-title p { margin:3px 0 0; color:#8995a3; font-size:12px; }
    .quick-products-count { display:grid; place-items:center; min-width:26px; height:24px; padding:0 7px; border-radius:12px; background:#f1f5f9; color:#506176; font-size:11px; font-weight:700; }
    .add-quick-product { color:#1b4c7e !important; border-color:#cbd8e5 !important; flex:none; }
    .add-quick-product mat-icon { font-size:18px; width:18px; height:18px; vertical-align:middle; }
    .quick-product-form { display:flex; align-items:center; gap:12px; padding:14px 18px 4px; background:#f9fbfd; border-bottom:1px solid #edf0f4; }
    .quick-product-form mat-form-field { flex:1; min-width:150px; }
    .quick-product-form button { flex:none; margin-bottom:18px; display:flex; align-items:center; gap:6px; }
    .quick-products-loading { display:flex; align-items:center; justify-content:center; gap:10px; padding:22px; color:#748195; font-size:12px; }
    .quick-products-empty { display:flex; align-items:center; justify-content:center; gap:6px; padding:22px; color:#8995a3; font-size:12px; text-align:center; }
    .quick-product-list { padding:4px 18px; }
    .quick-product-row { display:flex; align-items:center; gap:12px; min-height:48px; border-bottom:1px solid #f0f2f5; }
    .quick-product-row:last-child { border-bottom:0; }
    .quick-product-name { display:flex; align-items:center; flex:1; gap:9px; min-width:0; color:#344a63; font-size:13px; font-weight:600; }
    .quick-product-name mat-icon { color:#91a0b1; font-size:18px; width:18px; height:18px; flex:none; }
    .quick-product-name span { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .quick-product-row strong { color:#1b3050; font-size:13px; white-space:nowrap; }
    .quick-product-row strong small { color:#8995a3; font-size:10px; font-weight:500; }
    .remove-quick-product { color:#b45309; flex:none; }
    .products-loading { padding:20px 16px 12px; }
    .loading-message { display:flex; align-items:center; justify-content:center; gap:12px; padding:20px 12px 24px; color:#1b3050; }
    .loading-message div { display:flex; flex-direction:column; gap:3px; }
    .loading-message strong { font-size:14px; font-weight:700; }
    .loading-message span { color:#8995a3; font-size:12px; }
    .skeleton-list { display:flex; flex-direction:column; gap:10px; }
    .skeleton-row { display:grid; grid-template-columns:minmax(180px, 2fr) minmax(80px, 1fr) minmax(80px, 1fr); gap:14px; padding:12px 8px; border-top:1px solid #f0f2f5; }
    .skeleton-row i { height:13px; border-radius:7px; background:linear-gradient(90deg,#f0f3f7 25%,#e5eaf0 38%,#f0f3f7 60%); background-size:400% 100%; animation:product-shimmer 1.35s ease infinite; }
    .skeleton-row i:first-child { max-width:72%; }
    .skeleton-row i:last-child { max-width:55%; }
    @keyframes product-shimmer { 0% { background-position:100% 0; } 100% { background-position:0 0; } }
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
    .empty-state { display:flex; flex-direction:column; align-items:center; gap:8px; padding:40px 20px; text-align:center; color:#6b7280; }
    .empty-state mat-icon { width:34px; height:34px; font-size:34px; color:#9aa8b8; }
    .empty-state strong { color:#344a63; font-size:15px; }
    .empty-state span { font-size:12px; }
    .empty-state button { margin-top:6px; }
    .products-error { display:flex; flex-direction:column; align-items:center; gap:8px; padding:40px 20px; color:#64758a; text-align:center; }
    .products-error mat-icon { width:34px; height:34px; font-size:34px; color:#d97706; }
    .products-error strong { color:#344a63; font-size:15px; }
    .products-error span { font-size:12px; }
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
    .pagination-bar { display:flex; justify-content:space-between; align-items:center; gap:14px; padding:12px 16px; border-top:1px solid #eef0f4; color:#748195; font-size:12px; }
    .pagination-controls { display:flex; align-items:center; gap:8px; }
    .page-size-label { display:flex; align-items:center; gap:6px; color:#748195; }
    .page-size-label select { height:32px; border:1px solid #d8e0e9; border-radius:6px; padding:0 7px; background:#fff; color:#34445a; font:inherit; }
    .page-btn { display:grid; place-items:center; width:32px; height:32px; border:1px solid #d8e0e9; border-radius:6px; background:#fff; color:#385976; cursor:pointer; }
    .page-btn:disabled { color:#b8c1cc; cursor:default; background:#f8fafc; }
    .page-btn mat-icon { font-size:20px; width:20px; height:20px; }
    .page-number { min-width:78px; text-align:center; color:#506176; }
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
    .product-edit-request { padding: 14px 16px; border-bottom: 1px solid #f4f6f9; }
    .product-edit-request:last-child { border-bottom: none; }
    .request-product-id { color: #8290a0; font-size: 11px; font-weight: 500; }
    .product-edit-diff { display: grid; gap: 5px; margin: 10px 0; }
    .product-edit-diff-row { display: grid; grid-template-columns: minmax(130px, .65fr) minmax(100px, 1fr) 20px minmax(100px, 1fr); align-items: center; gap: 8px; font-size: 12px; }
    .product-edit-diff-row > strong { color: #56677c; }
    .product-edit-diff-row > span { overflow-wrap: anywhere; color: #6b7280; }
    .product-edit-diff-row mat-icon { color: #91a0b2; font-size: 17px; width: 17px; height: 17px; }
    .product-edit-diff-row .proposed-value { color: #1b3050; font-weight: 600; }
    .no-product-changes { color: #6b7280; font-size: 12px; }
    .product-edits-card .req-actions { justify-content: flex-end; }

    @media (max-width: 767px) {
      .page-container { padding: 12px; }
      .page-header { flex-direction: column; gap: 8px; }
      .filter-card { padding: 12px !important; }
      .filter-row { flex-wrap: wrap; gap: 8px; }
      .search-field { min-width: 0; flex: 1 1 100%; }
      .inactive-toggle { align-self: auto; }
      .product-table { font-size: 12px; }
      .pagination-bar { align-items:flex-start; flex-direction:column; }
      .pagination-controls { align-self:flex-end; }
      .thumb { width: 32px; height: 32px; }
      .thumb-placeholder { width: 32px; height: 32px; }
      .p-name { font-size: 12px; }
      .skeleton-row { grid-template-columns:minmax(100px, 2fr) minmax(50px, 1fr); gap:8px; }
      .skeleton-row i:last-child { display:none; }
      .quick-products-header { align-items:flex-start; flex-direction:column; }
      .products-tabs { overflow-x:auto; }
      .products-tabs button { flex:none; padding:10px 9px; font-size:12px; }
      .quick-products-title { align-items:flex-start; }
      .quick-products-title p { max-width:260px; }
      .quick-product-form { align-items:stretch; flex-direction:column; gap:0; padding:14px 16px 4px; }
      .quick-product-form mat-form-field { min-width:0; width:100%; }
      .quick-product-form button { align-self:flex-end; margin:0 0 12px; }
      .quick-product-list { padding:4px 12px; }
      .product-edit-diff-row { grid-template-columns: minmax(86px, .7fr) minmax(75px, 1fr) 16px minmax(75px, 1fr); gap: 4px; font-size: 11px; }
      .quick-product-row { gap:6px; }
      .quick-product-row strong { font-size:11px; }

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
  private supplierService = inject(SupplierService);
  private dialog = inject(MatDialog);
  private snack = inject(MatSnackBar);
  private authService = inject(AuthService);
  private stockRequestService = inject(StockRequestService);
  private quickSaleService = inject(QuickSaleService);
  private productEditRequestService = inject(ProductEditRequestService);

  isOwner = this.authService.isOwner();
  isCashier = this.authService.isCashier();
  allProducts: Product[] = [];
  products: Product[] = [];
  loadingProducts = false;
  productsLoadError = false;
  skeletonRows = [1, 2, 3, 4, 5];
  categories: Category[] = [];
  suppliers: Array<{id: number; name: string}> = [];
  pendingRequests: StockRequest[] = [];
  pendingProductEdits: ProductEditRequest[] = [];
  reviewingProductEditId: number | null = null;
  manualProducts: ManualQuickProduct[] = [];
  manualProductsLoading = false;
  manualProductsError = false;
  showManualProductForm = false;
  savingManualProduct = false;
  manualProductName = '';
  manualProductPrice: number | null = null;
  search = '';
  categoryFilter: number | null = null;
  showInactive = false;
  selectedProductsTab: 'stock' | 'quick' = 'stock';
  pageIndex = 0;
  pageSize = 25;
  private readonly baseColumns = ['name', 'code', 'category', 'retail', 'wholesale', 'stock', 'status', 'actions'];
  get displayedColumns(): string[] {
    return this.isOwner
      ? ['name', 'code', 'category', 'retail', 'wholesale', 'cost', 'stock', 'status', 'actions']
      : this.baseColumns;
  }

  get pageCount(): number { return Math.max(1, Math.ceil(this.products.length / this.pageSize)); }
  get firstVisibleProduct(): number { return this.products.length ? this.pageIndex * this.pageSize + 1 : 0; }
  get lastVisibleProduct(): number { return Math.min((this.pageIndex + 1) * this.pageSize, this.products.length); }
  get paginatedProducts(): Product[] {
    const start = this.pageIndex * this.pageSize;
    return this.products.slice(start, start + this.pageSize);
  }

  ngOnInit() {
    this.loadProducts();
    this.categoryService.getAll().subscribe(c => this.categories = c);
    if (this.isOwner) this.supplierService.getAll().subscribe(s => this.suppliers = s ?? []);
    if (this.isOwner) {
      this.loadPendingRequests();
      this.loadPendingProductEdits();
      this.loadManualProducts();
    }
  }

  loadPendingRequests() {
    this.stockRequestService.getPending().subscribe(r => this.pendingRequests = r);
  }

  loadPendingProductEdits() {
    this.productEditRequestService.getPending().subscribe({
      next: requests => this.pendingProductEdits = requests ?? [],
      error: () => this.pendingProductEdits = []
    });
  }

  productEditChanges(request: ProductEditRequest): Array<{key: string; label: string; current: string; proposed: string}> {
    let current: Record<string, unknown>;
    let proposed: Record<string, unknown>;
    try {
      current = JSON.parse(request.currentData);
      proposed = JSON.parse(request.proposedData);
    } catch { return []; }
    const fields: Array<[string, string]> = [
      ['name', 'Name'], ['description', 'Description'], ['categoryId', 'Category'], ['supplierId', 'Supplier'],
      ['retailPrice', 'Retail price'], ['wholesalePrice', 'Wholesale price'], ['onlinePrice', 'Online price'],
      ['costPrice', 'Cost price'], ['shopCode', 'Shop code'], ['labelName', 'Label name'], ['barcode', 'Barcode'],
      ['unit', 'Unit'], ['minWholesaleQty', 'Minimum wholesale quantity'], ['minStockAlert', 'Minimum stock alert'],
      ['productSource', 'Product source'], ['fulfillmentSource', 'Fulfillment source'], ['showInPos', 'Show in POS'],
      ['showOnline', 'Show online'], ['imageUrl', 'Image URL']
    ];
    return fields.flatMap(([key, label]) => {
      const before = this.productEditValue(current[key], key);
      const after = this.productEditValue(proposed[key], key);
      return before === after ? [] : [{ key, label, current: before, proposed: after }];
    });
  }

  private productEditValue(value: unknown, key: string): string {
    if (value === null || value === undefined || value === '') return '—';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (key === 'categoryId') return this.categories.find(category => category.id === Number(value))?.name || String(value);
    if (key === 'supplierId') return this.suppliers.find(supplier => supplier.id === Number(value))?.name || String(value);
    return String(value);
  }

  reviewProductEdit(request: ProductEditRequest, approve: boolean) {
    this.reviewingProductEditId = request.id;
    const review = approve
      ? this.productEditRequestService.approve(request.id)
      : this.productEditRequestService.reject(request.id);
    review.subscribe({
      next: () => {
        this.reviewingProductEditId = null;
        this.snack.open(approve ? `Changes applied to ${request.productName}` : `Edit request for ${request.productName} rejected`, '', { duration: 2500 });
        this.loadPendingProductEdits();
        if (approve) this.loadProducts();
      },
      error: err => {
        this.reviewingProductEditId = null;
        this.snack.open(err.error?.message || 'Could not review product edit request', 'OK', { duration: 3500 });
      }
    });
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
    this.pageIndex = 0;
  }

  loadManualProducts() {
    this.manualProductsLoading = true;
    this.manualProductsError = false;
    this.quickSaleService.getManualProducts().subscribe({
      next: products => {
        this.manualProducts = products ?? [];
        this.manualProductsLoading = false;
      },
      error: () => {
        this.manualProductsLoading = false;
        this.manualProductsError = true;
      }
    });
  }

  saveManualProduct() {
    const name = this.manualProductName.trim();
    const unitPrice = Number(this.manualProductPrice);
    if (!name || !Number.isFinite(unitPrice) || unitPrice <= 0 || this.savingManualProduct) return;

    this.savingManualProduct = true;
    this.quickSaleService.saveManualProduct({ name, unitPrice }).subscribe({
      next: product => {
        this.manualProducts = [...this.manualProducts.filter(item => item.id !== product.id), product]
          .sort((a, b) => a.name.localeCompare(b.name));
        this.manualProductName = '';
        this.manualProductPrice = null;
        this.showManualProductForm = false;
        this.savingManualProduct = false;
        this.snack.open('Quick Sale product saved', '', { duration: 2200 });
      },
      error: () => {
        this.savingManualProduct = false;
        this.snack.open('Could not save Quick Sale product', 'OK', { duration: 3000 });
      }
    });
  }

  confirmRemoveManualProduct(product: ManualQuickProduct) {
    const snack = this.snack.open(`Remove "${product.name}" from Quick Sale?`, 'Remove', { duration: 5000 });
    snack.onAction().subscribe(() => {
      this.quickSaleService.deleteManualProduct(product.id).subscribe({
        next: () => {
          this.manualProducts = this.manualProducts.filter(item => item.id !== product.id);
          this.snack.open('Quick Sale product removed', '', { duration: 2000 });
        },
        error: () => this.snack.open('Could not remove Quick Sale product', 'OK', { duration: 3000 })
      });
    });
  }

  clearFilters() {
    this.search = '';
    this.categoryFilter = null;
    this.applyFilter();
  }

  previousPage() { this.pageIndex = Math.max(0, this.pageIndex - 1); }
  nextPage() { this.pageIndex = Math.min(this.pageCount - 1, this.pageIndex + 1); }

  loadProducts() {
    this.loadingProducts = true;
    this.productsLoadError = false;
    this.productService.getAll(undefined, undefined, this.showInactive).subscribe({
      next: products => {
        this.allProducts = products ?? [];
        this.applyFilter();
        this.loadingProducts = false;
      },
      error: () => {
        this.loadingProducts = false;
        this.productsLoadError = true;
      }
    });
  }

  toggleInactive() {
    this.showInactive = !this.showInactive;
    this.loadProducts();
  }

  openForm(product?: Product) {
    const ref = this.dialog.open(ProductFormComponent, {
      width: '560px',
      data: { product, categories: this.categories, requestMode: !!product && !this.isOwner }
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


