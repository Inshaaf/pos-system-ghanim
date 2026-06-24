import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SalespersonService, ProductService } from '../../../../core/services/product.service';
import { QuickSaleService } from '../../../../core/services/sale.service';
import { ReceiptDialogComponent } from '../receipt-dialog/receipt-dialog.component';

interface QsItem {
  name: string;
  quantity: number;
  unitPrice: number;
  productId: number | null;
  fromStock: boolean;
}

@Component({
  selector: 'app-quick-sale-dialog',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatProgressSpinnerModule, MatSnackBarModule
  ],
  template: `
    <div class="qs-wrap">
      <h2 class="qs-title">Quick Sale</h2>

      <div class="qs-body">

        <!-- Salesperson -->
        <mat-form-field appearance="outline" class="full">
          <mat-label>Salesperson *</mat-label>
          <mat-select [(ngModel)]="salespersonId">
            <mat-option *ngFor="let sp of salespersons" [value]="sp.id">{{ sp.name }}</mat-option>
          </mat-select>
        </mat-form-field>

        <!-- POS Stock search -->
        <div class="section-label">Add from POS Stock</div>
        <div class="search-wrap">
          <div class="stock-search">
            <mat-icon class="s-icon">search</mat-icon>
            <input class="s-inp" [(ngModel)]="productQuery" (ngModelChange)="onSearch()"
              placeholder="Search product name or barcode..." />
            <button class="s-clear" *ngIf="productQuery" (click)="clearSearch()">
              <mat-icon>close</mat-icon>
            </button>
          </div>
          <div class="search-results-box" *ngIf="productResults.length > 0">
            <div class="search-result-row" *ngFor="let p of productResults" (click)="addProduct(p)">
              <div class="sr-img">
                <img *ngIf="p.imageUrl" [src]="p.imageUrl" alt="" />
                <span *ngIf="!p.imageUrl" class="sr-emoji">{{ p.emoji || '📦' }}</span>
              </div>
              <div class="sr-info">
                <div class="sr-name">{{ p.name }}</div>
                <div class="sr-meta">
                  <span class="sr-code" *ngIf="p.barcode">{{ p.barcode }}</span>
                  <span class="sr-code alt" *ngIf="!p.barcode && p.shopCode">{{ p.shopCode }}</span>
                  <span class="sr-stock">Stock: {{ p.stockQuantity }}</span>
                </div>
              </div>
              <div class="sr-price">Rs {{ p.retailPrice }}</div>
            </div>
          </div>
          <p class="load-hint" *ngIf="!productsLoaded">Loading products…</p>
          <p class="load-hint" *ngIf="productsLoaded && productQuery.trim() && productResults.length === 0">No products found for "{{ productQuery }}"</p>
        </div>

        <!-- Items list -->
        @if (items.length > 0) {
          <div class="section-label" style="margin-top:12px">Items</div>
          <div class="items-list">
            @for (item of items; track item; let i = $index) {
              <div class="item-row" [class.stock-item]="item.fromStock">
                <div class="item-name">
                  @if (item.fromStock) {
                    <mat-icon class="stock-icon">inventory_2</mat-icon>
                  }
                  @if (!item.fromStock) {
                    <input class="name-inp" [(ngModel)]="item.name" placeholder="Item name" />
                  } @else {
                    <span class="stock-name">{{ item.name }}</span>
                  }
                </div>
                <div class="item-qty">
                  <button class="qty-btn" (click)="changeQty(i, -1)">−</button>
                  <input class="qty-inp" type="number" [(ngModel)]="item.quantity"
                    (input)="recalc()" min="0.5" step="1" />
                  <button class="qty-btn" (click)="changeQty(i, 1)">+</button>
                </div>
                <input class="price-inp" type="number" [(ngModel)]="item.unitPrice"
                  (input)="recalc()" placeholder="Price" />
                <span class="item-sub">Rs {{ (item.quantity * item.unitPrice) | number:'1.0-0' }}</span>
                <button class="del-btn" (click)="removeItem(i)"><mat-icon>close</mat-icon></button>
              </div>
            }
          </div>
        }

        <!-- Add manual item -->
        <button class="add-manual-btn" (click)="addManualItem()">
          <mat-icon>add</mat-icon> Add other item manually
        </button>

        <div class="divider"></div>

        <!-- Total -->
        <div class="total-section">
          <div class="total-row">
            <span class="total-label">Total (Rs)</span>
            <div class="total-value-wrap">
              <span class="total-auto">{{ effectiveTotal | number:'1.0-0' }}</span>
              @if (items.length > 0) {
                <span class="total-hint">auto-calculated</span>
              }
            </div>
          </div>
          @if (items.length === 0) {
            <input class="total-manual-inp" type="number" [(ngModel)]="manualTotal"
              (input)="calcChange()" min="0" step="1" placeholder="Enter amount" />
          }
        </div>

        <!-- Payment method -->
        <div class="pay-methods">
          <button class="pay-btn" [class.active]="paymentMethod === 'CASH'" (click)="paymentMethod = 'CASH'; calcChange()">CASH</button>
          <button class="pay-btn" [class.active]="paymentMethod === 'TRANSFER'" (click)="paymentMethod = 'TRANSFER'; calcChange()">TRANSFER</button>
          <button class="pay-btn" [class.active]="paymentMethod === 'CREDIT'" (click)="paymentMethod = 'CREDIT'; calcChange()">CREDIT</button>
        </div>

        <!-- Cash section -->
        <div class="cash-section" *ngIf="paymentMethod === 'CASH'">
          <div class="cash-label">Cash Tendered</div>
          <div class="quick-cash">
            <button class="qc-btn" *ngFor="let amt of quickAmounts" [class.active]="cashTendered === amt" (click)="setCash(amt)">{{ amt | number:'1.0-0' }}</button>
          </div>
          <div class="cash-input-row">
            <input class="cash-inp" type="number" [(ngModel)]="cashTendered"
              (input)="calcChange()" placeholder="Or enter amount..." />
            <div class="change-box">
              <span class="cl">Change</span>
              <span class="cv" [class.negative]="change < 0">Rs {{ change | number:'1.0-0' }}</span>
            </div>
          </div>
        </div>

        <!-- Notes -->
        <input class="notes-inp" [(ngModel)]="notes" placeholder="Notes (optional)" />
      </div>

      <div class="qs-actions">
        <button class="cancel-btn" (click)="dialogRef.close()">CANCEL</button>
        <button class="submit-btn" (click)="submit()" [disabled]="submitting || !canSubmit()">
          <mat-spinner diameter="18" *ngIf="submitting"></mat-spinner>
          <mat-icon *ngIf="!submitting">check</mat-icon>
          RECORD SALE
        </button>
      </div>
    </div>
  `,
  styles: [`
    .qs-wrap { width: 540px; display: flex; flex-direction: column; max-height: 90vh; }
    .qs-title { font-size: 18px; font-weight: 700; color: #1b3050; margin: 0; padding: 20px 24px 12px; border-bottom: 1px solid #f0f0f0; }
    .qs-body { flex: 1; overflow-y: auto; padding: 16px 24px; display: flex; flex-direction: column; gap: 10px; }
    .full { width: 100%; }

    .section-label { font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }

    /* Stock search */
    .search-wrap { position: relative; }
    .stock-search { display: flex; align-items: center; gap: 8px; border: 1px solid #ddd; border-radius: 8px; padding: 8px 12px; background: #fafafa; }
    .s-icon { color: #9ca3af; font-size: 18px; width: 18px; height: 18px; flex-shrink: 0; }
    .s-inp { flex: 1; border: none; background: none; font-size: 14px; font-family: inherit; outline: none; color: #1b3050; }
    .s-clear { background: none; border: none; cursor: pointer; padding: 0; display: flex; color: #9ca3af; }
    .search-results-box { position: absolute; top: 100%; left: 0; right: 0; z-index: 1000; border: 1px solid #e5e7eb; border-radius: 10px; max-height: 300px; overflow-y: auto; background: #fff; box-shadow: 0 6px 20px rgba(0,0,0,0.14); margin-top: 4px; }
    .search-result-row { display: flex; align-items: center; gap: 12px; padding: 10px 12px; cursor: pointer; border-bottom: 1px solid #f3f4f6; color: #1b3050; transition: background 0.1s; }
    .search-result-row:last-child { border-bottom: none; }
    .search-result-row:hover { background: #eff6ff; }
    .sr-img { width: 48px; height: 48px; border-radius: 8px; overflow: hidden; background: #f3f4f6; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
    .sr-img img { width: 100%; height: 100%; object-fit: cover; }
    .sr-emoji { font-size: 24px; line-height: 1; }
    .sr-info { flex: 1; min-width: 0; }
    .sr-name { font-size: 14px; font-weight: 600; color: #1b3050; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .sr-meta { display: flex; align-items: center; gap: 8px; margin-top: 2px; }
    .sr-code { font-size: 11px; font-weight: 600; color: #fff; background: #1b3050; border-radius: 4px; padding: 1px 6px; letter-spacing: 0.3px; }
    .sr-code.alt { background: #6b7280; }
    .sr-stock { font-size: 11px; color: #6b7280; }
    .sr-price { font-size: 15px; font-weight: 700; color: #1b3050; white-space: nowrap; flex-shrink: 0; }
    .load-hint { font-size: 12px; color: #9ca3af; margin: 4px 0; }

    /* Items list */
    .items-list { display: flex; flex-direction: column; gap: 6px; }
    .item-row { display: flex; gap: 6px; align-items: center; padding: 6px 8px; border-radius: 8px; background: #f9fafb; border: 1px solid #e5e7eb; }
    .item-row.stock-item { background: #eff6ff; border-color: #bfdbfe; }
    .item-name { flex: 1; display: flex; align-items: center; gap: 6px; min-width: 0; }
    .stock-icon { font-size: 16px; width: 16px; height: 16px; color: #2563eb; flex-shrink: 0; }
    .stock-name { font-size: 13px; font-weight: 500; color: #1b3050; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .name-inp { border: 1px solid #ddd; border-radius: 6px; padding: 4px 8px; font-size: 13px; font-family: inherit; width: 100%; }
    .name-inp:focus { outline: none; border-color: #1b3050; }
    .item-qty { display: flex; align-items: center; gap: 2px; flex-shrink: 0; }
    .qty-btn { width: 24px; height: 24px; border-radius: 50%; border: 1px solid #ddd; background: white; cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center; line-height: 1; padding: 0; }
    .qty-btn:hover { border-color: #1b3050; color: #1b3050; }
    .qty-inp { width: 40px; text-align: center; border: 1px solid #ddd; border-radius: 6px; padding: 4px 2px; font-size: 13px; font-family: inherit; }
    .qty-inp:focus { outline: none; border-color: #1b3050; }
    .price-inp { width: 80px; border: 1px solid #ddd; border-radius: 6px; padding: 5px 8px; font-size: 13px; font-family: inherit; flex-shrink: 0; }
    .price-inp:focus { outline: none; border-color: #1b3050; }
    .item-sub { width: 76px; text-align: right; font-size: 13px; font-weight: 700; color: #1b3050; flex-shrink: 0; }
    .del-btn { background: none; border: none; cursor: pointer; color: #d1d5db; display: flex; align-items: center; padding: 2px; flex-shrink: 0; }
    .del-btn:hover { color: #dc2626; }

    .add-manual-btn { background: none; border: 1px dashed #d1d5db; border-radius: 8px; width: 100%; padding: 7px; cursor: pointer; color: #6b7280; font-family: inherit; font-size: 12px; display: flex; align-items: center; justify-content: center; gap: 4px; transition: all 0.15s; }
    .add-manual-btn:hover { border-color: #1b3050; color: #1b3050; }

    .divider { border-top: 1px dashed #e5e7eb; }

    /* Total */
    .total-section { display: flex; flex-direction: column; gap: 6px; }
    .total-row { display: flex; align-items: baseline; justify-content: space-between; }
    .total-label { font-size: 13px; font-weight: 600; color: #6b7280; }
    .total-value-wrap { display: flex; align-items: baseline; gap: 8px; }
    .total-auto { font-size: 28px; font-weight: 800; color: #1b3050; }
    .total-hint { font-size: 11px; color: #9ca3af; }
    .total-manual-inp { border: 2px solid #1b3050; border-radius: 8px; padding: 10px 14px; font-size: 22px; font-weight: 700; font-family: inherit; width: 100%; box-sizing: border-box; text-align: right; }
    .total-manual-inp:focus { outline: none; border-color: #2563eb; }

    /* Payment */
    .pay-methods { display: flex; gap: 8px; }
    .pay-btn { flex: 1; padding: 8px; border: 1px solid #e5e7eb; border-radius: 8px; background: white; font-family: inherit; font-size: 13px; font-weight: 600; cursor: pointer; color: #6b7280; transition: all 0.15s; }
    .pay-btn.active { background: #1b3050; color: white; border-color: #1b3050; }

    /* Cash */
    .cash-section { display: flex; flex-direction: column; gap: 8px; }
    .cash-label { font-size: 12px; font-weight: 600; color: #6b7280; }
    .quick-cash { display: flex; gap: 6px; }
    .qc-btn { flex: 1; padding: 8px 4px; border: 1px solid #e5e7eb; border-radius: 8px; background: white; font-family: inherit; font-size: 13px; font-weight: 600; cursor: pointer; color: #1b3050; transition: all 0.15s; }
    .qc-btn:hover, .qc-btn.active { background: #1b3050; color: white; border-color: #1b3050; }
    .cash-input-row { display: flex; gap: 12px; align-items: center; }
    .cash-inp { flex: 1; border: 1px solid #ddd; border-radius: 8px; padding: 8px 12px; font-size: 16px; font-family: inherit; }
    .cash-inp:focus { outline: none; border-color: #1b3050; }
    .change-box { display: flex; flex-direction: column; align-items: flex-end; flex-shrink: 0; }
    .cl { font-size: 10px; color: #9ca3af; text-transform: uppercase; }
    .cv { font-size: 20px; font-weight: 800; color: #16a34a; }
    .cv.negative { color: #dc2626; }

    .notes-inp { width: 100%; border: 1px solid #ddd; border-radius: 8px; padding: 8px 12px; font-size: 13px; font-family: inherit; box-sizing: border-box; }
    .notes-inp:focus { outline: none; border-color: #1b3050; }

    /* Actions */
    .qs-actions { display: flex; gap: 10px; padding: 12px 24px 16px; border-top: 1px solid #f0f0f0; justify-content: flex-end; }
    .cancel-btn { background: none; border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px 20px; font-family: inherit; font-size: 13px; font-weight: 600; cursor: pointer; color: #6b7280; transition: all 0.15s; }
    .cancel-btn:hover { border-color: #9ca3af; color: #374151; }
    .submit-btn { background: #16a34a; color: white; border: none; border-radius: 8px; padding: 10px 24px; font-family: inherit; font-size: 13px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: background 0.15s; }
    .submit-btn:hover:not(:disabled) { background: #15803d; }
    .submit-btn:disabled { opacity: 0.5; cursor: default; }
  `]
})
export class QuickSaleDialogComponent implements OnInit {
  dialogRef = inject(MatDialogRef<QuickSaleDialogComponent>);
  private dialog = inject(MatDialog);
  private spService = inject(SalespersonService);
  private productService = inject(ProductService);
  private quickSaleService = inject(QuickSaleService);
  private snack = inject(MatSnackBar);

