import type { Product, Category, Supplier } from '../core/models/product.model';
import type { Customer } from '../core/models/customer.model';
import type { Session } from '../core/models/session.model';
import type { PurchaseNeed } from '../core/models/purchase-need.model';
import type { Expense } from '../core/models/expense.model';
import type { AppUser } from '../core/services/user.service';
import type {
  DailyReport, RangeReport, ProductStat,
  SlowStockItem, CashFlowDay
} from '../core/models/report.model';

const dt = (daysAgo: number, time = '10:00:00') => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10) + 'T' + time;
};

export const todayStr = () => new Date().toISOString().slice(0, 10);

// ─── Categories ────────────────────────────────────────────────────────────
export const DEMO_CATEGORIES: Category[] = [
  { id: 1, name: 'Toys & Games', active: true },
  { id: 2, name: 'Sports',       active: true },
  { id: 3, name: 'Kitchen & Home', active: true },
  { id: 4, name: 'Baby & Kids',  active: true },
];

// ─── Products (15 items) ────────────────────────────────────────────────────
export const DEMO_PRODUCTS: Product[] = [
  {
    id: 1, name: 'Diecast Model Car Set',
    shopCode: 'TOY-001', barcode: '4000001',
    categoryId: 1, categoryName: 'Toys & Games',
    retailPrice: 1800, wholesalePrice: 1400, costPrice: 1050,
    stockQuantity: 24, minStockAlert: 5, minWholesaleQty: 6,
    unit: 'set', imageUrl: 'https://ik.imagekit.io/jljsfouwenlblj/pos/2af69c78312341af.webp?updatedAt=1782757091344',
    emoji: '🚗', active: true, showInPos: true, showOnline: false,
    productSource: 'SHOP_DIRECT', fulfillmentSource: 'SHOP',
  },
  {
    id: 2, name: 'Water Gun',
    shopCode: 'TOY-002', barcode: '4000002',
    categoryId: 1, categoryName: 'Toys & Games',
    retailPrice: 850, wholesalePrice: 650, costPrice: 480,
    stockQuantity: 36, minStockAlert: 10, minWholesaleQty: 12,
    unit: 'pcs', imageUrl: 'https://ik.imagekit.io/jljsfouwenlblj/pos/29ddce5c7fa14c58.webp?updatedAt=1782756789452',
    emoji: '💦', active: true, showInPos: true, showOnline: false,
    productSource: 'SHOP_DIRECT', fulfillmentSource: 'SHOP',
  },
  {
    id: 3, name: 'Teddy Bear',
    shopCode: 'TOY-003', barcode: '4000003',
    categoryId: 1, categoryName: 'Toys & Games',
    retailPrice: 1200, wholesalePrice: 950, costPrice: 720,
    stockQuantity: 18, minStockAlert: 5, minWholesaleQty: 6,
    unit: 'pcs', imageUrl: 'https://ik.imagekit.io/jljsfouwenlblj/pos/c1c0abf5e3ca4839.webp?updatedAt=1782756531550',
    emoji: '🧸', badge: 'BEST_SELLER', active: true, showInPos: true, showOnline: false,
    productSource: 'SHOP_DIRECT', fulfillmentSource: 'SHOP',
  },
  {
    id: 4, name: 'Curly Hair Girl Doll',
    shopCode: 'TOY-004', barcode: '4000004',
    categoryId: 1, categoryName: 'Toys & Games',
    retailPrice: 1500, wholesalePrice: 1200, costPrice: 900,
    stockQuantity: 15, minStockAlert: 4, minWholesaleQty: 5,
    unit: 'pcs', imageUrl: 'https://ik.imagekit.io/jljsfouwenlblj/pos/8d5cf608497e4002.webp?updatedAt=1782756271771',
    emoji: '👧', active: true, showInPos: true, showOnline: false,
    productSource: 'SHOP_DIRECT', fulfillmentSource: 'SHOP',
  },
  {
    id: 5, name: 'Basketball',
    shopCode: 'SPT-001', barcode: '4000005',
    categoryId: 2, categoryName: 'Sports',
    retailPrice: 2200, wholesalePrice: 1800, costPrice: 1350,
    stockQuantity: 12, minStockAlert: 3, minWholesaleQty: 5,
    unit: 'pcs', imageUrl: 'https://ik.imagekit.io/jljsfouwenlblj/pos/f582746219864b9e.webp?updatedAt=1782755853125',
    emoji: '🏀', active: true, showInPos: true, showOnline: false,
    productSource: 'SHOP_DIRECT', fulfillmentSource: 'SHOP',
  },
  {
    id: 6, name: 'Remote Control Racing Car',
    shopCode: 'TOY-005', barcode: '4000006',
    categoryId: 1, categoryName: 'Toys & Games',
    retailPrice: 3500, wholesalePrice: 2800, costPrice: 2100,
    stockQuantity: 8, minStockAlert: 3, minWholesaleQty: 3,
    unit: 'pcs', imageUrl: 'https://ik.imagekit.io/jljsfouwenlblj/pos/4c8beb048b514779.webp?updatedAt=1782755275244',
    emoji: '🏎️', badge: 'NEW', active: true, showInPos: true, showOnline: false,
    productSource: 'SHOP_DIRECT', fulfillmentSource: 'SHOP',
  },
  {
    id: 7, name: 'Football',
    shopCode: 'SPT-002', barcode: '4000007',
    categoryId: 2, categoryName: 'Sports',
    retailPrice: 1800, wholesalePrice: 1400, costPrice: 1050,
    stockQuantity: 20, minStockAlert: 5, minWholesaleQty: 6,
    unit: 'pcs', imageUrl: 'https://ik.imagekit.io/jljsfouwenlblj/pos/5f949e17c1884746.webp?updatedAt=1782753797850',
    emoji: '⚽', active: true, showInPos: true, showOnline: false,
    productSource: 'SHOP_DIRECT', fulfillmentSource: 'SHOP',
  },
  {
    id: 8, name: "Rubik's Cube",
    shopCode: 'TOY-006', barcode: '4000008',
    categoryId: 1, categoryName: 'Toys & Games',
    retailPrice: 650, wholesalePrice: 500, costPrice: 370,
    stockQuantity: 42, minStockAlert: 10, minWholesaleQty: 12,
    unit: 'pcs', imageUrl: 'https://ik.imagekit.io/jljsfouwenlblj/pos/2487cc7478da48ce.webp?updatedAt=1782753341923',
    emoji: '🎲', active: true, showInPos: true, showOnline: false,
    productSource: 'SHOP_DIRECT', fulfillmentSource: 'SHOP',
  },
  {
    id: 9, name: 'Police Toy Car',
    shopCode: 'TOY-007', barcode: '4000009',
    categoryId: 1, categoryName: 'Toys & Games',
    retailPrice: 950, wholesalePrice: 750, costPrice: 560,
    stockQuantity: 30, minStockAlert: 8, minWholesaleQty: 10,
    unit: 'pcs', imageUrl: 'https://ik.imagekit.io/jljsfouwenlblj/pos/bac62bcd5d2d45fa.webp?updatedAt=1782752508377',
    emoji: '🚓', active: true, showInPos: true, showOnline: false,
    productSource: 'SHOP_DIRECT', fulfillmentSource: 'SHOP',
  },
  {
    id: 10, name: 'Scrabble Board Game',
    shopCode: 'TOY-008', barcode: '4000010',
    categoryId: 1, categoryName: 'Toys & Games',
    retailPrice: 2200, wholesalePrice: 1800, costPrice: 1350,
    stockQuantity: 10, minStockAlert: 3, minWholesaleQty: 3,
    unit: 'pcs', imageUrl: 'https://ik.imagekit.io/jljsfouwenlblj/pos/3e77ba6d54e44ce8.jpg?updatedAt=1782749485881',
    emoji: '🔤', active: true, showInPos: true, showOnline: false,
    productSource: 'SHOP_DIRECT', fulfillmentSource: 'SHOP',
  },
  {
    id: 11, name: 'Cutting Board Set',
    shopCode: 'KIT-001', barcode: '4000011',
    categoryId: 3, categoryName: 'Kitchen & Home',
    retailPrice: 1400, wholesalePrice: 1100, costPrice: 820,
    stockQuantity: 22, minStockAlert: 5, minWholesaleQty: 5,
    unit: 'set', imageUrl: 'https://ik.imagekit.io/jljsfouwenlblj/pos/cutting%20board%20national.webp?updatedAt=1782429486565',
    emoji: '🔪', active: true, showInPos: true, showOnline: false,
    productSource: 'SHOP_DIRECT', fulfillmentSource: 'SHOP',
  },
  {
    id: 12, name: 'Cappuccino Milk Frother',
    shopCode: 'KIT-002', barcode: '4000012',
    categoryId: 3, categoryName: 'Kitchen & Home',
    retailPrice: 3800, wholesalePrice: 3200, costPrice: 2400,
    stockQuantity: 7, minStockAlert: 2, minWholesaleQty: 3,
    unit: 'pcs', imageUrl: 'https://ik.imagekit.io/jljsfouwenlblj/pos/1d60a3e244b74535.webp?updatedAt=1782324840450',
    emoji: '☕', badge: 'NEW', active: true, showInPos: true, showOnline: false,
    productSource: 'SHOP_DIRECT', fulfillmentSource: 'SHOP',
  },
  {
    id: 13, name: 'Sports Water Bottle',
    shopCode: 'KIT-003', barcode: '4000013',
    categoryId: 3, categoryName: 'Kitchen & Home',
    retailPrice: 1800, wholesalePrice: 1400, costPrice: 1050,
    stockQuantity: 35, minStockAlert: 8, minWholesaleQty: 10,
    unit: 'pcs', imageUrl: 'https://ik.imagekit.io/jljsfouwenlblj/pos/0675927fe19e4b81.png?updatedAt=1782240835717',
    emoji: '💧', active: true, showInPos: true, showOnline: false,
    productSource: 'SHOP_DIRECT', fulfillmentSource: 'SHOP',
  },
  {
    id: 14, name: 'Baby Bath Tub',
    shopCode: 'BAB-001', barcode: '4000014',
    categoryId: 4, categoryName: 'Baby & Kids',
    retailPrice: 4500, wholesalePrice: 3800, costPrice: 2800,
    stockQuantity: 9, minStockAlert: 2, minWholesaleQty: 3,
    unit: 'pcs', imageUrl: 'https://ik.imagekit.io/jljsfouwenlblj/pos/e82162e4872a4339.webp?updatedAt=1782118771049',
    emoji: '🛁', active: true, showInPos: true, showOnline: false,
    productSource: 'SHOP_DIRECT', fulfillmentSource: 'SHOP',
  },
  {
    id: 15, name: 'Non-Stick Rice Cooker',
    shopCode: 'KIT-004', barcode: '4000015',
    categoryId: 3, categoryName: 'Kitchen & Home',
    retailPrice: 6500, wholesalePrice: 5500, costPrice: 4200,
    stockQuantity: 6, minStockAlert: 2, minWholesaleQty: 2,
    unit: 'pcs', imageUrl: 'https://ik.imagekit.io/jljsfouwenlblj/pos/9db09eed60b94cca.png?updatedAt=1781721997690',
    emoji: '🍚', badge: 'BEST_SELLER', active: true, showInPos: true, showOnline: false,
    productSource: 'SHOP_DIRECT', fulfillmentSource: 'SHOP',
  },
];

