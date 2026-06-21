export interface CartItem {
  productId: number;
  productName: string;
  barcode?: string;
  imageUrl?: string;
  quantity: number;
  unitPrice: number;
  priceType: 'RETAIL' | 'WHOLESALE';
  itemDiscount: number;
  itemDiscountPct: number;
  subtotal: number;
  stockQuantity: number;
  unit: string;
  retailPrice: number;
  wholesalePrice: number;
  minWholesaleQty: number;
  costPrice?: number;
}

export interface CheckoutRequest {
  sessionId: number;
  salespersonId: number;
  saleType: 'RETAIL' | 'WHOLESALE';
  customerName?: string;
  items: {
    productId: number;
    quantity: number;
    unitPrice: number;
    priceType: string;
    itemDiscount: number;
    itemDiscountPct: number;
  }[];
  cartDiscountPct: number;
  paymentMethod: 'CASH' | 'TRANSFER' | 'CREDIT';
  cashTendered?: number;
  notes?: string;
}

export interface Sale {
  id: number;
  saleType: string;
  customerName?: string;
  subtotal: number;
  itemDiscount: number;
  cartDiscount: number;
  cartDiscountPct: number;
  total: number;
  paymentMethod: string;
  cashTendered?: number;
  changeAmount?: number;
  status: string;
  createdAt: string;
  salesperson?: { id: number; name: string };
  items?: SaleItem[];
}

export interface SaleItem {
  id: number;
  productId?: number;
  product?: { id: number; name: string };
  productName: string;
  quantity: number;
  unitPrice: number;
  priceType: string;
  itemDiscount: number;
  subtotal: number;
}

export interface HeldSale {
  id: number;
  saleType: string;
  customerName?: string;
  note?: string;
  createdAt: string;
  salesperson?: { id: number; name: string };
  items: string; // JSON string
}
