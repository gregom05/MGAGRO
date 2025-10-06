import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { CanActivateFn } from '@angular/router';

export const noEmpleadoGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  
  // Obtener usuario del localStorage
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userRol = user.rol || 'empleado';
  
  // Si es empleado, redirigir al dashboard
  if (userRol === 'empleado') {
    router.navigate(['/dashboard-empleado']);
    return false;
  }
  
  // Admin y gerente pueden acceder
  return true;
};
