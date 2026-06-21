import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { ProductService, SupplierService } from '../../../core/services/product.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, MatDialogModule,
    MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatCheckboxModule, MatProgressSpinnerModule, MatSnackBarModule,
    MatTooltipModule, MatIconModule
  ],
  template: `
    <h2 mat-dialog-title>{{ data.product ? 'Edit Product' : 'Add Product' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="product-form">
        <div class="form-row">
          <mat-form-field appearance="outline" floatLabel="always" class="full-width">
            <mat-label>Name *</mat-label>
            <input matInput formControlName="name" placeholder="Enter product name" />
          </mat-form-field>
        </div>
        <div class="form-row two-col">
          <mat-form-field appearance="outline">
            <mat-label>Retail Price *</mat-label>
            <input matInput type="number" formControlName="retailPrice" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Wholesale Price *</mat-label>
            <input matInput type="number" formControlName="wholesalePrice" />
          </mat-form-field>
        </div>
        @if (auth.isOwner()) {
          <div class="form-row two-col">
            <mat-form-field appearance="outline">
              <mat-label>Cost Price</mat-label>
              <input matInput type="number" formControlName="costPrice" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Online Price</mat-label>
              <input matInput type="number" formControlName="onlinePrice" />
            </mat-form-field>
          </div>
        }
        <div class="form-row two-col" style="margin-bottom: 16px">
          <mat-form-field appearance="outline">
            <mat-label>Shop Code</mat-label>
            <input matInput formControlName="shopCode" placeholder="e.g. ES95" style="text-transform:uppercase" />
            <mat-hint>Internal code used in-store (optional)</mat-hint>
          </mat-form-field>
        </div>
        <div class="form-row two-col">
          <div class="barcode-wrap">
            <mat-form-field appearance="outline" class="barcode-field">
              <mat-label>Barcode</mat-label>
              <input matInput formControlName="barcode" />
            </mat-form-field>
            <button mat-stroked-button type="button" class="gen-btn" (click)="generateBarcode()" matTooltip="Generate random barcode">
              <mat-icon>casino</mat-icon>
            </button>
          </div>
        </div>
        <div class="form-row two-col">
          <mat-form-field appearance="outline">
            <mat-label>Category</mat-label>
            <mat-select formControlName="categoryId">
              <mat-option [value]="null">None</mat-option>
              @for (c of data.categories; track c.id) {
                <mat-option [value]="c.id">{{ c.name }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Supplier</mat-label>
            <mat-select formControlName="supplierId">
              <mat-option [value]="null">None</mat-option>
              @for (s of suppliers; track s.id) {
                <mat-option [value]="s.id">{{ s.name }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>
        <div class="form-row two-col">
          <mat-form-field appearance="outline">
            <mat-label>Product Source</mat-label>
            <mat-select formControlName="productSource">
              <mat-option value="SHOP_DIRECT">Shop Direct</mat-option>
              <mat-option value="STORE_PRODUCT">Store Product</mat-option>
              <mat-option value="BOTH">Both</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Min Stock Alert</mat-label>
            <input matInput type="number" formControlName="minStockAlert" />
          </mat-form-field>
        </div>
        @if (!data.product) {
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Initial Stock</mat-label>
            <input matInput type="number" formControlName="initialStock" />
          </mat-form-field>
        }
        <!-- Image section -->
        <div class="image-section">
          <div class="img-mode-toggle">
            <button type="button" mat-stroked-button [class.active-mode]="imageMode==='url'" (click)="imageMode='url'">
              <mat-icon>link</mat-icon> URL
            </button>
            <button type="button" mat-stroked-button [class.active-mode]="imageMode==='upload'" (click)="imageMode='upload'">
              <mat-icon>upload</mat-icon> Upload
            </button>
          </div>

          @if (imageMode === 'url') {
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Image URL</mat-label>
              <input matInput formControlName="imageUrl" placeholder="https://..." />
            </mat-form-field>
          }

          @if (imageMode === 'upload') {
            <div class="upload-area" (click)="fileInput.click()" [class.uploading]="uploading">
              @if (uploading) {
                <mat-spinner diameter="28"></mat-spinner>
                <span>Uploading to ImageKit…</span>
              } @else {
                <mat-icon>cloud_upload</mat-icon>
                <span>Click to choose image (max 5 MB)</span>
              }
            </div>
            <input #fileInput type="file" accept="image/*" style="display:none" (change)="onFileSelected($event)">
          }

          @if (form.value.imageUrl) {
            <div class="img-preview-wrap">
              <img [src]="form.value.imageUrl" class="img-preview" alt="preview"
                (error)="previewError = true" [class.hidden]="previewError">
              @if (previewError) {
                <div class="img-broken"><mat-icon>broken_image</mat-icon> Preview unavailable</div>
              }
              <button mat-icon-button class="clear-img-btn" type="button"
                (click)="form.patchValue({imageUrl:''}); previewError=false" matTooltip="Remove image">
                <mat-icon>close</mat-icon>
              </button>
            </div>
          }
        </div>
        <div class="checkboxes">
          <mat-checkbox formControlName="showInPos">Show in POS</mat-checkbox>
          <mat-checkbox formControlName="showOnline">Show Online</mat-checkbox>
        </div>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close()">CANCEL</button>
      <button mat-flat-button class="save-btn" (click)="save()" [disabled]="loading || form.invalid">
        @if (loading) { <mat-spinner diameter="18" /> } @else { SAVE }
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    h2 { padding: 16px 24px 0; }
    mat-dialog-content { padding: 8px 24px; max-height: 70vh; }
    .product-form { display: flex; flex-direction: column; gap: 0; }
    .form-row { margin-bottom: 4px; }
    .two-col { display: flex; gap: 12px; }
    .two-col mat-form-field { flex: 1; }
    .full-width { width: 100%; }
    .checkboxes { display: flex; gap: 24px; margin: 8px 0; }
    .save-btn { background: #1b3050 !important; color: #fff !important; }
    .barcode-wrap { display: flex; align-items: center; gap: 6px; flex: 1; }
    .barcode-field { flex: 1; }
    .gen-btn { height: 56px; flex-shrink: 0; color: #1b3050 !important; }

    .image-section { display: flex; flex-direction: column; gap: 8px; margin-bottom: 4px; }
    .img-mode-toggle { display: flex; gap: 8px; }
    .img-mode-toggle button { flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px; }
    .img-mode-toggle .active-mode { background: #1b3050 !important; color: #fff !important; }

    .upload-area {
      display: flex; align-items: center; justify-content: center; gap: 10px;
      border: 2px dashed #c8d0dc; border-radius: 8px; padding: 20px;
      cursor: pointer; color: #6b7280; font-size: 13px; transition: border-color .2s;
    }
    .upload-area:hover { border-color: #1b3050; color: #1b3050; }
    .upload-area.uploading { cursor: default; opacity: .7; }
    .upload-area mat-icon { font-size: 28px; width: 28px; height: 28px; }

    .img-preview-wrap { position: relative; display: inline-block; }
    .img-preview { width: 100%; max-height: 140px; object-fit: contain; border-radius: 8px; border: 1px solid #eef0f4; }
    .img-preview.hidden { display: none; }
    .img-broken { display: flex; align-items: center; gap: 6px; color: #aaa; font-size: 12px; padding: 12px; }
    .clear-img-btn { position: absolute; top: 4px; right: 4px; background: rgba(255,255,255,.9) !important; }
  `]
})
export class ProductFormComponent implements OnInit {
  dialogRef = inject(MatDialogRef<ProductFormComponent>);
  data: any = inject(MAT_DIALOG_DATA);
  private fb = inject(FormBuilder);
  private productService = inject(ProductService);
  private supplierService = inject(SupplierService);
  private snack = inject(MatSnackBar);

