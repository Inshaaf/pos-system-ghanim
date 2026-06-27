import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SessionService } from '../../core/services/session.service';

@Component({
  selector: 'app-close-till',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatButtonModule, MatFormFieldModule,
    MatInputModule, MatIconModule, MatProgressSpinnerModule
  ],
  template: `
    <div class="page-wrap">
      <div class="till-card">

        @if (!session) {
          <div class="no-session">
            <mat-icon>lock</mat-icon>
            <h2>No Active Session</h2>
            <p>There is no open till session at the moment. Ask the manager to open one.</p>
          </div>
        }

        @if (session && !submitted) {
          <div class="header">
            <mat-icon class="header-icon">point_of_sale</mat-icon>
            <h2>Close Till</h2>
            <p class="sub">Count the physical cash in the drawer and enter the total below.</p>
          </div>

          <div class="session-info">
            <div class="info-row">
              <span class="info-lbl">Cashier</span>
              <span class="info-val">{{ session.cashierName }}</span>
            </div>
            <div class="info-row">
              <span class="info-lbl">Session opened</span>
              <span class="info-val">{{ session.openedAt | date:'dd MMM yyyy, hh:mm a' }}</span>
            </div>
          </div>

          <div class="count-section">
            <p class="count-hint">
              <mat-icon class="hint-icon">info</mat-icon>
              Count every note and coin in the till, then enter the total here.
            </p>
            <mat-form-field appearance="outline" class="amount-field">
              <mat-label>Cash Count (LKR)</mat-label>
              <span matPrefix class="prefix">LKR&nbsp;</span>
              <input matInput type="number" [(ngModel)]="closingCash" min="0" step="0.01"
                placeholder="0.00" class="amount-input">
            </mat-form-field>

            <mat-form-field appearance="outline" class="notes-field">
              <mat-label>Notes (optional)</mat-label>
              <textarea matInput [(ngModel)]="notes" rows="2"
                placeholder="Any notes for the manager..."></textarea>
            </mat-form-field>
          </div>

          @if (error) {
            <div class="error-box">{{ error }}</div>
          }

          <button mat-flat-button class="submit-btn" (click)="submit()" [disabled]="loading || closingCash == null">
            @if (loading) { <mat-spinner diameter="20"></mat-spinner> }
            @else { <mat-icon>check_circle</mat-icon> Submit Count }
          </button>
        }

        @if (submitted) {
          <div class="success-screen">
            <div class="success-icon-wrap">
              <mat-icon class="success-icon">check_circle</mat-icon>
            </div>
            <h2>Till Closed</h2>
            <p>Your cash count has been submitted successfully. The manager will review it shortly.</p>
            <p class="thank-you">Thank you for your shift!</p>
          </div>
        }

      </div>
    </div>
  `,
  styles: [`
    .page-wrap {
      min-height: 100vh; display: flex; align-items: center; justify-content: center;
      background: #f0f4f8; padding: 24px;
    }
    .till-card {
      background: #fff; border-radius: 16px; padding: 40px;
      width: 100%; max-width: 480px; box-shadow: 0 4px 24px rgba(0,0,0,.08);
    }

    .header { text-align: center; margin-bottom: 28px; }
    .header-icon { font-size: 48px; width: 48px; height: 48px; color: #1b3050; display: block; margin: 0 auto 12px; }
    .header h2 { font-size: 22px; font-weight: 700; color: #1b3050; margin: 0 0 6px; }
    .sub { font-size: 14px; color: #6b7280; margin: 0; }

    .session-info {
      background: #f8faff; border: 1px solid #e2e8f0; border-radius: 10px;
      padding: 14px 16px; margin-bottom: 24px; display: flex; flex-direction: column; gap: 8px;
    }
    .info-row { display: flex; justify-content: space-between; align-items: center; }
    .info-lbl { font-size: 12px; color: #9ca3af; text-transform: uppercase; font-weight: 600; }
    .info-val { font-size: 14px; font-weight: 600; color: #1b3050; }

    .count-hint {
      display: flex; align-items: center; gap: 6px; font-size: 13px; color: #4b5563;
      background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 10px 12px; margin-bottom: 16px;
    }
    .hint-icon { font-size: 16px; width: 16px; height: 16px; color: #d97706; flex-shrink: 0; }
    .amount-field { width: 100%; }
    .notes-field { width: 100%; margin-top: 4px; }
    .prefix { font-weight: 600; color: #1b3050; }
    .amount-input { font-size: 20px; font-weight: 700; }

    .error-box { background: #fdecea; color: #c62828; border-radius: 8px; padding: 10px 14px; font-size: 13px; margin-bottom: 14px; }

    .submit-btn {
      width: 100%; height: 48px; font-size: 15px; font-weight: 700;
      background: #1b3050 !important; color: #fff !important; border-radius: 8px !important;
      display: flex; align-items: center; justify-content: center; gap: 8px;
    }
    .submit-btn mat-icon { font-size: 20px; width: 20px; height: 20px; }

    /* Success */
    .success-screen { text-align: center; padding: 20px 0; }
    .success-icon-wrap {
      width: 80px; height: 80px; border-radius: 50%; background: #e8f5e9;
      display: flex; align-items: center; justify-content: center; margin: 0 auto 20px;
    }
    .success-icon { font-size: 48px; width: 48px; height: 48px; color: #2e7d32; }
    .success-screen h2 { font-size: 22px; font-weight: 700; color: #1b3050; margin: 0 0 10px; }
    .success-screen p { font-size: 14px; color: #6b7280; margin: 0 0 8px; }
    .thank-you { font-size: 15px; color: #2e7d32; font-weight: 600; }

    /* No session */
    .no-session { text-align: center; padding: 20px 0; }
    .no-session mat-icon { font-size: 48px; width: 48px; height: 48px; color: #d1d5db; display: block; margin: 0 auto 12px; }
    .no-session h2 { color: #1b3050; margin: 0 0 8px; }
    .no-session p { color: #6b7280; font-size: 14px; margin: 0; }

    @media (max-width: 767px) {
      .page-wrap { padding: 12px; min-height: auto; }
      .till-card { max-width: 100%; }
    }
  `]
})
export class CloseTillComponent implements OnInit {
  private sessionService = inject(SessionService);

  session: any = null;
  closingCash: number | null = null;
  notes = '';
  loading = false;
  submitted = false;
  error = '';

  ngOnInit() {
    this.sessionService.loadCurrent().subscribe(s => this.session = s);
  }

  submit() {
    if (this.closingCash == null || !this.session) return;
    this.loading = true;
    this.error = '';
    this.sessionService.submitCount(this.session.id, this.closingCash, this.notes).subscribe({
      next: () => { this.submitted = true; this.loading = false; },
      error: err => {
        this.error = err?.error?.message || 'Failed to submit. Please try again.';
        this.loading = false;
      }
    });
  }
}
