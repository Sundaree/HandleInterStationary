import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { TrPipe } from '../../core/tr.pipe';
import { BahtPipe } from '../../core/baht.pipe';

type Tab = 'users' | 'companies' | 'departments' | 'items'
         | 'categories' | 'workflows' | 'notifications' | 'settings';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, TrPipe, BahtPipe],
  template: `
  <h1>{{ 'nav.admin' | tr }}</h1>

  <div class="notice card" *ngIf="!auth.isAdmin()">
    ⚠️ หน้านี้อ่านได้เท่านั้น (ต้องเป็น Admin ถึงจะเพิ่ม/แก้/ลบได้)
  </div>

  <div class="tabs">
    <button class="tab" [class.active]="tab() === 'users'"        (click)="switch('users')">👤 {{ 'admin.users' | tr }}</button>
    <button class="tab" [class.active]="tab() === 'companies'"    (click)="switch('companies')">🏢 {{ 'admin.companies' | tr }}</button>
    <button class="tab" [class.active]="tab() === 'departments'"  (click)="switch('departments')">🗂️ {{ 'admin.departments' | tr }}</button>
    <button class="tab" [class.active]="tab() === 'items'"        (click)="switch('items')">📦 {{ 'admin.items' | tr }}</button>
    <button class="tab" [class.active]="tab() === 'categories'"   (click)="switch('categories')">🏷️ {{ 'admin.categories' | tr }}</button>
    <button class="tab" [class.active]="tab() === 'workflows'"    (click)="switch('workflows')">🔄 {{ 'admin.workflows' | tr }}</button>
    <button class="tab" [class.active]="tab() === 'notifications'" (click)="switch('notifications')">🔔 {{ 'admin.notifications' | tr }}</button>
    <button class="tab" [class.active]="tab() === 'settings'"     (click)="switch('settings')">⚙️ {{ 'admin.settings' | tr }}</button>
  </div>

  <div *ngIf="message()" class="card" [class.err]="isError()">
    {{ message() }}
    <button class="btn btn-sm btn-outline" (click)="message.set('')">×</button>
  </div>

  <!-- ========== USERS ========== -->
  <div *ngIf="tab() === 'users'">
    <div class="card" *ngIf="auth.isAdmin()">
      <h3>{{ editingId() ? 'แก้ไขผู้ใช้' : '+ เพิ่มผู้ใช้ใหม่' }}</h3>
      <div class="grid cols-3">
        <div><label>{{ 'common.name' | tr }}</label><input [(ngModel)]="userForm.fullName" /></div>
        <div><label>{{ 'common.email' | tr }}</label><input [(ngModel)]="userForm.email" /></div>
        <div><label>{{ 'common.role' | tr }}</label>
          <select [(ngModel)]="userForm.role">
            <option value="Employee">Employee</option>
            <option value="DepartmentManager">DepartmentManager</option>
            <option value="HR">HR</option>
            <option value="Admin">Admin</option>
            <option value="Executive">Executive (CEO)</option>
          </select>
        </div>
        <div><label>{{ 'common.company' | tr }}</label>
          <select [(ngModel)]="userForm.companyId">
            <option [ngValue]="0">--</option>
            <option *ngFor="let c of companies()" [ngValue]="c.id">{{ c.name }}</option>
          </select>
        </div>
        <div><label>{{ 'common.department' | tr }}</label>
          <select [(ngModel)]="userForm.departmentId">
            <option [ngValue]="null">--</option>
            <option *ngFor="let d of deptsInCompany()" [ngValue]="d.id">{{ d.name }}</option>
          </select>
        </div>
        <div><label>สถานะ</label>
          <select [(ngModel)]="userForm.isActive">
            <option [ngValue]="true">Active</option>
            <option [ngValue]="false">Inactive</option>
          </select>
        </div>
      </div>
      <div class="flex mt-2">
        <button class="btn btn-primary" (click)="saveUser()">{{ 'common.save' | tr }}</button>
        <button class="btn btn-outline" (click)="resetUserForm()">{{ 'common.cancel' | tr }}</button>
      </div>
    </div>

    <table>
      <thead><tr><th>{{ 'common.name' | tr }}</th><th>{{ 'common.email' | tr }}</th><th>{{ 'common.role' | tr }}</th><th>{{ 'common.company' | tr }}</th><th>{{ 'common.department' | tr }}</th><th>สถานะ</th><th *ngIf="auth.isAdmin()">{{ 'common.actions' | tr }}</th></tr></thead>
      <tbody>
        <tr *ngFor="let u of data()">
          <td>{{ u.fullName }}</td>
          <td>{{ u.email }}</td>
          <td><span class="badge badge-blue">{{ u.role }}</span></td>
          <td>{{ u.company }}</td>
          <td>{{ u.department || '—' }}</td>
          <td>{{ u.isActive ? '✅' : '❌' }}</td>
          <td *ngIf="auth.isAdmin()">
            <button class="btn btn-outline btn-sm" (click)="editUser(u)">แก้ไข</button>
            <button class="btn btn-danger btn-sm" (click)="del('users', u.id)">ลบ</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- ========== COMPANIES ========== -->
  <div *ngIf="tab() === 'companies'">
    <div class="card" *ngIf="auth.isAdmin()">
      <h3>{{ editingId() ? 'แก้ไขบริษัท' : '+ เพิ่มบริษัทใหม่' }}</h3>
      <div class="grid cols-3">
        <div><label>รหัส</label><input [(ngModel)]="companyForm.code" /></div>
        <div><label>{{ 'common.name' | tr }}</label><input [(ngModel)]="companyForm.name" /></div>
      </div>
      <div class="flex mt-2">
        <button class="btn btn-primary" (click)="saveCompany()">{{ 'common.save' | tr }}</button>
        <button class="btn btn-outline" (click)="resetCompanyForm()">{{ 'common.cancel' | tr }}</button>
      </div>
    </div>

    <table>
      <thead><tr><th>Code</th><th>{{ 'common.name' | tr }}</th><th *ngIf="auth.isAdmin()">{{ 'common.actions' | tr }}</th></tr></thead>
      <tbody>
        <tr *ngFor="let c of data()">
          <td>{{ c.code }}</td>
          <td>{{ c.name }}</td>
          <td *ngIf="auth.isAdmin()">
            <button class="btn btn-outline btn-sm" (click)="editCompany(c)">แก้ไข</button>
            <button class="btn btn-danger btn-sm" (click)="del('companies', c.id)">ลบ</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- ========== DEPARTMENTS ========== -->
  <div *ngIf="tab() === 'departments'">
    <div class="card" *ngIf="auth.isAdmin()">
      <h3>{{ editingId() ? 'แก้ไขแผนก' : '+ เพิ่มแผนกใหม่' }}</h3>
      <div class="grid cols-3">
        <div><label>{{ 'common.name' | tr }}</label><input [(ngModel)]="deptForm.name" /></div>
        <div><label>{{ 'common.company' | tr }}</label>
          <select [(ngModel)]="deptForm.companyId">
            <option [ngValue]="0">--</option>
            <option *ngFor="let c of companies()" [ngValue]="c.id">{{ c.name }}</option>
          </select>
        </div>
        <div><label>หัวหน้าแผนก</label>
          <select [(ngModel)]="deptForm.managerUserId">
            <option [ngValue]="null">--</option>
            <option *ngFor="let u of managerCandidates()" [ngValue]="u.id">{{ u.fullName }}</option>
          </select>
        </div>
      </div>
      <div class="flex mt-2">
        <button class="btn btn-primary" (click)="saveDept()">{{ 'common.save' | tr }}</button>
        <button class="btn btn-outline" (click)="resetDeptForm()">{{ 'common.cancel' | tr }}</button>
      </div>
    </div>

    <table>
      <thead><tr><th>{{ 'common.name' | tr }}</th><th>{{ 'common.company' | tr }}</th><th>หัวหน้าแผนก</th><th *ngIf="auth.isAdmin()">{{ 'common.actions' | tr }}</th></tr></thead>
      <tbody>
        <tr *ngFor="let d of data()">
          <td>{{ d.name }}</td>
          <td>{{ d.company }}</td>
          <td>{{ d.manager || '—' }}</td>
          <td *ngIf="auth.isAdmin()">
            <button class="btn btn-outline btn-sm" (click)="editDept(d)">แก้ไข</button>
            <button class="btn btn-danger btn-sm" (click)="del('departments', d.id)">ลบ</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- ========== ITEMS ========== -->
  <div *ngIf="tab() === 'items'">
    <div class="card" *ngIf="auth.isAdmin()">
      <h3>{{ editingId() ? 'แก้ไขสินค้า' : '+ เพิ่มสินค้าใหม่' }}</h3>
      <div class="grid cols-3">
        <div><label>SKU</label><input [(ngModel)]="itemForm.sku" /></div>
        <div><label>ชื่อไทย</label><input [(ngModel)]="itemForm.name" /></div>
        <div><label>ชื่ออังกฤษ</label><input [(ngModel)]="itemForm.nameEn" /></div>
        <div><label>{{ 'common.category' | tr }}</label>
          <select [(ngModel)]="itemForm.categoryId">
            <option [ngValue]="0">--</option>
            <option *ngFor="let c of categories()" [ngValue]="c.id">{{ c.name }}</option>
          </select>
        </div>
        <div><label>หน่วย</label><input [(ngModel)]="itemForm.unit" /></div>
        <div><label>ราคา/หน่วย</label><input type="number" [(ngModel)]="itemForm.unitPrice" /></div>
        <div><label>คงเหลือ</label><input type="number" [(ngModel)]="itemForm.stockQty" /></div>
        <div><label>Reorder Level</label><input type="number" [(ngModel)]="itemForm.reorderLevel" /></div>
        <div><label>สถานะ</label>
          <select [(ngModel)]="itemForm.isActive">
            <option [ngValue]="true">Active</option><option [ngValue]="false">Inactive</option>
          </select>
        </div>
      </div>
      <div class="flex mt-2">
        <button class="btn btn-primary" (click)="saveItem()">{{ 'common.save' | tr }}</button>
        <button class="btn btn-outline" (click)="resetItemForm()">{{ 'common.cancel' | tr }}</button>
      </div>
    </div>

    <table>
      <thead><tr><th>SKU</th><th>{{ 'common.name' | tr }}</th><th>{{ 'common.category' | tr }}</th><th>หน่วย</th><th class="text-right">ราคา</th><th>คงเหลือ</th><th>สถานะ</th><th *ngIf="auth.isAdmin()">{{ 'common.actions' | tr }}</th></tr></thead>
      <tbody>
        <tr *ngFor="let i of data()">
          <td>{{ i.sku }}</td>
          <td>{{ i.name }}</td>
          <td>{{ i.category }}</td>
          <td>{{ i.unit }}</td>
          <td class="text-right">{{ i.unitPrice | baht }}</td>
          <td>{{ i.stockQty }}</td>
          <td>{{ i.isActive ? '✅' : '❌' }}</td>
          <td *ngIf="auth.isAdmin()">
            <button class="btn btn-outline btn-sm" (click)="editItem(i)">แก้ไข</button>
            <button class="btn btn-danger btn-sm" (click)="del('items', i.id)">ลบ</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- ========== CATEGORIES ========== -->
  <div *ngIf="tab() === 'categories'">
    <div class="card" *ngIf="auth.isAdmin()">
      <h3>{{ editingId() ? 'แก้ไขหมวดหมู่' : '+ เพิ่มหมวดหมู่ใหม่' }}</h3>
      <div class="grid cols-2">
        <div><label>ชื่อไทย</label><input [(ngModel)]="catForm.name" /></div>
        <div><label>ชื่ออังกฤษ</label><input [(ngModel)]="catForm.nameEn" /></div>
      </div>
      <div class="flex mt-2">
        <button class="btn btn-primary" (click)="saveCat()">{{ 'common.save' | tr }}</button>
        <button class="btn btn-outline" (click)="resetCatForm()">{{ 'common.cancel' | tr }}</button>
      </div>
    </div>

    <table>
      <thead><tr><th>ไทย</th><th>English</th><th *ngIf="auth.isAdmin()">{{ 'common.actions' | tr }}</th></tr></thead>
      <tbody>
        <tr *ngFor="let c of data()">
          <td>{{ c.name }}</td>
          <td>{{ c.nameEn }}</td>
          <td *ngIf="auth.isAdmin()">
            <button class="btn btn-outline btn-sm" (click)="editCat(c)">แก้ไข</button>
            <button class="btn btn-danger btn-sm" (click)="del('categories', c.id)">ลบ</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- ========== WORKFLOWS ========== -->
  <div *ngIf="tab() === 'workflows'">
    <div class="card" *ngIf="auth.isAdmin()">
      <h3>{{ editingId() ? 'แก้ไขขั้นตอนอนุมัติ' : '+ เพิ่มขั้นตอนอนุมัติใหม่' }}</h3>
      <div class="grid cols-2">
        <div><label>{{ 'common.name' | tr }}</label><input [(ngModel)]="wfForm.name" /></div>
        <div><label>ยอดขั้นต่ำ (บาท)</label>
          <input type="number" [(ngModel)]="wfForm.amountThreshold" /></div>
        <div><label>{{ 'common.company' | tr }} (ว่าง = ทุกบริษัท)</label>
          <select [(ngModel)]="wfForm.companyId">
            <option [ngValue]="null">ทุกบริษัท</option>
            <option *ngFor="let c of companies()" [ngValue]="c.id">{{ c.name }}</option>
          </select>
        </div>
        <div><label>สถานะ</label>
          <select [(ngModel)]="wfForm.isActive">
            <option [ngValue]="true">Active</option><option [ngValue]="false">Inactive</option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <label>คำอธิบาย</label>
        <textarea rows="2" [(ngModel)]="wfForm.description"></textarea>
      </div>
      <div class="flex mt-2">
        <button class="btn btn-primary" (click)="saveWf()">{{ 'common.save' | tr }}</button>
        <button class="btn btn-outline" (click)="resetWfForm()">{{ 'common.cancel' | tr }}</button>
      </div>
    </div>

    <table>
      <thead><tr><th>{{ 'common.name' | tr }}</th><th>ยอดขั้นต่ำ</th><th>สถานะ</th><th>คำอธิบาย</th><th *ngIf="auth.isAdmin()">{{ 'common.actions' | tr }}</th></tr></thead>
      <tbody>
        <tr *ngFor="let w of data()">
          <td>{{ w.name }}</td>
          <td>{{ w.amountThreshold | baht }}</td>
          <td>{{ w.isActive ? '✅' : '❌' }}</td>
          <td>{{ w.description }}</td>
          <td *ngIf="auth.isAdmin()">
            <button class="btn btn-outline btn-sm" (click)="editWf(w)">แก้ไข</button>
            <button class="btn btn-danger btn-sm" (click)="del('workflows', w.id)">ลบ</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- ========== NOTIFICATIONS ========== -->
  <div *ngIf="tab() === 'notifications'" class="card">
    <p class="text-muted">ระบบส่งอีเมลและแจ้งเตือนบนเว็บอัตโนมัติเมื่อสถานะคำขอเปลี่ยน</p>
    <ul>
      <li>เมื่อพนักงานส่งคำขอ → แจ้งเตือน "หัวหน้าแผนก"</li>
      <li>เมื่อผู้อนุมัติดำเนินการ → แจ้งเตือน "ผู้ขอ"</li>
      <li>เมื่อ HR ระบุวันรับของ → แจ้งเตือน "ผู้ขอ" พร้อมวัน/เวลา/สถานที่</li>
    </ul>
  </div>

  <!-- ========== SETTINGS ========== -->
  <div *ngIf="tab() === 'settings'">
    <div class="card" *ngIf="auth.isAdmin()">
      <h3>{{ editingId() ? 'แก้ไขการตั้งค่า' : '+ เพิ่มการตั้งค่าใหม่' }}</h3>
      <div class="grid cols-3">
        <div><label>Key</label><input [(ngModel)]="settingForm.key" [readonly]="!!editingId()" /></div>
        <div><label>Value</label><input [(ngModel)]="settingForm.value" /></div>
        <div><label>คำอธิบาย</label><input [(ngModel)]="settingForm.description" /></div>
      </div>
      <div class="flex mt-2">
        <button class="btn btn-primary" (click)="saveSetting()">{{ 'common.save' | tr }}</button>
        <button class="btn btn-outline" (click)="resetSettingForm()">{{ 'common.cancel' | tr }}</button>
      </div>
    </div>

    <table>
      <thead><tr><th>Key</th><th>Value</th><th>คำอธิบาย</th><th *ngIf="auth.isAdmin()">{{ 'common.actions' | tr }}</th></tr></thead>
      <tbody>
        <tr *ngFor="let s of data()">
          <td>{{ s.key }}</td>
          <td>{{ s.value }}</td>
          <td>{{ s.description }}</td>
          <td *ngIf="auth.isAdmin()">
            <button class="btn btn-outline btn-sm" (click)="editSetting(s)">แก้ไข</button>
            <button class="btn btn-danger btn-sm" (click)="del('settings', s.id)">ลบ</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
  `,
  styles: [`
  .tabs { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
  .tab { background: white; border: 1px solid var(--gray-200); padding: 8px 14px;
    border-radius: 999px; cursor: pointer; font-family: inherit; }
  .tab.active { background: linear-gradient(135deg, var(--blue-500), var(--blue-700)); color: white; }
  .notice { background: #fff4d6; border-left: 4px solid var(--gold-500); }
  .err { background: #fbe0e0; border-left: 4px solid var(--red-500); }
  .card:has(> h3) h3 { margin-bottom: 12px; }
  `],
})
export class AdminComponent {
  private api = inject(ApiService);
  auth = inject(AuthService);
  tab = signal<Tab>('users');
  data = signal<any[]>([]);
  editingId = signal<number | null>(null);
  message = signal('');
  isError = signal(false);

