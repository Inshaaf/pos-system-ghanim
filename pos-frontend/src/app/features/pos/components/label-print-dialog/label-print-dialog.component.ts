import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PrintService } from '../../../../core/services/print.service';
import { BarcodeService } from '../../../../core/services/barcode.service';
import { LabelData } from '../../../../core/models/print.model';

export interface LabelPrintDialogData {
  productName: string;
  labelName?: string;
  barcode: string;
  shopCode?: string;
  retailPrice: number;
}

@Component({
  selector: 'app-label-print-dialog',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatDialogModule, MatButtonModule,
    MatIconModule, MatProgressSpinnerModule, MatSnackBarModule
  ],
  template: `
    <div class="label-dialog">
      <h2 mat-dialog-title>PRINT LABEL</h2>
      <mat-dialog-content>
        <p class="product-name">{{ data.productName }}</p>

        <!-- Layout toggle -->
        <div class="layout-row">
          <span class="detail-label">Layout</span>
          <div class="layout-toggle">
            <button class="layout-btn" [class.active]="!twoUp" (click)="twoUp = false">
              <span class="layout-icon single-icon"></span>
              Single
            </button>
            <button class="layout-btn" [class.active]="twoUp" (click)="twoUp = true">
              <span class="layout-icon two-icon"></span>
              2-Up
            </button>
          </div>
        </div>

        <!-- Single barcode preview -->
        @if (!twoUp) {
          <div class="single-ver-row">
            <button class="ver-pill" [class.active]="singleVersion === 1" (click)="singleVersion = 1">
              V1 <span class="ver-sub">Narrow</span>
            </button>
            <button class="ver-pill" [class.active]="singleVersion === 2" (click)="singleVersion = 2">
              V2 <span class="ver-sub">Wide</span>
            </button>
          </div>
          <div class="barcode-preview">
            @if (barcodeImg) {
              <img [src]="barcodeImg" alt="barcode" class="barcode-img" />
            } @else {
              <div class="no-barcode">No barcode</div>
            }
            <p class="barcode-value">{{ data.barcode }}</p>
          </div>
        }

        <!-- 2-Up version selectors -->
        @if (twoUp) {
          <div class="two-up-preview">
            <div class="half-cell top-cell">
              <div class="half-label">TOP</div>
              <div class="ver-pills">
                <button class="ver-pill" [class.active]="topVersion === 1" (click)="topVersion = 1">V1</button>
                <button class="ver-pill" [class.active]="topVersion === 2" (click)="topVersion = 2">V2</button>
                <button class="ver-pill" [class.active]="topVersion === 3" (click)="topVersion = 3">V3</button>
              </div>
              <div class="ver-desc">{{ versionLabel(topVersion) }}</div>
              @if (barcodeImg) {
                <img [src]="barcodeImg" alt="barcode" class="half-barcode-img" />
              }
            </div>
            <div class="cut-line">
              <span class="scissors">✂</span>
              <div class="dashed"></div>
            </div>
            <div class="half-cell bottom-cell">
              <div class="half-label">BOTTOM</div>
              <div class="ver-pills">
                <button class="ver-pill" [class.active]="bottomVersion === 1" (click)="bottomVersion = 1">V1</button>
                <button class="ver-pill" [class.active]="bottomVersion === 2" (click)="bottomVersion = 2">V2</button>
                <button class="ver-pill" [class.active]="bottomVersion === 3" (click)="bottomVersion = 3">V3</button>
              </div>
              <div class="ver-desc">{{ versionLabel(bottomVersion) }}</div>
              @if (barcodeImg) {
                <img [src]="barcodeImg" alt="barcode" class="half-barcode-img" />
              }
            </div>
          </div>
        }

        <div class="detail-row">
          <span class="detail-label">Price</span>
          <span class="detail-value">LKR {{ data.retailPrice | number:'1.0-0' }}</span>
        </div>

        <div class="copies-row">
          <span class="detail-label">Copies</span>
          <div class="qty-control">
            <button class="qty-btn" (click)="copies = copies > 1 ? copies - 1 : 1">
              <mat-icon>remove</mat-icon>
            </button>
            <span class="qty-val">{{ copies }}</span>
            <button class="qty-btn" (click)="copies = copies + 1">
              <mat-icon>add</mat-icon>
            </button>
          </div>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button (click)="dialogRef.close()">CANCEL</button>
        <button mat-flat-button class="print-btn" (click)="print()" [disabled]="printing || !data.barcode">
          @if (printing) { <mat-spinner diameter="18" /> }
          @else { <mat-icon>print</mat-icon> }
          PRINT LABELS
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .label-dialog { min-width: 360px; }
    h2 { color: #1b3050; font-weight: 700; padding: 16px 24px 0; }
    mat-dialog-content { padding: 12px 24px; }
    .product-name { font-weight: 600; font-size: 16px; color: #1b3050; margin: 0 0 14px; }

    /* Layout toggle */
    .layout-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0 12px; border-top: 1px solid #f0f0f0; }
    .layout-toggle { display: flex; gap: 6px; }
    .layout-btn {
      display: flex; align-items: center; gap: 6px;
      border: 1px solid #ddd; border-radius: 8px; padding: 6px 14px;
      background: #fff; cursor: pointer; font-size: 13px; font-weight: 600;
      color: #6b7280; font-family: inherit; transition: all 0.15s;
    }
    .layout-btn.active { background: #1b3050; color: #fff; border-color: #1b3050; }
    .layout-icon { display: inline-block; width: 18px; height: 18px; border: 2px solid currentColor; border-radius: 2px; flex-shrink: 0; }
    .two-icon { background: linear-gradient(to bottom, currentColor 48%, transparent 48%, transparent 52%, currentColor 52%); }

    /* Single version picker */
    .single-ver-row { display: flex; gap: 8px; margin-bottom: 10px; }
    .single-ver-row .ver-pill { flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 7px 0; font-size: 13px; font-weight: 700; }
    .ver-sub { font-size: 11px; font-weight: 400; color: inherit; opacity: 0.75; }

    /* Single barcode preview */
    .barcode-preview {
      background: #f8f8f8; border: 1px solid #eee; border-radius: 8px;
      padding: 16px; text-align: center; margin-bottom: 12px;
    }
    .barcode-img { max-width: 100%; height: 70px; object-fit: contain; }
    .no-barcode { color: #aaa; font-size: 13px; padding: 20px 0; }
    .barcode-value { font-family: monospace; font-size: 13px; color: #555; margin: 8px 0 0; }

    /* 2-Up preview */
    .two-up-preview {
      border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden;
      margin-bottom: 12px; background: #f8f8f8;
    }
    .half-cell {
      padding: 10px 14px; display: flex; align-items: center; gap: 10px;
    }
    .top-cell { background: #f0f7ff; }
    .bottom-cell { background: #fdf6ff; }
    .half-label {
      font-size: 9px; font-weight: 800; color: #9ca3af;
      text-transform: uppercase; letter-spacing: 1px; min-width: 36px;
    }
    .ver-pills { display: flex; gap: 4px; }
    .ver-pill {
      border: 1px solid #ddd; border-radius: 6px; padding: 3px 9px;
      background: #fff; cursor: pointer; font-size: 12px; font-weight: 700;
      color: #6b7280; font-family: inherit; transition: all 0.12s;
    }
    .ver-pill.active { background: #1b3050; color: #fff; border-color: #1b3050; }
    .ver-desc { font-size: 11px; color: #6b7280; flex: 1; }
    .half-barcode-img { height: 32px; object-fit: contain; opacity: 0.7; }
    .cut-line {
      display: flex; align-items: center; gap: 6px;
      padding: 0 10px; height: 16px; background: #fff; border-top: 1px dashed #d1d5db; border-bottom: 1px dashed #d1d5db;
    }
    .scissors { font-size: 12px; color: #9ca3af; }
    .dashed { flex: 1; }

    /* Common rows */
    .detail-row, .copies-row {
      display: flex; justify-content: space-between; align-items: center;
      padding: 10px 0; border-top: 1px solid #f0f0f0;
    }
    .detail-label { font-size: 13px; color: #777; }
    .detail-value { font-weight: 600; font-size: 14px; }
    .qty-control { display: flex; align-items: center; gap: 12px; }
    .qty-btn {
      width: 32px; height: 32px; border: 1px solid #ddd; border-radius: 6px;
      background: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center;
    }
    .qty-btn:hover { background: #f0f0f0; }
    .qty-val { font-weight: 700; font-size: 16px; min-width: 24px; text-align: center; }
    .print-btn { background: #1b3050 !important; color: #fff !important; min-width: 140px; }
    mat-dialog-actions { padding: 12px 24px 16px; }
  `]
})
export class LabelPrintDialogComponent implements OnInit {
  dialogRef = inject(MatDialogRef<LabelPrintDialogComponent>);
  data: LabelPrintDialogData = inject(MAT_DIALOG_DATA);
  private printService = inject(PrintService);
  private barcodeService = inject(BarcodeService);
  private snack = inject(MatSnackBar);

