import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { debounceTime, Subject } from 'rxjs';
import { PurchaseNeedService } from '../../core/services/purchase-need.service';
import { ShopSupplyService } from '../../core/services/shop-supply.service';
import { AuthService } from '../../core/services/auth.service';
import { PurchaseNeed, NeedStatus, NeedCategory } from '../../core/models/purchase-need.model';
import { ShopSupply } from '../../core/models/shop-supply.model';

type Tab = 'needed' | 'resolved' | 'all';

@Component({
  selector: 'app-needs',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatSnackBarModule, MatTooltipModule],
  template: `
    <div class="page">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Purchase Needs</h1>
          <p class="page-sub">Flag items to buy · Owner marks them done</p>
        </div>
        <div class="header-right">
          @if (neededCount > 0) {
            <div class="urgent-badge">{{ neededCount }} pending</div>
          }
          <button class="add-btn" (click)="openAddForm()">
            <mat-icon>add</mat-icon> Add Need
          </button>
        </div>
      </div>

      <!-- Smart search / add bar -->
      <div class="search-add-card">
        <div class="search-row">
          <div class="search-wrap" [class.focused]="searchFocused">
            <mat-icon class="search-icon">search</mat-icon>
            <input
              class="search-input"
              [(ngModel)]="searchQuery"
              (ngModelChange)="onSearchChange()"
              (focus)="searchFocused = true; showDropdown = true"
              (blur)="onSearchBlur()"
              placeholder="Search existing needs or type new item name..."
              autocomplete="off" />
            @if (searchQuery) {
              <button class="clear-btn" (mousedown)="clearSearch()"><mat-icon>close</mat-icon></button>
            }
          </div>
        </div>

        <!-- Dropdown results -->
        @if (showDropdown && searchQuery.trim()) {
          <div class="dropdown">
            <!-- Matching existing needs -->
            @if (searchResults.length > 0) {
              <div class="dropdown-section-label">Existing needs</div>
              @for (n of searchResults; track n.id) {
                <div class="dropdown-item" (mousedown)="selectExistingNeed(n)">
                  <div class="di-left">
                    <span class="di-status-dot" [class]="'dot-' + n.status.toLowerCase()"></span>
                    <div>
                      <div class="di-name">{{ n.name }}</div>
                      <div class="di-meta">
                        {{ n.status === 'NEEDED' ? 'Pending · by ' + n.requestedBy : n.status === 'PURCHASED' ? 'Purchased' : 'Dismissed' }}
                        @if (n.quantity) { · {{ n.quantity }} {{ n.unit || '' }} }
                      </div>
                    </div>
                  </div>
                  <span class="di-tag" [class]="'tag-' + n.status.toLowerCase()">{{ n.status }}</span>
                </div>
              }
            }

            <!-- Matching catalog items -->
            @if (catalogMatches.length > 0) {
              <div class="dropdown-section-label">From catalog</div>
              @for (s of catalogMatches; track s.id) {
                <div class="dropdown-item" (mousedown)="prefillFromCatalog(s)">
                  <mat-icon class="di-catalog-icon">inventory_2</mat-icon>
                  <div>
                    <div class="di-name">{{ s.name }}</div>
                    <div class="di-meta">Catalog item · {{ s.unit }}</div>
                  </div>
                  <span class="di-tag tag-catalog">Add</span>
                </div>
              }
            }

            <!-- Add new option -->
            <div class="dropdown-add" (mousedown)="startAddFromSearch()">
              <mat-icon>add_circle</mat-icon>
              <span>Add "<strong>{{ searchQuery.trim() }}</strong>" as new need</span>
            </div>
          </div>
        }
      </div>

      <!-- Inline add form -->
      @if (showAddForm) {
        <div class="add-form-card">
          <div class="form-title">
            <mat-icon>add_shopping_cart</mat-icon>
            <span>New Purchase Need</span>
            <button class="close-form-btn" (click)="cancelAdd()"><mat-icon>close</mat-icon></button>
          </div>
          <!-- Category selector -->
          <div class="form-cat-selector">
            <button class="form-cat-btn" [class.active]="form.category === 'STORE'" (click)="form.category = 'STORE'">
              <mat-icon>storefront</mat-icon>
              <div>
                <div class="fcb-title">From Our Store</div>
                <div class="fcb-sub">Take from our own stock</div>
              </div>
            </button>
            <button class="form-cat-btn" [class.active]="form.category === 'PURCHASE'" (click)="form.category = 'PURCHASE'">
              <mat-icon>shopping_cart</mat-icon>
              <div>
                <div class="fcb-title">Buy from Supplier</div>
                <div class="fcb-sub">Purchase from outside</div>
              </div>
            </button>
          </div>

          <div class="form-grid">
            <div class="form-field full">
              <label>Item Name *</label>
              <input [(ngModel)]="form.name" placeholder="What needs to be purchased?" />
            </div>
            <div class="form-field">
              <label>Quantity</label>
              <input type="number" [(ngModel)]="form.quantity" placeholder="e.g. 100" min="0" />
            </div>
            <div class="form-field">
              <label>Unit</label>
              <input [(ngModel)]="form.unit" placeholder="pcs / kg / pkt" />
            </div>
            <div class="form-field full">
              <label>Notes (optional)</label>
              <textarea [(ngModel)]="form.notes" rows="2" placeholder="Any specific details, brand, size..."></textarea>
            </div>
          </div>
          <div class="form-actions">
            <button class="cancel-btn" (click)="cancelAdd()">Cancel</button>
            <button class="submit-btn" (click)="submitNeed()" [disabled]="!form.name.trim() || saving">
              <mat-icon>send</mat-icon>
              {{ saving ? 'Saving...' : 'Submit Need' }}
            </button>
          </div>
        </div>
      }

      <!-- Re-request panel for selected existing need -->
      @if (selectedNeed) {
        <div class="rerequest-card" [class]="'rr-' + selectedNeed.status.toLowerCase()">
          <div class="rr-header">
            <span class="rr-status-dot" [class]="'dot-' + selectedNeed.status.toLowerCase()"></span>
            <div class="rr-info">
              <div class="rr-name">{{ selectedNeed.name }}</div>
              <div class="rr-meta">
                @if (selectedNeed.status === 'NEEDED') {
                  Pending · Requested by <strong>{{ selectedNeed.requestedBy }}</strong> · {{ selectedNeed.requestedAt | date:'MMM d, h:mm a' }}
                } @else if (selectedNeed.status === 'PURCHASED') {
                  Purchased · Resolved by <strong>{{ selectedNeed.resolvedBy }}</strong> · {{ selectedNeed.resolvedAt | date:'MMM d' }}
                } @else {
                  Dismissed · by <strong>{{ selectedNeed.resolvedBy }}</strong>
                }
              </div>
              @if (selectedNeed.notes) { <div class="rr-notes">"{{ selectedNeed.notes }}"</div> }
            </div>
            <button class="close-form-btn" (click)="selectedNeed = null"><mat-icon>close</mat-icon></button>
          </div>
          <div class="rr-actions">
            @if (selectedNeed.status === 'NEEDED') {
              <p class="rr-hint">This item is already pending. Owner will mark it purchased when done.</p>
              @if (auth.isOwner()) {
                <button class="action-purchased" (click)="markPurchased(selectedNeed)">
                  <mat-icon>check_circle</mat-icon> Mark Purchased
                </button>
                <button class="action-dismiss" (click)="markDismissed(selectedNeed)">
                  <mat-icon>cancel</mat-icon> Dismiss
                </button>
              }
            } @else {
              <p class="rr-hint">Need to buy this again?</p>
              <button class="action-rerequest" (click)="reRequest(selectedNeed)">
                <mat-icon>refresh</mat-icon> Mark as Needed Again
              </button>
            }
          </div>
        </div>
      }

      <!-- Category filter -->
      <div class="category-filter">
        <button class="cat-filter-btn" [class.active]="categoryFilter === null" (click)="categoryFilter = null">
          All
        </button>
        <button class="cat-filter-btn store" [class.active]="categoryFilter === 'STORE'" (click)="categoryFilter = 'STORE'">
          <mat-icon>storefront</mat-icon>
          From Our Store
          @if (storeCount > 0) { <span class="cf-count">{{ storeCount }}</span> }
        </button>
        <button class="cat-filter-btn purchase" [class.active]="categoryFilter === 'PURCHASE'" (click)="categoryFilter = 'PURCHASE'">
          <mat-icon>shopping_cart</mat-icon>
          Buy from Supplier
          @if (purchaseCount > 0) { <span class="cf-count">{{ purchaseCount }}</span> }
        </button>
      </div>

      <!-- Status tabs -->
      <div class="tab-bar">
        <button class="tab-btn" [class.active]="activeTab === 'needed'" (click)="activeTab = 'needed'">
          Pending
          @if (neededCount > 0) { <span class="tab-count">{{ neededCount }}</span> }
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'resolved'" (click)="activeTab = 'resolved'">
          Resolved
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'all'" (click)="activeTab = 'all'">
          All
        </button>
      </div>

      <!-- Needs list -->
      <div class="needs-list">
        @if (loading) {
          <div class="empty-state"><mat-icon class="spin">refresh</mat-icon><p>Loading...</p></div>
        } @else if (displayNeeds.length === 0) {
          <div class="empty-state">
            <mat-icon>check_circle_outline</mat-icon>
            <p>{{ activeTab === 'needed' ? 'No pending items — all clear!' : 'No items here.' }}</p>
          </div>
        } @else {
          @for (need of displayNeeds; track need.id) {
            <div class="need-card" [class]="'nc-' + need.status.toLowerCase()">
              <div class="nc-left">
                <div class="status-dot-wrap">
                  <span class="status-dot" [class]="'dot-' + need.status.toLowerCase()"></span>
                </div>
                <div class="nc-body">
                  <div class="nc-name-row">
                    <span class="nc-name">{{ need.name }}</span>
                    <span class="cat-badge" [class]="'cat-' + need.category.toLowerCase()">
                      <mat-icon>{{ need.category === 'STORE' ? 'storefront' : 'shopping_cart' }}</mat-icon>
                      {{ need.category === 'STORE' ? 'From Store' : 'Buy from Supplier' }}
                    </span>
                  </div>
                  <div class="nc-meta">
                    @if (need.quantity) {
                      <span class="meta-qty">{{ need.quantity }} {{ need.unit || '' }}</span>
                      <span class="meta-sep">·</span>
                    }
                    @if (need.status === 'NEEDED') {
                      <span>By <strong>{{ need.requestedBy }}</strong></span>
                      <span class="meta-sep">·</span>
                      <span class="meta-time">{{ need.requestedAt | date:'MMM d, h:mm a' }}</span>
                    } @else if (need.status === 'PURCHASED') {
                      <span class="meta-resolved">Purchased by <strong>{{ need.resolvedBy }}</strong></span>
                      <span class="meta-sep">·</span>
                      <span class="meta-time">{{ need.resolvedAt | date:'MMM d' }}</span>
                    } @else {
                      <span class="meta-resolved">Dismissed by <strong>{{ need.resolvedBy }}</strong></span>
                    }
                    @if (need.supplyItem) {
                      <span class="meta-sep">·</span>
                      <span class="meta-catalog"><mat-icon>inventory_2</mat-icon>{{ need.supplyItem.name }}</span>
                    }
                  </div>
                  @if (need.notes) {
                    <div class="nc-notes">"{{ need.notes }}"</div>
                  }
                </div>
              </div>

              <div class="nc-actions">
                @if (auth.isOwner()) {
                  <button class="icon-action cat-toggle"
                    [matTooltip]="need.category === 'STORE' ? 'Move to: Buy from Supplier' : 'Move to: From Our Store'"
                    (click)="toggleCategory(need)">
                    <mat-icon>{{ need.category === 'STORE' ? 'shopping_cart' : 'storefront' }}</mat-icon>
                  </button>
                }
                @if (need.status === 'NEEDED') {
                  @if (auth.isOwner()) {
                    <button class="icon-action purchased" (click)="markPurchased(need)" matTooltip="Mark Purchased">
                      <mat-icon>check_circle</mat-icon>
                    </button>
                    <button class="icon-action dismiss" (click)="markDismissed(need)" matTooltip="Dismiss">
                      <mat-icon>cancel</mat-icon>
                    </button>
                  }
                } @else {
                  <button class="icon-action rerequest" (click)="reRequest(need)" matTooltip="Need again">
                    <mat-icon>refresh</mat-icon>
                  </button>
                  @if (auth.isOwner()) {
                    <button class="icon-action del" (click)="deleteNeed(need)" matTooltip="Delete">
                      <mat-icon>delete_outline</mat-icon>
                    </button>
                  }
                }
              </div>
            </div>
          }
        }
      </div>
    </div>
  `,
  styles: [`
    .page { padding: 24px; max-width: 760px; margin: 0 auto; }

    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
    .page-title { font-size: 22px; font-weight: 700; color: #1b3050; margin: 0; }
    .page-sub { color: #6b7280; font-size: 13px; margin: 3px 0 0; }
    .header-right { display: flex; align-items: center; gap: 10px; }
    .urgent-badge {
      background: #fef3c7; color: #92400e; font-size: 13px; font-weight: 700;
      padding: 5px 14px; border-radius: 20px; border: 1px solid #fde68a;
    }
    .add-btn {
      display: flex; align-items: center; gap: 6px;
      padding: 9px 18px; background: #1b3050; color: #fff;
      border: none; border-radius: 10px; cursor: pointer;
      font-size: 13px; font-weight: 600; font-family: 'Inter', sans-serif;
      transition: background 0.15s;
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
      &:hover { background: #2d4a73; }
    }

    /* Search */
    .search-add-card { background: #fff; border-radius: 12px; border: 1px solid #eef0f4; padding: 16px; margin-bottom: 14px; position: relative; }
    .search-row { display: flex; gap: 10px; }
    .search-wrap {
      flex: 1; display: flex; align-items: center; gap: 8px;
      border: 1.5px solid #e2e6ec; border-radius: 10px; padding: 0 12px; height: 44px;
      transition: border-color 0.15s;
    }
    .search-wrap.focused { border-color: #c9a84c; }
    .search-icon { color: #6b7280; font-size: 20px; }
    .search-input {
      flex: 1; border: none; background: transparent; font-size: 14px;
      outline: none; font-family: 'Inter', sans-serif; color: #1b3050;
      &::placeholder { color: #9ca3af; }
    }
    .clear-btn {
      background: none; border: none; cursor: pointer; color: #9ca3af; display: flex; padding: 2px;
      &:hover { color: #6b7280; }
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
    }

    /* Dropdown */
    .dropdown {
      position: absolute; top: calc(100% + 4px); left: 0; right: 0;
      background: #fff; border: 1px solid #e2e6ec; border-radius: 10px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.12); z-index: 50; overflow: hidden;
    }
    .dropdown-section-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; padding: 8px 14px 4px; }
    .dropdown-item {
      display: flex; align-items: center; gap: 10px; padding: 10px 14px; cursor: pointer;
      transition: background 0.1s;
      &:hover { background: #f4f6f9; }
    }
    .di-left { display: flex; align-items: center; gap: 10px; flex: 1; }
    .di-name { font-size: 14px; font-weight: 600; color: #1b3050; }
    .di-meta { font-size: 12px; color: #6b7280; margin-top: 1px; }
    .di-catalog-icon { color: #6b7280; font-size: 18px; width: 18px; height: 18px; }
    .di-tag {
      font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 10px; flex-shrink: 0;
    }
    .tag-needed { background: #fef3c7; color: #92400e; }
    .tag-purchased { background: #d1fae5; color: #065f46; }
    .tag-dismissed { background: #f3f4f6; color: #6b7280; }
    .tag-catalog { background: #e0e7ff; color: #3730a3; }
    .dropdown-add {
      display: flex; align-items: center; gap: 10px; padding: 10px 14px; cursor: pointer;
      border-top: 1px solid #f4f6f9; color: #1b3050; font-size: 14px; font-weight: 500;
      transition: background 0.1s;
      mat-icon { color: #c9a84c; font-size: 20px; }
      &:hover { background: #fffbf0; }
    }

    /* Status dots */
    .di-status-dot, .status-dot, .rr-status-dot {
      width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; display: inline-block;
    }
    .dot-needed { background: #f59e0b; }
    .dot-purchased { background: #10b981; }
    .dot-dismissed { background: #d1d5db; }

    /* Category filter */
    .category-filter { display: flex; gap: 10px; margin-bottom: 12px; flex-wrap: wrap; }
    .cat-filter-btn {
      display: flex; align-items: center; gap: 6px;
      padding: 9px 18px; border: 1.5px solid #e2e6ec; border-radius: 10px;
      background: #fff; color: #6b7280; font-size: 13px; font-weight: 600;
      cursor: pointer; font-family: 'Inter', sans-serif; transition: all 0.15s;
      mat-icon { font-size: 17px; width: 17px; height: 17px; }
      &:hover { border-color: #9ca3af; color: #1b3050; }
      &.active { border-color: #1b3050; color: #1b3050; background: #f0f4f8; }
    }
    .cat-filter-btn.store.active { border-color: #7b5ea7; color: #7b5ea7; background: #f5f0fc; }
    .cat-filter-btn.purchase.active { border-color: #1b3050; color: #1b3050; background: #f0f4f8; }
    .cf-count {
      background: #f59e0b; color: #fff; font-size: 11px; font-weight: 700;
      min-width: 18px; height: 18px; border-radius: 9px; padding: 0 5px;
      display: flex; align-items: center; justify-content: center;
    }

    /* Category badge on card */
    .nc-name-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 4px; }
    .nc-name { font-size: 15px; font-weight: 700; color: #1b3050; }
    .cat-badge {
      display: inline-flex; align-items: center; gap: 3px;
      font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 10px; flex-shrink: 0;
      mat-icon { font-size: 11px; width: 11px; height: 11px; }
    }
    .cat-store { background: #f5f0fc; color: #7b5ea7; }
    .cat-purchase { background: #e8f0fe; color: #1b3050; }

    /* Form category selector */
    .form-cat-selector { display: flex; gap: 10px; margin-bottom: 16px; }
    .form-cat-btn {
      flex: 1; display: flex; align-items: center; gap: 10px;
      padding: 12px 14px; border: 1.5px solid #e2e6ec; border-radius: 10px;
      background: #fff; cursor: pointer; font-family: 'Inter', sans-serif;
      transition: all 0.15s; text-align: left;
      mat-icon { font-size: 22px; color: #9ca3af; flex-shrink: 0; }
      &:hover { border-color: #9ca3af; }
      &.active { border-color: #1b3050; background: #f0f4f8; mat-icon { color: #1b3050; } }
    }
    .form-cat-btn:first-child.active { border-color: #7b5ea7; background: #f5f0fc; mat-icon { color: #7b5ea7; } }
    .fcb-title { font-size: 13px; font-weight: 700; color: #1b3050; }
    .fcb-sub { font-size: 11px; color: #6b7280; margin-top: 1px; }

    /* Add form */
    .add-form-card {
      background: #fff; border-radius: 12px; border: 1.5px solid #c9a84c;
      padding: 20px; margin-bottom: 14px;
    }
    .form-title {
      display: flex; align-items: center; gap: 8px; margin-bottom: 16px;
      font-size: 15px; font-weight: 700; color: #1b3050;
      mat-icon { color: #c9a84c; }
    }
    .close-form-btn {
      margin-left: auto; background: none; border: none; cursor: pointer;
      color: #6b7280; display: flex; padding: 2px;
      mat-icon { font-size: 20px; }
      &:hover { color: #1b3050; }
    }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; }
    .form-field { display: flex; flex-direction: column; gap: 5px; }
    .form-field.full { grid-column: 1 / -1; }
    .form-field label { font-size: 12px; font-weight: 600; color: #374151; }
    .form-field input, .form-field textarea {
      border: 1.5px solid #e2e6ec; border-radius: 8px; padding: 8px 12px;
      font-size: 14px; font-family: 'Inter', sans-serif; color: #1b3050; outline: none; resize: vertical;
      &:focus { border-color: #c9a84c; }
      &::placeholder { color: #9ca3af; }
    }
    .form-actions { display: flex; gap: 10px; justify-content: flex-end; }
    .cancel-btn {
      padding: 9px 18px; border: 1.5px solid #e2e6ec; border-radius: 8px;
      background: #fff; color: #6b7280; cursor: pointer; font-size: 13px; font-weight: 600;
      font-family: 'Inter', sans-serif;
      &:hover { border-color: #9ca3af; }
    }
    .submit-btn {
      display: flex; align-items: center; gap: 6px;
      padding: 9px 20px; background: #1b3050; color: #fff; border: none; border-radius: 8px;
      cursor: pointer; font-size: 13px; font-weight: 600; font-family: 'Inter', sans-serif;
      mat-icon { font-size: 16px; width: 16px; height: 16px; }
      &:hover:not(:disabled) { background: #2d4a73; }
      &:disabled { opacity: 0.4; cursor: default; }
    }

    /* Re-request panel */
    .rerequest-card {
      background: #fff; border-radius: 12px; border: 1.5px solid #e2e6ec;
      padding: 16px; margin-bottom: 14px;
    }
    .rr-needed { border-color: #fde68a; background: #fffbf0; }
    .rr-purchased { border-color: #a7f3d0; background: #f0fdf4; }
    .rr-dismissed { border-color: #e5e7eb; background: #f9fafb; }
    .rr-header { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 12px; }
    .rr-info { flex: 1; }
    .rr-name { font-size: 15px; font-weight: 700; color: #1b3050; margin-bottom: 3px; }
    .rr-meta { font-size: 12px; color: #6b7280; }
    .rr-notes { font-size: 12px; color: #9ca3af; font-style: italic; margin-top: 3px; }
    .rr-actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .rr-hint { font-size: 13px; color: #6b7280; flex: 1; }

    /* Tabs */
    .tab-bar { display: flex; gap: 4px; margin-bottom: 14px; }
    .tab-btn {
      display: flex; align-items: center; gap: 6px;
      padding: 7px 18px; border: 1.5px solid #e2e6ec; border-radius: 20px;
      background: #fff; color: #6b7280; font-size: 13px; font-weight: 600;
      cursor: pointer; font-family: 'Inter', sans-serif; transition: all 0.15s;
      &:hover { border-color: #c9a84c; color: #1b3050; }
      &.active { background: #1b3050; color: #fff; border-color: #1b3050; }
    }
    .tab-count {
      background: #f59e0b; color: #fff; font-size: 11px; font-weight: 700;
      width: 18px; height: 18px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
    }
    .tab-btn.active .tab-count { background: #c9a84c; color: #1b3050; }

    /* Needs list */
    .needs-list { display: flex; flex-direction: column; gap: 10px; }
    .need-card {
      background: #fff; border-radius: 12px; border: 1px solid #eef0f4;
      padding: 14px 16px; display: flex; align-items: flex-start; gap: 12px;
      transition: box-shadow 0.15s;
      &:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    }
    .nc-purchased { opacity: 0.75; }
    .nc-dismissed { opacity: 0.5; }
    .status-dot-wrap { padding-top: 5px; }
    .nc-body { flex: 1; min-width: 0; }
    .nc-meta { display: flex; align-items: center; flex-wrap: wrap; gap: 4px; font-size: 12px; color: #6b7280; }
    .meta-qty { font-weight: 600; color: #374151; }
    .meta-sep { color: #d1d5db; }
    .meta-time { color: #9ca3af; }
    .meta-resolved { color: #2e7d32; }
    .nc-dismissed .meta-resolved { color: #9ca3af; }
    .meta-catalog { display: flex; align-items: center; gap: 2px; color: #6366f1; mat-icon { font-size: 13px; width: 13px; height: 13px; } }
    .nc-notes { font-size: 12px; color: #9ca3af; font-style: italic; margin-top: 5px; }
    .nc-actions { display: flex; gap: 4px; flex-shrink: 0; }
    .icon-action {
      width: 32px; height: 32px; border: none; border-radius: 8px; cursor: pointer;
      display: flex; align-items: center; justify-content: center; transition: all 0.15s;
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
    }
    .icon-action.purchased { background: #d1fae5; color: #065f46; &:hover { background: #a7f3d0; } }
    .icon-action.dismiss { background: #f3f4f6; color: #6b7280; &:hover { background: #e5e7eb; } }
    .icon-action.rerequest { background: #e0e7ff; color: #3730a3; &:hover { background: #c7d2fe; } }
    .icon-action.del { background: #fef2f2; color: #c62828; &:hover { background: #fee2e2; } }
    .icon-action.cat-toggle { background: #f5f0fc; color: #7b5ea7; &:hover { background: #ede4f7; } }

    /* Action buttons in re-request panel */
    .action-purchased, .action-dismiss, .action-rerequest {
      display: flex; align-items: center; gap: 6px; padding: 7px 16px;
      border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600;
      font-family: 'Inter', sans-serif; border: none; transition: all 0.15s;
      mat-icon { font-size: 16px; width: 16px; height: 16px; }
    }
    .action-purchased { background: #10b981; color: #fff; &:hover { background: #059669; } }
    .action-dismiss { background: #f3f4f6; color: #6b7280; &:hover { background: #e5e7eb; } }
    .action-rerequest { background: #1b3050; color: #fff; &:hover { background: #2d4a73; } }

    /* Empty / loading */
    .empty-state { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 60px 0; color: #9ca3af; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; }
    .empty-state p { font-size: 14px; }
    .spin { animation: spin 1s linear infinite; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

    @media (max-width: 767px) {
      .page { padding: 14px; }
      .category-filter { gap: 6px; }
      .cat-filter-btn { font-size: 12px; padding: 7px 12px; }
      .form-cat-selector { flex-direction: column; }
    }
  `]
})
export class NeedsComponent implements OnInit {
  private needsService = inject(PurchaseNeedService);
  private supplyService = inject(ShopSupplyService);
  auth = inject(AuthService);
  private snack = inject(MatSnackBar);

