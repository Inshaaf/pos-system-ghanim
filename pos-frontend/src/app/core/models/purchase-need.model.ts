export type NeedStatus = 'NEEDED' | 'PURCHASED' | 'DISMISSED';

export interface PurchaseNeed {
  id: number;
  name: string;
  quantity?: number;
  unit?: string;
  notes?: string;
  status: NeedStatus;
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
  requestedBy: string;
  supplyItemId?: number;
}
