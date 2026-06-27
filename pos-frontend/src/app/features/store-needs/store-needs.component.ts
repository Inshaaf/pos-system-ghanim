import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, NgTemplateOutlet } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PurchaseNeedService } from '../../core/services/purchase-need.service';
import { AuthService } from '../../core/services/auth.service';
import { PurchaseNeed } from '../../core/models/purchase-need.model';

@Component({
  selector: 'app-store-needs',
  standalone: true,
  imports: [CommonModule, NgTemplateOutlet, MatIconModule, MatButtonModule, MatSnackBarModule, MatTooltipModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Store Needs</h1>
          <p class="page-sub">Items the shop needs from our store · Mark them when available</p>
        </div>
        <div class="header-stats">
          <div class="stat-chip pending">
            <mat-icon>schedule</mat-icon>
            {{ pendingCount }} Pending
          </div>
          <div class="stat-chip avail">
            <mat-icon>check_circle</mat-icon>
            {{ availableCount }} Ready
          </div>
        </div>
      </div>

      @if (loading) {
        <div class="empty-state">
          <mat-icon class="spin">refresh</mat-icon>
          <p>Loading...</p>
        </div>
      } @else if (needs.length === 0) {
        <div class="empty-state">
          <mat-icon>warehouse</mat-icon>
          <p>No store needs at the moment.</p>
        </div>
      } @else {
        <!-- Pending section -->
        @if (pendingNeeds.length > 0) {
          <div class="section-label">
            <mat-icon>schedule</mat-icon> Pending — needs to be found
          </div>
          @for (need of pendingNeeds; track need.id) {
            <ng-container *ngTemplateOutlet="needCard; context: { $implicit: need }"></ng-container>
          }
        }

        <!-- Available section -->
        @if (availableNeeds.length > 0) {
          <div class="section-label avail-label">
            <mat-icon>check_circle</mat-icon> Available at Store
          </div>
          @for (need of availableNeeds; track need.id) {
            <ng-container *ngTemplateOutlet="needCard; context: { $implicit: need }"></ng-container>
          }
        }
      }
    </div>

    <ng-template #needCard let-need>
      <div class="need-card" [class.avail-card]="need.storeStatus === 'AVAILABLE'">
        <div class="nc-left">
          <div class="nc-icon" [class.avail-icon]="need.storeStatus === 'AVAILABLE'">
            <mat-icon>{{ need.storeStatus === 'AVAILABLE' ? 'check_circle' : 'inventory_2' }}</mat-icon>
          </div>
          <div class="nc-body">
            <div class="nc-name">{{ need.name }}</div>
            <div class="nc-meta">
              @if (need.quantity) {
                <span class="meta-qty">{{ need.quantity }} {{ need.unit || '' }}</span>
                <span class="sep">·</span>
              }
              <span>Requested by <strong>{{ need.requestedBy }}</strong></span>
              <span class="sep">·</span>
              <span class="meta-time">{{ need.requestedAt | date:'MMM d, h:mm a' }}</span>
            </div>
            @if (need.notes) {
              <div class="nc-notes">"{{ need.notes }}"</div>
            }
            @if (need.storeStatus === 'AVAILABLE' && need.markedAvailableBy) {
              <div class="nc-avail-by">
                <mat-icon>person</mat-icon> Marked by {{ need.markedAvailableBy }}
              </div>
            }
          </div>
        </div>
        <div class="nc-action">
          @if (need.storeStatus === 'PENDING') {
            <button class="mark-btn" (click)="markAvailable(need)">
              <mat-icon>check_circle</mat-icon>
              Mark Available
            </button>
          } @else {
            <button class="unmark-btn" (click)="unmark(need)">
              <mat-icon>undo</mat-icon>
              Unmark
            </button>
          }
        </div>
      </div>
    </ng-template>
  `,
  styles: [`
    .page { padding: 24px; max-width: 700px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    .page-title { font-size: 22px; font-weight: 700; color: #1b3050; margin: 0; }
    .page-sub { color: #6b7280; font-size: 13px; margin: 3px 0 0; }

    .header-stats { display: flex; gap: 10px; }
    .stat-chip {
      display: flex; align-items: center; gap: 6px;
      padding: 8px 16px; border-radius: 20px; font-size: 13px; font-weight: 700;
      mat-icon { font-size: 16px; width: 16px; height: 16px; }
    }
    .stat-chip.pending { background: #fef3c7; color: #92400e; }
    .stat-chip.avail   { background: #d1fae5; color: #065f46; }

    .section-label {
      display: flex; align-items: center; gap: 6px;
      font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;
      color: #6b7280; margin: 20px 0 10px;
      mat-icon { font-size: 16px; width: 16px; height: 16px; }
    }
    .avail-label { color: #2e7d32; }

    .need-card {
      background: #fff; border-radius: 12px; border: 1px solid #eef0f4;
      padding: 14px 16px; display: flex; align-items: center; gap: 14px;
      margin-bottom: 10px; transition: box-shadow 0.15s;
      &:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    }
    .avail-card { border-color: #a7f3d0; background: #f0fdf4; }

    .nc-left { display: flex; align-items: flex-start; gap: 12px; flex: 1; min-width: 0; }
    .nc-icon {
      width: 38px; height: 38px; border-radius: 10px; flex-shrink: 0;
      background: #f0f4f8; color: #6b7280;
      display: flex; align-items: center; justify-content: center;
      mat-icon { font-size: 20px; width: 20px; height: 20px; }
    }
    .nc-icon.avail-icon { background: #d1fae5; color: #065f46; }
    .nc-body { flex: 1; min-width: 0; }
    .nc-name { font-size: 15px; font-weight: 700; color: #1b3050; margin-bottom: 4px; }
    .nc-meta { display: flex; align-items: center; flex-wrap: wrap; gap: 4px; font-size: 12px; color: #6b7280; }
    .meta-qty { font-weight: 600; color: #374151; }
    .meta-time { color: #9ca3af; }
    .sep { color: #d1d5db; }
    .nc-notes { font-size: 12px; color: #9ca3af; font-style: italic; margin-top: 4px; }
    .nc-avail-by {
      display: flex; align-items: center; gap: 3px;
      font-size: 11px; color: #2e7d32; font-weight: 600; margin-top: 4px;
      mat-icon { font-size: 13px; width: 13px; height: 13px; }
    }

    .nc-action { flex-shrink: 0; }
    .mark-btn, .unmark-btn {
      display: flex; align-items: center; gap: 6px;
      padding: 8px 16px; border: none; border-radius: 8px;
      cursor: pointer; font-size: 13px; font-weight: 600;
      font-family: 'Inter', sans-serif; transition: all 0.15s;
      mat-icon { font-size: 17px; width: 17px; height: 17px; }
    }
    .mark-btn   { background: #2e7d32; color: #fff; &:hover { background: #1b5e20; } }
    .unmark-btn { background: #f3f4f6; color: #6b7280; &:hover { background: #e5e7eb; } }

    .empty-state { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 80px 0; color: #9ca3af; }
    .empty-state mat-icon { font-size: 56px; width: 56px; height: 56px; }
    .empty-state p { font-size: 15px; }
    .spin { animation: spin 1s linear infinite; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

    @media (max-width: 767px) {
      .page { padding: 14px; }
      .page-header { flex-direction: column; gap: 12px; }
      .header-stats { flex-wrap: wrap; }
      .need-card { flex-wrap: wrap; gap: 10px; }
      .nc-action { width: 100%; }
      .mark-btn, .unmark-btn { width: 100%; justify-content: center; }
    }
  `]
})
export class StoreNeedsComponent implements OnInit {
  private needsService = inject(PurchaseNeedService);
  private auth = inject(AuthService);
  private snack = inject(MatSnackBar);

  needs: PurchaseNeed[] = [];
  loading = false;

  get pendingNeeds()   { return this.needs.filter(n => n.status === 'NEEDED' && n.storeStatus === 'PENDING'); }
  get availableNeeds() { return this.needs.filter(n => n.status === 'NEEDED' && n.storeStatus === 'AVAILABLE'); }
  get pendingCount()   { return this.pendingNeeds.length; }
  get availableCount() { return this.availableNeeds.length; }

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.needsService.getStoreNeeds().subscribe({
      next: data => { this.needs = data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  markAvailable(need: PurchaseNeed) {
    this.needsService.updateStoreStatus(need.id, 'AVAILABLE').subscribe(updated => {
      this.needs = this.needs.map(n => n.id === updated.id ? updated : n);
      this.snack.open(`"${need.name}" marked as available`, '', { duration: 2500 });
    });
  }

  unmark(need: PurchaseNeed) {
    this.needsService.updateStoreStatus(need.id, 'PENDING').subscribe(updated => {
      this.needs = this.needs.map(n => n.id === updated.id ? updated : n);
      this.snack.open(`"${need.name}" unmarked`, '', { duration: 2000 });
    });
  }
}