// ─── Suppliers ──────────────────────────────────────────────────────────────
export const DEMO_SUPPLIERS: Supplier[] = [
  { id: 1, name: 'Lanka Toys Distributors', code: 'LTD', type: 'BUSINESS', phone: '0552234567', balance: 45000, active: true },
  { id: 2, name: 'Sports Lanka Pvt Ltd',   code: 'SLP', type: 'BUSINESS', phone: '0552287654', balance: 22000, active: true },
  { id: 3, name: 'Home Essentials Co.',    code: 'HEC', type: 'BUSINESS', phone: '0552256789', balance: 18500, active: true },
];

// ─── Customers ──────────────────────────────────────────────────────────────
export const DEMO_CUSTOMERS: Customer[] = [
  { id: 1, name: 'Kamal Perera',         phone: '0771234567', address: 'Badulla',          totalPurchases: 12, totalSpent: 24600,  createdAt: dt(60) },
  { id: 2, name: 'Nimal Jayawardena',    phone: '0712345678', address: 'Bandarawela',       totalPurchases: 8,  totalSpent: 67200,  createdAt: dt(45) },
  { id: 3, name: 'Fathima Raza',         phone: '0763456789', address: 'Badulla Town',      totalPurchases: 5,  totalSpent: 9750,   createdAt: dt(30) },
  { id: 4, name: 'Amara Kumari Silva',   phone: '0754567890', address: 'Mahiyangana Rd',    totalPurchases: 7,  totalSpent: 34500,  createdAt: dt(25) },
  { id: 5, name: 'Priyantha Bandara',    phone: '0705678901', address: 'Passara',            totalPurchases: 3,  totalSpent: 7800,   createdAt: dt(15) },
  { id: 6, name: 'Dinesh Wijesinghe',    phone: '0776789012', address: 'Ella',               totalPurchases: 6,  totalSpent: 15200,  createdAt: dt(10) },
];

