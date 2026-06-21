import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SaleService, ReturnService } from '../../../../core/services/sale.service';
import { ProductService } from '../../../../core/services/product.service';
import { SaleItem } from '../../../../core/models/sale.model';
import { Product } from '../../../../core/models/product.model';

interface ReturnLine {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
}

interface BillLine extends SaleItem {
  selected: boolean;
  returnQty: number;
}

@Component({
  selector: 'app-return-dialog',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatCheckboxModule,
    MatProgressSpinnerModule, MatTabsModule, MatSnackBarModule
  ],
  template: `
    <div class="dlg-header">
      <div class="dlg-title"><mat-icon>assignment_return</mat-icon> Process Return</div>
      <button mat-icon-button mat-dialog-close><mat-icon>close</mat-icon></button>
    </div>

    <mat-tab-group class="return-tabs" [(selectedIndex)]="activeTab">

      <!-- ═══ TAB 1: WITH BILL ═══ -->
      <mat-tab label="With Bill">
        <div class="tab-body">

          <!-- Sale search -->
          <div class="sale-search-row">
            <mat-form-field appearance="outline" class="sale-id-field">
              <mat-label>Sale ID / Invoice #</mat-label>
              <input matInput type="number" [(ngModel)]="saleId" placeholder="Enter sale number" (keydown.enter)="loadSale()">
            </mat-form-field>
            <button mat-flat-button class="load-btn" (click)="loadSale()" [disabled]="!saleId || loadingSale">
              @if (loadingSale) { <mat-spinner diameter="16"></mat-spinner> }
              @if (!loadingSale) { Load }
            </button>
          </div>

          @if (saleError) {
            <div class="err-msg">{{ saleError }}</div>
          }

          @if (loadedSale) {
            <div class="sale-info">
              <span><mat-icon>receipt</mat-icon> Sale #{{ loadedSale.id }}</span>
              <span><mat-icon>calendar_today</mat-icon> {{ loadedSale.createdAt | date:'dd MMM yyyy HH:mm' }}</span>
              @if (loadedSale.customerName) { <span><mat-icon>person</mat-icon> {{ loadedSale.customerName }}</span> }
              <span class="sale-total">Rs {{ loadedSale.total | number:'1.0-0' }}</span>
            </div>

            <div class="items-label">Select items to return:</div>
            @for (line of billLines; track line.id) {
              <div class="bill-line" [class.selected]="line.selected">
                <mat-checkbox [(ngModel)]="line.selected" color="primary"></mat-checkbox>
                <div class="bl-info">
                  <div class="bl-name">{{ line.productName }}</div>
                  <div class="bl-price">Rs {{ line.unitPrice | number:'1.0-0' }} × {{ line.quantity }}</div>
                </div>
                <div class="bl-qty">
                  <mat-form-field appearance="outline" class="qty-field">
                    <mat-label>Qty</mat-label>
                    <input matInput type="number" [(ngModel)]="line.returnQty"
                      min="1" [max]="line.quantity" [disabled]="!line.selected">
                  </mat-form-field>
                </div>
                <div class="bl-total" [class.active]="line.selected">
                  Rs {{ (line.selected ? line.unitPrice * line.returnQty : 0) | number:'1.0-0' }}
                </div>
              </div>
            }

            <div class="refund-row">
              <mat-form-field appearance="outline">
                <mat-label>Return Type</mat-label>
                <mat-select [(ngModel)]="returnType">
                  <mat-option value="CASH_REFUND">Cash Refund</mat-option>
                  <mat-option value="EXCHANGE">Exchange (no cash out)</mat-option>
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline" class="reason-field">
                <mat-label>Reason</mat-label>
                <input matInput [(ngModel)]="reason" placeholder="Defective, wrong item...">
              </mat-form-field>
            </div>

            <div class="total-row">
              <span class="total-label">{{ returnType === 'CASH_REFUND' ? 'Cash to Refund' : 'Exchange Value' }}</span>
              <span class="total-amount">Rs {{ billRefundTotal | number:'1.0-0' }}</span>
            </div>
          }
        </div>
      </mat-tab>

      <!-- ═══ TAB 2: DIRECT RETURN ═══ -->
      <mat-tab label="Direct (No Bill)">
        <div class="tab-body">

          <div class="info-box">
            <mat-icon>info</mat-icon>
            Customer has no bill. Search the product, enter qty and agreed refund price.
          </div>

          <!-- Product search -->
          <mat-form-field appearance="outline" class="full-w">
            <mat-label>Search product</mat-label>
            <mat-icon matPrefix>search</mat-icon>
            <input matInput [(ngModel)]="productSearch" (ngModelChange)="onProductSearch()" placeholder="Type to search...">
          </mat-form-field>

          @if (productSearch && searchResults.length > 0) {
            <div class="search-results">
              @for (p of searchResults; track p.id) {
                <div class="search-result-item" (click)="addDirectLine(p)">
                  <div class="sri-name">{{ p.name }}</div>
                  <div class="sri-price">Rs {{ p.retailPrice | number:'1.0-0' }}</div>
                  <mat-icon class="sri-add">add_circle</mat-icon>
                </div>
              }
            </div>
          }

          @if (directLines.length > 0) {
            <div class="direct-lines-header">
              <span class="dl-col-name">Product</span>
              <span class="dl-col-qty">Qty</span>
              <span class="dl-col-price">Refund Price</span>
              <span class="dl-col-total">Total</span>
              <span></span>
            </div>
            @for (line of directLines; track $index) {
              <div class="direct-line">
                <span class="dl-col-name">{{ line.productName }}</span>
                <div class="dl-col-qty">
                  <mat-form-field appearance="outline" class="mini-field">
                    <input matInput type="number" [(ngModel)]="line.quantity" min="1">
                  </mat-form-field>
                </div>
                <div class="dl-col-price">
                  <mat-form-field appearance="outline" class="mini-field">
                    <input matInput type="number" [(ngModel)]="line.unitPrice" min="0">
                  </mat-form-field>
                </div>
                <span class="dl-col-total">Rs {{ line.quantity * line.unitPrice | number:'1.0-0' }}</span>
                <button mat-icon-button class="del-btn" (click)="removeLine($index)"><mat-icon>close</mat-icon></button>
              </div>
            }

            <div class="refund-row">
              <mat-form-field appearance="outline">
                <mat-label>Return Type</mat-label>
                <mat-select [(ngModel)]="returnType">
                  <mat-option value="CASH_REFUND">Cash Refund</mat-option>
                  <mat-option value="EXCHANGE">Exchange (no cash out)</mat-option>
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline" class="reason-field">
                <mat-label>Reason</mat-label>
                <input matInput [(ngModel)]="reason" placeholder="Defective, wrong item...">
              </mat-form-field>
            </div>

            <div class="total-row">
              <span class="total-label">{{ returnType === 'CASH_REFUND' ? 'Cash to Refund' : 'Exchange Value' }}</span>
              <span class="total-amount">Rs {{ directRefundTotal | number:'1.0-0' }}</span>
            </div>
          }
        </div>
      </mat-tab>

    </mat-tab-group>

    <!-- Actions -->
    <mat-dialog-actions class="dlg-actions">
      <button mat-stroked-button mat-dialog-close [disabled]="loading">Cancel</button>
      <button mat-flat-button class="confirm-btn" (click)="confirm()" [disabled]="loading || !canConfirm">
        @if (loading) { <mat-spinner diameter="16"></mat-spinner> }
        @if (!loading) { <mat-icon>check</mat-icon> }
        Process Return
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dlg-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 14px 20px 10px; border-bottom: 1px solid #eef0f4;
    }
    .dlg-title { display: flex; align-items: center; gap: 8px; font-size: 16px; font-weight: 700; color: #1b3050; }
    .dlg-title mat-icon { color: #f59e0b; }

    .return-tabs { min-width: 560px; }
    .tab-body { padding: 16px 20px; min-height: 200px; }

    .sale-search-row { display: flex; gap: 10px; align-items: flex-start; }
    .sale-id-field { flex: 1; }
    .load-btn { background: #1b3050 !important; color: #fff !important; height: 56px; margin-top: 4px; }

    .sale-info {
      display: flex; flex-wrap: wrap; gap: 14px; align-items: center;
      background: #f0f4f8; border-radius: 8px; padding: 10px 14px; margin-bottom: 14px;
      font-size: 13px; color: #444;
    }
    .sale-info mat-icon { font-size: 15px; width: 15px; height: 15px; vertical-align: middle; margin-right: 3px; }
    .sale-total { font-weight: 700; color: #1b3050; font-size: 15px; margin-left: auto; }
    .items-label { font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; margin-bottom: 8px; }

    .bill-line {
      display: flex; align-items: center; gap: 10px; padding: 8px 10px;
      border: 1px solid #eef0f4; border-radius: 8px; margin-bottom: 6px;
    }
    .bill-line.selected { border-color: #1b3050; background: #f8faff; }
    .bl-info { flex: 1; }
    .bl-name { font-weight: 600; font-size: 13px; }
    .bl-price { font-size: 12px; color: #6b7280; }
    .bl-qty { width: 80px; }
    .bl-total { width: 90px; text-align: right; font-size: 13px; color: #d1d5db; }
    .bl-total.active { color: #1b3050; font-weight: 700; }
    .qty-field { width: 80px; }

    .info-box {
      display: flex; align-items: flex-start; gap: 8px; background: #fff8e1;
      border-radius: 8px; padding: 10px 12px; font-size: 13px; color: #795548; margin-bottom: 14px;
    }
    .info-box mat-icon { font-size: 18px; width: 18px; height: 18px; flex-shrink: 0; }
    .full-w { width: 100%; }

    .search-results {
      border: 1px solid #eef0f4; border-radius: 8px; margin-top: -10px; margin-bottom: 12px;
      max-height: 180px; overflow-y: auto;
    }
    .search-result-item {
      display: flex; align-items: center; gap: 10px; padding: 10px 14px;
      cursor: pointer; border-bottom: 1px solid #f4f6f9;
    }
    .search-result-item:last-child { border-bottom: none; }
    .search-result-item:hover { background: #f8faff; }
    .sri-name { flex: 1; font-size: 14px; font-weight: 500; }
    .sri-price { font-size: 13px; color: #6b7280; }
    .sri-add { color: #1b3050; }

    .direct-lines-header {
      display: grid; grid-template-columns: 1fr 80px 110px 90px 36px;
      gap: 8px; font-size: 11px; font-weight: 600; color: #6b7280;
      text-transform: uppercase; padding: 0 4px 4px;
    }
    .direct-line {
      display: grid; grid-template-columns: 1fr 80px 110px 90px 36px;
      gap: 8px; align-items: center; margin-bottom: -8px;
    }
    .dl-col-name { font-size: 13px; font-weight: 500; }
    .dl-col-total { font-size: 13px; font-weight: 600; color: #1b3050; text-align: right; }
    .mini-field { width: 100%; }
    .del-btn { color: #e53935 !important; }

    .refund-row { display: flex; gap: 12px; margin-top: 16px; }
    .refund-row mat-form-field { min-width: 160px; }
    .reason-field { flex: 1; }

    .total-row {
      display: flex; justify-content: space-between; align-items: center;
      background: #1b3050; border-radius: 8px; padding: 12px 16px; margin-top: 10px; color: #fff;
    }
    .total-label { font-size: 13px; opacity: 0.8; }
    .total-amount { font-size: 22px; font-weight: 700; }

    .err-msg { color: #c62828; font-size: 13px; margin-bottom: 10px; }

    .dlg-actions {
      padding: 12px 20px !important; border-top: 1px solid #eef0f4;
      display: flex; justify-content: flex-end; gap: 10px;
    }
    .confirm-btn { background: #c62828 !important; color: #fff !important; display: flex; align-items: center; gap: 6px; }
  `]
})
export class ReturnDialogComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<ReturnDialogComponent>);
  data = inject<{ sessionId: number; salespersonId: number | null }>(MAT_DIALOG_DATA);
  private saleService = inject(SaleService);
  private returnService = inject(ReturnService);
  private productService = inject(ProductService);
  private snack = inject(MatSnackBar);

  activeTab = 0;
  returnType: 'CASH_REFUND' | 'EXCHANGE' = 'CASH_REFUND';
  reason = '';
  loading = false;

  // With Bill
  saleId: number | null = null;
  loadingSale = false;
  saleError = '';
  loadedSale: any = null;
  billLines: BillLine[] = [];

  // Direct
  productSearch = '';
  allProducts: Product[] = [];
  searchResults: Product[] = [];
  directLines: ReturnLine[] = [];

  ngOnInit() {
    this.productService.getAll().subscribe(p => this.allProducts = p);
  }

  loadSale() {
    if (!this.saleId) return;
    this.loadingSale = true;
    this.saleError = '';
    this.loadedSale = null;
    this.billLines = [];
    this.saleService.getById(this.saleId).subscribe({
      next: sale => {
        this.loadedSale = sale;
        this.billLines = (sale.items || []).map((item: SaleItem) => ({
          ...item,
          selected: false,
          returnQty: item.quantity
        }));
        this.loadingSale = false;
      },
      error: () => {
        this.saleError = `Sale #${this.saleId} not found.`;
        this.loadingSale = false;
      }
    });
  }

  onProductSearch() {
    const q = this.productSearch.trim().toLowerCase();
    this.searchResults = q
      ? this.allProducts.filter(p => p.name.toLowerCase().includes(q) || (p.barcode || '').includes(q)).slice(0, 8)
      : [];
  }

  addDirectLine(product: Product) {
    const existing = this.directLines.find(l => l.productId === product.id);
    if (existing) { existing.quantity++; return; }
    this.directLines.push({ productId: product.id, productName: product.name, quantity: 1, unitPrice: product.retailPrice });
    this.productSearch = '';
    this.searchResults = [];
  }

  removeLine(i: number) {
    this.directLines.splice(i, 1);
  }

  get billRefundTotal(): number {
    return this.billLines
      .filter(l => l.selected)
      .reduce((s, l) => s + l.unitPrice * l.returnQty, 0);
  }

  get directRefundTotal(): number {
    return this.directLines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
  }

  get canConfirm(): boolean {
    if (this.activeTab === 0) {
      return !!this.loadedSale && this.billLines.some(l => l.selected && l.returnQty > 0);
    }
    return this.directLines.length > 0 && this.directLines.every(l => l.quantity > 0 && l.unitPrice >= 0);
  }

  confirm() {
    this.loading = true;
    const payload: any = {
      sessionId: this.data.sessionId,
      salespersonId: this.data.salespersonId || undefined,
      returnType: this.returnType,
      reason: this.reason || undefined
    };

    if (this.activeTab === 0) {
      payload.originalSaleId = this.loadedSale.id;
      payload.items = this.billLines
        .filter(l => l.selected && l.returnQty > 0)
        .map(l => ({ productId: l.productId, quantity: l.returnQty, unitPrice: l.unitPrice }));
    } else {
      payload.items = this.directLines.map(l => ({ productId: l.productId, quantity: l.quantity, unitPrice: l.unitPrice }));
    }

    this.returnService.processReturn(payload).subscribe({
      next: result => {
        this.loading = false;
        const label = this.returnType === 'CASH_REFUND' ? 'Cash refund' : 'Exchange';
        this.snack.open(`${label} processed — Rs ${result.refundAmount | 0}`, '', { duration: 3000 });
        this.dialogRef.close(result);
      },
      error: err => {
        this.loading = false;
        this.snack.open(err?.error?.message || 'Return failed. Try again.', 'OK', { duration: 4000 });
      }
    });
  }
}
