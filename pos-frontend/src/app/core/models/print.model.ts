export interface ReceiptItem {
  name: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  subtotal: number;
}

export interface SaleReceiptData {
  saleId: number;
  date: string;
  salespersonName: string;
  saleType: 'RETAIL' | 'WHOLESALE';
  customerName?: string;
  items: ReceiptItem[];
  subtotal: number;
  itemDiscount: number;
  cartDiscount: number;
  total: number;
  paymentMethod: 'CASH' | 'TRANSFER' | 'CREDIT';
  cashTendered?: number;
  changeAmount?: number;
}

export interface LabelData {
  barcode: string;
  productName: string;
  labelName?: string;
  shopCode?: string;
  retailPrice: number;
}

export interface PrinterConfig {
  receiptPrinterName: string;
  labelPrinterName: string;
  labelVersion: 1 | 2 | 3 | 4;
  showQrCode: boolean;
  labelTopVersion?: 1 | 2 | 3;
  labelBottomVersion?: 1 | 2 | 3;
}
