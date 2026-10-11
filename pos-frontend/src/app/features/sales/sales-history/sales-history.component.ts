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
import { MatDialogModule, MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SaleService, QuickSaleService, SaleCancellationRequestService } from '../../../core/services/sale.service';
import { SalespersonService } from '../../../core/services/product.service';
import { AuthService } from '../../../core/services/auth.service';
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
          <select [(ngModel)]="selectedSalespersonId" class="worker-select" aria-label="Filter sales by worker">
            <option [ngValue]="null">All workers</option>
            @for (worker of workers; track worker.id) {
              <option [ngValue]="worker.id">{{ worker.name }}</option>
            }
          </select>
          <input type="date" [(ngModel)]="selectedDate" (change)="load()" class="date-input" />
          <button type="button" class="book-check-btn" (click)="openBookCheck()">
            <mat-icon>view_column</mat-icon> Book Check
          </button>
        </div>
      </div>

      @if (isOwner && cancellationRequests.length) {
        <mat-card class="cancellation-requests-card">
          <div class="cancellation-requests-heading">
            <div>
              <h2>Cancellation requests</h2>
              <p>{{ cancellationRequests.length }} awaiting your review</p>
            </div>
            <mat-icon>notification_important</mat-icon>
          </div>
          @for (request of cancellationRequests; track request.id) {
            <div class="cancellation-request-row">
              <div class="cancellation-request-info">
                <strong>{{ request.saleType === 'QUICK_SALE' ? 'Quick sale' : 'Sale' }} #{{ request.saleId }}</strong>
                <span>{{ request.salesperson }} · {{ request.createdAt | date:'dd/MM/yyyy HH:mm':'+0530' }} · LKR {{ request.total | number:'1.2-2' }}</span>
                <span>Requested by {{ request.requestedBy }}: {{ request.reason }}</span>
              </div>
              <div class="cancellation-request-actions">
                <button mat-stroked-button (click)="reviewCancellationRequest(request, false)"
                  [disabled]="reviewingRequestId === request.id">Reject</button>
                <button mat-flat-button color="warn" (click)="reviewCancellationRequest(request, true)"
                  [disabled]="reviewingRequestId === request.id">
                  @if (reviewingRequestId === request.id) { <mat-spinner diameter="16" /> } @else { Approve & cancel }
                </button>
              </div>
            </div>
          }
        </mat-card>
      }

      @if (isOwner) {
        <section class="combined-total-card" aria-label="Combined sales total">
          <div class="combined-total-main">
            <span class="combined-total-label">Total sales</span>
            @if (loading || qsLoading) {
              <span class="combined-total-loading">Updating totals…</span>
            } @else {
              <strong>LKR {{ combinedSalesTotal | number:'1.2-2' }}</strong>
            }
            <span class="combined-total-caption">Sales and Quick Sales · {{ selectedDate }}</span>
          </div>
          <div class="combined-total-breakdown" [class.is-loading]="loading || qsLoading">
            <div><span>Sales</span><strong>LKR {{ salesTotal | number:'1.2-2' }}</strong></div>
            <div><span>Quick Sales</span><strong>LKR {{ quickSalesTotal | number:'1.2-2' }}</strong></div>
          </div>
        </section>
      }

      <mat-tab-group animationDuration="150ms" class="sales-tabs">

        <!-- Regular Sales -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon class="tab-icon">receipt_long</mat-icon>
            Sales <span class="tab-count">{{ activeSales.length }}</span>
          </ng-template>
          <mat-card class="tab-card">
            @if (loading) {
              <div class="empty-state"><mat-spinner diameter="32" /></div>
            } @else if (filteredSales.length === 0) {
              <div class="empty-state">No sales for this date</div>
            } @else {
              @if (showTotals) {
                <div class="sales-total-bar">
                  <span>{{ activeSales.length }} sale(s)</span>
                  <span class="total-sum">Total: LKR {{ salesTotal | number:'1.2-2' }}</span>
                </div>
              }
              @for (sale of filteredSales; track sale.id) {
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
                  <div class="sale-time">{{ sale.createdAt | date:'HH:mm':'+0530' }}</div>
                </div>
              }
            }
          </mat-card>
        </mat-tab>

        <!-- Quick Sales -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon class="tab-icon">bolt</mat-icon>
            Quick Sales <span class="tab-count qs">{{ filteredQuickSales.length }}</span>
          </ng-template>
          <mat-card class="tab-card">
            @if (qsLoading) {
              <div class="empty-state"><mat-spinner diameter="32" /></div>
            } @else if (filteredQuickSales.length === 0) {
              <div class="empty-state">No quick sales for this date</div>
            } @else {
              @if (showTotals) {
                <div class="sales-total-bar">
                  <span>{{ filteredQuickSales.length }} quick sale(s)</span>
                  <span class="total-sum qs">Total: LKR {{ quickSalesTotal | number:'1.2-2' }}</span>
                </div>
              }
              @for (qs of filteredQuickSales; track qs.id) {
                <div class="sale-row qs-row" (click)="viewQuickSale(qs)">
                  <div class="sale-id">#{{ qs.id }}</div>
                  <div class="sale-info">
                    <span class="sale-type quick-sale-badge">QUICK SALE</span>
                    <span class="sale-sp">{{ qs.salesperson?.name }}</span>
                    @if (qs.notes) { <span class="cust">· {{ qs.notes }}</span> }
                  </div>
                  <div class="sale-method">{{ qs.paymentMethod }}</div>
                  <div class="sale-total">LKR {{ qs.total | number:'1.2-2' }}</div>
                  <div class="sale-status" [class.completed]="qs.status !== 'CANCELLED'" [class.cancelled]="qs.status === 'CANCELLED'">
                    {{ qs.status === 'CANCELLED' ? 'CANCELLED' : 'DONE' }}
                  </div>
                  <div class="sale-time">{{ qs.createdAt | date:'HH:mm':'+0530' }}</div>
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
    .cancellation-requests-card { margin: 0 0 16px; padding: 16px 18px !important; border: 1px solid #f0d5ba; background: #fffaf5; }
    .cancellation-requests-heading { display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; }
    .cancellation-requests-heading h2 { margin:0; color:#8b4513; font-size:16px; font-weight:700; }
    .cancellation-requests-heading p { margin:3px 0 0; color:#98745d; font-size:12px; }
    .cancellation-requests-heading mat-icon { color:#b66a28; }
    .cancellation-request-row { display:flex; align-items:center; justify-content:space-between; gap:16px; border-top:1px solid #f2e5d8; padding:12px 0; }
    .cancellation-request-info { display:flex; flex-direction:column; gap:3px; min-width:0; }
    .cancellation-request-info strong { color:#273b53; font-size:13px; }
    .cancellation-request-info span { color:#6b7280; font-size:12px; overflow-wrap:anywhere; }
    .cancellation-request-actions { display:flex; gap:8px; flex-shrink:0; }
    .header-actions { display: flex; gap: 12px; align-items: center; }
    .date-input { border: 1px solid #ddd; border-radius: 6px; padding: 8px 12px; font-family: 'Inter', sans-serif; font-size: 14px; }
    .worker-select { border: 1px solid #ddd; border-radius: 6px; padding: 8px 12px; font-family: 'Inter', sans-serif; font-size: 14px; background: #fff; min-width: 170px; }
    .combined-total-card { display:flex; justify-content:space-between; align-items:center; gap:20px; margin:0 0 16px; padding:17px 20px; border:1px solid #dce6f0; border-radius:12px; background:linear-gradient(110deg,#f5f9ff,#fff); box-shadow:0 3px 14px rgba(27,48,80,.045); }
    .combined-total-main { display:flex; flex-direction:column; gap:3px; }
    .combined-total-label { color:#64758a; font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:.45px; }
    .combined-total-main strong { color:#1b3050; font-size:25px; line-height:1.2; }
    .combined-total-caption { color:#8995a3; font-size:11px; }
    .combined-total-loading { color:#64758a; font-size:18px; font-weight:650; }
    .combined-total-breakdown { display:flex; gap:24px; }
    .combined-total-breakdown div { display:flex; flex-direction:column; gap:4px; min-width:125px; }
    .combined-total-breakdown span { color:#8995a3; font-size:11px; }
    .combined-total-breakdown strong { color:#344a63; font-size:14px; }
    .combined-total-breakdown.is-loading { opacity:.45; }

    .book-check-btn { display:flex; align-items:center; justify-content:center; gap:6px; height:38px; border:1px solid #d8e0e9; border-radius:7px; padding:0 12px; background:#fff; color:#385976; font-family:inherit; font-size:13px; font-weight:650; cursor:pointer; white-space:nowrap; }
    .book-check-btn:hover { border-color:#1b4c7e; background:#eef5fc; color:#1b4c7e; }
    .book-check-btn mat-icon { font-size:18px; width:18px; height:18px; }

    @media (max-width: 700px) {
      .cancellation-request-row { align-items:stretch; flex-direction:column; }
      .cancellation-request-actions { justify-content:flex-end; }
    }

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

    @media (max-width: 767px) {
      .page-container { padding: 16px; }
      .page-header { flex-direction: column; gap: 10px; }
      .header-actions { flex-wrap: wrap; }
      .header-actions { width:100%; }
      .date-input { min-width:0; flex:1; }
      .book-check-btn { flex:none; }
      .combined-total-card { align-items:flex-start; flex-direction:column; gap:12px; padding:15px 16px; }
      .combined-total-breakdown { width:100%; justify-content:space-between; gap:12px; }
      .combined-total-breakdown div { min-width:0; }
      .combined-total-main strong { font-size:22px; }
      .sale-row { flex-wrap: wrap; gap: 6px; padding: 10px 12px; }
      .sale-id { min-width: 0; font-size: 12px; }
      .sale-info { font-size: 12px; }
      .sale-method { display: none; }
      .sale-total { min-width: 0; font-size: 13px; text-align: left; flex: 1; }
      .sale-time { min-width: 0; font-size: 11px; }
      .sale-status { min-width: 0; font-size: 10px; padding: 2px 6px; }
      .cust { max-width: 120px; }
    }
  `]
})
export class SalesHistoryComponent implements OnInit {
  private saleService = inject(SaleService);
  private quickSaleService = inject(QuickSaleService);
  private dialog = inject(MatDialog);
  private snack = inject(MatSnackBar);
  private salespersonService = inject(SalespersonService);
  private auth = inject(AuthService);
  private cancellationRequestService = inject(SaleCancellationRequestService);

  sales: any[] = [];
  quickSales: any[] = [];
  workers: { id: number; name: string }[] = [];
  selectedSalespersonId: number | null = null;
  loading = false;
  qsLoading = false;
  cancellationRequests: any[] = [];
  reviewingRequestId: number | null = null;
  selectedDate = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; })();

  get isOwner(): boolean { return this.auth.isOwner(); }
  get showTotals(): boolean { return this.isOwner; }
  get filteredSales(): any[] {
    if (this.selectedSalespersonId === null) return this.sales;
    return this.sales.filter(s => s.salesperson?.id === this.selectedSalespersonId || s.salespersonId === this.selectedSalespersonId);
  }
  get activeSales(): any[] {
    return this.filteredSales.filter(s => s.status?.toUpperCase() !== 'CANCELLED');
  }
  get filteredQuickSales(): any[] {
    if (this.selectedSalespersonId === null) return this.quickSales;
    return this.quickSales.filter(s => s.salesperson?.id === this.selectedSalespersonId || s.salespersonId === this.selectedSalespersonId);
  }

  get salesTotal(): number {
    return this.activeSales.reduce((s, x) => s + (x.total ?? 0), 0);
  }

  get quickSalesTotal(): number {
    return this.filteredQuickSales.filter(sale => sale.status !== 'CANCELLED')
      .reduce((sum, sale) => sum + (sale.total ?? 0), 0);
  }

  get combinedSalesTotal(): number {
    return this.salesTotal + this.quickSalesTotal;
  }

  ngOnInit() {
    this.salespersonService.getAll().subscribe({ next: workers => this.workers = workers.filter(w => w.active), error: () => this.workers = [] });
    if (this.isOwner) this.loadCancellationRequests();
    this.load();
  }

  loadCancellationRequests() {
    this.cancellationRequestService.getPending().subscribe({
      next: requests => this.cancellationRequests = requests,
      error: () => this.cancellationRequests = []
    });
  }

  reviewCancellationRequest(request: any, approve: boolean) {
    this.reviewingRequestId = request.id;
    const review = approve
      ? this.cancellationRequestService.approve(request.id)
      : this.cancellationRequestService.reject(request.id);
    review.subscribe({
      next: () => {
        this.reviewingRequestId = null;
        this.snack.open(approve ? 'Sale cancelled and stock restored' : 'Cancellation request rejected', '', { duration: 2500 });
        this.loadCancellationRequests();
        if (approve) this.load();
      },
      error: err => {
        this.reviewingRequestId = null;
        this.snack.open(err?.error?.message || 'Could not review cancellation request', 'OK', { duration: 3500 });
        this.loadCancellationRequests();
      }
    });
  }

  openBookCheck() {
    const historyLoaded = !this.loading && !this.qsLoading;
    this.dialog.open(BookCheckDialogComponent, {
      width: '1100px',
      maxWidth: '96vw',
      data: {
        date: this.selectedDate,
        sales: historyLoaded ? this.sales : undefined,
        quickSales: historyLoaded ? this.quickSales : undefined
      }
    });
  }

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
      }).afterClosed().subscribe(action => {
        if (action === 'cancelled') {
          this.snack.open('Quick sale cancelled', '', { duration: 2000 });
          this.load();
        }
      });
    });
  }
}

interface BookCheckEntry {
  id: number;
  salespersonId: number | null;
  salespersonName: string;
  createdAt: string;
  total: number;
  status: string;
  saleType: string;
  quickSale: boolean;
}

interface BookCheckWorker { id: number | null; name: string; }

@Component({
  selector: 'app-book-check-dialog',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule, MatButtonModule, MatDialogModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="book-check-dialog">
      <header class="dialog-header">
        <div>
          <h2>Sales book check</h2>
          <p>Normal and quick sales combined in chronological order</p>
        </div>
        <div class="header-actions">
          <label class="date-field">Date
            <input type="date" [(ngModel)]="selectedDate" (change)="load()" aria-label="Book check date" />
          </label>
          <button mat-icon-button type="button" aria-label="Close book check" (click)="close()">
            <mat-icon>close</mat-icon>
          </button>
        </div>
      </header>

      <section class="dialog-content">
        <div *ngIf="salesLoading || quickSalesLoading" class="loading-state"><mat-spinner diameter="30"></mat-spinner> Loading sales…</div>
        <div *ngIf="!salesLoading && !quickSalesLoading && !bookCheckWorkers.length" class="empty-state">
          No salespersons or sales found for this date.
        </div>
        <div *ngIf="!salesLoading && !quickSalesLoading && bookCheckWorkers.length" class="worker-columns">
          <article class="worker-column" *ngFor="let worker of bookCheckWorkers; trackBy: trackWorker">
            <header class="worker-header">
              <h3>{{ worker.name }}</h3>
              <ng-container *ngIf="isOwner">
                <span class="total-label">Total sales</span>
                <strong class="worker-total">LKR {{ workerTotal(worker.id) | number:'1.2-2' }}</strong>
              </ng-container>
            </header>
            <div class="worker-entries">
              <div *ngFor="let entry of entriesFor(worker.id); let i = index; trackBy: trackEntry"
                   class="sale-entry" [class.cancelled-entry]="entry.status.toUpperCase() === 'CANCELLED'">
                <div class="entry-info">
                  <span class="entry-number">#{{ i + 1 }}</span>
                  <span class="entry-kind">{{ entry.quickSale ? 'QUICK SALE' : entry.saleType }}</span>
                  <span *ngIf="entry.status.toUpperCase() === 'CANCELLED'" class="cancelled-label">CANCELLED</span>
                </div>
                <strong class="entry-amount">LKR {{ entry.total | number:'1.2-2' }}</strong>
              </div>
              <div *ngIf="!entriesFor(worker.id).length" class="worker-empty">No sales</div>
            </div>
          </article>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .book-check-dialog { color:#1b3050; }
    .dialog-header { display:flex; justify-content:space-between; align-items:center; gap:16px; padding:18px 22px 14px; border-bottom:1px solid #edf0f4; }
    .dialog-header h2 { margin:0; font-size:18px; font-weight:750; }
    .dialog-header p { margin:4px 0 0; color:#8995a3; font-size:12px; }
    .header-actions { display:flex; align-items:center; gap:10px; }
    .date-field { display:flex; align-items:center; gap:8px; color:#64758a; font-size:11px; font-weight:700; }
    .date-field input { height:36px; border:1px solid #d8e0e9; border-radius:7px; padding:0 9px; color:#34445a; font:inherit; }
    .dialog-content { display:block; box-sizing:border-box; min-height:180px; max-height:75vh; overflow:auto; overscroll-behavior:contain; padding:14px 18px 20px; }
    .worker-columns { display:flex; align-items:stretch; gap:12px; max-height:65vh; overflow-x:auto; overflow-y:hidden; padding-bottom:8px; overscroll-behavior-x:contain; -webkit-overflow-scrolling:touch; }
    .worker-column { display:flex; flex:0 0 245px; flex-direction:column; height:min(65vh, 640px); min-height:180px; max-height:65vh; overflow:hidden; border:1px solid #e6ecf2; border-radius:9px; background:#fcfdff; }
    .worker-header { padding:12px 13px 10px; border-bottom:1px solid #e8edf3; background:#f5f8fc; }
    .worker-header h3 { overflow:hidden; margin:0 0 8px; color:#263d58; font-size:14px; font-weight:700; text-overflow:ellipsis; white-space:nowrap; }
    .total-label { display:block; color:#8290a1; font-size:10px; }
    .worker-total { display:block; margin-top:2px; color:#1b3050; font-size:17px; }
    .worker-entries { flex:1 1 auto; min-height:0; overflow-y:auto; overscroll-behavior:contain; -webkit-overflow-scrolling:touch; padding:8px; }
    .sale-entry { display:flex; justify-content:space-between; align-items:center; gap:8px; margin-bottom:6px; padding:9px 8px; border:1px solid #e9eef4; border-radius:7px; background:#fff; }
    .entry-info { display:flex; flex-wrap:wrap; align-items:center; gap:4px 6px; min-width:0; }
    .entry-number { color:#334a63; font-size:12px; font-weight:700; font-variant-numeric:tabular-nums; }
    .entry-kind { color:#64758a; font-size:9px; font-weight:700; }
    .cancelled-label { color:#b42318; font-size:9px; font-weight:750; }
    .entry-amount { flex:none; color:#1b3050; font-size:12px; white-space:nowrap; }
    .cancelled-entry { opacity:.6; background:#fffafa; }
    .cancelled-entry .entry-amount { color:#8c969f; text-decoration:line-through; }
    .worker-empty, .empty-state { padding:26px 12px; color:#97a2af; font-size:12px; text-align:center; }
    .loading-state { display:flex; align-items:center; justify-content:center; gap:10px; min-height:160px; color:#748195; font-size:13px; }
    @media (max-width:600px) {
      .dialog-header { align-items:flex-start; flex-direction:column; padding:16px; }
      .header-actions { width:100%; justify-content:space-between; }
      .dialog-content { padding:12px; }
    }
  `]
})
export class BookCheckDialogComponent implements OnInit {
  readonly data: { date: string; sales?: any[]; quickSales?: any[] } = inject(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<BookCheckDialogComponent>);
  private saleService = inject(SaleService);
  private quickSaleService = inject(QuickSaleService);
  private salespersonService = inject(SalespersonService);
  private auth = inject(AuthService);

  selectedDate = this.data.date;
  sales: any[] = this.data.sales ?? [];
  quickSales: any[] = this.data.quickSales ?? [];
  activeWorkers: { id: number; name: string }[] = [];
  salesLoading = false;
  quickSalesLoading = false;
  workersLoading = true;
  private loadVersion = 0;

  get isOwner(): boolean { return this.auth.isOwner(); }

  get entries(): BookCheckEntry[] {
    const normalSales: BookCheckEntry[] = this.sales.map(sale => ({
      id: sale.id,
      salespersonId: sale.salesperson?.id ?? sale.salespersonId ?? null,
      salespersonName: sale.salesperson?.name ?? 'Unassigned',
      createdAt: sale.createdAt ?? '',
      total: Number(sale.total) || 0,
      status: sale.status ?? 'COMPLETED',
      saleType: sale.saleType ?? 'SALE',
      quickSale: false
    }));
    const quickSales: BookCheckEntry[] = this.quickSales.map(sale => ({
      id: sale.id,
      salespersonId: sale.salesperson?.id ?? sale.salespersonId ?? null,
      salespersonName: sale.salesperson?.name ?? 'Unassigned',
      createdAt: sale.createdAt ?? '',
      total: Number(sale.total) || 0,
      status: 'COMPLETED',
      saleType: 'QUICK SALE',
      quickSale: true
    }));
    return [...normalSales, ...quickSales].sort((a, b) => {
      const aTime = Date.parse(a.createdAt) || 0;
      const bTime = Date.parse(b.createdAt) || 0;
      return aTime - bTime || Number(a.quickSale) - Number(b.quickSale) || a.id - b.id;
    });
  }

  get bookCheckWorkers(): BookCheckWorker[] {
    const byId = new Map<number, BookCheckWorker>();
    this.activeWorkers.forEach(worker => byId.set(worker.id, { id: worker.id, name: worker.name }));
    for (const entry of this.entries) {
      if (entry.salespersonId !== null && !byId.has(entry.salespersonId)) {
        byId.set(entry.salespersonId, { id: entry.salespersonId, name: entry.salespersonName });
      }
    }
    const workers = [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
    if (this.entries.some(entry => entry.salespersonId === null)) workers.push({ id: null, name: 'Unassigned' });
    return workers;
  }

  trackWorker(_index: number, worker: BookCheckWorker): number | string {
    return worker.id ?? 'unassigned';
  }

  trackEntry(_index: number, entry: BookCheckEntry): string {
    return `${entry.quickSale ? 'q' : 's'}${entry.id}`;
  }

  ngOnInit() {
    this.salespersonService.getAll().subscribe({
      next: workers => { this.activeWorkers = workers.filter(worker => worker.active); this.workersLoading = false; },
      error: () => { this.activeWorkers = []; this.workersLoading = false; }
    });
    if (!Array.isArray(this.data.sales) || !Array.isArray(this.data.quickSales)) this.load();
  }

  load() {
    const version = ++this.loadVersion;
    this.salesLoading = true;
    this.quickSalesLoading = true;
    this.saleService.getByDate(this.selectedDate).subscribe({
      next: sales => { if (version === this.loadVersion) { this.sales = sales; this.salesLoading = false; } },
      error: () => { if (version === this.loadVersion) { this.sales = []; this.salesLoading = false; } }
    });
    this.quickSaleService.getByDate(this.selectedDate).subscribe({
      next: sales => { if (version === this.loadVersion) { this.quickSales = sales; this.quickSalesLoading = false; } },
      error: () => { if (version === this.loadVersion) { this.quickSales = []; this.quickSalesLoading = false; } }
    });
  }

  entriesFor(workerId: number | null): BookCheckEntry[] {
    return this.entries.filter(entry => entry.salespersonId === workerId);
  }

  workerTotal(workerId: number | null): number {
    return this.entriesFor(workerId)
      .reduce((sum, entry) => entry.status.toUpperCase() === 'CANCELLED' ? sum : sum + entry.total, 0);
  }

  close() { this.dialogRef.close(); }
}
