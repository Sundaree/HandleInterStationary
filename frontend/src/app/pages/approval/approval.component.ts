import { Component, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { TrPipe } from '../../core/tr.pipe';
import { BahtPipe } from '../../core/baht.pipe';

interface PendingRow {
  id: number; requestNo: string; createdAt: string; totalAmount: number;
  requester: string; department: string; items: number;
}

@Component({
  selector: 'app-approval',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, TrPipe, BahtPipe],
  template: `
  <h1>{{ 'nav.approval' | tr }}</h1>

  <table *ngIf="rows().length > 0">
    <thead>
      <tr>
        <th>{{ 'req.no' | tr }}</th>
        <th>{{ 'common.requester' | tr }}</th>
        <th>{{ 'common.department' | tr }}</th>
        <th>{{ 'req.date' | tr }}</th>
        <th>{{ 'req.items' | tr }}</th>
        <th class="text-right">{{ 'req.total' | tr }}</th>
        <th>{{ 'common.actions' | tr }}</th>
      </tr>
    </thead>
    <tbody>
      <ng-container *ngFor="let r of rows()">
        <tr>
          <td><strong>{{ r.requestNo }}</strong></td>
          <td>{{ r.requester }}</td>
          <td>{{ r.department }}</td>
          <td>{{ r.createdAt | date:'d MMM y HH:mm' }}</td>
          <td>{{ r.items }}</td>
          <td class="text-right"><strong>{{ r.totalAmount | baht }}</strong></td>
          <td class="flex">
            <button class="btn btn-primary btn-sm" (click)="approve(r, true)">
              ✓ {{ 'req.approve' | tr }}
            </button>
            <button class="btn btn-outline btn-sm" (click)="toggleReason(r.id)">
              ✕ {{ 'req.reject' | tr }}
            </button>
          </td>
        </tr>
        <tr *ngIf="showReason() === r.id">
          <td colspan="7">
            <div class="flex">
              <input [(ngModel)]="reason" placeholder="{{ 'req.reason' | tr }}" />
              <button class="btn btn-danger btn-sm" (click)="approve(r, false)">
                {{ 'common.confirm' | tr }}
              </button>
            </div>
          </td>
        </tr>
      </ng-container>
    </tbody>
  </table>
  <div *ngIf="rows().length === 0" class="card text-center text-muted">
    ไม่มีคำขอที่รออนุมัติ ✨
  </div>
  `,
})
export class ApprovalComponent {
  private api = inject(ApiService);
  rows = signal<PendingRow[]>([]);
  showReason = signal<number | null>(null);
  reason = '';

  constructor() { this.reload(); }

  reload() {
    this.api.get<PendingRow[]>('/requests/pending-approval').subscribe(v => this.rows.set(v));
  }
  toggleReason(id: number) {
    this.showReason.set(this.showReason() === id ? null : id);
    this.reason = '';
  }
  approve(r: PendingRow, ok: boolean) {
    if (!ok && !this.reason) { alert('กรุณาระบุเหตุผลในการปฏิเสธ'); return; }
    this.api.post(`/requests/${r.id}/approve`, { approve: ok, rejectReason: this.reason })
      .subscribe(() => {
        this.showReason.set(null); this.reason = ''; this.reload();
      });
  }
}
