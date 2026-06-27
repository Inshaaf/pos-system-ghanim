import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { environment } from '../../../environments/environment';
import { WarrantyClaimDialogComponent } from './warranty-claim-dialog.component';

@Component({
  selector: 'app-warranty',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatDialogModule,
    MatSnackBarModule, MatTooltipModule, MatTabsModule, MatProgressSpinnerModule
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">Warranty Claims</h1>
          <p class="page-sub">Track customer warranty issues and identify problem products</p>
        </div>
        <button mat-flat-button class="new-btn" (click)="openNew()">
          <mat-icon>add</mat-icon> New Claim
        </button>
      </div>

      <!-- Summary strip -->
      <div class="summary-strip">
        <div class="strip-card pending" (click)="filterStatus='PENDING'; load()">
          <div class="sc-val">{{ summary.pending || 0 }}</div>
          <div class="sc-lbl">Pending</div>
        </div>
        <div class="strip-card repair" (click)="filterStatus='IN_REPAIR'; load()">
          <div class="sc-val">{{ summary.inRepair || 0 }}</div>
          <div class="sc-lbl">In Repair</div>
        </div>
        <div class="strip-card resolved" (click)="filterStatus='RESOLVED'; load()">
          <div class="sc-val">{{ summary.resolved || 0 }}</div>
          <div class="sc-lbl">Resolved</div>
        </div>
        <div class="strip-card total" (click)="filterStatus=''; load()">
          <div class="sc-val">{{ summary.total || 0 }}</div>
          <div class="sc-lbl">All Claims</div>
        </div>
      </div>

      <mat-tab-group>

        <!-- ── TAB 1: CLAIMS ── -->
        <mat-tab label="Claims">
          <div class="tab-content">
            <div class="filter-row">
              <mat-form-field appearance="outline" class="filter-field">
                <mat-label>Filter by Status</mat-label>
                <mat-select [(ngModel)]="filterStatus" (ngModelChange)="load()">
                  <mat-option value="">All</mat-option>
                  <mat-option value="PENDING">Pending</mat-option>
                  <mat-option value="IN_REPAIR">In Repair</mat-option>
                  <mat-option value="RESOLVED">Resolved</mat-option>
                  <mat-option value="REPLACED">Replaced</mat-option>
                  <mat-option value="REJECTED">Rejected</mat-option>
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline" class="search-field">
                <mat-label>Search</mat-label>
                <mat-icon matPrefix>search</mat-icon>
                <input matInput [(ngModel)]="search" placeholder="Customer, product...">
              </mat-form-field>
            </div>

            @if (loading) {
              <div class="loading-wrap"><mat-spinner diameter="40"></mat-spinner></div>
            }

            @if (!loading && filtered.length === 0) {
              <div class="empty-state">
                <mat-icon>verified_user</mat-icon>
                <p>No warranty claims found</p>
              </div>
            }

            @for (claim of filtered; track claim.id) {
              <mat-card class="claim-card">
                <div class="claim-header">
                  <div class="claim-left">
                    <span class="claim-id">#{{ claim.id }}</span>
                    <span class="claim-date">{{ claim.claimDate | date:'dd MMM yyyy HH:mm' }}</span>
                    <span class="status-badge" [ngClass]="statusClass(claim.status)">
                      {{ statusLabel(claim.status) }}
                    </span>
                  </div>
                  <div class="claim-actions">
                    @if (claim.status === 'PENDING') {
                      <button mat-stroked-button class="action-btn repair" (click)="setStatus(claim, 'IN_REPAIR')">
                        <mat-icon>build</mat-icon> Send to Repair
                      </button>
                    }
                    @if (claim.status === 'IN_REPAIR') {
                      <button mat-stroked-button class="action-btn resolve" (click)="openResolve(claim)">
                        <mat-icon>check_circle</mat-icon> Resolve
                      </button>
                    }
                    @if (claim.status === 'PENDING' || claim.status === 'IN_REPAIR') {
                      <button mat-stroked-button class="action-btn reject" (click)="openResolve(claim, 'REJECTED')">
                        <mat-icon>cancel</mat-icon> Reject
                      </button>
                    }
                  </div>
                </div>

                <div class="claim-body">
                  <div class="info-grid">
                    <div class="info-item">
                      <span class="info-label">Customer</span>
                      <span class="info-val">{{ claim.customerName }}</span>
                      @if (claim.customerPhone) {
                        <span class="info-sub">{{ claim.customerPhone }}</span>
                      }
                    </div>
                    <div class="info-item">
                      <span class="info-label">Product</span>
                      <span class="info-val">{{ claim.productName }}</span>
                      @if (claim.originalSaleId) {
                        <span class="info-sub">Sale #{{ claim.originalSaleId }}</span>
                      }
                    </div>
                    @if (claim.handledBy) {
                      <div class="info-item">
                        <span class="info-label">Handled by</span>
                        <span class="info-val">{{ claim.handledBy }}</span>
                      </div>
                    }
                    @if (claim.resolvedDate) {
                      <div class="info-item">
                        <span class="info-label">Resolved</span>
                        <span class="info-val">{{ claim.resolvedDate | date:'dd MMM yyyy' }}</span>
                      </div>
                    }
                  </div>
                  <div class="issue-box">
                    <span class="info-label">Issue</span>
                    <p class="issue-text">{{ claim.issueDescription }}</p>
                  </div>
                  @if (claim.resolutionNotes) {
                    <div class="resolution-box">
                      <span class="info-label">Resolution</span>
                      <p class="issue-text">{{ claim.resolutionNotes }}</p>
                    </div>
                  }
                </div>
              </mat-card>
            }
          </div>
        </mat-tab>

        <!-- ── TAB 2: PROBLEM PRODUCTS ── -->
        <mat-tab label="Problem Products">
          <div class="tab-content">
            <p class="prob-hint">Products ranked by number of warranty claims — helps identify quality issues.</p>

            @if (productStats.length === 0) {
              <div class="empty-state">
                <mat-icon>thumb_up</mat-icon>
                <p>No warranty data yet</p>
              </div>
            }

            @for (stat of productStats; track stat.productName; let i = $index) {
              <div class="prob-row">
                <div class="prob-rank" [class.top]="i < 3">{{ i + 1 }}</div>
                <div class="prob-name">{{ stat.productName }}</div>
                <div class="prob-bar-wrap">
                  <div class="prob-bar" [style.width.%]="barWidth(stat.claimCount)"></div>
                </div>
                <div class="prob-count" [class.high]="stat.claimCount >= 3">
                  {{ stat.claimCount }} claim{{ stat.claimCount !== 1 ? 's' : '' }}
                </div>
              </div>
            }
          </div>
        </mat-tab>

      </mat-tab-group>
    </div>

    <!-- Resolve dialog inline -->
    @if (resolving) {
      <div class="overlay" (click)="resolving=null">
        <div class="resolve-panel" (click)="$event.stopPropagation()">
          <h3>{{ resolvingReject ? 'Reject Claim' : 'Resolve Claim' }} #{{ resolving.id }}</h3>
          @if (!resolvingReject) {
            <mat-form-field appearance="outline" class="full-w">
              <mat-label>Resolution Type</mat-label>
              <mat-select [(ngModel)]="resolveType">
                <mat-option value="REPAIRED">Repaired</mat-option>
                <mat-option value="REPLACED">Replaced with new item</mat-option>
              </mat-select>
            </mat-form-field>
          }
          <mat-form-field appearance="outline" class="full-w">
            <mat-label>Notes</mat-label>
            <textarea matInput [(ngModel)]="resolveNotes" rows="3" placeholder="What was done..."></textarea>
          </mat-form-field>
          <div class="resolve-actions">
            <button mat-button (click)="resolving=null">Cancel</button>
            <button mat-flat-button [class]="resolvingReject ? 'reject-btn' : 'confirm-btn'" (click)="confirmResolve()">
              {{ resolvingReject ? 'Reject' : 'Mark Resolved' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .page-container { padding: 24px; max-width: 960px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
    .page-title { font-size: 22px; font-weight: 700; color: #1b3050; margin: 0; }
    .page-sub { font-size: 13px; color: #6b7280; margin: 4px 0 0; }
    .new-btn { background: #1b3050 !important; color: #fff !important; }

    .summary-strip { display: flex; gap: 12px; margin-bottom: 24px; }
    .strip-card {
      flex: 1; border-radius: 10px; padding: 14px 16px; text-align: center;
      cursor: pointer; transition: transform .15s; border: 2px solid transparent;
    }
    .strip-card:hover { transform: translateY(-2px); }
    .strip-card.pending { background: #fff8e1; border-color: #fbbf24; }
    .strip-card.repair  { background: #e3f2fd; border-color: #2196f3; }
    .strip-card.resolved{ background: #e8f5e9; border-color: #4caf50; }
    .strip-card.total   { background: #f3f4f6; border-color: #9ca3af; }
    .sc-val { font-size: 28px; font-weight: 700; color: #1b3050; }
    .sc-lbl { font-size: 11px; text-transform: uppercase; color: #6b7280; margin-top: 2px; }

    .tab-content { padding: 16px 0; }
    .filter-row { display: flex; gap: 12px; margin-bottom: 16px; }
    .filter-field { width: 180px; }
    .search-field { flex: 1; }
    .loading-wrap { display: flex; justify-content: center; padding: 40px; }
    .empty-state { text-align: center; padding: 60px; color: #aaa; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; color: #ddd; display: block; margin: 0 auto 12px; }

    .claim-card { margin-bottom: 12px; border-radius: 12px; overflow: hidden; }
    .claim-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 12px 16px; background: #f8faff; border-bottom: 1px solid #eef0f4; flex-wrap: wrap; gap: 8px;
    }
    .claim-left { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .claim-id { font-weight: 700; color: #1b3050; font-size: 14px; }
    .claim-date { font-size: 12px; color: #6b7280; }
    .claim-actions { display: flex; gap: 8px; flex-wrap: wrap; }

    .status-badge { font-size: 11px; font-weight: 600; border-radius: 20px; padding: 3px 10px; }
    .s-pending  { background: #fff8e1; color: #b45309; }
    .s-repair   { background: #e3f2fd; color: #1565c0; }
    .s-resolved { background: #e8f5e9; color: #2e7d32; }
    .s-replaced { background: #f3e5f5; color: #7b1fa2; }
    .s-rejected { background: #fce4ec; color: #c62828; }

    .action-btn { font-size: 12px !important; line-height: 28px !important; padding: 0 10px !important; }
    .action-btn.repair  { border-color: #2196f3 !important; color: #1565c0 !important; }
    .action-btn.resolve { border-color: #4caf50 !important; color: #2e7d32 !important; }
    .action-btn.reject  { border-color: #ef5350 !important; color: #c62828 !important; }

    .claim-body { padding: 14px 16px; }
    .info-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 12px; margin-bottom: 12px; }
    .info-item { display: flex; flex-direction: column; }
    .info-label { font-size: 10px; text-transform: uppercase; color: #9ca3af; font-weight: 600; margin-bottom: 2px; }
    .info-val { font-size: 14px; font-weight: 600; color: #1b3050; }
    .info-sub { font-size: 11px; color: #6b7280; }
    .issue-box, .resolution-box { margin-top: 8px; }
    .issue-text { margin: 4px 0 0; font-size: 13px; color: #374151; line-height: 1.5; }
    .resolution-box .issue-text { color: #2e7d32; }

    /* Problem products */
    .prob-hint { font-size: 13px; color: #6b7280; margin-bottom: 16px; }
    .prob-row { display: grid; grid-template-columns: 36px 1fr 2fr 90px; gap: 12px; align-items: center; padding: 10px 4px; border-bottom: 1px solid #f0f0f0; }
    .prob-rank { font-size: 16px; font-weight: 700; color: #9ca3af; text-align: center; }
    .prob-rank.top { color: #ef5350; }
    .prob-name { font-weight: 600; color: #1b3050; font-size: 14px; }
    .prob-bar-wrap { background: #f3f4f6; border-radius: 4px; height: 8px; }
    .prob-bar { background: #1b3050; height: 8px; border-radius: 4px; transition: width .3s; }
    .prob-count { font-size: 13px; font-weight: 600; color: #6b7280; text-align: right; }
    .prob-count.high { color: #ef5350; }

    /* Resolve overlay */
    .overlay { position: fixed; inset: 0; background: rgba(0,0,0,.4); z-index: 1000; display: flex; align-items: center; justify-content: center; }
    .resolve-panel { background: #fff; border-radius: 12px; padding: 24px; width: 400px; display: flex; flex-direction: column; gap: 14px; }
    .resolve-panel h3 { margin: 0; font-size: 16px; color: #1b3050; }
    .full-w { width: 100%; }
    .resolve-actions { display: flex; justify-content: flex-end; gap: 10px; }
    .confirm-btn { background: #2e7d32 !important; color: #fff !important; }
    .reject-btn  { background: #c62828 !important; color: #fff !important; }

    @media (max-width: 767px) {
      .page-container { padding: 12px; max-width: 100%; }
      .page-header { flex-direction: column; gap: 8px; }
      .filter-row { flex-wrap: wrap; gap: 8px; }
      .strip-card { flex-direction: column; gap: 8px; }
      .claim-header { flex-direction: column; gap: 6px; }
      .resolve-panel { width: calc(100vw - 32px); padding: 16px; }
    }
  `]
})
export class WarrantyComponent implements OnInit {
  private http = inject(HttpClient);
  private dialog = inject(MatDialog);
  private snack = inject(MatSnackBar);

  private base = `${environment.apiUrl}/warranty`;

  claims: any[] = [];
  productStats: any[] = [];
  summary: any = {};
  loading = false;
  filterStatus = '';
  search = '';

  resolving: any = null;
  resolvingReject = false;
  resolveType = 'REPAIRED';
  resolveNotes = '';

  get filtered() {
    const q = this.search.trim().toLowerCase();
    if (!q) return this.claims;
    return this.claims.filter(c =>
      c.customerName?.toLowerCase().includes(q) ||
      c.productName?.toLowerCase().includes(q) ||
      c.issueDescription?.toLowerCase().includes(q)
    );
  }

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    const params = this.filterStatus ? `?status=${this.filterStatus}` : '';
    this.http.get<any>(`${this.base}${params}`).pipe(map(r => r.data)).subscribe({
      next: data => { this.claims = data; this.loading = false; },
      error: () => { this.loading = false; }
    });
    this.http.get<any>(`${this.base}/summary`).pipe(map(r => r.data)).subscribe(s => this.summary = s);
    this.http.get<any>(`${this.base}/product-stats`).pipe(map(r => r.data)).subscribe(s => this.productStats = s);
  }

  openNew() {
    const ref = this.dialog.open(WarrantyClaimDialogComponent, { width: '520px' });
    ref.afterClosed().subscribe(result => { if (result) this.load(); });
  }

  setStatus(claim: any, status: string) {
    this.http.put<any>(`${this.base}/${claim.id}/status`, { status }).pipe(map(r => r.data)).subscribe({
      next: () => { this.snack.open('Status updated', '', { duration: 2000 }); this.load(); },
      error: () => this.snack.open('Failed to update', 'OK', { duration: 3000 })
    });
  }

  openResolve(claim: any, forceReject?: string) {
    this.resolving = claim;
    this.resolvingReject = !!forceReject;
    this.resolveType = 'REPAIRED';
    this.resolveNotes = '';
  }

  confirmResolve() {
    const status = this.resolvingReject ? 'REJECTED' : (this.resolveType === 'REPLACED' ? 'REPLACED' : 'RESOLVED');
    const body: any = { status, resolutionNotes: this.resolveNotes };
    if (!this.resolvingReject) body.resolutionType = this.resolveType;
    this.http.put<any>(`${this.base}/${this.resolving.id}/status`, body).pipe(map(r => r.data)).subscribe({
      next: () => {
        this.snack.open('Claim updated', '', { duration: 2000 });
        this.resolving = null;
        this.load();
      },
      error: () => this.snack.open('Failed', 'OK', { duration: 3000 })
    });
  }

  statusLabel(s: string) {
    const map: any = { PENDING: 'Pending', IN_REPAIR: 'In Repair', RESOLVED: 'Resolved', REPLACED: 'Replaced', REJECTED: 'Rejected' };
    return map[s] || s;
  }

  statusClass(s: string) {
    const map: any = { PENDING: 's-pending', IN_REPAIR: 's-repair', RESOLVED: 's-resolved', REPLACED: 's-replaced', REJECTED: 's-rejected' };
    return map[s] || '';
  }

  barWidth(count: number): number {
    const max = Math.max(...this.productStats.map((s: any) => s.claimCount), 1);
    return (count / max) * 100;
  }
}
