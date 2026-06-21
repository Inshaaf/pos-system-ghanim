import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSelectModule } from '@angular/material/select';
import { SalespersonService, CategoryService, TempWorkerService } from '../../core/services/product.service';
import { Salesperson, Category, TempWorker } from '../../core/models/product.model';
import { PrintService } from '../../core/services/print.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatButtonModule,
    MatIconModule, MatFormFieldModule, MatInputModule, MatSnackBarModule,
    MatProgressSpinnerModule, MatSlideToggleModule, MatSelectModule
  ],
  template: `
    <div class="page-container">
      <h1 class="page-title">Settings</h1>

      <!-- Salespersons -->
      <mat-card class="settings-card">
        <h3 class="section-title">Salespersons</h3>
        <div class="sp-list">
          @for (sp of salespersons; track sp.id) {
            <div class="sp-item">
              @if (editingSpId === sp.id) {
                <input class="add-input inline-edit" [(ngModel)]="editingSpName" (keydown.enter)="saveEdit(sp)" />
              } @else {
                <span class="sp-name">{{ sp.name }}</span>
              }
              <div class="sp-item-actions">
                <span class="sp-status" [class.active]="sp.active">{{ sp.active ? 'Active' : 'Inactive' }}</span>
                @if (editingSpId === sp.id) {
                  <button class="icon-action-btn save" (click)="saveEdit(sp)" title="Save">
                    <mat-icon>check</mat-icon>
                  </button>
                  <button class="icon-action-btn cancel" (click)="cancelEdit()" title="Cancel">
                    <mat-icon>close</mat-icon>
                  </button>
                } @else {
                  <button class="icon-action-btn edit" (click)="startEdit(sp)" title="Edit">
                    <mat-icon>edit</mat-icon>
                  </button>
                  @if (sp.active) {
                    <button class="icon-action-btn deactivate" (click)="deactivateSp(sp)" title="Deactivate">
                      <mat-icon>block</mat-icon>
                    </button>
                  } @else {
                    <button class="icon-action-btn activate" (click)="activateSp(sp)" title="Activate">
                      <mat-icon>check_circle</mat-icon>
                    </button>
                  }
                }
              </div>
            </div>
          }
        </div>
        <div class="add-row">
          <input class="add-input" [(ngModel)]="newSpName" placeholder="New salesperson name"
            (keydown.enter)="addSalesperson()" />
          <button mat-flat-button class="add-btn" (click)="addSalesperson()" [disabled]="!newSpName.trim()">
            <mat-icon>add</mat-icon> Add
          </button>
        </div>
      </mat-card>

      <!-- Day Salary Workers -->
      <mat-card class="settings-card">
        <h3 class="section-title">Day Salary Workers</h3>
        <div class="sp-list">
          @for (w of tempWorkers; track w.id) {
            <div class="sp-item">
              @if (editingTwId === w.id) {
                <input class="add-input inline-edit" [(ngModel)]="editingTwName" (keydown.enter)="saveTwEdit(w)" />
              } @else {
                <span class="sp-name">{{ w.name }}</span>
              }
              <div class="sp-item-actions">
                <span class="sp-status" [class.active]="w.active">{{ w.active ? 'Active' : 'Inactive' }}</span>
                @if (editingTwId === w.id) {
                  <button class="icon-action-btn save" (click)="saveTwEdit(w)" title="Save">
                    <mat-icon>check</mat-icon>
                  </button>
                  <button class="icon-action-btn cancel" (click)="cancelTwEdit()" title="Cancel">
                    <mat-icon>close</mat-icon>
                  </button>
                } @else {
                  <button class="icon-action-btn edit" (click)="startTwEdit(w)" title="Edit">
                    <mat-icon>edit</mat-icon>
                  </button>
                  @if (w.active) {
                    <button class="icon-action-btn deactivate" (click)="deactivateTw(w)" title="Deactivate">
                      <mat-icon>block</mat-icon>
                    </button>
                  } @else {
                    <button class="icon-action-btn activate" (click)="activateTw(w)" title="Activate">
                      <mat-icon>check_circle</mat-icon>
                    </button>
                  }
                }
              </div>
            </div>
          }
        </div>
        <div class="add-row">
          <input class="add-input" [(ngModel)]="newTwName" placeholder="New worker name"
            (keydown.enter)="addTempWorker()" />
          <button mat-flat-button class="add-btn" (click)="addTempWorker()" [disabled]="!newTwName.trim()">
            <mat-icon>add</mat-icon> Add
          </button>
        </div>
      </mat-card>

      <!-- Printer Settings -->
      <mat-card class="settings-card">
        <h3 class="section-title">Printer Settings</h3>

        <!-- QZ Tray status -->
        <div class="printer-status" [class.online]="printerConnected" [class.offline]="!printerConnected">
          <mat-icon>{{ printerConnected ? 'circle' : 'radio_button_unchecked' }}</mat-icon>
          <span>{{ printerConnected ? 'QZ Tray Connected' : 'QZ Tray Offline' }}</span>
          @if (!printerConnected) {
            <button mat-button class="retry-btn" (click)="connectPrinter()" [disabled]="connecting">
              @if (connecting) { <mat-spinner diameter="14" /> } @else { Retry }
            </button>
          }
        </div>

        <!-- Offline help message -->
        @if (!printerConnected) {
          <div class="offline-help">
            <mat-icon>info_outline</mat-icon>
            <span>
              QZ Tray not running. Install from
              <a href="https://qz.io" target="_blank" rel="noopener" class="qz-link">qz.io</a>
              or use Bluetooth printing instead.
            </span>
          </div>
        }

        <!-- Bluetooth -->
        <div class="bt-divider">
          <span class="bt-divider-line"></span>
          <span class="bt-divider-text">OR</span>
          <span class="bt-divider-line"></span>
        </div>

        <div class="bt-row">
          <button mat-stroked-button class="bt-btn" (click)="connectBluetooth()" [disabled]="btConnecting">
            @if (btConnecting) {
              <mat-spinner diameter="16" />
            } @else {
              <span class="bt-dot" [class.connected]="btConnected">â—</span>
            }
            {{ btConnected ? 'Bluetooth Connected' : 'Connect via Bluetooth' }}
          </button>
          @if (btConnected && btDeviceName) {
            <span class="bt-device-name">{{ btDeviceName }}</span>
            <button class="icon-action-btn deactivate" (click)="disconnectBluetooth()" title="Disconnect">
              <mat-icon>close</mat-icon>
            </button>
          }
        </div>
        @if (btConnected) {
          <div class="printer-status online" style="margin-top:8px; margin-bottom:0">
            <mat-icon>circle</mat-icon>
            <span>Bluetooth: {{ btDeviceName || 'Connected' }}</span>
          </div>
        }

        <!-- Printer name fields -->
        <div class="printer-fields">
          <div class="printer-field">
            <label class="field-label">Receipt Printer Name</label>
            <input class="add-input" [(ngModel)]="receiptPrinterName" placeholder="XP-T80Q" />
          </div>
          <div class="printer-field">
            <label class="field-label">Label Printer Name</label>
            <input class="add-input" [(ngModel)]="labelPrinterName" placeholder="XP-365B" />
          </div>
        </div>

        @if (availablePrinters.length) {
          <div class="printer-list">
            <p class="field-label" style="margin-bottom:6px">Available printers "” click to use as Receipt Printer:</p>
            @for (p of availablePrinters; track p) {
              <div class="printer-list-item" (click)="receiptPrinterName = p">
                <mat-icon>print</mat-icon> {{ p }}
              </div>
            }
          </div>
        }

        <div class="printer-actions">
          <button mat-flat-button class="add-btn" (click)="savePrinterConfig()">
            <mat-icon>save</mat-icon> Save
          </button>
          <button mat-stroked-button (click)="listPrinters()" [disabled]="!printerConnected">
            <mat-icon>list</mat-icon> List Printers
          </button>
          <button mat-stroked-button (click)="testReceipt()"
            [disabled]="testingReceipt || (!printerConnected && !btConnected)">
            @if (testingReceipt) { <mat-spinner diameter="16" /> } @else { <mat-icon>receipt</mat-icon> }
            Test Receipt
          </button>
          <button mat-stroked-button (click)="testLabel()"
            [disabled]="testingLabel || (!printerConnected && !btConnected)">
            @if (testingLabel) { <mat-spinner diameter="16" /> } @else { <mat-icon>label</mat-icon> }
            Test Label
          </button>
          <button mat-stroked-button (click)="testDrawer()"
            [disabled]="testingDrawer || (!printerConnected && !btConnected)">
            @if (testingDrawer) { <mat-spinner diameter="16" /> } @else { <mat-icon>lock_open</mat-icon> }
            Open Drawer
          </button>
        </div>
      </mat-card>

      <!-- Cashier Settings -->
      <mat-card class="settings-card">
        <h3 class="section-title">Cashier Settings</h3>

        <div class="cashier-row">
          <div class="cashier-row-label">
            <span class="cashier-label">Auto-print receipt after checkout</span>
            <span class="cashier-hint">When enabled, the receipt printer fires automatically on confirm. Disable if stock entry is still in progress.</span>
          </div>
          <mat-slide-toggle [(ngModel)]="autoPrintEnabled" color="primary"></mat-slide-toggle>
        </div>

        <div class="cashier-row" style="margin-top:16px">
          <div class="cashier-row-label">
            <span class="cashier-label">Receipt paper width</span>
            <span class="cashier-hint">Select the thermal paper roll size loaded in your receipt printer.</span>
          </div>
          <mat-select [(ngModel)]="paperWidth" class="paper-select">
            <mat-option value="80">80 mm</mat-option>
            <mat-option value="58">58 mm</mat-option>
          </mat-select>
        </div>

        <div class="printer-actions" style="margin-top:18px">
          <button mat-flat-button class="add-btn" (click)="saveCashierSettings()">
            <mat-icon>save</mat-icon> Save
          </button>
        </div>
      </mat-card>

      <!-- Categories -->
      <mat-card class="settings-card">
        <h3 class="section-title">Categories</h3>
        <div class="sp-list">
          @for (cat of categories; track cat.id) {
            <div class="sp-item"><span>{{ cat.name }}</span></div>
          }
        </div>
        <div class="add-row">
          <input class="add-input" [(ngModel)]="newCatName" placeholder="New category name"
            (keydown.enter)="addCategory()" />
          <button mat-flat-button class="add-btn" (click)="addCategory()" [disabled]="!newCatName.trim()">
            <mat-icon>add</mat-icon> Add
          </button>
        </div>
      </mat-card>
    </div>
  `,
  styles: [`
    .page-container { padding: 24px; max-width: 700px; }
    .page-title { font-size: 22px; font-weight: 700; color: #1b3050; margin-bottom: 20px; }
    .settings-card { margin-bottom: 20px; padding: 20px !important; }
    .section-title { font-size: 16px; font-weight: 700; color: #1b3050; margin-bottom: 14px; }

    /* Salesperson list */
    .sp-list { margin-bottom: 12px; }
    .sp-item {
      display: flex; justify-content: space-between; align-items: center;
      padding: 8px 0; border-bottom: 1px solid #eef0f4; font-size: 14px; color: #1b3050;
      gap: 8px;
    }
    .sp-name { flex: 1; }
    .sp-item-actions { display: flex; align-items: center; gap: 4px; flex-shrink: 0; }
    .sp-status { font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 10px; }
    .sp-status.active { background: #e8f5e9; color: #2e7d32; }
    .sp-status:not(.active) { background: #fdecea; color: #c62828; }
    .inline-edit { flex: 1; padding: 5px 8px !important; font-size: 13px !important; }

    .icon-action-btn {
      width: 28px; height: 28px; border: none; border-radius: 6px;
      cursor: pointer; display: flex; align-items: center; justify-content: center;
      background: transparent; transition: background 0.15s;
    }
    .icon-action-btn mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .icon-action-btn.edit { color: #6b7280; }
    .icon-action-btn.edit:hover { background: #f4f6f9; color: #1b3050; }
    .icon-action-btn.deactivate { color: #c62828; }
    .icon-action-btn.deactivate:hover { background: #fdecea; }
    .icon-action-btn.activate { color: #2e7d32; }
    .icon-action-btn.activate:hover { background: #e8f5e9; }
    .icon-action-btn.save { color: #2e7d32; }
    .icon-action-btn.save:hover { background: #e8f5e9; }
    .icon-action-btn.cancel { color: #6b7280; }
    .icon-action-btn.cancel:hover { background: #f4f6f9; }

    /* Add row */
    .add-row { display: flex; gap: 10px; align-items: center; margin-top: 10px; }
    .add-input {
      flex: 1; border: 1px solid #e2e6ec; border-radius: 6px; color: #1b3050;
      padding: 9px 12px; font-family: 'Inter', sans-serif; font-size: 14px;
      outline: none; transition: border-color 0.15s;
    }
    .add-input:focus { border-color: #c9a84c; }
    .add-input::placeholder { color: #6b7280; }
    .add-btn { background: #1b3050 !important; color: #fff !important; }

    /* Printer status */
    .printer-status {
      display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600;
      padding: 8px 12px; border-radius: 6px; margin-bottom: 12px;
    }
    .printer-status.online { background: #e8f5e9; color: #2e7d32; }
    .printer-status.offline { background: #fdecea; color: #c62828; }
    .retry-btn { margin-left: auto; font-size: 12px; }

    /* Offline help */
    .offline-help {
      display: flex; align-items: flex-start; gap: 8px;
      background: #fff8e1; border: 1px solid #ffe082; border-radius: 6px;
      padding: 10px 12px; font-size: 13px; color: #5d4037; margin-bottom: 14px;
    }
    .offline-help mat-icon { font-size: 18px; width: 18px; height: 18px; color: #f9a825; flex-shrink: 0; margin-top: 1px; }
    .qz-link { color: #1b3050; font-weight: 600; text-decoration: underline; }
    .qz-link:hover { color: #c9a84c; }

    /* Bluetooth divider */
    .bt-divider {
      display: flex; align-items: center; gap: 10px; margin: 12px 0;
    }
    .bt-divider-line { flex: 1; height: 1px; background: #e2e6ec; }
    .bt-divider-text { font-size: 11px; font-weight: 600; color: #6b7280; letter-spacing: 1px; }

    /* Bluetooth row */
    .bt-row { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
    .bt-btn { font-size: 13px !important; display: flex; align-items: center; gap: 6px; }
    .bt-dot { font-size: 16px; line-height: 1; color: #6b7280; }
    .bt-dot.connected { color: #1565c0; }
    .bt-device-name { font-size: 13px; font-weight: 600; color: #1565c0; }

    /* Printer fields */
    .printer-fields { display: flex; flex-direction: column; gap: 12px; margin-bottom: 16px; margin-top: 4px; }
    .printer-field { display: flex; flex-direction: column; gap: 4px; }
    .field-label { font-size: 12px; color: #6b7280; font-weight: 500; }
    .printer-actions { display: flex; gap: 8px; flex-wrap: wrap; }
    .printer-list { margin-bottom: 14px; }
    .printer-list-item {
      display: flex; align-items: center; gap: 8px; padding: 8px 10px;
      border: 1px solid #e2e6ec; border-radius: 6px; margin-bottom: 6px;
      cursor: pointer; font-size: 13px; color: #1b3050; transition: all 0.15s;
    }
    .printer-list-item:hover { border-color: #c9a84c; background: #fffbf0; }
    .printer-list-item mat-icon { font-size: 16px; width: 16px; height: 16px; color: #6b7280; }

    /* Cashier settings */
    .cashier-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
    .cashier-row-label { display: flex; flex-direction: column; gap: 3px; flex: 1; }
    .cashier-label { font-size: 14px; font-weight: 600; color: #1b3050; }
    .cashier-hint { font-size: 12px; color: #6b7280; }
    .paper-select { width: 110px; font-size: 14px; }
  `]
})
export class SettingsComponent implements OnInit {
  private spService = inject(SalespersonService);
  private twService = inject(TempWorkerService);
  private catService = inject(CategoryService);
  private printService = inject(PrintService);
  private snack = inject(MatSnackBar);

