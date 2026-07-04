import { Injectable, computed, signal } from '@angular/core';

export interface CartLine {
  itemId: number;
  name: string;
  unit: string;
  unitPrice: number;
  qty: number;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly key = 'sms.cart';
  lines = signal<CartLine[]>(this.load());
  count = computed(() => this.lines().reduce((s, l) => s + l.qty, 0));
  total = computed(() => this.lines().reduce((s, l) => s + l.qty * l.unitPrice, 0));

  private load(): CartLine[] {
    try {
      const raw = localStorage.getItem(this.key);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }
  private persist() {
    localStorage.setItem(this.key, JSON.stringify(this.lines()));
  }
  add(line: CartLine) {
    const list = [...this.lines()];
    const found = list.find(l => l.itemId === line.itemId);
    if (found) found.qty += line.qty; else list.push({ ...line });
    this.lines.set(list); this.persist();
  }
  updateQty(itemId: number, qty: number) {
    const list = this.lines().map(l => l.itemId === itemId ? { ...l, qty } : l);
    this.lines.set(list); this.persist();
  }
  remove(itemId: number) {
    this.lines.set(this.lines().filter(l => l.itemId !== itemId)); this.persist();
  }
  clear() { this.lines.set([]); this.persist(); }
}
