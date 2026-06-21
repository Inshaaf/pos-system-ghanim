import { Component, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CancelSaleDialogComponent } from '../cancel-sale-dialog/cancel-sale-dialog.component';

@Component({
  selector: 'app-sale-detail-dialog',
  standalone: true,
  imports: [CommonModule, DatePipe, MatDialogModule, MatButtonModule, MatIconModule,
    MatSnackBarModule, CancelSaleDialogComponent],
  template: `
    <div class="detail-wrap">
      <div class="detail-header">
        <div>
          <h2>Sale #{{ sale.id }}</h2>
          <p class="sub">{{ sale.createdAt | date:'dd/MM/yyyy HH:mm' }} · {{ sale.salesperson?.name }}</p>
        </div>
        <span class="status-badge" [class]="sale.status?.toLowerCase()">{{ sale.status }}</span>
      </div>

      <div class="detail-meta">
        <div class="meta-row"><span>Type</span><span>{{ sale.saleType }}</span></div>
        <div class="meta-row"><span>Payment</span><span>{{ sale.paymentMethod }}</span></div>
        @if (sale.customerName) {
          <div class="meta-row"><span>Customer</span><span>{{ sale.customerName }}</span></div>
        }
      </div>

      <div class="items-section">
        <div class="items-header">
          <span class="col-qty">Qty</span>
          <span class="col-name">Item</span>
          <span class="col-amt">Amount</span>
        </div>
        @for (item of sale.items; track $index) {
          <div class="item-row">
            <span class="col-qty">{{ item.quantity }}</span>
            <span class="col-name">
              {{ item.name }}
              @if (item.quantity > 1) {
                <span class="unit-price">LKR {{ item.unitPrice | number:'1.2-2' }} each</span>
              }
            </span>
            <span class="col-amt">LKR {{ item.subtotal | number:'1.2-2' }}</span>
          </div>
          @if (item.discount > 0) {
            <div class="item-disc">
              <span class="col-qty"></span>
              <span class="col-name disc-text">Disc: -LKR {{ item.discount | number:'1.2-2' }}</span>
              <span class="col-amt"></span>
            </div>
          }
        }
      </div>

      <div class="totals-section">
        <div class="total-row"><span>Subtotal</span><span>LKR {{ sale.subtotal | number:'1.2-2' }}</span></div>
        @if (sale.itemDiscount > 0) {
          <div class="total-row disc"><span>Item Discounts</span><span>-LKR {{ sale.itemDiscount | number:'1.2-2' }}</span></div>
        }
        @if (sale.cartDiscount > 0) {
          <div class="total-row disc"><span>Bill Discount</span><span>-LKR {{ sale.cartDiscount | number:'1.2-2' }}</span></div>
        }
        <div class="total-row grand"><span>TOTAL</span><span>LKR {{ sale.total | number:'1.2-2' }}</span></div>
        @if (sale.paymentMethod === 'CASH' && sale.cashTendered) {
          <div class="total-row"><span>Cash</span><span>LKR {{ sale.cashTendered | number:'1.2-2' }}</span></div>
          <div class="total-row"><span>Change</span><span>LKR {{ sale.changeAmount | number:'1.2-2' }}</span></div>
        }
      </div>

      <div mat-dialog-actions class="detail-actions">
        <button mat-button (click)="dialogRef.close()">CLOSE</button>
        @if (sale.status === 'COMPLETED') {
          <button mat-stroked-button class="cancel-btn" (click)="cancelSale()">
            CANCEL SALE
          </button>
        }
      </div>
    </div>
  `,
  styles: [`
    .detail-wrap { min-width: 460px; padding: 20px 24px; }
    .detail-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
    h2 { font-size: 20px; font-weight: 700; color: #1b3050; margin: 0; }
    .sub { font-size: 12px; color: #888; margin: 4px 0 0; }
    .status-badge { padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; }
    .status-badge.completed { background: #e8f5e9; color: #2e7d32; }
    .status-badge.credit { background: #fff8e1; color: #f57f17; }
    .status-badge.cancelled { background: #fdecea; color: #c62828; }
    .detail-meta { display: flex; gap: 16px; margin-bottom: 16px; flex-wrap: wrap; }
    .meta-row { display: flex; flex-direction: column; gap: 2px; }
    .meta-row span:first-child { font-size: 10px; color: #aaa; text-transform: uppercase; }
    .meta-row span:last-child { font-size: 13px; font-weight: 600; color: #1b3050; }
    .items-section { border: 1px solid #f0f0f0; border-radius: 8px; margin-bottom: 12px; overflow: hidden; }
    .items-header { display: flex; padding: 8px 12px; background: #f8f9fa; font-size: 11px; font-weight: 700; color: #6b7280; }
    .item-row, .item-disc { display: flex; padding: 8px 12px; border-top: 1px solid #f0f0f0; font-size: 13px; align-items: baseline; }
    .item-disc { padding: 0 12px 6px; }
    .col-qty { width: 30px; flex-shrink: 0; font-weight: 600; }
    .col-name { flex: 1; }
    .col-amt { text-align: right; width: 100px; flex-shrink: 0; }
    .unit-price { display: block; font-size: 11px; color: #888; }
    .disc-text { font-size: 11px; color: #c62828; }
    .totals-section { border-top: 1px dashed #ddd; padding-top: 10px; }
    .total-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 13px; }
    .total-row.disc { color: #c62828; }
    .total-row.grand { font-weight: 700; font-size: 16px; color: #1b3050; border-top: 1px solid #eee; margin-top: 4px; padding-top: 8px; }
    .detail-actions { display: flex; gap: 8px; justify-content: flex-end; padding-top: 16px; }
    .cancel-btn { color: #c62828 !important; border-color: #c62828 !important; }
  `]
})
export class SaleDetailDialogComponent {
  dialogRef = inject(MatDialogRef<SaleDetailDialogComponent>);
  sale: any = inject(MAT_DIALOG_DATA).sale;
  private dialog = inject(MatDialog);
  private snack = inject(MatSnackBar);

  cancelSale() {
    const ref = this.dialog.open(CancelSaleDialogComponent, {
      width: '420px',
      data: { saleId: this.sale.id }
    });
    ref.afterClosed().subscribe(result => {
      if (result === 'cancelled') {
        this.snack.open('Sale cancelled and stock restored', '', { duration: 2500 });
        this.dialogRef.close('cancelled');
      }
    });
  }
}


