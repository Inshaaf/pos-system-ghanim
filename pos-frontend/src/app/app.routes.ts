import { Routes } from '@angular/router';
import { authGuard, ownerGuard, storePersonGuard, needsGuard } from './core/guards/auth.guard';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './core/services/auth.service';

const roleRedirect = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  router.navigate([auth.defaultRoute()]);
  return false;
};

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent) },
  {
    path: '',
    loadComponent: () => import('./layout/main-layout/main-layout.component').then(m => m.MainLayoutComponent),
    canActivate: [authGuard],
    children: [
      { path: 'pos',                 loadComponent: () => import('./features/pos/pos.component').then(m => m.PosComponent) },
      { path: 'products',            loadComponent: () => import('./features/products/product-list/product-list.component').then(m => m.ProductListComponent) },
      { path: 'customers',           loadComponent: () => import('./features/customers/customer-list/customer-list.component').then(m => m.CustomerListComponent) },
      { path: 'suppliers',           loadComponent: () => import('./features/suppliers/supplier-list/supplier-list.component').then(m => m.SupplierListComponent), canActivate: [ownerGuard] },
      { path: 'sales',               loadComponent: () => import('./features/sales/sales-history/sales-history.component').then(m => m.SalesHistoryComponent) },
      { path: 'credits',             loadComponent: () => import('./features/credits/credits.component').then(m => m.CreditsComponent) },
      { path: 'returns',             loadComponent: () => import('./features/returns/return-list/return-list.component').then(m => m.ReturnListComponent) },
      { path: 'warranty',            loadComponent: () => import('./features/warranty/warranty.component').then(m => m.WarrantyComponent) },
      { path: 'close-till',          loadComponent: () => import('./features/close-till/close-till.component').then(m => m.CloseTillComponent) },
      { path: 'cash-reconciliation', loadComponent: () => import('./features/cash-reconciliation/cash-reconciliation.component').then(m => m.CashReconciliationComponent), canActivate: [ownerGuard] },
      { path: 'reports',             loadComponent: () => import('./features/reports/daily-report/daily-report.component').then(m => m.DailyReportComponent), canActivate: [ownerGuard] },
      { path: 'expenses',            loadComponent: () => import('./features/expenses/expenses.component').then(m => m.ExpensesComponent) },
      { path: 'shop-supplies',       loadComponent: () => import('./features/shop-supplies/shop-supplies.component').then(m => m.ShopSuppliesComponent) },
      { path: 'needs',               loadComponent: () => import('./features/needs/needs.component').then(m => m.NeedsComponent), canActivate: [needsGuard] },
      { path: 'store-needs',         loadComponent: () => import('./features/store-needs/store-needs.component').then(m => m.StoreNeedsComponent), canActivate: [storePersonGuard] },
      { path: 'settings',            loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent), canActivate: [ownerGuard] },
      { path: '',                    canActivate: [roleRedirect], component: class {} }
    ]
  },
  { path: '**', redirectTo: 'login' }
];
