import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { SaleService } from '../../../../core/services/sale.service';
import { CartItem } from '../../../../core/models/sale.model';
import { PrintService } from '../../../../core/services/print.service';
import { SaleReceiptData } from '../../../../core/models/print.model';
import { Salesperson } from '../../../../core/models/product.model';
import { CustomerService } from '../../../../core/services/customer.service';
import { Customer } from '../../../../core/models/customer.model';

@Component({
  selector: 'app-checkout-dialog',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatDialogModule, MatButtonModule,
    MatIconModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatRadioModule, MatProgressSpinnerModule, MatAutocompleteModule
  ],
  template: `
    <div class="checkout-dialog">
      <h2 mat-dialog-title>CHECKOUT</h2>
      <mat-dialog-content>
        <div class="summary-section">
          <div class="summary-row">
            <span>Items</span><span>{{ data.cart.length }}</span>
          </div>
          <div class="summary-row">
            <span>Subtotal</span><span>LKR {{ data.subtotal | number:'1.2-2' }}</span>
          </div>
          @if (data.totalDiscount > 0) {
            <div class="summary-row discount">
              <span>Item Discounts</span><span>- LKR {{ data.totalDiscount | number:'1.2-2' }}</span>
            </div>
          }
          @if (data.billDiscount > 0) {
            <div class="summary-row discount">
              <span>Bill Discount</span><span>- LKR {{ data.billDiscount | number:'1.2-2' }}</span>
            </div>
          }
          <div class="summary-row total-row">
            <span>TOTAL</span><span>LKR {{ total | number:'1.2-2' }}</span>
          </div>
        </div>

        <div class="payment-section">
          @if (data.salespersons.length) {
            <mat-form-field appearance="outline" class="full-width" style="margin-bottom:4px">
              <mat-label>Salesperson</mat-label>
              <mat-select [(ngModel)]="selectedSalespersonId">
                @for (sp of data.salespersons; track sp.id) {
                  <mat-option [value]="sp.id">{{ sp.name }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
          }

          <!-- Customer selector: shown for wholesale or credit -->
          @if (isWholesale || paymentMethod === 'CREDIT') {
            <mat-form-field appearance="outline" class="full-width" style="margin-bottom:4px">
              <mat-label>{{ paymentMethod === 'CREDIT' ? 'Customer *' : 'Customer' }}</mat-label>
              <mat-icon matPrefix>person</mat-icon>
              <input matInput
                [ngModel]="customerSearch"
                (ngModelChange)="onCustomerSearch($event)"
                [matAutocomplete]="customerAuto"
                placeholder="Search by name or phone..." />
              @if (selectedCustomer) {
                <button matSuffix mat-icon-button (click)="clearCustomer()">
                  <mat-icon>close</mat-icon>
                </button>
              }
              <mat-autocomplete #customerAuto="matAutocomplete" (optionSelected)="selectCustomer($event.option.value)">
                @for (c of filteredCustomers; track c.id) {
                  <mat-option [value]="c">
                    <span class="customer-option">
                      <span class="c-name">{{ c.name }}</span>
                      @if (c.phone) { <span class="c-phone">{{ c.phone }}</span> }
                    </span>
                  </mat-option>
                }
                @if (filteredCustomers.length === 0 && customerSearch.length > 1) {
                  <mat-option disabled>No customers found</mat-option>
                }
              </mat-autocomplete>
              @if (paymentMethod === 'CREDIT' && !selectedCustomer) {
                <mat-hint class="hint-warn">Required for credit sales</mat-hint>
              }
              @if (selectedCustomer) {
                <mat-hint class="hint-ok">{{ selectedCustomer.name }}{{ selectedCustomer.phone ? ' · ' + selectedCustomer.phone : '' }}</mat-hint>
              }
            </mat-form-field>
          }

          <p class="section-label">Payment Method</p>
          <div class="payment-methods">
            @for (m of methods; track m.value) {
              <button class="method-btn" [class.active]="paymentMethod === m.value" (click)="paymentMethod = m.value; calcChange()">
                <mat-icon>{{ m.icon }}</mat-icon> {{ m.label }}
              </button>
            }
          </div>

          @if (paymentMethod === 'CASH') {
            <mat-form-field appearance="outline" class="full-width mt-10">
              <mat-label>Cash Given (LKR)</mat-label>
              <input matInput type="number" [ngModel]="cashTendered || null" (ngModelChange)="cashTendered = +$event || 0; calcChange()" placeholder="0" />
            </mat-form-field>
            <div class="quick-chips">
              @for (amt of cashChips; track amt) {
                <button class="quick-chip" [class.active]="cashTendered === amt" (click)="setCash(amt)">
                  {{ amt | number:'1.0-0' }}
                </button>
              }
              <button class="quick-chip exact-chip" (click)="setCash(total)">Exact</button>
            </div>
            @if (cashTendered > 0) {
              <div class="change-display" [class.insufficient]="change < 0">
                @if (change < 0) {
                  <span>Insufficient "” need LKR {{ (-change) | number:'1.2-2' }} more</span>
                } @else {
                  <span>Change: <strong>LKR {{ change | number:'1.2-2' }}</strong></span>
                }
              </div>
            }
          }

          @if (paymentMethod === 'CREDIT') {
            <div class="credit-notice">
              <mat-icon>info_outline</mat-icon>
              <span>This sale will be recorded as credit. Ensure the customer is selected above.</span>
            </div>
          }

          <!-- Manual name only for retail non-credit when no customer picker shown -->
          @if (!isWholesale && paymentMethod !== 'CREDIT') {
            <mat-form-field appearance="outline" class="full-width mt-10">
              <mat-label>Customer Name (optional)</mat-label>
              <input matInput [(ngModel)]="customerName" />
            </mat-form-field>
          }

          <mat-form-field appearance="outline" class="full-width mt-10">
            <mat-label>Notes (optional)</mat-label>
            <input matInput [(ngModel)]="notes" />
          </mat-form-field>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button (click)="dialogRef.close()">CANCEL</button>
        <button mat-flat-button class="confirm-btn" (click)="confirm()" [disabled]="confirmDisabled">
          @if (loading) { <mat-spinner diameter="18" /> }
          @else { CONFIRM SALE }
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .checkout-dialog { min-width: 420px; }
    h2 { color: #1b3050; font-weight: 700; padding: 16px 24px 0; }
    mat-dialog-content { padding: 0 24px; }
    .summary-section { margin-bottom: 16px; }
    .summary-row {
      display: flex; justify-content: space-between; align-items: center;
      padding: 7px 0; border-bottom: 1px solid #f0f0f0; font-size: 14px;
    }
    .discount { color: #c62828; }
    .total-row { font-weight: 700; font-size: 17px; color: #1b3050; border-bottom: none; }
    .section-label { font-weight: 600; margin-bottom: 8px; color: #6b7280; font-size: 13px; }
    .payment-methods { display: flex; gap: 8px; margin-bottom: 4px; }
    .method-btn {
      flex: 1; padding: 10px 8px; border: 1px solid #e2e6ec; border-radius: 8px;
      background: #fff; cursor: pointer; font-size: 12px; font-weight: 600;
      display: flex; flex-direction: column; align-items: center; gap: 4px;
      font-family: 'Inter', sans-serif; transition: all 0.15s; color: #6b7280;
    }
    .method-btn:hover { border-color: #c9a84c; color: #1b3050; }
    .method-btn.active { border-color: #c9a84c; background: #c9a84c; color: #1b3050; }
    .quick-chips { display: flex; gap: 6px; flex-wrap: wrap; margin: -4px 0 8px; }
    .quick-chip {
      padding: 4px 12px; border: 1px solid #e2e6ec; border-radius: 16px;
      background: #fff; font-size: 12px; font-weight: 600; color: #6b7280;
      cursor: pointer; font-family: 'Inter', sans-serif; transition: all 0.15s;
      &:hover { border-color: #c9a84c; color: #1b3050; }
      &.active { border-color: #c9a84c; background: #c9a84c; color: #1b3050; }
    }
    .exact-chip { color: #2e7d32; border-color: #a5d6a7; &:hover { background: #e8f5e9; border-color: #2e7d32; color: #2e7d32; } }
    .change-display {
      background: #e8f5e9; color: #2e7d32; border-radius: 6px;
      padding: 8px 12px; font-size: 13px; margin-bottom: 8px;
    }
    .change-display.insufficient { background: #fdecea; color: #c62828; }
    .credit-notice {
      display: flex; align-items: flex-start; gap: 8px;
      background: #fff8e1; border: 1px solid #ffe082; border-radius: 8px;
      padding: 10px 12px; font-size: 13px; color: #7b5e00; margin: 8px 0;
    }
    .credit-notice mat-icon { font-size: 18px; width: 18px; height: 18px; flex-shrink: 0; margin-top: 1px; }
    .customer-option { display: flex; flex-direction: column; }
    .c-name { font-weight: 600; font-size: 13px; }
    .c-phone { font-size: 11px; color: #888; }
    .hint-warn { color: #c62828 !important; font-size: 11px; }
    .hint-ok { color: #2e7d32 !important; font-size: 11px; }
    .full-width { width: 100%; }
    .mt-10 { margin-top: 10px; }
    .confirm-btn { background: #2e7d32 !important; color: #fff !important; min-width: 140px; }
    mat-dialog-actions { padding: 12px 24px 16px; }
  `]
})
export class CheckoutDialogComponent implements OnInit {
  dialogRef = inject(MatDialogRef<CheckoutDialogComponent>);
  data: {
    cart: CartItem[]; subtotal: number; totalDiscount: number;
    billDiscount: number; cartTotal: number; sessionId: number;
    salespersonId: number; salespersons: Salesperson[]; saleType: string;
  } = inject(MAT_DIALOG_DATA);
  private saleService = inject(SaleService);
  private printService = inject(PrintService);
  private customerService = inject(CustomerService);