  salespersons: Salesperson[] = [];
  tempWorkers: TempWorker[] = [];
  categories: Category[] = [];
  newSpName = '';
  newTwName = '';
  newCatName = '';

  // Salesperson edit state
  editingSpId: number | null = null;
  editingSpName = '';

  // Day Salary Worker edit state
  editingTwId: number | null = null;
  editingTwName = '';

  // QZ Tray
  printerConnected = false;
  connecting = false;
  receiptPrinterName = '';
  labelPrinterName = '';
  testingReceipt = false;
  testingLabel = false;
  testingDrawer = false;

  availablePrinters: string[] = [];

  // Bluetooth
  btConnected = false;
  btConnecting = false;
  btDeviceName = '';
  private btCharacteristic: any = null;

  // Cashier settings
  autoPrintEnabled = true;
  paperWidth = '80';

  ngOnInit() {
    this.spService.getAll().subscribe(s => this.salespersons = s);
    this.twService.getAll().subscribe(w => this.tempWorkers = w);
    this.catService.getAll().subscribe(c => this.categories = c);
    this.printService.connected$.subscribe(v => this.printerConnected = v);
    const cfg = this.printService.getConfig();
    this.receiptPrinterName = cfg.receiptPrinterName;
    this.labelPrinterName = cfg.labelPrinterName;
    this.autoPrintEnabled = localStorage.getItem('pos_auto_print') !== 'false';
    this.paperWidth = localStorage.getItem('pos_paper_width') || '80';
  }