// ─── Session ────────────────────────────────────────────────────────────────
export const DEMO_SESSION: Session = {
  id: 1,
  cashierName: 'Demo Owner',
  openingFloat: 5000,
  status: 'OPEN',
  openedAt: dt(0, '08:30:00'),
};

// ─── Sales (today's completed sales) ────────────────────────────────────────
export const DEMO_SALES = [
  {
    id: 101, saleType: 'RETAIL', customerName: 'Kamal Perera',
    subtotal: 3600, itemDiscount: 0, cartDiscount: 0, cartDiscountPct: 0,
    total: 3600, paymentMethod: 'CASH', cashTendered: 4000, changeAmount: 400,
    status: 'COMPLETED', createdAt: dt(0, '09:15:00'),
    salesperson: { id: 1, name: 'Demo Owner' },
    items: [{ id: 1, productName: 'Diecast Model Car Set', quantity: 2, unitPrice: 1800, priceType: 'RETAIL', itemDiscount: 0, subtotal: 3600 }],
  },
  {
    id: 102, saleType: 'RETAIL',
    subtotal: 3500, itemDiscount: 0, cartDiscount: 0, cartDiscountPct: 0,
    total: 3500, paymentMethod: 'CASH', cashTendered: 4000, changeAmount: 500,
    status: 'COMPLETED', createdAt: dt(0, '09:45:00'),
    salesperson: { id: 1, name: 'Demo Owner' },
    items: [{ id: 2, productName: 'Remote Control Racing Car', quantity: 1, unitPrice: 3500, priceType: 'RETAIL', itemDiscount: 0, subtotal: 3500 }],
  },
  {
    id: 103, saleType: 'RETAIL',
    subtotal: 3200, itemDiscount: 150, cartDiscount: 0, cartDiscountPct: 0,
    total: 3050, paymentMethod: 'CASH', cashTendered: 3050, changeAmount: 0,
    status: 'COMPLETED', createdAt: dt(0, '10:20:00'),
    salesperson: { id: 1, name: 'Demo Owner' },
    items: [
      { id: 3, productName: 'Water Gun',    quantity: 3, unitPrice: 850, priceType: 'RETAIL', itemDiscount: 0,   subtotal: 2550 },
      { id: 4, productName: "Rubik's Cube", quantity: 1, unitPrice: 650, priceType: 'RETAIL', itemDiscount: 150, subtotal: 500  },
    ],
  },
  {
    id: 104, saleType: 'RETAIL', customerName: 'Fathima Raza',
    subtotal: 2700, itemDiscount: 0, cartDiscount: 0, cartDiscountPct: 0,
    total: 2700, paymentMethod: 'CARD',
    status: 'COMPLETED', createdAt: dt(0, '10:55:00'),
    salesperson: { id: 1, name: 'Demo Owner' },
    items: [
      { id: 5, productName: 'Teddy Bear',          quantity: 1, unitPrice: 1200, priceType: 'RETAIL', itemDiscount: 0, subtotal: 1200 },
      { id: 6, productName: 'Curly Hair Girl Doll', quantity: 1, unitPrice: 1500, priceType: 'RETAIL', itemDiscount: 0, subtotal: 1500 },
    ],
  },
  {
    id: 105, saleType: 'WHOLESALE', customerName: 'Nimal Jayawardena',
    subtotal: 14000, itemDiscount: 0, cartDiscount: 0, cartDiscountPct: 0,
    total: 14000, paymentMethod: 'CASH', cashTendered: 14000, changeAmount: 0,
    status: 'COMPLETED', createdAt: dt(0, '11:30:00'),
    salesperson: { id: 1, name: 'Demo Owner' },
    items: [{ id: 7, productName: 'Football', quantity: 10, unitPrice: 1400, priceType: 'WHOLESALE', itemDiscount: 0, subtotal: 14000 }],
  },
  {
    id: 106, saleType: 'RETAIL',
    subtotal: 2200, itemDiscount: 0, cartDiscount: 0, cartDiscountPct: 0,
    total: 2200, paymentMethod: 'CASH', cashTendered: 2500, changeAmount: 300,
    status: 'COMPLETED', createdAt: dt(0, '12:10:00'),
    salesperson: { id: 1, name: 'Demo Owner' },
    items: [{ id: 8, productName: 'Basketball', quantity: 1, unitPrice: 2200, priceType: 'RETAIL', itemDiscount: 0, subtotal: 2200 }],
  },
  {
    id: 107, saleType: 'RETAIL',
    subtotal: 3200, itemDiscount: 0, cartDiscount: 0, cartDiscountPct: 0,
    total: 3200, paymentMethod: 'CASH', cashTendered: 3200, changeAmount: 0,
    status: 'COMPLETED', createdAt: dt(0, '13:45:00'),
    salesperson: { id: 1, name: 'Demo Owner' },
    items: [
      { id: 9,  productName: 'Cutting Board Set',  quantity: 1, unitPrice: 1400, priceType: 'RETAIL', itemDiscount: 0, subtotal: 1400 },
      { id: 10, productName: 'Sports Water Bottle', quantity: 1, unitPrice: 1800, priceType: 'RETAIL', itemDiscount: 0, subtotal: 1800 },
    ],
  },
  {
    id: 108, saleType: 'RETAIL', customerName: 'Amara Kumari Silva',
    subtotal: 4500, itemDiscount: 0, cartDiscount: 0, cartDiscountPct: 0,
    total: 4500, paymentMethod: 'CREDIT',
    status: 'CREDIT', createdAt: dt(0, '14:30:00'),
    salesperson: { id: 1, name: 'Demo Owner' },
    items: [{ id: 11, productName: 'Baby Bath Tub', quantity: 1, unitPrice: 4500, priceType: 'RETAIL', itemDiscount: 0, subtotal: 4500 }],
  },
];

