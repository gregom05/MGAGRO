import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { noEmpleadoGuard } from './guards/no-empleado.guard';

export const routes: Routes = [
  // Login sin layout (SIN protección)
  { path: 'login', loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent) },

  // Rutas con dashboard/layout (TODAS protegidas con authGuard)
  {
    path: '',
    loadComponent: () => import('./layout/main-layout.component').then(m => m.MainLayoutComponent),
    canActivate: [authGuard], // ✅ Protege TODAS las rutas hijas
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'welcome' },
      { path: 'welcome', loadChildren: () => import('./pages/welcome/welcome.routes').then(m => m.WELCOME_ROUTES), canActivate: [noEmpleadoGuard] },
      { path: 'dashboard-empleado', loadComponent: () => import('./pages/dashboard-empleado/dashboard-empleado.component').then(m => m.DashboardEmpleadoComponent) },
      
      // 4 Módulos principales del sistema
      { path: 'empleados', loadChildren: () => import('./pages/empleados/empleados.routes').then(m => m.EMPLEADOS_ROUTES) },
      { path: 'actividades', loadChildren: () => import('./pages/actividades/actividades.routes').then(m => m.ACTIVIDADES_ROUTES) },
      { path: 'articulos', loadChildren: () => import('./pages/articulos/articulos.routes').then(m => m.ARTICULOS_ROUTES) },
      { path: 'movimientos', loadChildren: () => import('./pages/movimientos/movimientos.routes').then(m => m.MOVIMIENTOS_ROUTES) }
    ]
  }
];
