import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../core/services/auth.service';
import { LayoutService } from '../../core/services/layout.service';
import { SessionService } from '../../core/services/session.service';
import { CommonModule } from '@angular/common';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  ownerOnly?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, MatIconModule, MatTooltipModule],
  template: `
    <nav class="sidebar" [class.collapsed]="layout.collapsed()">
      <div class="sidebar-logo">
        <img src="assets/logo.png" alt="Ghanim Logo" class="logo-img" />
        @if (!layout.collapsed()) {
          <div class="logo-text">
            <span class="brand">GHANIM</span>
            <span class="sub">ENTERPRISES</span>
          </div>
        }
      </div>

      <ul class="nav-list">
        @for (item of visibleItems; track item.route) {
          <li>
            <a [routerLink]="item.route" routerLinkActive="active" class="nav-item"
               [matTooltip]="layout.collapsed() ? item.label : ''" matTooltipPosition="right">
              <mat-icon>{{ item.icon }}</mat-icon>
              @if (!layout.collapsed()) {
                <span>{{ item.label }}</span>
              }
            </a>
          </li>
        }
      </ul>

      <div class="sidebar-footer">
        @if (!layout.collapsed()) {
          <div class="user-info">
            <div class="user-avatar">{{ auth.currentUser()?.name?.charAt(0) }}</div>
            <div class="user-details">
              <div class="user-name">{{ auth.currentUser()?.name }}</div>
              <div class="user-role">{{ auth.currentUser()?.role === 'OWNER' ? 'Administrator' : 'Cashier' }}</div>
            </div>
          </div>
          <button class="logout-btn" (click)="handleLogout()">
            <mat-icon>logout</mat-icon> Logout
          </button>
        } @else {
          <div class="user-avatar centered" [matTooltip]="auth.currentUser()?.name || ''" matTooltipPosition="right">
            {{ auth.currentUser()?.name?.charAt(0) }}
          </div>
          <button class="logout-btn-icon" (click)="handleLogout()" matTooltip="Logout" matTooltipPosition="right">
            <mat-icon>logout</mat-icon>
          </button>
        }
      </div>
    </nav>
  `,
  styles: [`
    :host {
      display: flex;
      flex-shrink: 0;
    }
    .sidebar {
      width: 195px;
      min-width: 195px;
      background: #1b3050;
      color: #fff;
      display: flex;
      flex-direction: column;
      height: 100vh;
      overflow: hidden;
      transition: width 0.2s ease, min-width 0.2s ease;
    }
    .sidebar.collapsed {
      width: 56px;
      min-width: 56px;
    }

    .sidebar-logo {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 8px;
      border-bottom: 1px solid rgba(255,255,255,0.1);
      flex-shrink: 0;
      min-height: 56px;
    }
    .logo-img {
      width: 38px; height: 38px;
      object-fit: contain; flex-shrink: 0;
      border-radius: 6px;
    }
    .logo-text { display: flex; flex-direction: column; overflow: hidden; }
    .brand { font-size: 11px; font-weight: 700; letter-spacing: 1px; color: #c9a84c; white-space: nowrap; }
    .sub { font-size: 8px; color: rgba(255,255,255,0.4); letter-spacing: 0.5px; white-space: nowrap; }

    .nav-list { list-style: none; padding: 4px 0; flex: 1; overflow-y: auto; overflow-x: hidden; margin: 0; min-height: 0; }
    .nav-item {
      display: flex; align-items: center; gap: 10px;
      padding: 7px 10px 7px 14px;
      color: rgba(255,255,255,0.65);
      text-decoration: none;
      font-size: 12px;
      transition: all 0.15s;
      border-left: 3px solid transparent;
      white-space: nowrap;
    }
    .collapsed .nav-item { padding: 10px; justify-content: center; }
    .nav-item:hover { background: rgba(255,255,255,0.05); color: #fff; }
    .nav-item.active {
      background: rgba(255,255,255,0.1);
      color: #fff;
      border-left-color: #c9a84c;
    }
    .collapsed .nav-item.active { border-left-color: transparent; border-left: none; background: rgba(201,168,76,0.2); border-radius: 6px; margin: 0 4px; }
    .nav-item mat-icon { font-size: 18px; width: 18px; height: 18px; flex-shrink: 0; }

    .sidebar-footer {
      padding: 7px 10px;
      border-top: 1px solid rgba(255,255,255,0.1);
      flex-shrink: 0;
      margin-top: 4px;
    }
    .user-info {
      display: flex; align-items: center; gap: 8px;
      margin-bottom: 5px;
    }
    .user-avatar {
      width: 26px; height: 26px; border-radius: 50%;
      background: #c9a84c; color: #1b3050;
      display: flex; align-items: center; justify-content: center;
      font-size: 11px; font-weight: 700; flex-shrink: 0;
    }
    .user-avatar.centered { margin: 0 auto 6px; cursor: default; }
    .user-details { display: flex; flex-direction: column; min-width: 0; }
    .user-name { font-size: 11px; font-weight: 600; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .user-role { font-size: 9.5px; color: rgba(255,255,255,0.4); }
    .logout-btn {
      display: flex; align-items: center; gap: 6px;
      width: 100%; padding: 4px 8px;
      background: transparent; border: none; border-radius: 5px;
      color: rgba(255,255,255,0.55); cursor: pointer; font-size: 11px;
      transition: all 0.15s; font-family: inherit;
    }
    .logout-btn mat-icon { font-size: 15px; width: 15px; height: 15px; }
    .logout-btn:hover { background: rgba(255,255,255,0.07); color: #fff; }
    .logout-btn-icon {
      display: flex; align-items: center; justify-content: center;
      width: 100%; padding: 6px;
      background: transparent; border: none; border-radius: 5px;
      color: rgba(255,255,255,0.55); cursor: pointer;
      transition: all 0.15s;
    }
    .logout-btn-icon:hover { background: rgba(255,255,255,0.07); color: #fff; }
    .logout-btn-icon mat-icon { font-size: 18px; width: 18px; height: 18px; }
  `]
})
export class SidebarComponent {
  auth = inject(AuthService);
  layout = inject(LayoutService);
  private session = inject(SessionService);
  private router = inject(Router);