  total = 0;
  paymentMethod: 'CASH' | 'CARD' | 'CREDIT' = 'CASH';
  cashTendered = 0;
  change = 0;
  customerName = '';
  notes = '';
  loading = false;
  selectedSalespersonId: number | null = null;

  cashChips = [100, 500, 1000, 2000, 5000];

  // Customer picker state
  customers: Customer[] = [];
  filteredCustomers: Customer[] = [];
  selectedCustomer: Customer | null = null;
  customerSearch = '';

  get isWholesale() { return this.data.saleType === 'WHOLESALE'; }

  get confirmDisabled(): boolean {
    if (this.loading) return true;
    if (this.paymentMethod === 'CASH' && this.cashTendered < this.total) return true;
    if (this.paymentMethod === 'CREDIT' && !this.selectedCustomer) return true;
    return false;
  }

  methods: { value: 'CASH' | 'CARD' | 'CREDIT'; label: string; icon: string }[] = [
    { value: 'CASH',   label: 'Cash',   icon: 'payments' },
    { value: 'CARD',   label: 'Card',   icon: 'credit_card' },
    { value: 'CREDIT', label: 'Credit', icon: 'account_balance' }
  ];

  ngOnInit() {
    this.total = this.data.cartTotal;
    this.selectedSalespersonId = this.data.salespersonId;
    this.calcChange();
    this.customerService.getAll().subscribe(c => {
      this.customers = c;
      this.filteredCustomers = c;
    });
  }

