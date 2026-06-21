import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { CashService } from '../../../../core/services/session.service';

const OUT_REASONS = [
  { value: 'CHARITY',      label: 'Charity' },
  { value: 'SHOP_EXPENSE', label: 'Shop Expense' },
  { value: 'TRANSPORT',    label: 'Transport' },
  { value: 'CLEANING',     label: 'Cleaning' },
  { value: 'FOOD',         label: 'Food' },
  { value: 'SUPPLIER',     label: 'Supplier Payment' },
  { value: 'OTHER',        label: 'Other' },
];

const IN_REASONS = [
  { value: 'FLOAT_ADD', label: 'Float Top-up' },
  { value: 'OTHER',     label: 'Other' },
];

@Component({
  selector: 'app-cash-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatProgressSpinnerModule, MatIconModule],
  template: `
    <div class="cash-wrap">
      <div class="cash-header" [class.out]="isCashOut">
        <mat-icon>{{ isCashOut ? 'arrow_upward' : 'arrow_downward' }}</mat-icon>
        <h2>{{ isCashOut ? 'Cash Out' : 'Cash In' }}</h2>
      </div>

      <mat-dialog-content>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Amount (LKR) *</mat-label>
          <input matInput type="number" [(ngModel)]="amount" min="1" placeholder="Enter amount" />
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Reason *</mat-label>
          <mat-select [(ngModel)]="reason">
            @for (r of reasons; track r.value) {
              <mat-option [value]="r.value">{{ r.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Notes (optional)</mat-label>
          <input matInput [(ngModel)]="notes" placeholder="e.g. paid to Ahmad for delivery" />
        </mat-form-field>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button (click)="dialogRef.close()">CANCEL</button>
        <button mat-flat-button [class]="isCashOut ? 'out-btn' : 'in-btn'"
          (click)="confirm()" [disabled]="!amount || amount <= 0 || !reason || loading">
          @if (loading) { <mat-spinner diameter="18" /> }
          @else { CONFIRM {{ isCashOut ? 'CASH OUT' : 'CASH IN' }} }
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .cash-wrap { min-width: 360px; }
    .cash-header {
      display: flex; align-items: center; gap: 10px;
      padding: 16px 24px 8px;
      background: #e8f5e9; color: #2e7d32;
    }
    .cash-header.out { background: #fdecea; color: #c62828; }
    .cash-header h2 { font-size: 18px; font-weight: 700; margin: 0; }
    .cash-header mat-icon { font-size: 22px; width: 22px; height: 22px; }
    mat-dialog-content { padding: 12px 24px 4px; }
    .full-width { width: 100%; }
    mat-dialog-actions { padding: 8px 24px 16px; }
    .out-btn { background: #c62828 !important; color: #fff !important; }
    .in-btn  { background: #2e7d32 !important; color: #fff !important; }
  `]
})
export class CashDialogComponent {
  dialogRef = inject(MatDialogRef<CashDialogComponent>);
  data: { type: 'IN' | 'OUT'; sessionId: number } = inject(MAT_DIALOG_DATA);
  private cashService = inject(CashService);

  get isCashOut() { return this.data.type === 'OUT'; }
  reasons = this.isCashOut ? OUT_REASONS : IN_REASONS;

  amount: number | null = null;
  reason = '';
  notes = '';
  loading = false;

  confirm() {
    if (!this.amount) return;
    this.loading = true;
    const obs = this.isCashOut
      ? this.cashService.cashOut(this.data.sessionId, this.amount, this.reason, this.notes)
      : this.cashService.cashIn(this.data.sessionId, this.amount, this.reason, this.notes);

    obs.subscribe({
      next: () => this.dialogRef.close(true),
      error: () => { this.loading = false; }
    });
  }
}
