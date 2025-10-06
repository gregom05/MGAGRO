import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzIconModule, NzIconService } from 'ng-zorro-antd/icon';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { FormsModule } from '@angular/forms';
import { NzMessageService } from 'ng-zorro-antd/message';
import { 
  HomeOutline, 
  SettingOutline, 
  UserOutline,
  TeamOutline,
  CalendarOutline,
  DatabaseOutline,
  InboxOutline,
  SwapOutline,
  BellOutline,
  LogoutOutline,
  CheckCircleOutline,
  DownOutline,
  KeyOutline,
  EyeOutline,
  EyeInvisibleOutline
} from '@ant-design/icons-angular/icons';
import { NotificacionesService, AlertaStock } from '../services/notificaciones.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-main-layout',
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.less'],
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterModule,
    FormsModule,
    NzLayoutModule, 
    NzMenuModule, 
    NzIconModule, 
    NzAvatarModule,
    NzButtonModule,
    NzBadgeModule,
    NzDrawerModule,
    NzListModule,
    NzAlertModule,
    NzDropDownModule,
    NzModalModule,
    NzFormModule,
    NzInputModule
  ]
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  isCollapsed = false;
  drawerVisible = false;
  alertas: AlertaStock[] = [];
  contadorAlertas = 0;
  nombreUsuario = 'Usuario';
  userRol: string = ''; // Rol del usuario para permisos
  
  // Modal de credenciales
  modalCredencialesVisible = false;
  credenciales = {
    passwordActual: '',
    passwordNueva: '',
    passwordConfirmar: ''
  };
  showPasswordActual = false;
  showPasswordNueva = false;
  showPasswordConfirmar = false;
  guardandoCredenciales = false;
  errorCredenciales = '';
  
  private subscriptions: Subscription[] = [];

  constructor(
    private router: Router, 
    private iconService: NzIconService,
    private notificacionesService: NotificacionesService,
    private message: NzMessageService
  ) {
    this.iconService.addIcon(
      HomeOutline,
      SettingOutline,
      UserOutline,
      TeamOutline,
      CalendarOutline,
      DatabaseOutline,
      InboxOutline,
      SwapOutline,
      BellOutline,
      LogoutOutline,
      CheckCircleOutline,
      DownOutline,
      KeyOutline,
      EyeOutline,
      EyeInvisibleOutline
    );
  }

  ngOnInit() {
    // Obtener nombre y rol del usuario
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    this.nombreUsuario = user.nombre || 'Usuario';
    this.userRol = user.rol || 'empleado';

    // Redirigir empleados al dashboard si intentan acceder a welcome
    if (this.userRol === 'empleado' && this.router.url === '/welcome') {
      this.router.navigate(['/dashboard-empleado']);
    }

    // Suscribirse a las alertas
    this.subscriptions.push(
      this.notificacionesService.alertas$.subscribe(alertas => {
        this.alertas = alertas;
        console.log('📊 Alertas actualizadas:', alertas.length);
      })
    );

    this.subscriptions.push(
      this.notificacionesService.contador$.subscribe(contador => {
        this.contadorAlertas = contador;
        if (contador > 0) {
          console.log('🔔 Tienes', contador, 'alertas de stock');
        }
      })
    );

    // Cargar alertas inmediatamente al iniciar
    console.log('🔄 Cargando alertas de stock...');
    this.notificacionesService.cargarAlertas();
    
    // Si es admin, mostrar resumen de alertas después de cargar
    if (user.rol === 'admin') {
      setTimeout(() => {
        const total = this.notificacionesService.getContador();
        if (total > 0) {
          console.log(`⚠️ ATENCIÓN: Hay ${total} artículo(s) con stock bajo o crítico`);
        } else {
          console.log('✅ Stock OK - No hay alertas');
        }
      }, 1000);
    }
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  abrirNotificaciones() {
    this.drawerVisible = true;
  }

  cerrarNotificaciones() {
    this.drawerVisible = false;
  }

  getAlertType(nivel: string): 'error' | 'warning' | 'info' {
    switch (nivel) {
      case 'critico':
        return 'error';
      case 'bajo':
        return 'warning';
      default:
        return 'info';
    }
  }

  irAArticulo(articuloId: number) {
    this.cerrarNotificaciones();
    this.router.navigate(['/articulos'], { queryParams: { id: articuloId } });
  }

  onLogout() {
    localStorage.clear();
    this.router.navigate(['/login']);
  }

  // Permisos según rol
  puedeVerEmpleados(): boolean {
    return this.userRol === 'admin' || this.userRol === 'gerente';
  }

  puedeGestionarArticulos(): boolean {
    return this.userRol === 'admin' || this.userRol === 'gerente';
  }

  puedeVerActividades(): boolean {
    // Todos pueden ver actividades
    return true;
  }

  puedeVerMovimientos(): boolean {
    // Todos pueden ver movimientos, pero empleados solo consultan
    return true;
  }

  // Métodos para editar credenciales
  abrirEditarCredenciales() {
    this.modalCredencialesVisible = true;
    this.errorCredenciales = '';
    this.credenciales = {
      passwordActual: '',
      passwordNueva: '',
      passwordConfirmar: ''
    };
  }

  cerrarModalCredenciales() {
    this.modalCredencialesVisible = false;
    this.errorCredenciales = '';
    this.credenciales = {
      passwordActual: '',
      passwordNueva: '',
      passwordConfirmar: ''
    };
    this.showPasswordActual = false;
    this.showPasswordNueva = false;
    this.showPasswordConfirmar = false;
  }

  async guardarCredenciales() {
    this.errorCredenciales = '';

    // Validaciones
    if (!this.credenciales.passwordActual || !this.credenciales.passwordNueva || !this.credenciales.passwordConfirmar) {
      this.errorCredenciales = 'Todos los campos son requeridos';
      return;
    }

    if (this.credenciales.passwordNueva.length < 6) {
      this.errorCredenciales = 'La nueva contraseña debe tener al menos 6 caracteres';
      return;
    }

    if (this.credenciales.passwordNueva !== this.credenciales.passwordConfirmar) {
      this.errorCredenciales = 'Las contraseñas nuevas no coinciden';
      return;
    }

    this.guardandoCredenciales = true;

    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const response = await fetch('http://localhost:3000/api/auth/cambiar-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          userId: user.id,
          passwordActual: this.credenciales.passwordActual,
          passwordNueva: this.credenciales.passwordNueva
        })
      });

      const data = await response.json();

      if (response.ok) {
        this.message.success('Contraseña actualizada correctamente');
        this.cerrarModalCredenciales();
      } else {
        this.errorCredenciales = data.error || 'Error al cambiar la contraseña';
      }
    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      this.errorCredenciales = 'Error al conectar con el servidor';
    } finally {
      this.guardandoCredenciales = false;
    }
  }
}

