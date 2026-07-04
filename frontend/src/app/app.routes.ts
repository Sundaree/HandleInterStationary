import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./pages/auth/login.component').then(m => m.LoginComponent) },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/main-layout.component').then(m => m.MainLayoutComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard',       loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'catalog',         loadComponent: () => import('./pages/catalog/catalog.component').then(m => m.CatalogComponent) },
      { path: 'my-requests',     loadComponent: () => import('./pages/my-requests/my-requests.component').then(m => m.MyRequestsComponent) },
      { path: 'my-requests/create', loadComponent: () => import('./pages/my-requests/create-request.component').then(m => m.CreateRequestComponent) },
      { path: 'my-requests/:id', loadComponent: () => import('./pages/my-requests/request-detail.component').then(m => m.RequestDetailComponent) },
      { path: 'approval',        loadComponent: () => import('./pages/approval/approval.component').then(m => m.ApprovalComponent) },
      { path: 'warehouse',       loadComponent: () => import('./pages/warehouse/warehouse.component').then(m => m.WarehouseComponent) },
      { path: 'inventory',       loadComponent: () => import('./pages/inventory/inventory.component').then(m => m.InventoryComponent) },
      { path: 'reports',         loadComponent: () => import('./pages/reports/reports.component').then(m => m.ReportsComponent) },
      { path: 'admin',           loadComponent: () => import('./pages/admin/admin.component').then(m => m.AdminComponent) },
    ],
  },
  { path: '**', redirectTo: '' },
];
