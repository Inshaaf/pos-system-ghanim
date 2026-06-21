import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SaleService } from '../../../core/services/sale.service';

const REASONS = [
  'Customer Request',
  'Wrong Items Entered',
  'Price Dispute',
  'Duplicate Sale',
  'Test / Training',
  'Other',
];

@Component({
  selector: 'app-cancel-sale-dialog',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatDialogModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="wrap">
      <div class="dialog-header">
        <mat-icon class="warn-icon">warning</mat-icon>
        <div>
          <h2>Cancel Sale #{{ data.saleId }}</h2>
          <p class="sub">This will restore stock. Requires manager approval.</p>
        </div>
      </div>

      <mat-form-field appearance="outline" class="full">
        <mat-label>Reason for cancellation</mat-label>
        <mat-select [(ngModel)]="reason">
          @for (r of reasons; track r) {
            <mat-option [value]="r">{{ r }}</mat-option>
          }
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline" class="full">
        <mat-label>Manager PIN</mat-label>
        <input matInput type="password" [(ngModel)]="pin"
          maxlength="4" placeholder="Enter 4-digit PIN"
          (keydown.enter)="confirm()" />
        <mat-icon matSuffix>lock</mat-icon>
      </mat-form-field>

      @if (errorMsg) {
        <div class="error-msg">
          <mat-icon>error_outline</mat-icon> {{ errorMsg }}
        </div>
      }

      <div mat-dialog-actions class="actions">
        <button mat-button (click)="dialogRef.close()">BACK</button>
        <button mat-flat-button class="cancel-btn" (click)="confirm()"
          [disabled]="loading || !reason || !pin">
          @if (loading) { <mat-spinner diameter="18" /> } @else { CONFIRM CANCEL }
        </button>
      </div>
    </div>
  `,
  styles: [`
    .wrap { padding: 20px 24px; min-width: 360px; }
    .dialog-header { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 20px; }
    .warn-icon { font-size: 32px; width: 32px; height: 32px; color: #c62828; margin-top: 2px; flex-shrink: 0; }
    h2 { font-size: 18px; font-weight: 700; color: #1b3050; margin: 0; }
    .sub { font-size: 12px; color: #888; margin: 4px 0 0; }
    .full { width: 100%; }
    .error-msg {
      display: flex; align-items: center; gap: 6px;
      background: #fdecea; color: #c62828; border-radius: 6px;
      padding: 8px 12px; font-size: 13px; margin-bottom: 8px;
    }
    .error-msg mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .actions { display: flex; gap: 8px; justify-content: flex-end; padding-top: 4px; }
    .cancel-btn { background: #c62828 !important; color: #fff !important; }
  `]
})
export class CancelSaleDialogComponent {
  dialogRef = inject(MatDialogRef<CancelSaleDialogComponent>);
  data: any = inject(MAT_DIALOG_DATA);
  private saleService = inject(SaleService);

  reasons = REASONS;
  reason = '';
  pin = '';
  loading = false;
  errorMsg = '';

  confirm() {
    if (!this.reason || !this.pin) return;
    this.loading = true;
    this.errorMsg = '';
    this.saleService.cancel(this.data.saleId, this.pin, this.reason).subscribe({
      next: () => this.dialogRef.close('cancelled'),
      error: err => {
        this.loading = false;
        this.errorMsg = err.error?.message || 'Cancellation failed';
        this.pin = '';
      }
    });
  }
}