  companies = signal<any[]>([]);
  departments = signal<any[]>([]);
  categories = signal<any[]>([]);
  users = signal<any[]>([]);

  userForm = this.emptyUser();
  companyForm = this.emptyCompany();
  deptForm = this.emptyDept();
  itemForm = this.emptyItem();
  catForm = this.emptyCat();
  wfForm = this.emptyWf();
  settingForm = this.emptySetting();

  constructor() {
    this.loadRefs();
    this.load('users');
  }

  // ----- lookups -----
  loadRefs() {
    this.api.get<any[]>('/admin/companies').subscribe(v => this.companies.set(v));
    this.api.get<any[]>('/admin/departments').subscribe(v => this.departments.set(v));
    this.api.get<any[]>('/admin/categories').subscribe(v => this.categories.set(v));
    this.api.get<any[]>('/admin/users').subscribe(v => this.users.set(v));
  }
  deptsInCompany() {
    const cid = this.userForm.companyId;
    return this.departments().filter(d => d.companyId === cid);
  }
  managerCandidates() {
    const cid = this.deptForm.companyId;
    return this.users().filter(u => u.companyId === cid);
  }

  // ----- routing -----
  switch(name: Tab) {
    this.tab.set(name);
    this.editingId.set(null);
    this.message.set('');
    this.resetAllForms();
    this.load(name);
  }

