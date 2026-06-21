import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PrintService } from '../../../../core/services/print.service';
import { SaleReceiptData } from '../../../../core/models/print.model';

@Component({
  selector: 'app-receipt-dialog',
  standalone: true,
  imports: [CommonModule, DatePipe, MatDialogModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatSnackBarModule],
  template: `
    <div class="receipt-wrapper">
      <div class="receipt-content">

        <!-- Header -->
        <div class="receipt-header">
          <h3>GHANIM ENTERPRISES</h3>
          <p>No. 84, Lower Street, Badulla</p>
          <p>055 222 9046</p>
        </div>
        <div class="receipt-divider"></div>

        <!-- Meta -->
        <div class="receipt-meta">
          <div class="meta-row"><span>Date:</span><span>{{ data.receipt?.date | date:'dd/MM/yyyy HH:mm' }}</span></div>
          <div class="meta-row"><span>Sale #:</span><span>{{ data.saleId }}</span></div>
          <div class="meta-row"><span>By:</span><span>{{ data.receipt?.salesperson }}</span></div>
          <div class="meta-row"><span>Type:</span><span>{{ data.receipt?.saleType }}</span></div>
          @if (data.receipt?.customerName) {
            <div class="meta-row"><span>Customer:</span><span>{{ data.receipt.customerName }}</span></div>
          }
        </div>
        <div class="receipt-divider"></div>

        <!-- Items -->
        <div class="receipt-items">
          <div class="item-header">
            <span class="col-qty">Qty</span>
            <span class="col-name">Description</span>
            <span class="col-amt">Amount</span>
          </div>
          <div class="item-dash"></div>
          @for (item of items; track $index) {
            <div class="receipt-item">
              <span class="col-qty">{{ item.quantity }}</span>
              <span class="col-name">{{ item.name }}</span>
              <span class="col-amt">{{ item.subtotal | number:'1.2-2' }}</span>
            </div>
            @if (item.quantity > 1) {
              <div class="item-sub-row">
                <span class="col-qty"></span>
                <span class="col-name sub-text">LKR {{ item.unitPrice | number:'1.2-2' }} x {{ item.quantity }}</span>
                <span class="col-amt"></span>
              </div>
            }
            @if (item.discount > 0) {
              <div class="item-sub-row">
                <span class="col-qty"></span>
                <span class="col-name sub-text disc-text">Disc: -LKR {{ item.discount | number:'1.2-2' }}</span>
                <span class="col-amt"></span>
              </div>
            }
          }
        </div>
        <div class="receipt-divider"></div>

        <!-- Totals -->
        <div class="receipt-totals">
          <div class="total-row"><span>Subtotal:</span><span>LKR {{ netSubtotal | number:'1.2-2' }}</span></div>
          @if (billDiscount > 0) {
            <div class="total-row discount-row">
              <span>Bill Discount:</span><span>- LKR {{ billDiscount | number:'1.2-2' }}</span>
            </div>
          }
          <div class="total-row grand"><span>TOTAL:</span><span>LKR {{ finalTotal | number:'1.2-2' }}</span></div>
          @if (data.receipt?.paymentMethod === 'CASH') {
            <div class="total-row"><span>Cash:</span><span>LKR {{ data.receipt?.cashTendered | number:'1.2-2' }}</span></div>
            <div class="total-row"><span>Change:</span><span>LKR {{ changeAmount | number:'1.2-2' }}</span></div>
          } @else {
            <div class="total-row"><span>Payment:</span><span>{{ data.receipt?.paymentMethod }}</span></div>
          }
        </div>
        <div class="receipt-divider"></div>

        <!-- Footer -->
        <div class="receipt-footer">
          <p class="thank-you">Thank you! Come again</p>
          <p class="footer-line">Shop online &nbsp;|&nbsp; Fast Delivery</p>
          <div class="receipt-divider-light"></div>
          <p class="footer-line">WhatsApp: 071 902 5444</p>
          <p class="footer-site">www.ghanimenterprises.lk</p>
        </div>

      </div>

      <div class="receipt-actions no-print">
        <button mat-stroked-button (click)="dialogRef.close()">
          <mat-icon>close</mat-icon> CLOSE
        </button>
        <button mat-stroked-button (click)="printReceipt()" [disabled]="printing">
          @if (printing) { <mat-spinner diameter="16" /> }
          @else { <mat-icon>print</mat-icon> }
          PRINT RECEIPT
        </button>
        <button mat-flat-button class="new-sale-btn" (click)="dialogRef.close('new')">
          <mat-icon>add_shopping_cart</mat-icon> NEW SALE
        </button>
      </div>
    </div>
  `,
  styles: [`
    .receipt-wrapper { padding: 16px; min-width: 360px; }
    .receipt-content {
      font-family: monospace; font-size: 13px;
      background: #fff; padding: 16px;
      border: 1px solid #eee; border-radius: 8px;
    }
    .receipt-header { text-align: center; margin-bottom: 8px; }
    .receipt-header h3 { font-size: 15px; font-weight: 700; margin-bottom: 4px; }
    .receipt-header p { font-size: 12px; color: #555; margin: 2px 0; }
    .receipt-divider { border-top: 1px dashed #ccc; margin: 8px 0; }
    .receipt-divider-light { border-top: 1px dotted #ddd; margin: 4px 0; }
    .meta-row, .total-row {
      display: flex; justify-content: space-between;
      padding: 2px 0; font-size: 12.5px;
    }
    .item-header {
      display: flex; gap: 0; font-size: 11px;
      font-weight: 700; color: #6b7280; padding: 2px 0;
    }
    .item-dash {
      border-top: 1px solid #bbb; margin: 2px 0 3px;
    }
    .receipt-item, .item-sub-row {
      display: flex; align-items: baseline;
      padding: 1px 0; font-size: 12.5px;
    }
    .col-qty {
      width: 24px; text-align: right; font-weight: 600;
      flex-shrink: 0; padding-right: 10px;
    }
    .col-name { flex: 1; padding-right: 6px; }
    .col-amt {
      width: 72px; text-align: right; white-space: nowrap;
      flex-shrink: 0;
    }
    .item-sub-row { padding-bottom: 3px; }
    .sub-text { font-size: 11px; color: #6b7280; }
    .disc-text { color: #c62828; }
    .discount-row { color: #c62828; }
    .grand { font-weight: 700; font-size: 14px; border-top: 1px solid #ddd; margin-top: 4px; padding-top: 4px; }
    .receipt-footer { text-align: center; margin-top: 4px; }
    .thank-you { font-size: 13px; font-weight: 600; color: #1b3050; margin: 4px 0 6px; }
    .footer-line { font-size: 11.5px; color: #555; margin: 2px 0; }
    .footer-site { font-size: 12px; color: #1b3050; font-weight: 600; margin: 2px 0; }
    .receipt-actions {
      display: flex; gap: 10px; margin-top: 16px; justify-content: flex-end;
    }
    .new-sale-btn { background: #2e7d32 !important; color: #fff !important; }
  `]
})
export class ReceiptDialogComponent implements OnInit {
  dialogRef = inject(MatDialogRef<ReceiptDialogComponent>);
  data: any = inject(MAT_DIALOG_DATA);
  private printService = inject(PrintService);
  private snack = inject(MatSnackBar);

