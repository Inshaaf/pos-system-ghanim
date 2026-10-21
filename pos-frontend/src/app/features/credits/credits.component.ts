import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { QuickSaleService, SaleService } from '../../core/services/sale.service';
import { CashLoan, CashService } from '../../core/services/session.service';
import { CreditPaymentDialogComponent } from './credit-payment-dialog/credit-payment-dialog.component';

@Component({
  selector: 'app-credits',
  standalone: true,
  imports: [
    CommonModule, DatePipe, FormsModule, MatCardModule, MatButtonModule,
    MatIconModule, MatDialogModule, MatSnackBarModule, MatProgressSpinnerModule,
    MatInputModule, MatFormFieldModule
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">{{ selectedTab === 'sales' ? 'Credit Sales' : 'Loans Given' }}</h1>
          @if (selectedTab === 'sales') {
            <p class="page-sub">{{ filtered.length }} pending credit(s) · LKR {{ totalOutstanding | number:'1.2-2' }} outstanding</p>
          } @else {
            <p class="page-sub">{{ filteredLoans.length }} loan record(s) · LKR {{ loanOutstanding | number:'1.2-2' }} owed to the shop</p>
          }
        </div>
      </div>

      <nav class="credit-tabs" aria-label="Credits and loans">
        <button type="button" [class.selected]="selectedTab === 'sales'" (click)="selectedTab = 'sales'; applyFilter()">
          <mat-icon>receipt_long</mat-icon> Credit Sales <span>{{ credits.length }}</span>
        </button>
        <button type="button" [class.selected]="selectedTab === 'loans'" (click)="selectedTab = 'loans'; applyFilter()">
          <mat-icon>handshake</mat-icon> Loans Given <span>{{ loans.length }}</span>
        </button>
      </nav>

      <mat-card class="search-card">
        <mat-form-field appearance="outline" class="search-field">
          <mat-label>{{ selectedTab === 'sales' ? 'Search by customer or sale #' : 'Search by borrower name or phone' }}</mat-label>
          <mat-icon matPrefix>search</mat-icon>
          <input matInput [(ngModel)]="search" (ngModelChange)="applyFilter()" placeholder="Search..." />
        </mat-form-field>
      </mat-card>

      @if (selectedTab === 'sales') {
      <mat-card>
        @if (loading) {
          <div class="empty-state"><mat-spinner diameter="32" /></div>
        } @else if (filtered.length === 0) {
          <div class="empty-state">
            <mat-icon>check_circle_outline</mat-icon>
            <p>{{ search ? 'No matching credits.' : 'No pending credit sales.' }}</p>
          </div>
        } @else {
          @for (sale of filtered; track (sale.quickSale ? 'q' : 's') + sale.id) {
            <div class="credit-row">
              <div class="credit-left">
                <div class="sale-id">#{{ sale.id }}</div>
                <div class="sale-info">
                  <span class="customer-name">{{ sale.customerName || 'Unknown Customer' }}</span>
                  @if (sale.customerPhone) { <span class="customer-contact">Phone: {{ sale.customerPhone }}</span> }
                  @if (sale.customerAddress) { <span class="customer-contact">{{ sale.customerAddress }}</span> }
                  <span class="sale-date">{{ sale.createdAt | date:'dd/MM/yyyy HH:mm' }}</span>
                  <span class="sale-type" [class]="sale.saleType?.toLowerCase()">{{ sale.saleType }}</span>
                </div>
              </div>
              <div class="credit-right">
                <div class="amount">LKR {{ sale.total | number:'1.2-2' }}</div>
                <button mat-flat-button class="pay-btn" (click)="recordPayment(sale)">
                  <mat-icon>payments</mat-icon> Record Payment
                </button>
              </div>
            </div>
          }
        }
      </mat-card>
      } @else {
        <mat-card>
          @if (loading) {
            <div class="empty-state"><mat-spinner diameter="32" /></div>
          } @else if (filteredLoans.length === 0) {
            <div class="empty-state">
              <mat-icon>check_circle_outline</mat-icon>
              <p>{{ search ? 'No matching loan records.' : 'No loans have been given.' }}</p>
            </div>
          } @else {
            @for (loan of filteredLoans; track loan.id) {
              <div class="credit-row loan-row">
                <div class="credit-left">
                  <div class="loan-icon"><mat-icon>person</mat-icon></div>
                  <div class="sale-info">
                    <span class="customer-name">{{ loan.personName }}</span>
                    <span class="customer-contact">Phone: {{ loan.phoneNumber }}</span>
                    <span class="sale-date">Added {{ loan.createdAt | date:'dd/MM/yyyy' }}</span>
                  </div>
                </div>
                <div class="loan-amounts">
                  <span>Given <strong>LKR {{ loan.totalGiven | number:'1.2-2' }}</strong></span>
                  <span>Repaid <strong>LKR {{ (loan.totalGiven - loan.outstanding) | number:'1.2-2' }}</strong></span>
                  <span class="loan-balance">Outstanding <strong>LKR {{ loan.outstanding | number:'1.2-2' }}</strong></span>
                </div>
              </div>
            }
          }
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .page-container { padding: 24px; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
    .page-title { font-size: 22px; font-weight: 700; color: #1b3050; margin: 0; }
    .page-sub { color: #888; font-size: 13px; margin: 4px 0 0; }
    .search-card { margin-bottom: 16px; padding: 12px 16px; }
    .search-field { width: 100%; max-width: 400px; }
    .empty-state {
      display: flex; flex-direction: column; align-items: center;
      padding: 48px 24px; color: #aaa; gap: 8px;
    }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; color: #2e7d32; }
    .credit-row {
      display: flex; align-items: center; justify-content: space-between;
      padding: 14px 16px; border-bottom: 1px solid #f0f0f0;
      gap: 16px;
    }
    .credit-left { display: flex; align-items: center; gap: 16px; flex: 1; min-width: 0; }
    .sale-id { font-weight: 700; color: #1b3050; min-width: 50px; font-size: 15px; }
    .sale-info { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
    .customer-name { font-weight: 600; font-size: 14px; color: #1b3050; }
    .customer-contact { font-size: 12px; color: #64748b; }
    .sale-date { font-size: 12px; color: #888; }
    .sale-type { font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 10px; align-self: flex-start; }
    .sale-type.retail { background: #e3f2fd; color: #1565c0; }
    .sale-type.wholesale { background: #f3e5f5; color: #6a1b9a; }
    .credit-right { display: flex; align-items: center; gap: 16px; flex-shrink: 0; }
    .amount { font-weight: 700; font-size: 16px; color: #f57f17; }
    .pay-btn { background: #2e7d32 !important; color: #fff !important; }
    .credit-tabs { display:flex; gap:8px; margin:0 0 14px; border-bottom:1px solid #e5eaf0; }
    .credit-tabs button { display:flex; align-items:center; gap:8px; padding:11px 14px; color:#62728a; background:transparent; border:0; border-bottom:2px solid transparent; font:inherit; font-size:13px; cursor:pointer; }
    .credit-tabs button.selected { color:#1b4c7e; border-bottom-color:#1b4c7e; font-weight:700; }
    .credit-tabs mat-icon { font-size:18px; width:18px; height:18px; }
    .credit-tabs span { min-width:20px; padding:2px 6px; border-radius:10px; background:#edf2f7; text-align:center; font-size:11px; }
    .loan-icon { display:grid; place-items:center; width:38px; height:38px; flex:none; border-radius:50%; color:#1b4c7e; background:#eef5fc; }
    .loan-amounts { display:flex; gap:22px; align-items:center; color:#64748b; font-size:12px; }
    .loan-amounts span { display:flex; flex-direction:column; gap:4px; }
    .loan-amounts strong { color:#1b3050; font-size:13px; }
    .loan-amounts .loan-balance strong { color:#b45309; }

    @media (max-width: 767px) {
      .page-container { padding: 12px; }
      .page-header { flex-direction: column; gap: 8px; }
      .search-field { max-width: 100%; }
      .credit-tabs { overflow-x:auto; }
      .credit-tabs button { flex:none; padding:10px 8px; font-size:12px; }

      /* Stack the credit row: left info on top, right (amount + button) below */
      .credit-row { flex-wrap: wrap; gap: 10px; padding: 12px; }
      .credit-left { flex: 0 0 100%; }
      .credit-right {
        flex: 0 0 100%;
        gap: 10px;
        justify-content: space-between;
        align-items: center;
      }
      .amount { font-size: 16px; }
      .pay-btn { flex: 1; }
      .loan-amounts { flex:0 0 100%; justify-content:space-between; gap:8px; padding-left:54px; }
    }
  `]
})
export class CreditsComponent implements OnInit {
  private saleService = inject(SaleService);
  private quickSaleService = inject(QuickSaleService);
  private dialog = inject(MatDialog);
  private snack = inject(MatSnackBar);
  private cashService = inject(CashService);

  credits: any[] = [];
  loans: CashLoan[] = [];
  filteredLoans: CashLoan[] = [];
  selectedTab: 'sales' | 'loans' = 'sales';
  filtered: any[] = [];
  search = '';
  loading = true;

  get totalOutstanding(): number {
    return this.filtered.reduce((sum, s) => sum + (s.total ?? 0), 0);
  }

  get loanOutstanding(): number {
    return this.filteredLoans.reduce((sum, loan) => sum + Number(loan.outstanding || 0), 0);
  }

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.saleService.getCredits().subscribe({
      next: data => { this.credits = data; this.applyFilter(); this.loading = false; },
      error: () => { this.loading = false; }
    });
    this.cashService.getLoans().subscribe({
      next: loans => { this.loans = loans ?? []; this.applyFilter(); },
      error: () => { this.loans = []; this.applyFilter(); }
    });
  }

  applyFilter() {
    const q = this.search.toLowerCase();
    this.filtered = q
      ? this.credits.filter(s =>
          String(s.id).includes(q) ||
          (s.customerName || '').toLowerCase().includes(q)
        )
      : [...this.credits];
    this.filteredLoans = q
      ? this.loans.filter(loan => loan.personName.toLowerCase().includes(q) || loan.phoneNumber.toLowerCase().includes(q))
      : [...this.loans];
  }

  recordPayment(sale: any) {
    this.dialog.open(CreditPaymentDialogComponent, {
      width: '380px',
      data: { sale }
    }).afterClosed().subscribe(paid => {
      if (paid) {
        const request = sale.quickSale
          ? this.quickSaleService.recordPayment(sale.id, paid)
          : this.saleService.recordPayment(sale.id, paid);
        request.subscribe({
          next: () => { this.snack.open('Payment recorded', '', { duration: 2000 }); this.load(); },
          error: () => this.snack.open('Failed to record payment', 'OK', { duration: 3000 })
        });
      }
    });
  }
}


