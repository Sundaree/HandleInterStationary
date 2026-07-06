import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { firstValueFrom } from 'rxjs';

export interface AppUser {
  id: number;
  fullName: string;
  email: string;
  role: string;
  companyId: number;
  companyName: string;
  departmentId?: number | null;
  departmentName?: string | null;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly key = 'sms.user';
  currentUser = signal<AppUser | null>(this.load());

  constructor(private http: HttpClient) {}

  private load(): AppUser | null {
    try {
      const raw = localStorage.getItem(this.key);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  async login(email: string): Promise<AppUser> {
    const user = await firstValueFrom(
      this.http.post<AppUser>(`${environment.apiUrl}/auth/login`, { email })
    );
    localStorage.setItem(this.key, JSON.stringify(user));
    this.currentUser.set(user);
    return user;
  }

  logout() {
    localStorage.removeItem(this.key);
    this.currentUser.set(null);
  }

  isLoggedIn(): boolean { return !!this.currentUser(); }

  canAccessAdmin(): boolean {
    const r = this.currentUser()?.role;
    return r === 'Admin';
  }
  canAccessWarehouse(): boolean {
    const r = this.currentUser()?.role;
    return r === 'HR' || r === 'Admin';
  }
  canAccessInventory(): boolean {
    const r = this.currentUser()?.role;
    return r === 'HR' || r === 'Admin';
  }
  canAccessApproval(): boolean {
    const r = this.currentUser()?.role;
    return r === 'DepartmentManager' || r === 'HR' || r === 'Admin';
  }
  canAccessReports(): boolean {
    const r = this.currentUser()?.role;
    return r === 'Executive' || r === 'HR' || r === 'Admin';
  }
  canPrepareRequests(): boolean {
    const r = this.currentUser()?.role;
    return r === 'HR' || r === 'Admin';
  }
  canSeeTopbarAmount(): boolean {
    const r = this.currentUser()?.role;
    return r === 'Executive' || r === 'DepartmentManager';
  }
  isCeo(): boolean { return this.currentUser()?.role === 'Executive'; }
  isAdmin(): boolean { return this.currentUser()?.role === 'Admin'; }
}
