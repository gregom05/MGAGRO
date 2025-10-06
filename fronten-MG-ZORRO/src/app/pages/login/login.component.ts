import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzFormModule } from 'ng-zorro-antd/form';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
// ...existing code...

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.less'],
  standalone: true,
  imports: [
    NzCardModule,
    NzInputModule,
    NzButtonModule,
    NzIconModule,
    NzFormModule,
    FormsModule,
    CommonModule
  ]
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  showPassword: boolean = false;
  isLoading: boolean = false;
  loginError: string | null = null;

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit() {
    this.isLoading = true;
    this.loginError = null;
    
    this.authService.login(this.email, this.password).subscribe({
      next: (response) => {
        console.log('✅ Inicio de sesión exitoso:', response);
        this.isLoading = false;
        
        if (response.success) {
          // El token ya se guardó en el servicio
          localStorage.setItem('userEmail', this.email);
          
          // Redirigir según el rol del usuario
          const user = JSON.parse(localStorage.getItem('user') || '{}');
          const userRol = user.rol || 'empleado';
          
          if (userRol === 'empleado') {
            this.router.navigate(['/dashboard-empleado']);
          } else {
            this.router.navigate(['/welcome']);
          }
        } else {
          this.loginError = response.message || 'Error al iniciar sesión';
        }
      },
      error: (error) => {
        console.error('❌ Error al iniciar sesión:', error);
        this.isLoading = false;
        this.loginError = error.error?.message || 'Credenciales incorrectas. Verifica tus datos.';
      }
    });
  }
}