  printing = false;

  ngOnInit() {
    if (this.data._autoPrint) {
      this.printReceipt();
    }
  }

  // Use frontend-enriched values when available, fall back to backend values
  get items(): any[] { return this.data._items ?? this.data.receipt?.items ?? []; }
  get netSubtotal(): number { return this.data._netSubtotal ?? this.data.receipt?.subtotal ?? this.data.total; }
  get billDiscount(): number { return this.data._billDiscount ?? this.data.receipt?.cartDiscount ?? 0; }
  get finalTotal(): number { return this.data._total ?? this.data.total; }
  get changeAmount(): number { return this.data._changeAmount ?? this.data.changeAmount ?? 0; }

  async printReceipt() {
    this.printing = true;
    try {
      const receiptData: SaleReceiptData = {
        saleId: this.data.saleId,
        date: this.data.receipt?.date ?? new Date().toISOString(),
        salespersonName: this.data.receipt?.salesperson ?? '',
        saleType: this.data.receipt?.saleType ?? 'RETAIL',
        customerName: this.data.receipt?.customerName,
        items: this.items.map((i: any) => ({
          name: i.name, quantity: i.quantity,
          unitPrice: i.unitPrice ?? i.subtotal / i.quantity,
          discount: i.discount ?? 0, subtotal: i.subtotal
        })),
        subtotal: this.netSubtotal + (this.data._itemDiscount ?? 0),
        itemDiscount: this.data._itemDiscount ?? 0,
        cartDiscount: this.billDiscount,
        total: this.finalTotal,
        paymentMethod: this.data.receipt?.paymentMethod ?? 'CASH',
        cashTendered: this.data.receipt?.cashTendered,
        changeAmount: this.changeAmount
      };
      await this.printService.printReceipt(receiptData);
      this.snack.open('Receipt printed', '', { duration: 2000 });
    } catch {
      this.snack.open('Printer offline "” could not reprint', 'OK', { duration: 4000 });
    } finally {
      this.printing = false;
    }
  }
}


