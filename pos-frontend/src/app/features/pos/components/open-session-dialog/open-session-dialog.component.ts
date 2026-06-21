import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SessionService } from '../../../../core/services/session.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-open-session-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatProgressSpinnerModule],
  template: `
    <h2 mat-dialog-title>START OF DAY</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Cashier Name</mat-label>
        <input matInput [(ngModel)]="cashierName" />
      </mat-form-field>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Opening Float (LKR)</mat-label>
        <input matInput type="number" [(ngModel)]="openingFloat" min="0" placeholder="0.00" />
      </mat-form-field>
      @if (error) {
        <div class="error-msg">{{ error }}</div>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close()">CANCEL</button>
      <button mat-flat-button class="open-btn" (click)="open()" [disabled]="loading || !cashierName">
        @if (loading) { <mat-spinner diameter="18" /> } @else { OPEN SESSION }
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    h2 { padding: 16px 24px 0; }
    mat-dialog-content { padding: 8px 24px 0; min-width: 340px; }
    .full-width { width: 100%; }
    .error-msg { background: #fdecea; color: #c62828; padding: 8px 12px; border-radius: 6px; font-size: 13px; }
    .open-btn { background: #1b3050 !important; color: #fff !important; }
  `]
})
export class OpenSessionDialogComponent {
  dialogRef = inject(MatDialogRef<OpenSessionDialogComponent>);
  private sessionService = inject(SessionService);
  auth = inject(AuthService);

  cashierName = this.auth.currentUser()?.name || '';
  openingFloat: number | null = null;
  loading = false;
  error = '';

  open() {
    this.loading = true;
    this.sessionService.open(this.cashierName, this.openingFloat || 0).subscribe({
      next: () => this.dialogRef.close(true),
      error: err => { this.error = err.error?.message || 'Failed to open session'; this.loading = false; }
    });
  }
}