// ─── Credit (outstanding) sales ──────────────────────────────────────────────
export const DEMO_CREDIT_SALES = [
  {
    id: 108, saleType: 'RETAIL', customerName: 'Amara Kumari Silva',
    subtotal: 4500, itemDiscount: 0, cartDiscount: 0, cartDiscountPct: 0,
    total: 4500, paymentMethod: 'CREDIT',
    status: 'CREDIT', createdAt: dt(0, '14:30:00'),
    salesperson: { id: 1, name: 'Demo Owner' },
  },
  {
    id: 95, saleType: 'RETAIL', customerName: 'Priyantha Bandara',
    subtotal: 6500, itemDiscount: 0, cartDiscount: 0, cartDiscountPct: 0,
    total: 6500, paymentMethod: 'CREDIT',
    status: 'CREDIT', createdAt: dt(1, '15:20:00'),
    salesperson: { id: 1, name: 'Demo Owner' },
  },
  {
    id: 82, saleType: 'WHOLESALE', customerName: 'Nimal Jayawardena',
    subtotal: 12400, itemDiscount: 0, cartDiscount: 0, cartDiscountPct: 0,
    total: 12400, paymentMethod: 'CREDIT',
    status: 'CREDIT', createdAt: dt(3, '11:00:00'),
    salesperson: { id: 1, name: 'Demo Owner' },
  },
];

