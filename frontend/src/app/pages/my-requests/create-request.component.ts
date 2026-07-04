import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { CartService } from './cart.service';
import { TrPipe } from '../../core/tr.pipe';
import { BahtPipe } from '../../core/baht.pipe';

@Component({
  selector: 'app-create-request',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TrPipe, BahtPipe],
  template: `
  <div class="flex-between">
    <h1>{{ 'req.createNew' | tr }}</h1>
    <a routerLink="/catalog" class="btn btn-outline">+ เลือกสินค้าเพิ่ม</a>
  </div>

  <div class="card">
    <div *ngIf="cart.lines().length === 0" class="text-center text-muted">
      กรุณาไปเลือกสินค้าจาก <a routerLink="/catalog">Stationery Catalog</a> ก่อน
    </div>
    <table *ngIf="cart.lines().length > 0">
      <thead>
        <tr>
          <th>{{ 'common.item' | tr }}</th>
          <th>{{ 'req.qty' | tr }}</th>
          <th class="text-right">{{ 'catalog.price' | tr }}</th>
          <th class="text-right">{{ 'common.total' | tr }}</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let l of cart.lines()">
          <td>
            <div><strong>{{ l.name }}</strong></div>
            <div class="text-muted" style="font-size:0.85rem">{{ l.unit }}</div>
          </td>
          <td style="width:120px">
            <input type="number" [ngModel]="l.qty" min="1"
                   (ngModelChange)="cart.updateQty(l.itemId, +$event || 1)" />
          </td>
          <td class="text-right">{{ l.unitPrice | baht }}</td>
          <td class="text-right"><strong>{{ (l.qty * l.unitPrice) | baht }}</strong></td>
          <td>
            <button class="btn btn-danger btn-sm" (click)="cart.remove(l.itemId)">
              {{ 'req.remove' | tr }}
            </button>
          </td>
        </tr>
      </tbody>
      <tfoot>
        <tr>
          <td colspan="3" class="text-right"><strong>{{ 'common.total' | tr }}</strong></td>
          <td class="text-right"><strong class="text-gold">{{ cart.total() | baht }}</strong></td>
          <td></td>
        </tr>
      </tfoot>
    </table>
  </div>

  <div class="card" *ngIf="cart.lines().length > 0">
    <div class="form-row">
      <label>{{ 'req.note' | tr }}</label>
      <textarea rows="3" [(ngModel)]="note" placeholder="ใส่เหตุผลหรือหมายเหตุ (ถ้ามี)"></textarea>
    </div>
    <button class="btn btn-gold" [disabled]="submitting()" (click)="submit()">
      {{ submitting() ? ('common.loading' | tr) : ('req.submit' | tr) }}
    </button>
    <div class="error" *ngIf="err()">{{ err() }}</div>
    <div class="success mt-2" *ngIf="okNo()">
      ✅ ส่งคำขอ {{ okNo() }} เรียบร้อยแล้ว หัวหน้าแผนกจะได้รับการแจ้งเตือน
    </div>
  </div>
  `,
})
export class CreateRequestComponent {
  private api = inject(ApiService);
  private router = inject(Router);
  cart = inject(CartService);
  note = '';
  submitting = signal(false);
  err = signal('');
  okNo = signal('');

  submit() {
    if (this.cart.lines().length === 0) return;
    this.submitting.set(true); this.err.set(''); this.okNo.set('');
    const body = {
      note: this.note,
      items: this.cart.lines().map(l => ({ itemId: l.itemId, qty: l.qty })),
    };
    this.api.post<{ id: number; requestNo: string }>('/requests', body).subscribe({
      next: r => {
        this.okNo.set(r.requestNo);
        this.cart.clear();
        this.submitting.set(false);
        setTimeout(() => this.router.navigate(['/my-requests', r.id]), 1200);
      },
      error: e => {
        this.err.set(e?.error?.message || 'ส่งคำขอไม่สำเร็จ');
        this.submitting.set(false);
      },
    });
  }
}