  // â”€â”€ Salesperson edit â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  startEdit(sp: Salesperson) {
    this.editingSpId = sp.id;
    this.editingSpName = sp.name;
  }

  cancelEdit() {
    this.editingSpId = null;
    this.editingSpName = '';
  }

  saveEdit(sp: Salesperson) {
    const name = this.editingSpName.trim();
    if (!name) return;
    this.spService.update(sp.id, name, sp.active).subscribe(() => {
      this.cancelEdit();
      this.spService.getAll().subscribe(s => this.salespersons = s);
      this.snack.open('Salesperson updated', '', { duration: 1500 });
    });
  }

  deactivateSp(sp: Salesperson) {
    const ref = this.snack.open(`Deactivate "${sp.name}"?`, 'Deactivate', { duration: 4000 });
    ref.onAction().subscribe(() => {
      this.spService.update(sp.id, sp.name, false).subscribe(() => {
        this.spService.getAll().subscribe(s => this.salespersons = s);
        this.snack.open('Salesperson deactivated', '', { duration: 1500 });
      });
    });
  }

  activateSp(sp: Salesperson) {
    this.spService.update(sp.id, sp.name, true).subscribe(() => {
      this.spService.getAll().subscribe(s => this.salespersons = s);
      this.snack.open('Salesperson activated', '', { duration: 1500 });
    });
  }

  addSalesperson() {
    const name = this.newSpName.trim();
    if (!name) return;
    this.spService.create(name).subscribe(() => {
      this.newSpName = '';
      this.spService.getAll().subscribe(s => this.salespersons = s);
      this.snack.open('Salesperson added', '', { duration: 1500 });
    });
  }

  // ── Day Salary Workers ────────────────────────────────────────────

  startTwEdit(w: TempWorker) { this.editingTwId = w.id; this.editingTwName = w.name; }
  cancelTwEdit() { this.editingTwId = null; this.editingTwName = ''; }

  saveTwEdit(w: TempWorker) {
    const name = this.editingTwName.trim();
    if (!name) return;
    this.twService.update(w.id, name, w.active).subscribe(() => {
      this.cancelTwEdit();
      this.twService.getAll().subscribe(ww => this.tempWorkers = ww);
      this.snack.open('Worker updated', '', { duration: 1500 });
    });
  }

  deactivateTw(w: TempWorker) {
    const ref = this.snack.open(`Deactivate “${w.name}”?`, 'Deactivate', { duration: 4000 });
    ref.onAction().subscribe(() => {
      this.twService.update(w.id, w.name, false).subscribe(() => {
        this.twService.getAll().subscribe(ww => this.tempWorkers = ww);
        this.snack.open('Worker deactivated', '', { duration: 1500 });
      });
    });
  }

  activateTw(w: TempWorker) {
    this.twService.update(w.id, w.name, true).subscribe(() => {
      this.twService.getAll().subscribe(ww => this.tempWorkers = ww);
      this.snack.open('Worker activated', '', { duration: 1500 });
    });
  }

  addTempWorker() {
    const name = this.newTwName.trim();
    if (!name) return;
    this.twService.create(name).subscribe(() => {
      this.newTwName = '';
      this.twService.getAll().subscribe(ww => this.tempWorkers = ww);
      this.snack.open('Worker added', '', { duration: 1500 });
    });
  }

  // â”€â”€ QZ Tray â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  async listPrinters() {
    try {
      this.availablePrinters = await this.printService.getPrinters();
    } catch {
      this.snack.open('Could not fetch printer list', 'OK', { duration: 3000 });
    }
  }

  async connectPrinter() {
    this.connecting = true;
    try {
      await this.printService.connect();
      this.snack.open('Printer connected', '', { duration: 2000 });
    } catch {
      this.snack.open('Could not connect to QZ Tray', 'OK', { duration: 4000 });
    } finally {
      this.connecting = false;
    }
  }

  savePrinterConfig() {
    this.printService.saveConfig({ receiptPrinterName: this.receiptPrinterName, labelPrinterName: this.labelPrinterName });
    this.snack.open('Printer config saved', '', { duration: 1500 });
  }

  async testReceipt() {
    this.testingReceipt = true;
    try { await this.printService.testReceipt(); this.snack.open('Test receipt sent', '', { duration: 2000 }); }
    catch { this.snack.open('Print failed', 'OK', { duration: 3000 }); }
    finally { this.testingReceipt = false; }
  }

  async testLabel() {
    this.testingLabel = true;
    try { await this.printService.testLabel(); this.snack.open('Test label sent', '', { duration: 2000 }); }
    catch { this.snack.open('Print failed', 'OK', { duration: 3000 }); }
    finally { this.testingLabel = false; }
  }

  async testDrawer() {
    this.testingDrawer = true;
    try { await this.printService.openDrawer(); this.snack.open('Drawer opened', '', { duration: 2000 }); }
    catch { this.snack.open('Drawer command failed', 'OK', { duration: 3000 }); }
    finally { this.testingDrawer = false; }
  }

  // â”€â”€ Bluetooth â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  async connectBluetooth() {
    if (!('bluetooth' in navigator)) {
      this.snack.open('Bluetooth not supported in this browser. Use Chrome.', 'OK', { duration: 4000 });
      return;
    }
    this.btConnecting = true;
    // Known BLE printer service UUIDs
    const knownServices = [
      '000018f0-0000-1000-8000-00805f9b34fb', // Xprinter BLE
      '0000ff00-0000-1000-8000-00805f9b34fb', // Generic BLE printer
      '0000ffe0-0000-1000-8000-00805f9b34fb', // HM-10 module
      'e7810a71-73ae-499d-8c15-faa9aef0c3f2', // Some Epson/Star
      '00001101-0000-1000-8000-00805f9b34fb', // SPP
    ];
    try {
      const device = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: knownServices
      });
      const server = await device.gatt.connect();

      // Enumerate all services "” log to console for diagnosis
      let foundChar: any = null;
      try {
        const services = await server.getPrimaryServices();
        console.log('=== BLE Printer Services ===');
        for (const svc of services) {
          console.log('Service:', svc.uuid);
          try {
            const chars = await svc.getCharacteristics();
            for (const ch of chars) {
              const p = ch.properties;
              console.log('  Char:', ch.uuid, '| write:', p.write, '| writeWithoutResponse:', p.writeWithoutResponse, '| notify:', p.notify, '| read:', p.read);
              if ((p.write || p.writeWithoutResponse) && !foundChar) {
                foundChar = ch;
                console.log('  ^^^ Using this characteristic for printing');
              }
            }
          } catch {}
        }
      } catch (e) {
        console.warn('Could not enumerate services:', e);
      }

      if (!foundChar) {
        this.snack.open('No writable characteristic found. Check console for details.', 'OK', { duration: 5000 });
        return;
      }

      this.btCharacteristic = foundChar;
      this.btConnected = true;
      this.btDeviceName = device.name || 'Bluetooth Printer';
      this.printService.setBtCharacteristic(this.btCharacteristic);
      device.addEventListener('gattserverdisconnected', () => {
        this.btConnected = false;
        this.btDeviceName = '';
        this.btCharacteristic = null;
        this.printService.setBtCharacteristic(null);
      });
      this.snack.open(`Connected to ${this.btDeviceName}`, '', { duration: 2000 });
    } catch (err: any) {
      if (err?.name !== 'NotFoundError') {
        this.snack.open('Bluetooth connection failed', 'OK', { duration: 3000 });
      }
    } finally {
      this.btConnecting = false;
    }
  }

  disconnectBluetooth() {
    this.btCharacteristic = null;
    this.btConnected = false;
    this.btDeviceName = '';
    this.printService.setBtCharacteristic(null);
    this.snack.open('Bluetooth disconnected', '', { duration: 1500 });
  }

  // ── Cashier Settings ─────────────────────────────────────────────

  saveCashierSettings() {
    localStorage.setItem('pos_auto_print', this.autoPrintEnabled ? 'true' : 'false');
    localStorage.setItem('pos_paper_width', this.paperWidth);
    this.snack.open('Cashier settings saved', '', { duration: 1500 });
  }

  //â”€â”€ Categories â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  addCategory() {
    const name = this.newCatName.trim();
    if (!name) return;
    this.catService.create(name).subscribe(() => {
      this.newCatName = '';
      this.catService.getAll().subscribe(c => this.categories = c);
      this.snack.open('Category added', '', { duration: 1500 });
    });
  }
}