  auth = inject(AuthService);
  suppliers: any[] = [];
  loading = false;
  uploading = false;
  imageMode: 'url' | 'upload' = 'url';
  previewError = false;
  p = this.data.product;

  form = this.fb.group({
    name: [this.p?.name || '', Validators.required],
    retailPrice: [this.p?.retailPrice || '', Validators.required],
    wholesalePrice: [this.p?.wholesalePrice || '', Validators.required],
    costPrice: [this.p?.costPrice || ''],
    onlinePrice: [this.p?.onlinePrice || ''],
    shopCode: [this.p?.shopCode || ''],
    barcode: [this.p?.barcode || ''],
    unit: [this.p?.unit || 'piece'],
    categoryId: [this.p?.categoryId || null],
    supplierId: [this.p?.supplierId || null],
    productSource: [this.p?.productSource || 'SHOP_DIRECT'],
    fulfillmentSource: ['SHOP'],
    minStockAlert: [this.p?.minStockAlert ?? 5],
    minWholesaleQty: [this.p?.minWholesaleQty || 1],
    showInPos: [this.p?.showInPos ?? true],
    showOnline: [this.p?.showOnline ?? true],
    imageUrl: [this.p?.imageUrl || ''],
    initialStock: [0]
  });

  ngOnInit() {
    this.supplierService.getAll().subscribe(s => {
      this.suppliers = s;
      if (!this.p) {
        const generalStock = s.find((x: any) => x.name.toLowerCase().includes('general stock'));
        if (generalStock) this.form.patchValue({ supplierId: generalStock.id });
      }
    });
    if (!this.p) {
      this.generateBarcode();
      const plastic = (this.data.categories || []).find((c: any) => c.name.toLowerCase().includes('plastic'));
      if (plastic) this.form.patchValue({ categoryId: plastic.id });
    }
  }

  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.uploading = true;
    this.previewError = false;
    this.productService.uploadImage(file).subscribe({
      next: url => {
        this.form.patchValue({ imageUrl: url });
        this.uploading = false;
      },
      error: () => {
        this.snack.open('Upload failed. Check your ImageKit keys.', 'OK', { duration: 4000 });
        this.uploading = false;
      }
    });
  }

  generateBarcode() {
    const ts = Date.now().toString().slice(-8);
    const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.form.patchValue({ barcode: ts + rand });
  }

  save() {
    if (this.form.invalid) return;
    this.loading = true;
    const val = this.form.value;
    const obs = this.p
      ? this.productService.update(this.p.id, val as any)
      : this.productService.create(val as any);

    obs.subscribe({
      next: () => { this.snack.open('Saved!', '', { duration: 1500 }); this.dialogRef.close(true); },
      error: err => { this.loading = false; this.snack.open(err.error?.message || 'Error', 'OK', { duration: 3000 }); }
    });
  }
}


