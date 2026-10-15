export interface ShopBill {
  id: number;
  customerName: string;
  billNumber: string;
  category: 'RAINCO' | 'PLASTIC';
  billType: 'CASH' | 'CREDIT';
  amount: number;
  paidAmount: number;
  remainingAmount: number;
  paymentAwaitingConfirmation?: boolean;
  status: 'PENDING_APPROVAL' | 'OPEN' | 'COMPLETED' | 'REJECTED';
  requestedBy: string;
  salesperson?: { id: number; name: string } | null;
  createdAt: string;
}

export interface ShopBillActivity {
  id: number;
  bill: ShopBill;
  type: 'PAYMENT' | 'FOLLOW_UP';
  amount?: number;
  paymentMethod?: 'CASH' | 'CHEQUE';
  confirmationStatus?: 'PENDING_CONFIRMATION' | 'CONFIRMED' | 'REJECTED';
  reason?: string;
  followUpAt?: string;
  recordedBy: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNote?: string;
  createdAt: string;
}
