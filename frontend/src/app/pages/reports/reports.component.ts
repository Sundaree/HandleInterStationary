import { Component, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { TrPipe } from '../../core/tr.pipe';
import { BahtPipe } from '../../core/baht.pipe';

interface Summary {
  totalAmount: number; totalRequests: number; lowStock: number;
  byCompany: { company: string; amount: number; requests: number }[];
  byDept: { company: string; department: string; amount: number; requests: number }[];
  topItems: { item: string; qty: number; amount: number }[];
  from: string; to: string;
  scope: string; scopeName?: string;
}

interface AnnualReport {
  year: number;
  company: string;
  totalAmount: number;
  totalRequests: number;
  byMonth: { month: number; amount: number; requests: number }[];
  byDept: { department: string; amount: number; requests: number }[];
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, TrPipe, BahtPipe],
  template: `
  <h1>{{ 'rep.title' | tr }}</h1>

  <div class="tabs">
    <button class="tab" [class.active]="tab() === 'summary'" (click)="tab.set('summary')">
      📊 สรุปตามช่วงเวลา
    </button>
    <button class="tab" [class.active]="tab() === 'annual'"
            *ngIf="auth.isCeo() || auth.isAdmin()"
            (click)="loadAnnual()">
      📅 รายงานประจำปี{{ auth.isCeo() ? ' (บริษัทของคุณ)' : '' }}
    </button>
  </div>

  <!-- Summary tab -->
  <ng-container *ngIf="tab() === 'summary'">
    <div class="card filter">
      <div class="grid cols-3">
        <div><label>{{ 'rep.from' | tr }}</label><input type="date" [(ngModel)]="from" /></div>
        <div><label>{{ 'rep.to' | tr }}</label><input type="date" [(ngModel)]="to" /></div>
        <div style="align-self:end">
          <button class="btn btn-primary" (click)="load()">{{ 'rep.apply' | tr }}</button>
        </div>
      </div>
      <div class="text-muted mt-2" *ngIf="s() as d">
        ขอบเขต:
        <strong *ngIf="d.scope === 'Executive'">บริษัท {{ d.scopeName }}</strong>
        <strong *ngIf="d.scope === 'DepartmentManager'">แผนก {{ d.scopeName }}</strong>
        <strong *ngIf="d.scope === 'HR' || d.scope === 'Admin'">ทุกบริษัท</strong>
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
        <div class="card" *ngIf="d.byCompany.length > 0">
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
        <div class="card" *ngIf="d.byDept.length > 0">
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

      <div class="card mt-2" *ngIf="d.topItems.length > 0">
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
  </ng-container>

  <!-- Annual tab -->
  <ng-container *ngIf="tab() === 'annual'">
    <div class="card filter">
      <div class="flex gap-2">
        <div>
          <label>เลือกปี ค.ศ.</label>
          <select [(ngModel)]="year" (ngModelChange)="loadAnnual()">
            <option *ngFor="let y of yearOptions" [ngValue]="y">{{ y }}</option>
          </select>
        </div>
      </div>
    </div>

    <div *ngIf="ann() as a">
      <div class="stat-tile">
        <div class="label">ยอดเบิก-จ่ายเครื่องเขียนประจำปี {{ a.year }} — {{ a.company }}</div>
        <div class="value">{{ a.totalAmount | baht }}</div>
        <div class="text-muted" style="font-size:0.85rem">
          จำนวนคำขอทั้งหมด {{ a.totalRequests }} รายการ
        </div>
      </div>

      <div class="card mt-2">
        <h3>📈 ยอดใช้จ่ายรายเดือน</h3>
        <div class="month-chart">
          <div class="month-bar" *ngFor="let m of a.byMonth" [title]="monthName(m.month) + ': ' + (m.amount | baht)">
            <div class="bar-value">{{ m.amount > 0 ? (m.amount | baht) : '' }}</div>
            <div class="bar" [style.height.%]="barHeight(m.amount, a.byMonth)"></div>
            <div class="bar-label">{{ monthName(m.month) }}</div>
          </div>
        </div>
        <table class="mt-2">
          <thead><tr><th>เดือน</th><th>คำขอ</th><th class="text-right">ยอด</th></tr></thead>
          <tbody>
            <tr *ngFor="let m of a.byMonth">
              <td>{{ monthName(m.month) }}</td>
              <td>{{ m.requests }}</td>
              <td class="text-right"><strong>{{ m.amount | baht }}</strong></td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td>รวม</td>
              <td>{{ a.totalRequests }}</td>
              <td class="text-right"><strong class="text-gold">{{ a.totalAmount | baht }}</strong></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div class="card mt-2" *ngIf="a.byDept.length > 0">
        <h3>🏢 ยอดรวมรายแผนก ({{ a.year }})</h3>
        <table>
          <thead><tr><th>{{ 'common.department' | tr }}</th><th>คำขอ</th><th class="text-right">ยอด</th></tr></thead>
          <tbody>
            <tr *ngFor="let d of a.byDept">
              <td>{{ d.department }}</td>
              <td>{{ d.requests }}</td>
              <td class="text-right"><strong>{{ d.amount | baht }}</strong></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </ng-container>
  `,
  styles: [`
  .tabs { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
  .tab { background: white; border: 1px solid var(--gray-200); padding: 8px 14px;
    border-radius: 999px; cursor: pointer; font-family: inherit; }
  .tab.active { background: linear-gradient(135deg, var(--blue-500), var(--blue-700)); color: white; }
  .month-chart {
    display: grid; grid-template-columns: repeat(12, 1fr); gap: 6px;
    align-items: end; height: 220px; padding: 12px 0;
    border-bottom: 1px solid var(--gray-200);
  }
  .month-bar { display: flex; flex-direction: column; align-items: center; justify-content: flex-end; height: 100%; }
  .bar {
    width: 70%; min-height: 4px;
    background: linear-gradient(180deg, var(--gold-300), var(--gold-500));
    border-radius: 4px 4px 0 0;
    transition: height .3s ease;
    box-shadow: var(--shadow-sm);
  }
  .bar-label { font-size: 0.75rem; color: var(--gray-500); margin-top: 4px; }
  .bar-value { font-size: 0.7rem; color: var(--blue-700); margin-bottom: 2px; }
  `],
})
export class ReportsComponent {
  private api = inject(ApiService);
  auth = inject(AuthService);
  tab = signal<'summary' | 'annual'>('summary');
  from = ''; to = '';
  year = new Date().getFullYear();
  yearOptions = [this.year, this.year - 1, this.year - 2];
  s = signal<Summary | null>(null);
  ann = signal<AnnualReport | null>(null);

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
  loadAnnual() {
    this.tab.set('annual');
    this.api.get<AnnualReport>('/reports/annual', { year: this.year }).subscribe(v => this.ann.set(v));
  }
  monthName(m: number): string {
    const th = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
    return th[m - 1] ?? String(m);
  }
  barHeight(v: number, all: { amount: number }[]): number {
    const max = Math.max(1, ...all.map(a => a.amount));
    return Math.max(2, (v / max) * 100);
  }
}
