import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SaleService } from '../../../core/services/sale.service';

@Component({
  selector: 'app-credit-payment-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatProgressSpinnerModule],
  template: `
    <div class="pay-wrap">
      <h2>Record Payment</h2>

      <div class="sale-summary">
        <div class="summary-row"><span>Sale</span><span>#{{ data.sale.id }}</span></div>
        <div class="summary-row"><span>Customer</span><span>{{ data.sale.customerName || 'Unknown' }}</span></div>
        <div class="summary-row total"><span>Outstanding</span><span>LKR {{ data.sale.total | number:'1.2-2' }}</span></div>
      </div>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Amount Received (LKR)</mat-label>
        <input matInput type="number" [(ngModel)]="amount" (ngModelChange)="calcChange()" placeholder="0.00" />
      </mat-form-field>

      <div class="quick-chips">
        <button class="chip" (click)="setExact()">Exact ({{ data.sale.total | number:'1.2-2' }})</button>
      </div>

      @if (amount != null && amount > 0 && amount < data.sale.total) {
        <div class=”change-box warn”>
          Insufficient - short by LKR {{ (data.sale.total - amount) | number:'1.2-2' }}
        </div>
      }
      @if (amount != null && amount >= data.sale.total) {
        <div class=”change-box”>
          Change to return: <strong>LKR {{ (amount - data.sale.total) | number:'1.2-2' }}</strong>
        </div>
      }

      <div mat-dialog-actions class="actions">
        <button mat-button (click)="dialogRef.close()">CANCEL</button>
        <button mat-flat-button class="confirm-btn" (click)="confirm()"
          [disabled]="loading || !amount || amount < data.sale.total">
          @if (loading) { <mat-spinner diameter="18" /> } @else { CONFIRM PAYMENT }
        </button>
      </div>
    </div>
  `,
  styles: [`
    .pay-wrap { padding: 20px 24px; min-width: 320px; }
    h2 { font-size: 18px; font-weight: 700; color: #1b3050; margin: 0 0 16px; }
    .sale-summary { background: #f8f9fa; border-radius: 8px; padding: 12px; margin-bottom: 16px; }
    .summary-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 13px; }
    .summary-row.total { font-weight: 700; font-size: 15px; color: #f57f17; border-top: 1px dashed #ddd; margin-top: 4px; padding-top: 8px; }
    .full-width { width: 100%; }
    .quick-chips { display: flex; gap: 8px; margin: -8px 0 12px; }
    .chip {
      padding: 4px 14px; border: 1px solid #c9a84c; border-radius: 16px;
      background: #fff; font-size: 12px; font-weight: 600; color: #c9a84c;
      cursor: pointer; font-family: inherit;
      &:hover { background: #c9a84c; color: #1b3050; }
    }
    .change-box {
      background: #e8f5e9; color: #2e7d32; border-radius: 6px;
      padding: 8px 12px; font-size: 13px; margin-bottom: 8px;
    }
    .change-box.warn, .warn { background: #fdecea; color: #c62828; }
    .actions { display: flex; gap: 8px; justify-content: flex-end; padding-top: 8px; }
    .confirm-btn { background: #2e7d32 !important; color: #fff !important; }
  `]
})
export class CreditPaymentDialogComponent {
  dialogRef = inject(MatDialogRef<CreditPaymentDialogComponent>);
  data: any = inject(MAT_DIALOG_DATA);
  private saleService = inject(SaleService);

  amount: number | null = null;
  loading = false;

  setExact() {
    this.amount = this.data.sale.total;
  }

  calcChange() {}

  confirm() {
    if (!this.amount) return;
    this.loading = true;
    this.saleService.recordPayment(this.data.sale.id, this.amount).subscribe({
      next: () => this.dialogRef.close(true),
      error: () => { this.loading = false; }
    });
  }
}


