import { Component, inject, OnInit, OnDestroy, computed, signal, HostListener, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import { LayoutService } from '../../core/services/layout.service';
import { BarcodeService } from '../../core/services/barcode.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ProductService, CategoryService, SalespersonService } from '../../core/services/product.service';
import { HeldSaleService } from '../../core/services/sale.service';
import { SessionService } from '../../core/services/session.service';
import { AuthService } from '../../core/services/auth.service';
import { Product, Category, Salesperson } from '../../core/models/product.model';
import { CartItem } from '../../core/models/sale.model';
import { CheckoutDialogComponent } from './components/checkout-dialog/checkout-dialog.component';
import { ReceiptDialogComponent } from './components/receipt-dialog/receipt-dialog.component';
import { HoldSaleDialogComponent } from './components/hold-sale-dialog/hold-sale-dialog.component';
import { HeldSalesDialogComponent } from './components/held-sales-dialog/held-sales-dialog.component';
import { ReturnDialogComponent } from './components/return-dialog/return-dialog.component';
import { OpenSessionDialogComponent } from './components/open-session-dialog/open-session-dialog.component';
import { CashDialogComponent } from './components/cash-dialog/cash-dialog.component';
import { QuickSaleDialogComponent } from './components/quick-sale-dialog/quick-sale-dialog.component';

@Component({
  selector: 'app-pos',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatChipsModule, MatBadgeModule, MatDialogModule,
    MatSnackBarModule, MatTooltipModule, MatProgressSpinnerModule,
    QuickSaleDialogComponent
  ],
  template: `
    <div class="pos-wrapper">

      <!-- ── Top Header ── -->
      <div class="pos-header">
        <div class="header-left">
          <button class="icon-btn" (click)="layout.toggle()"><mat-icon>menu</mat-icon></button>
          <h1 class="page-title">Point of Sale</h1>
        </div>
        <div class="header-center">
          <div class="search-box">
            <mat-icon class="search-icon">search</mat-icon>
            <input #searchInput class="search-input" [(ngModel)]="searchQuery"
              (ngModelChange)="onSearchInput()"
              (keydown)="onSearchKeydown($event)"
              (blur)="onSearchBlur()"
              placeholder="Search products by name, SKU or barcode..." />
            <kbd class="search-kbd">Ctrl + K</kbd>
            @if (searchQuery) {
              <button class="clear-search-btn" (click)="searchQuery=''; onSearch()">
                <mat-icon>close</mat-icon>
              </button>
            }
          </div>
        </div>
        <div class="header-right">
          <button class="quick-sale-header-btn" (click)="openQuickSale()">
            <mat-icon>bolt</mat-icon> Quick Sale
          </button>
          <button class="icon-btn"><mat-icon>qr_code_scanner</mat-icon></button>
          <button class="icon-btn notif-btn" (click)="openHeldSales()">
            <mat-icon>notifications</mat-icon>
            @if (heldCount > 0) {
              <span class="notif-badge">{{ heldCount }}</span>
            }
          </button>
        </div>
      </div>

      <!-- ── Body ── -->
      <div class="pos-body">

        <!-- Left: Product Panel -->
        <div class="product-panel">

          <!-- Category bar -->
          <div class="category-bar">
            <div class="cat-tabs">
              <button class="cat-tab" [class.active]="!selectedCategory" (click)="selectCategory(null)">All</button>
              @for (cat of categories; track cat.id) {
                <button class="cat-tab" [class.active]="selectedCategory === cat.id" (click)="selectCategory(cat.id)">
                  {{ cat.name }}
                </button>
              }
            </div>
            <button class="filter-btn">
              <mat-icon>tune</mat-icon> Filter
            </button>
          </div>

          <!-- Product grid -->
          @if (!loadingProducts) {
            <div class="product-grid">
              @for (product of products; track product.id) {
                <div class="product-card" [class.out-of-stock]="product.stockQuantity <= 0"
                  (click)="addToCart(product)">
                  @if (product.badge) {
                    <div class="badge" [class]="'badge-' + product.badge.toLowerCase()">{{ product.badge }}</div>
                  }
                  <div class="product-image">
                    @if (product.imageUrl) {
                      <img [src]="product.imageUrl" [alt]="product.name" />
                    } @else {
                      <div class="no-image"><mat-icon>inventory_2</mat-icon></div>
                    }
                  </div>
                  <div class="product-info">
                    <div class="product-name">{{ product.name }}</div>
                    <div class="product-price">LKR {{ product.retailPrice | number:'1.0-0' }}</div>
                    @if (product.stockQuantity <= 0) {
                      <div class="product-stock out-of-stock-label">Out of Stock</div>
                    } @else {
                      <div class="product-stock" [class.low-stock]="product.stockQuantity <= product.minStockAlert">
                        Stock: {{ product.stockQuantity }}
                      </div>
                    }
                  </div>
                  @if (product.stockQuantity > 0) {
                    <div class="add-overlay"><mat-icon>add_shopping_cart</mat-icon></div>
                  }
                </div>
              }
              @if (products.length === 0) {
                <div class="no-products">No products found</div>
              }
            </div>
          } @else {
            <div class="loading-center"><mat-spinner diameter="40" /></div>
          }
        </div>

        <!-- Mobile cart FAB -->
        <button class="mobile-cart-fab" (click)="mobileCartOpen = true">
          <mat-icon>shopping_cart</mat-icon>
          @if (cart().length > 0) {
            <span class="fab-badge">{{ cart().length }}</span>
          }
          @if (cartTotal() > 0) {
            <span class="fab-total">LKR {{ cartTotal() | number:'1.0-0' }}</span>
          }
        </button>

        <!-- Mobile cart overlay -->
        @if (mobileCartOpen) {
          <div class="mobile-cart-overlay" (click)="mobileCartOpen = false"></div>
        }

        <!-- Right: Cart Panel -->
        <div class="cart-panel" [class.mobile-open]="mobileCartOpen">
          <button class="mobile-cart-close" (click)="mobileCartOpen = false">
            <mat-icon>keyboard_arrow_down</mat-icon>
          </button>

          <!-- Cart header -->
          <div class="cart-header">
            <span class="cart-title">Cart <span class="cart-count">({{ cart().length }})</span></span>
            @if (cart().length) {
              <button class="clear-cart-btn" (click)="clearCart()">
                Clear Cart <mat-icon>delete_outline</mat-icon>
              </button>
            }
          </div>

          <!-- Cart items -->
          <div class="cart-items">
            @if (cart().length === 0) {
              <div class="empty-cart">
                <mat-icon>shopping_cart</mat-icon>
                <p>Cart is empty</p>
                <p class="hint">Click a product to add</p>
              </div>
            }
            @for (item of cart(); track item.productId; let i = $index) {
              <div class="cart-item">
                <div class="cart-item-img">
                  @if (item.imageUrl) {
                    <img [src]="item.imageUrl" [alt]="item.productName" />
                  } @else {
                    <mat-icon>inventory_2</mat-icon>
                  }
                </div>
                <div class="cart-item-body">
                  <div class="cart-item-row1">
                    <span class="cart-item-name">{{ item.productName }}</span>
                    <button class="remove-btn" (click)="removeFromCart(i)">
                      <mat-icon>close</mat-icon>
                    </button>
                  </div>
                  <div class="cart-item-price">LKR {{ item.unitPrice | number:'1.0-0' }}</div>
                  <div class="cart-item-row2">
                    <div class="qty-control">
                      <button (click)="changeQty(i, -1)"><mat-icon>remove</mat-icon></button>
                      <input type="number" [(ngModel)]="item.quantity" (change)="onQtyChange(i)" min="0.5" class="qty-input" />
                      <button (click)="changeQty(i, 1)"><mat-icon>add</mat-icon></button>
                    </div>
                    <span class="item-total">LKR {{ item.subtotal | number:'1.0-0' }}</span>
                  </div>
                  <div class="cart-item-disc-row">
                    <span class="disc-label">Disc LKR</span>
                    <input type="number" [ngModel]="item.itemDiscount || null" (ngModelChange)="setItemDiscount(i, $event)"
                      min="0" [max]="item.unitPrice * item.quantity" placeholder="0" class="disc-input" />
                    @if (item.itemDiscount > 0) {
                      <span class="disc-save">-{{ item.itemDiscount | number:'1.0-0' }}</span>
                    }
                  </div>
                </div>
              </div>
            }
          </div>

          <!-- Cart summary -->
          @if (cart().length > 0) {
            <div class="cart-summary">
              <div class="summary-row">
                <span>Subtotal</span>
                <span>LKR {{ subtotal() | number:'1.0-0' }}</span>
              </div>
              @if (totalDiscount() > 0) {
                <div class="summary-row">
                  <span>Item Discounts</span>
                  <span class="discount-val">- LKR {{ totalDiscount() | number:'1.0-0' }}</span>
                </div>
              }
              <div class="summary-row bill-disc-row">
                <span>Bill Discount</span>
                <div class="bill-disc-input-wrap">
                  <input type="number" [ngModel]="billDiscountPct() || null" (ngModelChange)="billDiscountPct.set(+$event || 0)"
                    min="0" max="100" placeholder="0" class="bill-disc-input" />
                  <span class="bill-disc-prefix">%</span>
                  @if (billDiscountAmt() > 0) {
                    <span class="disc-save">-{{ billDiscountAmt() | number:'1.0-0' }}</span>
                  }
                </div>
              </div>
              <div class="disc-chips">
                @for (pct of discChips; track pct) {
                  <button class="disc-chip" [class.active]="billDiscountPct() === pct" (click)="billDiscountPct.set(pct)">{{ pct }}%</button>
                }
                @if (billDiscountPct() > 0) {
                  <button class="disc-chip clear-chip" (click)="billDiscountPct.set(0)">Clear</button>
                }
              </div>
              <div class="summary-row total-row">
                <span>Total</span>
                <span class="total-val">LKR {{ cartTotal() | number:'1.0-0' }}</span>
              </div>
            </div>
          }

          <!-- Checkout / Hold -->
          <div class="cart-actions">
            <div class="sale-type-toggle">
              <button [class.active]="saleType === 'RETAIL'" (click)="setSaleType('RETAIL')">RETAIL</button>
              <button [class.active]="saleType === 'WHOLESALE'" (click)="setSaleType('WHOLESALE')">WHOLESALE</button>
            </div>
            <button class="checkout-btn" (click)="openCheckout()" [disabled]="cart().length === 0">
              Checkout <kbd>F2</kbd>
            </button>
            <button class="hold-btn" (click)="holdSale()" [disabled]="cart().length === 0">
              Hold Sale <kbd>F3</kbd>
            </button>
          </div>

          <!-- Bottom action buttons -->
          <div class="bottom-actions">
            <button class="action-btn cash-in-btn" (click)="openCashIn()" [disabled]="!session()">
              <mat-icon>arrow_downward</mat-icon>
              <span>Cash In</span>
            </button>
            <button class="action-btn cash-out-btn" (click)="openCashOut()" [disabled]="!session()">
              <mat-icon>arrow_upward</mat-icon>
              <span>Cash Out</span>
            </button>
            <button class="action-btn" (click)="openHeldSales()" [disabled]="!session()">
              <mat-icon>history</mat-icon>
              <span>Held Sales</span>
            </button>
            <button class="action-btn return-btn" (click)="openReturn()" [disabled]="!session()">
              <mat-icon>assignment_return</mat-icon>
              <span>Return</span>
            </button>
            @if (!session() && !auth.isOwner()) {
              <button class="action-btn open-session-btn" (click)="openSession()">
                <mat-icon>play_circle_outline</mat-icon>
                <span>Open Session</span>
              </button>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./pos.component.scss']
})
export class PosComponent implements OnInit, AfterViewInit, OnDestroy {
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private salespersonService = inject(SalespersonService);
  layout = inject(LayoutService);
  private barcodeService = inject(BarcodeService);
  private heldSaleService = inject(HeldSaleService);
  private sessionService = inject(SessionService);
  auth = inject(AuthService);
  private dialog = inject(MatDialog);
  private snack = inject(MatSnackBar);

  @ViewChild('searchInput') searchInputRef!: ElementRef<HTMLInputElement>;

  session = this.sessionService.currentSession;

  products: Product[] = [];
  categories: Category[] = [];
  salespersons: Salesperson[] = [];
  cart = signal<CartItem[]>([]);
  billDiscountPct = signal(0);
  discChips = [5, 10, 15, 20];
  searchQuery = '';
  selectedCategory: number | null = null;
  selectedSalespersonId: number | null = null;
  saleType: 'RETAIL' | 'WHOLESALE' = 'RETAIL';
  loadingProducts = false;
  heldCount = 0;
  mobileCartOpen = false;

  private scanFirstCharTime = 0;
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  subtotal = computed(() => this.cart().reduce((sum, i) => sum + (i.unitPrice * i.quantity), 0));
  totalDiscount = computed(() => this.cart().reduce((sum, i) => sum + i.itemDiscount, 0));
  itemsTotal = computed(() => this.cart().reduce((sum, i) => sum + i.subtotal, 0));
  billDiscountAmt = computed(() => this.itemsTotal() * this.billDiscountPct() / 100);
  cartTotal = computed(() => this.itemsTotal() - this.billDiscountAmt());

  ngOnInit() {
    this.searchSubject.pipe(debounceTime(300), takeUntil(this.destroy$))
      .subscribe(() => this.loadProducts());

    this.loadProducts();
    this.categoryService.getAll().subscribe(cats => this.categories = cats);
    this.salespersonService.getAll().subscribe(sps => {
      this.salespersons = sps;
      if (sps.length) this.selectedSalespersonId = sps[0].id;
    });
    this.sessionService.loadCurrent().subscribe(s => {
      if (!s && !this.auth.isOwner()) {
        setTimeout(() => this.openSession(), 300);
      } else {
        this.refreshHeldCount();
      }
    });
  }

  private isMobile = window.matchMedia('(max-width: 767px)').matches ||
                     ('ontouchstart' in window);

  ngAfterViewInit() {
    if (!this.isMobile) this.focusSearch();
  }

  focusSearch() {
    if (this.isMobile) return;
    setTimeout(() => this.searchInputRef?.nativeElement?.focus(), 50);
  }

  onSearchBlur() {
    if (this.isMobile) return;
    if (!this.dialog.openDialogs.length) {
      setTimeout(() => {
        const active = document.activeElement;
        const tag = active?.tagName?.toLowerCase();
        if (tag === 'input' || tag === 'textarea') return;
        this.searchInputRef?.nativeElement?.focus();
      }, 150);
    }
  }

  @HostListener('window:keydown', ['$event'])
  onKey(e: KeyboardEvent) {
    if (this.isMobile) return;
    if (e.key === 'F2') { e.preventDefault(); this.openCheckout(); }
    if (e.key === 'F3') { e.preventDefault(); this.holdSale(); }
    if (e.ctrlKey && e.key === 'k') { e.preventDefault(); this.focusSearch(); }
    if (e.key === 'Escape') { this.searchQuery = ''; this.onSearch(); this.focusSearch(); }
  }

  onSearchInput() {
    if (!this.scanFirstCharTime) this.scanFirstCharTime = Date.now();
    if (this.searchQuery.length === 0) {
      this.scanFirstCharTime = 0;
      this.loadProducts(); // clear immediately, no debounce needed
    } else {
      this.searchSubject.next(this.searchQuery); // debounced API call
    }
  }

  ngOnDestroy() { this.destroy$.next(); this.destroy$.complete(); }

  onSearchKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      const elapsed = this.scanFirstCharTime ? Date.now() - this.scanFirstCharTime : Infinity;
      const value = this.searchQuery.trim();
      this.scanFirstCharTime = 0;

      if (value && elapsed < 100 && this.barcodeService.looksLikeBarcode(value)) {
        this.lookupByBarcode(value);
      } else if (value) {
        this.onSearch();
      }
    } else {
      if (!this.scanFirstCharTime) {
        this.scanFirstCharTime = Date.now();
      }
    }
  }

  private lookupByBarcode(barcode: string) {
    this.productService.getByBarcode(barcode).subscribe({
      next: product => {
        this.addToCart(product);
        this.searchQuery = '';
        this.scanFirstCharTime = 0;
        this.focusSearch();
      },
      error: () => {
        this.snack.open(`Product not found: ${barcode}`, 'OK', { duration: 3000 });
        this.searchQuery = '';
        this.scanFirstCharTime = 0;
        this.focusSearch();
      }
    });
  }

  loadProducts() {
    this.loadingProducts = true;
    this.productService.getAll(this.searchQuery || undefined, this.selectedCategory || undefined).subscribe({
      next: products => { this.products = products; this.loadingProducts = false; },
      error: () => this.loadingProducts = false
    });
  }

  onSearch() { this.selectedCategory = null; this.loadProducts(); }
  selectCategory(id: number | null) { this.selectedCategory = id; this.searchQuery = ''; this.loadProducts(); }

  addToCart(product: Product) {
    if (!this.session()) {
      this.openSession();
      return;
    }
    if (product.stockQuantity <= 0) {
      this.snack.open(`${product.name} is out of stock`, '', { duration: 2000 });
      return;
    }
    const items = this.cart();
    const existingIdx = items.findIndex(i => i.productId === product.id);
    if (existingIdx >= 0) {
      const current = items[existingIdx];
      if (current.quantity >= product.stockQuantity) {
        this.snack.open(`Only ${product.stockQuantity} in stock`, '', { duration: 2000 });
        return;
      }
      this.cart.update(arr => {
        const next = [...arr];
        const item = { ...next[existingIdx], quantity: next[existingIdx].quantity + 1 };
        const gross = item.unitPrice * item.quantity;
        item.subtotal = gross - item.itemDiscount;
        next[existingIdx] = item;
        return next;
      });
    } else {
      const price = this.saleType === 'WHOLESALE' && product.wholesalePrice ? product.wholesalePrice : product.retailPrice;
      this.cart.update(arr => [...arr, {
        productId: product.id,
        productName: product.name,
        barcode: product.barcode,
        imageUrl: product.imageUrl,
        quantity: 1,
        unitPrice: price,
        priceType: this.saleType,
        itemDiscount: 0,
        itemDiscountPct: 0,
        subtotal: price,
        stockQuantity: product.stockQuantity,
        unit: product.unit,
        retailPrice: product.retailPrice,
        wholesalePrice: product.wholesalePrice,
        minWholesaleQty: product.minWholesaleQty,
        costPrice: product.costPrice
      }]);
      if (product.stockQuantity <= product.minStockAlert) {
        this.snack.open(`Low stock: ${product.name} (${product.stockQuantity} left)`, '', { duration: 3000 });
      }
    }
  }

  removeFromCart(i: number) { this.cart.update(arr => arr.filter((_, idx) => idx !== i)); }
  clearCart() { this.cart.set([]); this.billDiscountPct.set(0); }

  changeQty(i: number, delta: number) {
    this.cart.update(arr => {
      const next = [...arr];
      const cur = next[i];
      const newQty = Math.max(0.5, cur.quantity + delta);
      if (delta > 0 && newQty > cur.stockQuantity) {
        this.snack.open(`Only ${cur.stockQuantity} in stock`, '', { duration: 2000 });
        return arr;
      }
      const item = { ...cur, quantity: newQty };
      const gross = item.unitPrice * item.quantity;
      item.itemDiscount = Math.min(item.itemDiscount, gross);
      item.subtotal = gross - item.itemDiscount;
      next[i] = item;
      return next;
    });
  }

  onQtyChange(i: number) {
    this.cart.update(arr => {
      const next = [...arr];
      const item = { ...next[i] };
      if (item.quantity <= 0) item.quantity = 1;
      if (item.quantity > item.stockQuantity) item.quantity = item.stockQuantity;
      const gross = item.unitPrice * item.quantity;
      item.itemDiscount = Math.min(item.itemDiscount, gross);
      item.subtotal = gross - item.itemDiscount;
      next[i] = item;
      return next;
    });
  }

  recalcItem(i: number) {
    this.cart.update(arr => {
      const next = [...arr];
      const item = { ...next[i] };
      const gross = item.unitPrice * item.quantity;
      item.itemDiscount = Math.min(item.itemDiscount, gross);
      item.subtotal = Math.max(0, gross - item.itemDiscount);
      next[i] = item;
      return next;
    });
  }

  setItemDiscount(i: number, amount: number) {
    this.cart.update(arr => {
      const next = [...arr];
      const item = { ...next[i] };
      const gross = item.unitPrice * item.quantity;
      item.itemDiscount = Math.min(Math.max(0, +amount || 0), gross);
      item.itemDiscountPct = gross > 0 ? (item.itemDiscount / gross) * 100 : 0;
      item.subtotal = gross - item.itemDiscount;
      next[i] = item;
      return next;
    });
  }

  setSaleType(type: 'RETAIL' | 'WHOLESALE') {
    this.saleType = type;
    this.cart.update(arr => arr.map(item => {
      const p = this.products.find(p => p.id === item.productId);
      if (!p) return item;
      const price = type === 'WHOLESALE' && p.wholesalePrice ? p.wholesalePrice : p.retailPrice;
      const gross = price * item.quantity;
      const disc = Math.min(item.itemDiscount, gross);
      return { ...item, unitPrice: price, priceType: type, itemDiscount: disc, subtotal: gross - disc };
    }));
  }

  openCheckout() {
    if (!this.cart().length || !this.session()) return;
    const ref = this.dialog.open(CheckoutDialogComponent, {
      width: '480px',
      data: {
        cart: this.cart(),
        subtotal: this.subtotal(),
        totalDiscount: this.totalDiscount(),
        billDiscount: this.billDiscountAmt(),
        cartTotal: this.cartTotal(),
        sessionId: this.session()!.id,
        salespersonId: this.selectedSalespersonId,
        salespersons: this.salespersons,
        saleType: this.saleType
      }
    });
    ref.afterClosed().subscribe(result => {
      if (result) {
        const soldItems = this.cart();
        this.dialog.open(ReceiptDialogComponent, {
          width: '420px',
          data: result
        }).afterClosed().subscribe(() => {
          this.products = this.products.map(p => {
            const sold = soldItems.find(i => i.productId === p.id);
            return sold ? { ...p, stockQuantity: Math.max(0, p.stockQuantity - sold.quantity) } : p;
          });
          this.clearCart();
          this.refreshHeldCount();
        });
      }
    });
  }

  holdSale() {
    if (!this.cart().length || !this.session()) return;
    const ref = this.dialog.open(HoldSaleDialogComponent, {
      width: '380px',
      data: {
        cart: this.cart(),
        sessionId: this.session()!.id,
        salespersonId: this.selectedSalespersonId,
        saleType: this.saleType
      }
    });
    ref.afterClosed().subscribe(held => {
      if (held) {
        this.clearCart();
        this.heldCount++;
        this.snack.open('Sale held successfully', 'OK', { duration: 2000 });
      }
    });
  }

  openHeldSales() {
    if (!this.session()) return;
    const ref = this.dialog.open(HeldSalesDialogComponent, {
      width: '480px',
      data: { sessionId: this.session()!.id }
    });
    ref.afterClosed().subscribe(resumed => {
      if (resumed) {
        const items = JSON.parse(resumed.items) as CartItem[];
        this.cart.set(items);
        this.saleType = resumed.saleType;
        this.heldSaleService.delete(resumed.id).subscribe(() => this.refreshHeldCount());
      }
    });
  }

  openReturn() {
    if (!this.session()) return;
    this.dialog.open(ReturnDialogComponent, {
      width: '640px',
      data: { sessionId: this.session()!.id, salespersonId: this.selectedSalespersonId }
    }).afterClosed().subscribe(result => {
      if (result) this.snack.open('Return processed successfully', '', { duration: 2500 });
    });
  }

  openQuickSale() {
    this.dialog.open(QuickSaleDialogComponent, { width: '560px' })
      .afterClosed().subscribe(result => {
        if (result === 'saved') {
          this.snack.open('Quick sale recorded', '', { duration: 2000 });
          this.loadProducts();
        }
      });
  }

  openSession() {
    const ref = this.dialog.open(OpenSessionDialogComponent, { width: '400px', disableClose: true });
    ref.afterClosed().subscribe(opened => {
      if (opened) this.snack.open('Session opened!', 'OK', { duration: 2000 });
    });
  }

  openCashIn() {
    if (!this.session()) return;
    this.dialog.open(CashDialogComponent, {
      width: '400px',
      data: { type: 'IN', sessionId: this.session()!.id }
    }).afterClosed().subscribe(done => {
      if (done) this.snack.open('Cash In recorded', '', { duration: 2000 });
    });
  }

  openCashOut() {
    if (!this.session()) return;
    this.dialog.open(CashDialogComponent, {
      width: '400px',
      data: { type: 'OUT', sessionId: this.session()!.id }
    }).afterClosed().subscribe(done => {
      if (done) this.snack.open('Cash Out recorded', '', { duration: 2000 });
    });
  }

  private refreshHeldCount() {
    const s = this.session();
    if (s) {
      this.heldSaleService.getBySession(s.id).subscribe(held => this.heldCount = held.length);
    }
  }
}