  needs: PurchaseNeed[] = [];
  searchResults: PurchaseNeed[] = [];
  catalogMatches: ShopSupply[] = [];
  allCatalog: ShopSupply[] = [];
  loading = false;
  saving = false;
  activeTab: Tab = 'needed';
  categoryFilter: NeedCategory | null = null;
  searchQuery = '';
  searchFocused = false;
  showDropdown = false;
  showAddForm = false;
  selectedNeed: PurchaseNeed | null = null;

  form = { name: '', quantity: null as number | null, unit: '', notes: '', category: 'PURCHASE' as NeedCategory, supplyItemId: null as number | null };

  private searchSubject = new Subject<string>();

  get neededCount()   { return this.filteredByCategory.filter(n => n.status === 'NEEDED').length; }
  get storeCount()    { return this.needs.filter(n => n.status === 'NEEDED' && n.category === 'STORE').length; }
  get purchaseCount() { return this.needs.filter(n => n.status === 'NEEDED' && n.category === 'PURCHASE').length; }

  private get filteredByCategory(): PurchaseNeed[] {
    return this.categoryFilter ? this.needs.filter(n => n.category === this.categoryFilter) : this.needs;
  }

  get displayNeeds(): PurchaseNeed[] {
    const base = this.filteredByCategory;
    if (this.activeTab === 'needed')   return base.filter(n => n.status === 'NEEDED');
    if (this.activeTab === 'resolved') return base.filter(n => n.status !== 'NEEDED');
    return base;
  }

