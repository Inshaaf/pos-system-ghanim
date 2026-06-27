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
import { SalespersonService, CategoryService, TempWorkerService, AppSettingService } from '../../core/services/product.service';
import { Salesperson, Category, TempWorker } from '../../core/models/product.model';
import { PrintService } from '../../core/services/print.service';
import { AuthService } from '../../core/services/auth.service';
import { UserService, AppUser } from '../../core/services/user.service';

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

      <!-- Salespersons (owner only) -->
      @if (auth.isOwner()) {
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
      } <!-- end @if (auth.isOwner()) — salespersons + workers -->

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
          <div class="printer-field">
            <label class="field-label">Barcode Label Layout</label>
            <div class="version-toggle">
              <button type="button" class="ver-btn" [class.active]="labelVersion === 1" (click)="labelVersion = 1">
                <mat-icon>crop_free</mat-icon>
                <span>Version 1</span>
                <span class="ver-hint">Standard (~67% width)</span>
              </button>
              <button type="button" class="ver-btn" [class.active]="labelVersion === 2" (click)="labelVersion = 2">
                <mat-icon>view_column</mat-icon>
                <span>Version 2</span>
                <span class="ver-hint">Max width (fills label)</span>
              </button>
              <button type="button" class="ver-btn" [class.active]="labelVersion === 3" (click)="labelVersion = 3">
                <mat-icon>grid_view</mat-icon>
                <span>Version 3</span>
                <span class="ver-hint">4-up (small items)</span>
              </button>
              <button type="button" class="ver-btn" [class.active]="labelVersion === 4" (click)="labelVersion = 4">
                <mat-icon>horizontal_split</mat-icon>
                <span>Version 4</span>
                <span class="ver-hint">2-Up (top + bottom)</span>
              </button>
            </div>
            @if (labelVersion === 4) {
              <div class="two-up-config">
                <div class="two-up-row">
                  <span class="two-up-label">Top half</span>
                  <div class="mini-ver-toggle">
                    <button type="button" class="mini-ver-btn" [class.active]="labelTopVersion === 1" (click)="labelTopVersion = 1">V1</button>
                    <button type="button" class="mini-ver-btn" [class.active]="labelTopVersion === 2" (click)="labelTopVersion = 2">V2</button>
                    <button type="button" class="mini-ver-btn" [class.active]="labelTopVersion === 3" (click)="labelTopVersion = 3">V3</button>
                  </div>
                </div>
                <div class="two-up-row">
                  <span class="two-up-label">Bottom half</span>
                  <div class="mini-ver-toggle">
                    <button type="button" class="mini-ver-btn" [class.active]="labelBottomVersion === 1" (click)="labelBottomVersion = 1">V1</button>
                    <button type="button" class="mini-ver-btn" [class.active]="labelBottomVersion === 2" (click)="labelBottomVersion = 2">V2</button>
                    <button type="button" class="mini-ver-btn" [class.active]="labelBottomVersion === 3" (click)="labelBottomVersion = 3">V3</button>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>

        <div class="field-group" style="margin-top:18px;margin-bottom:18px">
          <p class="field-label">Receipt Footer</p>
          <div style="display:flex;flex-direction:column;gap:6px">
            <mat-slide-toggle [(ngModel)]="showQrCode">Show QR Code on receipt</mat-slide-toggle>
            <span class="ver-hint" style="padding-left:4px">{{ showQrCode ? 'QR code prints above the website link' : 'Text only — ORDER ONLINE / website link / Visit Us Again' }}</span>
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

      <!-- Shop Code Cipher (owner only) -->
      @if (auth.isOwner()) {
      <mat-card class="settings-card">
        <h3 class="section-title">Shop Code Cipher</h3>
        <p class="cat-hint">10-letter key used to encode cost prices in product shop codes. Keep this secret.</p>
        <div class="add-row" style="margin-top:8px">
          <div style="position:relative; flex:1">
            <input class="add-input" [(ngModel)]="cipherKey" placeholder="e.g. AAAAAAAAAA"
              [type]="cipherVisible ? 'text' : 'password'"
              maxlength="10" style="text-transform:uppercase; letter-spacing:2px; font-weight:600; padding-right:40px; width:100%"
              (input)="cipherKey = cipherKey.toUpperCase()" />
            <button mat-icon-button type="button" (click)="cipherVisible = !cipherVisible"
              style="position:absolute; right:2px; top:50%; transform:translateY(-50%); color:#6b7280">
              <mat-icon>{{ cipherVisible ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
          </div>
          <button mat-flat-button class="add-btn" (click)="saveCipher()" [disabled]="cipherKey.length !== 10 || savingCipher">
            @if (savingCipher) { <mat-spinner diameter="16" /> } @else { <mat-icon>save</mat-icon> Save }
          </button>
        </div>
        <p class="cat-hint" style="margin-top:8px">Must be exactly 10 unique letters. Position 1–9 = digits 1–9, position 10 = 0.</p>
      </mat-card>
      }

      <!-- Categories (owner only) -->
      @if (auth.isOwner()) {
      <mat-card class="settings-card">
        <h3 class="section-title">Categories</h3>
        <p class="cat-hint">Set the ecommerce slug for each category so products sync to the online store correctly.</p>
        <div class="sp-list">
          @for (cat of categories; track cat.id) {
            <div class="cat-item">
              <span class="sp-name">{{ cat.name }}</span>
              @if (editingSlugId === cat.id) {
                <input class="add-input slug-input" [(ngModel)]="editingSlug"
                  placeholder="e.g. plastic" (keydown.enter)="saveSlug(cat)" />
                <button class="icon-action-btn save" (click)="saveSlug(cat)" title="Save">
                  <mat-icon>check</mat-icon>
                </button>
                <button class="icon-action-btn cancel" (click)="cancelSlugEdit()" title="Cancel">
                  <mat-icon>close</mat-icon>
                </button>
              } @else {
                @if (cat.ecommerceSlug) {
                  <span class="slug-chip linked">{{ cat.ecommerceSlug }}</span>
                } @else {
                  <span class="slug-chip unlinked">no slug</span>
                }
                <button class="icon-action-btn edit" (click)="startSlugEdit(cat)" title="Set slug">
                  <mat-icon>edit</mat-icon>
                </button>
              }
            </div>
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
      } <!-- end @if (auth.isOwner()) — categories -->

      <!-- User Account Passwords (owner only) -->
      @if (auth.isOwner()) {
      <mat-card class="settings-card">
        <h3 class="section-title">User Accounts</h3>
        <p class="cat-hint">Change the username or password for any system user.</p>

        @for (u of appUsers; track u.id) {
          <div class="user-pw-row">
            <div class="user-pw-info">
              <div class="user-pw-avatar" [class.owner]="u.role === 'OWNER'">
                {{ u.name.charAt(0).toUpperCase() }}
              </div>
              <div class="user-pw-details">
                <div class="user-pw-name">{{ u.name }}</div>
                <div class="user-pw-role">
                  {{ roleDisplayName(u.role) }}
                  @if (u.id === currentUserId) { <span class="you-badge">You</span> }
                </div>
                <div class="user-pw-username">&#64;{{ u.username }}</div>
              </div>
              @if (pwChangingId !== u.id && unChangingId !== u.id) {
                <div class="user-pw-btns">
                  <button mat-stroked-button class="change-un-btn" (click)="startUnChange(u)">
                    <mat-icon>badge</mat-icon> Username
                  </button>
                  <button mat-stroked-button class="change-pw-btn" (click)="startPwChange(u)">
                    <mat-icon>lock_reset</mat-icon> Password
                  </button>
                </div>
              }
            </div>

            @if (unChangingId === u.id) {
              <div class="pw-form">
                <div class="pw-form-label">New username for {{ u.name }}</div>
                <input class="add-input" type="text" [(ngModel)]="unNew"
                  placeholder="New username (lowercase, no spaces)"
                  (input)="unNew = unNew.toLowerCase().replace(' ', '')" />
                @if (unError) { <div class="pw-error">{{ unError }}</div> }
                <div class="pw-actions">
                  <button mat-flat-button class="add-btn" (click)="saveUsername(u)" [disabled]="unSaving">
                    @if (unSaving) { <mat-spinner diameter="16" /> } @else { <mat-icon>check</mat-icon> }
                    Save Username
                  </button>
                  <button mat-stroked-button (click)="cancelUnChange()">Cancel</button>
                </div>
              </div>
            }

            @if (pwChangingId === u.id) {
              <div class="pw-form">
                <div class="pw-form-label">New password for {{ u.name }}</div>
                @if (u.id === currentUserId) {
                  <input class="add-input" type="password" [(ngModel)]="pwCurrent"
                    placeholder="Current password" />
                }
                <input class="add-input" type="password" [(ngModel)]="pwNew"
                  placeholder="New password (min 6 chars)" />
                <input class="add-input" type="password" [(ngModel)]="pwConfirm"
                  placeholder="Confirm new password" />
                @if (pwError) { <div class="pw-error">{{ pwError }}</div> }
                <div class="pw-actions">
                  <button mat-flat-button class="add-btn" (click)="savePassword(u)" [disabled]="pwSaving">
                    @if (pwSaving) { <mat-spinner diameter="16" /> } @else { <mat-icon>check</mat-icon> }
                    Save Password
                  </button>
                  <button mat-stroked-button (click)="cancelPwChange()">Cancel</button>
                </div>
              </div>
            }
          </div>
        }
      </mat-card>
      }

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

    /* 2-Up config */
    .two-up-config { margin-top: 10px; background: #f8faff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; display: flex; flex-direction: column; gap: 8px; }
    .two-up-row { display: flex; align-items: center; justify-content: space-between; }
    .two-up-label { font-size: 12px; font-weight: 600; color: #6b7280; width: 80px; }
    .mini-ver-toggle { display: flex; gap: 6px; }
    .mini-ver-btn { border: 1px solid #ddd; border-radius: 6px; padding: 4px 12px; background: #fff; cursor: pointer; font-size: 12px; font-weight: 700; color: #6b7280; font-family: inherit; transition: all 0.12s; }
    .mini-ver-btn.active { background: #1b3050; color: #fff; border-color: #1b3050; }

    /* Barcode version toggle */
    .version-toggle { display: flex; gap: 8px; flex-wrap: wrap; }
    .ver-btn {
      flex: 1; display: flex; flex-direction: column; align-items: center; gap: 2px;
      padding: 10px 8px; border: 2px solid #e2e6ec; border-radius: 8px; background: #fff;
      cursor: pointer; transition: all 0.15s; color: #6b7280;
    }
    .ver-btn mat-icon { font-size: 20px; width: 20px; height: 20px; }
    .ver-btn span:nth-child(2) { font-size: 13px; font-weight: 600; color: #1b3050; }
    .ver-hint { font-size: 11px; color: #6b7280; }
    .ver-btn.active { border-color: #1b3050; background: #f0f4f8; color: #1b3050; }
    .ver-btn.active .ver-hint { color: #1b3050; }
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

    /* Category slug */
    .cat-hint { font-size: 12px; color: #6b7280; margin: -6px 0 12px; }
    .cat-item {
      display: flex; align-items: center; gap: 8px;
      padding: 8px 0; border-bottom: 1px solid #eef0f4;
    }
    .slug-input { max-width: 160px; flex: none !important; }
    .slug-chip {
      font-size: 11px; font-weight: 600; padding: 2px 10px;
      border-radius: 10px; white-space: nowrap;
    }
    .slug-chip.linked { background: #e3f2fd; color: #1565c0; }
    .slug-chip.unlinked { background: #f4f6f9; color: #9ca3af; font-style: italic; }

    /* User passwords */
    .user-pw-row {
      border-bottom: 1px solid #eef0f4; padding: 12px 0;
    }
    .user-pw-row:last-child { border-bottom: none; }
    .user-pw-info { display: flex; align-items: center; gap: 12px; }
    .user-pw-avatar {
      width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0;
      background: #1b3050; color: #fff;
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 15px;
    }
    .user-pw-avatar.owner { background: #c9a84c; color: #1b3050; }
    .user-pw-details { flex: 1; }
    .user-pw-name { font-weight: 600; font-size: 14px; color: #1b3050; }
    .user-pw-role { font-size: 12px; color: #6b7280; display: flex; align-items: center; gap: 6px; }
    .user-pw-username { font-size: 11px; color: #9ca3af; margin-top: 2px; font-family: monospace; }
    .you-badge {
      font-size: 10px; font-weight: 700; background: #e3f2fd; color: #1565c0;
      padding: 1px 6px; border-radius: 8px;
    }
    .user-pw-btns { display: flex; gap: 6px; flex-shrink: 0; flex-wrap: wrap; }
    .change-pw-btn, .change-un-btn { font-size: 12px !important; }
    .change-un-btn { color: #1b3050 !important; }
    .pw-form {
      display: flex; flex-direction: column; gap: 10px;
      margin-top: 14px; padding: 14px; background: #f8faff;
      border: 1px solid #e2e8f0; border-radius: 8px;
    }
    .pw-form-label { font-size: 12px; font-weight: 600; color: #374151; }
    .pw-actions { display: flex; gap: 8px; margin-top: 4px; }
    .pw-error { font-size: 12px; color: #c62828; padding: 4px 0; }

    @media (max-width: 767px) {
      .page-container { padding: 12px; max-width: 100%; }
      .page-header { flex-direction: column; gap: 8px; }
      .settings-card { padding: 16px !important; }
      .sp-item { flex-wrap: wrap; gap: 8px; }
      .printer-field { flex-direction: column; }
      .user-pw-info { flex-wrap: wrap; }
      .user-pw-btns { width: 100%; }
      .change-pw-btn, .change-un-btn { flex: 1; }
    }
  `]
})
export class SettingsComponent implements OnInit {
  private spService = inject(SalespersonService);
  private twService = inject(TempWorkerService);
  private catService = inject(CategoryService);
  private printService = inject(PrintService);
  private appSettingService = inject(AppSettingService);
  private userService = inject(UserService);
  private snack = inject(MatSnackBar);
  auth = inject(AuthService);

  salespersons: Salesperson[] = [];
  tempWorkers: TempWorker[] = [];
  categories: Category[] = [];
  newSpName = '';
  newTwName = '';
  newCatName = '';

  // Salesperson edit state
  editingSpId: number | null = null;
  editingSpName = '';

  // Category slug edit state
  editingSlugId: number | null = null;
  editingSlug = '';

  // Day Salary Worker edit state
  editingTwId: number | null = null;
  editingTwName = '';

  // QZ Tray
  printerConnected = false;
  connecting = false;
  receiptPrinterName = '';
  labelPrinterName = '';
  labelVersion: 1 | 2 | 3 | 4 = 2;
  labelTopVersion: 1 | 2 | 3 = 2;
  labelBottomVersion: 1 | 2 | 3 = 1;
  showQrCode = false;
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

  // Shop code cipher
  cipherKey = '';
  cipherVisible = false;
  savingCipher = false;

  // User account management
  appUsers: AppUser[] = [];
  currentUserId: number | null = null;

  // Password change
  pwChangingId: number | null = null;
  pwCurrent = '';
  pwNew = '';
  pwConfirm = '';
  pwError = '';
  pwSaving = false;

  // Username change
  unChangingId: number | null = null;
  unNew = '';
  unError = '';
  unSaving = false;

  ngOnInit() {
    this.spService.getAll().subscribe(s => this.salespersons = s);
    this.twService.getAll().subscribe(w => this.tempWorkers = w);
    this.catService.getAll().subscribe(c => this.categories = c);
    this.printService.connected$.subscribe(v => this.printerConnected = v);
    const cfg = this.printService.getConfig();
    this.receiptPrinterName = cfg.receiptPrinterName;
    this.labelPrinterName = cfg.labelPrinterName;
    this.labelVersion = (cfg.labelVersion ?? 2) as 1 | 2 | 3 | 4;
    this.labelTopVersion = (cfg.labelTopVersion ?? 2) as 1 | 2 | 3;
    this.labelBottomVersion = (cfg.labelBottomVersion ?? 1) as 1 | 2 | 3;
    this.showQrCode = cfg.showQrCode ?? false;
    this.autoPrintEnabled = localStorage.getItem('pos_auto_print') !== 'false';
    this.paperWidth = localStorage.getItem('pos_paper_width') || '80';
    if (this.auth.isOwner()) {
      this.appSettingService.getCipher().subscribe(v => this.cipherKey = v || '');
      this.userService.getAll().subscribe(users => {
        this.appUsers = users;
        this.currentUserId = this.auth.currentUser()?.userId ?? null;
      });
    }
  }

  roleDisplayName(role: string): string {
    const map: Record<string, string> = {
      OWNER: 'Owner', CASHIER: 'Cashier',
      SALESPERSON: 'Salesperson', STORE_PERSON: 'Store Person'
    };
    return map[role] ?? role;
  }

  startUnChange(u: AppUser) {
    this.unChangingId = u.id;
    this.unNew = u.username;
    this.unError = '';
    this.pwChangingId = null;
  }

  cancelUnChange() {
    this.unChangingId = null;
    this.unError = '';
  }

  saveUsername(u: AppUser) {
    this.unError = '';
    if (!this.unNew.trim()) { this.unError = 'Username cannot be empty.'; return; }
    if (this.unNew.trim() === u.username) { this.cancelUnChange(); return; }
    this.unSaving = true;
    this.userService.changeUsername(u.id, this.unNew.trim()).subscribe({
      next: updated => {
        this.unSaving = false;
        this.unChangingId = null;
        this.appUsers = this.appUsers.map(x => x.id === updated.id ? { ...x, username: updated.username } : x);
        this.snack.open(`Username updated to @${updated.username}`, '', { duration: 3000 });
      },
      error: (err) => {
        this.unSaving = false;
        this.unError = err?.error?.message || err?.error?.data || 'Failed to update username';
      }
    });
  }

  startPwChange(u: AppUser) {
    this.pwChangingId = u.id;
    this.pwCurrent = '';
    this.pwNew = '';
    this.pwConfirm = '';
    this.pwError = '';
    this.unChangingId = null;
  }

  cancelPwChange() {
    this.pwChangingId = null;
    this.pwError = '';
  }

  savePassword(u: AppUser) {
    this.pwError = '';
    if (u.id === this.currentUserId && !this.pwCurrent) {
      this.pwError = 'Please enter your current password.'; return;
    }
    if (!this.pwNew || this.pwNew.length < 6) {
      this.pwError = 'New password must be at least 6 characters.'; return;
    }
    if (this.pwNew !== this.pwConfirm) {
      this.pwError = 'Passwords do not match.'; return;
    }
    this.pwSaving = true;
    const current = u.id === this.currentUserId ? this.pwCurrent : null;
    this.userService.changePassword(u.id, current, this.pwNew).subscribe({
      next: () => {
        this.pwSaving = false;
        this.pwChangingId = null;
        this.snack.open(`Password updated for ${u.name}`, '', { duration: 3000 });
      },
      error: (err) => {
        this.pwSaving = false;
        const msg = err?.error?.message || err?.error?.data || 'Failed to update password';
        this.pwError = msg;
      }
    });
  }

  saveCipher() {
    this.savingCipher = true;
    this.appSettingService.setCipher(this.cipherKey).subscribe({
      next: () => { this.snack.open('Cipher saved', '', { duration: 2000 }); this.savingCipher = false; },
      error: () => { this.snack.open('Failed to save cipher', 'OK', { duration: 3000 }); this.savingCipher = false; }
    });
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
    this.printService.saveConfig({ receiptPrinterName: this.receiptPrinterName, labelPrinterName: this.labelPrinterName, labelVersion: this.labelVersion, showQrCode: this.showQrCode, labelTopVersion: this.labelTopVersion, labelBottomVersion: this.labelBottomVersion });
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

  startSlugEdit(cat: Category) {
    this.editingSlugId = cat.id;
    this.editingSlug = cat.ecommerceSlug || '';
  }

  cancelSlugEdit() {
    this.editingSlugId = null;
    this.editingSlug = '';
  }

  saveSlug(cat: Category) {
    this.catService.updateSlug(cat.id, this.editingSlug.trim()).subscribe(updated => {
      cat.ecommerceSlug = updated.ecommerceSlug;
      this.cancelSlugEdit();
      this.snack.open('Slug saved', '', { duration: 1500 });
    });
  }
}


