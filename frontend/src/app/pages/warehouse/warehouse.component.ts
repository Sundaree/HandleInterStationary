import { Component, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { TrPipe } from '../../core/tr.pipe';
import { BahtPipe } from '../../core/baht.pipe';

interface PickRow {
  id: number; requestNo: string; status: string;
  requester: string; department: string; createdAt: string;
  totalAmount: number;
  items: { sku: string; name: string; qty: number; unit: string }[];
}
interface PickupRow {
  id: number; requestNo: string; requester: string; department: string;
  pickupDate: string; pickupTime: string; pickupLocation: string;
}

@Component({
  selector: 'app-warehouse',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, TrPipe, BahtPipe],
  template: `
  <h1>{{ 'nav.warehouse' | tr }}</h1>

  <div class="tabs">
    <button *ngFor="let t of tabs" class="tab" [class.active]="active() === t.key" (click)="active.set(t.key)">
      {{ t.label | tr }}
    </button>
  </div>

  <!-- Pick List -->
  <div *ngIf="active() === 'pickList'">
    <div class="card" *ngFor="let r of pickList()">
      <div class="flex-between">
        <div>
          <strong>{{ r.requestNo }}</strong>
          <span class="badge badge-blue">{{ ('status.' + r.status) | tr }}</span>
          <div class="text-muted">{{ r.requester }} · {{ r.department }} · {{ r.createdAt | date:'d MMM y' }}</div>
        </div>
        <div class="flex gap-2">
          <div class="text-gold" style="font-weight:600">{{ r.totalAmount | baht }}</div>
          <button class="btn btn-gold btn-sm" (click)="startPrepare(r.id)">
            {{ 'req.prepare' | tr }}
          </button>
        </div>
      </div>
      <table class="mt-2">
        <thead><tr><th>SKU</th><th>{{ 'common.item' | tr }}</th><th>{{ 'req.qty' | tr }}</th></tr></thead>
        <tbody>
          <tr *ngFor="let it of r.items">
            <td>{{ it.sku }}</td><td>{{ it.name }}</td><td>{{ it.qty }} {{ it.unit }}</td>
          </tr>
        </tbody>
      </table>

      <div class="card prepare-form" *ngIf="prepareId() === r.id">
        <h3>{{ 'req.prepare' | tr }}</h3>
        <div class="grid cols-3">
          <div><label>{{ 'req.pickupDate' | tr }}</label>
            <input type="date" [(ngModel)]="pickupDate" /></div>
          <div><label>{{ 'req.pickupTime' | tr }}</label>
            <input type="text" [(ngModel)]="pickupTime" placeholder="10:00 - 12:00" /></div>
          <div><label>{{ 'req.pickupLoc' | tr }}</label>
            <input type="text" [(ngModel)]="pickupLoc" placeholder="ห้อง HR ชั้น 3" /></div>
        </div>
        <div class="flex mt-2">
          <button class="btn btn-primary btn-sm" (click)="submitPrepare(r.id)">
            {{ 'common.confirm' | tr }}
          </button>
          <button class="btn btn-outline btn-sm" (click)="prepareId.set(null)">
            {{ 'common.cancel' | tr }}
          </button>
        </div>
      </div>
    </div>
    <div *ngIf="pickList().length === 0" class="card text-center text-muted">
      ไม่มีคำขอที่ต้องจัดเตรียม ✨
    </div>
  </div>

  <!-- Pickup / Ready -->
  <div *ngIf="active() === 'pickup' || active() === 'issue'">
    <table>
      <thead>
        <tr>
          <th>{{ 'req.no' | tr }}</th>
          <th>{{ 'common.requester' | tr }}</th>
          <th>{{ 'common.department' | tr }}</th>
          <th>{{ 'req.pickupDate' | tr }}</th>
          <th>{{ 'req.pickupLoc' | tr }}</th>
          <th>{{ 'common.actions' | tr }}</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let r of pickup()">
          <td><strong>{{ r.requestNo }}</strong></td>
          <td>{{ r.requester }}</td>
          <td>{{ r.department }}</td>
          <td>{{ r.pickupDate | date:'d MMM y' }} · {{ r.pickupTime }}</td>
          <td>{{ r.pickupLocation }}</td>
          <td>
            <button class="btn btn-primary btn-sm" (click)="pickupDone(r.id)">
              {{ 'req.confirmPickup' | tr }}
            </button>
          </td>
        </tr>
      </tbody>
    </table>
    <div *ngIf="pickup().length === 0" class="card text-center text-muted">
      ไม่มีคำขอที่รอรับ ✨
    </div>
  </div>

  <!-- Reservation (simplified: show items with reorder alerts) -->
  <div *ngIf="active() === 'reservation'" class="card text-muted">
    ระบบจองสินค้าอัตโนมัติจะถูกจองเมื่อคำขอถูกอนุมัติแล้ว
    (ในตอนนี้ระบบจะตัดสต๊อกเมื่อ HR กด "ระบุวัน/เวลารับของ")
  </div>
  `,
  styles: [`
  .tabs { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
  .tab {
    background: white; border: 1px solid var(--gray-200);
    padding: 8px 14px; border-radius: 999px; cursor: pointer; font-family: inherit;
    transition: all .15s ease;
  }
  .tab:hover { border-color: var(--blue-500); color: var(--blue-500); }
  .tab.active {
    background: linear-gradient(135deg, var(--blue-500), var(--blue-700));
    color: white; border-color: transparent;
  }
  .prepare-form { background: #fff8e5; border-left: 4px solid var(--gold-500); margin-top: 12px; }
  `],
})
export class WarehouseComponent {
  private api = inject(ApiService);

  tabs = [
    { key: 'pickList',    label: 'wh.pickList' },
    { key: 'issue',       label: 'wh.issue' },
    { key: 'pickup',      label: 'wh.pickup' },
    { key: 'reservation', label: 'wh.reservation' },
  ] as const;
  active = signal<'pickList' | 'issue' | 'pickup' | 'reservation'>('pickList');

  pickList = signal<PickRow[]>([]);
  pickup = signal<PickupRow[]>([]);
  prepareId = signal<number | null>(null);
  pickupDate = new Date().toISOString().substring(0, 10);
  pickupTime = '10:00 - 12:00';
  pickupLoc = 'ห้อง HR ชั้น 3';

  constructor() { this.reload(); }

  reload() {
    this.api.get<PickRow[]>('/requests/pick-list').subscribe(v => this.pickList.set(v));
    this.api.get<PickupRow[]>('/requests/ready-for-pickup').subscribe(v => this.pickup.set(v));
  }
  startPrepare(id: number) { this.prepareId.set(id); }
  submitPrepare(id: number) {
    this.api.post(`/requests/${id}/prepare`, {
      pickupDate: this.pickupDate,
      pickupTime: this.pickupTime,
      pickupLocation: this.pickupLoc,
    }).subscribe(() => { this.prepareId.set(null); this.reload(); });
  }
  pickupDone(id: number) {
    this.api.post(`/requests/${id}/pickup`, {}).subscribe(() => this.reload());
  }
}