  salespersons: any[] = [];
  salespersonId: number | null = null;
  paymentMethod = 'CASH';
  manualTotal: number | null = null;
  cashTendered: number | null = null;
  change = 0;
  notes = '';
  submitting = false;

  items: QsItem[] = [];
  productQuery = '';
  productResults: any[] = [];
  allProducts: any[] = [];
  productsLoaded = false;

  onSearch() {
    const q = this.productQuery.trim().toLowerCase();
    if (!q) { this.productResults = []; return; }
    this.productResults = this.allProducts.filter(p =>
      p.name?.toLowerCase().includes(q) ||
      p.barcode?.toLowerCase().includes(q)
    ).slice(0, 20);
  }

  clearSearch() {
    this.productQuery = '';
    this.productResults = [];
  }

  readonly quickAmounts = [500, 1000, 2000, 5000];

  get effectiveTotal(): number {
    if (this.items.length > 0) {
      return this.items.reduce((s, i) => s + (i.quantity || 0) * (i.unitPrice || 0), 0);
    }
    return this.manualTotal ?? 0;
  }

  ngOnInit() {
    this.spService.getAll().subscribe(s => {
      this.salespersons = s.filter((sp: any) => sp.active);
    });
    this.productService.getAll().subscribe({
      next: p => {
        this.allProducts = p;
        this.productsLoaded = true;
        if (this.productQuery.trim()) this.onSearch();
      },
      error: () => { this.productsLoaded = true; }
    });
  }

