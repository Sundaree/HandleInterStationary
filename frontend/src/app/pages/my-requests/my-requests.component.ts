import { Component, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { TrPipe } from '../../core/tr.pipe';
import { BahtPipe } from '../../core/baht.pipe';

interface Row {
  id: number; requestNo: string; status: string; createdAt: string;
  totalAmount: number; pickupDate?: string; pickupTime?: string;
  pickupLocation?: string; itemsCount: number;
}

@Component({
  selector: 'app-my-requests',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe, TrPipe, BahtPipe],
  template: `
  <div class="flex-between">
    <h1>{{ 'nav.myRequests' | tr }}</h1>
    <a routerLink="/my-requests/create" class="btn btn-gold">+ {{ 'req.createNew' | tr }}</a>
  </div>

  <table>
    <thead>
      <tr>
        <th>{{ 'req.no' | tr }}</th>
        <th>{{ 'req.date' | tr }}</th>
        <th>{{ 'req.items' | tr }}</th>
        <th class="text-right">{{ 'req.total' | tr }}</th>
        <th>{{ 'req.status' | tr }}</th>
        <th>{{ 'req.pickupDate' | tr }}</th>
        <th>{{ 'common.actions' | tr }}</th>
      </tr>
    </thead>
    <tbody>
      <tr *ngFor="let r of rows()">
        <td><strong>{{ r.requestNo }}</strong></td>
        <td>{{ r.createdAt | date:'d MMM y' }}</td>
        <td>{{ r.itemsCount }}</td>
        <td class="text-right">{{ r.totalAmount | baht }}</td>
        <td>
          <span class="badge"
                [class.badge-gold]="r.status === 'PendingApproval'"
                [class.badge-blue]="r.status === 'Approved' || r.status === 'Preparing'"
                [class.badge-green]="r.status === 'ReadyForPickup' || r.status === 'Completed'"
                [class.badge-red]="r.status === 'Rejected'"
                [class.badge-gray]="r.status === 'Draft' || r.status === 'Cancelled'">
            {{ ('status.' + r.status) | tr }}
          </span>
        </td>
        <td>
          <div *ngIf="r.pickupDate">
            {{ r.pickupDate | date:'d MMM y' }} · {{ r.pickupTime }}
            <div class="text-muted" style="font-size:0.85rem">📍 {{ r.pickupLocation }}</div>
          </div>
          <span *ngIf="!r.pickupDate" class="text-muted">—</span>
        </td>
        <td>
          <a [routerLink]="['/my-requests', r.id]" class="btn btn-outline btn-sm">
            {{ 'req.detail' | tr }}
          </a>
        </td>
      </tr>
    </tbody>
  </table>
  <div *ngIf="rows().length === 0" class="card text-center text-muted mt-2">
    {{ 'common.empty' | tr }}
  </div>
  `,
})
export class MyRequestsComponent {
  private api = inject(ApiService);
  rows = signal<Row[]>([]);
  constructor() {
    this.api.get<Row[]>('/requests/mine').subscribe(v => this.rows.set(v));
  }
}
