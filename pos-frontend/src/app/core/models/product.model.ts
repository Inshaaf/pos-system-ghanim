export interface Product {
  id: number;
  name: string;
  description?: string;
  shopCode?: string;
  labelName?: string;
  barcode?: string;
  categoryId?: number;
  categoryName?: string;
  supplierId?: number;
  supplierName?: string;
  retailPrice: number;
  wholesalePrice: number;
  costPrice?: number;
  onlinePrice?: number;
  minWholesaleQty: number;
  minStockAlert: number;
  stockQuantity: number;
  unit: string;
  imageUrl?: string;
  emoji?: string;
  active: boolean;
  showInPos: boolean;
  showOnline: boolean;
  productSource: 'STORE_PRODUCT' | 'SHOP_DIRECT' | 'BOTH';
  fulfillmentSource: 'STORE' | 'SHOP';
  badge?: 'SALE' | 'NEW' | 'BEST_SELLER';
}

export interface Category {
  id: number;
  name: string;
  active: boolean;
  ecommerceSlug?: string;
}

export interface Supplier {
  id: number;
  name: string;
  code?: string;
  phone?: string;
  address?: string;
  notes?: string;
  balance: number;
  active: boolean;
}

export interface Salesperson {
  id: number;
  name: string;
  active: boolean;
}

export interface TempWorker {
  id: number;
  name: string;
  active: boolean;
}
