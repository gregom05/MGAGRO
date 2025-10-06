import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { CanActivateFn } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  
  // Verificar si existe token en localStorage
  const token = localStorage.getItem('token');
  
  // Si no hay token, redirigir al login
  if (!token) {
    router.navigate(['/login']);
    return false;
  }
  
  // Si hay token, permitir el acceso
  return true;
};
