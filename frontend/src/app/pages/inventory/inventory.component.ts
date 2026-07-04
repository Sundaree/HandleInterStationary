import { Component, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { TrPipe } from '../../core/tr.pipe';
import { BahtPipe } from '../../core/baht.pipe';

interface StockRow {
  id: number; sku: string; name: string; nameEn: string; unit: string;
  unitPrice: number; stockQty: number; reorderLevel: number;
  categoryName: string; isLow: boolean;
}
interface Movement {
  id: number; itemId: number; itemName: string; type: string;
  qty: number; occurredAt: string; reference?: string; note?: string;
}

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, TrPipe, BahtPipe],
  template: `
  <h1>{{ 'nav.inventory' | tr }}</h1>

  <div class="tabs">
    <button class="tab" [class.active]="tab() === 'stock'" (click)="tab.set('stock')">
      📋 {{ 'inv.stock' | tr }}
    </button>
    <button class="tab" [class.active]="tab() === 'receive'" (click)="tab.set('receive')">
      📥 {{ 'inv.receive' | tr }}
    </button>
    <button class="tab" [class.active]="tab() === 'adjust'" (click)="tab.set('adjust')">
      🔧 {{ 'inv.adjust' | tr }}
    </button>
    <button class="tab" [class.active]="tab() === 'transfer'" (click)="tab.set('transfer')">
      🔀 {{ 'inv.transfer' | tr }}
    </button>
    <button class="tab" [class.active]="tab() === 'count'" (click)="tab.set('count')">
      🔍 {{ 'inv.count' | tr }}
    </button>
  </div>

  <!-- Stock -->
  <div *ngIf="tab() === 'stock'">
    <div class="flex mb-2">
      <label style="width:auto"><input type="checkbox" [(ngModel)]="lowOnly" (ngModelChange)="loadStock()" /> {{ 'inv.low' | tr }}</label>
    </div>
    <table>
      <thead>
        <tr>
          <th>{{ 'common.sku' | tr }}</th>
          <th>{{ 'common.item' | tr }}</th>
          <th>{{ 'common.category' | tr }}</th>
          <th>{{ 'catalog.stock' | tr }}</th>
          <th>{{ 'catalog.unit' | tr }}</th>
          <th class="text-right">{{ 'catalog.price' | tr }}</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let s of stock()">
          <td>{{ s.sku }}</td>
          <td>{{ s.name }}</td>
          <td>{{ s.categoryName }}</td>
          <td>
            <strong [class.text-red]="s.isLow">{{ s.stockQty }}</strong>
            <span class="text-muted" style="font-size:0.85rem"> / reorder {{ s.reorderLevel }}</span>
          </td>
          <td>{{ s.unit }}</td>
          <td class="text-right">{{ s.unitPrice | baht }}</td>
          <td>
            <span *ngIf="s.isLow" class="badge badge-red">⚠️ ต่ำ</span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Receive / Adjust / Transfer forms -->
  <div *ngIf="tab() === 'receive'" class="card">
    <h3>{{ 'inv.receive' | tr }}</h3>
    <div class="grid cols-3">
      <div><label>{{ 'common.item' | tr }}</label>
        <select [(ngModel)]="form.itemId">
          <option [ngValue]="null">--</option>
          <option *ngFor="let s of stock()" [ngValue]="s.id">{{ s.sku }} · {{ s.name }}</option>
        </select></div>
      <div><label>{{ 'req.qty' | tr }}</label>
        <input type="number" [(ngModel)]="form.qty" min="1" /></div>
      <div><label>{{ 'common.reference' | tr }}</label>
        <input [(ngModel)]="form.reference" placeholder="PO-2024-001" /></div>
    </div>
    <div class="form-row"><label>{{ 'req.note' | tr }}</label>
      <textarea rows="2" [(ngModel)]="form.note"></textarea></div>
    <button class="btn btn-primary" (click)="submitReceive()">{{ 'common.save' | tr }}</button>
  </div>

  <div *ngIf="tab() === 'adjust'" class="card">
    <h3>{{ 'inv.adjust' | tr }}</h3>
    <div class="grid cols-3">
      <div><label>{{ 'common.item' | tr }}</label>
        <select [(ngModel)]="form.itemId">
          <option [ngValue]="null">--</option>
          <option *ngFor="let s of stock()" [ngValue]="s.id">{{ s.sku }} · {{ s.name }} (คงเหลือ {{ s.stockQty }})</option>
        </select></div>
      <div><label>{{ 'common.newQty' | tr }}</label>
        <input type="number" [(ngModel)]="form.qty" min="0" /></div>
      <div><label>{{ 'req.note' | tr }}</label>
        <input [(ngModel)]="form.note" placeholder="เหตุผลในการปรับปรุง" /></div>
    </div>
    <button class="btn btn-primary" (click)="submitAdjust()">{{ 'common.save' | tr }}</button>
  </div>

  <div *ngIf="tab() === 'transfer'" class="card">
    <h3>{{ 'inv.transfer' | tr }}</h3>
    <div class="grid cols-3">
      <div><label>{{ 'common.item' | tr }}</label>
        <select [(ngModel)]="form.itemId">
          <option [ngValue]="null">--</option>
          <option *ngFor="let s of stock()" [ngValue]="s.id">{{ s.sku }} · {{ s.name }}</option>
        </select></div>
      <div><label>{{ 'req.qty' | tr }}</label>
        <input type="number" [(ngModel)]="form.qty" min="1" /></div>
      <div><label>{{ 'common.location' | tr }}</label>
        <input [(ngModel)]="form.reference" placeholder="สาขา / คลังปลายทาง" /></div>
    </div>
    <button class="btn btn-primary" (click)="submitTransfer()">{{ 'common.save' | tr }}</button>
  </div>

  <!-- Stock Count = movements list -->
  <div *ngIf="tab() === 'count'">
    <h3>{{ 'inv.count' | tr }}</h3>
    <table>
      <thead>
        <tr><th>{{ 'req.date' | tr }}</th><th>{{ 'common.item' | tr }}</th><th>ประเภท</th><th>{{ 'req.qty' | tr }}</th><th>อ้างอิง</th></tr>
      </thead>
      <tbody>
        <tr *ngFor="let m of movements()">
          <td>{{ m.occurredAt | date:'d MMM y HH:mm' }}</td>
          <td>{{ m.itemName }}</td>
          <td><span class="badge badge-blue">{{ m.type }}</span></td>
          <td>{{ m.qty }}</td>
          <td>{{ m.reference }}<div class="text-muted" style="font-size:0.85rem">{{ m.note }}</div></td>
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
  .text-red { color: var(--red-500); }
  `],
})
export class InventoryComponent {
  private api = inject(ApiService);
  tab = signal<'stock' | 'receive' | 'adjust' | 'transfer' | 'count'>('stock');
  stock = signal<StockRow[]>([]);
  movements = signal<Movement[]>([]);
  lowOnly = false;
  form: { itemId: number | null; qty: number; reference: string; note: string } =
    { itemId: null, qty: 1, reference: '', note: '' };

