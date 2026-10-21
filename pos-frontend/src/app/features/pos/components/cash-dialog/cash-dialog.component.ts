import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CashService } from '../../../../core/services/session.service';
import { PrintService } from '../../../../core/services/print.service';
import { SupplierService } from '../../../../core/services/product.service';
import { Supplier } from '../../../../core/models/product.model';
import { CashLoan } from '../../../../core/services/session.service';

const OUT_REASONS = [
  { value: 'CHARITY',      label: 'Charity' },
  { value: 'SHOP_EXPENSE', label: 'Shop Expense' },
  { value: 'TRANSPORT',    label: 'Transport' },
  { value: 'CLEANING',     label: 'Cleaning' },
  { value: 'FOOD',         label: 'Food' },
  { value: 'SUPPLIER',     label: 'Supplier Payment' },
  { value: 'LOAN_GIVEN',   label: 'Loan Given (not an expense)' },
  { value: 'OTHER',        label: 'Other' },
  { value: 'OWNER_WITHDRAWAL', label: 'Owner Withdrawal (not an expense)' },
  { value: 'CASH_TRANSFER', label: 'Cash Transfer (not an expense)' },
];

const IN_REASONS = [
  { value: 'FLOAT_ADD', label: 'Float Top-up' },
  { value: 'CASH_TRANSFER', label: 'Cash Transfer from Bank' },
  { value: 'LOAN_REPAYMENT', label: 'Loan Repayment' },
  { value: 'OTHER',     label: 'Other' },
];

@Component({
  selector: 'app-cash-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatProgressSpinnerModule, MatIconModule, MatSnackBarModule],
  template: `
    <div class="cash-wrap">
      <div class="cash-header" [class.out]="isCashOut">
        <mat-icon>{{ isCashOut ? 'arrow_upward' : 'arrow_downward' }}</mat-icon>
        <h2>{{ isCashOut ? 'Cash Out' : 'Cash In' }}</h2>
      </div>

      <mat-dialog-content>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Amount (LKR) *</mat-label>
          <input matInput type="number" [(ngModel)]="amount" min="1" placeholder="Enter amount" />
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Reason *</mat-label>
          <mat-select [(ngModel)]="reason">
            @for (r of reasons; track r.value) {
              <mat-option [value]="r.value">{{ r.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        @if (isCashOut && reason === 'SUPPLIER') {
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Supplier *</mat-label>
            <mat-select [(ngModel)]="supplierId">
              @for (supplier of suppliers; track supplier.id) {
                <mat-option [value]="supplier.id">{{ supplier.name }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        }

        @if (isCashOut && reason === 'LOAN_GIVEN') {
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Borrower *</mat-label>
            <mat-select [(ngModel)]="selectedBorrower" (ngModelChange)="onBorrowerChange()">
              <mat-option value="NEW">+ Add new borrower</mat-option>
              @for (loan of loans; track loan.id) {
                <mat-option [value]="loan.id">{{ loan.personName }} · {{ loan.phoneNumber }} · Owes LKR {{ loan.outstanding | number:'1.2-2' }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
          @if (selectedBorrower === 'NEW') {
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Borrower name *</mat-label>
              <input matInput [(ngModel)]="loanPersonName" maxlength="255" />
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Phone number *</mat-label>
              <input matInput [(ngModel)]="loanPhoneNumber" maxlength="80" />
            </mat-form-field>
          }
        }

        @if (!isCashOut && reason === 'LOAN_REPAYMENT') {
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Borrower *</mat-label>
            <mat-select [(ngModel)]="loanId" (ngModelChange)="onRepaymentBorrowerChange()">
              @for (loan of outstandingLoans; track loan.id) {
                <mat-option [value]="loan.id">{{ loan.personName }} · {{ loan.phoneNumber }} · Balance LKR {{ loan.outstanding | number:'1.2-2' }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
          @if (selectedRepaymentLoan; as loan) {
            <div class="loan-balance">Outstanding balance: <strong>LKR {{ loan.outstanding | number:'1.2-2' }}</strong>
              <button mat-button type="button" (click)="amount = loan.outstanding">Receive full balance</button>
            </div>
          }
        }

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Notes (optional)</mat-label>
          <input matInput [(ngModel)]="notes" placeholder="e.g. paid to Ahmad for delivery" />
        </mat-form-field>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button (click)="dialogRef.close()">CANCEL</button>
        <button mat-flat-button [class]="isCashOut ? 'out-btn' : 'in-btn'"
          (click)="confirm()" [disabled]="!canSubmit || loading">
          @if (loading) { <mat-spinner diameter="18" /> }
          @else { CONFIRM {{ isCashOut ? 'CASH OUT' : 'CASH IN' }} }
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .cash-wrap { min-width: 360px; }
    .cash-header {
      display: flex; align-items: center; gap: 10px;
      padding: 16px 24px 8px;
      background: #e8f5e9; color: #2e7d32;
    }
    .cash-header.out { background: #fdecea; color: #c62828; }
    .cash-header h2 { font-size: 18px; font-weight: 700; margin: 0; }
    .cash-header mat-icon { font-size: 22px; width: 22px; height: 22px; }
    mat-dialog-content { padding: 12px 24px 4px; }
    .full-width { width: 100%; }
    mat-dialog-actions { padding: 8px 24px 16px; }
    .out-btn { background: #c62828 !important; color: #fff !important; }
    .in-btn  { background: #2e7d32 !important; color: #fff !important; }
    .loan-balance { display:flex; align-items:center; justify-content:space-between; margin:0 0 12px; padding:10px 12px; border-radius:8px; background:#f0f6ff; color:#315276; font-size:13px; }
  `]
})
export class CashDialogComponent {
  dialogRef = inject(MatDialogRef<CashDialogComponent>);
  data: { type: 'IN' | 'OUT'; sessionId: number } = inject(MAT_DIALOG_DATA);
  private cashService = inject(CashService);
  private printService = inject(PrintService);
  private snack = inject(MatSnackBar);
  private supplierService = inject(SupplierService);

