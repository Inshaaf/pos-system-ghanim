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
  barcode: string;
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

        <div class="barcode-preview">
          @if (barcodeImg) {
            <img [src]="barcodeImg" alt="barcode" class="barcode-img" />
          } @else {
            <div class="no-barcode">No barcode</div>
          }
          <p class="barcode-value">{{ data.barcode }}</p>
        </div>

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
    .label-dialog { min-width: 340px; }
    h2 { color: #1b3050; font-weight: 700; padding: 16px 24px 0; }
    mat-dialog-content { padding: 12px 24px; }
    .product-name { font-weight: 600; font-size: 16px; color: #1b3050; margin: 0 0 16px; }
    .barcode-preview {
      background: #f8f8f8; border: 1px solid #eee; border-radius: 8px;
      padding: 16px; text-align: center; margin-bottom: 16px;
    }
    .barcode-img { max-width: 100%; height: 70px; object-fit: contain; }
    .no-barcode { color: #aaa; font-size: 13px; padding: 20px 0; }
    .barcode-value { font-family: monospace; font-size: 13px; color: #555; margin: 8px 0 0; }
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

  ngOnInit() {
    if (this.data.barcode) {
      this.barcodeImg = this.barcodeService.generateBarcode(this.data.barcode);
    }
  }

  async print() {
    this.printing = true;
    try {
      const label: LabelData = {
        barcode: this.data.barcode,
        productName: this.data.productName,
        retailPrice: this.data.retailPrice
      };
      await this.printService.printLabel(label, this.copies);
      this.snack.open(`Printed ${this.copies} label(s)`, '', { duration: 2000 });
      this.dialogRef.close(true);
    } catch {
      this.snack.open('Printer offline "” could not print label', 'OK', { duration: 4000 });
    } finally {
      this.printing = false;
    }
  }
}


