import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-warranty-claim-dialog',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatDialogModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatSnackBarModule,
    MatProgressSpinnerModule, MatAutocompleteModule
  ],
  template: `
    <h2 mat-dialog-title>New Warranty Claim</h2>
    <mat-dialog-content>
      <div class="dlg-form">

        <div class="form-row two-col">
          <mat-form-field appearance="outline">
            <mat-label>Customer Name *</mat-label>
            <input matInput [(ngModel)]="form.customerName" placeholder="Full name">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Phone</mat-label>
            <input matInput [(ngModel)]="form.customerPhone" placeholder="07X XXXXXXX">
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline" class="full-w">
          <mat-label>Product Name *</mat-label>
          <input matInput [(ngModel)]="productSearch" (ngModelChange)="onProductSearch()"
            [matAutocomplete]="auto" placeholder="Search or type product name">
          <mat-autocomplete #auto="matAutocomplete" (optionSelected)="onProductSelected($event.option.value)">
            @for (p of searchResults; track p.id) {
              <mat-option [value]="p">{{ p.name }}</mat-option>
            }
          </mat-autocomplete>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-w">
          <mat-label>Sale ID (optional)</mat-label>
          <input matInput type="number" [(ngModel)]="form.originalSaleId" placeholder="Enter sale number if customer has receipt">
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-w">
          <mat-label>Issue Description *</mat-label>
          <textarea matInput [(ngModel)]="form.issueDescription" rows="3"
            placeholder="Describe the problem the customer is facing..."></textarea>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-w">
          <mat-label>Handled By</mat-label>
          <input matInput [(ngModel)]="form.handledBy" placeholder="Staff name">
        </mat-form-field>

      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close [disabled]="loading">Cancel</button>
      <button mat-flat-button class="save-btn" (click)="save()" [disabled]="loading || !isValid">
        @if (loading) { <mat-spinner diameter="18"></mat-spinner> } @else { Register Claim }
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    h2 { padding: 16px 24px 0; }
    mat-dialog-content { padding: 8px 24px; min-width: 460px; }
    .dlg-form { display: flex; flex-direction: column; gap: 4px; }
    .form-row { margin-bottom: 4px; }
    .two-col { display: flex; gap: 12px; }
    .two-col mat-form-field { flex: 1; }
    .full-w { width: 100%; }
    .save-btn { background: #1b3050 !important; color: #fff !important; }
  `]
})
export class WarrantyClaimDialogComponent implements OnInit {
  private http = inject(HttpClient);
  private dialogRef = inject(MatDialogRef<WarrantyClaimDialogComponent>);
  private snack = inject(MatSnackBar);

  form: any = {
    customerName: '', customerPhone: '', productName: '',
    productId: null, originalSaleId: null, issueDescription: '', handledBy: ''
  };
  productSearch = '';
  searchResults: any[] = [];
  allProducts: any[] = [];
  loading = false;

  get isValid() {
    return this.form.customerName?.trim() && this.form.productName?.trim() && this.form.issueDescription?.trim();
  }

  ngOnInit() {
    this.http.get<any>(`${environment.apiUrl}/products`).pipe(map(r => r.data)).subscribe(p => this.allProducts = p);
  }

  onProductSearch() {
    const q = this.productSearch.trim().toLowerCase();
    this.form.productName = this.productSearch;
    this.form.productId = null;
    this.searchResults = q
      ? this.allProducts.filter((p: any) => p.name.toLowerCase().includes(q)).slice(0, 8)
      : [];
  }

  onProductSelected(product: any) {
    this.form.productName = product.name;
    this.form.productId = product.id;
    this.productSearch = product.name;
    this.searchResults = [];
  }

  save() {
    if (!this.isValid) return;
    this.loading = true;
    this.http.post<any>(`${environment.apiUrl}/warranty`, this.form).subscribe({
      next: () => {
        this.snack.open('Claim registered', '', { duration: 2000 });
        this.dialogRef.close(true);
      },
      error: err => {
        this.loading = false;
        this.snack.open(err?.error?.message || 'Failed to register claim', 'OK', { duration: 3000 });
      }
    });
  }
}
