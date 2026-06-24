export interface DailyReport {
  date: string;
  totalSales: number;
  totalAmount: number;
  retailAmount: number;
  wholesaleAmount: number;
  totalProfit: number;
  totalExpenses: number;
  netProfit: number;
  margin: number;
  quickSaleCount: number;
  quickSaleTotal: number;
  salespersonBreakdown: SalespersonBreakdown[];
  cashSummary: CashSummary;
  paymentBreakdown: PaymentBreakdown;
}

export interface RangeReport {
  from: string;
  to: string;
  totalSales: number;
  totalAmount: number;
  retailAmount: number;
  wholesaleAmount: number;
  totalProfit: number;
  totalExpenses: number;
  netProfit: number;
  margin: number;
  dailyBreakdown: DailyBreakdown[];
  salespersonBreakdown: SalespersonBreakdown[];
  paymentBreakdown: PaymentBreakdown;
}

export interface DailyBreakdown {
  date: string;
  salesCount: number;
  revenue: number;
}

export interface SalespersonBreakdown {
  id?: number;
  name: string;
  salesCount: number;
  totalAmount: number;
  profit?: number;
}

export interface ProductStat {
  productId: number;
  productName: string;
  category: string;
  qtySold: number;
  revenue: number;
  profit: number;
  margin: number;
}

export interface SlowStockItem {
  productId: number;
  productName: string;
  category: string;
  stockQuantity: number;
  qtySoldInPeriod: number;
  minStockAlert: number;
}

export interface CashFlowDay {
  date: string;
  salesCount: number;
  revenue: number;
  cashRevenue: number;
  expenses: number;
  net: number;
}

export interface CashSummary {
  openingFloat: number;
  totalCashSales: number;
  quickSaleCash: number;
  cashIn: number;
  cashOut: number;
  expectedCash: number;
  cashOutByReason: Record<string, number>;
}

export interface PaymentBreakdown {
  cash: number;
  card: number;
  credit: number;
}
