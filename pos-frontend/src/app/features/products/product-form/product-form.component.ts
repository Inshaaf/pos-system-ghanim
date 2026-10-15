import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
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
import { ProductService, SupplierService, AppSettingService } from '../../../core/services/product.service';
import { AuthService } from '../../../core/services/auth.service';
import { ProductEditRequestService } from '../../../core/services/product-edit-request.service';

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
    <h2 mat-dialog-title>{{ data.requestMode ? 'Request Product Changes' : (data.product ? 'Edit Product' : 'Add Product') }}</h2>
    <mat-dialog-content>
      @if (data.requestMode) {
        <p class="request-hint">Your proposed changes will be sent to the owner for approval. The product stays unchanged until approved.</p>
      }
      <form [formGroup]="form" class="product-form">
        <div class="form-row">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Name *</mat-label>
            <input matInput formControlName="name" />
          </mat-form-field>
        </div>
        <div class="form-row">
          <mat-form-field appearance="outline" floatLabel="always" class="full-width">
            <mat-label>Label Name</mat-label>
            <input matInput formControlName="labelName" placeholder="Short name for barcode label (optional)"
              style="text-transform:uppercase" (input)="toUpper('labelName', $event)" />
            <mat-hint>Printed on labels instead of the full product name</mat-hint>
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
              <mat-label>Online Price</mat-label>
              <input matInput type="number" formControlName="onlinePrice" />
            </mat-form-field>
          </div>
        }
        <div class="form-row" style="margin-bottom: 16px">
          <div class="shop-code-wrap">
            <mat-form-field appearance="outline" class="shop-code-field">
              <mat-label>Shop Code</mat-label>
              <input matInput formControlName="shopCode" placeholder="e.g. BAS"
                style="text-transform:uppercase" (input)="toUpper('shopCode', $event)" />
              <mat-hint>Encoded price — cost is decoded automatically on save</mat-hint>
            </mat-form-field>
            <button mat-icon-button type="button" class="decode-btn"
              matTooltip="Reveal cost price" (click)="toggleDecodedCost()">
              <mat-icon>{{ decodedCost !== null ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
          </div>
          @if (decodedCost !== null) {
            <div class="decoded-cost">Cost: LKR {{ decodedCost | number:'1.2-2' }}</div>
          }
          @if (decodeError) {
            <div class="decoded-cost error">{{ decodeError }}</div>
          }
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
            <mat-label>Initial Stock *</mat-label>
            <input matInput type="number" formControlName="initialStock" placeholder="0" />
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
            @if (!imageUploaded) {
              <div class="image-error">Upload an image under 200 KB before saving this product.</div>
            }
          }

          @if (imageMode === 'upload') {
            <label class="upload-area" for="product-image-file" [class.uploading]="uploading">
              <input id="product-image-file" class="file-input" type="file" accept="image/*"
                [disabled]="uploading" (change)="onFileSelected($event)" />
              @if (uploading) {
                <mat-spinner diameter="28"></mat-spinner>
                <span>{{ uploadStatus }}</span>
              } @else {
                <mat-icon>cloud_upload</mat-icon>
                <span>Choose image (must be under 200 KB)</span>
              }
            </label>
          }

          @if (fileError) { <div class="image-error" role="alert">{{ fileError }}</div> }

          @if (form.value.imageUrl) {
            <div class="img-preview-wrap">
              <img [src]="form.value.imageUrl" class="img-preview" alt="preview"
                (error)="previewError = true" [class.hidden]="previewError">
              @if (previewError) {
                <div class="img-broken"><mat-icon>broken_image</mat-icon> Preview unavailable</div>
              }
              <button mat-icon-button class="clear-img-btn" type="button"
                (click)="clearImage()" matTooltip="Remove image">
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
      <button mat-flat-button class="save-btn" (click)="save()" [disabled]="!canSave()">
        @if (loading) { <mat-spinner diameter="18" /> } @else { {{ data.requestMode ? 'SEND REQUEST' : 'SAVE' }} }
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    h2 { padding: 16px 24px 0; }
    mat-dialog-content { padding: 28px 24px 8px; max-height: 70vh; }
    .product-form { display: flex; flex-direction: column; gap: 0; }
    .request-hint { margin: 0 24px 12px; padding: 10px 12px; border-radius: 8px; background: #eef5ff; color: #345477; font-size: 13px; }
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
      position: relative;
      display: flex; align-items: center; justify-content: center; gap: 10px;
      border: 2px dashed #c8d0dc; border-radius: 8px; padding: 20px;
      cursor: pointer; color: #6b7280; font-size: 13px; transition: border-color .2s;
    }
    .upload-area:hover { border-color: #1b3050; color: #1b3050; }
    .upload-area.uploading { cursor: default; opacity: .7; }
    .upload-area mat-icon { font-size: 28px; width: 28px; height: 28px; }
    .file-input { position:absolute; inset:0; width:100%; height:100%; opacity:0; cursor:pointer; }
    .file-input:disabled { cursor:default; }
    .image-error { color:#b42318; font-size:12px; margin-top:-3px; }

    .img-preview-wrap { position: relative; display: inline-block; }
    .img-preview { width: 100%; max-height: 140px; object-fit: contain; border-radius: 8px; border: 1px solid #eef0f4; }
    .img-preview.hidden { display: none; }
    .img-broken { display: flex; align-items: center; gap: 6px; color: #aaa; font-size: 12px; padding: 12px; }
    .clear-img-btn { position: absolute; top: 4px; right: 4px; background: rgba(255,255,255,.9) !important; }
    .shop-code-wrap { display: flex; align-items: center; gap: 6px; }
    .shop-code-field { flex: 1; }
    .decode-btn { height: 56px; flex-shrink: 0; color: #1b3050 !important; }
    .decoded-cost { font-size: 13px; font-weight: 600; color: #2e7d32; padding: 4px 0 0 4px; }
    .decoded-cost.error { color: #c62828; font-weight: 400; }
  `]
})
export class ProductFormComponent implements OnInit {
  dialogRef = inject(MatDialogRef<ProductFormComponent>);
  data: any = inject(MAT_DIALOG_DATA);
  private fb = inject(FormBuilder);
  private productService = inject(ProductService);
  private supplierService = inject(SupplierService);
  private snack = inject(MatSnackBar);
  private productEditRequestService = inject(ProductEditRequestService);

  auth = inject(AuthService);
  private appSettingService = inject(AppSettingService);
  suppliers: any[] = [];
  p = this.data.product;
  loading = false;
  uploading = false;
  imageMode: 'url' | 'upload' = 'upload';
  imageUploaded = !!this.p?.imageUrl;
  fileError = '';
  uploadStatus = '';
  previewError = false;
  decodedCost: number | null = null;
  decodeError: string | null = null;
  private cipherKey: string | null = null;

  form = this.fb.group({
    name: [this.p?.name || '', Validators.required],
    description: [this.p?.description || ''],
    retailPrice: [this.p?.retailPrice || '', Validators.required],
    wholesalePrice: [this.p?.wholesalePrice || '', Validators.required],
    costPrice: [this.p?.costPrice || ''],
    onlinePrice: [this.p?.onlinePrice || ''],
    shopCode: [this.p?.shopCode || ''],
    labelName: [this.p?.labelName || ''],
    barcode: [this.p?.barcode || ''],
    unit: [this.p?.unit || 'piece'],
    categoryId: [this.p?.categoryId || null],
    supplierId: [this.p?.supplierId || null],
    productSource: [this.p?.productSource || 'SHOP_DIRECT'],
    fulfillmentSource: [this.p?.fulfillmentSource || 'SHOP'],
    minStockAlert: [this.p?.minStockAlert ?? 5],
    minWholesaleQty: [this.p?.minWholesaleQty || 1],
    showInPos: [this.p?.showInPos ?? true],
    showOnline: [this.p?.showOnline ?? true],
    imageUrl: [this.p?.imageUrl || '', Validators.required],
    initialStock: [null, this.p ? [] : Validators.required]
  });

  ngOnInit() {
    this.supplierService.getAll().subscribe(s => {
      this.suppliers = s;
      if (!this.p) {
        const generalStock = s.find((x: any) => x.name.toLowerCase().includes('general stock'));
        if (generalStock) this.form.patchValue({ supplierId: generalStock.id });
        this.generateBarcode();
      }
    });
    if (!this.p) {
      const plastic = (this.data.categories || []).find((c: any) => c.name.toLowerCase().includes('plastic'));
      if (plastic) this.form.patchValue({ categoryId: plastic.id });
    }
  }

  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    input.value = '';
    this.fileError = '';
    if (!file.type.startsWith('image/')) {
      this.fileError = 'Choose a valid image file.';
      return;
    }
    this.uploading = true;
    this.previewError = false;
    this.uploadStatus = 'Preparing image…';
    try {
      const uploadFile = file.size < 200 * 1024 ? file : await this.compressImage(file);
      this.uploadStatus = uploadFile === file
        ? 'Uploading to ImageKit…'
        : `Uploading compressed image (${Math.ceil(uploadFile.size / 1024)} KB)…`;
      this.productService.uploadImage(uploadFile).subscribe({
        next: url => {
          this.form.patchValue({ imageUrl: url });
          this.imageUploaded = true;
          this.uploading = false;
          this.uploadStatus = '';
        },
        error: err => {
          this.fileError = err.error?.message || 'Image upload failed. Check your connection and try again.';
          this.snack.open(this.fileError, 'OK', { duration: 4000 });
          this.uploading = false;
          this.uploadStatus = '';
        }
      });
    } catch (error) {
      this.fileError = error instanceof Error ? error.message : 'Could not prepare this image. Try another image.';
      this.snack.open(this.fileError, 'OK', { duration: 4500 });
      this.uploading = false;
      this.uploadStatus = '';
    }
  }

  private async compressImage(file: File): Promise<File> {
    const maxBytes = 200 * 1024;
    const source = await this.decodeImage(file);
    try {
      const sourceWidth = source.width;
      const sourceHeight = source.height;
      if (!sourceWidth || !sourceHeight) throw new Error('Could not read this image. Try another image.');

      let scale = Math.min(1, 1800 / Math.max(sourceWidth, sourceHeight));
      let compressed: Blob | null = null;
      for (let attempt = 0; attempt < 16; attempt++) {
        if (attempt > 0 && attempt % 4 === 0) scale *= 0.78;
        const quality = [0.86, 0.74, 0.62, 0.5][attempt % 4];
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(sourceWidth * scale));
        canvas.height = Math.max(1, Math.round(sourceHeight * scale));
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Image compression is unavailable in this browser.');
        // JPEG does not preserve transparency, so flatten transparent images on white.
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(source.image, 0, 0, canvas.width, canvas.height);
        compressed = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', quality));
        if (compressed && compressed.size < maxBytes) {
          const name = file.name.replace(/\.[^.]+$/, '') || 'product-image';
          return new File([compressed], `${name}.jpg`, { type: 'image/jpeg', lastModified: Date.now() });
        }
      }
      throw new Error('This image could not be compressed below 200 KB. Choose a smaller image.');
    } finally {
      source.close();
    }
  }

  private async decodeImage(file: File): Promise<{ image: CanvasImageSource; width: number; height: number; close: () => void }> {
    if (typeof createImageBitmap === 'function') {
      try {
        const bitmap = await createImageBitmap(file);
        return { image: bitmap, width: bitmap.width, height: bitmap.height, close: () => bitmap.close() };
      } catch { /* Fall back to an object URL for browsers with partial bitmap support. */ }
    }
    const url = URL.createObjectURL(file);
    try {
      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const element = new Image();
        element.onload = () => resolve(element);
        element.onerror = () => reject(new Error('This image format is not supported by the browser.'));
        element.src = url;
      });
      return {
        image,
        width: image.naturalWidth,
        height: image.naturalHeight,
        close: () => URL.revokeObjectURL(url)
      };
    } catch (error) {
      URL.revokeObjectURL(url);
      throw error;
    }
  }

  canSave(): boolean {
    return !this.loading && !this.uploading && this.imageUploaded
      && this.form.valid && !!this.form.value.imageUrl?.trim();
  }

  clearImage() {
    this.form.patchValue({ imageUrl: '' });
    this.imageUploaded = false;
    this.previewError = false;
  }

  generateBarcode() {
    const supplierId = this.form.value.supplierId;
    const supplier = this.suppliers.find((s: any) => s.id === supplierId);
    if (supplier?.code) {
      this.productService.nextBarcode(supplier.code).subscribe(bc => {
        this.form.patchValue({ barcode: bc });
      });
    } else {
      const ts = Date.now().toString().slice(-8);
      const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      this.form.patchValue({ barcode: ts + rand });
    }
  }

  toggleDecodedCost() {
    if (this.decodedCost !== null) { this.decodedCost = null; this.decodeError = null; return; }
    const code = (this.form.value.shopCode || '').trim().toUpperCase();
    if (!code) { this.decodeError = 'Enter a shop code first'; return; }
    const reveal = (key: string) => {
      const k = key.toUpperCase().replace(/[^A-Z]/g, '');
      const map: Record<string, string> = {};
      for (let i = 0; i < k.length && i < 10; i++) map[k[i]] = i < 9 ? String(i + 1) : '0';
      let digits = '';
      for (const c of code) {
        if (c === 'X') continue;
        if (map[c] === undefined) return null;
        digits += map[c];
      }
      return digits ? parseFloat(digits) : null;
    };
    if (this.cipherKey !== null) {
      const cost = reveal(this.cipherKey);
      cost !== null ? (this.decodedCost = cost) : (this.decodeError = 'Invalid code for current cipher');
    } else {
      this.appSettingService.getCipher().subscribe({
        next: key => {
          this.cipherKey = key || '';
          const cost = reveal(this.cipherKey);
          cost !== null ? (this.decodedCost = cost) : (this.decodeError = 'Invalid code for current cipher');
        },
        error: () => { this.decodeError = 'Could not load cipher'; }
      });
    }
  }

  toUpper(field: string, event: Event) {
    const input = event.target as HTMLInputElement;
    const upper = input.value.toUpperCase();
    const sel = input.selectionStart;
    input.value = upper;
    input.setSelectionRange(sel, sel);
    this.form.get(field)?.setValue(upper, { emitEvent: false });
  }

  save() {
    if (!this.canSave()) return;
    this.loading = true;
    const val = this.form.value;
    const obs: Observable<unknown> = this.data.requestMode
      ? this.productEditRequestService.submit(this.p.id, val as Record<string, unknown>)
      : this.p
        ? this.productService.update(this.p.id, val as any)
        : this.productService.create(val as any);

    obs.subscribe({
      next: () => {
        this.snack.open(this.data.requestMode ? 'Product edit request sent to owner' : 'Saved!', '', { duration: 2500 });
        this.dialogRef.close(true);
      },
      error: (err: any) => { this.loading = false; this.snack.open(err.error?.message || 'Error', 'OK', { duration: 3000 }); }
    });
  }
}


