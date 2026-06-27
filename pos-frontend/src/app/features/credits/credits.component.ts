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
import { SaleService } from '../../core/services/sale.service';
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
          <h1 class="page-title">Credit Sales</h1>
          <p class="page-sub">{{ filtered.length }} pending credit(s) · LKR {{ totalOutstanding | number:'1.2-2' }} outstanding</p>
        </div>
      </div>

      <mat-card class="search-card">
        <mat-form-field appearance="outline" class="search-field">
          <mat-label>Search by customer or sale #</mat-label>
          <mat-icon matPrefix>search</mat-icon>
          <input matInput [(ngModel)]="search" (ngModelChange)="applyFilter()" placeholder="Search..." />
        </mat-form-field>
      </mat-card>

      <mat-card>
        @if (loading) {
          <div class="empty-state"><mat-spinner diameter="32" /></div>
        } @else if (filtered.length === 0) {
          <div class="empty-state">
            <mat-icon>check_circle_outline</mat-icon>
            <p>{{ search ? 'No matching credits.' : 'No pending credit sales.' }}</p>
          </div>
        } @else {
          @for (sale of filtered; track sale.id) {
            <div class="credit-row">
              <div class="credit-left">
                <div class="sale-id">#{{ sale.id }}</div>
                <div class="sale-info">
                  <span class="customer-name">{{ sale.customerName || 'Unknown Customer' }}</span>
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
    .sale-date { font-size: 12px; color: #888; }
    .sale-type { font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 10px; align-self: flex-start; }
    .sale-type.retail { background: #e3f2fd; color: #1565c0; }
    .sale-type.wholesale { background: #f3e5f5; color: #6a1b9a; }
    .credit-right { display: flex; align-items: center; gap: 16px; flex-shrink: 0; }
    .amount { font-weight: 700; font-size: 16px; color: #f57f17; }
    .pay-btn { background: #2e7d32 !important; color: #fff !important; }

    @media (max-width: 767px) {
      .page-container { padding: 12px; }
      .page-header { flex-direction: column; gap: 8px; }
      .search-field { max-width: 100%; }

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
    }
  `]
})
export class CreditsComponent implements OnInit {
  private saleService = inject(SaleService);
  private dialog = inject(MatDialog);
  private snack = inject(MatSnackBar);

  credits: any[] = [];
  filtered: any[] = [];
  search = '';
  loading = true;

  get totalOutstanding(): number {
    return this.filtered.reduce((sum, s) => sum + (s.total ?? 0), 0);
  }

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.saleService.getCredits().subscribe({
      next: data => { this.credits = data; this.applyFilter(); this.loading = false; },
      error: () => { this.loading = false; }
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
  }

  recordPayment(sale: any) {
    this.dialog.open(CreditPaymentDialogComponent, {
      width: '380px',
      data: { sale }
    }).afterClosed().subscribe(paid => {
      if (paid) {
        this.snack.open('Payment recorded', '', { duration: 2000 });
        this.load();
      }
    });
  }
}


