import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { SaleReceiptData, LabelData, PrinterConfig } from '../models/print.model';

// qz-tray has no proper TS types — use dynamic import
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare let require: any;

// ── QZ Tray certificate signing ───────────────────────────────────────────────
// To stop QZ Tray prompting "Allow/Block" on every print:
//
//  1. Generate a self-signed cert (run once in PowerShell / Git Bash):
//     openssl req -x509 -newkey rsa:2048 -keyout private-key.pem \
//       -out certificate.pem -days 3650 -nodes -subj "/CN=Ghanim POS"
//
//  2. Paste the full contents of certificate.pem into QZ_CERTIFICATE below.
//  3. Paste the full contents of private-key.pem into QZ_PRIVATE_KEY below.
//  4. In QZ Tray tray icon → right-click → Site Manager (or Trusted Sites):
//     paste the certificate.pem content and save. Do this once on each PC.
//
//  After step 4, QZ Tray trusts the cert permanently — no more popups.

const QZ_CERTIFICATE = `-----BEGIN CERTIFICATE-----
MIIECzCCAvOgAwIBAgIGAZ7HatA4MA0GCSqGSIb3DQEBCwUAMIGiMQswCQYDVQQG
EwJVUzELMAkGA1UECAwCTlkxEjAQBgNVBAcMCUNhbmFzdG90YTEbMBkGA1UECgwS
UVogSW5kdXN0cmllcywgTExDMRswGQYDVQQLDBJRWiBJbmR1c3RyaWVzLCBMTEMx
HDAaBgkqhkiG9w0BCQEWDXN1cHBvcnRAcXouaW8xGjAYBgNVBAMMEVFaIFRyYXkg
RGVtbyBDZXJ0MB4XDTI2MDYxMzE4MzUyNloXDTQ2MDYxMzE4MzUyNlowgaIxCzAJ
BgNVBAYTAlVTMQswCQYDVQQIDAJOWTESMBAGA1UEBwwJQ2FuYXN0b3RhMRswGQYD
VQQKDBJRWiBJbmR1c3RyaWVzLCBMTEMxGzAZBgNVBAsMElFaIEluZHVzdHJpZXMs
IExMQzEcMBoGCSqGSIb3DQEJARYNc3VwcG9ydEBxei5pbzEaMBgGA1UEAwwRUVog
VHJheSBEZW1vIENlcnQwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQCb
rYOvpG6xEUtPzzTIpfghTvqzVxNZYIw1xS1KmMcFlascgYOyOrALaUbQF26ehP5J
IS7aCltUmkqSq5KCmvwVcRhvBR5AnnWU2kehdIfkd/8jqGR8mNLJzBoeVNRBR29I
faaNl6d7ZgrzI9DKMZXG1Rkn6wcO7iti1VgWKLqlaxu/6LxAFtcoCgJ0xX32DO51
PIKotZJOQdzTBzlyhfstvSzPyoEJcckmHai/rY7MQJSs3LukRAyaV09wkEmcVim8
hZulc/fIdCQQ4WbjJacTWodEWtf1dGeSNM3MkoM+fFfy8kzSupky7Fdh/k8xKZWm
E/OkaouGEIRiYibtf0cDAgMBAAGjRTBDMBIGA1UdEwEB/wQIMAYBAf8CAQEwDgYD
VR0PAQH/BAQDAgEGMB0GA1UdDgQWBBQFpsvRgr3EgSfYh7ibzSsFWTb3NzANBgkq
hkiG9w0BAQsFAAOCAQEAMSTWZHAvfh+jNR8GsTg8CPWra7xwJcC2m6l0v5Nl60HU
JY3gv4cqQncHqTc5r7n1Il+un8F6PuIXkbedynpk/bLMn8FTRrpvY//yFeTfu+SA
HxNnxPl8/Sl18JLpYUvrMuLzBwz+oIoPel6VxJJfsJjo+0KAyBmrUlSMFrJ8ZD6Q
RFnX7Axn3KLAXgxv9OGtmB8SwuwYlpSMtjAZgjxV+AwkhTRpMIVizyA26AZ+cTXp
chv10fV4OQ1UrbIjOtsJsWQ/y+Vadk8eJ6/7BgYTttMdU+3aScyMV2yU5YSf/Zll
uFqw843mQHcPrRvlHtkNVORxCX6A0hPiUEmEvMZNSQ==
-----END CERTIFICATE-----`;

