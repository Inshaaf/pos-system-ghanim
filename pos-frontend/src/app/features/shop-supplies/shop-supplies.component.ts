import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ShopSupplyService, SupplierDeliveryService } from '../../core/services/shop-supply.service';
import { SupplierService } from '../../core/services/product.service';
import { AuthService } from '../../core/services/auth.service';
import { ShopSupply, SupplierDelivery, PriceComparison } from '../../core/models/shop-supply.model';
import { Supplier } from '../../core/models/product.model';

@Component({
  selector: 'app-shop-supplies',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatSnackBarModule, MatTabsModule, MatTooltipModule
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">Shop Supplies</h1>
          <p class="page-sub">Track consumable deliveries, verify balances, compare prices</p>
        </div>
      </div>

      <mat-tab-group animationDuration="150ms" [(selectedIndex)]="activeTab">

        <!-- ── RECORD DELIVERY ── -->
        <mat-tab label="Record Delivery">
          <div class="tab-content">
            <mat-card class="section-card">
              <h3 class="section-title"><mat-icon>local_shipping</mat-icon> New Delivery</h3>
              <p class="hint-text">Every delivery is logged with item, quantity and unit price — so the owner can verify any balance.</p>

              <div class="form-grid">
                <div class="field-wrap">
                  <label class="field-label">Shop Need Supplier *</label>
                  <select class="styled-select" [(ngModel)]="del.supplierId" (ngModelChange)="onSupplierSelect()">
                    <option [value]="undefined">Select supplier...</option>
                    @for (s of shopNeedSuppliers; track s.id) {
                      <option [value]="s.id">{{ s.name }}</option>
                    }
                  </select>
                </div>

                @if (selectedSupplier) {
                  <div class="balance-badge" [class.owed]="selectedSupplier.balance > 0">
                    <mat-icon>account_balance</mat-icon>
                    Current balance owed: <strong>Rs {{ selectedSupplier.balance | number:'1.0-0' }}</strong>
                  </div>
                }

                <div class="field-wrap">
                  <label class="field-label">Supply Item *</label>
                  <select class="styled-select" [(ngModel)]="del.supplyItemId">
                    <option [value]="undefined">Select item...</option>
                    @for (i of supplyItems; track i.id) {
                      <option [value]="i.id">{{ i.name }} ({{ i.unit }})</option>
                    }
                  </select>
                  <span class="field-hint">Not in list? Add it in the Catalog tab first.</span>
                </div>

                <div class="two-col">
                  <div class="field-wrap">
                    <label class="field-label">Quantity *</label>
                    <input class="styled-input" type="number" [(ngModel)]="del.quantity" (ngModelChange)="calcAmount()" placeholder="0" min="0" />
                  </div>
                  <div class="field-wrap">
                    <label class="field-label">Unit Price (Rs) *</label>
                    <input class="styled-input" type="number" [(ngModel)]="del.unitPrice" (ngModelChange)="calcAmount()" placeholder="0.00" min="0" />
                  </div>
                </div>

                @if (del.quantity && del.unitPrice) {
                  <div class="amount-preview">
                    <mat-icon>calculate</mat-icon>
                    Total: <strong>Rs {{ del.quantity * del.unitPrice | number:'1.2-2' }}</strong>
                    &nbsp;({{ del.quantity }} × Rs {{ del.unitPrice }})
                  </div>
                }

                <div class="two-col">
                  <div class="field-wrap">
                    <label class="field-label">Delivery Date</label>
                    <input class="styled-input" type="date" [(ngModel)]="del.deliveredAt" />
                  </div>
                  <div class="field-wrap">
                    <label class="field-label">Note (optional)</label>
                    <input class="styled-input" [(ngModel)]="del.note" placeholder="Invoice #, batch..." />
                  </div>
                </div>
              </div>

              <div class="card-actions">
                <button mat-flat-button class="submit-btn" (click)="recordDelivery()"
                  [disabled]="!del.supplierId || !del.supplyItemId || !del.quantity || !del.unitPrice || saving">
                  <mat-icon>add_circle</mat-icon> Record Delivery
                </button>
              </div>
            </mat-card>
          </div>
        </mat-tab>

        <!-- ── DELIVERY LEDGER (owner only) ── -->
        @if (auth.isOwner()) {
        <mat-tab label="Delivery Ledger">
          <div class="tab-content">
            <mat-card class="section-card">
              <div class="ledger-header">
                <h3 class="section-title"><mat-icon>receipt_long</mat-icon> Delivery History</h3>
                <select class="styled-select narrow" [(ngModel)]="ledgerSupplierId" (ngModelChange)="loadLedger()">
                  <option [value]="undefined">Select supplier...</option>
                  @for (s of shopNeedSuppliers; track s.id) {
                    <option [value]="s.id">{{ s.name }}</option>
                  }
                </select>
              </div>

              @if (ledgerSupplierId && ledgerSupplier) {
                <div class="ledger-summary">
                  <div class="ls-item">
                    <span class="ls-label">Current Balance Owed</span>
                    <span class="ls-val red">Rs {{ ledgerSupplier.balance | number:'1.0-0' }}</span>
                  </div>
                  <div class="ls-item">
                    <span class="ls-label">Total Delivered ({{ deliveries.length }} records)</span>
                    <span class="ls-val">Rs {{ totalDelivered | number:'1.0-0' }}</span>
                  </div>
                </div>
              }

              @if (!ledgerSupplierId) {
                <div class="empty-state"><mat-icon>person_search</mat-icon><p>Select a supplier to view their delivery history.</p></div>
              } @else if (deliveries.length === 0) {
                <div class="empty-state"><mat-icon>inbox</mat-icon><p>No deliveries recorded yet for this supplier.</p></div>
              } @else {
                <div class="delivery-table">
                  <div class="dt-head">
                    <span>Date</span>
                    <span>Item</span>
                    <span>Qty</span>
                    <span>Unit Price</span>
                    <span>Amount</span>
                    <span>Note</span>
                    <span>By</span>
                    <span></span>
                  </div>
                  @for (d of deliveries; track d.id) {
                    <div class="dt-row">
                      <span class="dt-date">{{ d.deliveredAt | date:'dd/MM/yy' }}</span>
                      <span class="dt-item">{{ d.supplyItem?.name ?? '—' }}</span>
                      <span>{{ d.quantity }} {{ d.supplyItem?.unit }}</span>
                      <span>Rs {{ d.unitPrice | number:'1.2-2' }}</span>
                      <span class="dt-amount">Rs {{ d.amount | number:'1.0-0' }}</span>
                      <span class="dt-note">{{ d.note || '—' }}</span>
                      <span class="dt-by">{{ d.createdBy || '—' }}</span>
                      <button class="del-btn" (click)="deleteDelivery(d)" matTooltip="Delete & reverse balance">
                        <mat-icon>delete_outline</mat-icon>
                      </button>
                    </div>
                  }
                  <div class="dt-total">
                    <span style="grid-column: span 4">Total Delivered</span>
                    <span class="dt-amount">Rs {{ totalDelivered | number:'1.0-0' }}</span>
                  </div>
                </div>
              }
            </mat-card>
          </div>
        </mat-tab>
        } <!-- end owner-only ledger -->

        <!-- ── PRICE COMPARISON (owner only) ── -->
        @if (auth.isOwner()) {
        <mat-tab label="Price Comparison">
          <div class="tab-content">
            <mat-card class="section-card">
              <h3 class="section-title"><mat-icon>compare_arrows</mat-icon> Price Comparison by Item</h3>
              <p class="hint-text">Average price paid per item from each supplier — helps find the cheapest source.</p>

              @if (priceComparison.length === 0) {
                <div class="empty-state"><mat-icon>bar_chart</mat-icon><p>No delivery history yet to compare prices.</p></div>
              } @else {
                @for (item of groupedPrices; track item.supplyItemId) {
                  <div class="pc-group">
                    <div class="pc-item-name">{{ item.supplyItemName }}</div>
                    <div class="pc-rows">
                      @for (row of item.rows; track row.supplierId; let first = $first) {
                        <div class="pc-row" [class.cheapest]="first && item.rows.length > 1">
                          @if (first && item.rows.length > 1) { <mat-icon class="cheap-icon">star</mat-icon> }
                          @else { <mat-icon class="no-icon">store</mat-icon> }
                          <span class="pc-supplier">{{ row.supplierName }}</span>
                          <span class="pc-avg">Avg: <strong>Rs {{ row.avgPrice | number:'1.2-2' }}</strong></span>
                          <span class="pc-range">Min Rs {{ row.minPrice | number:'1.2-2' }} / Max Rs {{ row.maxPrice | number:'1.2-2' }}</span>
                          <span class="pc-last">Last: {{ row.lastDelivery | date:'dd/MM/yy' }}</span>
                        </div>
                      }
                    </div>
                  </div>
                }
              }
            </mat-card>
          </div>
        </mat-tab>
        } <!-- end owner-only price comparison -->

        <!-- ── CATALOG ── -->
        <mat-tab label="Catalog">
          <div class="tab-content">
            <mat-card class="section-card">
              <h3 class="section-title"><mat-icon>category</mat-icon> Supply Item Catalog</h3>
              <p class="hint-text">Define the items your shop consumes. These are not POS products.</p>

              <!-- Add form -->
              <div class="cat-form">
                <div class="field-wrap">
                  <label class="field-label">Item Name *</label>
                  <input class="styled-input" [(ngModel)]="newItem.name" placeholder="e.g. Shopping Bag Large" />
                </div>
                <div class="field-wrap">
                  <label class="field-label">Unit</label>
                  <input class="styled-input" [(ngModel)]="newItem.unit" placeholder="piece / kg / pack / roll" />
                </div>
                <div class="field-wrap">
                  <label class="field-label">Category</label>
                  <input class="styled-input" [(ngModel)]="newItem.category" placeholder="Packaging / Cleaning / Stationery..." />
                </div>
                <button mat-flat-button class="submit-btn small" (click)="addItem()" [disabled]="!newItem.name">
                  <mat-icon>add</mat-icon> Add Item
                </button>
              </div>

              <!-- Item list -->
              <div class="item-list">
                @for (item of supplyItems; track item.id) {
                  @if (!editingItem || editingItem.id !== item.id) {
                    <div class="item-row">
                      <div class="item-info">
                        <span class="item-name">{{ item.name }}</span>
                        <span class="item-meta">{{ item.unit }} @if (item.category) { · {{ item.category }} }</span>
                      </div>
                      <button mat-icon-button (click)="startEdit(item)" matTooltip="Edit"><mat-icon>edit</mat-icon></button>
                      <button mat-icon-button class="del-btn" (click)="deleteItem(item)" matTooltip="Remove"><mat-icon>delete_outline</mat-icon></button>
                    </div>
                  } @else {
                    <div class="item-row edit-row">
                      <input class="styled-input flex1" [(ngModel)]="editingItem.name" />
                      <input class="styled-input w80" [(ngModel)]="editingItem.unit" placeholder="unit" />
                      <input class="styled-input w120" [(ngModel)]="editingItem.category" placeholder="category" />
                      <button mat-icon-button class="save-icon" (click)="saveEdit()" matTooltip="Save"><mat-icon>check</mat-icon></button>
                      <button mat-icon-button (click)="editingItem = null" matTooltip="Cancel"><mat-icon>close</mat-icon></button>
                    </div>
                  }
                }
                @if (supplyItems.length === 0) {
                  <p class="no-data">No items yet. Add your first supply item above.</p>
                }
              </div>
            </mat-card>
          </div>
        </mat-tab>

      </mat-tab-group>
    </div>
  `,
  styles: [`
    .page-container { padding: 24px; max-width: 900px; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
    .page-title { font-size: 22px; font-weight: 700; color: #1b3050; margin: 0; }
    .page-sub { color: #888; font-size: 13px; margin: 2px 0 0; }

    .tab-content { padding: 16px 0; display: flex; flex-direction: column; gap: 14px; }
    .section-card { padding: 16px !important; }
    .section-title {
      font-size: 14px; font-weight: 700; color: #1b3050;
      margin: 0 0 8px; display: flex; align-items: center; gap: 6px;
    }
    .section-title mat-icon { font-size: 18px; width: 18px; height: 18px; color: #6b7280; }
    .hint-text { font-size: 12px; color: #6b7280; margin: 0 0 14px; }

    .form-grid { display: flex; flex-direction: column; gap: 12px; }
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .field-wrap { display: flex; flex-direction: column; gap: 4px; }
    .field-label { font-size: 12px; color: #6b7280; font-weight: 500; }
    .field-hint { font-size: 11px; color: #aaa; }
    .styled-input, .styled-select {
      border: 1px solid #e2e6ec; border-radius: 6px; padding: 8px 10px;
      font-size: 14px; color: #1b3050; font-family: inherit; outline: none;
      transition: border-color 0.15s; background: #fff; width: 100%; box-sizing: border-box;
    }
    .styled-input:focus, .styled-select:focus { border-color: #c9a84c; }
    .styled-select.narrow { width: 220px; }

    .balance-badge {
      display: flex; align-items: center; gap: 8px;
      padding: 8px 14px; border-radius: 8px; font-size: 13px;
      background: #e8f5e9; color: #2e7d32;
    }
    .balance-badge.owed { background: #fdecea; color: #c62828; }
    .balance-badge mat-icon { font-size: 18px; width: 18px; height: 18px; }

    .amount-preview {
      display: flex; align-items: center; gap: 8px;
      padding: 10px 14px; background: #f0f7ff; border-radius: 8px;
      font-size: 14px; color: #1565c0;
    }
    .amount-preview mat-icon { font-size: 18px; width: 18px; height: 18px; }

    .card-actions { margin-top: 14px; }
    .submit-btn { background: #1b3050 !important; color: #fff !important; font-size: 13px !important; }
    .submit-btn.small { height: 36px; font-size: 12px !important; }

    /* Ledger */
    .ledger-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
    .ledger-summary {
      display: flex; gap: 16px; margin-bottom: 14px; padding: 12px;
      background: #f8f9fc; border-radius: 8px; flex-wrap: wrap;
    }
    .ls-item { display: flex; flex-direction: column; gap: 2px; }
    .ls-label { font-size: 11px; color: #6b7280; }
    .ls-val { font-size: 16px; font-weight: 700; color: #1b3050; }
    .ls-val.red { color: #c62828; }

    .delivery-table { display: flex; flex-direction: column; }
    .dt-head, .dt-row {
      display: grid;
      grid-template-columns: 70px 1fr 60px 90px 90px 1fr 80px 36px;
      gap: 8px; padding: 8px 4px;
      font-size: 12px; align-items: center;
    }
    .dt-head { font-weight: 700; color: #6b7280; border-bottom: 2px solid #eef0f4; font-size: 11px; text-transform: uppercase; }
    .dt-row { border-bottom: 1px solid #f4f6f9; color: #1b3050; }
    .dt-row:last-child { border-bottom: none; }
    .dt-date { color: #6b7280; font-size: 11px; }
    .dt-item { font-weight: 600; }
    .dt-amount { font-weight: 700; }
    .dt-note { color: #6b7280; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .dt-by { font-size: 11px; color: #aaa; }
    .dt-total {
      display: grid; grid-template-columns: 70px 1fr 60px 90px 90px 1fr 80px 36px;
      gap: 8px; padding: 10px 4px 4px;
      font-size: 13px; font-weight: 700; color: #1b3050;
      border-top: 2px solid #1b3050; margin-top: 4px;
    }

    .del-btn { background: transparent; border: none; cursor: pointer; color: #c62828; display: flex; align-items: center; }
    .del-btn mat-icon { font-size: 16px; width: 16px; height: 16px; }

    /* Price comparison */
    .pc-group { margin-bottom: 18px; }
    .pc-item-name { font-size: 14px; font-weight: 700; color: #1b3050; margin-bottom: 6px; padding-bottom: 4px; border-bottom: 1px solid #eef0f4; }
    .pc-rows { display: flex; flex-direction: column; gap: 4px; }
    .pc-row {
      display: flex; align-items: center; gap: 12px;
      padding: 8px 12px; border-radius: 8px; background: #f8f9fc; font-size: 13px;
    }
    .pc-row.cheapest { background: #e8f5e9; }
    .cheap-icon { color: #c9a84c; font-size: 18px; width: 18px; height: 18px; flex-shrink: 0; }
    .no-icon { color: #6b7280; font-size: 18px; width: 18px; height: 18px; flex-shrink: 0; }
    .pc-supplier { flex: 1; font-weight: 600; color: #1b3050; }
    .pc-avg { color: #1b3050; }
    .pc-range { font-size: 11px; color: #6b7280; }
    .pc-last { font-size: 11px; color: #aaa; }

    /* Catalog */
    .cat-form { display: flex; gap: 10px; align-items: flex-end; flex-wrap: wrap; margin-bottom: 16px; }
    .cat-form .field-wrap { flex: 1; min-width: 140px; }
    .item-list { display: flex; flex-direction: column; gap: 0; }
    .item-row {
      display: flex; align-items: center; gap: 8px;
      padding: 8px 0; border-bottom: 1px solid #eef0f4;
    }
    .item-row:last-child { border-bottom: none; }
    .item-info { flex: 1; }
    .item-name { font-size: 13px; font-weight: 600; color: #1b3050; display: block; }
    .item-meta { font-size: 11px; color: #6b7280; }
    .edit-row { gap: 6px; }
    .flex1 { flex: 1; }
    .w80 { width: 80px !important; }
    .w120 { width: 120px !important; }
    .save-icon { color: #2e7d32 !important; }
    .no-data { color: #6b7280; font-size: 13px; padding: 8px 0; }

    .empty-state {
      display: flex; flex-direction: column; align-items: center;
      padding: 40px; color: #6b7280; gap: 8px;
    }
    .empty-state mat-icon { font-size: 36px; width: 36px; height: 36px; }
    .empty-state p { font-size: 14px; }

    @media (max-width: 767px) {
      .page-container { padding: 12px; max-width: 100%; }
      .page-header { flex-direction: column; gap: 8px; }
      .filter-row { flex-wrap: wrap; gap: 8px; }
      .two-col { grid-template-columns: 1fr !important; }
      .delivery-table { grid-template-columns: 1fr 50px 70px 70px 36px !important; font-size: 11px; }
    }
  `]
})
export class ShopSuppliesComponent implements OnInit {
  private supplyService = inject(ShopSupplyService);
  private deliveryService = inject(SupplierDeliveryService);
  private supplierService = inject(SupplierService);
  auth = inject(AuthService);
  private snack = inject(MatSnackBar);
  private route = inject(ActivatedRoute);

  activeTab = 0;
  saving = false;

  supplyItems: ShopSupply[] = [];
  shopNeedSuppliers: Supplier[] = [];
  deliveries: SupplierDelivery[] = [];
  priceComparison: PriceComparison[] = [];

  selectedSupplier: Supplier | undefined;
  ledgerSupplierId: number | undefined;
  get ledgerSupplier() { return this.shopNeedSuppliers.find(s => s.id === Number(this.ledgerSupplierId)); }

  del = {
    supplierId: undefined as number | undefined,
    supplyItemId: undefined as number | undefined,
    quantity: undefined as number | undefined,
    unitPrice: undefined as number | undefined,
    note: '',
    deliveredAt: new Date().toISOString().split('T')[0]
  };

  newItem = { name: '', unit: 'piece', category: '' };
  editingItem: (ShopSupply & { _orig?: ShopSupply }) | null = null;

  get totalDelivered() { return this.deliveries.reduce((s, d) => s + d.amount, 0); }

  get groupedPrices() {
    const map = new Map<number, { supplyItemId: number; supplyItemName: string; rows: PriceComparison[] }>();
    for (const row of this.priceComparison) {
      if (!map.has(row.supplyItemId)) {
        map.set(row.supplyItemId, { supplyItemId: row.supplyItemId, supplyItemName: row.supplyItemName, rows: [] });
      }
      map.get(row.supplyItemId)!.rows.push(row);
    }
    return Array.from(map.values());
  }

  ngOnInit() {
    this.loadAll();
    this.route.queryParams.subscribe(p => {
      if (p['supplierId'] && this.auth.isOwner()) {
        this.ledgerSupplierId = Number(p['supplierId']);
        this.activeTab = 1;
        this.loadLedger();
      }
    });
  }

  loadAll() {
    this.supplyService.getAll().subscribe(items => this.supplyItems = items);
    this.supplierService.getByType('SHOP_NEED').subscribe(s => {
      this.shopNeedSuppliers = s;
      if (this.ledgerSupplierId) this.loadLedger();
    });
    this.deliveryService.getPriceComparison().subscribe(p => this.priceComparison = p);
  }

  onSupplierSelect() {
    this.selectedSupplier = this.shopNeedSuppliers.find(s => s.id === Number(this.del.supplierId));
  }

  calcAmount() {}

  recordDelivery() {
    if (!this.del.supplierId || !this.del.supplyItemId || !this.del.quantity || !this.del.unitPrice) return;
    this.saving = true;
    this.deliveryService.create({
      supplierId: this.del.supplierId,
      supplyItemId: this.del.supplyItemId,
      quantity: this.del.quantity,
      unitPrice: this.del.unitPrice,
      note: this.del.note || undefined,
      deliveredAt: this.del.deliveredAt,
      createdBy: this.auth.currentUser()?.name
    }).subscribe({
      next: () => {
        this.snack.open('Delivery recorded and balance updated', '', { duration: 2000 });
        this.saving = false;
        this.del = { supplierId: undefined, supplyItemId: undefined, quantity: undefined, unitPrice: undefined, note: '', deliveredAt: new Date().toISOString().split('T')[0] };
        this.selectedSupplier = undefined;
        this.supplierService.getByType('SHOP_NEED').subscribe(s => this.shopNeedSuppliers = s);
        this.deliveryService.getPriceComparison().subscribe(p => this.priceComparison = p);
      },
      error: () => { this.saving = false; }
    });
  }

  loadLedger() {
    if (!this.ledgerSupplierId) return;
    this.deliveryService.getBySupplier(Number(this.ledgerSupplierId)).subscribe(d => this.deliveries = d);
  }

  deleteDelivery(d: SupplierDelivery) {
    const ref = this.snack.open(`Delete delivery of Rs ${d.amount}? This will reverse the balance.`, 'Delete', { duration: 5000 });
    ref.onAction().subscribe(() => {
      this.deliveryService.delete(d.id).subscribe(() => {
        this.snack.open('Delivery deleted, balance reversed', '', { duration: 2000 });
        this.supplierService.getByType('SHOP_NEED').subscribe(s => this.shopNeedSuppliers = s);
        this.loadLedger();
      });
    });
  }

  addItem() {
    if (!this.newItem.name) return;
    this.supplyService.create({ name: this.newItem.name, unit: this.newItem.unit || 'piece', category: this.newItem.category || undefined }).subscribe(() => {
      this.snack.open('Item added', '', { duration: 1500 });
      this.newItem = { name: '', unit: 'piece', category: '' };
      this.supplyService.getAll().subscribe(items => this.supplyItems = items);
    });
  }

  startEdit(item: ShopSupply) {
    this.editingItem = { ...item };
  }

  saveEdit() {
    if (!this.editingItem) return;
    this.supplyService.update(this.editingItem.id, { name: this.editingItem.name, unit: this.editingItem.unit, category: this.editingItem.category }).subscribe(() => {
      this.snack.open('Item updated', '', { duration: 1500 });
      this.editingItem = null;
      this.supplyService.getAll().subscribe(items => this.supplyItems = items);
    });
  }

  deleteItem(item: ShopSupply) {
    const ref = this.snack.open(`Remove "${item.name}" from catalog?`, 'Remove', { duration: 4000 });
    ref.onAction().subscribe(() => {
      this.supplyService.delete(item.id).subscribe(() => {
        this.snack.open('Item removed', '', { duration: 1500 });
        this.supplyService.getAll().subscribe(items => this.supplyItems = items);
      });
    });
  }
}
