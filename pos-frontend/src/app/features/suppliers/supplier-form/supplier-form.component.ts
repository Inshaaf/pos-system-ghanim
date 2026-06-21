import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SupplierService } from '../../../core/services/product.service';

@Component({
  selector: 'app-supplier-form',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatProgressSpinnerModule],
  template: `
    <h2 mat-dialog-title>{{ data.supplier ? 'Edit Supplier' : 'Add Supplier' }}</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Name *</mat-label>
        <input matInput [(ngModel)]="name" required />
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
    mat-dialog-content { padding: 8px 24px; }
    .full-width { width: 100%; }
    .save-btn { background: #1b3050 !important; color: #fff !important; }
  `]
})
export class SupplierFormComponent {
  dialogRef = inject(MatDialogRef<SupplierFormComponent>);
  data: any = inject(MAT_DIALOG_DATA);
  private supplierService = inject(SupplierService);

  name = this.data.supplier?.name || '';
  phone = this.data.supplier?.phone || '';
  address = this.data.supplier?.address || '';
  notes = this.data.supplier?.notes || '';
  loading = false;

  save() {
    this.loading = true;
    const payload = { name: this.name, phone: this.phone, address: this.address, notes: this.notes };
    const obs = this.data.supplier
      ? this.supplierService.update(this.data.supplier.id, payload)
      : this.supplierService.create(payload);
    obs.subscribe({ next: () => this.dialogRef.close(true), error: () => { this.loading = false; } });
  }
}


