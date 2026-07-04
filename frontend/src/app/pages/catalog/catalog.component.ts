import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { TrPipe } from '../../core/tr.pipe';
import { BahtPipe } from '../../core/baht.pipe';
import { CartService } from '../my-requests/cart.service';
import { I18nService } from '../../core/i18n.service';

interface CatalogItem {
  id: number; sku: string; name: string; nameEn: string; unit: string;
  unitPrice: number; stockQty: number; categoryName: string;
}
interface Category { id: number; name: string; nameEn: string; }

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule, TrPipe, BahtPipe],
  template: `
  <h1>{{ 'nav.catalog' | tr }}</h1>

  <div class="card filters">
    <div class="grid cols-3">
      <div>
        <label>{{ 'catalog.search' | tr }}</label>
        <input [(ngModel)]="q" (ngModelChange)="reload()" placeholder="pen, paper, PEN-001…" />
      </div>
      <div>
        <label>{{ 'common.category' | tr }}</label>
        <select [(ngModel)]="categoryId" (ngModelChange)="reload()">
          <option [ngValue]="null">{{ 'catalog.all' | tr }}</option>
          <option *ngFor="let c of categories()" [ngValue]="c.id">
            {{ i18n.lang() === 'th' ? c.name : (c.nameEn || c.name) }}
          </option>
        </select>
      </div>
      <div style="align-self:end">
        <div class="text-muted">
          🛒 {{ cart.count() }} รายการ
          · {{ cart.total() | baht }}
        </div>
        <button class="btn btn-gold btn-sm mt-2" (click)="goCreate()" *ngIf="cart.count() > 0">
          → {{ 'req.createNew' | tr }}
        </button>
      </div>
    </div>
  </div>

  <div class="grid cols-3">
    <div class="card item-card" *ngFor="let it of items()">
      <div class="badge badge-blue">{{ it.categoryName }}</div>
      <h3 class="item-name">{{ i18n.lang() === 'th' ? it.name : (it.nameEn || it.name) }}</h3>
      <div class="text-muted">SKU: {{ it.sku }}</div>
      <div class="flex-between mt-2">
        <div>
          <div class="text-gold" style="font-weight:600">{{ it.unitPrice | baht }}</div>
          <div class="text-muted" style="font-size:0.85rem">{{ 'catalog.stock' | tr }}: {{ it.stockQty }} {{ it.unit }}</div>
        </div>
        <button class="btn btn-primary btn-sm"
                [disabled]="it.stockQty <= 0"
                (click)="add(it)">
          + {{ 'catalog.add' | tr }}
        </button>
      </div>
    </div>
  </div>
  <div *ngIf="!loading() && items().length === 0" class="card text-center text-muted">
    {{ 'common.empty' | tr }}
  </div>
  `,
  styles: [`
  .item-name { margin: 8px 0 4px; font-size: 1rem; }
  .item-card { display: flex; flex-direction: column; }
  .filters { margin-bottom: 20px; }
  `],
})
export class CatalogComponent {
  private api = inject(ApiService);
  private router = inject(Router);
  cart = inject(CartService);
  i18n = inject(I18nService);

  q = '';
  categoryId: number | null = null;
  items = signal<CatalogItem[]>([]);
  categories = signal<Category[]>([]);
  loading = signal(false);

  constructor() {
    this.api.get<Category[]>('/catalog/categories').subscribe(c => this.categories.set(c));
    this.reload();
  }

  reload() {
    this.loading.set(true);
    const params: Record<string, string | number> = {};
    if (this.q) params['q'] = this.q;
    if (this.categoryId) params['categoryId'] = this.categoryId;
    this.api.get<CatalogItem[]>('/catalog/items', params).subscribe({
      next: v => { this.items.set(v); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  add(it: CatalogItem) {
    this.cart.add({ itemId: it.id, name: it.name, unit: it.unit, unitPrice: it.unitPrice, qty: 1 });
  }
  goCreate() { this.router.navigate(['/my-requests/create']); }
}
