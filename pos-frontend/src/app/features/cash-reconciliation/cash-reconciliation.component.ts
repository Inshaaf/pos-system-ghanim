import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { SessionService } from '../../core/services/session.service';
import { OpenSessionDialogComponent } from '../pos/components/open-session-dialog/open-session-dialog.component';

@Component({
  selector: 'app-cash-reconciliation',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatButtonModule, MatIconModule, MatCardModule,
    MatDialogModule, MatSnackBarModule, MatProgressSpinnerModule,
    MatFormFieldModule, MatInputModule, MatTooltipModule, MatChipsModule
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">Cash Reconciliation</h1>
          <p class="page-sub">Compare expected cash vs cashier count for every session</p>
        </div>
        <button mat-flat-button class="open-btn" (click)="openSession()" [disabled]="!!liveSession">
          <mat-icon>lock_open</mat-icon> Open Session
        </button>
      </div>

      <!-- Live session banner -->
      @if (liveSession) {
        <div class="live-banner">
          <div class="live-left">
            <span class="live-dot"></span>
            <span class="live-label">LIVE SESSION</span>
            <span class="live-cashier">{{ liveSession.cashierName }}</span>
            <span class="live-since">since {{ liveSession.openedAt | date:'hh:mm a' }}</span>
          </div>
          <div class="live-right">
            <span class="live-float">Opening float: <strong>LKR {{ liveSession.openingFloat | number:'1.2-2' }}</strong></span>
          </div>
        </div>
      }

      @if (loading) {
        <div class="loading-wrap"><mat-spinner diameter="40"></mat-spinner></div>
      }

      @if (!loading && sessions.length === 0) {
        <div class="empty-state">
          <mat-icon>point_of_sale</mat-icon>
          <p>No sessions yet. Open the first session to get started.</p>
        </div>
      }

      <!-- Session cards -->
      @for (s of sessions; track s.id) {
        @if (s.status !== 'OPEN') {
          <mat-card class="session-card">
            <div class="sc-header">
              <div class="sc-left">
                <span class="session-id">#{{ s.id }}</span>
                <span class="sc-cashier">{{ s.cashierName }}</span>
                <span class="sc-date">{{ s.openedAt | date:'dd MMM yyyy' }}</span>
                <span class="sc-time">{{ s.openedAt | date:'hh:mm a' }} — {{ s.closedAt | date:'hh:mm a' }}</span>
              </div>
              <span class="diff-chip" [ngClass]="diffClass(s.difference)">
                @if (s.difference === null || s.difference === undefined) {
                  Pending
                } @else if (+s.difference === 0) {
                  Balanced
                } @else if (+s.difference > 0) {
                  Over +LKR {{ s.difference | number:'1.2-2' }}
                } @else {
                  Short LKR {{ s.difference | number:'1.2-2' }}
                }
              </span>
            </div>

            <div class="reconciliation-grid">
              <div class="rec-col">
                <div class="rec-row opening">
                  <span class="rec-label">Opening Float</span>
                  <span class="rec-value">LKR {{ s.openingFloat | number:'1.2-2' }}</span>
                </div>
                <div class="rec-row">
                  <span class="rec-label">+ Cash Sales</span>
                  <span class="rec-value">LKR {{ s.cashSales | number:'1.2-2' }}</span>
                </div>
                @if (s.quickSaleCash > 0) {
                  <div class="rec-row qs-row">
                    <span class="rec-label">+ Quick Sale Cash</span>
                    <span class="rec-value qs-val">LKR {{ s.quickSaleCash | number:'1.2-2' }}</span>
                  </div>
                }
                @if (s.cashIn > 0) {
                  <div class="rec-row">
                    <span class="rec-label">+ Cash In</span>
                    <span class="rec-value">LKR {{ s.cashIn | number:'1.2-2' }}</span>
                  </div>
                }
                @if (s.cashOut > 0) {
                  <div class="rec-row">
                    <span class="rec-label">− Cash Out</span>
                    <span class="rec-value minus">LKR {{ s.cashOut | number:'1.2-2' }}</span>
                  </div>
                }
                @if (s.cashRefunds > 0) {
                  <div class="rec-row">
                    <span class="rec-label">− Refunds</span>
                    <span class="rec-value minus">LKR {{ s.cashRefunds | number:'1.2-2' }}</span>
                  </div>
                }
                <div class="rec-row total-row">
                  <span class="rec-label">= Expected in Till</span>
                  <span class="rec-value expected">LKR {{ s.expectedCash | number:'1.2-2' }}</span>
                </div>
              </div>

              <div class="divider-col">
                <div class="vs-circle">VS</div>
              </div>

              <div class="rec-col cashier-col">
                <div class="cashier-count-label">Cashier's Count</div>
                @if (s.closingCash !== null && s.closingCash !== undefined) {
                  <div class="cashier-count-value">LKR {{ s.closingCash | number:'1.2-2' }}</div>
                  <div class="diff-line" [ngClass]="diffClass(s.difference)">
                    @if (+s.difference === 0) {
                      <mat-icon>check_circle</mat-icon> Exact match
                    } @else if (+s.difference > 0) {
                      <mat-icon>arrow_upward</mat-icon> LKR {{ s.difference | number:'1.2-2' }} over
                    } @else {
                      <mat-icon>arrow_downward</mat-icon> LKR {{ +s.difference * -1 | number:'1.2-2' }} short
                    }
                  </div>
                } @else {
                  <div class="pending-count">
                    <mat-icon>hourglass_empty</mat-icon>
                    <span>Awaiting cashier count</span>
                  </div>
                }
                @if (s.notes) {
                  <div class="cashier-notes">"{{ s.notes }}"</div>
                }
              </div>
            </div>
          </mat-card>
        }
      }
    </div>
  `,
  styles: [`
    .page-container { padding: 24px; max-width: 900px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
    .page-title { font-size: 22px; font-weight: 700; color: #1b3050; margin: 0; }
    .page-sub { font-size: 13px; color: #6b7280; margin: 4px 0 0; }
    .open-btn { background: #1b3050 !important; color: #fff !important; }
    .loading-wrap { display: flex; justify-content: center; padding: 60px; }
    .empty-state { text-align: center; padding: 60px; color: #aaa; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; color: #ddd; display: block; margin: 0 auto 12px; }

    /* Live banner */
    .live-banner {
      display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;
      background: #e8f5e9; border: 2px solid #4caf50; border-radius: 10px; padding: 12px 18px; margin-bottom: 20px;
    }
    .live-left { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .live-dot { width: 10px; height: 10px; border-radius: 50%; background: #4caf50; animation: pulse 1.5s infinite; }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
    .live-label { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #2e7d32; letter-spacing: 1px; }
    .live-cashier { font-size: 15px; font-weight: 700; color: #1b3050; }
    .live-since { font-size: 12px; color: #4b5563; }
    .live-float { font-size: 13px; color: #374151; }

    /* Session card */
    .session-card { margin-bottom: 16px; border-radius: 12px; overflow: hidden; }
    .sc-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 12px 18px; background: #f8faff; border-bottom: 1px solid #e8edf4;
      flex-wrap: wrap; gap: 8px;
    }
    .sc-left { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .session-id { font-weight: 700; color: #1b3050; font-size: 14px; }
    .sc-cashier { font-weight: 600; color: #374151; font-size: 14px; }
    .sc-date { font-size: 13px; color: #6b7280; }
    .sc-time { font-size: 12px; color: #9ca3af; }

    .diff-chip { font-size: 12px; font-weight: 700; border-radius: 20px; padding: 4px 14px; }
    .diff-ok      { background: #e8f5e9; color: #2e7d32; }
    .diff-over    { background: #fff8e1; color: #b45309; }
    .diff-short   { background: #fdecea; color: #c62828; }
    .diff-pending { background: #f3f4f6; color: #6b7280; }

    /* Reconciliation grid */
    .reconciliation-grid {
      display: grid; grid-template-columns: 1fr 40px 1fr; gap: 0; padding: 20px 18px;
    }
    .rec-col { display: flex; flex-direction: column; gap: 6px; }
    .rec-row { display: flex; justify-content: space-between; align-items: center; padding: 4px 0; border-bottom: 1px dashed #f0f0f0; }
    .rec-row:last-child { border-bottom: none; }
    .rec-label { font-size: 13px; color: #6b7280; }
    .rec-value { font-size: 13px; font-weight: 600; color: #1b3050; }
    .rec-value.minus { color: #c62828; }
    .rec-row.qs-row { background: #fff8f0; border-radius: 4px; padding: 4px 4px; }
    .rec-value.qs-val { color: #ea580c; }
    .rec-row.total-row { border-top: 2px solid #e2e8f0; margin-top: 4px; padding-top: 8px; }
    .rec-row.total-row .rec-label { font-weight: 700; color: #374151; font-size: 13px; }
    .rec-value.expected { font-size: 15px; color: #1b3050; font-weight: 800; }

    .divider-col { display: flex; align-items: center; justify-content: center; }
    .vs-circle {
      width: 32px; height: 32px; border-radius: 50%; background: #1b3050; color: #fff;
      font-size: 10px; font-weight: 800; display: flex; align-items: center; justify-content: center;
    }

    .cashier-col { padding-left: 16px; border-left: 1px solid #f0f0f0; }
    .cashier-count-label { font-size: 11px; text-transform: uppercase; color: #9ca3af; font-weight: 600; margin-bottom: 4px; }
    .cashier-count-value { font-size: 24px; font-weight: 800; color: #1b3050; margin-bottom: 8px; }

    .diff-line { display: flex; align-items: center; gap: 4px; font-size: 13px; font-weight: 700; }
    .diff-line mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .diff-ok   .diff-line { color: #2e7d32; }
    .diff-over  { color: #b45309; }
    .diff-short { color: #c62828; }

    .pending-count { display: flex; align-items: center; gap: 6px; color: #9ca3af; font-size: 13px; padding: 8px 0; }
    .pending-count mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .cashier-notes { font-size: 12px; color: #6b7280; font-style: italic; margin-top: 8px; line-height: 1.4; }

    @media (max-width: 767px) {
      .page-container { padding: 12px; max-width: 100%; }
      .page-header { flex-direction: column; gap: 8px; }
      .reconciliation-grid { grid-template-columns: 1fr !important; }
      .live-banner { flex-direction: column; gap: 8px; }
      .sc-header { flex-direction: column; align-items: flex-start; gap: 6px; }
    }
  `]
})
export class CashReconciliationComponent implements OnInit {
  private sessionService = inject(SessionService);
  private dialog = inject(MatDialog);
  private snack = inject(MatSnackBar);

  sessions: any[] = [];
  liveSession: any = null;
  loading = false;

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.sessionService.loadCurrent().subscribe(s => this.liveSession = s);
    this.sessionService.getAllSessions().subscribe({
      next: data => { this.sessions = data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  openSession() {
    const ref = this.dialog.open(OpenSessionDialogComponent, { width: '400px', disableClose: true });
    ref.afterClosed().subscribe(ok => { if (ok) this.load(); });
  }

  diffClass(diff: any) {
    if (diff === null || diff === undefined) return 'diff-pending';
    const n = +diff;
    if (n === 0) return 'diff-ok';
    if (n > 0) return 'diff-over';
    return 'diff-short';
  }
}
