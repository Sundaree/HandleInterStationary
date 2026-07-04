import { Component, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { TrPipe } from '../../core/tr.pipe';
import { BahtPipe } from '../../core/baht.pipe';

interface Summary {
  totalAmount: number; totalRequests: number; lowStock: number;
  byCompany: { company: string; amount: number; requests: number }[];
  byDept: { company: string; department: string; amount: number; requests: number }[];
  topItems: { item: string; qty: number; amount: number }[];
  from: string; to: string;
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, TrPipe, BahtPipe],
  template: `
  <h1>{{ 'rep.title' | tr }}</h1>

  <div class="card filter">
    <div class="grid cols-3">
      <div><label>{{ 'rep.from' | tr }}</label><input type="date" [(ngModel)]="from" /></div>
      <div><label>{{ 'rep.to' | tr }}</label><input type="date" [(ngModel)]="to" /></div>
      <div style="align-self:end">
        <button class="btn btn-primary" (click)="load()">{{ 'rep.apply' | tr }}</button>
      </div>
    </div>
  </div>

  <div *ngIf="s() as d">
    <div class="grid cols-3">
      <div class="stat-tile">
        <div class="label">ยอดใช้เงินรวม</div>
        <div class="value">{{ d.totalAmount | baht }}</div>
      </div>
      <div class="stat-tile">
        <div class="label">จำนวนคำขอ</div>
        <div class="value">{{ d.totalRequests }}</div>
      </div>
      <div class="stat-tile">
        <div class="label">สินค้าสต๊อกต่ำ</div>
        <div class="value">{{ d.lowStock }}</div>
      </div>
    </div>

    <div class="grid cols-2 mt-2">
      <div class="card">
        <h3>{{ 'rep.byCompany' | tr }}</h3>
        <table>
          <thead><tr><th>{{ 'common.company' | tr }}</th><th>คำขอ</th><th class="text-right">ยอด</th></tr></thead>
          <tbody>
            <tr *ngFor="let r of d.byCompany">
              <td>{{ r.company }}</td>
              <td>{{ r.requests }}</td>
              <td class="text-right"><strong>{{ r.amount | baht }}</strong></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="card">
        <h3>{{ 'rep.byDept' | tr }}</h3>
        <table>
          <thead><tr><th>{{ 'common.department' | tr }}</th><th>{{ 'common.company' | tr }}</th><th class="text-right">ยอด</th></tr></thead>
          <tbody>
            <tr *ngFor="let r of d.byDept">
              <td>{{ r.department }}</td>
              <td>{{ r.company }}</td>
              <td class="text-right"><strong>{{ r.amount | baht }}</strong></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="card mt-2">
      <h3>{{ 'rep.topItems' | tr }}</h3>
      <table>
        <thead><tr><th>{{ 'common.item' | tr }}</th><th>จำนวน</th><th class="text-right">ยอด</th></tr></thead>
        <tbody>
          <tr *ngFor="let r of d.topItems">
            <td>{{ r.item }}</td>
            <td>{{ r.qty }}</td>
            <td class="text-right">{{ r.amount | baht }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
  `,
})
export class ReportsComponent {
  private api = inject(ApiService);
  from = ''; to = '';
  s = signal<Summary | null>(null);
  constructor() {
    const now = new Date();
    const start = new Date(); start.setMonth(now.getMonth() - 1);
    this.from = start.toISOString().substring(0, 10);
    this.to = now.toISOString().substring(0, 10);
    this.load();
  }
  load() {
    const params: Record<string, string> = {};
    if (this.from) params['from'] = this.from;
    if (this.to) params['to'] = this.to;
    this.api.get<Summary>('/reports/summary', params).subscribe(v => this.s.set(v));
  }
}
