import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HeldSaleService } from '../../../../core/services/sale.service';

@Component({
  selector: 'app-hold-sale-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatProgressSpinnerModule],
  template: `
    <h2 mat-dialog-title>HOLD SALE</h2>
    <mat-dialog-content>
      <p class="hint">Current cart will be saved. You can resume it later.</p>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Note (optional)</mat-label>
        <input matInput [(ngModel)]="note" placeholder="e.g. Customer checking wallet" />
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close()">CANCEL</button>
      <button mat-flat-button class="hold-btn" (click)="hold()" [disabled]="loading">
        @if (loading) { <mat-spinner diameter="18" /> } @else { HOLD SALE }
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    h2 { padding: 16px 24px 0; }
    mat-dialog-content { padding: 8px 24px 0; }
    .hint { color: #777; font-size: 13px; margin-bottom: 12px; }
    .full-width { width: 100%; }
    .hold-btn { background: #1b3050 !important; color: #fff !important; }
  `]
})
export class HoldSaleDialogComponent {
  dialogRef = inject(MatDialogRef<HoldSaleDialogComponent>);
  data: any = inject(MAT_DIALOG_DATA);
  private heldSaleService = inject(HeldSaleService);

  note = '';
  loading = false;

  hold() {
    this.loading = true;
    this.heldSaleService.hold({
      sessionId: this.data.sessionId,
      salespersonId: this.data.salespersonId,
      saleType: this.data.saleType,
      items: JSON.stringify(this.data.cart),
      note: this.note || undefined
    }).subscribe({
      next: result => this.dialogRef.close(result),
      error: () => { this.loading = false; }
    });
  }
}


