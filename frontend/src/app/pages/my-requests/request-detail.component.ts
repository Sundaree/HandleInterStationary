import { Component, inject, signal, Input, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { TrPipe } from '../../core/tr.pipe';
import { BahtPipe } from '../../core/baht.pipe';

interface Detail {
  id: number; requestNo: string; status: string;
  createdAt: string; approvedAt?: string; rejectReason?: string;
  pickupDate?: string; pickupTime?: string; pickupLocation?: string;
  note?: string; totalAmount: number;
  requester: { id: number; fullName: string; email: string };
  department: string; company: string;
  approver?: { id: number; fullName: string };
  items: { id: number; sku: string; name: string; unit: string;
    qty: number; unitPrice: number; amount: number }[];
}

@Component({
  selector: 'app-request-detail',
  standalone: true,
  imports: [CommonModule, DatePipe, RouterLink, TrPipe, BahtPipe],
  template: `
  <div class="flex-between">
    <a routerLink="/my-requests" class="btn btn-outline btn-sm">← {{ 'common.back' | tr }}</a>
  </div>

  <div class="card" *ngIf="detail() as d">
    <div class="flex-between">
      <div>
        <h1 class="mb-0">{{ d.requestNo }}</h1>
        <div class="text-muted">
          {{ 'req.date' | tr }}: {{ d.createdAt | date:'d MMM y HH:mm' }}
        </div>
      </div>
      <span class="badge"
        [class.badge-gold]="d.status === 'PendingApproval'"
        [class.badge-blue]="d.status === 'Approved' || d.status === 'Preparing'"
        [class.badge-green]="d.status === 'ReadyForPickup' || d.status === 'Completed'"
        [class.badge-red]="d.status === 'Rejected'">
        {{ ('status.' + d.status) | tr }}
      </span>
    </div>

    <div class="grid cols-3 mt-2">
      <div>
        <label>{{ 'common.requester' | tr }}</label>
        <div>{{ d.requester.fullName }}</div>
        <div class="text-muted" style="font-size:0.85rem">{{ d.requester.email }}</div>
      </div>
      <div>
        <label>{{ 'common.department' | tr }}</label>
        <div>{{ d.department }}</div>
      </div>
      <div>
        <label>{{ 'common.company' | tr }}</label>
        <div>{{ d.company }}</div>
      </div>
    </div>

    <div *ngIf="d.note" class="mt-2">
      <label>{{ 'req.note' | tr }}</label>
      <div>{{ d.note }}</div>
    </div>

    <h3 class="mt-2">รายการสินค้า</h3>
    <table>
      <thead>
        <tr>
          <th>{{ 'common.sku' | tr }}</th>
          <th>{{ 'common.item' | tr }}</th>
          <th>{{ 'req.qty' | tr }}</th>
          <th class="text-right">{{ 'catalog.price' | tr }}</th>
          <th class="text-right">{{ 'common.total' | tr }}</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let i of d.items">
          <td>{{ i.sku }}</td>
          <td>{{ i.name }}</td>
          <td>{{ i.qty }} {{ i.unit }}</td>
          <td class="text-right">{{ i.unitPrice | baht }}</td>
          <td class="text-right"><strong>{{ i.amount | baht }}</strong></td>
        </tr>
      </tbody>
      <tfoot>
        <tr>
          <td colspan="4" class="text-right"><strong>{{ 'common.total' | tr }}</strong></td>
          <td class="text-right"><strong class="text-gold">{{ d.totalAmount | baht }}</strong></td>
        </tr>
      </tfoot>
    </table>

    <div class="card pickup-info mt-2" *ngIf="d.pickupDate">
      <h3>📦 นัดหมายรับของ</h3>
      <div class="grid cols-3">
        <div><label>{{ 'req.pickupDate' | tr }}</label><div>{{ d.pickupDate | date:'EEEE d MMM y' }}</div></div>
        <div><label>{{ 'req.pickupTime' | tr }}</label><div>{{ d.pickupTime }}</div></div>
        <div><label>{{ 'req.pickupLoc' | tr }}</label><div>{{ d.pickupLocation }}</div></div>
      </div>
    </div>

    <div class="card" *ngIf="d.status === 'Rejected'" style="border-left:4px solid var(--red-500)">
      <label>{{ 'req.reason' | tr }}</label>
      <div>{{ d.rejectReason }}</div>
    </div>

    <div class="track-line mt-2">
      <div class="track-step" [class.done]="stepDone(d, 1)">📝 ส่งคำขอ</div>
      <div class="track-step" [class.done]="stepDone(d, 2)">✅ อนุมัติ</div>
      <div class="track-step" [class.done]="stepDone(d, 3)">📦 เตรียมของ</div>
      <div class="track-step" [class.done]="stepDone(d, 4)">🏁 รับของ</div>
    </div>
  </div>
  `,
  styles: [`
  .track-line {
    display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;
  }
  .track-step {
    padding: 14px; border-radius: 8px; text-align: center;
    background: var(--gray-100); color: var(--gray-500); font-size: 0.9rem;
    transition: all .3s ease;
  }
  .track-step.done {
    background: linear-gradient(135deg, var(--blue-500), var(--blue-700));
    color: white; box-shadow: var(--shadow-sm);
  }
  .pickup-info { background: linear-gradient(135deg, #fff8e5, #fff); border-left: 4px solid var(--gold-500); }
  `],
})
export class RequestDetailComponent implements OnInit {
  private api = inject(ApiService);
  @Input() id!: string;
  detail = signal<Detail | null>(null);

  ngOnInit() {
    this.api.get<Detail>(`/requests/${this.id}`).subscribe(d => this.detail.set(d));
  }
  stepDone(d: Detail, step: number): boolean {
    const map: Record<string, number> = {
      PendingApproval: 1, Approved: 2, Preparing: 2,
      ReadyForPickup: 3, Completed: 4, Rejected: 1, Cancelled: 1,
    };
    return (map[d.status] ?? 0) >= step;
  }
}
