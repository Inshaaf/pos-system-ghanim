import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HeldSaleService } from '../../../../core/services/sale.service';
import { HeldSale } from '../../../../core/models/sale.model';

@Component({
  selector: 'app-held-sales-dialog',
  standalone: true,
  imports: [CommonModule, DatePipe, MatDialogModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <h2 mat-dialog-title>HELD SALES</h2>
    <mat-dialog-content>
      @if (loading) {
        <div class="center"><mat-spinner diameter="32" /></div>
      } @else if (heldSales.length === 0) {
        <p class="empty">No held sales</p>
      } @else {
        @for (sale of heldSales; track sale.id) {
          <div class="held-item">
            <div class="held-info">
              <div class="held-note">{{ sale.note || 'No note' }}</div>
              <div class="held-meta">
                {{ sale.saleType }} · {{ sale.createdAt | date:'HH:mm' }}
                @if (sale.customerName) { · {{ sale.customerName }} }
              </div>
            </div>
            <button mat-stroked-button class="resume-btn" (click)="resume(sale)">Resume</button>
          </div>
        }
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close()">CLOSE</button>
    </mat-dialog-actions>
  `,
  styles: [`
    h2 { padding: 16px 24px 0; }
    mat-dialog-content { padding: 8px 24px; min-width: 380px; }
    .center { display: flex; justify-content: center; padding: 20px; }
    .empty { color: #aaa; text-align: center; padding: 20px; }
    .held-item {
      display: flex; align-items: center; justify-content: space-between;
      padding: 12px; border: 1px solid #eee; border-radius: 8px; margin-bottom: 8px;
    }
    .held-note { font-weight: 600; font-size: 14px; margin-bottom: 4px; }
    .held-meta { font-size: 12px; color: #888; }
    .resume-btn { color: #1b3050 !important; border-color: #1b3050 !important; }
  `]
})
export class HeldSalesDialogComponent implements OnInit {
  dialogRef = inject(MatDialogRef<HeldSalesDialogComponent>);
  data: any = inject(MAT_DIALOG_DATA);
  private heldSaleService = inject(HeldSaleService);

  heldSales: HeldSale[] = [];
  loading = true;

  ngOnInit() {
    this.heldSaleService.getBySession(this.data.sessionId).subscribe({
      next: sales => { this.heldSales = sales; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  resume(sale: HeldSale) { this.dialogRef.close(sale); }
}


