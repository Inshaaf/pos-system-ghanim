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
    labelPrinterName: 'XP-365B',
    labelVersion: 2,
    showQrCode: false
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
    const CENTER   = `${ESC}\x61\x01`;
    const BOLD_ON  = `${ESC}\x45\x01`;
    const BOLD_OFF = `${ESC}\x45\x00`;
    const BIG      = `${GS}\x21\x11`;
    const NORMAL   = `${GS}\x21\x00`;
    const FEED5    = `${ESC}\x64\x05`;
    const CUT      = `${GS}\x56\x00`;

    const W      = 40;
    const INDENT = '       ';
    const IW     = W - INDENT.length;
    const DASH   = INDENT + '-'.repeat(IW) + '\n';
    const SEPR   = INDENT + '='.repeat(IW) + '\n';

    const fmtN   = (n: number) => Math.round(n).toLocaleString('en-US');
    const fmtLKR = (n: number) => `LKR ${fmtN(n)}`;

    const hdr = (text: string) => {
      const pad = Math.max(0, Math.floor((W - text.length) / 2));
      return ' '.repeat(pad) + text + '\n';
    };

    const col = (label: string, value: string) => {
      const gap = Math.max(1, IW - label.length - value.length);
      return INDENT + label + ' '.repeat(gap) + value + '\n';
    };

    const qrCmd = (url: string, size = 5): string => {
      const len = url.length + 3;
      const pL  = String.fromCharCode(len & 0xFF);
      const pH  = String.fromCharCode((len >> 8) & 0xFF);
      return (
        `\x1d\x28\x6b\x04\x00\x31\x41\x32\x00` +
        `\x1d\x28\x6b\x03\x00\x31\x43${String.fromCharCode(size)}` +
        `\x1d\x28\x6b\x03\x00\x31\x45\x31` +
        `\x1d\x28\x6b${pL}${pH}\x31\x50\x30${url}` +
        `\x1d\x28\x6b\x03\x00\x31\x51\x30`
      );
    };

    // ── Logo loader ───────────────────────────────────
    const PAPER_PX = 576; // 80mm @ 203dpi ≈ 576px
    const loadLogo = (src: string, maxW = 300, maxH = 120): Promise<string> =>
      new Promise(resolve => {
        const img = new Image();
        img.onload = () => {
          const scale  = Math.min(maxW / img.width, maxH / img.height, 1);
          const w      = Math.round(img.width  * scale);
          const h      = Math.round(img.height * scale);
          const canvas = document.createElement('canvas');
          canvas.width = w; canvas.height = h;
          const ctx = canvas.getContext('2d')!;
          ctx.fillStyle = '#fff';
          ctx.fillRect(0, 0, w, h);
          ctx.drawImage(img, 0, 0, w, h);
          const px = ctx.getImageData(0, 0, w, h).data;

          // Build per-row bitmap (logo only, not padded yet)
          const bpr      = Math.ceil(w / 8);
          const rawRows: number[][] = [];
          for (let y = 0; y < h; y++) {
            const row: number[] = [];
            for (let bx = 0; bx < bpr; bx++) {
              let byte = 0;
              for (let bit = 0; bit < 8; bit++) {
                const x = bx * 8 + bit;
                if (x < w) {
                  const i   = (y * w + x) * 4;
                  const lum = 0.299 * px[i] + 0.587 * px[i+1] + 0.114 * px[i+2];
                  if (lum < 128) byte |= (0x80 >> bit);
                }
              }
              row.push(byte);
            }
            rawRows.push(row);
          }

          // Trim blank rows from top and bottom to remove white space
          const isBlankRow = (r: number[]) => r.every(b => b === 0);
          let top = 0, bot = rawRows.length - 1;
          while (top <= bot && isBlankRow(rawRows[top]))    top++;
          while (bot >= top && isBlankRow(rawRows[bot]))    bot--;
          const trimmed   = rawRows.slice(top, bot + 1);
          const trimH     = trimmed.length;

          // Center logo horizontally with padding to paper width
          const rowBytes = Math.ceil(PAPER_PX / 8);
          const padL     = Math.max(0, Math.floor((rowBytes - bpr) / 2));
          const bitmap: number[] = [];
          for (const row of trimmed) {
            for (let i = 0; i < padL; i++) bitmap.push(0);
            for (const b of row) bitmap.push(b);
            let used = padL + bpr;
            while (used++ < rowBytes) bitmap.push(0);
          }

          const xL = rowBytes & 0xFF, xH = (rowBytes >> 8) & 0xFF;
          const yL = trimH   & 0xFF, yH = (trimH   >> 8) & 0xFF;
          console.log(`[Logo] ${w}x${h}px trimmed to ${w}x${trimH}px, rowBytes=${rowBytes}`);
          resolve(
            '\x1D\x76\x30\x00' +
            String.fromCharCode(xL, xH, yL, yH) +
            bitmap.map(b => String.fromCharCode(b)).join('')
          );
        };
        img.onerror = (e) => { console.warn('[Logo] failed to load:', src, e); resolve(''); };
        img.crossOrigin = 'anonymous';
        img.src = src;
      });

    const date    = new Date(sale.date);
    const TZ      = 'Asia/Colombo';
    const dateStr = date.toLocaleDateString('en-GB',  { timeZone: TZ });
    const timeStr = date.toLocaleTimeString('en-US',  { timeZone: TZ, hour: '2-digit', minute: '2-digit' });

    const logoCmd = await loadLogo('assets/logo-print.png');

    const FEED_N              = (dots: number) => `${ESC}\x4A${String.fromCharCode(dots)}`;
    const LINE_SPACING_TIGHT  = `${ESC}\x33${String.fromCharCode(0)}`;
    const LINE_SPACING_DEFAULT = `${ESC}\x32`;

    let receipt = INIT + LINE_SPACING_TIGHT + CENTER;

    // ── Header ───────────────────────────────────────
    if (logoCmd) receipt += logoCmd;
    receipt += LINE_SPACING_DEFAULT;
    receipt += FEED_N(4); // small gap between logo and name
    receipt += BOLD_ON + BIG;
    receipt += 'GHANIM\n';
    receipt += NORMAL + BOLD_OFF;
    receipt += '84 Lower St, Badulla\n';
    receipt += 'Tel: 055 222 9046\n';
    receipt += 'WA:  071 902 5444\n';
    receipt += LEFT;
    receipt += DASH;

    // ── Transaction info ──────────────────────────────
    receipt += hdr(`        ${dateStr}   ${timeStr}`);
    receipt += hdr(`    Sale #${sale.saleId}`);
    receipt += DASH;

    // ── Items ─────────────────────────────────────────
    const QW = 3;
    const TW = 8;
    const NW = IW - QW - 2 - TW;

    receipt += INDENT + `${'Qty'.padStart(QW)}  ${'Description'.padEnd(NW)}${'Total'.padStart(TW)}\n`;
    receipt += DASH;

    for (const item of sale.items) {
      const qtyStr   = String(item.quantity).padStart(QW);
      const totalStr = fmtN(item.subtotal).padStart(TW);
      const name     = item.name.length > NW ? item.name.substring(0, NW - 1) + '.' : item.name;
      receipt += INDENT + `${qtyStr}  ${name.padEnd(NW)}${totalStr}\n`;
    }

    // ── Total ─────────────────────────────────────────
    receipt += SEPR;
    receipt += BOLD_ON + col('TOTAL', fmtLKR(sale.total)) + BOLD_OFF;
    receipt += SEPR;

    // ── Payment ───────────────────────────────────────
    if (sale.paymentMethod === 'CASH' && sale.cashTendered != null) {
      receipt += col('Cash', fmtN(sale.cashTendered));
      receipt += col('Change', fmtN(sale.changeAmount ?? 0));
    } else if (sale.paymentMethod === 'TRANSFER') {
      receipt += col('Online Transfer', '');
    } else if (sale.paymentMethod === 'CREDIT') {
      receipt += col('Credit', '');
    }
    receipt += DASH;

    // ── Footer ────────────────────────────────────────
    receipt += CENTER;
    receipt += 'Thank You!\n';
    receipt += '\n';
    if (this.config.showQrCode) {
      receipt += BOLD_ON + 'ORDER ONLINE\n' + BOLD_OFF;
      receipt += qrCmd('https://ghanimenterprises.lk');
      receipt += 'ghanimenterprises.lk\n';
    } else {
      receipt += BOLD_ON + 'ORDER ONLINE\n' + BOLD_OFF;
      receipt += 'ghanimenterprises.lk\n';
    }
    receipt += '\n';
    receipt += 'Visit Us Again!\n';
    receipt += LEFT;

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
    const ver = this.config.labelVersion ?? 2;
    let tspl: string;
    if (ver === 4) {
      const top = this.config.labelTopVersion ?? 2;
      const bot = this.config.labelBottomVersion ?? 1;
      tspl = this.buildLabelTwoUp(label, top, bot, copies);
    } else if (ver === 3) {
      tspl = this.buildLabelFourUp(label, copies);
    } else {
      tspl = this.buildLabelTspl(label, copies, ver);
    }
    await this.rawPrint(this.config.labelPrinterName, tspl);
  }

  async printLabelSingle(label: LabelData, ver: 1|2, copies: number = 1): Promise<void> {
    await this.ensureConnected();
    const tspl = this.buildLabelTspl(label, copies, ver);
    await this.rawPrint(this.config.labelPrinterName, tspl);
  }

  async printLabelTwoUp(label: LabelData, topVer: 1|2|3, bottomVer: 1|2|3, copies: number = 1): Promise<void> {
    await this.ensureConnected();
    const tspl = this.buildLabelTwoUp(label, topVer, bottomVer, copies);
    await this.rawPrint(this.config.labelPrinterName, tspl);
  }

  // Two-up: top half (Y 0-99) + bottom half (Y 100-199) — each an independent version
  private buildLabelTwoUp(label: LabelData, topVer: 1|2|3, bottomVer: 1|2|3, copies: number): string {
    const lines: string[] = [
      'SIZE 38 mm, 25 mm',
      'GAP 3 mm, 0 mm',
      'DENSITY 8',
      'SPEED 4',
      'CLS',
      'BAR 0,99,304,2', // cut guide between halves
      ...this.buildHalfCell(label, 0, topVer),
      ...this.buildHalfCell(label, 100, bottomVer),
      `PRINT ${copies}`,
      ''
    ];
    return lines.join('\r\n');
  }

  // Render one label version into a 304×100 dot cell starting at yBase
  private buildHalfCell(label: LabelData, yBase: number, ver: 1|2|3): string[] {
    const W = 304;
    const baseName  = (label.labelName || label.productName);
    const shopCode  = label.shopCode ? label.shopCode.substring(0, 5).toUpperCase() : '';
    const priceStr  = `Rs ${Math.round(label.retailPrice)}`;
    const storeName = 'GHANIM';

    // centring helper — Font 1 = 8 dots/char at mag 1×
    const cx = (len: number, mag = 1) => Math.max(0, Math.floor((W - len * 8 * mag) / 2));

    // Combined info line: "BARCODE  Name(CODE)" — fits in 38 chars (304px at 1×)
    const maxChars   = Math.floor(W / 8); // 38
    const codePrefix = label.barcode + '  ';
    const suffix     = shopCode ? `(${shopCode})` : '';
    const nameMax    = maxChars - codePrefix.length - suffix.length;
    const truncName  = baseName.substring(0, Math.max(0, nameMax));
    const infoLine   = codePrefix + truncName + suffix;

    if (ver === 3) {
      // V3 inside 2-Up = two mini cells side by side (152×100 each), same as 4-up rows
      return [
        `BAR 151,${yBase},2,100`,           // vertical divider between the two mini cells
        ...this.buildMiniCell(label, 0,   yBase),
        ...this.buildMiniCell(label, 152, yBase),
      ];
    }

    // V1 / V2 — different barcode narrow width, same info layout
    const modules      = (label.barcode.length + 3) * 11 + 2;
    const narrow       = ver === 1
      ? Math.max(1, Math.floor((W * 0.67) / modules))
      : Math.max(1, Math.floor((W - 8) / modules));
    const barcodeWidth = modules * narrow;
    const barcodeX     = Math.max(0, Math.floor((W - barcodeWidth) / 2));

    return [
      `TEXT ${cx(storeName.length)},${yBase + 2},"1",0,1,1,"${storeName}"`,
      `TEXT ${cx(storeName.length) + 1},${yBase + 2},"1",0,1,1,"${storeName}"`,
      `BARCODE ${barcodeX},${yBase + 16},"128",38,0,0,${narrow},${narrow},"${label.barcode}"`,
      `TEXT ${cx(infoLine.length)},${yBase + 56},"1",0,1,1,"${infoLine}"`,
      `TEXT ${cx(priceStr.length, 2)},${yBase + 68},"1",0,2,2,"${priceStr}"`,
    ];
  }

  // One 152×100 dot mini cell — shared by buildLabelFourUp and buildHalfCell (V3)
  private buildMiniCell(label: LabelData, xBase: number, yBase: number): string[] {
    const CW          = 152;
    const baseName    = (label.labelName || label.productName).substring(0, 20);
    const shopCode    = label.shopCode ? label.shopCode.substring(0, 5).toUpperCase() : '';
    const barcodeShort = label.barcode.substring(0, 10);
    const modules     = (barcodeShort.length + 3) * 11 + 2;
    const barcodeX    = Math.max(0, Math.floor((CW - modules) / 2));
    const cxC         = (len: number, mag = 1) => Math.max(0, Math.floor((CW - len * 8 * mag) / 2));
    const priceInCell = `Rs${Math.round(label.retailPrice)}`;
    const bottomLabel = shopCode
      ? `${baseName.substring(0, 12)}(${shopCode})`.substring(0, 19)
      : baseName.substring(0, 19);

    return [
      `TEXT ${xBase + cxC(6)},${yBase + 2},"1",0,1,1,"GHANIM"`,
      `BARCODE ${xBase + barcodeX},${yBase + 20},"128",24,0,0,1,1,"${barcodeShort}"`,
      `TEXT ${xBase + cxC(barcodeShort.length)},${yBase + 46},"1",0,1,1,"${barcodeShort}"`,
      `TEXT ${xBase + cxC(priceInCell.length, 2)},${yBase + 64},"1",0,2,1,"${priceInCell}"`,
      `TEXT ${xBase + cxC(bottomLabel.length)},${yBase + 83},"1",0,1,1,"${bottomLabel}"`,
    ];
  }

  // V3: 4-up layout — 2×2 mini labels on one 38×25 mm label (for small items)
  private buildLabelFourUp(label: LabelData, copies: number): string {
    return [
      'SIZE 38 mm, 25 mm',
      'GAP 3 mm, 0 mm',
      'DENSITY 8',
      'SPEED 4',
      'CLS',
      `BAR 151,0,2,200`,
      `BAR 0,99,304,2`,
      ...this.buildMiniCell(label, 0,   0),
      ...this.buildMiniCell(label, 152, 0),
      ...this.buildMiniCell(label, 0,   100),
      ...this.buildMiniCell(label, 152, 100),
      `PRINT ${copies}`,
      ''
    ].join('\r\n');
  }

  // V1: barcode ~67% of label width (original)
  // V2: barcode fills maximum available width (active)
  private buildLabelTspl(label: LabelData, copies: number, version: 1 | 2): string {
    // 38×25 mm at 203 DPI = 304×200 dots
    const W = 304;

    const baseName    = (label.labelName || label.productName).substring(0, 20);
    const shopCode    = label.shopCode ? label.shopCode.substring(0, 5).toUpperCase() : '';
    const displayName = shopCode ? `${baseName} (${shopCode})` : baseName;

    // Code-128 module count
    const modules = (label.barcode.length + 3) * 11 + 2;

    // V1: 67% width  |  V2: fill label edge-to-edge (4-dot margin each side)
    const narrow     = version === 1
      ? Math.max(1, Math.floor((W * 0.67) / modules))
      : Math.max(1, Math.floor((W - 8) / modules));
    const barcodeWidth = modules * narrow;
    const barcodeX     = Math.max(0, Math.floor((W - barcodeWidth) / 2));

    // Helper: center text — Font 1 = 8 dots/char at 1×
    const cx = (len: number, mag = 1) => Math.max(0, Math.floor((W - len * 8 * mag) / 2));

    const storeName = 'GHANIM';
    const priceStr  = `Rs ${Math.round(label.retailPrice)}`;

    // Bold = double-print with 1-dot x-offset
    const bold = (x: number, y: number, text: string) => [
      `TEXT ${x},${y},"1",0,1,1,"${text}"`,
      `TEXT ${x + 1},${y},"1",0,1,1,"${text}"`
    ];

    // Layout — 3 mm top margin, compact stack
    // Y=24:  GHANIM         BOLD (1×1)
    // Y=43:  barcode bars        (h=65)  → ends Y=108
    // Y=110: barcode number      (1×1)   → ends Y=126
    // Y=128: name (+ shopcode)   (1×1, up to 22 chars)
    // Y=150: price               (3×2)   → ends Y=182
    const displayNameFull = displayName.substring(0, 22);
    const priceX = Math.max(0, cx(priceStr.length, 3) - 12);

    return [
      'SIZE 38 mm, 25 mm',
      'GAP 3 mm, 0 mm',
      'DENSITY 8',
      'SPEED 4',
      'CLS',
      ...bold(cx(storeName.length), 24, storeName),
      `BARCODE ${barcodeX},43,"128",65,0,0,${narrow},${narrow},"${label.barcode}"`,
      `TEXT ${cx(label.barcode.length)},110,"1",0,1,1,"${label.barcode}"`,
      `TEXT ${cx(displayNameFull.length)},128,"1",0,1,1,"${displayNameFull}"`,
      `TEXT ${priceX},150,"1",0,3,2,"${priceStr}"`,
      `PRINT ${copies}`,
      ''
    ].join('\r\n');
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
