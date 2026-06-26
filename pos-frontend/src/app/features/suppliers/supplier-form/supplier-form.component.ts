import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SupplierService } from '../../../core/services/product.service';

@Component({
  selector: 'app-supplier-form',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatProgressSpinnerModule],
  template: `
    <h2 mat-dialog-title>{{ data.supplier ? 'Edit Supplier' : 'Add Supplier' }}</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Supplier Type *</mat-label>
        <mat-select [(ngModel)]="type">
          <mat-option value="BUSINESS">Business Supplier (sells products we resell)</mat-option>
          <mat-option value="SHOP_NEED">Shop Need Supplier (provides shop consumables)</mat-option>
        </mat-select>
        <mat-hint>{{ type === 'SHOP_NEED' ? 'e.g. Shopping bags, cleaning supplies, stationery' : 'e.g. Goods for resale in the store' }}</mat-hint>
      </mat-form-field>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Name *</mat-label>
        <input matInput [(ngModel)]="name" required />
      </mat-form-field>
      <mat-form-field appearance="outline" class="code-field">
        <mat-label>Supplier Code (2–5 letters)</mat-label>
        <input matInput [(ngModel)]="code" maxlength="5"
          placeholder="e.g. GH, RC, PL"
          (input)="code = code.toUpperCase()" />
        <mat-hint>Used as barcode prefix — e.g. GH → GH0001234567</mat-hint>
      </mat-form-field>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Phone</mat-label>
        <input matInput [(ngModel)]="phone" />
      </mat-form-field>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Address</mat-label>
        <input matInput [(ngModel)]="address" />
      </mat-form-field>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Notes</mat-label>
        <textarea matInput [(ngModel)]="notes" rows="2"></textarea>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close()">CANCEL</button>
      <button mat-flat-button class="save-btn" (click)="save()" [disabled]="!name || loading">
        @if (loading) { <mat-spinner diameter="18" /> } @else { SAVE }
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    h2 { padding: 16px 24px 0; }
    mat-dialog-content { padding: 8px 24px; display: flex; flex-direction: column; gap: 4px; }
    .full-width { width: 100%; }
    .code-field { width: 100%; margin-bottom: 4px; }
    .save-btn { background: #1b3050 !important; color: #fff !important; }
  `]
})
export class SupplierFormComponent {
  dialogRef = inject(MatDialogRef<SupplierFormComponent>);
  data: any = inject(MAT_DIALOG_DATA);
  private supplierService = inject(SupplierService);

  type: 'BUSINESS' | 'SHOP_NEED' = this.data.supplier?.type || 'BUSINESS';
  name = this.data.supplier?.name || '';
  code = this.data.supplier?.code || '';
  phone = this.data.supplier?.phone || '';
  address = this.data.supplier?.address || '';
  notes = this.data.supplier?.notes || '';
  loading = false;

  save() {
    this.loading = true;
    const codeVal = this.code.toUpperCase().replace(/[^A-Z]/g, '').substring(0, 5) || undefined;
    const payload = { type: this.type, name: this.name, code: codeVal, phone: this.phone, address: this.address, notes: this.notes };
    const obs = this.data.supplier
      ? this.supplierService.update(this.data.supplier.id, payload)
      : this.supplierService.create(payload);
    obs.subscribe({ next: () => this.dialogRef.close(true), error: () => { this.loading = false; } });
  }
}
