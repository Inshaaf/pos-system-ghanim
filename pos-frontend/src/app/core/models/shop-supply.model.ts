export interface ShopSupply {
  id: number;
  name: string;
  unit: string;
  category?: string;
  active: boolean;
}

export interface SupplierDelivery {
  id: number;
  supplier: { id: number; name: string };
  supplyItem?: { id: number; name: string; unit: string };
  quantity: number;
  unitPrice: number;
  amount: number;
  note?: string;
  deliveredAt: string;
  createdBy?: string;
  createdAt: string;
}

export interface SupplierDeliveryRequest {
  supplierId: number;
  supplyItemId?: number;
  quantity: number;
  unitPrice: number;
  note?: string;
  deliveredAt?: string;
  createdBy?: string;
}

export interface PriceComparison {
  supplyItemId: number;
  supplyItemName: string;
  supplierId: number;
  supplierName: string;
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
  lastDelivery: string;
}
