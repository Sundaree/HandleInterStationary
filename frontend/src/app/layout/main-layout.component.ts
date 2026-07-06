import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { I18nService } from '../core/i18n.service';
import { TrPipe } from '../core/tr.pipe';
import { BahtPipe } from '../core/baht.pipe';
import { ApiService } from '../core/api.service';

interface DashboardStats {
  monthAmount: number;
  showAmount: boolean;
  role: string;
}

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, TrPipe, BahtPipe],
  template: `
  <div class="layout">
    <header class="topbar">
      <div class="topbar-inner container">
        <div class="brand">
          <div class="logo">SMS</div>
          <div>
            <div class="brand-title">{{ 'app.title' | tr }}</div>
            <div class="brand-sub">{{ 'app.tagline' | tr }}</div>
          </div>
        </div>
        <div class="top-actions">
          <div class="month-amount" *ngIf="auth.canSeeTopbarAmount()"
               [title]="scopeLabel()">
            <span class="amount-scope">{{ scopeLabel() }}</span>
            {{ monthAmount() | baht }}
          </div>
          <button class="lang-btn" (click)="i18n.toggle()">
            {{ i18n.lang() === 'th' ? 'EN' : 'ไทย' }}
          </button>
          <div class="user-info">
            <div class="name">{{ user()?.fullName }}</div>
            <div class="role">{{ user()?.role }} · {{ user()?.companyName }}</div>
          </div>
          <button class="btn btn-outline btn-sm" (click)="logout()">
            {{ 'nav.logout' | tr }}
          </button>
        </div>
      </div>
    </header>

    <div class="body container">
      <nav class="sidebar card">
        <a routerLink="/dashboard" routerLinkActive="active">📊 {{ 'nav.dashboard' | tr }}</a>
        <a routerLink="/catalog" routerLinkActive="active">🛒 {{ 'nav.catalog' | tr }}</a>
        <a routerLink="/my-requests" routerLinkActive="active">📝 {{ 'nav.myRequests' | tr }}</a>
        <a *ngIf="auth.canAccessApproval()" routerLink="/approval" routerLinkActive="active">✅ {{ 'nav.approval' | tr }}</a>
        <a *ngIf="auth.canAccessWarehouse()" routerLink="/warehouse" routerLinkActive="active">📦 {{ 'nav.warehouse' | tr }}</a>
        <a *ngIf="auth.canAccessInventory()" routerLink="/inventory" routerLinkActive="active">📋 {{ 'nav.inventory' | tr }}</a>
        <a *ngIf="auth.canAccessReports()" routerLink="/reports" routerLinkActive="active">📈 {{ 'nav.reports' | tr }}</a>
        <a *ngIf="auth.canAccessAdmin()" routerLink="/admin" routerLinkActive="active">⚙️ {{ 'nav.admin' | tr }}</a>
      </nav>

      <main class="content">
        <router-outlet></router-outlet>
      </main>
    </div>
  </div>
  `,
  styles: [`
  .topbar {
    background: linear-gradient(135deg, var(--blue-900), var(--blue-500));
    color: white;
    box-shadow: var(--shadow-md);
  }
  .topbar-inner {
    display: flex; align-items: center; justify-content: space-between;
    padding: 14px 24px; gap: 16px; flex-wrap: wrap;
  }
  .brand { display: flex; align-items: center; gap: 14px; }
  .logo {
    width: 44px; height: 44px; display: grid; place-items: center;
    background: linear-gradient(135deg, var(--gold-500), var(--gold-300));
    color: var(--blue-900); font-weight: 700; border-radius: 12px;
    box-shadow: var(--shadow-sm);
  }
  .brand-title { font-weight: 600; font-size: 1.05rem; }
  .brand-sub { font-size: 0.78rem; opacity: 0.85; }
  .top-actions { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
  .month-amount {
    background: rgba(255,255,255,0.14); color: var(--gold-300);
    padding: 8px 14px; border-radius: 999px; font-weight: 600; font-size: 0.95rem;
    display: flex; flex-direction: column; align-items: flex-end; line-height: 1.1;
  }
  .amount-scope { color: rgba(255,255,255,0.75); font-size: 0.7rem; font-weight: 300; }
  .lang-btn {
    background: transparent; color: white; border: 1px solid rgba(255,255,255,0.4);
    padding: 6px 12px; border-radius: 8px; cursor: pointer; font-family: inherit;
    transition: background .15s ease;
  }
  .lang-btn:hover { background: rgba(255,255,255,0.15); }
  .user-info { text-align: right; }
  .user-info .name { font-weight: 500; font-size: 0.9rem; }
  .user-info .role { font-size: 0.75rem; opacity: 0.8; }

  .body {
    display: grid; grid-template-columns: 240px 1fr; gap: 20px;
    padding-top: 20px;
  }
  .sidebar {
    display: flex; flex-direction: column; gap: 4px;
    padding: 12px; height: fit-content;
    position: sticky; top: 16px;
  }
  .sidebar a {
    padding: 10px 14px; border-radius: 8px; color: var(--gray-800);
    text-decoration: none; font-size: 0.95rem;
    transition: background .15s ease, color .15s ease;
  }
  .sidebar a:hover { background: var(--blue-100); color: var(--blue-700); }
  .sidebar a.active {
    background: linear-gradient(90deg, var(--blue-500), var(--blue-700));
    color: white; font-weight: 500;
    box-shadow: var(--shadow-sm);
  }
  .content { min-width: 0; }
  @media (max-width: 900px) {
    .body { grid-template-columns: 1fr; }
    .sidebar {
      flex-direction: row; overflow-x: auto; position: static;
    }
    .sidebar a { white-space: nowrap; }
  }
  `],
})
export class MainLayoutComponent {
  auth = inject(AuthService);
  i18n = inject(I18nService);
  private api = inject(ApiService);
  private router = inject(Router);

  user = this.auth.currentUser;
  monthAmount = signal(0);
  scopeLabel = signal('');

  constructor() {
    if (this.auth.canSeeTopbarAmount()) {
      this.api.get<DashboardStats>('/reports/dashboard').subscribe({
        next: s => {
          this.monthAmount.set(s.monthAmount ?? 0);
          const u = this.user();
          if (s.role === 'Executive')          this.scopeLabel.set(u?.companyName ? `${u.companyName} · 30 วัน` : '30 วัน');
          else if (s.role === 'DepartmentManager') this.scopeLabel.set(u?.departmentName ? `แผนก ${u.departmentName} · 30 วัน` : '30 วัน');
          else                                  this.scopeLabel.set('30 วัน');
        },
        error: () => this.monthAmount.set(0),
      });
    }
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
