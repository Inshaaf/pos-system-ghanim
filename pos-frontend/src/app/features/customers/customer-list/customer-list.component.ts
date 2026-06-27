import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CustomerService } from '../../../core/services/customer.service';
import { Customer } from '../../../core/models/customer.model';
import { CustomerFormComponent } from '../customer-form/customer-form.component';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatButtonModule, MatIconModule,
    MatTableModule, MatFormFieldModule, MatInputModule, MatDialogModule,
    MatSnackBarModule, MatTooltipModule
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">Customers</h1>
          <p class="page-sub">{{ filtered.length }} of {{ customers.length }} customers</p>
        </div>
        <button mat-flat-button class="primary-btn" (click)="openForm()">
          <mat-icon>person_add</mat-icon> Add Customer
        </button>
      </div>

      <mat-card class="search-card">
        <mat-form-field appearance="outline" class="search-field">
          <mat-label>Search by name or phone</mat-label>
          <mat-icon matPrefix>search</mat-icon>
          <input matInput [(ngModel)]="search" (ngModelChange)="applyFilter()" placeholder="Search..." />
          @if (search) {
            <button matSuffix mat-icon-button (click)="search=''; applyFilter()">
              <mat-icon>close</mat-icon>
            </button>
          }
        </mat-form-field>
      </mat-card>

      <mat-card>
        @if (loading) {
          <div class="empty-state">Loading customers...</div>
        } @else if (filtered.length === 0) {
          <div class="empty-state">
            <mat-icon>people_outline</mat-icon>
            <p>{{ search ? 'No customers match your search.' : 'No customers yet. Add your first customer.' }}</p>
          </div>
        } @else {
          <table mat-table [dataSource]="filtered">
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Name</th>
              <td mat-cell *matCellDef="let c">
                <div class="name-cell">
                  <div class="avatar">{{ c.name.charAt(0).toUpperCase() }}</div>
                  <strong>{{ c.name }}</strong>
                </div>
              </td>
            </ng-container>

            <ng-container matColumnDef="phone">
              <th mat-header-cell *matHeaderCellDef>Phone</th>
              <td mat-cell *matCellDef="let c">{{ c.phone || '-' }}</td>
            </ng-container>

            <ng-container matColumnDef="email">
              <th mat-header-cell *matHeaderCellDef>Email</th>
              <td mat-cell *matCellDef="let c">{{ c.email || '-' }}</td>
            </ng-container>

            <ng-container matColumnDef="address">
              <th mat-header-cell *matHeaderCellDef>Address</th>
              <td mat-cell *matCellDef="let c">{{ c.address || '-' }}</td>
            </ng-container>

            @if (hasStats) {
              <ng-container matColumnDef="totalPurchases">
                <th mat-header-cell *matHeaderCellDef>Purchases</th>
                <td mat-cell *matCellDef="let c">{{ c.totalPurchases ?? 0 }}</td>
              </ng-container>
              <ng-container matColumnDef="totalSpent">
                <th mat-header-cell *matHeaderCellDef>Total Spent</th>
                <td mat-cell *matCellDef="let c">LKR {{ (c.totalSpent ?? 0) | number:'1.2-2' }}</td>
              </ng-container>
            }

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let c">
                @if (auth.isOwner()) {
                  <button mat-icon-button matTooltip="Edit" (click)="openForm(c)">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button matTooltip="Delete" class="delete-btn" (click)="confirmDelete(c)">
                    <mat-icon>delete_outline</mat-icon>
                  </button>
                }
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="cols"></tr>
            <tr mat-row *matRowDef="let row; columns: cols;"></tr>
          </table>
        }
      </mat-card>
    </div>
  `,
  styles: [`
    .page-container { padding: 24px; }
    .page-header {
      display: flex; justify-content: space-between; align-items: flex-start;
      margin-bottom: 20px;
    }
    .page-title { font-size: 22px; font-weight: 700; color: #1b3050; margin: 0; }
    .page-sub { color: #888; font-size: 13px; margin: 4px 0 0; }
    .primary-btn { background: #1b3050 !important; color: #fff !important; }
    .search-card { margin-bottom: 16px; padding: 12px 16px; }
    .search-field { width: 100%; max-width: 400px; }
    .empty-state {
      display: flex; flex-direction: column; align-items: center;
      padding: 48px 24px; color: #aaa; gap: 8px;
    }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; }
    .name-cell { display: flex; align-items: center; gap: 10px; }
    .avatar {
      width: 32px; height: 32px; border-radius: 50%;
      background: #1b3050; color: #c9a84c;
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 14px; flex-shrink: 0;
    }
    table { width: 100%; }
    .delete-btn { color: #c62828; }
    th.mat-header-cell { font-weight: 700; color: #6b7280; font-size: 12px; }

    @media (max-width: 767px) {
      .page-container { padding: 12px; }
      .page-header { flex-direction: column; gap: 8px; }
      .search-field { max-width: 100%; }
      .avatar { width: 28px; height: 28px; font-size: 12px; }

      /* Hide less important columns on mobile — keep name, phone, actions */
      .cdk-column-email,
      .cdk-column-address,
      .cdk-column-totalPurchases,
      .cdk-column-totalSpent { display: none !important; }

      /* Make name cell text truncate neatly */
      .cdk-column-name { max-width: 160px; }
      .name-cell strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 110px; display: block; }
      table { font-size: 13px; }
    }
  `]
})
export class CustomerListComponent implements OnInit {
  private customerService = inject(CustomerService);
  private dialog = inject(MatDialog);
  private snack = inject(MatSnackBar);
  auth = inject(AuthService);

  customers: Customer[] = [];
  filtered: Customer[] = [];
  search = '';
  loading = true;
  hasStats = false;

  cols = ['name', 'phone', 'email', 'address', 'actions'];

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.customerService.getAll().subscribe({
      next: data => {
        this.customers = data;
        this.hasStats = data.some(c => c.totalPurchases != null || c.totalSpent != null);
        if (this.hasStats) {
          this.cols = ['name', 'phone', 'email', 'address', 'totalPurchases', 'totalSpent', 'actions'];
        }
        this.applyFilter();
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  applyFilter() {
    const q = this.search.toLowerCase();
    this.filtered = q
      ? this.customers.filter(c =>
          c.name.toLowerCase().includes(q) ||
          (c.phone || '').toLowerCase().includes(q) ||
          (c.email || '').toLowerCase().includes(q)
        )
      : [...this.customers];
  }

  openForm(customer?: Customer) {
    this.dialog.open(CustomerFormComponent, { width: '420px', data: { customer } })
      .afterClosed().subscribe(saved => { if (saved) this.load(); });
  }

  confirmDelete(customer: Customer) {
    const ref = this.snack.open(`Delete ${customer.name}?`, 'Delete', { duration: 4000 });
    ref.onAction().subscribe(() => {
      this.customerService.delete(customer.id).subscribe({
        next: () => {
          this.snack.open('Customer deleted', '', { duration: 2000 });
          this.load();
        },
        error: () => this.snack.open('Could not delete customer', 'OK', { duration: 3000 })
      });
    });
  }
}