// ─── Expenses ───────────────────────────────────────────────────────────────
export const DEMO_EXPENSES: Expense[] = [
  { id: 1, category: 'TEA',    amount: 350,  note: 'Morning tea break', expenseDate: todayStr(), createdAt: dt(0, '10:00:00') },
  { id: 2, category: 'BUS_FARE', amount: 200, note: 'Staff commute',    expenseDate: todayStr(), createdAt: dt(0, '08:00:00') },
  { id: 3, category: 'SUPPLIER_PAYMENT', amount: 15000, note: 'Lanka Toys Distributors - partial payment',
    expenseDate: todayStr(), createdAt: dt(0, '09:30:00'),
    supplier: { id: 1, name: 'Lanka Toys Distributors', balance: 45000 } },
];

// ─── Purchase Needs ─────────────────────────────────────────────────────────
export const DEMO_PURCHASE_NEEDS: PurchaseNeed[] = [
  {
    id: 1, name: 'Remote Control Cars — restock (12 pcs)',
    quantity: 12, unit: 'pcs', status: 'NEEDED', category: 'PURCHASE',
    storeStatus: 'PENDING', requestedBy: 'salesperson', requestedAt: dt(0, '09:00:00'),
  },
  {
    id: 2, name: 'Sports Water Bottles — replenish shelf',
    quantity: 30, unit: 'pcs', status: 'NEEDED', category: 'STORE',
    storeStatus: 'AVAILABLE', markedAvailableBy: 'storeperson',
    requestedBy: 'salesperson', requestedAt: dt(0, '09:30:00'),
  },
  {
    id: 3, name: 'Baby Bath Tubs',
    quantity: 5, unit: 'pcs', status: 'PURCHASED', category: 'PURCHASE',
    storeStatus: 'PENDING', requestedBy: 'salesperson',
    requestedAt: dt(2, '14:00:00'), resolvedBy: 'owner', resolvedAt: dt(0, '08:00:00'),
  },
  {
    id: 4, name: 'Non-Stick Rice Cookers — new batch',
    quantity: 10, unit: 'pcs', status: 'NEEDED', category: 'PURCHASE',
    storeStatus: 'PENDING', requestedBy: 'salesperson', requestedAt: dt(1, '16:00:00'),
  },
  {
    id: 5, name: 'Footballs — store delivery',
    quantity: 20, unit: 'pcs', status: 'NEEDED', category: 'STORE',
    storeStatus: 'PENDING', requestedBy: 'salesperson', requestedAt: dt(2, '11:00:00'),
  },
];