  private navItems: NavItem[] = [
    { label: 'POS',          icon: 'point_of_sale',         route: '/pos' },
    { label: 'Products',     icon: 'inventory_2',            route: '/products' },
    { label: 'Customers',    icon: 'people',                 route: '/customers' },
    { label: 'Suppliers',    icon: 'local_shipping',         route: '/suppliers', ownerOnly: true },
    { label: 'Sales History',icon: 'receipt_long',           route: '/sales' },
    { label: 'Credits',      icon: 'account_balance',        route: '/credits' },
    { label: 'Returns',      icon: 'assignment_return',      route: '/returns' },
    { label: 'Warranty',     icon: 'verified_user',          route: '/warranty' },
    { label: 'Close Till',   icon: 'point_of_sale',          route: '/close-till' },
    { label: 'Cash Recon',   icon: 'account_balance_wallet', route: '/cash-reconciliation', ownerOnly: true },
    { label: 'Reports',      icon: 'bar_chart',              route: '/reports', ownerOnly: true },
    { label: 'Expenses',     icon: 'account_balance_wallet', route: '/expenses' },
    { label: 'Settings',     icon: 'settings',               route: '/settings' },
  ];

  get visibleItems(): NavItem[] {
    return this.navItems.filter(i => !i.ownerOnly || this.auth.isOwner());
  }

  handleLogout() {
    if (!this.auth.isOwner() && this.session.currentSession()) {
      this.router.navigate(['/close-till']);
      return;
    }
    this.auth.logout();
  }
}


