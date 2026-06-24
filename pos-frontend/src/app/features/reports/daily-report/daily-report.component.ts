import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ReportService } from '../../../core/services/report.service';
import {
  DailyReport, RangeReport, ProductStat, SlowStockItem, CashFlowDay
} from '../../../core/models/report.model';

@Component({
  selector: 'app-daily-report',
  standalone: true,
  imports: [
    CommonModule, DatePipe, FormsModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatTableModule, MatTabsModule, MatProgressSpinnerModule, MatTooltipModule
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">Reports</h1>
          <p class="page-sub">Sales, profit, stock &amp; cash flow</p>
        </div>
        <button mat-stroked-button (click)="printPage()">
          <mat-icon>print</mat-icon> Print
        </button>
      </div>

      <mat-tab-group animationDuration="150ms" class="reports-tabs">

        <!-- â”€â”€ DAILY â”€â”€ -->
        <mat-tab label="Daily">
          <div class="tab-body">
            <div class="tab-controls">
              <input type="date" class="date-inp" [(ngModel)]="dailyDate" (change)="loadDaily()" />
            </div>

            @if (dailyLoading) { <div class="spin-center"><mat-spinner diameter="36"/></div> }
            @else if (daily) {
              <div class="stat-grid">
                <mat-card class="stat-card"><div class="sl">Total Sales</div><div class="sv">{{ daily.totalSales }}</div></mat-card>
                <mat-card class="stat-card navy"><div class="sl">Revenue</div><div class="sv">Rs {{ daily.totalAmount | number:'1.0-0' }}</div></mat-card>
                <mat-card class="stat-card green"><div class="sl">Gross Profit</div><div class="sv">Rs {{ daily.totalProfit | number:'1.0-0' }}</div><div class="ss">Margin {{ daily.margin }}%</div></mat-card>
                <mat-card class="stat-card gold"><div class="sl">Retail</div><div class="sv sm">Rs {{ daily.retailAmount | number:'1.0-0' }}</div><div class="ss">Wholesale Rs {{ daily.wholesaleAmount | number:'1.0-0' }}</div></mat-card>
              </div>
              <div class="stat-grid" style="margin-top:0">
                <mat-card class="stat-card red-card"><div class="sl">Expenses Today</div><div class="sv sm">Rs {{ daily.totalExpenses | number:'1.0-0' }}</div></mat-card>
                <mat-card class="stat-card" [class.green]="daily.netProfit >= 0" [class.red-card]="daily.netProfit < 0">
                  <div class="sl">Net Profit After Expenses</div>
                  <div class="sv sm">Rs {{ daily.netProfit | number:'1.0-0' }}</div>
                  <div class="ss">Gross Rs {{ daily.totalProfit | number:'1.0-0' }} - Expenses Rs {{ daily.totalExpenses | number:'1.0-0' }}</div>
                </mat-card>
              </div>

              @if (daily.quickSaleCount > 0) {
                <div class="qs-banner">
                  <mat-icon class="qs-icon">bolt</mat-icon>
                  <div class="qs-text">
                    <span class="qs-label">Quick Sales</span>
                    <span class="qs-note">Revenue collected but not counted in profit (no cost price)</span>
                  </div>
                  <div class="qs-stats">
                    <span class="qs-count">{{ daily.quickSaleCount }} sale(s)</span>
                    <span class="qs-total">Rs {{ daily.quickSaleTotal | number:'1.0-0' }}</span>
                  </div>
                </div>
              }

              <div class="row-cards">
                <mat-card class="half-card">
                  <div class="card-title">By Salesperson</div>
                  @if (!daily.salespersonBreakdown.length) { <div class="no-data">No data</div> }
                  @else {
                    <table mat-table [dataSource]="daily.salespersonBreakdown" class="rep-table">
                      <ng-container matColumnDef="name"><th mat-header-cell *matHeaderCellDef>Name</th><td mat-cell *matCellDef="let r">{{ r.name }}</td></ng-container>
                      <ng-container matColumnDef="salesCount"><th mat-header-cell *matHeaderCellDef>Sales</th><td mat-cell *matCellDef="let r">{{ r.salesCount }}</td></ng-container>
                      <ng-container matColumnDef="totalAmount"><th mat-header-cell *matHeaderCellDef>Amount</th><td mat-cell *matCellDef="let r">Rs {{ r.totalAmount | number:'1.0-0' }}</td></ng-container>
                      <tr mat-header-row *matHeaderRowDef="spCols"></tr>
                      <tr mat-row *matRowDef="let r; columns: spCols;"></tr>
                    </table>
                  }
                </mat-card>

                <mat-card class="half-card">
                  <div class="card-title">Cash Summary</div>
                  <div class="info-row"><span>Opening Float</span><span>Rs {{ daily.cashSummary.openingFloat | number:'1.0-0' }}</span></div>
                  <div class="info-row"><span>Cash Sales</span><span>Rs {{ daily.cashSummary.totalCashSales | number:'1.0-0' }}</span></div>
                  @if (daily.cashSummary.quickSaleCash > 0) {
                    <div class="info-row qs-row"><span>Quick Sale Cash</span><span class="qs-amount">Rs {{ daily.cashSummary.quickSaleCash | number:'1.0-0' }}</span></div>
                  }
                  <div class="info-row"><span>Cash In</span><span>Rs {{ daily.cashSummary.cashIn | number:'1.0-0' }}</span></div>
                  <div class="info-row"><span>Cash Out</span><span class="red">-Rs {{ daily.cashSummary.cashOut | number:'1.0-0' }}</span></div>
                  <div class="info-row bold"><span>Expected in Drawer</span><span>Rs {{ daily.cashSummary.expectedCash | number:'1.0-0' }}</span></div>
                  @for (e of cashOutEntries(daily); track e[0]) {
                    <div class="info-row sub"><span>-> {{ reasonLabel(e[0]) }}</span><span class="red">-Rs {{ e[1] | number:'1.0-0' }}</span></div>
                  }
                  <div class="card-title" style="margin-top:14px">Payment Methods</div>
                  <div class="info-row"><span>Cash</span><span>Rs {{ daily.paymentBreakdown.cash | number:'1.0-0' }}</span></div>
                  <div class="info-row"><span>Card</span><span>Rs {{ daily.paymentBreakdown.card | number:'1.0-0' }}</span></div>
                  <div class="info-row"><span>Credit</span><span>Rs {{ daily.paymentBreakdown.credit | number:'1.0-0' }}</span></div>
                </mat-card>
              </div>
            }
          </div>
        </mat-tab>

        <!-- â”€â”€ DATE RANGE â”€â”€ -->
        <mat-tab label="Date Range">
          <div class="tab-body">
            <div class="tab-controls">
              <label class="ctrl-label">From</label>
              <input type="date" class="date-inp" [(ngModel)]="rangeFrom" />
              <label class="ctrl-label">To</label>
              <input type="date" class="date-inp" [(ngModel)]="rangeTo" />
              <button mat-flat-button class="run-btn" (click)="loadRange()">
                <mat-icon>bar_chart</mat-icon> Run
              </button>
            </div>

            @if (rangeLoading) { <div class="spin-center"><mat-spinner diameter="36"/></div> }
            @else if (range) {
              <div class="stat-grid">
                <mat-card class="stat-card"><div class="sl">Total Sales</div><div class="sv">{{ range.totalSales }}</div></mat-card>
                <mat-card class="stat-card navy"><div class="sl">Revenue</div><div class="sv">Rs {{ range.totalAmount | number:'1.0-0' }}</div></mat-card>
                <mat-card class="stat-card green"><div class="sl">Gross Profit</div><div class="sv">Rs {{ range.totalProfit | number:'1.0-0' }}</div><div class="ss">Margin {{ range.margin }}%</div></mat-card>
                <mat-card class="stat-card gold"><div class="sl">Retail</div><div class="sv sm">Rs {{ range.retailAmount | number:'1.0-0' }}</div><div class="ss">Wholesale Rs {{ range.wholesaleAmount | number:'1.0-0' }}</div></mat-card>
              </div>
              <div class="stat-grid" style="margin-top:0">
                <mat-card class="stat-card red-card"><div class="sl">Total Expenses</div><div class="sv sm">Rs {{ range.totalExpenses | number:'1.0-0' }}</div></mat-card>
                <mat-card class="stat-card" [class.green]="range.netProfit >= 0" [class.red-card]="range.netProfit < 0">
                  <div class="sl">Net Profit After Expenses</div>
                  <div class="sv sm">Rs {{ range.netProfit | number:'1.0-0' }}</div>
                  <div class="ss">Gross Rs {{ range.totalProfit | number:'1.0-0' }} - Expenses Rs {{ range.totalExpenses | number:'1.0-0' }}</div>
                </mat-card>
              </div>

              <mat-card class="table-card">
                <div class="card-title">Daily Breakdown</div>
                <table mat-table [dataSource]="range.dailyBreakdown" class="rep-table">
                  <ng-container matColumnDef="date"><th mat-header-cell *matHeaderCellDef>Date</th><td mat-cell *matCellDef="let r">{{ r.date }}</td></ng-container>
                  <ng-container matColumnDef="salesCount"><th mat-header-cell *matHeaderCellDef>Sales</th><td mat-cell *matCellDef="let r">{{ r.salesCount }}</td></ng-container>
                  <ng-container matColumnDef="revenue"><th mat-header-cell *matHeaderCellDef>Revenue</th><td mat-cell *matCellDef="let r">Rs {{ r.revenue | number:'1.0-0' }}</td></ng-container>
                  <tr mat-header-row *matHeaderRowDef="rangeCols"></tr>
                  <tr mat-row *matRowDef="let r; columns: rangeCols;"></tr>
                </table>
              </mat-card>

              <mat-card class="table-card">
                <div class="card-title">By Salesperson</div>
                @if (!range.salespersonBreakdown.length) { <div class="no-data">No salesperson data</div> }
                @else {
                  <table mat-table [dataSource]="range.salespersonBreakdown" class="rep-table">
                    <ng-container matColumnDef="name"><th mat-header-cell *matHeaderCellDef>Name</th><td mat-cell *matCellDef="let r">{{ r.name }}</td></ng-container>
                    <ng-container matColumnDef="salesCount"><th mat-header-cell *matHeaderCellDef>Sales</th><td mat-cell *matCellDef="let r">{{ r.salesCount }}</td></ng-container>
                    <ng-container matColumnDef="totalAmount"><th mat-header-cell *matHeaderCellDef>Amount</th><td mat-cell *matCellDef="let r">Rs {{ r.totalAmount | number:'1.0-0' }}</td></ng-container>
                    <tr mat-header-row *matHeaderRowDef="spCols"></tr>
                    <tr mat-row *matRowDef="let r; columns: spCols;"></tr>
                  </table>
                }
              </mat-card>

              <mat-card class="table-card">
                <div class="card-title">Payment Methods</div>
                <div class="info-row"><span>Cash</span><span>Rs {{ range.paymentBreakdown.cash | number:'1.0-0' }}</span></div>
                <div class="info-row"><span>Card</span><span>Rs {{ range.paymentBreakdown.card | number:'1.0-0' }}</span></div>
                <div class="info-row"><span>Credit</span><span>Rs {{ range.paymentBreakdown.credit | number:'1.0-0' }}</span></div>
              </mat-card>
            }
          </div>
        </mat-tab>

        <!-- â”€â”€ PRODUCTS / CATEGORY â”€â”€ -->
        <mat-tab label="By Product">
          <div class="tab-body">
            <div class="tab-controls">
              <label class="ctrl-label">From</label>
              <input type="date" class="date-inp" [(ngModel)]="prodFrom" />
              <label class="ctrl-label">To</label>
              <input type="date" class="date-inp" [(ngModel)]="prodTo" />
              <button mat-flat-button class="run-btn" (click)="loadProducts()">
                <mat-icon>bar_chart</mat-icon> Run
              </button>
            </div>

            @if (prodLoading) { <div class="spin-center"><mat-spinner diameter="36"/></div> }
            @else if (products.length > 0) {
              <!-- Top 5 summary -->
              <div class="stat-grid four">
                <mat-card class="stat-card navy"><div class="sl">Products Sold</div><div class="sv">{{ products.length }}</div></mat-card>
                <mat-card class="stat-card"><div class="sl">Total Revenue</div><div class="sv sm">Rs {{ prodTotalRevenue | number:'1.0-0' }}</div></mat-card>
                <mat-card class="stat-card green"><div class="sl">Total Profit</div><div class="sv sm">Rs {{ prodTotalProfit | number:'1.0-0' }}</div></mat-card>
                <mat-card class="stat-card gold"><div class="sl">Avg Margin</div><div class="sv">{{ prodAvgMargin }}%</div></mat-card>
              </div>

              <mat-card class="table-card">
                <div class="card-title">All Products - sorted by qty sold</div>
                <table mat-table [dataSource]="products" class="rep-table">
                  <ng-container matColumnDef="productName"><th mat-header-cell *matHeaderCellDef>Product</th><td mat-cell *matCellDef="let r"><strong>{{ r.productName }}</strong></td></ng-container>
                  <ng-container matColumnDef="category"><th mat-header-cell *matHeaderCellDef>Category</th><td mat-cell *matCellDef="let r">{{ r.category }}</td></ng-container>
                  <ng-container matColumnDef="qtySold"><th mat-header-cell *matHeaderCellDef>Qty</th><td mat-cell *matCellDef="let r">{{ r.qtySold | number:'1.0-2' }}</td></ng-container>
                  <ng-container matColumnDef="revenue"><th mat-header-cell *matHeaderCellDef>Revenue</th><td mat-cell *matCellDef="let r">Rs {{ r.revenue | number:'1.0-0' }}</td></ng-container>
                  <ng-container matColumnDef="profit"><th mat-header-cell *matHeaderCellDef>Profit</th><td mat-cell *matCellDef="let r">Rs {{ r.profit | number:'1.0-0' }}</td></ng-container>
                  <ng-container matColumnDef="margin"><th mat-header-cell *matHeaderCellDef>Margin %</th>
                    <td mat-cell *matCellDef="let r">
                      <span class="margin-chip" [class.good]="r.margin >= 20" [class.low]="r.margin < 10">{{ r.margin }}%</span>
                    </td>
                  </ng-container>
                  <tr mat-header-row *matHeaderRowDef="prodCols"></tr>
                  <tr mat-row *matRowDef="let r; columns: prodCols;"></tr>
                </table>
              </mat-card>
            } @else if (!prodLoading) {
              <div class="empty-hint">Select a date range and click Run.</div>
            }
          </div>
        </mat-tab>

        <!-- â”€â”€ TOP PRODUCTS â”€â”€ -->
        <mat-tab label="Top Products">
          <div class="tab-body">
            <div class="tab-controls">
              <label class="ctrl-label">From</label>
              <input type="date" class="date-inp" [(ngModel)]="topFrom" />
              <label class="ctrl-label">To</label>
              <input type="date" class="date-inp" [(ngModel)]="topTo" />
              <button mat-flat-button class="run-btn" (click)="loadTop()">
                <mat-icon>bar_chart</mat-icon> Run
              </button>
            </div>

            @if (topLoading) { <div class="spin-center"><mat-spinner diameter="36"/></div> }
            @else if (topProducts.length > 0) {
              <mat-card class="table-card">
                <div class="card-title">Top 10 - by quantity sold</div>
                @for (p of topProducts.slice(0, 10); track p.productId; let i = $index) {
                  <div class="rank-row">
                    <div class="rank-num" [class.gold]="i === 0" [class.silver]="i === 1" [class.bronze]="i === 2">
                      #{{ i + 1 }}
                    </div>
                    <div class="rank-info">
                      <div class="rank-name">{{ p.productName }}</div>
                      <div class="rank-cat">{{ p.category }}</div>
                    </div>
                    <div class="rank-stats">
                      <div class="rank-qty">{{ p.qtySold | number:'1.0-1' }} units</div>
                      <div class="rank-rev">Rs {{ p.revenue | number:'1.0-0' }}</div>
                    </div>
                  </div>
                }
              </mat-card>
            } @else if (!topLoading) {
              <div class="empty-hint">Select a date range and click Run.</div>
            }
          </div>
        </mat-tab>

        <!-- â”€â”€ SLOW MOVING STOCK â”€â”€ -->
        <mat-tab label="Slow Stock">
          <div class="tab-body">
            <div class="tab-controls">
              <label class="ctrl-label">Last</label>
              <select class="date-inp" [(ngModel)]="slowDays" (ngModelChange)="loadSlowStock()">
                <option [value]="7">7 days</option>
                <option [value]="14">14 days</option>
                <option [value]="30">30 days</option>
                <option [value]="60">60 days</option>
                <option [value]="90">90 days</option>
              </select>
            </div>

            @if (slowLoading) { <div class="spin-center"><mat-spinner diameter="36"/></div> }
            @else if (slowStock.length > 0) {
              <mat-card class="table-card">
                <div class="card-title">Products ranked by lowest sales in last {{ slowDays }} days</div>
                <table mat-table [dataSource]="slowStock" class="rep-table">
                  <ng-container matColumnDef="productName"><th mat-header-cell *matHeaderCellDef>Product</th><td mat-cell *matCellDef="let r"><strong>{{ r.productName }}</strong></td></ng-container>
                  <ng-container matColumnDef="category"><th mat-header-cell *matHeaderCellDef>Category</th><td mat-cell *matCellDef="let r">{{ r.category }}</td></ng-container>
                  <ng-container matColumnDef="stockQuantity"><th mat-header-cell *matHeaderCellDef>In Stock</th>
                    <td mat-cell *matCellDef="let r">
                      <span [class.low-stock]="r.stockQuantity <= r.minStockAlert">{{ r.stockQuantity }}</span>
                    </td>
                  </ng-container>
                  <ng-container matColumnDef="qtySoldInPeriod"><th mat-header-cell *matHeaderCellDef>Sold (period)</th>
                    <td mat-cell *matCellDef="let r">
                      <span class="sold-chip" [class.zero]="r.qtySoldInPeriod == 0">
                        {{ r.qtySoldInPeriod | number:'1.0-1' }}
                      </span>
                    </td>
                  </ng-container>
                  <tr mat-header-row *matHeaderRowDef="slowCols"></tr>
                  <tr mat-row *matRowDef="let r; columns: slowCols;"></tr>
                </table>
              </mat-card>
            }
          </div>
        </mat-tab>

        <!-- â”€â”€ CASH FLOW â”€â”€ -->
        <mat-tab label="Cash Flow">
          <div class="tab-body">
            <div class="tab-controls">
              <label class="ctrl-label">From</label>
              <input type="date" class="date-inp" [(ngModel)]="cfFrom" />
              <label class="ctrl-label">To</label>
              <input type="date" class="date-inp" [(ngModel)]="cfTo" />
              <button mat-flat-button class="run-btn" (click)="loadCashFlow()">
                <mat-icon>bar_chart</mat-icon> Run
              </button>
            </div>

            @if (cfLoading) { <div class="spin-center"><mat-spinner diameter="36"/></div> }
            @else if (cashFlow.length > 0) {
              <!-- Totals -->
              <div class="stat-grid">
                <mat-card class="stat-card navy"><div class="sl">Cash Revenue</div><div class="sv sm">Rs {{ cfTotalCashRev | number:'1.0-0' }}</div></mat-card>
                <mat-card class="stat-card red-card"><div class="sl">Total Expenses</div><div class="sv sm">Rs {{ cfTotalExp | number:'1.0-0' }}</div></mat-card>
                <mat-card class="stat-card" [class.green]="cfNet >= 0" [class.red-card]="cfNet < 0">
                  <div class="sl">Net Cash</div>
                  <div class="sv sm">Rs {{ cfNet | number:'1.0-0' }}</div>
                </mat-card>
              </div>

              <mat-card class="table-card">
                <div class="card-title">Daily Cash Flow</div>
                <table mat-table [dataSource]="cashFlow" class="rep-table">
                  <ng-container matColumnDef="date"><th mat-header-cell *matHeaderCellDef>Date</th><td mat-cell *matCellDef="let r">{{ r.date }}</td></ng-container>
                  <ng-container matColumnDef="salesCount"><th mat-header-cell *matHeaderCellDef>Sales</th><td mat-cell *matCellDef="let r">{{ r.salesCount }}</td></ng-container>
                  <ng-container matColumnDef="cashRevenue"><th mat-header-cell *matHeaderCellDef>Cash Revenue</th><td mat-cell *matCellDef="let r">Rs {{ r.cashRevenue | number:'1.0-0' }}</td></ng-container>
                  <ng-container matColumnDef="expenses"><th mat-header-cell *matHeaderCellDef>Expenses</th><td mat-cell *matCellDef="let r" class="red">Rs {{ r.expenses | number:'1.0-0' }}</td></ng-container>
                  <ng-container matColumnDef="net"><th mat-header-cell *matHeaderCellDef>Net</th>
                    <td mat-cell *matCellDef="let r" [class.green-text]="r.net >= 0" [class.red]="r.net < 0">
                      Rs {{ r.net | number:'1.0-0' }}
                    </td>
                  </ng-container>
                  <tr mat-header-row *matHeaderRowDef="cfCols"></tr>
                  <tr mat-row *matRowDef="let r; columns: cfCols;"></tr>
                </table>
              </mat-card>
            } @else if (!cfLoading) {
              <div class="empty-hint">Select a date range and click Run.</div>
            }
          </div>
        </mat-tab>

      </mat-tab-group>
    </div>
  `,
  styles: [`
    .page-container { padding: 24px; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
    .page-title { font-size: 22px; font-weight: 700; color: #1b3050; margin: 0; }
    .page-sub { color: #888; font-size: 13px; margin: 2px 0 0; }

    .reports-tabs { }
    .tab-body { padding: 16px 0; display: flex; flex-direction: column; gap: 16px; }
    .tab-controls { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .ctrl-label { font-size: 12px; color: #6b7280; font-weight: 500; }
    .date-inp {
      border: 1px solid #e2e6ec; border-radius: 6px; padding: 7px 10px;
      font-size: 13px; color: #1b3050; font-family: inherit; outline: none;
    }
    .date-inp:focus { border-color: #c9a84c; }
    .run-btn { background: #1b3050 !important; color: #fff !important; font-size: 13px !important; }

    .spin-center { display: flex; justify-content: center; padding: 48px; }
    .empty-hint { color: #6b7280; font-size: 14px; padding: 24px 0; }

    /* Stat grid */
    .stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
    .stat-grid.four { grid-template-columns: repeat(4, 1fr); }
    .stat-card { padding: 18px !important; }
    .stat-card.navy { background: #1b3050 !important; color: #fff !important; }
    .stat-card.green { background: #e8f5e9 !important; }
    .stat-card.gold { background: #e3f2fd !important; }
    .stat-card.red-card { background: #fdecea !important; }
    .sl { font-size: 11px; opacity: 0.7; margin-bottom: 6px; }
    .sv { font-size: 22px; font-weight: 700; }
    .sv.sm { font-size: 17px; }
    .ss { font-size: 11px; opacity: 0.65; margin-top: 3px; }

    /* Row cards */
    .row-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .half-card { padding: 0 !important; overflow: hidden; }
    .table-card { padding: 0 !important; overflow: hidden; }
    .card-title { font-size: 14px; font-weight: 700; color: #1b3050; padding: 14px 16px 10px; }

    /* Info rows */
    .info-row { display: flex; justify-content: space-between; padding: 9px 16px; border-bottom: 1px solid #f4f6f9; font-size: 13px; color: #1b3050; }
    .info-row:last-child { border-bottom: none; }
    .info-row.bold { font-weight: 700; }
    .info-row.sub { padding: 6px 16px 6px 28px; font-size: 12px; color: #6b7280; }
    .red { color: #c62828; }
    .green-text { color: #2e7d32; }
    .no-data { padding: 12px 16px; color: #6b7280; font-size: 13px; }

    /* Table */
    .rep-table { width: 100%; }
    .rep-table th { font-size: 11px !important; font-weight: 700 !important; color: #6b7280 !important; }
    .rep-table td { font-size: 13px !important; }

    /* Margin chip */
    .margin-chip { padding: 2px 8px; border-radius: 10px; font-size: 12px; font-weight: 600; background: #f4f6f9; color: #6b7280; }
    .margin-chip.good { background: #e8f5e9; color: #2e7d32; }
    .margin-chip.low { background: #fdecea; color: #c62828; }

    /* Quick Sales banner */
    .qs-banner { display: flex; align-items: center; gap: 14px; background: #fff8f0; border: 1px solid #fed7aa; border-radius: 10px; padding: 14px 18px; }
    .qs-icon { color: #ea580c; font-size: 22px; width: 22px; height: 22px; flex-shrink: 0; }
    .qs-text { flex: 1; }
    .qs-label { font-size: 14px; font-weight: 700; color: #ea580c; display: block; }
    .qs-note { font-size: 11px; color: #9a3412; opacity: 0.8; }
    .qs-stats { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; }
    .qs-count { font-size: 12px; color: #6b7280; }
    .qs-total { font-size: 20px; font-weight: 800; color: #ea580c; }
    .info-row.qs-row { background: #fff8f0; }
    .qs-amount { color: #ea580c; font-weight: 700; }

    /* Rank rows */
    .rank-row { display: flex; align-items: center; gap: 14px; padding: 12px 16px; border-bottom: 1px solid #eef0f4; }
    .rank-row:last-child { border-bottom: none; }
    .rank-num { width: 32px; height: 32px; border-radius: 50%; background: #f4f6f9; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; color: #6b7280; flex-shrink: 0; }
    .rank-num.gold { background: #fff8e1; color: #c9a84c; }
    .rank-num.silver { background: #f5f5f5; color: #9e9e9e; }
    .rank-num.bronze { background: #fbe9e7; color: #bf360c; }
    .rank-info { flex: 1; }
    .rank-name { font-size: 13px; font-weight: 600; color: #1b3050; }
    .rank-cat { font-size: 11px; color: #6b7280; }
    .rank-stats { text-align: right; }
    .rank-qty { font-size: 14px; font-weight: 700; color: #1b3050; }
    .rank-rev { font-size: 11px; color: #6b7280; }

    /* Slow stock */
    .low-stock { color: #c62828; font-weight: 700; }
    .sold-chip { padding: 2px 8px; border-radius: 10px; font-size: 12px; font-weight: 600; background: #e8f5e9; color: #2e7d32; }
    .sold-chip.zero { background: #fdecea; color: #c62828; }

    @media (max-width: 768px) {
      .stat-grid, .stat-grid.four { grid-template-columns: repeat(2, 1fr); }
      .row-cards { grid-template-columns: 1fr; }
    }
  `]
})
export class DailyReportComponent implements OnInit {
  private reportService = inject(ReportService);

  // Daily
  dailyDate = new Date().toISOString().split('T')[0];
  daily: DailyReport | null = null;
  dailyLoading = false;

  // Range
  rangeFrom = this.monthStart();
  rangeTo = new Date().toISOString().split('T')[0];
  range: RangeReport | null = null;
  rangeLoading = false;

  // Products
  prodFrom = this.monthStart();
  prodTo = new Date().toISOString().split('T')[0];
  products: ProductStat[] = [];
  prodLoading = false;

  // Top
  topFrom = this.monthStart();
  topTo = new Date().toISOString().split('T')[0];
  topProducts: ProductStat[] = [];
  topLoading = false;

  // Slow stock
  slowDays = 30;
  slowStock: SlowStockItem[] = [];
  slowLoading = false;

  // Cash flow
  cfFrom = this.monthStart();
  cfTo = new Date().toISOString().split('T')[0];
  cashFlow: CashFlowDay[] = [];
  cfLoading = false;

  spCols = ['name', 'salesCount', 'totalAmount'];
  rangeCols = ['date', 'salesCount', 'revenue'];
  prodCols = ['productName', 'category', 'qtySold', 'revenue', 'profit', 'margin'];
  slowCols = ['productName', 'category', 'stockQuantity', 'qtySoldInPeriod'];
  cfCols = ['date', 'salesCount', 'cashRevenue', 'expenses', 'net'];

  get prodTotalRevenue() { return this.products.reduce((s, p) => s + p.revenue, 0); }
  get prodTotalProfit() { return this.products.reduce((s, p) => s + p.profit, 0); }
  get prodAvgMargin() {
    if (!this.products.length) return 0;
    return (this.prodTotalRevenue > 0 ? (this.prodTotalProfit / this.prodTotalRevenue) * 100 : 0).toFixed(1);
  }
  get cfTotalCashRev() { return this.cashFlow.reduce((s, d) => s + d.cashRevenue, 0); }
  get cfTotalExp() { return this.cashFlow.reduce((s, d) => s + d.expenses, 0); }
  get cfNet() { return this.cashFlow.reduce((s, d) => s + d.net, 0); }

  private readonly reasonLabels: Record<string, string> = {
    CHARITY: 'Charity', SHOP_EXPENSE: 'Shop Expense', TRANSPORT: 'Transport',
    CLEANING: 'Cleaning', FOOD: 'Food', SUPPLIER: 'Supplier Payment', OTHER: 'Other'
  };

  reasonLabel(key: string) { return this.reasonLabels[key] ?? key; }
  cashOutEntries(r: DailyReport): [string, number][] {
    return Object.entries(r.cashSummary?.cashOutByReason ?? {}).filter(([, v]) => v > 0);
  }

  private monthStart() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  }

  printPage() { window.print(); }

  ngOnInit() {
    this.loadDaily();
    this.loadSlowStock();
  }

  loadDaily() {
    this.dailyLoading = true;
    this.reportService.getDaily(this.dailyDate).subscribe({
      next: r => { this.daily = r; this.dailyLoading = false; },
      error: () => { this.dailyLoading = false; }
    });
  }

  loadRange() {
    this.rangeLoading = true;
    this.reportService.getRange(this.rangeFrom, this.rangeTo).subscribe({
      next: r => { this.range = r; this.rangeLoading = false; },
      error: () => { this.rangeLoading = false; }
    });
  }

  loadProducts() {
    this.prodLoading = true;
    this.reportService.getProducts(this.prodFrom, this.prodTo).subscribe({
      next: r => { this.products = r; this.prodLoading = false; },
      error: () => { this.prodLoading = false; }
    });
  }

  loadTop() {
    this.topLoading = true;
    this.reportService.getProducts(this.topFrom, this.topTo).subscribe({
      next: r => { this.topProducts = r; this.topLoading = false; },
      error: () => { this.topLoading = false; }
    });
  }

  loadSlowStock() {
    this.slowLoading = true;
    this.reportService.getSlowStock(this.slowDays).subscribe({
      next: r => { this.slowStock = r; this.slowLoading = false; },
      error: () => { this.slowLoading = false; }
    });
  }

  loadCashFlow() {
    this.cfLoading = true;
    this.reportService.getCashFlow(this.cfFrom, this.cfTo).subscribe({
      next: r => { this.cashFlow = r; this.cfLoading = false; },
      error: () => { this.cfLoading = false; }
    });
  }
}


