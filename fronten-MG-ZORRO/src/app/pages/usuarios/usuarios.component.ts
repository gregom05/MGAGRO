import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { UsuariosService, Usuario } from '../../services/usuarios.service';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzTableModule,
    NzButtonModule,
    NzModalModule,
    NzFormModule,
    NzInputModule,
    NzPopconfirmModule
  ],
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.less']
})
export class UsuariosComponent implements OnInit {
  usuarios: Usuario[] = [];
  isModalVisible = false;
  isEditMode = false;
  currentUsuario: Usuario & { password?: string } = this.getEmptyUsuario();
  loading = false;

  constructor(
    private usuariosService: UsuariosService,
    private message: NzMessageService
  ) {}

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  cargarUsuarios(): void {
    this.loading = true;
    console.log("g")
    this.usuariosService.obtenerUsuarios().subscribe({
      next: (data) => {
        console.log('Usuarios recibidos:', data);
        this.usuarios = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error detalle:', err);
        this.message.error('Error al cargar usuarios');
        this.loading = false;
      }
    });
  }

  showModal(usuario?: Usuario): void {
    if (usuario) {
      this.isEditMode = true;
      this.currentUsuario = { ...usuario, password: usuario.password || '' };
    } else {
      this.isEditMode = false;
      this.currentUsuario = this.getEmptyUsuario();
    }
    this.isModalVisible = true;
  }

  handleCancel(): void {
    this.isModalVisible = false;
    this.currentUsuario = this.getEmptyUsuario();
  }

  handleOk(): void {
    if (!this.validarFormulario()) return;
    this.loading = true;
    const usuarioPayload = { ...this.currentUsuario };
    if (!usuarioPayload.password) delete usuarioPayload.password;
    if (this.isEditMode && this.currentUsuario.id) {
      this.usuariosService.actualizarUsuario(this.currentUsuario.id, usuarioPayload).subscribe({
        next: () => {
          this.message.success('Usuario actualizado');
          this.cargarUsuarios();
          this.handleCancel();
        },
        error: () => {
          this.message.error('Error al actualizar usuario');
          this.loading = false;
        }
      });
    } else {
      this.usuariosService.registrarUsuario(usuarioPayload).subscribe({
        next: () => {
          this.message.success('Usuario registrado');
          this.cargarUsuarios();
          this.handleCancel();
        },
        error: () => {
          this.message.error('Error al registrar usuario');
          this.loading = false;
        }
      });
    }
  }

  eliminarUsuario(id: number): void {
    this.usuariosService.eliminarUsuario(id).subscribe({
      next: () => {
        this.message.success('Usuario eliminado');
        this.cargarUsuarios();
      },
      error: () => {
        this.message.error('Error al eliminar usuario');
      }
    });
  }

  private validarFormulario(): boolean {
    if (!this.currentUsuario.nombre) {
      this.message.error('El nombre es obligatorio');
      return false;
    }
    if (!this.currentUsuario.email) {
      this.message.error('El email es obligatorio');
      return false;
    }
    if (!this.currentUsuario.rol) {
      this.message.error('El rol es obligatorio');
      return false;
    }
    return true;
  }

  private getEmptyUsuario(): Usuario & { password?: string } {
    return {
      id: 0,
      email: '',
      password: '',
      nombre: '',
      rol: 'empleado',
      activo: true,
      createdat: '',
      updatedat: ''
    };
  }
}