// ─── Users ──────────────────────────────────────────────────────────────────
export const DEMO_USERS: AppUser[] = [
  { id: 1, name: 'Demo Owner',          username: 'owner',       role: 'OWNER',        active: true },
  { id: 2, name: 'Cashier Nimali',       username: 'cashier',     role: 'CASHIER',      active: true },
  { id: 3, name: 'Salesperson Kavindu', username: 'salesperson', role: 'SALESPERSON',  active: true },
  { id: 4, name: 'Store Person Lakmal', username: 'storeperson', role: 'STORE_PERSON', active: true },
];

// ─── Reports ────────────────────────────────────────────────────────────────
export const DEMO_DAILY_REPORT: DailyReport = {
  date: todayStr(),
  totalSales:     8,
  totalAmount:    36900,
  retailAmount:   22900,
  wholesaleAmount: 14000,
  totalProfit:    11070,
  totalExpenses:  550,
  netProfit:      10520,
  margin:         30.0,
  quickSaleCount: 2,
  quickSaleTotal: 1350,
  salespersonBreakdown: [
    { id: 1, name: 'Demo Owner', salesCount: 8, totalAmount: 36900, profit: 11070 },
  ],
  cashSummary: {
    openingFloat:    5000,
    totalCashSales:  26350,
    quickSaleCash:   1350,
    cashIn:          0,
    cashOut:         0,
    expectedCash:    32700,
    cashOutByReason: {},
  },
  paymentBreakdown: { cash: 26350, card: 2700, credit: 4500 },
};