  copies = 1;
  printing = false;
  barcodeImg = '';
  twoUp = false;
  singleVersion: 1|2 = 2;
  topVersion: 1|2|3 = 2;
  bottomVersion: 1|2|3 = 1;

  ngOnInit() {
    if (this.data.barcode) {
      this.barcodeImg = this.barcodeService.generateBarcode(this.data.barcode);
    }
    const cfg = this.printService.getConfig();
    if (cfg.labelVersion === 4) {
      this.twoUp = true;
      this.topVersion = cfg.labelTopVersion ?? 2;
      this.bottomVersion = cfg.labelBottomVersion ?? 1;
    } else if (cfg.labelVersion === 1 || cfg.labelVersion === 2) {
      this.singleVersion = cfg.labelVersion;
    }
  }

  versionLabel(v: 1|2|3): string {
    if (v === 1) return 'Narrow barcode';
    if (v === 2) return 'Wide barcode';
    return 'Compact (short barcode)';
  }

  async print() {
    this.printing = true;
    try {
      const label: LabelData = {
        barcode: this.data.barcode,
        productName: this.data.productName,
        labelName: this.data.labelName,
        shopCode: this.data.shopCode,
        retailPrice: this.data.retailPrice
      };
      if (this.twoUp) {
        await this.printService.printLabelTwoUp(label, this.topVersion, this.bottomVersion, this.copies);
      } else {
        await this.printService.printLabelSingle(label, this.singleVersion, this.copies);
      }
      this.snack.open(`Printed ${this.copies} label(s)`, '', { duration: 2000 });
      this.dialogRef.close(true);
    } catch {
      this.snack.open('Printer offline — could not print label', 'OK', { duration: 4000 });
    } finally {
      this.printing = false;
    }
  }
}
