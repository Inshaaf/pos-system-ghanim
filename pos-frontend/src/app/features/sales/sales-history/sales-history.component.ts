import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SaleService, QuickSaleService } from '../../../core/services/sale.service';
import { SaleDetailDialogComponent } from '../sale-detail-dialog/sale-detail-dialog.component';

@Component({
  selector: 'app-sales-history',
  standalone: true,
  imports: [
    CommonModule, DatePipe, FormsModule, MatCardModule, MatButtonModule,
    MatIconModule, MatTableModule, MatTabsModule, MatFormFieldModule, MatInputModule,
    MatProgressSpinnerModule, MatDialogModule, MatSnackBarModule
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">Sales History</h1>
          <p class="page-sub">{{ selectedDate }}</p>
        </div>
        <div class="header-actions">
          <input type="date" [(ngModel)]="selectedDate" (change)="load()" class="date-input" />
        </div>
      </div>

      <mat-tab-group animationDuration="150ms" class="sales-tabs">

        <!-- Regular Sales -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon class="tab-icon">receipt_long</mat-icon>
            Sales <span class="tab-count">{{ sales.length }}</span>
          </ng-template>
          <mat-card class="tab-card">
            @if (loading) {
              <div class="empty-state"><mat-spinner diameter="32" /></div>
            } @else if (sales.length === 0) {
              <div class="empty-state">No sales for this date</div>
            } @else {
              <div class="sales-total-bar">
                <span>{{ sales.length }} sale(s)</span>
                <span class="total-sum">Total: LKR {{ salesTotal | number:'1.2-2' }}</span>
              </div>
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
        </mat-tab>

        <!-- Quick Sales -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon class="tab-icon">bolt</mat-icon>
            Quick Sales <span class="tab-count qs">{{ quickSales.length }}</span>
          </ng-template>
          <mat-card class="tab-card">
            @if (qsLoading) {
              <div class="empty-state"><mat-spinner diameter="32" /></div>
            } @else if (quickSales.length === 0) {
              <div class="empty-state">No quick sales for this date</div>
            } @else {
              <div class="sales-total-bar">
                <span>{{ quickSales.length }} quick sale(s)</span>
                <span class="total-sum qs">Total: LKR {{ quickSalesTotal | number:'1.2-2' }}</span>
              </div>
              @for (qs of quickSales; track qs.id) {
                <div class="sale-row qs-row" (click)="viewQuickSale(qs)">
                  <div class="sale-id">#{{ qs.id }}</div>
                  <div class="sale-info">
                    <span class="sale-type quick-sale-badge">QUICK SALE</span>
                    <span class="sale-sp">{{ qs.salesperson?.name }}</span>
                    @if (qs.notes) { <span class="cust">· {{ qs.notes }}</span> }
                  </div>
                  <div class="sale-method">{{ qs.paymentMethod }}</div>
                  <div class="sale-total">LKR {{ qs.total | number:'1.2-2' }}</div>
                  <div class="sale-status completed">DONE</div>
                  <div class="sale-time">{{ qs.createdAt | date:'HH:mm' }}</div>
                </div>
              }
            }
          </mat-card>
        </mat-tab>

      </mat-tab-group>
    </div>
  `,
  styles: [`
    .page-container { padding: 24px; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
    .page-title { font-size: 22px; font-weight: 700; color: #1b3050; margin: 0; }
    .page-sub { color: #888; font-size: 13px; margin: 4px 0 0; }
    .header-actions { display: flex; gap: 12px; align-items: center; }
    .date-input { border: 1px solid #ddd; border-radius: 6px; padding: 8px 12px; font-family: 'Inter', sans-serif; font-size: 14px; }

    .sales-tabs { }
    .tab-icon { font-size: 16px; width: 16px; height: 16px; margin-right: 6px; vertical-align: middle; }
    .tab-count { display: inline-block; background: #e3f2fd; color: #1565c0; border-radius: 10px; font-size: 11px; font-weight: 700; padding: 1px 7px; margin-left: 6px; }
    .tab-count.qs { background: #fff3e0; color: #e65100; }
    .tab-card { margin-top: 12px; padding: 0 !important; overflow: hidden; }

    .sales-total-bar { display: flex; justify-content: space-between; align-items: center; padding: 10px 16px; background: #f8faff; border-bottom: 1px solid #eef0f4; font-size: 13px; color: #6b7280; }
    .total-sum { font-weight: 700; color: #1b3050; }
    .total-sum.qs { color: #e65100; }

    .empty-state { padding: 48px; text-align: center; color: #aaa; display: flex; justify-content: center; }
    .sale-row {
      display: flex; align-items: center; gap: 16px;
      padding: 12px 16px; border-bottom: 1px solid #f0f0f0;
      cursor: pointer; transition: background 0.1s;
    }
    .sale-row:hover { background: #f9f9f9; }
    .sale-row.qs-row:hover { background: #fff8f0; }
    .sale-id { font-weight: 700; color: #1b3050; min-width: 50px; }
    .sale-info { flex: 1; display: flex; gap: 8px; align-items: center; font-size: 13px; color: #555; flex-wrap: wrap; }
    .sale-type { padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 600; }
    .sale-type.retail { background: #e3f2fd; color: #1565c0; }
    .sale-type.wholesale { background: #f3e5f5; color: #6a1b9a; }
    .quick-sale-badge { background: #fff3e0; color: #e65100; padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 600; }
    .cust { color: #888; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px; }
    .sale-sp { font-weight: 500; }
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
  private quickSaleService = inject(QuickSaleService);
  private dialog = inject(MatDialog);
  private snack = inject(MatSnackBar);

  sales: any[] = [];
  quickSales: any[] = [];
  loading = false;
  qsLoading = false;
  selectedDate = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; })();

  get salesTotal(): number {
    return this.sales.reduce((s, x) => s + (x.total ?? 0), 0);
  }

  get quickSalesTotal(): number {
    return this.quickSales.reduce((s, x) => s + (x.total ?? 0), 0);
  }

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.qsLoading = true;
    this.saleService.getByDate(this.selectedDate).subscribe({
      next: data => { this.sales = data; this.loading = false; },
      error: () => { this.loading = false; }
    });
    this.quickSaleService.getByDate(this.selectedDate).subscribe({
      next: data => { this.quickSales = data; this.qsLoading = false; },
      error: () => { this.qsLoading = false; }
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

  viewQuickSale(qs: any) {
    this.quickSaleService.getById(qs.id).subscribe(detail => {
      this.dialog.open(SaleDetailDialogComponent, {
        width: '520px',
        data: { sale: detail, isQuickSale: true }
      });
    });
  }
}