  constructor() { this.loadStock(); this.loadMoves(); }

  loadStock() {
    const params: Record<string, string | number | boolean> = {};
    if (this.lowOnly) params['lowOnly'] = true;
    this.api.get<StockRow[]>('/inventory/stock', params).subscribe(v => this.stock.set(v));
  }
  loadMoves() {
    this.api.get<Movement[]>('/inventory/movements').subscribe(v => this.movements.set(v));
  }
  submitReceive() {
    if (!this.form.itemId) return;
    this.api.post('/inventory/receive', {
      itemId: this.form.itemId, qty: this.form.qty,
      reference: this.form.reference, note: this.form.note,
    }).subscribe(() => { this.reset(); this.loadStock(); this.loadMoves(); });
  }
  submitAdjust() {
    if (!this.form.itemId) return;
    this.api.post('/inventory/adjust', {
      itemId: this.form.itemId, newQty: this.form.qty, note: this.form.note,
    }).subscribe(() => { this.reset(); this.loadStock(); this.loadMoves(); });
  }
  submitTransfer() {
    if (!this.form.itemId) return;
    this.api.post('/inventory/transfer', {
      itemId: this.form.itemId, qty: this.form.qty,
      toLocation: this.form.reference, note: this.form.note,
    }).subscribe(() => { this.reset(); this.loadMoves(); });
  }
  reset() { this.form = { itemId: null, qty: 1, reference: '', note: '' }; }
}
