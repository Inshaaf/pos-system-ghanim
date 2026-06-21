import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SaleService } from '../../../core/services/sale.service';
import { SaleDetailDialogComponent } from '../sale-detail-dialog/sale-detail-dialog.component';

@Component({
  selector: 'app-sales-history',
  standalone: true,
  imports: [
    CommonModule, DatePipe, FormsModule, MatCardModule, MatButtonModule,
    MatIconModule, MatTableModule, MatFormFieldModule, MatInputModule,
    MatProgressSpinnerModule, MatDialogModule, MatSnackBarModule
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">Sales History</h1>
          <p class="page-sub">{{ sales.length }} sale(s) on this date</p>
        </div>
        <div class="header-actions">
          <input type="date" [(ngModel)]="selectedDate" (change)="load()" class="date-input" />
        </div>
      </div>

      <mat-card>
        @if (loading) {
          <div class="empty-state"><mat-spinner diameter="32" /></div>
        } @else if (sales.length === 0) {
          <div class="empty-state">No sales for this date</div>
        } @else {
          @for (sale of sales; track sale.id) {
            <div class="sale-row" (click)="viewSale(sale)">
              <div class="sale-id">#{{ sale.id }}</div>
              <div class="sale-info">
                <span class="sale-type" [class]="sale.saleType?.toLowerCase()">{{ sale.saleType }}</span>
                <span class="sale-sp">{{ sale.salesperson?.name }}</span>
                @if (sale.customerName) { <span class="cust">· {{ sale.customerName }}</span> }
              </div>
              <div class="sale-method">{{ sale.paymentMethod }}</div>
              <div class="sale-total">LKR {{ sale.total | number:'1.2-2' }}</div>
              <div class="sale-status" [class]="sale.status?.toLowerCase()">{{ sale.status }}</div>
              <div class="sale-time">{{ sale.createdAt | date:'HH:mm' }}</div>
            </div>
          }
        }
      </mat-card>
    </div>
  `,
  styles: [`
    .page-container { padding: 24px; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
    .page-title { font-size: 22px; font-weight: 700; color: #1b3050; margin: 0; }
    .page-sub { color: #888; font-size: 13px; margin: 4px 0 0; }
    .header-actions { display: flex; gap: 12px; align-items: center; }
    .date-input { border: 1px solid #ddd; border-radius: 6px; padding: 8px 12px; font-family: 'Inter', sans-serif; font-size: 14px; }
    .empty-state { padding: 48px; text-align: center; color: #aaa; display: flex; justify-content: center; }
    .sale-row {
      display: flex; align-items: center; gap: 16px;
      padding: 12px 16px; border-bottom: 1px solid #f0f0f0;
      cursor: pointer; transition: background 0.1s;
    }
    .sale-row:hover { background: #f9f9f9; }
    .sale-id { font-weight: 700; color: #1b3050; min-width: 50px; }
    .sale-info { flex: 1; display: flex; gap: 8px; align-items: center; font-size: 13px; color: #555; }
    .sale-type { padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 600; }
    .sale-type.retail { background: #e3f2fd; color: #1565c0; }
    .sale-type.wholesale { background: #f3e5f5; color: #6a1b9a; }
    .cust { color: #888; }
    .sale-method { color: #888; font-size: 13px; min-width: 60px; }
    .sale-total { font-weight: 700; font-size: 15px; min-width: 110px; text-align: right; }
    .sale-status { font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 10px; min-width: 80px; text-align: center; }
    .sale-status.completed { background: #e8f5e9; color: #2e7d32; }
    .sale-status.credit { background: #fff8e1; color: #f57f17; }
    .sale-status.cancelled { background: #fdecea; color: #c62828; }
    .sale-time { color: #aaa; font-size: 12px; min-width: 40px; }
  `]
})
export class SalesHistoryComponent implements OnInit {
  private saleService = inject(SaleService);
  private dialog = inject(MatDialog);
  private snack = inject(MatSnackBar);

  sales: any[] = [];
  loading = false;
  selectedDate = new Date().toISOString().split('T')[0];

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.saleService.getByDate(this.selectedDate).subscribe({
      next: data => { this.sales = data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  viewSale(sale: any) {
    this.saleService.getById(sale.id).subscribe(detail => {
      this.dialog.open(SaleDetailDialogComponent, {
        width: '520px',
        data: { sale: detail }
      }).afterClosed().subscribe(action => {
        if (action === 'cancelled') {
          this.snack.open('Sale cancelled', '', { duration: 2000 });
          this.load();
        }
      });
    });
  }
}


