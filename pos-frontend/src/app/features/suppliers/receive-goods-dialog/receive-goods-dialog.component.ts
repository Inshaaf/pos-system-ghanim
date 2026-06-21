import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { SupplierService } from '../../../core/services/product.service';
import { Product, Supplier } from '../../../core/models/product.model';

interface LineItem {
  productId: number | null;
  quantity: number | null;
  unitCost: number | null;
}

@Component({
  selector: 'app-receive-goods-dialog',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatProgressSpinnerModule, MatDialogModule
  ],
  template: `
    <div class="dlg-header">
      <div class="dlg-title">
        <mat-icon>inventory</mat-icon>
        <div>
          <div class="dlg-name">Receive Goods</div>
          <div class="dlg-sub">{{ data.supplier.name }}</div>
        </div>
      </div>
      <button mat-icon-button mat-dialog-close class="close-btn"><mat-icon>close</mat-icon></button>
    </div>

    <mat-dialog-content class="dlg-content">
      @if (loadingProducts) {
        <div class="loading-wrap"><mat-spinner diameter="32"></mat-spinner></div>
      }
      @if (!loadingProducts) {
        @if (products.length === 0) {
          <div class="no-products">
            <mat-icon>warning_amber</mat-icon>
            <p>No products linked to this supplier. Assign products to <strong>{{ data.supplier.name }}</strong> first.</p>
          </div>
        }
        @if (products.length > 0) {
          <!-- Line items table -->
          <div class="lines-header">
            <span class="col-product">Product</span>
            <span class="col-qty">Qty</span>
            <span class="col-cost">Unit Cost</span>
            <span class="col-total">Line Total</span>
            <span class="col-del"></span>
          </div>

          @for (line of lines; track $index) {
            <div class="line-row">
              <div class="col-product">
                <mat-form-field appearance="outline" class="full-w">
                  <mat-select [(ngModel)]="line.productId" placeholder="Select product">
                    @for (p of products; track p.id) {
                      <mat-option [value]="p.id">{{ p.name }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>
              </div>
              <div class="col-qty">
                <mat-form-field appearance="outline" class="full-w">
                  <input matInput type="number" min="1" [(ngModel)]="line.quantity" placeholder="0">
                </mat-form-field>
              </div>
              <div class="col-cost">
                <mat-form-field appearance="outline" class="full-w">
                  <input matInput type="number" min="0" step="0.01" [(ngModel)]="line.unitCost" placeholder="0.00">
                </mat-form-field>
              </div>
              <div class="col-total">
                <span class="line-total">
                  Rs {{ lineTotal(line) | number:'1.0-0' }}
                </span>
              </div>
              <div class="col-del">
                <button mat-icon-button class="del-btn" (click)="removeLine($index)" [disabled]="lines.length === 1">
                  <mat-icon>remove_circle_outline</mat-icon>
                </button>
              </div>
            </div>
          }

          <button mat-button class="add-line-btn" (click)="addLine()">
            <mat-icon>add</mat-icon> Add Line
          </button>

          <!-- Grand total -->
          <div class="grand-total-row">
            <span>Grand Total</span>
            <span class="grand-total">Rs {{ grandTotal | number:'1.0-0' }}</span>
          </div>

          @if (error) {
            <div class="err-msg">{{ error }}</div>
          }
        }
      }
    </mat-dialog-content>

    @if (!loadingProducts && products.length > 0) {
      <mat-dialog-actions class="dlg-actions">
        <button mat-stroked-button mat-dialog-close [disabled]="loading">Cancel</button>
        <button mat-flat-button class="confirm-btn" (click)="confirm()" [disabled]="loading || !isValid">
          @if (loading) { <mat-spinner diameter="16" class="btn-spinner"></mat-spinner> }
          @if (!loading) { <mat-icon>check</mat-icon> }
          Receive & Add Stock
        </button>
      </mat-dialog-actions>
    }
  `,
  styles: [`
    .dlg-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 18px 20px 14px; border-bottom: 1px solid #eef0f4;
    }
    .dlg-title { display: flex; align-items: center; gap: 12px; }
    .dlg-title mat-icon { font-size: 26px; width: 26px; height: 26px; color: #1b3050; }
    .dlg-name { font-size: 16px; font-weight: 700; color: #1b3050; }
    .dlg-sub { font-size: 12px; color: #6b7280; }
    .close-btn { color: #6b7280 !important; }

    .dlg-content { padding: 16px 20px !important; max-height: 480px; }
    .loading-wrap { display: flex; justify-content: center; padding: 40px; }

    .no-products {
      display: flex; flex-direction: column; align-items: center; gap: 10px;
      padding: 30px; color: #6b7280; text-align: center;
    }
    .no-products mat-icon { font-size: 40px; width: 40px; height: 40px; color: #f59e0b; }
    .no-products p { font-size: 13px; }

    .lines-header {
      display: grid;
      grid-template-columns: 1fr 90px 110px 100px 36px;
      gap: 8px; padding: 0 0 4px;
      font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase;
    }
    .line-row {
      display: grid;
      grid-template-columns: 1fr 90px 110px 100px 36px;
      gap: 8px; align-items: center; margin-bottom: -8px;
    }
    .col-product, .col-qty, .col-cost { }
    .col-total { font-size: 14px; font-weight: 600; color: #1b3050; text-align: right; }
    .col-del { display: flex; align-items: center; }
    .del-btn { color: #e53935 !important; width: 32px !important; height: 32px !important; }
    .full-w { width: 100%; }

    .add-line-btn { color: #1b3050 !important; margin-top: 4px; font-size: 13px; }

    .grand-total-row {
      display: flex; justify-content: space-between; align-items: center;
      margin-top: 16px; padding: 14px 16px; background: #f0f4f8; border-radius: 8px;
      font-size: 14px; font-weight: 600; color: #1b3050;
    }
    .grand-total { font-size: 20px; font-weight: 700; color: #1b3050; }

    .err-msg { color: #c62828; font-size: 13px; margin-top: 8px; }

    .dlg-actions {
      padding: 12px 20px !important; border-top: 1px solid #eef0f4;
      display: flex; gap: 10px; justify-content: flex-end;
    }
    .confirm-btn { background: #1b3050 !important; color: #fff !important; display: flex; align-items: center; gap: 6px; }
    .btn-spinner { display: inline-block; }
  `]
})
export class ReceiveGoodsDialogComponent implements OnInit {
  data = inject<{ supplier: Supplier }>(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<ReceiveGoodsDialogComponent>);
  private supplierService = inject(SupplierService);