  addProduct(p: any) {
    const existing = this.items.find(i => i.productId === p.id);
    if (existing) {
      existing.quantity++;
    } else {
      this.items.push({ name: p.name, quantity: 1, unitPrice: p.retailPrice, productId: p.id, fromStock: true });
    }
    this.productQuery = '';
    this.productResults = [];
    this.calcChange();
  }

  addManualItem() {
    this.items.push({ name: '', quantity: 1, unitPrice: 0, productId: null, fromStock: false });
  }

  removeItem(i: number) {
    this.items.splice(i, 1);
    this.calcChange();
  }

  changeQty(i: number, delta: number) {
    const item = this.items[i];
    item.quantity = Math.max(0.5, (item.quantity || 1) + delta);
    this.calcChange();
  }

  recalc() { this.calcChange(); }

  setCash(amt: number) {
    this.cashTendered = amt;
    this.calcChange();
  }

  calcChange() {
    const t = this.effectiveTotal;
    this.change = this.cashTendered != null ? this.cashTendered - t : 0;
  }

  canSubmit(): boolean {
    return !!this.salespersonId && this.effectiveTotal > 0;
  }

  async submit() {
    if (!this.canSubmit()) return;
    this.submitting = true;

    const payload = {
      salespersonId: this.salespersonId,
      paymentMethod: this.paymentMethod,
      total: this.effectiveTotal,
      notes: this.notes || null,
      cashTendered: this.paymentMethod === 'CASH' && this.cashTendered ? this.cashTendered : null,
      items: this.items
        .filter(i => i.name.trim() && i.unitPrice > 0)
        .map(i => ({ name: i.name.trim(), quantity: i.quantity || 1, unitPrice: i.unitPrice, productId: i.productId }))
    };

    this.quickSaleService.create(payload).subscribe({
      next: (sale) => {
        this.submitting = false;
        const sp = this.salespersons.find(s => s.id === this.salespersonId);
        this.dialogRef.close('saved');
        this.dialog.open(ReceiptDialogComponent, {
          data: {
            saleId: sale.id,
            receipt: {
              date: sale.createdAt ?? new Date().toISOString(),
              salesperson: sp?.name ?? '',
              saleType: 'QUICK SALE',
              paymentMethod: this.paymentMethod,
              cashTendered: this.cashTendered,
            },
            _items: (sale.items ?? []).map((i: any) => ({
              name: i.name, quantity: i.quantity, unitPrice: i.unitPrice, discount: 0, subtotal: i.subtotal
            })),
            _netSubtotal: this.effectiveTotal,
            _total: this.effectiveTotal,
            _changeAmount: this.change > 0 ? this.change : 0,
            _itemDiscount: 0,
            _autoPrint: false,
          }
        });
      },
      error: () => {
        this.submitting = false;
        this.snack.open('Failed to record sale', 'OK', { duration: 3000 });
      }
    });
  }
}