const QZ_PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCbrYOvpG6xEUtP
zzTIpfghTvqzVxNZYIw1xS1KmMcFlascgYOyOrALaUbQF26ehP5JIS7aCltUmkqS
q5KCmvwVcRhvBR5AnnWU2kehdIfkd/8jqGR8mNLJzBoeVNRBR29IfaaNl6d7Zgrz
I9DKMZXG1Rkn6wcO7iti1VgWKLqlaxu/6LxAFtcoCgJ0xX32DO51PIKotZJOQdzT
BzlyhfstvSzPyoEJcckmHai/rY7MQJSs3LukRAyaV09wkEmcVim8hZulc/fIdCQQ
4WbjJacTWodEWtf1dGeSNM3MkoM+fFfy8kzSupky7Fdh/k8xKZWmE/OkaouGEIRi
Yibtf0cDAgMBAAECggEAC71D5uTRbAzPzw7i/hZ15Z0dDpUMYnsDV7KsvalTqLom
kxm5IqGGUPX5XwvFTbLdsgoMjGinhnO0F+dUPwEM7Vj/7K9IHrtURotHR4eQD8x0
su2p1jN4AbugZJUlBF8spxzCiH7dJFMHlFopDnY6wymiof35JEkVgHhyEgm0OXEC
FK/VPIZGJPKb7RxPlzPrRexCUT30B7I5hRIL0bNa+c+F7uMUrdvUtV4VddAu1s5i
+ac5DhES7di7SF0MJoPi2piZVkFSD9MTil/s4j/qe71fuE5SHrtfVBO9D2zzoEBP
CyuZyFFiZ8+vKikj0Fk+53Z9ApDvFFXewarP1MEe4QKBgQDVCY5lOHsjIK89ZNTM
FOUaJOzftCuS89inNDIol/TZs6P83ft9+hnw0ceIBj9IjqiUEZjIK16UWt7Qmx6S
w08L+60BWChQF4GUEIdy2TSSLY5KuA0TovLq8jeGKL/kRIsl0ggP4b5dDBuoPb1m
Sn+jPcsOv7ACbVSrFNkR1sRyCwKBgQC7Eqqio/f6T6EseKtZUz8ddvqRKVyoWIhv
J+uAV6gy7N0CBxkcFTjWtp0NWyvveYQEv56Q4VH+KEgODu0TzRyYL4Vp+rDbiVAL
UOCsi2cLzGw5xHQuWyGMZqRvJ8+P5ErzlIBOw9uqof4352xsgHUmEWTyGZGHD/tn
XWiuVppR6QKBgB7vtVLzocYXH/uNYe2E90QVqqRNuKotaP/W75W/g1n94Ul+PuAr
aorzG8OgDJ6PwOFHsOUYjzKCA6tNa2IqpJb75EK2t5vx3epPgCvoaN71aJ1nHtcE
Kbx+khuUXVFbts02M9+Ci69da8LBvHhXRzPAbHVm1rtzfwEdFOynQH3DAoGAQkz0
Ut4gFgPA0J0XxXm+hbfUSDxLjZKLEDIqwfrPLvVJwt03Jf/TfC2ObdxhLud3RaOQ
FDL3N0eZefoKRhlMyBcXhp8FrVj2GHyalCx34fOaa8LXllJQCo2aO5b1dj7n3XpF
GyVJJilxiuinQbEpU8uYZkFvlVmxtUmivx8MZHkCgYEAtmkuVdP/UFVQkMv39LCL
08WdJvcgky6QVenVFW1MepaujXo7dobVvXmR2D2f1mVaLoLoieHmgZ7rNofkWXUD
WptgtWNaai3QPgYg74llz//ljAcfEanItZo0k8Kf1bJE92IZJ0RuU7DZM6+bAEW+
7BZ49YCILcDnFxRRJYfwwvU=
-----END PRIVATE KEY-----`;

@Injectable({ providedIn: 'root' })
export class PrintService {

  private _connected = new BehaviorSubject<boolean>(false);
  readonly connected$ = this._connected.asObservable();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private qz: any = null;

  private config: PrinterConfig = {
    receiptPrinterName: 'XP-T80Q',
    labelPrinterName: 'XP-365B'
  };

  constructor() {
    this.loadConfig();
  }

  // ── Config ────────────────────────────────────────

  private loadConfig(): void {
    const saved = localStorage.getItem('pos_printer_config');
    if (saved) {
      try { this.config = JSON.parse(saved); } catch { /* ignore */ }
    }
  }

  saveConfig(cfg: PrinterConfig): void {
    this.config = cfg;
    localStorage.setItem('pos_printer_config', JSON.stringify(cfg));
  }

  getConfig(): PrinterConfig { return { ...this.config }; }

  // ── QZ Tray connection ────────────────────────────

  async connect(): Promise<void> {
    try {
      const qzModule = await import('qz-tray' as any);
      this.qz = qzModule.default ?? qzModule;

      this.qz.security.setCertificatePromise((resolve: any) => resolve(QZ_CERTIFICATE));
      this.qz.security.setSignatureAlgorithm('SHA512');
      this.qz.security.setSignaturePromise((toSign: any) => (resolve: any, reject: any) =>
        this.signData(toSign).then(resolve).catch(reject)
      );

      if (this.qz.websocket.isActive()) {
        this._connected.next(true);
        return;
      }

      await this.qz.websocket.connect({ host: 'localhost', port: { secure: [8181], insecure: [8182] } });
      this._connected.next(true);
    } catch (err) {
      this._connected.next(false);
      console.warn('QZ Tray connection failed:', err);
      throw new Error('QZ Tray not running. Please start QZ Tray on this computer.');
    }
  }

  private async signData(toSign: string): Promise<string> {
    const pemBody = QZ_PRIVATE_KEY
      .replace(/-----BEGIN PRIVATE KEY-----/, '')
      .replace(/-----END PRIVATE KEY-----/, '')
      .replace(/\s+/g, '');
    const binaryDer = Uint8Array.from(atob(pemBody), c => c.charCodeAt(0));
    const key = await crypto.subtle.importKey(
      'pkcs8', binaryDer.buffer,
      { name: 'RSASSA-PKCS1-v1_5', hash: { name: 'SHA-512' } },
      false, ['sign']
    );
    const signature = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(toSign)
    );
    return btoa(String.fromCharCode(...new Uint8Array(signature)));
  }

  async disconnect(): Promise<void> {
    try {
      if (this.qz?.websocket.isActive()) {
        await this.qz.websocket.disconnect();
      }
    } catch { /* ignore */ }
    this._connected.next(false);
  }

  isConnected(): boolean { return this._connected.getValue(); }

  private async ensureConnected(): Promise<void> {
    if (this.btCharacteristic) return; // Bluetooth available — skip QZ Tray
    if (!this.qz || !this.qz.websocket.isActive()) {
      await this.connect();
    }
  }

  // ── Printer list ──────────────────────────────────

  async getPrinters(): Promise<string[]> {
    await this.ensureConnected();
    const result = await this.qz.printers.find();
    return Array.isArray(result) ? result : [result];
  }

  // ── Receipt printing (ESC/POS → XP-T80Q) ─────────

  async printReceipt(sale: SaleReceiptData): Promise<void> {
    await this.ensureConnected();

    const ESC      = '\x1B';
    const GS       = '\x1D';
    const INIT     = `${ESC}\x40`;
    const LEFT     = `${ESC}\x61\x00`;
    const BOLD_ON  = `${ESC}\x45\x01`;
    const BOLD_OFF = `${ESC}\x45\x00`;
    const BIG      = `${GS}\x21\x11`;
    const NORMAL   = `${GS}\x21\x00`;
    const FEED5    = `${ESC}\x64\x05`;
    const CUT      = `${GS}\x56\x00`;

    const W    = 44;
    const SEP  = '='.repeat(W) + '\n';
    const DASH = '-'.repeat(W) + '\n';

    // Plain number (no LKR prefix)
    const fmtN = (n: number): string =>
      n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    // LKR with number right-aligned in 10-char field
    const fmtLKR = (n: number): string => `LKR ${fmtN(n).padStart(10)}`;

    // True center padding; for BIG text each char takes 2 visual columns
    const hdr = (text: string, big = false): string => {
      const visual = big ? text.length * 2 : text.length;
      const pad = Math.max(0, Math.floor((W - visual) / 2));
      return ' '.repeat(pad) + text + '\n';
    };

    // Body is indented 4 spaces; BW is the usable width inside that indent
    const I  = '    ';
    const BW = W - I.length; // 40

    // Left label + right-aligned value within the indented body width
    const col = (label: string, value: string): string => {
      const gap = Math.max(1, BW - label.length - value.length);
      return I + label + ' '.repeat(gap) + value + '\n';
    };

    const date    = new Date(sale.date);
    const dateStr = date.toLocaleDateString('en-GB');
    const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    let receipt = INIT + LEFT;

    // ── Header ───────────────────────────────────────
    receipt += BOLD_ON + BIG;
    receipt += hdr('GHANIM ENTERPRISES', true);
    receipt += NORMAL + BOLD_OFF;
    receipt += hdr('No. 84, Lower Street, Badulla');
    receipt += hdr('055 222 9046');
    receipt += SEP;

    // ── Transaction info ──────────────────────────────
    receipt += col('Date:', `${dateStr}  ${timeStr}`);
    receipt += col('Sale #:', String(sale.saleId));
    receipt += col('By:', sale.salespersonName);
    receipt += col('Type:', sale.saleType);
    if (sale.customerName) receipt += col('Customer:', sale.customerName);
    receipt += SEP;

    // ── Items column header ───────────────────────────
    const TW = 10; // total amount column width
    const QW = 3;  // qty column
    const NW = BW - QW - 2 - TW; // name column
    receipt += I + `${'Qty'.padStart(QW)}  ${'Description'.padEnd(NW)}${'Total'.padStart(TW)}\n`;
    receipt += DASH;

    // ── Items ─────────────────────────────────────────
    let totalQty = 0;
    for (const item of sale.items) {
      totalQty += item.quantity;
      const qtyStr    = String(item.quantity).padStart(QW);
      const totalStr  = fmtN(item.subtotal).padStart(TW);
      const nameTrunc = item.name.length > NW ? item.name.substring(0, NW) : item.name;
      const nameGap   = NW - nameTrunc.length;
      receipt += I + `${qtyStr}  ${nameTrunc}${' '.repeat(nameGap)}${totalStr}\n`;

      receipt += I + `       ${item.quantity} *   ${fmtN(item.unitPrice)}\n`;

      if (item.discount > 0) {
        receipt += I + `       Disc: -${fmtN(item.discount)}\n`;
      }
    }
    receipt += SEP;

    // ── Summary ───────────────────────────────────────
    receipt += col('Items:', String(totalQty));
    const netSubtotal = sale.subtotal - sale.itemDiscount;
    receipt += col('Subtotal:', fmtN(netSubtotal));
    if (sale.cartDiscount > 0) {
      receipt += col('Bill Discount:', `-${fmtN(sale.cartDiscount)}`);
    }
    receipt += SEP;

    // ── Total ─────────────────────────────────────────
    receipt += BOLD_ON + col('TOTAL:', fmtLKR(sale.total)) + BOLD_OFF;
    receipt += SEP;

    // ── Payment ───────────────────────────────────────
    if (sale.paymentMethod === 'CASH' && sale.cashTendered != null) {
      receipt += col('Cash:', fmtLKR(sale.cashTendered));
      receipt += col('Change:', fmtLKR(sale.changeAmount ?? 0));
    } else {
      receipt += col('Payment:', sale.paymentMethod);
    }
    receipt += SEP;

    // ── Footer ────────────────────────────────────────
    receipt += hdr('Thank you! Come again');
    receipt += '\n';
    receipt += hdr('Shop online | Fast Delivery');
    receipt += hdr('055 222 9046');
    receipt += hdr('WhatsApp: 071 902 5444');
    receipt += hdr('www.ghanimenterprises.lk');
    receipt += SEP;

    receipt += FEED5;
    receipt += CUT;

    if (sale.paymentMethod === 'CASH') {
      receipt += this.drawerCommand();
    }

    await this.rawPrint(this.config.receiptPrinterName, receipt);
  }

  // ── Label printing (TSPL → XP-365B) ──────────────

  async printLabel(label: LabelData, copies: number = 1): Promise<void> {
    await this.ensureConnected();

    // 38×25 mm at 203 DPI = 304×200 dots
    const W = 304;

    // Display name: prefer labelName, else truncate to 30 chars
    const displayName = (label.labelName || label.productName).substring(0, 30);

    // Code-128 (auto) — avoids 128C compatibility issues on XP-365B
    // modules ≈ (dataLen + 3) × 11 + 2
    const modules = (label.barcode.length + 3) * 11 + 2;
    // Scale narrow bar to ~88% of label width (narrow=1 for 12-char, narrow=2 for ≤9-char)
    const narrow = Math.max(1, Math.floor((W * 0.88) / modules));
    const barcodeWidth = modules * narrow;
    const barcodeX = Math.max(0, Math.floor((W - barcodeWidth) / 2));

    // Helper: center text — Font 1 = 8 dots/char at 1×, 16 dots/char at 2×
    const cx = (len: number, mag = 1) => Math.max(0, Math.floor((W - len * 8 * mag) / 2));

    const storeName   = 'GHANIM ENTERPRISES';
    const footerLabel = 'shop online:';
    const footerUrl   = 'www.ghanimenterprises.lk';
    const priceStr    = `Rs ${label.retailPrice.toLocaleString()}`;

    // Bold = double-print with 1-dot x-offset (TSPL has no native bold for Font 1)
    const bold = (x: number, y: number, text: string) => [
      `TEXT ${x},${y},"1",0,1,1,"${text}"`,
      `TEXT ${x + 1},${y},"1",0,1,1,"${text}"`
    ];

    // Layout — Y=5 → Y=180 (~87.5% of 200-dot height)
    // Y=5:   store name     BOLD (1×1, h=12)           → ends Y=17
    // Y=22:  barcode bars        (h=65, readable=0)    → ends Y=87
    // Y=91:  barcode number      (1×1, h=12)            → ends Y=103
    // Y=113: product name        (1×1, h=12, centered)  → ends Y=125
    // Y=134: price "Rs …"        (2×wide 1×tall, h=12)  → ends Y=146
    // Y=153: "shop online:" BOLD (1×1, h=12)            → ends Y=165
    // Y=168: URL             BOLD(1×1, h=12)             → ends Y=180
    const tspl = [
      'SIZE 38 mm, 25 mm',
      'GAP 3 mm, 0 mm',
      'DENSITY 8',
      'SPEED 4',
      'CLS',
      ...bold(cx(storeName.length), 5, storeName),
      `BARCODE ${barcodeX},22,"128",65,0,0,${narrow},${narrow},"${label.barcode}"`,
      `TEXT ${cx(label.barcode.length)},91,"1",0,1,1,"${label.barcode}"`,
      `TEXT ${cx(displayName.length)},113,"1",0,1,1,"${displayName}"`,
      `TEXT ${cx(priceStr.length, 2)},134,"1",0,2,1,"${priceStr}"`,
      ...bold(cx(footerLabel.length), 153, footerLabel),
      ...bold(cx(footerUrl.length), 168, footerUrl),
      `PRINT ${copies}`,
      ''
    ].join('\r\n');

    await this.rawPrint(this.config.labelPrinterName, tspl);
  }

  // ── Open cash drawer ──────────────────────────────

  async openDrawer(): Promise<void> {
    await this.ensureConnected();
    const ESC = '\x1B';
    const cmd = `${ESC}\x40${this.drawerCommand()}`;
    await this.rawPrint(this.config.receiptPrinterName, cmd);
  }

  private drawerCommand(): string {
    return '\x1B\x70\x00\x19\xFA';
  }

  // ── Test prints ───────────────────────────────────

  async testReceipt(): Promise<void> {
    const sample: SaleReceiptData = {
      saleId: 0,
      date: new Date().toISOString(),
      salespersonName: 'Test User',
      saleType: 'RETAIL',
      items: [{ name: 'Test Product', quantity: 1, unitPrice: 100, discount: 0, subtotal: 100 }],
      subtotal: 100,
      itemDiscount: 0,
      cartDiscount: 0,
      total: 100,
      paymentMethod: 'CASH',
      cashTendered: 100,
      changeAmount: 0
    };
    await this.printReceipt(sample);
  }

  async testLabel(): Promise<void> {
    await this.printLabel({ barcode: 'GH0123456789', productName: 'Test Product 38mm', retailPrice: 1500 }, 1);
  }

  // ── Bluetooth fallback ────────────────────────────

  private btCharacteristic: any = null;
  private _btConnected = new BehaviorSubject<boolean>(false);
  readonly btConnected$ = this._btConnected.asObservable();

  setBtCharacteristic(char: any): void {
    this.btCharacteristic = char;
    this._btConnected.next(!!char);
  }

  isBtConnected(): boolean { return this._btConnected.getValue(); }

  // ── Low-level raw print ───────────────────────────

  private async rawPrint(printerName: string, data: string): Promise<void> {
    if (this.qz?.websocket?.isActive()) {
      const cfg = this.qz.configs.create(printerName);
      // Base64-encode so binary ESC/POS bytes (>127) are not corrupted
      const bytes = Array.from(data, c => c.charCodeAt(0) & 0xFF);
      const base64 = btoa(bytes.map(b => String.fromCharCode(b)).join(''));
      await this.qz.print(cfg, [{ type: 'raw', format: 'command', data: base64, flavor: 'base64' }]);
    } else if (this.btCharacteristic) {
      await this.btRawPrint(data);
    } else {
      throw new Error('No printer connection available');
    }
  }

  private async btRawPrint(data: string): Promise<void> {
    // Use charCodeAt so ESC/POS binary bytes (>127) are preserved as-is
    const bytes = new Uint8Array(data.length);
    for (let i = 0; i < data.length; i++) {
      bytes[i] = data.charCodeAt(i) & 0xFF;
    }
    const p = this.btCharacteristic.properties;
    console.log(`BT print: ${bytes.length} bytes | write:${p.write} writeWithoutResponse:${p.writeWithoutResponse}`);

    const chunkSize = 20;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.slice(i, i + chunkSize);
      try {
        if (p.writeWithoutResponse) {
          await this.btCharacteristic.writeValueWithoutResponse(chunk);
        } else {
          await this.btCharacteristic.writeValue(chunk);
        }
      } catch {
        // Try the other method if first fails
        try {
          await this.btCharacteristic.writeValue(chunk);
        } catch {
          await this.btCharacteristic.writeValueWithoutResponse(chunk);
        }
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
}