  products: Product[] = [];
  loadingProducts = true;
  loading = false;
  error = '';

  lines: LineItem[] = [{ productId: null, quantity: null, unitCost: null }];

  ngOnInit() {
    this.supplierService.getProducts(this.data.supplier.id).subscribe({
      next: p => { this.products = p; this.loadingProducts = false; },
      error: () => { this.loadingProducts = false; }
    });
  }

  lineTotal(line: LineItem): number {
    return (line.quantity || 0) * (line.unitCost || 0);
  }

  get grandTotal(): number {
    return this.lines.reduce((s, l) => s + this.lineTotal(l), 0);
  }

  get isValid(): boolean {
    return this.grandTotal > 0 &&
      this.lines.every(l => l.productId && l.quantity && l.quantity > 0 && l.unitCost != null && l.unitCost >= 0);
  }

  addLine() {
    this.lines = [...this.lines, { productId: null, quantity: null, unitCost: null }];
  }

  removeLine(i: number) {
    this.lines = this.lines.filter((_, idx) => idx !== i);
  }

  confirm() {
    if (!this.isValid) return;
    this.loading = true;
    this.error = '';
    const items = this.lines.map(l => ({
      productId: l.productId!,
      quantity: l.quantity!,
      unitCost: l.unitCost!
    }));
    this.supplierService.receiveGoods(this.data.supplier.id, items).subscribe({
      next: updatedSupplier => {
        this.loading = false;
        this.dialogRef.close(updatedSupplier);
      },
      error: err => {
        this.loading = false;
        this.error = err?.error?.message || 'Failed to receive goods. Please try again.';
      }
    });
  }
}