const buildDailyBreakdown = () => {
  const revenues = [18200, 42600, 31500, 28900, 22400, 38100, 36900];
  const counts   = [6,     14,    10,    9,     7,     12,    8];
  return revenues.map((revenue, i) => ({
    date:       new Date(Date.now() - (6 - i) * 86400000).toISOString().slice(0, 10),
    salesCount: counts[i],
    revenue,
  }));
};

export const DEMO_RANGE_REPORT: RangeReport = {
  from: new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10),
  to:   todayStr(),
  totalSales:     66,
  totalAmount:    218600,
  retailAmount:   148600,
  wholesaleAmount: 70000,
  totalProfit:    65580,
  totalExpenses:  12450,
  netProfit:      53130,
  margin:         30.0,
  dailyBreakdown: buildDailyBreakdown(),
  salespersonBreakdown: [
    { id: 1, name: 'Demo Owner', salesCount: 66, totalAmount: 218600, profit: 65580 },
  ],
  paymentBreakdown: { cash: 162400, card: 31800, credit: 24400 },
};

export const DEMO_PRODUCT_STATS: ProductStat[] = [
  { productId: 7,  productName: 'Football',               category: 'Sports',       qtySold: 32, revenue: 57600,  profit: 24000, margin: 41.7 },
  { productId: 3,  productName: 'Teddy Bear',              category: 'Toys & Games', qtySold: 28, revenue: 33600,  profit: 13440, margin: 40.0 },
  { productId: 8,  productName: "Rubik's Cube",            category: 'Toys & Games', qtySold: 45, revenue: 29250,  profit: 12825, margin: 43.8 },
  { productId: 15, productName: 'Non-Stick Rice Cooker',   category: 'Kitchen & Home', qtySold: 8, revenue: 52000, profit: 18400, margin: 35.4 },
  { productId: 1,  productName: 'Diecast Model Car Set',   category: 'Toys & Games', qtySold: 18, revenue: 32400,  profit: 13500, margin: 41.7 },
  { productId: 6,  productName: 'Remote Control Racing Car', category: 'Toys & Games', qtySold: 6, revenue: 21000, profit:  8400, margin: 40.0 },
  { productId: 13, productName: 'Sports Water Bottle',      category: 'Kitchen & Home', qtySold: 22, revenue: 39600, profit: 16500, margin: 41.7 },
  { productId: 5,  productName: 'Basketball',               category: 'Sports',       qtySold: 12, revenue: 26400,  profit: 10200, margin: 38.6 },
];

export const DEMO_SLOW_STOCK: SlowStockItem[] = [
  { productId: 12, productName: 'Cappuccino Milk Frother', category: 'Kitchen & Home', stockQuantity: 7,  qtySoldInPeriod: 2,  minStockAlert: 2 },
  { productId: 14, productName: 'Baby Bath Tub',           category: 'Baby & Kids',    stockQuantity: 9,  qtySoldInPeriod: 3,  minStockAlert: 2 },
  { productId: 10, productName: 'Scrabble Board Game',     category: 'Toys & Games',   stockQuantity: 10, qtySoldInPeriod: 4,  minStockAlert: 3 },
];

export const DEMO_CASH_FLOW: CashFlowDay[] = buildDailyBreakdown().map(d => ({
  date:        d.date,
  salesCount:  d.salesCount,
  revenue:     d.revenue,
  cashRevenue: Math.round(d.revenue * 0.74),
  expenses:    1780,
  net:         Math.round(d.revenue * 0.74) - 1780,
}));
