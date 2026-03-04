import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { CanActivateFn } from '@angular/router';

/**
 * Guard que bloquea el acceso a rutas restringidas para el rol "general".
 * El rol general solo puede acceder a: /welcome, /articulos, /movimientos.
 * Si intenta acceder a /empleados, /actividades o /usuarios, se redirige a /articulos.
 */
export const noGeneralGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);

  // Leer el rol desde localStorage (clave directa o desde objeto user)
  const rol = localStorage.getItem('rol') ||
    (() => {
      const user = localStorage.getItem('user');
      return user ? (JSON.parse(user).rol || '') : '';
    })();

  // Si es rol "general", denegar acceso y redirigir a artículos
  if (rol === 'general') {
    router.navigate(['/articulos']);
    return false;
  }

  return true;
};
