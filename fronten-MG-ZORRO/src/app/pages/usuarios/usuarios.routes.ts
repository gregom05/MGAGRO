import { Routes } from '@angular/router';
import { UsuariosComponent } from './usuarios.component';
import { authGuard } from '../../guards/auth.guard';

export const USUARIOS_ROUTES: Routes = [
  {
    path: '',
    component: UsuariosComponent,
  canActivate: [authGuard],
    data: { roles: ['admin'] }
  }
];
