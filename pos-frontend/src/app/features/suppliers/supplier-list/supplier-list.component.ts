import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { SupplierService } from '../../../core/services/product.service';
import { Supplier } from '../../../core/models/product.model';
import { SupplierFormComponent } from '../supplier-form/supplier-form.component';
import { ReceiveGoodsDialogComponent } from '../receive-goods-dialog/receive-goods-dialog.component';

@Component({
  selector: 'app-supplier-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatDialogModule, MatSnackBarModule, MatTooltipModule
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">Suppliers</h1>
          <p class="page-sub">Manage suppliers, goods received and balances</p>
        </div>
        <button mat-flat-button class="primary-btn" (click)="openForm()">
          <mat-icon>add</mat-icon> Add Supplier
        </button>
      </div>

      <!-- Search -->
      <mat-form-field appearance="outline" class="search-field">
        <mat-icon matPrefix>search</mat-icon>
        <input matInput [(ngModel)]="searchText" placeholder="Search supplier by name or phone..." (ngModelChange)="applySearch()">
        @if (searchText) {
          <button matSuffix mat-icon-button (click)="searchText = ''; applySearch()"><mat-icon>close</mat-icon></button>
        }
      </mat-form-field>

      <!-- Summary strip -->
      <div class="summary-strip">
        <div class="strip-item">
          <span class="strip-label">Total Suppliers</span>
          <span class="strip-val">{{ suppliers.length }}</span>
        </div>
        <div class="strip-item red">
          <span class="strip-label">Total Owed</span>
          <span class="strip-val">Rs {{ totalOwed | number:'1.0-0' }}</span>
        </div>
        <div class="strip-item green">
          <span class="strip-label">Cleared</span>
          <span class="strip-val">{{ clearedCount }} suppliers</span>
        </div>
      </div>

      <!-- Supplier cards -->
      <div class="supplier-grid">
        @for (s of filteredSuppliers; track s.id) {
          <mat-card class="supplier-card">
            <div class="sc-header">
              <div class="sc-avatar">{{ s.name.charAt(0).toUpperCase() }}</div>
              <div class="sc-info">
                <div class="sc-name">{{ s.name }}</div>
                @if (s.phone) { <div class="sc-phone"><mat-icon>phone</mat-icon>{{ s.phone }}</div> }
                @if (s.address) { <div class="sc-addr"><mat-icon>location_on</mat-icon>{{ s.address }}</div> }
              </div>
              <button mat-icon-button class="edit-btn" (click)="openForm(s)" matTooltip="Edit supplier">
                <mat-icon>edit</mat-icon>
              </button>
            </div>

            <div class="sc-balance" [class.owed]="s.balance > 0" [class.clear]="s.balance <= 0">
              <mat-icon>{{ s.balance > 0 ? 'account_balance_wallet' : 'check_circle' }}</mat-icon>
              <div>
                <div class="bal-label">{{ s.balance > 0 ? 'Balance Owed' : 'No Balance' }}</div>
                <div class="bal-amount">Rs {{ s.balance | number:'1.0-0' }}</div>
              </div>
            </div>

            <div class="sc-actions">
              <button mat-flat-button class="receive-btn" (click)="openReceive(s)">
                <mat-icon>inventory</mat-icon> Receive Goods
              </button>
              @if (s.balance > 0) {
                <button mat-stroked-button class="pay-btn" (click)="goToPay(s)" matTooltip="Record payment in Expenses">
                  <mat-icon>payments</mat-icon> Pay
                </button>
              }
            </div>
          </mat-card>
        }
      </div>

      @if (filteredSuppliers.length === 0 && suppliers.length === 0) {
        <div class="empty-state">
          <mat-icon>local_shipping</mat-icon>
          <p>No suppliers yet. Add one to get started.</p>
        </div>
      }
      @if (filteredSuppliers.length === 0 && suppliers.length > 0) {
        <div class="empty-state">
          <mat-icon>search_off</mat-icon>
          <p>No suppliers match "{{ searchText }}".</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .page-container { padding: 24px; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
    .page-title { font-size: 22px; font-weight: 700; color: #1b3050; margin: 0; }
    .page-sub { color: #888; font-size: 13px; margin: 2px 0 0; }
    .primary-btn { background: #1b3050 !important; color: #fff !important; }

    .summary-strip {
      display: flex; gap: 16px; margin-bottom: 20px; flex-wrap: wrap;
    }
    .strip-item {
      background: #fff; border-radius: 10px; padding: 14px 20px;
      border: 1px solid #eef0f4; display: flex; flex-direction: column; gap: 4px; min-width: 140px;
    }
    .strip-item.red { border-left: 3px solid #c62828; }
    .strip-item.green { border-left: 3px solid #2e7d32; }
    .strip-label { font-size: 11px; color: #6b7280; font-weight: 500; text-transform: uppercase; }
    .strip-val { font-size: 20px; font-weight: 700; color: #1b3050; }

    .supplier-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px;
    }
    .supplier-card { padding: 0 !important; overflow: hidden; }

    .sc-header {
      display: flex; align-items: flex-start; gap: 12px; padding: 16px 16px 12px;
    }
    .sc-avatar {
      width: 42px; height: 42px; border-radius: 10px; background: #1b3050;
      color: #fff; display: flex; align-items: center; justify-content: center;
      font-size: 18px; font-weight: 700; flex-shrink: 0;
    }
    .sc-info { flex: 1; min-width: 0; }
    .sc-name { font-size: 15px; font-weight: 700; color: #1b3050; }
    .sc-phone, .sc-addr {
      display: flex; align-items: center; gap: 4px;
      font-size: 12px; color: #6b7280; margin-top: 3px;
    }
    .sc-phone mat-icon, .sc-addr mat-icon { font-size: 13px; width: 13px; height: 13px; }
    .edit-btn { color: #6b7280 !important; flex-shrink: 0; }

    .sc-balance {
      margin: 0 16px 12px; padding: 10px 14px; border-radius: 8px;
      display: flex; align-items: center; gap: 10px;
    }
    .sc-balance mat-icon { font-size: 22px; width: 22px; height: 22px; flex-shrink: 0; }
    .sc-balance.owed { background: #fdecea; color: #c62828; }
    .sc-balance.clear { background: #e8f5e9; color: #2e7d32; }
    .bal-label { font-size: 11px; opacity: 0.8; }
    .bal-amount { font-size: 16px; font-weight: 700; }

    .sc-actions {
      display: flex; gap: 8px; padding: 12px 16px;
      border-top: 1px solid #f4f6f9;
    }
    .receive-btn { background: #1b3050 !important; color: #fff !important; font-size: 13px !important; flex: 1; }
    .pay-btn { font-size: 13px !important; flex-shrink: 0; color: #2e7d32 !important; border-color: #2e7d32 !important; }

    .empty-state {
      display: flex; flex-direction: column; align-items: center;
      padding: 60px; color: #6b7280; gap: 12px;
    }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; }
    .empty-state p { font-size: 14px; }
    .search-field { width: 100%; max-width: 380px; margin-bottom: 16px; display: block; }
  `]
})
export class SupplierListComponent implements OnInit {
  private supplierService = inject(SupplierService);
  private dialog = inject(MatDialog);
  private snack = inject(MatSnackBar);
  private router = inject(Router);

  suppliers: Supplier[] = [];
  filteredSuppliers: Supplier[] = [];
  searchText = '';

  get totalOwed() { return this.suppliers.reduce((s, x) => s + (x.balance || 0), 0); }
  get clearedCount() { return this.suppliers.filter(s => (s.balance || 0) <= 0).length; }

  ngOnInit() { this.load(); }

  load() {
    this.supplierService.getAll().subscribe(s => {
      this.suppliers = s;
      this.applySearch();
    });
  }

  applySearch() {
    const q = this.searchText.trim().toLowerCase();
    this.filteredSuppliers = q
      ? this.suppliers.filter(s =>
          s.name.toLowerCase().includes(q) || (s.phone || '').toLowerCase().includes(q))
      : [...this.suppliers];
  }

  openForm(supplier?: Supplier) {
    this.dialog.open(SupplierFormComponent, { width: '400px', data: { supplier } })
      .afterClosed().subscribe(saved => { if (saved) this.load(); });
  }

  openReceive(supplier: Supplier) {
    this.dialog.open(ReceiveGoodsDialogComponent, {
      width: '640px',
      data: { supplier }
    }).afterClosed().subscribe(received => {
      if (received) {
        this.snack.open(`Goods received. Rs ${received.balance | 0} now owed to ${received.name}`, '', { duration: 3000 });
        this.load();
      }
    });
  }

  goToPay(_supplier: Supplier) {
    this.router.navigate(['/expenses']);
  }
}