  onCustomerSearch(value: string) {
    this.customerSearch = value;
    this.selectedCustomer = null;
    const q = value.toLowerCase();
    this.filteredCustomers = q.length > 0
      ? this.customers.filter(c =>
          c.name.toLowerCase().includes(q) ||
          (c.phone || '').includes(q)
        )
      : this.customers;
  }

  selectCustomer(customer: Customer) {
    this.selectedCustomer = customer;
    this.customerSearch = customer.name;
    this.customerName = customer.name;
  }

  clearCustomer() {
    this.selectedCustomer = null;
    this.customerSearch = '';
    this.customerName = '';
    this.filteredCustomers = this.customers;
  }

  calcChange() {
    this.change = this.cashTendered - this.total;
  }

  setCash(amount: number) {
    this.cashTendered = Math.ceil(amount);
    this.calcChange();
  }

  confirm() {
    this.loading = true;
    const req = {
      sessionId: this.data.sessionId,
      salespersonId: this.selectedSalespersonId,
      saleType: this.data.saleType,
      customerName: this.selectedCustomer?.name || this.customerName || undefined,
      items: this.data.cart.map(i => ({
        productId: i.productId,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        priceType: i.priceType,
        itemDiscount: i.itemDiscount,
        itemDiscountPct: i.itemDiscountPct
      })),
      cartDiscountPct: 0,
      paymentMethod: this.paymentMethod,
      cashTendered: this.paymentMethod === 'CASH' ? this.cashTendered : undefined,
      notes: this.notes || undefined
    };

    this.saleService.checkout(req as any).subscribe({
      next: result => {
        if (localStorage.getItem('pos_auto_print') !== 'false') {
          this.autoPrint(result);
        }
        this.dialogRef.close({
          ...result,
          _itemDiscount: this.data.totalDiscount,
          _billDiscount: this.data.billDiscount,
          _netSubtotal: this.data.subtotal - this.data.totalDiscount,
          _total: this.total,
          _changeAmount: this.paymentMethod === 'CASH' ? this.change : undefined,
          _items: this.data.cart.map(i => ({
            name: i.productName, quantity: i.quantity,
            unitPrice: i.unitPrice, discount: i.itemDiscount, subtotal: i.subtotal
          }))
        });
      },
      error: err => {
        this.loading = false;
        alert(err.error?.message || 'Checkout failed');
      }
    });
  }

  private autoPrint(result: any): void {
    const receiptData: SaleReceiptData = {
      saleId: result.saleId,
      date: result.receipt?.date ?? new Date().toISOString(),
      salespersonName: result.receipt?.salesperson ?? '',
      saleType: this.data.saleType as 'RETAIL' | 'WHOLESALE',
      customerName: this.selectedCustomer?.name || this.customerName || undefined,
      items: this.data.cart.map(i => ({
        name: i.productName, quantity: i.quantity,
        unitPrice: i.unitPrice, discount: i.itemDiscount, subtotal: i.subtotal
      })),
      subtotal: this.data.subtotal,
      itemDiscount: this.data.totalDiscount,
      cartDiscount: this.data.billDiscount,
      total: this.total,
      paymentMethod: this.paymentMethod,
      cashTendered: this.paymentMethod === 'CASH' ? this.cashTendered : undefined,
      changeAmount: this.paymentMethod === 'CASH' ? this.change : undefined
    };
    this.printService.printReceipt(receiptData).catch(() => {});
  }
}


