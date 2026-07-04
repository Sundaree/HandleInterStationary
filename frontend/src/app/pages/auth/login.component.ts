import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { I18nService } from '../../core/i18n.service';
import { TrPipe } from '../../core/tr.pipe';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, TrPipe],
  template: `
  <div class="login-wrap">
    <div class="login-card card">
      <div class="brand-row">
        <div class="logo">SMS</div>
        <div>
          <h1 class="mb-0">{{ 'app.title' | tr }}</h1>
          <div class="text-muted">{{ 'app.tagline' | tr }}</div>
        </div>
      </div>

      <div class="lang-switch">
        <button class="btn btn-outline btn-sm" (click)="i18n.toggle()">
          {{ i18n.lang() === 'th' ? 'English' : 'ภาษาไทย' }}
        </button>
      </div>

      <h3>{{ 'login.heading' | tr }}</h3>
      <form (ngSubmit)="submit()" #f="ngForm">
        <div class="form-row">
          <label>{{ 'login.emailLabel' | tr }}</label>
          <input [(ngModel)]="email" name="email" type="email" required
                 placeholder="somchai@company-a.co.th" autocomplete="email" />
          <div class="error" *ngIf="error()">{{ error() }}</div>
        </div>
        <button class="btn btn-primary" type="submit" [disabled]="!email || loading()">
          {{ loading() ? ('common.loading' | tr) : ('login.submit' | tr) }}
        </button>
      </form>

      <div class="samples">
        <div class="sample-title">{{ 'login.hint' | tr }}</div>
        <button *ngFor="let s of samples"
                class="sample-chip"
                (click)="email = s.email; submit()">
          {{ s.label }} · {{ s.email }}
        </button>
      </div>
    </div>
  </div>
  `,
  styles: [`
  .login-wrap {
    min-height: 100vh;
    background: linear-gradient(135deg, var(--blue-900), var(--blue-500) 60%, var(--gold-500));
    display: grid; place-items: center; padding: 24px;
  }
  .login-card {
    width: 100%; max-width: 480px; position: relative;
    box-shadow: var(--shadow-lg);
  }
  .brand-row { display: flex; align-items: center; gap: 14px; margin-bottom: 16px; }
  .logo {
    width: 56px; height: 56px; display: grid; place-items: center;
    background: linear-gradient(135deg, var(--blue-500), var(--blue-900));
    color: white; font-weight: 700; border-radius: 14px;
    box-shadow: var(--shadow-md);
  }
  .lang-switch { position: absolute; top: 16px; right: 16px; }
  .samples { margin-top: 24px; border-top: 1px dashed var(--gray-200); padding-top: 16px; }
  .sample-title { color: var(--gray-500); font-size: 0.85rem; margin-bottom: 8px; }
  .sample-chip {
    display: block; width: 100%; text-align: left;
    background: var(--blue-100); border: 1px solid var(--blue-100);
    color: var(--blue-700); padding: 8px 12px; border-radius: 8px;
    font-family: inherit; font-size: 0.85rem; margin-bottom: 6px; cursor: pointer;
    transition: background .15s ease;
  }
  .sample-chip:hover { background: white; border-color: var(--blue-500); }
  `],
})
export class LoginComponent {
  auth = inject(AuthService);
  i18n = inject(I18nService);
  private router = inject(Router);
  email = '';
  loading = signal(false);
  error = signal('');
  samples = [
    { label: 'Employee',  email: 'somchai@company-a.co.th' },
    { label: 'Manager',   email: 'manager.it@company-a.co.th' },
    { label: 'HR',        email: 'hr@company-a.co.th' },
    { label: 'Admin',     email: 'admin@company-a.co.th' },
    { label: 'Executive', email: 'ceo@company-a.co.th' },
  ];

  async submit() {
    this.error.set('');
    this.loading.set(true);
    try {
      await this.auth.login(this.email);
      this.router.navigate(['/dashboard']);
    } catch (e: any) {
      this.error.set(e?.error?.message || 'ล็อกอินไม่สำเร็จ');
    } finally {
      this.loading.set(false);
    }
  }
}