  ngOnInit() {
    this.load();
    this.supplyService.getAll().subscribe(s => this.allCatalog = s);
    this.searchSubject.pipe(debounceTime(250)).subscribe(q => this.runSearch(q));
  }

  load() {
    this.loading = true;
    this.needsService.getAll().subscribe({
      next: needs => { this.needs = needs; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  onSearchChange() {
    this.searchSubject.next(this.searchQuery);
    this.showDropdown = true;
    this.selectedNeed = null;
    this.showAddForm = false;
  }

  runSearch(q: string) {
    const query = q.trim().toLowerCase();
    if (!query) { this.searchResults = []; this.catalogMatches = []; return; }
    // local filter for speed
    this.searchResults = this.needs.filter(n => n.name.toLowerCase().includes(query)).slice(0, 5);
    this.catalogMatches = this.allCatalog.filter(s =>
      s.name.toLowerCase().includes(query) &&
      !this.searchResults.some(r => r.supplyItem?.id === s.id)
    ).slice(0, 3);
  }

  onSearchBlur() {
    setTimeout(() => { this.showDropdown = false; this.searchFocused = false; }, 200);
  }

  clearSearch() {
    this.searchQuery = '';
    this.searchResults = [];
    this.catalogMatches = [];
    this.showDropdown = false;
  }

  selectExistingNeed(need: PurchaseNeed) {
    this.selectedNeed = need;
    this.showDropdown = false;
    this.showAddForm = false;
    this.clearSearch();
  }

  prefillFromCatalog(supply: ShopSupply) {
    this.form = { name: supply.name, quantity: null, unit: supply.unit, notes: '', category: 'PURCHASE', supplyItemId: supply.id };
    this.showAddForm = true;
    this.showDropdown = false;
    this.searchQuery = '';
  }

  startAddFromSearch() {
    this.form = { name: this.searchQuery.trim(), quantity: null, unit: '', notes: '', category: 'PURCHASE', supplyItemId: null };
    this.showAddForm = true;
    this.showDropdown = false;
    this.searchQuery = '';
  }

  openAddForm() {
    this.form = { name: '', quantity: null, unit: '', notes: '', category: 'PURCHASE', supplyItemId: null };
    this.showAddForm = true;
    this.showDropdown = false;
    this.selectedNeed = null;
  }

  cancelAdd() {
    this.showAddForm = false;
    this.form = { name: '', quantity: null, unit: '', notes: '', category: 'PURCHASE', supplyItemId: null };
  }

  submitNeed() {
    if (!this.form.name?.trim()) return;
    this.saving = true;
    this.needsService.create({
      name: this.form.name.trim(),
      quantity: this.form.quantity ?? undefined,
      unit: this.form.unit || undefined,
      notes: this.form.notes || undefined,
      category: this.form.category,
      requestedBy: this.auth.currentUser()?.name || 'Unknown',
      supplyItemId: this.form.supplyItemId ?? undefined
    }).subscribe({
      next: created => {
        this.needs = [created, ...this.needs];
        this.saving = false;
        this.cancelAdd();
        this.activeTab = 'needed';
        this.snack.open(`"${created.name}" added to purchase needs`, '', { duration: 2500 });
      },
      error: () => { this.saving = false; this.snack.open('Failed to save', '', { duration: 2500 }); }
    });
  }

  toggleCategory(need: PurchaseNeed) {
    const next: NeedCategory = need.category === 'STORE' ? 'PURCHASE' : 'STORE';
    this.needsService.updateCategory(need.id, next).subscribe(updated => {
      this.updateNeed(updated);
      const label = next === 'STORE' ? 'From Our Store' : 'Buy from Supplier';
      this.snack.open(`"${need.name}" moved to ${label}`, '', { duration: 2500 });
    });
  }

  markPurchased(need: PurchaseNeed) {
    const by = this.auth.currentUser()?.name || 'Owner';
    this.needsService.markPurchased(need.id, by).subscribe(updated => {
      this.updateNeed(updated);
      this.selectedNeed = null;
      this.snack.open(`"${need.name}" marked as purchased`, '', { duration: 2500 });
    });
  }

  markDismissed(need: PurchaseNeed) {
    const by = this.auth.currentUser()?.name || 'Owner';
    this.needsService.dismiss(need.id, by).subscribe(updated => {
      this.updateNeed(updated);
      this.selectedNeed = null;
      this.snack.open(`"${need.name}" dismissed`, '', { duration: 2500 });
    });
  }

  reRequest(need: PurchaseNeed) {
    const by = this.auth.currentUser()?.name || 'Unknown';
    this.needsService.reRequest(need.id, by).subscribe(updated => {
      this.updateNeed(updated);
      this.selectedNeed = null;
      this.activeTab = 'needed';
      this.snack.open(`"${need.name}" re-added to pending list`, '', { duration: 2500 });
    });
  }

  deleteNeed(need: PurchaseNeed) {
    this.needsService.delete(need.id).subscribe(() => {
      this.needs = this.needs.filter(n => n.id !== need.id);
      this.snack.open('Deleted', '', { duration: 2000 });
    });
  }

  private updateNeed(updated: PurchaseNeed) {
    this.needs = this.needs.map(n => n.id === updated.id ? updated : n);
  }
}
