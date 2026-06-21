import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { StockService } from '../../../core/services/stock.service';
import { StockRequestService } from '../../../core/services/stock.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-stock-adjust',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatProgressSpinnerModule, MatIconModule],
  template: `
    @if (isOwner) {
      <!-- OWNER: direct stock adjustment -->
      <div class="dlg-role-badge owner"><mat-icon>admin_panel_settings</mat-icon> Owner — Direct Adjustment</div>
      <h2 mat-dialog-title>Adjust Stock — {{ data.product.name }}</h2>
      <mat-dialog-content>
        <p class="current">Current SHOP stock: <strong>{{ data.product.stockQuantity }} {{ data.product.unit }}</strong></p>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>New Quantity</mat-label>
          <input matInput type="number" [(ngModel)]="newQty" min="0" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Reason</mat-label>
          <mat-select [(ngModel)]="reason">
            <mat-option value="INITIAL_ENTRY">Initial Entry</mat-option>
            <mat-option value="CORRECTION">Correction</mat-option>
            <mat-option value="DAMAGE">Damage</mat-option>
            <mat-option value="FOUND">Stock Found</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Notes</mat-label>
          <input matInput [(ngModel)]="notes" />
        </mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button (click)="dialogRef.close()">CANCEL</button>
        <button mat-flat-button class="save-btn" (click)="ownerAdjust()" [disabled]="loading">
          @if (loading) { <mat-spinner diameter="18" /> } @else { ADJUST }
        </button>
      </mat-dialog-actions>
    }

    @if (!isOwner) {
      <!-- CASHIER: submit request to owner -->
      <div class="dlg-role-badge cashier"><mat-icon>send</mat-icon> Request Stock Change</div>
      <h2 mat-dialog-title>Request Stock Change — {{ data.product.name }}</h2>
      <mat-dialog-content>
        <div class="info-box">
          <mat-icon>info</mat-icon>
          <span>You cannot adjust stock directly. This will send a request to the owner for approval.</span>
        </div>
        <p class="current">Current SHOP stock: <strong>{{ data.product.stockQuantity }} {{ data.product.unit }}</strong></p>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Requested New Quantity</mat-label>
          <input matInput type="number" [(ngModel)]="newQty" min="0" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Reason</mat-label>
          <mat-select [(ngModel)]="reason">
            <mat-option value="CORRECTION">Correction</mat-option>
            <mat-option value="DAMAGE">Damage</mat-option>
            <mat-option value="FOUND">Stock Found</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Notes (optional)</mat-label>
          <input matInput [(ngModel)]="notes" placeholder="Explain why you are requesting this change" />
        </mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button (click)="dialogRef.close()">CANCEL</button>
        <button mat-flat-button class="save-btn" (click)="cashierRequest()" [disabled]="loading || newQty == null">
          @if (loading) { <mat-spinner diameter="18" /> } @else { <mat-icon>send</mat-icon> SEND REQUEST }
        </button>
      </mat-dialog-actions>
    }
  `,
  styles: [`
    h2 { padding: 4px 24px 0; font-size: 15px; }
    mat-dialog-content { padding: 8px 24px; }
    .current { margin-bottom: 12px; color: #555; font-size: 14px; }
    .full-width { width: 100%; }
    .save-btn { background: #1b3050 !important; color: #fff !important; }
    .dlg-role-badge {
      display: flex; align-items: center; gap: 6px;
      padding: 8px 24px; font-size: 12px; font-weight: 600;
    }
    .dlg-role-badge mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .dlg-role-badge.owner { background: #e8f5e9; color: #2e7d32; }
    .dlg-role-badge.cashier { background: #e3f2fd; color: #1565c0; }
    .info-box {
      display: flex; align-items: flex-start; gap: 8px;
      background: #fff8e1; border-radius: 8px; padding: 10px 12px;
      font-size: 13px; color: #795548; margin-bottom: 14px;
    }
    .info-box mat-icon { font-size: 18px; width: 18px; height: 18px; flex-shrink: 0; margin-top: 1px; }
  `]
})
export class StockAdjustComponent {
  dialogRef = inject(MatDialogRef<StockAdjustComponent>);
  data: any = inject(MAT_DIALOG_DATA);
  private stockService = inject(StockService);
  private stockRequestService = inject(StockRequestService);
  private authService = inject(AuthService);

  isOwner = this.authService.isOwner();
  newQty = this.data.product.stockQuantity;
  reason = 'CORRECTION';
  notes = '';
  loading = false;

  ownerAdjust() {
    this.loading = true;
    this.stockService.adjust(this.data.product.id, this.newQty, this.reason, this.notes).subscribe({
      next: () => this.dialogRef.close({ type: 'adjusted' }),
      error: () => { this.loading = false; }
    });
  }

  cashierRequest() {
    this.loading = true;
    this.stockRequestService.submit({
      productId: this.data.product.id,
      productName: this.data.product.name,
      currentQty: this.data.product.stockQuantity,
      requestedQty: this.newQty,
      reason: this.reason,
      notes: this.notes
    }).subscribe({
      next: () => this.dialogRef.close({ type: 'requested' }),
      error: () => { this.loading = false; }
    });
  }
}
