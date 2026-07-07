import { HttpInterceptorFn, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import {
  DEMO_PRODUCTS, DEMO_CATEGORIES, DEMO_CUSTOMERS, DEMO_SUPPLIERS,
  DEMO_SESSION, DEMO_SALES, DEMO_CREDIT_SALES, DEMO_EXPENSES,
  DEMO_PURCHASE_NEEDS, DEMO_USERS, DEMO_DAILY_REPORT, DEMO_RANGE_REPORT,
  DEMO_PRODUCT_STATS, DEMO_SLOW_STOCK, DEMO_CASH_FLOW, todayStr,
} from './demo-data';

const ok   = (data: any) => of(new HttpResponse({ status: 200, body: { success: true, data } }));
const plain = (data: any) => of(new HttpResponse({ status: 200, body: data }));
const msg  = (message: string) => of(new HttpResponse({ status: 200, body: { success: true, message } }));

let nextSaleId = 200;
let nextNeedId = 10;
let nextExpenseId = 10;

export const demoHttpInterceptor: HttpInterceptorFn = (req, next) => {
  if (localStorage.getItem('pos_token') !== 'DEMO_TOKEN') return next(req);

  const u = req.url;
  const m = req.method;

  // ── Products ─────────────────────────────────────────────────────────────
  if (u.includes('/products/barcode/')) {
    const barcode = u.split('/products/barcode/')[1]?.split('?')[0];
    const p = DEMO_PRODUCTS.find(x => x.barcode === barcode);
    if (!p) return throwError(() => new HttpErrorResponse({ status: 404, error: { message: 'Product not found' } }));
    return ok(p);
  }
  if (u.includes('/products/next-barcode')) return ok('4000016');
  if (/\/products\/\d+/.test(u) && m === 'GET') {
    const id = parseInt(u.match(/\/products\/(\d+)/)![1]);
    return ok(DEMO_PRODUCTS.find(x => x.id === id) ?? null);
  }
  if (u.includes('/products')) return ok(DEMO_PRODUCTS);

  // ── Categories ───────────────────────────────────────────────────────────
  if (u.includes('/categories')) return ok(DEMO_CATEGORIES);

  // ── Suppliers ────────────────────────────────────────────────────────────
  if (u.includes('/suppliers')) return ok(DEMO_SUPPLIERS);

  // ── Salespersons / Temp Workers ──────────────────────────────────────────
  if (u.includes('/salespersons')) return ok([{ id: 1, name: 'Demo Owner', active: true }]);
  if (u.includes('/temp-workers'))  return ok([]);

  // ── App Settings ─────────────────────────────────────────────────────────
  if (u.includes('/app-settings'))  return ok('GHN');

  // ── Upload ───────────────────────────────────────────────────────────────
  if (u.includes('/upload'))        return ok({ url: DEMO_PRODUCTS[0].imageUrl });

  // ── Shop Supplies ────────────────────────────────────────────────────────
  if (u.includes('/shop-supplies')) return ok([]);

  // ── Customers ────────────────────────────────────────────────────────────
  if (/\/customers\/\d+/.test(u) && m === 'GET') {
    const id = parseInt(u.match(/\/customers\/(\d+)/)![1]);
    return ok(DEMO_CUSTOMERS.find(x => x.id === id) ?? null);
  }
  if (u.includes('/customers') && m === 'POST') {
    const body: any = req.body ?? {};
    return ok({ id: 99, ...body, totalPurchases: 0, totalSpent: 0, createdAt: new Date().toISOString() });
  }
  if (u.includes('/customers')) return ok(DEMO_CUSTOMERS);

  // ── Sessions ─────────────────────────────────────────────────────────────
  if (u.includes('/sessions/current')) return ok(DEMO_SESSION);
  if (u.includes('/sessions') && u.includes('/reconciliation')) {
    return ok({
      session: DEMO_SESSION,
      totalCashSales: 26350, totalCardSales: 2700, totalCreditSales: 4500,
      cashMovements: [], openingFloat: 5000, expectedCash: 31350,
    });
  }
  if (u.includes('/sessions') && (u.includes('/close') || u.includes('/submit-count'))) {
    return msg('Session closed successfully');
  }
  if (u.includes('/sessions/open') || (u.includes('/sessions') && m === 'POST')) {
    return ok(DEMO_SESSION);
  }
  if (u.includes('/sessions')) return ok([DEMO_SESSION]);

  // ── Cash movements ───────────────────────────────────────────────────────
  if (u.includes('/cash')) return ok([]);

  // ── Sales ─────────────────────────────────────────────────────────────────
  if (u.includes('/sales/credits')) return ok(DEMO_CREDIT_SALES);
  if (u.includes('/sales/checkout') && m === 'POST') {
    const body: any = req.body ?? {};
    const newSale = {
      id: ++nextSaleId,
      saleType:      body.saleType ?? 'RETAIL',
      customerName:  body.customerName ?? null,
      subtotal:      body.items?.reduce((s: number, i: any) => s + i.quantity * i.unitPrice, 0) ?? 0,
      itemDiscount:  body.items?.reduce((s: number, i: any) => s + i.itemDiscount, 0) ?? 0,
      cartDiscount:  0,
      cartDiscountPct: body.cartDiscountPct ?? 0,
      total:         body.items?.reduce((s: number, i: any) => s + i.quantity * i.unitPrice - i.itemDiscount, 0) ?? 0,
      paymentMethod: body.paymentMethod ?? 'CASH',
      cashTendered:  body.cashTendered ?? null,
      changeAmount:  body.cashTendered ? body.cashTendered - (body.items?.reduce((s: number, i: any) => s + i.quantity * i.unitPrice - i.itemDiscount, 0) ?? 0) : null,
      status:        body.paymentMethod === 'CREDIT' ? 'CREDIT' : 'COMPLETED',
      createdAt:     new Date().toISOString(),
      salesperson:   { id: 1, name: 'Demo Owner' },
      items:         (body.items ?? []).map((i: any, idx: number) => ({
        id:          idx + 1,
        productName: DEMO_PRODUCTS.find(p => p.id === i.productId)?.name ?? 'Product',
        quantity:    i.quantity,
        unitPrice:   i.unitPrice,
        priceType:   i.priceType,
        itemDiscount: i.itemDiscount,
        subtotal:    i.quantity * i.unitPrice - i.itemDiscount,
      })),
    };
    return ok(newSale);
  }
  if (/\/sales\/\d+/.test(u) && m === 'GET') {
    const id = parseInt(u.match(/\/sales\/(\d+)/)![1]);
    return ok(DEMO_SALES.find(x => x.id === id) ?? DEMO_SALES[0]);
  }
  if (u.includes('/sales') && (m === 'POST')) return ok({ id: ++nextSaleId, status: 'COMPLETED' });
  if (u.includes('/sales')) return ok(DEMO_SALES);

  // ── Quick Sales ───────────────────────────────────────────────────────────
  if (u.includes('/quick-sales') && m === 'POST') return ok({ id: 300, status: 'COMPLETED' });
  if (u.includes('/quick-sales')) return ok([]);

  // ── Returns ───────────────────────────────────────────────────────────────
  if (u.includes('/returns')) return ok([]);

  // ── Held Sales ────────────────────────────────────────────────────────────
  if (u.includes('/held-sales') && m === 'POST') return ok({ id: 400 });
  if (u.includes('/held-sales')) return ok([]);

  // ── Expenses ─────────────────────────────────────────────────────────────
  if (u.includes('/expenses/range')) return ok(DEMO_EXPENSES);
  if (u.includes('/expenses/summary')) return ok({ TEA: 350, BUS_FARE: 200, SUPPLIER_PAYMENT: 15000 });
  if (/\/expenses\/\d+/.test(u) && m === 'DELETE') return ok(null);
  if (u.includes('/expenses') && m === 'POST') {
    const body: any = req.body ?? {};
    return ok({ id: ++nextExpenseId, ...body, expenseDate: todayStr(), createdAt: new Date().toISOString() });
  }
  if (u.includes('/expenses')) return ok(DEMO_EXPENSES);

  // ── Reports ───────────────────────────────────────────────────────────────
  if (u.includes('/reports/daily'))      return ok(DEMO_DAILY_REPORT);
  if (u.includes('/reports/range'))      return ok(DEMO_RANGE_REPORT);
  if (u.includes('/reports/products'))   return ok(DEMO_PRODUCT_STATS);
  if (u.includes('/reports/slow-stock')) return ok(DEMO_SLOW_STOCK);
  if (u.includes('/reports/cash-flow'))  return ok(DEMO_CASH_FLOW);

  // ── Users ─────────────────────────────────────────────────────────────────
  if (u.includes('/users') && m === 'PATCH') return ok(DEMO_USERS[0]);
  if (u.includes('/users')) return ok(DEMO_USERS);

  // ── Purchase Needs ────────────────────────────────────────────────────────
  if (/\/purchase-needs\/\d+/.test(u)) {
    if (m === 'DELETE') return plain(null);
    const id = parseInt(u.match(/\/purchase-needs\/(\d+)/)![1]);
    const need = DEMO_PURCHASE_NEEDS.find(x => x.id === id);
    const body: any = req.body ?? {};
    if (need) {
      if (u.includes('/store-status')) return plain({ ...need, storeStatus: body.storeStatus ?? 'PENDING' });
      if (u.includes('/status'))       return plain({ ...need, status: body.status ?? 'PURCHASED', resolvedBy: body.resolvedBy });
      if (u.includes('/category'))     return plain({ ...need, category: body.category });
      if (u.includes('/re-request'))   return plain({ ...need, status: 'NEEDED', resolvedBy: null, resolvedAt: null });
    }
    return plain(need ?? DEMO_PURCHASE_NEEDS[0]);
  }
  if (u.includes('/purchase-needs') && m === 'POST') {
    const body: any = req.body ?? {};
    return plain({ id: ++nextNeedId, ...body, status: 'NEEDED', storeStatus: 'PENDING', requestedAt: new Date().toISOString() });
  }
  if (u.includes('/purchase-needs')) return plain(DEMO_PURCHASE_NEEDS);

  // ── Catch-all ─────────────────────────────────────────────────────────────
  if (m === 'GET') return ok([]);
  return ok(req.body ?? {});
};