  load(name: Tab) {
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

  // ----- generic delete -----
  del(kind: Tab, id: number) {
    if (!confirm('ยืนยันการลบ?')) return;
    this.api.delete<any>(`/admin/${kind}/${id}`).subscribe({
      next: (r) => {
        this.notify(r?.message || 'ลบเรียบร้อย', false);
        this.load(kind); this.loadRefs();
      },
      error: e => this.notify(e?.error?.message || 'ลบไม่สำเร็จ', true),
    });
  }

  private notify(msg: string, err: boolean) {
    this.message.set(msg); this.isError.set(err);
    setTimeout(() => this.message.set(''), 5000);
  }

  private resetAllForms() {
    this.userForm = this.emptyUser();
    this.companyForm = this.emptyCompany();
    this.deptForm = this.emptyDept();
    this.itemForm = this.emptyItem();
    this.catForm = this.emptyCat();
    this.wfForm = this.emptyWf();
    this.settingForm = this.emptySetting();
  }

  // ---------------- USERS ----------------
  emptyUser() {
    return { id: 0, fullName: '', email: '', role: 'Employee',
      companyId: 0, departmentId: null as number | null, isActive: true };
  }
  editUser(u: any) {
    this.editingId.set(u.id);
    this.userForm = {
      id: u.id, fullName: u.fullName, email: u.email, role: u.role,
      companyId: u.companyId, departmentId: u.departmentId ?? null, isActive: u.isActive,
    };
  }
  resetUserForm() { this.userForm = this.emptyUser(); this.editingId.set(null); }
  saveUser() {
    const isEdit = !!this.editingId();
    const call = isEdit
      ? this.api.put(`/admin/users/${this.editingId()}`, this.userForm)
      : this.api.post('/admin/users', this.userForm);
    call.subscribe({
      next: () => { this.notify(isEdit ? 'บันทึกแล้ว' : 'เพิ่มผู้ใช้แล้ว', false);
        this.resetUserForm(); this.load('users'); this.loadRefs(); },
      error: e => this.notify(e?.error?.message || 'บันทึกไม่สำเร็จ', true),
    });
  }

  // ---------------- COMPANIES ----------------
  emptyCompany() { return { id: 0, name: '', code: '' }; }
  editCompany(c: any) { this.editingId.set(c.id); this.companyForm = { ...c }; }
  resetCompanyForm() { this.companyForm = this.emptyCompany(); this.editingId.set(null); }
  saveCompany() {
    const isEdit = !!this.editingId();
    const call = isEdit
      ? this.api.put(`/admin/companies/${this.editingId()}`, this.companyForm)
      : this.api.post('/admin/companies', this.companyForm);
    call.subscribe({
      next: () => { this.notify('บันทึกแล้ว', false);
        this.resetCompanyForm(); this.load('companies'); this.loadRefs(); },
      error: e => this.notify(e?.error?.message || 'บันทึกไม่สำเร็จ', true),
    });
  }

  // ---------------- DEPARTMENTS ----------------
  emptyDept() {
    return { id: 0, name: '', companyId: 0, managerUserId: null as number | null };
  }
  editDept(d: any) {
    this.editingId.set(d.id);
    this.deptForm = { id: d.id, name: d.name, companyId: d.companyId,
      managerUserId: d.managerUserId ?? null };
  }
  resetDeptForm() { this.deptForm = this.emptyDept(); this.editingId.set(null); }
  saveDept() {
    const isEdit = !!this.editingId();
    const call = isEdit
      ? this.api.put(`/admin/departments/${this.editingId()}`, this.deptForm)
      : this.api.post('/admin/departments', this.deptForm);
    call.subscribe({
      next: () => { this.notify('บันทึกแล้ว', false);
        this.resetDeptForm(); this.load('departments'); this.loadRefs(); },
      error: e => this.notify(e?.error?.message || 'บันทึกไม่สำเร็จ', true),
    });
  }

  // ---------------- ITEMS ----------------
  emptyItem() {
    return { id: 0, sku: '', name: '', nameEn: '', unit: 'ชิ้น', unitPrice: 0,
      stockQty: 0, reorderLevel: 20, categoryId: 0, isActive: true };
  }
  editItem(i: any) {
    this.editingId.set(i.id);
    this.itemForm = { id: i.id, sku: i.sku, name: i.name, nameEn: i.nameEn || '',
      unit: i.unit, unitPrice: i.unitPrice, stockQty: i.stockQty,
      reorderLevel: i.reorderLevel, categoryId: i.categoryId, isActive: i.isActive };
  }
  resetItemForm() { this.itemForm = this.emptyItem(); this.editingId.set(null); }
  saveItem() {
    const isEdit = !!this.editingId();
    const call = isEdit
      ? this.api.put(`/admin/items/${this.editingId()}`, this.itemForm)
      : this.api.post('/admin/items', this.itemForm);
    call.subscribe({
      next: () => { this.notify('บันทึกแล้ว', false);
        this.resetItemForm(); this.load('items'); },
      error: e => this.notify(e?.error?.message || 'บันทึกไม่สำเร็จ', true),
    });
  }

  // ---------------- CATEGORIES ----------------
  emptyCat() { return { id: 0, name: '', nameEn: '' }; }
  editCat(c: any) { this.editingId.set(c.id); this.catForm = { ...c }; }
  resetCatForm() { this.catForm = this.emptyCat(); this.editingId.set(null); }
  saveCat() {
    const isEdit = !!this.editingId();
    const call = isEdit
      ? this.api.put(`/admin/categories/${this.editingId()}`, this.catForm)
      : this.api.post('/admin/categories', this.catForm);
    call.subscribe({
      next: () => { this.notify('บันทึกแล้ว', false);
        this.resetCatForm(); this.load('categories'); this.loadRefs(); },
      error: e => this.notify(e?.error?.message || 'บันทึกไม่สำเร็จ', true),
    });
  }

  // ---------------- WORKFLOWS ----------------
  emptyWf() {
    return { id: 0, name: '', companyId: null as number | null,
      amountThreshold: 0, description: '', isActive: true };
  }
  editWf(w: any) { this.editingId.set(w.id); this.wfForm = { ...w, companyId: w.companyId ?? null }; }
  resetWfForm() { this.wfForm = this.emptyWf(); this.editingId.set(null); }
  saveWf() {
    const isEdit = !!this.editingId();
    const call = isEdit
      ? this.api.put(`/admin/workflows/${this.editingId()}`, this.wfForm)
      : this.api.post('/admin/workflows', this.wfForm);
    call.subscribe({
      next: () => { this.notify('บันทึกแล้ว', false);
        this.resetWfForm(); this.load('workflows'); },
      error: e => this.notify(e?.error?.message || 'บันทึกไม่สำเร็จ', true),
    });
  }

  // ---------------- SETTINGS ----------------
  emptySetting() { return { id: 0, key: '', value: '', description: '' }; }
  editSetting(s: any) { this.editingId.set(s.id); this.settingForm = { ...s }; }
  resetSettingForm() { this.settingForm = this.emptySetting(); this.editingId.set(null); }
  saveSetting() {
    const isEdit = !!this.editingId();
    const call = isEdit
      ? this.api.put(`/admin/settings/${this.editingId()}`, this.settingForm)
      : this.api.post('/admin/settings', this.settingForm);
    call.subscribe({
      next: () => { this.notify('บันทึกแล้ว', false);
        this.resetSettingForm(); this.load('settings'); },
      error: e => this.notify(e?.error?.message || 'บันทึกไม่สำเร็จ', true),
    });
  }
}
