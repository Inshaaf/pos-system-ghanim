export type NeedStatus   = 'NEEDED' | 'PURCHASED' | 'DISMISSED';
export type NeedCategory = 'STORE' | 'PURCHASE';

export interface PurchaseNeed {
  id: number;
  name: string;
  quantity?: number;
  unit?: string;
  notes?: string;
  status: NeedStatus;
  category: NeedCategory;
  supplyItem?: { id: number; name: string; unit: string };
  requestedBy: string;
  requestedAt: string;
  resolvedBy?: string;
  resolvedAt?: string;
}

export interface CreateNeedRequest {
  name: string;
  quantity?: number;
  unit?: string;
  notes?: string;
  category: NeedCategory;
  requestedBy: string;
  supplyItemId?: number;
}
