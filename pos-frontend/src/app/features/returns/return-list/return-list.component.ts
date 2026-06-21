import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ReturnService } from '../../../core/services/sale.service';

@Component({
  selector: 'app-return-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatIconModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatProgressSpinnerModule
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1 class="page-title">Returns</h1>
        <div class="header-controls">
          <mat-form-field appearance="outline" class="date-field">
            <mat-label>Date</mat-label>
            <input matInput type="date" [(ngModel)]="selectedDate" (change)="load()">
          </mat-form-field>
        </div>
      </div>

      @if (loading) {
        <div class="loading-wrap"><mat-spinner diameter="40"></mat-spinner></div>
      }

      @if (!loading && returns.length === 0) {
        <mat-card class="empty-card">
          <mat-icon>assignment_return</mat-icon>
          <p>No returns for {{ selectedDate | date:'dd MMM yyyy' }}</p>
        </mat-card>
      }

      @if (!loading && returns.length > 0) {
        <!-- Summary strip -->
        <div class="summary-strip">
          <div class="strip-item">
            <div class="strip-val">{{ returns.length }}</div>
            <div class="strip-lbl">Total Returns</div>
          </div>
          <div class="strip-item">
            <div class="strip-val red">Rs {{ totalRefunds | number:'1.0-0' }}</div>
            <div class="strip-lbl">Total Refunded</div>
          </div>
          <div class="strip-item">
            <div class="strip-val">{{ cashRefunds }}</div>
            <div class="strip-lbl">Cash Refunds</div>
          </div>
          <div class="strip-item">
            <div class="strip-val">{{ exchanges }}</div>
            <div class="strip-lbl">Exchanges</div>
          </div>
        </div>

        @for (ret of returns; track ret.id) {
          <mat-card class="return-card">
            <div class="card-header">
              <div class="card-left">
                <div class="return-id">#{{ ret.id }}</div>
                <div class="return-time">{{ ret.createdAt | date:'HH:mm' }}</div>
                @if (ret.originalSaleId) {
                  <div class="sale-ref">Sale #{{ ret.originalSaleId }}</div>
                }
                @if (ret.salesperson) {
                  <div class="salesperson-tag"><mat-icon>person</mat-icon>{{ ret.salesperson }}</div>
                }
              </div>
              <div class="card-right">
                <span class="type-badge" [class.cash]="ret.returnType === 'CASH_REFUND'" [class.exchange]="ret.returnType === 'EXCHANGE'">
                  {{ ret.returnType === 'CASH_REFUND' ? 'Cash Refund' : 'Exchange' }}
                </span>
                <div class="refund-amount">Rs {{ ret.refundAmount | number:'1.0-0' }}</div>
              </div>
            </div>

            @if (ret.reason) {
              <div class="reason-row"><mat-icon>comment</mat-icon> {{ ret.reason }}</div>
            }

            <div class="items-list">
              @for (item of ret.items; track $index) {
                <div class="item-row">
                  <span class="item-name">{{ item.productName }}</span>
                  <span class="item-qty">× {{ item.quantity }}</span>
                  <span class="item-price">Rs {{ item.unitPrice | number:'1.0-0' }}</span>
                  <span class="item-sub">Rs {{ item.subtotal | number:'1.0-0' }}</span>
                </div>
              }
            </div>
          </mat-card>
        }
      }
    </div>
  `,
  styles: [`
    .page-container { padding: 24px; max-width: 900px; margin: 0 auto; }
    .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; }
    .page-title { font-size: 22px; font-weight: 700; color: #1b3050; margin: 0; }
    .date-field { width: 180px; }
    .loading-wrap { display: flex; justify-content: center; padding: 60px; }

    .empty-card {
      display: flex; flex-direction: column; align-items: center; padding: 60px; text-align: center; color: #aaa;
    }
    .empty-card mat-icon { font-size: 48px; width: 48px; height: 48px; margin-bottom: 12px; color: #ccc; }

    .summary-strip {
      display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap;
    }
    .strip-item {
      flex: 1; min-width: 120px; background: #fff; border: 1px solid #eef0f4; border-radius: 10px;
      padding: 14px 16px; text-align: center;
    }
    .strip-val { font-size: 22px; font-weight: 700; color: #1b3050; }
    .strip-val.red { color: #e53935; }
    .strip-lbl { font-size: 11px; color: #6b7280; text-transform: uppercase; margin-top: 2px; }

    .return-card { margin-bottom: 12px; padding: 16px 20px; border-radius: 12px; }
    .card-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 10px; }
    .card-left { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .return-id { font-size: 15px; font-weight: 700; color: #1b3050; }
    .return-time { font-size: 13px; color: #6b7280; }
    .sale-ref { background: #e8f0fe; color: #1565c0; font-size: 11px; font-weight: 600; border-radius: 4px; padding: 2px 7px; }
    .salesperson-tag { display: flex; align-items: center; gap: 3px; font-size: 12px; color: #555; }
    .salesperson-tag mat-icon { font-size: 14px; width: 14px; height: 14px; }

    .card-right { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
    .type-badge { font-size: 11px; font-weight: 600; border-radius: 20px; padding: 3px 10px; }
    .type-badge.cash { background: #fce4ec; color: #c62828; }
    .type-badge.exchange { background: #e8f5e9; color: #2e7d32; }
    .refund-amount { font-size: 18px; font-weight: 700; color: #c62828; }

    .reason-row { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #795548; margin-bottom: 10px; }
    .reason-row mat-icon { font-size: 14px; width: 14px; height: 14px; }

    .items-list { border-top: 1px solid #f0f0f0; padding-top: 10px; display: flex; flex-direction: column; gap: 4px; }
    .item-row { display: grid; grid-template-columns: 1fr 60px 90px 90px; gap: 8px; font-size: 13px; align-items: center; }
    .item-name { font-weight: 500; color: #333; }
    .item-qty { color: #6b7280; text-align: center; }
    .item-price { color: #6b7280; text-align: right; }
    .item-sub { font-weight: 600; color: #1b3050; text-align: right; }
  `]
})
export class ReturnListComponent implements OnInit {
  private returnService = inject(ReturnService);

  selectedDate = new Date().toISOString().split('T')[0];
  returns: any[] = [];
  loading = false;

  get totalRefunds(): number {
    return this.returns.reduce((s, r) => s + (r.refundAmount || 0), 0);
  }
  get cashRefunds(): number {
    return this.returns.filter(r => r.returnType === 'CASH_REFUND').length;
  }
  get exchanges(): number {
    return this.returns.filter(r => r.returnType === 'EXCHANGE').length;
  }

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading = true;
    this.returnService.getByDate(this.selectedDate).subscribe({
      next: data => { this.returns = data; this.loading = false; },
      error: () => { this.returns = []; this.loading = false; }
    });
  }
}
