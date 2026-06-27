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
import { MatTabsModule } from '@angular/material/tabs';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { SupplierService } from '../../../core/services/product.service';
import { Supplier } from '../../../core/models/product.model';
import { SupplierFormComponent } from '../supplier-form/supplier-form.component';
import { ReceiveGoodsDialogComponent } from '../receive-goods-dialog/receive-goods-dialog.component';

@Component({
  selector: 'app-supplier-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatDialogModule, MatSnackBarModule,
    MatTooltipModule, MatTabsModule
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
        <input matInput [(ngModel)]="searchText" placeholder="Search by name, code or phone..." (ngModelChange)="applyFilter()">
        @if (searchText) {
          <button matSuffix mat-icon-button (click)="searchText = ''; applyFilter()"><mat-icon>close</mat-icon></button>
        }
      </mat-form-field>

      <!-- Tabs -->
      <mat-tab-group animationDuration="150ms" (selectedIndexChange)="onTabChange($event)">

        <mat-tab [label]="'Business (' + businessSuppliers.length + ')'">
          <div class="tab-content">
            <!-- Summary strip -->
            <div class="summary-strip">
              <div class="strip-item"><span class="strip-label">Suppliers</span><span class="strip-val">{{ businessSuppliers.length }}</span></div>
              <div class="strip-item red"><span class="strip-label">Total Owed</span><span class="strip-val">Rs {{ businessOwed | number:'1.0-0' }}</span></div>
              <div class="strip-item green"><span class="strip-label">Cleared</span><span class="strip-val">{{ businessCleared }} suppliers</span></div>
            </div>
            <div class="supplier-grid">
              @for (s of filteredBusiness; track s.id) {
                <ng-container *ngTemplateOutlet="supplierCard; context: { $implicit: s }"></ng-container>
              }
            </div>
            @if (filteredBusiness.length === 0) { <div class="empty-state"><mat-icon>local_shipping</mat-icon><p>No business suppliers{{ searchText ? ' matching search' : '' }}.</p></div> }
          </div>
        </mat-tab>

        <mat-tab [label]="'Shop Need (' + shopNeedSuppliers.length + ')'">
          <div class="tab-content">
            <div class="summary-strip">
              <div class="strip-item"><span class="strip-label">Suppliers</span><span class="strip-val">{{ shopNeedSuppliers.length }}</span></div>
              <div class="strip-item red"><span class="strip-label">Total Owed</span><span class="strip-val">Rs {{ shopNeedOwed | number:'1.0-0' }}</span></div>
              <div class="strip-item green"><span class="strip-label">Cleared</span><span class="strip-val">{{ shopNeedCleared }} suppliers</span></div>
            </div>
            <div class="supplier-grid">
              @for (s of filteredShopNeed; track s.id) {
                <ng-container *ngTemplateOutlet="supplierCard; context: { $implicit: s }"></ng-container>
              }
            </div>
            @if (filteredShopNeed.length === 0) { <div class="empty-state"><mat-icon>store</mat-icon><p>No shop-need suppliers{{ searchText ? ' matching search' : '' }}. Add one to track deliveries.</p></div> }
          </div>
        </mat-tab>

      </mat-tab-group>
    </div>

    <!-- Shared supplier card template -->
    <ng-template #supplierCard let-s>
      <mat-card class="supplier-card">
        <div class="sc-header">
          <div class="sc-avatar" [class.shop-need]="s.type === 'SHOP_NEED'">{{ s.name.charAt(0).toUpperCase() }}</div>
          <div class="sc-info">
            <div class="sc-name">
              {{ s.name }}
              @if (s.code) { <span class="sc-code">{{ s.code }}</span> }
              <span class="sc-type" [class.shop-need]="s.type === 'SHOP_NEED'">
                {{ s.type === 'SHOP_NEED' ? 'Shop Need' : 'Business' }}
              </span>
            </div>
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
          @if (s.type === 'SHOP_NEED' && auth.isOwner()) {
            <button mat-flat-button class="receive-btn" (click)="goToDeliveries(s)">
              <mat-icon>assignment</mat-icon> Delivery Ledger
            </button>
          } @else if (s.type !== 'SHOP_NEED') {
            <button mat-flat-button class="receive-btn" (click)="openReceive(s)">
              <mat-icon>inventory</mat-icon> Receive Goods
            </button>
          }
          @if (s.balance > 0) {
            <button mat-stroked-button class="pay-btn" (click)="goToPay(s)" matTooltip="Record payment in Expenses">
              <mat-icon>payments</mat-icon> Pay
            </button>
          }
        </div>
      </mat-card>
    </ng-template>
  `,
  styles: [`
    .page-container { padding: 24px; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
    .page-title { font-size: 22px; font-weight: 700; color: #1b3050; margin: 0; }
    .page-sub { color: #888; font-size: 13px; margin: 2px 0 0; }
    .primary-btn { background: #1b3050 !important; color: #fff !important; }
    .search-field { width: 100%; max-width: 380px; margin-bottom: 8px; display: block; }

    .tab-content { padding: 16px 0; }

    .summary-strip { display: flex; gap: 16px; margin-bottom: 20px; flex-wrap: wrap; }
    .strip-item {
      background: #fff; border-radius: 10px; padding: 14px 20px;
      border: 1px solid #eef0f4; display: flex; flex-direction: column; gap: 4px; min-width: 140px;
    }
    .strip-item.red { border-left: 3px solid #c62828; }
    .strip-item.green { border-left: 3px solid #2e7d32; }
    .strip-label { font-size: 11px; color: #6b7280; font-weight: 500; text-transform: uppercase; }
    .strip-val { font-size: 20px; font-weight: 700; color: #1b3050; }

    .supplier-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }
    .supplier-card { padding: 0 !important; overflow: hidden; }

    .sc-header { display: flex; align-items: flex-start; gap: 12px; padding: 16px 16px 12px; }
    .sc-avatar {
      width: 42px; height: 42px; border-radius: 10px; background: #1b3050;
      color: #fff; display: flex; align-items: center; justify-content: center;
      font-size: 18px; font-weight: 700; flex-shrink: 0;
    }
    .sc-avatar.shop-need { background: #7b5ea7; }
    .sc-info { flex: 1; min-width: 0; }
    .sc-name { font-size: 15px; font-weight: 700; color: #1b3050; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
    .sc-code {
      font-size: 11px; font-weight: 700; background: #e3f2fd; color: #1565c0;
      padding: 2px 8px; border-radius: 10px; letter-spacing: 0.5px;
    }
    .sc-type {
      font-size: 10px; font-weight: 600; background: #e8f5e9; color: #2e7d32;
      padding: 2px 7px; border-radius: 10px; text-transform: uppercase; letter-spacing: 0.3px;
    }
    .sc-type.shop-need { background: #f3e5f5; color: #7b1fa2; }
    .sc-phone, .sc-addr { display: flex; align-items: center; gap: 4px; font-size: 12px; color: #6b7280; margin-top: 3px; }
    .sc-phone mat-icon, .sc-addr mat-icon { font-size: 13px; width: 13px; height: 13px; }
    .edit-btn { color: #6b7280 !important; flex-shrink: 0; }

    .sc-balance { margin: 0 16px 12px; padding: 10px 14px; border-radius: 8px; display: flex; align-items: center; gap: 10px; }
    .sc-balance mat-icon { font-size: 22px; width: 22px; height: 22px; flex-shrink: 0; }
    .sc-balance.owed { background: #fdecea; color: #c62828; }
    .sc-balance.clear { background: #e8f5e9; color: #2e7d32; }
    .bal-label { font-size: 11px; opacity: 0.8; }
    .bal-amount { font-size: 16px; font-weight: 700; }

    .sc-actions { display: flex; gap: 8px; padding: 12px 16px; border-top: 1px solid #f4f6f9; }
    .receive-btn { background: #1b3050 !important; color: #fff !important; font-size: 13px !important; flex: 1; }
    .pay-btn { font-size: 13px !important; flex-shrink: 0; color: #2e7d32 !important; border-color: #2e7d32 !important; }

    .empty-state { display: flex; flex-direction: column; align-items: center; padding: 60px; color: #6b7280; gap: 12px; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; }
    .empty-state p { font-size: 14px; }

    @media (max-width: 767px) {
      .page-container { padding: 12px; }
      .page-header { flex-direction: column; gap: 8px; }
      .summary-strip { flex-wrap: wrap; gap: 8px; }
      .supplier-grid { grid-template-columns: 1fr !important; }
    }
  `]
})
export class SupplierListComponent implements OnInit {
  auth = inject(AuthService);
  private supplierService = inject(SupplierService);
  private dialog = inject(MatDialog);
  private snack = inject(MatSnackBar);
  private router = inject(Router);

  suppliers: Supplier[] = [];
  searchText = '';

  get businessSuppliers() { return this.suppliers.filter(s => s.type !== 'SHOP_NEED'); }
  get shopNeedSuppliers() { return this.suppliers.filter(s => s.type === 'SHOP_NEED'); }

  get filteredBusiness() { return this.filterList(this.businessSuppliers); }
  get filteredShopNeed() { return this.filterList(this.shopNeedSuppliers); }

  get businessOwed() { return this.businessSuppliers.reduce((s, x) => s + (x.balance || 0), 0); }
  get shopNeedOwed() { return this.shopNeedSuppliers.reduce((s, x) => s + (x.balance || 0), 0); }
  get businessCleared() { return this.businessSuppliers.filter(s => (s.balance || 0) <= 0).length; }
  get shopNeedCleared() { return this.shopNeedSuppliers.filter(s => (s.balance || 0) <= 0).length; }

  ngOnInit() { this.load(); }

  load() {
    this.supplierService.getAll().subscribe(s => this.suppliers = s);
  }

  applyFilter() {}
  onTabChange(_idx: number) {}

  filterList(list: Supplier[]) {
    const q = this.searchText.trim().toLowerCase();
    return q ? list.filter(s =>
      s.name.toLowerCase().includes(q) ||
      (s.code || '').toLowerCase().includes(q) ||
      (s.phone || '').toLowerCase().includes(q)
    ) : list;
  }

  openForm(supplier?: Supplier) {
    this.dialog.open(SupplierFormComponent, { width: '420px', data: { supplier } })
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

  goToDeliveries(supplier: Supplier) {
    this.router.navigate(['/shop-supplies'], { queryParams: { supplierId: supplier.id } });
  }

  goToPay(_supplier: Supplier) {
    this.router.navigate(['/expenses']);
  }
}