  get isCashOut() { return this.data.type === 'OUT'; }
  reasons = this.isCashOut ? OUT_REASONS : IN_REASONS;

  amount: number | null = null;
  reason = '';
  notes = '';
  loading = false;
  suppliers: Supplier[] = [];
  supplierId?: number;
  loans: CashLoan[] = [];
  outstandingLoans: CashLoan[] = [];
  selectedBorrower: number | 'NEW' = 'NEW';
  loanId?: number;
  loanPersonName = '';
  loanPhoneNumber = '';

  get selectedRepaymentLoan(): CashLoan | undefined {
    return this.outstandingLoans.find(loan => loan.id === this.loanId);
  }

  get canSubmit(): boolean {
    if (!this.amount || this.amount <= 0 || !this.reason) return false;
    if (this.reason === 'SUPPLIER' && !this.supplierId) return false;
    if (this.isCashOut && this.reason === 'LOAN_GIVEN') {
      if (this.selectedBorrower === 'NEW') return !!this.loanPersonName.trim() && !!this.loanPhoneNumber.trim();
      return !!this.selectedBorrower;
    }
    if (!this.isCashOut && this.reason === 'LOAN_REPAYMENT') {
      return !!this.loanId && !!this.selectedRepaymentLoan && this.amount <= this.selectedRepaymentLoan.outstanding;
    }
    return true;
  }

  constructor() {
    if (this.isCashOut) {
      this.supplierService.getAll().subscribe({ next: suppliers => this.suppliers = suppliers.filter(s => s.active) });
    }
    this.cashService.getLoans().subscribe({ next: loans => this.loans = loans ?? [] });
    this.cashService.getLoans(true).subscribe({ next: loans => this.outstandingLoans = loans ?? [] });
  }

  onBorrowerChange() {
    this.loanId = typeof this.selectedBorrower === 'number' ? this.selectedBorrower : undefined;
  }

  onRepaymentBorrowerChange() {
    const loan = this.selectedRepaymentLoan;
    if (loan && (!this.amount || this.amount > loan.outstanding)) this.amount = loan.outstanding;
  }

  confirm() {
    if (!this.canSubmit) return;
    this.loading = true;
    const obs = this.isCashOut
      ? this.cashService.cashOut(this.data.sessionId, this.amount!, this.reason, this.notes, this.supplierId,
          this.reason === 'LOAN_GIVEN' && this.selectedBorrower !== 'NEW' ? this.selectedBorrower : undefined,
          this.reason === 'LOAN_GIVEN' && this.selectedBorrower === 'NEW' ? this.loanPersonName : undefined,
          this.reason === 'LOAN_GIVEN' && this.selectedBorrower === 'NEW' ? this.loanPhoneNumber : undefined)
      : this.cashService.cashIn(this.data.sessionId, this.amount!, this.reason, this.notes,
          this.reason === 'LOAN_REPAYMENT' ? this.loanId : undefined);

    obs.subscribe({
      next: () => {
        this.dialogRef.close(true);
        this.printService.openDrawer().catch(() => this.snack.open(
          'Cash movement saved, but the drawer did not open. Use Open Drawer in Settings.', 'OK', { duration: 5000 }
        ));
      },
      error: () => { this.loading = false; }
    });
  }
}
