import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { TrPipe } from '../../core/tr.pipe';
import { BahtPipe } from '../../core/baht.pipe';

interface Stats { pending: number; ready: number; preparing: number; lowStock: number; monthAmount: number; }

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, TrPipe, BahtPipe],
  template: `
  <h1>{{ 'nav.dashboard' | tr }}</h1>
  <div class="grid cols-4">
    <a routerLink="/approval" class="stat-tile" *ngIf="stats() as s">
      <div class="label">{{ 'dashboard.pending' | tr }}</div>
      <div class="value">{{ s.pending }}</div>
    </a>
    <a routerLink="/warehouse" class="stat-tile" *ngIf="stats() as s">
      <div class="label">{{ 'dashboard.preparing' | tr }}</div>
      <div class="value">{{ s.preparing }}</div>
    </a>
    <a routerLink="/warehouse" class="stat-tile" *ngIf="stats() as s">
      <div class="label">{{ 'dashboard.ready' | tr }}</div>
      <div class="value">{{ s.ready }}</div>
    </a>
    <a routerLink="/inventory" class="stat-tile" *ngIf="stats() as s">
      <div class="label">{{ 'dashboard.lowStock' | tr }}</div>
      <div class="value">{{ s.lowStock }}</div>
    </a>
  </div>

  <div class="stat-tile mt-2" *ngIf="stats() as s">
    <div class="label">{{ 'dashboard.monthTotal' | tr }}</div>
    <div class="value">{{ s.monthAmount | baht }}</div>
  </div>

  <div class="grid cols-3 mt-2">
    <a routerLink="/catalog" class="card action-card">
      <h3>🛒 {{ 'nav.catalog' | tr }}</h3>
      <div class="text-muted">เลือกสินค้าที่ต้องการเบิก</div>
    </a>
    <a routerLink="/my-requests/create" class="card action-card">
      <h3>📝 {{ 'req.createNew' | tr }}</h3>
      <div class="text-muted">เริ่มต้นคำขอเบิกใหม่</div>
    </a>
    <a routerLink="/my-requests" class="card action-card">
      <h3>📋 {{ 'nav.myRequests' | tr }}</h3>
      <div class="text-muted">ติดตามสถานะคำขอของคุณ</div>
    </a>
  </div>
  `,
  styles: [`
  .action-card { display: block; text-decoration: none; color: inherit; }
  .action-card:hover { transform: translateY(-2px); }
  a.stat-tile { text-decoration: none; color: inherit; display: block; }
  a.stat-tile:hover { transform: translateY(-2px); box-shadow: var(--shadow-lg); }
  `],
})
export class DashboardComponent {
  private api = inject(ApiService);
  stats = signal<Stats | null>(null);
  constructor() {
    this.api.get<Stats>('/reports/dashboard').subscribe(s => this.stats.set(s));
  }
}
