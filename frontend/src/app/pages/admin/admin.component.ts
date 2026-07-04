import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { TrPipe } from '../../core/tr.pipe';
import { BahtPipe } from '../../core/baht.pipe';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, TrPipe, BahtPipe],
  template: `
  <h1>{{ 'nav.admin' | tr }}</h1>

  <div class="tabs">
    <button class="tab" [class.active]="tab() === 'users'"     (click)="switch('users')">👤 {{ 'admin.users' | tr }}</button>
    <button class="tab" [class.active]="tab() === 'companies'" (click)="switch('companies')">🏢 {{ 'admin.companies' | tr }}</button>
    <button class="tab" [class.active]="tab() === 'departments'" (click)="switch('departments')">🗂️ {{ 'admin.departments' | tr }}</button>
    <button class="tab" [class.active]="tab() === 'items'"     (click)="switch('items')">📦 {{ 'admin.items' | tr }}</button>
    <button class="tab" [class.active]="tab() === 'categories'"(click)="switch('categories')">🏷️ {{ 'admin.categories' | tr }}</button>
    <button class="tab" [class.active]="tab() === 'workflows'" (click)="switch('workflows')">🔄 {{ 'admin.workflows' | tr }}</button>
    <button class="tab" [class.active]="tab() === 'notifications'" (click)="switch('notifications')">🔔 {{ 'admin.notifications' | tr }}</button>
    <button class="tab" [class.active]="tab() === 'settings'"  (click)="switch('settings')">⚙️ {{ 'admin.settings' | tr }}</button>
  </div>

  <table *ngIf="tab() === 'users'">
    <thead><tr><th>{{ 'common.name' | tr }}</th><th>{{ 'common.email' | tr }}</th><th>{{ 'common.role' | tr }}</th><th>{{ 'common.company' | tr }}</th><th>{{ 'common.department' | tr }}</th><th>สถานะ</th></tr></thead>
    <tbody>
      <tr *ngFor="let u of data()">
        <td>{{ u.fullName }}</td><td>{{ u.email }}</td>
        <td><span class="badge badge-blue">{{ u.role }}</span></td>
        <td>{{ u.company }}</td><td>{{ u.department }}</td>
        <td>{{ u.isActive ? '✅ Active' : '❌ Inactive' }}</td>
      </tr>
    </tbody>
  </table>

  <table *ngIf="tab() === 'companies'">
    <thead><tr><th>Code</th><th>{{ 'common.name' | tr }}</th></tr></thead>
    <tbody><tr *ngFor="let c of data()"><td>{{ c.code }}</td><td>{{ c.name }}</td></tr></tbody>
  </table>

  <table *ngIf="tab() === 'departments'">
    <thead><tr><th>{{ 'common.name' | tr }}</th><th>{{ 'common.company' | tr }}</th><th>หัวหน้าแผนก</th></tr></thead>
    <tbody><tr *ngFor="let d of data()"><td>{{ d.name }}</td><td>{{ d.company }}</td><td>{{ d.manager || '—' }}</td></tr></tbody>
  </table>

  <table *ngIf="tab() === 'items'">
    <thead><tr><th>{{ 'common.sku' | tr }}</th><th>{{ 'common.name' | tr }}</th><th>{{ 'common.category' | tr }}</th><th>{{ 'catalog.unit' | tr }}</th><th class="text-right">{{ 'catalog.price' | tr }}</th><th>คงเหลือ</th><th>Reorder</th></tr></thead>
    <tbody>
      <tr *ngFor="let i of data()">
        <td>{{ i.sku }}</td><td>{{ i.name }}</td><td>{{ i.category }}</td>
        <td>{{ i.unit }}</td><td class="text-right">{{ i.unitPrice | baht }}</td>
        <td>{{ i.stockQty }}</td><td>{{ i.reorderLevel }}</td>
      </tr>
    </tbody>
  </table>

  <table *ngIf="tab() === 'categories'">
    <thead><tr><th>ไทย</th><th>English</th></tr></thead>
    <tbody><tr *ngFor="let c of data()"><td>{{ c.name }}</td><td>{{ c.nameEn }}</td></tr></tbody>
  </table>

  <table *ngIf="tab() === 'workflows'">
    <thead><tr><th>{{ 'common.name' | tr }}</th><th>ยอดขั้นต่ำ</th><th>คำอธิบาย</th></tr></thead>
    <tbody>
      <tr *ngFor="let w of data()">
        <td>{{ w.name }}</td><td>{{ w.amountThreshold | baht }}</td><td>{{ w.description }}</td>
      </tr>
    </tbody>
  </table>

  <div *ngIf="tab() === 'notifications'" class="card">
    <p class="text-muted">ระบบส่งอีเมลและแจ้งเตือนบนเว็บอัตโนมัติเมื่อสถานะคำขอเปลี่ยน</p>
    <ul>
      <li>เมื่อพนักงานส่งคำขอ → แจ้งเตือน "หัวหน้าแผนก"</li>
      <li>เมื่อผู้อนุมัติดำเนินการ → แจ้งเตือน "ผู้ขอ"</li>
      <li>เมื่อ HR ระบุวันรับของ → แจ้งเตือน "ผู้ขอ" พร้อมวัน/เวลา/สถานที่</li>
    </ul>
  </div>

  <table *ngIf="tab() === 'settings'">
    <thead><tr><th>Key</th><th>Value</th><th>คำอธิบาย</th></tr></thead>
    <tbody><tr *ngFor="let s of data()"><td>{{ s.key }}</td><td>{{ s.value }}</td><td>{{ s.description }}</td></tr></tbody>
  </table>
  `,
  styles: [`
  .tabs { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
  .tab { background: white; border: 1px solid var(--gray-200); padding: 8px 14px;
    border-radius: 999px; cursor: pointer; font-family: inherit; }
  .tab.active { background: linear-gradient(135deg, var(--blue-500), var(--blue-700)); color: white; }
  `],
})
export class AdminComponent {
  private api = inject(ApiService);
  tab = signal<string>('users');
  data = signal<any[]>([]);
  constructor() { this.load('users'); }

  switch(name: string) { this.tab.set(name); this.load(name); }

  load(name: string) {
    const map: Record<string, string> = {
      users: '/admin/users',
      companies: '/admin/companies',
      departments: '/admin/departments',
      items: '/admin/items',
      categories: '/admin/categories',
      workflows: '/admin/workflows',
      settings: '/admin/settings',
    };
    if (name === 'notifications') { this.data.set([]); return; }
    this.api.get<any[]>(map[name]!).subscribe(v => this.data.set(v));
  }
}
